## UI Audit: Hail02 PR1 miss toast

### Summary

Miss copy uses the existing HUD-04 toast stack. Subject, verb, and reason live in text. Color is not the only cue. No new Digit, hub pip, toast slot, or linger window. No Blocker/Major.

### What's done well

- Authored lines use em dash ` — ` and `cls: 'warn'`.
- Range copy names integer `u` only when `dist` is finite.
- Stable key `warn|hailmiss|{verb}|{reason}|{keyName}` coalesces repeats for 8 s without minting a new key per meter.
- Overlay miss does not close chart/berth and does not pause.
- Context prompt block is unchanged (bargain `H — Hail` still lies; toast tells the miss).

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Existing toast `text-transform: uppercase`

**Location:** `src/ui/hud.css` `.rw-toast`  
**Issue:** Miss copy renders uppercase like every other toast.  
**Justification:** Hail02 must not restyle the HUD-04 stack. Text still names ship + reason.

#### 🟡 Minor: `white-space: nowrap` clips long names

**Location:** `src/ui/hud.css` `.rw-toast`  
**Issue:** A long pilot string can overflow the toast row.  
**Justification:** Same clip as Hail01 demand announce. Do not add a second stack or wrap layout (HUD-07 steal).

#### 💡 Suggestion: Align bargain prompt later

HUD-07 / owner. PR1 toast `{name} — no hail` is the additive.

### Accessibility

- [x] Subject named in text
- [x] Verb named in text
- [x] Reason named in text
- [x] Distance named when range is the reason and dist is finite
- [x] No new Digit
- [x] No new animation (`reducedMotion` unchanged)
- [x] `textContent` only
