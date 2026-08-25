# UI Audit: Wave 117 CTL-01 PR1 KeyJ dock/jump copy

**review_file:** `out/w117/designer/ctl01-ui-audit.md`  
**Wave:** 117 PR1. Product copy landed. Review only. No `src/` edits. No Vite. No Playwright.  
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`  
**Guide:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`  
**Honor:** `out/w116/ctl01/shared-contract.md` §0.14 — prompt must name the new key in text; color chip is not the only cue.  
**Sources (read, not edited):** `src/systems/controls.js`; `src/systems/hud.js` pKey/pVerb dock/jump family (~2128–2137); `src/systems/onboarding.js` (live path; not `src/game/onboarding.js`); `docs/Ctl01DockBindDesign.md`; `out/w116/ctl01/shared-contract.md`. Worker self-audit `out/w117/ctl01/ui-audit.md` read; **not** overwritten.  
**Scope:** KeyJ dock/jump **frontend copy** + bind naming. Do **not** demand HUD-02 combat-rail restyle. Do **not** treat `scripts/boot-test.mjs` KeyD jump-pin lag as a UI Blocker (NAV-05 verifier / later sibling).  
**Honor keys:** A/D still strafe. Digit 0 shipyard (not stolen). KeyT / KeyV / KeyK / KeyX stay.  
**Verdict:** **CLEAN**

### Summary

PR1 copy names **J** on the dock/jump prompt family, CONTROLS list, and onboarding hints. Station and physical-gate chips are **J**. Hub chip stays **G**; the verb names **J — Jump**. Color on `.rw-prompt-key` is not the only cue. A/D stay lateral strafe. No open Blocker or Major in player-facing copy.

**Counts:** 🔴 Blocker **0** (open). 🟠 Major **0** (open). 🟡 Minor **3** (accepted residuals / doc lag). 💡 Suggestion **2**. Boot KeyD pins: **out of this UI verdict**.

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Prompt names KeyJ (not color-only) | **Pass.** Station `pKey='J'` + verb `Dock`. Physical gate `pKey='J'` + `Jump to <name>`. Hub names J in **verb**. Writes `textContent`. | `hud.js` 2128, 2134–2137, 2184–2185; contract §0.14 |
| CONTROLS list | **Pass.** A/D line still “lateral strafe (D = right)”. Hail/dock/camera line is `H — hail · J — dock · C — camera…`. Init-time `el()` list, not `innerHTML`. | `controls.js` 360, 370; `hud.js` 1019–1023; contract §0.4 |
| Onboarding hint | **Pass.** `'J — dock'` / `'J — jump the gate'`. Show path is `textContent`. `seen` is not reset. | `src/systems/onboarding.js` 50, 53, 102, 104 |
| Hub G vs J at junctions | **Pass.** Chip stays **G** (cycle). Verb `'route n/m · J — Jump to ' + destName`. KeyG not stolen. | `hud.js` 2132–2135; contract §0.1 KeyG forbidden |
| Color not the only cue | **Pass.** Chip letter + verb. Chip fill is `var(--cyan)` → `--rw-accent` (colorblind remaps accent). Contrast restyles `.rw-prompt`. | `hud.css` 21, 755–771, 1146–1151, 1169; contract §0.14 |
| Trained D-to-dock players | **Residual accepted.** In-zone prompt + always-on CONTROLS teach J. One-shot hints do not re-fire. Do not wipe `seen`. | `onboarding.js` 104; design 320 |
| Empty hub / Digit / T V K X | **Pass.** Prompt copy only. No dock pip. `TRACKED` still has KeyT/V/K/X. No Digit in this leftover. | `controls.js` 44, 285, 297–307; contract §0.2 |
| `reducedMotion` | **n/a.** No new prompt animation. Existing HUD kill-all stays. | contract §0.13 |
| Keyboard / title | **Pass.** KeyJ sets `pendingDock`. Skip while title / models / typing. KeyD is `strafeX` only. | `controls.js` 57–71, 291–293, 457 |
| Fail closed copy vs bind | **Pass.** Copy landed with the bind. No `pKey = 'D'` / `'D — Jump'` left in `src/`. | grep `src/**/*.js` |
| Boot-test KeyD lag | **Not a UI Blocker.** Recipe is `out/w117/ctl01/boot-pin-recipe.md`. Harness still pins KeyD until sibling apply. | task rule; design status line |

