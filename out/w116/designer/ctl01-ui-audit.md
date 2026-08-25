# UI Audit: CTL-01 later dock/jump prompt copy (Wave 116)

**review_file:** `out/w116/designer/ctl01-ui-audit.md`  
**Wave:** 116. Spec re-audit of later copy/layout. Review only. No product `src/` edits. No worker-doc edits. No Vite. No Chrome.  
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`  
**Guide:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`  
**Sources (read, not edited):** `docs/Ctl01DockBindDesign.md`; `out/w116/ctl01/shared-contract.md`; `out/w116/ctl01/current-ctl01-dock-bind-inventory.md`. Worker self-audit `out/w116/ctl01/ui-audit.md` read; **not** overwritten. Live cites checked against `src/` (code wins for inventory; this leftover does not ship chrome).  
**Scope:** later dock/jump prompt copy naming **KeyJ**; CONTROLS list; onboarding hint; hub **G** vs **J** at junctions; color not the only cue; players trained on D-to-dock.  
**Verdict:** **CLEAN**

### Summary

No product chrome ships this wave. Later PR1 reuses live `.rw-prompt` and must name **J** in text on the dock/jump family. Station and physical-gate chips become **J**. Hub chip stays **G**; jump moves to the verb as **J — Jump**. CONTROLS and onboarding strings move with the bind. Color on the key chip is not the only cue. No open Blocker or Major in the proposed later copy.

**Counts:** 🔴 Blocker **0** (open). 🟠 Major **0** (open). 🟡 Minor **4** (residuals / impl must-not). 💡 Suggestion **3**. Closed-in-freeze majors: **2**.

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Prompt names KeyJ (not color-only) | **Pass (spec).** Station `pKey='J'` + verb `Dock`. Physical gate `pKey='J'` + `Jump to <name>`. Hub names J in **verb**. Contract: letter in `pKey` and/or verb. Keep `textContent`. | design 248–252, 284; contract §0.14; `hud.js` 2127–2138, 2184–2185 |
| CONTROLS list | **Pass (spec).** Keep A/D strafe line. Hail/dock/camera line must say **J — dock** (em dash, same live shape). Help is init-time `el()` text, not `innerHTML`. | design 254; `controls.js` 343, 353; `hud.js` 1019–1023; contract §0.4, §0.15 |
| Onboarding hint | **Pass (spec).** `'J — dock'` / `'J — jump the gate'`. Show path stays `textContent`. Do not reset `world.onboarding.seen`. | design 253; `onboarding.js` 50, 53, 102, 104; contract §3 PR1 |
| Hub G vs J at junctions | **Pass (spec) if hub freeze wins.** Chip stays **G** (cycle). Verb `'route n/m · J — Jump to <name>'`. Do not steal KeyG. Do not set hub `pKey='J'`. | design 252, 284; inventory §5; `hud.js` 2132–2135; contract §0.1 KeyG forbidden |
| Color not the only cue | **Pass (spec).** Chip letter + verb. Palette comment already pairs color with text/shape. Colorblind remaps `--rw-accent` (chip fill). Contrast restyles `.rw-prompt`. | `hud.css` 4, 755–771, 1146–1151, 1169; contract §0.14 |
| Trained D-to-dock players | **Residual accepted.** In-zone prompt + always-on CONTROLS teach J. One-shot hints do not re-fire. Do not wipe `seen`. | design 320; `onboarding.js` 104; worker ui-audit minor |
| Empty hub / Digit / T V K X | **Pass.** No dock pip on aim glass. Digit 0/8/9 stay. No new control chrome. | contract §0.2; design 239–240 |
| `reducedMotion` | **n/a.** No new prompt animation. Existing HUD kill-all stays. | contract §0.13; `hud.css` 1183–1188 |
| Keyboard / title | **Pass (spec).** KeyJ is the named bind. Title capture swallows letters; Enter stays CONTINUE. Skip `pendingDock` while title / models / typing. | `title.js` 190–227; contract §0.12 |
| Fail closed copy vs bind | **Pass (spec).** Partial merge (bind without copy) is forbidden. PR1 lands copy **with** bind. | contract §2 “Partial merge”; design 289 |

### Required later copy (PR1; named only)

Do not invent a second prompt. Do not `innerHTML`. Exact player-facing strings:

| Surface | Later copy | Must not |
|---|---|---|
| Station in-zone | `pKey = 'J'`; `pVerb = 'Dock'` | Keep `pKey = 'D'` |
| Physical gate | `pKey = 'J'`; `pVerb = 'Jump to ' + destName` | Recolor chip and drop the letter |
| Lamplighter hub | `pKey = 'G'`; `pVerb = 'route n/m · J — Jump to ' + destName` | `pKey = 'J'` (hides cycle); leave `D — Jump` |
| CONTROLS strafe | `'A/D — lateral strafe (D = right)'` (unchanged) | Move strafe off D |
| CONTROLS hail/dock/camera | `'H — hail · J — dock · C — camera (chase / third / first-person)'` | `'J dock'` without em dash; steal C |
| CONTROLS hub | `'G — cycle hub route at a Lamplighter junction'` (unchanged) | Drop G because jump moved |
| Onboarding dock | `'J — dock'` | Reset `seen`; keep `'D — dock'` |
| Onboarding gate | `'J — jump the gate'` | Teach G as jump |

