## UI Audit: HUD-06 PR1 home-station marker

**Persona:** designer (parent pass). Review only. Did not edit `src/systems/hud.js` or `src/ui/hud.css`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + merge law `out/w126/homemarker/shared-contract.md` (wins over `docs/Hud06HomeMarkerDesign.md`) + inventory `out/w126/homemarker/current-hud06-home-marker-inventory.md`.
**Worker self-audit:** `out/w127/homemarker/ui-audit.md` — checked, not rubber-stamped. Worker Blocker/Major call is correct. Extra Minors and Suggestions below.

### Summary

PR1 lands a session pad cue that matches the merge law: square cyan pip + distance chip, off-glass home chevron at inset 108, POS `HOME` distance text. The 80 px hub stays empty. Threat amber and NAV-02 ticks stay on their own nodes. Color is not the only cue. No Blocker. No Major.

### What's done well

- Home nodes append to `#hud` (`hud.js:828-834`), not `.rw-reticle` (`hud.js:783-786`). Hub remains 80 px with RANGE only (`hud.css:184-220`).
- Square pip (`hud.css:651-656`, no `rotate`) ≠ chartmark diamond (`hud.css:611-617`, `rotate: 45deg`) ≠ TGT filled amber triangle (`hud.css:585-593`) ≠ NAV-02 two ticks + notch (`hud.css:1070-1106`).
- `HOME_EDGE_INSET = 108` (`hud.js:75`) vs TGT/NAV `EDGE_MARGIN = 84` (`hud.js:74`). Home path never writes transforms onto `edgeArrow` or `gateCue`.
- Distance text is mandatory: POS value `stripHudText(name) + ' · ' + formatNavDist` (`hud.js:2111-2116`); empty name → `'HOME · ' + distText`. Pip label repeats the number string (`hud.js:2118-2120`). Chevron has no words.
- `aria-hidden="true"` on pip and chevron (`hud.js:829,833`). POS row stays the named readout whenever the cue is allowed.
- Hide docked / jump / hail / chart / berth (`hud.js:1815-1821`). Missing or non-finite pad pose hides the cue (`hud.js:1811-1824,1828-1831`). Station lock `kind === 'station'` (`allowedLockKind`, `hud.js:420-423,1339,1832-1833`) hides pip + chevron and keeps the POS row (`hud.js:2106-2108`).
- `textContent` / `el()` only (`hud.js:288-293`). `innerHTML` / `insertAdjacentHTML` / `document.write` count in `hud.js` is 0.
- No `@keyframes` / `animation` / `is-enter` on `.rw-home-mark`. `reducedMotion` still shows a static mark. Global `body.rw-reduced-motion #hud *` already kills animation (`hud.css:1254-1257`).
- Combat dims on-glass like chartmarks (`hud.css:688`, opacity 0.14). POS HOME sits in `.rw-pos.rw-fade` (`hud.js:1040`; fade `hud.css:89`).
- POS `HOME` is its own meter under XYZ (`hud.js:1044-1046`), not `navDistVal`. GATE label stays `GATE` (`hud.js:1037`). Side column stacks nav then POS with 8 px gap (`hud.css:1014-1020`).
- `pointer-events: none` on `.rw-home-mark` (`hud.css:640`). `#hud .is-hidden { display: none }` (`hud.css:36`) beats `.rw-home-pip { display: flex }` (`hud.css:644-648`).
- Create-once nodes + one scratch `homeProj` (`hud.js:1117`). Transforms every frame; POS/pip text at `TEXT_UPDATE_INTERVAL` (`hud.js:67,1914-1917`). Tokens `--cyan` / `--dim` / `--white` for glyph and POS type.
- No new Digit, no new toast slot, no persist key, no Agent API badge steal (grep of `hud.js` home path: none). Chartmark slots and contacts arc are unused for the pad.

### Must-check (contract)

