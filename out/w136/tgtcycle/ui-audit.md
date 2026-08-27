## UI Audit: KeyT help line (TGT-07 PR1)

### Summary

The only player-facing UI change is one `config.controls` string. HUD still paints it with `el(..., String(line))` → `textContent`. No toast, no second help key, no color cue, no layout CSS. No Blocker/Major.

Method: self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did not spawn designer.

### What's done well

- KeyT stays the cycle key (keyboard reach unchanged).
- Copy is authored text, not `innerHTML`.
- Deputize string matches merge law: `'T — cycle target (hostiles first in combat)'`.
- No new live region. Existing tgt rail still names the lock.
- `reducedMotion`: no new animation.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor

None required. The longer help line may wrap in the 280 px controls panel. That is readable text wrap, not a contrast or focus defect.

#### 💡 Suggestion

**Location:** `src/systems/controls.js` help push; `src/systems/hud.js` ~1225–1229 (read-only)  
**Issue:** Combat fade of the controls panel (HUD-06/07) is unchanged. Players who keep the list collapsed will not see the new words. Behavior still works without the line.  
**Fix:** None in this PR. Do not add a T toast.

### Accessibility

- Color is not a cycle cue.
- Screen-reader path is the same `ul`/`li` list of control strings.
- No new Digit. Digit 0/8/9 stay.

### Verdict

Help-line change is safe. No re-run required.
