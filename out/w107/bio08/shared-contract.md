# BIO-08 anatomy-native locomotion shared contract

**Wave:** 107. Design only. No gait feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio08LocomotionDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Bio01*.md`, `docs/Bio02*.md`, `docs/Bio03*.md`, `docs/Bio04*.md`, `docs/Bio05*.md`, `docs/Bio06*.md`, `docs/Bio07*.md`, `docs/BioLivingShipsDesign.md`, `docs/Rep05*.md`, `docs/Msn*.md`, `docs/Hud*.md`, `docs/Shp*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, or `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave107.md`.  
**Locked sources:** wishlist BIO-07 locomotion line (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1381–1398: animation native to anatomy; follow BIO-06 cadence); live inventory `out/w107/bio08/current-bio08-inventory.md` (code wins); BIO-06 merge law `out/w104/bio06/shared-contract.md` (READ; honor Hz/sweep; **do not retune**); BIO-07 / Wave 106 body plans `out/w106/foundation/notes.md` + live class builders (READ; do not edit); player CPU `makeLivingHull` quality bar; Wave 76 NPC GPU one spine+flap shader; Wave 97 BIO-05 graft closed.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale “global 0.7 Hz” comments.

**BIO-06** (class Hz / sweep table) is a **sibling leftover**. Not this brief. Honor `LIVING_CADENCE`. Do **not** retune `hzScale` / `sweepScale`. Light idle **0.5** / cruise **2.3** / mood stay the player bar.

**BIO-07** (species bodies / GLB) is a **sibling leftover**. Not this brief. Do **not** rebake meshes here. Gait must **read** Wave 106 body plans.

Sibling Wave 107 workers own `src/systems/ship.js`, `src/systems/ship-assets.js`, `src/game/living-cadence.js`, `scripts/boot-test.mjs`, `src/systems/station.js`. Do **not** edit those paths from this worker.

Live GPU swim is **one** spine+flap shader for every Beautiful class (`ship-assets.js` `injectSwim`). BIO-06 sibling landed `uSwimSweep` and `living-cadence.js`. Later serial **keeps one shader**. Gait is **axis mix + bake bias**, not a second program, not `mixer.timeScale`. Do **not** retune landed hzScale/sweepScale.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`, no bake, no GLB, no blender. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No locomotion meter, gait pip, or species disc on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `hud.css` 184–193). **Do not** put swim chrome inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` 185, 6026–6030). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers. First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Cadence/locomotion is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. This serial has **no new DOM**.
5. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 81–89).
6. `src/game/state.js` is READ-ONLY later. **No** `SHIP_CLASSES` gait fields. **No** new class keys. Live keys stay `light` `ace` `cutter` `heavy` `frigate` `freighter` (`state.js` 37–44; `ship-assets.js` 20). Do **not** invent UU. Do **not** invent standing deltas.
7. Persist: **no** new `WORLD_FIELDS` key. **No** persist key. **No** new `localStorage` gait key. Autosave stays `rimward-save-v1` (`save.js` 16, 76–101). Gait is a live visual constant. Recompute each frame from `classKey`.
8. Prototype-safe later helpers: `Object.hasOwn` (or `Object.prototype.hasOwnProperty.call`) on `classKey`. Unknown / reserved / non-string → **light**. Never userString index as existence. Never `for-in` merge from a save blob. Copy `classKeyOf` (`hangar.js` 40–41). Gait-id lookup uses the same hasOwn on the freeze.
9. Do **not** replace `makeLivingHull`. Do **not** clone it onto NPCs. NPC stay GLB + GPU. Fail closed: keep GPU swim for Beautiful NPC (`ship-assets.js` `injectSwim` / `updateShipAsset`). Never fall through to a generic stub mesh.
10. Do **not** retune BIO-06 `LIVING_CADENCE` hzScale/sweepScale (contract `out/w104/bio06/shared-contract.md`). Light idle **0.5** / cruise **2.3** / mood stay the player bar. Breath **0.25 Hz**, heartbeat **1.1 Hz**, vein surge, idle hover, `GROWTH_SCALE_MAX` stay.
11. Forbidden: `mixer.timeScale` by class; one universal anim multiplier; slowing the idle GLB clip to fake gait. Cadence, sweep, gait axis mix, and speed-norm are **separate** knobs (§1).
12. Do **not** reopen BIO-05 graft/overlay/badge/ungraft (Wave 97 closed). BIO-02 kit mutate omit. Career labels already Wave 102. Grafted built stays plated.
13. Do not edit sibling Bio01–07 briefs, Rep05, wishlist, `PROGRESS.md`, `OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave107.md`. Deputize defaults live in **this** contract.
14. Do not “fix” known boot FAILs. Do not “fix” player CPU swim still running under `reducedMotion` (live; inventory §6). NPC GPU `uSwimAmp = 0` under reducedMotion stays.
15. Sibling Wave 107 workers own `src/systems/ship.js`, `src/systems/ship-assets.js`, `src/game/living-cadence.js`, `scripts/boot-test.mjs`, `src/systems/station.js`. **Do not edit those paths.**
16. Unknowables NPC field GLB: **still no** Beautiful swim uniforms (`ship-assets.js` 432). Unknowables **player** remount stays `makeLivingHull` (`ship.js` 551–565). Gait table still applies by **classKey**, not by faction, on the player living CPU (non-light remounts only — §0.1).
17. Yard living preview stays `update: null` (`yard-preview.js` 89, 115). Do **not** sneak a second swim into the Digit 0 desk.

