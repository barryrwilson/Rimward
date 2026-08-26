# UI Audit: HUD-06 persistent home-station marker (Wave 126 leftover freeze)

**Auditor:** `[designer]` (independent of `out/w126/homemarker/ui-audit.md`)
**Scope:** Review-only freeze of leftover **REAL** persistent home-station marker (bearing + distance). Named later serial **PR1**. This wave is markdown. No `src/` ship.
**Review file:** `out/w126/designer/homemarker-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Hud06HomeMarkerDesign.md`, merge law `out/w126/homemarker/shared-contract.md` (wins on conflict). Worker self-audit `out/w126/homemarker/ui-audit.md` read, not copied. Live cites: `src/systems/hud.js`, `src/ui/hud.css`. Did not edit those files. Did not edit `docs/Hud06HomeMarkerDesign.md` or `out/w126/homemarker/**`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE]. Graph `graph_resolve` `omp/agent-omp` / `omp` bound `omp/workflow-browser-assisted-work` on weak `ui`/`reuse` terms (coverage 0.08). Parent forbade Vite/Chrome. Calendar/CRM binds ignored. No graph writes.
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w126/homemarker/shared-contract.md` wins if the brief forks. Findings bind **later PR1**. Serial is named only. Later write-set: `src/systems/hud.js` + `src/ui/hud.css` only.

## UI Audit: home-station square beacon + POS HOME + off-glass mark (leftover freeze)

### Summary

No product chrome ships this wave. The pack freezes a session HUD cue: POS `HOME` distance text, on-glass **square** beacon, off-glass **home** mark at inset **108**, dedicated `.rw-home-mark` nodes. Live HUD still gives 8,900 u drifters XYZ only (`hud.js` **1974–1986**). The freeze keeps the 80 px hub empty, does not reuse the amber TGT triangle, forbids `innerHTML`, and makes distance **text** mandatory so color is not the only cue.

**Counts:** 🔴 Blocker **0** open. 🟠 Major **0** open. 🟡 Minor **3** (accepted). 💡 Suggestion **3**.

### Verdict

**CLEAN.** Honor gates pass in freeze. No open Blocker or Major. Live hole until later PR1 is expected.

---

### Honor / Blocker gate

Flag **Blocker** or **Major** if later chrome would land in the aim glass, collide with TGT edge arrows, use `innerHTML`, or use color as the only cue. Those paths are **forbidden** in merge law. Do not treat the live missing mark as a freeze defect.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| HUD-01 empty 80 px hub | Design Honor; mermaid forbidden hub; contract §0.2 no child of `.rw-reticle` | `.rw-reticle` 80×80, RANGE only (`hud.css` **184–218**; `hud.js` **778–781**, clamp **1293**) | **Pass.** POS HOME + world pip/chevron. No hub child. RANGE stays. |
| Do not reuse TGT triangle | Contract §0.8; deputize new `.rw-home-mark`; inset **108**; TGT/NAV-02 keep **84** | One `rw-edge-arrow` amber triangle, `EDGE_MARGIN = 84`, `ctx.targets.current` only (`hud.js` **70**, **816–817**, **1415–1433**; `hud.css` **576–594**) | **Pass.** Never assign transforms onto `edgeArrow`. Distinct seat. |
| Distance text; color not only cue | Contract §0.14; POS `HOME`; pip label may repeat dist; partial merge forbidden §2 | POS is system + `X Y Z` only (`hud.js` **1028–1031**, **1974–1986**). Palette rule: color always pairs with text/shape (`hud.css` **1–4**) | **Pass in freeze.** POS HOME + `Nu`/`N.Nk` mandatory with the pip. |
| `innerHTML` forbidden | Contract §0.3; copy `textContent` / `el()` / `stripHudText` | `el()` **283–288**; `stripHudText` **421–428**; grep `innerHTML` in `hud.js` = **0** | **Pass.** Station name never HTML. |
| Hide hail/chart/berth/dock/jump | Contract §0.1 hide table; design player outcome | Chartmarks hide docked only (`hud.js` **1659**). TGT/NAV park docked/jump (`1418`, **1692**). Hail z 40 still paints HUD | **Pass in freeze.** Home hides on those five. Overlay cards do not get a pad pip. |
| No pulse / `reducedMotion` | Contract §0.13; no `@keyframes` / `is-enter` | Chartmarks static (`hud.css` **597–598**). Contacts pulse skip on reduced motion (`hud.js` **1617**) | **Pass.** Show static. Transform/opacity only. |
| Selected POI omit | Contract §0.1; inbox “or POI” out of PR1 | Chartmarks are mystery landmarks (`hud.js` **824–841**). No generic picker | **Pass.** Home station first. Do not park. |
| Do not steal NAV-02 GATE | Contract §0.7 | `gateCue` ticks+notch (`hud.js` **818–822**, **1718–1752**); GATE row **1025–1026**, **2033–2034** | **Pass.** Own POS HOME row. Optional `formatNavDist` is the number helper only (`nav-guidance.js` **50–54**). |
| No Agent API badge / hail copy / Digit / toast | Contract §0.9–0.11 | Toast five slots (`hud.js` **63–66**). No `rw-agent` in live HUD | **Pass.** Instrument only. |
| `state.js` READ-ONLY; no persist | Contract §0.4–0.5 | `U.DOCK_RANGE` already imported | **Pass.** Session/UI only. |

If a later worker parents HOME into `.rw-reticle`, restyles `.rw-edge-arrow`, prints home dist on `navDistVal`, ships a pip without POS HOME text, uses `innerHTML` of `ctx.station.name`, pulses the mark, or lands a POI picker, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Leftover REAL (not CONSUME) | **Pass.** No persistent pad bearing+distance on or off glass unless the station is the current lock. | inventory §1; `hud.js` **816**, **1415–1433**, **1974–1986** |
| Dedicated class | **Pass in freeze.** `.rw-home-mark` authored. Not chartmark slots. Not `edgeArrow`. Not `gateCue`. | contract §0.1, §0.12, §0.15 |
| On-glass glyph | **Pass in freeze.** Square beacon + label. Not TGT bracket. Not chartmark diamond (rotated 7 px square, `hud.css` **611–618**). Not hub. | contract on-screen row; design §3 |
| Off-glass glyph | **Pass in freeze.** Own node; inset **108**; behind-camera flip like TGT **1373–1374**. Not amber `::before` triangle (`hud.css` **585–594**). Not NAV-02 two ticks + notch (`hud.css` **1014–1050**). | contract off-screen row; `HOME_EDGE_INSET = 108` |
| POS HOME copy | **Pass in freeze.** Label `HOME`. Value `stripHudText(name) + ' · ' + distText` (empty name → `HOME · dist`). Do not say GATE or TARGET. | contract copy table |
| Dist units | **Pass.** Chartmark buckets (`hud.js` **1856–1858`): `<1000` → `Nu`; `>=1000` → `N.Nk`. Same as `formatNavDist`. | contract distance row |
| Station lock de-stack | **Pass in freeze.** Hide pip+chevron when `lockKind === 'station'`. Keep POS HOME. Bracket already `name` + `dist u` (`hud.js` **415–418**, **2073–2075**). | contract §0.1; fail-closed table |
| Overlay hide | **Pass in freeze.** `docked`, `gate.jumping`, `hailOpen`, `chartOpen`, `berthOpen`. Hide on-glass **and** HOME row under cards. | contract hide 1–7; §2 |
| In-zone before dock | **Pass.** Hide is `flags.docked`, not `inZone`. `J` / `Dock` at 45 u may stack with the mark until dock (`hud.js` **2169–2170**; `state.js` **30**). | design player outcome |
| Fail closed | **Pass.** Missing pose → hide; never throw. `#hud` missing already disables HUD (`hud.js` **772**). | contract §0.12, §2 |
| Create-once | **Pass in freeze.** One pip + one chevron + POS values. Scratch `Vector3` at init next to `chartProj` (`hud.js` **1101**). Text throttled (`TEXT_UPDATE_INTERVAL` **63**). | contract §0.15 |
| Pointer hit | **Pass.** `#hud` is `pointer-events:none` except AP/AM/controls (`hud.css` **5–7**, **1100**). Chartmarks set `none` (`606`). Home must stay inert. | — |
| Combat | **Accepted.** Dim on-glass like chartmarks (`#hud.in-combat .rw-chartmark` **632**; `.rw-fade` **89**). Do not put HOME on tgt DIST rail (`hud.js` **937–939**). | contract combat row |
| Write-set | **Pass.** Later `hud.js` + `hud.css` only. | contract §0.6, §5 |

