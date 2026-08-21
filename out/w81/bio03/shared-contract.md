# BIO-03 per-class look and bake shared contract

**Wave:** 81. Design only. No BIO-03 look or bake ships in this wave.  
**Status:** MERGE LAW for `docs/Bio03ClassLookDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Bio03FleetDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or `docs/Hud02IdentitiesDesign.md`. Do not touch sibling briefs `docs/Tgt05LockCatsDesign.md` or `docs/Msn03ChainsDesign.md`.  
**Locked sources:** wishlist BIO-03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 957–967); live inventory `out/w81/bio03/current-bio03-look-inventory.md`; Wave 75 fleet contract `out/w75/bio03/shared-contract.md` (motion/preserve — do not reopen except as inventory); Wave 76 notes `out/w76/bio03/notes.md`; `src/systems/ship.js`; `src/systems/ship-assets.js`; `src/systems/npc.js`; `src/game/shipyard.js`; `src/game/hangar.js`; `src/systems/hud.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`; bake scripts listed in inventory §0.

Integrator rule: a **later** look + bake serial obeys this file. Inventory cites live code. Code wins over stale comments. Wave 75 line numbers are stale.

---

## 0. Law in one page

1. Wave 81 is markdown only. Implementation is a **later serial** (Wave 75 steps 3–4). Do not bake, do not write GLBs, do not schedule `src/` here.
2. NPC Beautiful stay on the **live GLB bake path**. Do **not** switch ships to procedural Three.js. Do **not** clone `makeLivingHull` onto traffic.
3. The player living hull (`makeLivingHull` + CPU swim / breath / heartbeat / vein / thrust surge) is the **quality benchmark**. Do not weaken it. Do not replace player CPU swim with NPC GPU swim “for consistency.”
4. Do **not** treat `isBeautiful(player.faction)` as the living-player test. Starter faction is `independent` (`state.js` 146).
5. Class set = live `SHIP_CLASSES` keys only: `light` `heavy` `freighter` `ace` `cutter` `frigate`. No new career class keys (BIO-02 skipped).
6. Per-class look = **disjoint class files vs plates**. Parallel authors may edit only `scripts/ship_builders/beautiful/{light,ace,cutter,heavy,frigate,freighter}.py`. Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay **serial** (one writer).
7. Art: marine **inspiration**, not copies of Earth animals. Not identical clones of the player manta CPU hull. Class identity is anatomy and size, not equipment.
8. Living **frigate** (and ace / freighter) may exist as **NPC visuals**. Yard **buy** stays omitted (`LIVING_STOCK` = `light` `cutter` `heavy` only).
9. Fail closed: if a class rebuild cannot beat the player bar (or reads as a zoo / CPU clone), **keep the Wave 8 GLB**. Do not ship a worse mesh.
10. Wave 76 GPU uniforms stay: per-instance `uSwimHz` / `uSwimAmp` from NPC speed; `reducedMotion` amp 0. Look/bake must not revert to global 0.7 Hz and must not add CPU vertex loops per NPC.
11. HUD-02 closed: HUD never writes `hullKind`. Grafted built hulls stay `mech`. Grafts stay `built` + `grafted`.
12. SHP-03 closed: conventional guns stay. No lock box. No power ledger.
13. `state.js` is READ-ONLY. No new frozen `ctx.js` event. No `innerHTML`. No new persist / `localStorage` key. No BIO-03 persist of look or swim phase.
14. Asset loads: join paths **only after** `canonicalFaction` / `canonicalClass`. No remote GLB URLs. No `eval` of model names. `userData.glow` stays a real mesh (Wave 42).
15. BIO-01 gift/pirate seed deferred. BIO-02 class evolution out. BIO-04 psionics out. BIO-05 tissue overlay later. Player remount out. Graft list price out.
16. `DETAIL_STATIONS` / `GATE_BUILDERS` lockstep is **not** BIO-03’s to change. Beautiful already has Bloom. Unknowables stay no-station (Wave 42). Player Unknowables remount stays `makeLivingHull`.
17. Visual verify in real Chrome (vite + swiftshader) and `npm run test:boot` are **later-impl**, not Wave 81. Known boot FAILs stay: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.

---

## 1. Preserve the living player rig

Must / must not from Wave 75 contract §1 still stand. Live cites:

| Must | Must not |
|---|---|
| Boot `buildLivingVisual` / `makeLivingHull` (`ship.js` 549–553, 258–307) | Conventional starter as boot default |
| Living remount rebuilds swim + breath + heartbeat + veins + thrust surge | Static organic prop, plated GLB, or GPU-only swim as the **player** living path |
| Unset `hullKind` → living mesh (`meshKindFor` 503–508) | Treat independent starter as `'built'` because origin is not Beautiful |
| `GROWTH_SCALE_MAX` 0.15 remains a visual on `flesh` | Idle those fields to make NPC look “match” |
| Player CPU per-vertex unique to **one** living player rig | Run `makeLivingHull` vertex loops on every Beautiful NPC |
| Models Browser `ship:player` stays `makeLivingHull` | Point `ship:player` at a Beautiful GLB |

`isBeautiful` (`organic.js` 67–69) is NPC / Bloom / gate art. **Not** `hullKind`.

Unknowables player force `'living'` and remount `makeLivingHull` (`ship.js` 514–528). NPC Unknowables stay field GLBs. BIO-03 must not merge those paths.

---

## 2. Scope (this serial, later impl)

**In (later look + bake wave, not Wave 81):**

- Beautiful **NPC** per-class look (skins, silhouette, class identity by shape and size) against plates + player bar.
- Bake / compress / measure / validate / wire **if** the live pipeline still uses `scripts/build-ship-assets.py` + `measure-ships.mjs` (inventory: it does).
- Keep Wave 76 GPU swim attached to the (possibly new) GLBs.
- Boot / Models Browser / in-system visual verify **in that later wave**.

**Out:**

- Player remount / rewrite of `makeLivingHull`.
- Procedural Three.js Beautiful **ships** (stations/gates stay procedural; ships stay GLB unless owner overrides §13).
- Motion-law reopen (Wave 76 landed). Do not “fix consistency” by swapping CPU/GPU paths.
- Abomination tissue overlay (BIO-05 later).
- BIO-04 psionics. BIO-01 gift / pirate seed. BIO-02 class evolution / career keys.
- Living frigate / ace / freighter **buy** SKU.
- HUD family / `hullKind` writes. Graft list price.
- `state.js` rows. New persist key, new frozen event, `innerHTML`.
- Unknowables home system / `DETAIL_STATIONS` insert.
- Revival of `FACTION_VC_PARTS`.
- Power ledger. Remote GLB. `eval` of model names.
- Wave 81 bake runs, new GLBs, `scripts/` / `public/` / `package.json` writes.

---

## 3. Class set and living frigate

Live keys only (`state.js` 35–42; `NPC_CLASSES` `ship-assets.js` 11; `PILOT_CLASSES` `beautiful/__init__.py` 73):

`light` `ace` `cutter` `heavy` `frigate` `freighter`

Do not add combat/mining/trade/exploration/stealth/support class keys.

**Glance identity (bible §4.6 + plates; later sculpt must keep these as class reads, not Earth photocopies):**

| Key | Class read | Yard buy |
|---|---|---|
| `light` | Young wayfinder — compact, crown-forward, closest **family** to the player hull | Yes (`LIVING_STOCK`) |
| `ace` | Swift-bonded hunter — taut dart, swept fins, traveling-wave nerves | **No** |
| `cutter` | Guardian — ventral cradle, hold-without-maul | Yes |
| `heavy` | Shieldback — dense spanY, overlapping mantles, shield fins | Yes |
| `frigate` | Elder guardian — long body, coordinated fin pairs, sanctuary hollows | **No** |
| `freighter` | Gardenback — colossal, separated garden biomes | **No** |

**Frigate NPC:** `public/assets/ships/beautiful/frigate/` already exists. A later rebuild **may** keep or replace that NPC visual.

**Frigate buy:** `LIVING_STOCK` omits `frigate` (`shipyard.js` 26–38). Adding a living frigate SKU needs owner sign-off in a **catalog** brief, not a drive-by in BIO-03 art. Ace and freighter follow the same split.

Player remount of a bought living row still uses `makeLivingHull`, not the NPC GLB.

---

## 4. Motion law (keep Wave 76; do not reopen)

| Rule | Freeze |
|---|---|
| Player | CPU vertex swim stays on the living player rig only |
| NPC | GPU `onBeforeCompile` + per-instance `userData.swimUniforms` + idle GLB clip |
| Hz | Idle 0.5 → cruise 2.3, `clamp(speed / 120, 0, 1)`. Omit speed = idle. Not a persist field |
| Amp | `reducedMotion` → 0. Keep. Do not disable **player** vertex swim to “match” |
| Cost | Must stay cheaper than player `for i in count` + `computeVertexNormals` every frame |
| Fail closed | If a look PR cannot keep GPU cheap, **keep Wave 76 Hz path**. Do not clone `makeLivingHull` |
| Phase | Visual only. Do not persist `swimPhase` |
| Thrust | Player: bioluminescent surge, no nozzle. NPC: `userData.glow` remains a real mesh |

Look authors do not edit swim shader unless a bake **breaks** `aSwim` / morph phase. Prefer keep Wave 76 inject as-is.

---

## 5. Art law (look serial)

- Quality bar = player living hull (organic alien skin, never-still motion, veins, breath, heartbeat). NPC GLBs will not duplicate CPU veins/heartbeat; they must still read as living kin at a glance.
- Class identity = anatomy and size (bible §4.6 + reference plates), not equipment. Six classes must be **readable as different creatures** at thumbnail.
- Marine *vibes* (manta, whale, dolphin, ray, cephalopod sensing) are **inspiration**.
- Forbidden: literal Earth-animal copies; body horror; teeth as architecture; mechanical kitbash; identical clones of the player manta on every NPC class; shared-module races that make two classes share a silhouette by accident.
- Light may **rhyme** with the player hull (closest family) but must differ in head/fin anatomy, not color alone (bible §4.6).
- Cutter cradle must stay an **open hold**, not a mouth (plate README caution).
- Heavy mantles must stay swollen muscle, not shell plates.
- Frigate hollows stay four grown chambers, not a row of manufactured bays.
- Freighter gardens stay a few large readable biomes, not a coral zoo.
- Eyes in plates are concept-art, not a builder requirement.
- References: `docs/SpaceShipIdeas/reference-images/beautiful-ones/` and `docs/FactionExamples/06-beautiful-ones-ship.png` (concept, not a photocopy). Player stills: `out/hud-research/live-combat.png` / Models Browser `ship:player`.
- Wave 81 **does not** add or replace GLBs. A later serial that bakes new files must say so in **that** wave, after inventory pins.
- Fail closed: keep Wave 8 GLB rather than ship a zoo or a CPU clone.

---

## 6. Bake / wire law (later impl)

| Rule | Freeze |
|---|---|
| Pipeline | Keep live: Blender `scripts/build-ship-assets.py` → compress → (encode textures if skins change) → `measure-ships.mjs` → `validate-ship-assets.mjs` |
| Delivery | `public/assets/ships/beautiful/<canonicalClass>/lod*.glb` |
| Source | `assets-source/ships/beautiful/<canonicalClass>.blend` |
| Runtime | `ship-assets.js` `buildShipAsset` / `updateShipAsset`. Do **not** import Python at runtime |
| Path join | `canonicalFaction` / `canonicalClass` **before** any `` `${ASSET_ROOT}/…` `` |
| Root | Keep `ASSET_ROOT = '/assets/ships'` (same origin) |
| No `../` | Never concatenate raw `faction` or `classKey` from save/network into a URL |
| No remote | No `http://` / `https://` GLB URLs. No user-authored model URL |
| No eval | No `eval` / `new Function` / `shader = name` from strings. Shader inject stays authored source |
| GLB JSON | `JSON.parse` of local GLB JSON is not `eval`. Keep `assertSelfContainedGlb` (no external `uri`) |
| Glow | Bake still emits `RIMWARD_ENGINE_GLOW`. Runtime `userData.glow` is a mesh/Group with a mesh child, not a color number |
| Materials | Beautiful trader/pirate maps stay under `public/assets/ships/materials/beautiful/`. Canonical role before join |
| Measure | Class size ladder per faction: light ≤ ace < cutter < heavy < frigate < freighter (`measure-ships.mjs` 12) |
| npm | Do not add a bake script to `package.json` unless a later **tooling** brief owns it. Wave 81 writes no `package.json` |
| Scope | Bake **beautiful** only unless an owner catalog wave says otherwise. Do not rebuild plated factions “while the blender is open” |
| Fail closed | If measure/validate fail for a class, keep the previous Wave 8 GLB for that class. Do not ship a broken LOD set |

