# UI Audit: BIO-08 later-chrome freeze (Wave 107)

**Auditor:** `[designer]` (independent of `out/w107/bio08/ui-audit.md`)
**Scope:** Later-chrome freeze for anatomy-native locomotion. Design-only. No running UI this wave.
**Review file:** `out/w107/bio08/designer-audit.md`
**Worker file left untouched:** `out/w107/bio08/ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Bio08LocomotionDesign.md` and merge law `out/w107/bio08/shared-contract.md` (contract wins). Live cites checked read-only: `src/ui/hud.css` 184–193, `src/systems/hud.js` 81–89 and 709–712, `src/systems/station.js` 188 / 5904–5908 / 6038–6047, `src/systems/yard-preview.js` 89 / 93–116, `src/systems/ship.js` 151–162 / 279–339 / 551–565 / 953–1009, `src/game/living-cadence.js` 8–26. Did not edit product source. Did not start Vite. [NO BROWSER COVERAGE] [NO SCREENSHOTS].
**Date:** 2026-08-24
**Product source:** not edited.

## UI Audit: BIO-08 locomotion chrome freeze (no new glass)

### Summary

The player-facing leftover is **body language in space**, not a HUD widget. Both the brief and the contract freeze the 80 px HUD-01 hub, Digit 0 shipyard, no new Digit, static Digit 0 living preview, and the player **light** CPU quality bar. Picture is shark kick / squid pulse / whale fluke / octopus trail. No gait pip, species disc, toast, or desk swim is specified. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN** for later-chrome freeze. 0 blockers, 0 majors, 4 minors, 1 suggestion.

A later serial that adds a gait pip or species disc to `.rw-reticle`, invents a Digit, binds locomotion as a desk verb, starts a second CPU swim on Digit 0 living preview, or rewrites player light idle 0.5 / cruise 2.3 / breath / heart fails this picture as a 🔴 Blocker even if the gait floats are correct.

### What's done well

- Fleet identity is **motion**, not a label (`docs/Bio08LocomotionDesign.md` §6 Picture; contract §3, §4). No new string, toast, `commLine`, KeyO row, or RANGE rewrite.
- HUD-01 empty hub is law: no locomotion meter, gait pip, or species disc on the aim glass. RANGE stays TGT-01. Do not put swim chrome inside `.rw-reticle` (contract §0.2; brief Honor + Goals 7 + Non-goals). Live hub is 80×80 (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712).
- HUD-02 stays closed. HUD **reads** `player.hullKind` and **never writes** it (contract §0.5; `src/systems/hud.js` 81–89). Both HUD families keep the same glance set.
- Digit 0 stays **shipyard**. Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting 8/9 stay papers. **No new Digit.** Cadence/locomotion is **not** a dock verb (contract §0.3; brief Non-goals + §5 PR1). Live map: `DOCK_KEY_SERVICES` last entry `shipyard` with hotkey `0` (`src/systems/station.js` 188, 5904–5908, 6041–6043).
- Copy / keys: **none** (contract §4). Do not steal KeyT / KeyV / KeyK / KeyX / KeyO.
- No new DOM this serial. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only (contract §0.4; brief Security). Contrast, focus rings, and hit targets do not apply: there is no new control.
- Yard living preview stays `update: null` (`src/systems/yard-preview.js` 89, 115; contract §0.17, Yard / catalog; brief Non-goals last bullet + §6). This leftover does not invent a second living animator on Digit 0.
- Player **light** quality bar is explicit: idle **0.5** Hz, cruise **2.3** Hz, mood rates, breath **0.25**, heart **1.1**, vein surge, live CPU sculpt. Do not rewrite the light vertex loop to shark weights. Do not clone `makeLivingHull` onto NPCs. Do not retune BIO-06 `LIVING_CADENCE` (contract §0.1 player living, §0.9–0.10; brief §2–§3; live `src/game/living-cadence.js` 8–26; `src/systems/ship.js` 151–162, 279–339, 971–1009).
- Fail closed is the **live** spine+flap mix, never a stub mesh, never a second shader, never `mixer.timeScale` as gait (contract §0.1, §0.11, §10; brief Alternatives).
- Serial plan names the freeze on every PR. PR4 pins “Digit 0 shipyard; no persist key; no hub child” and forbids Digit 0 desk swim (contract §8; brief §5). First remaining serial is PR1 data in `living-gait.js`, not chrome.

### Later-chrome freeze checklist

