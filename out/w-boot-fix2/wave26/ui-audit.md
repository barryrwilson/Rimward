## UI Audit: Digit 2 Jobs board (unique-four persist identity)

### Summary
Jobs board copy, Accept placement, and unique DONE hide are unchanged. Unique ferry still quotes `pays N UU`; unique haul still quotes `pays N UU (140% of buy cost)`. Accept is still `Accept (N)` on offered cards. Finished unique four stay off the board. Digit 2 Jobs, Digit 0 Shipyard, Digit 8/9 unchanged.

### What's done well
- Reward line still uses `textContent` via `h()`, not `innerHTML`
- Accept still lives inside the `.job-card`
- Offered unique ferry/haul still show Accept; done unique four still hidden
- Keyboard Digit 1–9 on the jobs board still accept `state === 'offered'` only
- uniqueRetry source remains; hide still makes DONE retry unreachable

### Findings

None. Persist identity keep, unique-four handle retain, and persist `completeJob` do not change card order, labels, or digits.

### WAVE26 UI checklist

| Check | Result |
|---|---|
| Unique DONE hidden | Pass — `boardJobs` skip unique four when `state === 'done'` |
| Offered unique four stay | Pass |
| Offered unique ferry shows Accept | Pass |
| Reward contains `pays <int> UU` | Pass |
| Keyboard Digit 2 Jobs (hub) | Pass — `DOCK_KEY_SERVICES[1] === 'jobs'` |
| Digit 0 Shipyard | Pass — Digit 0 → last service |
| Digit 8/9 stay | Pass — Launch / Standing |
| No `innerHTML` | Pass |

### Severity mapping
- No Blocker/Major UI issues