| Check | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px `.rw-reticle`; no home child | Pass | `hud.js:783-786,828`; `hud.css:184-190` |
| Dedicated `.rw-home-mark` square pip + off-glass chevron; not TGT `.rw-edge-arrow`; not NAV-02 `gateCue` | Pass | `hud.js:821-834`; `hud.css:576-594,636-686,1072-1106` |
| `HOME_EDGE_INSET = 108` (TGT/NAV-02 keep 84) | Pass | `hud.js:74-75,1874-1875` vs `1415+/1775-1776` |
| POS label `HOME`, value `stripHudText(name) + ' · ' + dist` (`u`/`k`) | Pass | `hud.js:1045,2111-2116`; `nav-guidance.js:50-53` |
| Hide pip+chevron+row when docked / jumping / hail / chart / berth | Pass | `hud.js:1815-1824,2106-2108` |
| Hide pip+chevron only when `allowedLockKind === 'station'` (keep POS HOME) | Pass | `hud.js:1832-1833,2106-2108` |
| `textContent` / `el()` only; no `innerHTML` | Pass | `hud.js:288-293`; grep 0 |
| `reducedMotion`: no pulse, no `@keyframes` on home mark | Pass | `hud.css:634-688,1254-1257` |
| Combat dim `#hud.in-combat .rw-home-mark { opacity: 0.14 }` | Pass | `hud.css:688` |
| Color is not the only cue (distance text) | Pass | POS `HOME` + pip chip + square vs triangle vs ticks |
| Decorative marks may be `aria-hidden` if POS row stays | Pass | `hud.js:829,833,1044-1046` |
| No new Digit; no toast; no persist; no Agent API badge steal | Pass | home path writers are pip/chevron/POS only |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: On-glass dist chip can clip at the glass edge

**Location:** `src/ui/hud.css:644-668`; `src/systems/hud.js:1854-1859`
**Issue:** Pip is a flex row: 8 px square, then a chip to the right. A pad projected near the right (or bottom) edge can push `8.9k` off glass. Worker already logged this. POS HOME still names distance, so color is not the only remaining cue.
**Fix:** Optional later: flip the chip when `hpx` is near `vw` (PR2 stills). Do not put the chip inside the hub.
**Status:** accepted for PR1; same finding as worker self-audit.

#### 🟡 Minor: `.rw-pos-home` ellipsis does not cap the POS panel

**Location:** `src/ui/hud.css:1115-1125` vs `src/ui/hud.css:1024-1030`
**Issue:** NAV readout has `max-width: 180px`, so its ellipsis fires. `.rw-pos-home .rw-value` sets `overflow: hidden` + `text-overflow: ellipsis` but `.rw-pos` has `min-width: 0` and **no** max-width. A content-sized panel grows with the string; the ellipsis never clips. Authored names still fit. GATE stays a different panel, so this is not a GATE overlap.
**Fix:** Cap `.rw-pos` (180 px like nav) **or** leave as-is and document that ellipsis is reserve for a long `ctx.station.name`.
**Status:** should-fix if a station name grows; not required to ship PR1 with current authored names.

#### 🟡 Minor: Down-right chevron can sit under POS / NAV chrome

**Location:** `src/systems/hud.js:1874-1884`; DOM order `hud.js:828-834` then `hud.js:1006-1046`
**Issue:** Edge math parks the chevron 108 px in from the glass. In the down-right bearing that point falls over the bottom-right stack (`.rw-bottom` / `.rw-side-col`, `hud.css:1005-1020`). Home marks have no `z-index` and are created **before** the POS / GATE panels, so the panels paint on top. The chevron can vanish in that corner. POS HOME (and GATE) stay readable — the opposite of occlusion. Bearing is lost until the player yaws. Inset 108 is frozen; do not move TGT/NAV 84.
**Fix:** Optional PR2: keep inset 108; if the projected edge point hits the bottom-right panel AABB, hide the chevron only (POS HOME remains). Do not raise z-index over POS copy.
**Status:** accepted for PR1.

#### 💡 Suggestion: Home chevron reuses the NAV-02 notch L-shape

