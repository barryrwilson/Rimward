# Wave 66 PR3 notes

## Landed
- `src/systems/station.js` — `priceOf('survivor')` first-line 0; People level-2 Gilded `renderTrafficDesk` after `renderRescue`; Offer → Confirm; Esc cancel; RAM `ui.trafficPending` / `ui.trafficBusy`
- Headless probe `out/w66/pr3/probe.mjs` — all keys true, exit 0
- No `screens.css` edit (reuse `people-note` / `screen-btnrow` / `screen-btn-warm`)

## Intentional non-edits
- `trafficking.js`, `save.js`, `hud.js`, `ctx.js`, `state.js`, `pods.js`, `npc.js`, `shipyard.js`, `shipyard-desk.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`

## PR4 handoff
- Station already emits `survivorSold` via `applySurvivorSale`.
- HUD toast (`warn`) is PR4. Do not emit from HUD.
- Copy uses `payload.line` / count. Do not print `row.name`.

## Probe
```
node --import ./scripts/with-css-stub.mjs out/w66/pr3/probe.mjs
```
CSS stub is required (`station.js` imports `screens.css`). Isolated overlay uses injected `h`/`btn` trees — no `initStation` / boot.
