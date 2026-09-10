# Issue 100 measured release decision — owner approved byte exception; QA of this activation pending

Docked hails are implemented, independently QA-reviewed and live-verified at
`1f9035c255afa9ddd0d4dd4dd17d1a4c92bb51a2`. The ordinary pre-approval build
failed the fixed byte limits. On 2026-09-10, in the current Codex issue-100
task, the owner explicitly approved an **exact byte exception for this artifact
only**. That descriptor is now activated in `scripts/bundle-policy.mjs`.

This document authorizes nothing else. It grants no measured startup exception,
no future-growth allowance, no environment bypass, and no publication, pull
request, merge or deployment. The
[production performance policy](../ProductionPerformanceBudget.md) requires a
measured owner-approved exception when byte limits are exceeded; only the byte
decision was made here. The previously approved issue-56 artifact identifies a
different bundle and is no longer the active byte exception; its
[decision record](issue-56-measured-decision.md) stands unchanged as history.

## Measurements

| Measure | Issue-100 artifact | Global limit | Previously approved issue-56 artifact | Growth |
| --- | ---: | ---: | ---: | ---: |
| Minified JavaScript | 1,835,953 bytes | 1,800,000 | 1,835,632 | 321 |
| Gzip JavaScript | 549,263 bytes | 537,600 | 549,169 | 94 |

The raw byte gates still **fail**: `minifiedPass` is `false` and `gzipPass` is
`false` in the structured report. The global 1,800,000 / 537,600 limits are
unchanged, the exact per-chunk matcher is unchanged, and the browser dependency
audit is unchanged and **passes** with `three` only. The overall
`bytePolicy.pass` is true solely through the exact approved exception.

## Exact approved artifact

- Reviewed source commit: `1f9035c255afa9ddd0d4dd4dd17d1a4c92bb51a2`.
- Baseline: `d3818ce4e3fd4c8aefb510abd51fe2103404c225`.
- Sole generated JavaScript chunk: `assets/index-CY-oCepC.js`.
- Chunk SHA256:
  `31e00966d7d17708ab99d0f81a31488bd3e45c4e0a998f062c09e9433ea36eb1`.
- Exact individual and aggregate bytes: **1,835,953 minified / 549,263 gzip**.

Activation edits `scripts/bundle-policy.mjs` and documentation only. No runtime
source, test, probe or package file changed from the QA-approved state; only the
`APPROVED_BYTE_EXCEPTION` descriptor fields were replaced. Because the bundle
excludes `scripts/`, the emitted artifact is byte-identical to the measured
candidate.

## Verification after activation

Ordinary `npm run build` and `npm run bundle:report -- --json` were rerun after
the descriptor edit and both exit 0. The build log records the exception line
`Codex issue-100 owner approval of exact byte exception, 2026-09-10;
docs/releases/issue-100-measured-decision.md`. The emitted
`dist/assets/index-CY-oCepC.js` was measured directly and matches the approval
exactly: SHA256 `31e00966…3ea36eb1`, 1,835,953 raw bytes, 549,263 gzip bytes.
No descriptor was retargeted to a different artifact.

Evidence, preserved alongside the earlier raw failures:
`out/issue-100/approved-build.log`, `out/issue-100/approved-bundle-report.log`,
`out/issue-100/approved-bundle-report.json`. The pre-approval failing run
remains at `out/issue-100/build.log`, `out/issue-100/bundle-report.log` and
`out/issue-100/bundle-measurement-restored.json`.

Because runtime, tests and the live probe are unchanged from the QA-approved
source, no gameplay, boot or live rerun was required for this activation. The
recorded focused (37 checks), boot, hail-identity and agent-hardening PASS
results and the 7/7 live PASS with 0 console errors continue to apply.

## Owner decision and remaining gates

Approval source: current Codex issue-100 task, 2026-09-10. The recorded
reference is `Codex issue-100 owner approval of exact byte exception,
2026-09-10`.

1. **Byte decision — approved and activated.** Only the exact JavaScript
   artifact above is the replacement byte descriptor, accepting **321
   additional minified bytes and 94 additional gzip bytes** over the previously
   approved issue-56 artifact. Any changed artifact returns to the fixed limits
   and needs reassessment.
2. **Not approved.** No measured startup exception, no startup measurement, no
   future-growth allowance, no budget or matcher change, no merge and no
   deployment.

Independent QA of this activation — the descriptor delta and these documentation
changes — is **PENDING**. The prior QA verdict covers the source at
`1f9035c2` and cannot be read as approval of this new descriptor. No overall
release PASS is claimed.

Rollback is the prior descriptor and the prior approved application artifact
recorded in [the issue-56 decision](issue-56-measured-decision.md). No save
migration is required.
