# Issue #55 market liquidity verification

Implementation: `e3761b7632e6d45120a5e60a6e83bf1de0c37059`.
Contract: [Market liquidity and progression design](../MarketLiquidityProgressionDesign.md).
Status: implementation and local/live verification recorded; acceptance and
independent review gates remain open. No merge or deployment.

The approved finite supply is implemented: 160 units per bulk commodity,
20 per other ordinary commodity, and a 1,200-second saved-simulation refill.
Sales remain accepted at existing flat quotes and replenish retail stock up to
capacity. New `world.marketSupply` data persists separately from numeric prices.

## Three fresh progression runs

Each run began as a fresh Rim Drifter with 600 UU and a 20-unit hold. A public
API pilot used ordinary navigation, legal market purchases, actual sales and
actual shipyard purchases. Trade selection ranked expected return per credit
using authored destination baselines and locally observed fill quotes, funds,
hold space and stock. No seed pinning, accelerated clock, resource/position
injection, missions, mining, salvage or gifts funded these runs.

| Run | Completed sales | Accumulated observed simulation to purchase | Full wall time | Realized market profit | Cash before purchase | Hull debit | Reserve |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 10 | 554.523 s (9m14.5s) | 559.830 s (9m19.8s) | 24,106 | 24,706 | 24,000 | 706 |
| 2 | 10 | 550.828 s (9m10.8s) | 676.303 s (11m16.3s) | 28,288 | 28,888 | 24,000 | 4,888 |
| 3 | 11 | 525.888 s (8m45.9s) | 530.653 s (8m50.7s) | 24,919 | 25,519 | 24,000 | 1,519 |

All three purchases were followed by an observed 160-slot freighter mount.
Each cash ledger reconciles as 600 plus realized market profit minus the
24,000 purchase; nontrade cash deltas are zero. No repair or tribute payment
was incurred. The figures are realized cash results, not a valuation of stored
ships or a deduction for every outstanding repair.

The median is **550.828 seconds (9m10.8s)**, with a range of **525.888–554.523
seconds**. All three are faster than the approved 10–20-minute target, so that
pacing target is **not met**. No delay or tuning change was introduced to make
it pass. These are knowledgeable automated runs, not novice-session estimates.
The earlier baseline included different market events and analyst/navigation
delays; this comparison does not establish that finite stock accelerated play.

Run 1 had one ordinary fatal encounter on shipment 7. Automatic save recovery
restored the same 3,715 UU and 20 provisions, along with hull condition. Its
discarded timeline remains in accumulated simulation time; the final saved
clock alone would undercount the campaign. Of 96 provisional return-stock
comparisons, 24 crossed the recovery boundary and are excluded; 72 same-timeline
comparisons passed.

Run 2 encountered a blocked dock on shipment 7. The pilot stopped and its
browser was closed. The same profile continued from 18 UU and 10 living rock;
one ordinary reapproach completed the shipment. The full observed saved-clock
rewind was 27.283 seconds, and the original wall timer includes the interruption.
This is a manual harness interruption, distinct from run 1's automatic recovery.
Its 72 same-timeline stock comparisons passed. Starter hull was 98.688 before
mounting the new freighter. Run 3 had no death; its final audit and all raw
receipts are retained alongside the other runs.

No stock-refusal receipt occurred in the three stock-aware trading runs. Their
first small loads all earned positive profit. This does not establish that an
unrestricted or novice policy would choose the same goods or have the same
results. Driver revisions, including bounded ordinary docking retries added
after run 2's interruption, are recorded in the retained method evidence.

## Retention and earned freighter follow-up

Run 2 was selected for the freighter follow-up because it had the largest
observed reserve. Continue unexpectedly restored a whole earlier checkpoint:
36 UU, 14 wakeglass, one refined metal, one raw ore, and the 20-slot starter,
before the final sale and purchase. This does not show a partial stock-only
serialization failure. The purchase observations had no recorded save-blocked
event or active combat flag.

The historical harness used forceful browser termination without an evidenced
storage flush. Separately, current Mount behavior does not itself request an
autosave, and docked idle time alone does not save a changed mount. The worker
verified an ordinary post-mount save event followed by graceful browser
closure and Continue. No save data was edited to repair the result.

The retained shipment was delivered again through ordinary play and the
freighter repurchased. Changed quotes left 4,802 UU after this replay; the
discarded original sale and purchase are not counted twice as retained income.
An ordinary one-unit market buy/sell round trip triggered the post-mount save:
cash went from 4,802 to 4,673 and back to 4,802, with no realized gain or loss.
A read-only projection of this owned game's checkpoint confirmed the saved
state before closure; that privileged diagnostic is separate from the public
API trading benchmark and was not used to choose cargo. After graceful closure
and Continue, 4,802 UU, empty cargo and the mounted 160-slot freighter were
preserved, with zero console errors. The historical force-close loss remains
recorded; this check does not prove its precise cause.

Starting from the retained 4,802 UU, the earned freighter completed five more
shipments without grants, accelerated time, tribute, repair payments or deaths.

