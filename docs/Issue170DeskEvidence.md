# Agent desk and burner implementation evidence (#170, #171, #178)

Implementation base: `0991593bd905d00451b9f7d2b5f58eea737d3ac2`.
Branch: `codex/agent-api-desk`. This is builder evidence, not an independent QA verdict.

## Final behavior

- `acceptJob`, `trade`, `repairAll`, and `feed` require their existing public API service pane. Closed-pane refusals now explain which service to open. Desk-owner refusal tokens take precedence over notice classification; missing feedback gets `no-service` plus a short explanation. Launch still propagates named clearance holds.
- `undock` directly launches from any service pane when clearance is available, closes the pane, and clears its service selection. A blocked corridor keeps the berth and its existing named refusal.
- `jobs.offers` contains only offered records admitted by the station owner's `boardJobs` rules: local origins, explicit unique relays, and standing gates. Accepted work remains in `jobs.active` in flight and at every dock. The unique completed ferry's internal return-leg acceptance remains compatible.
- Haul/trade quotes use one station-owned calculation. The most recent rendered offer is retained until the next actual DOM redraw; the structured capture builder cannot silently refresh it behind the displayed card. Acceptance locks that displayed amount in existing `payQuoted`, and the acceptance receipt states it. No new persistent field was added. Accepted legacy haul fallback calculation remains unchanged.
- Raw `afterburner` queues the controls-owned edge without acquiring flee. Combat retreat burner behavior is unchanged. The active-burner dock refusal and queued-edge dock handoff require the companion controls/autopilot integration described below.

## Verification

Passing targeted commands:

```text
node scripts/agent-api-hardening-test.mjs
node scripts/agent-schema-test.mjs
node --import ./scripts/with-css-stub.mjs scripts/issue-170-desk-test.mjs
node --import ./scripts/with-css-stub.mjs scripts/issue-71-dock-persistence-test.mjs
node --import ./scripts/with-css-stub.mjs scripts/issue-120-retreat-burner-test.mjs
node --import ./scripts/with-css-stub.mjs scripts/issue-12-mission-census.mjs
node scripts/issue-170-desk-live.mjs
```

Hardening pins run against the original three source files failed 13 assertions, including flee ownership, immediate dock approach, absent owner-token propagation, closed service explanations, and foreign offers. Original hardening suite passed before changes.

The station fixture test verifies real rendered DOM, local/foreign and relay offers, generated-system board identity, duplicate refusal, eight service-pane launches, and both generic trade and unique provisions-haul quotes. A Veridian trade quote changed from 945 to 1204 after an explicit price fixture; the card, offer row, accepted receipt and agreement matched. A further price change left accepted pay fixed. An observation between price mutation and actual redraw preserves the displayed amount.

The #71 persistence regression caught and prompted removal of an over-strict new internal Jobs-pane guard, and preservation of the completed-ferry return-leg path. The full targeted #71 regression now passes. The existing #120 retreat-burner test passes all ten groups. The mission census passed 101 systems across three seeds, including acceptance/refill and legacy-agreement preservation.

The final disposable Chromium run used the Intel UHD Graphics / Direct3D11 renderer. It exercised public API desk flows with explicit safe-berth, foreign-posting and price fixtures. This is real browser/system execution, not a claim of natural flight or native mouse input. Its generic refined-metals offer changed 1848 -> 2107 and the receipt read `Accepted: Haul Refined metals — pays 2107 UU.`. Market-pane launch succeeded. Console errors and exceptions were empty. Source hash stayed `0d9e69ca3b00624af87b695bbac375db4041445688425231a0284f06d6697a20`; both owned Vite/CDP ports closed. Raw local evidence is under `out/issue-170-live-final/desk/` and is intentionally not committed. An earlier probe exposed the price fixture being overwritten by the real market random walk between asynchronous calls; the final probe applies and inspects that fixture synchronously, without changing production timing.

## Required integration pin

```text
node --import ./scripts/with-css-stub.mjs scripts/issue-171-burner-test.mjs
```

This exercises actual controls/autopilot/ship updates. On this isolated branch, it proves the raw pulse reaches the ship and starts the burner with no flee ownership, then fails on the existing autopilot `afterburner` refusal. The companion cruise/controls worker owns that gate and queued-edge handoff. After integration this command must pass both an already-active burner handoff and a same-turn queued pulse + approach. The root coordinator also owns build, boot and final integrated live verification, shared API/backlog documentation and independent QA.

