## Code Review: Wave 68 PR5 boot pins

**Scope:** `scripts/boot-test.mjs`, `out/w68/pr5/probe.mjs`.
**Persona:** reviewer + orchestrator code-review checklist.
**Pass:** final (no Blocker/Major).

### Summary
Wave 64 equipment heal no longer treats `launcher` as an unknown key. WAVE68 pins catalog, persist/mutators, Digit 8 papers helpers, HUD empty group 4, and fire source contracts. Log line is `wave68 weapons:`. Live Digit 6 outfitting from Wave 64 is left as-is; WAVE68 does not add extra travel.

### What's done well
- Light + `launcher: 1` heals to `''`; `missileAmmo` 0; `turret` `''`; nested `loadout` dropped; `missiles` absent.
- Heavy dart + ammo 99 caps at 8 via `sanitizeHangarRecord` and `writeMountedGear`.
- Restore of `world.launcher: 'dart'` with a mounted light row empties world mirrors.
- `spendMissileAmmo` lockstep with the hangar row and world mirror.
- Yard stock row empty racks; `WORLD_FIELDS` includes `launcher` / `missileAmmo` / `turret`.
- Papers: `armOutfitPapers` no debit; `confirmOutfitPapers` debit 6500 and seats dart on a heavy stub.
- Digit 8 on dock level 1 stays Launch (`DOCK_KEY_SERVICES[7]` + level-1 source pin).
- Empty group 4 WPN is `4 · —` via exported `weaponHudLabel` / `hudWeaponKey`.
- Fire: `MISSILE_POOL = 8`; empty group 4 does not fall through to cannon; no `missileIncoming`.

### Findings

#### 🟡 Minor: WAVE68 skips live overlay Digit 8
**Location:** `scripts/boot-test.mjs` WAVE68 desk pins
**Issue:** Task allowed a live dock if Digit 6 outfitting already existed. Wave 64 undocks after equipment buys. Starter hull is light and cannot seat dart.
**Fix:** Keep helper pins. Do not add a second dock+yard-buy+switch just for overlay text.
**Status:** open — helpers are the flake-safe path.

#### 💡 Suggestion: `hudEmpty` does not call `sanitizeHangar`
**Location:** WAVE68 `hudEmpty` stub
**Issue:** `hudWeaponKey` reads `ctx.world.launcher` only. A missing hangar still returns `null` for empty group 4.
**Fix:** Keep. HUD is world-mirror read, not hangar walk.
**Status:** open — leave as-is.

#### 💡 Suggestion: probe duplicates boot pins
**Location:** `out/w68/pr5/probe.mjs`
**Issue:** Fast helper re-run, not the full boot graph.
**Fix:** Treat `npm run test:boot` as the source of truth. Probe is a slice.
**Status:** open — documented.

### Resolved this pass
- `heal.noMissiles` no longer requires `!('launcher' in healed)`.
- Invalid numeric `launcher` on a light row is asserted empty, not absent.
- `write.seated` snapshots ammo 8 before `spendMissileAmmo`; lockstep then asserts 7.

### Test coverage
- `node --import ./scripts/with-css-stub.mjs out/w68/pr5/probe.mjs` — helper pins + boot-source presence.
- `npm run test:boot` — `wave68 weapons` JSON all true; `wave64 equipment` `heal.*` still all true.
- Known unrelated FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE30 payTribute, WAVE35 haul gate) are not in this change set.
