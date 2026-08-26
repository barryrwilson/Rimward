# Chart key-code worker notes

Window `keydown` in `src/systems/galaxychart.js` now calls `decodeKeyCode(e)` once, then compares to `KeyM` and `Escape`.

Unchanged:

- `e.repeat` early return
- typing focus (`isTypingFocus` plus dest/filter ids)
- docked / paused open gate
- `playSurfaceBlocked` open gate
- Escape closes only when the chart is open
- no `preventDefault` / intercept
- `guardAutopilotSpace` and overlay-policy left alone

Verify: grep the listener for `const code = decodeKeyCode(e)` and no remaining `e.code ===`. Do not run `test:boot` or Vite for this worker.
