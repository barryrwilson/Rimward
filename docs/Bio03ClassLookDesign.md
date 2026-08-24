# RIMWARD BIO-03 Beautiful Ones per-class look and bake

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-03 Beautiful Ones per-class look and bake |
| **Author** | Wave 81 BIO-03 look integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 76 motion slice landed. Wave 95 shipped look + bake (keep GLB + GPU). This wave freezes look + bake law. |
| **Wave** | 81 — design. Wave 95 — serial steps 3–4 (per-class look + bake/wire). |
| **Owner request** | BIO-03 Beautiful Ones NPC fleet must read as organic/alien around the player living-ship benchmark, with class identity by shape and size and marine *vibes* as inspiration not copies. Wave 81 does not bake GLBs. |
| **Merge law** | [`out/w81/bio03/shared-contract.md`](../out/w81/bio03/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Sibling** | [`docs/Bio03FleetDesign.md`](Bio03FleetDesign.md) (Wave 75; Wave 76 shipped motion). [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) (Wave 70; Wave 72 shipped grafts). **Do not edit** those files. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w81/bio03/current-bio03-look-inventory.md`](../out/w81/bio03/current-bio03-look-inventory.md) |
| Merge law | [`out/w81/bio03/shared-contract.md`](../out/w81/bio03/shared-contract.md) |
| Security review | [`out/w81/bio03/security-review.md`](../out/w81/bio03/security-review.md) |
| Design-doc review | [`out/w81/bio03/code-review.md`](../out/w81/bio03/code-review.md) |

---

## Overview

Every origin already flies one living `light` hull: `makeLivingHull` with swim, breath, heartbeat, vein skin, and a thrust bioluminescent surge. That player rig is the quality benchmark. Beautiful Ones **NPC** ships use Wave 8 GLBs plus Wave 76 per-instance GPU swim (`uSwimHz` / `uSwimAmp` from NPC speed). Yards already sell living `light` / `cutter` / `heavy` at Beautiful docks. Wave 72 shipped `grafted` Abominations on **built** hulls. Gift, pirate seed, class evolution, and psionics stay later.

Wishlist BIO-03: the NPC fleet is more organic than plated factions but does not capture the player living-ship magic. Rebuild NPC **visual** language around that benchmark: organic alien skins, class identity by shape and size, marine *vibes* as inspiration not copies. Motion already answers speed (Wave 76). Serial steps 3–4 (per-class look + bake/wire) remain.

Wave 81 lands this markdown only. A later wave implements look vs plates in disjoint class files, then bakes through the live GLB pipeline. It does not replace player CPU swim, does not switch traffic to procedural Three.js, does not clone `makeLivingHull` onto NPCs, and does not open HUD-02, SHP-03, BIO-04, BIO-05 overlay, or living-frigate **buy**.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “BIO-03 look and bake today”: [`out/w81/bio03/current-bio03-look-inventory.md`](../out/w81/bio03/current-bio03-look-inventory.md). Code wins over stale comments. Wave 75 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Player mesh | Living manta/whale. `makeLivingHull`. Four CPU motion fields + thrust surge. Remount rebuilds them | `ship.js` 258–307, 354–428, 503–528, 888–962 |
| Player identity | `createShipState('light')`, faction `independent`. Unset/`living` → living mesh | `ship.js` 590–591; `state.js` 146 |
| `isBeautiful` | `faction === 'beautiful'`. Not a player-hull flag | `organic.js` 67–69 |
| NPC Beautiful | GLB + GPU swim. Idle clip. Not `makeLivingHull` | `ship-assets.js` `buildShipAsset` / `updateShipAsset` |
| Wave 76 uniforms | Per-instance `uSwimHz` / `uSwimAmp`. Idle 0.5 → cruise 2.3 from speed / 120. `reducedMotion` amp 0. Omit speed = idle | `ship-assets.js` 43–57, 457–470; `npc.js` 2181 |
| PILOTS / classes | `SHIP_CLASSES` six keys. Beautiful `PILOT_CLASSES` same six. Bake driver `PILOTS['beautiful']` | `state.js` 35–42; `beautiful/__init__.py` 73; `build-ship-assets.py` 429–442 |
| Yards | Beautiful `LIVING_STOCK` light/cutter/heavy. No living frigate/ace/freighter **buy**. NPC GLB **has** frigate | `shipyard.js` 16–40; `public/assets/ships/beautiful/frigate/` |
| Wave 72 grafts | `grafted: true` on built only. HUD `mech`. No living remount | `hangar.js` 81–107, 730–752; `hud.js` 66–75 |
| Unknowables living | Player force `makeLivingHull`. NPC field GLB. No live dock (Wave 42) | `ship.js` 503–528; `station.js` 508–527 |
| Bake/measure | Still live: Blender bake → compress → `measure-ships.mjs` → validate | `scripts/measure-ships.mjs` 1–16; `ShipAssetPipeline.md` Wave 8 |
| References | `docs/SpaceShipIdeas/reference-images/beautiful-ones/`; `docs/FactionExamples/06-beautiful-ones-ship.png` | plates README; pipeline 388–390 |
| Glow | `userData.glow` is a Group with a mesh | `ship-assets.js` 404–416 |
| Player stills | `out/hud-research/live-combat.png`; Models Browser `ship:player` | no dedicated BIO-03 stills pack |

### Pain points

- Wishlist BIO-03: NPC Beautiful magic is weaker than the player living hull **as a creature**. Wave 76 fixed speed-responsive swim; glance identity vs the player bar is still the hole.
- Six Wave 8 GLBs exist but must not be treated as “already done” against the player bar.
- Shared `surface.py` / `anatomy.py` / `organs.py` can race if parallel class authors edit them.
- A later worker could “fix consistency” by putting GPU swim on the player, CPU swim on every NPC, or procedural Three.js ships like Bloom.
- A failed class rebuild could ship a zoo (literal Earth animals) or a clone of the player manta.

### Why now (design) / why not now (code)

The owner asked for a BIO-03 **look + bake** integrator after Wave 75 named steps 3–4 and Wave 76 shipped motion. Inventory and merge law exist. Implementation waits so art and bake land against a frozen preserve rule instead of a drive-by `makeLivingHull` on traffic or an unsolicited procedural ship path.

---

## Goals & Non-Goals

### Goals

1. Document the live split: player CPU `makeLivingHull` vs NPC GLB `buildShipAsset` / `updateShipAsset`, with Wave 76 uniforms.
2. Freeze the preserve rule (player benchmark; no GPU-for-consistency; no `isBeautiful` living test; no CPU clone on traffic).
3. Freeze BIO-03 look scope = Beautiful **NPC** class identity by shape and size. Not player remount, not grafts overlay, not psionics, not seeds, not class evolution, not living-frigate **buy**.
4. Freeze class set = live `SHIP_CLASSES` keys only.
5. Freeze living frigate as an **NPC visual** while yard omit stays (ace/freighter buy omit too).
6. Freeze per-class look = disjoint class files vs plates. Shared modules serial. Not Earth animals. Not player-manta clones.
7. Freeze bake/wire = live Blender + measure + validate. Fail closed keep Wave 8 GLB.
8. Freeze HUD-02 and SHP-03 closed. Grafts stay `built` + `grafted`.
9. Freeze asset-path security and `userData.glow` as a real mesh.
10. Freeze a later serial PR plan. This wave writes the brief only. Chrome vite+swiftshader verify and `npm run test:boot` are later-impl.

### Non-goals (locked — do not reopen)

- No `src/`, meshes, GLBs, shaders, `public/`, `scripts/`, or `package.json` in Wave 81. No bake runs.
- No player living rewrite.
- No Abomination tissue overlay.
- No BIO-04 psionics.
- No BIO-01 gift / pirate seed.
- No BIO-02 career class keys.
- No living frigate (or ace / freighter) yard SKU.
- No HUD write of `hullKind`. No new HUD family. No graft list price.
- No lock box / power ledger.
- No new persist key. No new frozen event. No `innerHTML`.
- No `state.js` feature rewrite.
- No `DETAIL_STATIONS` / `GATE_BUILDERS` lockstep edit. Beautiful already has Bloom. Unknowables stay no-station.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Bio03FleetDesign.md`, or `docs/BioLivingShipsDesign.md`.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Player CPU vs NPC GPU “consistency”? | Keep both. Do not swap | Preserve; perf; contract §1, §4 |
| `isBeautiful(player.faction)` living test? | **No.** Starter is `independent` | `organic.js` 67–69; `ship.js` 590–591; `state.js` 146 |
| NPC path default? | **Keep live GLB + GPU** | Inventory §2; owner Q1 fail-closed |
| Clone `makeLivingHull` onto NPCs? | **No.** Fail closed keep GPU | Contract §0.2, §4 |
| Procedural Three.js ships like Bloom? | **No** unless owner overrides | Contract §14 |
| Class keys? | Live six only | `state.js` 35–42 |
| Per-class look writes? | Disjoint class `.py` vs plates. Shared modules serial | Contract §0.6 |
| Living frigate? | NPC visual **yes**; yard SKU **no** | `LIVING_STOCK`; inventory §4 |
| HUD `hullKind`? | HUD never writes. Grafted stays `mech` | HUD-02 |
| Guns on living hulls? | Conventional stay. No lock box. No power ledger | SHP-03 |
| New GLBs this wave? | **No.** Wave 8 files are inventory | Contract §0.1 |
| Bake this wave? | **No.** Later step 4 | Contract §11 |
| If a class misses the bar? | Keep Wave 8 GLB | Contract §0.9 |
| Persist / events? | None. `state.js` READ-ONLY | Contract §9 |
| Path join? | After `canonicalFaction` / `canonicalClass` only | Contract §6–§7 |
| Remote GLB / `eval`? | Forbidden | Contract §7 |
| `userData.glow`? | Real mesh (Wave 42) | `ship-assets.js` 404–416 |
| Visual verify? | Later Chrome vite + swiftshader | Contract §0.17 |

### 2. Player outcome (later serial)

A Beautiful NPC **light**, **cutter**, **heavy**, **ace**, **freighter**, and **frigate** are readable as different creatures at a glance. They still load as GLB + GPU. They are never clones of the player manta CPU hull. Marine life remains a vibe, not a zoo. The player’s own hull must still be the unique CPU manta with breath, heartbeat, veins, and thrust surge.

### 3. Preserve: living player ship

The shipped player living hull **is** the product.

`makeLivingHull` sculpts a manta/whale sphere. Each frame the living rig mutates vertices: swim along the spine (idle 0.5 Hz → cruise 2.3 Hz), wing flap, ~4 s breath, 1.1 Hz heartbeat, amoeba shimmer, mood-tinted veins. Thrust is a bioluminescent surge, not a nozzle. `GROWTH_SCALE_MAX` 0.15 scales `flesh` from `ctx.bio.growth`.

Later BIO-03 look work must **not**:

- Replace player `makeLivingHull` CPU swim with NPC GPU swim “for consistency.”
- Treat `isBeautiful(player.faction)` as the living-player test.
- Weaken breath / heartbeat / vein / thrust surge.
- Make marine inspiration literal Earth animals.
- Copy the player vertex sculpt onto NPC GLBs so traffic is a fleet of the same manta.

Player CPU `makeLivingHull` stays unique to the **player living rig** for performance and the preserve rule. NPC Beautiful stay a different path (today: GLB + GPU swim in `ship-assets.js` / `organic.js`).

Point at [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §2 / Wave 70 contract §1 for obtain, growth, and grafts. This brief does not re-litigate them. Point at [`docs/Bio03FleetDesign.md`](Bio03FleetDesign.md) for fleet motion law. This brief does not reopen Wave 76.

### 4. NPC path (keep GLB)

Live: `npc.js` `buildShipMesh` → primed GLB. Beautiful materials get per-instance `onBeforeCompile` swim. Idle clip plays on a mixer. `userData.glow` is a Group with a mesh.

Stations/gates for Beautiful are procedural (`buildBeautifulStation`). That does **not** prove ships should leave GLB. Default: keep bake + `public/assets/ships/beautiful/`.

`FACTION_VC_PARTS` is deleted (Wave 47 → `DETAIL_SHIPS`, not GLB). Live NPC path is `buildShipAsset`. Do not revive vertex-color boxes for Beautiful. Do not ship the generic `BUILDERS['beautiful']` sphere stub as a class look.

### 5. Class identity (look serial)

Use live keys only. Parallel class authors in a later wave may edit **disjoint** files:

- `scripts/ship_builders/beautiful/light.py`
- `ace.py` `cutter.py` `heavy.py` `frigate.py` `freighter.py`

Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay serial (one writer). Runtime `src/` is not scheduled in Wave 81. `probe-beautiful-parts.py` exists to blame shared constructs **before** class files.

Bible §4.6 names: young wayfinder, swift-bonded hunter, guardian, shieldback, elder guardian, gardenback. Plates in `docs/SpaceShipIdeas/reference-images/beautiful-ones/` guide silhouette. `docs/FactionExamples/06-beautiful-ones-ship.png` is concept art, not a photocopy target.

Glance law (must hold after bake):

| Key | Must read as | Must not read as |
|---|---|---|
| `light` | Compact curious wayfinder; crown-forward; closest **family** to the player | A photocopy of `makeLivingHull`; a dolphin toy |
| `ace` | Taut dart; swept fins; traveling-wave nerves | A second light with paint |
| `cutter` | Social guardian; ventral cradle that holds | A mouth with teeth |
| `heavy` | Dense shieldback; overlapping mantles; raised fins | Fitted armour plates |
| `frigate` | Long elder with coordinated fins and four hollows | A heavy scaled up; a hangar barge |
| `freighter` | Colossal gardenback; separated biomes | A coral reef zoo; a cargo box in nacre |

**Frigate:** NPC elder-guardian visual may exist (and already does as a GLB) while Beautiful yard buy omits `frigate`. Do not append `frigate` / `ace` / `freighter` to `LIVING_STOCK`.

Fail closed: if a class cannot beat the player bar, keep the Wave 8 GLB for **that class**. Do not hold the other five hostage. Do not replace a miss with procedural spheres.

### 6. Motion (Wave 76 — keep)

Goal already landed: NPC swim answers speed the way the player hull does, without the player CPU cost.

Wave 76 landed:

- Per-instance GPU uniforms (`userData.swimUniforms`) for amp / Hz from NPC speed.
- Idle clip stays as slow breath.
- `reducedMotion` → amp 0.
- Callers that omit speed (Models Browser, plated remount) stay at idle Hz (0.5).
- Shader Hz is `uSwimHz` (idle 0.5 → cruise 2.3, clamp speed / 120). Not a persist field.

Forbidden (still):

- Per-NPC `makeLivingHull` vertex loops.
- Disabling player swim under `reducedMotion` to match NPC (player vertex swim still runs today).
- Persisting phase.
- Replacing player thrust surge with a plated nozzle so NPC and player “match.”

Look/bake must keep this path attached to whatever GLB ships. Fail closed if a later PR cannot keep GPU cheap: keep this per-instance Hz path; do not clone `makeLivingHull`.

### 7. Bake / wire (later serial)

Live pipeline still owns Beautiful NPC GLBs (`docs/ShipAssetPipeline.md` Wave 8; inventory §7).

Later step 4, in order:

1. Author disjoint class files vs plates (step 3). Shared-module edits serial, probed.
2. Blender background: `scripts/build-ship-assets.py` for faction `beautiful` only. Writes `assets-source/ships/beautiful/<class>.blend` and `public/assets/ships/beautiful/<class>/lod*.glb`.
3. `scripts/compress-ship-assets.mjs` with prefix `beautiful` (or `beautiful/<class>`).
4. If skins change: `scripts/encode-ship-textures.mjs` for `materials/beautiful/{trader,pirate}`.
5. `npm run ships:measure` (stdout). Ladder: light ≤ ace < cutter < heavy < frigate < freighter.
6. `npm run ships:validate`. Self-contained GLB. No external `uri`.
7. Runtime wire stays `ship-assets.js`. Join only after `canonicalFaction` / `canonicalClass`. Keep `RIMWARD_ENGINE_GLOW` → `userData.glow` mesh. Keep Wave 76 swim inject.

Do not add a bake npm script in this serial unless a tooling owner says so. Wave 81 writes no `package.json`. Do not rebuild plated factions “while Blender is open.”

If measure or validate fails for a class: **keep that class’s Wave 8 GLB**. Do not leave a hole that falls through to `BUILDERS['beautiful']` stubs. Do not drop a key from `PILOT_CLASSES` to force that stub.

### 8. HUD-02 / SHP-03 / BIO-05 / yards

- HUD never writes `hullKind`. Grafted built hulls stay `mech`.
- Conventional guns stay. No lock box. No power ledger.
- Grafts stay `built` + `grafted: true`. Tissue overlay is **not** BIO-03. Graft list price stays closed.
- `LIVING_STOCK` stays light/cutter/heavy. Player remount of a bought living row still uses `makeLivingHull`, not the NPC GLB.

### 9. Persist and events

No BIO-03 persist. No new `localStorage` key. No new frozen event. `state.js` READ-ONLY. Prototype-safe. World strings stay `textContent`. Swim phase / Hz / amp must not persist.

### 10. Serial PR plan

Matches contract §11. Wave 76 landed steps 1–2. Steps 3–5 stay later.

| Step | Lands | Does not land | Wave |
|---|---|---|---|
| **1 Inventory pins** | Preserve + path split + class keys + frigate-visual vs SKU | Meshes | 76 |
| **2 Motion law** | Cheap GPU speed response (per-instance Hz) | Player clone | 76 |
| **3 Per-class look** | Disjoint class files vs plates | Shared-module races; career keys | later |
| **4 Bake / wire** | Live bake/measure/validate if still the pipeline | Unsolicited procedural ships | later |
| **5 Boot / visual verify** | Player still CPU; NPC classes; glow mesh; no remote URL. Real Chrome (vite + swiftshader). `npm run test:boot` | Wishlist / `PROGRESS.md` | later |

Known boot-test FAILs stay: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul. Do not “fix” them in a look serial.

### 11. Security (later impl)

- Join asset paths only after `canonicalFaction` / `canonicalClass`.
- No remote GLB URLs.
- No `eval` of model names.
- Keep self-contained GLB check.
- `userData.glow` remains a real mesh (Wave 42).
- Do not `Object.assign` untrusted blobs onto `userData`.

### 12. Ownership

| Object | Writer | Reader |
|---|---|---|
| Player living mesh | `ship.js` remount | cameras, combat, HUD |
| Beautiful NPC GLB / GPU | `ship-assets.js` + bake (later) | `npc.js` |
| `player.hullKind` | hangar / yard / save / Unknowables force | HUD |
| Hangar `grafted` | Wave 72 desk | hostility; overlay later |
| `state.js` | serial data owner only | BIO-03 read-only |
| `DETAIL_STATIONS` / `GATE_BUILDERS` | station / gate sculpt owners | not BIO-03 |
| Shared beautiful modules | one serial writer | class files |
| Class `.py` files | assigned class author | bake driver |

`src/core/ctx.js` ownership comments are binding (`ctx.js` 13–36). HUD still must not write `hullKind`.

---

## Acceptance direction (implementation wave)

From the wishlist, made testable:

1. Boot: player living hull still swims, breathes, beats, veins, thrust surge at idle. CPU path.
2. `isBeautiful(ctx.player.faction)` false on independent starter; hull still living.
3. Beautiful NPC light/ace/cutter/heavy/frigate/freighter still load from the GLB path (or an owner-approved replacement that is **not** `makeLivingHull`).
4. NPC swim does not allocate a player-sized CPU vertex loop per ship. Wave 76 Hz from speed still works. `reducedMotion` still freezes amp.
5. At a glance (Models Browser + in-system), the six classes read as different creatures by shape and size. Not literal Earth animals. Not clones of the player manta.
6. Beautiful yard still omits frigate/ace/freighter **buy**. NPC frigate visual may still exist.
7. HUD never assigns `player.hullKind`. Grafted built still `mech`.
8. Conventional Digit 1/2 still fire on a living player hull.
9. No remote GLB. No `eval`. `userData.glow` is a mesh. Paths join only after canonical faction/class.
10. Unknowables player remount still `makeLivingHull`. Unknowables still have no station from this work.
11. If a class misses the bar, that class’s Wave 8 GLB remains on disk and in the runtime path.

Later visual verify: real Chrome, vite + swiftshader. `npm run test:boot` later; WAVE4 / WAVE26 / WAVE35 FAILs stay.

---

## Open owner questions

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Keep NPC Beautiful on the live **GLB bake path**. Do not switch ships to procedural Three.js. Bake remains a later serial.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Weaken player living animation | Contract §1; remount rebuilds `makeLivingHull`; BIO-03 must not replace it |
| GPU-for-consistency on the player | Forbidden. Pin 1–2 |
| Literal marine copies / zoo | Art law; fail closed keep Wave 8 rather than a zoo |
| Clone CPU swim onto NPCs | Motion fail-closed GPU |
| Clone player manta onto every class | Glance table §5; light may rhyme, must differ in head/fin anatomy |
| Shared-module race | Disjoint class files; shared modules serial; probe first |
| Living frigate SKU sneak | `LIVING_STOCK` omit; NPC visual allowed |
| `hullKind` smuggle | HUD never writes; grafts stay built |
| Path injection / remote GLB | Canonical allowlist; same origin |
| Glow not a mesh | Wave 42; `buildShipAsset` Group+mesh |
| Bake ships a broken class | Keep Wave 8 GLB for that class |
| Procedural ships by accident | Owner Q1 default keep GLB |
