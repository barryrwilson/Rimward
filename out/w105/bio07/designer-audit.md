# UI Audit: BIO-07 living-ship CREATURE picture (Wave 105)

**Auditor:** `[designer]` (independent of `out/w105/bio07/ui-audit.md`)  
**Scope:** Player-facing Beautiful Ones **NPC creature** picture. Integrator leftover is design-only. Sibling PR1 light / PR2 heavy stills in `out/w105/light/` and `out/w105/heavy/` are the glance evidence. Ace / cutter / frigate / freighter wait.  
**Review file:** `out/w105/bio07/designer-audit.md`  
**Worker file left untouched:** `out/w105/bio07/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Bio07BodiesDesign.md`, `out/w105/bio07/shared-contract.md` (merge law wins), plates `docs/SpaceShipIdeas/reference-images/beautiful-ones/README.md`, wishlist BIO-07 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1354–1393), bible §4.6. Stills inspected; no `src/` edit.  
**Date:** 2026-08-24  
**Product source:** spec + QA stills on disk. No Vite. [NO BROWSER COVERAGE].

## UI Audit: species-inspired NPC bodies (no new glass)

### Summary

The specified player outcome is **six sea-creature silhouettes in space**, not a HUD widget. Light and heavy are the only classes allowed to change this wave. The freeze (no hub pip, no Digit, no SKU, player CPU hull kept, remaining four named later) is sound. The **stills the player would glance** still read as **sea-creature + mechanical ship**. Heavy is a nacre helmet with circular mouths. Light is a young wayfinder with a fitted back plate and saw-tooth fin. That is the owner pain this leftover exists to kill. Not CLEAN.

### Verdict

**Not CLEAN.** 0 blockers, 2 majors, 3 minors, 2 suggestions.

A later serial that adds a species child to `.rw-reticle`, points `ship:player` at a Beautiful GLB, clones `makeLivingHull` onto traffic, photocopies Earth animals, or scales one body for class identity fails this picture as a 🔴 Blocker even if the mesh improves.

### What's done well

- Player-facing change is **body language**. No toast, no Digit, no species string on RANGE (`out/w105/bio07/shared-contract.md` §5). Class identity is the mesh.
- Empty hub freeze is explicit. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). Contract forbids a species disc.
- HUD still **reads** `player.hullKind` (`src/systems/hud.js` 81–89). HUD never writes `hullKind`.
- Digit 0 stays shipyard (`src/systems/station.js` 185). Digit 8/9 stay launch / epics. Bodies are not a dock verb.
- Player bar is preserved: `makeLivingHull` sphere 64×40 manta/whale (`src/systems/ship.js` 274–334). Models Browser `ship:player` still builds that CPU mesh (`src/game/model-catalog.js` 93–113). Chase still `out/hud-research/live-combat.png` shows the continuous organic player hull, not an NPC GLB.
- Light is **not** a CPU topology clone. Crown-forward filaments, cephalic lobes, three fin pairs (`scripts/ship_builders/beautiful/light.py` 19–32, 321–324). Player hull has no crown and no GLB parts.
- Light vs heavy vs the waiting four are **not** one mesh resized. Black scale sheet (`out/w105/light/beautiful-scale.png`, `out/w105/heavy/beautiful-scale.png`) keeps the measure ladder. Wishlist 1361–1364 holds on silhouette, not on organic read.
- Remaining four keep bible §4.6 names (taut dart / ventral cradle / long elder / gardenback) without pretending they ship this worker (`out/w105/bio07/shared-contract.md` §0.1 glance table; §6 PR3–PR6 later).
- Plates README 100 already flags eyes, circular hollows, knife tips, mouth-cradles, shell mantles as concept-art artifacts. The pack repeats those as **must not**.
- Fail closed keeps the Wave 95 GLB rather than a generic sphere stub (`build-ship-assets.py` 354–361). Yard `LIVING_STOCK` six keys are not mutated (`src/game/shipyard.js` 28–30).
- QA plate labels `LIGHT` / `HEAVY` live on raster stills, not on the 80 px hub.

### Task checklist (player outcome)

