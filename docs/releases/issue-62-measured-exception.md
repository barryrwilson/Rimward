# Issue #62 measured byte and startup exceptions

The owner explicitly approved the exact measured issue #62 byte exception and
its separately measured startup exception in the current Codex task on
**2026-09-09**, in response to the measured-exception decision linked as
`out/issue-62-evidence/RELEASE-DECISION.md`. The approved next steps are to run
the ordinary build and bundle report, verify the emitted candidate, and open
the issue #62 pull request. Merge and deployment remain separate actions.

Approval reference: **Codex task issue #62 owner approval, 2026-09-09**.
This decision covers only the two measured exceptions below. It does not
increase the global limits, approve future changed artifacts, or waive the
browser dependency boundary. Approval to run the earlier review cycle was
separate from this explicit release-exception approval.

The build-side descriptor was activated in
`f09a84cf28989bfc78bca3361099b7f626159858`. The subsequent ordinary build,
bundle report and complete 447-file artifact verification **PASS** with the
approved exact byte exception. Final independent policy/documentation review
is pending. No published, merged or deployed result is claimed.

## Exact artifact and byte decision

Runtime source remains unchanged from reviewed commit
`97c5ea1e04417fe43699c3079ae664a27f3938c5`. Subsequent work concerned the probe,
tests, and documentation. This activation changes only the build-side exact
descriptor and this release note; it changes no gameplay, probe, matcher,
dependency audit, or global budget.

| Field | Approved measurement |
|---|---|
| JavaScript file | `assets/index-BWMahgBB.js` |
| SHA256 | `5dfbb91fe97de176b5bba052f21e9a5e885d9e4c5ed4b431a927eebfea5f4831` |
| Minified bytes | 1,821,216; 21,216 over the unchanged 1,800,000 limit |
| Gzip bytes | 543,822; 6,222 over the unchanged 537,600 limit |
| JavaScript chunk count | 1 |
| Whole diagnostic candidate | 447 files |
| Canonical whole-candidate manifest SHA256 | `40c42c610d295ab2679c3ec8c69d58eb6b20f839b0b3c4b365635c781f5329d0` |
| Runtime source census SHA256 | `879dc6a3239e4180d44d1ccacc23a86185d7c2ede869f83b6d9d3e8f831816e3` |

The feature adds 9,730 minified bytes and 3,054 gzip bytes over the preceding
approved build. The inherited excess was 11,486 minified bytes and 3,168 gzip
bytes. Removing the feature's entire net addition would still exceed both
global limits. These facts explain the decision; they do not independently
authorize an exception.

Build and bundle report retain the same complete chunk-set matcher. A changed
filename, digest, exact per-chunk size, chunk count, or aggregate size returns
the candidate to the fixed global budgets. The approved over-budget bytes
still have false raw global pass flags, with the applied exception reported
separately. The browser dependency audit remains unconditional. The diagnostic
candidate passed that boundary with only `three` in the browser package set.

The approval reference and release-note path are reviewed repository metadata.
The existing matcher checks their nonempty strings, not note existence,
contents, or the authenticity of owner approval. This note records the actual
decision relayed by the coordinator before the descriptor update; it does not
claim the matcher independently verifies that decision.

## Separately approved startup exception

The owner also approved this exact candidate's measured startup result. This
is a documented release exception, separate from the byte matcher. The global
8,000 ms requirement and its measurement method remain unchanged.

| Cold navigation | Title-ready time | Raw 8,000 ms result |
|---|---:|---|
| 1 | 7,563.0 ms | PASS |
| 2 | 8,437.2 ms | FAIL |
| 3 | 7,237.2 ms | PASS |
| 4 | 8,687.3 ms | FAIL |
| 5 | 7,225.6 ms | PASS |

Median was 7,563.0 ms and maximum was 8,687.3 ms. Two of five samples failed,
so the original overall startup result remains a historical **FAIL**. The
owner approval permits that measured result for this candidate; it does not
reclassify the samples as passing or establish a new threshold.

Readiness required `__ctx`, document completion, and enabled Models, Settings,
and New Game controls. Each run used a fresh Chrome profile, disabled browser
caches, the recorded foreground/background settings, and the platform GPU.
The OS filesystem cache was not flushed. All error arrays were empty and all
browser processes exited. The recorded runtime source stayed stable. These
measurements do not establish that defense caused the slower samples.

## Review and remaining verification

Independent Claude review returned source, probe-methodology, and functional
acceptance **PASS** on `30c0b28090776a66554574c8ed3cd4ab29bc1ba4` after the G1
coverage finding was closed. Later commit
`95023918f4071ed9e8665fbafef4af684b564b93` corrected documentation only. That
review did not turn the historical production or startup failures into passes
and did not itself authorize these exceptions.

The [playtest record](../playtests/2026-09-09-issue-62-reactive-defense.md)
records functional evidence and its limitations. Local retained evidence
includes `out/issue-62-evidence/review-g1/CLAUDE-REVIEW.md`, `build-01.log`,
`diagnostic-candidate-01.log`, `production-startup-01.log`, and the measured
decision proposal. The proposal and earlier failures remain historical
artifacts; this note records the subsequent owner approval.

The coordinator ran the ordinary commands after activation:

| Check | Actual result | Retained evidence |
|---|---|---|
| `npm run build` | PASS; exact #62 exception explicitly reported | `approved-build-01.log` |
| `npm run bundle:report -- --json` | PASS through `bytePolicy.pass: true`; raw minified/gzip pass flags remain false | `approved-bundle-report-01.log` |
| Browser dependency boundary | PASS; package set contains only `three`, no unexpected packages or forbidden sources | Same bundle report |
| Complete emitted artifact equivalence | PASS; all 447 files, canonical manifest and runtime census match | `approved-artifact-verification-01.json` |

These files are retained in `C:/Projects/WebSim/out/issue-62-evidence/`.
The emitted single JavaScript file has exactly the approved name, digest and
1,821,216 / 543,822 byte sizes. Verification compared every emitted file,
not just JavaScript, with no missing, extra or mismatched files and no extra
directories. Its canonical manifest hash is
`40c42c610d295ab2679c3ec8c69d58eb6b20f839b0b3c4b365635c781f5329d0`;
the runtime source census remains
`879dc6a3239e4180d44d1ccacc23a86185d7c2ede869f83b6d9d3e8f831816e3`
before and after verification on `f09a84cf`. The executed verification script
`verify-approved.mjs` is identified by SHA256
`0f45ff4f0ce78399f4ce531e3ac487c4ed32c6994845341b9d556e320ea335ee`.

The original cold-start samples remain the historical raw FAIL documented
above and are covered by the separately approved exact startup exception;
no fresh startup PASS or changed threshold is claimed. The owner also
authorized opening the pull request. The remaining gate is independent
review of the exact policy activation, this evidence update and the F1–F5
documentation corrections in `95023918`; merge, deployment and issue closure
are separate and unperformed.
