# UI Audit: NAV-10 PR1 HUD approach-speed cue (designer)

**Reviewer:** designer (parent `[designer]` pass)  
**Review file:** `out/w136/designer/dockapproach-ui-audit.md`  
**Round:** 1 on live PR1 `src/`  
**Scope:** Wave 136 NAV-10 PR1 HUD approach-speed cue only. Review, not a product edit.  
**Sources:** `src/systems/hud.js`, `src/ui/hud.css`; worker `out/w136/dockapproach/ui-audit.md`; honor list in the dispatch.  
**Worker self-audit:** agree. No Blocker/Major. Live code matches the freeze: named `SLOW` + `20 u/s`, MATCH independent, hub 80 px, HOME 108, Jump copy intact, no new `reducedMotion` animation.

### Summary

PR1 is usable and accessible. Color is a second channel, not the name. The self SPD lamp is the word `SLOW`. The in-zone prompt names `SLOW` and `20 u/s` under key `J`. MATCH still reads `MATCH`. The hub is still 80 px. HOME inset is still 108. Jump copy is not replaced. No Blocker. No Major.

### Honor (dispatch)

| Honor | Live cite | Verdict |
|---|---|---|
| Color is not the only cue | Lamp `textContent` `SLOW` (`hud.js` 1118–1119); prompt `Dock · SLOW — approach under 20 u/s` (`hud.js` 78, 2576–2581); amber is `var(--amber)` (`hud.css` 231–235) | **pass** |
| Named text `SLOW` and `20 u/s` | `el(..., 'SLOW')`; `DOCK_SLOW_VERB` includes `20 u/s` | **pass** |
| No hub pip | `.rw-reticle` 80×80, no SLOW child (`hud.css` 184–193); lamp lives on self `.rw-speed .rw-value` (`hud.js` 1116–1119) | **pass** |
| HOME 108 stays | `HOME_EDGE_INSET = 108` (`hud.js` 75, 2076–2077) | **pass** |
| Jump copy not stolen | Dock `pKey = 'J'` when `station.inZone`; Jump is `else if` (`hud.js` 2575–2590); lamp hides when `gate.inZone && !station.inZone` (`hud.js` 423–424) | **pass** |
| MATCH independent | `makeSpeed` MATCH node unchanged (`hud.js` 389–403); `tgtSpeed.set(targetSpeedNow)` speed-only (`hud.js` 2564); own `is-hidden` (`hud.js` 2284–2288; `hud.css` 229 vs 239) | **pass** |
| `reducedMotion` no new animation | `.rw-slow-lamp` has no `@keyframes` / pulse (`hud.css` 231–239); global kill still `animation: none !important` (`hud.css` 1273–1277) | **pass** |

### What's done well

- Authored names, not a tint: lamp word `SLOW`; prompt addendum `Dock · SLOW — approach under 20 u/s`. `el()` writes `textContent` (`hud.js` 316–321). No `innerHTML` in `hud.js`.
- Distinct self-only node after `makeSpeed(selfRail)`. Target rail still uses `makeSpeed` with MATCH only. SLOW is not stuffed into the shared factory default.
- Palette uses tokens: `color: var(--amber)` → `--rw-warn`. Colorblind Okabe-Ito remaps `--rw-warn` (`hud.css` 1234–1238). Contrast still reaches the lamp through the token.
- Cue band starts at `3 × U.DOCK_RANGE` (45 × 3 = 135 u) so cruise 120 u/s can read SLOW before the 45 u in-zone window (`hud.js` 76–77, 417–429).
- Fail-closed hides: docked, `berthHold`, jumping, jump-owns-verb, non-finite dist/speed (`hud.js` 417–429). MATCH hide is a separate `lastMatch` / `is-hidden` path (`hud.js` 399–403).
- Rail overflow law: SLOW `letter-spacing: 0.04em` and `margin-left: 4px` (`hud.css` 231–237). Reticle size is unchanged (`width: 80px`; `hud.css` 184–190).
- Context prompt key stays `J` for dock. CTL-01 is not remapped. Hub route still uses `G` + `Jump to` (`hud.js` 2585–2590).
- HUD-06 HOME chevron still uses 108 px inset. TGT/NAV-02 keep 84 (`hud.js` 74–75).
- No toast SLOW. No Digit. No pause-as-feedback. Rails stay `pointer-events: none` (`hud.css` 960–970).

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Long uppercase addendum on `.rw-prompt-verb`

