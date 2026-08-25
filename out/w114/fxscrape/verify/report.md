## Status
[ CLEAN ]

## What I tested
- Ran `node out/w114/fxscrape/probe.mjs`. Result: PASS all 21 pins. Saved stdout at `out/w114/fxscrape/verify/probe-output.txt`.
- Read `src/systems/combat.js` body-impact loop (1b) and sun path (1c).
- Confirmed scrape FX contract: `shielded` sample before `applyHit`; `spawnHitFx(pos, 'impact', shielded, host)` inside try/catch; park marks/ripples on destroy; slide `speed < PHY.IMPACT_MIN_SPEED` continues with no FX; sun path has no `spawnHitFx`.
- Confirmed WAVE111 `spawnRipple` parent law is still present (`fpPlayer`, `host.add`, world-space fallback). Scrape calls `spawnHitFx`; it does not replace parent law.
- Confirmed `src/game/physics.js` still has `IMPACT_MIN_SPEED: 8` and `IMPACT_SCREEN_PER_U: 0.35`. No physics.js diff vs HEAD.
- Confirmed no `WEAPONS.impact` in `src/game/state.js`. `applyHit` still uses empty-row 1:1 fallback for family `'impact'`.
- Grep `'▲ Hull strike.'`: one toast path in `src/systems/hud.js` (line 610, `bodyHit` with `e.damage > 0`). `combat.js` has no new scrape toast string.
- Confirmed no `innerHTML` in `combat.js`. `WORLD_FIELDS` in `save.js` has no hull-mark or ripple persist key.
- Bounce path in `src/systems/ship.js` still emits `bodyHit` after `resolveMover`. Working-tree ship.js diff is living gait, not bounce steal.
- Live ram: [NO BROWSER COVERAGE]. Parent forbids Playwright MCP. Verifier did not start Vite 5175 or Chrome 9431.

## Bugs found
None.

## Environmental issues
None for this probe. Port 5173 is already LISTENING (pid 34660). This verifier did not start it and did not kill it. Ports 5175 and 9431 are not LISTENING.

## Evidence
- Probe stdout: `C:\Projects\WebSim\out\w114\fxscrape\verify\probe-output.txt`
- Scrape call site: `C:\Projects\WebSim\src\systems\combat.js` lines 1840–1870 (`shielded` 1851, `applyHit` 1852, `spawnHitFx` try/catch 1858–1860, park 1862–1866, slide continue 1848).
- Sun mute: `C:\Projects\WebSim\src\systems\combat.js` lines 1873–1899 (applyHit only).
- WAVE111 parent: `C:\Projects\WebSim\src\systems\combat.js` `spawnRipple` 1050–1107; XOR `spawnHitFx` 1110–1117.
- IMPACT knobs: `C:\Projects\WebSim\src\game\physics.js` lines 11–12.
- Toast: `C:\Projects\WebSim\src\systems\hud.js` line 610.
- Bounce emit: `C:\Projects\WebSim\src\systems\ship.js` lines 905–936.
