# Wave 142 CTL-05 PR1 pause menu notes

**Verdict:** leftover **REAL**. Named serial **PR1** landed in `src/`. Pause is ACCESS: RESUME / SETTINGS / BERTH RECORDS / TITLE.

## Method

- Did **not** call `graph_propose` / `graph_approve`.
- `graph_resolve` returned `blocked_ambiguous` on unrelated Codex workflows (automation pause/resume, Open Knowledge save, document edit). Draft Circle of Love is non-binding. Owner already assigned this WebSim write-set. Did **not** change the graph.
- Applied security / code / UI reviews **self**. Did **not** start Vite, Chrome, Playwright, or CDP. Did **not** run `npm run test:boot`.
- `node --check` on `src/main.js`, `src/systems/title.js`, `src/game/save.js`.
- Did **not** write `src/systems/settings.js` (synthetic KeyO is enough).
- Did **not** write `src/ui/screens.css`, `origins.js`, `onboarding.js`, `hud.js`, `hud.css`, overlay-policy as a paused writer, wishlist, or `PROGRESS.md`.

## What landed

| Piece | Where |
|---|---|
| Pause dialog + buttons | `src/main.js` `pauseEl` |
| `setPaused` flag + display | `src/main.js` |
| KeyP guards kept | typing / models / `#rw-title` |
| SETTINGS | synthetic KeyO; paused stays true |
| BERTH | `ctx.berthApi.openFromPause`; KeyL gate stays |
| LOAD named-disable | `LOAD — resume first` |
| TITLE remount | `titleApi.openFromPause`; no skip; no reload |
| CONTINUE | `ctx.setPaused(false)` |
| Click-through freeze | pauseEl + panel pointer-events none while covered; actions skip when covered |
| z | pause 50, berth 60, title 70, settings 80 |

## Honor holds

HUD-01 empty hub. No new Digit. KeyH/J/L/M/P/D stay. Digit 0/8/9 stay. CTL-02 never-write. CTL-03 hold distinct. Wave 28 LOAD gate. Wave 40 z ladder. No teleport. No credits. No innerHTML. Settings expansion not stolen. Sibling packs not stolen.

## Graph

Owner-scoped exception to blocked_ambiguous Codex matches: this task is WebSim Ctl05 PR1. Graph writes are forbidden by the worker brief and by contract item 19.