**Location:** `src/systems/hud.js:78`, `2576–2581`; `src/ui/hud.css:817–848`  
**Issue:** `.rw-prompt` is a centered flex row with no `max-width` and default nowrap. `.rw-prompt-verb` is 11px × `--rw-text-scale`, `letter-spacing: 0.22em`, `text-transform: uppercase`. Authored `Dock · SLOW — approach under 20 u/s` is longer than live `Dock` and longer than salvage `Hail — dead in space`. At `--rw-text-scale: 1.5` the chip can meet the combat rails or clip a narrow viewport. Not unusable: salvage already ships a long verb; key chip `J` still names the action.  
**Fix:** Keep one `promptVerb.textContent` string. After playtest, shorten (for example drop `approach under` and keep `SLOW — 20 u/s`) only if wrap/overflow shows. Do not add a HUD-07 column. Do not steal Jump copy to make room.  
**Status:** leave with justification (reuse live prompt; not color-only)

#### 🟡 Minor: MATCH + SLOW on the 168–220 px self rail

**Location:** `src/ui/hud.css:960–965`, `222–239`; `src/systems/hud.js:389`, `1116–1119`; mech MATCH pip `hud.css:1544–1552`  
**Issue:** Integer + `u/s` + MATCH + SLOW share `.rw-value`. Rail `max-width: 220px` has no `overflow: hidden`. Mech MATCH `::before` adds 3 px + 4 px when MATCH and SLOW are both on. Text still names both verbs, so this is layout, not a color-only failure. Letter-spacing 0.04em / margin 4 px is the prescribed overflow law. Hub is not grown.  
**Fix:** None required for merge. If playtest at text-scale 1.5 clips the number, tighten MATCH letter-spacing or lamp margin further. Do not move lamps onto `.rw-reticle`. Do not shrink HOME 108.  
**Status:** leave with justification (mitigation already in CSS)

#### 🟡 Minor: Light/ace creep 30 keeps SLOW on after throttle 0

**Location:** `src/systems/hud.js:76`, `426`; `src/game/state.js:38–41` (`creep: 30` light/ace)  
**Issue:** SLOW is true while `speed > 20`. Throttle 0 still creeps at 30 u/s on light and ace. A player who “slowed down” still sees `SLOW` and the in-zone addendum until fullStop or dock. Copy is honest vs inbox 20. This is teaching, not an inaccessible cue. Do not retune `state.js` in this PR. Do not put F into a new Digit.  
**Fix:** Keep warn-only copy. Existing double-tap F is the stop path. Owner may change the **cue** threshold later, not creep.  
**Status:** leave with justification (contract: do not write `state.js`)

#### 💡 Suggestion: Do not add a mech color pip on SLOW

**Location:** `src/ui/hud.css:1544–1552` (MATCH `::before` only); `.rw-slow-lamp` has no family glyph  
**Issue:** MATCH already has a small mech accent bar. A matching SLOW pip would be color/shape without a new word, and it would add rail width. The word `SLOW` is enough.  
**Fix:** Leave SLOW as text only. Do not copy `#hud[data-family="mech"] .rw-match-lamp::before` onto `.rw-slow-lamp`.  
**Status:** optional; current CSS is correct

#### 💡 Suggestion: Early-band lamp is the word SLOW, not the number

**Location:** `hud.js:417–429` (lamp, no `station.inZone`); `hud.js:2575–2581` (prompt, in-zone only)  
**Issue:** At 135–45 u the player sees SPD `SLOW` without `20 u/s`. The number lands with `J` in-zone. This is the intended two-step teach (brake early, then the limit). Not a Blocker: the lamp is still a named word.  
**Fix:** None. Do not cram `20 u/s` onto the 220 px rail. Do not toast the number.  
**Status:** optional; leave

### Worker self-audit

Agree with `out/w136/dockapproach/ui-audit.md`. Amber vs cyan as a second channel is correctly not a Blocker. MATCH + SLOW crowding is correctly not a hub-grow. Round 2 worker claims (hub 80 px, HOME 108, no Digit, no pulse, prompt key `J`) match live `src/`.

### Verdict

**CLEAN.** No Blocker. No Major. PR1 HUD approach-speed cue may proceed on UI grounds.
