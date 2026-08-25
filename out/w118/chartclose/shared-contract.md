# NAV-06 remaining close-chart-on-AP shared contract

**Wave:** 118. Design only. No chart-close-on-AP ships in this wave.  
**Status:** MERGE LAW for `docs/Nav06ChartCloseDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1 chart-close-on-AP** (named only).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Hud*`, `docs/OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave118.md`. Do not write sibling Wave 118 paths (`out/w118/overlay/**`, `out/w118/toast/**`). Do not steal `out/w117/**`, `out/w116/**`.  
**Locked sources:** wishlist IDEA (P2, NAV) close-chart-on-AP (**cite, do not edit**); live inventory `out/w118/chartclose/current-chartclose-inventory.md` (code wins); NAV-05 `showApLive` + WAVE117 `chartStayOpen` / `chartEngageStay` (**cite; overlay this wave keeps pins true; later serial retunes**); overlay sibling open-gate mutex (**cite; do not fight**); CTL-01 KeyJ (**cite, do not remap**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins.

**This leftover is close the Galaxy Chart on successful Autopilot engage only.** It is **not** CTL-01 KeyJ. It is **not** overlay hail/chart/berth mutex. It is **not** NAV-05 `showApLive` rewrite. It is **not** P1 toast-flood. It is **not** P2 chart-label a11y. It is **not** HUD-02 combat rails.

**Live path:** Autopilot button `tryEngage` does **not** call `setOpen(false)`. Chart stays full-screen while `nav.autopilot` becomes true. **Leftover is real. Not CONSUME. Serial is not none.** Do **not** freeze CONSUME because NAV-05 chose chart-open-on-engage.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No overlay pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard. Digit 8 dock root stays launch. Digit 9 dock root stays epics.
3. KeyM stays chart. KeyP stays pause. KeyO stays settings. **Do not remap those keys.** CTL-01 **KeyJ** is a sibling dock/jump bind — **cite, do not remap**. **Do not edit `controls.js`.**
4. `innerHTML` forbidden later. Chart copy / live line / buttons use `textContent` / `createTextNode` / `h()` / `el()` only. Live `showApLive` already uses `textContent` (`galaxychart.js` 578–582). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. **Do not** invent UU. **Do not** invent SKU. **Do not** invent Digit. Kit mutate omit. Aim-glass gauges stay off.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. `chartOpen` stays **session** (`ctx.flags.chartOpen`). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Fail closed:
    - Never freeze the sim forever. Chart close **must not** set `ctx.flags.paused`. Title / origins / models / KeyP already pause — **keep**.
    - Never throw. Engage click already returns on `apBtn.disabled`. Keep that. Missing `setOpen` → do not invent a second closer. Keep flying.
    - Title open (`#rw-title`), models open, or typing in INPUT/TEXTAREA/SELECT/contentEditable → do not add a new KeyM listener. Never throw.
    - If overlay helper is missing, still call live `setOpen(false)`. **Never stop** the loop.
    - Do not teleport. Do not skip zone/charge. Do not emit `jumpRequested` from the chart.
8. NAV-05: later write-set **must not** rewrite `galaxychart.js` `showApLive` / `#rw-galaxy-ap-live`. You **may call** `setOpen(false)` on successful engage. Do not steal `autopilot.js` jump emit. `gate.js` stays sole `jumpRequested` writer.
9. Overlay sibling **this wave** writes `galaxychart.js` **open-gate mutex only** and is **forbidden** to close the chart on engage. Later PR1 must **not** fight mutex: close is a real `setOpen(false)` and **should flush deferred hail**. Do not special-case skip flush. Do not edit overlay files in this leftover.
10. P1 toast-flood is a **different** inbox item. Do **not** dedupe toasts. Do **not** raise `.rw-toasts` z-index. Do **not** emit a new success toast. P2 chart-label a11y — do **not** make labels into hit targets here.
11. Wave 40: `initTitle` stays `systems[0]`. Settings stays able to open over title (z 80). Do **not** invert title capture. Do **not** put the chart above `#fatal` (99).
12. Prototype-safe later close: call existing `setOpen`. Never `for-in` a save blob into open flags. Never parse untrusted HTML into the live line.
13. CPU: **no** per-frame DOM alloc for close. Close is on the Autopilot **click** path only.
14. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`. Do not write `docs/OwnerDecisionsWave118.md`. Deputize defaults live in **this** contract.
15. Do not steal `out/w118/overlay/**`, `out/w118/toast/**`, `out/w117/**`, `out/w116/**`.
16. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul, WAVE85, WAVE88).
17. `reducedMotion`: do **not** invent chart-close animation.
18. Accessibility: chart already names close (M / Escape / `aria-label` Close galaxy chart). Auto-close on success is extra. Keep Autopilot / Cancel labels. Color is not the only cue: live line stays text. Do not make chart labels into hit targets.
19. **Focus after success close (designer Major — freeze):** After successful Autopilot **button** engage, later PR1 must call real `setOpen(false)`, **then** if `document.activeElement` is inside the chart root, **blur** it. Prefer move focus to the already-named HUD `#hud .rw-autopilot-cancel` **when that chip is visible** (ancestor `.rw-autopilot` does not have `is-hidden`; live `hud.js` 1033–1041, 1717). If the chip is still hidden this frame, **blur is enough**. Do **not** add a new KeyM listener. Do **not** start a close animation. Do **not** emit a toast. Do **not** rewrite `showApLive`. Authored selector only. Never throw if `document` / `activeElement` is missing.

---

## 0.1 Wave 118 deputize (owner may override after playtest)

Pick a playable **close-chart-on-successful-AP** default. Inventory proves **chart stays open after engage**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Chart z | 30; full-screen; sim live; `chartOpen` | `hud.css` 1906–1912; `galaxychart.js` 421–433 |
| Engage path | AP button → `tryEngage`; success does **not** close | `galaxychart.js` 625–642 |
| `showApLive` cancel | while `chartOpen` | 629 |
| `showApLive` fly disengage | while `chartOpen` | 719–730 |
| Steer freeze | `chartOpen` → `steerArmed = false` | `autopilot.js` 155–156, 220 |
| Jump emit | `gate.js` only | `gate.js` 678 |
| WAVE117 stay | `chartStayOpen` / `chartEngageStay` must be true **this wave** | `boot-test.mjs` 23550, 23624–23627 |
| Overlay helper | **PRESENT** (sibling landed) | `src/systems/overlay-policy.js`; chart open-gate `canOpenPlayCard` / `playSurfaceBlocked` (`galaxychart.js` 5, 422–425, 681–684) |
| Hail flush | `takeDeferredHail` in hail **update**, not a second helper | `overlay-policy.js` 158–172; `hail.js` 512–516 |

Do **not** “fix” the map by pausing the world. Inbox asked to **close** or to require close. Deputize **close on success**.

### Playable policy (smallest additive)

**Name:** close the Galaxy Chart on **successful** Autopilot engage only.

| Piece | Freeze |
|---|---|
| Success | `tryEngage(ctx)` returns `''` on the chart Autopilot **button** (not-flying branch). Then real `setOpen(false)`. Then blur chart focus; prefer HUD `#hud .rw-autopilot-cancel` if that chip is visible (§0.19). |
| Refuse | Token truthy. Chart **stays**. Existing `showApLive(apLine(token))` stays. |
| Cancel | Flying branch. `disengage` + `showApLive(apLine('cancel'))` while open. Chart **stays**. |
| Fly disengage | `autopilotDisengaged` while `chartOpen` still paints `showApLive`. **Do not rewrite** that function or those lines. |
| Pause policy | Chart close **never** writes `flags.paused`. |
| Teleport / zone | **Forbidden**. Charge and zone stay. `gate.js` still emits jump. |
| Overlay | Real close. Overlay mutex must not block close. Hail flush is live `takeDeferredHail` in `hail.js` **update** once `chartOpen` is false. Do **not** skip flush. Do **not** invent a second overlay-policy. |
| Helper | Overlay helper **already exists**. Later PR1 **must not** write `overlay-policy.js`. Call `setOpen(false)` only; hail update already takes the defer slot. |
| Persist | **none**. |
| WAVE pins | Overlay **this wave** keeps `chartStayOpen` / `chartEngageStay` true. **Later** boot-test retunes them: Autopilot **button** success → `chartOpen === false` and `nav.autopilot === true`. Direct `tryEngage()` is **not** the player path. |
| Fail-closed | Never throw. Never pause. Title capture stays. |
| Home | `galaxychart.js` engage-success close only + later WAVE pin retune. |

Owner freeze (do not invert):

- Flying behind an open full-screen map is a **bug**, not a feature. Not CONSUME.
- NAV-05 chart-open-on-engage is a **sibling constraint**, not a product close of this inbox.
- Do **not** pause the sim to fake a closed map.
- Do **not** persist `chartOpen`.
- Do **not** steal KeyJ, Digit 0/8/9, `showApLive` rewrite, toasts, or labels-as-hits.
- If `setOpen` is missing, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// CHART AP BUTTON — not-flying branch (live 633–641; re-census at impl)
const token = tryEngage(ctx)
if (token) {
  // refuse — KEEP chart open; existing showApLive(line); existing commLine
} else {
  // success — KEEP existing showApLive(''); THEN:
  setOpen(false)   // real close; hail.js update takeDeferredHail
  // if document.activeElement is inside chart root → blur()
  // if #hud .rw-autopilot-cancel chip is visible → focus that named Cancel
  // else blur is enough (chip may still be is-hidden until hud.js 1717)
}

// NEVER on this leftover
ctx.flags.paused = true
ctx.emit('jumpRequested', …)   // gate.js only
WORLD_FIELDS.push('chartOpen')
showApLive = function …        // do not rewrite
new KeyM listener
close animation
toast / extra commLine on success
```

Do **not** close on refuse. Do **not** close on cancel. Do **not** rewrite `showApLive`. Do **not** skip hail flush. Do **not** leave keyboard focus inside `aria-hidden` chart.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** because NAV-05 stay-open | **Forbidden** — inbox still unsolved |
| Pause sim under chart | **Forbidden** §0.7 |
| Close on refuse/cancel | **Forbidden** §0.1 |
| Rewrite `showApLive` / `#rw-galaxy-ap-live` | **Forbidden** §0.8 |
| Close from `autopilot.js` `tryEngage` | **Forbidden** — button path only |
| Emit `jumpRequested` from chart/AP leftover | **Forbidden** §0.8 |
| Overlay PR1 close on engage | **Forbidden this wave** §0.9 |
| Skip hail flush on AP close | **Forbidden** — fights mutex; live flush is `takeDeferredHail` in `hail.js` update |
| New / second `overlay-policy.js` from this leftover | **Forbidden** — helper already present |
| Leave focus inside `aria-hidden` chart after success close | **Forbidden** §0.19 |
| New KeyM listener / close animation / success toast | **Forbidden** §0.10 / §0.17 / §0.19 |
| Persist `chartOpen` | **Forbidden** §0.6 |
| Steal Digit 0/8/9 / hub pip | **Forbidden** §0.2 |
| Remap KeyM or KeyJ | **Forbidden** §0.3 |
| Toast-flood / toast z-index | **Forbidden** §0.10 |
| Chart-label a11y / labels as hits | **Forbidden** §0.10 |
| HUD-02 combat rails / `hud.js` | **Forbidden** |
| CTL-01 `controls.js` | **Forbidden** §0.3 |
| `innerHTML` live line | **Forbidden** §0.4 |
| `state.js` write | **Forbidden** §0.5 |
| New Digit / UU / SKU | **Forbidden** |
| Aim-glass gauges | **Forbidden** §0.2 |
| Freeze the sim on helper miss | **Forbidden** §0.7 |
| Explicit lock-until-close as required PR1 | **Not picked** — auto-close is deputize; owner may override |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| Chart `setOpen(false)` on AP success + blur / prefer HUD cancel focus | PR1 `galaxychart.js` engage branch only | overlay flush; AP steer; a11y |
| Chart KeyM / `setOpen` **open** gate | **overlay sibling** (this wave) | — |
| `ctx.flags.chartOpen` | live `setOpen` + PR1 success close | AP/AM; `controls.js` fireHeld (do not edit) |
| `showApLive` | **none** (NAV-05) | `#rw-galaxy-ap-live` |
| WAVE117 `chartStayOpen` / `chartEngageStay` | later boot-test retune (button path) | CI |
| `jumpRequested` | **none** (`gate.js` live) | jump.js |
| Overlay helper | **none** (already present; do not rewrite) | `takeDeferredHail` via hail update |
| `flags.paused` | **none** from this leftover | main loop |
| `state.js` / WORLD_FIELDS | **none** | — |
| Digit 0/8/9 / KeyJ / KeyT/V/K/X | **none** | consume |
| `hud.js` toasts / combat rails | **none** | — |
| `autopilot.js` | **none** | — |
| `controls.js` | **none** | — |
| `hail.js` | **none** | overlay flush consumer |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `#rw-title` present | no new key bind; title already capture |
| `ctx.models.isOpen()` | no new toggle |
| Focused INPUT / TEXTAREA / SELECT / contentEditable | no new toggle |
| Autopilot click, `tryEngage` returns token | chart **stays**; live refuse line |
| Autopilot click, token `''` | real `setOpen(false)`; AP remains engaged; blur chart focus; prefer visible `#hud .rw-autopilot-cancel` |
| Focused chart control after success close | **must not** stay inside `aria-hidden` root |
| Cancel while open | chart **stays**; `showApLive` cancel |
| Fly disengage while open | chart **stays**; `showApLive` reason |
| Overlay hail/berth mutex | **open** may refuse; **close** always runs |
| Deferred hail on AP close | **flush** (overlay). Do not skip |
| Overlay helper missing | still `setOpen(false)` + blur; never throw |
| HUD cancel chip still `is-hidden` this frame | blur chart focus; do **not** invent a new control; do **not** write `hud.js` |
| Pause KeyP | freeze loop as live; do **not** add pause from close |
| Docked | chart already closes (live 690). Keep |
| `reducedMotion` | n/a new motion |
| Settings open | may cover chart (Wave 40). Close still session flag |
| Direct `tryEngage()` from boot/tests | does **not** close (button path only). Later pins must click the button |
| Partial merge (close without pin retune) | WAVE117 stay pins may still pass via `e117(ctx)`. Later PR1 **must** retune button pins so product close is tested |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 chart-close-on-AP** | `galaxychart.js` engage-success real `setOpen(false)` + blur/prefer HUD cancel focus (§0.19); later-wave boot-test retune `chartStayOpen` / `chartEngageStay` on Autopilot **button**. **Re-census lines at impl** (overlay already shifted them). | `state.js`; Digit remap; persist; `autopilot.js`; `showApLive` rewrite; `jumpRequested`; overlay mutex rewrite; `overlay-policy.js`; `hail.js`; toast-flood; chart-label a11y; KeyJ; HUD-02 rails; `innerHTML`; pause-the-sim; teleport; new KeyM listener; close animation |
| **PR2 stills (optional)** | Playtest stills: map gone after success; refuse keeps map; cancel-while-open live line | Required if PR1 code is enough; toast-flood; known FAILs |
| **PR3 census (optional skip)** | Re-grep: success branch `setOpen(false)`; refuse/cancel do not; `showApLive(apLine('cancel'))` still present; `gate.js` still sole jump emit | New world field |

---

## 4. Later write-set (named files; do not write this wave)

**Allowed (narrow):**

- `src/systems/galaxychart.js` — **engage-success close only** (real `setOpen(false)` after empty `tryEngage` token on the Autopilot button, then blur chart focus / prefer visible `#hud .rw-autopilot-cancel`). **Re-census this file at impl.** Forbidden: rewrite `showApLive`, `#rw-galaxy-ap-live`, hover, labels, hit discs, overlay open-gate (`canOpenPlayCard` / `playSurfaceBlocked`)
- `scripts/boot-test.mjs` — **later wave only**: retune WAVE117 `chartStayOpen` / `chartEngageStay` to Autopilot **button** success → chart closed. Do **not** invert overlay-this-wave pins. Do **not** “fix” known FAILs

**Forbidden now and later:**

- `src/systems/overlay-policy.js` (helper **already present**; hail flush is `takeDeferredHail` in `hail.js` update — do **not** invent a second helper)
- `src/systems/hail.js`
- `src/systems/hud.js` toasts / combat rails
- `src/systems/controls.js` (KeyJ remap / TRACKED / help — CTL-01)
- `src/game/autopilot.js` (`jumpRequested`, `tryEngage` body, steer freeze rewrite)
- `src/systems/gate.js` (sole `jumpRequested` writer — do not steal)
- `src/systems/galaxychart.js` `showApLive` / `#rw-galaxy-ap-live` rewrite
- `src/game/state.js`
- `src/systems/station.js` Digit map
- `public/**`, `package.json`, wishlist, `PROGRESS.md`
- `out/w118/overlay/**`, `out/w118/toast/**`, `out/w117/**`, `out/w116/**`
