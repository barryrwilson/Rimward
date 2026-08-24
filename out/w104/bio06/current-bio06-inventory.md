# BIO-06 live cadence inventory (code wins)

**Wave:** 104. Read-only census.  
**Rule:** live `src/` wins over stale BIO-03 / BIO-Living comments (those files still mention a global 0.7 Hz NPC swim in places; Wave 76 already shipped per-instance 0.5→2.3).  
**Not this wave:** any `src/` edit.

---

## 1. Verdict

There is **no** per-class fin-cadence table. Player CPU and Beautiful NPC GPU share one idle/cruise pair (**0.5 Hz / 2.3 Hz**). Size already scales **amplitude** (`restScale` on the player; `aSwim.w` `sz` on the GPU). **Frequency does not.** NPC speed-norm is always **/ 120** (light cruise). Player speed-norm is already **/ class cruise**. Large living remounts and Beautiful heavies at high speed therefore inherit **light-class stroke rate**. That is BIO-06.

---

## 2. Class keys (do not invent)

| Table | Keys | Cite |
|---|---|---|
| `SHIP_CLASSES` | `light` `heavy` `freighter` `ace` `cutter` `frigate` | `src/game/state.js` 37–44 |
| `NPC_CLASSES` | `light` `ace` `cutter` `heavy` `frigate` `freighter` | `src/systems/ship-assets.js` 11 |
| `LIVING_STOCK` | same six | `src/game/shipyard.js` 29 |
| `classKeyOf` | unknown → `'light'` via `hasOwnProperty(SHIP_CLASSES)` | `src/game/hangar.js` 40–41 |
| Charter size | ace ~= light < cutter < heavy < frigate << freighter | `src/game/ship-scale.js` 32, 69–186 |

Cruise / burn (live; cadence must **read**, not rewrite):

| Class | cruise | burn | `SHIP_SCALE.target` |
|---|---|---|---|
| light | 120 | 240 | 6.8 |
| ace | 135 | 270 | 7.2 |
| cutter | 105 | 210 | 11.0 |
| heavy | 90 | 180 | 17.0 |
| frigate | 22 | 45 | 32.0 |
| freighter | 60 | 120 | 78.0 |

`P` (player light yardstick) = **6.6** (`ship-scale.js` 39).

`state.js` is READ-ONLY this wave (`state.js` 7–8).

---

## 3. Player CPU swim (`makeLivingHull` / `ship.js` bio motion)

### 3.1 Sculpt

`export function makeLivingHull(classKey = 'light')` — `src/systems/ship.js` **274–334**.

- Sphere 64×40 → manta/whale. Nose −Z, tail +Z.
- `livingRestScale` 252–256: light stays 1; else `target / P`.
- `livingSilhouette` 258–263: **cutter** `{0.88,0.78,1.16}`; **heavy** `{1.10,1.32,1.06}`; **else identity** (ace/frigate/freighter get scale without extra silhouette).
- Returns `{ geo, base, zNorm, wingness, count, restScale, sx, sy, sz }`.

`buildLivingVisual` 382–388 calls `makeLivingHull(classKey)`.

`remountPlayerHull` 546–560: Unknowables force `hullKind = 'living'`; living branch `buildLivingVisual(ctx.player?.classKey || 'light')`. **Does not** load Beautiful GLB.

Models Browser / default: no-arg `makeLivingHull()` is the **light** yardstick (`ship.js` 271–273; `model-catalog.js` 98).

### 3.2 Motion constants

```
IDLE_SWIM_HZ = 0.5     ship.js 144
CRUISE_SWIM_HZ = 2.3   ship.js 145
BREATH_HZ = 0.25       ship.js 146
HEART_HZ = 1.1         ship.js 147
```

Mood `rate` (`ship.js` 152–157): serene 1.0, keen 1.25, anxious 1.0, pained 0.6, feral 1.5.

### 3.3 Per-frame living loop

`src/systems/ship.js` **948–1022**:

