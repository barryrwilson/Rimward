## UI Audit: Wave 109 Digit 2 Jobs chain SKU hint

### Summary
Jobs pane only. One extra `textContent` line when `chainGrantSpec` is non-null. Live UU lines stay. No HUD child, no Digit 9 log, no shop cost, no `innerHTML`.

### What's done well
- Overlay wipe stays `overlay.textContent = ''` (`station.js` 5924, 6056 after this wave’s inserts).
- Hint uses existing `h('div', 'job-reward', card, …)` so type, color, and spacing match the UU line.
- Names come from catalog `.name` (`Dart rack` / `Auto turret`).
- Hint says the hull may refuse: `if this hull has a hardpoint.`
- `reducedMotion`: no extra animation; `renderJobs` has no `requestAnimationFrame`.
- Digit 0 shipyard, Digit 2 Jobs, Digit 8 launch, Digit 9 Standing stay.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 💡 Suggestion: Hint also shows on chain steps 1 and 2
**Location:** `src/systems/station.js:5236-5253`
**Issue:** Contract copy is “Last paper may seat…” whenever the employer spec is non-null, not only `step === 3`. Step 1/2 cards therefore preview the last-step kit.
**Fix:** Keep as specified. Do not hide on early steps unless the owner asks after playtest.

### Accessibility
- No new control. Screen readers get a second static reward line.
- Catalog strings are authored ASCII. `h()` sets `textContent`.
- Keyboard Accept (Digit 1–9 offered-only, mouse past index 8) is unchanged.

### Theming / layout
- Reuses `.job-reward`. No new CSS. No hardcoded color. No overflow risk beyond existing card wrap.

### States
- Offered and accepted chain cards both keep the live UU line, then the hint when spec is non-null.
- `commLine` success: `Gear seated.` Fail: ` Compact thanks +2 UU.`
- Empty hub / RANGE / HUD-01 untouched.

### Verdict
Pass. Digit 2 Jobs copy only.