| Check | Spec | Live cite | Result |
|---|---|---|---|
| 80 px hub empty of new children | contract §0.2, §6, §9.7; brief Goals 7 / Non-goals | `hud.css` 184–193; `hud.js` 709–712 | **Pass** |
| No gait pip / species disc / locomotion meter | contract §0.2; brief Pain points + Non-goals | no new `.rw-reticle` child specified | **Pass** |
| RANGE stays TGT-01 | contract §0.2 | `hud.js` 709–712 `RANGE` | **Pass** |
| No swim chrome inside `.rw-reticle` | contract §0.2 | hub children unchanged in spec | **Pass** |
| HUD never writes `hullKind` | contract §0.5; brief Honor | `hud.js` 81–89 read only | **Pass** |
| Digit 0 shipyard | contract §0.3; brief Honor / Digit 0 neighbour | `station.js` 188, 5904–5908, 6041–6043 | **Pass** (cite drift: see Minor) |
| Digit 8/9 unstolen | contract §0.3; brief Honor | dock `launch` / `epics`; outfitting papers | **Pass** |
| No new Digit | contract §0.3, §4, §6; brief Goals 5 | none specified | **Pass** |
| Locomotion is not a desk verb | contract §0.3; brief Neighbours Digit 0 | no Digit bind for gait | **Pass** |
| Yard living preview static | contract §0.17; brief §6 | `yard-preview.js` 93–116 `update: null` | **Pass** |
| No second CPU swim on Digit 0 | contract Explicit non-picks; brief Alternatives | `update: null` at 89 and 115 | **Pass** |
| Player light 0.5 → 2.3 / mood / breath / heart | contract §0.1, §0.10, §9.1; brief Player outcome | `living-cadence.js` 8–9; `ship.js` 151–162, 971–984 | **Pass** |
| Light CPU sculpt stays (not shark rewrite) | contract §0.1 Player living; brief §3 | `ship.js` 279–339, 997–1003 (Z kick none) | **Pass** |
| `makeLivingHull` not replaced / not NPC-cloned | contract §0.9; brief Goals 6 | remount `ship.js` 551–565 living CPU | **Pass** |
| No toast / KeyO row / persist / SKU | contract §4, §0.6–0.7; brief Non-goals | none specified | **Pass** |
| `innerHTML` | contract §0.4; brief Security | none this serial | **Pass** |
| reducedMotion NPC off / player living on | contract §0.14; brief Acceptance 6 | NPC `uSwimAmp` 0; player CPU ungated | **Pass** (preserve live) |
| Contrast / type / focus / hover | no new chrome | — | **N/A** |
| One GPU shader; gait = floats | contract §0.1; brief Goals 3 | later uniforms, not HUD | **Pass** (motion, not glass) |

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 0 freeze cites stale `station.js` line 185

**Location:** `docs/Bio08LocomotionDesign.md` inventory table (Digit 0 / 8 / 9 → `station.js` 185, 6026–6033); `out/w107/bio08/shared-contract.md` §0.3 (`station.js` 185, 6026–6030).

**Issue:** Live `DOCK_KEY_SERVICES` (last key `shipyard`) is `src/systems/station.js` **188**. Digit 0 bind is **6041–6043** (`d === 0` → last service). Menu hotkey `0` is **5906**. Line 185 is a comment. Range 6026–6030 is the keydown listener start, not the Digit 0 branch. The **law** is correct (Digit 0 = shipyard; no new Digit). A later serial that greps those stale lines can miss the live bind and steal Digit 0 by “nearby” edit.

**Fix:** Implementation wave: pin boot/grep on live `DOCK_KEY_SERVICES` last entry + `d === 0` bind, not on 185. Do not add a locomotion Digit to “make the cite true.” This markdown wave does not need a Digit.

**Status:** accept; freeze law holds; line numbers are stale vs live `src/`.

#### 🟡 Minor: Deputize `light` shark floats can tempt a player-CPU rewrite

**Location:** `docs/Bio08LocomotionDesign.md` §3 deputize table (`light` → `shark-caudal` 0.55 / 1.00 / 0.70 / 0.00) vs same section “Player **light** CPU ignores the shark row”; contract §0.1 Player living + Explicit non-picks “Rewrite player **light** CPU to match NPC shark = Forbidden.”

**Issue:** The quality bar is the live light sculpt (`ship.js` 971–1009: X spine, Y flap, **Z not kicked**, breath/heart radial). NPC light GPU **may** use `shark-caudal` (kickZ 0.70). A later PR2 that applies the table row to `classKey === 'light'` on the player would change idle hush and add a tail kick the live loop does not have. The honor text is present; the table still lists light as a first-class shark row.

**Fix:** PR2: `classKey === 'light'` bit-identical (contract §8). Keep shark weights for NPC light GPU and for non-light living remounts only. Do not paper a feel change with a hub “gait” pip.

**Status:** frozen in prose; watch PR2. Not chrome.

#### 🟡 Minor: Digit 0 living preview will not show gait

**Location:** `src/systems/yard-preview.js` 93–116 `update: null`; contract §0.17 and Yard / catalog; `docs/Bio08LocomotionDesign.md` §6 and Non-goals.

**Issue:** Living SKU on the shipyard desk is a still sculpt. After PR3, plated Beautiful preview may idle-mix at 0.5 Hz × BIO-06; living preview stays static. A buyer of living heavy will not see a fluke at the desk. That is the cost of “locomotion is not a desk verb.” Sneaking a CPU vertex loop into `makeLivingPreview` would be a second swim and Digit 0 theft.

