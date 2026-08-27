## UI Audit: Msn04 PR1 mining identity (Jobs pane copy)

### Summary

No Digit, layout, or paint-channel change. Uniqueness is mint-time so Digit 2 rows can show two mining cards with distinct ore names (or one card when the table cannot supply a second key). Color is not the only cue. No Blocker or Major findings.

### What's done well

- Live `renderJobs` still rewrites mining title/detail via `miningOreName` and paints with `h()` `textContent`.
- Distinct commodity ⇒ distinct `Mine ${oreName}` text and (usually) distinct UU.
- Omit-if-exhausted avoids two identical `Mine Raw ore` rows when the table has one legal key.
- Digit 2 stays Jobs. Digit n still accepts `boardJobs[n - 1]`. No new Digit.
- `reducedMotion`: no new animation.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: omitted second card shrinks the board

**Location:** `syncMiningJobs` omit; Jobs list length  
**Issue:** if hardness-1 keys later drop to one, the player sees one mining row, not two.  
**Fix:** frozen omit. Do not force a twin.  
**Status:** accepted

#### 💡 Suggestion: playtest still of two distinct mining rows

**Location:** Digit 2 Jobs at Freehold  
**Issue:** optional PR3 stills were not required with PR1. Typical live table is `Raw ore` + `Living rock`.  
**Fix:** owner playtest.  
**Status:** accepted

### Accessibility

- Distinct mining rows named in **text** (ore name + pay).
- No color-only distinction.
- Keyboard Digit accept unchanged.
- No `innerHTML`.

### Method

Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Did **not** edit `hud.js` / `hud.css`.