**Location:** `src/ui/hud.css:676-686` vs `src/ui/hud.css:1095-1106`
**Issue:** Off-glass home is an open cyan L (`border-left` + `border-top`, `rotate(45deg)`, 18×18). That is the same corner as `.rw-nav-gate-cue-notch` (8×8, `--rw-accent` which **is** `--cyan`). Distinction is the **two ticks** on the gate cue plus the 108 vs 84 seat — not a different chevron drawing. Worker called this “open chevron vs gate ticks,” which is true, but glance ID still depends on noticing the ticks. Contract asked for a dedicated chevron, not a unique silhouette beyond ticks.
**Fix:** Do not restyle in PR1. Playtest (optional PR2): if pad vs next-gate confuses, thicken the home L or drop a square pip on the chevron body. Never steal gate ticks. Do not change inset 108.
**Status:** optional; inset 108 stays locked.

#### 💡 Suggestion: Pip glow does not follow the colorblind accent token

**Location:** `src/ui/hud.css:656` (`rgba(111, 242, 224, 0.55)`); `src/ui/hud.css:1215-1219`
**Issue:** Glyph **border** uses `var(--cyan)` and remaps under `body.rw-colorblind`. The mint box-shadow stays `#6ff2e0`. Chartmarks do the same (`hud.css:617`). Shape + `HOME` text still carry meaning (`#56B4E9` square vs amber triangle vs ticks).
**Fix:** Optional: `box-shadow` via `color-mix` on `var(--cyan)` like the chevron (`hud.css:685`).
**Status:** optional; match chartmark unless a still shows a mint halo in colorblind mode.

#### 💡 Suggestion: POS HOME hide waits on the 5 Hz text tick

**Location:** `src/systems/hud.js:1914-1917,2106-2108` vs per-frame `hideHomeGlass` `hud.js:1203-1211,1822-1824`
**Issue:** Pip + chevron hide on the same frame as dock / jump / hail / chart / berth. The POS `HOME` row toggles only after `TEXT_UPDATE_INTERVAL` (0.2 s). Contract wants no paint under hail/chart/berth cards. Overlay z already covers most of the stack; a 200 ms linger is easy to miss.
**Fix:** Optional: toggle `homeRow` `is-hidden` in the per-frame home block next to `hideHomeGlass`. Keep value writes on the 5 Hz path.
**Status:** optional; existing HUD text cadence.

### Accessibility checklist

- [x] Distance named in text (`HOME` + `u`/`k` via `formatNavDist`)
- [x] Color is not the only cue (square vs triangle vs diamond vs ticks; POS label `HOME`)
- [x] On-glass mark `pointer-events: none`
- [x] Decorative marks `aria-hidden`; POS row is the name whenever the cue is allowed
- [x] `reducedMotion`: no pulse / no `@keyframes` on the home mark
- [x] Combat: dim on-glass (0.14), not hide; POS already `rw-fade` (same as chartmarks; 0.14 type is an existing HUD-01 choice, not a PR1 regression)
- [x] HUD-01 80 px hub empty of home chrome
- [x] Contrast: POS value `--white` on `--panel`; pip chip `--dim` `#7d93ab` on `rgba(2,6,13,0.72)` ≈ 5.9:1 at 9 px (AA). `body.rw-contrast` brightens `--dim` to `#aec3d8`.
- [x] GATE vs HOME: different panels, labels `GATE` vs `HOME`, 8 px stack gap — no shared row
- [x] No new live region (contract: POS row is enough; no HUD-04 toast flood)

### Worker self-audit

Worker `out/w127/homemarker/ui-audit.md` is accurate on hub, hide rules, `textContent`, no pulse, combat dim, and the pip-chip clip. It under-reports the inert POS ellipsis and the down-right chevron-under-panel seat. Those are not Blockers. Do not send PR1 back for taste on chevron size.

### Verdict

**Pass with minors.** Ship PR1. Do not edit product UI in this designer pass.

- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 3
- 💡 Suggestion: 3