**Fix:** None this leftover. Fleet gait is readable in space (and plated idle after PR3). Owner may open a later desk-motion serial. Do not bind Digit 0 to gait.

**Status:** frozen.

#### 🟡 Minor: Player living still swims when KeyO reduced motion is on

**Location:** `src/systems/ship.js` 953–1009 (no `reducedMotion` gate); contract §0.14; brief inventory `reducedMotion` player living **CPU swim still on**.

**Issue:** Vestibular users see a full CPU living hull while Beautiful traffic freezes (`uSwimAmp` 0). That split is **live**, not introduced here. Killing player swim would weaken the quality bar and change HUD-03 reduced-motion meaning for the hero ship. Adding a hub badge to “explain” the split would reopen HUD-01.

**Fix:** None this leftover. Contract §0.14 preserves the split. Do not paper it with chrome.

**Status:** accept; document in player outcome.

#### 💡 Suggestion: Side-by-side acceptance is chase-cam playtest, not a HUD overlay

**Location:** contract §9; `docs/Bio08LocomotionDesign.md` Acceptance direction; wishlist BIO-07 locomotion leftover (cited, not edited).

**Issue:** Reviewers will want to “see all gaits.” Temptation is a debug overlay of `gaitId` on the pupil, a species disc, or `textContent` on RANGE.

**Fix:** Later playtest: Beautiful traffic + hangar remounts. No RANGE rewrite. No gait id on the 80 px hub. Contract §0.2 already forbids hub chrome.

**Status:** optional; freeze already covers it.

### Accessibility / states / theming (scope)

- **Keyboard:** No new bind. Digit 0/8/9 stay. Do not steal KeyO.
- **Names:** No new control. Gait is silent visual (contract §4).
- **States:** No loading / empty / error / disabled / hover chrome. Motion identity is GPU floats + player CPU bias later.
- **Theming:** No new CSS. No hardcoded HUD color for gait.
- **Responsive:** No new layout. Hub stays 80 px. Hit targets unchanged.
- **Motion:** Gait is the leftover. reducedMotion NPC stay off. Player living CPU stay on. Do not add a reduced-motion HUD legend.
- **Contrast:** N/A (no new type).

### Player-facing motion picture (later serial; freeze here)

1. **Light / young (player bar):** same living sculpt as today. Idle 0.5 Hz, cruise 2.3 Hz, mood, breath, heart, veins. Do not flatten her. Do not apply shark kickZ on this CPU loop.
2. **Beautiful light / cutter traffic:** shark caudal + pectorals. Cutter is the same gait family, not a scaled-light **mesh** (mesh is BIO-07).
3. **Ace:** mantle pulse, arms trail; not manta wings (`flapY` 0.12).
4. **Heavy / freighter remount + traffic:** horizontal fluke, X/Z drive, Y quieter; BIO-06 still slows the freighter’s Hz. Player remount keeps `makeLivingHull` + breath/heart/veins.
5. **Frigate:** travel-pose octopus; mantle −Z, arms +Z; `radial` 0.28 stays below squid (no sunburst).
6. **Hub:** still 80 px + RANGE. No species disc. No gait pip.
7. **Digit 0:** still shipyard. Living preview still. No one sells “gait.”

### Picture vs later serial (fail conditions)

These are not extra findings on the integrator markdown. They are the bar:

1. Adding a child to `.rw-reticle` (gait pip, species disc, locomotion meter) is a 🔴 Blocker (HUD-01).
2. A new Digit, or stealing Digit 0/8/9 for locomotion, is a 🔴 Blocker.
3. A CPU vertex loop on Digit 0 living preview (`yard-preview.js` `update` non-null) is a 🔴 Blocker (second swim / desk verb).
4. Rewriting player light 0.5 / 2.3, mood, breath, heart, or replacing `makeLivingHull` is a 🔴 Blocker (quality bar).
5. `innerHTML`, persist `world.gait`, `SHIP_CLASSES.gait`, or a gait SKU is a 🔴 Blocker (closed chrome / owner impersonation).

### Spec agreement (contract wins)

Brief Honor, Goals 5–7, Non-goals, §4 Neighbours, §5–§6, Player outcome, Acceptance 1 / 6 / 7 match contract §0.2–0.5, §0.9–0.10, §0.17, §4, §6, §8–§9. No chrome conflict. If a later PR reads only the deputize table and skips the player-light honor sentence, contract §0.1 Player living still wins.

### Severity counts

| Severity | Count |
|---|---|
| 🔴 Blocker | 0 |
| 🟠 Major | 0 |
| 🟡 Minor | 4 |
| 💡 Suggestion | 1 |

### Method notes

Independent read of `docs/Bio08LocomotionDesign.md` and `out/w107/bio08/shared-contract.md`. Live HUD / Digit / yard / light-bar cites checked after the spec read. Compared worker `out/w107/bio08/ui-audit.md` last. Did not edit product source. Did not open a browser. Did not apply a code fix.
