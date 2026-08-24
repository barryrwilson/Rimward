# BIO-08 live locomotion inventory (code wins)

**Wave:** 107. Read-only census.  
**Rule:** live `src/` wins over stale Bio docs and over Wave 104 line numbers (those files moved).  
**Not this wave:** any `src/` edit. Sibling Wave 107 workers own `src/systems/ship.js`, `src/systems/ship-assets.js`, `src/game/living-cadence.js`, `scripts/boot-test.mjs`, `src/systems/station.js`. This census **read** those paths; it does **not** write them.

**BIO-06** (class Hz / sweep) is a sibling leftover. **BIO-07** (mesh / body) is a sibling leftover. This census records **how** live motion displaces vertices, and how Wave 106 bodies expect different anatomy. It does **not** retune `LIVING_CADENCE`.

---

## 1. Verdict

Live GPU swim is **one** spine+flap shader for every Beautiful class. Live player CPU swim is **one** manta/whale vertex loop for every living remount. Wave 106 bodies are already **four** plans (shark / squid / whale / octopus). Wishlist BIO-07 still requires locomotion native to that anatomy (fins sweep, mantle pulse, tentacles trail, massive bodies undulate). There is **no** gait id, **no** `living-gait.js`, and **no** axis-mix uniform. Sibling Wave 107 **has landed** BIO-06 `LIVING_CADENCE` + `uSwimSweep` (Wave 104 numbers). Cadence is **not** this leftover. Gait is.

---

## 2. Class keys (do not invent)

| Table | Keys | Cite |
|---|---|---|
| `SHIP_CLASSES` | `light` `heavy` `freighter` `ace` `cutter` `frigate` | `src/game/state.js` 37–44 |
| `NPC_CLASSES` | `light` `ace` `cutter` `heavy` `frigate` `freighter` | `src/systems/ship-assets.js` 20 |
| `LIVING_STOCK` | same six | `src/game/shipyard.js` 29 |
| `classKeyOf` | unknown → `'light'` via `hasOwnProperty(SHIP_CLASSES)` | `src/game/hangar.js` 40–41 |
| `canonicalClass` | unknown → `'light'` via `NPC_CLASSES.includes` | `src/systems/ship-assets.js` 126–128 |
| `LIVING_CADENCE` | six-key hzScale/sweepScale; light 1.00/1.00 | `src/game/living-cadence.js` 12–26 |
| Charter size | ace ~= light < cutter < heavy < frigate << freighter | `src/game/ship-scale.js` 32, 69–93 |

`state.js` is READ-ONLY (`state.js` 7–8). No gait field on `SHIP_CLASSES`.

Cruise / burn (live; gait must **read**, not rewrite — copy from `SHIP_CLASSES`):

| Class | cruise | burn | `SHIP_SCALE.target` |
|---|---|---|---|
| light | 120 | 240 | 6.8 |
| ace | 135 | 270 | 7.2 |
| cutter | 105 | 210 | 11.0 |
| heavy | 90 | 180 | 17.0 |
| frigate | 22 | 45 | 32.0 |
| freighter | 60 | 120 | 78.0 |

`P` (player light yardstick) = **6.6** (`ship-scale.js` 39). Default `ctx.config.ship.maxSpeed` = **120** (`src/core/ctx.js` 52).

---

## 3. Player CPU swim (`makeLivingHull` / `ship.js`)

### 3.1 Sculpt — still a manta/whale sphere. Player bar. Do not demand NPC GLB on the player.

`export function makeLivingHull(classKey = 'light')` — `src/systems/ship.js` **279–339**.

- Sphere 64×40 → **manta/whale**. Nose −Z, tail +Z (`ship.js` 266–269, 296–307).
- `livingRestScale` ~257–261: light stays 1; else `target / P`.
- `livingSilhouette` ~263–268: **cutter** `{0.88,0.78,1.16}`; **heavy** `{1.10,1.32,1.06}`; **else identity**.
- Per-vertex: `base`, `zNorm` (0 nose → 1 tail), `wingness` (0 spine → 1 wingtips from `|x|`).
- Returns `{ geo, base, zNorm, wingness, count, restScale, sx, sy, sz }`.

`buildLivingVisual` calls `makeLivingHull(classKey)` (`ship.js` 387–388).

`remountPlayerHull` 551–565: Unknowables force `hullKind = 'living'`; living branch `buildLivingVisual(ctx.player?.classKey || 'light')`. **Does not** load Beautiful GLB.

Models Browser / default: no-arg `makeLivingHull()` is the **light** yardstick (`ship.js` 271–273).

