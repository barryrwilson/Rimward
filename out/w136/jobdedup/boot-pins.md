# Wave 136 Msn04 PR1 proposed boot pins

Do **not** land these in `scripts/boot-test.mjs` in this worker. Orchestrator may add them later.

Source file: `src/systems/station.js`.

## Source greps

| Pin | Assertion |
|---|---|
| `src.mining.excludeHelper` | `/function pickMiningCommodityExcluding\(usedSet\)/.test(stationSrc)` |
| `src.mining.boundedAttempts` | `/const attempts = n \+ 2/.test(stationSrc)` and `/for \(let i = 0; i < n && i < attempts; i\+\+\)/.test(stationSrc)` |
| `src.mining.noWhileTruePick` | `!/function pickMiningCommodityExcluding[\s\S]*?while\s*\(\s*true\s*\)/.test(stationSrc)` |
| `src.mining.failClosedCommodities` | `/function makeMiningJob[\s\S]*?if \(!commodity \|\| !Object\.hasOwn\(COMMODITIES, commodity\)\) return null/.test(stationSrc)` |
| `src.mining.needUntouched` | `/function makeMiningJob[\s\S]*?const need = FERRY_UNITS/.test(stationSrc)` |
| `src.mining.slotsCap` | `/const MINING_SLOTS_PER_SYSTEM = 2/.test(stationSrc)` |
| `src.mining.syncOmitBreak` | `/function syncMiningJobs[\s\S]*?if \(!job\) break/.test(stationSrc)` |
| `src.mining.healOffered` | `/function healOfferedMiningTwins/.test(stationSrc)` and `/prefer slot 1/` **or** `/ja\.slot === 1/` |
| `src.mining.nextIdKept` | `/function nextMiningId/.test(stationSrc)` and `/const id = nextMiningId\(jobs, sysId\)/.test(stationSrc)` |
| `src.mining.noInnerHTML` | `!/innerHTML\|insertAdjacentHTML\|document\.write/.test(miningRegion)` where miningRegion is from `pickMiningCommodityExcluding` through `replaceMiningJob` |
| `src.uniqueFour.untouched` | `/id: 'bounty-ace'/.test(stationSrc)` && `/id: 'patrol-lane'/.test(stationSrc)` && `/id: 'haul-provisions'/.test(stationSrc)` && `/id: 'ferry-consignment'/.test(stationSrc)` |
| `src.digit2.jobs` | `/DOCK_KEY_SERVICES/` still has `'jobs'` at index 1 (live `station.js` **188**) |
| `src.jobs.paintTextContent` | `/textContent/` on `h()` helper; no `innerHTML` in `renderJobs` mining title rewrite |

## Jobs-array probe (proposed)

Construct `ctx.world.jobs` in a harness that can call `syncMiningJobs` / `replaceMiningJob` (not this worker: station.js is a browser module).

### Probe A — offered twins heal

1. Seed unique four **or** skip them; they must still exist if the harness calls `ensureJobs`.
2. Push two live mining cards at `originSystem: 'freehold'`, both `commodity: 'rawOre'`, both `state: 'offered'`, slots `0` and `1`, distinct ids `mine-freehold-8` / `mine-freehold-9`.
3. Call `syncMiningJobs(ctx, 'freehold')`.
4. Collect live mining at freehold (`offered` or `accepted`).
5. **Pass:** the two live cards do not share `commodity`, **or** there is only one live mining card (omit). Prefer slot 0 still `rawOre` and slot 1 `livingRock` when the table has both keys.
6. **Pass:** no live card reuses a spliced id if `miningSeq` already sits past that suffix (keep `nextMiningId`).
7. **Fail:** two offered `rawOre` cards remain.

### Probe B — empty origin fill

1. `ctx.world.jobs` has no mining rows at `freehold` (unique four may remain).
2. Call `syncMiningJobs(ctx, 'freehold')`.
3. **Pass:** live mining count is `0..2` (cap, not a forced fill when the table is empty).
4. **Pass:** commodities in the live pair are unique. Typical table: `rawOre` + `livingRock`.
5. **Fail:** two cards with the same `commodity`.

### Probe C — accepted twins stay

1. Two accepted `rawOre` mining cards at freehold, slots 0 and 1.
2. Call `syncMiningJobs(ctx, 'freehold')`.
3. **Pass:** both accepted cards still present with the same ids and `commodity: 'rawOre'`.
4. **Fail:** an accepted id is spliced or rewritten.

### Probe D — replace excludes sibling

1. Live slot 0 accepted `rawOre`; slot 1 offered `livingRock`.
2. `replaceMiningJob` on the slot 1 card (complete/expire path).
3. **Pass:** replacement is not `rawOre` (omit if table size 1).
4. **Fail:** replacement `rawOre` while slot 0 `rawOre` is still live.

## Wave 136 worker greps (this pack)

Ran against live `station.js` after the PR1 edit:

- `pickMiningCommodityExcluding` present at mining helpers.
- `const attempts = n + 2` present.
- No `while (true)` in `station.js`.
- `makeMiningJob` returns `null` when `COMMODITIES` lacks the key.
- `const need = FERRY_UNITS` still inside `makeMiningJob`.
- `MINING_SLOTS_PER_SYSTEM = 2`.
- `healOfferedMiningTwins` present; `syncMiningJobs` calls it after fill.
- `makeJobs` unique-four ids unchanged.
- No `innerHTML` / `insertAdjacentHTML` / `document.write` in `station.js`.
