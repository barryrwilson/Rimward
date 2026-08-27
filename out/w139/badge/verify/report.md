# Wave 139 Agent play badge leftover — verifier report

## Status
CLEAN

## What I tested
- Worker write-set: listed markdown only. No `src/` land in this pack. No `PROGRESS.md`. No wishlist. No `docs/AgentApiDesign.md`. No sibling `out/w139/mktdesk` / `out/w139/mktfill` edits from this pack. No `out/w139/badge/verify/**` from the worker.
- Live census vs `src/style.css` `.rw-agent-badge` (pin, z-index, tokens, reduced-motion).
- Live Manifest / toasts / PWR / RANGE / colorblind / contrast in `src/ui/hud.css`.
- Live badge mount in `src/systems/agent-api.js`.
- Live Manifest meters in `src/systems/hud.js`.
- Contract vs design: leftover REAL, named serial PR1, write-set `src/style.css` only.
- Line cites vs live file:line.
- Did **not** start Vite or Chrome. Did **not** run boot-test.

## Bugs found
None.

## Environmental issues
None. Owner forbade Vite/Chrome. Graph research-and-briefing asked for browser; this verify stayed on disk.

## Evidence

### Worker scope
Untracked pack files:

- `docs/AgentBadgeLayoutDesign.md`
- `out/w139/badge/current-agent-badge-layout-inventory.md`
- `out/w139/badge/shared-contract.md`
- `out/w139/badge/security-review.md`
- `out/w139/badge/code-review.md`
- `out/w139/badge/ui-audit.md`
- `out/w139/badge/notes.md`

Working-tree edits to `src/style.css`, `src/systems/agent-api.js`, `src/systems/hud.js`, `src/ui/hud.css`, `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, and `docs/AgentApiDesign.md` are other / prior work. Badge PR1 tokens are **not** in live CSS. `git diff src/style.css` is the earlier top-right pin (`top: 16px`), not this leftover mint.

### Leftover REAL / PR1 (earned)
Live overlap and missing palette are both true. CONSUME would be wrong.

| Hole | Live | Cite |
|---|---|---|
| Badge pin | `top: 16px; right: 16px; z-index: 40; max-width: min(280px, calc(100vw - 32px))` | `src/style.css` 38–48 |
| Manifest | `.rw-resources` `top: 14px; right: 14px; min-width: 132px` | `src/ui/hud.css` 1172–1176 |
| Meters | Manifest UU / FEAR / CARGO | `src/systems/hud.js` 1263–1274 |
| Toasts | `.rw-toasts` `top: 14px; right: 168px` | `src/ui/hud.css` 710–713 |
| HUD stack | `#hud` `z-index: 10` under badge 40 | `src/style.css` 24–29 |
| Palette | `body.rw-colorblind #hud` / `body.rw-contrast #hud` only | `src/ui/hud.css` 1234–1248 |
| Badge palette | no `body.rw-colorblind .rw-agent-badge` / `body.rw-contrast .rw-agent-badge` | grep `src/**/*.css` |

280 px from `right: 16px` crosses toast `right: 168px`. Same corner as Manifest. Body-child local tokens do not inherit `#hud` overrides.

### Freeze checks
| Freeze | Result |
|---|---|
| z-index **40** | Live `src/style.css` 43. Contract and design keep 40. |
| Do not drop below scrim 20 | Scrim `.screen-overlay` `z-index: 20` (`src/ui/screens.css` 16). Contract §0.8. |
| Do not cover PWR / RANGE | PWR `.rw-bottom` `bottom: 12px` (`hud.css` 1021–1025); `makeBar(..., 'PWR')` (`hud.js` 1223). RANGE `.rw-reticle-range` hub (`hud.css` 207–220; `hud.js` 994). Deputize keeps top-right; retunes `max-height: calc(100vh - 156px)` when `top` becomes `140px`. |
| Body child, not `#hud` | `body.appendChild(root)` `agent-api.js` 566; `mountAgentBadge` 706. Contract §0.7. |
| Later write-set | `src/style.css` only (contract §0.18 and §1). |
| Merge law | Design points at contract; both say REAL / PR1 / same deputize knobs. No conflict. Contract wins if later drift. |

### Line cites (spot-check)
| Claim | Live |
|---|---|
| Badge reduced-motion `style.css` 128–132 | yes |
| ON/OFF solid/dashed `style.css` 61–67 | yes |
| Buttons 44 px `style.css` 107–108 | yes |
| `makeBadgeNode` / `textContent` `agent-api.js` 511–515, 535, 571–581 | yes |
| `type="button"` `agent-api.js` 548–556 | yes |
| `queryOptIn` `agent-api.js` 48–71, 640 | yes |
| Trusted enable `agent-api.js` 664–680 | yes |
| Panel min-width 148 `hud.css` 45 | yes |
| Okabe-Ito hex `hud.css` 1234–1238 | `#56B4E9` / `#E69F00` / `#D55E00` / `#009E73` |
| Contrast tokens `hud.css` 1243–1248 | match contract copy |
| Body classes `settings.js` 70–73 | yes; `--rw-text-scale` on `#hud` only |
| z-stack: chart 30 / onboard 35 / hail 40 / pause 50 / berth 60 / title 70 / settings 80 | `hud.css` 1996; `onboarding.js` 84; `hail.js` 385; `main.js` 171; `save.js` 1372; `origins.js` 106; `screens.css` 511; `settings.js` 93 |
| Wishlist P2 313–317 / P3 324–327 / DONE PWR pin 283–285 | yes |

### Deputize math (not playtested in browser)
- XL Manifest: panel pad + title + three meters ≈ 111 px + `top: 14px` ≈ 125 px. `top: 140px` leaves a gap.
- Toast clear: badge `right: 16px` + width 148 → left edge at 164 px from right; toast column at 168 px.
- `max-height: calc(100vh - 156px)` = 140 px top + 16 px bottom inset (same bottom inset as live `100vh - 32px` with `top: 16px`). Typical short card stays above PWR. Honor still forbids a bottom-right pin.

### Screenshots
None (disk-only verify).

### Logs
None.

### Test output
- This file: `out/w139/badge/verify/report.md`
- Write-set: `out/w139/badge/verify/write-set.txt`
