# Issue #208 repair balance recommendations

Status: proposal only; no repair balance changes implemented. Owner selection of the mechanism and tuning remains open.

Prepared against commit `07e2fafa2a9312cc46d2ec8dec44d9fd51bd80d6` for [issue #208](https://github.com/barryrwilson/Rimward/issues/208).

## Recommendation

Apply explicit hull-class repair multipliers to the existing missing-integrity bill, including a modest increase for light hulls. Class scaling that leaves light at 1x would leave the reported starter-trader problem intact. Keep repair independent of cargo value and damage source.

The proposed numbers below are conservative starting points for a balance playtest, not validated outcomes. They increase the cost of surviving damage without attempting to make repair the entire trader progression sink. Larger hulls remain an existing capital purchase.

## Current behavior and evidence

At the verified base, `src/systems/station.js:220` defines channel rates in UU per integrity: hull 0.9, screen 0.3, shell 0.5, engine 0.6. The quote at `src/systems/station.js:6628-6663` computes each item as:

```text
ceil(missing integrity * channel rate * epic multiplier * faction multiplier)
```

The total is the sum of the separately rounded channel items. Channels missing less than one integrity are skipped. Non-finite channels are flagged as corrupt rather than billed. Keeper compensation zeroes every item and the total.

The payment action at `src/systems/station.js:5140-5165` recomputes that quote, refuses an unaffordable repair, and otherwise deducts the total and restores the channels. Invalid maxima are restored from the class baseline. Repair is all-or-nothing.

Class integrity and cargo values are authored at `src/game/state.js:37-44`; state creation is at `src/game/state.js:172-194`. Larger ships already incur larger bills for the same percentage damage because their maximum integrity is larger. Yard list prices are at `src/game/shipyard.js:18-25`; reputation discounts apply separately at `src/game/shipyard.js:112-122`.

Issue #208 reports a light-hull repair quote of 88 UU after piracy and credits rising from 350 to 8,458 UU over four legs in about 15 simulation minutes. The issue names `docs/playtests/2026-09-15-trader-playtest.md`, but that file was absent from the inspected checkout. Income and the observed quote are therefore issue-sourced observations, not independently reproduced playtest findings.

Related [issue #186](https://github.com/barryrwilson/Rimward/issues/186) records the trader capital plateau and an owner decision to improve visibility of the larger-hull path. That decision does not choose repair tuning for #208.

## Candidate tuning and exact examples

For comparison, every row below uses exactly 62% of class hull integrity missing, exactly 70% of class engine integrity missing, intact screen and shell, no keeper compensation, and a combined existing epic/faction multiplier of exactly 0.9. The 0.9 modifier is applied once; no additional discount is assumed.

```text
current = ceil(hullMax * 0.62 * 0.9 * 0.9)
        + ceil(engineMax * 0.70 * 0.6 * 0.9)

proposed = ceil(hullMax * 0.62 * 0.9 * 0.9 * classMultiplier)
         + ceil(engineMax * 0.70 * 0.6 * 0.9 * classMultiplier)
```

| Class | Hull max | Engine max | Yard list UU | Proposed multiplier | Current modeled UU | Proposed UU |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Light | 100 | 100 | 8,000 | 3x | 89 | 265 |
| Cutter | 80 | 90 | 11,000 | 3x | 76 | 224 |
| Heavy | 160 | 120 | 20,000 | 4x | 127 | 504 |
| Ace | 140 | 120 | 28,000 | 5x | 117 | 579 |
| Freighter | 220 | 140 | 24,000 | 6x | 164 | 981 |
| Frigate | 900 | 300 | 80,000 | 8x | 566 | 4,524 |

For the light example, the current hull item is `ceil(50.22) = 51`, the engine item is `ceil(37.8) = 38`, and the total is 89 UU. With 3x tuning, those items become `ceil(150.66) = 151` and `ceil(113.4) = 114`, totaling 265 UU. Multiplying an already rounded total would give a different answer and is not the proposal.

The issue's displayed 62 and 70 missing integrity do not establish the exact underlying fractional values. The exact-input 89 UU reconstruction therefore does not prove the reported 88 UU quote was wrong. These examples are controlled arithmetic comparisons, not replays of that session.

The reported credit increase is `8,458 - 350 = 8,108` UU, averaging 2,027 UU per leg. The proposed light bill is about 13.1% of that average increase, versus 4.4% for the current modeled 89 UU bill. Average net credit growth is only a rough benchmark: it does not establish individual trip profit or future income on larger hulls.

The modeled 265 UU light repair remains below the reported 350 UU starting purse for this particular damage pattern. More extensive damage or a poorer pilot can still face an unaffordable bill. A new rescue subsidy, partial repair system, or affordability guarantee is outside this proposal.

## Alternatives and tradeoffs

| Mechanism | Benefit | Limitation |
| --- | --- | --- |
| Explicit class multipliers, recommended | Predictable, independently tunable, small implementation scope | Raises costs for every career using that class; requires balance testing |
| Flat global increase | Smallest implementation and easy to explain | Less control over large-hull running costs |
| Percentage of hull purchase price | Connects repair to asset value | Couples repair tuning to shipyard pricing; would need a clearly defined damage weighting |
| Current cargo value | Connects a bill to valuable cargo | Selling or unloading before repair changes the bill; identical damage costs different amounts |
| Cargo value captured at damage time | Avoids immediate unloading avoidance | Requires new history and rules across saves, sales, and hull changes |
| Combat-only surcharge | Targets piracy and combat losses | Requires reliable damage-source accounting and persistence semantics; broadens scope |

The recommendation preserves career-independent physical repair pricing. Its multipliers are authored tuning choices, not a formula derived from cargo capacity or replacement value. The light increase addresses the reported case, while the remaining multipliers offer a graduated starting point for larger ships.

## Proposed implementation contract after owner selection

1. Move repair rates into `src/game/state.js` alongside a six-class multiplier table, keeping tuning in the existing tuning owner.
2. Apply the selected class multiplier before per-channel rounding. Preserve existing epic and faction multiplication and the less-than-one-integrity threshold.
3. Use the light multiplier as the safe fallback for unknown class identifiers.
4. Keep quote and payment on the same computation. Preserve compensation, corrupt-channel recovery, and insufficient-funds refusal.
5. Charge built and living hulls of the same class identically.
6. Add no persistent records, damage-source tracking, cargo valuation, equipment, controls, or rescue mechanisms.
7. Change no shipyard prices, trader income, damage mechanics, or hull maxima.

Likely write set: `src/game/state.js`, `src/systems/station.js`, one bounded repair regression script, and the applicable backlog/decision documentation. This recommendation document itself makes none of those implementation changes.

## Acceptance and verification after implementation

- Assert every exact example in the selected table, including separate channel rounding.
- Verify modifier composition, unknown-class fallback, keeper compensation, corrupt channels, intact channels, and insufficient funds.
- Exercise the actual repair action and verify the displayed quote equals the deducted credits, channels are restored, and repeated repair does not charge again.
- Exercise the repair desk in a live browser, including an unaffordable bill and a successful repair; inspect console errors.
- Run `npm run build` and `npm run test:boot` without weakening their assertions.
- Repeat a trader route with a recorded damage event and report actual repair share of route earnings. Include a low-credit light pilot and a larger hull before declaring the tuning successful.

Security exposure is unchanged by the proposed arithmetic-only mechanism. Review should focus on finite values, safe class lookup, quote/payment parity, and regression of the existing recovery behavior. There is no migration; rollback would revert tuning and quote changes on a reviewed artifact. Merge and deployment authority remain with the existing project pipeline.

## Decision still needed

The owner should choose whether to adopt class-based pricing and the proposed 3x/3x/4x/5x/6x/8x table, or request a different target burden. A stronger loss target should be explicit before implementation. This document prepares that decision and does not claim #208 is resolved.
