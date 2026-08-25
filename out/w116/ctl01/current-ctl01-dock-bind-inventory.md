# CTL-01 remaining dock/jump bind — live inventory

**Wave:** 116. Markdown only. Code wins over wishlist copy.  
**Census date:** 2026-08-24.  
**Scope:** leftover **human dock/jump key** vs lateral strafe on `KeyD`.  
**Not this leftover:** autopilot `wantJump` / NAV-05 handoff. HUD-02 combat rails. P1 overlay stacking. HUD-01 hub. Digit map.

Line numbers are 1-based from live `src/` / `scripts/boot-test.mjs` at census. If a later serial or sibling moved a symbol, **re-census**; do not trust this file over `src/`. HUD-02 Wave 116 sibling writes `src/systems/hud.js` combat rails — **prompt copy cites may shift**; re-grep `pKey = 'D'`.

---

## 0. Frozen records / inbox (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| D = strafe **and** dock/jump | wishlist IDEA (P0, CONTROLS) **cite, do not edit** | **LIVE dual-bind.** Leftover **real** |
| Title first in systems[] | Wave 40 | **LIVE.** `main.js` 105–106 `initTitle` is `systems[0]` |
| AP jump | NAV-03 / NAV-05 | **LIVE** `wantJump` OR in `gate.js` 648. Independent of KeyD |
| Digit 0/8/9 | HUD-01 / station | **LIVE** `DOCK_KEY_SERVICES` `station.js` 188, 5964–5965, 6100–6105 |
| KeyT/V/K/X | TGT-05 / MATCH | **LIVE** `controls.js` 44, 268, 280–290 |

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

---

## 1. Dual-bind (`src/systems/controls.js`) — leftover

Header documents both:

- 19: `A / D` → lateral strafe (D = right)
- 30: `H (tap) → hail · D (tap) → dock`

`TRACKED` **41–48**: `KeyW KeyA KeyS KeyD KeyR KeyF KeyQ KeyE KeyT KeyH KeyC KeyX KeyV KeyN KeyK Digit1–5 Shift Space`. **No KeyJ. No KeyI. No KeyU. No KeyG/M/L/P/O** (other systems).

`pendingDock` **233**; cleared with other pendings **245**, **377**.

Keydown **259–276**:

```
if (e.repeat || !TRACKED.has(e.code)) return;
...
case 'KeyD':
  pendingDock = true;
```

Publish **370**: `input.dockPressed = pendingDock`.

Held axes **440**:

```
input.strafeX = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0);
```

**Same key** is one-frame dock edge **and** continuous strafe-right. This is the leftover.

HUD help filled once **340–360**:

- 343: `'A/D — lateral strafe (D = right)'`
- 353: `'H — hail · D — dock · C — camera (chase / third / first-person)'`
- 356: `'G — cycle hub route at a Lamplighter junction'` (KeyG **not** in TRACKED; `gate.js` owns it)

`hud.js` **1019–1023** copies `ctx.config.controls` into `<li>` via `el(..., String(line))` (`textContent` path in `el()`). No `innerHTML` in `hud.js` at census.

---

## 2. Context comments (`src/core/ctx.js`)

- **15**: `input` written **ONLY** by `controls.js`.
- **76**: `strafeX: 0, // >0 = strafe right (D)`
- **88**: `dockPressed: false, // edge: D`
- **97–104**: `autopilot.wantJump: false` — AP channel, not persist.

Later PR1 may retouch **comments** on 76/88. Must **not** add a new input field.

---

## 3. Human jump vs AP (`src/systems/gate.js`)

Header **35–36** says zone checks enable “dock input (KeyG)” to pick a destination — **stale wording**. KeyG **cycles** hub routes. Jump uses `dockPressed`, not KeyG.

Hub cycle listener **577–585**: `e.code !== 'KeyG'` return; requires `zoneHub`, not docked/paused/jumping.

Jump emit **641–650**:

