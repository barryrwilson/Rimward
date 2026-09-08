# Passenger commitments and reward policy

Decision for [issue #73](https://github.com/barryrwilson/Rimward/issues/73),
8 September 2026. Code inventory: `2958c140`, before this issue's explanatory
UI/API changes. Policy and terms are implemented; local build, full boot,
focused contract and rendered browser verification are complete. Independent
QA and merge remain pending.

## Decision

Retain capacity-free passenger work at its existing reward and deadline. A
party books a journey to the named far dock within 600 simulation seconds of
acceptance. It requires no cash buy-in and no commodity hold space. Each
distinct party earns its own agreed fare. Two parties on the same journey
intentionally earn twice a single party's fare, including when the hold is
full. Make those terms visible before acceptance in both the Jobs pane and
public API.

This makes passengers an accessible source of route income for a starter who
cannot yet finance a profitable commodity load. Their commitment is the named
destination, travel exposure, and delivery window. Choosing another activity
can forfeit the fare when that window closes. These are modest commitments:
accepting a second party bound for the same dock adds almost no flight work,
and taking passengers on an already planned trade trip is deliberately useful.
The policy does not claim that each additional fare purchases an equivalent
amount of effort or risk.

There are two offered-or-accepted passenger slots **per origin system**, not
two cabins or a global two-party limit. A settled or expired slot renews.
Travel and the deadline bound each agreement, but the board is not a scarce
market and repeated commuting can earn indefinitely. Do not describe the
two-slot rule as a limit on lifetime income or all parties aboard.

The evidence establishes this stacking opportunity, not an economy-wide
progression failure that requires a fare cut or cabin system. Retention is a
deliberate bounded product choice, not proof that all careers have equal
earning rates. A measured progression decision remains separate in
[#55](https://github.com/barryrwilson/Rimward/issues/55).

## Current behavior and retained contract

Current source takes precedence over the historical
[MSN-02 passenger brief](Msn02PassengerDesign.md), whose inventory predates
several mission and persistence changes.

| Concern | Current behavior retained by this decision | Source |
|---|---|---|
| Availability | Two `offered` or `accepted` jobs per origin; each has a distinct id and slot; renew one for one after settlement/expiry | `src/systems/station.js`: `syncPassengerJobs`, `replacePassengerJob` |
| Acceptance | At the posting dock, valid offered party and destination, `need === 1`; no commodity or cash reservation | `station.js`: `acceptJob`, passenger branch |
| Fare | Origin `jobPayFor(FERRY_REWARD)` with base 350 UU, including existing epic/faction modifiers; finite/clamped `payQuoted` stamped at acceptance | `station.js`: `jobPayFor`, passenger accept/render/delivery branches |
| Window | Offered posting has a 600-second window; acceptance starts a fresh 600 seconds on `world.time` | `station.js`: `makePassengerJob`, `acceptJob`, `tickDeliveryJobs` |
| Destination | Named `otherSystemId(origin)`; current settlement resolves that helper, rather than trusting an arbitrary saved destination | `station.js`: `passengerDestId`, passenger delivery/render branches |
| Settlement | Before expiry, destination docking settles each accepted party once, removes/replaces it, and pays its locked quote; employer standing +2 and existing contact rewards remain | `station.js`: passenger branch of `tickDeliveryJobs` |
| Expiry | At `world.time >= deadline`, no fare; accepted job produces `lapsed`, then replacement; no additional fine or standing loss is introduced | `station.js`: passenger expiry branch |
| Capacity | No passenger commodity, cargo reservation, hull/cabin requirement, or ship-wide active-party cap | `station.js`: passenger accept/delivery; `src/game/save.js`: passenger sanitization |
| Persistence | Existing JSON-safe `world.jobs` records retain id, origin/destination, slot, quote, deadline and state; derived explanation requires no save key or migration | `src/game/save.js`: `sanitizeJob`; existing #71 post-mutation saves |

An existing settlement compatibility fence defers passenger payments while the
unique `haul-provisions` contract is accepted or the station session has
`ui.uniqueHaulPaid`. See `destPayHeldForUniqueHaul` and its call in passenger
delivery. This is not ordinary commodity occupancy and is not a passenger
capacity rule. This issue preserves that fence; simultaneous unique-haul
settlement is not evidence for or against the full ordinary-hold case. Do not
silently redesign the shared mission settlement order here.

## Relationship to courier and funded trade

Passenger work and the ordinary courier consignment both allow a player with
little cash to earn from travel. A passenger base fare is 350 UU; two ordinary
parties at unmodified rates pay 700 UU. The courier factor fronts four
Provisions, reserves four commodity units through those actual goods, and
pays a 350 UU base fare when the intact manifest lands. Its quoted rate uses
the destination's existing modifiers, while passengers use the origin's.
These base fares therefore need not remain equal at every pair of docks.

The courier's hold obligation is objectively a greater marginal requirement
at those equal base fares. Retaining passengers accepts that asymmetry; it
does not invent hidden passenger capacity, passenger-specific hazards, or
future cabin upgrades to explain it away. Courier goods can be sold, but
delivery then remains unpaid until the manifest is replenished. That is a
different interaction, not guaranteed superior profit.

Funded trade requires commodity capital and occupies space. A documented
five-Provisions contract paid 700 UU after 500 UU of goods, contributing
200 UU before separately incurred journey expenses. Ordinary market trading
can use available hold alongside passenger fares, and its return varies with
the goods, markets, capital and load. No changes to freight rewards, market
liquidity, ship prices, cargo capacity or standing belong to this decision.

## Evidence and accounting boundaries

The original public-API campaign ran on
`d7dd2dccf4cc3faebdea4ad8ba2d29f2c0cfdf17`, before fixes #70/#71. Its retained
passenger payments were 1,750 UU across five parties and three journeys, not
six parties or four journeys. The first delivery rolled back and the same
party was recovered once. The reports are local evidence at
`C:/Projects/WebSim/docs/playtests/2026-09-07-passenger-results.md`,
`2026-09-07-courier-results.md`, and `2026-09-07-trader-results.md` in that same
directory. They are not all tracked in this worktree.

| Representative observation | Passenger payment | Separate trade contribution | Required commodity capital / occupied hold | Recorded cash journey costs | Timing boundary (simulation seconds) |
|---|---:|---:|---|---|---|
| First single party, Freehold → Veridian | 350 UU retained after recovery | None assigned to this delivery | 0 UU / 0 passenger units | No repair or tribute recorded | Initial acceptance 51.8582 → initial payment 118.9716 = 67.1134 s; that payment rolled back. Recovered payment 205.5564 is the same party; no clean recovery travel duration is inferred |
| Two return parties, Veridian → Freehold | 700 UU | 1,056 UU ambient-metal sale excluded from passenger/trade profit | 0 UU / 0 passenger units; ambient cargo was later observed | No repair or tribute recorded | First acceptance 234.2863 → payment 316.7449 = 82.4586 s |
| Two parties plus full ordinary hold, Freehold → Veridian | 700 UU | 700 UU: goods bought for 2,000, later sold for 2,700 | 2,000 UU / 20 of 20 units for trading; 0 additional for passengers | No repair or tribute recorded | First acceptance 440.3796 → payment 542.3038 = 101.9242 s; sale at 571.0163 is outside that passenger interval |
| Courier return delivery | None; courier payment 350 UU | No duplicate-grant proceeds counted | 0 UU buy-in / 4 fronted units | 108 UU tribute | Acceptance 311.2868 → payment 376.0458 = 64.7590 s |
| Subsequent courier delivery, after scanner purchase | None; courier payment 350 UU | No duplicate-grant proceeds counted | 0 UU buy-in / 4 fronted units | No recorded marginal cash cost; earlier 400 UU scanner is a separate upgrade | Acceptance 446.4462 → payment 536.3833 = 89.9371 s |
| Trader funded five-Provisions contract | None; trade payment 700 UU | 200 UU after 500 UU goods cost | 500 UU / 5 units | No repair, feed, ammunition or tribute recorded | Acceptance 658.3561 → payment 799.5914 = 141.2353 s; goods bought at 684.8970 |

These are acceptance-to-payment intervals, not pure flight times or controlled
earnings-per-minute comparisons. The runs used different piloting, waiting,
encounters and preparation; passenger recovery included a controller mistake.
No recorded cash expense is not proof of no combat or damage. The 1,056 UU
ambient-metal sale funded part of the mixed trip and is not a fare. The final
scanner cost 400 UU and is a progression purchase, not journey overhead.
Courier duplicate-grant proceeds from #70 are excluded. The representative
comparison uses these historical observations. Fresh fixture-based browser
deliveries verify the current contract and explanation; they are not new
travel or progression benchmarks. A controlled earning-rate claim would
require comparable route starts, flight boundaries and separately reconciled
costs beyond this issue's evidence.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Global one- or two-party cap | Bounds accumulation across origins | A two-party cap does not change the observed same-route doubling; a one-party cap removes a supported mixed journey without evidence defining the intended earnings target |
| Reduced base fare or diminishing second fare | Directly reduces the marginal reward of stacking | Requires a justified progression target; second-fare rules add quote/order complexity, especially across reloads, for an exploratory comparison that does not establish such a target |
| Reserve commodity units or require cabins/service equipment | Creates explicit freight opportunity cost or a specialization purchase | Full-hold compatibility is useful and intentional today; this requires new balance, UI, equipment or save decisions disproportionate to the demonstrated problem |
| Fewer offers, cooldown or finite supply | Makes passenger opportunities scarce | Changes repeatable career pacing and may require replenishment state; two current slots are not evidence for a scarcity target |
| Tighter deadline, added failure fine or passenger damage condition | Adds urgency or risk | No evidence establishes a safe threshold across routes/pilots; could punish navigation and recovery problems and alter existing agreements |
| Keep mechanics and explain terms | Preserves starter access and mixed-cargo journeys with honest commitments | Selected; explicitly accepts cheap marginal income and leaves broader progression balancing to measured follow-up |

## Player and API explanation

Use one authoritative passenger explanation for the Jobs card and
public station observation. It must state no buy-in, no commodity space, a fresh
600-second acceptance window, separate payment for each distinct party, and
no fare on expiry. The named destination and live offered quote must be
available before acceptance. After acceptance, show the locked `payQuoted`
and remaining time; an offered posting's remaining time must not be confused
with the new delivery window.

The board explains that its two slots belong to the origin. Do not label them
as ship occupancy. A full ordinary hold must leave passenger acceptance
available. Duplicate acceptance must report a current refusal and preserve
cash, cargo, the quote and deadline. Its explicit refusal is
`That posting is not open. Party already aboard.` with API token
`not-offered`. A courier at that same full hold must
still explain that four free units are required. Existing wrong-dock,
missing/stale-job, and not-docked validation remains authoritative; no new
refusal is needed solely because two distinct parties share a destination.

The implementation uses the existing `observe().station.view.rows` Jobs
projection: `job-detail` carries the shared terms and `job-reward` carries
`Escort to <destination> — pays <quote> UU`. Its exact terms are:

> No buy-in; uses no cargo hold. Full hold OK. 2 party slots per origin. Each
> party earns its own fare, even on one trip. Dock within 10 min of acceptance;
> fare locks then. Expiry pays nothing.

This projection provides the current offered fare rather than treating the
raw job `reward` base as the guaranteed quote. Successful `acceptJob` copies
the shared destination/fare/terms into `receipt.notice`; failures keep the
existing `token` and `error` refusal convention. In-flight `jobs.active`
continues to expose `payQuoted`, `deadline` and `secondsLeft`. No additional
observation fields or persisted object are required. Human buttons and
`acceptJob` continue to invoke the same handler. Terminal `jobState` events
retain each id, outcome and paid amount. No API version,
event vocabulary, control, key, HUD gauge or secret-bearing payload is needed.
Render world/content strings with text-safe DOM APIs.

## Existing agreements and verification contract

No grandfathering transformation is required because the selected policy
retains every legitimate agreement's mechanics. Never overwrite an accepted
`payQuoted`, deadline, id, slot or origin when adding explanation or restoring
a save. Existing valid accepted parties above two in total also remain valid;
the per-origin slots are not a new ship-wide migration cap. Preserve existing
sanitization, including rejection of passenger commodity fields, invalid
destinations and invalid `need`, and existing quote clamps. Corrupt records
are not legitimized by grandfathering.

Issue #71 supplies post-settlement and post-acceptance saving. Verify ordinary
browser Reload, focused fresh-process save restores, and graceful browser
close/relaunch with the same profile before delivery and after settlement;
compare the job ids/quotes/deadlines, cash/cargo and terminal state. A restart
must neither grant a new 600-second window nor pay a completed party again.
Forced process termination previously restored an older browser snapshot;
do not claim crash durability or mask lost progression with injected state.

The implementation and independent review must establish:

1. One party accepts with 0 UU/cargo change, shows the same terms in UI/API,
   reaches the named destination before expiry, and pays its agreed quote
   once; origin redocking does not pay it.
2. Two distinct same-destination parties each lock their own quote/window,
   survive reload, and pay separately once on one journey. A duplicate of
   either active id is refused without mutating either agreement.
3. With 20 ordinary units in a 20-unit hold, two passengers accept and settle
   without changing those goods; the courier correctly refuses four-unit
   fronting at that same full hold. Record sales separately from the fares.
4. Before acceptance, the dynamic offered quote and full delivery-window
   terms agree across player/API surfaces, including an existing pay modifier.
   After acceptance a modifier change does not reprice the agreement.
5. Expiry gives no payout and renews the slot; current deadline boundaries,
   two slots per origin and quote clamps remain covered by focused/boot tests.
   This is contract verification, not a new timer or numerical retune.
6. Compare representative single/stacked/mixed acceptance-to-payment intervals
   and record passenger payments, commodity capital, occupied units, trade
   sales minus purchases, ambient receipts and recorded cash costs separately.
   The historical table supplies this comparison; pure flight boundaries are
   not available and must not be inferred. Label fresh browser fixture
   deliveries as functional verification, not earned live progression or
   new trip-time measurements, and document confounders.
7. Production build, full `npm run test:boot`, relevant API/contract tests and
   visible browser flows pass with console errors checked. Save/restart
   evidence must identify the tested artifact and lifecycle.

Work stays in passenger explanation/projection, focused verification and this
policy/backlog documentation. Do not edit numerical tuning, saves, other
careers or the settlement compatibility fence incidentally. Deployment/merge
remains with the normal reviewed-artifact pipeline. Reverting the explanatory
change requires no migration and must leave current saved agreements readable.

## Reproducible local verification

Run from the repository root:

```powershell
node --import ./scripts/with-css-stub.mjs scripts/issue-73-passenger-policy-test.mjs
npm run build
npm run test:boot
node scripts/issue-73-passenger-live-probe.mjs
```

For the browser probe, `ISSUE73_CHROME` may identify a local Chrome executable
and `ISSUE73_PROFILE` a writable parent for its isolated disposable profile.
The probe selects loopback ports. Its controlled headless Chrome test page
uses `--no-sandbox`; this is a test-runner setting, not a game deployment
change. No remote-page browsing is part of this probe.

The final implementation passed the focused contract suite, production build
and full boot suite on 8 September 2026. The production bundle is 1,799,951
minified JavaScript bytes / 523.14 KiB gzip. Focused tests cover one party,
two parties, a full-hold pair, duplicate/full-hold courier refusals, and
fresh-process restoration before and after payment. The modified-rate check
shows an unaccepted 402 UU offered fare alongside an accepted agreement that
remains locked at 350 UU.

Rendered headless Chrome passed all three serial browser scenarios with zero
console errors and zero exceptions. Each scenario checks pre-acceptance
UI/API terms, acceptance receipts, restored agreements, correct settlement/
cargo and no repeat pay after restoring settled state. Single and double
use ordinary page Reload before and after delivery. The final mixed flow
uses actual graceful `Browser.close` and a new Chrome process on the same
profile at both boundaries: accepted-state PID 28372 exited with code 0 and
restarted as 3664; delivered-state PID 3664 exited with code 0 and restarted
as 20740. The `restarts` records in `live/probes.json` establish those
lifecycles. The restored accepted job ids, quotes and deadlines match, the
pair pays exactly 700 UU, and the settled restart does not pay again.
The single and double flows pay 350 and 700 UU respectively; the mixed flow
retains all 20 purchased Provisions. Their later 2,700 UU sale against the
2,000 UU purchase is a separate 700 UU trading contribution, not a fare.
Funding
and berth fixtures are declared: browser scenarios start with a 5,000 UU
grant and use parked traffic/safe berth positioning and controlled system
changes. The focused suite grants funding only for its mixed case. These
are functional checks of real acceptance/transactions/save paths, not earned
starter runs, natural navigation, or evidence of risk-free travel income.

Local outputs are `out/issue-73/focused-results.json`, `focused.log`,
`build.log`, `boot.log`, and `out/issue-73/live/probes.json`,
`single-results.json`, `double-results.json`, `mixed-results.json`,
`console.txt`, `run.log` and screenshots; `out/issue-73/QA-VERIFICATION.md`
records the local verifier's checks and scoped process/profile/cache cleanup.
These generated evidence files are
not required source artifacts; rerun the committed probes to regenerate
them. The live ledger was captured before the implementation commit and its
`commit` field is null; no immutable reviewed-commit result is claimed here.

Rendered terms wrap visibly at 1,440 px and 1,024 px desktop widths. At
390 px the existing fixed-width station pane clips; mobile-layout support
is not established and that pre-existing layout was not expanded into this
issue. The original campaign supplies the representative travel/accounting
comparison above. No new natural-flight benchmark, force-kill durability,
independent QA pass, merge or deployment is claimed by these local results.
