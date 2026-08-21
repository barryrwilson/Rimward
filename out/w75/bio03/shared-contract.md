# BIO-03 Beautiful Ones NPC fleet shared contract

**Wave:** 75. Design only. No BIO-03 feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Bio03FleetDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or `docs/Hud02IdentitiesDesign.md`.  
**Locked sources:** wishlist BIO-03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~898–908); live inventory `out/w75/bio03/current-bio03-inventory.md`; `src/systems/ship.js`; `src/systems/organic.js`; `src/systems/ship-assets.js`; `src/systems/npc.js`; `src/game/shipyard.js`; `src/game/hangar.js`; `src/systems/hud.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`; Wave 70 BIO contract `out/w70/bio/shared-contract.md`; Wave 72 grafts; HUD-02; SHP-03.

Integrator rule: a **later** visual+motion serial obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 75 is markdown only. Implementation is a **later serial visual wave**. Do not schedule or land `src/` / GLB / shader PRs here.
2. The player living hull (`makeLivingHull` + CPU swim / breath / heartbeat / vein / thrust surge) is the **quality benchmark**. Do not weaken it.
3. Do **not** replace player CPU swim with NPC GPU swim “for consistency.”
4. Do **not** treat `isBeautiful(player.faction)` as the living-player test. Starter faction is `independent` (`state.js` 146 `opts.faction ?? 'independent'`; boot calls `createShipState('light')` at `ship.js` 590–591).
5. NPC Beautiful stay a **different path** from the player living rig. Today: GLB + GPU swim in `ship-assets.js`. Fail closed: **keep that live GLB path**.
6. NPC swim may improve, but must stay **cheaper** than player CPU vertex swim. Fail closed = keep current GPU swim rather than clone `makeLivingHull` onto every Beautiful NPC.
7. Class set = live `SHIP_CLASSES` keys only: `light` `heavy` `freighter` `ace` `cutter` `frigate`. Do not add career class keys (BIO-02 skipped).
8. Living **frigate** may exist as an **NPC visual**. Yard **buy** of living frigate stays omitted. Do not sneak a SKU into `LIVING_STOCK`.
9. HUD-02 closed: HUD never writes `hullKind`. Grafted built hulls stay `mech`.
10. SHP-03 closed: conventional guns on living hulls stay. No lock box. No power ledger. BIO-03 does not touch mounts.
11. Art: marine **inspiration**, not copies of Earth animals. Do not claim new GLBs exist because this brief exists. Wave 8 files already on disk are inventory, not this wave’s delivery.
12. `state.js` is READ-ONLY. No new frozen `ctx.js` event. No `innerHTML`. No new persist / `localStorage` key.
13. Prototype-safe. Swim phase must not persist. `Math.random` phase stays visual-only (or later seeded, still non-persisted).
14. Asset loads: same-origin allowlisted faction/class only. No `eval` of model names. No remote GLB URLs. `userData.glow` stays a real mesh.
15. BIO-01 gift/pirate seed deferred. BIO-02 class evolution out. BIO-04 psionics out. BIO-05 tissue overlay later (not this serial’s mesh). Player remount out.
16. `DETAIL_STATIONS` / retired `FACTION_VC_PARTS` / live `GATE_BUILDERS` lockstep is **not** BIO-03’s to change. Comments may still say `OVERLAY_FACTIONS`; that is not a live `gate.js` export. Beautiful already has Bloom. Unknowables stay no-station (Wave 42).

---

## 1. Preserve the living player rig

### 1.1 Must

| Must | Must not |
|---|---|
| Boot `buildLivingVisual` / `makeLivingHull` | Conventional starter as boot default |
| Living remount rebuilds swim + breath + heartbeat + veins + thrust surge | Static organic prop, plated GLB, or GPU-only swim as the **player** living path |
| Unset `hullKind` → living mesh (`meshKindFor`) | Treat independent starter as `'built'` because origin is not Beautiful |
| `GROWTH_SCALE_MAX` 0.15 remains a visual on `flesh` | Idle those fields to make NPC swim “match” |
| Player CPU per-vertex unique to **one** living player rig | Run `makeLivingHull` vertex loops on every Beautiful NPC |

### 1.2 `isBeautiful`

`organic.js` 67–69: `faction === 'beautiful'`. NPC / Bloom / gate art. **Not** `hullKind`. HUD leftover branch must not become the living-player test. Starter `independent` is `state.js` 146, not a `ship.js` 590 assignment.

### 1.3 Unknowables living-light

Player Unknowables force `'living'` and remount `makeLivingHull` (`ship.js` 503–528; `hangar.js` 85–90, 411). NPC Unknowables stay field GLBs. BIO-03 must not merge those paths “because both are living.”

---

## 2. Scope (this serial, later impl)

**In (later visual wave, not Wave 75):**

