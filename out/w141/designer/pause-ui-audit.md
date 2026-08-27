# UI Audit: CTL-05 later-mint pause freeze (Wave 141 designer recheck)

**Scope:** Recheck the later pause-menu ACCESS freeze plus the live copy-only banner it cites. Markdown leftover only. No `src/` in this wave.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `docs/Ctl05PauseMenuDesign.md`; merge law `out/w141/pause/shared-contract.md` (contract wins); inventory `out/w141/pause/current-ctl05-pause-menu-inventory.md`; worker `out/w141/pause/ui-audit.md` (not a substitute).  
**Recheck target:** copy-only pause vs real menu; z 50 vs settings 80 / title 70 / berth 60; KeyP stay; typing / models / title guards; scrim click-through; LOAD refuse while paused; Settings expansion not stolen; color not the only cue; `textContent`; pause vs `berthHold`.  
**Live re-census (code wins):** `src/main.js` **156–187**; `src/systems/overlay-policy.js` **4**, **48–69**, **83–91**, **175–203**; `src/systems/settings.js` **29–38**, **90–118**, **215–234**; `src/systems/title.js` **59–135**, **145–256**; `src/ui/screens.css` **74–100**, **511–519**; `src/game/save.js` **1368–1584**, **1497–1502**, **1602–1632**; `src/systems/modelsbrowser.js` **638–749**. Inventory line numbers still match live `src/` at this recheck.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`. No process to stop.  
**Graph:** `graph_resolve` (`codex/agent-codex`) returned `execute_workflows` → `codex/workflow-activar-training-session-designer` (incidental match on “designer”, coverage 0.13). That session workflow is not this pack. Owner scoped a local WebSim audit file. Did **not** follow Activar session work. Did **not** call `graph_propose` / `graph_approve`. Did **not** edit product `src/` or the design doc.

### Summary

No product UI ships in Wave 141. Live in-run P is still one `textContent` sentence on `pauseEl` at z 50. That hole is leftover **REAL**, not a freeze miss, and is named as PR1 ACCESS (RESUME / SETTINGS / BERTH RECORDS / TITLE). The freeze keeps KeyP, the typing/models/title guards, Wave 40 ladder, Wave 28 LOAD refuse, CTL-02 never-write, CTL-03 `berthHold` distinct, `textContent`, and color-not-only. Worker Majors on click-through, LOAD named-disable, expansion steal, and motion/Digit chrome are **closed in freeze**. No 🔴 Blocker in the freeze. No open 🟠 Major in the freeze. Extra 🟡 items below are PR1 callouts, not a reason to CONSUME or to steal Settings expansion.

### What's done well

- Live banner already uses `textContent` (`main.js` **172**). `innerHTML` is absent in `main.js`. Contract §0.4 forbids `innerHTML` / `insertAdjacentHTML` / `document.write` later.
- KeyP is already a **word** cue in `'PAUSED — P to resume'`. Later legend can keep **P to resume**. Color is extra (`#6ff2e0` matches HUD `--rw-accent` in `style.css` **33**, not a silent hue-only state).
- Wave 40 ladder is live and frozen: pause **50** (`main.js` **171**), berth **60** (`save.js` **1372**), title **70** (`screens.css` **512**), settings **80** (`settings.js` **93**), models **80** (`models.css` **13**), `#fatal` **99**. Freeze: do **not** raise pause over title/settings.
- Neighbour dialogs already have names: Settings `role="dialog"` `aria-label="Settings"` (`settings.js` **102–103**); Berth `role="dialog"` `aria-label="Berth Records"` (`save.js` **1381–1382**); title `role="dialog"` `aria-label="RIMWARD title screen"` (`title.js` **147–148**).
- `.screen-btn:hover` / `:focus-visible` already exist (`screens.css` **88–100**). Contract §0.13 tells PR1 to reuse that pattern, 44 px where it already allows.
- Digit skip under pause is live: `hailDigitsAllowed` returns false when `flags.paused` (`overlay-policy.js` **177**). Overlay-policy **never** writes `flags.paused` (**4**, **196–203**).
- KeyP guards are live: INPUT / TEXTAREA / SELECT / `isContentEditable`, `ctx.models?.isOpen?.()`, `#rw-title` (`main.js` **177–184**). Models filter comment names the old traffic-spawn bug (**177–178**). Title capture swallows KeyP except KeyO/Escape pass (`title.js` **212–235**).
- Loop skip is only `flags.paused` (`main.js` **156–161**). Comment already says `berthHold` is not pause.
- Settings KeyO is global (`settings.js` **228–234**). Live FIELDS have no invert / rebind / split volume (`settings.js` **29–38**). Freeze does **not** steal inbox **131–135**.
- LOAD refuse while paused is live (`save.js` **1502**). SAVE `trySave` has no paused check (**1643**). Berth hint already says “This is not Pause (P).” (**1395–1396**).
- Settings and berth roots already use `pointer-events:none` on the scrim (`settings.js` **91–93**; `save.js` **1371–1372**). Title overlay uses `pointer-events: auto` (`screens.css` **515–522**) so title clicks do not reach the canvas.
- `reducedMotion` already exists as a Settings checkbox. Live pause has no animation.
- Worker self-audit correctly refused CONSUME on hidden KeyO. Inbox asked a pause **menu**.

