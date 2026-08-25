# Wave 118 NAV-06 leftover — close-chart-on-AP

## Verdict

**Leftover is real.** Serial name: **PR1 chart-close-on-AP**. Serial is **not** none. **Not CONSUME.**

Do **not** freeze CONSUME because NAV-05 / WAVE117 chose chart-open-on-engage. That is a sibling constraint. The inbox is still unsolved: the ship moves behind a still-open full-screen map.

Deputize: `setOpen(false)` on **successful** chart Autopilot engage only. Do not close on refuse/cancel. Keep `showApLive` while the chart is open. Do not pause. Do not teleport. Do not skip zone/charge. Owner may override after playtest. Do not park.

## Census (code wins)

- `galaxychart.js` 421–433: `setOpen` writes `flags.chartOpen`. Open gated by `canOpenPlayCard`. Close still always runs. No pause.
- `galaxychart.js` 625–642: Autopilot click. Flying → cancel + `showApLive(apLine('cancel'))` if open (**629**). Else `tryEngage` (**633**). Token → refuse live line. Empty token → `showApLive('')`. **No `setOpen(false)`.**
- `galaxychart.js` 644, 680, 687, 700: `setOpen(false)` on × / KeyM-while-open / Escape / docked only.
- `galaxychart.js` 578–582, 719–730: `showApLive` NAV-05. `textContent` only. Do not rewrite.
- `hud.css` 1898–1916: full-screen z 30 dim. Player cannot see space while open.
- `autopilot.js` 155–156, 220: steer frozen while `chartOpen`. AP still engages. Ship still moves.
- `autopilot.js` 3, 209–222: no `jumpRequested`. `gate.js` 678 is sole emit.
- `scripts/boot-test.mjs` 23550, 23624–23627: `chartStayOpen` / `chartEngageStay` after **imported** `tryEngage`, not the Autopilot button. Overlay this wave keeps them true. Later serial retunes **button** path.
- `overlay-policy.js`: **PRESENT**. `takeDeferredHail` 158–172. Hail update flushes at `hail.js` 512–516. Overlay open-gate only; **forbidden** to close on engage.
- `controls.js` 476: `fireHeld` off while `chartOpen`. Do not edit controls. CTL-01 KeyJ stays.
- `state.js`: not a writer. WORLD_FIELDS has no chart key.
- `innerHTML` in galaxychart: none.

Flying behind an open map is **not** a feature. Treating NAV-05 stay-open as CONSUME would leave the inbox live.

## Deputize

- Close chart on **successful** AP engage only (real `setOpen(false)` after empty `tryEngage` token on the Autopilot **button**; then blur chart focus / prefer visible HUD Cancel).
- Do not close on refuse/cancel.
- Keep `showApLive` for cancel/disengage **while the chart is open**. Do not rewrite the function.
- Do not pause the sim. Do not teleport. Do not skip zone/charge.
- Overlay: real close. Mutex must not block close. Flush deferred hail. Do not skip flush.
- Do not write `overlay-policy.js`. Do not write `hail.js`. Helper and `takeDeferredHail` already exist.
- Later WAVE pin retune: Autopilot **button** success → `chartOpen === false` && `nav.autopilot === true`. Keep `chartCancelLive` on cancel-while-open.
- No hub pip, no Digit steal, no `state.js` write, no new persist key, no `innerHTML`.

## Later PR1 may write

- `src/systems/galaxychart.js` **engage-success close + focus only** (not `showApLive`, not overlay open-gate, not labels). Re-census lines at impl.
- `scripts/boot-test.mjs` **later wave** WAVE pin retune only (`chartStayOpen` / `chartEngageStay` via button)

Must **not** claim `src/game/autopilot.js`, `src/systems/gate.js`, `src/systems/controls.js`, `src/systems/hail.js`, `src/systems/hud.js` toasts, `showApLive` rewrite, or `overlay-policy.js`. This worker wrote **no** `src/`.

## Honor

- Wishlist Idea inbox P2 NAV close-chart-on-AP — cite, do not edit.
- `docs/Nav05HandoffDesign.md` — `showApLive` / chart-open-on-engage; cite; later may **call** `setOpen(false)`; do not rewrite live line.
- Overlay sibling this wave — `galaxychart.js` open-gate mutex only; forbidden to close on engage; WAVE117 stay pins stay true this wave.
- P1 toast-flood — different inbox; call out only.
- P2 chart-label a11y — different inbox; do not make labels hit targets.
- CTL-01 KeyJ — cite, do not remap. Do not edit `controls.js`.
- `docs/OwnerDecisions*.md` — cite, do not edit. No `docs/OwnerDecisionsWave118.md`.
- Do not steal `out/w118/overlay/**`, `out/w118/toast/**`, `out/w117/**`, `out/w116/**`.
- No wishlist. No `PROGRESS.md`. No `docs/Ctl02*` / `docs/Ctl01*` / `docs/Hud*` edits.

## Coupling for orchestrator

- Overlay sibling **this wave** writes `galaxychart.js` **open-gate**. Later PR1 close **must not land in this worker**.
- Later close is real `setOpen(false)`: overlay must **allow close**. Hail flush is live `takeDeferredHail` in `hail.js` update (512–516). Do not skip flush. Do not write a second overlay-policy.
- Later PR1 a11y: after `setOpen(false)` on success, if `document.activeElement` is inside the chart root, blur it; prefer focus `#hud .rw-autopilot-cancel` when that chip is visible. No new KeyM listener. No close animation. No toast. No `showApLive` rewrite.
- Later PR1 **re-census** `galaxychart.js` (overlay already landed: helper present; `setOpen` 421–433; engage 625–642; `setOpen(false)` 644 / 680 / 687 / 700).
- NAV-05 `showApLive` and this leftover **share** `galaxychart.js`. Impl touches the success branch **after** `tryEngage` only. Re-grep `showApLive` after merge.
- WAVE117 `chartStayOpen` / `chartEngageStay` measure **imported** `tryEngage`, not the button. Overlay keeps them true **this wave**. Later serial **retunes** pins to the button. If impl closes only on the button and forgets pin retune, CI can still pass while the product is fixed — **do not skip the retune**.
- `flags.chartOpen` is the AP steer-freeze and fireHeld signal. Real close unfreezes steer (`autopilot.js` 157–161) and restores fire (`controls.js` 476) without editing those files.
- `gate.js` stays sole `jumpRequested` writer. Do not skip zone/charge.
- Wave 40 title `systems[0]` capture still swallows keys. Keep that. No new listener.
- P1 toast-flood sibling: success already silent (`showApLive('')`). Do not add `commLine` on success.
- P2 chart-label a11y: do not touch labels/hit discs.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed. `[NO BROWSER COVERAGE]` is correct for this markdown freeze. No process to stop.