Live writers today: `hud.js` 2127–2138; `controls.js` 343, 353, 356; `onboarding.js` 50, 53. HUD-02 sibling may shift `hud.js` lines; impl re-greps `pKey = 'D'` / hub `'D — Jump'`.

### What's done well

- Reuses live `.rw-prompt` / `.rw-prompt-key` / `.rw-prompt-verb` (`hud.js` 837–839). No new widget, no hub pip, no Digit.
- Live prompt already writes **text** (`promptKey.textContent`, `promptVerb.textContent` at `hud.js` 2184–2185). Letter + verb, not color-only.
- Same key for dock and jump keeps one prompt family (inbox: displayed gate or dock prompt).
- Hub already teaches two keys (chip G, verb embeds jump). PR1 only swaps the embedded letter D→J. Cycle stay G.
- CONTROLS is real `<li>` text from `config.controls` via `el()` (`hud.js` 1019–1023). `innerHTML` forbidden later (contract §0.4).
- Onboarding is `textContent` (`onboarding.js` 102). WAVE6 pin moves with the string.
- High-contrast body already includes `.rw-prompt` (`hud.css` 1169). Colorblind remaps `--cyan` through `--rw-accent` (`hud.css` 1146–1151); chip still holds a letter.
- Title legend stays 1–n / click; Enter remains CONTINUE, not dock (`title.js` 217–222). Typing J on title does not jump.
- Deputize KeyJ is unused in `src/` and mnemonic; KeyD stays the painted strafe key in the A/D help line.
- Contract forbids landing the bind without copy, so veterans are not left with a lying D prompt after remap.
- PR2 dual-chip is optional polish on the **existing** prompt, not a second bottom instrument.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Painted D currently lies against movement

**Location:** `src/systems/hud.js:2127-2138`; `src/systems/controls.js:274-276`, `440`

**Issue:** The prompt teaches D for Dock/Jump. A tap also sets `strafeX` right and can leave the zone. That is the P0 leftover.

**Fix landed (markdown):** PR1 names **J** on prompt, onboarding, and CONTROLS. KeyD stays A/D strafe only. Movement keys must not emit dock/jump (contract §0.3).

**Status:** closed in contract §0.1 / §0.3. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): Color-only key chip

**Location:** `src/ui/hud.css:755-765`; contract §0.14

**Issue:** A later “just recolor the chip” (or drop `pKey`) would fail if the letter were removed. Colorblind / contrast modes still need a named key.

**Fix landed:** Prompt **must name** the new key in text (`pKey` and/or verb). Keep the letter on `.rw-prompt-key`. Hub verb includes `J — Jump`.

**Status:** closed in contract §0.14.

#### 🟡 Minor: Picture line can be read as hub `pKey = 'J'`

**Location:** `docs/Ctl01DockBindDesign.md:238` vs `252`, `284`; live `src/systems/hud.js:2132-2135`

**Issue:** §6 says “The painted key becomes **J**.” Player outcome then says a gate zone “Prompt names **J**.” A hub **is** a gate zone. An implementer who only follows those two sentences can set hub `pKey = 'J'` and hide cycle on the chip. Acceptance and inventory keep chip **G** and put J in the verb.

**Fix:** PR1 treats hub as the special case: keep `pKey = 'G'`; replace only `D — Jump` → `J — Jump` in `pVerb`. Do not add a second prompt. Optional PR2 dual-chip is skippable.

**Status:** open residual for the impl wave (spec already specializes hub). Not a Wave 116 product defect. This auditor does not edit the worker docs.

#### 🟡 Minor: Players trained on D-to-dock

**Location:** `src/systems/onboarding.js:50,53,104`; `src/systems/controls.js:353`; design 320

**Issue:** Muscle memory. Hints fire once (`seen` push on show). Existing saves will **not** re-show dock/gate hints after the string change.

**Fix:** PR1 still updates hint **source strings** (WAVE6 pin). CONTROLS list always shows J. In-zone prompt is the teacher for veterans. Do not reset `world.onboarding.seen` (persist/behavior surprise; no new persist key).

**Status:** accepted residual. Call out in notes. Not a blocker: two always-on surfaces name J.

#### 🟡 Minor: Hub row chip stays G while jump is J in the verb

**Location:** `src/systems/hud.js:2132-2135`; design 252

**Issue:** After PR1 the large chip is still G. Jump is the second clause in the verb. Easy to “simplify” by making the chip J and hiding cycle. Live already uses this two-key pattern with D in the verb.

