# Wave 99 radar notes

- Radar is `.rw-contacts`. Jump park only.
- Helper: `src/game/contacts-gate.js` `contactsGate` / `contactsScanner`.
- HUD: hide when `contactsGate` is false or no ship. Do not write scanner.
- Probe: `node out/w99/radar/probe.mjs`
- Ports: Vite 5174, CDP 9411, profile `out/w99/radar/chrome-profile`
- Did not write `scripts/boot-test.mjs`

## Probe

`node out/w99/radar/probe.mjs` → `WAVE99 contactsGate PASS`

## Browser (http://127.0.0.1:5174)

Playwright eval after Continue (space, unpaused):

- Mk I scanner 1: `.rw-contacts` shown (`display:block`)
- Mk II scanner 2: shown
- Jumping: hidden; scanner stayed 2
- Docked: hidden; scanner stayed 2
- Scanner 0: hidden
- Classes distinct: `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue`
- Hub 80×80
- Console errors: 0

CDP 9411 Chrome 151 with `out/w99/radar/chrome-profile`.
