# Designer UI audit — Wave 138 Agent evade PR1

**Auditor:** `[designer]` (independent of `out/w138/evade/ui-audit.md`)
**Review file:** `out/w138/designer/evade-ui-audit.md`
**Scope:** `src/systems/agent-api.js` badge last-line paint (`lastPrefix` + lastIntent name); `src/style.css` badge pin (read: must not move); `src/systems/controls.js` only as Space vs agent share the same afterburner edge (no HUD layout).
**Merge law:** `out/w137/evade/shared-contract.md` (wins on conflict).
**Worker self-audit:** `out/w138/evade/ui-audit.md` (checked, not rubber-stamped).
**Method:** Code review. No Vite. No Chrome. [NO BROWSER COVERAGE].
**Product source:** review only (no `src/` / wishlist / `PROGRESS.md` edits).

## UI Audit: Wave 138 Agent evade

### Summary
CLEAN. Named `afterburner` paints `Last: afterburner` through live `BADGE_COPY.lastPrefix` plus `lastIntent.name`. Badge pin stays Wave 134/Fable top-right. Space and the agent share one pending edge. No new Digit, no `AGENT EVADE` toast, no hub child, no MATCH reuse, no pad 2B chrome.

### What's done well
- Last line is `BADGE_COPY.lastPrefix + name` or `BADGE_COPY.lastNone` (`agent-api.js` 462–467, 576–577). There is no new `afterburner` literal on the badge. Boot pin `lastLine` requires the string `Last: afterburner` (`scripts/boot-test.mjs` 25807–25810).
- `badgeName` copies a string only (`agent-api.js` 490–492). Paint uses `textContent` and `makeBadgeNode` / `createElement` (`509–513`, `566–579`). No `innerHTML` in `agent-api.js`.
- Color is not the only cue: last-intent is text; on/off is `on`/`off` text plus solid vs dashed left border (`style.css` 61–67; `agent-api.js` 569–572). Burner aux already names READY / COOLDOWN / BURNING (`hud.js` 2320–2329).
- Status block is `aria-live="polite"` and `aria-atomic="true"` (`agent-api.js` 528–530). Enable/Stop stay real `<button type="button">` with ≥44 px hit (`style.css` 105–108; `agent-api.js` 546–554). Copy is unchanged (`Agent play`, `Enable agent play`, `Stop agent play`, `Stop does not cancel Autopilot.`).
- Live pin is Fable top-right: `top: 16px; right: 16px; bottom: auto; left: auto; z-index: 40` (`style.css` 38–43). That corner is not over PWR (bottom-right `.rw-side-col`, `hud.js` 1221–1223; `hud.css` 1021–1039) and not over hub RANGE (`hud.css` 184–220). Manifest overlap stays the sibling inbox (`shared-contract.md` §0.14).
- HUD-01 hub stays 80×80 empty glass (`hud.css` 184–193; clamp `hud.js` 1555). Evade PR1 adds no reticle child, SAFE/FLEE pip, or aim-glass gauge.
- Space remains the human afterburner key (`controls.js` 55, 512–514, 595). `pendingAfterburner` is module-scope; `agentPulse('afterburner')` sets the same flag (`65–72`, 292–294, 617). Help line stays `'Space — afterburner'`. TRACKED does not gain a Digit (`50–56`).
- Public pulse table in `agent-api.js` stays four (`dock` / `hail` / `target` / `reticleLock`, line 30). `pulse.edge === 'afterburner'` stays unknown. No `evade` / `flee` badge copy. No toast on each burn.
- `reducedMotion`: no new animation. Existing `body.rw-reduced-motion .rw-agent-badge` still kills animation/transition (`style.css` 128–132).
- Pad 2B not stolen: docked `afterburner` refuses `docked` and does not pulse (`agent-api.js` 407–410). No pad-seeker chrome. MATCH lamp still MATCH on `flags.matchSpeed` (`hud.js` 2301–2307); evade does not reuse that word.
- Theming: badge tokens still match HUD roles (`style.css` 33–37). Long last lines still wrap (`overflow-wrap: anywhere`, 87–93).

