## UI Audit: PR5 Agent play badge (Wave 134)

**Auditor:** `[designer]` (orchestrator designer persona + `ui-audit.md` checklist)  
**Scope:** Badge DOM in `src/systems/agent-api.js`, `.rw-agent-badge` in `src/style.css`, frozen copy `out/w126/agentapi/shared-contract.md` §0.1.2, design `docs/AgentApiDesign.md` §8. Did not audit unrelated HUD skins. Did not edit product source. Did not start Vite or Chrome.  
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.  
**Date:** 2026-08-26  
**Product source:** review only

### Summary

The shipped badge matches the freeze: body child (not `#hud` hub), frozen `textContent` literals, trusted Enable, Stop → `disable()` only, `aria-live` on status, 44 px buttons, focus ring, z-index 40 (below pause 50 / berth 60), no animation. No Blocker or Major. Remaining gaps are settings-token inheritance, overlay stacking, control disabled pairing, and corner overlap with `.rw-side-col`.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0**. 🟡 Minor **4**. 💡 Suggestion **2**.

### Verdict

**CLEAN**

---

### Honor / Blocker gate

| Honor | Result | Cite |
|---|---|---|
| Not `#hud` 80 px hub child | **Pass.** `document.body.appendChild(root)`. | `agent-api.js:452`, `:490`; `style.css:31–32` |
| Aim-glass / new Digit | **Pass.** No reticle child. No Digit. | `hud.css:184–193` (hub stays empty) |
| `textContent` only, no `innerHTML` | **Pass.** `createElement` + `textContent`. No `innerHTML` / `insertAdjacentHTML` in `agent-api.js`. | `agent-api.js:434–437`, `:459`, `:473–483`, `:495–505` |
| Frozen copy §0.1.2 | **Pass.** Exact literals in `BADGE_COPY`. No `AGENT DRIVE`. | `agent-api.js:388–399`; contract `:87–96` |
| Color not the only cue | **Pass.** State words `on`/`off` plus solid vs dashed left edge. | `agent-api.js:495–498`; `style.css:57–63` |
| `aria-live` on status, not buttons | **Pass.** `aria-live="polite"` + `aria-atomic="true"` on status. Buttons are real `<button type="button">`. | `agent-api.js:454–456`, `:472–480` |
| Enable trusted click | **Pass.** Click handler passes the event; `enable()` requires `ev.isTrusted === true`. | `agent-api.js:508–512`, `:587–595` |
| Stop does not cancel Autopilot | **Pass.** Stop calls `disable()`; `disable()` clears `optIn` only. Hint literal present. | `agent-api.js:517–522`, `:398`, `:606–612`; contract `:77` |
| Hit target ≥ 44 px | **Pass.** `min-width` / `min-height` 44 px. | `style.css:101–104` |
| Visible focus ring | **Pass.** `outline: 2px solid` + offset 2. | `style.css:118–122` |
| z-index below pause 50 / berth 60 | **Pass.** Badge `z-index: 40`. Pause 50. Berth 60. `#hud` 10. | `style.css:41`; `main.js:169`; `save.js:1356`; `style.css:28` |
| `reducedMotion`: no pulse | **Pass.** No animation/transition on the badge. Body class kills any future ones. | `style.css:32–128`; design `:415` |
| Tokens on `style.css`, not hub child | **Pass.** Local `--rw-accent` `#6ff2e0`, `--panel`, `--white`, `--panel-edge`, `--void`. | `style.css:32–37`; `hud.css:12–19` |

---

### What's done well

- Badge is a `document.body` child, not a HUD hub child. Center 80 px reticle stays empty.
- Player copy is the frozen English set. Buttons name the action. Hint names the Stop/Autopilot rule.
- Semantic controls: two `<button type="button">`. Status is a live region. Hint is a `<p>`.
- On/off is text plus a shape change (solid accent bar vs dashed edge). Color is not the only cue.
- Empty error node is `display: none`. Last/error wrap with `overflow-wrap: anywhere`.
- Corner width caps with `max-width: min(280px, calc(100vw - 32px))`. Actions wrap.
- Hover and focus exist. Default has no motion. `pointer-events: auto` is on the badge, not the HUD root.
- Trusted Enable and untrusted refuse are wired. Stop does not call Autopilot cancel.

---

### Findings

#### 🟡 Minor: Settings contrast / colorblind / text-scale miss the body sibling

**Location:** `src/style.css:32–37`; `src/ui/hud.css:1224–1238`, `:29–31`; `src/systems/settings.js:70–73`  
**Issue:** Tokens are copied onto `.rw-agent-badge`, so `#hud` overrides never apply. `body.rw-contrast` / `body.rw-colorblind` only retarget `#hud` and `.rw-galaxy-chart`. `--rw-text-scale` is set on `#hud` only. High-contrast and colorblind players keep default badge colors. Large HUD type does not scale the badge. Default `#dce8f4` on `--panel` is strong on a dark void (~15:1); the gap is settings parity, not a default-contrast failure. Colorblind still has `on`/`off` text and dashed vs solid edge.  
**Fix:** Add `body.rw-contrast .rw-agent-badge` and `body.rw-colorblind .rw-agent-badge` token overrides (same values as `hud.css` 1224–1238). Multiply badge `font-size` by `var(--rw-text-scale, 1)` (set a fallback on the badge if `#hud` is absent).  
**Status:** OPEN. Predicted in Wave 126 designer audit as later-PR5 work.

