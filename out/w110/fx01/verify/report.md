# FX-01 remaining design pack — verifier report

**Wave:** 110  
**Domain:** data (markdown census vs live `src/`)  
**Vite / CDP:** not started  
**Date:** 2026-08-24

## Status

CLEAN

## What I tested

1. **Worker write-set vs `src/`.** Compared pack mtimes, `git status`, and `git diff` on combat/FX paths. This pack is markdown-only. PHY-05 sibling `src/game/world.js` and other sibling diffs exist; they are not this worker.
2. **Inventory cites vs live combat/ship/hull-marks.** Spot-checked pool constants, `spawnRipple` / `spawnHitFx` / `stampHullMark`, shake/recoil, WAVE54/WAVE59 boot pins, HUD/Digit/persist/`reducedMotion`.
3. **Leftover claim.** Confirmed shielded ripple is world-space on the scene. Confirmed unshielded marks already parent via `worldHitToLocal`. Recoil and hull-mark pool 12 named LIVE consume.
4. **Freeze law.** HUD-01 empty hub, no punch pip, Digit 0/8/9, `reducedMotion` snap, fail-closed never freeze sim, first-person player-host no full-size parent, `state.js` READ-ONLY, no persist key, serial PR plan named only.
5. **Forbidden docs.** This worker did not write `PROGRESS.md`, wishlist, Phy/Bio, or `docs/OwnerDecisionsWave110.md`.
6. **Reviews.** Read `shared-contract.md` MERGE LAW, brief, inventory, security, code-review, ui-audit, notes.

No Vite. No Chrome. No boot-test run (known boot FAILs out of scope).

## Bugs found

None.

The leftover is the **absent hull-local parent** on `RIPPLE_POOL`, not a Wave 59 rewrite. Serial PR1/PR2/PR3 are named only. Live `spawnRipple` still does `sprite.position.copy(pos)` with `scene.add` at init and **no** `host` field on ripple slots. The only `host.add` in `combat.js` is `stampHullMark`.

## Environmental issues

None for this pack.

Working tree is dirty from **siblings**, not this worker:

