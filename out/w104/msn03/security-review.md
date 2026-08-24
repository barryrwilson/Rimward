## Security Review: Wave 104 PR1 unique DONE board hide

### Risk Level: Low

### Summary

PR1 adds an exact-id filter in `boardJobs`. It does not delete persist rows, does not index user strings with `in`, does not steal Digits, and does not introduce `innerHTML`. No CRITICAL or HIGH findings.

### Findings

None.

### Passed Checks

- [x] Exact four id strings (`===`), no `in` operator, no `UNIQUE_JOB_KIND[id]` existence test (`station.js` 3618–3621)
- [x] Prototype ids (`__proto__`, `constructor`) do not match the four literals; they are not hidden by this skip
- [x] Overlay `bounty-pirate-*` DONE is not in the four ids — not hidden
- [x] Family rows are not in the four ids — not hidden
- [x] Unique `offered` / `accepted` fail `state === 'done'` — still visible
- [x] `completeJob` still writes `state: 'done'` only; no splice of unique rows (`station.js` 3712–3725)
- [x] No new `WORLD_FIELDS` key; no `uniqueDone` persist smash
- [x] `uniqueJobId` stays unexported `Object.hasOwn` (`save.js` 289–291); this PR does not switch existence tests
- [x] No `innerHTML` in `station.js`; titles still go through `h()` / `textContent`
- [x] Digit 2 still Jobs; Digit 0 still shipyard; Digit 8/9 untouched — no Digit theft, no memorial Digit
- [x] Unique complete still does not write `reputation[userString]`; patrol Freehold add is unchanged
- [x] No stuffed `job.faction` copy; no dart/auto seat from unique complete
- [x] No secrets, no new endpoints, no new localStorage key

### Recommendations

1. Keep later boot pins (PR2 / sibling) asserting persist rows remain when `done`.
2. Do not later “DRY” this skip with `id in UNIQUE_JOB_KIND`.
