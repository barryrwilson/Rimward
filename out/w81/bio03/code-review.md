# Code Review: BIO-03 per-class look and bake design (Wave 81)

### Summary

The brief matches live look/bake after Wave 76 motion: player CPU `makeLivingHull` vs NPC GLB `buildShipAsset` / `updateShipAsset`, six `SHIP_CLASSES` keys, Beautiful `PILOT_CLASSES` full six, `LIVING_STOCK` omit ace/freighter/frigate **buy**, Wave 8 GLBs on disk including frigate, Wave 76 per-instance `uSwimHz` / `uSwimAmp` with `reducedMotion` amp 0, canonical path join, `userData.glow` mesh. First-pass holes (procedural ships default, CPU clone on traffic, career keys, shared-module races, living-frigate SKU, HUD `hullKind` write, remote GLB, `eval`, glow-not-mesh, shipping a zoo, `PILOT_CLASSES` fallthrough to the sphere stub) are closed in the contract. Remaining notes are implementation cautions, not design blockers.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Markdown only; no `src/` edits. Nested subagents forbidden. Designer agent is **not available**. UI audit: not applicable (design-brief / non-UI task).

### Re-review (after first-pass fix)

First-pass 🟠 Major (`PILOT_CLASSES` fallthrough to `BUILDERS['beautiful']` spheres) is closed in contract §6, inventory §4, and the brief bake section. No remaining 🔴/🟠. Minors left with justification.

### What's done well

- Inventory cites live `file:line` (2026-08-21), not stale Wave 75 numbers, and states code wins.
- Merge law is explicit: `out/w81/bio03/shared-contract.md` wins over the brief.
- NPC path default is **keep GLB bake**. Bloom remaining procedural does not force ships off GLB.
- Class set is live six keys only. No BIO-02 career keys.
- Per-class look write-set is disjoint `{light,ace,cutter,heavy,frigate,freighter}.py`; shared modules serial.
- Frigate NPC visual allowed; yard **buy** omit frozen for frigate/ace/freighter.
- Fail closed: keep Wave 8 GLB rather than a zoo or a CPU clone; do not drop `PILOT_CLASSES` into `BUILDERS['beautiful']`.
- Wave 76 uniforms are inventory, not reopen. `reducedMotion` amp 0 cited at `ship-assets.js` 469.
- HUD never writes `hullKind`. Grafts stay `built` + `grafted`.
- Unknowables player remount stays `makeLivingHull`; no station (Wave 42).
- Path join after `canonicalFaction` / `canonicalClass`. No remote URL. No `eval`. Glow is a mesh.
- `state.js` READ-ONLY. No persist. No new frozen event. No power ledger.
- Serial PRs named only. Chrome vite+swiftshader and `npm run test:boot` named as later-impl. Known WAVE4 / WAVE26 / WAVE35 FAILs stay.
- Sibling paths (`docs/Bio03FleetDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Tgt05LockCatsDesign.md`, `docs/Msn03ChainsDesign.md`) are read-only.

### Findings

#### 🔴 Blocker (resolved): Switch NPC Beautiful to procedural Three.js or clone `makeLivingHull`

**Location:** `npc.js` 167–168; `ship-assets.js` 387–445; `ship.js` 258–307  
**Issue:** “Consistency” with Bloom stations or the player hull would either skip GLB self-contain checks or allocate a player-sized CPU vertex loop per traffic ship.  
**Fix applied:** Contract §0.2 / §2 / §14: keep GLB + GPU. Do not clone `makeLivingHull` onto traffic.

#### 🔴 Blocker (resolved): New career class keys / living-frigate yard SKU

**Location:** `state.js` 35–42; `shipyard.js` 26–38  
**Issue:** Extra class keys would reopen BIO-02. Appending `frigate` to `LIVING_STOCK` would sneak a catalog SKU through art.  
**Fix applied:** Live six keys only. NPC frigate visual allowed; `LIVING_STOCK` stays `light` `cutter` `heavy`.