| Path | Attribution |
|---|---|
| `src/game/world.js` (mtime 14:17) | PHY-05 sibling (do not flag) |
| `src/systems/ship.js` | BIO gait (`living-gait.js`); recoil/shake block unchanged |
| `src/game/jobs-chains.js`, `src/systems/npc.js`, `src/systems/station.js`, `src/systems/ship-assets.js` | other siblings; older than pack |
| `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `docs/Bio08LocomotionDesign.md` | other workers; pack mtimes 14:22–14:24 |
| `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md` | PHY packs |
| `scripts/boot-test.mjs` | sibling; WAVE54 11641–11668 and WAVE59 11818–11872 still present |

`src/systems/combat.js`, `src/game/hull-marks.js`, `src/game/state.js` have **no** git diff.

## Evidence

### Worker did not edit `src/`

Pack files (this worker):

| File | LastWriteTime | Size |
|---|---|---|
| `docs/Fx01RemainingDesign.md` | 2026-08-24 14:22:49 | 17463 |
| `out/w110/fx01/shared-contract.md` | 14:22:34 | 13182 |
| `out/w110/fx01/current-fx01-inventory.md` | 14:22:49 | 13818 |
| `out/w110/fx01/security-review.md` | 14:23:11 | 4126 |
| `out/w110/fx01/code-review.md` | 14:24:01 | 5024 |
| `out/w110/fx01/ui-audit.md` | 14:24:01 | 4281 |
| `out/w110/fx01/notes.md` | 14:24:01 | 2514 |

`notes.md` states no `src/` edits and does not steal `out/w110/padhome/**` or `out/w110/rep03/**`. No `docs/OwnerDecisionsWave110.md` on disk (only “do not write” in the brief).

### Inventory cites match live code

| Claim | Live |
|---|---|
| `MUZZLE_POOL` 16 / `RIPPLE_POOL` 16 / `PROJ_RADIUS` 0.4 | `combat.js` 180–182 |
| `SPARKS_PER_BURST` 11 / `RIPPLE_TTL` 0.2 | 196, 201 |
| Bolt pool 64 | `POOL_SIZE` 174; sphere+glow+streak 419–548 |
| Ripple init `scene.add`, no host | 620–635 `{ sprite, t, ttl, snap, seen }` |
| `makeRippleRing` | 396–414 |
| `spawnMuzzle` FP-small | 998–1023; callers 1154, 1215, 1248, 1308, 1335 |
| `spawnRipple` world `position.copy(pos)` | 1026–1043 |
| `spawnHitFx` XOR shielded ripple else sparks+mark | 1045–1053 |
| `stampHullMark` `worldHitToLocal` + `host.add` | 1073–1097 |
| Park destroy/load | 1099–1118; kill 1664, 1718; `systemLoaded` 1105, 1735 |
| NPC / player emit | 1647–1664, 1703–1718 |
| PHY `bodyHit` no `spawnHitFx` | 1754–1770 |
| Dry bolt pool returns | 937 |
| Docked weapons-cold | 1739–1742 |
| Ripple tick snap + scale `2.2 + 7.2*k` | 1921–1965 |
| Sparks `reducedMotion` no emit | 954–956, 1967–1983 |
| `HULL_MARK_POOL === 12` | `hull-marks.js` 7; combat import 12–20, loop 680 |
| `worldHitToLocal` | `hull-marks.js` 19 |
| Shake caps 0.35 / 0.12 | `ship.js` 129–130 |
| Recoil cannon/disruptor flesh | 133–137, 1237–1263; zeros 1207–1211 |
| Recoil does not write throttle | header 68–69; WAVE59 `noThrottle` grep |
| WAVE54 pins | `boot-test.mjs` 11641–11668 (muzzle, ripple, sparks 11, proj 0.4, cues, shake caps, death pool) |
| WAVE59 FX pins | 11857–11864 (recoil event/flesh, pool 12, unshielded stamp, park destroy) |
| Hub 80 px + RANGE | `src/ui/hud.css` 184–193; `src/systems/hud.js` 709–712 |
| `el()` textContent | `hud.js` 244–249 |
| Facing flash `.rw-combat-self` | 846–847, `selfHitFlashUntil` 1109 / 1150 / 1391–1399 |
| Hull-strike toast `bodyHit` damage > 0 | 591–593 |
| Digit 0 shipyard | `station.js` 188 last `shipyard`; hot 0 at 5939–5940; Digit 0 6073–6077 |
| Digit 8/9 dock launch / Standing | keys `launch`/`epics`; labels Launch/Standing 5938; outfitting papers 1633–1712 |
| `WORLD_FIELDS` no FX/hullMarks | `save.js` 76–101; autosave `rimward-save-v1` 16 / 66 |
| Settings `rimward-settings-v1` | `settings.js` 7–8, 24; body classes 70–72 |
| `reducedMotion` default false | `ctx.js` 217 |
| Song combat CUES | `song.js` 45–69; volley 142–144, 440–448; mute/vol 462–464; combat bed 466–471 |
| Death burst pool 3 | `npc.js` 104, 2126–2172, reduced 2182–2185 |
| Wishlist FX-01 1146–1193 | first pass + Wave 59 recoil/marks |
| PROGRESS Wave 54 2810–2828 | “Recoil … did not ship” **stale**; inventory names it stale |

### Recoil and marks named LIVE consume

- Brief owner request + census: recoil and marks **LIVE — consume**.
- Contract §0.8–0.9: do not rewrite flesh kick; do not resize pool 12; do not stamp through shields.
- Inventory §4, §2.6, §12: dropped from remaining.
- Serial table: PR1 does **not** land recoil rewrite or mark pool.

### Remaining leftover is absent hull-local parent, not WAVE59 rewrite

Live ripple slot has no `host`. Tick animates scene sprites in world scale. Unshielded hits already ride via `stampHullMark`. Camera shake is live. Wave 54 `spawnRipple` pin stays (existence grep, not parent). Later serial reuses `RIPPLE_POOL` + `worldHitToLocal`. Contract forbids a third pool and forbids parenting through the hull-mark root.

### Freeze checks

| Freeze | Pack | Live |
|---|---|---|
| HUD-01 empty hub | contract §0.2; no punch pip | `.rw-reticle` pupil + 3 cilia + RANGE only; no punch/combo/impact meter in JS/CSS |
| Digit 0/8/9 | §0.3; first serial must not steal | shipyard / launch / epics; outfitting 8/9 papers |
| `reducedMotion` mutes extra pulse | §0.19 snap-one-frame | muzzle/ripple snap 1921–1965; sparks gated; shake/recoil zero |
| Fail-closed never freeze sim | §0.16 / §2; skip ring if pool busy; never `speed = 0` | dry helpers return; `applyHit` already ran; combat does not write player speed |
| FP player host no full-size parent | §0.1 item 6; formula `fpPlayer` → world copy | later; live muzzle already FP-small 998–1021 |
| `state.js` READ-ONLY | §0.5 | no git diff on `state.js`; later writer **none** |
| No persist key | §0.6; scene only | `WORLD_FIELDS` has no hullMarks/FX |
| Serial named only | §3 PR1/PR2/PR3; “Do not land these PRs in `src/` in this worker” | no parent path in live `spawnRipple` |

MERGE LAW: `out/w110/fx01/shared-contract.md` wins vs `docs/Fx01RemainingDesign.md`. Both agree on leftover, consume list, and freezes.

### Must-not-edit Phy/Bio/wishlist/PROGRESS/OwnerDecisions

This pack’s files do not include those paths. `PROGRESS.md` / wishlist / Bio08 diffs exist from other workers and do not mention `Fx01Remaining` or `out/w110/fx01`. No `docs/OwnerDecisionsWave110.md`.

## Processes

Verifier started none. Nothing to stop.

## Verdict

Markdown-only FX-01 leftover pack is consistent with live Wave 54/59 combat FX. Recoil and hull-mark pool 12 stay LIVE consume. The frozen remainder is hull-local shield ripple on the struck host. Implementation is correctly deferred.
