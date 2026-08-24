# UI Audit: Beautiful heavy Shieldback mesh (Wave 105)

**Auditor:** `[designer]` (independent of `out/w105/heavy/ui-audit.md`)  
**Scope:** 3D NPC Heavy hull glance in CPU stills. Mesh only. No HUD chrome. Design-only. Do not edit product source.  
**Review file:** `out/w105/heavy/designer-audit.md`  
**Worker file left untouched:** `out/w105/heavy/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against bible §4.6 Shieldback, plates README Heavy, `scripts/ship_builders/beautiful/heavy.py` header.  
**Stills:** `out/w105/heavy/heavy-render.png`, `beautiful-shape.png` (HEAVY row), `beautiful-scale.png` (HEAVY).  
**Date:** 2026-08-24  
**Product source:** not edited. No Vite. [NO BROWSER COVERAGE].

## UI Audit: Heavy NPC mesh (shieldback, no turret)

### Summary

CPU stills show a dense mature defender. The body is a tall whale loft with overlapping dorsal muscle, raised shield walls, and a blunt downturned snout. It is family to the player manta. It is not a CPU clone, not a back turret, not a plated tank, and not a zoo whale. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors, 1 suggestion.

Fail this picture later if the mesh grows a turret dome, gun barrels, fitted shell plates, a needle snout, a Light-class crown fan, or a literal whale photocopy of `beautiful-heavy-shieldback.png`.

### What's done well

- **Creature, not fusion:** `heavy-render.png` is one grown body. No rivets, windows, barrels, nozzle bells, or bolted armor. Faceting is still raster, not kitbash. Bible §4.6 first read (majestic animal, not organic machine) holds.
- **Mature shieldback posture:** Dense central body, layered mantles, broad shielding fins, concentrated cyan threat display (`heavy.py` 1–9, 17–31; bible 168). Side blob in `beautiful-shape.png` HEAVY is a tall swimmer with a hanging pouch, not a tube with plates bolted on.
- **Mantles as muscle:** Three overlapping `sf.grown_loft` masses with bury 0.92 / 0.88, tapered ends, large Z overlap (`heavy.py` 17–21, 136–153, 241–279). Side silhouette is a continuous whale back. Saddle/scallop trial was reverted (notes.md). Not `org.dorsal_mantles` spheres. Not a full-beam helmet cap.
- **No turret dome:** Wave 95 back sphere stack is gone. Dorsal mass is lofted flesh, not a cupola. Header forbids a turret dome (`heavy.py` 20–21). The 3/4 still has no gun house on the spine.
- **No barrels:** Weapons are cyan vein fans in mantle folds and fin roots (`heavy.py` 27–31, 328–356). Three inset breathing mouths per flank (`heavy.py` 370–382), not tubes. No mechanical batteries.
- **Blunt snout:** Nose stations are broad with negative `y_offset` (`heavy.py` 11–13, 83–96). Side view in `beautiful-shape.png` HEAVY droops; 3/4 in `heavy-render.png` is a rounded brow, not an Ace needle.
- **Watchful crown:** Eight short filaments, flat arc 0.08, raked forward-down (`heavy.py` 33–35, 358–368). Distinct from Light’s curious fan (`beautiful-shape.png` LIGHT vs HEAVY).
- **Shield walls:** Path-loft fins rise from buried shoulder roots; tip chord 2.20 is a paddle, not a dagger (`heavy.py` 22–26, 285–309). Front thumbnail in `beautiful-shape.png` HEAVY is a defensive W-frame. Lower pair keeps the manta lineage.
- **Thumbnail class vs Light:** HEAVY row is dense height + raised walls + reduced crown. LIGHT row is crown-forward compact teardrop + horizontal paddles. Measure: light 7.8(Z) ht/len 0.42 vs heavy 15.3(Z) ht/len 0.47 (`measure5.log`). Scale pip in `beautiful-scale.png` is a fat oval with wall fins, not the Light juvenile.
- **Not a zoo whale:** Marine *vibe* only (whale authority + manta plane). No painted eye, no literal melon photocopy of the plate, no barnacle texture. Pearl/indigo split and cyan fold glow follow faction DNA, not a wildlife still.
- **Player bar:** `src/systems/ship.js` living path was not touched. NPC Heavy is GLB + existing GPU swim.
- **No HUD:** Bake stills only. Hub, Digit, RANGE, and Models Browser chrome are out of this write-set.

### Task checklist (creature picture)

| Check | Spec | Result |
|---|---|---|
| Mature sea creature, not mech fusion | bible §4.6; BIO-07 anti-rigidity | **Pass** |
| Mantles as muscle, not armor plates | plates README 62–63; `heavy.py` 17–21, 241–279 | **Pass** |
| No turret dome | `heavy.py` 20–21; `heavy-render.png` | **Pass** |
| No barrels | bible 168; `heavy.py` 4–5, 328–356 | **Pass** |
| Blunt snout | `heavy.py` 11–13, 94–96; plates README 60 | **Pass** |
| Class readable vs light | bible 168 vs 165; `beautiful-shape.png` HEAVY vs LIGHT | **Pass** |
| Not a literal whale photocopy | plates README 5–6, 62–63; wishlist BIO-07 | **Pass** |
| Contrast / type / focus / hover | no new chrome | N/A |
| innerHTML | none this serial | **Pass** |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: pearl vs indigo still reads as a nacre cap in 3/4

**Location:** `out/w105/heavy/heavy-render.png`; `scripts/ship_builders/beautiful/heavy.py` 238–283

**Issue:** Faction DNA is warm nacre over indigo flanks. Three buried muscle lofts beat a turret dome and beat fitted shell plates, but the three-quarter still shows a clean tonal visor where `living-body-mantle-*` meets `heavy-body`. A glance can still say “cap” before “overlapping whale muscle.” Plates README 62–63 names this as the main translation risk.

**Fix:** Keep. Shared paint would soften the join. Out of class-file scope. Flattening the lofts would kill the shieldback height. Better than Wave 95 dome and better than the reverted saddle plates.

**Status:** accept; muscle-shaped split, not fusion.

#### 🟡 Minor: near-side shield fin reads triangular in 3/4

**Location:** `out/w105/heavy/heavy-render.png`; `heavy.py` 285–303

**Issue:** Front silhouette is a protective wall. In 3/4 the visible membrane tapers to a point and can flash as a shark dorsal rather than the plate’s broad paddle wall. Tip chord 2.20 already pads a dagger.

**Fix:** Keep. Path-loft membranes cannot be rewritten here without a shared anatomy change. Side and front thumbnails still carry the class.

**Status:** accept; paddle spec held; 3/4 foreshortening.

#### 💡 Suggestion: Models Browser live still skipped

Headless overlay failed in Wave 95. This wave used CPU raster (`heavy-render.png`, `beautiful-shape.png`). Did not start Vite 5182 / CDP 9422. Thumbnail proof is the silhouette sheet, not a live SKU card.

### HUD

Not in scope. No HUD chrome in these stills.

### Fail-closed

Did not restore Wave 95. New mesh beats the turret/plate stack on silhouette. Not a zoo copy. Not a player CPU clone.
