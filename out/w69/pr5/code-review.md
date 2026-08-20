## Code Review: wave69 AST boot pins (`scripts/boot-test.mjs`, `out/w69/pr5/probe.mjs`)

### Summary
Harness-only pins match contract §10 PR5. Probe run: all twelve booleans true. WAVE51 first-8 tuples stay the PR1 values. No `src/` edits.

### What's done well
- Scoped Freehold `initAsteroids` so overlay/deplete does not mutate the live boot field.
- `id === i`, count 130 ≤ 160, mean hypot vs belt R, work-sector ≥ 60% at ±0.7 rad.
- `wave51tuples` uses the recorded seed-11 first-8 `(oreKey, radius, ore)` triples.
- `depleteRoundtrip` zeros via `fieldOre['0']`, then `delete` + `update` refills from seed (`lastOreRef`; `saveRestored` is fallback only).
- `sunMiss` uses `hypot(x,z)` vs live `config.world.sunRadius * PHY.SUN_HEAT_MULT`.
- `cap160` builds count 200 and asserts clamp 160, then restores authored 130.
- Source pins: `Belt lies`, `Mine · belt`, `dropStaleRockLock`.
- Fail tag `WAVE69 AST FAIL`; log line `wave69 ast:`.

### Findings

#### 🟡 Minor: Cap pin mutates shared `SYSTEMS.freehold.field`
**Location:** `scripts/boot-test.mjs:14232-14242`
**Issue:** `field.count = 200` is a write on the merged `SYSTEMS` table. Restore is in `finally`. This block is last, so later pins do not see 200.
**Fix:** Keep `finally`. If pins move earlier, clone the field or pin `liveCap` instead.

#### 💡 Suggestion: `sunMiss` keep-out is 2D hypot
**Location:** `scripts/boot-test.mjs:14208-14214`
**Issue:** Contract keep-out uses 3D distance plus pad. The PR5 pin is the stated 2D `hypot(x,z)` vs heat radius, no pad. That is the assigned check, not a full PHY sun-zone pin.
**Fix:** Leave as specified. WAVE53 still owns `sunZone`.

### Probe evidence
```
wave69 ast: {"idEqIndex":true,"countFreehold":true,"notClump":true,"workSector":true,"wave51tuples":true,"fieldOreWorldField":true,"depleteRoundtrip":true,"sunMiss":true,"cap160":true,"beltLine":true,"hudMineCue":true,"staleLock":true}
PASS w69 pr5 pins true n=130 meanR=580.9 R=514.8 sector=0.685
```

Command: `node --import ./scripts/with-css-stub.mjs out/w69/pr5/probe.mjs`

---

## Re-dispatch: WAVE51 G2 / I re-aim

### Summary
Held-fire WAVE51 steps re-aim at `list[id]` each frame. Orbits still run (`world.time += dt`). G2 `mk4Cuts` / `oreDrops` and I pod units pass in the scoped probe.

### What's done well
- Track is optional; jump-teardown and one-frame consume steps stay untracked.
- Uses the live list entry, not a copied Vector3.
- G1 72-frame hold, G2 90-frame hold, H 2-frame FX, I both 120-frame cuts all track.
- Hardness G1 still requires `oreUntouched` and `mineBlocked`.

### Findings

No blocker or major.

#### 💡 Suggestion: Aim runs before asteroids `update`
**Location:** `scripts/boot-test.mjs` `w51step`
**Issue:** One frame of orbit (~1 u at belt R) happens after aim, before combat. Sphere radius still covers that lag.
**Fix:** None required. If a later pin needs zero lag, aim after the asteroids update and before combat.

### Probe evidence
```
{"mk4Cuts":true,"oreDrops":true,"blockedFired":true,"oreUntouched":true,"softUnits":8,"resistUnits":4}
PASS wave51 G2/I re-aim
```

Command: `node --import ./scripts/with-css-stub.mjs out/w69/pr5/wave51-gi.mjs`
