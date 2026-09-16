# Issue #208 repair balance — decision and implementation record

Status: implemented on the isolated `codex/issue-208-repair-balance` candidate,
pending independent QA. This document was the proposal; the owner selected the
recommended mechanism and table, and it is now the mission record for what was
built, what was verified, and what remains unproven.

Prepared as a proposal against `07e2fafa2a9312cc46d2ec8dec44d9fd51bd80d6`;
implemented against `aebde852e548d456e072cecccd518936e0eb1e0a` for
[issue #208](https://github.com/barryrwilson/Rimward/issues/208).

## The decision

The owner's comment on the issue is the ruling:

> Repair should scale with Hull Class and damage taken. Not cargo value.

Damage taken is the amount of integrity missing, which the existing bill already
prices linearly. No nonlinear severity band or surcharge was added. The change
is the hull-class multiplier, applied to that linear bill before the per-channel
rounding. Cargo is not read, and no damage source is tracked.

The selected table is the one proposed below: light 3x, cutter 3x, heavy 4x,
ace 5x, freighter 6x, frigate 8x. These are authored tuning choices for a
balance playtest, not a formula derived from cargo capacity or replacement
value, and not validated long-run economy outcomes.

## What was implemented

`src/game/state.js` now owns both tables and the lookup:

```js
export const REPAIR_RATES = Object.freeze({ hull: 0.9, screen: 0.3, shell: 0.5, engine: 0.6 });
export const REPAIR_CLASS_MULT = Object.freeze({
  light: 3, cutter: 3, heavy: 4, ace: 5, freighter: 6, frigate: 8,
});
export function repairClassMultiplier(classKey) { /* own-property lookup, light fallback */ }
```

`src/systems/station.js` no longer authors a rate table. `repairCost` imports
both and computes each channel as:

```text
ceil(missing integrity * channel rate * epic multiplier * faction multiplier * class multiplier)
```

The total is still the sum of the separately rounded channel items. The channel
rates, the less-than-one-integrity skip, the corrupt-channel flag, the keeper
comp, the epic and faction composition order (epic first, faction second) and
the all-or-nothing payment are unchanged. Quote and payment remain the same
function, so the rendered total is by construction the amount deducted.

`repairAll`'s corruption-recovery baseline was also made own-property-safe:

```js
const baseClass = Object.prototype.hasOwnProperty.call(SHIP_CLASSES, p.classKey) ? p.classKey : 'light';
```

The previous truthiness test accepted inherited names. A hull stamped
`constructor`, `__proto__`, `toString` or `hasOwnProperty` was priced at the
light rate but then re-trued against `SHIP_CLASSES['constructor']`, which has no
`hull` or `shield`, so the refit that charged for the fix left the maxima
non-finite. Both sides of the desk now fall back to `light` by the same rule.
This defect was found in QA preparation for this change and is fixed here
because the unknown-class fallback is part of this issue's contract.

No persisted field, save migration, equipment, control, key, SKU, hull, price,
damage mechanic or hull maximum was added or changed.

### Write set

| File | Change |
| --- | --- |
| `src/game/state.js` | `REPAIR_RATES`, `REPAIR_CLASS_MULT`, `repairClassMultiplier` |
| `src/systems/station.js` | imports the tuning; applies the class factor before each ceil; own-property recovery baseline |
| `scripts/issue-208-repair-balance-test.mjs` | new focused regression, 109 pins |
| `scripts/issue-208-repair-balance-live-probe.mjs` | new live Chromium probe |
| `scripts/boot-test.mjs` | the two existing repair-price expectations now read the class multiplier from the authored table |
| `package.json` | `test:repair-balance`, `test:repair-balance-live` |
| `docs/REMAINING-WORK.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md` | #208 status |

The boot expectations were updated, not weakened. They still assert the exact
itemized total, the exact charge, the epic/faction composition, the authored-six
guard and the made-whole result; the class factor is read live from
`repairClassMultiplier(ctx.player.classKey)` rather than re-typed as a constant,
so a future table change cannot silently pass them.

## Current behavior and evidence at the proposal base

At the verified base, `src/systems/station.js:220` defined the channel rates in
UU per integrity: hull 0.9, screen 0.3, shell 0.5, engine 0.6. The quote
computed each item as `ceil(missing integrity * channel rate * epic * faction)`
and summed the separately rounded items. Channels missing less than one
integrity were skipped. Non-finite channels were flagged as corrupt rather than
billed. Keeper compensation zeroed every item and the total. The payment action
recomputed that quote, refused an unaffordable repair, and otherwise deducted
the total and restored the channels.

Class integrity is authored at `src/game/state.js` `SHIP_CLASSES`. Larger ships
already incurred larger bills for the same percentage damage because their
maximum integrity is larger. Yard list prices are in `src/game/shipyard.js`;
reputation discounts apply separately.

Issue #208 reports a light-hull repair quote of 88 UU after piracy and credits
rising from 350 to 8,458 UU over four legs in about 15 simulation minutes. The
issue names `docs/playtests/2026-09-15-trader-playtest.md`, but that file was
absent from the inspected checkout. Income and the observed quote are therefore
issue-sourced observations, not independently reproduced playtest findings.

Related [issue #186](https://github.com/barryrwilson/Rimward/issues/186) records
the trader capital plateau and an owner decision to improve visibility of the
larger-hull path. That decision did not choose repair tuning for #208.

## The selected table and its exact arithmetic

Every row below uses exactly 62% of class hull integrity missing, exactly 70% of
class engine integrity missing, intact screen and shell, no keeper compensation,
and a combined existing epic/faction multiplier of exactly 0.9. The 0.9 modifier
is applied once; no additional discount is assumed.

```text
before = ceil(hullMax * 0.62 * 0.9 * 0.9)
       + ceil(engineMax * 0.70 * 0.6 * 0.9)

after  = ceil(hullMax * 0.62 * 0.9 * 0.9 * classMultiplier)
       + ceil(engineMax * 0.70 * 0.6 * 0.9 * classMultiplier)
```

| Class | Hull max | Engine max | Yard list UU | Multiplier | Before UU | After UU |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Light | 100 | 100 | 8,000 | 3x | 89 | 265 |
| Cutter | 80 | 90 | 11,000 | 3x | 76 | 224 |
| Heavy | 160 | 120 | 20,000 | 4x | 127 | 504 |
| Ace | 140 | 120 | 28,000 | 5x | 117 | 579 |
| Freighter | 220 | 140 | 24,000 | 6x | 164 | 981 |
| Frigate | 900 | 300 | 80,000 | 8x | 566 | 4,524 |

For the light example, the previous hull item was `ceil(50.22) = 51`, the engine
item `ceil(37.8) = 38`, total 89 UU. At 3x those items are `ceil(150.66) = 151`
and `ceil(113.4) = 114`, total 265 UU. Multiplying the already rounded total
would give 267 and is not what was built; the focused regression asserts that
distinction directly.

The issue's displayed 62 and 70 missing integrity do not establish the exact
underlying fractional values. The exact-input 89 UU reconstruction therefore does
not prove the reported 88 UU quote was wrong. These are controlled arithmetic
comparisons, not replays of that session.

## Acceptance and verification

### Focused regression — `npm run test:repair-balance`

109 pins, 0 failures, exit 0. One real boot; the quote asserted is the rendered
REPAIR BAYS pane text and the payment asserted is the real `1 — Repair all`
button. It covers:

- the tuning lives in `state.js` and `station.js` authors no rate table;
- `repairClassMultiplier` over the six authored keys, unknown keys, absent keys
  and the inherited names `__proto__`, `constructor`, `toString`,
  `hasOwnProperty`;
- the rendered itemized quote for all six classes at modifier 1;
- every row of the table above at a 0.9 modifier, item by item, including the
  pre-change totals, and intact channels billed nothing;
- the rounding order — 265, not 267;
- a channel under one integrity down still skipped and still free, including on
  the dearest class;
- a corrupt channel flagged, not billed, and re-trued by the refit;
- keeper compensation zeroing every line and the total;
- an unaffordable bill refused with nothing taken and the damage intact;
- quote/payment parity at the exact affordability boundary, a whole hull
  afterwards, and a second repair charging nothing;
- a living hull billed identically to a built hull of the same class;
- an unauthored player class paying the light rate;
- a full hold of valuable cargo not moving the bill by one UU;
- the unknown-class contract through the *payment* path: for `constructor`,
  `__proto__`, `toString`, `hasOwnProperty` and an unknown key, each with a
  genuinely scrambled channel, the bill is the light rate, exactly the quote is
  taken, every maximum is re-trued from the light baseline and none is left NaN.

A negative control was run: reverting only the `repairAll` baseline lookup to
the previous truthiness test fails 13 of those pins with `screenMax` left
non-finite, so the new coverage is not vacuous.

### Live browser probe — `npm run test:repair-balance-live`

Disposable loopback-only Chromium, declared seed, real WebGL renderer, verdict
PASS with zero console errors and zero uncaught exceptions. It exercises the
real pane and the real button with trusted mouse input:

- the rendered light quote at 62% hull / 70% engine: `hull — 62 integrity down ·
  168 UU`, `engine — 70 integrity down · 126 UU`, `Yard total: 294 UU`, and the
  button repeating 294; intact channels billed nothing;
- a low-credit light pilot one UU short: refused with `Not enough UU for the
  yard.`, purse untouched, channels still exactly as damaged;
- payment parity at exactly 294 UU: purse to zero, every channel whole, and the
  repaired hull quoted nothing on re-open;
- a keeper comp against a 1,500 UU purse: every line and the total zero, nothing
  taken, still made whole;
- the larger hull: `737 + 353 = 1090 UU`, refused whole at 1,089 UU, and exactly
  1,090 UU taken at 5,000 UU;
- the same proportional damage costing 3.71x more on the freighter than on the
  light.

### Measured trader earnings

Two legs were flown in that same live session. The buys, the flights and the
sales are real: a real market desk transaction, a real plotted route flown by
the real autopilot to a real berth, and a real sale at the destination counter.

| Leg | Route | Starting capital | Cargo | Bound by | Gross revenue | Net profit |
| --- | --- | --- | --- | --- | ---: | ---: |
| A | Freehold → Veridian | the 350 UU the game gave the pilot | 1 unit slag iron @179 | purse | 238 UU | 59 UU |
| B | Veridian → Freehold | declared 20,000 UU fixture | 20 units refined metals @180 | hold capacity | 5,020 UU | 1,420 UU |

Against those measured legs, the 294 UU light bill for a 62%/70% strip is about
4.98x leg A's net profit and about 0.21x leg B's. Read plainly: a stripped
starter cannot pay for the damage out of the leg that earned it and must fly
several more, while a trader who already has stock money absorbs it out of one
leg. That is the intended shape of the change, and it is two legs on one seed,
not a campaign.

### Build and boot

`npm run build` passes. `npm run test:boot` is being captured independently by
QA on the immutable artifact so its full output and true exit code are recorded
there; the two repair expectations inside it were updated to read the class
multiplier and are not weakened.

## Limitations

- The damage in every check is a disclosed integrity fixture. No pirate fought
  the player in the verified runs, so this is not a natural-combat replay and
  does not reproduce the session the issue reported.
- Leg B's starting capital is a declared fixture. The revenue it produced is
  real; the decision to hand the pilot 20,000 UU is not something the run
  earned.
- Two legs on one seed establish an order of magnitude, not an economy. Route,
  spread, stock and event pressure are seed-specific. Longitudinal balance —
  whether 3x/6x is the right burden over a full campaign, across careers, and
  against job payouts and hull prices — is unproven and is a limitation of this
  artifact, not deferred work hidden inside it.
- The multipliers raise costs for every career flying those classes, not only
  traders. A combat pilot in an ace now pays 5x for the same damage.
- 265 UU (or 294 UU at an unmodified yard) remains below the 350 UU starting
  purse for this particular damage pattern, but heavier damage or a poorer pilot
  can still face an unaffordable bill. No rescue subsidy, partial repair or
  affordability guarantee was added; that remains out of scope.
- The issue's own 88 UU observation and 8,458 UU income figure were not
  independently reproduced.

## Alternatives considered

| Mechanism | Benefit | Limitation |
| --- | --- | --- |
| Explicit class multipliers — selected | Predictable, independently tunable, small implementation scope | Raises costs for every career using that class; requires balance testing |
| Flat global increase | Smallest implementation and easy to explain | Less control over large-hull running costs |
| Percentage of hull purchase price | Connects repair to asset value | Couples repair tuning to shipyard pricing; needs a defined damage weighting |
| Current cargo value | Connects a bill to valuable cargo | Ruled out by the owner; selling before repair changes the bill |
| Cargo value captured at damage time | Avoids unloading avoidance | Ruled out by the owner; needs new history across saves, sales and hull changes |
| Combat-only surcharge | Targets piracy and combat losses | Needs reliable damage-source accounting and persistence semantics; broadens scope |

The implemented mechanism preserves career-independent physical repair pricing.

## Security and rollback

The mechanism is arithmetic only, so exposure is unchanged. The review-relevant
surface is finite values, the safe class lookup on both the price and recovery
paths, quote/payment parity and the preserved recovery behavior — all of which
carry pins above. There is no migration and no new persisted field, so rollback
is reverting the tuning and quote changes on a reviewed artifact. Merge and
deployment authority remain with the existing project pipeline; this candidate
is handed to independent QA, not merged.
