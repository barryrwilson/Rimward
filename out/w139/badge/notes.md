# Wave 139 Agent play badge layout + a11y tokens notes

**Verdict:** leftover **REAL**. Name: **offset body-child badge below Manifest/toasts + mirror colorblind/contrast tokens**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/AgentBadgeLayoutDesign.md` and `out/w139/badge/**` except `verify/**`.
- Census live `.rw-agent-badge*` in `src/style.css` (pin, z-index 40, tokens, reduced-motion, 44 px, solid/dashed).
- Census mount `mountAgentBadge` / `queryOptIn` / `textContent` / `type="button"` in `src/systems/agent-api.js`.
- Census Manifest UU/FEAR/CARGO, toasts, PWR, RANGE in `src/ui/hud.css` + `src/systems/hud.js`.
- Census `body.rw-colorblind` / `body.rw-contrast` on `#hud` in `hud.css` and `.screen-overlay` in `screens.css`. Confirmed **no** badge selectors.
- Read `out/orch-fable/t2/ui-audit.md` as evidence, not live truth.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** edit `docs/AgentApiDesign.md`. Did **not** write sibling Wave 139 packs.

## Why REAL (not CONSUME)

CONSUME needed **both**: badge already clears Manifest **and** toasts, **and** colorblind/contrast retint `.rw-agent-badge` without a HUD parent.

Clear Manifest/toasts **is not** live:

- Badge `top: 16px; right: 16px; z-index: 40; max-width: 280px` (`style.css` **38–48**).
- Manifest `top: 14px; right: 14px` (`hud.css` **1172–1176**).
- Toasts `top: 14px; right: 168px` (`hud.css` **710–713**).
- `#hud` z-index **10** (`style.css` **28**).

Palette **is not** live:

- No `body.rw-colorblind .rw-agent-badge` / `body.rw-contrast .rw-agent-badge`.
- HUD overrides target `#hud` only (`hud.css` **1234–1248**).

PWR and RANGE **are** clear. Reduced-motion **is** live. ON/OFF **is** not color-only. Those do **not** CONSUME this leftover. Do **not** CONSUME on the previous bottom-right pin fix (wishlist DONE **283–285**).

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| `top` | `140px` (XL Manifest + gap) |
| `max-width` | `min(148px, calc(100vw - 32px))` |
| `max-height` | `calc(100vh - 156px)` |
| `z-index` | **40** |
| Colorblind | Okabe-Ito on `.rw-agent-badge` |
| Contrast | HUD contrast tokens on `.rw-agent-badge` |
| Reduced motion | keep |
| Mount | body child |
| Persist | none |
| JS | none |

## Later write-set (do not edit now)

- `src/style.css` only.
- Do **not** claim `src/ui/hud.css`, `hud.js`, `agent-api.js`, `settings.js`.

## Coupling (do not steal)

- Agent API PR5 body-child mount (`docs/AgentApiDesign.md` — do not edit).
- Agent market fill. Market desk layout (sibling Wave 139).
- HUD-07 deconfliction. HUD-06 home marker.
- Wave 136 OPEN optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04).
- Agent pad 2B. In-repo LLM.

## Reviews

Security HIGH (XSS innerHTML, z-index below scrim, PWR cover via max-height, persist geometry, overlay pause) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after offset + width + PWR-safe max-height + token mirrors + write-set `style.css` only. UI Blocker/Major **resolved as later mint** (live overlap and missing palette stay until PR1).

## Re-review

After freeze (including max-height retune when `top` rises, and width cap so toasts clear): no new HIGH/CRITICAL. MEDIUM dock-credits overlap at z-index 40 documented, not expanded. Did not start Vite/Chrome. Did not write `out/w139/badge/verify/**`.

## Graph

Owner write-set is local files. Did not bind Drive publish. Did not `graph_propose` / `graph_approve`.
