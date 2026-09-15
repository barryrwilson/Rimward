# Issue #182 — delivery cargo must arrive with the ship (2026-09-15)

Branch `codex/issue-182-arrival-cargo`, built on master `56ba9237` (merge of
PR #191, issue #181). Implementation evidence only. Independent QA has not run;
nothing here is a QA PASS, a merge claim or a deployment claim.

## Outcome under test

Docking empty at a destination and buying that dock's own stock used to settle a
trade agreement and the unique `haul-provisions` consignment on the spot. Each
berth visit now takes one shared arrival manifest — the hold as it stood the
moment the hull berthed — and every unit that leaves the hold spends it down
through `removeCargo`, whatever took it. A trade row and the consignment must
find their units both aboard AND still on the manifest.

## Checks run

| Check | Command | Result |
| --- | --- | --- |
| Build | `npm run build` | pass, 7.79 s, bundle policy 569.14 KiB gzip |
| Full boot suite | `npm run test:boot` | `BOOT TEST PASS — no update errors` |
| Focused #182 | `npm run test:arrival-cargo` | `ISSUE-182 ARRIVAL CARGO OK` (A1–F2) |
| Boot pin #182 | `--boot-pin` inside `test:boot` | `wave182 arrival cargo: {... all true, "ran":true}` |
| Focused #181 | `npm run test:same-berth` | `ISSUE-181 SAME BERTH SETTLEMENT OK` |
| Live browser | `npm run test:arrival-cargo-live` | `arrival-cargo PASS`, `consoleErrors: []`, `exceptions: []` |
| Neighbouring focused suites | `test:two-gate-jobs`, `test:bulk-trade`, `test:market-liquidity`, `test:surrender-cargo`, `test:pirate-haul`, `test:dock-persistence`, `test:agent-desk`, `test:agent-gameplay`, `test:pod-receipts`, `test:miner-receipts`, `test:prize`, `test:hull-sale`, `test:derelict` | all pass |

Raw logs are kept outside the repository at
`C:/Users/barry/.codex/issue-182/` (`build.log`, `test-boot.log` — the first,
failing run, `test-boot2.log` — the passing run, `focus-*.log`, `live-probe.log`).

## Boot-suite failure found and the fixture repair

The first full `npm run test:boot` after the source change reported
`WAVE76 MSN FAIL` with exactly one false key:

```
wave76 msn: {... "completeReplace":true,"completePay":true,"completeAgain":false, ...}
```

`WAVE76`'s `completeAgain` pin asserts that a trade slot is replaced again on a
SECOND completion. Its fixture set the replacement row up and then did
`ctx.cargo.push({ commodity: 'refinedMetals', units: 5 })` **while already
berthed**, so under #182 the units were never on that berth's arrival manifest
and the delivery correctly refused to settle. The pin was failing on the new,
intended rule, not on a regression in what it pins.

The fixture was repaired, not weakened: the cargo is still pushed, and a
relaunch plus redock is added so the goods arrive with the ship before the
delivery tick runs (`scripts/boot-test.mjs`, `wave76 redock deliver again`).
Every `WAVE76` assertion — including `completeAgain` — is unchanged and now
passes. No pin was deleted, relaxed or skipped.

## Live browser evidence

`npm run test:arrival-cargo-live` (disposable Chromium, real systems frames).
Artifacts, copied outside the repository:

- `C:/Users/barry/.codex/issue-182/live-evidence/arrival-cargo/arrival-refused.png`
- `C:/Users/barry/.codex/issue-182/live-evidence/arrival-cargo/arrival-paid.png`
- `C:/Users/barry/.codex/issue-182/live-evidence/arrival-cargo/result.json`

Recorded readings from `result.json`:

- Locked quotes: `haul-provisions` 700, `trade-freehold-0` 2310,
  `trade-freehold-1` 700, `passenger-freehold-0` 350.
- Docked EMPTY at Veridian, bought 15 Provisions through the real market desk
  (`trade` action, `ok: true`), hold `15/20`.
- After 8 s of real delivery ticks: `statesAfterBuy: ["accepted","accepted","accepted","gone"]`
  — no cargo agreement settled; `paidForDocksideStock: 350`, which is the
  passenger fare alone (issue #181's party still disembarks in that berth).
  Credits idle-stable at `198835` over a further 4 s.
- Desk line rendered and in the viewport (`arrival-refused.png`):
  `Delivery unpaid — Provisions must arrive with the ship. Dockside stock bought
  here does not fill the run.`
- Same 15 Provisions carried in on a relaunch and redock: every remaining row
  settled in one berth, `paid: 3710` against `expectedPay: 3710`, hold spent,
  `flags.docked` still true (`arrival-paid.png`).
- `consoleErrors: []`, `exceptions: []`, `sourceStable: true`.

## Fixture disclosures

Both the focused test and the live probe are explicit fixtures, not
natural-flight benchmarks:

- The hull is placed at a safe berth and docked through the real dock path;
  there is no natural flight and no natural trip time.
- Cash, clock and hold contents are set directly; NPC ships are moved far away
  and `flags.combat` is cleared.
- Accepted rows are stamped with a disclosed `destSystem`, `commodity` and
  `need` so one arrival manifest is genuinely shared by several cargo rows.
- Everything the outcome depends on goes through public paths: the real accept
  path locks every quote, `stationDesk.trade` performs every purchase and sale,
  and the real throttled delivery tick performs every settlement. Payouts are
  asserted against the exact `payQuoted` each row locked at acceptance.
- `scripts/issue-182-arrival-cargo-test.mjs` covers: the empty-dock purchase
  (A1), the desk line (A2), twenty further delivery passes with no payout and no
  re-stamped notice (A3), a legitimate arrival paying each locked quote exactly
  once (B1), a part-bought top-up (C1), one manifest shared by competing rows
  with #181's consignment-first order intact (D1–D3), sell-then-rebuy (E1), and
  the berth scope of the manifest plus the absence of any save field (F1–F2).

## Known scope limitation

The manifest lives for one berth visit. It is taken at dock, dropped at launch,
and re-taken fresh on the next dock, so a redock re-reads the hold as it then
stands. A save reloaded while docked never runs the berth's dock path, so the
delivery tick takes a fresh manifest from the restored hold the same way: a
player who buys at the dock, saves and reloads inside that berth can still settle
the run. This follows from the narrow per-berth dock snapshot the coordinator
selected; carrying the fact across a launch or a reload would need broader
persisted provenance tracking, which is outside this issue's scope.

No new persisted field, save-schema change, UI surface, key or equipment SKU was
added.
