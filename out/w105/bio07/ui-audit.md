## UI Audit: BIO-07 species-inspired living ship bodies brief (Wave 105)

### Summary

No product chrome ships this worker. This audit treats the pack as a **creature-picture spec** for Beautiful Ones **NPC** hulls — measured against the player CPU living bar, Wave 95 GLB traffic, HUD-01 empty 80 px hub, and bible §4.6 glance identity. Picture is **six sea-creature silhouettes in space**, not a HUD widget and not an Earth zoo. Hub theft is **not** proposed (Blocker if a later serial adds a species pip). Player `makeLivingHull` is **not** replaced (Blocker if later impl points `ship:player` at a GLB).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`.

### What's done well

- Player-facing change is **body language**: NPC Beautiful read as grown kin, not flesh on a mechanical hull. No new string, Digit, or toast.
- Empty hub freeze is explicit: no species disc on `.rw-reticle` (`hud.js` 709–712 RANGE stays TGT-01).
- HUD never writes `hullKind` (`hud.js` 81–89). Both families keep the same glance set; class identity is the mesh, not a label.
- Digit 0/8/9 stay shipyard / launch / Standing. Bodies are not a dock verb.
- Player bar: CPU manta still swims, breathes, beats, veins, thrust surge. Models Browser `ship:player` stays `makeLivingHull` (`model-catalog.js` 93–113).
- Light is **family** to the player, not a clone. Heavy is **shieldback muscle**, not fitted plates. Remaining four keep bible §4.6 glance without pretending they ship this worker.
- Plates README 100 already flags eyes, circular hollows, knife tips, mouth-cradles, shell mantles as concept-art artifacts. The pack repeats those as **must not**.
- Fail closed keeps the Wave 95 GLB rather than shipping a worse zoo mesh.
- Yard living SKU list is not a new shop UI. Catalog is not mutated.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Wave 95 GLBs still show box crease / well reads until a class actually bakes

**Location:** `anatomy.py` 834; `organs.py` 454, 492; `public/assets/ships/beautiful/*/lod0.glb`.

**Issue:** The player still sees mech fusion **today**. This leftover is markdown. Sibling PR1/PR2 may change light/heavy glance this wave; ace/cutter/frigate/freighter wait.

**Fix:** None in this worker. Contract §6 names serial. Do not paper the fusion with a HUD badge that says “living.”

**Status:** accept; picture is the later mesh.

#### 🟡 Minor: Player living still swims when KeyO reduced motion is on

**Location:** `ship.js` 948–965 (no `reducedMotion` gate on CPU swim); NPC GPU amp 0 (`ship-assets.js` 469).

**Issue:** Vestibular users see a full CPU manta while Beautiful traffic freezes. That split is **live**, not introduced here. Killing player swim would weaken the quality bar.

**Fix:** None this leftover. Do not add a reduced-motion HUD legend.

**Status:** accept; out of BIO-07.

#### 🟡 Minor: Living yard desk will not prove the new creature read in motion

**Location:** Digit 0 shipyard; player remount still `makeLivingHull` (`ship.js` 546–560).

**Issue:** Buying a living **heavy** still flies the CPU sculpt, not the NPC shieldback GLB. Traffic and Models Browser Beautiful class rows carry the BIO-07 picture. A buyer can confuse “my hull” with “their kin.”

**Fix:** Out of BIO-07. Do not steal Digit 0 to swap player remount onto NPC GLBs. Preserve law forbids it.

**Status:** frozen. Glance acceptance is Models Browser + in-system **NPC** Beautiful, plus the player bar beside them.

#### 💡 Suggestion: Side-by-side acceptance is a chase-cam silhouette test, not class-name chrome

**Location:** wishlist BIO-07 1378–1381; contract §0.1 glance table.

**Issue:** Reviewers will want to “see all classes.” Temptation is a debug overlay of class keys on the hub or `innerHTML` in Models Browser beyond live.

**Fix:** Later playtest: black silhouette + in-system. No RANGE rewrite. No `innerHTML` class names on the pupil.

**Status:** contract §5 already forbids hub chrome and `innerHTML` on this leftover.

### Glance identity checklist (creature picture)

| Check | Spec | Result |
|---|---|---|
| Light = young wayfinder, family not CPU clone | contract §0.1 | Pass (spec) |
| Heavy = shieldback muscle, not plates | contract §0.1 | Pass (spec) |
| Ace taut dart / cutter cradle / frigate elder / freighter gardenback | bible §4.6; later serial | Pass (glance frozen; geometry wait) |
| Not Earth photocopies | wishlist 1365–1366; plates README | Pass |
| Not one body scaled | wishlist 1361–1364 | Pass |
| Not kitbash flesh-on-hull | owner request; anti-rigidity table | Pass (spec) |
| No windows / nozzles / turrets / panel lines | bible 161; plates README 3 | Pass (spec) |
| Player bar preserve | `makeLivingHull` honor | Pass |
| No HUD chrome | hub 80 px; no species pip | Pass |
| No Digit / UU / SKU add | contract §5, §0.8 | Pass |

### HUD-01 / Digit / a11y / motion checklist

| Check | Spec | Result |
|---|---|---|
| 80 px hub empty of new children | contract §5 | Pass |
| No species pip / lock box | contract §5 | Pass |
| HUD never writes `hullKind` | `hud.js` 81–89 | Pass |
| Digit 0 shipyard | `station.js` 185 | Pass |
| `innerHTML` 0 on this leftover | modelsbrowser only, out of write-set | Pass |
| Wave 76 GPU stay; BIO-06 Hz not this picture | contract §0.10 | Pass |
| reducedMotion NPC amp 0 stay | `ship-assets.js` 469 | Pass |
| Player CPU swim stay | quality bar | Pass |

### What's not this picture

- BIO-06 fin cadence (other worker).
- Player remount topology.
- Earth dolphin/whale/squid toys.
- A “living” caption on the aim glass.