### Landed player-facing copy (PR1)

Exact strings in live `src/`:

| Surface | Live copy | Must not (and did not) |
|---|---|---|
| Station in-zone | `pKey = 'J'`; `pVerb = 'Dock'` | Keep `pKey = 'D'` |
| Physical gate | `pKey = 'J'`; `pVerb = 'Jump to ' + destName` | Recolor chip and drop the letter |
| Lamplighter hub | `pKey = 'G'`; `pVerb = 'route n/m · J — Jump to ' + destName` | `pKey = 'J'` (hides cycle); leave `D — Jump` |
| CONTROLS strafe | `'A/D — lateral strafe (D = right)'` | Move strafe off D |
| CONTROLS hail/dock/camera | `'H — hail · J — dock · C — camera (chase / third / first-person)'` | `'J dock'` without em dash; steal C |
| CONTROLS hub | `'G — cycle hub route at a Lamplighter junction'` | Drop G because jump moved |
| Bind header comment | `J (tap) → dock` | Teach D as dock in the header |
| Onboarding dock | `'J — dock'` | Reset `seen`; keep `'D — dock'` |
| Onboarding gate | `'J — jump the gate'` | Teach G as jump |

Writers: `hud.js` 2128–2137; `controls.js` 30, 360, 370, 374; `onboarding.js` 50, 53. HUD-02 combat rails / class tokens / RANGE / `tgtFacing` are **out of this leftover**.

### What's done well

- Reuses live `.rw-prompt` / `.rw-prompt-key` / `.rw-prompt-verb` (`hud.js` 837–839). No new widget, no hub pip, no Digit.
- Prompt writes **text** (`promptKey.textContent`, `promptVerb.textContent` at `hud.js` 2184–2185). Letter + verb, not color-only.
- Same KeyJ for dock and jump keeps one prompt family (inbox: displayed gate or dock prompt).
- Hub still teaches two keys: chip **G** cycles; verb embeds **J — Jump**. Cycle is not stolen.
- CONTROLS is real `<li>` text from `config.controls` via `el()` (`hud.js` 1019–1023). No `innerHTML`.
- Help still paints A/D as strafe with “(D = right)” so D does not look unbound after the remap.
- Onboarding is `textContent` (`onboarding.js` 102). Hint ids stay `dock` / `gate` (no persist-schema change).
- Header bind comment, `TRACKED`, `case 'KeyJ'`, and `ctx.js` `dockPressed: false, // edge: J (not D)` agree with the painted letter.
- Title skip + capture still swallow KeyJ on `#rw-title`. Enter stays CONTINUE, not dock.
- Combat-rail block above the prompt (`hud.js` ~2110–2122) is untouched by this copy leftover.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Players trained on D-to-dock will not re-see one-shot hints

**Location:** `src/systems/onboarding.js:50,53,104`  
**Issue:** Hints fire once (`seen` push on show). Existing saves will **not** re-show dock/gate hints after the string change. Veterans must learn J from the in-zone prompt and the CONTROLS list.  
**Fix:** Do **not** reset `world.onboarding.seen`. Prompt + CONTROLS already name J. WAVE6 boot string pin is a later sibling (`boot-pin-recipe.md`), not a copy defect.  
**Status:** accepted residual. Not a blocker: two always-on surfaces name J.

#### 🟡 Minor: Hub chip stays G while jump is J in the verb

**Location:** `src/systems/hud.js:2132-2135`  
**Issue:** The large chip is G. Jump is the second clause in the verb. Players who look only at the chip may tap G (cycle) instead of J (jump). Live already used this two-key pattern with D in the verb. Contract freezes chip G.  
**Fix:** Keep G as cycle. Keep `J — Jump` in the verb. Do not steal KeyG. Optional PR2 dual-chip is skippable after playtest.  
**Status:** accepted. Same as worker self-audit. Not promoted to Major: the verb names J in text (contract §0.14).

