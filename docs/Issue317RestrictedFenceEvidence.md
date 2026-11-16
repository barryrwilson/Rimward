# Issue #317 — restricted-locker gate legibility and the fence sell verb

[Issue #317](https://github.com/barryrwilson/Rimward/issues/317).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is on branch
`dsh/issue-317-restricted-fence-sale` from master `d811e72a`. Build, the
focused suite, the affected station/agent regressions, the unchanged boot
suite, and a live browser probe pass locally. No independent QA, merge,
release or deployment is claimed.

## Outcome

The pirate playtest saw a restricted-cargo sale refused with token
`restricted` and no stated unlock, then allowed later once fear reached
`ECON.fear.tributeOpensAt`; the People desk's fence card had no sell row.
Delivered, copy/API surfacing only:

- The restricted refusal now names the live gate and every unlock: current
  fear against the tribute threshold, a burned Freehold name (standing below
  -25), or a fence's favor at the People desk. The dockmaster prefix is kept,
  so `deskNoticeToken` still returns `restricted` and the complete line still
  rides `error`.
- The market pane keeps the exact pinned `trade refused` span and adds a
  visible `closed — fear <fear>/<threshold>` reason, with the full gate line
  in the status/span titles. The market note states the same clause.
- `market.rows[].tradeAllowedReason` carries the same line when
  `tradeAllowed === false`; allowed rows omit the additive field.
- The People desk's fence card offers `Sell restricted cargo (<owned>)` when
  the player owns restricted components. It is an ordinary market sale of the
  player's own units (consignment excluded), hidden at zero, and refuses
  honestly through the new gate line while closed. `stationDesk.perform` /
  `act('stationAction')` classify that refusal as `ok:false`, token
  `restricted`, instead of reporting a refused sale as accepted.

No price tuning, no new SKU, no new persisted field, no new key/digit/gauge.
The public API stays at `VERSION` 2; `tradeAllowedReason` is additive within
v2 and absent when allowed.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/station.js` | Restricted gate helpers beside `lockerAllowed`; gate line in `tryTrade`, `previewBulkTrade`, market note and `peekTradeAvailability`; visible market refusal reason while keeping the pinned span; People-desk fence sell row; `PERFORM_REFUSALS` maps the gate notice to token `restricted`. |
| `src/game/agent-observe.js` | `marketBlock` copies the non-empty `tradeAllowedReason` onto refused rows only. |
| `scripts/issue-317-restricted-fence-test.mjs` | New focused suite (8 scenarios), `npm run test:restricted-fence`, appended to `test:boot`. |
| `scripts/issue-317-restricted-fence-live-probe.mjs` | New isolated Chromium probe, `npm run test:restricted-fence-live`. |
| `scripts/issue-203-205-209-test.mjs` | The #209 exact refusal pin becomes the stable prefix plus gate-clause shape; the issue-317 suite owns the exact copy pin. |
| `package.json` | Scripts and `test:boot` wiring. |
| `docs/AgentApiDesign.md` | Documents the named gate, `tradeAllowedReason`, and the fence sell row. |

Not changed on purpose: market prices, stock tuning, fence favor economics,
SKUs, save fields, command names, event vocabulary and `VERSION`. The market
screen note still falls past `station.view`'s pre-existing 120-row cap, but the
new row reason is captured there; the cap was not changed.

## Acceptance

| Criterion | Evidence |
|---|---|
| The restricted refusal says what unlocks it | Focused scenario 1 pins the exact line and token `restricted` with zero mutation; live probe B reads the same line from the public receipt. |
| A live probe shows the gate and the unlock | `npm run test:restricted-fence-live` PASS: fear 38 row/refusal/People click refused; fear 40 row allowed, fence row sold all 4 for 2,088 UU; screenshots captured. |

## Verification record (2026-11-16)

- `npm run test:restricted-fence` — PASS, 8/8 scenarios.
- `node --import ./scripts/with-css-stub.mjs scripts/issue-203-205-209-test.mjs` — PASS (all checks).
- `npm run test:market-pane`, `test:bulk-trade`, `test:fence-marker`, `test:market-liquidity` — PASS.
- `npm run build` — PASS.
- `npm run test:boot` — PASS, exit 0 (includes the new focused suite).
- `npm run test:boot` — PASS, exit 0; the durable log at
  `out/issue-317-live/test-boot.log` records 186 PASS lines with the focused
  suite as the final leg and no assertion or npm error.
- Live browser probe — verdict PASS; 0 console errors, 0 exceptions, 0 network
  failures, source stable, Vite/CDP ports closed. Disclosed berth/fear/standing/
  cargo/credits fixtures; every action runs the real public
  `act`/`stationAction` path. Source hash
  `b29ac51f23474891a078a53bd06e949a3d29292703b29aaf6ee40c351d710e56`
  (dirty-worktree git src identity, start = end).
  - Market row at fear 38: `tradeAllowed:false`, exact gate reason, visible
    `closed — fear 38/40`; `trade` refused token `restricted` with the full
    line and no resource mutation.
  - People fence row at fear 38: `Sell restricted cargo (4)` visible; click and
    `stationAction` both refused honestly with token `restricted`.
  - Fear 40: row allowed with no `tradeAllowedReason`; the fence row sold all
    4 units (`Sold 4 Restricted components for 2088 UU.`), credits
    5000 → 7088, hold empty, row gone.
  - Screenshots: `out/issue-317-live/restricted-fence/market-row-refused.png`,
    `people-fence-card.png`, `market-row-allowed.png`, `fence-sold-all.png`.
    Raw evidence is local and intentionally not committed.

## Evidence limits

- The probe uses explicit fixtures for berth placement, fear, Freehold
  standing, cargo and credits; it does not claim natural flight or campaign
  progression. The natural playtest path that reached fear 40 is the reported
  incident this change explains.
- The UI is verified through the real rendered DOM, public observations and
  receipts. Screenshots are captured for human review; this run did not claim
  a pixel-level visual audit.
- `tradeAllowedReason` is a derived observation string, not saved state.
