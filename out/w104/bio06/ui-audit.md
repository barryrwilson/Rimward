## UI Audit: BIO-06 class-scaled living fin cadence brief (Wave 104)

### Summary

No product chrome ships this wave. This audit treats the pack as a **motion-picture spec** for later living-ship fins — measured against the player light CPU bar, Beautiful NPC GPU swim, HUD-01 empty 80 px hub, and live reducedMotion. Picture is **class-readable strokes in space**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a cadence pip). Player light feel is **not** slowed to match the fleet (Blocker if later impl changes 0.5/2.3).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`.

### What's done well

- Player-facing change is **body language**: small ships stay quick; large ships sweep slower. No new string, Digit, or toast.
- Empty hub freeze is explicit: no fin meter on `.rw-reticle` (`hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Both HUD families keep the same glance set. HUD never writes `hullKind` (`hud.js` 80–87).
- Digit 0/8/9 stay shipyard / launch / Standing. Cadence is not a dock verb.
- Speed still **answers the stick** inside a class (idle → cruise). Large max Hz stays below small max Hz — readable fleet gradient without a legend.
- Sweep scales up as Hz scales down, so heavies do not look frozen or disconnected from travel.
- Light player bar: mood, breath, heart, vein surge, idle hover stay. Keen/feral still quicken **that** ship.
- reducedMotion: Beautiful NPC swim amp 0 and mixer freeze stay (`ship-assets.js` 459, 469). Station organics still freeze (`organic.js` 647–648). Player living CPU swim **stays on** (live quality bar; not a new pulse `@keyframes` on the HUD).
- Yard living preview stays static (`yard-preview.js` 115). This serial does not invent a second living animator on Digit 0.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Player living still swims when KeyO reduced motion is on

**Location:** `ship.js` 948–993 (no `reducedMotion` gate); trail/shake do gate (`ship.js` 1050–1084, 1170).

**Issue:** Vestibular users see a full CPU manta while Beautiful traffic freezes. That split is **live**, not introduced here. Killing player swim would weaken the quality bar and change HUD-03 reduced-motion meaning for the hero ship.

**Fix:** None this leftover. Contract §0.16 preserves the split. Do not paper it with a HUD badge.

**Status:** accept; document in player outcome.

#### 🟡 Minor: Living yard preview will not show the new cadence

**Location:** `yard-preview.js` 93–116 `update: null`.

**Issue:** Digit 0 living SKU is a still sculpt. Fleet cadence is only readable in space (and plated Beautiful preview at **idle** Hz after PR3). A buyer of heavy living will not preview stroke rate at the desk.

**Fix:** Out of BIO-06. Do not steal Digit 0 to add a turntable CPU loop in this leftover. Owner may open a later desk-motion serial.

**Status:** frozen.

#### 💡 Suggestion: Side-by-side acceptance is a chase-cam playtest, not a HUD overlay

**Location:** wishlist BIO-06 acceptance; contract §9.

**Issue:** Reviewers will want to “see all classes.” Temptation is a debug overlay of Hz numbers on the hub.

**Fix:** Later playtest: traffic + hangar remounts. No RANGE rewrite. No `textContent` Hz on the pupil.

**Status:** contract §0.2 already forbids hub chrome.

### HUD-01 / Digit / a11y / motion checklist

| Check | Spec | Result |
|---|---|---|
| 80 px hub empty of new children | contract §0.2 | Pass |
| No cadence pip / lock box | contract §0.2 | Pass |
| Digit 0 shipyard | `station.js` 185, 6023–6025 | Pass |
| Digit 8/9 stay | contract §0.3 | Pass |
| HUD never writes `hullKind` | `hud.js` 80–87 | Pass |
| No new Digit / KeyO row | contract §4 | Pass |
| reducedMotion NPC swim off | `uSwimAmp = 0` | Pass (preserve) |
| reducedMotion player living | CPU swim stays | Pass (preserve live) |
| Light player 0.5→2.3 | contract §0.10 | Pass |
| Class gradient monotonic | deputize table | Pass |
| Large fins not frozen | sweepScale + 0.15 Hz floor | Pass (spec) |
| No universal timeScale | contract §0.11 | Pass |
| innerHTML | none | Pass |
| Contrast / type | no new UI | N/A (no chrome) |

### Player-facing motion picture (later serial)

1. **Light / young (player bar):** same living manta as today. Do not flatten her.
2. **Ace:** almost the light stroke; still a racer.
3. **Cutter:** visibly slower fins than light at the same *effort* (cruise of each class).
4. **Heavy:** long gunship sweeps; high speed does **not** become a blur of flaps.
5. **Frigate / freighter:** mass and follow-through; idle still a slow visible breath of the wings, not a statue.

No HUD sentence is required for that picture. If a later serial needs words, they do not belong on the 80 px hub.
