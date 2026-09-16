# Trader income curve decision — issue #220

Decision date: 2026-09-16. Source baseline: `c57aea14` (merged #218/#219).
[Issue #220](https://github.com/barryrwilson/Rimward/issues/220) asks for a
progression decision, not an economy rewrite. This document completes that
decision; **the target below is selected, not demonstrated by a new campaign**.

## Chosen curve

A careful fresh Freehold Greenhand should first be able to buy a freighter
in **45–60 simulation minutes**. The freighter should mark the move from
building a stake to managing cargo capital and routes. It should not be the
end of meaningful trading after one or two highly profitable circuits.

For measurement, start with the actual 350 UU origin purse and ordinary light
hull. Use real flight, docks, job settlement, market fills and simulation time.
A careful trader may combine legal cargo, passengers, ferry and espionage jobs,
read available prices and avoid combat. No cash/cargo fixtures, teleportation,
reload farming, hull-sale windfalls or intentional deaths. Do not require
purchasing optional racks; record them if bought. Measure first affordability
at a yard that actually offers an eligible freighter, at its actual standing
price, as well as actual purchase time. Cash counts; unsold cargo and hypothetical
resale values do not. A reserve after purchase is desirable and must be logged,
but is not silently added to the time-to-afford threshold.

The 45–60 band is the chosen central result for careful runs, not a hard timer
or a guarantee for every seed. Initial validation requires five declared seeds,
including the historical seed if recoverable, with a median in the band and
at least four runs in 35–75 minutes. Failure to reach eligibility counts as a
failure, not a dropped sample. Record early/late outliers and their causes.
These are prospective acceptance criteria, not measured results.

## What has changed since the report

The issue's real-flight observation on `d80de0a3` reached the freighter at
10:42 and 100,000 UU by 23:45. It is useful historical evidence, but cannot be
used as a measurement of current master. The reported commit itself merged
#208 repair scaling (#217), so repairs are not a new fix since that run.

| Lever / observation | Current source and implication |
| --- | --- |
| Unlimited neutral-price resale | #218 preserves market surplus and depresses subsequent sell fills; depletion raises buy fills. `src/game/market-supply.js:58–100`, `src/game/state.js:513`. Stock recovers toward nominal over simulation time, with 1,200 seconds per nominal capacity. This reduces repeated-route margins; it does not cap all profit. |
| All fares are flat | One-jump passenger base pay is 350 UU; two jumps pays 438 before origin modifiers. Trade and ferry also have the existing 1x / 1.25x hop ladder. `src/game/job-distance.js:25–32,156–159`; `src/systems/station.js:3022–3035,3135–3144`. Extending this is tuning an existing mechanism. |
| Spy work is free one-way income | Spy postings require gathering at the far dock and filing at home; their base is `explorePayBase` (420 UU). `src/systems/station.js:3334–3336,3538–3562`. Incremental effort can still be low when bundled with an existing return route. |
| Hauls have no buy-in | Accepting a generated trade job promises payment, but does not front cargo or deduct a deposit (`station.js:5911–5934`). Delivery consumes player-owned goods (`station.js:4512–4546`). A trader must obtain the five units; the 1.4x one-jump payout is gross reimbursement, not net profit (`station.js:2702–2704,3135–3139`). Cargo sourced elsewhere, salvaged or already owned changes the cash outlay. |
| Buy-in is visible on every haul | It is not. `haulBuyInFor` (`station.js:6216–6237`) belongs to the retired legacy Provisions card. The wishlist's #206 note records the generated-row disclosure gap. Do not mistake this UX gap for a missing economic cost. |
| Buy locally at destination and redock to claim | #219 closes same-system redock laundering. Arrival eligibility remains session-only: initial boot, save reload and death recovery can still initialize from local cargo. This is a known limitation, not proof of exploit-free earnings; see `REMAINING-WORK.md` #219. |
| Repairs barely matter | #208 already raises hull-class repair rates (light 3x; freighter 6x). Its two measured legs and disclosed damage/capital fixtures are not a longitudinal balance run. See [repair decision](Issue208RepairBalanceRecommendations.md). Raising repair bills cannot reliably slow a careful pilot who takes little damage. |
| Bigger hull is a new missing purchase | #186 exposes the existing freighter path. List price remains 24,000 UU, reduced by standing; the issue's 21,600 is a 10% discount. `src/game/shipyard.js:18–25,112–122`. Preserve the price and rank ladder for this decision. |

These references name the baseline spans; no runtime source is changed here.

## Focused calculation and its limits

A read-only Node experiment on this baseline imported the actual supply and
hop-pay functions. For wakeglass (nominal capacity 20), the multiplier for the
**next** sell quote is:

| Units sold into initially nominal stock | Stock | Buy multiplier | Sell multiplier |
| ---: | ---: | ---: | ---: |
| 0 | 20 | 1 | 1 |
| 5 | 25 | 1 | 0.875 |
| 20 | 40 | 1 | 0.5 |
| 40 | 60 | 1 | 0.5 |

After selling 20 into nominal stock, at 0/300/600/1,200 seconds the stock is
40/35/30/20 and the sell multiplier is 0.5/0.625/0.75/1. The source's per-order
quote locking matters: an order begun at nominal supply keeps its displayed
unit quote; an existing human bulk intent also locks supply pressure over its
synchronous chunks. The table is not an integrated revenue calculation for
that first order. Separate confirmations reprice. Rounding, the same-counter
spread cap, other modifiers, stock bought between sales and live price changes
can further change actual fills.

Reproduce from the repository with Node (ES module input):

```js
import { marketSupplyAt, marketSupplyMultiplier, commitMarketSupply }
  from './src/game/market-supply.js';
import { hopPayMult } from './src/game/job-distance.js';
import { SYSTEMS } from './src/game/state.js';
const systemId = Object.keys(SYSTEMS)[0];
const world = { time: 0 };
const row = marketSupplyAt(world, systemId, 'wakeglass');
for (const sold of [0, 5, 20, 40]) {
  const stock = { ...row, units: row.capacity + sold };
  console.log(sold, stock.units,
    marketSupplyMultiplier(stock, true), marketSupplyMultiplier(stock, false));
}
commitMarketSupply(world, systemId, 'wakeglass', row, 20);
for (const seconds of [0, 300, 600, 1200]) {
  world.time = seconds;
  const stock = marketSupplyAt(world, systemId, 'wakeglass');
  console.log(seconds, stock.units, marketSupplyMultiplier(stock, false));
}
console.log([1, 2].map(hops => Math.round(350 * hopPayMult(hops))));
console.log([45, 60].map(minutes => (21600 - 350) / minutes));
```

At the historical discounted price, earning 21,250 UU net of expenses from
350 UU over 45–60 minutes implies an average **354–472 UU/minute** increase
in cash. This is an accounting reference, not a per-job payout prescription:
optional purchases, cargo tied up at the endpoint and standing change the
required earnings. No current fresh-start progression time was measured here.
The experiment establishes pressure and distance arithmetic only, not flight
throughput, risk, job availability, a final quote, or the target's achievability.

## Prioritized levers

1. **Measure the merged baseline first.** Keep #218 saturation, #219 eligibility
   and #208 repair tuning. Record net cargo profit separately from job receipts
   and cargo acquisition costs. Compare concentrated Freehold–Veridian circuits
   with diversified routes. If the acceptance band already passes, stop tuning.
2. **Tune pay for incremental work before adding restrictions.** If runs remain
   too fast and bundled jobs dominate net income, adjust the existing one/two-hop
   pay ladder and spy return-work reward together. Preserve a useful no-capital
   passenger/ferry start. More distance or a demonstrated hazardous route may
   justify more pay; do not invent risk premiums from faction names or raise
   every job payout in the name of distance. Keep accepted quoted pay unchanged.
   Choose exact constants from the new per-leg results in a bounded tuning issue.
3. **Shared per-berth job cap only if bundling remains dominant.** The current
   shared one-long-run posting rule is not a shared cap on all kinds. A new cap
   needs explicit scope for which jobs compete, replacement timing, abandonment,
   save/reload and UI explanations. Preserve first-run access and existing
   accepted agreements. Do not silently impose that new policy in this decision.
4. **Revisit saturation only if cargo still dominates.** First-order/bulk quote
   locking and the pressure floor leave profitable cases. Use actual repeated
   shipments to judge them; preserve quote/payment parity and bulk usability.
   Do not add a per-unit repricing tax as an incidental documentation change.
5. **Do not add a second haul buy-in or mandatory repair sink.** Acquisition cost
   already exists. Restoring generated-card cost disclosure is a separate UX
   candidate; deposits, fees, artificial damage and higher hull prices are not
   selected balance levers here.

## Life after the freighter

Use the existing 160-unit hull to carry a diversified manifest, cover larger
capital commitments and choose additional destinations as stock and margins
shift. Jobs can supplement a route instead of being the entire large-hull
income engine. Keep a working reserve for cargo and actual repairs; the next
hull (including the existing frigate) is an optional career choice, not a
mandatory trader ladder. No new ship, SKU, rent, progression gate or passive tax
is authorized by this decision.

Continue each validation run for 30 simulation minutes after purchase. Record
cash, cargo quantity and acquisition cost, realized net profit, repair expense,
standing, destinations and next intended purchase every five minutes. Compare
a repeated-pair strategy with diversification from the same purchase snapshot.
The desired outcome is that capacity enables valuable choices, while repeatedly
selling the same goods reduces subsequent margins; inventory value is not
reported as spendable cash. If existing destinations and purchases do not
sustain that loop, report the content gap separately rather than claim #220
created an endgame. No post-freighter income ceiling is claimed or imposed.

## Guardrails and handoff

The balance implementation remains a separate, scoped follow-up if baseline
measurement fails. Preserve starter accessibility, accepted agreements, spread
protection, arrival consumption shared across jobs, save safety and the existing
class/standing prices. Include poor-purse and missed-job cases, normal one/5-unit
orders and human bulk versus agent ordinary-order behavior. Do not rely on save
reload/death eligibility as legitimate earning, but retain it in regression and
risk notes until separately fixed.

The decision is complete when its target, measurement rules, post-freighter
loop, priorities and limitations are recorded in the backlog and wishlist.
It does not require pretending that implementation or campaign validation is
complete. Before any future tuning ships, run focused quote/settlement and
availability tests, `npm run build`, `npm run test:boot`, and real browser
campaigns with console checks; independent QA reviews the exact artifact.
No new exposure, credentials, persistence or deployment is involved here.
Rollback of this documentation is a revert; runtime rollback belongs to any
subsequent tuning issue's reviewed artifact.
