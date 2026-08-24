# UI Audit: BIO-03 Beautiful NPC class glance (Wave 95)

**Auditor:** `[designer]` (independent of `out/w95/bio03/ui-audit.md` — do not rubber-stamp)
**Scope:** Beautiful Ones NPC fleet glance after Wave 95 rebake. Class identity by shape and size. Player CPU living hull must stay unique. HUD chrome is out of scope except where it hides ship identity.
**Review file:** `out/w95/bio03/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Glance table in `docs/Bio03ClassLookDesign.md` §5. Art law in `out/w81/bio03/shared-contract.md` §5. CPU sheets are glance proof. Overlay GLB stills are not glance proof when they hang on load.
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits, no bake, no GLB writes).

Sources:

- Glance law: `docs/Bio03ClassLookDesign.md` 171–180
- Art law: `out/w81/bio03/shared-contract.md` 123–137
- Worker self-audit: `out/w95/bio03/ui-audit.md` (read; not copied)
- Measure: `out/w95/bio03/measure.txt`
- Capture: `out/w95/bio03/capture-log.txt`, `out/w95/bio03/notes.md`
- Stills: `out/w95/bio03/stills/`
- Plates: `docs/SpaceShipIdeas/reference-images/beautiful-ones/` (concept, not photocopy)
- Player bar: `out/w95/bio03/stills/01-starter-living.png`, `02-models-player.png`; live `makeLivingHull` `src/systems/ship.js:274`

## UI Audit: Beautiful NPC fleet glance (Wave 95)

### Summary
CPU silhouette, scale, and shaded sheets show six different organic creatures. They are marine kin, not a zoo and not clones of the player manta. The independent starter living hull remains the unique CPU disc. Models Browser GLB stills hung on “Loading asset.” under headless swiftshader; that is a verify gap, not a sheet glance miss.

### Verdict
**NOT CLEAN.** 0 blockers. **1 Major** (Models Browser Beautiful GLB stills stayed on Loading asset). Glance-law sheets **pass**.

Worker Major on overlay load is **confirmed** on stills `03`–`08` and `capture-log.txt`. It is **not** upgraded to Blocker: parent law says CPU sheets are glance proof unless those sheets miss the glance table. They do not.

### Glance scorecard

| Key | Must read as | Sheet read | Must not | Pass? |
|---|---|---|---|---|
| light | Compact curious wayfinder; crown-forward; closest family to player | Teardrop + forward crown + cephalic paddles. Not the player disc. | Photocopy of `makeLivingHull`; dolphin toy | **Pass** |
| ace | Taut dart; swept fins | Thin ribbon, huge aft sweep, torn port fin | Second light with paint | **Pass** |
| cutter | Social guardian; ventral cradle | Ventral pouch + inboard pads; no teeth | Mouth with teeth | **Pass** |
| heavy | Dense shieldback; overlapping mantles | Tall mantle stack; raised shield fins | Fitted armour plates | **Pass** |
| frigate | Long elder; four hollows | Long cigar; four fin pairs; four flank wells | Heavy scaled up | **Pass** (hollows still round — Minor) |
| freighter | Colossal gardenback; separated biomes | Three dorsal mounds; size jump on scale sheet | Zoo; cargo box | **Pass** |

Size ladder (`beautiful-scale.png`, `measure.txt`): light 8.0, ace 7.7, cutter 10.7, heavy 15.3, frigate 29.0, freighter 83.2. Live gate allows ace ≥ light×0.85. Ace still reads as the thinner dart.

### What's done well
- **Player bar.** `01-starter-living.png`: independent living light, teal/violet vein skin, no nozzle, BIO `SERENE`. `02-models-player.png`: `Player – Living Hull (scale anchor)`, 1 mesh, 4,992 tris — `makeLivingHull` (`ship.js:274`), not a Beautiful GLB. Capture probe: `living:true`, `faction:independent`, `hasSwimUniforms:false` (`capture-log.txt:12`).
- **Light ≠ player manta.** Player is a flat radial disc. NPC light is a compact teardrop with a forward crown (`light.py:368–377`) and flat cephalic paddles (`light.py:327–334`), not eye spheres. Family rhyme without a photocopy.
- **Ace ≠ painted light.** Height/length 0.17 vs light 0.39 (`measure.txt:1–2`). Swept fins and shortened port fin (`ace.py:245–256`) read as a taut dart on both silhouette and render sheets.
- **Cutter cradle.** Side and front silhouettes show a ventral pouch, not a toothed maw. Pads sit inboard of the hold (`cutter.py:305–348`). Vent count is 2 per flank (`cutter.py:407–421`), not an engine bank.
- **Heavy shieldback.** Front silhouette is a raised-fin V. Render mantles overlap as swollen muscle (`heavy.py:245–260`), not fitted plates.
- **Frigate ≠ scaled heavy.** Top view has four coordinated fin pairs. Body is long and low, not the heavy’s dense spanY (ht/len 0.24 vs 0.48).
- **Freighter gardenback.** Three separated dorsal mounds at thumbnail (`freighter.py:159–177`, `326–334`). Colossal vs frigate on `beautiful-scale.png`. Not a coral zoo and not a nacre cargo box.
- **Not a zoo.** Baked meshes are organic spacecraft with crown, nacre, and fins. They use marine *vibe* and do not photocopy the plate dolphins/whales. That matches contract §5 (plates are concept, not a photocopy).
- **Sheet craft.** `beautiful-shape.png` (per-class fit), `beautiful-scale.png` (shared world scale), `beautiful-render.png` (three-quarter shaded LOD0) give a readable glance without WebGL.

### Findings

#### 🔴 Blocker
None.

Sheets do not miss the glance table. Overlay load hang is not a Blocker under parent law.

#### 🟠 Major: Models Browser Beautiful GLB stills stayed on “Loading asset.”

**Location:** `out/w95/bio03/stills/03-models-beautiful-light.png` through `08-models-beautiful-freighter.png`; `out/w95/bio03/capture-log.txt:15–22`; overlay copy `src/systems/modelsbrowser.js:460`
**Severity:** major
**Status:** open as **verify/capture**. Not a mesh hole. Sheets replace glance proof.

**Issue:** Each Beautiful class still selects the correct catalog row (`Beautiful Ones – Light/Ace/Cutter/Heavy/Frigate/Freighter`) and then paints an empty starfield with orange `Loading asset…`. The same overlay **did** finish the player CPU mesh (`02-models-player.png`). Capture then hit `NPC probe fail cdp timeout` and `TRAFFIC []`. Worker attributes this to headless Chrome + swiftshader. GLBs still measure and validate (`measure.txt:8–9`; `validate.txt`: 228 Meshopt GLBs PASS).

This still leaves **in-engine** NPC PBR, glow mesh, and GPU swim unproven in the overlay. It does **not** mean the rebake failed glance law.

**Fix:** Re-capture Models Browser in a live GPU Chrome, or treat CPU `beautiful-shape.png` / `beautiful-render.png` as the accepted glance proof for this wave. Do not restore Wave 8 GLBs for this hang. Do not call the mesh a hole.

#### 🟡 Minor: Frigate hollows still read as round flank portholes

**Location:** `out/w95/bio03/stills/beautiful-render.png` FRIGATE cell; `scripts/ship_builders/beautiful/frigate.py:220–246`
**Severity:** minor
**Status:** open (nice to have). Not a zoo. Not a scaled heavy.

**Issue:** Glance law asks for four grown hollows, not a hangar barge. Art law: hollows stay four grown chambers, not a row of manufactured bays (`shared-contract.md:132`; plate README: irregular grown lips). Wave 95 staggers y/z per flank (`frigate.py:232–241`), so the row is no longer a straight drill. At three-quarter glance the four mouths are still circular stamps plus extra small ports. They read as portholes more than sanctuary chambers. The class still reads as a long elder with four fin pairs.

**Fix:** Keep this bake. If a later look pass opens hollows, irregularize lips and oval the wells. Do not fail-closed restore Wave 8 for this.

#### 🟡 Minor: Cradle traffic still does not show an in-system Beautiful fleet

**Location:** `out/w95/bio03/stills/09-cradle-traffic.png`; `capture-log.txt:21–22` (`TRAFFIC []`)
**Severity:** minor
**Status:** open as extra proof, not glance-law fail

**Issue:** The frame is a jump splash (`JUMP – Cradle`) over a Bloom station. The player living hull is only a faint lower-left disc. No NPC class is readable. Comm says light traffic is far. This does not contradict the sheets. Acceptance item 5 also named in-system glance (`Bio03ClassLookDesign.md:284`).

**Fix:** Optional later still after jump completes, with at least one Beautiful NPC in frame. Not required to accept the six-class sheet read.

#### 💡 Suggestion: Light front-view lobes read as wide paddles / ears

**Location:** `out/w95/bio03/stills/beautiful-shape.png` LIGHT front cell; `light.py:327–339`
**Issue:** Flat lobes beat the old eye spheres and the dolphin-face plate. Nose-on they can look like Mickey ears. Quarter view (`beautiful-render.png` LIGHT) is the intended wayfinder read: crown-forward, compact, not a toy dolphin.
**Fix:** Judge from quarter and side. Do not grow a smile or an eye.

#### 💡 Suggestion: Models Browser list truncates class + pirate labels

**Location:** `02-models-player.png` left rail (`Cutter (pirat_`, `Freighter (pi_`, `Player – Living Hull (scale an_`)
**Issue:** Overlay chrome, not ship identity. Truncation plus the `BEAUTIFUL` chip on the player scale-anchor can look as if the unique CPU hull is a Beautiful GLB. Mesh stats disprove that.
**Fix:** Out of BIO-03 look scope. Later overlay pass: wrap or tooltip; keep `BEAUTIFUL` as family/quality tag, not faction.

### HUD / accessibility (identity only)
This pass is ship silhouette, not HUD chrome.

- `01-starter-living.png`: the living hull sits on a black field with high-contrast teal veins. Identity is readable. No nozzle. Independent starter, not a Beautiful GLB.
- Overlay `Loading asset…` uses a warm (orange) status color on dark (`modelsbrowser.js:460`). That is visible. The control is not keyboard-blocked in the still; the asset simply never arrived in this capture.
- Do not treat BIO/manifest/lock widgets as BIO-03 defects.

### Player uniqueness
| Still | Read |
|---|---|
| `01-starter-living.png` | Unique CPU manta/whale disc; veins; no engine bell |
| `02-models-player.png` | `makeLivingHull` catalog entry; 4992 tris; not NPC LOD |
| NPC sheets | Cigar / dart / pouch / shieldback / elder / gardenback — different anatomy |

Contract preserve (`shared-contract.md:40–46`) holds on the stills that loaded.

### Worker audit delta
| Worker claim | Designer |
|---|---|
| No Blocker | **Agree** |
| Major: overlay Loading asset | **Agree** (verify/capture; not mesh hole) |
| Minor: frigate portholes | **Agree** |
| Suggestion: light front paddles | **Agree** |
| Six classes pass glance | **Agree** on CPU sheets |
| Overlay hang = glance fail | **Disagree** — sheets carry the glance law |

### Accessibility / theming / states (checklist)
Not a HUD feature wave. Residual notes only:

- Contrast of CPU silhouettes on white is absolute (black on white). Shaded sheet is mid gray on white; class labels are readable.
- Overlay loading state exists (`Loading asset…`) but never resolved for Beautiful GLBs in this pack.
- Empty overlay viewport after select is an empty state without a timeout/error. That is the Major above, not a new finding.

### Re-review bar
Close the Major only with either (a) live-GPU Models Browser stills that show each Beautiful GLB, or (b) an explicit owner accept of CPU sheets as glance proof for Wave 95. Do not reopen class files for the Minor/Suggestions unless a later look serial is scheduled.
