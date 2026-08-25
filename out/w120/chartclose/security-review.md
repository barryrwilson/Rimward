## Security Review: Wave 120 PR1 chart-close-on-AP

### Risk Level: Low

### Summary

Click-path close uses the existing `setOpen` closer, a static authored selector, and fail-closed try/catch. No `innerHTML`, no persist of `chartOpen`, no save-blob merge, no new listener.

### Findings

None. No critical / high / medium issues.

### Passed Checks

- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` on the engage path (`galaxychart.js` 586–590, 641–665)
- [x] Authored selector only: `#hud .rw-autopilot-cancel` and `.rw-autopilot` (`galaxychart.js` 656–660)
- [x] No user string concatenated into `querySelector`
- [x] No `for-in` of a save blob into open flags
- [x] `chartOpen` stays session (`ctx.flags.chartOpen` via `setOpen`); no `WORLD_FIELDS` key
- [x] Never throw if `document` / `activeElement` / `querySelector` / `focus` is missing (`galaxychart.js` 649–663)
- [x] Missing closer not invented: close is live `setOpen(false)` only
- [x] No `flags.paused` write
- [x] No new KeyM / capture listener
- [x] No `jumpRequested` emit from the chart
- [x] `showApLive` still `textContent`
- [x] Boot harness `document.querySelector` stub returns null; focus path no-ops without throw

### Recommendations

1. Keep overlay hail flush on this real close. Do not special-case skip `takeDeferredHail`.
2. Do not persist `chartOpen` in a later wave.
