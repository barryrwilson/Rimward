# UI Audit: BIO-08 anatomy-native locomotion brief (Wave 107)

### Summary

No product chrome ships this wave. This audit treats the pack as a **motion-picture spec** for later living-ship gait — measured against the player light CPU bar, Beautiful NPC GPU swim, HUD-01 empty 80 px hub, and live reducedMotion. Picture is **anatomy-readable strokes in space**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a gait pip or species disc). Player light feel is **not** rewritten to a shark GPU (Blocker if later impl changes 0.5/2.3 or kills breath/heart).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **body language**: shark kick, squid pulse, whale fluke, octopus trail. No new string, Digit, or toast.
- Empty hub freeze is explicit: no locomotion meter, gait pip, or species disc on `.rw-reticle` (`hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Both HUD families keep the same glance set. HUD never writes `hullKind` (`hud.js` 81–89).
- Digit 0/8/9 stay shipyard / launch / Standing. Locomotion is not a dock verb.
- Speed still **answers the stick** inside a class (idle → cruise). BIO-06 Hz gradient remains the size language; gait is **shape of the stroke**.
- Light player bar: mood, breath, heart, vein surge stay. Keen/feral still quicken **that** ship.
- reducedMotion: Beautiful NPC swim amp 0, sweep 0, and mixer freeze stay (`ship-assets.js` 494, 506–509). Station organics still freeze (`organic.js` 647–648). Player living CPU swim **stays on** (live quality bar; not a new pulse `@keyframes` on the HUD).
- Yard living preview stays static (`yard-preview.js` 115). This serial does not invent a second living animator on Digit 0.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Player living still swims when KeyO reduced motion is on

**Location:** `ship.js` 953–1009 (no `reducedMotion` gate).

**Issue:** Vestibular users see a full CPU living hull while Beautiful traffic freezes. That split is **live**, not introduced here. Killing player swim would weaken the quality bar and change HUD-03 reduced-motion meaning for the hero ship.

**Fix:** None this leftover. Contract §0.14 preserves the split. Do not paper it with a HUD badge.

**Status:** accept; document in player outcome.

#### 🟡 Minor: Living yard preview will not show the new gait

**Location:** `yard-preview.js` 93–116 `update: null`.

**Issue:** Digit 0 living SKU is a still sculpt. Fleet gait is only readable in space (and plated Beautiful preview at **idle** mix after PR3). A buyer of living heavy will not preview a fluke at the desk.

**Fix:** Out of BIO-08. Do not steal Digit 0 to add a turntable CPU loop in this leftover. Owner may open a later desk-motion serial.

**Status:** frozen.

#### 🟡 Minor: Player remount of non-light living still uses the manta sculpt

**Location:** `ship.js` 279–339; contract §0.1 player living.

**Issue:** A player on a living **heavy** keeps `makeLivingHull` (manta/whale sphere), not the NPC humpback GLB. Gait **bias** can suggest a fluke; the silhouette will not match traffic. That is BIO-03/BIO-07 honor (do not clone GLB onto the player), not a HUD bug.

**Fix:** None this leftover. Player outcome already states the sculpt stays. Do not add a species name on RANGE to “explain” the mismatch.

**Status:** frozen.

#### 💡 Suggestion: Side-by-side acceptance is a chase-cam playtest, not a HUD overlay

**Location:** wishlist BIO-07 locomotion line; contract §9.

**Issue:** Reviewers will want to “see all gaits.” Temptation is a debug overlay of gait ids on the hub.

**Fix:** Later playtest: traffic + hangar remounts. No RANGE rewrite. No `textContent` gait id on the pupil.

**Status:** contract §0.2 already forbids hub chrome.

### HUD-01 / Digit / a11y / motion checklist

| Check | Spec | Result |
|---|---|---|
| 80 px hub empty of new children | contract §0.2 | Pass |
| No gait pip / species disc / lock box | contract §0.2 | Pass |
| Digit 0 shipyard | `station.js` 185, 6026–6030 | Pass |
| Digit 8/9 stay | contract §0.3 | Pass |
| HUD never writes `hullKind` | `hud.js` 81–89 | Pass |
| No new Digit / KeyO row | contract §4 | Pass |
| reducedMotion NPC swim off | `uSwimAmp = 0` | Pass (preserve) |
| reducedMotion player living | CPU swim stays | Pass (preserve live) |
| Light player 0.5→2.3 | contract §0.10 | Pass |
| One shader | contract §0.1 | Pass |
| No universal timeScale | contract §0.11 | Pass |
| innerHTML | none this serial | Pass |
| Contrast / type | no new UI | N/A (no chrome) |
| Focus rings / hit targets | no new controls | N/A |

### Player-facing motion picture (later serial)

1. **Light / young (player bar):** same living sculpt as today. Do not flatten her.
2. **Beautiful light / cutter traffic:** shark caudal + pectorals. Cutter is not a scaled light **mesh** (BIO-07).
3. **Ace:** mantle pulse, arms trail; not manta wings.
4. **Heavy / freighter:** horizontal fluke, X/Z drive, Y quieter; BIO-06 still slows the freighter’s Hz.
5. **Frigate:** travel-pose octopus; mantle −Z, arms +Z; not a sunburst.
6. **Hub:** still 80 px + RANGE. No species disc.