```
apJump = nav.autopilot && ctx.autopilot.wantJump && near.to === nextHop
if (inZone && !docked && !jumping && (ctx.input.dockPressed || apJump))
  emit('jumpRequested', { to: near.to })
```

Human path: `inZone && dockPressed`. AP path: `wantJump` separately. **Do not require the new key for AP.** **Do not make AP write `dockPressed`.**

`main.js` **111–113**: `initGate` **before** `initControls`. Gate reads **previous-frame** `dockPressed` (same as live D). Remap does not change that timing.

---

## 4. Station dock (`src/systems/station.js`)

Update **6247–6259**: `inZone = dist <= U.DOCK_RANGE`. If `dockPressed` and live station: optional pull-in when `dist <= DOCK_RANGE * 2`; `dock()` when `dist <= DOCK_RANGE`; then `ctx.input.dockPressed = false`.

Station **reads** the edge. It does not care which key set it.

Docked overlay keys (not flight dock):

- KeyB undock **6095, 6127**
- KeyY shipyard **6097**
- Digit 0 last service / Digit 1–9 services **6098–6105**, **6143–6151**
- Market Q/W/A/S trade **6136–6138** (docked only)

---

## 5. HUD / onboarding / settings strings

### Context prompt (`src/systems/hud.js`)

DOM **837–839**: `.rw-prompt` + `.rw-prompt-key` + `.rw-prompt-verb`.

Logic **2124–2138** (re-census if HUD-02 sibling shifts lines):

| Zone | pKey | pVerb |
|---|---|---|
| Station inZone, not docked | `D` | `Dock` |
| Gate hub | `G` | `route n/m · D — Jump to <name>` |
| Gate physical | `D` | `Jump to <name>` |

Write **textContent** on change **2184–2185**. CSS `src/ui/hud.css` **741–772**: key chip cyan on void; verb cyan uppercase. Contrast body rule **1169**. Color is **not** the only cue (letter + verb already). Later copy must keep a **letter name**.

CONTROLS panel **1014–1023** from `config.controls`.

**Not this leftover:** combat rails, `tgtFacing`, class tokens, 80 px hub, RANGE. Sibling HUD-02 owns those.

### Onboarding (`src/systems/onboarding.js`)

- `'dock'` hint **50**: `'D — dock'`
- `'gate'` hint **53**: `'D — jump the gate'`
- Show via `el.textContent = hint.text` **102**
- Any keydown hides **108**

### Settings (`src/systems/settings.js`)

KeyO toggle / Escape close **228–234**. No dock string. No KeyJ. Panel has **no** `id` (anonymous overlay z-index 80).

---

## 6. Title / origin capture-phase (Wave 40)

### Title (`src/systems/title.js`)

Capture `keydown` **239** `{ capture: true }` / `onKey` **190–227**:

- Models open → return (browser handles)
- Repeat swallowed
- **KeyO / Escape pass through**
- Digit1–n activate entries
- **Enter** activates **first visible** entry (**217–222**)
- Every other key `preventDefault` + `stopImmediatePropagation`

KeyJ while title open **does not** reach `controls.js`. Enter **must not** be deputized.

### Origins (`src/game/origins.js`)

Bubble listener **143–149**: Digit only (`e.code.length === 6 && startsWith('Digit')`). Not capture. KeyJ ignored.

### Models (`src/systems/modelsbrowser.js`)

Capture **647 / 703–749**:

- Filter INPUT focused: arrows/Escape intercepted; **letters return without stopImmediatePropagation** so they reach the INPUT **and** bubble `controls.js`
- Else default: `stopImmediatePropagation` (modal)

**Later PR1 must skip `pendingDock` when typing or models open.** Live KeyD already pulses dock if the filter is focused.

### Pause (`src/main.js` **165–176**)

KeyP only; skips typing / models / `#rw-title`. Pattern to **copy** for dock skip.

---

## 7. Automine / MATCH / AP helm tables

### Autopilot `inputBreak` (`src/game/autopilot.js` **142–162**)

