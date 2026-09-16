# Issue 223 — stable posted haul quotes

Mission: make rendered haul reward, acceptance notice, accepted card, and `observe().jobs` agree. Owner: Rex/Codex worker. Stage: implementation tested; independent QA pending. Specification: GitHub issue #223. Branch: `codex/issue-223-stable-haul-quote`, base `5abc9a68`.

## Scope and decision

Only station quote lifecycle, issue-specific regression/live probes, and this evidence record. No new persisted fields, API, economy tuning, payout math, controls or dependencies. The existing session quote cache now survives periodic board rebuilds. Explicit Jobs selection posts fresh prices; hidden-pane observations and berth revisits retain #178's current-price behavior. Accepted agreements still use existing JSON-safe `payQuoted`.

Root cause: every one-second station refresh cleared the drawn quote cache and repriced the board. Time between reading and accepting could silently replace the offer. Freezing the displayed posting across passive refreshes closes that gap, including JSON-cloned/restored-shaped job records (cache keys are IDs).

## Acceptance and evidence

- `node --import ./scripts/with-css-stub.mjs scripts/issue-223-haul-quote-test.mjs`: baseline FAIL, passive redraw changed 700 to 1211 UU; fixed PASS (immediate 2310, drift 700). Checks rendered card, API offer, acceptance receipt, accepted card, active reward/payQuoted, post-accept price drift, duplicate refusal, and restore-shaped JSON records.
- `node --import ./scripts/with-css-stub.mjs scripts/issue-170-desk-test.mjs`: PASS, including explicit redraw, hidden pane and berth revisit quote lifecycles.
- `node scripts/issue-223-haul-quote-live.mjs`: PASS using native Chromium/Intel D3D11, real game frames and public desk actions. Immediate Provisions quote 875 UU and drifted Refined metals quote 1848 UU each matched board, receipt and active agreement. Three simulation seconds crossed passive redraws. No console errors/exceptions; source hash stable; browser/server ports closed.
- `git diff --check`: PASS.

Live raw output/screenshot: local untracked `out/issue-223-live/haul-quote/result.json` and `accepted-stable-haul-quotes.png`. These are disposable verification artifacts, not committed. Harness uses disclosed safe-berth and price fixtures; no claim of natural flight. `ISSUE223_PORT` overrides default loopback port 5223; `ISSUE223_OUT` overrides evidence directory. The probe starts/stops its own server; it does not attach to an existing server.

## Review and handoff

Self-applied orchestrator security and code review checklists: no findings. Change only alters a numeric session cache, retains bounded pay calculation and text-safe rendering, adds no credentials, routes or external inputs. No designer audit: no layout/style changes. Builder review is not independent QA.

Next owner: orchestrator/Quinn to review exact worker commit, run combined build/boot and live checks, and register focused test/update backlog in integration scope. No build/full boot run by this worker per assignment. No push, PR, merge or deployment. Rollback: revert worker commit; no data migration. Required final gate: independent QA PASS on immutable integration commit and project definition-of-done checks.

## Independent QA follow-up

Claude review of `1ecfa049` returned FAIL: a quote survived contract retargeting,
and the public `peekJobReward(job, true)` force-refresh contract had changed.
The reported #176 regression was reproduced: C1 failed with 875 vs 875 UU.
The cache now validates kind, origin, destination, commodity and quantity before
reuse. Economic drift still preserves the same posting; a changed contract gets
a fresh quote. DOM draws remember quotes without forcing refresh; explicit owner
refresh retains its earlier semantics (the next draw shows the refreshed value).

Added a real passive board synchronization pin using an accepted-ferry fixture:
the same trade record demotes from two gates (2310 UU) to one (1848 UU), then
promotes after the seat is freed (2310 UU). Board/API agree at both transitions;
subsequent acceptance still agrees. The explicit owner refresh is also pinned.
Issue #176's full focused matrix, #223, and #170 pass after the fix. Final #223
immediate quote is now 2319 UU because the explicit-refresh fixture adds 1 UU to
the commodity price; the original baseline/fixed evidence above is historical.

Self-applied security/code review repeated: no new findings. Independent QA must
re-review the new artifact. Minor review notes remain bounded: no new legacy
`kind: haul` coverage (offered legacy row is retired by #206), and session cache
entries clear on board visits/berth changes rather than on every row retirement.

The live Chromium probe was rerun after the source fix: PASS, no console errors or exceptions, source stable, both loopback ports closed.
