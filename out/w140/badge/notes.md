# Wave 140 PR1 Agent play badge layout + a11y tokens notes

**Verdict:** PR1 landed in `src/style.css`. Badge pin is below Manifest. Width stays in the Manifest column. Max-height is PWR-safe after the raised top. z-index stays **40**. Okabe-Ito and contrast token mirrors are on `.rw-agent-badge`. No JS. No HUD child.

## Method

- Graph resolve: `proceed_unmodeled` (`r-mtbkzjjy-f4a6c364`). Did not `graph_propose` / `graph_approve`.
- Merge law: `out/w139/badge/shared-contract.md` (wins). Design: `docs/AgentBadgeLayoutDesign.md`.
- Write-set: `src/style.css` (layout + token mirrors), design Status line, `out/w140/badge/**`.
- Did not edit `hud.css`, `hud.js`, `agent-api.js`, `settings.js`, `docs/AgentApiDesign.md`, wishlist, `PROGRESS.md`.
- Did not start Vite or Chrome. Did not claim ports. Did not persist geometry.

## Landed (all required together)

| Knob | Live after PR1 | Cite |
|---|---|---|
| `top` | `140px` | `style.css` **39** |
| `right` | `16px` | **40** |
| `bottom` / `left` | `auto` | **41–42** |
| `z-index` | **40** | **43** |
| `max-width` | `min(148px, calc(100vw - 32px))` | **48** |
| `max-height` | `calc(100vh - 156px)` | **49** |
| `overflow-y` | `auto` | **50** |
| Colorblind | Okabe-Ito on `.rw-agent-badge` | **135–140** |
| Contrast | HUD contrast tokens on `.rw-agent-badge` | **142–147** |
| Reduced motion | unchanged | **128–132** |
| ON/OFF | solid vs dashed + text | **61–67** |
| Buttons | min 44 px | **107–108** |
| Mount | still `body.appendChild` | `agent-api.js` **566** (cite only) |

## Fail-closed (CSS)

- Missing Manifest is not a crash. Badge CSS still matches `.rw-agent-badge`.
- No `innerHTML`. No new Digit. No geometry persist.

## Coupling (did not steal)

- Agent API PR5 body-child mount.
- Agent market fill. Market desk layout.
- HUD-07. HUD-06. pad 2B. in-repo LLM.

## Reviews

Security: no CRITICAL/HIGH. Code: no Blocker/Major. UI: no Blocker/Major. MEDIUM/LOW documented with one-line justification. No product fix after first pass; re-review is the same report.

## Graph

Did not bind Drive publish. Did not change workflow nodes.
