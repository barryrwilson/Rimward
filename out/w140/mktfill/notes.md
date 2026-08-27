# Wave 140 PR1 Agent market fill notes

**Verdict:** DONE. Observe market rows keep `posted` and add finite `fillBuy` / `fillSell` from live `tradeFillUnit` via `ctx.stationDesk.peekFillUnit`. Partial merge not used.

## Method

- Graph resolve: `proceed_unmodeled` (no binding workflow).
- Did not edit `docs/AgentApiDesign.md`, wishlist, `PROGRESS.md`, `tryTrade`, `renderMarket`, Digit map, TRADE offset 5, `state.js`.
- Schema: no market-row note existed; comment-only skip.
- Did not steal desk wrap / subtitle / badge CSS.
- Did not start Vite or Chrome.

## Live cites

- `src/game/agent-observe.js` `peekFill` / `marketBlock`
- `src/systems/station.js` `tradeFillUnit` **4692–4714**; `peekFillUnit` on `stationDesk`
- `src/game/agent-schema.js` `reservedName` **147–149**

## Pins

- Hardening: `posted === 100`; omit fill without peek; fillBuy 125 + posted 100 with peek; omit on NaN and on throw.
- Boot WAVE140 MKTFILL: Digit 1 market; fill matches peek; Vigil hermit `fillBuy !== posted`; jobs/undock `market === null`; TRADE offset 5; no throw.

## Reviews

- Security: no HIGH/CRITICAL. MEDIUM: harness peek key residual. LOW: test trust write restored in `finally`.
- Code: no Blocker/Major. Minor: outer loop catch vs per-row.
- UI: not applicable (JSON observe).

## Ports / processes

None started. No LISTENING claim.
