# Issue #55 measured byte, startup and pacing exceptions

The owner explicitly approved these measured exceptions in the current Codex
task on **2026-09-09**, including Claude review of the resulting scoped
build-policy change. The approved decision was presented in
`out/issue-55-implementation-evidence/RELEASE-DECISION.md`; that local proposal
remains a historical pre-approval artifact. This note records the subsequent
approval relayed to the implementation worker by the coordinator.

Approval reference: **Codex task issue #55 owner approval, 2026-09-09**.
The approval covers only the exact byte candidate and the separately measured
startup and pacing results below. It does not increase global limits, approve
future changed artifacts, waive the browser dependency boundary, or authorize
publication, merge or deployment.

## Exact artifact and byte decision

Runtime source remains unchanged from
`e3761b7632e6d45120a5e60a6e83bf1de0c37059`. The policy activation starts from
documentation-only descendant `f54a72085bad9524328fa9e5510f46bf34286386` and
changes only the approved descriptor in `scripts/bundle-policy.mjs` and this
release note. Gameplay, tests, probes, the chunk-set matcher, dependency audit
and global budgets are unchanged.

| Field | Approved measurement |
|---|---|
| JavaScript file | `assets/index-BccXVvIY.js` |
| SHA256 | `e9bfd0927fc8a81a90ce185688e11e76a521a08541447410b1166dc13fc75c36` |
| Minified bytes | 1,824,513; 24,513 over the unchanged 1,800,000 limit |
| Gzip bytes | 545,005; 7,405 over the unchanged 537,600 limit |
| JavaScript chunk count | 1 |
| Whole-candidate manifest SHA256 | `ed327b41511e5491d873d797a3e11cb02aca59b6b566be10e26fb79a2f3a28fb` |
| Runtime source census SHA256 | `5b535d6214fb7d8adec062c278ebeaa703c9e3743dd9a4bff56dbef4cea604ff` |

The increase over the prior approved issue #62 artifact is 3,297 minified and
1,183 gzip bytes. Removing the feature's entire net addition would still
exceed both global limits. These measurements explain the decision; the
owner's explicit approval supplies the authority for the exception.

The existing matcher requires the complete chunk set, filenames, digests,
per-chunk sizes and aggregate sizes to match exactly. Any changed candidate
falls back to the fixed global budgets. Raw minified and gzip pass flags
remain false for this artifact; an applied exception is reported separately.
The unconditional browser dependency audit remains intact. The diagnostic
candidate passed it with only `three` in the browser package set.

The approval reference and release-note path are reviewed repository metadata.
The matcher checks their nonempty strings, not the note's existence, contents
or authenticity of owner approval. This note records the actual approval;
it does not claim the matcher independently verifies that decision.

## Separately approved startup exception

The owner accepted this exact candidate's measured startup result separately
from byte approval. The 8,000 ms requirement and probe method remain unchanged.

| Cold navigation | Title-ready time | Raw 8,000 ms result |
|---|---:|---|
| 1 | 6,858.4 ms | PASS |
| 2 | 8,276.5 ms | FAIL |
| 3 | 7,506.6 ms | PASS |
| 4 | 12,672.3 ms | FAIL |
| 5 | 13,815.4 ms | FAIL |

Median was **8,276.5 ms** and maximum **13,815.4 ms**. Three of five samples
exceed the limit, so the original startup result remains **FAIL**. Approval
permits this measured result for this candidate; it neither changes those
samples into passes nor establishes a new threshold. Page-error arrays were
empty. Source/candidate identities stayed stable and owned processes and
profiles were cleaned up. The startup manifest records the measurement
environment and method. Captured pre-document and untraced post-load delays
do not identify a cause or prove regression from the earlier issue #62 run.

## Separately accepted progression result

Three fresh earned-only campaigns purchased the 24,000 UU freighter at
554.523, 550.828 and 525.888 accumulated simulation seconds, with median
**9m10.8s**. Every run was faster than the approved 10–20-minute target. The
owner accepted this measured pacing for issue #55's fixed 160-bulk/20-other,
1,200-second replenishment design. The original target remains **not met**;
this acceptance does not redefine a target for future features.

The campaigns used a knowledgeable public-API pilot, include disclosed
interruption/recovery time, and do not estimate novice human sessions. No
artificial delay was inserted to make a fast run meet the target. A retained
full 160-unit delivery cost 16,000 UU and earned 18,720 UU, realizing 2,720 UU
profit. The [playtest record](../playtests/2026-09-09-issue-55-market-liquidity.md)
contains the campaign ledger, methods, failures and limitations.

## Review, residual limitations and remaining gates

Independent Claude review returned **source PASS and security PASS** on
`e3761b7632e6d45120a5e60a6e83bf1de0c37059`, with nonblocking findings. It was
static review of supplied code and tests: the reviewer executed no tests and
did not receive the later live evidence. Focused liquidity/spread tests, boot
and 12/12 isolated live checks passed in the separately attributed local
evidence. That source review did not approve these measured exceptions or
the subsequent policy activation.

The confirmed F1 corrupt-save degradation remains deferred: existing restore
accepts an unrelated malformed `world.contacts: null` field, after which the
new availability read can throw at Verge and truncate market observations to
zero rows. A valid restored fixture returns all twelve rows. Current internal
stock commit callers pass the correct capacity; hardening hypothetical future
callers is deferred. Flattened status-cell text lacks a separator between
legality and stock, while the inspected live UI was legible. None is claimed
fixed by this build-policy change.

The coordinator will run the ordinary build and bundle report, verify complete
emitted-artifact equivalence against the approved diagnostic candidate, and
record the results. **Independent Claude review of the exact policy change and
approval record is pending.** No post-activation build PASS, policy-review PASS,
publication, merge, deployment or issue closure is claimed here.

Raw evidence remains local under
`C:/Projects/WebSim/out/issue-55-implementation-evidence/`, including the
decision proposal, campaign records, test logs, source review and
`review/f1-f2-f4-disposition.md`. Candidate and startup manifests reside in the
implementation worktree's `out/issue-61-live/issue55-candidate-01/` and
`out/issue-61-live/issue55-startup-02/`. Earlier failures remain historical
evidence; owner approval is a separate subsequent decision.
