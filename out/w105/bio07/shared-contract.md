# BIO-07 distinct species-inspired living ship bodies shared contract

**Wave:** 105. Design only. No BIO-07 body ships in this worker.  
**Status:** MERGE LAW for `docs/Bio07BodiesDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave (this worker):** any edit under `src/`, `scripts/`, `public/`, `assets-source/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Bio01*.md`, `docs/Bio02*.md`, `docs/Bio03*.md`, `docs/Bio04*.md`, `docs/Bio05*.md`, `docs/Bio06*.md`, `docs/BioLivingShipsDesign.md`, `docs/Rep05*.md`, `docs/Msn03*.md`, `docs/Hud*.md`, `docs/Shp*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, or `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave105.md`.  
**Locked sources:** wishlist BIO-07 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1354–1393); BIO-03 merge law `out/w81/bio03/shared-contract.md` (READ; honor; do not edit); `docs/Bio03ClassLookDesign.md` (READ; do not edit); bible `docs/FactionShipDesignBible.md` §4.6; plates `docs/SpaceShipIdeas/reference-images/beautiful-ones/README.md`; live inventory `out/w105/bio07/current-bio07-inventory.md` (code wins).

Integrator rule: a **later** body serial obeys this file. Inventory cites live code. Code wins over stale BIO-03 “Wave 8 GLB” / “`LIVING_STOCK` omit ace/frigate/freighter” comments.

**BIO-06** (class-scaled fin cadence) is a **sibling leftover**. Not this brief. One line only: other worker. Do **not** design Hz tables here.

