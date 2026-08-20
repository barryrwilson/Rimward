# Security Review: Wave 66 PR4 survivorSold HUD toast

**Scope:** `src/systems/hud.js` (`toastForEvent` `survivorSold`), `src/core/ctx.js` (comment), `out/w66/pr4/probe.mjs`
**Mode:** Deep audit (XSS via count concatenation, toast class, HUD emit, `row.name`).
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
HUD only reads `survivorSold`. Toast copy is two authored strings plus a finite count. `cls` is the literal `'warn'`. `pushToast` assigns `textContent`. HUD does not `emit('survivorSold')`. `ctx.js` is a comment only.

### Findings

#### 🟢 LOW: probe `Function` runs extracted HUD source
**Location:** `out/w66/pr4/probe.mjs` 38–40
**Issue:** The probe builds a function from the `survivorSold` case body so it can pin n=1 / n=2 / missing count.
**Impact:** Local trusted file. Not a product path. No network.
**Status:** open
**Justification:** `toastForEvent` is not exported. WAVE65 audio style already allows a source-text pin; this extra call is the same file the probe already reads.

### Resolved this pass
1. **HIGH (closed in impl):** count is not interpolated unless `Number.isFinite(e.count)`. HTML / `Infinity` / `NaN` / missing / null become `0`. Probe: `toastXssCount`, `toastInf`, `toastNaN`, `toastMissingCount`.
2. **HIGH (closed in impl):** toast class is `'warn'`, not `'good'`. `pushToast` does `slot.el.className = 'rw-toast show ' + cls` with that literal. Probe: `hudWarn`, `toastN1`.
3. **HIGH (closed in impl):** `row.name` / `e.name` do not enter sold copy. Probe: `hudNoRowName`, `toastIgnoresName`.
4. **HIGH (closed in impl):** HUD does not `emit('survivorSold'`. `ctx.emit` is unchanged. Probe: `hudNoEmitSold`, `ctxNoEmitSold`.
5. **HIGH (closed in impl):** sold toast does not use `innerHTML`. Live sink is `slot.el.textContent`. Probe: `hudToastTextContent`, `hudNoInnerHtmlSold`.

### Passed checks
- [x] No secrets in hud / ctx / probe
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] Toast sink is `textContent`
- [x] Count concatenation is finite-number only
- [x] No `row.name` interpolation
- [x] `cls: 'warn'` (not `good`)
- [x] HUD does not emit `survivorSold`
- [x] ctx comment only; emit runtime unchanged
- [x] Same-frame `commLine` dedupe via `mem.frameLines` (rescue pattern)
- [x] No new settings key
- [x] No HUD-02 / family audio work

### Recommendations
1. PR5: browser pin after Confirm — toast `■ The Chain took N.` with class `warn`; commLine skipped via `frameLines`.
2. Keep station / trafficking as the only `survivorSold` emitters.
