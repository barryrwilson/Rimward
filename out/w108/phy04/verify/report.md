## Status
CLEAN

## What I tested
Recheck of the PHY-04 mermaid leftover after the worker fix. Markdown only. No `src/` edit. No Vite. No Chrome. Did not stop 5173/9222.

Compared `docs/Phy04AvoidDesign.md` mermaid after `_phyOn?` to live `src/systems/npc.js` (`_phyOn = !ctx.gate.jumping` at 2261; `steerLive` at 749; `applyAvoidBias` dest-copy return at 609–613) and `out/w108/phy04/shared-contract.md` §2.

Confirmed §2 was not inverted to match the old picture.

Confirmed this leftover still has no PHY `src/` edits. BIO-08 ship files are sibling.

Rechecked Digit 0/8/9, hub 80 px RANGE, `state.js` READ-ONLY, persist (`WORLD_FIELDS`), no navmesh.

## Bugs found

## Environmental issues
`graph_resolve` (`claude/agent-claude`) returned binding `claude/workflow-research-and-briefing` (coverage 0.08). Local code is the source of truth. Open Knowledge and Projects had no PHY-04 mermaid record. Web search found no RIMWARD PHY-04 source. Browser-inapp and subagents were not used: owner brief forbids Vite/Chrome for this leftover.

Host `src/` still has BIO-08 gait edits (`ship.js`, `ship-assets.js`, untracked `living-gait.js`, `scripts/boot-test.mjs` WAVE108 BIO-08). Those are not PHY-04.

## Evidence
- Mermaid (`Phy04AvoidDesign.md` 166–171): diamond `_phyOn? not jumping`; `|yes|` → `applyAvoidBias`; `|no jumping|` → `aim = dest`. Prose at 164: Jump / `!_phyOn` keeps dest.
- Live: `_phyOn = !ctx.gate.jumping` (`npc.js` 2261); `steerLive` `aim = _phyOn ? applyAvoidBias(...) : targetPos` (`npc.js` 749). Not jumping → bias. Jumping → dest.
- Contract §2 still: `ctx.gate.jumping` / `!_phyOn` → dest unchanged; no bounce. Missing bag → dest. Never `speed = 0`. Not inverted to the old picture.
- `git diff --name-only -- src`: `src/systems/ship.js`, `src/systems/ship-assets.js` only (BIO gait). No `npc.js` / `physics.js` / `collision.js` / `save.js` / `state.js` / `station.js` / `hud.js` PHY write.
- Digit freeze live: `station.js` 188 last = shipyard; Digit 0 at 6041–6043; Digit 8 `i=7` launch; Digit 9 `i=8` epics.
- Hub: `hud.css` 184–193 80 px; `hud.js` 709–712 RANGE in `.rw-reticle`.
- Persist: `save.js` `WORLD_FIELDS` 76–101 has no avoid key. Autosave `rimward-save-v1` (66).
- `state.js`: grep `applyAvoidBias` = 0. `npc.js`: grep navmesh / A* = 0.
- Brief ≡ contract on Digit / hub / `state.js` / persist / navmesh (text + picture now).
- Detail: `out/w108/phy04/verify/recheck-notes.md`.
