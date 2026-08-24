# WAVE66 save pin verification

## Restore path (`src/game/save.js`)

- `omitHangar` is `snap.world.hangar === undefined`.
- Restore sanitizes snap cargo, then `replaceCargo`.
- `sanitizeHangar` / `syncMountedToPlayer` run next.
- If `omitHangar`, restore reseals with `sanitizeCargoList(restoredCargo)` into live hold and mounted hangar row.
- If hangar is present, reseal does not run. Hangar row cargo stays the live hold.

## Probe results

Worker probe (`out/w-boot-fix/save66/probe.mjs`): PROBE PASS. All WAVE66 keys true, including `nameCap`, `validRoundTrip`, `oreNoLeak`, `hangarCargoWins`.

Edge probe (`out/w-boot-fix/save66/verify/edge-probe.mjs`): EDGE PASS.

- Omit-hangar restore keeps units `[2, 5, 11, 12, 13, 14]` (full sanitized list).
- Reserved factions 15/16/17 drop.
- Mounted starter row matches live cargo.
- Live total 57 exceeds starter `cargoCapacity` 40 (documented overfill).
- Present hangar: live and mounted stay `gildvein` x5; snap `rawOre` does not land.
- `hangar: null` does not reseal; trim stops at 40 units `[4, 11, 12, 13]`.

## Boot test

`npm run test:boot` printed WAVE66 JSON all true. `WAVE66 SAVE PINS FAIL` count: 0.
WAVE64 hangar persist JSON all true (includes missing-hangar starter).
Command timed out after WAVE74. Full suite did not finish.
Killed orphan boot PID 86872. Did not kill later boot PID 157152 (other parent).
