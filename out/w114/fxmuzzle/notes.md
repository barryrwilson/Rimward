# Wave 114 FX muzzle census notes

**Verdict:** leftover **CONSUME**. Name: **no remaining FX-01 muzzle leftover.**

## Method

- Read live `src/systems/combat.js` muzzle / bolts / mining lance / `spawnFlash` / `spawnHitFx` callers.
- Cite-only: `ship.js` recoil, `song.js` fire cues, HUD hub, Digit 0/8/9, `save.js` `WORLD_FIELDS`, `physics.js` IMPACT 8 / 0.35.
- Grep `spawnMuzzle`, `spawnHitFx`, `PROJ_RADIUS`, `makeGlowDot`, `makeBeamRibbon`, `innerHTML`.
- Code wins over Wave 54 comments and Wave 110 inventory line numbers (those cites moved).
- Graph resolve: `proceed_unmodeled` (no binding workflow). Did not start Vite or Chrome.

## Why CONSUME

Wishlist FX-01 still **names** stronger muzzle flashes and readable projectiles/beams. Live code already has:

- `spawnMuzzle` with `makeGlowDot` map, family tint, FP-safe step, `reducedMotion` snap.
- Five fire-path callers (player gun/missile/turret, NPC bolt/missile). Mining never calls it (industrial).
- Bolts: `PROJ_RADIUS` 0.4 + glow + streak. WAVE54 pin.
- Mining lance: ribbon + core + contact glow. WAVE55 pin.

Wave 110 already recorded muzzle/bolts as LIVE and forbade crank-as-leftover. Remaining FX-01 after that was hull-local ripple (Wave 111) then scrape (Wave 114 sibling). No third fire-side hole.

Untextured **hit** `spawnFlash` is skippable flash map, not muzzle (muzzle already has a map).

## Sibling scrape

During census, `combat.js` 1b already contained scrape `spawnHitFx` at 1858–1860. That is the scrape leftover, not fire-side. Contract forbids stealing that call. Do **not** wait on further sibling `src/` landing. Inventory line cites are from the files at write time.

## This pack

Markdown only:

- `docs/Fx01RemainingMuzzleDesign.md`
- `out/w114/fxmuzzle/**`

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave114.md`.

## Processes

Started none. No Vite. No Chrome.
