# Wave 96 NAV-04 verifier notes

Date: 2026-08-23
Status: CLEAN

## Probe

Command: `node --import ./scripts/with-css-stub.mjs out/w96/nav04/probe.mjs`
Result: PASS, 82 pins, fail 0. Log: `probe-out.json`.

## Static contract

- `src/systems/galaxychart.js`: no `innerHTML`. Hover uses `textContent` + SVG attrs.
- Hover path: `pointerover` / `pointerleave` call `applyHoverId` / `clearHover` only. No `plotRoute` / `clearRoute` / `world.nav =`.
- Click listener still plots. Hover does not write `world.nav`.
- `update()` rebuilds the standing line while `hoverId` is set (`applyHoverId(hoverId)`).
- Reserved strip `.rw-galaxy-hover` is after the SVG and before `.rw-galaxy-plot-status`.
- CSS: idle uses `visibility: hidden` (keeps flow). No hover animation. Header buttons stay above the strip.
- `src/game/chart-hover.js`: pure `hoverModel`. Reads `standingRead` + `rankFor`. No DOM, no emit.
- `state.js` / `save.js` are dirty in the working tree, but the diffs are cargo/POWER/psionic/`WORLD_FIELDS.nav` (other waves). NAV-04 hover did not change them.

## Browser (Playwright MCP, Vite 127.0.0.1:5176)

Flow: New Game → confirm → origin [1] Freehold Greenhand → KeyM.

| Check | Result |
|---|---|
| Hover freehold | Freehold Drift / Control: Freehold Compact / Standing: Freehold Compact: Stranger (+0) |
| Hover veil (dispatch on hit) | The Veil / Control: Unknowables / Standing: Unknowables: Stranger (+0) |
| Geometric hover at veil center | Topmost `uc_faint` wins (Independent). Overlap is live. |
| Independent | Faint and The Black Station: Control Independent, Digit 9 standing |
| Hollow | Hollow Reach, not Unclaimed |
| Idle (pointer on heading) | strip `visibility: hidden`, name/control/standing empty |
| Hover veridian | panel shows Veridian Combine; dest empty; Autopilot disabled; 0 plot lines |
| Click veridian | dest=veridian, status `Veridian Reach · 1 jump`, 1 plot line, Autopilot enabled |
| Rapid hover | freehold → hollowreach → blackstation → veridian updates at once; dest stays veridian |
| Escape | chart hidden, hover cleared |
| Reopen with pointer off SVG | no leftover hover name; plot status still Veridian Reach · 1 jump |
| Panel vs header | hover box y≈546, header actions y≈52–76. Does not cover Clear/Autopilot/Close |
| Console | 0 errors (`console-errors.txt`) |

Vite first bind was `[::1]` only. Restart used `--host 127.0.0.1`. No Chrome CDP on 9416.

## Screenshots

- `00-title.png`
- `01-hover-freehold.png`
- `02-hover-veil.png` (Unknowables)
- `02b-hover-veil-dispatch.png`
- `03-hover-independent.png` (Faint)
- `04-hover-hollow.png`
- `05-idle.png`
- `06-hover-veridian-no-plot.png`
- `07-click-veridian-plots.png`
- `08-reopen-no-leftover.png` (pointer still on last node after rapid hover — live pointerover)
- `09-overlap-topmost.png` (Faint over Veil)
- `10-idle-on-header.png`
- `11-reopen-pointer-off.png` (true leftover test)