**Sibling Wave 105 workers** own `scripts/ship_builders/beautiful/light.py` and `heavy.py` first organic slices plus their blend/GLB. This worker does **not** edit those paths. Light + heavy first slices **may** land this wave **against this freeze**. Ace / cutter / frigate / freighter wait as later serial.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 105 BIO-07 **this worker** is **markdown only**. Later impl is **serial**. Do **not** bake. Do **not** write GLBs. Do **not** write `src/`. Named serial PR plan is **named only** except sibling class authors may land PR1 light / PR2 heavy against **this** freeze.
2. NPC Beautiful stay on the **live GLB bake path**. Do **not** switch ships to procedural Three.js. Do **not** clone `makeLivingHull` onto traffic.
3. The player living hull (`makeLivingHull` + CPU swim / breath / heartbeat / vein / thrust surge) is the **quality benchmark**. Do not weaken it. Do not replace player CPU swim with NPC GPU swim “for consistency.”
4. Do **not** treat `isBeautiful(player.faction)` as the living-player test. Starter faction is `independent` (`state.js` 173 `createShipState`; boot `ship.js` 624).
5. Class set = live `SHIP_CLASSES` keys only: `light` `heavy` `freighter` `ace` `cutter` `frigate` (`state.js` 37–44; `ship-assets.js` 11; `beautiful/__init__.py` 73). **No new class keys.**
6. Per-class look = **disjoint class files vs plates**. Parallel authors may edit **only** `scripts/ship_builders/beautiful/{light,ace,cutter,heavy,frigate,freighter}.py`. Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay **serial** (one writer).
7. Art: marine **inspiration**, not copies of Earth animals. Not identical clones of the player manta CPU hull. Class identity is **anatomy and size**, not scaled copies of one body, not equipment.
8. Yard **buy** law: do **not** add a living frigate / ace / freighter SKU. Live `LIVING_STOCK` is already the six keys (`shipyard.js` 28–30). BIO-07 does **not** mutate the catalog. Do **not** reverse the live six-key list. Do **not** invent UU.
9. Fail closed: if a class rebuild cannot beat the player bar, or reads as a zoo / CPU clone, **keep the Wave 95 GLB** for that class (`public/assets/ships/beautiful/<class>/lod*.glb`). Do not ship a worse mesh. Do not fall through to generic `BUILDERS['beautiful']` sphere stub (`build-ship-assets.py` 354–361, 420–424).
10. Wave 76 GPU uniforms stay: per-instance `uSwimHz` / `uSwimAmp` from NPC speed; `reducedMotion` amp 0. Do **not** reopen BIO-06 Hz here. Look/bake must not revert to global 0.7 Hz and must not add CPU vertex loops per NPC.
11. HUD-02 closed: HUD **never writes** `hullKind`. Grafted built hulls stay `mech`. Grafts stay `built` + `grafted`.
12. `state.js` is READ-ONLY. No new frozen `ctx.js` event. No `innerHTML`. No new persist / `localStorage` key. No BIO-07 persist of look or swim phase. No new Digit.
13. Asset loads: join paths **only after** `canonicalFaction` / `canonicalClass`. No remote GLB URLs. No `eval` of model names. `userData.glow` stays a real mesh (Wave 42).
14. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave105.md`. Deputize defaults are recorded **here**.
15. Do not “fix” known boot FAILs. Do not “fix” player CPU swim still running under `reducedMotion`.

---

## 0.1 Wave 105 deputize (owner may override after playtest)

Do **not** park. Player living ship is GREAT. Beautiful Ones **faction NPC** ships still look like fusions of sea creatures and mechanical ships. Owner wants them to look like **sea creatures**: organic, fewer rigid lines, marine inspiration not copies, not kitbashed flesh-on-hull.

### Anti-rigidity (must / must not)

| Must | Must not |
|---|---|
| Grown lofts (`sf.grown_loft`) as primary mass | Rigid panel lines; `kit.hull_loft` faceted octagon as the Beautiful body |
| Overlapping flesh; buried roots; irregular hollow lips | Box wells as the **read** (`kit.box` crease floors / sanctuary wells that glance as fitted panels) |
| Rounded paddles (`anatomy._FLIP_TIP_ROUND`) | Knife tips, plank fins, fitted-armor mantle reads |
| Irregular hollow lips (bead rings, seeded) | Perfectly circular manufactured bays; `kit.box` glow **panels** that read as windows |
| Class identity by anatomy and size | Scaled copies of one body; equipment as class |
| Light = young wayfinder (family to player) | Clone of CPU `makeLivingHull` topology onto the NPC light GLB |
| Heavy = shieldback whale; mantles = swollen muscle | Fitted shell plates; coaxial disc stack; turret-dome stack |
| Ace / cutter / frigate / freighter glance from bible §4.6 | Later serial that copies light/heavy silhouette up/down |
| Stern glow as **wake** | Window / nozzle / turret leftovers |
| Shared organs serial | Parallel writers on `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` |

Kill: rigid panel lines, box wells, fitted-armor mantle reads, window / nozzle / turret leftovers.

Prefer: grown lofts, overlapping flesh, rounded paddles, irregular hollow lips.

### Glance identity (keep bible §4.6; not Earth photocopies)

| Key | Must read as | Must not read as | Serial |
|---|---|---|---|
| `light` | Young wayfinder — compact, crown-forward, closest **family** to the player | Photocopy of `makeLivingHull`; dolphin toy | **PR1** sibling this wave |
| `heavy` | Shieldback whale; dense spanY; overlapping **muscle** mantles | Fitted armour plates; scaled-up light | **PR2** sibling this wave |
| `ace` | Swift-bonded hunter — taut dart, swept fins, traveling-wave nerves | A second light with paint | **PR3** later |
| `cutter` | Guardian — ventral cradle, hold-without-maul | A mouth with teeth | **PR4** later |
| `frigate` | Elder guardian — long body, coordinated fin pairs, sanctuary hollows | A heavy scaled up; a hangar barge | **PR5** later |
| `freighter` | Gardenback — colossal, separated garden biomes | A coral reef zoo; a cargo box in nacre | **PR6** later |

Ace / cutter / frigate / freighter glance identity from bible §4.6 **stays**. Geometry wait = later serial. Do not redesign those four here beyond this freeze.

---

## 1. Preserve the living player rig

Must / must not from Wave 81 BIO-03 contract §1 still stand. Live cites:

| Must | Must not |
|---|---|
| Boot `buildLivingVisual` / `makeLivingHull` (`ship.js` 382–411, 274–334, 546–560) | Conventional starter as boot default; NPC GLB as player living mesh |
| Living remount rebuilds swim + breath + heartbeat + veins + thrust surge | Static organic prop, plated GLB, or GPU-only swim as the **player** living path |
| Unset `hullKind` → living mesh (`meshKindFor` 535–539) | Treat independent starter as `'built'` because origin is not Beautiful |
| `GROWTH_SCALE_MAX` 0.15 remains a visual on `flesh` (`ship.js` 98, 1043) | Idle those fields to make NPC look “match” |
| Player CPU per-vertex unique to **one** living player rig | Run `makeLivingHull` vertex loops on every Beautiful NPC |
| Models Browser `ship:player` stays `makeLivingHull` (`model-catalog.js` 93–113) | Point `ship:player` at a Beautiful GLB |

`isBeautiful` (`organic.js` 67–69) is NPC / Bloom / gate art. **Not** `hullKind`.

Unknowables player force `'living'` and remount `makeLivingHull` (`ship.js` 535–560). NPC Unknowables stay field GLBs. BIO-07 must not merge those paths.

Player CPU `makeLivingHull` is the quality bar. Do **not** clone it onto NPCs.

---

## 2. NPC path (keep GLB + Wave 76 GPU)

Live: `npc.js` `buildShipMesh` → `buildShipAsset` (`npc.js` 176–178). Beautiful materials get per-instance `onBeforeCompile` swim. Idle clip plays on a mixer. `userData.glow` is a Group with a mesh (`ship-assets.js` 387–444).

Stations/gates for Beautiful are procedural. That does **not** prove ships should leave GLB.

Fail closed if a look PR cannot keep GPU cheap: keep Wave 76 Hz path. Do not clone `makeLivingHull`.

BIO-06 cadence (per-class Hz/sweep) is **other worker**. This leftover does not name Hz numbers.

---

## 3. Shared modules vs class files

| Object | Writer | Parallel? |
|---|---|---|
| `light.py` | PR1 sibling (Wave 105 allowed) | yes vs other **class** files |
| `heavy.py` | PR2 sibling (Wave 105 allowed) | yes vs other **class** files |
| `ace.py` | PR3 later | later serial only |
| `cutter.py` | PR4 later | later serial only |
| `frigate.py` | PR5 later | later serial only |
| `freighter.py` | PR6 later | later serial only |
| `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` | **one** serial writer | **no** |
| New organ types | **PR7** only if a later serial needs them | serial writer |
| Bake / measure / validate | **PR8** | after the class that needs it |

Parallel class authors edit **only** their class `.py`. If a class needs a new organ primitive, wait for PR7. Do not fork `organs.py` in a class PR.

`kit.box` crease floors (`anatomy.py` 834–835) and sanctuary wells / glow panels (`organs.py` 454–455, 492–493) are the live **rigid** primitives. Replacing them is a **serial shared** edit (PR7), not a class-file race. Until PR7 lands, class authors must hide box reads: bury, overlap flesh, irregular lips, never expose a panel face.

---

## 4. Bake / wire (later; sibling light/heavy may bake their own class)

| Rule | Freeze |
|---|---|
| Pipeline | Keep live: Blender `scripts/build-ship-assets.py` → compress → (encode textures if skins change) → `measure-ships.mjs` → `validate-ship-assets.mjs` |
| Delivery | `public/assets/ships/beautiful/<canonicalClass>/lod*.glb` |
| Source | `assets-source/ships/beautiful/<canonicalClass>.blend` |
| Runtime | `ship-assets.js` `buildShipAsset` / `updateShipAsset`. Do **not** import Python at runtime |
| Path join | `canonicalFaction` / `canonicalClass` **before** any `` `${ASSET_ROOT}/…` `` |
| Root | Keep `ASSET_ROOT = '/assets/ships'` (same origin) |
| No remote | No `http://` / `https://` GLB URLs. No user-authored model URL |
| No eval | No `eval` / `new Function` / `shader = name` from strings. Shader inject stays authored source |
| Glow | Bake still emits `RIMWARD_ENGINE_GLOW`. Runtime `userData.glow` is a mesh/Group with a mesh child, not a color number |
| Measure | Class size ladder per faction: light ≤ ace < cutter < heavy < frigate < freighter (`measure-ships.mjs` 12) |
| Fail closed | If measure/validate fail for a class, keep that class’s **Wave 95** GLB. Do not drop a key from `PILOT_CLASSES` |