### Honor / Blocker gate

| Honor | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px hub | **Pass.** | `hud.css` 184–193; `hud.js` 1555 |
| Badge stays Wave 134/Fable pin (top-right); do not cover PWR / RANGE | **Pass** on live CSS. | `style.css` 38–43; PWR `hud.js` 1221–1223; RANGE `hud.css` 207–220 |
| No new Digit | **Pass.** | `controls.js` 50–56 |
| No `AGENT EVADE` jargon toast | **Pass.** | badge copy `agent-api.js` 462–472; no evade toast in `hud.js` `toastForEvent` |
| `Last: afterburner` uses live `lastPrefix` | **Pass.** | `agent-api.js` 467, 576–577; `remember` 102–111 |
| Color is not the only cue | **Pass.** | last line text; on/off text + dashed/solid |
| No `innerHTML` | **Pass.** | `agent-api.js` 509–579 |
| No new animation ignoring `reducedMotion` | **Pass.** | `style.css` 128–132; no badge pulse |
| Pad 2B not stolen | **Pass.** | `agent-api.js` 407–410; no pad helm |
| MATCH not reused | **Pass.** | `pendingMatchSpeed` still KeyX (`controls.js` 528, 622); MATCH lamp unchanged |

### Findings

None at Blocker or Major.

#### 🟡 Minor: Working tree `style.css` still differs from last git commit
**Location:** `src/style.css` 38–50 vs git HEAD (HEAD had `right`/`bottom: 16px` and no `max-height`)
**Issue:** Live pin matches Fable t2 / Wave 137 freeze (`top`/`right` 16 px, `bottom: auto`, `left: auto`, `max-height: calc(100vh - 32px)`, `overflow-y: auto`). Worker self-audit said PR1 did not edit `style.css`. The last committed file was still the Wave 134 bottom-right pin that covers PWR. This is mixed-tree residue, not a new evade chrome language.
**Fix:** Do not land a badge move as part of evade PR1. Do not revert live CSS to HEAD `bottom: 16px` (that covers PWR). Keep the Fable pin. Manifest overlap stays sibling inbox.
**Why not Major:** Honor wants the Fable top-right pin that is already in the working file. Evade JS does not change badge class, copy, or z-index.

#### 💡 Suggestion: Last line overwrites on later failed acts
**Location:** `src/systems/agent-api.js` `remember` 98–113; `badgePaint` 576–577
**Issue:** After a successful afterburner, a later `evade` unknown replaces the last line with `Last: evade`. That is live lastIntent law, not a chrome move. Worker self-audit already named this.
**Fix:** Do not special-case evade on the badge.

#### 💡 Suggestion: Per-frame `refreshBadge` still assigns `textContent`
**Location:** `src/systems/agent-api.js` 707–711, 566–579
**Issue:** `update` paints last/error every flight frame. Wave 134 already logged this. Afterburner does not add a new write path or animation.
**Fix:** Out of scope for PR1. Change-guard later if AT live-region churn shows up.

### Copy map (player-facing)

| Surface | Live after PR1 |
|---|---|
| Badge title | `Agent play` (`agent-api.js` 463) |
| State | `on` / `off` (464–465) |
| Last none | `Last: none` (466) |
| Last intent | `Last: ` + `lastIntent.name` → `Last: afterburner` (467, 577) |
| Error | `Error: ` + token (469, 579) |
| Enable / Stop / hint | unchanged (470–472) |
| Controls help | `Space — afterburner` (`controls.js` 595) |
| Flight aux | `BURN` + READY/COOLDOWN/BURNING (unchanged) |
| Hub RANGE | `RANGE` (unchanged) |
| MATCH | still MATCH, not evade |

### Passed (also)
- Worker self-audit CLEAN on lastPrefix / no innerHTML / no reducedMotion animation is correct.
- Sibling HUD SLOW lamp and ore cue live in the same dirty tree; they are not this pack. Evade does not paint SLOW on combat flee.
- No stills this pass. Boot `lastLine` is the text proof, not a screenshot.
