## UI Audit: BIO-08 Wave 108 gait first impl

### Summary
Self-applied ui-audit checklist. No new chrome. Hub stays empty. Digit 0 stays shipyard. Light player feel is preserved in source. No Blocker or Major findings.

### What's done well
- No hub child, gait pip, species disc, or RANGE rewrite.
- No Digit theft. `DOCK_KEY_SERVICES` still ends in shipyard; Digit 8/9 still launch/epics.
- Player living light still uses idle 0.5 / cruise 2.3 / mood / breath 0.25 / heart 1.1 with unweighted X+Y sculpt.
- reducedMotion still zeros NPC `uSwimAmp`; player CPU swim still runs.
- Yard living preview still `update: null`.
- Ace authored flapY is low; frigate radial stays below squid.

### Findings

None at Blocker/Major.

#### 💡 Suggestion: Browser side-by-side
**Location:** Beautiful NPC traffic
**Issue:** Headless cannot prove flap-axis family (shark / squid / whale / octopus).
**Fix:** Optional live pass at `http://127.0.0.1:5178/`. Not required for this serial.

### Accessibility
- No new controls. KeyO reducedMotion path unchanged for NPC amp 0.
- Do not “fix” player CPU swim under reducedMotion (live split).
