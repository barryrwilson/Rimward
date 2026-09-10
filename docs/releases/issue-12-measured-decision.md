# Issue #12 measured release decision — approved

The mission duplicate fix is implemented at
`061dd79fea91d9fc34688909868c2e5591f6edd6`. Its focused census, complete boot
test, and live station-board checks pass. Independent Claude source, security
and behavior review **PASS** on `5c69b85a08efe2705f1b400e1390a64257cd16db`
fulfilled the owner's conditional approval recorded below. That review
separately recorded the then-unapproved release limits as **HOLD**; source QA
did not waive those limits. The owner's approved exact byte exception is now
activated, and the measured startup exception is recorded separately here.

The [production performance policy](../ProductionPerformanceBudget.md)
requires a measured owner-approved exception when byte or startup limits are
exceeded. The previous issue #11 approval covers a different exact artifact.
Global limits, the matcher, and the browser dependency audit are unchanged.
Only the exact artifact exception descriptor moves from issue #11 to issue #12.

| Measure | Candidate | Existing limit / comparison |
| --- | ---: | --- |
| Minified JavaScript | 1,825,869 bytes | 1,800,000 limit; +914 versus issue #11 |
| Gzip JavaScript | 545,409 bytes | 537,600 limit; +311 versus issue #11 |
| Cold-title median | 9,722.9 ms | 8,000 ms limit |
| Cold-title slowest | 10,735.9 ms | 8,000 ms limit |
| Browser dependencies | PASS | `three` only |

Five cache-disabled production starts took **7,695.5, 9,722.9, 10,735.9,
10,516.3, and 7,479.7 ms**. Three exceeded the startup target. Every title was
visible, focused, and ready; all runs had zero page, console, and network
errors. Chrome 152.0.7977.76 used Intel UHD/D3D11 on the local Windows
i5-12450HX workstation. CPU utilization was not controlled, so these timings
do not establish that the small source change caused the overrun.

The candidate was emitted diagnostically with the unchanged production
transforms. The diagnostic audit recorded the byte failure and retained the
browser dependency boundary. **Before approval, ordinary `npm run build` failed
the byte gate**; diagnostic output was not a passing build. After the exact
descriptor activation, **ordinary build and bundle reporting pass** against
the same chunk filename, hash and measured byte counts; the `three`-only
browser boundary also passes. Logs are retained in
`out/issue-12-evidence/approved-build.log` and `approved-bundle-report.log`
outside this worktree. Direct measurement of the emitted chunk confirms
1,825,869 / 545,409 bytes and the exact SHA256 below. Initial command-sandbox launches
failed with GPU access denied before a usable page. Retrying the identical
harness outside that command sandbox left Chrome's own sandbox/GPU settings
unchanged and produced the five timings above. All owned processes and ports
were closed, and source/artifact stability checks passed.

## Exact artifact

- Runtime source SHA256:
  `d92f394200164ec91b737a891dba709eb92950ac6001867dac03926ecfc02440`
- Pre-approval source/public/config/package/policy census SHA256 (the approved
  descriptor edit changes policy, but does not change runtime or emitted files):
  `bcc800853ad03b526b4b44854790f52e8b8907dffaa2655eccd4279580e3e0a1`
- Sole generated JavaScript chunk: `assets/index-d7TmuHz9.js`
- Chunk SHA256:
  `22df21f974e428bbaf84e43ed22f4ea60727b40e8514cc87c0e223ed8dbde03a`
- Complete 447-file artifact manifest SHA256:
  `0f6ff63a73485df293eda0f4c89681f938a2a5a96b19f347f07e47b22d503f02`

Every emitted file was rechecked after startup. Copied public JavaScript is
unchanged from the prior approved artifact. Raw results, hashes, logs, and
manifest are retained locally in `out/issue-12-evidence/release/` outside this
worktree; behavior evidence is described in
[the mission census](../Issue12MissionDuplicateCensus.md).

## Owner decision and fulfilled condition

On 2026-09-09 the owner replied exactly **“Approve on claude review”** to the
request authorizing scoped source/test/document and verification-evidence
transfer to Claude and, if that review passes, approval of this exact
JavaScript artifact's measured bytes and, separately, its measured cold-start
overrun. The coordinating task clarified that this was conditional approval
upon passing Claude review. The condition is fulfilled by Claude's source,
security and behavior **PASS** on the exact review artifact
`5c69b85a08efe2705f1b400e1390a64257cd16db`; raw verdict:
`C:/Projects/WebSim/out/issue-12-evidence/QA-SOURCE.md`.

**Byte approval:** only the exact filename, SHA256 and minified/gzip totals
listed above are approved: 1,825,869 / 545,409 bytes, an increase of 914 / 311
bytes from the prior issue #11 artifact. `APPROVED_BYTE_EXCEPTION` references
this record. Its existing exact-match checks remain unchanged; future changed
artifacts gain no allowance.

**Separate startup approval:** the owner accepts this candidate's five measured
starts, including the 9,722.9 ms median and 10,735.9 ms maximum. The 8,000 ms
global target remains unchanged and **was not met** in three of five samples.
This is a scoped measured exception, not a performance improvement or a claim
that the startup gate passed numerically. Byte approval alone does not waive
startup; the owner's conditional decision explicitly covers both measures.

Runtime, tests, dependency audit and global budgets are unchanged by activation.
The resulting policy artifact receives a separate independent Claude review.
No publication, merge, deployment, or issue closure is claimed or authorized
by this decision.