**BIO-08 must not replace this sculpt. Must not clone it onto NPCs.**

### 3.2 Motion constants (do not retune)

```
SWIM_IDLE_HZ = 0.5     living-cadence.js 8; imported ship.js 13–19
SWIM_CRUISE_HZ = 2.3   living-cadence.js 9
BREATH_HZ = 0.25       ship.js 151
HEART_HZ = 1.1         ship.js 152
```

Mood `rate` (`ship.js` 157–162): serene 1.0, keen 1.25, anxious 1.0, pained 0.6, feral 1.5.

BIO-06 landed on this loop (`ship.js` 959–976): `cadenceFor(classKey)`; if the row is **not** `LIVING_CADENCE.light`, Hz uses `classCruise` and `hzScale`, flap uses `sweepScale`. Light (and unknown → light) keeps the live 0.5→2.3 envelope **bit-identical**. **Do not retune those floats.**

### 3.3 Per-frame living loop (spine + flap, breath, heart)

`src/systems/ship.js` **953–1009** (veins / thrust / whole-body breath continue after):

```
speedNorm = min(ship.speed / shipCfg.maxSpeed, 1.5)     // 955
cadence = cadenceFor(player.classKey)                   // 960
light: swimHz = (0.5 + (2.3-0.5)*min(speedNorm,1)) * mood.rate
       flapAmp = (0.16 + 0.5 * speedNorm) * restScale
other: hz * hzScale vs classCruise; flap * sweepScale
bodyAmp = (0.1 + 0.22 * speedNorm) * restScale          // 978
radialScale = 1 + 0.035 * breath + 0.02 * heart         // 980–984
```

Vertex loop **986–1009**:

1. Radial breath/heart scale on xyz.
2. **Spine** on **X**: `x += bodyAmp * zn * zn * sin(6.9 * zn - swimPhase)` (1000).
3. **Flap** on **Y** if `wingness > 0`: `y += flapAmp * w * sin(swimPhase - 1.4 * |bx|)` (1002–1003).
4. Amoeba shimmer on **Y**.
5. **Z is not kicked** (stays `bz * radialScale`).

No gait id. Light and a remounted living whale still share **manta axes**. BIO-06 only changed **how fast / how far** the same flap travels.

Breath / heart / veins / thrust surge / idle hover / growth scale: independent of class gait. **Must not be lost** on larger living remounts.

### 3.4 reducedMotion on the player

- Afterburner trail hidden; hit shake skipped (later in the same tick).
- Built plated calls `animateShipMesh(..., reducedMotion)`.
- **Living CPU vertex swim does not read `reducedMotion`.** It always mutates (`ship.js` 953–1009). This is live. BIO-08 must not “fix” it.

---

## 4. NPC GPU swim (`injectSwim` / `ship-assets.js`)

### 4.1 Cadence module (BIO-06 live; honor, do not retune)

`src/game/living-cadence.js` **1–37** (THREE-free):

- `SWIM_IDLE_HZ = 0.5`, `SWIM_CRUISE_HZ = 2.3`.
- `LIVING_CADENCE` light 1.00/1.00, ace 0.96/1.06, cutter 0.80/1.22, heavy 0.62/1.42, frigate 0.44/1.68, freighter 0.30/2.00 — **matches** `out/w104/bio06/shared-contract.md` §0.1.
- `cadenceFor(classKey)` hasOwn → light.
- `classCruise(classKey)` hasOwn `SHIP_CLASSES` → 120.

**No gait table in this module. Do not add gait fields here.** Preferred gait home is a **sibling** `living-gait.js`.

### 4.2 Uniforms + one shader (today)

`ship-assets.js` imports cadence (`7–12`). `SWIM_PROGRAM_KEY = 'rimward-beautiful-swim-hz-sweep'` (**55**).

`makeSwimUniforms` **57–63**: `uSwimTime`, `uSwimAmp` (1), `uSwimHz` (idle), **`uSwimSweep` (1)**. Four floats.

`injectSwim` **66–95** (authored GLSL, one `onBeforeCompile`):

- `swimPhase = uSwimTime * 2π * uSwimHz` + last morph influence (per-ship phase).
- `zn = aSwim.x`; `wing = aSwim.y`; `xn = aSwim.z`; `sz = aSwim.w`.
- `bodyAmp = 0.025 * sz`; `flapAmp = 0.045 * sz`.
- Breath in shader: `1 + 0.012 * uSwimAmp * sin(uSwimTime * 2π * 0.25)` — **not** class-scaled; 0.25 Hz matches player `BREATH_HZ`.
- Displacement: **spine X**, **flap Y × `uSwimSweep`**. No Z kick. No radial mantle term beyond the tiny breath scale.
- `customProgramCacheKey` is the live constant `rimward-beautiful-swim-hz-sweep` (55, 101).

