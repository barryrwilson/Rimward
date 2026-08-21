# Security Review: Wave 79 REP-04 kill attribution (design brief)

### Risk Level: Medium

### Summary

Markdown-only freeze. No `src/` in this wave. The contract fail-closes kill writes until an owner delta exists and blocks proto keys, `reputation[userString]`, incident-faction stamps, and `innerHTML`. Second pass after brief/contract edits: HIGH (`npc.standingOf` write path) stays resolved. Remaining items are Medium/Low impl pins.

### Re-run (after brief/contract fixes)

- Added brief merge rows: never `npc.standingOf` / never `reputation[userString]`; owner integer without invented hull %.
- Added contract §2.2 pointer to `standingRead` / `canWriteRep`.
- No new HIGH/CRITICAL. Digit 9 / commLine / persist rules unchanged.

### Findings

#### 🟠 HIGH: Kill writer must not copy `npc.standingOf` indexing

**Location:** live `src/systems/npc.js` 1021–1026; contract §2.2 / §2.4; brief “Witness” / helper
**Issue:** `standingOf` does `table[fac]` with no `RESERVED_IDS` / `Object.hasOwn(FACTIONS)` / `Object.hasOwn(bag)`. A stuffed `record.faction` of `__proto__` or `constructor` is a live reader smell. Using that helper as the **write** path would be proto pollution.
**Impact:** Tampered NPC faction strings could write inherited keys or pollute `Object.prototype` if a later PR copies `standingOf` instead of `standingRead`.
**Fix:** Contract already requires `standingRead` / allowlisted assign (`data-trade.js` 62–70) and reserved drop before index. Brief merge table now says **never** `reputation[userString]` and **never** `npc.standingOf` for writes. Impl PR1 pin: helper source must call `standingRead` or the trafficking `canWriteRep` shape, not `npc.standingOf`.

**Status:** resolved in brief/contract (this pass).

#### 🟡 MEDIUM: Incident `faction` / `causer` are not a standing trust boundary

**Location:** `src/game/world.js` 1597–1612; incidents persist unsanitized (`save.js` 77)
**Issue:** `consumeIncidents` stamps `causer: 'player'` from any `'npcHit'` in 8 s and defaults missing faction to `'independent'`. Save-edited `incident.faction` can be any string. Rumors interpolate it (`contacts.js` 205–207) via `textContent` (not HTML XSS). Using that field as a reputation **key** would be save-tamper standing.
**Impact:** NPC-vs-NPC or stuffed incidents could debit an allowlisted faction.
**Fix:** Contract §0.6 / §3.2: witness is `lastAttackerOf === 'player'` only. Never `incident.faction`. Skip independent. Do not add rumor/HTML work in this serial.

**Status:** documented; no brief hole. Open for impl to pin.

#### 🟡 MEDIUM: `commLine` interpolation

**Location:** contract §4.1; `hud.js` 400–408, 924 (`textContent`)
**Issue:** `textContent` blocks HTML XSS. Control characters or huge `record.name` could still toast garbage if a later PR interpolates ship names.
**Impact:** HUD spam / confusing copy, not script injection, if `textContent` holds.
**Fix:** First-slice template uses `FACTIONS[faction].name` after `Object.hasOwn` only. Do not interpolate save titles, hail text, or raw `record.name`. No `innerHTML`. No `'reputationChanged'`.

**Status:** frozen. Open as impl pin.

#### 🟢 LOW: Greenhand `for…in` on the bag

**Location:** `src/game/world.js` 1093–1104
**Issue:** Origin beat enumerates the bag with `for…in`. Sanitize already replaces with a fresh `{}` of own keys. This serial must keep writing via own-key assign after heal.
**Impact:** Low if PR1 does not `Object.assign` save blobs.
**Fix:** Contract §1.2 / §2.4 fresh `{}`. Do not “fix” greenhand in this serial.

#### 🟢 LOW: Digit 9 lying about kills

**Location:** `station.js` 1072–1102
**Issue:** Copy that says kills move standing while `KILL_STANDING_DELTA` is null is a player-trust bug, not XSS.
**Fix:** Contract §0.15 / §4.2: no Digit 9 kill line until a real write exists.

### Passed Checks

- [x] No secrets in these markdown files
- [x] No `innerHTML` required; live `station.js` innerHTML count 0
- [x] No new persist law key (`crimeScore` / `wanted` / `world.crimes` forbidden)
- [x] Proto keys: `Object.keys`, `RESERVED_IDS`, fresh `{}`
- [x] `reputation[userString]` forbidden
- [x] `'commLine'` `textContent` path only; no new event by default
- [x] Fail closed until owner delta (no invented number)
- [x] Police / restitution desks not designed (no new debit UI)
- [x] No `src/` in Wave 79

### Recommendations

1. Impl PR1 unit-pin: stuffed `__proto__` / `constructor` / `independent` / unknown faction → bag unchanged.
2. Impl PR2 unit-pin: NPC lastAttacker / missing lastAttacker / pirate role → bag unchanged.
3. Keep Digit 9 kill sentence out of the tree until the owner constant is finite and non-zero.