**Fix:** Keep G as cycle. Name J in the verb. Do not steal KeyG (contract §0.1). CONTROLS already lists G for hub cycle (`controls.js` 356) — leave that line.

**Status:** accepted; do not steal G. Same as worker self-audit.

#### 🟡 Minor: CONTROLS player-outcome shorthand vs live list shape

**Location:** `docs/Ctl01DockBindDesign.md:254`; live `src/systems/controls.js:353`

**Issue:** Player outcome says “hail / **J dock** / camera.” Live is `'H — hail · D — dock · C — camera (chase / third / first-person)'`. A source-literal of `'J dock'` (no em dash, no C clause) would look unlike every other help line and could drop camera.

**Fix:** Replace only the dock token: `'H — hail · J — dock · C — camera (chase / third / first-person)'`. Keep the A/D strafe line unchanged so D still means right-strafe in the list.

**Status:** impl must-not. Help list is init-time (`hud.js` 1019–1023); edit the **source literals** in `controls.js` before `initHud`. Do not live-rewrite the array each frame. Do not `innerHTML` the list.

#### 💡 Suggestion: CONTROLS still says dock, not dock/jump

**Location:** `src/systems/controls.js:353` vs inbox “dock/jump”

**Issue:** Live help never listed jump; the prompt teaches jump in-zone. After remap, physical-gate players still learn J from the prompt. Adding “dock/jump” is optional extra.

**Fix:** Keep one dock token unless playtest shows gate-only players miss J. Do not add a second CONTROLS line that fights the hub G line.

**Status:** optional. Not required for PR1.

#### 💡 Suggestion: Do not add a second bottom prompt or hub dock pip

**Location:** contract §0.2; `src/ui/hud.css:184-193` hub (HUD-01); design 238–240

**Issue:** Dual-chip PR2 could spawn a second instrument or a reticle pip.

**Fix:** PR2 polish stays on the **existing** `.rw-prompt`. Empty 80 px hub stays empty.

**Status:** frozen. Optional PR2 is skippable if PR1 copy is enough.

#### 💡 Suggestion: `reducedMotion` needs no new rule; prompt needs no new `aria-live`

**Location:** contract §0.13; `src/systems/hud.js:837-839` vs banner `aria-live` at 825

**Issue:** Context prompt is a visual HUD chip, not a live region today. This leftover is copy, not a new control. Do not invent prompt animation.

**Fix:** Do not add motion. Do not require a new ARIA tree for PR1. Letter + verb in `textContent` is the a11y cue for this remap.

**Status:** out of this leftover. Existing reduced-motion kill-all already covers HUD transitions.

### Accessibility / states (spec)

- **Name:** Later copy puts the letter **J** (hub: in the verb) plus the verb Dock / Jump. Color on `.rw-prompt-key` is not the only cue.
- **Keyboard:** KeyJ is the interaction bind. WASD stay movement. Title swallows KeyJ. Skip pulse while typing / models / `#rw-title`. Enter is not deputized.
- **Focus / hover:** Prompt is not a pointer control (`#hud` click-through except CONTROLS toggle). No new hit target.
- **Theming:** No new hardcoded prompt color. Chip uses `var(--void)` / `var(--cyan)`. Contrast + colorblind overrides already exist.
- **Responsive:** No new chrome; live prompt is bottom-center flex. D→J does not change chip `min-width: 18px`. Long dest names are a live wrap residual, not this leftover.
- **States:** Hidden when no zone (`is-hidden`). Missing ship / not in zone: `dockPressed` no-op (live). AP jumps without J. Hold D after PR1 never docks/jumps.
- **Empty CONTROLS:** `'No bindings registered'` already exists (`hud.js` 1020–1021). PR1 still fills source lines.
- **Loading / error:** n/a for a key remap. Fail-closed never freezes the sim.

### Worker self-audit delta

Worker `out/w116/ctl01/ui-audit.md` reported 0 open Blocker / 0 open Major; closed the dual-bind and color-only majors; accepted D-trained residual and hub G chip; skippable PR2 / `reducedMotion`. Independent check **agrees**. Added: (1) Picture vs hub `pKey` misread, (2) CONTROLS exact-string vs “J dock” shorthand, (3) optional dock/jump help wording. Did not promote hub G-vs-J to Major: live already paints G and embeds the jump letter; PR1 only changes that letter. Did not require `aria-live` on `.rw-prompt` for this copy leftover.

### Ports / processes

This auditor did not start Vite or Chrome. No ports claimed. No `src/` writes. No edits to `docs/Ctl01DockBindDesign.md`, `out/w116/ctl01/**` worker files, wishlist, `PROGRESS.md`, sibling `out/w116/hud02tgt` / `nav05`, or HUD-02 / NAV-05 design docs.

### Verdict

**CLEAN** — no open Blocker or Major in the proposed later copy/layout.
