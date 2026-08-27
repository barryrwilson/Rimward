## UI Audit: NAV-10 PR1 HUD approach-speed cue

### Summary
SLOW is named in text on the self SPD rail and in the J prompt. Color is not the only cue. Hub stays 80 px. No new animation. MATCH copy stays MATCH.

### What's done well

- Authored verb names `SLOW` and `20 u/s`. Lamp `textContent` is `SLOW`.
- `.rw-slow-lamp` uses tighter `letter-spacing: 0.04em` so the 220 px rail can hold MATCH + SLOW. Reticle size is unchanged (`width: 80px`).
- Independent `.is-hidden`. MATCH hide is unchanged.
- No toast SLOW. No hub pip. No new Digit.
- `reducedMotion`: no new `@keyframes` / pulse on `.rw-slow-lamp`.

### Findings

None open at Blocker/Major.

#### 🟡 Minor: Amber vs cyan is a second channel, not the name

**Location:** `src/ui/hud.css` `.rw-slow-lamp` `color: var(--amber)`
**Issue:** SLOW uses amber; MATCH uses cyan. A colorblind player still reads `SLOW` / `MATCH` as words.
**Fix:** None required. Keep the word. Do not drop the text.

**Justification (leave):** Contract requires named text. Color is extra, not the only cue.

#### 💡 Suggestion: MATCH + SLOW both on at cruise with a lock

**Location:** self `.rw-speed .rw-value`
**Issue:** Two lamps plus `u/s` can crowd the 168–220 px rail.
**Fix:** Letter-spacing is already 0.04em / margin-left 4px as the overflow law. Do not shrink the hub.

**Justification (leave):** Prescribed mitigation is already in CSS.

### Round 2

Hub 80 px confirmed. HOME inset 108 untouched. No new Digit. No pulse. Prompt key stays `J`.
