# UI Audit: Onb01 first-minute flight-lesson leftover integrator

### Summary

No product UI ships in Wave 141. Audit is of the live first-minute teaching surfaces and the later lesson. Blocker/Major UI holes in **live** play (expanded 19-line encyclopedia + origin sting + delayed four-bind `move`) stay leftover **REAL** until PR1. Do not CONSUME. Designer pass (`out/w141/designer/onb01-ui-audit.md`) named two **Major** later-mint gaps: hint chip off `#hud` tokens; sequential rail has no live region. Those are now **resolved in freeze**. Color-only teaching, pause tutorial, auto-open chart/hail, HUD-01 hub child, second hint node, and encyclopedia-into-pause stay forbidden.

### What's done well

- Live hints are already **one at a time**, 8 s or key dismiss, `textContent`, teal + words (`onboarding.js` **102**, **137–139**).
- Live CONTROLS toggle is a real `<button>` with pointer-events (`hud.js` **1280**; `hud.css` **1186–1187**). Combat already collapses the dump (`hud.js` **2246–2249**).
- Context prompt is already one verb (`hud.js` **2600–2609**). Lesson must not add a second prompt slot.
- Origin overlay already uses `textContent` rows (`origins.js` **141**). Digit1–5 stay origin until pick.
- Color is not the only cue on live hints (full sentence). PR1 keeps text.
- HUD-01 hub stays empty. `reducedMotion`: no new animation in the freeze.

### Findings

#### 🔴 Blocker: First-minute information dump — **resolved as later mint**

**Location:** live `hud.js` **1290** expanded; toast **662–663**; `onboarding.js` **37–39**  
**Issue:** After origin pick the encyclopedia, origin sting, and HUD chrome compete with ship, station, targets, and reticle. Lesson is not sequential.  
**Fix:** PR1 collapse + look → throttle → target → hail → dock → chart. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Encyclopedia not on demand at boot — **resolved in freeze**

**Location:** `controlsCollapsed = false` **1290**; CSS **1214**  
**Issue:** Toggle exists; default is open. Inbox asked for on-demand after pick.  
**Fix:** start collapsed; `CONTROLS ▸`; `aria-expanded="false"`. Click expands the same 19 lines.

#### 🟠 Major: `move` dumps four binds — **resolved in freeze**

**Location:** `onboarding.js` **39**  
**Issue:** One card teaches throttle, mouse, drift, and burn. Inbox wants look/turn then throttle.  
**Fix:** split; retire `move`.

#### 🟠 Major: Color-only or animated camera lesson — **resolved in freeze**

**Location:** honor a11y; `ctx.settings.reducedMotion`  
**Issue:** A scripted look-at-station camera or color-coded key glyphs without words would fail color-not-only and `reducedMotion`.  
**Fix:** authored **text** on the live hint rail. Collapse is `display:none`. No new animation.

#### 🟠 Major: Pause-menu or hail/chart auto-open as “teaching chrome” — **resolved in freeze**

**Location:** Ctl05 sibling; `overlay-policy.js` **4**; KeyM/KeyH  
**Issue:** Moving the encyclopedia into pause, or opening chart to teach M, stacks surfaces and steals siblings.  
**Fix:** HUD toggle stays the on-demand reference. Lesson **names** M/H/J. Do not open those cards.

#### 🟠 Major: Second live region / hub child / aim-glass gauges — **resolved in freeze**

**Location:** HUD-01 hub; hint z-index 35 at top-left **84**  
**Issue:** A modal tutorial or hub pip would steal HUD-01 / HUD-07.  
**Fix:** reuse `.rw-onboard-hint`. Do not put lesson DOM in the 80 px hub.

#### 🟠 Major: PR1 lesson chip is off `#hud` — **resolved in freeze** (designer)

**Location:** live `onboarding.js` **81–88** (`document.body`, inline `11px` / `#6ff2e0`); tokens on `#hud` (`hud.css` **9–31**, **1243–1264**, **1271–1277**); old contract said `hud.css` none required  
**Issue:** Sequential lesson misses `--rw-text-scale`, contrast panel, and reduced-motion CSS. Freeze “no new animation” is not enough while HUD motion CSS cannot see the node.  
**Fix:** Keep **one** `.rw-onboard-hint`. `hud.css` tokens. HUD init may reparent that node onto `#hud` (not the reticle). If `#hud` is missing, body-child CSS + copy `textScale`. Do not add a second list.

#### 🟠 Major: Sequential lesson has no live region — **resolved in freeze** (designer)

**Location:** live `onboarding.js` **81–108**; nav readout `hud.js` **1236–1240**  
**Issue:** PR1 makes this rail the teacher. Screen readers get no polite announcement.  
**Fix:** On the **same** node set `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Do not add a second live region. Do not make it a modal. Keep `pointer-events: none`.

### 🟡 Minor: Toggle missing `aria-expanded`

**Location:** `hud.js` **1280**, **1291–1294**, **2246–2249**  
**Issue:** Screen readers do not hear collapse state. Combat collapse flips class and label only.  
**Fix (PR1 quick win):** set `aria-expanded` from the collapse flag on **init, click, and combat collapse**. Frozen in contract §0.12.

### 🟡 Minor: Hint sits under CONTROLS (`top: 48px`)

**Location:** `onboarding.js` **84**; `.rw-controls` `top: 14px`  
**Issue:** After PR1 collapse, the header still occupies top-left; the hint remains under it (comment **12–13**). Expanded encyclopedia would cover the hint — another reason collapse is required.  
**Justification:** Keep the live slot. Do not move to bottom-center (HUD-07 / contacts).

### 🟡 Minor: Any-key dismiss can skip the card while steering

**Location:** `onboarding.js` **107–108**  
**Issue:** First WASD/R press hides look/turn.  
**Justification:** Live pattern. Inbox wants short. Keep. Do not require a dedicated “next” Digit.

### 💡 Suggestion: Optional PR2 still

One still: fresh origin pick, encyclopedia collapsed, first hint look/turn only, CONTROLS click expands 19 lines, KeyM still chart, hub empty, no pause, Digit1–5 were origin on the overlay.

### 💡 Suggestion: Do not restyle hint chrome

Keep monospace teal chip. Do not invent a wizard. Do not add a progress `1/6` color bar without text (if a later owner wants index, use words `1 of 6`).

### 🟡 Minor: Contract said focus-visible “stays”; toggle has no authored ring

**Location:** `hud.css` **1186–1199** vs **782–789**  
**Issue:** On-demand encyclopedia is the post-lesson reference. Hover exists; HUD cyan `:focus-visible` does not.  
**Justification:** Optional PR1 on `.rw-controls-toggle`. Keep the real `<button>`. Do not remap.

### Re-review (Wave 141 pass 3)

Designer Majors (off-`#hud` tokens; no live region) folded into freeze. `aria-expanded` named on init/click/combat. Live dump Blocker stays leftover **REAL** until PR1. Do not CONSUME. Markdown only.
