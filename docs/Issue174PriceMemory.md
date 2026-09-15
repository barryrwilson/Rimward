# Issue 174 — last-seen station prices

- Outcome: plan trade runs using historical prices observed at station markets.
- Owner/stage: Rex (Codex harness), implementation; Quinn (Claude) independently reviews the exact commit. No merge or deployment authority.
- Branch/base: codex/issue-174-price-memory, origin/master 79c018e1.
- Scope: snapshot actual SELL fill quotes on docked market rendering into JSON-safe world.priceMemory[systemId] = {at, prices}; toggle a remembered-price table in Market; chart hover readout; observation row parity; save normalization.
- Non-goals: live remote quotes, rumors, new trade mechanics, independent visit ledger, signed saves.

## Acceptance contract

1. Market viewing captures all actual local sell quotes, including counter spread and current station modifiers. No observer/query captures or updates memory.
2. Each commodity selects the highest captured price outside the current system, names its station and simulation-time age. Equal prices prefer the newer observation, then stable system order. Empty memory is explicit.
3. Chart hover lists only captured prices, with historical wording and age; unknown/unseen systems have no remembered prices. A memory entry is the evidence of a market visit (existing mystery.visited is landmark-only).
4. observe().market.rows[i].remembered is null or {systemId, station, sell, at, ageSeconds, age}, matching the pane's shared read model.
5. Captures and save snapshots are copies. Remote price and standing changes cannot revise history. Legacy restores clear previous timeline memory. Malformed records/unknown keys are discarded; future timestamps clamp to restored simulation time.
6. Build, boot, focused persistence/market/observation tests and disposable live browser flow pass, including DOM and console checks.

## Implementation decisions and boundaries

WORLD_FIELDS is in save.js in current code. Introduce one small price-memory model with a single guarded capture entrypoint and pure reads. Market uses a toggle and separate compact table to preserve trade controls and the existing six-column table. Chart uses textContent only. All prices explicitly mean historical SELL quotes, not a future guarantee.

## Handoff / rollback

Pending exact builder commit and evidence. Independent QA is required before any merge. Rollback reverts the bounded source commit; older builds ignore the additional save field. No production changes made.

## Builder verification (2026-09-15)

- `npm run build`: PASS (35.15 seconds).
- `npm run test:boot`: PASS, ends `BOOT TEST PASS — no update errors`.
- `npm run test:price-memory`: PASS, six scenario groups covering actual SELL capture, observer isolation, remote mutation, pane/API parity, copy/restore and malformed/legacy records.
- `npm run test:market-liquidity` and `npm run test:bulk-trade`: PASS.
- Raw local logs: `out/issue-174-verification/` (not committed).
- Live browser verification is pending. Early disposable Chromium runs verified both actual market visits and historical pane/API parity, but probe input/initialization needed correction (Enter must include CDP text, and berth fixtures must await system frames). No live PASS is claimed at this stage.
- Independent QA pending; implementation only. No merge, push or deployment performed.

Review focus: virtual station view capture must stay read-only; actual quotes must include counter spread/modifiers; legacy saves must not inherit another timeline; native toggle focus and chart readability require final browser evidence. Valid remembered entries are visit evidence, not tamper-proof provenance.
