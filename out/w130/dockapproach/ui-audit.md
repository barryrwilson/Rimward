## UI Audit: NAV-10 docking approach leftover integrator

### Summary

No product UI ships in Wave 130. Audit is of later prompt + **self** SLOW lamp copy. Blocker/Major UI holes in **live** play (J prompt with no speed teaching; cruise bounce) are leftover **REAL** until PR1. Designer Major (MATCH reuse / target SPD) is **resolved in freeze**: distinct `.rw-slow-lamp` on self only. Color-only cue, hub pip, MATCH theft, second toast stack, pause-as-feedback, and Jump-copy steal are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Copy matches inbox: `SLOW — approach under 20 u/s` (named speed + threshold).
- KeyJ still named as `J` when inZone (keyboard reach unchanged).
- SLOW is a **second** text lamp on **self** SPD (`.rw-slow-lamp`). MATCH stays `MATCH`. Target SPD is not used. Not color-only.
- `reducedMotion`: no new animation / pulse.
- HUD-01 80 px hub stays empty; no aim-glass gauge.
- Jump / hub G copy is not replaced.
- Title / typing / models already skip KeyJ; cue hides docked / jumping / berthHold.
- Write-on-change like live prompt (`last.prompt`) — no per-frame DOM alloc.

### Findings

#### 🔴 Blocker: No named approach-speed cue — **resolved as later copy**

**Location:** live `hud.js` **2535–2536**; SPD **378–399**  
**Issue:** Player sees `J — Dock` and a raw SPD number. Cruise bounce is unexplained.  
**Fix:** PR1 named prompt addendum + **self** `.rw-slow-lamp`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Color-only SLOW — **resolved in freeze**

**Location:** honor `reducedMotion` / a11y  
**Issue:** A red SPD bar without text would fail the inbox and contrast.  
**Fix:** text names SLOW and 20 u/s. CSS class is extra, not the only cue.

#### 🟠 Major: Cue only when J prompt shows — **resolved in freeze**

**Location:** `inZone` 45 vs hull 34.4  
**Issue:** ~0.088 s of copy at cruise cannot be read or acted.  
**Fix:** **self** `.rw-slow-lamp` from 3 × `DOCK_RANGE` **before** the J prompt. In-zone verb still teaches at the prompt.

#### 🟠 Major: Hub pip / extra overlay — **resolved in freeze**

**Location:** HUD-01 empty hub; HUD-06 pip  
**Issue:** A glass SLOW pip would fight HOME and the reticle.  
**Fix:** prompt + **self** SPD `.rw-slow-lamp` only. Not the 80 px hub. Not target SPD.

#### 🟠 Major: Jump prompt steal — **resolved in freeze**

**Location:** `hud.js` **2537–2546**  
**Issue:** Replacing `Jump to {dest}` with SLOW would hide the gate verb.  
**Fix:** hide **self** SLOW lamp when jump owns the verb; never overwrite Jump copy.

#### 🟠 Major: Do not reuse MATCH or target SPD — **resolved in freeze** (designer)

**Location:** `hud.js` **378–401**, **1089**, **1101**, **2243–2244**, **2524**; `hud.css` **222–229**  
**Issue:** Shared `makeSpeed()` owns one MATCH node on both rails. A MATCH sibling that is not a second node would steal Wave D or put SLOW on the lock glance. Worker v1 ranked this Minor. That was wrong.  
**Fix:** Distinct `.rw-slow-lamp` on `.rw-combat-self .rw-speed` only. MATCH `textContent` stays `MATCH`. Do not pass SLOW into `tgtSpeed.set`. Independent `is-hidden`. Do not grow the 80 px hub (`hud.css` **184–193**).

### 🟡 Minor: Uppercase tracking on `.rw-prompt-verb`

**Location:** `hud.css` **833–837** `text-transform: uppercase`; `letter-spacing: 0.22em`  
**Issue:** Long addendum `Dock · SLOW — approach under 20 u/s` may wrap or feel dense.  
**Justification:** reuse live prompt; salvage verb is already long (`Hail — dead in space`). Owner may shorten after playtest. Do not add a layout column (HUD-07 steal).

### 🟡 Minor: 20 u/s vs creep 30 may look “stuck SLOW”

**Location:** `state.js` **38**  
**Issue:** Throttle 0 still creeps at 30, so SLOW stays on until fullStop or dock.  
**Justification:** honest vs inbox 20. Copy still tells the truth. Do not retune creep.

### 🟡 Minor: MATCH + SLOW both on a 220 px self rail

**Location:** `hud.css` **950–955**; `hud.js` **386** MATCH node (kept)  
**Issue:** Two lamps share `.rw-value` with integer + `u/s`. High text scale can overflow the combat rail, not the hub.  
**Justification:** Distinct nodes; hide SLOW when false; do not hide MATCH. Overflow: lamp letter-spacing, not reticle size. Watch in PR1 CSS.

### 💡 Suggestion: Align prompt after playtest

If the addendum wraps on small viewports, a later HUD-07 slice may wrap; not NAV-10 PR1 layout.

### 💡 Suggestion: Optional PR2 stills

One still: cruise in 3× band, **self** SPD shows `SLOW` (text), MATCH still `MATCH` if on, target SPD has no SLOW, hub empty, HOME pip + inset 108 unchanged, no pause, no extra toast.
