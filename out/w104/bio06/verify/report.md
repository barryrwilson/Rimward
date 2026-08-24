## Status
CLEAN
## What I tested
- Graph: `graph_resolve` was `blocked_ambiguous`; owner brief `proceed_unmodeled`. No Vite. No Chrome.
- Write-set of the BIO-06 markdown pack vs forbidden `src/`, `scripts/`, `public/`, wishlist, `PROGRESS.md`, `OwnerDecisions*`, Bio01–05 / BioLiving / Rep05 / Msn03 docs.
- Merge law: `out/w104/bio06/shared-contract.md` vs `docs/Bio06CadenceDesign.md` vs the owner deputize `hzScale` table and serial PR names.
- Inventory cites vs live `src/systems/ship.js`, `src/systems/ship-assets.js`, `src/game/state.js`, `hangar.js`, `ship-scale.js`, `shipyard.js`, `hud.js`, `hud.css`, `station.js`, `npc.js`, `organic.js`, `yard-preview.js`, `ctx.js`, `save.js`, `model-catalog.js`, and Beautiful GLB folders.
- Frozen honors: empty hub, Digit 0, HUD `hullKind` read-only, `makeLivingHull` stay, BIO-05/07 not reopened, no persist key, no UU, no `living-cadence.js` in `src/`.
## Bugs found
None. Deputize table, 0.5→2.3 Hz pair, NPC `/120`, serial PR1–PR4 (named only), and merge-law freezes match. Line cites for `npc.js` traffic tick and `station.js` Digit 0 drifted a few lines under sibling `src/` edits; semantics still match (see `out/w104/bio06/verify/notes.md`).
## Environmental issues
- Worktree is dirty from other workers (`src/`, `scripts/`, `public/` GLBs, wishlist, `PROGRESS.md`, sibling Bio/Rep/Msn docs). Not this pack.
- `graph_resolve` matched unrelated catalog workflows; verification used the owner `proceed_unmodeled` exception.
## Evidence
- Player: `src/systems/ship.js` 144–145 `IDLE_SWIM_HZ = 0.5`, `CRUISE_SWIM_HZ = 2.3`; loop 950–956; `makeLivingHull` 274–334; living CPU has no `reducedMotion` gate 967–993.
- NPC: `src/systems/ship-assets.js` 46–48 `SWIM_IDLE_HZ` / `SWIM_CRUISE_HZ` / `SWIM_CRUISE_SPEED = 120`; `updateShipAsset` 467–470 `spd / 120`.
- Classes/cruise: `src/game/state.js` 37–44; envelope `hangar.js` 568 `maxSpeed = cls.cruise`.
- Hub/Digit: `src/ui/hud.css` 184–193 80px; `hud.js` 709–712 RANGE; `station.js` 185 shipyard last, Digit 0 → last service.
- No cadence `WORLD_FIELDS` (`save.js` 76–101). No `src/game/living-cadence.js`.
- Full cite table: `C:\Projects\WebSim\out\w104\bio06\verify\notes.md`.
