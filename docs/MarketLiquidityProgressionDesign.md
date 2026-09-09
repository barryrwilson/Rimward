# TRADE-002 — Market liquidity and trader progression

Issue: [#55](https://github.com/barryrwilson/Rimward/issues/55). Status: owner approved on 2026-09-09; implementation in progress. The owner replied “Approved” to the stock rules and 10–20-minute experienced-run target presented with this document. This approval includes the scoped `world.marketSupply` persistence contract below. It authorizes implementation and verification; deployment remains a separate gate.

**Approved choice:** preserve corrected prices and introduce replenishing station sale stock: 160 units per bulk commodity, 20 per other market commodity, and 20 simulation minutes to refill from empty. The measured trader bought a freighter in 13m58.4s, but could initially finance only 16/160 cargo slots. A later full load required recovery after a fatal encounter. The proposal protects early margins and aims to make repeated large purchases encourage different routes or goods; the evidence does not establish that the corrected economy needs a general reduction in profits.

## Mission and evidence boundary

Measure ordinary trading after the same-station spread fix, then choose the smallest change that makes route choice and freighter progression worthwhile. Source and benchmark base: `197935b1f53d50e04ef6d2d916473457ea559946` (current master on 2026-09-09). Dependency [#53](https://github.com/barryrwilson/Rimward/issues/53) is closed and its corrected quote calculation is present in this tree.

The specification lead owns the approved contract; a separate benchmark worker owns live public-API evidence. Next gate: implementation on `codex/issue-55-economy-design`, focused tests, live verification and independent review of the exact implementation commit. The design-stage artifact is `df54c97698f1f6a05f4f4734cb5f5727a1d01589`.

The September 6 million-UU run used the old inverted same-dock spread. Its earnings and time are excluded from the corrected pacing baseline. The September 7 trader report is useful context but is a different origin and an earlier exploratory campaign.

## Pre-implementation behavior confirmed in code

- `src/systems/station.js`, `tradeBuyUnit`, `tradeSellUnitRaw`, and `tradeFillUnit`: apply the existing faction, reputation, epic, keeper, and fixer modifiers; round unit quotes; cap the sell quote at the same dock's buy quote. An unchanged same-dock round trip cannot increase cash.
- `tryTrade`: validates commodity access, funds and cargo; charges or pays quantity multiplied by the unit quote; requests an ordinary autosave. It does not consume station stock, reduce demand, charge a separate fee, or change a market price. Available cash and hold space bound purchases; held cargo bounds sales.
- `src/game/market.js`: each system has a baseline and a price table. Only the current system walks and responds to transient event pressure, within a 40% band around its own baseline. Away-system prices freeze. Rounded prices persist; fractional drift and event pressure do not.
- `src/game/shipyard.js`: the freighter list price is 24,000 UU, with existing standing discounts and no positive-reputation requirement. Its base cargo capacity is 160 versus the starter light hull's 20. Buying capacity does not provide working capital.
- The public agent order limit remains 99. Human and agent trades use the same station transaction path. [#56](https://github.com/barryrwilson/Rimward/issues/56) separately owns bulk-entry controls.

## Design exclusions

No ship-price, cargo-capacity, equipment, key-binding, mission-pay, combat, or travel tuning. The completed design stage changed no gameplay source or saved market data. The subsequent owner approval covers the finite supply rules and persistence contract below; it does not add fees or demand pricing. Do not fund a benchmark using missions, salvage, gifts, debug grants, teleportation, or accelerated simulation and then describe it as ordinary market profit.

## Measurement and decision

The fresh Rim Drifter reached 31,962 UU after eight completed sale legs, then actually bought the freighter for 24,000 UU and mounted it. Purchase occurred at **838.403 simulation seconds (13m58.4s)** and **14m08.2s wall time** after origin selection, leaving **7,962 UU**. From the first ordinary purchase, acquisition took 713.042 simulation seconds (11m53.0s) and 11m57.8s wall time. The eight-leg affordability threshold was earlier, at 777.711 simulation seconds; the additional 60.692 seconds to purchase include yard inspection and tool latency.

This is one knowledgeable, automated campaign, with favorable market prices and an interrupted docking approach. It is neither a novice estimate nor an across-seed balance result. The post-purchase freight measurement and reconciled route table follow below. Failed or interrupted portions remain part of the evidence.

### Measured starter progression

Amounts are UU. `Travel` is accepted undock to first observed docked state, in simulation seconds; sampled arrival times are upper bounds. Trading and analyst time between legs remain in the full origin timer above.

| Leg / route | Cargo bought and sold | Purchase cost | Sale revenue | Trade profit | Cash after sale | Travel |
|---|---|---:|---:|---:|---:|---:|
| 1 Redmarch → Veridian | 1 Chrome salt + 1 Provisions | 561 | 694 | 133 | 733 | 67.3 s |
| 2 Veridian → Freehold | 4 Refined metals | 720 | 1,056 | 336 | 1,069 | 53.1 s |
| 3 Freehold → Veridian | 3 Living rock | 1,011 | 2,340 | 1,329 | 2,398 | 65.0 s |
| 4 Veridian → Freehold | 1 Wakeglass + 6 Refined metals | 2,315 | 3,603 | 1,288 | 3,686 | 51.6 s |
| 5 Freehold → Veridian | 11 Living rock + 1 Provisions | 3,686 | 8,737 | 5,051 | 8,737 | 226.5 s |
| 6 Veridian → Freehold | 7 Wakeglass + 1 Raw ore | 8,729 | 14,364 | 5,635 | 14,372 | 52.0 s |
| 7 Freehold → Veridian | 20 Living rock | 10,360 | 15,600 | 5,240 | 19,612 | 54.1 s |
| 8 Veridian → Freehold | 15 Wakeglass + 5 Refined metals | 19,425 | 31,775 | 12,350 | 31,962 | 52.0 s |

Reconciliation before ship purchase: **600 starting cash + 31,362 realized trade profit = 31,962 UU**. No missions, salvage, mining, gifts, tribute or repairs funded this stage. First full starter hold: leg 7, after accumulating 14,372 UU. Earlier holds were limited by capital. The policy reinvested nearly all cash and sometimes left none; it is a high-exposure benchmark policy, not advice for a cautious new player.

The favorable Living rock purchases on legs 3 and 5 were 337 and 326 UU per unit, compared with Freehold's authored 540 baseline. By leg 7 the buy quote was 518, so the earlier discount did not persist. The exact event trigger was not captured: market-event pressure is a plausible source-based explanation, not a verified causal attribution. These observed price changes are part of the run, not evidence of trade-driven depletion; the current trade path does not move prices.

Starter hull stayed at 100. Impacts reduced defenses; leg 5's approach failed with `impact`, then analyst delay allowed additional drift before an ordinary re-approach recovered the ship. Its entire 226.5-second segment is retained. This navigation observation is parked outside the liquidity write set. The same run is not repeated eight times: these are eight consecutive cargo legs in one campaign.

### Measured freighter progression and risk

| Shipment | Load | Purchase cost | Sale revenue | Trade profit | Other cash cost | Cash after sale | Observed travel |
|---|---|---:|---:|---:|---:|---:|---|
| Freehold → Veridian | 14 Living rock + 2 Slag iron; 16/160 slots | 7,932 | 11,410 | 3,478 | 30 tribute | 11,410 | 128.9 simulation / 129.0 wall seconds |
| Veridian → Freehold | 9 Wakeglass + 3 Raw ore; 12/160 slots | 11,406 | 18,735 | 7,329 | 0 | 18,739 | 129.5 simulation / 129.7 wall seconds |
| Freehold → Veridian, with death and retry | 160 Provisions; deliberately affordable full-hold test | 16,000 | 21,600 | 5,600 | 0; automatic save recovery | 24,339 | 315.3 wall seconds across the failed attempt and retry; not comparable to an uninterrupted leg |

The first freighter buy left just 30 UU unspent and occupied fewer slots than the final starter loads. Its measured cruise was approximately 60 u/s, compared with 120 for the starter. The first two freighter trips took roughly 129 seconds apiece versus about 52–65 seconds for most core starter trips. They differ in cargo, encounters and docking conditions, so these are observed comparisons, not a controlled hull-speed experiment.

The full 160-unit purchase used ordinary 99+61 orders at 100 UU, debiting 9,900 and 6,100 UU and leaving 2,739 cash. A 3,200 UU pirate demand was refused as unaffordable; combat followed, and the ship died. The game's existing 2.5-second automatic recovery restored the recent autosave with the purchased cargo and cash, without a recovery charge. No extra buy, resource grant, or manual save edit funded the retry. The same cargo was then delivered and sold once at 135 UU per unit, again in 99+61 orders. The first failed attempt is not treated as a successful earning leg. `world.time` rewound on restore, so subtracting its start and finish would undercount the full attempt; wall time and separate recovery epochs are the authoritative timing evidence here.

The failed attempt lasted 42.325 simulation / 42.327 wall seconds; the resumed attempt lasted 106.761 simulation / 106.891 wall seconds. The longer combined 315.315-second wall span includes automatic restoration and analyst investigation. Hostile energy hits preceded death, but the fatal cause was not conclusively identified in the public event evidence.

The first tribute illustrates an additional risk-estimation limit: the card displayed 2,285 UU, but only 30 was debited because current `hail.js` clamps `credits - demand` at zero and closes the encounter as paid. The ledger uses the observed 30 cash cost. After observing this, the pilot avoided relying on further unaffordable tribute payments. This existing hail policy is outside #55 and prevents treating the displayed demand as an incurred expense or the run as a reliable estimate of future encounter cost.

A usage-service interruption between the first and second freight trips left the loaded ship docked for approximately 236 simulation seconds. It remains in the campaign's total elapsed time and is excluded from the undock-to-arrival trip measurements above. The death/retry and this interruption make post-purchase total time unsuitable as a clean pacing target.

Final cash reconciles: **600 + 31,362 starter trade profit + 3,478 + 7,329 + 5,600 freight trade profit − 24,000 freighter purchase − 30 tribute = 24,339 UU**. No repair was bought. Final hull was 205.392/220. A final observed repair-all quote was **63 UU**, including hull and defenses; paying that snapshot quote would leave 24,276 UU. Thus the table reports realized cash results, not earnings net of every outstanding damage cost. The retained freighter and original stored hull are assets, not additional sale income.

An ordinary browser stop/restart and title-screen Continue preserved 24,339 cash, empty cargo, the 160-unit capacity, and hull condition. It restored near the station in flight, not into the docked UI. No save contents were read or edited. Original and restarted browser console logs contained zero errors. All benchmark-owned browser, bridge, controller and loopback Vite processes were stopped.

### Repeatable live protocol

Use a fresh browser profile against the pinned source, enable the public agent API, start a new Rim Drifter (600 UU, 20-unit hold), and reach the Redmarch station through ordinary controls. Keep the entire ledger from origin selection; no imported save, debug grants, position writes, or accelerated simulation.

Inspect executable `fillBuy`/`fillSell` quotes at each dock, buy only legal ordinary commodities within available cash and hold, fly through the normal gate and docking paths, and sell at the destination. The initial route is Redmarch to Veridian, then alternate Veridian and Freehold. Route guidance uses known authored system baselines and is disclosed as analyst knowledge; remote prices are not live quotes. Reinspect the local market before every order. Record the selection policy, rather than claiming optimal trading from a small sample.

Record every quote, order, receipt, before/after cash and cargo, origin/destination, game time, wall timestamp, hull/shield state, hail, impact, recovery, repair, and other expense. Reconcile each completed cargo lot's sale revenue against its purchase cost. Never count mission payments or the value of an unsold hold as realized market profit. Record rejected orders and failures as well as successes.

Stop starter accumulation only after liquidation leaves enough cash for the actual local freighter quote. Buy and mount through the ordinary yard, record the debit and remaining capital, then measure an earned freighter route if feasible. State whether the hold is full: ownership of a 160-unit hold is not evidence of a 160-unit trade. A save/reload check must use the game's ordinary save path.

Report origin-to-purchase, first-buy-to-purchase, and travel-segment time separately. Automated entry, analyst decisions, stationary delays, failures, and game pauses make wall time and simulation time different measures. Repeat the same protocol in independent fresh profiles before treating a target as a robust balance result. A single successful campaign establishes feasibility, not a median, a best possible route, or novice pacing.

## Alternatives to evaluate against the measurement

| Option | What it changes for the player | Tradeoff |
|---|---|---|
| Retain corrected unlimited markets | Route selection, travel, risk, hold space, and capital remain the constraints | Smallest change; only credible if measured progression and repeated high-volume earnings are acceptable |
| Finite station sale stock with replenishment | Repeated purchasing exhausts a local commodity; traders rotate goods or destinations | Preserves flat unit quotes. Does not itself limit the price paid for cargo the player brings in or guarantee acceptable first-trip freighter profit |
| Demand depth and marginal price impact | Large purchases get dearer and large sales earn less as favorable prices are consumed | Directly addresses large-load returns; requires quantity-aware quotes, careful rounding, persistence, and integration with the price walk |
| Wider spread or fees | Every trade loses some margin | Does not create liquidity. A fixed per-order fee penalizes existing small-lot controls and the agent's required 99+61 split; a percentage fee also slows low-capital starters |

These are alternatives, not a bundle. A stock proposal must not acquire demand caps or fees as incidental details. The possibility of buying legal exotic ores belongs in the measured opportunity set; their absence from ordinary NPC cargo generation does not prevent player purchases.

## Approved decision: replenishing station sale stock

**Approved:** introduce finite sale stock, keep the corrected flat quote calculation, and preserve ordinary station acceptance of player sales. The purpose is to make repeated large purchases lead to different cargo or routes, while retaining affordable starter trading. This is a supply-liquidity change, not a claim to simulate station demand or eliminate profitable market events.

The corrected run already demonstrates rapid growth without the old exploit. There is not yet evidence to justify stacking fees or broad price cuts on top of it. Depth pricing would be the appropriate alternative if the owner instead wants a hard reduction in large-load margins; it should replace this recommendation as the chosen approach, not arrive as an unreviewed addition.

### Approved numerical contract

| Parameter | Proposed first implementation | Reason / limit |
|---|---|---|
| Sale-stock capacity for existing bulk goods | 160 units each: Provisions, Refined metals, Raw ore, Living rock | One full base freighter load is possible at a rested market; starter lots fit comfortably |
| Sale-stock capacity for other ordinary market goods | 20 units each: the seven exotic ores and Restricted components | Preserve one full starter load while making larger exotic purchases require time or multiple markets; existing restricted-goods access rules still apply |
| Replenishment | Capacity / 1,200 units per simulated second; full recovery from empty in 20 simulation minutes | Bulk goods recover 8 units/minute and other goods 1 unit/minute; repeated freighter loading consumes stock faster than it recovers |
| Clock | Saved game time, with lazy catch-up while away; no offline wall-time refill | Departing a depleted market lets it recover; pausing or changing the computer clock provides no stock |
| Player buys | Subtract exactly filled units; refuse an excessive quantity atomically and show available units | No hidden partial fill or departure from current all-or-nothing validation |
| Player sells | Accept under current legality/hold rules at the current quote; add units to sale stock, capped at capacity | Preserve mining and cargo liquidation; excess sales leave the retail stock capped and are still paid in full |
| Prices and fees | Existing quote modifiers and unchanged-market spread protection; no additional fee or price impact | Keep the supply intervention separately measurable |

Stocks start full on a genuinely new game or a market with no prior supply record. An unvisited system starts full on first use. Replenishment saturates at capacity; unused time at full stock cannot be banked to refill instantly after a purchase. Fractional stock is retained internally, but only whole available units are shown and filled. At unchanged time, splitting an order cannot alter the total stock consumed or the flat-price total.

A **counterfactual arithmetic replay**, not a live test of new code, applied these capacities and refill rates to the 24 automatically ledgered trades before the actual freighter purchase. None would have been refused for stock. The first two manually submitted Redmarch purchases were one unit each, also within fresh stock; their later destination sales are in the replay. This holds the realized prices, route, and timestamps fixed and cannot establish how another campaign or a player's changed choices would behave. Local reproducible inputs: `C:/Projects/WebSim/out/issue-55-evidence/starter-stock-replay.json`.

**Approved persistence footprint:** add `world.marketSupply` to the existing save envelope and allowlist, shaped as `{ [systemId]: { [commodityKey]: { units, updatedAt } } }`. `units` is finite in `[0, capacity]`; `updatedAt` is finite saved game time, bounded to the restored world time. Keep `world.markets` as the existing numeric price tables. Ignore unknown systems/commodities and unsafe object keys. Missing legacy rows initialize once at full capacity; malformed present rows normalize deterministically to zero stock at current game time, rather than granting a refill. If the present envelope itself has an invalid type, normalize known market rows to zero at restored time; an absent legacy envelope instead initializes full. Clamp negative elapsed time to zero and catch-up to the interval needed to fill the stock. Cover whole-envelope and row normalization in the implementation tests.

Read-only market observations calculate effective stock from a snapshot without granting or reserving it. The transaction recomputes the same effective value at execution, validates the entire order, and commits credits, cargo, supply and its timestamp before requesting the existing autosave. Ordinary time-dependent price changes remain possible; unchanged-state quote/fill equality is exact. #56 must include stock in buy-max and partial-affordability previews when it lands, but its quantity-entry UI is a separate outcome.

### Approved progression targets

These are approved product targets for this experienced, public-API-assisted route protocol, **not measured novice session lengths or guarantees for every random campaign**:

- Keep a fresh Rim Drifter capable of buying an affordable legal first load immediately upon docking, and earning positive net trade profit on the first completed route. No new stock refusal should occur for the fresh run's first small purchase.
- Aim for a first earned freighter in **10–20 minutes of simulation time** on the specified core-route benchmark with knowledgeable, prompt piloting. Report the full origin timer, including ordinary failures; also report travel-only and analyst idle time so the comparison is interpretable. Three independent fresh runs should establish the median and range before calling this target validated.
- Preserve the progression from cash-limited small loads to a full 20-unit starter hold. Before implementation, replay the recorded purchase sequence against the proposed stocks and clock; a stock-caused delay of more than one additional circuit before freighter affordability requires revisiting the proposal.
- A rested bulk market supports one 160-unit purchase if the player can finance and carry it. An exhausted bulk row has exactly 80 units after ten simulation minutes and 160 after twenty; an exhausted exotic/restricted row has 10 and 20 respectively. Repeated same-route bulk purchasing therefore requires waiting, different goods, or another source market.
- Treat the ship purchase and usable working capital as separate milestones. Report cash left after buying the hull, the first full 160-unit load actually financed, its realized profit, and its measured travel time. A partially filled freighter is not a failed purchase or proof that a larger ship is immediately more profitable.

This proposal deliberately permits an exceptional first large cargo profit and unlimited sale acceptance. It limits repeated sourcing, not first-trip profit or demand. If the desired outcome is instead that no freighter trip may repay the hull price, choose the depth-pricing alternative and specify that different target before any implementation. Do not use ship-price changes to make this stock proposal appear to meet an unchosen target.

## Required contract for any approved implementation

1. Name the covered commodities and exact depletion, bounds, and replenishment rules. For finite stock, state what a player sale does to stock and what happens when stock is full. For depth, state the marginal price schedule and the integer total calculation. Avoid a vague promise to make markets realistic.
2. Preserve the corrected same-dock no-profit invariant, including buy/sell and sell/buy reversals, quantity boundaries, and all existing price modifiers. A mutable market requires checking the entire round trip, not merely comparing two pre-trade unit quotes.
3. Quote and fill share one authoritative calculation. UI and public observations explain executable quantity, total, availability, and refusal reasons. At unchanged state the quote equals the exact cash/cargo change. Refresh displayed stock and validate current availability at execution; an observed quote does not reserve stock or freeze ordinary time-driven prices. A future depth-pricing choice must explicitly define quote expiry and any expected-total check before implementation.
4. For unchanged time and modifiers, 99+61, repeated five-unit orders, and 160 sequential one-unit reference fills end with identical totals and liquidity. Existing restricted-component sales can advance fixer trust per transaction; document that existing side effect separately rather than claiming unrestricted partition equivalence or changing trust incidentally.
5. Preserve the public 1–99 order limit, commodity access, affordability, and hold checks. Unless explicitly approved otherwise, invalid or excessive orders fail atomically without changing cash, cargo, or liquidity. The separate bulk UI issue consumes this same contract.
6. If new market state is approved, save only after the cash/cargo/liquidity transaction completes. Reload, redock, and system switching cannot reset depletion or price impact. Specify bounded validation and deterministic legacy defaults; all persisted records remain JSON-safe.
7. Explicitly decide the replenishment clock: current-system simulation time, elapsed saved game time while away, or something else. No wall-clock offline refill is presumed. Away-system replenishment would be a deliberate difference from today's frozen away-system prices. Define pauses, reload, and elapsed-time clamps.
8. Do not implement trade impact by changing only the rounded price table: the market's fractional deviation state can overwrite that change on the next tick. Specify how event pressure, baseline drift, and any durable impact combine.
9. Rerun the same ordinary-route benchmark, with a separate outcome ledger for deaths/recoveries, costs, capital left after upgrades, and any timed-out route. Report completed freighter acquisition separately from projected acquisition; measure the slower freighter's actual travel time instead of assuming the eightfold hold increase yields eightfold earnings per minute.
10. Verification includes focused economic contract tests, the issue-53 spread regression, `npm run build`, `npm run test:boot`, live human and public-API trading, and console checks. Include 1/5/99/chunked-160 orders, affordability/hold limits, prohibited goods, relevant modifiers, same-dock reversals, depletion/recovery, and save/away-system cases. Preserve existing assertions.

The owner approved the bounded implementation scope, tuning and saved fields above on 2026-09-09. No deployment is authorized by this proposal. Any later release should retain a pre-change save fixture and prior build, and verify that the chosen save migration has a documented rollback boundary before deployment.

## Implementation handoff after the owner decision

Expected bounded write set: tuning in `src/game/state.js`; supply calculation alongside `src/game/market.js`; validation, commits and availability in `src/systems/station.js`; public stock observations in `src/game/agent-observe.js`; save normalization in `src/game/save.js`; focused economy tests and the relevant backlog row. Keep the current numeric price-table shape and initialization order. No new command or event is required for the recommended option. All market/content labels continue through text-safe DOM APIs; the bridge remains loopback-only with its existing action validation.

Reconcile overlap with #56 before it adds buy-max previews. Record the approved stock/rate/clock/schema choice in this brief, implement on its bounded branch, and hand an exact commit with tests and live evidence to independent QA. This document records the owner decision and implementation contract; it does not yet claim implementation QA PASS or issue completion.

## Verification and retained evidence

The unchanged source baseline passed `npm run build`, `npm run test:boot`, and `node --import ./scripts/with-css-stub.mjs scripts/issue-53-market-spread-test.mjs`. Build used the already-approved issue-62 exact-artifact bundle exception and emitted its existing large-chunk warning. No bundle exception, source assertion, or game behavior was changed for this proposal.

A separate Codex benchmark worker operated the live public API and retained receipts and browser captures; the specification lead reconciled the tables and ran the proposed-stock arithmetic replay. Claude completed an independent **public-source-only preflight**, which informed the quote, persistence and timing boundaries. That preflight did not review the unpublished campaign or approve these proposed numbers, and is not a final implementation QA verdict.

Raw evidence remains local, outside the committed write set, under `C:/Projects/WebSim/out/issue-55-evidence/`: `harness/sessions/trader55/api.jsonl`, `market-ledger.jsonl`, `full-load-ledger.jsonl`, `benchmark-results.json`, `benchmark-summary.md`, `benchmark-summary.json`, `benchmark-method.md`, `starter-stock-replay.json`, bounded pilot logs, console logs and captures. `persistence-resumed.json` and `benchmark-cleanup.json` record restart and teardown; `verification.md` records source checks; `review/public-preflight-completion.json` records the source-only preflight and corrected limitations. The reproducible route protocol and reconciled baseline are contained in this document so they do not depend on an unpushed playtest attachment.

## Implementation candidate and verification gates

The builder committed the approved supply implementation and focused tests as
`e3761b7632e6d45120a5e60a6e83bf1de0c37059`. The coordinator owns this record;
the builder does not approve its own work. Runtime source remains pinned while
live verification runs. No merge or deployment has occurred.

- `npm run test:market-liquidity` and the issue-53 market-spread regression
  pass, including separate local reruns by the verification worker.
- `npm run test:boot` passes with its existing assertions intact.
- The original ordinary `npm run build` failed the unchanged byte limits. The new
  JavaScript bundle is 1,824,513 minified bytes and 545,005 gzip bytes, an
  increase of 3,297 and 1,183 respectively over the prior approved artifact.
  The issue-62 exception covers only its old exact artifact and has not been
  extended. The owner subsequently approved a new exact #55 exception;
  ordinary build and bundle report now pass through that exception with raw
  byte failures retained. The candidate passes the browser dependency boundary.
- Five serial fresh-profile startup measurements are 6,858.4, 8,276.5,
  7,506.6, 12,672.3 and 13,815.4 ms. Median is 8,276.5 ms; three samples
  exceed the unchanged 8,000 ms limit. All five report zero page errors and
  complete owned-process, port and profile cleanup. An earlier sandboxed
  attempt failed before navigation and produced no timing samples.
- The captured slow startup intervals include delays before the document
  request and after document loading. The historical issue-62 result also
  failed, but these unpaired measurements do not establish that this feature
  caused a regression. The owner subsequently approved this exact measured
  startup exception on 2026-09-09; the raw measurements remain failures.
- Three fresh earned-only progression runs purchased and mounted the
  freighter in 554.523, 550.828 and 525.888 accumulated simulation seconds.
  The 9m10.8s median is below the approved 10–20-minute target, so pacing
  original target is not met. The owner subsequently accepted this measured
  pacing for the fixed #55 design. No delay or tuning change was added.
- A retained earned freighter completed five further shipments, including
  an actual 160-unit provisions delivery: 16,000 UU cost, 18,720 UU revenue.
  Final cash was 27,069 UU from 4,802 UU retained working capital and
  22,267 UU realized trade profit, with no paid repairs, tribute or deaths.
  Isolated stock/UI/persistence checks pass 12/12 with zero console errors
  or exceptions, including fractional stock restored through public Continue.
- The owner explicitly authorized sending the prepared, fixed code-and-test
  payload to Claude after automatic approval review initially rejected that
  transfer. Claude returned source and security PASS on the exact source,
  with nonblocking hardening/presentation notes. The reviewer executed no
  tests; later live evidence is separately attributed. Local follow-up closed
  the review's fresh-game reset visibility gap using the actual reload path.

Implementation evidence is retained separately under
`C:/Projects/WebSim/out/issue-55-implementation-evidence/`. The diagnostic
candidate and full manifests are under this worktree's
`out/issue-61-live/issue55-candidate-01/`; startup evidence is under
`out/issue-61-live/issue55-startup-02/`. The candidate JavaScript is
`assets/index-BccXVvIY.js`, SHA256
`e9bfd0927fc8a81a90ce185688e11e76a521a08541447410b1166dc13fc75c36`.
Its whole-candidate manifest SHA256 is
`ed327b41511e5491d873d797a3e11cb02aca59b6b566be10e26fb79a2f3a28fb`;
runtime source census SHA256 is
`5b535d6214fb7d8adec062c278ebeaa703c9e3743dd9a4bff56dbef4cea604ff`.
The owner approved these exact byte/startup exceptions and the measured pacing
on 2026-09-09, separately from source-review permission. The
[release note](releases/issue-55-measured-exception.md) records the scope;
activation verification passes and independent policy review is underway. All
447 emitted files match the tested candidate. Raw failed measurements
are retained and global limits remain unchanged.

The [implementation playtest report](playtests/2026-09-09-issue-55-market-liquidity.md)
contains the reconciled campaign ledgers, save-recovery caveats and release
gates. The issue remains open while the scoped policy review is completed.
