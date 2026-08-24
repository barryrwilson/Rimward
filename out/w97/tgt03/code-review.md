# Code Review: TGT-03 remaining awareness (design-doc)

**Scope:** inventory vs live `src/`, freeze vs siblings, serial PR realism. No `src/` diff.  
**Persona:** `reviewer.md` + `orchestrator/references/code-review.md`.  
**Pass:** 2 (after unknown-weapon fail-closed).

## Code Review: docs/Tgt03AwarenessDesign.md + out/w97/tgt03/*

### Summary

The brief matches live HUD/combat: lock edge arrow is already shipped; cannon-vs-player toast is not; NAV-02 class is distinct; dart toast and FORE/AFT are correctly left in place. PR plan is serial and does not schedule `src/` in Wave 97. No Blocker/Major remain after pass-1 contract tighten.

### What's done well
- Inventory says **code wins** over wishlist “off-screen arrows” instead of designing a duplicate instrument.
- Ace omitted `target` is called out against `combat.js` 1788 (easy later bug).
- Both-cues-may-show avoids a false mutex with NAV-02.
- Digit 0/8/9, KeyT/KeyV, cone 12, Q1/Q2, empty hub are explicit non-goals.
- Sibling BIO-05 / turrets files are not required to exist.

### Findings

#### 🔴 Blocker: None (pass 2)

#### 🟠 Major: HUD toast must not inherit spawnNpcShot cannon default
**Location:** `combat.js:1300`; was missing from first contract draft  
**Issue:** Later impl that keys off “a vsPlayer bolt spawned” would toast unknown weapons.  
**Fix:** Contract §3.2 / brief §4 now fail-closed.  
**Status:** addressed

#### 🟡 Minor: Edge-arrow dock park is polish, not a new instrument
**Location:** inventory §3 vs contract §1.5  
**Issue:** Live arrow does not park on dock; NAV-02 does. Easy to over-scope PR3 into a restyle.  
**Fix:** Contract already: aria + park only; no second class.  
**Status:** documented — later PR3 discipline  
**Justification:** not a freeze hole; explicit “if live is correct, ship aria+park only.”

#### 🟡 Minor: Line numbers will drift
**Location:** inventory cites  
**Issue:** Future waves will shift `hud.js` lines.  
**Fix:** Later impl re-reads; Wave 97 inventory dated 2026-08-23.  
**Status:** accepted  
**Justification:** design-only; code-wins rule is written.

#### 💡 Suggestion: Extract `npcFireToast` in PR1
Already in contract §7–§8. Pins without jsdom are the right first PR.

### Live-cite spot checks (pass 2)

| Claim | Live | Verdict |
|---|---|---|
| `.rw-edge-arrow` node | `hud.js` 732 | OK |
| Off-glass math / behind flip | `hud.js` 1249–1305 | OK |
| `allowedLockKind` | `hud.js` 363–367 | OK |
| `.rw-nav-gate-cue` | `hud.js` 733; `hud.css` 1003 | OK |
| `Incoming dart.` | `hud.js` 61, 567–571 | OK |
| Ace cannon omit | `npc.js` 1923 | OK |
| Hunt cannon `ai.target` | `npc.js` 1547 | OK |
| `spawnNpcShot` refuse psionic | `combat.js` 1302 | OK |
| NPC missile pool 4 | `combat.js` 173 | OK |
| Digit 0 shipyard | `station.js` 186, 5920–5922 | OK |
| Digit 8/9 papers | `station.js` 1699–1702 | OK |
| `LOCK_CONE_PX` 12 | `reticle-aim.js` 15 | OK |
| KeyT / KeyV | `controls.js` 265, 280 | OK |
| `WORLD_FIELDS` no awareness key | `save.js` 76–101 | OK |
| `innerHTML` in hud.js | grep 0 | OK |
| FORE/AFT on playerHit | `hud.js` 1122–1124 | OK |
| Empty hub 44 px | `hud.js` 1184–1186 | OK |

No inventory lie found vs live code.

### Sibling freeze
- Does not require `docs/NpcTurretsDesign.md` or `docs/OwnerDecisionsWave97.md`.
- Does not edit Tgt05 / Nav / NpcMissiles / Hud02 / Bio / Shp / wishlist / PROGRESS.
- Turret sibling: if they emit cannon `npcFire` vs player, toast law applies — no SKU design here.

### PR plan realism
PR1 helper pins → PR2 toast → PR3 lock polish → PR4 a11y is ordered so dart regression is isolated and pick math is never opened. Wave 97 does not land `src/`. Realistic.

### Pass 2
No new Blocker/Major. Unknown-weapon fail-closed held in both brief and contract.
