## UI Audit: Agent badge last-intent line (afterburner)

### Summary
No badge chrome, copy, z-index, or CSS change. `Last: afterburner` uses live `BADGE_COPY.lastPrefix` plus `lastIntent.name`. Help line `'Space — afterburner'` stays.

### What's done well
- `badgeName` still copies a string. No `innerHTML`.
- `textContent` paint path unchanged (`mountAgentBadge` last span).
- Color is not the only cue: the last line is text.
- Space remains the human afterburner key.
- `reducedMotion`: no new animation.

### Findings

None at Blocker or Major.

#### 💡 Suggestion: Last line overwrites on later failed acts
**Location:** `src/systems/agent-api.js` `badgePaint` / `remember`
**Issue:** After a successful afterburner, a later `evade` unknown replaces the last line. That is live lastIntent law, not a chrome move.
**Fix:** Do not special-case evade on the badge.

### Passed
- Do not cover PWR.
- Do not edit `src/style.css`.
- Boot pin `lastLine` true: badge texts include `Last: afterburner`.
