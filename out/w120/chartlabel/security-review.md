# Security Review: NAV-07 leftover chart-label a11y (Wave 120)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze makes Galaxy Chart labels plot via existing `plotRoute` / `clearRoute` / `sanitizeSystemId`, and adds a named dest `<select>` built once from catalog ids. Existing KeyM close skips `isTypingFocus()` (call live `overlay-policy.js`; no overlay-policy rewrite; no new listener; not a remap). No new persist key, no Digit, no `innerHTML`, no pause-the-sim, no jump emit from the chart. Title capture stays `systems[0]`. Later PR1 must not parse untrusted SVG/HTML, must not `for-in` a save blob into options, and must not persist dest/focus. No CRITICAL or HIGH. Designer KeyM typeahead Major is **closed in freeze**. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: NAV-07 chart-label leftover (Wave 120)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is catalog `SYSTEMS` ids flowing into `data-system-id` / `<option value>` and visible names via `textContent`. Hostile saves cannot persist a stuck dest picker (no WORLD_FIELDS). Freeze-the-sim is explicitly forbidden. Jump remains `gate.js` only.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: `innerHTML` of system names would XSS

- **Severity**: medium (prevented by deputize)
- **Category**: Injection / XSS
- **Location:** live labels `textContent` `galaxychart.js` **289**; `destLabel` **475–480**; no `innerHTML` in file; contract §0.4 / §0.13.
- **Description:** A later PR that did `label.innerHTML = sys.name` or `option.innerHTML = destLabel(id)` would execute markup if a catalog name ever contained HTML. Live names are authored/generated strings; freeze still forbids HTML sinks.
- **Impact:** Overlay script in the chart dialog (z 30) if copy becomes untrusted.
- **Reproduction:** Hypothetical `option.innerHTML = SYSTEMS[id].name` with a poisoned generated name.
- **Remediation:** Frozen: `textContent` / `setAttribute` only. No `insertAdjacentHTML`. `sanitizeSystemId` on values.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Persisting dest `<select>` / chart focus could restore a covering picker

- **Severity**: medium (prevented by deputize)
- **Category**: Persistence / denial of service
- **Location:** `save.js` WORLD_FIELDS; `ctx.js` session `chartOpen`; contract §0.6.
- **Description:** A later “remember last dest focus” plus a tampered field would load into a focused full-screen chart control with AP steer frozen if `chartOpen` were also persisted (sibling already forbids persisting `chartOpen`).
- **Impact:** Keyboard stuck on a dest list after load; player confusion.
- **Reproduction:** Invent WORLD_FIELDS `chartDest` / `chartFocus`.
- **Remediation:** Frozen **no new persist key**. Dest list is session DOM. `select.value` syncs from live `world.nav` already persisted by NAV-01.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Pausing the sim to “pick a dest” would drop events

- **Severity**: medium (prevented by deputize)
- **Category**: Freeze-the-sim / event loss
- **Location:** contract §0.7; `galaxychart.js` **24–27** already does not pause.
- **Description:** A later “pause while typing a destination” would freeze combat and drop `hailOpened`.
- **Impact:** Lost hail; possible forever pause if a helper throws.
- **Reproduction:** Hypothetical dest `<select>` `focus` → `flags.paused = true`.
- **Remediation:** Frozen: dest pick **never** writes `paused`. Miss → skip, never throw, never pause.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Jump emit from dest pick could skip zone/charge

- **Severity**: medium (prevented by deputize)
- **Category**: Simulation integrity / teleport
- **Location:** `gate.js` sole `jumpRequested`; contract §0.8.
- **Description:** A later “plot and jump now” that emits `jumpRequested` from `galaxychart.js` bypasses zone and charge.
- **Impact:** Instant hop; WAVE117 `zoneUnchanged` / `jumpOnlyGate` invert.
- **Reproduction:** Hypothetical `activateSystem` → `ctx.emit('jumpRequested', { to: id })`.
- **Remediation:** Frozen: `gate.js` only. Call `plotRoute` only. Do not teleport.
- **Status:** mitigated in contract.

#### 🟢 LOW: `for-in` SYSTEMS / save blob into options

- **Severity**: low (prevented)
- **Category**: Prototype pollution
- **Location:** live `Object.keys(SYSTEMS)` **92**; `sanitizeSystemId` reserved ids `nav.js` **8–36**; contract §0.7 / §0.13.
- **Description:** `for-in` without `hasOwn` could emit `__proto__` options. Live plot already sanitizes.
- **Remediation:** Frozen: `Object.keys` + `hasOwn` + `sanitizeSystemId`. Never `for-in` a save blob.
- **Status:** mitigated.

#### 🟢 LOW: Untrusted SVG parse

- **Severity**: low (prevented)
- **Category**: Injection
- **Location:** live `svgEl` `createElementNS` + `setAttribute` **61–65**; no SVG fetch (header **10–12**).
- **Description:** A later “load player SVG” path would parse untrusted markup. Freeze builds dest HTML with `createElement` only.
- **Remediation:** Frozen: no SVG/HTML parse. No network. No `innerHTML`.
- **Status:** mitigated.

#### 🟢 LOW: Title capture vs new KeyM / typeahead listener

- **Severity**: low
- **Category**: Overlay / key hijack
- **Location:** `galaxychart.js` **698–713**; contract §0.3 / §0.7.
- **Description:** A capturing KeyM or letter-bind for “search dest” could outrank title Digit / Enter.
- **Impact:** Title Enter / Digit broken.
- **Remediation:** Frozen: no new window listener. Native `<select>` typeahead works only while that control is focused inside the open chart. KeyM skip is a branch on the **existing** handler: `open && isTypingFocus()` → do not close. Title is not on screen while the chart is open (`playSurfaceBlocked` already blocks open under title).
- **Status:** mitigated.

#### 🟢 LOW: KeyM close skip if `isTypingFocus` is inverted

- **Severity**: low (prevented)
- **Category**: Overlay / stuck chart
- **Location:** contract §0.7 fallback; live always-close **700–704**.
- **Description:** A later skip that always returns true would trap the chart. Frozen: helper throw → dest-id fallback → else **close as live**. Escape still closes.
- **Status:** mitigated.

#### 🟢 LOW: Prototype `svgEl` `Object.entries(attrs)`

- **Severity**: low
- **Location:** `galaxychart.js` **63**.
- **Description:** If later attrs came from a polluted object, extra attributes could be set. Freeze attrs stay authored literals plus `data-system-id` catalog id.
- **Status:** call out; later keep authored attr objects.

### Passed Checks

- [x] No secrets in this markdown pack
- [x] No `src/` / `scripts/` writes this wave
- [x] `innerHTML` forbidden later
- [x] `state.js` READ-ONLY later
- [x] No new persist key
- [x] No Digit / UU / SKU invent
- [x] Fail closed skip, never pause, never throw
- [x] `sanitizeSystemId` required on dest values
- [x] Prototype-safe option build frozen
- [x] No untrusted SVG/HTML parse
- [x] Jump stays `gate.js`
- [x] KeyJ / overlay / toast / AP-close / `showApLive` not stolen
- [x] KeyM skip is existing-handler + live `isTypingFocus` call; overlay-policy not rewritten
- [x] Escape still closes; helper miss does not trap the chart

### Recommendations

1. Later PR1 grep `innerHTML` in `galaxychart.js` must stay empty.
2. Later PR1 grep `WORLD_FIELDS` must gain **no** chart-dest / chart-focus key.
3. Later PR1 must not add a window `keydown` besides the live KeyM / Escape handler. It **may** add `isTypingFocus()` skip on that same KeyM close branch.