Beautiful only: `buildShipAsset` **432** `swimUniforms = resolvedFaction === 'beautiful' ? makeSwimUniforms() : null`.

Unknowables NPC: idle clip name `'idle'` (`ship-assets.js` 42) but **no** swim uniforms (432).

Phase: `Math.random() * 2π` into last morph (`ship-assets.js` 462–472). Visual only. Do not persist.

`root.userData.classKey = resolvedClass` at `buildShipAsset` **455** (BIO-06 landed). Still **no** `gaitId`.

### 4.3 Wave 104 BIO-06 vs live (code wins)

| Symbol | Live `src/` now |
|---|---|
| `uSwimSweep` | **present** (`ship-assets.js` 62, 92, 509) |
| `LIVING_CADENCE` | **present** (`living-cadence.js` 12–19) |
| `src/game/living-cadence.js` | **present** (Wave 107 sibling) |
| NPC speed-norm | **class cruise** (`updateShipAsset` 502–504) |
| `mixer.timeScale` | **absent** (good) |
| gait floats / `living-gait.js` | **absent** (this leftover) |

Shader is **still one** spine+flap program. Sweep scales Y flap only. BIO-08 layers axis mix **on top**. Do not retune hzScale/sweepScale. Do not overload `uSwimSweep` as gait.

### 4.4 aSwim bake (one bbox recipe for every Beautiful mesh)

`loadTemplate` Beautiful branch **278–310**:

```
zNorm = (z - zMin) / zSpan
xNorm = |x| / xMax
wingness = pow(min(xNorm, 1), 1.5)
aSwim = (zNorm, wingness, xNorm, size)
```

`wingness` is **lateral |x|**. That matches a manta disc. It does **not** mark:

- shark caudal lobes on ±Y / +Z
- squid arms / tentacles trailing +Z
- whale **horizontal** fluke on ±X at the tail
- octopus travel-pose arms trailing +Z from a mantle toward −Z

Bake is still **one** attribute. Fail closed: keep this bake; do not fall through to a generic stub mesh.

### 4.5 Per-frame GPU

`updateShipAsset` **492–509**:

```
if (mixer && !reducedMotion) mixer.setTime(elapsed);
cadence = cadenceFor(object.userData.classKey)
cruise = classCruise(object.userData.classKey)
speedNorm = min(spd / cruise, 1)
uSwimTime = elapsed
uSwimAmp = reducedMotion ? 0 : 1
uSwimHz = (0.5 + (2.3 - 0.5) * speedNorm) * hzScale
uSwimSweep = reducedMotion ? 0 : sweepScale
```

`animateShipMesh` is a pass-through (`npc.js` 188–189).

Traffic tick: `npc.js` **2287**

```
animateShipMesh(live.object, ctx.elapsed, reducedMotion, ctx.camera, st.disabled ? 0 : ai.velocity.length());
```

Does **not** pass `classKey` (stashed on `userData` at build). **No** `gaitId` today.

---

## 5. Wave 106 / BIO-07 body plans (anatomy the gait must honor)

Source: `out/w106/foundation/notes.md` + live class builders. **Mesh work is BIO-07. Gait work is this leftover.**

| classKey | Body plan | Live builder | Motion that would feel native |
|---|---|---|---|
| light | SHARK — young reef shark | `scripts/ship_builders/beautiful/light.py` 1–18 | Heterocercal caudal + triangular pectorals. Not a diamond manta wing. |
| cutter | SHARK — hammerhead, **not a scaled light** | `cutter.py` 7–18 | Same shark family, cephalofoil + cupped pectorals + caudal. Not light scaled. |
| ace | SQUID — hunting squid | `ace.py` 1–15 | Mantle pulse (radial/Z). Rear rhomboid fins. Arm bundle trails +Z. **Not manta wings.** |
| heavy | WHALE — humpback shieldback | `heavy.py` 1–18 | **Horizontal** fluke. Long pectorals. Dense whole-body. Not a shark tail. |
| freighter | WHALE — blue-whale gardenback | `freighter.py` 1–15 | Extreme length, tiny pectorals, huge horizontal fluke, slow undulate. |
| frigate | OCTOPUS — **travel pose** | `frigate.py` 1–25; `__init__.py` 19–22 | Mantle toward **−Z**, arms trail **+Z**. Interbrachial **skirt**, **not** a radial sunburst. |