#### 🟡 Minor: Design-doc census body still describes painted D as live

**Location:** `docs/Ctl01DockBindDesign.md:31-43,64-76` vs status **7–14**  
**Issue:** Header says Wave 117 PR1 landed and copy names J. The inventory table and “Census (code wins)” paragraph still list help “D — dock”, onboarding “D — dock”, and prompt D. Code wins; player UI is J. A later reader of the census block can think the HUD still lies.  
**Fix:** Not this auditor. Product copy is correct. A later notes pass can mark those rows “pre-PR1 census.” Do not change live prompt strings to match the stale table.  
**Status:** documentation lag. Not a product UI defect.

#### 💡 Suggestion: CONTROLS still says dock, not dock/jump

**Location:** `src/systems/controls.js:370` vs inbox “dock/jump”  
**Issue:** Help never listed jump; the prompt teaches jump in-zone. Physical-gate players still learn J from the prompt. Adding “dock/jump” is optional extra.  
**Fix:** Keep one dock token unless playtest shows gate-only players miss J. Do not add a second CONTROLS line that fights the hub G line.  
**Status:** optional. Not required for PR1.

#### 💡 Suggestion: Do not add a second bottom prompt or hub dock pip

**Location:** contract §0.2; `src/ui/hud.css` hub; design PR2  
**Issue:** Dual-chip PR2 could spawn a second instrument or a reticle pip.  
**Fix:** PR2 polish stays on the **existing** `.rw-prompt`. Empty 80 px hub stays empty.  
**Status:** frozen. Optional PR2 is skippable; PR1 copy is enough for §0.14.

### Accessibility / states (landed)

- **Name:** Copy puts the letter **J** (hub: in the verb) plus the verb Dock / Jump. Color on `.rw-prompt-key` is not the only cue.
- **Keyboard:** KeyJ is the interaction bind. WASD stay movement. Title swallows KeyJ. Skip pulse while typing / models / `#rw-title`. Enter is not deputized. KeyT/V/K/X stay.
- **Focus / hover:** Prompt is not a pointer control. No new hit target. CONTROLS toggle is unchanged.
- **Theming:** No new hardcoded prompt color. Chip uses `var(--void)` / `var(--cyan)` (`--cyan: var(--rw-accent)`). Contrast + colorblind overrides already exist. `hud.css` was not restyled for this leftover (correct).
- **Responsive:** No new chrome. D→J does not change chip `min-width: 18px`. Long dest names on hub verbs are a live wrap residual, not this leftover.
- **States:** Hidden when no zone (`is-hidden`). Missing ship / not in zone: `dockPressed` no-op (live). AP jumps without J. Hold D after PR1 never docks/jumps.
- **Empty CONTROLS:** `'No bindings registered'` already exists (`hud.js` 1020–1021). PR1 still fills source lines.
- **Loading / error:** n/a for a key remap. Fail-closed never freezes the sim.
- **`aria-live`:** Context prompt is still a visual HUD chip, not a live region. Do not require a new ARIA tree for this copy leftover. Banner already has `aria-live` (`hud.js` 825).
- **Combat rails:** Out of scope. Do not demand restyle.

### Worker self-audit delta

Worker `out/w117/ctl01/ui-audit.md` reported 0 Blocker / 0 Major; noted hub chip G as a skippable PR2 suggestion. Independent check **agrees**. Added: D-trained one-shot residual (accepted), design-doc census lag (not product), CONTROLS dock-vs-jump wording (optional). Did not promote hub G-vs-J to Major: verb names J. Did not treat `boot-test.mjs` KeyD pins as a UI Blocker.

### Ports / processes

This auditor did not start Vite, Playwright, or Chrome. No ports claimed. No `src/` writes. No edits to worker `out/w117/ctl01/**` files, wishlist, `PROGRESS.md`, HUD-02 rails, or NAV-05 AP copy.

### Verdict

**CLEAN** — no open Blocker or Major in landed KeyJ dock/jump frontend copy. Prompt names the new key in text. Color is not the only cue.
