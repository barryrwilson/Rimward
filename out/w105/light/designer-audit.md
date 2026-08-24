# UI Audit: Beautiful light young wayfinder mesh (Wave 105)

**Auditor:** `[designer]` (independent of `out/w105/light/ui-audit.md`)  
**Scope:** 3D NPC Light hull glance in CPU stills. Mesh only. No HUD chrome. Design-only. Do not edit product source.  
**Review file:** `out/w105/light/designer-audit.md`  
**Worker file left untouched:** `out/w105/light/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against bible §4.6, plates README Light, `scripts/ship_builders/beautiful/light.py` header.  
**Stills:** `out/w105/light/light-render.png`, `beautiful-render.png` (LIGHT panel), `beautiful-shape.png` (LIGHT row), `beautiful-scale.png` (LIGHT).  
**Date:** 2026-08-24  
**Product source:** not edited. No Vite. [NO BROWSER COVERAGE].

## UI Audit: Light NPC mesh (young wayfinder, no glass)

### Summary

CPU stills show a compact crown-forward sea creature. The body is a short swimming loft with paddle wings, a lifted throat, and flat snout lobes. It is family to the player manta. It is not a CPU clone, not a cockpit fish, not a plated jet, and not a dolphin toy. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors, 1 suggestion.

Fail this picture later if the mesh grows an eye-sphere cockpit, engine nozzles, fitted back plates, box crease courses, a wide-disc `makeLivingHull` copy, or a literal dolphin face.

### What's done well

- **Creature, not fusion:** `light-render.png` is one grown body. No rivets, windows, barrels, or nozzle bells. Faceting is still raster, not kitbash.
- **Young wayfinder posture:** Thickest at the shoulders, raised back, short tail, forward crown (`light.py` 1–11, 18–32). Side blob in `beautiful-shape.png` LIGHT is a compact swimmer, not a tube with fins bolted on.
- **Family, not clone:** Player living hull is a wide disc (spanX 6.60, spanZ 4.20). Light is 7.8(Z), ht/len 0.42, diamond plan, eight filaments leaning forward. Head and fin anatomy carry the class, not a paint swap (bible §4.6).
- **No cockpit eye:** Flat cephalic lobes + pearl throat loft (`light.py` 9–10, 251–302). The plate’s painted eye is a concept-art artifact (plates README 15–16, 26). The mesh does not photocopy it.
- **No plates / no nozzles:** Two overlapping nacre pads replace one canopy (`light.py` 217–237). Tail stops short of the glow sphere so the wake can read as bioluminescence (`light.py` 19–20). No engine cowling.
- **Rounded paddles:** Forward pair, smaller aft pair, fluke pair (`light.py` 25–28, 272–295). Top silhouette is a broad diamond with paddle ends, not Ace daggers.
- **Thumbnail class:** LIGHT row in `beautiful-shape.png` is crown-forward teardrop (side), manta diamond (top), filament fan (front). Distinct from Ace sweep, Cutter cradle, Heavy shield walls, Frigate length, Freighter gardens. Scale pip in `beautiful-scale.png` stays the small compact kin.
- **Not a zoo dolphin:** Marine *vibe* only (cetacean brow + manta plane). Head is lobes + crown, not melon + beak + eye. Soft swollen crest, not the plate’s harder dorsal fin (`light.py` 8, 239–250).
- **Player bar:** `src/systems/ship.js` `makeLivingHull` was not touched. NPC Light is GLB + existing GPU swim.
- **No HUD:** Bake stills only. Hub, Digit, RANGE, and Models Browser chrome are out of this write-set.

### Task checklist (creature picture)

| Check | Spec | Result |
|---|---|---|
| Young sea creature, not mech fusion | bible §4.6; BIO-07 anti-rigidity | **Pass** |
| Family to player, not CPU clone | bible 165; `light.py` 2–5 | **Pass** |
| No cockpit eye | `light.py` 9–10; plates README 15–16 | **Pass** |
| No plates / no nozzles | bible 161; `light.py` 19–23 | **Pass** |
| Rounded paddles | `light.py` 10–11, 25–28 | **Pass** |
| Class readable at thumbnail | bible 165; plates README 18–27 | **Pass** |
| Not a literal dolphin photocopy | wishlist BIO-07; plates README 26 | **Pass** |
| Contrast / type / focus / hover | no new chrome | N/A |
| innerHTML | none this serial | **Pass** |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: pearl vs indigo still reads as a dorsal cap in 3/4

**Location:** `out/w105/light/light-render.png`; `scripts/ship_builders/beautiful/light.py` 217–237

**Issue:** Faction DNA is warm nacre over indigo flanks. Two low pads beat a single helmet plate, but the three-quarter still shows a clean tonal cowling. A glance can still say “visor” before “young back.”

**Fix:** Keep. Lower bury already cut the visor lip. Flattening the pads further would kill the young-wayfinder pearl spine. Shared paint, not a new box plate.

**Status:** accept; not fusion.

#### 🟡 Minor: wing-root muscle can flash as a chest pod

**Location:** `out/w105/light/light-render.png` flank; `light.py` 189–199, 260–265, 327–331

**Issue:** Buried ellipsoids replace box crease courses. At a fast 3/4 read they can look like a drop tank on the chest. They sit inside the hull beam and share hull material.

**Fix:** Keep. A bead chain or `kit.box` crease was worse. Do not add panel lines to “explain” the mass.

**Status:** accept; creature mass, not a tank.

#### 💡 Suggestion: Models Browser live still skipped

Headless overlay failed in Wave 95. This wave used CPU raster (`light-render.png`, `beautiful-shape.png`). Did not start Vite 5181 / CDP 9421. Thumbnail proof is the silhouette sheet, not a live SKU card.

### HUD

Not in scope. No HUD chrome in these stills.

### Fail-closed

Did not restore Wave 95. New mesh beats eye-sphere / crease-course fusion on silhouette. Not a zoo copy. Not a player CPU clone.
