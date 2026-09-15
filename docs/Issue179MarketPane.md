# Issue 179 — market pane: haul buy-in, stock caps, stale refusal, transient spikes

- Outcome: the market and jobs panes state the costs, caps and transient prices
  the 2026-09-14 trading playtest had the player deduce by arithmetic or by
  running into a refusal.
- Owner/stage: Rex (Claude Code harness), implementation only. Quinn reviews the
  exact commit independently. No merge, push or deployment authority is claimed
  or exercised.
- Branch/base: `codex/issue-179-market-pane`, from `origin/master` `afd4294c`.
- Likely files named by the issue: `src/systems/station.js`, `src/game/market.js`
  (both changed, plus `src/ui/screens.css` for the two new text classes).

## Owner decision recorded

Issue item 4 offered two options. **The owner chose to label temporary market
events and explicitly NOT to slow price reversion.** No economy tuning constant
was touched: `WALK_RATE`, `PRESSURE_PULL`, `PRICE_BAND` and `EVENT_DURATION` are
unchanged. The change is read-only labelling.

## Scope

1. An offered haul posting states its actual buy-in at this dock and whether the
   player can cover it, before acceptance.
2. Every finite market stock row — including the 20-capacity rows — states its
   capacity, and the pane states the refill.
3. A bulk-trade refusal does not outlive the condition that caused it.
4. An event-driven quote is labelled transient on the row it moved.

## Non-goals

- No change to price reversion speed, price band, event duration or any economy
  tuning value.
- No new persisted save field. The event label reads the existing transient
  module state in `market.js`; nothing new is written to `world`.
- No new keys, digits, gauges, equipment SKUs or kit mutation.
- No change to the issue #56 bulk confirmation architecture: a displayed OFFER
  stays immutable, and `executeBulk` keeps its live re-check.
- No change to the finite-stock model from issue #91.

## What still applies on current code