Generic `BUILDERS['beautiful']` sphere stub must not replace a failed pilot class.

---

## 5. HUD / Digit / persist / `state.js`

- HUD never writes `hullKind` (`hud.js` 81–89 reads only; 1079 copies into `last.kind` — not a player write).
- No new Digit. Digit 0 stays shipyard (`station.js` 185 `DOCK_KEY_SERVICES`). Digit 8/9 stay launch / epics.
- Empty 80 px hub stays empty of body-kind chrome (`hud.js` 709–712).
- `innerHTML` forbidden on paths this leftover names. Live `innerHTML` is Models Browser only (`modelsbrowser.js`). Do not add class-name HTML.
- No new `WORLD_FIELDS` key. No `localStorage` key. Autosave stays `rimward-save-v1`.
- `state.js` READ-ONLY. No new class keys. No `SHIP_CLASSES` extra fields. No invented UU.

---

## 6. Serial PR plan (named only)

| PR | Lands | Does not land | Wave |
|---|---|---|---|
| **PR1 light** | Young-wayfinder NPC body vs plates + player **family**, not CPU clone. May bake light GLB | Shared-module rewrite; `makeLivingHull` clone; catalog SKU | sibling **this wave** |
| **PR2 heavy** | Shieldback whale; swollen-muscle mantles. May bake heavy GLB | Fitted plates; shared-module race | sibling **this wave** |
| **PR3 ace** | Taut dart hunter | Light scaled; knife tips | later serial |
| **PR4 cutter** | Ventral cradle; open hold | Mouth with teeth | later serial |
| **PR5 frigate** | Long elder; four grown hollows | Hangar barge; manufactured bay row | later serial |
| **PR6 freighter** | Gardenback; separated biomes | Coral zoo; cargo box | later serial |
| **PR7 shared organs** | New organ types **only if** a later serial needs them (box-well / crease-floor replacement) | Parallel class authors editing `organs.py` | serial writer |
| **PR8 bake/measure/validate pins** | Measure ladder; self-contained GLB; glow mesh; Wave 76 uniforms still attached | Plated-faction rebuild; `package.json` unless tooling owns it | after the class that needs it |

