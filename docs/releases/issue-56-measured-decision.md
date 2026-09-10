# Issue 56 measured release decision — owner approved; verification pending

Bulk trading is implemented and live-verified locally. The pre-approval normal
build failed the fixed byte limits, and one of five final startup runs exceeds
the fixed 8,000 ms target by 280 ms. On 2026-09-10, after independent review of
this record and the related issue-56 documents at `a0cac3b7`, the owner replied
**"Approved."** to both separate decisions below for the exact artifact: the
exact byte exception and, distinctly, the measured startup result. Only the exact
byte descriptor is activated, in `scripts/bundle-policy.mjs`. No publication,
merge or deployment is authorized by this document.
[Functional verification and limitations](../Issue56BulkTradingEvidence.md) are
recorded separately; independent source, CSS/probe and evidence reviews pass.

The owner separately approved the feature design and scoped Claude source/test/
report review; neither of those authorizes a changed production artifact or a
performance exception, and the byte approval does not imply the startup one. The
[production performance policy](../ProductionPerformanceBudget.md) requires a
measured owner-approved exception when byte or startup limits are exceeded. The
previously approved sun-drift descriptor identifies a different bundle and is no
longer the active byte exception. Global limits, exact matching and browser
dependency auditing remain unchanged, and the exception carries no future-growth
allowance or environment bypass.

| Measure | Final issue-56 candidate | Global limit | Previously approved sun-drift artifact | Growth |
| --- | ---: | ---: | ---: | ---: |
| Minified JavaScript | 1,835,632 bytes | 1,800,000 | 1,825,899 | 9,733 |
| Gzip JavaScript | 549,169 bytes | 537,600 | 545,419 | 3,750 |
| Cold-title median | 7,340.4 ms | 8,000 ms | — | — |
| Cold-title slowest | 8,280.0 ms | 8,000 ms | — | — |

Browser dependency auditing **passes** with `three` only. Final startup-02
measured **7,340.4; 7,596.8; 8,280.0; 6,240.6; and 6,971.5 ms**. One run exceeds
8,000 ms by **280 ms** and the raw startup gate is **FAIL**. This required an
explicit measured startup decision separate from the byte decision; byte
approval alone could not waive it. The owner approved that separate decision on
2026-09-10 for these five observations only. The raw startup gate remains
**FAIL**, the 8,000 ms limit and startup enforcement code are unchanged, the
8,280.0 ms observation is not relabelled, and the approval is not a reason to
rerun until green. The earlier startup-01 PASS is superseded by subsequent
runtime/UI fixes and is not used to approve this artifact.

The five starts used fresh isolated profiles, disabled browser cache, bypassed
service workers and the platform GPU. Timing is navigation-to-title-ready and
excludes browser launch. Operating-system filesystem cache and machine-wide CPU
load were not controlled; no causal attribution to the fix is established.
Every run recorded clean console/error and cache evidence, closed its owned
browser and port, and removed the temporary profile. The static server closed;
source, helper scripts and the complete artifact remained unchanged. No rerun
replaced the failed observation.

## Exact approved artifact

- Source/probe commit: `d0b032e9dc0d664b1e9c733ed4a3ea1db3bd2dad`.
- Base: `fb93a7c87f28fe37b4e73238b460cbf9ffa1cc07`.
- Runtime source SHA256:
  `48ed6b5539e33140512c37eff32537a5e94e30015107c686065bb17ddfec8333`.
- Production-source census SHA256 as measured **before** this activation:
  `88dd101c7d0e31d9f6ffa9310396a438596d94db199a84600f324cbe06d1e08b`.
  It describes the measured candidate's sources at `d34f2cc2`, unchanged at `d0b032e9`. Activating the
  descriptor edits `scripts/bundle-policy.mjs` itself, so the current full census
  is expected to differ; no current census equality is claimed. The runtime
  source SHA256 above is unchanged by this activation.
- Sole generated JavaScript chunk: `assets/index-BX1kNgWb.js`.
- Chunk SHA256:
  `4134afb68df39ea99131293313b96bd4e43b172782c3dd30c26620ea576e7416`.
- Exact individual and aggregate bytes: **1,835,632 minified / 549,169 gzip**.
- Complete 447-file artifact: 39,402,057 bytes; manifest SHA256
  `43318a9d5d9a846faef259318e049fc421cde07eb2f4fc064f99a77c8cf9e082`.

Candidate-02 retains production transforms, minification and chunking while
recording the unchanged byte-policy failure and emitting an isolated candidate.
This diagnostic emission is **not** a passing normal build. Raw results and the
full manifest are under
`C:/Projects/WebSim/out/issue-56-completion-evidence/release/candidate-02/`;
the final five startup runs are in adjacent `startup-02/result.json`.

## Owner decisions and remaining gates

Approval source: current Codex issue-56 task, 2026-09-10, after the owner
reviewed the five issue-56 documents at `a0cac3b74e7ac1c58207136d690a075c28ec7f27`.
The recorded reference is `Codex issue-56 owner approval of exact byte and
measured startup exceptions, 2026-09-10`.

1. **Byte decision — approved and activated.** Only the exact JavaScript artifact
   above is the replacement byte descriptor, accepting **9,733 additional
   minified bytes and 3,750 additional gzip bytes** over the previously approved
   sun-drift artifact. `APPROVED_BYTE_EXCEPTION` in `scripts/bundle-policy.mjs`
   now names `assets/index-BX1kNgWb.js`, its SHA256 and its exact aggregate and
   per-chunk 1,835,632 / 549,169 bytes. The whole-artifact matcher, the global
   1,800,000 / 537,600 limits, the browser dependency audit and every other
   export are unchanged; there is no future-growth allowance or environment
   bypass. Any changed artifact returns to the fixed limits and needs
   reassessment.
2. **Startup decision — approved, separately and distinctly.** The owner accepted
   only this artifact's five measured startup results, including the **8,280 ms
   run / 280 ms overrun**. This is a documentation-only acceptance: raw startup
   remains FAIL, no startup enforcement code changed, the observation is not
   relabelled, the 8,000 ms target is not raised, and no rerun may be used to
   replace the failed observation. It is not implied by the byte approval.

Full live verification and focused/boot checks pass; independent baseline,
activation-delta and final CSS/probe/evidence reviews pass. Feature verification
remains PASS. No performance exception approval is inferred from feature
approval, review authorization or these results.

Remaining gates, all **PENDING** and not claimed here:

- `npm run build` and `npm run bundle:report -- --json` on the activated tree.
- Exact equivalence of all 447 emitted files with the measured candidate by
  path, size and SHA256.
- Independent final policy review of the descriptor, authority and equivalence.

No overall release PASS, publication, PR, merge or deployment is claimed or
authorized by this document.

Rollback remains the prior approved application artifact on master
`fb93a7c87f28fe37b4e73238b460cbf9ffa1cc07`. No save migration is required. Completed
ordinary trades persisted before a stopped batch remain valid saved state.