Generic `BUILDERS['beautiful']` sphere stub must not replace a failed pilot class. Do **not** drop a key from `PILOT_CLASSES` to fall through to that stub; fail closed keep the Wave 8 GLB.

---

## 7. Asset / path security (later impl)

| Rule | Freeze |
|---|---|
| Faction / class | Pass **only** `canonicalFaction` / `canonicalClass` allowlists (`NPC_FACTIONS` / `NPC_CLASSES`) before path join |
| Bake CLI | Blender args must be allowlisted tokens from `FACTIONS` / `CLASSES` in `build-ship-assets.py`. Do not interpolate user URLs into `filepath` |
| Glow | `userData.glow` is a mesh (Wave 42). `npc.js` scales/visibility-writes that object (1916, 1942) |
| Prototype | Do not use class names as `userData` keys from unsanitized input. Do not `Object.assign` save/network blobs onto `userData`. Own keys only: `glow`, `swimUniforms`, `swimPhase`, mixer, lod, proxy |
| XSS | `textContent` only if a later UI names a class. No `innerHTML` |

---

## 8. HUD-02 and SHP-03 (closed)

- HUD never writes `hullKind`, `grafted`, `faction`, or `classKey`.
- `hullKind === 'built'` → `mech` even when `grafted === true`.
- BIO-03 does not add a HUD family.
- Conventional guns stay on living hulls. No BIO-03 lock box. No power/heat ledger.
- Graft list price stays closed.

