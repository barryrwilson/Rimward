# UI Audit: CTL-05 PR1 pause menu ACCESS (Wave 142 designer)

**Auditor:** `[designer]` (independent of `out/w142/pause/ui-audit.md`)
**Scope:** Wave 142 Ctl05 pause menu ACCESS. Product `src/` review only. Scratch file, not product source.
**Review file:** `out/w142/designer/pause-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Merge law `out/w142/pause/shared-contract.md` (wins vs design doc). Worker self-audit `out/w142/pause/ui-audit.md` (read, not copied). Live cites: `src/main.js` pause dialog / `setPaused`; `src/systems/title.js` `openFromPause`; `src/game/save.js` `openFromPause` / LOAD named-disable. Neighbour cites only: `src/systems/settings.js`, `src/systems/overlay-policy.js`, `src/ui/screens.css`.
**Honor:** real buttons; `role="dialog"` named Paused; z 50/60/70/80; `pointer-events` none while covered; LOAD text not color-only; hit target; KeyP legend; no Settings expansion; no screen-btn steal; no `innerHTML`.
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`. No process to stop.
**Graph:** `graph_resolve` `r-mtbwt1z3-36e7f089` → `proceed_unmodeled` (no active workflow). Did **not** call `graph_propose` / `graph_approve`. Did **not** edit product `src/`.

## UI Audit: CTL-05 PR1 pause menu ACCESS

### Summary

In-run KeyP now opens a named Paused dialog with four real buttons (RESUME / SETTINGS / BERTH RECORDS / TITLE), a P-to-resume legend, and a 44 px hit row. Covering overlays keep pause hits off. LOAD while paused uses words, not hue. No 🔴 Blocker. No 🟠 Major.

### Verdict

**PASS.** 0 blockers, 0 majors, 5 minors (none block ACCESS), 3 suggestions. Honor holds. Worker self-audit agrees on the empty 🔴/🟠 set; this pass adds covered-dialog tab order and weak LOAD disabled paint as open 🟡 items, not ship blockers.

### What's done well

