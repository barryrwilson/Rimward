# UI Audit recheck: Onb01 later-mint freeze (designer Wave 141)

**Auditor:** designer (Wave 141 parent **recheck**)  
**Prior pass:** this file (pre-fold). Two **Major** freeze gaps: (1) lesson chip off `#hud` missing a11y tokens; (2) sequential rail no live region.  
**Recheck after:** worker fold into `out/w141/onb01/shared-contract.md` and `docs/Onb01FlightLessonDesign.md`.  
**Review only.** No product `src/` edits. No design-doc edits. Vite/Chrome not started.  
**Sources:** `docs/Onb01FlightLessonDesign.md`; `out/w141/onb01/shared-contract.md`; worker `out/w141/onb01/ui-audit.md`; live `src/systems/onboarding.js`, `src/systems/hud.js`, `src/ui/hud.css` (cite only).  
**Merge law:** contract wins over the design doc.

### Summary

The two prior freeze **Majors** are now **closed in freeze**. Live first-minute dump is leftover **REAL** until PR1. That dump is **not** an open freeze Blocker. No new freeze Blocker. No new freeze Major. Do not CONSUME.

### What's done well

- Freeze now names `hud.css` `.rw-onboard-hint` tokens: `--rw-text-scale`, `body.rw-contrast`, `body.rw-reduced-motion` including `.rw-onboard-hint` not only `#hud *` (`shared-contract.md` §0.11–0.13, §0.1 Hint tokens). Inline `font-size` / `#6ff2e0` must drop.
- Freeze allows HUD init to **reparent** the same node onto `#hud` (not the reticle). Fail-closed: if `#hud` is missing, stay on `body` and copy `textScale` (`shared-contract.md` §0.13; design doc neighbours `hud.js`).
- Freeze names **one** existing `.rw-onboard-hint` with `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. No second live region. Not a modal. `pointer-events: none` stays (`shared-contract.md` §0.12, §0.1 Live region). Pattern: nav readout `hud.js` **1236–1240**.
- Partial merge now **forbids** lesson without tokens and lesson without the live region (`shared-contract.md` §2). PR1 write-set includes `hud.css` (`shared-contract.md` §1).
- `aria-expanded` is named on **init, click, and combat collapse** (`shared-contract.md` §0.12). Focus-visible is no longer overclaimed; optional PR1 on `.rw-controls-toggle` (`shared-contract.md` §0.12).
- Live hints still one-at-a-time, 8 s or key, `textContent` (`onboarding.js` **99–108**, **137–153**). Color is paired with words. Honor keys, empty 80 px hub, no pause, no auto-open, no second node stay frozen.
- Worker self-audit matches this fold. Designer agrees.

### Recheck of the two prior Majors

#### 🟠 Major: PR1 lesson chip is off `#hud` — misses HUD a11y hooks — **closed in freeze**

**Prior location:** `onboarding.js:81-88` (`document.body`, inline `font-size:11px;color:#6ff2e0`); tokens on `#hud` (`hud.css:9-31`, `1243-1264`, `1271-1277`). Old contract said `hud.css` none required.  
**Live still:** chip is a `body` child with hardcoded cyan/size. `--rw-text-scale`, `body.rw-contrast #hud`, and `body.rw-reduced-motion #hud *` still miss it. That is expected until PR1.  
**Freeze now:** later mint **must** cover the rail the same way `#hud` is covered (`shared-contract.md` §0.11). Tokens + optional reparent + fail-closed body path (`§0.12–0.13`, §0.1). Design doc Honor / deputize / PR1 / verification step 9 match. Contract “hud.css none required” is gone. Write-set claims `hud.css`.  
**Status:** **closed in freeze.** Live hole is PR1 work, not a new freeze Major.

#### 🟠 Major: Sequential lesson has no live region — **closed in freeze**

**Prior location:** `onboarding.js:81-108` (plain `div`, no `role` / `aria-live`).  
**Live still:** no live region on `.rw-onboard-hint`. Expected until PR1.  
**Freeze now:** same node `role="status"` `aria-live="polite"` `aria-atomic="true"` (`shared-contract.md` §0.12, §0.1). Do not add a second live region. Do not make it a modal. Partial merge names a silent rail as forbidden (`§2`). PR1 lands it (`§3`). Design doc matches.  
**Status:** **closed in freeze.** Live hole is PR1 work, not a new freeze Major.

### Findings

#### 🔴 Blocker: First-minute dump — leftover REAL (later mint, not this wave)

**Location:** `hud.js:1290` (expanded default); `hud.js:662-663` (`originChosen` sting); `onboarding.js:37-39` (`move` at `world.time > 20`)  
**Issue:** After origin pick the player still sees 19 CONTROLS lines, the origin sting, and HUD chrome. Twenty seconds later `move` still packs four binds. Inbox asked to replace that dump.  
**Fix:** PR1 as frozen: `controlsCollapsed = true` at init; six origin-gated hint ids; retire `move`. Do not CONSUME. Do not pause. Do not auto-open overlays.  
**Status:** leftover **REAL**. **Not** an open freeze Blocker. Live hole stays until PR1 (expected).

#### 🟠 Major: Encyclopedia not on demand at boot — leftover REAL (resolved in freeze)

**Location:** `hud.js:1290`; toggle `hud.js:1280-1294`  
**Issue:** Toggle exists; default is open.  
**Fix:** Start collapsed; `CONTROLS ▸`; `aria-expanded="false"` from the collapse flag.  
**Status:** freeze complete; live remains until PR1

#### 🟠 Major: `move` is a delayed second dump — leftover REAL (resolved in freeze)

