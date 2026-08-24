# Wave 97 TGT-03 remaining awareness inventory

**Wave:** 97. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over wishlist TGT-03 “remaining candidates” as if the lock arrow were absent, and over `docs/NpcMissilesDesign.md` Wave 75 inventory line numbers. Cites are live file:line as of this inventory.  
**Scope:** off-screen cue for the **current lock**; attacker-is-firing warning on an **existing** off-column channel.  
**Not inventory of:** radar SKU, subsystem targeting, improved lead (TGT-01), MATCH (TGT-02), incoming-missile **gauge**, NAV-02 next-gate law, KeyT/KeyV pick math, Digit 0/8/9 papers, power ledger / aim-glass pip, BIO-05, NPC turrets.

---

## 0. One-line result

The **current-lock off-screen arrow is LIVE** (`.rw-edge-arrow`, not scanner-gated). NAV-02 uses a **different** class (`.rw-nav-gate-cue`). **Attacker-is-firing for cannon is NOT live** as a toast. Missile vs player already toasts `Incoming dart.` FORE/AFT already flashes on `playerHit`. NPC psionic fire is **absent**. Do not add a glass gauge, a second lock class, or a new SKU.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/hud.js` | Edge arrow, gate cue, contacts arc, toasts, FORE/AFT, `toastForEvent` |
| `src/ui/hud.css` | `.rw-edge-arrow`, `.rw-nav-gate-cue`, toasts, contrast / colorblind / reduced-motion |
| `src/systems/nav-guidance.js` | NAV-02 readout helper; does not paint the lock arrow |
| `src/game/reticle-aim.js` | `LOCK_CONE_PX = 12`; `lockKind` wrappers |
| `src/systems/controls.js` | KeyT cycle, KeyV reticle lock, stale `lockKind` drops |
| `src/systems/combat.js` | `npcFire` consume, `vsPlayer`, NPC missile pool 4, refuse NPC psionic |
| `src/systems/npc.js` | Telegraph, `npcFire` cannon/missile, `canNpcDart` |
| `src/systems/song.js` | `npcFire` / `npcFireMissile` / `playerHit` |
| `src/core/ctx.js` | `targets.current`, event vocabulary, settings bag |
| `src/game/save.js` | `WORLD_FIELDS` (no awareness key) |
| `src/game/state.js` | `WEAPONS`, `DEFENSE.playerHitPadding` (READ-ONLY this wave) |
| `src/game/psionic.js` | Player Digit 5 only |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 outfitting papers; `h()` |
| `src/systems/settings.js` | `rimward-settings-v1` (do not add a key) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-03 remaining list (read only) |
| `docs/Hud02IdentitiesDesign.md` | Edge arrow already named as core |
| `docs/NpcMissilesDesign.md` | Q1/Q2 closed; toast+song; no glass gauge |
| `docs/Nav02GuidanceDesign.md` | Distinct `.rw-nav-gate-cue` (do not edit) |
| `docs/Tgt05LockCatsDesign.md` | `lockKind` allowlist (do not edit) |

Grep `innerHTML` in `src/systems/hud.js`: **0 hits**.  
Grep `psionic` in `src/systems/npc.js`: **0 hits**.

---

## 2. HUD-01 / HUD-02 glass (closed)

| Surface | Today | Cite |
|---|---|---|
| Empty hub | 80 px clamp `cx - 44` | `hud.js` 1184–1186 |
| No lock box | Target is rails + bracket, not a hub card | HUD-01 / HUD-02 |
| FORE / AFT | Words + fill vs hollow. `playerHit.fromAft` flashes 0.4 s | `hud.js` 323–350, 1082–1083, 1122–1124, 1343–1362 |
| Flash CSS | `@keyframes rw-facing-flash`; reduced-motion → outline, no anim | `hud.css` 293–307 |
| Lead / RANGE / MATCH | Core. Not this brief | TGT-01 / TGT-02 DONE |
| Contacts arc | Scanner-gated thin bottom arc `.rw-contacts` | `hud.js` 52–56, 787–798, 1365–1372 |
| Chart marks | `.rw-chartmark`; edge-clamp; hide docked | `hud.js` 1519–1558 |
| HUD family | Reads `hullKind`; **never writes** it | `hud.js` 76–85 |

`playerHit` is **not** a toast case (`toastForEvent` has no `'playerHit'` branch). Hit feedback is FORE/AFT + song thud.

---

## 3. Current-lock off-screen cue — LIVE

| Surface | Today | Cite |
|---|---|---|
| Node | `el('div', 'rw-edge-arrow is-hidden', root)` | `hud.js` 732 |
| CSS | Amber CSS triangle `::before`; `var(--amber)` | `hud.css` 575–594 |
| Who | Current `ctx.targets.current` when `lockOk` | `hud.js` 1197–1203 |
| `lockOk` | Ship (`!lockKind` + state/object) **or** rock list row **or** `allowedLockKind` | `hud.js` 363–367, 1198–1203 |
| Kinds | `station` / `gate` / `pod` / `landmark` | `hud.js` 363–367; `reticle-aim.js` 279–310 |
| Rock | Asteroid **list membership**; untagged `{position}` is not a rock | `hud.js` 385–392 |
| Position | `target.object.position` else `target.position` | `hud.js` 1203 |
| Behind camera | `proj.z > 1` flips NDC | `hud.js` 1249–1250 |
| Off-glass | Hide bracket + lead; show arrow; `EDGE_MARGIN = 84` | `hud.js` 64, 1290–1305 |
| On-glass | Show bracket; **hide** arrow | `hud.js` 1253–1255 |
| Fail-closed | No pos / destroyed → hide arrow | `hud.js` 1222–1226 |
| Scanner | **Not gated.** Comment: core ships keep DIST / edge / lead / MATCH | `hud.js` 1365–1366 |
| Docked | Contacts + chart marks hide. **Edge arrow does not park** on dock/jump | `hud.js` 1369, 1530, 1563 vs 1197–1306 |
| Aria | Gate cue `aria-hidden`. Edge arrow **no** aria | `hud.js` 732–734 |
| Keyframes | **None** on `.rw-edge-arrow` (transform only) | `hud.css` 575–594 |
| Colorblind | `--amber` → `--rw-warn` → Okabe-Ito `#E69F00` | `hud.css` 23, 1134–1138, 592 |
| Contrast | Toast/panel overrides exist; edge arrow uses `--amber` | `hud.css` 1143–1164 |

