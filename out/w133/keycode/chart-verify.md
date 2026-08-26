# Wave 133 chart key-code verify

Status: **CLEAN**

Scope: static review of `src/systems/galaxychart.js` window `keydown`. No `src/` edits. No Vite. No `npm run test:boot`. No leftover Vite/boot-test processes to stop.

`graph_resolve` returned `blocked_ambiguous` (document/spreadsheet vs software delivery). This pass followed the assigned software verify task only.

## Contract

| Check | Result |
|---|---|
| Window `keydown` calls `decodeKeyCode(e)` once | Pass |
| Compares `code === 'KeyM'` then `code === 'Escape'` | Pass |
| No remaining `e.code` in this file | Pass |
| `e.repeat` early return stays | Pass |
| Typing gate stays (`isTypingFocus` + dest/filter ids) | Pass |
| Docked / paused open gate stays | Pass |
| `playSurfaceBlocked` open gate stays | Pass |
| Escape closes only when `open` | Pass |
| No `preventDefault` / `stopPropagation` | Pass |
| `guardAutopilotSpace` on AP button stays | Pass |
| Chart worker did not change `src/game/autopilot.js` | Pass (unrelated workspace dirt; see below) |

## Listener (live)

```1318:1348:src/systems/galaxychart.js
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const code = decodeKeyCode(e);
    if (code === 'KeyM') {
      // Do not intercept the event. While docked the station overlay owns
      // the screen, and while paused the origin pick or pause banner does —
      // only allow closing in those states.
      if (open) {
        let typing = false;
        try { typing = isTypingFocus() === true; } catch { typing = false; }
        if (!typing) {
          try {
            const ae = document.activeElement;
            typing = !!(ae && (
              ae.id === 'rw-galaxy-dest'
              || ae.id === 'rw-galaxy-filter-faction'
              || ae.id === 'rw-galaxy-filter-standing'
            ));
          } catch { /* close as live */ }
        }
        if (!typing) setOpen(false);
      }
      else if (!ctx.flags.docked && !ctx.flags.paused) {
        let blocked = false;
        try { blocked = playSurfaceBlocked(ctx) === true; } catch { blocked = false; }
        if (!blocked) setOpen(true);
      }
    } else if (code === 'Escape' && open) {
      setOpen(false);
    }
  });
```

Import: `import { decodeKeyCode } from './key-code.js';`

Worker git hunk is import + those two `e.code ===` replacements. Overlay-policy import and AP `keydown` (`guardAutopilotSpace`) are unchanged.

## Autopilot.js

`src/game/autopilot.js` is dirty in the worktree (`helmSteerLatched` also latches `ctx.agent.optIn === true`). That is the Wave 132 agent watch latch, not this worker. Chart diff does not touch autopilot. `galaxychart.js` still only imports `tryEngage`, `disengage`, `apLine`, `apRefuseToken`, `guardAutopilotSpace`.

## Follow-up (not a worker defect)

`scripts/boot-test.mjs` line 19152 still pins `chartSrc.includes("e.code === 'KeyM'")` as `keyMToggle`. A later `test:boot` run will fail that source pin until the pin matches `decodeKeyCode` / `code === 'KeyM'`. Out of this worker’s write-set.

`out/w85/chart/probe.mjs` has the same old string. Historical probe.

## Bugs found

None.

## Environmental issues

None that block the verdict. No Vite or `test:boot` process with a WebSim command line.
