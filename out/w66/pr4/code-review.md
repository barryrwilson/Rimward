# Code Review: Wave 66 PR4 survivorSold HUD toast

**Scope:** `src/systems/hud.js`, `src/core/ctx.js` (comment), `out/w66/pr4/probe.mjs`
**Pass:** final (no Blocker/Major open).

### Summary
HUD toasts `survivorSold` as a warn Chain line. Non-finite count becomes 0 and does not throw. Same-frame `commLine` is recorded on `frameLines` like rescue. The frozen ctx comment lists the payload. HUD does not emit the event.

### What's done well
- Case sits next to `survivorRescued` and copies the `frameLines` dedupe.
- Copy is authored: one vs many. No faction id. No `row.name`.
- `Number.isFinite(e.count)` before template interpolation.
- `cls: 'warn'` matches contract §6 / brief §2 (not a rescue toast).
- ctx comment matches the worker freeze (`credits` in the payload list).
- Probe pins source text and executes the extracted case for n=1 / n=2 / missing / hostile count.

### Findings

#### 💡 Suggestion: `toastForEvent` stays unexported
**Location:** `src/systems/hud.js` 314
**Issue:** The probe must extract the case body to call the mapping.
**Fix:** None required. Do not grow a public toast API for this slice.
**Status:** open
**Justification:** Task allows a source-text pin when the mapper is closed.

### Test coverage
Probe `out/w66/pr4/probe.mjs` (all-true, exit 0):

- ctx comment lists `'survivorSold' { faction, source, count, credits, repDelta }`
- ctx / hud do not `emit('survivorSold'`
- two Chain lines and `cls: 'warn'`
- finite count; XSS / Infinity / NaN / missing → 0
- n=1 / n=2 copy
- `frameLines` records `e.line`
- name payload ignored

### Verdict
Approve for PR5 (boot / browser pins). Do not emit from HUD.
