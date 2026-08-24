# Wave 100 engine-select verify

- `node out/w100/subsys/probe.mjs` → `WAVE100 subsys PASS`
- boot `wave100 subsys` object: every pin `true` (no `WAVE100 SUBSYS FAIL`)
- Playwright navigate to local Vite 5175: `ERR_CONNECTION_REFUSED` / timeout. `[NO BROWSER COVERAGE]` for live KeyK + ENGINE bar.
- `npm run test:boot` still FAIL on pre-existing waves. WAVE100 pins are not in that fail set.
