## Code Review: Wave 120 PR1 chart-close-on-AP

### Summary

Button-only success close matches merge law. Direct `tryEngage` still leaves the chart open. WAVE117 `chartEngageStay` now clicks Autopilot and asserts `chartOpen === false` with `nav.autopilot === true`. WAVE118 overlay greps were not inverted.

### What's done well

- Refuse and cancel branches unchanged; chart stays (`galaxychart.js` 635–645).
- Success keeps `showApLive('')` then real `setOpen(false)` (`646–648`).
- Fly `autopilotDisengaged` while `chartOpen` still paints `showApLive(apLine(reason))` (`742–752`).
- Overlay open-gate (`canOpenPlayCard` / `playSurfaceBlocked`) untouched.
- WAVE117 `chartStayOpen` still measures imported `e117(ctx)` (`boot-test.mjs` 23570–23572).
- Cancel-while-open still clicks the button after direct engage, then a second click covers button success close (`23641–23664`).

### Findings

#### 💡 Suggestion: Duplicate blur after `setOpen`

**Location:** `src/systems/galaxychart.js:432–439` and `649–655`

**Issue:** `setOpen(false)` already blurs `activeElement` inside the chart root. The success branch blurs again.

**Fix:** Leave it. Contract §0.19 asks for blur after the button close. Second blur is fail-closed and cheap.

#### 💡 Suggestion: `chartEngageStay` still requires earlier `tokChart === ''`

**Location:** `scripts/boot-test.mjs:23661–23664`

**Issue:** The button-close pin also requires the prior direct `e117` token to be empty.

**Fix:** Leave it. That proves the route was engageable before the button click. Product assertion is still `chartOpen === false` and `nav.autopilot === true`.

### Verdict

No blocker. No major. Ready.