| Check | Spec | Still | Result |
|---|---|---|---|
| Sea-creature, not mech fusion | contract §0.1 anti-rigidity; owner request | `out/w105/light/light-render.png`; `out/w105/heavy/heavy-render.png` | **Fail** on landed light/heavy heroes. Fusion still wins at a glance. |
| Class identity by anatomy, not scaled copies | wishlist 1361–1364; contract §0.7 | `out/w105/heavy/beautiful-shape.png` | **Pass** (six different plans). Organic lineage is the miss, not scale. |
| Light = family, not CPU clone | bible §4.6; contract §0.1; `light.py` 1–11 | light-render vs `makeLivingHull` | **Pass** (family). Head/fin differ. Fusion remnants remain (🟠). |
| Heavy = muscle, not plates | plates README 54–63; `heavy.py` 17–21, 241–249 | heavy-render + heavy shape row | **Fail**. Shape gains mantle steps; shaded hero is a helmet plate. |
| No HUD-01 chrome | contract §5; `hud.js` 709–712 | no new hub child in spec | **Pass** |
| No Earth photocopies | wishlist 1365–1366; plates README 5 | NPC stills | **Pass** (meshes are not literal dolphin/whale toys). Plate paintings are more Earth-like; README says not model sheets. |
| Player bar preserved | contract §1; `ship.js` 274–334; `model-catalog.js` 93–113 | `out/hud-research/live-combat.png` | **Pass** |
| Remaining classes named later | contract §6 PR3–PR6 | six-pack still Wave 95 for those four | **Pass** (wait). Do not score those four as this wave’s bake. |
| Contrast / type / focus / hover | no new chrome | — | N/A |
| innerHTML | none this leftover | modelsbrowser only | **Pass** |

### Findings

None at 🔴 Blocker.

#### 🟠 Major: Heavy still reads as fitted nacre armour plus portholes

**Location:** `out/w105/heavy/heavy-render.png`; `out/w105/heavy/beautiful-shape.png` HEAVY row vs `_sil-bak/beautiful-shape.png`; `scripts/ship_builders/beautiful/heavy.py` 241–249, 370–382; `scripts/ship_builders/beautiful/organs.py` 229–230, 272–286; `scripts/ship_skins/beautiful.py` 14–16, 46–49 (`secondary_parts` match `living` / `fin` → panel `#B0A8BE`).

**Issue:** Owner deputize and contract §0.1 say heavy **must** be shieldback whale, overlapping **muscle**, and **must not** be fitted shell plates, coaxial discs, or window leftovers. The black profile after PR2 does show three dorsal steps (better than `_sil-bak`). The **player-facing shaded hero** still shows: (1) one hard pearl cap sitting on a dark hull — a helmet, not interpenetrating flesh; (2) a row of circular dark mouths with torus lips along the indigo flank — manufactured portholes; (3) a cyan strip along the skirt that reads as strip lighting, not buried fold glow; (4) a knife dorsal fin against plates README 100 (soften tips). Bible 161 forbids manufactured windows and bolted armour. Wishlist 1385 forbids organic texture on a conventional hull. PR2’s job this wave is this glance.

**Fix:** Soften the pearl/indigo boundary until the cap is a swell, not a seam (`heavy.py` 384–393 flow line is not enough if ROLE_ARMOUR `living-body-mantle-*` still takes panel paint). Bury vent bowls and kill proud torus lips that glance as portholes (`organs.py` 279–286 — serial PR7 if a new mouth type is required; until then hide them). Keep cyan in deep folds only. Round the shield-fin tip (`heavy.py` 288–303 already asks paddle chord 2.20 — the still does not sell it). If the shaded hero cannot beat Wave 95, **keep the Wave 95 GLB** (contract §0.9). Do not paper the plate with a HUD “living” badge.

**Status:** must fix on the heavy sibling bake before calling PR2 done. Not a chrome defect.

#### 🟠 Major: Light still reads as flesh on a small mechanical hull

**Location:** `out/w105/light/light-render.png`; `scripts/ship_builders/beautiful/light.py` 217–237 (nacre pads), 260–270 (shoulder/jowl spheres), 307–318 (trailing struts), 366–376 (vents); plates README 18–27; contract §0.1 “Light = young wayfinder (family to player)” / “not kitbashed flesh-on-hull.”