---

## 0.1 Wave 107 deputize (owner may override after playtest)

Pick playable gait defaults. **No live gait table exists** (inventory §9). Do not park. Do not invent UU / SKU / Digit. Do not invent class keys.

### Live motion (do not retune the constants)

| Knob | Live | Cite |
|---|---|---|
| Idle Hz | **0.5** | `living-cadence.js` 8 |
| Cruise Hz | **2.3** | `living-cadence.js` 9 |
| `LIVING_CADENCE` | Wave 104 numbers, **live** | `living-cadence.js` 12–26 |
| Player speed-norm | `min(speed / shipCfg.maxSpeed, 1.5)`; light Hz uses `min(speedNorm, 1)` | `ship.js` 955–976 |
| NPC speed-norm today | `min(speed / classCruise, 1)` | `ship-assets.js` 502–504 |
| Player spine | X: `bodyAmp * zn² * sin(6.9 zn − phase)` | `ship.js` 1000 |
| Player flap | Y: `flapAmp * wingness * sin(phase − 1.4\|bx\|)` | `ship.js` 1002–1003 |
| Player Z kick | **none** | `ship.js` 997 |
| GPU shader | X spine + Y flap × `uSwimSweep`; one program | `ship-assets.js` 66–95 |
| GPU uniforms today | `uSwimTime` / `uSwimAmp` / `uSwimHz` / `uSwimSweep` | `ship-assets.js` 57–63 |
| `userData.classKey` | stashed at build | `ship-assets.js` 455 |
| Mood rate (player only) | serene 1.0 / keen 1.25 / anxious 1.0 / pained 0.6 / feral 1.5 | `ship.js` 157–162 |
| Breath / heart | 0.25 Hz / 1.1 Hz unscaled | `ship.js` 151–152, 980–984 |

### Gait ids (not class keys, not UU, not Digit)

Four authored ids. Later `gaitFor(classKey)` returns one of these **or** the fail-closed live mix.

| `gaitId` | Native read | Must not read as |
|---|---|---|
| `shark-caudal` | Heterocercal tail kick + pectoral Y flap | Manta diamond wings; whale horizontal fluke |
| `squid-mantle` | Radial / Z mantle pulse + arm trail toward +Z | Manta wings; octopus sunburst |
| `whale-fluke` | Horizontal fluke: Y less, X/Z more; slow whole-body (Hz from BIO-06) | Shark vertical tail; frantic light flap |
| `octopus-trail` | Travel pose: mantle toward −Z, arms trail +Z | Radial XY sunburst; squid rhomboid fins |

### Class → gait (Wave 106 body plans)

| `classKey` | `gaitId` | Why |
|---|---|---|
| `light` | `shark-caudal` | Young reef shark (`light.py` 1–18). **Player CPU may ignore** (§0.1 player). |
| `cutter` | `shark-caudal` | Hammerhead shark, **not** a scaled light (`cutter.py` 7). Same family, different mesh. |
| `ace` | `squid-mantle` | Hunting squid (`ace.py` 1–15). |
| `heavy` | `whale-fluke` | Humpback (`heavy.py` 7–18). |
| `freighter` | `whale-fluke` | Blue-whale gardenback (`freighter.py` 9–15). Same plan, BIO-06 slower Hz. |
| `frigate` | `octopus-trail` | Travel-pose octopus (`frigate.py` 1–25; `__init__.py` 19–22). |