```
speedNorm = min(ship.speed / shipCfg.maxSpeed, 1.5)     // 950
swimHz = (IDLE + (CRUISE - IDLE) * min(speedNorm, 1)) * mood.rate   // 954–956
bodyAmp = (0.1 + 0.22 * speedNorm) * restScale          // 958
flapAmp = (0.16 + 0.5 * speedNorm) * restScale          // 959
```

Vertex loop 967–993: radial breath/heart → spine `sin(6.9*zn - swimPhase)` → wing `flapAmp * w * sin(swimPhase - 1.4*|bx|)` → amoeba shimmer.

`shipCfg.maxSpeed` is class **cruise** after `applyFlightEnvelope` (`hangar.js` 563–568). Default `ctx.config.ship.maxSpeed` is 120 (`ctx.js` 52).

**No `hzScale` / class branch in this loop.** Light and remounted living heavy share 0.5→2.3. Heavy at cruise already flaps at 2.3 Hz.

Breath / heart / veins / thrust surge / idle hover / growth scale: 961–1046. Independent of class cadence.

### 3.4 reducedMotion on the player

- Afterburner **trail** hidden (`ship.js` 52, 1050–1084).
- Hit shake skipped (`ship.js` 57, 1170).
- Built plated calls `animateShipMesh(..., reducedMotion)` (`ship.js` 1024).
- **Living CPU vertex swim does not read `reducedMotion`.** It always mutates. This is live. BIO-06 must not “fix” it.

---

## 4. NPC GPU swim uniforms

### 4.1 Constants (module, not persist)

`src/systems/ship-assets.js` **43–49**:

```
SWIM_IDLE_HZ = 0.5
SWIM_CRUISE_HZ = 2.3
SWIM_CRUISE_SPEED = 120   // comment: light-class cruise; not a persist field
SWIM_PROGRAM_KEY = 'rimward-beautiful-swim-hz'
```

**No class table.** Same pair as the player.

### 4.2 Uniforms + shader

`makeSwimUniforms` 51–57: `uSwimTime`, `uSwimAmp` (1), `uSwimHz` (idle).

`injectSwim` 59–87 (authored GLSL):

- `swimPhase = uSwimTime * 2π * uSwimHz` + last morph influence (per-ship phase).
- `bodyAmp = 0.025 * sz`; `flapAmp = 0.045 * sz`; `sz = aSwim.w` (mesh size).
- Breath in shader: `1 + 0.012 * uSwimAmp * sin(uSwimTime * 2π * 0.25)` — **not** class-scaled; 0.25 Hz matches player `BREATH_HZ`.
- Displacement: spine X, flap Y. **Hz is uniform. Amp is mesh-size, not class-Hz.**

Beautiful only: `buildShipAsset` 398 `swimUniforms = resolvedFaction === 'beautiful' ? makeSwimUniforms() : null`.

Phase: `Math.random() * 2π` into last morph (`ship-assets.js` 427–436). Visual only.

### 4.3 Per-frame

`updateShipAsset` **457–470**:

```
if (mixer && !reducedMotion) mixer.setTime(elapsed);
spd = finite speed ? max(speed, 0) : 0
speedNorm = min(spd / 120, 1)
uSwimTime = elapsed
uSwimAmp = reducedMotion ? 0 : 1
uSwimHz = 0.5 + (2.3 - 0.5) * speedNorm
```

Omit speed → idle 0.5 Hz (`npc.js` 186 comment).

`animateShipMesh` is a pass-through (`npc.js` 186–188).

Traffic tick: `npc.js` **2280**

```
animateShipMesh(live.object, ctx.elapsed, reducedMotion, ctx.camera, st.disabled ? 0 : ai.velocity.length());
```

Does **not** pass `classKey`. `userData` has `assetInstanceKey` `faction:class:role` (`ship-assets.js` 439) but **no** dedicated `classKey` field today.

### 4.4 Implied live Hz (NPC, if velocity equals class cruise / burn)

Norm = speed/120:

