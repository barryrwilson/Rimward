# UI Audit: BIO-06 living-ship MOTION picture (Wave 107)

**Auditor:** `[designer]` (independent of `out/w107/bio06/ui-audit.md`)  
**Scope:** Player-facing class-scaled living fin cadence. Motion only. First impl of Wave 104 merge law. No new HUD chrome by contract.  
**Review file:** `out/w107/bio06/designer-audit.md`  
**Worker file left untouched:** `out/w107/bio06/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against landed `src/game/living-cadence.js`, `src/systems/ship.js`, `src/systems/ship-assets.js`, HUD freeze paths, `out/w104/bio06/shared-contract.md` (merge law), `docs/Bio06CadenceDesign.md`, wishlist BIO-06 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1327–1342). Code review only. No `src/` edit.  
**Date:** 2026-08-24  
**Product source:** landed PR1–PR4 motion paths. No Vite. [NO BROWSER COVERAGE]. No QA stills under `out/w107/bio06/`.

## UI Audit: class-scaled living fin cadence (no new glass)

### Summary

The specified player outcome is **body language in space**, not a HUD widget. Light idle **0.5 Hz** and cruise **2.3 Hz** stay the quality bar. Larger living remounts and Beautiful NPC traffic take `hzScale` + `sweepScale`. The 80 px hub, Digit 0 shipyard, KeyO rows, and flap-rate color chrome are unchanged. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 3 minors, 2 suggestions.

A later serial that slows light 0.5 / 2.3, puts a cadence pip on `.rw-reticle`, steals Digit 0/8/9, adds a KeyO cadence row, sells flap as a HUD color, scales with one `mixer.timeScale`, kills player CPU swim under KeyO, or animates the living yard desk against inventory fails this picture.

### What's done well

- Fleet readability is **motion**. No toast, no Digit, no KeyO cadence row, no `commLine`. `hud.js` / `hud.css` have **zero** `cadence` / `swim` / `flap` hits.
- Empty hub freeze holds. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No cadence child.
- HUD still **reads** `player.hullKind` (`src/systems/hud.js` 86–87, 1079, 1720). HUD never writes `hullKind`.
- Digit 0 stays shipyard (`src/systems/station.js` 188 last of `DOCK_KEY_SERVICES`; 5904–5907 hotkey `0`). Digit 8 dock root is launch. Digit 9 dock root is epics / Standing. Cadence is not a dock verb. No new Digit.
- KeyO still toggles settings only (`src/systems/settings.js` 229–234). Checkbox rows stay colorblind / contrast / reduced motion / HUD audio / mute / hints (`src/systems/settings.js` 40–47). No cadence row.
- Light bar is numeric: `SWIM_IDLE_HZ` **0.5**, `SWIM_CRUISE_HZ` **2.3**, light `hzScale` **1.00**, `sweepScale` **1.00** (`src/game/living-cadence.js` 8–13). Player light path does not multiply those scales (`src/systems/ship.js` 960–976). Mood rates, `BREATH_HZ` 0.25, `HEART_HZ` 1.1 stay unscaled (`src/systems/ship.js` 150–163). GPU breath stays `0.25` (`src/systems/ship-assets.js` 87).
- Class table is monotonic on Hz (`light ≥ ace > cutter > heavy > frigate > freighter`) and inverse on sweep (`src/game/living-cadence.js` 12–19). Unknown / proto keys fail closed to light (`src/game/living-cadence.js` 21–26).
- Speed still answers **inside** a class. Player light Hz uses `min(speedNorm, 1)` (`src/systems/ship.js` 972–974). Other living remounts and Beautiful NPC norm to `classCruise` (`src/systems/ship.js` 964–968; `src/systems/ship-assets.js` 501–508). Afterburner does not raise Hz past cruise.
- NPC `uSwimAmp` stays the reducedMotion gate 0/1 (`src/systems/ship-assets.js` 506). `uSwimSweep` is a new float, not overloaded amp (`src/systems/ship-assets.js` 62, 92, 509). Mixer still `setTime(elapsed)` only (`src/systems/ship-assets.js` 494). No `mixer.timeScale`.
- Built plated still skips CPU swim (`src/systems/ship.js` 1042–1044). Living yard preview stays `update: null` (`src/systems/yard-preview.js` 115).
- Flap rate is **stroke**, not a HUD color. Mood tints live on hull emissive (`src/systems/ship.js` 154–163, 1025–1040), not on the reticle or RANGE.

### Task checklist (player outcome)

| Check | Spec | Result |
|---|---|---|
| HUD-01 empty 80 px hub, no cadence child | contract §0.2; `hud.css` 184–193; `hud.js` 709–712 | **Pass** |
| Digit 0 shipyard; no new Digit | contract §0.3; `station.js` 188, 5904–5907 | **Pass** |
| No KeyO cadence row | contract §4; `settings.js` 40–47, 229–234 | **Pass** |
| Light visual bar 0.5 / 2.3, scales 1.00 | contract §0.10; `living-cadence.js` 8–13; `ship.js` 971–975 | **Pass** |
| No color-only HUD for flap rate | settings §18.4; no hud.js/css cadence color | **Pass** |
| Class-readable cadence gradient | wishlist 1335–1338; table `living-cadence.js` 12–19 | **Pass** from cutter up. Ace vs light is a 4% table step (🟡). |
| Speed still intensifies inside a class | contract §2; `ship.js` 964–974; `ship-assets.js` 501–508 | **Pass** |
| reducedMotion live split honored | contract §0.16; NPC amp 0; player CPU ungated | **Pass** (preserve, do not “fix”) |
| Yard living preview stays static | `yard-preview.js` 115 | **Pass** |
| Contrast / type / focus / hover | no new chrome | N/A |
| innerHTML | none this serial | **Pass** |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Ace vs light is monotonic on paper, not class-readable in a glance

**Location:** `src/game/living-cadence.js` 13–14 ace `hzScale` 0.96 (idle 0.48 / cruise 2.21) vs light 1.00 (0.50 / 2.30).

**Issue:** Wishlist BIO-06 asks each larger class to move more slowly than the class below it (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1337–1338). Ace cruise is **4%** slower than light. A side-by-side chase will not sell “ace vs light” as a fleet step. Cutter 1.84, heavy 1.43, frigate 1.01, freighter 0.69 **do** sell the gradient. This is the Wave 104 deputize table, now live.

**Fix:** None this leftover. Keep ace near light (size twins). Do not invent hub Hz labels to “prove” the 0.04 gap. Playtest the cutter-and-up row.

**Status:** accept; table stays monotonic.

#### 🟡 Minor: `sweepScale` now stacks on live size amp (rubbery-fin playtest)

**Location:** `src/systems/ship.js` 970 `flapAmp = (0.16 + 0.5 * Math.min(speedNorm, 1.5)) * restScale * cadence.sweepScale`; GPU `flapAmp = 0.045 * sz` (`src/systems/ship-assets.js` 85) × `uSwimSweep` (`src/systems/ship-assets.js` 92, 509). Freighter `sweepScale` **2.00** (`src/game/living-cadence.js` 18) on top of restScale (`src/systems/ship.js` 257–260).

**Issue:** Size already grows flap. Extra sweep is the right intent (force, follow-through, not frozen). Stacked 2× on a hull that is already `target / P` can read as rubber at idle or cruise. Wave 104 named this; Wave 107 lands the multiply. No chase still exists to confirm the glance.

**Fix:** Playtest heavy / frigate / freighter at idle and cruise. If jelly, retune `sweepScale` floats only. Do not raise Hz back to 2.3. Do not add a HUD “sweep” pip.

**Status:** deputize + playtest; not a chrome defect.

#### 🟡 Minor: KeyO reduced motion still leaves the player living hull swimming

**Location:** `src/systems/ship.js` 953–1008 (no `reducedMotion` gate on the CPU vertex loop); trail/shake do gate (`src/systems/ship.js` 1069–1103, 1189); NPC amp 0 (`src/systems/ship-assets.js` 506).

**Issue:** Vestibular users see a full CPU manta while Beautiful traffic and station organics freeze. That split is **live inventory**, not introduced here. Killing player swim would weaken the quality bar this leftover exists to protect.

**Fix:** None this leftover. Honor contract §0.16. Do not paper the split with a hub badge or a settings extra checkbox.

**Status:** accept; document in player outcome.

#### 💡 Suggestion: Digit 0 living SKU still does not preview the new stroke

**Location:** `src/systems/yard-preview.js` 93–116 `update: null`; plated preview `animateShipMesh` (`src/systems/yard-preview.js` 126–127) can idle-swim at class Hz.

**Issue:** A buyer of living heavy sees a still sculpt. Plated Beautiful at the same desk may idle-swim at class Hz. Fleet cadence is readable **in space** (traffic + remount), not at the desk.

**Fix:** Do not add a CPU vertex loop on Digit 0 in this leftover. Owner may open a later desk-motion serial.

**Status:** frozen; honor inventory.

#### 💡 Suggestion: Side-by-side acceptance is a chase-cam playtest, not a RANGE overlay

**Location:** wishlist BIO-06 acceptance; this wave has no stills under `out/w107/bio06/`.

**Issue:** Reviewers will want “see all classes.” Temptation is Hz text on the 80 px hub, a debug Digit, or a color-coded flap meter. This pass is code-only ([NO BROWSER COVERAGE]).

**Fix:** Later playtest: Beautiful traffic + hangar remounts. No RANGE rewrite. No `textContent` Hz on the pupil. No flap color on HUD.

**Status:** contract §0.2 already forbids hub chrome.

### Accessibility / states / theming (scope)

- **Keyboard:** No new bind. KeyO stays settings (`src/systems/settings.js` 230). Digit 0/8/9 stay (`src/systems/station.js` 188, 5904–5907).
- **Names:** No new control. No cadence SKU string.
- **States:** No loading / empty / error / disabled / hover chrome. Motion states are idle / cruise / burn on existing hulls.
- **Theming:** No new CSS. No hardcoded cadence HUD color. Flap is Hz/sweep, not a hue.
- **Responsive:** No new layout. Hit targets unchanged.
- **Motion:** Cadence is the feature. `reducedMotion` NPC freeze stays. Player living CPU stays on (live). No new HUD `@keyframes`.
- **Contrast:** N/A (no new type). Color-only flap HUD is absent (required).

### Player-facing motion picture (landed)

1. **Light / young (player bar):** same living manta. Idle hush 0.5 Hz, cruise 2.3 Hz, mood still quickens her. Unknown classKey → this envelope.
2. **Ace:** still a racer. Stroke is almost the light ship. Do not expect a readable class step vs light.
3. **Cutter:** first glanceable step down. Fins still answer speed.
4. **Heavy:** long gunship sweeps. High speed is **not** a blur of 2.3 Hz flaps (cap 1.43 Hz).
5. **Frigate:** capital stroke (~1 Hz at its cruise). Idle still moves.
6. **Freighter:** slow powerful sweeps (cruise 0.69 Hz). Idle ~6.7 s/stroke, not a statue.

Beautiful traffic matches that gradient on the GPU path (`uSwimHz` × `hzScale`, flap × `uSwimSweep`). They do not become extra player CPU whales. Unknowables **player** remount still `makeLivingHull`, scaled by classKey not faction.

KeyO still freezes Beautiful NPC swim and station organics. The player living hull still lives. The 80 px hub stays empty. Digit 0 is still shipyard. No one sells “cadence.”

### Picture vs this serial (fail conditions)

These would have been findings. They did not land:

1. Changing light idle 0.5 / cruise 2.3 / mood rates, or setting light `hzScale` ≠ 1.00, is a 🔴 Blocker (quality bar). **Not present.**
2. Adding a child to `.rw-reticle` (fin pip, class disc, Hz readout) is a 🔴 Blocker (HUD-01). **Not present.**
3. Binding Digit 0/8/9 to a cadence pane, minting a KeyO cadence row, or a color-only flap HUD is a 🔴 Blocker. **Not present.**
4. One `mixer.timeScale` / global `dt` / single `uTime` scale on clip + swim + breath is a 🔴 Blocker. **Not present.**
5. Cloning `makeLivingHull` onto NPC traffic is a 🔴 Blocker. **Not present.**
6. Killing player CPU swim under `reducedMotion` is a 🟠 Major. **Not present** (split preserved).
7. Animating living yard preview (`yard-preview.js` 115) is a 🟠 Major. **Not present.**
8. Keeping NPC `/ 120` after `hzScale`, or dropping sweep so large fins freeze, is a 🟠 Major. **Not present** (`classCruise` + `uSwimSweep`).

### Verdict (repeat)

**CLEAN.** Specified player outcome is a silent, class-readable stroke gradient that keeps the light living ship as the bar, keeps speed inside each class, honors the live reducedMotion split, and adds no hub / Digit / KeyO / color HUD chrome.
