# Wave 136 Msn04 PR1 mining identity uniqueness

**Verdict:** PR1 landed in `src/systems/station.js` mining mint helpers only. Merge law (`out/w130/jobdedup/shared-contract.md`) wins.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mtar6jm7-b5a800be`). No active workflow. Did **not** `graph_propose` / `graph_approve`.
- Live helpers rewritten: `pickMiningCommodityExcluding`, `pickMiningCommodity`, `miningSiblingCommodities`, `makeMiningJob`, `healOfferedMiningTwins`, `syncMiningJobs`. `replaceMiningJob` still splices then `makeMiningJob` (same exclusion path).
- `nextMiningId` kept. Pay formula (`miningPayBase` / `HAUL_MARGIN` / `FERRY_UNITS`) kept. `MINING_SLOTS_PER_SYSTEM` stays **2** as a cap. Unique four / `makeJobs` / Digit map / `renderJobs` paint channel untouched.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** run `npm run test:boot`. Did **not** edit `scripts/boot-test.mjs`.

## What landed

| Piece | Behavior |
|---|---|
| Identity | `commodity` at origin among live offered **or** accepted mining cards |
| Slot 0 empty | any legal hardness-1 authored key |
| Slot 1 | different legal key, or **omit** |
| Exhausted table | omit; cap 2 is max, not a forced fill |
| Bounded pick | scan `MINING_ORE_KEYS` with `n + 2` cap; never `while (true)` |
| Fail-closed mint | missing `COMMODITIES[key]` → `null` card, no throw |
| Offered twins | `syncMiningJobs` remints offered (prefer slot 1) via `replaceMiningJob` |
| Accepted twins | leave |
| Ids | monotonic `nextMiningId`; no id merge |
| Families | mining only |

## Probe idea (not executed as boot)

1. Seed two offered `rawOre` mining cards at `freehold` (slots 0 and 1). Call `syncMiningJobs`. Expect slot 1 reminted to `livingRock` (or omitted if the table cannot supply it). Slot 0 `rawOre` stays. New id is not the spliced id when `miningSeq` is already past it.
2. Empty origin mining. Call `syncMiningJobs`. Expect at most one card per commodity; typically `rawOre` + `livingRock`; never two `Mine Raw ore` rows.
3. Two **accepted** `rawOre` cards. Call `syncMiningJobs`. Expect both kept (no rewrite).

## Coupling (do not steal)

- Unique four / Digit 2 / Digit n accept by board index
- Trade / passenger / explore / hunt / spy / war
- Agent `acceptJob`, scanner filter, AST-02, NAV-10, TGT-07
- `state.js`, `save.js`, `controls.js`, `hud.js`, overlay pause
