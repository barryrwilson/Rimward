# BIO-06 class-scaled living fin cadence shared contract

**Wave:** 104. Design only. No cadence feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio06CadenceDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Bio01*.md`, `docs/Bio02*.md`, `docs/Bio03*.md`, `docs/Bio04*.md`, `docs/Bio05*.md`, `docs/BioLivingShipsDesign.md`, `docs/Rep05*.md`, `docs/Msn03*.md`, `docs/Hud03*.md`, `docs/Hud02*.md`, `docs/Shp*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, or `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave104.md`.  
**Locked sources:** wishlist BIO-06 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1303–1339); live inventory `out/w104/bio06/current-bio06-inventory.md` (code wins); player CPU `makeLivingHull` quality bar; Wave 76 NPC GPU `uSwimHz` / `uSwimAmp`; Wave 97 BIO-05 graft closed.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale BIO-03 “global 0.7 Hz” comments.

**BIO-07** (species bodies) is a **sibling leftover**. Not this brief. One line only: other worker.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 104 BIO-06 worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. HUD-01 empty **80 px hub**. No cadence meter, fin pip, class disc, or motion widget on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `hud.css` 184–193). **Do not** put swim chrome inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` 185, 6023–6025). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers. First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Cadence is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. This serial has **no new DOM**.
5. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–87).
6. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Do **not** add cadence fields to `SHIP_CLASSES`. Do **not** invent UU. Do **not** invent standing deltas. Do **not** invent class keys. Live keys stay `light` `ace` `cutter` `heavy` `frigate` `freighter` (`state.js` 37–44; `ship-assets.js` 11).
7. Persist: **no** new `WORLD_FIELDS` key. **No** persist key for cadence. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Cadence is a live visual constant. Recompute each frame from `classKey` + speed.
8. Prototype-safe: later `cadenceFor(classKey)` walks `Object.hasOwn(LIVING_CADENCE, classKey)` (or `Object.prototype.hasOwnProperty.call`). Unknown / reserved / non-string → **light** (player bar). Never `LIVING_CADENCE[userString]` as the existence test. Never `for-in` merge from a save blob. Copy `classKeyOf` (`hangar.js` 40–41).
9. Do **not** replace player CPU `makeLivingHull`. Do **not** clone it onto NPCs. Fail closed: keep GPU swim for Beautiful NPC (`ship-assets.js` injectSwim / `updateShipAsset`).
10. Do **not** weaken the player **light** living rig: idle **0.5 Hz**, cruise **2.3 Hz**, mood `rate`, breath **0.25 Hz**, heartbeat **1.1 Hz**, vein surge, idle hover, `GROWTH_SCALE_MAX`. Light `hzScale` **1.00**, `sweepScale` **1.00**. Bit-identical Hz envelope for `classKey === 'light'` (and unknown → light).
11. Avoid **one universal animation-speed multiplier**. Forbidden: `mixer.timeScale` by class, a global `dt` scale, a single `uTime` multiplier on idle clip + swim + breath. Cadence, sweep, and speed-norm are **separate** knobs (§1).
12. Do **not** reopen BIO-05 NPC graft, plated overlay, hangar badge, ungraft (Wave 97 closed). Grafted built stays plated.
13. Do **not** reopen BIO-02 kit mutate. Career labels already Wave 102. Do **not** design BIO-07 species bodies here.
14. Sibling Wave 104 workers own REP-05 `src` and MSN-03 `station.js`. Do **not** edit those paths.
15. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave104.md`. Deputize defaults are recorded **here**.
16. Do not “fix” known boot FAILs. Do not “fix” player CPU swim still running under `reducedMotion` (live; inventory §6). NPC GPU `uSwimAmp = 0` under reducedMotion stays.
17. Unknowables NPC field GLB: **no** Beautiful swim uniforms (`ship-assets.js` 398). Unknowables **player** remount stays `makeLivingHull` (`ship.js` 535–560). Cadence table still applies by **classKey**, not by faction.

---

## 0.1 Wave 104 deputize (owner may override after playtest)