- Beautiful **NPC** look (skins, silhouette, class identity by shape and size).
- Beautiful **NPC** motion (GPU swim may become speed-responsive; idle breath clip may stay).
- Bake / measure / wire **if** the live pipeline still uses `scripts/build-ship-assets.py` + `measure-ships.mjs` (inventory: it does).
- Boot / Models Browser / in-system visual verify.

**Out:**

- Player remount / rewrite of `makeLivingHull`.
- Abomination tissue overlay (BIO-05 later).
- BIO-04 psionics.
- BIO-01 gift / pirate seed.
- BIO-02 class evolution / career keys / growth-center.
- Living frigate **buy** SKU (`LIVING_STOCK` stays `light` `cutter` `heavy`).
- HUD family / `hullKind` writes.
- `state.js` rows.
- New persist key, new frozen event, `innerHTML`.
- Unknowables home system / `DETAIL_STATIONS` insert.
- Revival of `FACTION_VC_PARTS`.

---

## 3. Class set and living frigate

Live keys only (`state.js` 35–42; `NPC_CLASSES` `ship-assets.js` 11):

`light` `ace` `cutter` `heavy` `frigate` `freighter`

Do not add combat/mining/trade/exploration/stealth/support class keys.

**Frigate NPC:** `public/assets/ships/beautiful/frigate/` already exists. A later rebuild **may** keep or replace that NPC visual.

**Frigate buy:** `LIVING_STOCK` omits `frigate` (`shipyard.js` 26–38). Adding a living frigate SKU needs owner sign-off in a **catalog** brief, not a drive-by in BIO-03 art. Persist may still store `classKey: 'frigate'`.

Ace and freighter follow the same split: NPC visual allowed; Beautiful **yard buy** stays omitted.

---

## 4. Motion law

| Rule | Freeze |
|---|---|
| Player | CPU vertex swim stays on the living player rig only |
| NPC today | GPU `onBeforeCompile` + shared uniforms + idle GLB clip |
| NPC later | May add **cheap** speed response (per-instance amp/Hz from NPC speed, GPU) |
| Cost | Must stay cheaper than player `for i in count` + `computeVertexNormals` every frame |
| Fail closed | If a PR cannot keep GPU cheap, **keep current 0.7 Hz GPU swim**. Do not clone `makeLivingHull` |
| Shared uniforms | Today `uSwimTime` / `uSwimAmp` are **module-global**. Per-instance amp is allowed only if it does not allocate per frame |
| `reducedMotion` | NPC amp → 0 (live 434). Keep. Do not disable **player** vertex swim to “match” |
| Phase | Visual only. Do not persist `swimPhase`. Do not write it onto hangar rows |
| Thrust | Player: bioluminescent surge, no nozzle. NPC: `userData.glow` remains a real mesh (Wave 42). Do not turn Beautiful drive into a plated nozzle |

---

## 5. Art law

- Quality bar = player living hull (organic alien skin, never-still motion, veins, breath, heartbeat).
- Class identity = anatomy and size (bible §4.6 + reference plates), not equipment.
- Marine *vibes* (manta, whale, dolphin, ray, cephalopod sensing) are **inspiration**.
- Forbidden: literal Earth-animal copies; body horror; teeth as architecture; mechanical kitbash; identical clones of the player manta on every NPC class.
- References: `docs/SpaceShipIdeas/reference-images/beautiful-ones/` and `docs/FactionExamples/06-beautiful-ones-ship.png` (concept, not a photocopy). Player stills: `out/hud-research/live-combat.png` / Models Browser `ship:player` if a serial needs a live pose. Do not invent a stills pack in Wave 75.
- Wave 75 **does not** add or replace GLBs. A later serial that bakes new files must say so in **that** wave, after inventory pins.

---

## 6. Asset / path security (later impl)

| Rule | Freeze |
|---|---|
| Root | Keep `ASSET_ROOT = '/assets/ships'` (same origin) |
| Faction / class | Pass **only** `canonicalFaction` / `canonicalClass` allowlists (`NPC_FACTIONS` / `NPC_CLASSES`) before path join |
| No `../` | Never concatenate raw `faction` or `classKey` from save/network into a URL |
| No remote | No `http://` / `https://` GLB URLs. No user-authored model URL |
| No eval | No `eval` / `new Function` / `shader = name` from strings. Shader inject stays authored source |
| GLB JSON | Test `JSON.parse` of local GLB JSON is not `eval`. Keep `assertSelfContainedGlb` (no external `uri`) |
| Glow | `userData.glow` is a mesh/Group with a mesh child, not a color number |

---

## 7. HUD-02 and SHP-03 (closed)

- HUD never writes `hullKind`, `grafted`, `faction`, or `classKey`.
- `hullKind === 'built'` → `mech` even when `grafted === true`.
- BIO-03 does not add a HUD family.
- Conventional guns stay on living hulls. No BIO-03 lock box. No power/heat ledger.

