# Issue 56 measured release decision — proposed, not approved

Bulk trading is implemented and live-verified locally. The normal production
build **fails** its unchanged byte policy, and one of five final startup runs
exceeds the fixed 8,000 ms target by 280 ms. This document proposes two separate
owner decisions for the exact artifact below. Neither exception is approved or
activated. No publication, merge or deployment is authorized by this document.
[Functional verification and limitations](../Issue56BulkTradingEvidence.md) are
recorded separately; independent source, CSS/probe and evidence reviews pass.

The owner approved the feature design and scoped Claude source/test/report
review. Neither approval authorizes a changed production artifact or performance
exception. The [production performance policy](../ProductionPerformanceBudget.md)
requires a measured owner-approved exception when byte or startup limits are
exceeded. The current sun-drift descriptor identifies a different bundle.
Global limits, exact matching and browser dependency auditing remain unchanged.

| Measure | Final issue-56 candidate | Global limit | Current approved sun-drift artifact | Growth |
| --- | ---: | ---: | ---: | ---: |
| Minified JavaScript | 1,835,632 bytes | 1,800,000 | 1,825,899 | 9,733 |
| Gzip JavaScript | 549,169 bytes | 537,600 | 545,419 | 3,750 |
| Cold-title median | 7,340.4 ms | 8,000 ms | — | — |
| Cold-title slowest | 8,280.0 ms | 8,000 ms | — | — |

Browser dependency auditing **passes** with `three` only. Final startup-02
measured **7,340.4; 7,596.8; 8,280.0; 6,240.6; and 6,971.5 ms**. One run exceeds
8,000 ms by **280 ms** and the raw startup gate is **FAIL**. This requires an
explicit measured startup decision separate from the byte decision; byte
approval alone cannot waive it. The earlier startup-01 PASS is superseded by
subsequent runtime/UI fixes and is not used to approve this artifact.

The five starts used fresh isolated profiles, disabled browser cache, bypassed
service workers and the platform GPU. Timing is navigation-to-title-ready and
excludes browser launch. Operating-system filesystem cache and machine-wide CPU
load were not controlled; no causal attribution to the fix is established.
Every run recorded clean console/error and cache evidence, closed its owned
browser and port, and removed the temporary profile. The static server closed;
source, helper scripts and the complete artifact remained unchanged. No rerun
replaced the failed observation.

## Exact proposed artifact

- Source/probe commit: `d0b032e9dc0d664b1e9c733ed4a3ea1db3bd2dad`.
- Base: `fb93a7c87f28fe37b4e73238b460cbf9ffa1cc07`.
- Runtime source SHA256:
  `48ed6b5539e33140512c37eff32537a5e94e30015107c686065bb17ddfec8333`.
- Complete production-source census SHA256:
  `88dd101c7d0e31d9f6ffa9310396a438596d94db199a84600f324cbe06d1e08b`.
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

## Proposed owner decisions and remaining gates

1. Approve only the exact JavaScript artifact above as the replacement byte
   descriptor, accepting **9,733 additional minified bytes and 3,750 additional
   gzip bytes** over the current approved sun-drift artifact.
2. Separately accept this artifact's five measured startup results, including the
   **8,280 ms run / 280 ms overrun**. Raw startup remains FAIL; accepting the
   measurement would neither relabel the observation nor raise the 8,000 ms target.

Current authority: **both decisions pending**. Full live verification and focused/
boot checks pass; independent baseline, activation-delta and final CSS/probe/
evidence reviews pass. No performance exception
approval is inferred from feature approval, review authorization or these results.

After explicit owner approval and the final acceptance verdicts, the builder must
record the real approval references, preserve the separate startup decision, and
activate only that exact byte descriptor in `scripts/bundle-policy.mjs`.
`npm run build` and `npm run bundle:report -- --json` must then pass; all 447
emitted files must match the measured candidate by path, size and SHA256;
independent policy review must verify the descriptor, authority and equivalence.
Any changed artifact returns to the fixed limits and needs reassessment.

Rollback remains the prior approved application artifact on master
`fb93a7c87f28fe37b4e73238b460cbf9ffa1cc07`. No save migration is required. Completed
ordinary trades persisted before a stopped batch remain valid saved state.