Pick playable cadence defaults from live numbers. **No live per-class cadence table exists** (inventory §4). Pick a monotonic class scale that preserves player-ship feel. Player living hull is the **light / young** benchmark. Do not park. Do not invent a SKU or Digit to “buy” cadence.

### Light envelope (live; do not retune the constants)

| Knob | Live | Cite |
|---|---|---|
| Idle Hz | **0.5** | `ship.js` 144; `ship-assets.js` 46 |
| Cruise Hz | **2.3** | `ship.js` 145; `ship-assets.js` 47 |
| Player speed-norm | `min(speed / shipCfg.maxSpeed, 1.5)`; **Hz uses `min(speedNorm, 1)`** | `ship.js` 950–956; `hangar.js` 568 `maxSpeed = cls.cruise` |
| NPC speed-norm today | `min(speed / 120, 1)` **all classes** | `ship-assets.js` 48, 467–470 |
| Player body/flap amp | `(0.1+0.22*speedNorm)*restScale` / `(0.16+0.5*speedNorm)*restScale` | `ship.js` 958–959 |
| GPU amp | `uSwimAmp` 1 or **0** if reducedMotion; mesh `sz` already scales flap | `ship-assets.js` 76–84, 469 |
| Mood rate (player only) | serene 1.0 / keen 1.25 / anxious 1.0 / pained 0.6 / feral 1.5 | `ship.js` 152–157, 954–956 |

### `LIVING_CADENCE` (new frozen table; not `SHIP_CLASSES`)

Home: **PR1** a THREE-free module **`src/game/living-cadence.js`** (preferred) **or** an exported freeze next to `SWIM_*` in `ship-assets.js` imported by `ship.js`. **Not** `state.js`. Duplicate tables are forbidden (boot-pin equality if a later serial cannot extract).

Unknown key → **light**.

| `classKey` | `hzScale` | `sweepScale` | Idle Hz | Cruise Hz | Why |
|---|---|---|---|---|---|
| `light` | **1.00** | **1.00** | 0.50 | 2.30 | Player bar. Do not change. |
| `ace` | **0.96** | **1.06** | 0.48 | 2.21 | Charter ace ~= light (`ship-scale.js` 32, 89–92). Tiny step down. Still agile. |
| `cutter` | **0.80** | **1.22** | 0.40 | 1.84 | Next size (`target` 11.0). |
| `heavy` | **0.62** | **1.42** | 0.31 | 1.43 | Gunship mass. Stops 2.3 Hz at burn. |
| `frigate` | **0.44** | **1.68** | 0.22 | 1.01 | Capital stroke. Never 2.3. |
| `freighter` | **0.30** | **2.00** | 0.15 | 0.69 | Heaviest. Idle still a visible sweep (~6.7 s), not frozen. |

Monotonic: `light ≥ ace > cutter > heavy > frigate > freighter` on Hz. Sweep is the inverse (heavier follow-through).

**Formulas (later impl):**

```
hz = (IDLE_SWIM_HZ + (CRUISE_SWIM_HZ - IDLE_SWIM_HZ) * min(speed / classCruise, 1)) * hzScale
playerHz = hz * mood.rate
playerFlap = (0.16 + 0.5 * min(speed / classCruise, 1.5)) * restScale * sweepScale
npc uSwimHz = hz
npc uSwimAmp = reducedMotion ? 0 : 1
npc uSwimSweep = reducedMotion ? 0 : sweepScale   // new uniform; do not overload amp
```

`classCruise` = `SHIP_CLASSES[key].cruise` after `hasOwn` (`state.js` 37–44). Miss → **120** (light).

NPC **today** uses 120 for every class, so a heavy at burn already hits **2.3 Hz**. After this table, heavy max is **1.43 Hz**. That is the frantic-fin fix.