#### 🔴 Blocker (resolved): HUD writes `hullKind` / grafts remount living

**Location:** `hud.js` 66–75; `hangar.js` 730–752  
**Issue:** A look serial that stamped `hullKind` from class art or remounted grafted hulls as living would flip HUD family and break HUD-02 / BIO-05.  
**Fix applied:** HUD never writes. Grafts stay `built` + `grafted` → `mech`.

#### 🟠 Major (resolved): Shared-module races during parallel class look

**Location:** `scripts/ship_builders/beautiful/{surface,anatomy,organs,__init__}.py`; `probe-beautiful-parts.py` 1–9  
**Issue:** Two class authors editing `anatomy.py` at once would couple silhouettes and ship a fleet of near-clones.  
**Fix applied:** Contract §0.6: parallel only on disjoint class files. Shared modules serial. Probe shared constructs first.

#### 🟠 Major (resolved): Ship a class that misses the player bar / fall through to sphere stub

**Location:** `build-ship-assets.py` 354–361, 478–483; `beautiful/__init__.py` 73  
**Issue:** A failed rebuild could ship literal Earth animals, a player-manta clone, or drop a `PILOT_CLASSES` key so `BUILDERS['beautiful']` spheres go to `public/`.  
**Fix applied:** Contract §0.9 / §6: keep Wave 8 GLB for that class. Do not drop `PILOT_CLASSES` keys. Generic stub must not replace a failed pilot.

#### 🟠 Major (resolved): Path join / remote GLB / `eval` / glow not a mesh

**Location:** `ship-assets.js` 114–119, 209–228, 234, 404–416  
**Issue:** See security review HIGH items.  
**Fix applied:** Contract §6–§7. Canonical join. No remote URL. No `eval`. Glow Group+mesh (Wave 42).

#### 🟡 Minor: Wave 75 fleet brief still says “fixed 0.7 Hz” in older inventory tables

**Location:** `docs/Bio03FleetDesign.md` (locked); `out/w75/bio03/current-bio03-inventory.md`  
**Issue:** A later worker who opens Wave 75 first will think NPC Hz is still global 0.7.  
**Fix:** Wave 81 inventory + contract cite live `updateShipAsset` 457–470. Do **not** edit the locked Wave 75 brief.  
**Justification for leave:** Preserve rule forbids editing `docs/Bio03FleetDesign.md`. Live code + Wave 81 inventory win.

#### 🟡 Minor: Ace envelope length (7.2) is below light (7.8) while measure ladder is `light ≤ ace`

**Location:** `build-ship-assets.py` 38–41; `measure-ships.mjs` 12  
**Issue:** A class author who treats envelope `l` as the glance ladder could enlarge ace past the span band or shrink light.  
**Fix:** Glance identity is anatomy + `SHIP_SCALE` span, not driver `l`. Measure script remains the pin.  
**Justification for leave:** Already implied by inventory §6 vs §7; later sculpt reads `measure-ships.mjs`, not a new number in this brief.

#### 💡 Suggestion: Later visual stills pack

**Location:** inventory §0 player stills  
**Issue:** There is still no dedicated BIO-03 NPC stills pack.  
**Fix:** Optional in step 5 (Chrome vite + swiftshader). Do not invent files in Wave 81.

### Passed checks (design)

- [x] Live inventory covers player CPU vs NPC GLB, Wave 76 uniforms, six class keys, yard omit, bake pipeline, plates, glow mesh, HUD-02, Unknowables
- [x] GLB default; no procedural ships; no CPU clone
- [x] Frigate buy omit; NPC frigate GLB may exist
- [x] No remote URL; canonical join; no eval
- [x] No BIO-03 persist; `state.js` READ-ONLY
- [x] Later verify named (Chrome vite+swiftshader; `test:boot` known FAILs)
- [x] No `src/` / bake / `public/` / `scripts/` / `package.json` in this wave