Unknown `classKey` → **light** (class mapping), then player-CPU light honor still applies.

Missing / unknown `gaitId` → **live spine+flap mix** (`spineX=1`, `flapY=1`, `kickZ=0`, `radial=0`). Never a stub mesh. BIO-06 scales **still apply** on that mix.

### Axis mix (later uniforms; authored floats)

Home: **PR1** a THREE-free module **`src/game/living-gait.js`** (preferred). **Not** `state.js`. **Not** `SHIP_CLASSES`. Duplicate tables forbidden.

Weights multiply the **already authored** spine/flap terms and add Z kick + radial pulse. Default live mix is identity on X/Y, zero on Z/radial.

| `gaitId` | `spineX` | `flapY` | `kickZ` | `radial` |
|---|---|---|---|---|
| live fail-closed | **1.00** | **1.00** | **0.00** | **0.00** |
| `shark-caudal` | 0.55 | **1.00** | **0.70** | 0.00 |
| `squid-mantle` | 0.15 | 0.12 | 0.50 | **1.00** |
| `whale-fluke` | **0.90** | **0.28** | **0.85** | 0.08 |
| `octopus-trail` | 0.22 | 0.18 | **1.00** | 0.28 |

Owner freeze (do not invert):

- light, cutter: shark caudal / pectoral — **Y flap + Z tail kick bias**
- ace: squid mantle pulse (**radial/Z**) + arm trail, **not manta wings**
- heavy, freighter: whale horizontal fluke (**Y less, X/Z more**) + slow whole-body (slow = BIO-06 Hz, not a second dt scale)
- frigate: octopus travel pose — arm trail, mantle toward **−Z**; **not** radial sunburst (`radial` stays **below** squid)

**Formulas (later impl; cadence from BIO-06, not rewritten here):**

```
cadence = cadenceFor(classKey)                 // BIO-06; miss → light 1.00/1.00
gait    = gaitFor(classKey)                    // hasOwn class map → gaitId; miss gait → live mix
hz      = BIO-06 hz envelope                   // do not retune 0.5/2.3
playerHz = hz * mood.rate                      // mood unscaled
npc uSwimHz = hz
npc uSwimAmp = reducedMotion ? 0 : 1
npc uSwimSweep = reducedMotion ? 0 : sweepScale   // BIO-06 live; do not retune; do not overload as gait
npc uSwimSpineX / uSwimFlapY / uSwimKickZ / uSwimRadial = gait weights
  (reducedMotion: amp 0 already zeros displacement; do not also invent a second gate)
```

Do **not** overload `uSwimAmp` as gait. Do **not** overload `uSwimSweep` as gait. Do **not** interpolate `gaitId` or `classKey` into shader **source**. Authored GLSL stays authored. New knobs are **floats**. `customProgramCacheKey` stays one constant (live `rimward-beautiful-swim-hz-sweep`, `ship-assets.js` 55). **One program.**

### Player living

| Rig | Gait |
|---|---|
| Living `classKey === 'light'` (default origin) | **Live CPU sculpt motion stays.** Do not rewrite the vertex loop to shark weights if that changes the quality bar. NPC **light** GPU **may** use `shark-caudal`. |
| Living remount `ace` / `cutter` / `heavy` / `frigate` / `freighter` | Apply gait **bias** on the same CPU loop. **Must not lose** breath / heart / veins / thrust surge / mood. |
| Built plated | **No** CPU swim. `animateShipMesh` only. |
| Unknowables player | Living CPU. Scale gait by class, not faction. Light still honors the live sculpt. |

Do **not** replace `makeLivingHull`. Rest scale / silhouette stay (`ship.js` 257–268). PR2 only multiplies / adds displacement **after** live breath/heart radial.

### NPC GPU

| Mesh | Gait |
|---|---|
| `faction === 'beautiful'` + swim uniforms | **Yes.** Same shader. Axis mix from `gaitFor(classKey)`. BIO-06 Hz/sweep still apply. |
| Other factions | **No** swim uniforms (`buildShipAsset` 432) |
| Unknowables NPC | Idle clip only. **No** Beautiful swim uniforms |
| Beautiful `idle` mixer | **Untouched** timeScale 1. `setTime(elapsed)` unless reducedMotion (`updateShipAsset` 494) |

`object.userData.classKey` is **already** stashed at `buildShipAsset` **455** (BIO-06; allowlisted `canonicalClass`). Missing → light. Optional `userData.gaitId` is a derived cache only; recompute is allowed; **do not persist**. Do not remove the classKey stash.

