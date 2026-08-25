# FX scrape Wave 114 notes

Worker: PR1 first impl. `combat.js` damaging `bodyHit` applyHit now calls live `spawnHitFx`. Probe-only assertions. No Vite. No Chrome.

## Delivered

| Path | Role |
|---|---|
| `src/systems/combat.js` | scrape `spawnHitFx` + shielded sample + try/catch + park on kill |
| `docs/Fx01RemainingScrapeDesign.md` | status / wave / verifier record only |
| `out/w114/fxscrape/probe.mjs` | source pins |
| `out/w114/fxscrape/security-review.md` | self-applied auditor |
| `out/w114/fxscrape/code-review.md` | self-applied reviewer |
| `out/w114/fxscrape/ui-audit.md` | self-applied UI checklist |
| `out/w114/fxscrape/notes.md` | this file |

## Call site

`combat.js` 1b body impact loop:

1. `shielded` from `player.screen` / `player.shell` **before** `applyHit`
2. live `applyHit` + `e.damage` + `playerHit` (unchanged emit shape)
3. finite `playerObj.position` → `try { spawnHitFx(pos, 'impact', shielded, host) }`
4. if destroyed → park marks + ripples (try/catch)
5. slide `speed < IMPACT_MIN_SPEED` still `continue` (no FX)
6. sun 1c still has no `spawnHitFx`

WAVE111 `spawnRipple` parent law is call-only.

## Probe

`node out/w114/fxscrape/probe.mjs` PASS.

## Reviews

No open CRITICAL / HIGH / Blocker / Major. MEDIUM: console-injected `bodyHit` is pre-existing local-client; spawn does not use `e.damage` for size. LOW/Minor: origin pos, cyan fallback, skippable flash map.

## Graph

`graph_resolve` returned `blocked_ambiguous` with false hits (Hermes update, generic code-review, graph catalog). Coverage ~0.07. None bind WebSim scrape PR1. Orchestrator assigned this scoped impl. This worker did not mutate the catalog.

## Processes

This worker started none. Did not listen on 5175 or 9431.

## Out of scope (honored)

Did not edit `scripts/boot-test.mjs`, `ship.js`, `physics.js`, `state.js`, `hud.js`, `hud.css`, `save.js`, wishlist, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, sibling HUD/muzzle out packs, `out/w113/**`.