---

## 9. Persist, events, `state.js`

- No new `WORLD_FIELDS` key. No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No nested loadout. No NPC-look blob on hangar rows.
- No new frozen event. Prefer existing `commLine` if a later verify line is voiced (unlikely for art).
- `state.js` READ-ONLY. Do not add class keys or `WEAPONS` rows in BIO-03.
- Prototype keys: `RESERVED_IDS` / `hasOwn`. No `for…in` blob merge.
- Swim phase / Hz / amp must not persist.

---

## 10. Coupling

| Neighbor | Law |
|---|---|
| Wave 75 fleet contract | Still wins on **player preserve** and **NPC≠CPU**. This file **narrows** look + bake. If a conflict is about **class look / bake**, **this file wins**. Live code wins over both on “today.” |
| Wave 70 living-ships | Wins on grafts/obtain/psionics. BIO-03 does not mark NPC Beautiful as Abominations |
| Wave 76 motion | Keep per-instance uniforms. Do not revert |
| BIO-05 | Graft = built + `grafted`. Overlay later |
| SHP yards | Do not append `frigate` / `ace` / `freighter` to `LIVING_STOCK` |
| HUD-02 | Read-only `hullKind` |
| Unknowables living | Player = `makeLivingHull`. NPC = field GLB. No station (Wave 42) |
| Bloom / gates | Procedural stay. Ships stay GLB |

