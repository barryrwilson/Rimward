# Starter sun-drift measured release decision — proposed

The fresh-start heading fix is locally implemented on `codex/starter-sun-drift`.
This is a concrete proposal, **not an approved exception**. Ordinary build
currently fails its byte gate; completed local live verification and pending
independent QA are tracked in [the evidence report](../StarterSunDriftEvidence.md).

The [production performance policy](../ProductionPerformanceBudget.md) requires
owner approval for a changed artifact outside its fixed byte/startup limits.
The existing issue #12 exception matches a different bundle and cannot authorize
this one. No exception descriptor or global limit has been changed.

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

## Exact proposed artifact

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

## Requested decision, pending

1. Permit a scoped independent Claude review of the implementation, focused
   tests, relevant source contracts, and these verification records. Automatic
   approval review rejected the earlier external Claude request because the
   task had not explicitly authorized disclosure of repository source.
2. If that review passes, approve only the exact byte artifact identified above.
3. Separately accept this artifact's five measured startup results, including
   the two overruns. The global 8,000 ms target remains unchanged.

After approval and independent QA, the exact descriptor may be activated and
ordinary build/report rerun. Actual emitted identity must match this proposal.
Any changed artifact requires reassessment. None of these decisions authorizes
publication, merge, or deployment. Rollback remains the prior application
artifact on master `acc8662431507d257ed094975224fd7ed4cf80fa`; no save migration
or persistent-data change is introduced.
