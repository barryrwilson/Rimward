## UI Audit: Wave 126 Agent API later watch badge + copy

### Summary
This wave is markdown. Later PR5 badge is player-facing, so this audit does not skip. Draft jargon `AGENT DRIVE` was a Major (unclear state, color-only risk, hub collision). Freeze now uses contract §0.1.2 literals, HUD tokens, named Enable/Stop, `aria-live` on the status line, and a sibling of `#app` (not the 80 px hub). No remaining Blocker/Major.

Method: self-applied orchestrator `ui-audit.md` + designer checklist. Did not spawn `[designer]`. Reviewed planned copy against live HUD law (`src/ui/hud.css` **1–7**, **12–21**; `src/systems/hud.js` **1293**).

### What's done well
- No new Digit. Digit 0/8/9 stay station. Digit 1–5 stay flight WPN.
- Aim-glass gauges stay off. Badge is forbidden from `#hud` hub (`hud.js` **1293** clamp).
- `innerHTML` forbidden. Toasts stay `textContent`.
- Color must pair with text (`hud.css` **4**). Frozen state words: `on` / `off`.
- Enable is a trusted click. Stop does not cancel Autopilot — named in hint copy.
- `reducedMotion`: no pulse. Default: no animation.
- z-index below pause (50, `main.js` **164**) and berth (60). Does not cover the reticle hub.
- Watch surface is live WebGL after PR3 latch, not a screenshot slideshow.

### Findings

#### 🟠 Major (resolved in freeze): `AGENT DRIVE` jargon

**Location:** prior `docs/AgentApiDesign.md` §8  
**Issue:** `AGENT DRIVE` is not a player state. It does not name on/off. A color pip alone would violate HUD law (`hud.css` **4**). Placing it in `#hud` would steal the 80 px hub.  
**Fix (frozen):** Title `Agent play`. State `on` / `off`. Buttons `Enable agent play` / `Stop agent play`. Hint `Stop does not cancel Autopilot.` Last line `Last: none` or `Last: ` + authored name. Error `Error: ` + live English. Sibling of `#app`.  
**Status:** resolved.

#### 🟠 Major (resolved in freeze): Watch claimed before hypot latch

**Location:** contract law 8; `autopilot.js` **176–177**; `controls.js` **461–478**  
**Issue:** Same-tab mouse cancels AP/AM today. Badge without PR3 is a cancelled-AP slideshow.  
**Fix:** Do not call the canvas the watch surface until PR3. PR5 depends on PR3.  
**Status:** resolved.

#### 🟡 Minor: Badge tokens live under `#hud`

**Location:** `src/ui/hud.css` **9–21** (`--rw-accent` scoped to `#hud`)  
**Issue:** A body sibling cannot see `--rw-accent` unless PR5 copies tokens onto `style.css` or a wrapper class.  
**Fix:** Later PR5: duplicate the four STATE colors on the badge class in `src/style.css` (or a non-hub wrapper). Do not parent the badge under `#hud`.

#### 🟡 Minor: Focus order vs flight keys

**Location:** later Enable/Stop buttons; `src/systems/controls.js` TRACKED  
**Issue:** Tab into the badge then type W/A/S/D still flies (window keydown). That is live HUD behavior too.  
**Fix:** Keep. Do not capture-phase swallow. Title leftover stays out of PR4.

#### 🟡 Minor: `aria-live` spam

**Location:** contract §0.1.2  
**Issue:** If the whole badge is live, 1–2 Hz last-intent updates would chatter.  
**Fix (frozen):** `aria-live="polite"` on the status line only. Buttons stay out.

#### 💡 Suggestion: Contrast in high-contrast body class

**Location:** `hud.css` colorblind / contrast overrides (file bottom); `ctx.settings.highContrast`  
**Issue:** Badge class should honor `body.rw-contrast` / `body.rw-colorblind` the same way HUD does.  
**Fix:** Later PR5. Not a Wave 126 src task.

### Player-facing copy (frozen)

| Role | Literal |
|---|---|
| Title | `Agent play` |
| State | `on` / `off` |
| Last none | `Last: none` |
| Enable | `Enable agent play` |
| Disable | `Stop agent play` |
| Hint | `Stop does not cancel Autopilot.` |

Hit target ≥ 44 px. Visible focus ring. `textContent` only. Color is not the only cue.

### Re-review
After §0.1.2 freeze: no remaining Blocker/Major. Verdict **CLEAN** for this markdown wave.
