# Starter sun-drift measured release decision — approved

The fresh-start heading fix is locally implemented on `codex/starter-sun-drift`.
The owner approved the exact byte exception and, separately, the measured
startup exception on 2026-09-10, conditional on scoped independent Claude QA
passing. That condition is fulfilled by the source/evidence **PASS** on
`6e17f69f9db65d902dbe1272fc69a43d45103385`. The exact byte descriptor is now
activated. Ordinary build/report, full emitted-artifact comparison, and final
independent policy/documentation review remain pending; this record does not
claim release readiness. [The evidence report](../StarterSunDriftEvidence.md)
retains the functional verification and provenance.

The [production performance policy](../ProductionPerformanceBudget.md) requires
owner approval for a changed artifact outside its fixed byte/startup limits.
The prior issue #12 exception matches a different bundle and cannot authorize
this one. Only `APPROVED_BYTE_EXCEPTION` in `scripts/bundle-policy.mjs` is
replaced with this approved artifact. Global byte/startup limits, the exact
matcher, and the browser dependency audit remain unchanged.

| Measure | Candidate | Limit / prior artifact |
|---|---:|---|
| Minified JavaScript | 1,825,899 bytes | 1,800,000 limit; +30 versus issue #12 |
| Gzip JavaScript | 545,419 bytes | 537,600 limit; +10 versus issue #12 |
| Cold-title median | 7,880.8 ms | 8,000 ms target |
| Cold-title slowest | 8,076.1 ms | 8,000 ms target |
| Browser dependencies | PASS | `three` only |

Five serial cache-disabled production starts measured **8,062.9, 7,844.8,
7,769.3, 7,880.8, and 8,076.1 ms**. Two exceeded 8,000 ms, so the raw startup
gate **failed**. Each title was visible, focused, and ready with enabled
controls; all five recorded zero console/page/network errors and no cached
responses. Task boot/focused tests finished before startup measurement;
machine-wide CPU activity and filesystem cache were not controlled. These
measurements do not establish that the small heading change caused an overrun.

The existing `scripts/issue-61-production-live.mjs` runner emitted the candidate
diagnostically using the current production transforms. Its diagnostic hook
records the byte failure while preserving the browser dependency audit, allowing
startup measurement. Diagnostic emission is **not** a passing ordinary build.
All five owned Chrome processes and ports closed; the local static server
closed; runtime source, measurement script, and the complete emitted artifact
remained unchanged throughout measurement.

## Exact approved artifact

- Runtime source SHA256:
  `b7f2d46f2f7550028ff83b9a0197e29bbd702770714e9c9b8b245120a27e04a2`
- Sole generated JavaScript chunk: `assets/index-Dvycuwk6.js`
- Chunk SHA256:
  `535f68a70399de3c149e53f26c1b0a1af6c46472f7ac367f52857e38681790b4`
- Exact chunk and aggregate byte counts: 1,825,899 minified / 545,419 gzip.
- Complete 447-file manifest SHA256:
  `1210e226e2f444d5a9626b6493b21d1e29d93b5d912721525a984e6a855c249a`

Raw results and manifests live under this worktree's
`out/issue-61-live/starter-sun-candidate/` and `starter-sun-startup/`.
The directory names reflect reuse of the existing diagnostic runner, not work
on issue #61. Logs are retained in the separate
`C:/Projects/WebSim/out/starter-sun-drift-evidence/` directory. Generated output
and profiles are excluded from the implementation commit.

## Owner decisions and independent source review

1. **Approved:** scoped independent Claude review of the implementation,
   focused tests, relevant source contracts, and verification records. This
   explicit owner authorization resolves the earlier automatic approval
   rejection for external source disclosure.
2. **Approved conditional on that PASS, now fulfilled:** only the exact byte
   artifact identified above. Approval reference:
   `Codex starter sun-drift conditional owner approval, 2026-09-10`.
3. **Separately approved conditional on that PASS, now fulfilled:** accept this
   artifact's five measured startup results, including the two overruns. Raw
   startup remains **FAIL**; this exception does not relabel those observations
   or change the global 8,000 ms target, and is not inferred from byte approval.

Independent Claude source/evidence review returned **PASS**, with no blocking
findings, on exact commit `6e17f69f9db65d902dbe1272fc69a43d45103385` against base
`acc8662431507d257ed094975224fd7ed4cf80fa`. The retained verdict is
`C:/Projects/WebSim/out/starter-sun-drift-evidence/QA-SOURCE.md`. Raw transcripts
in the same directory are `claude-source-review.jsonl` (initial review, reached
the turn limit) and `claude-source-review-continuation.jsonl` (final PASS). Review
verified the narrow runtime change, source digest, focused tests and saved-pose
contracts, probe whitespace provenance, and byte-delta arithmetic. The verdict
left release policy on HOLD until these separately approved decisions were
recorded and activated. Its death-respawn observation is parked outside the
fresh-start scope; no respawn implementation or external issue is added.

The next gate is ordinary build/report and comparison of all 447 emitted files
against the approved manifest, followed by independent review of this narrow
policy/documentation change. These checks remain pending; their exact-commit
results will be retained in the external evidence directory, with the final
independent verdict in `QA-POLICY.md`. Actual emitted
identity must match the approved artifact; any changed artifact requires
reassessment. None of these decisions authorizes publication, merge, or
deployment. Rollback remains the prior application
artifact on master `acc8662431507d257ed094975224fd7ed4cf80fa`; no save migration
or persistent-data change is introduced.