Wishlist TGT-03 still lists “off-screen target arrows” as remaining. **Code wins:** the **current lock** already has an edge arrow. This is **not** a radar of every nearby ship (that is the scanner arc).

---

## 4. NAV-02 gate cue — LIVE, must not be stolen

| Surface | Today | Cite |
|---|---|---|
| Class | `.rw-nav-gate-cue` + ticks + notch | `hud.css` 1001–1037; `hud.js` 733–737 |
| When | Plotted next-gate pos, not docked, not jumping, **off-glass** | `hud.js` 1561–1624 |
| Math | Same NDC flip + `EDGE_MARGIN` as lock arrow | `hud.js` 1595–1622 |
| Shape | Two parallel ticks + notch (not an amber triangle) | `hud.css` 1001–1037 |
| Park | `navPark = docked \|\| jumping` | `hud.js` 1563 |

Both cues **may** show at once (routed gate off-screen **and** a lock off-screen). They already use **different** classes. Do **not** reuse `.rw-nav-gate-cue` for lock. Do **not** reuse `.rw-edge-arrow` for the gate.

---

## 5. TGT-05 lock (read only; do not rewrite pick math)

| Surface | Today | Cite |
|---|---|---|
| Cone | `LOCK_CONE_PX = 12` | `reticle-aim.js` 15, 321 |
| KeyV | `pendingReticleLock`; miss `Nothing under the reticle.` | `controls.js` 182, 194–216, 280–281 |
| KeyT | Cycle ships; rocks only in weapon group 3 | `controls.js` 55–83, 265–266, 393 |
| Allowlist | `station` `gate` `pod` `landmark` | `controls.js` 90–94; `reticle-aim.js` 279–310 |
| Wrappers | Do not stamp `ctx.station`; pod points at `ctx.pods[]` | `reticle-aim.js` 283–310 |
| Stale drop | Kind + rock list | `controls.js` 104–180 |

This brief **reads** `targets.current`. It does **not** change pick spheres, cone, or keys.

---

## 6. Attacker fire path — cannon toast MISSING

| Surface | Today | Cite |
|---|---|---|
| Emit | `'npcFire' { ship, weapon, target }` | `npc.js` 43–45, 1543–1548, 1919–1924; `ctx.js` 244 |
| Hunt cannon | `{ weapon: 'cannon', target: ai.target }` (`'player'` or a live ship) | `npc.js` 1547 |
| Ace cannon | `{ weapon: 'cannon' }` — **target omitted** | `npc.js` 1923 |
| Dart | `{ weapon: 'missile', target: 'player' }` after telegraph, pirate/ace, once | `npc.js` 1093–1099, 1543–1545, 1919–1921 |
| Combat dart | `e.target !== 'player'` → drop (never default player) | `combat.js` 1779–1785 |
| Combat bolt | `tgt === 'player' \|\| tgt == null` → `vsPlayer = true` | `combat.js` 1787–1794 |
| NPC vs NPC | Live ship target → `vsPlayer = false` | `combat.js` 1792–1794 |
| NPC psionic | `spawnNpcShot` **returns** if psionic | `combat.js` 35–36, 1302 |
| Pool | NPC seekers **4**; player pool 8 | `combat.js` 173, 581–582 |
| Telegraph | ≥3 s, glow, `commLine` (`Heave to.` / ace lines) **before** fire | `npc.js` 88, 1526–1537, 1909–1913 |
| Interval | `1 / (WEAPONS.cannon.rof * 0.5)` → **~0.33 s** (`rof` 6) | `npc.js` 89; `state.js` 118 |
| Toast dart | `npcFire` + `weapon === 'missile'` + `target === 'player'` → `Incoming dart.` | `hud.js` 61–62, 567–571 |
| Dart gap | 2.5 s | `hud.js` 62, 569 |
| Toast cannon | **null** (same `npcFire` case returns if not missile+player) | `hud.js` 567–568 |
| Song | `npcFire` bark; missile → `npcFireMissile` | `song.js` 68–69, 423 |
| Contacts hostile | `ai.intent` chevron on scanner arc (not “firing”) | `hud.js` 1402, 1483 |