| Shipment | Units | Cost | Actual revenue | Realized profit | Cash after sale |
|---|---:|---:|---:|---:|---:|
| Living rock, slag iron and provisions | 11 | 4,778 | 6,833 | 2,055 | 6,857 |
| Wakeglass and raw ore | 10 | 6,840 | 10,845 | 4,005 | 10,862 |
| Living rock | 20 | 10,780 | 15,600 | 4,820 | 15,682 |
| Wakeglass and refined metals | 45 | 15,582 | 24,249 | 8,667 | 24,349 |
| Provisions | 160 | 16,000 | 18,720 | 2,720 | 27,069 |

The first three loads remained limited by working capital. On shipment four,
available wakeglass stock capped the purchase at seven units even though cash
could buy twelve; the remaining capital bought refined metals. Shipment five
then filled all 160 slots through ordinary 99+61 orders and delivered them.
The destination's observed 117 UU quote produced 2,720 UU profit, below the
earlier baseline's observed 5,600 UU under different quotes and conditions
(that baseline delivery included a death and retry).

Total realized follow-up profit was 22,267 UU, reconciling exactly to final
cash of 27,069 UU. First purchase to final sale took 652.425 simulation seconds
and 655.993 wall seconds. The full 160-unit shipment alone took 131.489
simulation seconds and 133.970 wall seconds from purchase to final sale.
Final hull was 199.089/220 with an unpaid 19 UU
repair-all quote. Console errors were zero and graceful teardown was verified.

## Isolated stock, controls and persistence fixture

The final live fixture passed **12/12 checks**, with zero console errors or
exceptions. It exercised keyboard and pointer one/five-unit trades, public
99-unit orders, chunked 160-unit orders, same-dock reversals, restricted access,
atomic insufficient-stock refusals, affordability and hold bounds, capped
sale replenishment, and read-only observations. Stock/status columns were
legible and the open market pane refreshed from 0/160 to 1/160 during ordinary
game time without closing and reopening the panel.

This fixture is separate from earned progression: it sets up funds, hull,
position, quotes and simulation checkpoints to isolate behavior. At 600 and
1,200 simulated refill seconds it observed 80/160 and 160/160 bulk units,
and 10/20 and 20/20 other units. An ordinary trade saved fractional stock of
10.5 units at saved time 2416.1035; a fresh page in the same profile used public
Continue and restored the exact units and timestamp. The restored page used
normal browser time.

Two earlier fixture attempts remain retained. The first expected a `stock`
token where the existing public API correctly returns `notice` with an
availability explanation; refusal mutations were still atomic. The second
passed eleven checks but timed out during the reload/screenshot stage under
the harness's virtual-time setup. Correcting those harness expectations and
using a fresh ordinary-time page produced the final pass. Runtime source and
saved data were not patched to make the checks pass.

## Automated and release checks

| Check | Result |
|---|---|
| Focused liquidity tests | PASS, including a separate local rerun |
| Existing issue-53 spread regression | PASS, including a separate local rerun |
| `npm run test:boot` | PASS; existing assertions retained |
| Ordinary `npm run build` | FAIL: 1,824,513 minified / 545,005 gzip bytes |
| Diagnostic browser dependency boundary | PASS: only `three` |
| Five cold production starts | FAIL: 6,858.4 / 8,276.5 / 7,506.6 / 12,672.3 / 13,815.4 ms |
| Pacing-run console errors | Zero in all three runs |
| Final isolated live fixture | PASS, 12/12; zero console errors or exceptions |
| Independent Claude source review | Awaiting explicit authorization for the fixed review payload |

The byte increase over the prior approved artifact is 3,297 minified and
1,183 gzip bytes. The fixed global limits remain 1,800,000 and 537,600 bytes.
The prior exact-artifact exception does not cover this changed bundle.

Startup median is 8,276.5 ms; three of five samples exceed 8,000 ms. Page error
arrays are empty and all owned browsers, ports and profiles were cleaned up.
Captured delays include substantial pre-document and untraced post-load time;
they do not establish a cause or authorize an exception. An earlier sandboxed
launch attempt failed before navigation and produced no timing samples.

## Attribution and retained evidence

The builder authored the source and focused tests. A separate Codex worker
operated the live campaigns and another reran focused checks and inspected
source/timing evidence. These local checks are not a substitute for the required
different-engine review. Automatic approval review rejected transferring the
prepared unpublished code/test payload to Claude without explicit authorization;
no Claude source verdict is claimed.

Raw evidence is local and uncommitted under
`C:/Projects/WebSim/out/issue-55-implementation-evidence/`: per-run public API
streams and receipts, `stock-r1-audit.json` through `stock-r3-audit.json`,
`pacing-audit-summary.json`, `evidence-method.md`, test logs, review notes,
screenshots, source identities, and harness revision hashes. The full diagnostic
candidate and startup manifests are in the implementation worktree's
`out/issue-61-live/issue55-candidate-01/` and `issue55-startup-02/` respectively.
