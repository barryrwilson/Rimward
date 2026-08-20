# Wave 66 PR1 notes

- Hole: `SAFE_ID` (`/^[a-z0-9_]+$/i`) matches `__proto__`. `sanitizeFaction` now rejects the hangar reserved-id set first. Reserved cargo faction drops the whole survivor row.
- Keep-list unchanged: `commodity`, `units`, `faction`, `source`, `name` (cap 40). Extra keys drop because the row is a new literal.
- No `WORLD_FIELDS` add. `peopleTrafficked` is not a world field. Later sale may append that id to `world.milestones` only.
- WAVE66 SAVE PINS (boot-test, after WAVE65): all-true via `restore()` + `sanitizeCargoList`. Pin ctx uses `cargoCapacity: 80` so hangar migrate does not trim the mixed hold.
- Isolated probe also all-true. `npm run test:boot` logged `wave66 save pins` all-true. Pre-existing FAILs: WAVE4 fence, WAVE26 ferry/haul (6), WAVE35 haul gate (8 total). WAVE30 did not flake this run.
- Did not touch station, HUD, ctx, pods, scoop, spawn, rescue, or trafficking.js.
