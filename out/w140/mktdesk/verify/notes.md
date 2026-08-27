# WAVE140 MKTDESK verify notes

**Status:** CLEAN

Did not edit `src/`. Did not run `npm run test:boot`.

## Static

- `.market-actions`: `display: flex`; `flex-wrap: wrap`; `gap: 6px`. No `overflow-x`.
- `.market-table` last track still `minmax(10em, 1.7fr)`.
- `.screen-panel` still `min-width: 560px`.
- Subtitle literal `h('div', 'screen-sub', panel, 'MARKET — buy price and sell price')` via `textContent`. No `fill units` in `station.js`.
- `peekFillUnit` still present and on `ctx.stationDesk`.
- `tradeFillUnit` still used by `tryTrade` and `renderMarket`.
- Q/W/A/S still `KeyQ|KeyW|KeyA|KeyS` → `tryTrade(COMMODITY_KEYS[ui.marketSel], qty, ...)`.
- Digit 1: `DOCK_KEY_SERVICES[0] === 'market'`.
- Skip: non-string key / missing `COMMODITIES` record / non-object `com` return; fill throw skips the row; missing name paints `key`.
- Illegal locker still paints `trade refused`.
- WAVE140 MKTDESK pins in `scripts/boot-test.mjs` (source only): wrapCss, tradeTrack, panelMin, digit1Market, qwas, subSrc, skipSrc, refusalSrc, liveSub, liveBtns, skipBad, nameKey, noThrow.

## Live (Playwright MCP → http://127.0.0.1:5176/)

- NEW GAME confirm → origin Freehold Greenhand.
- Dist 436 from pad. Did not teleport. Did not grant credits or cargo.
- Harness: `ctx.flags.docked = true`; `stationDesk.selectService('market')`; overlay `display:flex`. Did not write `flags.paused`.
- Subtitle textContent `MARKET — buy price and sell price`. CSS uppercase OK. No fill units.
- Desktop 1280: panel 780px. All four TRADE buttons on one row, visible.
- Forced panel 560px: last track 140px (10em). `flex-wrap: wrap`. `−5` wraps to row 2. All four buttons visible. No row overlap.
- Viewport 900: dock menu lists `1 — Market`. Market still opens from that button.
- Click `+1` on Provisions: credits 350→250, hold 0→1, notice `Bought 1 Provisions for 100 UU.`
- `peekFillUnit('provisions', true/false)` → 100, matches BUY/SELL cells.
- Locker closed (fear 0): restricted row `trade refused`. `desk.trade` restricted buy `ok:false` with Compact-watch notice. Hold/credits unchanged by that call.
- Console: Vite connect debug only. No renderMarket errors. 0 error / 0 warning.

## Not live

- Q/W/A/S keydown: `ui.open` stays false when harness skips `dock()`. Handlers still in source. Trade proven by `+1` click.
- Bad-row skip: `COMMODITIES` not on `window`. Boot poison not replayed in the browser.

## Ports

- Vite: `npx vite --host 127.0.0.1 --port 5176 --strictPort` (PID 43196).
- Chrome CDP 9422, profile `out/w140/mktdesk/verify/chrome-profile` (listen PID 57996).
- Playwright MCP drove the page. Stopped Vite, Chrome, Playwright. 5176 and 9422 not LISTENING after stop.