**Issue:** Light **is** family, not a `makeLivingHull` clone: compact, crown-forward, short tail. That part of the checklist passes. The hero still fails **sea-creature**. The dorsal nacre is a hard gray back plate (same panel-paint split as heavy). Ventral jowl/lobe spheres read as pods or cheek tanks, not fused cephalic flesh (`light.py` 260–270, 297–302). The lower fin trailing edge is a saw of triangles — knife / teeth, not `_FLIP_TIP_ROUND` paddles (`anatomy.py` 88, 224, 470; plates README 3, 100). Small triangular dorsals at the tail fight “soft dorsal crest, never a hard dorsal fin” (`light.py` 8–9, 239). Wishlist 1390: do not change only appendages while the underlying read stays a hull. Player quality bar (`ship.js` 274–334; live-combat still) is one continuous mesh with no panel seam.

**Fix:** Merge nacre pads into the loft so there is no helmet seam. Fuse lobes into the snout. Drop trail struts that saw the wing. Hide vents. Keep the crown. If the hero cannot beat the player bar or still reads as a mini-sub, keep Wave 95 light GLB. Do not clone the CPU manta to “fix” family.

**Status:** must fix on the light sibling bake before calling PR1 done.

#### 🟡 Minor: Fleet six-pack still shows Wave 95 fusion on the waiting four

**Location:** `out/w105/light/beautiful-render.png`; `out/silhouettes/beautiful-render.png`; ace knife dart, cutter dual circular wells, frigate porthole row, freighter dorsal hatches.

**Issue:** Ace / cutter / frigate / freighter **wait** (contract §6). Scoring them as PR1/PR2 failure would smash serial law. A reviewer who treats the six-pack as “BIO-07 shipped” will think the leftover failed the whole fleet.

**Fix:** None this worker. Acceptance for this wave is **light + heavy heroes + player bar beside them**. Caption the six-pack as fail-closed Wave 95 for the four. Do not add class-name chrome on the hub to “explain” the wait.

**Status:** accept; geometry wait.

#### 🟡 Minor: `kit.box` crease / well primitives still exist for any class that still calls them

**Location:** `scripts/ship_builders/beautiful/anatomy.py` 834–835; `organs.py` 454–455, 492–493; contract §3; code-review note that class files must hide box reads until PR7.

**Issue:** Shared modules are serial. Light.py comments “No kit.box crease courses” (327). Heavy comments “no box crease, no well” (324). Frigate/freighter still sit on box wells until PR5–PR7. A box face that glances will re-open mech fusion.

**Fix:** PR7 serial. Until then bury. Do not fork `organs.py` in a class PR.

**Status:** frozen.

#### 🟡 Minor: Living yard desk will not prove the new creature

**Location:** Digit 0 shipyard; player remount still `makeLivingHull` (`src/systems/ship.js` 546–560).

**Issue:** Buying a living **heavy** still flies the CPU sculpt, not the NPC shieldback GLB. Traffic and Models Browser Beautiful class rows carry the BIO-07 picture. A buyer can confuse “my hull” with “their kin.”

**Fix:** Out of BIO-07. Do not steal Digit 0 to swap player remount onto NPC GLBs. Preserve law forbids it.

**Status:** frozen. Glance acceptance is Models Browser + in-system **NPC** Beautiful, plus the player bar beside them.

#### 💡 Suggestion: Side-by-side acceptance is a black-silhouette + chase still, not class-name chrome

**Location:** wishlist BIO-07 1378–1381; contract §0.1 glance table.

**Issue:** Reviewers will want to “see all classes.” Temptation is a debug overlay of class keys on the hub or `innerHTML` in Models Browser beyond live.

**Fix:** Later playtest: black silhouette (`beautiful-shape.png`) + in-system. No RANGE rewrite. No `innerHTML` class names on the pupil. Do not treat the six-pack label row as in-game HUD.

**Status:** contract §5 already forbids hub chrome and `innerHTML` on this leftover.