Player **today** already norms to **class cruise** (`shipCfg.maxSpeed`). Player **heavy living remount** already hits **2.3 Hz at cruise**. PR2 must apply `hzScale` there. Player **light** stays 2.3 at cruise.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| One `animSpeed` / `mixer.timeScale` | **Forbidden** §0.11 |
| Put scales on `SHIP_CLASSES` in `state.js` | **Forbidden** §0.6 |
| Persist `world.cadence` | **Forbidden** §0.7 |
| SKU / Digit / UU to unlock slower fins | **Forbidden** |
| Clone `makeLivingHull` onto NPC | **Forbidden** §0.9 |
| Slow the light player to “match the fleet” | **Forbidden** §0.10 |
| Scale breath / heartbeat / mood table | **No.** Those stay player identity |
| Scale Beautiful `idle` GLB clip by class | **No.** Swim uniforms only |
| BIO-07 new bodies | **Not this brief** |

Owner may retune the six floats after playtest. Do not park the serial on that retune.

---

## 1. Who / what scales

### 1.1 Player CPU (`ship.js`)

| Rig | Cadence |
|---|---|
| Living `classKey === 'light'` (default origin) | **Live envelope unchanged** |
| Living remount `ace` / `cutter` / `heavy` / `frigate` / `freighter` | Apply `LIVING_CADENCE` |
| Built plated | **No** CPU swim. `animateShipMesh` only (`ship.js` 1024). Beautiful plated player is out of family; GPU path if that mesh is Beautiful (rare). Do not invent. |
| Unknowables player | Living CPU. Scale by class, not faction |

Do **not** replace `makeLivingHull`. Rest scale / silhouette stay (`ship.js` 252–263). PR2 only multiplies the **already computed** swimHz / flapAmp. Spine wave, wing lag 1.4, amoeba shimmer, vein lerp stay.

### 1.2 NPC GPU (`ship-assets.js`)

| Mesh | Cadence |
|---|---|
| `faction === 'beautiful'` + swim uniforms | **Yes.** `uSwimHz` × class; `uSwimSweep` × class; speed-norm vs **class cruise** |
| Other factions | **No** swim uniforms (`buildShipAsset` 398) |
| Unknowables NPC | Idle clip only. No `uSwimHz` |
| Beautiful `idle` mixer | **Untouched** timeScale 1. `setTime(elapsed)` unless reducedMotion (`updateShipAsset` 458–459) |

Stash `object.userData.classKey = resolvedClass` at `buildShipAsset` (live `canonicalClass`, already allowlisted). Missing → light.

### 1.3 Yard / catalog

| Surface | This serial |
|---|---|
| Living yard preview | Live `update: null` (`yard-preview.js` 93–116). **Do not** add a CPU vertex loop to “preview cadence.” |
| Plated yard preview | `animateShipMesh` **without speed** → idle (`yard-preview.js` 126–127). After PR3, idle Hz × class. |
| Models Browser living | Keep `makeLivingHull()` no-arg **light** yardstick (`ship.js` 271–273). |

---

## 2. Speed responsiveness (inside each class)

Keep the live player shape:

- Hz lerps idle → cruise as speed goes 0 → **that class’s cruise**.
- Hz **caps at cruise** (`min(speedNorm, 1)`). Afterburner does **not** raise Hz (live player already).
- Amp may still use `min(speedNorm, 1.5)` on the player (live).
- A large ship at **its** high speed stays **visibly slower** than a small ship at **its** high speed (table §0.1).

Do **not** keep NPC `SWIM_CRUISE_SPEED = 120` as the only norm after PR3. That is the bug: any hull that reaches ~120 u/s inherits light cruise Hz.

Read cruise from `SHIP_CLASSES` (import). Do not copy six cruise integers into the cadence module except as a comment. **Do not edit** `state.js`.

---

## 3. Picture — surfaces stay distinct

