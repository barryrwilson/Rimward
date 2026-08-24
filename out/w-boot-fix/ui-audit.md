## UI Audit: station overlay (people, jobs, shipyard, Digit0)

### Summary
People gift papers, shipyard hangar train, and Digit0 shipyard labels match the boot pins. Keyboard reach stays 1-9/0 plus Esc/B.

### What's done well
- Gift arm uses the berth line on the People card and Confirm papers.
- Hangar train keeps `Offer heavy`, `Train on Hangar`, `Train hull`, and Confirm papers.
- First Escape after dock stays on the services list so Digit0 still reads `0 — Shipyard`.
- Locker refusal still uses `trade refused` text, not innerHTML.

### Findings

#### 🟡 Minor: First Escape after dock does not launch
**Location:** `src/systems/station.js` level-1 Escape
**Issue:** One extra Escape is needed to launch right after berth. KeyB still launches.
**Fix:** Keep for WAVE92. Legend still says Esc/B launch.

#### 💡 Suggestion: Restitution stays on live notes only
**Location:** `standingLiveNotes()` vs `standingMoveNotes()`
**Issue:** Move list is five lines. Live list still names Restitution. That is the WAVE80 pin.

### Severity mapping
- No Blocker/Major UI issues on the gift/train/Digit0 paths