`Incoming dart.` is **shipped**. A cannon (or later psionic) “they are shooting you” toast is **not**. FORE/AFT is **hit**, not muzzle.

---

## 7. Off-column channels (reuse)

| Channel | Role | Cite |
|---|---|---|
| `.rw-toasts` | Top-right, off aim column. `role="status"` `aria-live="polite"`. 5 slots. `textContent` | `hud.js` 758–765, 1085–1104; `hud.css` 634–737 |
| `pushToast` | Dedupe `cls\|text` while visible; overwrite soonest | `hud.js` 1085–1104 |
| `commLine` | Toast class `comm`; prints `text`, not `from` | `hud.js` 481–489 |
| Banner / jump | Off column / center jump bar | `hud.js` 769–780 |
| FORE/AFT | **On rails**, not off-column. Do not duplicate firing here | `hud.js` 323–350 |

Prefer **toast** for attacker-is-firing (same channel as `Incoming dart.`). Do **not** add a hub pip. Do **not** flash FORE/AFT on `npcFire` (that would lie: not a hit).

---

## 8. Digits, persist, DOM law

| Surface | Today | Cite |
|---|---|---|
| Digit 0 dock | Shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 186, 5918–5922 |
| Digit 8/9 dock | Launch / Standing at level-1 | `station.js` 1622–1623 |
| Digit 8/9 outfit | Player launcher / turret papers | `station.js` 1699–1702 |
| Weapon 1–5 | Groups in `controls.js` / `combat.js` | not this brief |
| `WORLD_FIELDS` | No lock/awareness key. Has `scanner`, `nav` | `save.js` 76–101 |
| Settings store | `rimward-settings-v1` only | `settings.js` 7, 23 |
| `el()` / `h()` | `textContent` | `hud.js` 239–245; `station.js` 4302–4308 |
| `innerHTML` | Forbidden; **0** in `hud.js` | grep |
| `state.js` | `WEAPONS` / `U` / `DEFENSE` — **READ-ONLY this wave** | orchestrator law |

---

## 9. Pain points (honest)

1. Wishlist TGT-03 still names “off-screen target arrows.” A naive later PR that **adds** a second arrow (or steals `.rw-nav-gate-cue`) would double-paint the lock.
2. `.rw-edge-arrow` does **not** hide while docked/jumping; NAV-02 does. Station overlay usually covers it, but the node can still transform.
3. Edge arrow has **no** `aria-hidden` (gate cue does). It is decorative; lock name lives on the bracket/rail when on-glass.
4. Color is paired with **triangle shape** + rotation. Colorblind remaps `--amber`. No word on the glyph (HUD-02 already accepted this core instrument).
5. Cannon `npcFire` vs the player is silent on the toast channel. The player learns the shot from bolt vis, song bark, then FORE/AFT **if** it hits.
6. Ace cannon omits `target`. Combat treats that as vs player. A toast that required `target === 'player'` would **miss aces**.
7. Hunt cannon at a **trader** must **not** toast the player.
8. `npcFire` at ~3 Hz would flood 5 toast slots without a gap.
9. NPC psionic is refused in `spawnNpcShot`. Inventing NPC Digit-5 fire here would fight BIO-04 / combat.
10. Incoming-missile **gauge** on the 80 px glass is **closed**. Dart warning stays the toast.

---

## 10. What this brief may still freeze (later serial)

**Lock cue:** reuse `.rw-edge-arrow`. Do not add a class. Do not steal NAV-02. Optional polish: park docked/jumping; `aria-hidden="true"`. Fail-closed already.

**Attacker warning:** extend `toastForEvent` `'npcFire'` so cannon-vs-player (including omitted ace target) toasts a **different** static line from `Incoming dart.` Throttle. No new event type. No glass widget. No `state.js` write. No new SKU.

---

## 11. Explicitly out

Radar scope / new TGT-03 upgrade SKU. Subsystem targeting. Improved lead. MATCH. Missile gauge. NAV-02 redesign. KeyT/KeyV steal. Digit 0/8/9. Power ledger / aim-glass pip. BIO-05. NPC turrets (sibling). Q1/Q2 missile reopen. WAVE4 fence / WAVE26 ferry / WAVE35 haul boot FAILs.
