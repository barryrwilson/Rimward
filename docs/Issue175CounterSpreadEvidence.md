# Issue #175 — commodity counter spread

## Mission and acceptance

- Source: [issue #175](https://github.com/barryrwilson/Rimward/issues/175),
  owner comment choosing Option B; coordinator accepted a 5% spread.
- Owner/stage: Rex (Codex builder), builder checks passed, ready for independent
  Claude QA is the next gate. No merge or deployment is claimed.
- Base: `8c87becfd372036ab70484a73c60c4846eec097f`;
  branch: `codex/issue-175-counter-spread`.
- Scope: commodity counter fills, existing spread regression/live probes and
  the two boot price expectations affected by the approved math change.
  No other issue is included. No save fields, keys, equipment, browser
  authority, agent schema or archive/data-trade pricing changes.
- Acceptance: sell is `min(raw sell, floor(rounded buy * 95 / 100))`;
  buy and raw modifier chains stay intact; panel, observation, receipts and
  actual credits agree; same-counter unchanged-quote round trips lose UU;
  meaningful inter-system trade remains profitable; build, boot and live
  browser verification pass.

## Implementation

`ECON.counterSellPercent` in `src/game/state.js` owns the tuning. The existing
shared `tradeFillUnit` applies it after computing the full raw sale and rounded
buy quote. Thus an ordinary 100 UU buy yields at most 95 UU on sale, while a
200/170 UU below-par service stays 200/170. Rounding down preserves a cost even
at the 1 UU boundary (1 buy / 0 sell). This is a cap, so existing service,
standing, epic, hermit and fixer modifiers can still produce lower offers.

## Builder verification

Commands ran locally on 2026-09-15. Raw evidence is retained under the ignored
`out/issue-175/` directory in the implementation worktree.

- `node --import ./scripts/with-css-stub.mjs scripts/issue-53-market-spread-test.mjs`:
  PASS (`market-spread.log`). Covers plain authored 100/95 pricing, premium and
  discount services, standing, epics, keeper waiver, fixer trust boundary,
  fractional/low source quotes, keyboard 1/5, public 1/5/99 and chunked 160
  orders, quote/observation/receipt/cash equality and atomic stock refusals.
  The route fixture buys 99 at 85 UU and sells them at 285 UU: 19,800 UU profit.
- `npm run test:market-liquidity`: PASS (`liquidity.log`).
- `npm run test:bulk-trade`: PASS (`bulk.log`).
- `npm run build`: PASS (`build.log`), production bundle policy passed.
- `node scripts/issue-53-live-probe.mjs`: PASS (`live/probes.json` and
  `live/run.log`), 5/5 trade pins, zero console errors and zero uncaught
  exceptions. Real Chrome/Vite rendering shows 216 BUY / 205 SELL; browser
  keyboard event and public API round trips at 1/5/99/160 units match the
  displayed and observed fills and lose credits. Screenshot
  `live/01-auction-market.png` was visually inspected. This pre-existing probe
  uses explicitly labelled harness setup for resources, travel and fixed
  quotes; keyboard events are page-dispatched, not physical CDP keystrokes.
- Initial `npm run test:boot` exposed old hermit expectations that still capped
  sells at 100% of buy (`boot.log` and partial checkpoint
  `boot-before-expectation-update.log`). The displayed 248/235 quote was correct
  for Option B. Only the two affected expected payouts and their explanatory
  comments were updated to the new 95% cap; every boot assertion is retained.
  The original full run finished with exactly these two errors. Updated full
  `npm run test:boot`: PASS, exit 0, `BOOT TEST PASS — no update errors`
  (`boot-updated.log`). No assertions were removed or bypassed.
- `git diff --check`: PASS.

## Risks and handoff

The intended economic change is a minimum 5% counter loss; integer rounding
can make the percentage loss larger for cheap goods. Quotes may change over
simulation time, so the anti-loop claim applies to unchanged quotes, not to
buying before a later market increase. Cross-system profit depends on the
route's price difference covering the counter loss.

No migration is required. Reverting this candidate restores the prior 100%
cap. Independent QA must review the exact handed-off commit, including the
boot oracle changes, before any merge or deployment.