Confirmed against this worktree before editing, because the issue predates the
consignment (#177) and dock-receipt (#196) waves.

| Issue item | Status on `afd4294c` | Action |
| --- | --- | --- |
| 1 — haul buy-in | **Still open.** `renderJobs` stated only the reward: `Haul 5 Provisions to <dest> — pays <n> UU (140% of buy cost)`. Nothing named the 5 × unit-price buy-in or the purse. | Implemented. |
| 2 — 20-capacity rows show capacity/refill | **Superseded.** Issue #91 (`cb6465ee`) already renders `available/capacity` in a `.market-stock` cell on *every* commodity row, and the pane already states `Stock replenishes in simulation time; empty to full in 20 minutes.` Verified headless and live: 12/12 rows, caps 20 and 160. | No source change. Locked by regression coverage so it cannot silently regress. |
| 3 — stale hold notice | **Still open, and reproduced exactly.** See below. | Implemented. |
| 4 — transient spike | **Still open.** `applyEventPressure` kept pressure in module state that nothing surfaced, so a spike and a baseline quote looked identical on the pane. | Implemented (label, not slower reversion). |

### Item 3 reproduction on unmodified code

Docked at Freehold, hold capacity 20, empty:

1. Bulk-buy 20 Provisions. The hold is full.
2. Edit the quantity to 5. The pane reads `Buy: 100 UU/unit · Only 0 hold units free.`
3. Sell the hold back through the market ROW buttons, which never rebuild the
   bulk order. The hold is now empty.
4. The pane still reads `Buy: 100 UU/unit · Only 0 hold units free.`

Root cause: `ui.bulk.buy` / `ui.bulk.sell` are frozen preview objects created by
`editBulk`. They are the confirmation tokens, and only `editBulk` replaces them.
Any state change made outside the bulk pane — a row trade, a sale, a stock
refill — leaves the displayed refusal describing a condition that no longer
exists. The playtest saw the same line after a refusal that was really about
stock.

## Implementation

### 1. Haul buy-in (`src/systems/station.js`)

New closure helper `haulBuyInFor(job)`, rendered as a `job-reward job-buy-in`
line under the haul reward line, only while the posting is not accepted:

```
Buy-in here: 5 Provisions at 100 UU = 500 UU. You hold 350 UU — 150 UU short.
Buy-in here: 5 Provisions at 100 UU = 500 UU. You hold 20000 UU — covered.
Buy-in: none — 5 Provisions already yours in the hold.
```

- Units the player already owns cut the required buy. Consigned units (#177) do
  not, because they are not his to deliver.
- A stock or hold-room limit is appended when either is short, because either
  stops the run as hard as an empty purse.
- The unit price is the same `tradeFillUnit('provisions', true)` the market row
  and the agent desk quote, so the stated buy-in is the price actually charged.
- Read-only and wrapped: a throwing quote returns `''` rather than taking down
  the jobs board.

### 2. Finite stock rows

No source change. Regression coverage added instead: one stock cell per
commodity, each cell's denominator equal to `supplyCapacity(key)`, both the 20
and 160 caps present, and the refill sentence present.

### 3. Stale bulk refusal (`src/systems/station.js`, `renderBulk`)

An OK intent is displayed exactly as before — frozen quote, frozen total, frozen
label — preserving the issue #56 B6/B9 contract that a displayed offer must not
drift under the player's press. A REFUSED intent carries no offer to protect, so
it now re-states the live reason each render:

- live state still refuses → the current reason, e.g. `Only 15 units available.`
- live state now allows it → `Buy: 100 UU/unit · open again at 500 UU — re-enter
  the quantity to confirm.`, with the button labelled `Buy Provisions — re-enter
  quantity`.

The frozen token remains the gate: the button stays disabled until the player
re-enters a quantity, and `executeBulk` still refuses anything its live re-check
does not match. No trade path, autosave path or order-chunking path changed.

### 4. Transient event label (`src/game/market.js`, `src/systems/station.js`)

`market.js` gains `kindBySystem`, written and deleted exactly alongside the
existing `pressureBySystem`, and one new read-only export:

```js
marketEventAt(systemId) // null, or frozen { kind, label, keys: { key: 1 | -1 } }
```

`renderMarket` calls it once per render and adds a `.market-event` line to each
pushed row (`blockade up — temporary`, `glut down — temporary`), plus one pane
note explaining that the price drifts back to this dock's baseline when the
event passes.

Lifetime is deliberately identical to the pressure it names: written by
`applyEventPressure`, deleted by the `clear` call at `endEvent`, never
persisted. After a restore the pressure is re-rolled, so no label appears — and
no pull exists either, so the quote really is free to revert. A kind that writes
no pressure never labels a row.

All new strings go through the existing `h()` helper, which assigns
`textContent`. No `innerHTML`.

## Acceptance criteria

1. An offered haul states its buy-in, unit price, purse and shortfall before
   acceptance; an accepted haul does not. — headless + live PASS
2. Every commodity row states `available/capacity`, both caps appear, and the
   pane states the refill time. — headless + live PASS
3. A hold-full bulk refusal disappears once the hold empties, and the pane says
   how to confirm again; an OK offer still does not drift. — headless + live PASS
4. A live event labels every row it pushes with its direction and the word
   `temporary`, plus a pane note; both end with the event; another system is not
   labelled. — headless + live PASS
5. Build, boot and focused market/haul regressions pass. — PASS
6. A real browser flow passes with zero console errors or exceptions. — PASS
7. No economy tuning, no new save field, no new keys or gauges. — held

## Verification (2026-09-15)

Run from `C:/Projects/WebSim-issue-179`. `node_modules` is a junction to the
main checkout; `package-lock.json` is byte-identical, so the dependency tree is
the locked one.

| Command | Result |
| --- | --- |
| `npm run build` | PASS |
| `npm run test:boot` | PASS — `BOOT TEST PASS — no update errors` |
| `npm run test:market-pane` (new) | PASS — 13 scenarios |
| `npm run test:bulk-trade` (#56) | PASS |
| `npm run test:market-liquidity` (#55) | PASS |
| `npm run test:price-memory` (#174) | PASS |
| `npm run test:two-gate-jobs` (#176) | PASS |
| `npm run test:same-berth` (#181) | PASS |
| `npm run test:arrival-cargo` (#182) | PASS |
| `npm run test:market-pane-live` (new) | PASS |

Live browser evidence: disposable headless Chromium via the shared issue-74
harness, loopback only, own profile, `verdict: PASS`, `consoleErrors: []`,
`exceptions: 0`, source hash stable across the run, Chrome and Vite both stopped
and both loopback ports closed. Nine product checks, trusted mouse and keyboard
input against the real Jobs and Market panes. Screenshots captured for the
buy-in line, the finite stock table, the hold refusal, the cleared refusal and
the event label.

Disclosed live fixtures (the probe sets `result.fixture = true`): berth
placement and NPC displacement, a credits fixture (350, then 20000), and one
event-pressure fixture. The last calls `applyEventPressure` on the same module
instance the running pane reads, through the dev server, rather than waiting for
the random world-event timer or adding a production hook. It is feature
verification, not evidence of a naturally scheduled world event.

Raw logs, `result.json` and screenshots: `C:/Projects/WebSim/out/issue-179-evidence/`
(untracked, outside the worktree, per the repository rule on ad-hoc evidence).

## Known limitations and review focus

- A frozen OK offer can still describe a hold or price that has since moved —
  for example the Sell line after the hold is emptied elsewhere. That is the
  deliberate issue #56 B6/B9 immutability contract, and pressing it produces
  `Cannot trade: market state changed.` This change did not extend to it,
  because loosening it would let a press land on a different deal from the one
  displayed. If the owner wants the OK side refreshed too, that is a separate
  decision against #56, not a bug in this one.
- The event label disappears at event end while the price is still drifting
  back. That follows directly from the owner's decision: label the cause while
  it acts, do not slow the reversion.
- `marketEventAt` reads transient module state. A reloaded save shows no label.
  That is correct, not a gap: the reloaded game also has no pressure.
- Review focus: the `renderBulk` refusal path must not have weakened the
  confirmation gate (`confirm.disabled` and `executeBulk` are unchanged); the
  haul buy-in must quote the same unit price the trade actually charges; the
  new export must not leak a mutable reference to `pressureBySystem`.

## Handoff / rollback

Implementation only. Rollback is a revert of the single bounded commit; there is
no migration, no save-format change and no persisted field, so older and newer
builds read the same saves. Independent Codex QA is required before any PR,
merge or deployment.
