## Security Review: Wave 75 NPC missiles / incoming warning (design)

### Risk Level: Medium (design); Low after contract mitigations

### Summary

Wave 75 is markdown only. The threat model is a local browser game: XSS via toast/comm copy, prototype keys if persist were added, and combat-path lies that could become save-adjacent if a worker printed attacker names. First-pass HIGH holes (name-in-HTML, double toast + `from` display, `innerHTML`, persist NPC ammo) are closed in the contract. Remaining notes are implementation cautions.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Attacker names in toast / HTML

**Location:** `npc.js` 319–320 `say` emits `from: live.state.name`; `hud.js` 400–408, 924  
**Issue:** A warning that did `textContent = e.from` or `innerHTML` of `ship.state.name` / record name would put save- or hail-tainted strings into the HUD. Names are not allowlisted beyond hangar sanitize for player hulls; NPC `state.name` is world copy.  
**Impact:** Script in the flight HUD if any path switched to `innerHTML`; even with `textContent`, interpolating names makes authored-literal law unenforceable and can spoof comms.  
**Fix applied:** Contract §1.2 / §6 and brief §5: incoming copy is an authored constant (`Incoming dart.`). HUD must not print `from`, `state.name`, or record names. `textContent` only. No name fields on a new event payload.

#### 🟠 HIGH (resolved): Double channel interpolates hail + warn

**Location:** brief first draft allowed `commLine` **and** `toastForEvent(npcFire)`  
**Issue:** `say()` already toasts `e.text`. A second `npcFire` toast for the same spawn would duplicate. A worker who built the line as `from + ' launched a dart'` would put names in `text`.  
**Impact:** Name-in-toast; five-slot flood (`hud.js` 52, 656).  
**Fix applied:** One toast path proposed (`toastForEvent` on missile `npcFire`). `commLine` only as a Q2 **alternative**, never in parallel. Song is heard, not a second toast.

#### 🟠 HIGH (resolved): `innerHTML` of catalog / comm

**Location:** live `hud.js` 924 `textContent`; station `h()` elsewhere  
**Issue:** Wishlist-style “named inbound” copy is the same class as SHP-03 launcher XSS.  
**Impact:** Script in `#hud`.  
**Fix applied:** Contract §0.13 / §6.1. Inventory grep: no `innerHTML` in `hud.js` / `combat.js` / `npc.js` / `song.js`. Impl must keep that.

#### 🟡 MEDIUM (resolved in contract): `spawnNpcShot('missile')` as a confused deputy

**Location:** `combat.js` 1230–1250, 1665–1679  
**Issue:** Combat already maps `e.weapon` through `WEAPONS[weapon] ? weapon : 'cannon'` then `spawnProjectile`. Passing `'missile'` today would spawn a missile-family **bolt** (no seeker) and could starve the 64-pool.  
**Impact:** Not XSS; combat lie + cannon starve. A later worker “just set weapon missile” would ship it.  
**Fix applied:** Contract §4.2 forbids `spawnNpcShot` for darts. Separate NPC seeker pool. Explicit `fromPlayer` / `vsPlayer` / `lock`.

#### 🟡 MEDIUM (resolved in contract): Wave 57 lastAttacker / `testPlayerHit`

**Location:** `combat.js` 1716–1718, 1541, 1738. Header 35–36 is **stale** — not law.  
**Issue:** Missile tick always `testNpcHits`. A naive “also test the player” on every seeker would let pirate-vs-trader darts hit the player and could stamp the wrong `lastAttacker`. Citing 35–36 as “ship-aimed never `testPlayerHit`” would also skip NPC-vs-player hits.  
**Impact:** Hull damage from non-player-target shots; patrols hunt the player after NPC-on-NPC fire; or NPC darts pass through the player.  
**Fix applied (re-dispatch):** Contract §4.3 cites **1716–1718** only. Inventory marks 35–36 stale. `vsPlayer` → `testPlayerHit`; NPC-vs-NPC never `testPlayerHit`. Stamp shooter, never `'player'`.

#### 🟡 MEDIUM: Unpicked Q1/Q2 vs a worker who ships anyway

**Location:** contract §0.4, §3.2, §7  
**Issue:** Feature PR could emit missile `npcFire` before the owner picks who/channel.  
**Impact:** Glass lies (no warning) or the wrong roles fire.  
**Fix applied:** Default **no NPC missiles**. PR1 must not land while Q1 unpicked. Not HMAC; process freeze.

#### 🟢 LOW: Local save does not grow NPC ammo

**Location:** contract §4.5, brief Data Model  
**Issue:** No new persist keys. A future ammo field on records would reopen sanitize.  
**Fix applied:** Forbidden this slice. Noted for later addenda.

#### 🟢 LOW: `npcFire.ship` object identity

**Location:** live `npcFire { ship }`  
**Issue:** Payload is an object ref, not a string. HUD toast path must not walk `e.ship` for copy.  
**Fix applied:** Authored literal only; booleans/enums if a new event exists.

### Passed Checks

- [x] No secrets in design markdown
- [x] No new `localStorage` / `sessionStorage` save key
- [x] `state.js` READ-ONLY — no catalog injection via feature PR
- [x] Digit 0 / 8 / 9 untouched (no debit path)
- [x] Prototype: no new hangar keys to pollute
- [x] `textContent` law matches SHP-03 / EXP
- [x] Event payload names excluded from HTML

### Recommendations

1. Impl PR3 pin: toast node `textContent === 'Incoming dart.'` (or the authored constant), never a concatenation with `name`.
2. Impl PR2 pin: NPC dart vs NPC leaves player hull unchanged.
3. Do not add `from` to the toast key (`cls + '|' + text` is already `hud.js` 909).
