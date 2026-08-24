# UI Audit: BIO-06 living-ship MOTION picture (Wave 104)

**Auditor:** `[designer]` (independent of `out/w104/bio06/ui-audit.md`)  
**Scope:** Player-facing living-fin cadence picture. Design-only. No product chrome this wave.  
**Review file:** `out/w104/bio06/designer-audit.md`  
**Worker file left untouched:** `out/w104/bio06/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Bio06CadenceDesign.md`, `out/w104/bio06/shared-contract.md` (merge law wins), `out/w104/bio06/current-bio06-inventory.md` (code wins), wishlist BIO-06 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1303–1339). Live cites checked; no `src/` edit.  
**Date:** 2026-08-23  
**Product source:** spec + live motion paths. No Vite. [NO BROWSER COVERAGE].

## UI Audit: class-scaled living fin cadence (no new glass)

### Summary

The specified player outcome is **body language in space**, not a HUD widget. Small living hulls stay quick. Large hulls stroke slower and heavier. Light remains the quality bar (`hzScale` / `sweepScale` **1.00**). Speed still answers inside a class. The pack does not add a hub child, a Digit, a cadence SKU, or a BIO-07 Earth-animal animation spec. Yard living preview stays a still sculpt. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 3 minors, 2 suggestions.

Later serials fail this picture if they slow light 0.5 / 2.3, put a cadence pip on `.rw-reticle`, steal Digit 0/8/9, sell cadence as a SKU, scale with one `mixer.timeScale`, kill player CPU swim under KeyO, or animate the living yard desk against inventory.

### What's done well

- Fleet readability is **motion**. No toast, no Digit, no KeyO row, no `commLine` (`out/w104/bio06/shared-contract.md` §4). A player does not need a legend to see mass.
- Empty hub freeze is explicit. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). Contract §0.2 forbids a fin meter, class disc, or swim chrome inside the reticle.
- HUD still **reads** `player.hullKind` (`src/systems/hud.js` 86–87, 1079, 1720). HUD never writes `hullKind`. Both families keep the same glance set.
- Digit 0 stays shipyard (`src/systems/station.js` 185 last of `DOCK_KEY_SERVICES`; 6028–6030). Digit 8 dock root is launch. Digit 9 dock root is epics. Cadence is not a dock verb (contract §0.3).
- Light bar is numeric, not a slogan: idle **0.5 Hz**, cruise **2.3 Hz**, `hzScale` **1.00**, `sweepScale` **1.00** (contract §0.10; `src/systems/ship.js` 144–145, 954–956). Mood, breath 0.25, heart 1.1 stay unscaled. Keen / feral still quicken **that** ship.
- Class table is monotonic on Hz (`light ≥ ace > cutter > heavy > frigate > freighter`) and inverse on sweep (`out/w104/bio06/shared-contract.md` §0.1). Heavy cruise 1.43 Hz, frigate 1.01, freighter 0.69 — none can show the live 2.3 Hz panic flap.
- Speed still intensifies **inside** a class: idle → cruise vs **that** class’s cruise, Hz cap at cruise (`min(speedNorm, 1)`). Afterburner does not raise Hz. Player flap may still grow to `1.5` (live `ship.js` 950, 958–959). Wishlist “stick still answers” holds without a universal multiplier.
- NPC denom switch from `/ 120` to class cruise (`src/systems/ship-assets.js` 48, 467–470 today) is the frantic-fin fix for Beautiful heavies that hit 120 u/s. Player heavy remount already norms to 90 (`src/game/hangar.js` 568 + `ship.js` 950); PR2 must apply `hzScale` there or the worst CPU case stays 2.3 Hz.
- Sweep rises as Hz falls, so large fins are not a still statue. Freighter idle floor **0.15 Hz** (~6.7 s/stroke) is named as the freeze floor (`docs/Bio06CadenceDesign.md` 203).
- Universal `mixer.timeScale` / global `dt` / one `uTime` scale on clip + swim + breath is forbidden (contract §0.11). Idle GLB clip stays timeScale 1. Station organics stay `animateOrganic` (`src/systems/organic.js` 647–648).
- `makeLivingHull` stays the player living mesh (`src/systems/ship.js` 274–334). NPCs stay GLB + GPU. No clone onto traffic.
- reducedMotion honors the **live split** (`out/w104/bio06/current-bio06-inventory.md` §6): NPC `uSwimAmp = 0` and mixer skip (`src/systems/ship-assets.js` 459, 469); station organics no-op (`organic.js` 647–648); player living CPU vertex loop has **no** `reducedMotion` gate (`ship.js` 948–993). Contract §0.16 forbids “fixing” the hero ship.
- Living yard preview stays `update: null` (`src/systems/yard-preview.js` 93–116). This serial does not sneak a second CPU swim onto Digit 0.
- BIO-07 species bodies are one-line leftover, not this picture. “Panicked ray” in the brief (`docs/Bio06CadenceDesign.md` 248) names the **current bad look**, not an Earth-animal cycle to implement.
- No persist key, no `SHIP_CLASSES` cadence field, no innerHTML, no new DOM.

