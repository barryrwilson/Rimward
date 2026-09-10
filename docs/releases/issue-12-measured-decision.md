# Issue #12 measured release decision — pending owner approval

The mission duplicate fix is implemented at
`061dd79fea91d9fc34688909868c2e5591f6edd6`. Its focused census, complete boot
test, and live station-board checks pass. Independent review is recorded in
the coordinating task's evidence. This document requests a decision; it does
not grant approval or activate an exception.

The [production performance policy](../ProductionPerformanceBudget.md)
requires a measured owner-approved exception when byte or startup limits are
exceeded. The previous issue #11 approval covers a different exact artifact.
Global limits, the matcher, and the current exception descriptor are unchanged.

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
browser dependency boundary. **Ordinary `npm run build` fails the byte gate**;
diagnostic output is not a passing build. Initial command-sandbox launches
failed with GPU access denied before a usable page. Retrying the identical
harness outside that command sandbox left Chrome's own sandbox/GPU settings
unchanged and produced the five timings above. All owned processes and ports
were closed, and source/artifact stability checks passed.

## Exact artifact

- Runtime source SHA256:
  `d92f394200164ec91b737a891dba709eb92950ac6001867dac03926ecfc02440`
- Complete source/public/config/package/policy census SHA256:
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

## Decision requested

Approve this exact JavaScript artifact's measured bytes and, separately, this
candidate's measured cold-start overrun. Neither approval would raise the
global limits or permit future changed artifacts. Byte approval alone would
not waive startup. No publication, merge, deployment, or issue closure is
claimed or authorized by this pending decision.
