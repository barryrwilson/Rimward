# Wave 118 census — P2 NAV close-chart-on-AP

**Census time:** 2026-08-25 (re-census after overlay landed). **Code wins.** Line numbers are 1-based from live `src/` at this census. Later PR1 **must re-census** `galaxychart.js` again before edit.

**Leftover:** **REAL.** Chart stays open on successful Autopilot engage. Serial **PR1 chart-close-on-AP**. **Not CONSUME.**

**Not this leftover:** overlay hail/chart/berth mutex (Wave 118 overlay sibling; open-gate only; forbidden to close on engage). NAV-05 `showApLive` / WAVE117 stay pins (sibling constraint). P1 toast-flood. P2 chart-label a11y. CTL-01 KeyJ. HUD-02 combat rails. HUD-01 hub.

---

## 1. Verdict table

| Question | Live | Cite |
|---|---|---|
| Chart closes on successful AP engage? | **NO** | `galaxychart.js` 633–641 — no `setOpen(false)` |
| Player flies behind full-screen map? | **YES** | `hud.css` 1898–1916 `inset:0` z 30; `nav.autopilot` true after empty token |
| `setOpen(false)` sites | Close ×, KeyM-while-open, Escape, docked | 644, 680, 687, 700 — **not** engage |
| `showApLive` on cancel while open | **LIVE** | 629 |
| `showApLive` on fly disengage while open | **LIVE** | 719–730 |
| WAVE117 `chartStayOpen` | requires stay after `e117(ctx)` | `boot-test.mjs` 23547–23550 |
| WAVE117 `chartEngageStay` | requires stay + autopilot after `e117(ctx)` | 23620–23627 |
| Overlay `overlay-policy.js` | **PRESENT** | `src/systems/overlay-policy.js`; chart import **5** |
| Hail flush | `takeDeferredHail` in hail **update** | `overlay-policy.js` 158–172; `hail.js` 512–516 |
| HUD AP Cancel | named button; hidden until AP frame | `hud.js` 1037–1041, 1717; `#hud .rw-autopilot-cancel` |
| `jumpRequested` from chart/AP | **none** | only `gate.js` 678 |
| `innerHTML` in galaxychart | **none** | grep none |
| CONSUME because NAV-05 stay-open? | **NO** — sibling constraint, not inbox close | owner request |

---

## 2. Inbox (cite, do not edit wishlist)

`docs/PLAYER-EXPERIENCE-WISHLIST.md` 69–72:

> IDEA (P2, NAV): Starting Autopilot from the Galaxy Chart begins moving the ship behind the still-open full-screen map; close the chart automatically on successful engagement, or present an explicit state that requires closing the chart before flight resumes.

---

## 3. Galaxy chart engage / close (`src/systems/galaxychart.js`)

Header **24–27**: KeyM toggle; **does not pause**; flight keys keep working. `aria-modal='false'` (**113**) — gameplay continues underneath.

Root **110–116**: `.rw-galaxy-chart`; dialog; `aria-hidden` with open.

`#rw-galaxy-ap-live` **137–142**: `role='status'` `aria-live='polite'`. `textContent = ''` at build. NAV-05 owns paint.

Autopilot button **147–153**: class `rw-galaxy-ap`; Space guarded. Close button **155–159**: `aria-label` Close galaxy chart.

`setOpen` **421–433**:

- **open** gated by `canOpenPlayCard(ctx, 'chart')` (**422–425**); catch skip mutex
- writes module `open` and `ctx.flags.chartOpen`
- toggles `is-hidden` and `aria-hidden`
- open → `updateHitRadii`; close → `clearHover`
- **close is not mutex-gated** (`if (next)` only)

**Only writer of `flags.chartOpen`** (`ctx.js` 208 / 263).

`showApLive` **578–582**: `apLive.textContent = line`; TTL `AP_LIVE_LIFE = 4` (**575**). **Do not rewrite.**

`syncApButton` **596–623**: Autopilot vs Cancel autopilot; dim on `apRefuseToken`.

AP click **625–642**:

```
if (apFlying()) {
  disengage(ctx, 'cancel');
  if (chartOpen) showApLive(apLine('cancel'));  // 629 — KEEP
  return;
}
const token = tryEngage(ctx);                   // 633
if (token) { showApLive(line); commLine }       // refuse — KEEP open
else { showApLive(''); }                        // success — NO setOpen(false)
syncApButton();
```

**No close on success.** This is the leftover.

Other `setOpen(false)`:

| Site | Line | Trigger |
|---|---|---|
| Close × | 644 | click |
| KeyM | 680 | chart already open |
| Escape | 687 | chart open |
| Docked | 700 | `update` while docked |

KeyM open **681–684**: `!docked && !paused` and `playSurfaceBlocked` is not true. Overlay **open** gate only. That gate is **not** close-on-AP.

Fly disengage paint **719–730**: if `chartOpen`, each `autopilotDisengaged` (skip `restore`) → `showApLive(apLine(reason))`. **KEEP.** NAV-05.

Hit discs / labels: hover **662–672**; click plot **651–660**. P2 chart-label a11y is **another inbox**. Do not enlarge labels here.

`innerHTML`: none in this file.

---

## 4. Autopilot (`src/game/autopilot.js`) — read only later

Header **1–3**: does **not** emit `jumpRequested`.

`inputBreak` **155–156**: if `chartOpen`, `steerArmed = false` (mouse look does not cancel AP while the map is up).