---

## 8. Persist, events, `state.js`

- No new `WORLD_FIELDS` key. No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No nested loadout. No NPC-look blob on hangar rows.
- No new frozen event. Prefer existing `commLine` if a later verify line is voiced (unlikely for art).
- `state.js` READ-ONLY. Do not add class keys or `WEAPONS` rows in BIO-03.
- Prototype keys: `RESERVED_IDS` / `hasOwn`. No `for…in` blob merge.

---

## 9. Coupling

| Neighbor | Law |
|---|---|
| BIO-05 | Graft = built + `grafted`. Overlay later. BIO-03 does not mark NPC Beautiful as Abominations |
| SHP yards | Do not append `frigate` / `ace` / `freighter` to `LIVING_STOCK` |
| HUD-02 | Read-only `hullKind` |
| Unknowables living | Player = `makeLivingHull`. NPC = field GLB |
| Wave 42 | No Unknowables station. Beautiful Bloom stays. Do not edit `DETAIL_STATIONS` for BIO-03 |
| Wave 70 contract §5 | This file **narrows** BIO-03. Wave 70 still wins on grafts/obtain/psionics. If a BIO-03 vs BIO living-ships conflict is about **NPC look/motion**, **this file wins** |

---

## 10. Serial PR plan (later visual wave — do not run in Wave 75)

| Step | Lands | Does not land |
|---|---|---|
| **1 Inventory pins** | Boot: player swim still CPU; NPC Beautiful still GLB+GPU; `isBeautiful` not living-player; frigate GLB exists; `LIVING_STOCK` omit | New meshes |
| **2 Motion law** | Speed-responsive **GPU** if cheap; `reducedMotion`; fail-closed keep 0.7 Hz | Player CPU clone; persist phase |
| **3 Per-class look** | Rebuild vs plates + player bar. Parallel class authors **only** if write-sets are disjoint files (`scripts/ship_builders/beautiful/{light,ace,cutter,heavy,frigate,freighter}.py`). Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay serial | Career keys; player remount; graft overlay |
| **4 Bake / wire** | If live pipeline still uses bake: `build-ship-assets.py` → compress → `measure-ships.mjs` → `validate-ship-assets` → `ship-assets.js` materials if needed | Procedural Three.js NPC ships **unless owner overrides §13** |
| **5 Boot / visual verify** | Player preserve; NPC classes readable; glow is a mesh; no remote URL; Models Browser | Wishlist / `PROGRESS.md` edits |

Do **not** implement these PRs in Wave 75. Do **not** schedule `src/` in Wave 75.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| Player living mesh | `ship.js` remount | cameras, combat, HUD |
| Beautiful NPC GLB / GPU swim | `ship-assets.js` (+ bake scripts in a visual wave) | `npc.js` spawn / `animateShipMesh` |
| `player.hullKind` | hangar / shipyard / save / Unknowables force | HUD `hudFamily` |
| Hangar `grafted` | BIO graft desk (Wave 72) | hostility; overlay later |
| `state.js` | serial data owner only | everyone; **BIO-03 read-only** |
| `DETAIL_STATIONS` | station sculpt owners | not BIO-03 |
| `userData.glow` | `buildShipAsset` | `npc.js` engine FX |

`hud.js` still must not write `hullKind` or `grafted`. `bio.js` still must not write `hullKind`.

---

## 12. Non-goals (do not reopen)

- Player `makeLivingHull` rewrite.
- NPC CPU vertex swim fleet-wide.
- Procedural Three.js Beautiful **ships** as the default (stations/gates stay procedural; ships stay GLB unless owner overrides).
- Literal marine copies.
- Living frigate yard SKU.
- Psionics, grafts overlay, seed gift, class evolution.
- New persist, new event, `innerHTML`, `state.js` edits.

---

## 13. Open owner questions (block the later visual serial only)

Defaults stand unless the owner overrides.

1. **NPC Beautiful keep the live GLB bake path, or go procedural Three.js like Bloom / gates?**  
   **Default (fail closed): keep live GLB path** (`ship-assets.js` + `scripts/ship_builders/beautiful/` + `measure-ships.mjs`). Inventory does **not** prove a procedural ship path. Bloom remaining procedural does not force ships off GLB.

No other owner question is required to start inventory pins + motion law. Skin millimetres, plate vs GLB redo, and stills packing are serial-author choices inside §5 / §10, not blockers.

---

## 14. Fail-closed defaults (repeat)

- Keep GLB + GPU swim.
- Keep player CPU unique.
- Keep `LIVING_STOCK` omit of frigate/ace/freighter.
- Keep HUD read-only `hullKind`.
- Keep conventional guns.
- If cheap speed-GPU cannot land, keep 0.7 Hz swim.
- If a class rebuild is worse than Wave 8, keep the live GLB rather than ship a literal Earth animal.
