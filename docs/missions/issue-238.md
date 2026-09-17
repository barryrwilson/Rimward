# Issue #238 — optional complete dossier

**Current stage: implementation and acceptance verified; ready for PR.** Final runtime is `7838c9e21c7231dda5c77a853ebaefbf0e618edf`. Build, unchanged boot, independent code/security review, natural deep/reload/payment and supplemental native UI all pass. Earlier entries below are retained history. No merge, deployment or everyday-checkout update has occurred.

- Outcome: offer a deliberate, informed choice between filing earned basic intelligence and pursuing a riskier complete dossier on the existing named courier mission.
- Source of truth: https://github.com/barryrwilson/Rimward/issues/238; tracking #233.
- Base: a983981b73fa6ae99999a003a92a8848d8df89ee (merged #236/#237).
- Branch/worktree: codex/issue-238-deep-dossier; C:/Projects/WebSim-issue-238.
- Stage: specification; Sloane owns docs/Issue238DeepDossierDesign.md. Clawd coordinates; independent Claude Quinn reviews the pinned specification.
- Authority: owner requested the next issue using orchestrator. Scope is #238 only. No merge or deployment authority is inferred.
- Scope: one opt-in deep observation opportunity, accepted basic/deep prices, readable risk and escape, explicit surviving evidence, strict JSON-safe state and API distinctions, single employer settlement.
- Non-goals: #234 docking repair, #239 contacts/equipment, #240 double agents, broad stealth/economy changes, new keys/gauges/SKUs.
- Acceptance: all seven acceptance items in #238; before coding, resolve state/reward design and proposed playtest tuning against current code.
- Current evidence: everyday checkout clean at base; no open PR; #236/#237 merged. Existing graph available in everyday checkout; fresh worktree has no generated graph.
- Next gate: finish bounded specification and independently review immutable artifact. Implementation and its security/regression/browser gates follow only after the contract is settled.
- Rollback: design-only changes are reversible. Runtime rollout must retain compatible save backups and exact prior artifact; no runtime rollout has occurred.

## Specification handoff

Sloane froze the design at commit `79050a1fec8bebe7199f145a478ad1e2c801fedf`.
Independent Claude Quinn review is running against that immutable artifact.
Rex/Fiona is preparing the exact implementation write set while review runs;
source edits remain gated on resolution of concrete design findings.
The proposed deep tuning is 30 additional seconds, +50% frozen pay and 4/s
suspicion within 400 units; these are playtest hypotheses, not measured balance.
Dependency setup completed with `npm ci --ignore-scripts --no-audit --no-fund`.
The installed Graft tool generated the isolated worktree index successfully.

## Independent design verdict

Claude Quinn returned PASS for specification readiness on
`79050a1fec8bebe7199f145a478ad1e2c801fedf` (raw report:
`out/issue-238/design-review-1.md`). It checked baseline integration claims,
risk arithmetic, state/settlement boundaries and strict save requirements.
Coverage limit: the reviewer could not fetch the issue because its read-only
allowlist did not include gh; the seven verbatim acceptance criteria are being
added with traceability. This is a documentary gap, not a gameplay PASS.

Rex/Fiona now owns implementation. Carry-forward cautions include early parsing
and strict rejection of malformed accepted basic pay, literal v1 validation,
preserving the posted deep quote at acceptance, separate deep exposure handling,
target loss after basic, explicit API availability and the undocked shared action.
No merge or deployment has occurred or is authorized by this verdict.

## Candidate 8628d4a — failed verification, fixes in progress

Rex committed runtime `8628d4afa4bda114947ee54e825d918f89a48750`.
Seven new focused contract groups, 52 base courier groups, schema, API hardening
and abandonment checks passed (out/issue-238/focused-*.log). Build passed.
Unchanged boot FAILED one contract: wave85 chart `noPrevent:false`.
The original boot log is retained as boot-8628d4a.log; do not weaken its test.

Natural live exposure verified B=420 exactly once (350 to 770 credits), repeat
settlement and ordinary post-payment reload, with empty console/network errors.
Source/harness identities were stable and dedicated processes/ports cleaned.
Evidence: out/issue-238/live-8628d4a-attempt-1/courier-exposure/.

Natural deep failed after ordinary autosave/reload: pursuing evidence 20.1414/30
restored at t246.423, then target-lost closed it 0.4031 seconds later despite a
living selected courier before reload. This is unresolved product evidence,
not a successful deep run. Narrow 768px chart terms were also overlapped by
Agent play. Exact observations/screenshots are summarized in
out/issue-238/live-8628d4a-attempt-1/live-findings.md.

Rex is fixing in isolated C:/Projects/WebSim-issue-238-ui-fix while the original
source stays pinned for independent review. UI-only interim commit f250be0c
has not been integrated or visually verified. Required next gate: diagnose
restore lifecycle, preserve genuine permanent-loss rules, pin the defect, fix
chart native input without weakening boot, then review/test a new exact artifact.
All old-candidate natural runners are stopped and cleaned. Basic/layout and
successful deep/reload acceptance remain open. No merge/deployment.

## Independent implementation review and reproduced restore defect

Claude Quinn/Knox returned FAIL on 8628d4a. Raw report:
out/issue-238/implementation-review-1.md. Blocking/major findings are unchanged
boot failure, blanket button key suppression breaking Escape/chart close, and
shared terms advertising unavailable/complete dossier attempts. Additional
bounded corrections: per-row notice ownership, throttled single-read chart
projection, null-safe Jobs terms, a discoverable focused-test npm command and
correct binding fallback. All sent to Rex; no independent PASS is claimed.

Rex reproduced the natural reload failure with actual cold-restore update order:
world.blockadeCasualty can select the temporarily non-live mission courier before
traffic recreates its ship and records a permanent death. The new regression
fails before the correction. Approved narrow write-set expansion: exclude
mission-owned records from the abstract blockade casualty selector in world.js,
while keeping live combat and genuine loss behavior and unrelated-trader
casualties intact. This is not permission for broad invulnerability or a route
rewrite. New candidate review must cover that ownership boundary explicitly.

## Candidate b199fe69 — automated and independent code gates pass

Integrated UI and lifecycle repairs as runtime
`b199fe698877d6b82c0dbde9c8f5d51564be306b`.
`npm run build` and the full unchanged `npm run test:boot` both exited 0;
raw logs build-b199fe6.log and boot-b199fe6.log are retained under out/issue-238.
Claude Quinn/Knox code/security re-review PASS is retained as
implementation-review-2.md. It closed all eight earlier findings and verified
the world.js ownership guard, release behavior and genuine-loss negatives.
This is not natural browser acceptance.

Fresh live checks confirm native Tab/Escape/chart-key/Space opt-in behavior and
readable desktop/768px layout. Two attempt1 journeys remain incomplete: the
deep controller did not sustain cooling outside420 for its22-second dwell;
basic could not locate its courier after observed combat. Neither is a PASS
or proof of permanent destruction. Fresh attempt2 uses only an ignored
controller correction: ordinary flight to a static point above the published
rendezvous. Game code/timers/traffic are unchanged.

Re-review notes A-C prompted final bounded polish in a separate worktree:
let Space keyup reach the unconditional release owner; remove duplicated
closed-state consequences/raw enum copy; deduplicate Jobs terms. No balance,
evidence, persistence or settlement behavior change is intended. D (world.js
scope expansion) is recorded above and independently reviewed. E (ordinary
trader abstract death during restore) is pre-existing, outside #238, and is
parked without creating a new external issue.

## Final automated/review gates and natural reload checkpoint

Final runtime `7838c9e21c7231dda5c77a853ebaefbf0e618edf` now has independent
Claude Quinn/Knox final code/security PASS (implementation-review-3.md), no open
findings, nine dossier groups and 52 base courier groups passing. Root's final
build and unchanged full boot both exited 0 (build-7838c9e.log,
boot-7838c9e.log). Source is frozen. Fetched origin/master remains base
`a983981b73fa6ae99999a003a92a8848d8df89ee`.

Final natural attempt2 has passed the previously failed reload boundary:
restored at t244.724 with the same partial evidence/quotes/deadline/grace,
detected courier again at t259.862 and reacquired at t261.090 without closure.
Read-only raw save snapshots and SHA256 manifests are retained. It is still
collecting the remaining dossier; no complete D payout is claimed at this
checkpoint. Final source runtime is unchanged during the run.

## Final acceptance handoff

Final natural complete dossier and supplemental UI fixture PASS are recorded in
out/issue-238/FINAL-LIVE-VERIFICATION.md and the committed
[implementation evidence](../Issue238ImplementationReview.md). Natural D=630
paid once (350 to 980), including warning, physical withdrawal/cooling, ordinary
pursuit reload/reacquisition and post-payment reload. Final native UI verifies
held-Space release, explicit end affecting only its row, repeated/malformed
refusals, remapped chart binding and single-copy Jobs agreement text. Source
and harness identities were stable; console/network checks and cleanup pass.
Root inspected final deep-ready, post-payment reload and multi-row/Jobs images.

The earlier scoped B=420 safe-basic and exposed-attempt journeys remain recorded
at their actual revisions and accepted by independent final review; no false
claim of rerunning those complete journeys on the final copy/input-only delta.
The base ordinary-trader casualty limitation and #234 stay outside this issue.

Next action: publish the reviewed branch and PR. Merge/deployment and everyday
checkout sync are not authorized or performed in this task. Retain previous
runtime plus a coherent pre-v2 save snapshot for downgrade rollback. Source
runtime stays at the independently reviewed and tested identity; final docs
commit changes only evidence/status.
