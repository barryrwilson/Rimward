## Code Review: BIO-03 Beautiful Ones NPC fleet design (Wave 75)

### Summary

The brief matches live `ship.js` / `organic.js` / `ship-assets.js` / `shipyard.js` / `hangar.js`. Preserve split (player CPU vs NPC GPU) is explicit. First-pass holes (GPU-for-consistency, `isBeautiful` as living test, living-frigate SKU sneak, claiming new GLBs, cloning `makeLivingHull` onto NPCs, HUD write, `OVERLAY_FACTIONS` as a live constant) are closed. Remaining notes are implementation cautions. Self-applied; no separate designer agent.

### What's done well

- Inventory cites `file:line` after Wave 72 (hangar `grafted` 81–107, `graftMounted` 730–752, GPU swim 135–170 / 432–434).
- Player benchmark is named with motion constants (`IDLE_SWIM_HZ` 0.5, `CRUISE_SWIM_HZ` 2.3, `BREATH_HZ` 0.25, `HEART_HZ` 1.1) vs NPC fixed 0.7 Hz and **no** speed response.
- `isBeautiful` is documented as an art flag; starter `independent` is the living-player counterexample.
- Living frigate NPC visual vs `LIVING_STOCK` omit is explicit — no SKU sneak.
- HUD-02 / SHP-03 stay closed; grafts stay `built` + `grafted`.
- Bake/measure still live; serial plan uses disjoint class files only.
- Asset security (canonical path, no remote URL, no eval) is merge law.
- `userData.glow` stays a real mesh (Wave 42).
- Wave 75 does not edit `docs/BioLivingShipsDesign.md`; it points at it.

### Findings

#### 🔴 Blocker (resolved): Replace player CPU swim with NPC GPU “for consistency”

**Location:** wishlist preserve; `ship.js` 888–933 vs `ship-assets.js` 135–170  
**Issue:** A later “one swim path” refactor would idle `makeLivingHull` fields and put the benchmark on the weaker GPU.  
**Fix applied:** Contract §0.2–§0.6 / §1; brief preserve; acceptance pins 1–2.

#### 🔴 Blocker (resolved): Clone `makeLivingHull` onto every Beautiful NPC

**Location:** `makeLivingHull` 258–307; NPC traffic counts  
**Issue:** Per-NPC CPU vertex mutation + `computeVertexNormals` would fail perf. Wishlist “match the magic” reads as copy the player loop.  
**Fix applied:** Motion fail-closed GPU; contract §4.

#### 🔴 Blocker (resolved): Living frigate yard SKU in an art wave

**Location:** `shipyard.js` 26–38 vs `public/assets/ships/beautiful/frigate/`  
**Issue:** NPC GLB already exists; a bake PR that “also lists it for sale” would skip the BIO catalog decision.  
**Fix applied:** NPC visual allowed; `LIVING_STOCK` omit; contract §3.

#### 🟠 Major (resolved): `isBeautiful(player.faction)` as living-player test

**Location:** `organic.js` 67–69; `hud.js` 73 leftover; starter `independent`  
**Issue:** HUD leftover could be copied into remount. Independent starter would look plated.  
**Fix applied:** Contract §0.4 / §1.2; inventory §1 / §3.

#### 🟠 Major (resolved): Wave 75 claims new GLBs

**Location:** existing `public/assets/ships/beautiful/` (six classes)  
**Issue:** Easy to treat Wave 8 files as this brief’s delivery or to land a shader in the design wave.  
**Fix applied:** Contract §0.1 / §0.11; brief non-goals; no `src/` / `public/` this wave.

#### 🟠 Major (resolved): Revive `FACTION_VC_PARTS` or invent live `OVERLAY_FACTIONS`

**Location:** `PROGRESS.md` 2187, 2416 (`FACTION_VC_PARTS` → `DETAIL_SHIPS`, Wave 47); live NPC GLB `npc.js` 166–167; `gate.js` uses `GATE_BUILDERS` 17–18; mint-bud texture `gate.js` 87–88; `station.js` 498 comment  
**Issue:** First inventory draft treated `OVERLAY_FACTIONS` as a live constant. A later worker might “restore lockstep” by editing the wrong table.  
**Fix applied:** Inventory §9 names live `DETAIL_STATIONS` + `GATE_BUILDERS`; comments called out as comments. BIO-03 does not edit them. `FACTION_VC_PARTS` stays deleted.

#### 🟠 Major (resolved): HUD writes `hullKind` or grafted living remount

**Location:** `hud.js` 67–75; `hangar.js` 747–750  
**Issue:** Art work that “sets living when Beautiful NPC-like” would steal the benchmark mesh and flip HUD.  
**Fix applied:** HUD-02 closed; grafts stay `built`; player remount out of scope.

#### 🟡 Minor: Models Browser tags `ship:player` faction `'beautiful'`

**Location:** `model-catalog.js` 92–97  
**Issue:** Filter tag only. A later author might read it as `ctx.player.faction === 'beautiful'`.  
**Fix:** Inventory §1 already. Implementation must not copy that tag into `createShipState`. No Wave 75 code.

#### 🟡 Minor: Shared `uSwimAmp` is global

**Location:** `ship-assets.js` 47–48, 432–434  
**Issue:** Speed-responsive later work must not make one NPC’s throttle flap the whole faction.  
**Fix:** Contract §4 allows per-instance uniforms only if cheap; fail closed keep global 0/1.

#### 🟡 Minor: `organic.js` header still leads with part-level transforms

**Location:** `organic.js` 18–23  
**Issue:** Stale-first sentence vs GPU swim paragraph. Inventory already says code wins.  
**Fix:** Later visual PR may tighten the header. Not this wave.

#### 💡 Suggestion: Parallel class authors only on disjoint `*.py`

**Location:** contract §10 step 3  
**Issue:** Shared `surface.py` edits invalidate every class bake (`ShipAssetPipeline.md` 488–489).  
**Fix applied:** Shared modules serial. Documented.

### Verdict

Design is ready as Wave 75 markdown. No remaining Blocker/Major. Later visual serial must re-open live line numbers before bake.

### Passed checks

- [x] Player path ≠ NPC `makeLivingHull`
- [x] Class set = live `SHIP_CLASSES` keys
- [x] Frigate NPC vs SKU split
- [x] HUD-02 / SHP-03 closed
- [x] `state.js` READ-ONLY; no persist; no event
- [x] Bake pipeline still cited as live
- [x] No `src/` in this worker’s write set
