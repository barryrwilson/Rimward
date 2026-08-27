# UI Audit: CTL-05 pause menu leftover integrator

### Summary

No product UI ships in Wave 141. Audit is of the live pause banner and later access menu. Blocker/Major UI holes in **live** play (copy-only `PAUSED — P to resume`; no Settings/save/title from that surface) are accepted as leftover **REAL** and frozen as PR1 named actions on `pauseEl` at z 50. Color-only LOAD disable, `innerHTML` labels, pause z raise, Settings expansion rows, and motion that ignores `reducedMotion` are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Live banner already uses `textContent` (`main.js` **172**). No `innerHTML` in `main.js`.
- KeyP is named in the live sentence. Later legend can keep **P to resume** as a word cue, not color-only.
- Wave 40 ladder is already documented: pause 50 / berth 60 / title 70 / settings 80 / fatal 99.
- Settings panel already `role="dialog"` `aria-label="Settings"` (`settings.js` **102–103**). Berth already `role="dialog"` `aria-label="Berth Records"` (`save.js` **1381–1382**). Title already `role="dialog"` `aria-label="RIMWARD title screen"` (`title.js` **147–148**).
- `.screen-btn:focus-visible` already has a 2 px accent outline (`screens.css`). Later pause actions should reuse `screen-btn`.
- Digit skip under pause already keeps hail `[n]` from firing while the banner covers hail z 40 (`overlay-policy.js` **177**).
- `reducedMotion` already exists as a Settings checkbox. Live pause has no animation.

### Findings

#### 🔴 Blocker: Copy-only pause is not a menu — **resolved as later mint**

**Location:** live `main.js` **172**; inbox **217–220**  
**Issue:** The player who taps P sees one sentence. No Settings, save, or title control. Hit target is the whole scrim with no named buttons.  
**Fix:** PR1 named `<button type="button">` actions: RESUME, SETTINGS, BERTH RECORDS, TITLE. Keep a PAUSED heading via `textContent`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Settings / berth scrim click-through to pause — **resolved in freeze**

**Location:** settings root `pointer-events:none` (`settings.js` **91–93**); berth root same (`save.js` **1371–1372**); pauseEl default auto (`main.js` **170–171**)  
**Issue:** After PR1, clicks on the dim ring around Settings or Berth would hit `pauseEl` at z 50 and fire RESUME (unpause under an open desk).  
**Fix:** while settings, berth, or title cover pause, `pauseEl` `pointer-events: none` (or ignore actions). Do **not** raise pause z over title/settings.

#### 🟠 Major: LOAD silent no-op while paused — **resolved in freeze**

**Location:** `save.js` **1502** vs buttons **1602–1614**  
**Issue:** LOAD looks clickable, then does nothing. Color-only disable would fail color-not-only.  
**Fix:** PR1 named-disable (`LOAD — resume first` or equal) via `textContent` + `disabled`. Keep the refuse.

#### 🟠 Major: Color-only pause / missing names — **resolved in freeze**

**Location:** honor a11y; live teal `#6ff2e0` (`main.js` **171**)  
**Issue:** Teal letter-spacing banner is atmosphere. Actions must be words.  
**Fix:** button labels `RESUME` / `SETTINGS` / `BERTH RECORDS` / `TITLE`. Legend names P. Color extra, not the only cue.

#### 🟠 Major: New animation / hub pip / Digit chrome — **resolved in freeze**

**Location:** HUD-01; Digit 0/8/9  
**Issue:** Fade-in that ignores `reducedMotion`, a hub pip, or Digit 1–4 as menu rows would steal HUD and station maps.  
**Fix:** no new animation. No hub child. No new Digit. Native button focus only.

#### 🟠 Major: Settings expansion rows on the pause path — **resolved in freeze**

**Location:** wishlist **131–135**; live FIELDS `settings.js` **29–38**  
**Issue:** Adding invert/rebind/split volume to “make pause Settings useful” steals the other inbox and crowds the z 80 dialog.  
**Fix:** open the **live** panel. Do not add knobs.

### 🟡 Minor: Pause banner has no `role="dialog"` live

**Location:** `main.js` **169–173**  
**Issue:** Screen readers hear a raw `div` sentence.  
**Justification:** PR1 adds `role="dialog"` and accessible name **Paused** (contract §0.13). Not live yet.

### 🟡 Minor: Boot title hides pauseEl while `paused` is true

**Location:** `title.js` **67**; `main.js` **173**  
**Issue:** No pause menu on first boot (title owns).  
**Justification:** Correct. TITLE-from-pause should hide `pauseEl` the same way.

### 🟡 Minor: Settings already reachable via O

**Location:** `settings.js` **117**, **228–234**  
**Issue:** Duplicate path after PR1 (menu + KeyO).  
**Justification:** Wanted. Pause menu is discoverability. Do not remove KeyO.

### 💡 Suggestion: Optional PR2 still

One still: in-run P at a mid-size viewport; four named buttons visible; SETTINGS opens; click dim does **not** resume; BERTH SAVE works; LOAD reads resume-first; TITLE remounts; CONTINUE hides banner; hub empty; no new motion.

### 💡 Suggestion: Do not add hover animation

Buttons are enough. Do not add pulse that ignores `reducedMotion`.

### Verdict

No 🔴/🟠 remain **in the freeze**. Live copy-only banner stays until PR1. Dialog role, LOAD named-disable, and click-through are PR1 UI law.
