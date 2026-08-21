# RIMWARD BIO-03 Beautiful Ones NPC fleet

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-03 Beautiful Ones NPC fleet |
| **Author** | Wave 75 BIO-03 integrator |
| **Date** | 2026-08-20 |
| **Status** | Wave 76 motion slice landed (inventory preserve + speed-responsive NPC GPU swim). Per-class look / new GLBs still later. |
| **Wave** | 75 — design. 76 — serial steps 1–2 (preserve + motion law). Later — per-class look. |
| **Owner request** | BIO-03 design brief. Rebuild Beautiful **NPC** visual and motion around the player living ship. Wave 76 does not rebuild class look or bake GLBs. |
| **Merge law** | [`out/w75/bio03/shared-contract.md`](../out/w75/bio03/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Sibling** | [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) (Wave 70; Wave 72 shipped grafts). Do not edit that file. BIO-03 was named there as a separate visual serial. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w75/bio03/current-bio03-inventory.md`](../out/w75/bio03/current-bio03-inventory.md) |
| Merge law | [`out/w75/bio03/shared-contract.md`](../out/w75/bio03/shared-contract.md) |
| Security review | [`out/w75/bio03/security-review.md`](../out/w75/bio03/security-review.md) |
| Design-doc review | [`out/w75/bio03/code-review.md`](../out/w75/bio03/code-review.md) |

---

## Overview

Every origin already flies one living `light` hull: `makeLivingHull` with swim, breath, heartbeat, vein skin, and a thrust bioluminescent surge. That player rig is the quality benchmark. Beautiful Ones **NPC** ships use Wave 8 GLBs plus a weaker GPU swim (fixed 0.7 Hz, global amplitude). Yards already sell living `light` / `cutter` / `heavy` at Beautiful docks. Wave 72 shipped `grafted` Abominations on **built** hulls. Gift, pirate seed, class evolution, and psionics stay later.

Wishlist BIO-03: the NPC fleet is more organic than plated factions but does not capture the player living-ship magic. Rebuild NPC visual and motion language around that benchmark: organic alien skins, speed-responsive swim, class identity by shape and size, marine *vibes* as inspiration not copies.

Wave 75 landed this markdown only. Wave 76 implements serial steps 1–2: keep the player CPU path and the NPC GLB path, and make Beautiful **NPC** GPU swim answer speed with per-instance uniforms. It does not replace player CPU swim, does not claim new GLBs, and does not open HUD-02, SHP-03, BIO-04, BIO-05 overlay, or living-frigate **buy**.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “BIO-03 today”: [`out/w75/bio03/current-bio03-inventory.md`](../out/w75/bio03/current-bio03-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Player mesh | Living manta/whale. `makeLivingHull`. Four CPU motion fields + thrust surge. Remount rebuilds them | `ship.js` 258–307, 354–428, 503–528, 888–962 |
| Player identity | `createShipState('light')`, faction `independent`. Unset/`living` → living mesh | `ship.js` 590–591 (call), 503–508; `state.js` 146 (`opts.faction ?? 'independent'`) |
| `isBeautiful` | `faction === 'beautiful'`. Not a player-hull flag | `organic.js` 67–69 |
| NPC Beautiful | GLB + GPU swim. Idle clip. Not `makeLivingHull`. Wave 76: per-instance `uSwimHz` / `uSwimAmp` | `ship-assets.js` `buildShipAsset` / `updateShipAsset` |
| Speed response | Player 0.5→2.3 Hz from `speedNorm`. NPC GPU: same idle/cruise Hz from speed (omit speed = idle). `reducedMotion` amp 0 | `ship.js` 888–899 vs `ship-assets.js` `updateShipAsset` |
| PILOTS / classes | `SHIP_CLASSES` six keys. Beautiful `PILOT_CLASSES` same six. Bake driver `PILOTS['beautiful']` | `state.js` 35–42; `beautiful/__init__.py` 73; `build-ship-assets.py` 429–442 |
| Yards | Beautiful `LIVING_STOCK` light/cutter/heavy. No living frigate **buy**. NPC GLB **has** frigate | `shipyard.js` 16–40; `public/assets/ships/beautiful/frigate/` |
| Wave 72 grafts | `grafted: true` on built only. HUD `mech`. No living remount | `hangar.js` 81–107, 730–752; `hud.js` 67–75 |
| Unknowables living | Player force `makeLivingHull`. NPC field GLB. No live dock (Wave 42) | `ship.js` 503–528; `station.js` 493–494 |
| `FACTION_VC_PARTS` | **Deleted** Wave 47 in favour of `DETAIL_SHIPS` (not GLB). Live NPC path is GLB `buildShipAsset`. Beautiful never used VC boxes | `PROGRESS.md` 2187, 2416; `npc.js` 166–167; `faction-style.js` 27–30 (stale comment) |
| Bake/measure | Still live: Blender bake → compress → `measure-ships.mjs` | `scripts/measure-ships.mjs` 1–16; `ShipAssetPipeline.md` Wave 8 |
| References | `docs/SpaceShipIdeas/reference-images/beautiful-ones/`; `docs/FactionExamples/06-beautiful-ones-ship.png` | plates README; pipeline 388–390 |
| Player stills | `out/hud-research/live-combat.png`; Models Browser `ship:player` | no dedicated BIO-03 stills pack |

### Pain points

- Wishlist BIO-03: NPC Beautiful magic is weaker than the player living hull.
- GPU swim does not read speed. Player swim does.
- Global `uSwimAmp` flaps every Beautiful NPC together except for a random morph phase.
- Class GLBs exist (Wave 8) but must not be treated as “already done” against the player bar.
- A later worker could “fix consistency” by putting GPU swim on the player or CPU swim on every NPC.

### Why now (design) / why not now (code)

The owner asked for a BIO-03 integrator after Wave 70 named the serial and Wave 72 shipped grafts. Inventory and merge law exist. Implementation waits so art and motion land against a frozen preserve rule instead of a drive-by `makeLivingHull` on traffic.

---

## Goals & Non-Goals

### Goals

1. Document the live split: player CPU `makeLivingHull` vs NPC GLB + GPU swim.
2. Freeze the preserve rule (player benchmark; no GPU-for-consistency; no `isBeautiful` living test).
3. Freeze BIO-03 scope = Beautiful **NPC** look + motion. Not player remount, not grafts overlay, not psionics, not seeds, not class evolution, not living-frigate **buy**.
4. Freeze class set = live `SHIP_CLASSES` keys only.
5. Freeze living frigate as an **NPC visual** while yard omit stays.
6. Freeze HUD-02 and SHP-03 closed.
7. Freeze motion fail-closed: cheap GPU or keep current swim.
8. Freeze art: inspiration not copies; do not claim new GLBs in Wave 75.
9. Freeze a later serial PR plan. This wave writes the brief only.
10. Freeze asset-path security and `userData.glow` as a real mesh.

### Non-goals (locked — do not reopen)

- No `src/`, meshes, GLBs, shaders, `public/`, or `scripts/` in Wave 75.
- No player living rewrite.
- No Abomination tissue overlay.
- No BIO-04 psionics.
- No BIO-01 gift / pirate seed.
- No BIO-02 career class keys.
- No living frigate (or ace / freighter) yard SKU.
- No HUD write of `hullKind`. No new HUD family.
- No lock box / power ledger.
- No new persist key. No new frozen event. No `innerHTML`.
- No `state.js` feature rewrite.
- No `DETAIL_STATIONS` / `GATE_BUILDERS` lockstep edit. Beautiful already has Bloom. Do not restore a deleted `OVERLAY_FACTIONS` table from comments.
- Do not edit the wishlist, `PROGRESS.md`, or `docs/BioLivingShipsDesign.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Player CPU vs NPC GPU “consistency”? | Keep both. Do not swap | Preserve; perf; contract §1, §4 |
| `isBeautiful(player.faction)` living test? | **No.** Starter is `independent` | `organic.js` 67–69; `ship.js` 590–591; `state.js` 146 |
| NPC path default? | **Keep live GLB + GPU** | Inventory §4–§5; owner Q1 fail-closed |
| Clone `makeLivingHull` onto NPCs? | **No.** Fail closed keep GPU | Contract §0.6, §4 |
| Speed-responsive NPC swim? | Allowed if cheap GPU; else keep 0.7 Hz | Contract §4 |
| Class keys? | Live six only | `state.js` 35–42 |
| Living frigate? | NPC visual **yes**; yard SKU **no** | `LIVING_STOCK`; inventory §6 |
| HUD `hullKind`? | HUD never writes. Grafted stays `mech` | HUD-02 |
| Guns on living hulls? | Conventional stay. No lock box | SHP-03 |
| New GLBs this wave? | **No.** Wave 8 files are inventory | Contract §0.11 |
| Persist / events? | None. `state.js` READ-ONLY | Contract §8 |
| Procedural ships like Bloom? | **No** unless owner overrides | Contract §13 |

### 2. Player outcome (later serial)

Beautiful NPC traffic should read as living kin of the player companion: alien grown skins, a swim that answers speed, and class readable at thumbnail by shape and size. The player’s own hull must still be the unique CPU manta with breath, heartbeat, veins, and thrust surge. Marine life remains a vibe, not a zoo.

### 3. Preserve: living player ship

The shipped player living hull **is** the product.

`makeLivingHull` sculpts a manta/whale sphere. Each frame the living rig mutates vertices: swim along the spine (idle 0.5 Hz → cruise 2.3 Hz), wing flap, ~4 s breath, 1.1 Hz heartbeat, amoeba shimmer, mood-tinted veins. Thrust is a bioluminescent surge, not a nozzle. `GROWTH_SCALE_MAX` 0.15 scales `flesh` from `ctx.bio.growth`.

Later BIO-03 work must **not**:

- Replace player `makeLivingHull` CPU swim with NPC GPU swim “for consistency.”
- Treat `isBeautiful(player.faction)` as the living-player test.
- Weaken breath / heartbeat / vein / thrust surge.
- Make marine inspiration literal Earth animals.

Player CPU `makeLivingHull` stays unique to the **player living rig** for performance and the preserve rule. NPC Beautiful stay a different path (today: GLB + GPU swim in `ship-assets.js` / `organic.js`).

Point at [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §2 / Wave 70 contract §1 for obtain, growth, and grafts. This brief does not re-litigate them.

### 4. NPC path (keep GLB)

Live: `npc.js` `buildShipMesh` → primed GLB. Beautiful materials get `onBeforeCompile` swim. Idle clip plays on a mixer. `userData.glow` is a Group with a mesh.

Stations/gates for Beautiful are procedural (`buildBeautifulStation`). That does **not** prove ships should leave GLB. Default: keep bake + `public/assets/ships/beautiful/`.

`FACTION_VC_PARTS` is deleted (Wave 47 → `DETAIL_SHIPS`, not GLB). Live NPC path is `buildShipAsset`. Do not revive vertex-color boxes for Beautiful.

### 5. Class identity

Use live keys only. Parallel class authors in a later wave may edit **disjoint** files:

- `scripts/ship_builders/beautiful/light.py`
- `ace.py` `cutter.py` `heavy.py` `frigate.py` `freighter.py`

Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay serial (one writer). Runtime `src/` is not scheduled in Wave 75.

Bible §4.6 names: young wayfinder, swift-bonded hunter, guardian, shieldback, elder guardian, gardenback. Plates in `docs/SpaceShipIdeas/reference-images/beautiful-ones/` guide silhouette. `docs/FactionExamples/06-beautiful-ones-ship.png` is concept art, not a photocopy target.

**Frigate:** NPC elder-guardian visual may exist (and already does as a GLB) while Beautiful yard buy omits `frigate`. Do not append `frigate` to `LIVING_STOCK`.

### 6. Motion (Wave 76)

Goal: NPC swim should answer speed the way the player hull does, without the player CPU cost.

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

Fail closed if a later PR cannot keep GPU cheap: keep this per-instance Hz path; do not clone `makeLivingHull`.

### 7. HUD-02 / SHP-03 / BIO-05 / yards

- HUD never writes `hullKind`. Grafted built hulls stay `mech`.
- Conventional guns stay. No lock box. No power ledger.
- Grafts stay `built` + `grafted: true`. Tissue overlay is **not** BIO-03.
- `LIVING_STOCK` stays light/cutter/heavy. Player remount of a bought living row still uses `makeLivingHull`, not the NPC GLB.

### 8. Persist and events

No BIO-03 persist. No new `localStorage` key. No new frozen event. `state.js` READ-ONLY. Prototype-safe. World strings stay `textContent`.

### 9. Serial PR plan

Matches contract §10. Wave 76 landed steps 1–2. Steps 3–5 stay later.

| Step | Lands | Does not land | Wave |
|---|---|---|---|
| **1 Inventory pins** | Preserve + path split + class keys + frigate-visual vs SKU | Meshes | 76 |
| **2 Motion law** | Cheap GPU speed response (per-instance Hz) | Player clone | 76 |
| **3 Per-class look** | Disjoint class files vs plates | Shared-module races; career keys | later |
| **4 Bake / wire** | Live bake/measure/validate if still the pipeline | Unsolicited procedural ships | later |
| **5 Boot / visual verify** | Player still CPU; NPC classes; glow mesh; no remote URL | Wishlist / `PROGRESS.md` | later (partial verify in 76) |

### 10. Security (later impl)

- Join asset paths only after `canonicalFaction` / `canonicalClass`.
- No remote GLB URLs.
- No `eval` of model names.
- Keep self-contained GLB check.
- `userData.glow` remains a real mesh (Wave 42).

### 11. Ownership

| Object | Writer | Reader |
|---|---|---|
| Player living mesh | `ship.js` remount | cameras, combat, HUD |
| Beautiful NPC GLB / GPU | `ship-assets.js` + bake (later) | `npc.js` |
| `player.hullKind` | hangar / yard / save / Unknowables force | HUD |
| Hangar `grafted` | Wave 72 desk | hostility; overlay later |
| `state.js` | serial data owner only | BIO-03 read-only |
| `DETAIL_STATIONS` / `GATE_BUILDERS` | station / gate sculpt owners | not BIO-03 |

---

## Acceptance direction (implementation wave)

From the wishlist, made testable:

1. Boot: player living hull still swims, breathes, beats, veins, thrust surge at idle. CPU path.
2. `isBeautiful(ctx.player.faction)` false on independent starter; hull still living.
3. Beautiful NPC light/ace/cutter/heavy/frigate/freighter still load from the GLB path (or an owner-approved replacement that is **not** `makeLivingHull`).
4. NPC swim does not allocate a player-sized CPU vertex loop per ship.
5. Wave 76: moving Beautiful NPC Hz is higher than parked/idle; `reducedMotion` still freezes amp.
6. Class readable by shape/size; not literal Earth animals; not clones of the player manta.
7. Beautiful yard still omits frigate/ace/freighter **buy**. NPC frigate visual may still exist.
8. HUD never assigns `player.hullKind`. Grafted built still `mech`.
9. Conventional Digit 1/2 still fire on a living player hull.
10. No remote GLB. No `eval`. `userData.glow` is a mesh.
11. Unknowables player remount still `makeLivingHull`. Unknowables still have no station from this work.

---

## Open owner questions

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Keep NPC Beautiful on the live **GLB bake path**. Do not switch ships to procedural Three.js.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Weaken player living animation | Contract §1; remount rebuilds `makeLivingHull`; BIO-03 must not replace it |
| GPU-for-consistency on the player | Forbidden. Pin 1–2 |
| Literal marine copies | Art law; fail closed keep Wave 8 rather than a zoo |
| Clone CPU swim onto NPCs | Motion fail-closed GPU |
| Living frigate SKU sneak | `LIVING_STOCK` omit; NPC visual allowed |
| `hullKind` smuggle | HUD never writes; grafts stay built |
| Path injection / remote GLB | Canonical allowlist; same origin |
| Glow not a mesh | Wave 42; `buildShipAsset` Group+mesh |