| Class | at cruise Hz | at burn Hz |
|---|---|---|
| light 120 / 240 | 2.30 | 2.30 (clamp) |
| ace 135 / 270 | 2.30 | 2.30 |
| cutter 105 / 210 | 2.08 | 2.30 |
| heavy 90 / 180 | 1.85 | **2.30** |
| frigate 22 / 45 | 0.83 | 1.18 |
| freighter 60 / 120 | 1.40 | **2.30** |

Heavy/freighter **burn** (and anything that hits 120 u/s) = light frantic flap. Frigate never reaches 2.3 on its authored envelope, but still uses the light curve, not a class stroke.

---

## 5. Beautiful GLB path

`ASSET_ROOT = '/assets/ships'` (`ship-assets.js` 13).

Template: `` `${ASSET_ROOT}/${faction}/${classKey}/${lod}.glb` `` (`ship-assets.js` 27, 234).

Beautiful on disk (`public/assets/ships/beautiful/`):

| Class | LODs |
|---|---|
| light, ace, cutter, heavy, frigate | lod0, lod1, lod2 |
| freighter | lod0–lod3 |

Idle clip name `'idle'` for `beautiful` and `unknowables` (`ship-assets.js` 33, 421–425).

`aSwim` baked per Beautiful template (`ship-assets.js` 247–277): `zNorm, wingness, xNorm, size`.

---

## 6. reducedMotion (live split)

| Surface | Behavior | Cite |
|---|---|---|
| Settings default | `false` | `ctx.js` 217 |
| NPC GPU swim | `uSwimAmp = 0` | `ship-assets.js` 469 |
| NPC mixer | skip `setTime` | `ship-assets.js` 459 |
| Station organics | `animateOrganic` no-op | `organic.js` 28–29, 647–648 |
| Player living CPU | **still swims** | `ship.js` 948–993 (no gate) |
| Player trail / shake | off | `ship.js` 1050–1084, 1170 |
| Yard turntable | skip rotate | `yard-preview.js` 381 |

`organic.js` 18–23: CPU per-vertex stays unique to the player; Beautiful NPC swim is GPU in `ship-assets.js`.

---

## 7. Neighbours (do not steal)

| Surface | Today | BIO-06 |
|---|---|---|
| HUD family | reads `hullKind`; never writes | `hud.js` 80–87 |
| Empty hub | 80 px + RANGE | `hud.css` 184–193; `hud.js` 709–712 |
| Digit 0 | shipyard | `station.js` 185, 6023–6025 |
| Digit 8/9 dock | launch / epics | `station.js` 185, 6027–6028 |
| Yard living preview | `makeLivingHull` mesh, `update: null` (static) | `yard-preview.js` 93–116 |
| Yard plated preview | `animateShipMesh` no speed | `yard-preview.js` 119–128 |
| Grafted built | plated; not `makeLivingHull` | Wave 97; do not reopen |
| `innerHTML` | not on these motion paths | later forbidden |

---

## 8. What is absent (wishlist leftover)

- Per-class `hzScale` / `sweepScale`.
- NPC speed-norm vs **class** cruise.
- `uSwimSweep` (or any second uniform besides time/amp/Hz).
- Persist field for cadence.
- Digit / SKU / UU for cadence.
- BIO-07 distinct species bodies (sibling leftover; **not** this census’s job beyond naming the gap).

---

## 9. Pain mapped to code

1. **Universal Hz pair** (`ship.js` 144–145; `ship-assets.js` 46–47) — one envelope for whale and wayfinder.
2. **NPC `/ 120` clamp** (`ship-assets.js` 48, 467) — large hulls that reach light cruise inherit light Hz.
3. **Player already class-norms speed** (`ship.js` 950 + `hangar.js` 568) — living **heavy remount** hits 2.3 Hz at **its** cruise. Worse than NPC heavy at cruise.
4. **Amp scales with size, Hz does not** — big fins at light frequency = frantic.
5. **No mixer.timeScale by class** (good). Idle clip is independent. Do not “fix” cadence by scaling the clip.

---

## 10. Line-number freeze

Cites are Wave 104 live. Later impl must re-grep if files move. Code wins.
