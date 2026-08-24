## Status
CLEAN

## What I tested
- `node --import ./scripts/with-css-stub.mjs out/w90/ap-gate/probe.mjs` (log: `probe.log`)
- `npm run test:boot` (log: `boot-test.log`, process exit 1 from pre-existing boot fails)
- Compared FAIL banners with `out/w89/flight/boot-test.log`
- Browser Auction→Cradle cyan ring: skipped (probe + boot-test pins are enough)
- Did not start Vite or Chrome. Did not touch port 5173.

## Bugs found
None for this gate rebuild.

Required pins:
- Probe: `W90 AP GATE PROBE PASS`
- Probe: `boot.liveMatch` true, `boot.zoneJump` true, `boot.noOrbitCmd` true
- Probe: Auction hub origin + Cradle live equals hub mesh
- Probe: Veridian physical ring, not hub
- Boot: `wave85 nav ap path` all true, including `liveMatch` and `zoneJump`
- Boot: `wave88 ap path` all true, including `noOrbitCmd`
- No `WAVE85 NAV AP PATH FAIL`
- No `WAVE88 AP PATH FAIL`

Pre-existing (do not fail CLEAN):
- `WAVE85 NAV GUIDANCE FAIL` with `hideJumping: false` and `markerRay: false` (same as w89)
- WAVE4 / WAVE26 / WAVE30 / WAVE31 / WAVE35 / WAVE80 FAIL banners (same set as w89)

New FAIL banner vs w89, not attributed to `src/systems/gate.js`:
- `WAVE78 EXPLORE FAIL` only because `completePay: false`
- `completeAgain: true`
- That pin is a docked explore survey credit check after a 60s tick
- Gate live-assembly rebind does not drive that pay path

Boot error count: 57 (w89 had 68). Fewer pin errors, one extra FAIL banner as above.

## Environmental issues
None.

Ports after this run:
- 5189: not LISTENING
- 9489: not LISTENING
- 5173: LISTENING (pre-existing; left running)

## Evidence
- Probe last line: `W90 AP GATE PROBE PASS`
- Probe extras: Auction hub mesh `(368, 76, -747)`; Veridian ring `(987, 48, 394)`
- Boot `wave85 nav ap path`: `liveMatch:true, zoneJump:true` (full object all true)
- Boot `wave88 ap path`: `noOrbitCmd:true` (full object all true)
- Boot `wave85 nav guidance`: `hideJumping:false, markerRay:false` then `WAVE85 NAV GUIDANCE FAIL`
- Logs: `C:\Projects\WebSim\out\w90\ap-gate\verify2\probe.log`
- Logs: `C:\Projects\WebSim\out\w90\ap-gate\verify2\boot-test.log`
- Pins: `C:\Projects\WebSim\out\w90\ap-gate\verify2\pins.json`