### Task checklist (player outcome)

| Check | Spec | Result |
|---|---|---|
| Class-readable cadence gradient (small fast / large slow) | wishlist 1311–1314; deputize table | **Pass** from cutter up. Ace vs light is a 4% table step, not a glance (💡). |
| Player living quality bar not weakened (light = 1.00) | contract §0.10; wishlist 1332–1333 | **Pass** |
| Speed still intensifies inside a class | contract §2; wishlist 1318–1320 | **Pass** |
| reducedMotion live split honored | inventory §6; contract §0.16 | **Pass** (preserve, do not “fix”) |
| No HUD-01 hub child | contract §0.2; `hud.css` 184–193; `hud.js` 709–712 | **Pass** |
| No new Digit | contract §0.3; `station.js` 185 | **Pass** |
| No cadence SKU chrome | contract §0.6, §6 | **Pass** |
| Not a literal Earth-animal animation spec | BIO-07 leftover; wishlist 1341–1380 out of scope | **Pass** |
| Yard living preview stays static | inventory §7; `yard-preview.js` 115; contract §1.3 | **Pass** |
| Contrast / type / focus / hover | no new chrome | N/A |
| innerHTML | none this serial | **Pass** |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Ace vs light is monotonic on paper, not class-readable in a glance

**Location:** `out/w104/bio06/shared-contract.md` §0.1 ace `hzScale` 0.96 (idle 0.48 / cruise 2.21) vs light 1.00 (0.50 / 2.30); charter `ace ~= light` (`src/game/ship-scale.js` 32).

**Issue:** Wishlist BIO-06 asks each larger class to move more slowly than the class below it (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1313–1314). Ace cruise is **4%** slower than light. A side-by-side chase will not sell “ace vs light” as a fleet step. Cutter 1.84, heavy 1.43, frigate 1.01, freighter 0.69 **do** sell the gradient.

**Fix:** None this leftover. Keep ace near light (size twins). Do not invent hub Hz labels to “prove” the 0.04 gap. Playtest the cutter-and-up row.

**Status:** accept; table stays monotonic.

#### 🟡 Minor: `sweepScale` stacks on live size amp (rubbery-fin playtest)

**Location:** contract §0.1 formulas: `playerFlap = (0.16 + 0.5 * …) * restScale * sweepScale`; GPU `flapAmp = 0.045 * sz` (`src/systems/ship-assets.js` 76–77) × `uSwimSweep`; `livingRestScale` already `target / P` (`src/systems/ship.js` 252–256). Freighter `sweepScale` **2.00** on top of `sz` / restScale.

**Issue:** Size already grows flap. Extra sweep is the right *intent* (wishlist: force, follow-through, not frozen). Stacked 2× on a hull that is already ~`78 / 6.6` restScale can read as rubber if PR2/PR3 multiply blindly. Acceptance already names “not rubbery” (`docs/Bio06CadenceDesign.md` 275).

**Fix:** Later playtest heavy / frigate / freighter at idle and cruise. If jelly, retune `sweepScale` floats only. Do not raise Hz back to 2.3. Do not add a HUD “sweep” pip.

**Status:** deputize + playtest; not a chrome defect.

#### 🟡 Minor: KeyO reduced motion still leaves the player living hull swimming

**Location:** `src/systems/ship.js` 948–993 (no gate); trail/shake do gate (`ship.js` 1050–1084, 1170); NPC amp 0 (`ship-assets.js` 469).

**Issue:** Vestibular users see a full CPU manta while Beautiful traffic and station organics freeze. That split is **live inventory**, not introduced here. Killing player swim would weaken the quality bar the leftover exists to protect.

**Fix:** None this leftover. Honor inventory §6 and contract §0.16. Do not paper the split with a hub badge or a settings extra checkbox.

**Status:** accept; document in player outcome.

#### 💡 Suggestion: Digit 0 living SKU will not preview the new stroke

**Location:** `src/systems/yard-preview.js` 93–116 `update: null`; plated preview `animateShipMesh` with no speed (`119–128`) → idle after PR3; turntable skip under reducedMotion (`381`).

