# Wave 64 PR1 — hangar persist notes

Hangar rides `WORLD_FIELDS` as `ctx.world.hangar = { mountedId, hulls }`. Cap is 8. Rows are fresh allowlisted literals. Unknown keys drop.

`snapshot()` sanitizes, parks the live mount (JSON only), then allowlists `player.hullKind` before the world copy. Park does not remount and does not write `ctx.bio`.

`restore()` keeps scanner / miningLaser / concealedMounts world heals. A blob with no hangar deletes any leftover hangar, then migrates one living starter from live player + world mirrors. After hangar exists, those world keys stay live mirrors (not dropped).

`freshStart` rebuilds one living starter, forces `hullKind: 'living'`, clears cargo, mirrors stock zeros onto world. `clearAutosave` still removes only `rimward-save-v1`.

HUD reads `hullKind`. HUD never writes it. Unknowables force `'living'` on pack, sanitize, player allowlist, and restore identity copy.

Probe: `node --import ./scripts/with-css-stub.mjs out/w64/hangar-probe.mjs`