### Recheck: worker findings vs freeze

#### 🔴 Blocker (closed as later mint): Copy-only pause is not a menu

**Location:** live `main.js` **169–187**, **172**; inbox **217–220**; contract §0.1  
**Issue:** Player who taps P sees one sentence. No named Settings, save, or title control. Whole scrim is the hit area. No `<button>`.  
**Fix (frozen):** PR1 `<button type="button">` RESUME / SETTINGS / BERTH RECORDS / TITLE. Keep a PAUSED heading via `textContent`. Leftover stays **REAL**. Serial **PR1**, not none.  
**Status:** **closed in freeze.** Live hole remains until PR1 (expected). Do not CONSUME.

#### 🟠 Major (closed in freeze): Settings / berth scrim click-through to pause

**Location:** settings root `pointer-events:none` (`settings.js` **91–93**); berth root same (`save.js` **1371–1372**); pauseEl cssText has no pointer-events (`main.js` **170–171**) so default is auto; title is `pointer-events: auto` (`screens.css` **515**)  
**Issue:** After PR1, a click on the dim ring around Settings or Berth would hit `pauseEl` at z 50 and fire RESUME. Title already swallows clicks, but freeze still hides `pauseEl` while title owns.  
**Fix (frozen):** while settings, berth, or title cover pause, `pauseEl` `pointer-events: none` (or ignore actions). Do **not** raise pause z. Dim-ring must not RESUME.  
**Status:** **closed in freeze.** Live pause has no buttons, so click-through is not a live resume bug today.

#### 🟠 Major (closed in freeze): LOAD silent no-op while paused

**Location:** `save.js` **1497–1502** vs refresh **1602–1614**; button paint **1559–1565**  
**Issue:** LOAD is refused when `flags.paused`, but the button is disabled only for empty/corrupt. It looks clickable, then does nothing. Color-only disable would fail color-not-only.  
**Fix (frozen):** keep the refuse. Named-disable (`LOAD — resume first` or equal) via `textContent` + `disabled`. Do not unpause to “make LOAD work”.  
**Status:** **closed in freeze.**

#### 🟠 Major (closed in freeze): Color-only pause / missing names

**Location:** honor a11y; live teal `#6ff2e0` (`main.js` **171–172**)  
**Issue:** Teal letter-spacing banner is atmosphere. Actions must be words.  
**Fix (frozen):** labels `RESUME` / `SETTINGS` / `BERTH RECORDS` / `TITLE`. Legend names P. Color extra.  
**Status:** **closed in freeze.**

#### 🟠 Major (closed in freeze): New animation / hub pip / Digit chrome

