## UI Audit: Wave 118 PR1 overlay-priority

### Summary
No new chrome. Mutex shows at most one of hail / chart / berth. Named close paths stay. Hail buttons still use `[n]` plus verb text. No z-index change; play cards stay below settings (80) and `#fatal` (99).

### What's done well
- Hail card still uses numbered intent buttons (`[1] Leave the hulk` / `[1] Let them go`).
- Chart still closes with M, Escape, and the close button.
- Berth still closes with L or Escape; hint still says records hold while you fly.
- Digit shortcuts do not fire while settings/title/models cover the card, or while the pause banner is up (`flags.paused`).
- Chart/berth close blurs focus if it sat inside the overlay root. No close tween. `showApLive` untouched.
- Chart `aria-modal='false'` and live sim under hail/chart/berth are unchanged.
- No toast for deferred hail (P1 toast-flood is a sibling).
- HUD-01 empty hub untouched. No play-card raise over settings.

### Findings

No 🔴 Blocker or 🟠 Major remaining.

#### 🟠 Major: Hidden hail verbs under pause
**Location:** hail Digit listener vs pause overlay z 50
**Issue:** Player sees PAUSED; Digit1 could still pay tribute / let-go.
**Fix:** Skip hail digits while `ctx.flags.paused`. Do not dismiss hail on KeyP. Do not add a toast.
**Status:** resolved

#### 💡 Suggestion: Deferred hail has no visible waiting cue
**Location:** hail defer path (`overlay-policy.js` slot + `hail.js` skip `openCard`)
**Issue:** When the chart is open, an incoming hail waits with no banner. Merge law forbids a toast.
**Fix:** Do not add copy this wave. Optional later stills (PR2).
**Status:** open — accepted (contract).

### Accessibility
- Color is not the only hail cue: buttons keep `[n]` + verb.
- Chart/berth keep named close (M/L/Escape). Hail close stays numbered intents (no Escape-dismiss-hail).
- `reducedMotion`: no new overlay animation.

### Method
Self-applied checklist from `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did not spawn a designer agent.
