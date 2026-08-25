## Security Review: NAV-07 PR1 chart-label (`galaxychart.js` / dest `<select>`)

### Risk Level: Low

### Summary
No CRITICAL or HIGH issues. Dest option values pass `sanitizeSystemId`. Names use `textContent`. No persist. No new capture listener. Prototype-safe option build. Title capture stays on the existing window keydown.

### Findings

#### 🟢 LOW: Dest change trusts the live `<select>` value until `activateSystem`
**Location:** `src/systems/galaxychart.js:741–745`
**Issue:** The change handler reads `destSelect.value` and then sanitizes inside `activateSystem`.
**Impact:** A hostile option value cannot plot unless it is already a catalog id (`sanitizeSystemId` + `Object.hasOwn(SYSTEMS)`).
**Fix:** None required. `activateSystem` fail-closes on null.
**Justification:** Catalog ids only. No HTML parse. Keep flying.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `galaxychart.js`
- [x] Option visible names: `textContent` (`opt.textContent = rec.name`)
- [x] Label names: `label.textContent = sys.name ?? id`
- [x] Option values: `sanitizeSystemId` skip if null
- [x] Dest build: `Object.keys(SYSTEMS)` + `Object.hasOwn` — no `for-in`
- [x] No persist of dest / focus / `WORLD_FIELDS`
- [x] No new window KeyM listener; existing handler only
- [x] KeyM typing skip try/catch; dest-id fallback; both miss → close as live
- [x] No `flags.paused` write
- [x] `showApLive` body unchanged
- [x] `overlay-policy.js` not written; `isTypingFocus` called
- [x] Title capture: no `{ capture: true }` add
- [x] No secrets, no new localStorage key

### Recommendations
1. Keep dest values on the sanitized catalog path (already landed).
2. Do not later `innerHTML` system names into options or labels.

### Method
Self-applied `security-auditor` persona + orchestrator `security-review.md` checklist to the Wave 121 PR1 diff. No subagent spawn in this worker.