### aSwim bake

Keep the live bbox bake as fail-closed (`ship-assets.js` 278–310). Later PR3 **may** bias `wingness` by gait **inside the same attribute** (e.g. trail mass from +Z for squid/octopus) without a second shader and without cloning `makeLivingHull`. If bake bias is unsafe, **skip it** and rely on axis mix. Never ship a stub mesh.

### Yard / catalog

| Surface | This serial |
|---|---|
| Living yard preview | Live `update: null` (`yard-preview.js` 93–116). **Do not** add a CPU vertex loop. |
| Plated yard preview | `animateShipMesh` without speed → idle. After GPU gait, idle mix × class at 0.5 Hz × BIO-06. |
| Models Browser living | Keep `makeLivingHull()` no-arg **light** yardstick. |

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| One `animSpeed` / `mixer.timeScale` | **Forbidden** §0.11 |
| Per-class shader string / compile-key from user text | **Forbidden** §5 |
| Put gait on `SHIP_CLASSES` in `state.js` | **Forbidden** §0.6 |
| Persist `world.gait` / `localStorage` gait | **Forbidden** §0.7 |
| SKU / Digit / UU to unlock a gait | **Forbidden** |
| Clone `makeLivingHull` onto NPC | **Forbidden** §0.9 |
| Rewrite player **light** CPU to match NPC shark | **Forbidden** unless owner later overrides; default = keep live sculpt |
| Retune BIO-06 hzScale / sweepScale | **Forbidden** §0.10 |
| Scale breath / heartbeat / mood table as gait | **No.** Those stay player identity |
| Scale Beautiful `idle` GLB clip by class | **No.** Swim uniforms only |
| Radial sunburst on frigate | **Forbidden** (travel-pose law) |
| Ace manta wings | **Forbidden** |
| Generic `BUILDERS['beautiful']` stub on miss | **Forbidden** |
| Reopen BIO-05 / BIO-02 / BIO-07 bake | **Forbidden** |
| Second swim on Digit 0 desk | **Forbidden** §0.17 |

Owner may retune the four×four floats after playtest. Do not park the serial on that retune.

---

## 1. Who / what scales

Gait **does not** change Hz. BIO-06 does. Gait changes **which axes move**.

Live GPU: X spine + Y flap for all six. After this leftover: same Hz envelope × class cadence; **different mix**.

---

## 2. Speed responsiveness (inside each class)

Keep the live player shape and BIO-06 class-cruise law:

- Hz lerps idle → cruise as speed goes 0 → **that class’s cruise**.
- Hz **caps at cruise**. Afterburner does **not** raise Hz.
- A large ship at **its** high speed stays **visibly slower** than a small ship (BIO-06 table). Gait does not invert that.

Read cruise from `SHIP_CLASSES` (import). Do not copy six cruise integers into the gait module except as a comment. **Do not edit** `state.js`.

---

## 3. Picture — surfaces stay distinct

| Job | Owner | BIO-08 |
|---|---|---|
| Player light swim / breath / heart | `ship.js` `makeLivingHull` | **Honor. Do not weaken.** |
| Player larger living remount | same CPU loop | **gait bias; keep breath/heart/veins** |
| Beautiful NPC swim | GPU uniforms | **gait axis mix; one shader; BIO-06 Hz** |
| Beautiful idle GLB clip | mixer | **Untouched** |
| Station organic sway | `organic.js` `animateOrganic` | **Untouched** |
| reducedMotion NPC swim | `uSwimAmp = 0` | **Keep** |
| reducedMotion player living | CPU swim **still runs** (live) | **Keep; do not “fix”** |
| BIO-06 cadence | `living-cadence.js` (intended) | **Honor; do not retune** |
| BIO-07 bodies | class builders / GLB | **Not this brief** |
| 80 px hub / Digit 0/8/9 | HUD-01 / station | **Untouched** |

```
classKey --hasOwn six--> gaitId
gaitId --miss--> live spine+flap
BIO-06 cadence --always--> hzScale / sweepScale (light 1.00/1.00)
player light CPU --> live sculpt (no gait rewrite)
player other living --> CPU bias × gait
Beautiful NPC --> one shader × gait floats
Unknowables NPC --> no swim uniforms
mixer idle clip --> timeScale 1
```

---

## 4. Copy / HUD / keys

**None.** No toast. No Digit. No KeyO row. No `commLine`. Gait is silent visual.

