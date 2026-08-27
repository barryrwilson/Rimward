# Wave 138 PR1 oreguide notes

Landed MSN-05 contract-to-rock match:

- `src/game/mining-ore-keys.js` — `acceptedMiningOreKeys(ctx)` plus match/name helpers. Read-only. Reserved / unknown keys skip.
- `src/systems/controls.js` — group-3 `collectCycleCands` rocks match the key set when any matching `ore > 0` rock remains in `asteroids.list`. Ships and `isCycleHostile` unchanged. Out-of-range matching rocks do not fall back to brine ice.
- `src/systems/hud.js` — `beltMineDist` is match-gated (work sector first, then full list). Named cue `Mine · ${oreName} ${n}u`. Fallback `Mine · belt ${n}u`. `textContent` only.
- `scripts/boot-test.mjs` — WAVE138 oreguide pins. Restore jobs/system/dock/weaponGroup/target/list in finally.
- `docs/Msn05OreGuidanceDesign.md` — status Implemented Wave 138 PR1.

Boot pin result (this worker): all WAVE138 oreguide keys true. Cue texts: `Mine · Raw ore 200u`, `Mine · belt 40u`, `Mine · belt 40u`, `Mine · Living rock 90u`. Unrelated WAVE127/WAVE132 failures left alone.

No Vite. No Chrome. Port 5180 unused.