Helm: `strafeX` / `strafeY` / `roll` / `throttleHeld` / `afterburnerPressed` / `driftHeld` / `fullStop` / armed steer. **`dockPressed` is not helm.** KeyD cancels AP **because strafeX**, not because dock.

`wantJump` latch **317**: `inZone && !docked && nearTo === hop`. Zeroed **116**.

**Later: do not add KeyJ to helm.** Do not edit this file in CTL-01 leftover serial (NAV-05).

### Automine `inputBreak` (`src/game/automine.js` **166–186**)

Same helm table. **`dockPressed` not present.**

### MATCH (`src/systems/ship.js` **742–750**)

Toggle on `matchSpeedPressed` (KeyX). Cancel: docked, jumping, lost lock, `throttleHeld`, automine. **Not `dockPressed`. Not KeyD-as-dock.** Strafe during MATCH is **flight** (`strafeX` 863, 883), not cancel.

### Collision skip (`src/systems/ship.js` **906**)

Skip world collision while `dockPressed` (also docked / jumping). Remap keeps the edge; KeyJ tap still skips one frame. Holding D after PR1 will **not** skip collision via dock (only via not being `dockPressed`). Call out: tiny behavior change while holding D near bodies **in a dock pulse**. Today holding D keeps `pendingDock` only on **keydown**, not on hold (`e.repeat` return **260**) — so `dockPressed` is **one frame** even today. Hold-D collision skip is already one frame. Residual: none material.

---

## 8. Boot harness coupling (`scripts/boot-test.mjs`)

| Site | What | Later PR1 |
|---|---|---|
| **706, 732** | `dispatchKey('KeyD')` WAVE21 hub jump + back-gate jump | **Must** become `KeyJ` (or deputized key) **on purpose** |
| Comments **641–642, 702–705, 724** | “D — same dockPressed edge” | Update comments |
| **1137, 4460, 6572** | `ctx.input.dockPressed = true` dock helper | **Keep** (event name unchanged) |
| **1732** | WAVE6 `hintCardVisible('D — dock')` | **Must** become `'J — dock'` |
| **1723** | `dispatchKey('KeyZ')` unbound dismiss | **Keep KeyZ**; do not deputize Z |
| **19129–19130** | nav must not listen `type === 'dockPressed'` | Keep |

No `config.controls` string pin found at census. Help-line updates still required for players.

---

## 9. Unused-key census (flight)

| Letter | Live use |
|---|---|
| A S W D | Strafe. D also `pendingDock` |
| Q E | Roll |
| R F | Throttle |
| T H C X V N K | Tracked edges |
| G | Hub cycle |
| M | Chart |
| L | Berth |
| P | Pause |
| O | Settings |
| B | Undock (docked) |
| Y | Shipyard (docked) |
| I | **unused in src/** |
| J | **unused in src/** |
| U | **unused in src/** |
| Z | unused in src/; **WAVE6 unbound** |
| Enter | Title + death recover |

**Deputize KeyJ.**

---

## 10. Leftover vs CONSUME

| Question | Verdict |
|---|---|
| Is D still dual-bind? | **Yes** (`pendingDock` + `strafeX`) |
| CONSUME / serial none? | **No** |
| Serial name | **PR1 dedicated dock/jump bind** |
| Split dock vs jump? | **No** — one `dockPressed` family |
| Rename edge? | **No** |

---

## 11. Sibling do-not-steal

| Path | Owner |
|---|---|
| `src/systems/hud.js` combat rails / `src/ui/hud.css` class tokens | HUD-02 Wave 116 sibling (`out/w116/hud02tgt/**`) |
| `docs/Hud02RemainingTargetSilhouettesDesign.md` | HUD-02 leftover pack (Wave 115 freeze; sibling may extend) |
| `docs/Nav*.md` / `src/game/autopilot.js` | NAV-05 |
| `out/w116/nav05/**` | NAV-05 |
| wishlist / `PROGRESS.md` / `docs/OwnerDecisions*.md` | Honor; do not edit |