Remaining four classes **wait**. Shared organs stay **serial**.

---

## 7. Security (later impl)

| Rule | Freeze |
|---|---|
| Faction / class | Pass **only** `canonicalFaction` / `canonicalClass` allowlists before path join |
| Bake CLI | Blender args must be allowlisted tokens. Do not interpolate user URLs into `filepath` |
| Glow | `userData.glow` is a mesh. `npc.js` scales/visibility-writes that object |
| Prototype | Do not use class names as `userData` keys from unsanitized input. Do not `Object.assign` save/network blobs onto `userData` |
| XSS | `textContent` / `h()` / `el()` only if a later UI names a class. No `innerHTML` |
| Shader | Authored GLSL. Do not interpolate `classKey` into `onBeforeCompile` source |

---

## 8. Coupling

| Neighbor | Law |
|---|---|
| Wave 81 BIO-03 contract | Honor player preserve, NPC≠CPU, GLB path, six keys, shared-module serial. **This file** narrows **bodies / anti-rigidity** and fail-closed **Wave 95** GLB. If a conflict is about **BIO-07 bodies**, **this file wins**. Code wins over both on “today.” |
| Wave 76 motion | Keep per-instance uniforms. Do not revert |
| BIO-06 cadence | Other worker. One line. No Hz table here |
| BIO-05 | Graft = built + `grafted`. Overlay later. Not this leftover |
| SHP yards | Do not **add** living frigate/ace/freighter SKU. Do not mutate live `LIVING_STOCK` |
| HUD-02 | Read-only `hullKind` |
| Unknowables living | Player = `makeLivingHull`. NPC = field GLB |
| Bloom / gates | Procedural stay. Ships stay GLB |

---

## 9. Fail-closed defaults (repeat)

- Keep GLB + GPU swim (Wave 76 uniforms).
- Keep player CPU unique.
- Keep six live class keys. No new keys.
- Do not add yard SKUs. Do not invent UU.
- Keep HUD read-only `hullKind`.
- If a class rebuild is worse than Wave 95, keep the live Wave 95 GLB rather than ship a zoo or a CPU clone.
- Join paths only after `canonicalFaction` / `canonicalClass`.
- No remote GLB. No `eval`. Glow stays a mesh.
- Shared organs: one writer.
- Remaining four classes wait.

---

## 10. Open owner questions

**Deputized this wave** (§0.1). Owner may override after playtest. Do not park.

1. NPC Beautiful stay on the live **GLB bake path**.
2. Anti-rigidity: kill box-well / panel / mantle-plate / nozzle reads.
3. Light = family, not CPU clone. Heavy = shieldback muscle.
4. Ace / cutter / frigate / freighter later serial; glance law frozen now.
5. Fail closed = Wave 95 GLB per class.

No other owner question is required to start PR1/PR2.