## Self-review

Security checklist: no secrets, new network endpoints, new privileges, dynamic HTML, or persistent schema fields. Public commands still cross existing station/controls owners and preserve opt-in/phase gates. Offers fail closed without an available board owner. Refusals do not mutate job acceptance or launch state. No HIGH/CRITICAL security findings.

Code checklist: shared station filtering and quotes avoid duplicated business rules; displayed quote cache is session-only, rebuilt on actual board render, and checked against the current dock. Existing completed-ferry persistence and retreat burner regression coverage pass. No HIGH/CRITICAL code findings remain in the owned paths. The #171 cross-worker integration dependency is explicit rather than reported as completed. Design specialist audit skipped: no new layout or controls were introduced; actual rendered desk flows were verified in Chromium.

## Independent QA repair (follow-up to `3e5c8807`)

Independent review found one stale quote path: a Jobs card cached during an earlier berth visit still priced `observe()` at the same station before Jobs was reopened. The new real-owner regression reproduced the exact failure before the fix (`945` before Jobs versus `1785` after Jobs). The quote cache now clears when the ship docks and when a launch succeeds. It is consulted only while the Jobs pane is actually visible. A hidden Jobs card cannot govern a Market/root-view quote; the existing within-visible-visit stability assertion remains unchanged and passes.

Targeted lifecycle evidence now passes:

- Hidden pane: previous displayed `945`, Market observation `1246`, reopened Jobs `1246`.
- Same-station revisit: observation before opening Jobs `1785`, rendered quote `1785`.
- Further redraw/acceptance and accepted-pay immutability still pass.
- The previous validated-origin fallback is restored: invalid non-null `originSystem` values fall back to the current dock rather than suppressing its applicable pricing modifiers.

The coordinator's integrated boot found three failed notice assertions in the otherwise passing #70 duplicate-ferry group. The generic accepted-row rejection bypassed the existing ferry handler, losing its `already aboard` explanation in both the receipt and rendered notice. Already-accepted ferry/passenger requests now reach their existing early refusal handlers. New focused tests exercise same-dock and third-dock ferry refusals through public API and retained internal handles, checking the named obligation in receipt and DOM and unchanged cargo/agreement. Passenger duplicate `not-offered` / `already aboard` behavior is also preserved. No boot assertion was edited or weakened. The coordinator owns the final full boot rerun.

Passing commands after repair:

```text
node --import ./scripts/with-css-stub.mjs scripts/issue-170-desk-test.mjs
node --import ./scripts/with-css-stub.mjs scripts/issue-71-dock-persistence-test.mjs
node scripts/agent-api-hardening-test.mjs
node scripts/issue-170-desk-live.mjs
```

The new live run is at `out/issue-170-qa-repair-live/desk/result.json`. Intel GPU Chromium passed with no console errors or exceptions, source hash stable at `be842f93b6745b81f923bd34aff21ea797420711a909839afe373bd16210bf43`, and both owned ports closed. Its hidden-pane quote was `1841 -> 2149` (Market and redraw both `2149`); its new-berth quote was `2681` before Jobs, on the displayed card and in the acceptance receipt. `revisit-accepted-haul.png` is scrolled to the exact Refined-metals row and visibly shows `pays 2681 UU`; the builder inspected it. Complete structured evidence remains alongside that screenshot.

Other review findings: shared API documentation and reserved flee-channel description remain coordinator-owned. Keeping `no-service` for wrong panes is intentional compatibility, with a specific service-opening explanation. Completed jobs remain observable through the existing session `jobState` events: `completeJob` calls `noteJobOutcome(..., 'done')`; delivery families record `delivered` and pay, with lapse/escape outcomes where applicable. `agent-api.watchJobs` additionally reports accepted-to-done/failed transitions or removal as `closed`. These paths and the existing schema ring-retention pins are unchanged; terminal jobs need not masquerade as acceptable offers.

Self-review of this repair found no unresolved HIGH/CRITICAL security or code issues. Quote invalidation is session-only and happens after successful launch ownership checks; held launches retain the current visible board. Existing ferry/passenger refusal handlers preserve their pre-mutation checks. Independent re-review of this new commit is still required.
