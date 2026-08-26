## Status
CLEAN

## What I tested
- Static: grep of `src/systems/hud.js` and `src/ui/hud.css`. `node --check src/systems/hud.js` exit 0.
- `.rw-home-mark` pip + chevron create-once on `#hud`, not `.rw-reticle`.
- `HOME_EDGE_INSET = 108`. TGT/NAV-02 keep `EDGE_MARGIN = 84`.
- POS label `HOME`. Value `stripHudText(name) + ' · ' + formatNavDist(dist)`.
- No `innerHTML` / `insertAdjacentHTML` in `hud.js`.
- Home code does not assign `edgeArrow.style`. It does not write `gateCue`.
- No `@keyframes` on `.rw-home-mark`. Combat dim `#hud.in-combat .rw-home-mark { opacity: 0.14 }`.
- One scratch `homeProj` Vector3.
- Live Chrome CDP on Vite `http://127.0.0.1:5178/` (Playwright MCP was locked). New Game, Freehold Greenhand, flying with live `ctx.station.position`.
  1. POS HOME `Freehold Landing · 217u` (then `u`/`k` as range changed).
  2. On-glass: run2 boot pip not `is-hidden`; rect outside 80 px reticle; parent `#hud`.
  3. Off-glass: `.rw-home-chevron` visible; inset min **108** px; TGT `.rw-edge-arrow` hidden (not amber).
  4. Dock: after 2 s, pip + chevron + POS HOME hidden (`display:none`).
  5. Hail via `ctx.flags.hailOpen = true` then restore: home hidden. KeyM chart and KeyL berth: home hidden.
  6. Station lock `allowedLockKind === 'station'`: pip + chevron hidden; POS HOME stayed.
  7. Console: no HUD-06 errors.

## Bugs found
None.

## Environmental issues
- Playwright MCP refused the session: Browser already in use for `mcp-chrome-7d372dc`. Live pass used Chrome CDP + swiftshader. Not a product defect.
- Port 5178 was empty when the live pass began. This verifier started `npx vite --host 127.0.0.1 --port 5178 --strictPort`. Vite is stopped. 5178 is not LISTENING.
- First dock inspect at 800 ms still showed POS HOME. HUD text is throttled to 0.2 s and can lag one tick after dock. A 2 s wait hid the row. Not filed as a product bug.
- Chase camera at Greenhand spawn often puts the pad off-glass (chevron). Steer or a later boot can put the square pip on the pad. Not a HUD-06 defect.
- Hail still `05-hail-hidden.png` was taken after flag restore. Hide proof is the evaluate inspect, not that still.
- `npm run test:boot` was not run (scope skip). Did not kill 9222. Did not kill a Vite this verifier did not start (none remained).
- Graph resolve: `codex/workflow-browser-assisted-work` (`r-mt9jb8au-802f42f7`). No graph writes. No external send.

## Evidence
- Screenshots:
  - `out/w127/homemarker/verify/01-flight-home.png`
  - `out/w127/homemarker/verify/02-offglass-chevron.png`
  - `out/w127/homemarker/verify/03-dock-hidden.png`
  - `out/w127/homemarker/verify/03-pip-on-glass-stable.png` (square pip + dist on pad)
  - `out/w127/homemarker/verify/04-pip-on-glass.png`
  - `out/w127/homemarker/verify/05-hail-hidden.png`
  - `out/w127/homemarker/verify/06-chart-hidden.png`
  - `out/w127/homemarker/verify/07-berth-hidden.png`
  - `out/w127/homemarker/verify/08-station-lock.png`
- Logs:
  - `out/w127/homemarker/verify/console.txt`
  - `out/w127/homemarker/verify/live-results.json`
  - `out/w127/homemarker/verify/live-results-2.json`