**Location:** `onboarding.js:37-39`  
**Issue:** First hint is four binds, gated on `world.time > 20`.  
**Fix:** Authored order look → throttle → target → hail → dock → chart; reuse `dock`; retire `move`.  
**Status:** freeze complete; live remains until PR1

#### 🟠 Major: PR1 lesson chip off `#hud` tokens — **closed in freeze** (this recheck)

See recheck section above. Do not reopen.

#### 🟠 Major: Sequential lesson has no live region — **closed in freeze** (this recheck)

See recheck section above. Do not reopen.

#### 🟡 Minor: CONTROLS toggle missing `aria-expanded` (named in freeze)

**Location:** `hud.js:1280-1294` (click); `hud.js:2246-2249` (combat collapse); contract §0.12  
**Issue:** Live has no `aria-expanded`. Combat collapse flips class and label only.  
**Fix:** Set `aria-expanded` from the same flag on init, click, and combat collapse.  
**Status:** frozen as PR1; not a freeze Major

#### 🟡 Minor: Toggle has no authored `:focus-visible` ring

**Location:** `hud.css:1186-1199` (hover color only); compare `hud.css:782-789`  
**Issue:** On-demand encyclopedia is the post-lesson reference. Native outline may show; HUD pattern is a cyan outline. Contract no longer overclaims a ring.  
**Fix (PR1, optional hud.css):** Add `:focus-visible` on `.rw-controls-toggle`. Keep the real `<button>`.  
**Status:** open optional; not a remap

#### 🟡 Minor: Origin sting and first look hint still share the first second

**Location:** `hud.js:662-663`; PR1 look on rail `top:48px` (`onboarding.js:84`); toasts `hud.css:710-716`  
**Issue:** Collapse removes the 19-line dump. Overlay-up still fires origin sting + HUD chrome + (after PR1) look/turn. Slots differ (top-right sting vs top-left hint).  
**Fix:** Keep the sting. Do not time-gate look with `world.time > 20`. Do not pause. Accept overlap.  
**Status:** accept; do not reopen HUD-07

#### 🟡 Minor: Hint sits under the CONTROLS header

**Location:** `onboarding.js:12-13`, **84** (`top:48px`); `.rw-controls` `hud.css:1179-1184`  
**Issue:** After PR1 collapse the header still occupies top-left. Expanded 19 lines would cover the hint — another reason default collapse is required.  
**Fix:** Keep the live slot under the header. Do not park the lesson on the aim glass.  
**Status:** keep live slot

#### 🟡 Minor: Any-key dismiss can skip a step (including KeyP)

**Location:** `onboarding.js:107-108`; KeyP `main.js:174-186`  
**Issue:** First R/WASD/H/M hides the visible card and still fires the bind. KeyP also pauses. Inbox wants short. A dedicated Next Digit would steal Honor.  
**Fix:** Keep 8 s or keydown. Do not special-case KeyP in Onb01. Do not write `flags.paused`.  
**Status:** keep live pattern

#### 🟡 Minor: Throttle freeze copy still teaches two techniques

**Location:** contract §0.1 throttle: `R/F — throttle · double-tap F — stop`  
**Issue:** Look is one verb. Throttle still names hold R/F and double-tap F. Better than four binds; not fully one-at-a-time.  
**Fix:** Prefer one line `R/F — throttle` for the lesson; leave double-tap F on the on-demand list. Owner may keep the frozen literal after playtest.  
**Status:** freeze copy; owner may override

#### 💡 Suggestion: Optional PR2 still

One still after origin pick: encyclopedia collapsed (`CONTROLS ▸`), first hint look/turn only, no 19-line dump, CONTROLS click expands 19 lines, KeyH hail / KeyJ dock / KeyM chart / KeyP pause / KeyD strafe unchanged, Digit1–5 were origin on the overlay, 80 px hub empty, no pause from the lesson, `hints` off hides the rail, chip scaled/contrasted, rail announces politely.

#### 💡 Suggestion: Do not restyle the chip into a wizard

Keep the monospace teal line via tokens, not inline hex. Do not add a color-only `1/6` bar. If an index is wanted later, use words `1 of 6`. Do not add hub pips, aim-glass gauges, or a second prompt slot.

#### 💡 Suggestion: Contrast CSS must name `.rw-onboard-hint` on the body fail-closed path

**Location:** live contrast is `body.rw-contrast #hud` (`hud.css:1243-1264`); freeze reduced-motion already says include `.rw-onboard-hint`, not only `#hud *` (`shared-contract.md` §0.1, §0.11).  
**Issue:** Reparent onto `#hud` inherits contrast. If `#hud` is missing, `body.rw-contrast #hud` still misses a body-child chip unless PR1 adds `body.rw-contrast .rw-onboard-hint`.  
**Fix (PR1, with the frozen tokens):** pair contrast selectors with the same class the reduced-motion rule already names. Do not reopen the closed Major; the hole is in scope.

### Re-review (designer vs worker)

Worker pass 3 said the designer Majors are resolved in freeze. Designer **agrees**.

Prior freeze Majors:

1. Off-`#hud` hint chip misses text scale, contrast, and reduced-motion CSS — **closed in freeze**.  
2. Lesson rail needs `role="status"` / `aria-live="polite"` on the existing node — **closed in freeze**.

Live dump stays leftover **REAL**. It is **not** an open freeze Blocker.

`aria-expanded` stays Minor (already named). Focus-visible stays optional Minor. Toast+look overlap stays Minor. Honor keys, empty hub, hint rail vs aim glass, and `reducedMotion` with tokens that can **see** the node stay sound.

**Verdict:** Freeze PR1. Two prior Majors **closed in freeze**. No new freeze Blocker. No new freeze Major. Do not CONSUME. Do not ship collapse without the six-step rail. Do not ship the rail without tokens and the same-node live region.