---

## 11. Serial PR plan (later visual wave — do not run in Wave 81)

Matches Wave 75 contract §10 steps 3–5, narrowed.

| Step | Lands | Does not land | Wave |
|---|---|---|---|
| **1 Inventory pins** | Preserve + path split + class keys + frigate-visual vs SKU | Meshes | 76 (done) |
| **2 Motion law** | Cheap GPU speed response (per-instance Hz) | Player clone | 76 (done) |
| **3 Per-class look** | Disjoint class files vs plates + player bar. Parallel **only** on six class `.py` files | Shared-module races; career keys; player remount; graft overlay | later |
| **4 Bake / wire** | Live bake/measure/validate for **beautiful** if still the pipeline. Keep canonical path + glow mesh | Unsolicited procedural ships; plated-faction rebuild; `package.json` unless tooling owns it | later |
| **5 Boot / visual verify** | Player still CPU; NPC six classes glance-readable; glow mesh; no remote URL. **Real Chrome, vite + swiftshader.** `npm run test:boot` (WAVE4 / WAVE26 / WAVE35 FAILs stay) | Wishlist / `PROGRESS.md` | later |

Do **not** implement these PRs in Wave 81. Do **not** schedule `src/` in Wave 81. Do **not** execute bake.

---

## 12. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| Player living mesh | `ship.js` remount | cameras, combat, HUD |
| Beautiful NPC GLB | bake scripts in a visual wave | `ship-assets.js` load |
| Beautiful NPC GPU swim | `ship-assets.js` | `npc.js` spawn / `animateShipMesh` |
| `player.hullKind` | hangar / shipyard / save / Unknowables force | HUD `hudFamily` |
| Hangar `grafted` | BIO graft desk (Wave 72) | hostility; overlay later |
| `state.js` | serial data owner only | everyone; **BIO-03 read-only** |
| `DETAIL_STATIONS` | station sculpt owners | not BIO-03 |
| `userData.glow` | `buildShipAsset` | `npc.js` engine FX |
| Shared beautiful modules | **one** serial writer | class files |
| Class `.py` files | assigned class author | bake driver |

