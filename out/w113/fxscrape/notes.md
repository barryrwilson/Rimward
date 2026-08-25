# FX scrape Wave 113 notes

Worker: markdown only. No `src/` edits. No Vite. No Chrome. No blender. No ports.

## Delivered

| Path | Role |
|---|---|
| `out/w113/fxscrape/current-fx-scrape-inventory.md` | Live census; code wins |
| `out/w113/fxscrape/shared-contract.md` | MERGE LAW (wins vs brief) |
| `docs/Fx01RemainingScrapeDesign.md` | Integrator brief; contract wins |
| `out/w113/fxscrape/security-review.md` | Self-applied auditor |
| `out/w113/fxscrape/code-review.md` | Self-applied reviewer |
| `out/w113/fxscrape/ui-audit.md` | Self-applied spec audit |
| `out/w113/fxscrape/notes.md` | This file |

## Census

Leftover is **REAL**. `spawnHitFx` callers: `combat.js` 1742 (NPC weapon) and 1799 (player weapon) only. `bodyHit` applyHit 1840–1856 has no `spawnHitFx`. `ship.js` 935 is the only `bodyHit` emit. Honest CONSUME would be a lie.

Wave 111 weapon hull-local ripple is **LIVE consume** (`docs/Fx01RemainingDesign.md` cited, not rewritten).

## Deputize (owner may override)

- Fail closed: skip `spawnHitFx` if host/pos missing. Never freeze. Never `speed = 0`. Never skip `applyHit`.
- Smallest additive: call live `spawnHitFx` on existing damaging scrape path with finite `playerObj`.
- Pos: `playerObj.position`. Do not steal bounce. Do not grow `bodyHit` as PHY.
- Recoil + hull-mark pool 12 + WAVE111 parent + IMPACT 8 / 0.35: **LIVE consume.**
- Flash map + PHY-04 80 u: **skippable, not required PR1.**
- First serial **PR1**. No Digit 0/8/9 steal. No `state.js` write.
- No extra hull-strike toast.

## Leftover frozen

Rams that already applyHit get the same world punch family as weapons. Bounce, damage knobs, shake, audio, toast stay. No hub pip.

## Iteration 2 (designer Major)

Re-censused live `hud.js`. Stale consume 591–593 / 709–712 / 846–847 / 1149–1151 pointed at `worldEvent`, sysname CSS, contact-pip lastX, and `pushToast` write. Live bind:

- hull-strike **608–610** + `pushToast` **1130–1150**
- hub **726–729** + `hud.css` 184–193
- facing **863**, **1127–1128**, **1167–1169**, **1407–1417**
- `el()` **261–266**

Grep `'▲ Hull strike.'` and `.rw-reticle`. No second toast. No hub child. Did not edit `verify/`.

## Reviews

Security / code-review / ui-audit re-applied after cite fix. No open CRITICAL / HIGH / Blocker / Major. Designer Major HUD cites **closed**. Medium shader-from-save / proto-merge / injected-event notes remain documented, not blocking. Minor origin-pos / square-flash / cyan-tint documented.

## Agents

No `[security-auditor]` / `[reviewer]` / `[designer]` spawn tool in this worker. Checklists applied in-process.

## Graph

`graph_resolve` (namespace `codex`) returned `proceed_unmodeled` (no active workflow met threshold). This worker did not mutate the catalog. Did not call calendar or CRM write tools.

## Processes

This worker started none. Did not listen on ports.

## src/

This worker did not edit `src/`. Did not edit `docs/Fx01RemainingDesign.md`. Did not write `docs/OwnerDecisionsWave113.md`.

## Out of scope (honored)

Did not edit wishlist, `PROGRESS.md`, sibling Bio/Nav/Msn/Rep/Phy/Shp/Tgt/Hud/Owner docs, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`. Did not implement named PRs.