**Location:** HUD-01; Digit 0/8/9; contract §0.2, §0.12  
**Issue:** Fade that ignores `reducedMotion`, a hub pip, or Digit rows would steal HUD and station maps.  
**Fix (frozen):** no new animation. No hub child. No new Digit. Native button focus only.  
**Status:** **closed in freeze.**

#### 🟠 Major (closed in freeze): Settings expansion rows on the pause path

**Location:** wishlist **131–135**; live FIELDS `settings.js` **29–38**; contract §0.9  
**Issue:** Adding invert/rebind/split volume to “make pause Settings useful” steals the other inbox and crowds z 80.  
**Fix (frozen):** open the **live** panel. No new FIELDS. Optional `setOpen` export only (`settings.js` **215–226** is local today).  
**Status:** **closed in freeze.**

#### 🟠 Major (closed in freeze): KeyP remap / unpause-into-typing

**Location:** `main.js` **175–184**; models **638–640**, **703–749**; title **184**, **212–235**; contract §0.3, §0.11  
**Issue:** Remap P, or unpause into models filter INPUT, repeats a known traffic spawn. Title capture must keep swallowing KeyP while `#rw-title` is a body child.  
**Fix (frozen):** KeyP stays pause. Guards stay. Title path remounts without skip/reload. CONTINUE uses `setPaused` so the banner cannot stay up.  
**Status:** **closed in freeze.**

#### 🟠 Major (closed in freeze): Pause merged into `berthHold` / overlay pause write

**Location:** `main.js` **156–157**; `overlay-policy.js` **4**, **187–203**; `save.js` **1433–1458**, **1620–1628**; contract §0.6  
**Issue:** Naive PR unpauses to open berth, writes `paused` from overlay-policy, or sets `berthHold = paused`.  
**Fix (frozen):** open berth while still paused; KeyL binding stays L; menu-only bypass of the KeyL **open** gate; LOAD gated; SAVE writes; overlay-policy never writes `paused`; hold may set on open as today.  
**Status:** **closed in freeze.**

### Findings

No 🔴 Blocker.  
No open 🟠 Major **in the freeze**.

#### 🟡 Minor: Pause banner has no `role="dialog"` live

**Location:** `main.js` **169–173**  
**Issue:** Screen readers hear a raw `div` sentence. No accessible name. No focusable controls.  
**Fix:** PR1 `role="dialog"` and accessible name **Paused** (contract §0.13). Real `<button type="button">` rows.  
**Status:** accepted. Not live yet. Same as worker.

#### 🟡 Minor: Boot title hides `pauseEl` while `paused` is true

**Location:** `title.js` **67**; `main.js` **173**; CONTINUE **84–87**  
**Issue:** No pause menu on first boot (title owns). CONTINUE sets `paused = false` without a `pauseEl` helper today.  
**Fix:** Correct for boot. TITLE-from-pause must hide `pauseEl` the same way. `setPaused` must own in-run flag + display so CONTINUE cannot leave the banner.  
**Status:** accepted. Intentional desync.

#### 🟡 Minor: Settings already reachable via O

**Location:** `settings.js` **117**, **228–234**; title SETTINGS synthetic KeyO **129–135**  
**Issue:** Duplicate path after PR1 (menu + KeyO). Playtest still reads Settings as title-only because the **banner** has no path.  
**Fix:** Keep KeyO. Pause SETTINGS is discoverability. Do not remove the global toggle. Do not add expansion knobs.  
**Status:** wanted.

#### 🟡 Minor: Two different RESUME words (pause vs berth hold)

**Location:** freeze pause action `RESUME`; live berth `RESUME` (`save.js` **1577–1584**) plus “This is not Pause (P).” (**1395–1399**); `resumeBerthHold` **1485–1488**  
**Issue:** Berth-from-pause while autopilot or gate charge is live will show berth **RESUME** (drop hold / continue the leg) under a pause menu that also says **RESUME** (unpause). The sim stays paused after berth RESUME. Hint text already separates them. Same word is still easy to mix.  
**Fix:** Do **not** rename berth RESUME (CTL-03). Keep pause legend as **P to resume** the sim. Do not equate `berthHold` with pause. Optional: pause button copy `RESUME (P)` if playtest mixes them.  
**Status:** accepted copy risk. Not a merge of flags.