`tryEngage` **209–222**: refuse token or set `nav.autopilot = true`, emit `autopilotEngaged`, `steerArmed = chartOpen ? false : true`. **Does not close the chart.** Later leftover **must not** close from here (WAVE117 pins call `tryEngage` directly; player path is the button).

`apLine` **230–234**: frozen literals. Unknown token → `''`.

**Forbidden later:** this file. Do not steal jump emit.

---

## 5. Jump (`src/systems/gate.js`) — sole writer

`jumpRequested` emit **678**: `ctx.emit('jumpRequested', { to: near.to })` when in zone and (`dockPressed` or AP `wantJump` to next hop). Charge/zone live (`JUMP.zone === 60` pinned WAVE117 `zoneUnchanged`).

Grep `emit('jumpRequested'` under `src/`: **only** `gate.js`. Chart and autopilot do not emit. Later leftover must keep that.

---

## 6. WAVE117 pins (`scripts/boot-test.mjs`)

Block **23417–23699** WAVE117 NAV-05 PR1.

| Pin | How it is measured | Product vs pin |
|---|---|---|
| `chartStayOpen` 23550 | After `dispatchKey('KeyM')` then **`e117(ctx)`** (`tryEngage` import), `chartOpen` still true | Direct `tryEngage` — **not** Autopilot button |
| `chartEngageStay` 23624–23627 | After another `e117(ctx)`, `tokChart===''` && `chartOpen` && `nav.autopilot` | Same — direct engage |
| `chartCancelLive` 23628–23633 | Then `apBtn117.click()` (flying → **cancel** branch), live `textContent === cancel` | Button cancel **while open** — KEEP this product |

Overlay sibling **this wave** must keep `chartStayOpen` / `chartEngageStay` **true**. Later **PR1 chart-close-on-AP** retunes those two pins: drive `.rw-galaxy-ap` click on the **not-flying** branch; expect `chartOpen === false` and `autopilot === true`. Keep `chartCancelLive` by reopening the chart (KeyM) then Cancel, or by cancel-while-open without going through success-close.

A later close that only runs on the **button** will **not** invert today’s `e117(ctx)` stay pins. That is why pin retune **must** switch to the button. Do not treat a passing old pin as product close.

Do **not** invert WAVE85 / WAVE88. Do **not** “fix” known boot FAILs.

---

## 7. Overlay coupling (sibling this wave)

Wave 117 overlay freeze: `out/w117/overlay/shared-contract.md` — chart write-set = KeyM / `setOpen` **open gate only**. Close on AP **forbidden** there.

Wave 118 overlay PR1 **landed**: `src/systems/overlay-policy.js` **present**. Chart import **5**. `setOpen` open-gate **422–425**. KeyM open-gate **681–684**. Hail flush is **`takeDeferredHail`** (`overlay-policy.js` **158–172**) called from **`hail.js` update 512–516** when the hail card is not open and chart/berth are closed. **Do not invent a second overlay-policy.** **Do not skip hail flush.** **Do not write `hail.js`.** Overlay remains **forbidden** to close the chart on engage.

Later **PR1 chart-close-on-AP**:

- Calls live `setOpen(false)` on success (**re-census lines at impl**).
- That is a **real close** (`chartOpen` false, `is-hidden`, `aria-hidden`, `clearHover`).
- Overlay **must not** refuse close (live: mutex only when `next` is true).
- Hail update can then `takeDeferredHail`.
- After close: blur focused node inside chart root; prefer visible `#hud .rw-autopilot-cancel`.
- Do not steal `out/w118/overlay/**`.

`controls.js` **476**: `fireHeld` suppressed while `chartOpen`. Close restores fire. **Do not edit** `controls.js`.

---

## 8. CSS / HUD / flags

| Surface | Live | Cite |
|---|---|---|
| Chart full-screen | `position:fixed; inset:0; z-index:30;` dim `rgba(2,6,13,0.82)` | `hud.css` 1898–1916 |
| Hidden | `.is-hidden { display:none }` | 1918 |
| `flags.chartOpen` | session; not WORLD_FIELDS | `ctx.js` 208 |
| WORLD_FIELDS | no chart key | `save.js` 76–101 |
| HUD-01 hub | empty 80 px — do not pip | honor |
| Digit 0 | shipyard | honor |
| HUD AP Cancel | `#hud .rw-autopilot-cancel`; chip `is-hidden` until AP | `hud.js` 1033–1041, 1717 |

---

## 9. Sibling steal checks (do not touch)

| Sibling | Live | This leftover |
|---|---|---|
| NAV-05 `showApLive` | 578–582, 629, 719–730 | **call** `setOpen`; **do not rewrite** |
| Overlay mutex | this-wave sibling | **do not fight**; real close |
| CTL-01 KeyJ | `controls.js` dock | **do not edit** |
| P1 toast-flood | other census | **no new toast / commLine on success** (success already `showApLive('')`) |
| P2 chart-label a11y | other inbox | **labels stay labels** |
| HUD-02 rails | `hud.js` | **none** |

---

## 10. Proof leftover is not CONSUME

1. Engage success branch **638–641** has no `setOpen`.
2. WAVE117 **requires** stay-open via `tryEngage` (sibling law).
3. Overlay this wave **must not** close on engage.
4. Inbox still describes flying behind the map.
5. Therefore leftover is **REAL**. NAV-05 stay-open does **not** consume this inbox.
