# Wave 133 — Agent API PR4 close-out (boot pins + docs)

**Status:** implemented (pins + design/PROGRESS). `decodeKeyCode` and callers were already CLEAN in src.
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.
**Graph:** `proceed_unmodeled` (`omp/agent-omp`). Did not write the graph.

## Landed

- `scripts/boot-test.mjs` — WAVE133 named empty-code pins immediately before `if (errors === 0)`. C85 `keyMToggle` now requires `decodeKeyCode` and `code === 'KeyM'` (chart no longer uses `e.code === 'KeyM'`). Other C85 pins unchanged. Digit0 shipyard pin still uses decoded `code.startsWith('Digit')`. Settings `e.code === 'KeyO'` left alone.
- `dispatchKeyFallback(key)` fires `{ code: '', key, ... }`. Existing `dispatchKey(code)` callers unchanged.
- `docs/AgentApiDesign.md` — header status/wave: PR4 implemented. Design body and wishlist untouched.
- `PROGRESS.md` — Wave 133 bullet.
- This notes file. Did not clobber helper/chart/hail/station verify notes.

Zero edits to `src/` (key-code + five callers belong to the CLEAN workers).

## Pins (all must print true under `wave133 key-code:`)

| Key | Law |
|---|---|
| `unit` | `decodeKeyCode`: KeyW wins over key `p`; empty+w → KeyW; empty+0 → Digit0; empty+space → Space; empty+Shift → ShiftLeft; empty+Escape → Escape; empty+`__proto__` → `''`; null → `''`. Never throw. |
| `dockFallback` | empty code + key `j`, then `tick(1)`: one-frame `dockPressed`. Same skip as KeyJ. Hull parked off-pad. |
| `dockCodeWins` | existing `dispatchKey('KeyJ')` still one-frame after `tick(1)`. |
| `dockBothEmpty` | `{code:'', key:''}` does not pulse dock. |
| `pauseFallback` | empty code + key `p` toggles pause the same as KeyP unless typing/title skip. Harness pause listener uses `decodeKeyCode` (boot-test does not load `main.js`). Restore paused flag. |
| `callers` | main, controls, station, hail, galaxychart import `decodeKeyCode`. title.js and overlay-policy.js do not. |
| `trackedDigits` | TRACKED still Digit1–5 and not Digit0. |
| `noThrow` | pins did not throw. |

## Restore

WAVE133 saves and restores paused, docked, hailOpen, chartOpen, berthOpen, dockPressed, ship position. Pause listener is removed.

## Security

- `__proto__` key drops to `''`.
- No innerHTML.
- No teleport.
- No TRACKED Digit0.

## OPEN leftovers

PR5 badge, PR6 bridge.

## VERIFY

`npm run test:boot` (exit 0):

```
wave127 agent-observe: { ... all true }
wave131 agent-intents: { ... all true }
wave132 pulse-latch: { ... all true }
wave133 key-code: {"unit":true,"dockFallback":true,"dockCodeWins":true,"dockBothEmpty":true,"pauseFallback":true,"callers":true,"trackedDigits":true,"noThrow":true}
BOOT TEST PASS — no update errors
```
