# WAVE99 TGT-03 subsystem targeting verify notes

**Domain:** data (static). No Vite / CDP. No `src/` edits.

## Files that must exist

- `docs/Tgt03SubsystemDesign.md`
- `out/w99/subsys/current-tgt03-subsystem-inventory.md`
- `out/w99/subsys/shared-contract.md`
- `out/w99/subsys/security-review.md`
- `out/w99/subsys/code-review.md`
- `out/w99/subsys/ui-audit.md`
- `out/w99/subsys/verify/notes.md` (this file)

## Write-set

Allowed:

- `docs/Tgt03SubsystemDesign.md`
- `out/w99/subsys/**`

Forbidden (must remain untouched by this worker): `src/**`, `scripts/**`, `public/**`, `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt05*.md`, `docs/NpcTurretsDesign.md`, `docs/NpcMissilesDesign.md`, `docs/OwnerDecisions*.md`, `docs/Hud*.md`, `docs/Nav*.md`, `docs/Bio*.md`, `docs/Shp*.md`, `out/w99/turrets/**`, `out/w99/radar/**`.

## Static consistency

| Check | Result |
|---|---|
| Contract wins vs brief | Brief merge-law row points at `out/w99/subsys/shared-contract.md` |
| HUD-01 empty hub freeze | Contract §0.2; brief Honor + §1 table; UI audit |
| Later serial named, not this wave | **TGT-03 remaining subsystem targeting serial**; contract §8; Wave 99 markdown only |
| No invented UU | Owner Q3 default no; no prices in brief |
| Fail-closed retarget | Contract §0.14, §8 PR3 |
| Digit 0 shipyard | Inventory + contract cite `station.js` 5920–5922 |
| Digit 8/9 papers | Outfitting `armOutfitPapers`; dock 8/9 = launch/epics (code wins) |
| KeyT/KeyV / cone 12 | Untouched |
| innerHTML | Forbidden; live grep 0 in `hud.js` |
| Taxonomy | screen/shell/engine/hull only |
| Sibling docs not edited | Design text only; do not edit radar/awareness/turret docs |

## Inventory cite spot-check (code wins)

- `ctx.targets` bag: `src/core/ctx.js` 191–195 — no part field
- Peel: `src/game/state.js` 209–231
- Facet: `src/systems/combat.js` 1619–1625
- Target rail: `src/systems/hud.js` 846–855
- Hub 80 px: `src/ui/hud.css` 184–191; clamp `src/systems/hud.js` 1194
- FORE/AFT flash: `src/systems/hud.js` 1131–1133
- Cone: `src/game/reticle-aim.js` 15
- Digit 0: `src/systems/station.js` 5920–5922
- Toasts: `src/game/npc-fire-toast.js` 7–8
- WORLD_FIELDS: `src/game/save.js` 76–100 — no part key
- HUD hullKind: read `src/systems/hud.js` 76–85; no write

## git

Run `git diff --stat` and `git status`. Expect only `docs/Tgt03SubsystemDesign.md` and `out/w99/subsys/**` from this worker. Sibling dirty files (if any) are other Wave 99 workers — do not revert them; do not claim them.

## Ports

No dev server started.