`hud.js` still must not write `hullKind` or `grafted`. `bio.js` still must not write `hullKind`.  
`src/core/ctx.js` ownership table in inventory §10 is binding.

---

## 13. Non-goals (do not reopen)

- Player `makeLivingHull` rewrite.
- NPC CPU vertex swim fleet-wide.
- Procedural Three.js Beautiful **ships** as the default.
- Literal marine copies. Player-manta clones on traffic.
- Living frigate/ace/freighter yard SKU.
- Psionics, grafts overlay, seed gift, class evolution, graft list price.
- New persist, new event, `innerHTML`, `state.js` edits.
- Power ledger. Remote GLB. `eval`.
- Wave 81 bake / new GLBs / `src/` / `scripts/` / `public/` / `package.json`.

---

## 14. Open owner questions (block the later look serial only)

Defaults stand unless the owner overrides.

1. **NPC Beautiful keep the live GLB bake path, or go procedural Three.js like Bloom / gates?**  
   **Default (fail closed): keep live GLB path** (`ship-assets.js` + `scripts/ship_builders/beautiful/` + `measure-ships.mjs`). Bloom remaining procedural does not force ships off GLB.

No other owner question is required to start look inventory pins. Skin millimetres and stills packing are serial-author choices inside §5 / §11, not blockers.

---

## 15. Fail-closed defaults (repeat)

- Keep GLB + GPU swim (Wave 76 uniforms).
- Keep player CPU unique.
- Keep `LIVING_STOCK` omit of frigate/ace/freighter.
- Keep HUD read-only `hullKind`. Grafts stay `built` + `grafted`.
- Keep conventional guns. No power ledger.
- If a class rebuild is worse than Wave 8, keep the live GLB rather than ship a literal Earth animal or a CPU clone.
- Join paths only after `canonicalFaction` / `canonicalClass`.
- No remote GLB. No `eval`. Glow stays a mesh.