Do not steal KeyT / KeyV / KeyK / KeyX / KeyO.

---

## 5. Security / emit / persist

- No new world field. No gait string in the save blob.
- `classKey` already sanitized (`hangar.js` 40–41). Gait lookup must still `hasOwn`.
- Do not interpolate `classKey` / `gaitId` into shader **source** strings. Authored GLSL stays authored. New uniforms are floats.
- Do not `JSON.parse` user text for weights.
- `Math.random()` swim phase is live visual only (`ship-assets.js` 465). Do not replace with CSPRNG. Do not persist the phase.
- No new `ctx.emit`.
- No secrets. No `innerHTML`. No Digit theft.

---

## 6. Closed HUD / digits / SKU / graft / BIO-06 / BIO-07

- 80 px hub stays empty of new children.
- Digit 0/8/9 stay.
- No SKU. No UU. No `WEAPONS` row.
- No graft overlay. No hangar badge.
- BIO-06 numbers not redesigned here.
- BIO-07 meshes not rebaked here.

---

## 7. Performance freeze

- Player: **one** living CPU vertex loop as today (`ship.js` 986–1009). Do not add a second mesh. Do not clone that loop onto traffic.
- NPC: keep per-instance uniforms. Shared module uniforms are forbidden (comment `ship-assets.js` 44–46).
- Do not raise SphereGeometry segments. Do not disable GPU swim “to match CPU.”
- Do not add a second `onBeforeCompile` program per class.

---

## 8. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 data** | `LIVING_GAIT` class map + gait axis table + `gaitFor` (hasOwn classKey → light; unknown gaitId → live spine+flap). Preferred `src/game/living-gait.js`. **No `state.js`.** | Digit, persist, SKU, shader, BIO-06 table rewrite |
| **PR2 player CPU** | non-light living remounts: axis bias after live breath/heart; **light bit-identical**; mood/breath/heart/veins untouched | `makeLivingHull` replace; NPC clone |
| **PR3 NPC GPU** | gait floats on the **same** `injectSwim` shader; Beautiful only; consume live `cadenceFor` / `uSwimSweep` (do not retune); keep `userData.classKey` | mixer.timeScale; Unknowables GPU clone; second shader; stub mesh |
| **PR4 reducedMotion + boot pins** | NPC amp 0; light CPU 0.5→2.3; Digit 0 shipyard; no persist key; no hub child; unknown → light | wishlist rewrite; boot FAIL “fixes”; Digit 0 desk swim |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 9. Acceptance (implementation wave; freeze here)

1. Light player idle 0.5 Hz, cruise 2.3 Hz, mood / breath / heart unchanged (boot pin). Light CPU sculpt motion stays the quality bar.
2. Side-by-side Beautiful classes: shark caudal/pectoral (light, cutter); squid mantle pulse (ace); whale fluke undulate (heavy, freighter); octopus travel-pose trail (frigate). Not one manta flap.
3. Cutter is not a scaled-light motion clone in **intent** (same gait family, different mesh from BIO-07). Ace is not manta wings. Frigate is not a radial sunburst.
4. BIO-06 monotonic Hz gradient still holds (when landed). Gait does not make a freighter flap faster than a light.
5. `makeLivingHull` still sculpts the player living mesh. NPCs still GLB + GPU. One spine+flap shader (plus gait floats).
6. `reducedMotion`: NPC swim amp 0; player living CPU still lives (live split).
7. No gait persist key. No `SHIP_CLASSES` new field. No new Digit. Hub 80 px empty of new children.
8. `innerHTML` still 0 on ship/hud/station paths this serial touches.
9. Unknown `classKey` → light. Missing gait → live spine+flap. Never a generic stub mesh.
10. BIO-06 `LIVING_CADENCE` numbers unchanged. BIO-07 meshes unchanged by this leftover.

---

## 10. Fail-closed

| Miss | Result |
|---|---|
| Unknown classKey | light (then player CPU light honor) |
| Missing / unknown gaitId | live spine+flap (`1,1,0,0`) |
| Non-finite speed | 0 (idle) |
| Missing swim uniforms | no GPU write |
| Missing `SHIP_CLASSES` cruise | 120 (BIO-06 miss path) |
| reducedMotion NPC | amp 0, mixer frozen |
| Not beautiful | no swim uniforms |
| Body GLB miss | keep prior class GLB + live shader; **never** generic stub |
| BIO-06 module miss | live 0.5→2.3, sweep 1; still apply gait floats (module is live today) |