#### 🟡 Minor: z-index 40 ties hail and sits above chart / station

**Location:** `src/style.css:41`; `src/systems/hail.js:385`; `src/ui/hud.css:1986`; `src/ui/screens.css:16`, `:461`, `:507`  
**Issue:** Freeze required below pause 50 and berth 60. Landed `z-index: 40` matches hail (40) and sits above galaxy chart (30), station overlay (20), and death (30). Title (70) and models/settings (80) still cover it. Hail card is left; badge is bottom-right, so they likely do not overlap in space. Chart and station are full-viewport layers: the badge stays clickable and in tab order on top of those dialogs.  
**Fix:** Prefer `36–39` (above onboarding 35, below hail 40) as the Wave 126 freeze suggested. Optionally `inert` / hide the badge while chart, station, models, or title is open. Do not raise above pause 50.  
**Status:** OPEN.

#### 🟡 Minor: Enable and Stop stay equally live in both states

**Location:** `src/systems/agent-api.js:492–505`, `:472–480`; `src/style.css:101–122`  
**Issue:** Paint toggles `is-on` / `is-off` and status text, but both buttons stay enabled. When `optIn` is true, Enable is a trusted no-op. When off, Stop has nothing to clear. Hover/focus on the inert action is unclear. No `:disabled` style exists. Frozen labels stay correct.  
**Fix:** When on, `disabled` (or hide) Enable. When off, `disabled` (or hide) Stop. Keep the frozen visible labels. Keep a visible focus ring on the live button. Hit target stays ≥ 44 px.  
**Status:** OPEN. Predicted in Wave 126 freeze.

#### 🟡 Minor: Bottom-right badge covers `.rw-side-col` telemetry

**Location:** `src/style.css:38–46`; `src/ui/hud.css:1011–1018`, `:1023–1029`; `src/systems/hud.js:1162–1196`  
**Issue:** Badge is `position: fixed; right: 16px; bottom: 16px; max-width: 280px` with two 44 px rows. That corner is PWR / Bio / NAV / POS (`.rw-side-col`). HUD strip is `pointer-events: none`, so clicks are not stolen from AP/AM (those chips are top-center). Glance at Bio/POS is occluded. On short viewports (~424 px tall) a ~160 px-tall badge can clip the bottom of the 80 px hub (`hud.css:184–193`). Hub parent-tree stays clean; layout overlap is the issue.  
**Fix:** Move to a corner that misses `.rw-side-col` and the hub (top-right under resources, or a narrower strip). Cap height so the badge cannot cross screen center.  
**Status:** OPEN.

#### 💡 Suggestion: Name the badge as a region

**Location:** `src/systems/agent-api.js:452–459`  
**Issue:** Root is an unlabeled `div`. Title is a `span`, not a heading. Screen-reader users get a live region without a persistent name besides the announced title text.  
**Fix:** `role="region"` and `aria-label="Agent play"` on the root (frozen title). Do not put `aria-live` on the buttons.

#### 💡 Suggestion: Guard live-region writes on change

**Location:** `src/systems/agent-api.js:492–505`, `:631–636`  
**Issue:** `update` calls `refreshBadge` every flight frame. Paint always assigns `textContent` on state/last/error. Many AT skip unchanged text, so this is not proven spam. A change guard still avoids live-region churn.  
**Fix:** Write nodes only when `on` / last name / error string change.

---

### Player-facing copy (checked live)

| Role | Frozen | Live |
|---|---|---|
| Title | `Agent play` | `BADGE_COPY.title` `agent-api.js:389` |
| State | `on` / `off` | `:390–391`, paint `:495` |
| Last none | `Last: none` | `:392` |
| Last intent | `Last: ` + authored `name` | `:393`, `:503` |
| Error none | empty | `:394`, `:91–93` CSS hides empty |
| Error | `Error: ` + live English | `:395`, `:505` |
| Enable | `Enable agent play` | `:396`, `:475` |
| Disable | `Stop agent play` | `:397`, `:480` |
| Hint | `Stop does not cancel Autopilot.` | `:398`, `:483` |

---

### Checklist (this pass)

- Contrast: default tokens pass on dark panel; high-contrast class does not retarget the badge (Minor).
- Focus rings: present on both buttons (`style.css:118–122`).
- Semantic HTML: real buttons; live status; hint paragraph. Region name optional (Suggestion).
- Names: visible labels match freeze. No jargon.
- Tokens vs hardcoded: STATE colors are CSS variables on the badge class. Box-shadow uses raw rgba (decorative only).
- Overflow vs 80 px hub: parent-tree pass; short-viewport clip risk (Minor).
- z-index vs pause 50 / berth 60: pass (40). Hail tie / chart sit (Minor).
- Hit target ≥ 44 px: pass.
- reducedMotion: no pulse; body class kills animation/transition.
- Color not the only cue: pass (`on`/`off` + dashed/solid).
- aria-live on status not buttons: pass.
- Frozen literals: pass.

### Re-review

No remaining Blocker or Major. Verdict **CLEAN**. Minors are settings-token parity, overlay stacking, disabled pairing, and corner overlap. They do not make the badge unusable or inaccessible on the default palette.