Package map (`beautiful/__init__.py` 7–27; `out/w106/foundation/notes.md` 8–16): four plans, one tissue lineage. Driver glow at `z = +l*0.47`.

**Live GPU still flaps every one of these as a manta** (X spine + Y wing from `|x|`).

Fail closed for a later body miss: **keep the class GLB** + current spine+flap shader. Never `BUILDERS['beautiful']` sphere stub.

---

## 6. reducedMotion (live split — do not “fix”)

| Surface | Behavior | Cite |
|---|---|---|
| Settings default | `false` | `src/core/ctx.js` 217 |
| NPC GPU swim | `uSwimAmp = 0`; `uSwimSweep = 0` | `ship-assets.js` 506–509 |
| NPC mixer | skip `setTime` | `ship-assets.js` 494 |
| Station organics | `animateOrganic` no-op | `organic.js` 647–648 |
| Player living CPU | **still swims** | `ship.js` 953–1009 (no gate) |
| Yard turntable | skip rotate (plated path) | `yard-preview.js` (living `update: null`) |

`organic.js` 18–23: CPU per-vertex stays unique to the player; Beautiful NPC swim is GPU in `ship-assets.js`.

---

## 7. Yard preview — do not sneak a second swim into the desk

`src/systems/yard-preview.js`:

- Living SKU: `makeLivingHull(classKey)` mesh, **`update: null`** (89, **115**).
- Plated SKU: `animateShipMesh` **without speed** → idle (119–128).

Digit 0 is shipyard (`station.js` 185; Digit 0 handler 6026–6030). Cadence/locomotion is **not** a dock verb. Do not add a CPU vertex loop to the living desk preview.

---

## 8. Neighbours (do not steal)

| Surface | Today | BIO-08 |
|---|---|---|
| HUD family | reads `hullKind`; never writes `player.hullKind` | `hud.js` 81–89 |
| Empty hub | 80 px + RANGE | `hud.css` 184–193; `hud.js` 709–712 |
| Digit 0 | shipyard | `station.js` 185, 6026–6030 |
| Digit 8 dock | launch (`DOCK_KEY_SERVICES[7]`) | `station.js` 185; Digit 8 → index 7 |
| Digit 9 dock | epics (`DOCK_KEY_SERVICES[8]`) | `station.js` 185; Digit 9 → index 8 |
| Persist | no gait / cadence key | `save.js` 16, 76–101 `WORLD_FIELDS`; key `rimward-save-v1` |
| Grafted built | plated; not `makeLivingHull` | Wave 97; do not reopen |
| `innerHTML` | modelsbrowser only | later forbidden on this serial |
| BIO-06 table | **live** `living-cadence.js`; honor Wave 104 numbers | do not retune |
| BIO-05 graft | closed Wave 97 | do not reopen |
| BIO-02 kit mutate | omit | do not reopen |

---

## 9. What is absent (wishlist leftover)

- Per-class **gait id** / axis mix (this leftover).
- `src/game/living-gait.js`.
- GPU terms for Z tail kick, radial mantle pulse, arm-trail bias.
- Native match of Wave 106 shark / squid / whale / octopus motion.
- Persist field for gait (must stay absent).
- Digit / SKU / UU / hub pip for gait (must stay absent).
- Cadence is **not** absent (BIO-06 sibling landed). Gait is.

---

## 10. Pain mapped to code

1. **One manta shader for four anatomies** (`ship-assets.js` 66–95) — squid arms flap like wings; octopus travel pose sunbursts on |x|; whale fluke yaws like a shark disc. Sweep only scales that Y flap.
2. **One CPU manta loop for every living remount** (`ship.js` 986–1009) — a player on a living heavy still flaps manta wings, not a horizontal fluke. BIO-06 only slows/heavies the same axes.
3. **aSwim.wingness = |x|** (`ship-assets.js` 297–300) — trailing +Z mass (arms, tentacles, caudal) is under-weighted.
4. **BIO-06 Hz is live** (`living-cadence.js`) — do not steal or retune that table; do not “fix” remaining frantic **shape** with Hz.
5. **No mixer.timeScale by class** (grep 0 in `src/`). Idle clip is independent. Do not “fix” gait by slowing the GLB clip.
6. **Yard living preview is a still** (`yard-preview.js` 115). Do not sneak a second swim.

---

## 11. Line-number freeze

Cites are Wave 107 live after the BIO-06 sibling landed. Later impl must re-grep if files move. Code wins. Wave 104 inventory line numbers are **stale**.