#### 🟡 Minor: `.screen-btn:disabled` paint exists only under title

**Location:** `screens.css` **550–554** (`.title-menu .screen-btn:disabled` only); generic `.screen-btn` **74–86** keeps `cursor: pointer`; berth LOAD **1559–1565**, **1610–1613**  
**Issue:** PR1 named-disable LOAD via `disabled` + words. Berth LOAD still uses `.screen-btn`. Without a berth/disabled rule, hover/cursor can still look live. Words carry the cue (good). Visual disabled state is weak.  
**Fix:** PR1: keep `LOAD — resume first` (or equal) in `textContent`. Set `disabled`. Reuse a disabled style that is not color-only (cursor default + words). Do not restyle all station buttons. Do not use grey-only.  
**Status:** cheap fold for freeze. Call out in PR1.

#### 🟡 Minor: Pause chrome is inline and skips high-contrast / text scale

**Location:** `main.js` **170–171** inline `color:#6ff2e0;background:rgba(0,0,8,.45)`; contrast rules target `.screen-overlay` / `.screen-btn` (`screens.css` **574–587**); `--rw-text-scale` is on `#hud` (`settings.js` **73**)  
**Issue:** `body.rw-contrast` does not restyle `pauseEl`. Large text does not grow the banner. 0.45 scrim can sit on a bright scene. Later buttons appended to `pauseEl` inherit `letter-spacing:.3em` unless a panel resets it.  
**Fix:** PR1: heading + `.screen-btn` (or a small panel class) so contrast/hover/focus-visible apply. Do not inherit 0.3em onto buttons. Do not invent new motion. Keep z 50.  
**Status:** accepted unless playtest fails contrast. Not a reason to raise z.

#### 🟡 Minor: Mutex refuse of BERTH from pause is silent

**Location:** `setBerthOpen` `canOpenPlayCard` (`save.js` **1443–1447**); contract §0.1 BERTH “refuse → skip”; hail/chart mutex `overlay-policy.js` **7**, **118–128**  
**Issue:** Pause can cover hail (z 40 under pause 50) without closing it. BERTH from the menu then skip with no named reason. Similar shape to today’s silent LOAD refuse.  
**Fix:** Fail closed: skip, never throw, never unpause. If playtest hits it, name the skip in existing toast/copy. Do not steal overlay-policy as a pause writer.  
**Status:** accepted fail-closed. Call out in PR1.

#### 💡 Suggestion: Initial focus on the first pause button

**Location:** later `pauseEl` menu; Settings does not move focus today (`settings.js` **215–226**)  
**Issue:** Keyboard users who tap P still need Tab to reach new buttons.  
**Fix:** Optional: focus RESUME on open. Do not add a new trap that steals Settings/berth focus. Escape stays Settings/berth close, not a new pause-only remap.

#### 💡 Suggestion: Optional PR2 still

One still: in-run P at a mid-size viewport; four named buttons visible; SETTINGS opens at z 80; dim click does **not** resume; BERTH SAVE works; LOAD reads resume-first; TITLE remounts; CONTINUE hides banner; KeyP ignored while typing/models/title; hub empty; no new motion; no expansion knobs.

#### 💡 Suggestion: Do not add hover animation

Buttons and existing `.screen-btn:hover` are enough. Do not add pulse that ignores `reducedMotion`.

### Verdict

No 🔴/🟠 remain **in the freeze**. Live copy-only banner (`main.js` **172**) stays until PR1. Dialog role, LOAD named-disable, click-through `pointer-events: none` while covered, `textContent` labels, KeyP + guards, z 50 under settings 80 / title 70 / berth 60, LOAD refuse, Settings FIELDS unchanged, and `berthHold` ≠ pause are PR1 UI law. Do not CONSUME. Do not steal Settings expansion.
