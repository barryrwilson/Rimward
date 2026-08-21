## Code Review (recheck): BIO-03 Wave 76 NPC GPU swim

### Summary
Second pass. No blocker or major. Shared-uniform regression remains fixed. Player CPU path remains unread/unedited.

### Findings

Carry-forward only (not blocking):

- Cloned materials not disposed on release (minor).
- `elapsed * hz` phase pop on speed change (suggestion).
- Cruise speed literal 120 (suggestion).

### Verdict

DONE for this slice. `animateShipMesh` 4-arg callers still idle. `npc.js` live loop passes speed.
