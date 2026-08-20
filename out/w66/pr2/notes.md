# Wave 66 PR2 notes

## Landed
- `src/game/trafficking.js` — tables + `isTrafficEligible` + `trafficLots` + `applySurvivorSale`
- Headless probe `out/w66/pr2/probe.mjs` — all keys true, exit 0

## Intentional non-edits
- `station.js`, `hud.js`, `ctx.js`, `save.js`, `state.js`, `pods.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`

## PR3 handoff
- Import from `src/game/trafficking.js` only.
- Gate chrome: `ui.level === 2 && ui.service === 'people'` and `currentDef.faction === 'gilded'` and `trafficLots(ctx).length > 0`.
- Confirm must pass live dock faction as `dockFaction`. Do not trust pending / `data-*` for the buyer.
- Pending allowlist: `{ faction, source }` with `source` `'playerKill'` \| `'other'`.
- Digits must not debit. Esc cancels pending.
- `requestAutosave` after a successful payload (this module does not autosave).
- Do not print `row.name`. Use `FACTIONS[faction].name` + `textContent`.
- Return stays `applySurvivorRescue`. Do not route Return through this mutator.

## Probe
```
node --import ./scripts/with-css-stub.mjs out/w66/pr2/probe.mjs
```
Stub is belt-and-braces (`state.js` has no CSS; module does not import `pods.js` / THREE).
