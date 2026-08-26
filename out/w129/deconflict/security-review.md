## Security Review: HUD-07 PR1 yield / quieter cruise

### Risk Level: Low

### Summary

PR1 hides duplicate HUD words with authored `rw-yield` class toggles and writes the target rail name through `stripHudText` + `textContent`. No `innerHTML`, no new persist key, no fifth `aria-live`, no new projector pip.

Review mode: **Deep Audit** on HUD string sinks, live regions, and session flags. Applied `security-review.md` and security-auditor persona.

## Security Audit: yield copy / live regions / persist

### Summary

Overall risk: **low**. Yield is visual hide of existing nodes. The rail name path that previously skipped C0 strip now strips.

### Findings

None open at critical/high/medium.

#### 🟢 LOW: Chartmark labels still write authored `lm.name` without strip

**Location:** `src/systems/hud.js` chart label `textContent` (throttled wave-15 path)
**Issue:** PR1 does not rewrite chartmark copy. Authored landmark names stay as before.
**Impact:** None new. Authored tables are not player HTML.
**Fix:** Out of write intent. Do not invent a second name writer.
**Status:** accepted (pre-existing; not this leftover)

### Passed Checks

- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] `.rw-combat-name` uses `stripHudText` then `textContent`
- [x] Yield class token is authored `rw-yield` (no `for-in` blob)
- [x] No new `localStorage` / `WORLD_FIELDS` / `state.js` write
- [x] No new `aria-live` (toasts + banner + nav live stay)
- [x] Hail02 `hailMiss` / `hailMissToast` / `hailMissKeyName` unchanged
- [x] No hidden-AI / sun / POI pip
- [x] Fail-closed `try/catch` around yield; update skip never throws from this block
- [x] No secrets in the write-set

### Recommendations

1. Keep rail names on `stripHudText` if anyone later edits the combat rail.
2. Do not announce yield on a live region.
