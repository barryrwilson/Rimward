# Issue #177 — fronted consignment cargo stays distinct from owned stock

Branch `codex/issue-177-consignment`. Builder record only: this document is the
durable evidence for the change and its checks. It is not an independent QA
PASS, a merge, a release or a deployment claim.

## Outcome

A ferry contract fronts its Provisions free on accept, so the hold can carry
goods the player does not own. Before this change one row of seven Provisions
read `7/20` with no distinction and every sell path — `Sell All`, the row
`−1`/`−5` buttons, the keyboard sells and the public `trade` action — offered
all seven. Selling them could leave the consignment short and unpaid.

Now the fronted units are named everywhere the hold is shown, and no public
sell path can consume them while the contract is active.

## Derivation, not a new persisted field

`src/game/consignment.js` derives the split from the live contract list:

- `FERRY_UNITS = 4` is the canonical fronted quantity. It is exported from this
  module and imported by `src/systems/station.js`, so the accept-time fronting,
  the hold reservation and the settlement demand cannot drift apart.
- The reservation counts `FERRY_UNITS` per accepted ferry contract and never
  the job row's mutable `need`: a row carrying `need = 1` would otherwise
  release three units that settlement still demands back. Duplicate board
  handles of one posting are counted once by `id`.
- The reservation is clamped to what is actually aboard, so a hold short of the
  consignment reports every remaining unit as consigned and none as owned.
- Nothing new is written to `ctx.cargo` or to the save. Accept, delivery, a
  short landing, a save and a reload all move the split with no migration.

## Player-visible split

| Surface | Reading with 4 fronted and 3 bought |
|---|---|
| Docked screen header | `CREDITS 19700 UU · HOLD 7/20 · 4 consigned` |
| Market pane HOLD cell | `7 (3 yours · 4 consigned)` |
| Bulk pane preview | `Held 7 (3 yours · 4 consigned)` |
| HUD cargo meter | `7/20 · 4 CONSIGNED` |
| `observe().world.cargo` | `{ commodity: 'provisions', units: 7, owned: 3, consigned: 4 }` |
| `observe().market.rows` | `hold 7`, `holdOwned 3`, `holdConsigned 4`, `sellMax 3` |

## Protected sell paths

- `tryTrade` is the single gate every sell path reaches (row buttons, `Q`/`W`,
  `A`/`S`, the bulk orders and the public `trade` action). It refuses with
  `Cannot sell: 4 Provisions are consigned to the factor — none of them are
  yours.`, token `unavailable`, with no cargo or credit movement.
- `previewBulkTrade` caps `sellMaxTotal` at the owned units, so `Sell All`
  offers three of seven and nothing of a consigned-only hold. `owned` joins the
  staleness comparison, so a consignment accepted mid-order stops the remainder
  for review.
- `peekTradeAvailability` reports the same `sellMax`, so the agent desk is not
  offered a sale the market will refuse.
- The market row `−1`/`−5` controls are rendered disabled whenever the quantity
  exceeds the owned units, with the `.market-actions .screen-btn:disabled`
  style the bulk pane already uses. The closure behind a disabled control still
  calls `tryTrade`, so a stale or scripted click is refused rather than paid.
  This also disables a sell of goods the player simply does not hold, which the
  market previously offered and then refused.

Settlement is unchanged: a short manifest at the named far station still leaves
the contract `accepted` and unpaid, consumes no cargo and writes no partial
save.

## Checks

| Check | Result |
|---|---|
| `node --import ./scripts/with-css-stub.mjs scripts/issue-177-consignment-test.mjs` | PASS — 16 focused cases |
| `npm run build` | PASS |
| `npm run test:boot` | PASS, unchanged |
| `npm run test:market-liquidity` (#55) | PASS |
| `npm run test:bulk-trade` (#56) | PASS |
| `npm run test:dock-persistence` (#70/#71) | PASS, fixtures repaired (below) |
| `npm run test:agent-schema` | PASS |
| `npm run test:agent-desk` | PASS |
| `npm run test:agent-hardening` | PASS |
| `npm run test:refusal-tokens` | PASS |
| `npm run test:agent-gameplay` | PASS |
| `node scripts/issue-177-consignment-live-probe.mjs` | PASS, 0 console errors, 0 exceptions |

Focused cases cover the mixed 3 owned + 4 consigned hold, a consigned-only
hold, a hold short of the consignment, an unrelated commodity keeping its full
sell ceiling, a JSON round trip of the saved state, delivery, re-acceptance, a
short landing, the row button availability at 3 owned and at 0 owned, and a job
row whose `need` has drifted below the canonical fronting.

### Repaired #71 fixtures

`scripts/issue-71-dock-persistence-test.mjs` sold the accepted consignment's
own fronted units in three places — the behaviour this issue forbids. The
intent of each case is preserved, not weakened:

- the storage-failure and encounter-gate cases now buy the unit they sell, so
  each still exercises a completed ordinary sale;
- the short-manifest case states the loss directly (one unit gone away from the
  dock) instead of selling the consignment down to reach it.

### Live browser verification

`scripts/issue-177-consignment-live-probe.mjs` reuses the disposable Chromium
harness (`scripts/issue-74-live-harness.mjs`). It docks at Freehold, accepts
the consignment, buys three Provisions, then reads the real rendered DOM and
clicks the native controls with trusted input events.

Recorded from the run (`out/issue-177-live/consignment/result.json`, not
committed; renderer ANGLE/Intel D3D11):

- header `CREDITS 19700 UU · HOLD 7/20 · 4 consigned`;
- market row HOLD `7 (3 yours · 4 consigned)`, buttons `+1` live, `+5` live,
  `−1` live, `−5` disabled;
- `Sell All` fills `3` and its preview reads `Held 7 (3 yours · 4 consigned)`;
  confirming it leaves `{ units: 4, owned: 0, consigned: 4 }`;
- with nothing owned, HOLD reads `4 (0 yours · 4 consigned)`, both sell
  controls are disabled, a real click on the disabled `−1` pays nothing,
  `Sell All` fills `0` and the bulk `Sell` control is disabled;
- the public `trade` sell returns `ok:false`, token `unavailable`, with credits
  and cargo unchanged;
- zero console errors and zero exceptions.

Screenshots are written beside the result JSON under `out/` and are not
committed.

## Risks and parked follow-ups

- A `haul`, `trade` or `mining` delivery at its own destination still consumes
  matching commodities from the hold without checking the consignment, so a
  haul delivered while a ferry is aboard can leave the consignment short. That
  is a delivery-ordering question, not a sale, and the contract stays open and
  unpaid rather than failing silently. It is left for a separate issue.
- Disabling a sell control for goods the player does not hold is a small
  behaviour change beyond Provisions; it removes a control that could only ever
  refuse.
