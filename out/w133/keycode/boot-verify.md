# WAVE133 verifier — 2026-08-26

Status: CLEAN

Did not edit `src/`, `scripts/boot-test.mjs`, `PROGRESS.md`, or `docs/`.
Did not start Vite or Chrome.
Did not clobber `helper-verify.md` or other `*-verify.md` files.

## Pin review (`scripts/boot-test.mjs`)

- WAVE133 block is 24715–24860, immediately before `if (errors === 0)`.
- New WAVE133 pins do not write `ctx.input.dockPressed = true`. They set `false`, then fire `dispatchKeyFallback('j')` / `dispatchKey('KeyJ')` / empty both. Existing `dockPressed = true` writes stay at lines 1144 and 4467 (older dock pins).
- Restore saves and restores paused, docked, hailOpen, chartOpen, berthOpen, dockPressed, ship position. Pause listener is removed.
- Callers pin reads `title.js` and `overlay-policy.js` with `readFileSync`. It does not `import()` those modules. It asserts they do not contain `decodeKeyCode` / `key-code.js`.
- C85 `keyMToggle` (line 19157): `chartSrc.includes('decodeKeyCode') && chartSrc.includes("code === 'KeyM'")`. Chart source matches (`galaxychart.js` 1320–1321).
- Digit0 shipyard pin (C85 line 19158–19161) still uses decoded `code.startsWith('Digit')`. Unchanged.
- Settings KeyO pin (WAVE103 `keysStay`, line 21970) still requires `e.code === 'KeyO'`. `settings.js` line 230 still uses `e.code === 'KeyO'`. Unchanged.
- `dispatchKey(code)` is still code-only (lines 261–264). `dispatchKeyFallback(key)` is new (lines 266–269).

## Pause pin vs main.js

This is not a product skip of `main.js` decode.

- `scripts/boot-test.mjs` never imports `src/main.js`. It boots subsystems in a harness.
- `pauseFallback` adds harness `pauseListen133` that calls `decodeKeyCode(e)` then toggles `ctx.flags.paused`. The listener is removed after the pin.
- `callers` still reads `src/main.js` and requires `decodeKeyCode` + `key-code.js`.
- Product `src/main.js` 172–184 uses `const code = decodeKeyCode(e)` and `code !== 'KeyP'`. Harness skip uses `walkDom` because `getElementById` is create-on-miss.

## Boot

`npm run test:boot` from repo root. No leftover `boot-test` node before or after. Did not kill user Chrome or MCP node.

Run 1 exit 1. WAVE133 all true. Failures were hail01 nan + hailmiss cascade. Flag: [ENV]. Retry once.

Run 2 exit 0.

```
wave85 nav chart: {...,"keyMToggle":true,"digit0Shipyard":true,... all true}
wave127 agent-observe: {all true}
wave127 hail01 nan: {"skipped":true,"resolved":true,"floorFn":true}
wave131 agent-intents: {all true}
wave132 pulse-latch: {"dockOneFrame":true,"hailOneFrame":true,"pulseUnknown":true,"weaponGroup":true,"selectNoCand":true,"teleportForbidden":true,"hypotLatch":true,"amOptInNoBerth":true,"noThrow":true}
wave133 key-code: {"unit":true,"dockFallback":true,"dockCodeWins":true,"dockBothEmpty":true,"pauseFallback":true,"callers":true,"trackedDigits":true,"noThrow":true}
BOOT TEST PASS — no update errors
```

Full log: `out/w133/keycode/boot-verify.log`
First-run flake log: `out/w133/keycode/boot-verify-run1.log`

## Bugs

None in WAVE133 pins or C85 `keyMToggle`.