#### 💡 Suggestion: Do not bake the plates’ Earth faces

**Location:** `docs/SpaceShipIdeas/reference-images/beautiful-ones/beautiful-light-young-wayfinder.png` (dolphin brow + eye); `beautiful-heavy-shieldback.png` (crisp mantle borders the README already warns); README 15–16, 27, 62–63, 100.

**Issue:** The paintings are the right **posture** (crown-forward youth; dense whale; shield fins). They are also the zoo risk (literal dolphin face, shell-plate borders). Meshes today are safe from photocopy and fail the other way (mech). A later “match the plate” pass can import the eye and the armour.

**Fix:** Keep README 100 as law. No eyes. No circular bay row. No shell borders. Inspiration, not copies (wishlist 1365–1366).

**Status:** already in plates README; restated so PR1/PR2 do not chase the painting’s artifacts.

### Accessibility / states / theming (scope)

- **Keyboard:** No new bind. Digit 0/8/9 stay.
- **Names:** No new control. No species SKU string.
- **States:** No loading / empty / error / disabled / hover chrome. Creature identity is the mesh at rest and in GPU swim (Wave 76 stay; BIO-06 Hz is other worker).
- **Theming:** No new CSS. Skin tokens stay in `scripts/ship_skins/beautiful.py`. The panel channel on `living-*` names is why nacre reads as a manufactured plate (🟠 above) — that is a **creature** theming miss, not a HUD token miss.
- **Responsive:** No new layout. Hit targets unchanged.
- **Motion:** Not this leftover. Wave 76 GPU stay. Player CPU swim stay. Do not add a reduced-motion HUD legend.
- **Contrast:** N/A (no new type). QA stills use black labels on white — verify sheets only.

### Player-facing creature picture (this wave vs later)

1. **Player living hull:** unchanged quality bar. Breath, heart, veins, thrust surge. Not an NPC GLB. Not cloned onto traffic.
2. **Light NPC:** compact young wayfinder, crown-forward, family of the player. Must lose the back plate, pod jowls, and saw-tooth fin before PR1 is the picture.
3. **Heavy NPC:** dense shieldback. Mantles as muscle swells. Shield fins as walls. Must lose the helmet cap, porthole row, and strip-light vein before PR2 is the picture.
4. **Ace / cutter / frigate / freighter:** glance names frozen (dart / cradle / elder hollows / gardenback). Geometry later. Wave 95 GLB stays until each serial beats the bar.

No species name on the aim glass. Digit 0 is still shipyard.

### Picture vs later serial (fail conditions)

These are not extra findings on the integrator markdown. They are the bar:

1. Adding a child to `.rw-reticle` (species pip, class disc) is a 🔴 Blocker (HUD-01).
2. Pointing `ship:player` at a Beautiful GLB, or replacing `makeLivingHull` with NPC GPU swim, is a 🔴 Blocker (player bar).
3. Cloning `makeLivingHull` onto NPC traffic is a 🔴 Blocker (perf + BIO-03).
4. Scaling one body by `SHIP_SCALE` for class identity is a 🔴 Blocker (wishlist smash).
5. Literal Earth dolphin / whale / squid toys as the fleet is a 🔴 Blocker (zoo).
6. Shipping a new Digit, UU, or living SKU from this leftover is a 🔴 Blocker.
7. Landed light/heavy heroes that still read as **flesh on a plated hull** (this file’s 🟠) are a 🟠 Major until the bake beats the stills or fail-closed keeps Wave 95.
8. Implementing ace/cutter/frigate/freighter bodies in this worker is a 🟠 Major (serial smash).
9. Parallel writes to `organs.py` / `anatomy.py` / `surface.py` / `__init__.py` in a class PR is a 🟠 Major (race).

### Verdict (repeat)

**Not CLEAN.** Freeze for HUD-01, player bar, no Earth photocopies, not-scaled copies, and remaining-four-later is correct. The player-facing light and heavy **creatures** still glance as mech fusion: light = family with a fitted back and saw fin; heavy = whale helmet with portholes. Fix those stills (or keep Wave 95) before PR1/PR2 report DONE.