| Job | Owner | BIO-06 |
|---|---|---|
| Player light swim / breath / heart | `ship.js` `makeLivingHull` | **Honor. Do not weaken.** |
| Player larger living remount | same CPU loop | **hzScale + sweepScale** |
| Beautiful NPC swim | GPU uniforms | **class Hz + sweep; class-cruise norm** |
| Beautiful idle GLB clip | mixer | **Untouched** |
| Station organic sway | `organic.js` `animateOrganic` | **Untouched** |
| reducedMotion NPC swim | `uSwimAmp = 0` | **Keep** |
| reducedMotion player living | CPU swim **still runs** (live) | **Keep; do not “fix”** |
| reducedMotion trail / shake | `ship.js` 1050–1084 | **Untouched** |
| BIO-07 bodies | other worker | **Not this brief** |
| 80 px hub / Digit 0/8/9 | HUD-01 / station | **Untouched** |

---

## 4. Copy / HUD / keys

**None.** No toast. No Digit. No KeyO row. No `commLine`. Cadence is silent visual.

Do not steal KeyT / KeyV / KeyK / KeyX / KeyO.

---

## 5. Security / emit / persist

- No new world field. No cadence float in the save blob.
- `classKey` already sanitized (`hangar.js` 40–41, 227). Cadence lookup must still `hasOwn`.
- Do not interpolate `classKey` into shader **source** strings. Authored GLSL stays authored. New uniform is a float.
- Do not `JSON.parse` user text for scales.
- `Math.random()` swim phase is live visual only (`ship-assets.js` 430). Do not replace with CSPRNG. Do not persist the phase.
- No new `ctx.emit`.
- No secrets. No `innerHTML`. No Digit theft.

---

## 6. Closed HUD / digits / SKU / graft / BIO-07

- 80 px hub stays empty of new children.
- Digit 0/8/9 stay.
- No SKU. No UU. No `WEAPONS` row.
- No graft overlay. No hangar badge.
- BIO-07 not designed here.

---

## 7. Performance freeze

- Player: **one** living CPU vertex loop as today (`ship.js` 967–993). Do not add a second mesh. Do not clone that loop onto traffic.
- NPC: keep per-instance uniforms. Shared module uniforms are forbidden (comment `ship-assets.js` 43–45).
- Do not raise SphereGeometry segments. Do not disable GPU swim “to match CPU.”

---

## 8. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 data** | `LIVING_CADENCE` + `cadenceFor` (hasOwn → light). Preferred `src/game/living-cadence.js`. **No `state.js`.** | Digit, persist, SKU, shader |
| **PR2 player CPU** | `ship.js` apply scale after live Hz/amp; **light bit-identical**; mood/breath/heart untouched | `makeLivingHull` replace; NPC clone |
| **PR3 NPC GPU** | `userData.classKey`; class-cruise speed-norm; `uSwimHz` × hzScale; `uSwimSweep`; Beautiful only | mixer.timeScale; Unknowables GPU clone |
| **PR4 reducedMotion + boot pins** | NPC amp 0; light 0.5→2.3; monotonic Hz; Digit 0 shipyard; no persist key | wishlist rewrite; boot FAIL “fixes” |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 9. Acceptance (implementation wave; freeze here)

1. Light player idle 0.5 Hz, cruise 2.3 Hz, mood rates unchanged.
2. Side-by-side Beautiful classes at idle / cruise / high speed: monotonic slower Hz as size grows.
3. Heavy / frigate / freighter never reach 2.3 Hz.
4. Inside one class, faster travel still raises Hz toward that class’s cruise cap.
5. `makeLivingHull` still sculpts the player living mesh. NPCs still GLB + GPU.
6. `reducedMotion`: NPC swim amp 0; player living CPU still lives (live split).
7. No cadence persist key. No `SHIP_CLASSES` new field. No new Digit. Hub 80 px.
8. `innerHTML` still 0 on ship/hud/station paths this serial touches (ideally none of station).
9. Unknown `classKey` → light cadence.
10. BIO-07 bodies unchanged.

---

## 10. Fail-closed

| Miss | Result |
|---|---|
| Unknown classKey | light 1.00 / 1.00 |
| Non-finite speed | 0 (idle) |
| Missing swim uniforms | no GPU write |
| Missing `SHIP_CLASSES` cruise | 120 |
| reducedMotion NPC | amp 0, sweep 0, mixer frozen |
| Not beautiful | no swim uniforms |