- Pause chrome is a real dialog: `role="dialog"` + `aria-label="Paused"` (`main.js` **171–172**). Accessible name matches the contract word **Paused**.
- Actions are real `<button type="button">` with `textContent` labels RESUME, SETTINGS, BERTH RECORDS, TITLE (`main.js` **198–223**). Authored ids only (`PAUSE_ACTIONS` **197**).
- Legend is words: `P to resume` (`main.js` **191–192**). Color `#6ff2e0` is extra, not the on/off cue.
- Hit targets on pause rows: `min-height:44px;min-width:44px;width:100%` (`main.js` **204**). Panel `min-width:280px;max-width:92vw` (`main.js` **181**).
- Focus ring is outline, not hue-only: `outline: 2px solid #6ff2e0` on focus, cleared on blur (`main.js` **207–213**).
- z ladder holds: pause **50** (`main.js` **175**), berth **60** (`save.js` **1375**), title **70** (`screens.css` **512**), settings **80** (`settings.js` **93**). TITLE-from-pause hides `pauseEl` instead of raising z (`main.js` **289–295**, `setPaused` **252–253**).
- Click-through freeze is live: `pauseEl` starts `pointer-events:none` (`main.js` **176**). `syncPauseCover` sets hits auto only when paused, shown, and not covered (`main.js` **237–243**). `runPauseAction` also returns when `pauseCovered()` (`main.js` **269**). Settings/berth roots stay `pointer-events:none` on the scrim (`settings.js` **91–93**; `save.js` **1373–1375**). Dim-ring click does **not** resume.
- `innerHTML` / `insertAdjacentHTML` / `document.write`: **none** in `main.js`, `title.js`, `save.js` pause/title/berth paths. Labels use `textContent`.
- Pause buttons do **not** take `.screen-btn` / `.screen-panel`. Title remount reuses live `#rw-title` / `.title-overlay` / `.screen-btn` (`title.js` **155–177**) without a `screens.css` write.
- Settings expansion is not this pack. Live `FIELDS` still lack invert / rebind / split volume (`settings.js` **29–38**). Pause SETTINGS dispatches existing KeyO (`main.js` **274–280**).
- LOAD refuse stays (`save.js` **1501–1505**). Named-disable while paused: `disabled = true` and `LOAD — resume first` (`save.js` **1615–1617**). Empty berth stays disabled `LOAD` (`save.js` **1622–1625`). SAVE still writes (`save.js` **1675+**).
- KeyP guards stay: typing / models / `#rw-title` (`main.js` **305–314**). Title capture still passes only KeyO/Escape (`title.js` **217–220**) and still swallows KeyP while `#rw-title` is a body child.
- CONTINUE uses `ctx.setPaused(false)` so the banner cannot stay up (`title.js` **75–82**). `openFromPause` remounts without skip marker and without reload (`title.js` **10–11**, **262–266**).
- No new animation. `reducedMotion` is not ignored. No per-frame pause DOM rebuild.

### Honor hold

| Honor | Live | Result |
|---|---|---|
| Real `<button type="button">` | `main.js` **198–200**, **220–223** | **Pass.** |
| `role="dialog"` named Paused | `main.js` **171–172** | **Pass.** |
| z 50 / 60 / 70 / 80 | `main.js` **175**; `save.js` **1375**; `screens.css` **512**; `settings.js` **93** | **Pass.** |
| `pointer-events` none while covered | `main.js` **176**, **226–243**, **269** | **Pass.** Actions ignored when covered. |
| LOAD text not color-only | `save.js` **1615–1617** | **Pass.** Words + `disabled`. |
| Hit target ≥ 44 px (pause rows) | `main.js` **204** | **Pass.** |
| KeyP legend | `main.js` **191–192** | **Pass.** `P to resume`. |
| No Settings expansion | `settings.js` **29–38**; pause opens KeyO only `main.js` **274–280** | **Pass.** |
| No `.screen-btn` steal / no `screens.css` write | pause buttons unclassed `main.js` **198–206**; title reuses live classes `title.js` **155–177** | **Pass.** |
| No `innerHTML` | pause / title remount / berth LOAD paths | **Pass.** |

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Pause dialog stays in the tab order while Settings or Berth cover it

**Location:** `src/main.js:237-243`, `src/main.js:226-234`, `src/main.js:252-253`, `src/main.js:269`
**Issue:** Title cover hides `pauseEl` (`display:none`), so those buttons leave the a11y tree. Settings and berth cover only set `pointer-events: none`. The Paused dialog stays `display:flex` with four enabled buttons. Keyboard Tab can land on RESUME behind z 80 / z 60. Enter is ignored (`pauseCovered()`), so this is not a resume leak, but it is a dead focus stop and a second `role="dialog"` still exposed to AT.
**Fix:** While covered, set `pauseEl` `inert` (or `aria-hidden="true"` plus `tabIndex=-1` on the four buttons). Keep `pointer-events: none`. Do **not** raise pause z. Do **not** move focus into pause while Settings/berth own the screen. Clear inert when cover drops.
**Status:** open. Not a Blocker: cover ignores actions; Escape/O still close Settings; L/Escape still close berth.

#### 🟡 Minor: Paused LOAD still looks live on hover

**Location:** `src/game/save.js:1562-1567`, `src/game/save.js:1615-1617`; `src/ui/screens.css:74-93`, `src/ui/screens.css:550-554`
**Issue:** Named-disable is correct (`disabled` + `LOAD — resume first`). Berth LOAD still uses `.screen-btn`. Generic `.screen-btn` sets `cursor: pointer` and `:hover` accent. `.screen-btn:disabled` paint exists only under `.title-menu`. A paused LOAD can still pick up hover chrome. Words carry the cue, so this is not color-only.
**Fix:** Keep the text. Add a berth-local disabled rule (cursor default, no hover accent) without editing station/title `.screen-btn` globally, **or** inline `cursor:default` on the LOAD button when paused. Do not grey-only. Do not write Settings expansion. Do not restyle all of `screens.css` as this pack’s vehicle.
**Status:** open. Cheap follow. Honor (text not color-only) still holds.

#### 🟡 Minor: Pause chrome skips high-contrast and text scale

**Location:** `src/main.js:173-206`; `src/ui/screens.css:574-587`; `src/systems/settings.js:73` (text scale on `#hud`)
**Issue:** `pauseEl` and its buttons are inline hex. `body.rw-contrast` retargets `.screen-overlay` / `.screen-btn`, not this dialog. `--rw-text-scale` does not grow pause type. The 0.45 scrim (`main.js` **175**) can sit on a bright station mesh; heading/legend sit on a 0.55 panel (`main.js` **181–182**). Buttons themselves are solid `#0a1418` (`main.js` **205**), so the actions stay readable.
**Fix:** Optional later: opaque panel and/or contrast hook that does **not** steal `.screen-btn` origin classes. Do not invent motion. Keep z 50.
**Status:** accepted unless playtest fails contrast. Not a reason to raise z or take `screens.css`.

#### 🟡 Minor: Two different RESUME words (pause vs berth hold)

**Location:** pause `RESUME` `src/main.js:220`; berth `RESUME` `src/game/save.js:1581-1587`; hint `src/game/save.js:1398-1402`
**Issue:** Berth-from-pause while autopilot or gate charge is live shows berth RESUME (drop hold / continue the leg) under a pause menu whose RESUME unpauses. After berth RESUME, the sim stays paused. Hint already says this is not Pause (P). Same word is still easy to mix.
**Fix:** Do **not** rename berth RESUME (CTL-03). Keep pause legend `P to resume`. Do not merge `berthHold` into pause. Optional copy `RESUME (P)` on the pause button if playtest mixes them.
**Status:** accepted copy risk. Flags stay distinct.

#### 🟡 Minor: BERTH mutex refuse from pause is silent

**Location:** `src/game/save.js:1649-1655`, `src/game/save.js:1446-1450`; contract refuse → skip
**Issue:** Hail/chart mutex can skip `setBerthOpen`. The pause BERTH RECORDS button still looks armed. Click then does nothing. Fail-closed is correct (no throw, no unpause).
**Fix:** Keep skip. If playtest hits it, name the skip on the existing toast path. Do not steal overlay-policy as a `paused` writer.
**Status:** accepted fail-closed.

#### 💡 Suggestion: Focus RESUME when the pause dialog opens

**Location:** `src/main.js:246-257` `setPaused(true)`
**Issue:** KeyP does not move focus. Keyboard users Tab from whatever sat behind the overlay. Enter on a focused pause button is already native (`main.js` **214–217**).
**Fix:** Optional: `pausePanel.querySelector('button')?.focus()` only when opening and **not** covered. Do not steal title or Settings focus while those overlays cover.
**Status:** optional later.

#### 💡 Suggestion: Pause-row hover without stealing `.screen-btn`

**Location:** `src/main.js:203-206`
**Issue:** Pause rows have `cursor:pointer` and a focus outline, but no hover border/background. Title/settings buttons use `.screen-btn:hover` (`screens.css` **88–93**). This pack must not steal those origin classes.
**Fix:** Tiny inline mouseenter/mouseleave border tweak, or a pause-local class in a file this pack already owns. No pulse. No `reducedMotion` animation.
**Status:** optional.

#### 💡 Suggestion: `aria-modal="true"` on the Paused dialog

**Location:** `src/main.js:170-172`
**Issue:** Name and role are present. Modal flag is not. HUD nodes behind the scrim can still sit in the a11y tree until cover/inert (see Minor 1).
**Fix:** Set `aria-modal="true"` on `pauseEl` when shown. Pair with inert/aria-hidden while covered.
**Status:** optional. Do not add a new key trap that swallows KeyO / KeyL / KeyP.

### Worker self-audit delta

`out/w142/pause/ui-audit.md` reports no Blocker/Major, cites dialog name, real buttons, 44 px, LOAD words, z ladder, pointer-events while covered, no `screens.css` steal, no expansion knobs. This pass agrees. Extra 🟡: covered-dialog tab order; LOAD hover/cursor on `.screen-btn`; high-contrast skip (called out in Wave 141 freeze, still live because PR1 avoided `.screen-btn`). Dim-ring-is-not-a-control stays **correct** (named actions only).

### Out of scope (do not steal)

- Settings inbox expansion (mouse invert, rebind, split volume)
- Org01 `screens.css` origin / Onb01 lesson
- CTL-03 `berthHold` rename or merge
- CTL-04 `fireHeld` / pad 2B
- Overlay-policy as a `paused` writer
- Product source edits this pass