**Issue:** A buyer of living heavy sees a still sculpt. Plated Beautiful at the same desk may idle-swim at class Hz after PR3. Fleet cadence is readable **in space** (traffic + remount), not at the desk. Inventory says keep living preview static.

**Fix:** Do not add a CPU vertex loop on Digit 0 in this leftover. Owner may open a later desk-motion serial.

**Status:** frozen; honor inventory.

#### 💡 Suggestion: Side-by-side acceptance is a chase-cam playtest, not a RANGE overlay

**Location:** wishlist BIO-06 acceptance (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1326–1327); contract §9; brief player outcome (`docs/Bio06CadenceDesign.md` 242–254).

**Issue:** Reviewers will want “see all classes.” Temptation is Hz text on the 80 px hub or a debug Digit.

**Fix:** Later playtest: Beautiful traffic + hangar remounts. No RANGE rewrite. No `textContent` Hz on the pupil.

**Status:** contract §0.2 already forbids hub chrome.

### Accessibility / states / theming (scope)

- **Keyboard:** No new bind. Do not steal KeyT / KeyV / KeyK / KeyX / KeyO (contract §4). Digit 0/8/9 stay.
- **Names:** No new control. No cadence SKU string.
- **States:** No loading / empty / error / disabled / hover chrome. Motion states are idle / cruise / burn on existing hulls.
- **Theming:** No new CSS. No hardcoded cadence color.
- **Responsive:** No new layout. Hit targets unchanged.
- **Motion:** Cadence is the feature. `reducedMotion` NPC freeze stays. Player living CPU stays on (live). No new HUD `@keyframes`.
- **Contrast:** N/A (no new type).

### Player-facing motion picture (later serial; freeze here)

1. **Light / young (player bar):** same living manta as today. Idle hush 0.5 Hz, cruise 2.3 Hz, mood still quickens her. Do not flatten her to match the fleet.
2. **Ace:** still a racer. Stroke is almost the light ship. Do not expect a readable class step vs light.
3. **Cutter:** first glanceable step down. Fins still answer speed. Stroke is slower and a little heavier at **that** cruise.
4. **Heavy:** long gunship sweeps. High speed is **not** a blur of 2.3 Hz flaps (cap 1.43 Hz).
5. **Frigate:** capital stroke (~1 Hz at its cruise). Mass and follow-through. Idle still moves.
6. **Freighter:** slow powerful sweeps (cruise 0.69 Hz). Idle ~6.7 s/stroke, not a statue. Never the light ship’s 2.3 Hz flap.

Beautiful traffic matches that gradient on the GPU path. They do not become extra player CPU whales. Unknowables NPC stay idle-clip only. Unknowables **player** remount still `makeLivingHull`, scaled by classKey not faction.

KeyO still freezes Beautiful NPC swim and station organics. The player living hull still lives. The 80 px hub stays empty. Digit 0 is still shipyard. No one sells “cadence.”

**BIO-07** (distinct species bodies, non-literal ocean forms) is **not** this work. Do not retarget this leftover into squid pulses or dolphin kicks.

### Picture vs later serial (fail conditions)

These are not findings in Wave 104. They are the bar for PR1–PR4:

1. Changing light idle 0.5 / cruise 2.3 / mood rates, or setting light `hzScale` ≠ 1.00, is a 🔴 Blocker (quality bar).
2. Adding a child to `.rw-reticle` (fin pip, class disc, Hz readout) is a 🔴 Blocker (HUD-01).
3. Binding Digit 0/8/9 to a cadence pane, or minting a cadence SKU / UU, is a 🔴 Blocker.
4. One `mixer.timeScale` / global `dt` / single `uTime` scale on clip + swim + breath is a 🔴 Blocker (forbidden universal multiplier).
5. Cloning `makeLivingHull` onto NPC traffic is a 🔴 Blocker (perf + BIO-03).
6. Killing player CPU swim under `reducedMotion` is a 🟠 Major (silent a11y “fix” that weakens the bar).
7. Animating living yard preview (`yard-preview.js` 115) in this leftover is a 🟠 Major (inventory static).
8. Speccing literal Earth-animal cycles (BIO-07) inside BIO-06 is a 🟠 Major (scope smash).
9. Keeping NPC `/ 120` after `hzScale` so frigates never reach a class cruise stroke, **or** dropping sweep so large fins freeze, is a 🟠 Major (wishlist miss).

### Verdict (repeat)

**CLEAN.** Specified player outcome is a silent, class-readable stroke gradient that keeps the light living ship as the bar, keeps speed inside each class, honors the live reducedMotion split, and adds no hub / Digit / SKU chrome.
