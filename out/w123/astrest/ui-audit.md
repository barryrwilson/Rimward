# UI Audit: remaining AST leftover after AST-01/02 brief (Wave 123)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live group-3 mine cue + MATCH lamp already meet AST find-aid and Wave 71 lamp. Digit theft is **not** proposed (Blocker if a later serial adds an AST Digit). Hub theft is **not** proposed. Specified later UI is the **existing** cue / lamp — CONSUME means **do not add chrome**.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Reuses the existing context prompt slot. Group 3 without a rock lock paints `Mine · belt Nu` (`hud.js` **2200–2206**).
- Prompt uses real `textContent` on `promptKey` / `promptVerb` (`hud.js` **2226–2227`). Not `innerHTML`.
- Dock / Jump / Hail / Target still win the prompt. Cue does not steal J/H (`hud.js` **2166–2200**).
- Arrival find-aid is a spare `commLine` (`jump.js` **177–178**), same HUD print path as other lines.
- MATCH lamp is a real `<span class="rw-match-lamp">` with the word MATCH (`hud.js` **356**). Hidden via `is-hidden` (`hud.css` **222–229**).
- Lamp lights for ship **or** rock lock (`hud.js` **1896**). Wave 71 product path.
- Empty 80 px hub stays empty (`hud.css` **184–193**). Aim-glass gauges stay off. No rock PPI.
- Digit 0 stays shipyard; 8/9 stay launch/epics (`station.js` **188**, **6171–6176`). AST is not a Digit.
- Group-3 mine cue **stays**. Pack does not retune copy or move the rail.
- Color is paired with the word MATCH / the verb Mine (not color-only).

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Group-3 cue is prompt-slot only; no scanner/chart rock mark

**Location:** `hud.js` **2200–2206** vs wishlist AST-02 “chart, scanner, landmarks”

**Issue:** Keyboard/glance find-aid is the prompt + arrival line. There is no chart icon for the belt.

**Fix:** Do not invent leftover chrome. AstOrbitsDesign §7 already chose commLine + group-3. CONSUME forbids chart/scanner rock marks. Owner omit, not a missing AST-01/02 hole.

**Status:** accepted — CONSUME stands.

#### 🟡 Minor: MATCH lamp has no extra rock-specific copy

**Location:** `hud.js` **356**, **1896**

**Issue:** Rock MATCH and ship MATCH share the same MATCH word. A new player might not know the hold is rock-relative.

**Fix:** Do not invent leftover lamp copy. Wave 71 named the lamp, not a second legend. CONSUME forbids new glance chrome.

**Status:** accepted — live lamp meets Wave 71; CONSUME stands.

#### 💡 Suggestion: reduced-motion still orbits the belt

**Location:** `asteroids.js` **2010–2048**

**Issue:** `reducedMotion` skips tumble, not closed-form phase (AstOrbitsDesign: a frozen belt is a clump again).

**Fix:** Do not freeze orbit as leftover. Cite only. HUD cue still updates distance.

**Status:** accepted — out of scope.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true missing-AST census, PR1 (named only then) must:

- Keep real prompt `textContent`, MATCH `<span>`, polite commLine, empty hub, group-3 cue
- Must not steal Digit 0/8/9, must not `innerHTML` belt names, must not autofocus trap the sim, must not add hub chrome or a PPI, must not add chart rock marks as leftover

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.

### Specified later UI vs live group-3 cue / MATCH lamp

| Spec (later = none) | Live |
|---|---|
| Group-3 find-aid | `Mine · belt Nu` when group === 3 and no rock lock |
| Arrival | `Belt lies N u sun-relative, off the station.` |
| MATCH lamp | MATCH word; `is-hidden` until `flags.matchSpeed` and ship or rock lock |
| Hub | 80 px empty |
| Digit | none for AST |

CONSUME adds **no** UI. Live cue and lamp already cover the specified later picture.
