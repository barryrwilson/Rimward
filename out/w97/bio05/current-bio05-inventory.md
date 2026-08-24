# Wave 97 BIO-05 inventory note

**Wave:** 97. Markdown only. No `src/` in this worker.  
**Rule:** Do not re-inventory grafts as if they were absent. Wave 96 already cited live file:line. Code still wins.

**Pointer:** [`out/w96/bio05/current-bio05-inventory.md`](../w96/bio05/current-bio05-inventory.md) remains the live-code cite pack (helpers, cap, desk, persist, kill +5, HUD, Digit 5, Digit 0).

Wave 97 only re-cites the leftover that Wave 96 left owner-open: NPC `grafted` spawn. Owner close: [`docs/OwnerDecisionsWave97.md`](../../docs/OwnerDecisionsWave97.md). Merge law: [`shared-contract.md`](shared-contract.md).

---

## Live grep (2026-08-23)

NPC grafted traffic is still **absent**. Wave 97 does **not** add it.

| Surface | Result |
|---|---|
| `src/systems/npc.js` `grafted` | **0 hits** |
| `src/game/traffic.js` `grafted` | **0 hits** |
| `src/systems/traffic.js` | **file absent** (Wave 96 inventory named this path; live traffic is `src/game/traffic.js`) |
| `createShipState` | no `grafted` copy (`src/game/state.js` 167–188) |

Live integers (do not re-author):

| Constant | Value | Cite |
|---|---|---|
| `GRAFT_LIST_UU` | `4000` | `src/game/shipyard.js` 26 |
| `HOSTILE_STANDING` | `-10` | `src/game/hangar.js` 124 |
| `KILL_STANDING_DELTA` | `-5` | `src/game/kill-standing.js` 6 |
| `ABOMINATION_DESTROY_BEAUTIFUL_DELTA` | `5` | `src/game/kill-standing.js` 9 |

Player grafted mesh stays plated (`src/systems/ship.js` 535–560). Hangar cards still omit the word grafted (`src/systems/shipyard-desk.js` 397–403). HUD still does not write `hullKind`.

---

## DONE vs remaining (Wave 97)

Player graft loop stays **DONE** (Wave 96 inventory §13). Wave 97 **closes** the leftover owner questions:

| Beat | Wave 97 |
|---|---|
| NPC Abomination traffic | **CLOSED off.** Player-only world. Kill helper stays |
| Visual grafted tissue overlay | **CLOSED omit.** Keep plated. Do not replace `makeLivingHull` |
| Hangar grafted badge | **CLOSED omit** |
| Ungraft SKU | **FORBIDDEN** |
| Wave 97 `src/` BIO-05 PRs | **none**. PR3 waits on a successor owner file |