---

### What's done well

- Census matches live glass: POS XYZ (`hud.js` **1028–1031**, **1974–1986**), TGT amber triangle (`816`, **1415–1433**; `hud.css` **576–594**), NAV-02 ticks (`818–822`, **1718–1752**), chartmark diamonds (`824–841**, **1847–1858**), dock `J` only inside 45 u (**2169–2170**). No `.rw-home-mark`. Leftover **REAL** is the right call.
- HUD-01 stays closed. Combat rails already sit off center (`hud.js` **916–917**). Home is a **fourth identity** (square + `HOME` text), not a reticle gauge.
- Shape language in the freeze is distinct from live neighbours: threat = amber triangle; gate = two ticks + notch; landmark = cyan diamond; home = unrotated square + own edge mark.
- Inset **108** vs TGT/NAV-02 **84** gives a different seat when three cues share a bearing. Contract forbids writing `edgeArrow.style.transform` / `gateCue.style.transform` for home.
- Accessibility: named `HOME` + `u`/`k` text; chevron may be `aria-hidden` only while POS HOME is visible; no pulse; no new Digit; no sixth toast; `textContent` + `stripHudText`.
- Overlay hide matches Wave 125 cards (hail / chart / berth) so a world pip does not decorate those desks. Dock and jump park like other flight instruments.
- Selected POI omit avoids a second picker and persist. Chartmarks already mark mystery landmarks.
- Worker self-audit (`out/w126/homemarker/ui-audit.md`) already locked hub, glyph, text cue, overlay hide, and lock de-stack. This pass **agrees**. Do not reopen CONSUME or TGT-triangle reuse.

---

### Findings

#### 🔴 Blocker: Aim-glass HOME gauge
**Location:** `src/ui/hud.css:184-218`; `src/systems/hud.js:778-781`, `1293`
**Issue:** A compass, range ring, or HOME glyph inside `.rw-reticle` is an aim-glass gauge. Inbox is “where is the pad,” not a hub child.
**Suggestion:** POS `HOME` row + world-projected `.rw-home-mark` only. RANGE stays.
**Status:** **resolved** in contract §0.2. Live hub stays empty until PR1 (expected).

#### 🟠 Major: Reuse of TGT `.rw-edge-arrow`
**Location:** `src/systems/hud.js:70`, `816-817`, `1415-1433`; `src/ui/hud.css:576-594`
**Issue:** Playtest: “Threats get an edge arrow; the station does not.” Recolor of that triangle still reads as incoming danger, especially in combat and for color-blind players. Dual-use would hide a combat lock.
**Suggestion:** New `.rw-home-mark` nodes. Never the amber `border-bottom` triangle. Inset **108**.
**Status:** **resolved** in contract §0.8 and deputize off-screen row.

#### 🟠 Major: Color or position as the only cue
**Location:** inbox 8,900 u; live POS `src/systems/hud.js:1986`
**Issue:** An edge pip without numbers returns the player to mental trig on XYZ. Color-only bearing fails color-blind play.
**Suggestion:** Mandatory POS `HOME` + `Nu`/`N.Nk` in the same PR as the pip. Partial merge forbidden.
**Status:** **resolved** in contract §0.14, §2.

#### 🟠 Major: `innerHTML` of station name
**Location:** live sink `src/systems/hud.js:283-288`, `421-428`; later POS HOME / pip label
**Issue:** `innerHTML` / `insertAdjacentHTML` of `ctx.station.name` is XSS and is forbidden HUD copy.
**Suggestion:** `textContent` / `el()` / `createTextNode` + `stripHudText` only.
**Status:** **resolved** in contract §0.3. Live `hud.js` has **0** `innerHTML`.

#### 🟠 Major: Overlay cards vs world pip
**Location:** hail / chart / berth flags; dock prompt `src/systems/hud.js:2169-2170`
**Issue:** A projected mark paints through hail demand and berth desk. Inbox did not ask to decorate those cards.
**Suggestion:** Hide pip, chevron, and HOME row on `hailOpen` / `chartOpen` / `berthOpen` / docked / jumping.
**Status:** **resolved** in contract hide table.

#### 🟠 Major: Double chrome when station is the lock
**Location:** `src/systems/hud.js:2073-2075`; `allowedLockKind` **415-418**
**Issue:** KeyV lock already names the pad + `dist u` and can show the amber arrow off-screen. A second pip/chevron stacks on glass.
**Suggestion:** Hide on-glass home when `lockKind === 'station'`. Keep POS HOME.
**Status:** **resolved** in contract §0.1.

#### 🟡 Minor: Combat fade dims HOME while fighting far from the pad
**Location:** `#hud.in-combat .rw-fade` `src/ui/hud.css:89`; chartmark dim **632**; POS `rw-fade` `src/systems/hud.js:1028`
**Issue:** Far-pad nav during combat will dim. Text still exists. Consistent with non-critical instruments (§13.2).
**Suggestion:** Same 0.14 on `.rw-home-mark`. Do not promote HOME onto the tgt DIST rail (`hud.js:937-939`).
**Status:** **accepted.**

#### 🟡 Minor: Long station names overflow `sideCol`
**Location:** `ctx.station.name`; POS `src/systems/hud.js:1028-1031`; nav ellipsis `src/ui/hud.css:1005-1009`; `.rw-pos` **968**; nav max-width **970-974**
**Issue:** `Name · 8900u` on POS can overflow the 180 px-capped NAV column into combat rails at high text scale.
**Suggestion:** PR1 CSS `ellipsis` like nav dest. `stripHudText`. `textContent` only. Cap the HOME value, not the 80 px hub.
**Status:** **accepted** — later PR1 CSS; not a live hole.

#### 🟡 Minor: Off-screen “home chevron” vs live “Gate chevron” comment
**Location:** NAV-02 comment `src/ui/hud.css:1014-1050`; freeze “home chevron”; TGT triangle **585-594**
**Issue:** Live CSS already names the gate cue a chevron. A CSS `border` triangle for home would collide with TGT language even at inset 108.
**Suggestion:** PR1 must not copy `.rw-edge-arrow::before` or `.rw-nav-gate-cue` ticks. Keep the off-glass mark a dedicated `.rw-home-mark` glyph (open V or square-derived), non-amber tokens (`var(--cyan)` / `--dim`), not `--amber`.
**Status:** **accepted** — contract already forbids those two nodes; PR1 CSS must stay distinct.

#### 💡 Suggestion: Pip label vs RANGE when the pad is near center
**Location:** RANGE `src/ui/hud.css:207-218`; pip label in contract copy table
**Issue:** A long labeled square on the pad can sit on the aim column without being a reticle child (same as chartmarks).
**Suggestion:** Dist-only pip label (name lives on POS). Keep the square small. Hide on-glass when station is the lock (already frozen).

#### 💡 Suggestion: Tiny viewport inset
**Location:** TGT math `src/systems/hud.js:1426-1429`; freeze `HOME_EDGE_INSET = 108`
**Issue:** If half-width is less than 108, `(cx - 108) / ax` goes negative and the mark can invert toward center.
**Suggestion:** Clamp inset to `min(108, cx - n)` with the same non-finite `s = 1` guard TGT uses. Do not solve it by moving the mark into the hub.

#### 💡 Suggestion: Do not add a sixth toast or live region
**Location:** HUD-04 five slots `src/systems/hud.js:63-66`; toasts `src/ui/hud.css:635-638`
**Issue:** “You are 8.9k from home” as a toast floods the channel. POS is not `aria-live` today; that matches XYZ.
**Suggestion:** Instrument only. Contract §0.11. Chevron `aria-hidden` only while POS HOME is visible.

---

### Accessibility checklist (later PR1)

- [x] Distance named in text (`HOME` + `u`/`k`) — freeze
- [x] Color is not the only cue (square vs triangle vs gate ticks vs diamond)
- [x] On-glass mark `pointer-events: none` (inherit `#hud` + match chartmarks)
- [x] Chevron `aria-hidden` only with POS HOME visible
- [x] No new Digit
- [x] No pulse when `reducedMotion`
- [x] `textContent` / `el()` only; no `innerHTML`
- [x] Aim-glass gauges stay off; no hub child
- [x] Hide under hail/chart/berth/dock/jump
- [x] Do not steal NAV-02 GATE copy or TGT TARGET copy
- [x] Do not steal Agent API badge seat
- [x] Tokens, not threat amber, for home chrome
- [ ] Live stills after PR1 (optional PR2) — not this wave

---

### Re-review

No remaining Blocker/Major in the **design freeze**. Live HUD still lacks the mark (expected leftover). Glyph, POS HOME text, hub empty, overlay hide, lock de-stack, no pulse, POI omit, and no TGT triangle reuse are locked in merge law. Implement in a later serial **PR1** only. Do not implement in Wave 126.
