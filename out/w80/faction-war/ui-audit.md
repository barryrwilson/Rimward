## UI Audit: Digit 2 war cards (`src/systems/station.js` renderJobs)

### Summary
War cards stay on Digit 2. Copy names the quarry, dest station, employer, and remaining time. Accepted copy says strike the named patrol. Cards do not say "file here". `textContent` / `h()` only.

### What's done well
- Title `Strike <name>` uses live record name (fallback stripped snapshot; never `rec-n`).
- Detail names dest station, target faction display name, and employer display name.
- Reward line names quarry + dest station + UU.
- Offered and accepted rows show `miningTimeLeftLabel`.
- Accepted state: `ACCEPTED — strike <name> · t left`.
- Jobs note credits dock-flag +2 for war with other renewable families. It does not claim a target debit.
- `boardJobs` hides foreign offered war. Accepted war remains visible on every dock.
- Mouse Accept still binds the job object. Digit 1–9 overflow is existing UX.

### Findings

No blocker or major UI issues.

#### 💡 Suggestion: employer name is in detail, not the title
**Location:** `renderJobs` war title/detail
**Issue:** Title is quarry-only. Employer sits on the detail line.
**Why not fix now:** Matches hunt (quarry in title, dock in detail). Digit 2 density is already high.

### Playwright
[NO BROWSER COVERAGE] — Chrome profile locked. Source audit only. WAVE80 WAR live boot pins include `titlesHideRec`, `cardsNameQuarry`, `acceptedStrikeCopy`.
