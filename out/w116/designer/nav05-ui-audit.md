# UI Audit: NAV-05 remaining autopilot gate handoff (Wave 116)

**Auditor:** `[designer]` (independent of `out/w116/nav05/ui-audit.md`)
**Scope:** Re-audit after worker freeze patch of the prior Major (fly-path cancel under the chart overlay). Later player-facing Autopilot cancel/refuse English; in-flight chip dest/next/rem; empty 80 px hub honor; toast vs chip vs chart live while the chart is open. Markdown leftover brief, not a running page.
**Review file:** `out/w116/designer/nav05-ui-audit.md` (rewritten this pass)
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Nav05HandoffDesign.md`, merge law `out/w116/nav05/shared-contract.md` (wins on conflict). Worker self-audit `out/w116/nav05/ui-audit.md` read, not copied. Live cites: `src/game/autopilot.js`, `src/systems/hud.js`, `src/ui/hud.css`, `src/style.css`, `src/systems/galaxychart.js`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-24 (re-audit)
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w116/nav05/shared-contract.md` wins if the brief forks. This wave does not ship overlay CSS. Findings bind **later PR1**. Serial is named only. Later write-set must not claim `hud.js` / `hud.css` / `controls.js`. Later PR1 **may write** `src/systems/galaxychart.js` **only** for existing `#rw-galaxy-ap-live` fly-cancel paint.

## UI Audit: NAV-05 Autopilot cancel/refuse English + chip / chart stacking (leftover freeze)

### Summary

No product chrome ships this wave. The pack freezes leftover as **distinct `AP_LINES` / `BREAK_LINE` English** on existing chart `apLine` + HUD `commLine`, plus **no chip reason paragraph**. Dest / next / rem and Cancel stay on `#hud .rw-autopilot`. The 80 px hub stays empty. Chart stays open on engage. Prior Major (fly-path cancel under the KeyM overlay) is **addressed in freeze**: later PR1 writes `galaxychart.js` only so existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, including chart Cancel. Live `src/` still does not paint that path (Wave 116 markdown only).

**Counts:** 🔴 Blocker **0**. 🟠 Major **0** open (**1** addressed in freeze). 🟡 Minor **3**. 💡 Suggestion **3**.

### Verdict

**CLEAN.** Copy split, hub/chip honor, and chart-open fly-cancel paint path are sound in the freeze. No open Blocker or Major.

---

### Honor / Blocker gate

Flag **Blocker** if the brief would put a reason pip on `.rw-reticle`, steal Digit 0/8/9, rewrite chip dest/next/rem in `hud.js`, or leave later copy undiagnosable and unreadable in the default chart-open engage path in a way that makes Autopilot unusable. Hub, Digit, and chart-open visibility **pass** in freeze.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| HUD-01 empty 80 px hub | Design Honor; contract §0.3; Picture “No hub pip” | `.rw-reticle` 80×80, `pointer-events: none` (`hud.css` 184–193) | **Pass.** Chip is `#hud .rw-autopilot`, not a reticle child. |
| Chip dest / next / rem stays | Contract §0.12; design §4; Picture | Spans + Cancel (`hud.js` 1033–1041, 1977–1984) | **Pass.** PR1 forbids a reason paragraph on the chip. |
| Failure English on `AP_LINES` + `commLine` + chart `apLine` | Contract §0.12 / §0.1 / §0.15; design 222–228 | `AP_LINES` (`autopilot.js` 20–32); `BREAK_LINE` 34–39; `sayLine` 127–129; chart `showApLive` (`galaxychart.js` 572–576, 627–630) | **Pass in freeze.** Refuse already paints `apLive`. Fly cancel named on the same region. |
| Digit 0–9 / KeyM / KeyV stay | Contract §0.3 | Chart KeyM; AP file has no Digit | **Pass.** No new letter. |
| `innerHTML` forbidden | Contract §0.4 | Chip/chart `textContent`; toasts `textContent` (`hud.js` 1169) | **Pass.** Frozen literals, not dest-id concat. |
| Contrast restyle of chip | Worker self-audit | `body.rw-contrast #hud .rw-autopilot` (`hud.css` 1167–1176); chart contrast (`hud.css` 2240–2246) | **Pass.** No new unthemed color. |
| `reducedMotion` | Design player outcome | `#hud *` and `.rw-galaxy-chart *` kill animation (`hud.css` 1185–1188, 2265–2266) | **Pass.** Leftover adds no motion. |
| No claim of `hud.js` / `hud.css` / `controls.js` | Contract §0.12 | Chip paint and toast CSS stay sibling-owned | **Pass.** Overlay stacking fix is `galaxychart.js` live-region paint, not HUD z-index. |
| Chart-open fly cancel on `#rw-galaxy-ap-live` | Contract §0.15; design Goals 10/12, Picture 260–263 | Live refuse only (`galaxychart.js` 619–634). Fly `disengage` emits `autopilotDisengaged` (`autopilot.js` 193) and does not write `apLive`. Chart Cancel does not `showApLive` (`galaxychart.js` 621–624). | **Pass in freeze.** Allowed later file is `galaxychart.js` only. Do not treat live gap as a freeze defect. |

If a later worker parents AP chrome into `.rw-reticle`, puts a reason paragraph on the chip via `hud.js`, maps lookup/path/hub back onto one “next gate is missing” line, closes the chart on engage, or lands fly cancel only on HUD toasts, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Distinct refuse vs cancel prefixes | **Pass.** Table keeps `Autopilot refused —` vs `Autopilot cancelled —` plus distinct second clauses except lookup pair. | contract §0.1 English table; design 209–217 |
| Forbidden collapse | **Pass in freeze.** Lookup / path / hub / wrap must not map to `missingGate` / `missingHop`. | contract §0.1; design 220 |
| Engage refuse on chart | **Pass.** Click still `apLine(token)` + `showApLive` + `commLine`. New refuse tokens inherit this without a chart rewrite. | `galaxychart.js` 619–634; `apLine` `autopilot.js` 220–223 |
| Fly cancel toast | **Wired in AP only today.** `disengage` paints `BREAK_LINE` via `commLine`. Unknown tokens emit **no** toast. PR1 must add cancel tokens to **both** maps. | `autopilot.js` 181–196; contract §0.1 |
| Chart-open fly cancel (prior Major) | **Addressed in freeze.** Later PR1: existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` while `ctx.flags.chartOpen === true`, including chart Cancel. Consume `autopilotDisengaged` **or** paint `ctx.autopilot.reason` — same visible result. Paint literals only. `restore` silent. | contract §0.15, Chart-open fly cancel; design 225–228, 268–277; live overlay `hud.css` 1898–1912 vs `#hud` `style.css` 24–28 |
| In-flight chip dest/next/rem | **Pass.** Dest name, next name, remaining count, Cancel. Hidden when `autopilot !== true`. No reason paragraph. | `hud.js` 1033–1041, 1714–1717, 1977–1984 |
| Chip vs toast stack (chart closed) | **Pass.** Chip center (`hud.css` 648–658); toasts top-right (`hud.css` 635–646). Reason is toast, not chip. | — |
| Toast vs chip while chart open | **Accepted.** Chart `position:fixed; inset:0; z-index:30` (`hud.css` 1898–1912). `#hud` is `z-index:10` (`style.css` 24–28). Overlay scrim covers chip and toasts. Sighted fly-cancel line is `#rw-galaxy-ap-live` in the chart header (`galaxychart.js` 137–141, 165–167; `hud.css` 1963–1970), not HUD. | contract §0.15; HUD toast-under-overlay is **not** leftover law |
| Chart live region | Live: refuse only. Freeze: fly `disengage` + chart Cancel also `showApLive`. Header slot already exists (`flex: 1; min-width: 0`). `AP_LIVE_LIFE` 4s may stay. | `galaxychart.js` 569–576, 619–634, 707 |
| Named controls | **Pass.** Autopilot `button` + `aria-label`; Cancel `aria-label` “Cancel autopilot”; Space swallowed. | `galaxychart.js` 147–153; `hud.js` 1037–1040 |
| Close chart on engage | **Pass (forbidden).** P2 inbox waits. `tryEngage` does not close the overlay. | contract §0.15; `autopilot.js` 210; design 269 |
| Empty / fail closed | **Pass.** No emit; keep route; never freeze the sim. `#hud` missing: live disable, no throw. `#rw-galaxy-ap-live` missing: no throw; chart-closed `commLine` still may fire. | contract §2 |
| Theming | **Pass.** Chip/toast use `--cyan` / `--white` / contrast overrides. Chart live uses `--dim`. New copy is text, not a new color token. | `hud.css` 661–678, 716–734, 1172, 1963–1970 |

---

### What's done well

- Census refuses CONSUME. Live `missingHop` and `missingGate` share “next gate is missing” (`autopilot.js` 27, 30). Path fail, fly lookup, hub not-listed, and hub wrap all `disengage('missingGate')`. Distinct later strings are the right leftover, not a new widget.
- Prefix split matches live MATCH / noDest / helm cancel: refuse vs cancelled is the first word the player can trust. Second clauses then split hop vs lookup vs path vs hub vs wrap vs missing `path[1]`.
- Chip stays dest / next / rem / Cancel (`hud.js` 1033–1041). Automine already proved a sibling chip can hold a Cancel `button` without a hub child. NAV-05 does not steal that pattern into `.rw-reticle` (`hud.css` 184–193).
- Chart Autopilot is a real `button` with `aria-describedby="rw-galaxy-ap-live"` and `role="status"` `aria-live="polite"` (`galaxychart.js` 137–153). Refuse copy is status text, not a mystery icon. The same node is the named fly-cancel surface.
- In-flight Cancel is a real `button`, `aria-label` Cancel autopilot, `min-height: 24px`, `:focus-visible` outline (`hud.js` 1037–1041; `hud.css` 691–714). `pointer-events: auto` only on that control (`hud.css` 673, 693).
- `innerHTML` stays forbidden. Lines are frozen literals. Proto dest cannot concatenate into the toast or the chart live region.
- Contrast body already restyles `#hud .rw-autopilot` and `#hud .rw-toast` (`hud.css` 1167–1176) and chart `--dim` (`hud.css` 2240–2246). Leftover adds no hardcoded hex.
- Digit 0–9 / KeyM / KeyV / RANGE / HUD-02 / CTL-01 stay out of the write-set. Fail closed never freezes the sim.
- Freeze does not steal P2 close-chart-on-engage. It does not raise HUD toast z-index. It reuses the live chart header slot (`galaxychart.js` 165–167) that already sits above the overlay scrim.
- Worker self-audit now closes the chart-open Major in freeze. This pass **agrees**. Do not reopen “one toast for every failure” or “cancel in the activation zone” as CONSUME.

---

### Findings

#### 🟠 Major: Fly-path cancel English is under the chart overlay

**Location:** `docs/Nav05HandoffDesign.md:114–116, 152–154, 222–228, 260–263, 268–277, 310–312`; `out/w116/nav05/shared-contract.md` §0.12 / §0.15 / Chart-open fly cancel / §3 PR1; live `src/ui/hud.css:1898–1912`; `src/style.css:24–28`; `src/systems/galaxychart.js:572–576, 619–634`; `src/game/autopilot.js:181–196`
**Issue (prior):** Player outcome is: plot on KeyM chart, click Autopilot, ship flies. The chart does not close. Engage refuse is visible in `#rw-galaxy-ap-live` (z-index 30). Fly-path tokens painted only through `disengage` → `commLine` → `#hud .rw-toasts` (z-index 10). Chart Cancel did not `showApLive`. Fly `disengage` never wrote `apLive`. Prior write-set omitted `galaxychart.js` and forbade `hud.js`, so there was no allowed paint path on the surface the player looks at.
**Fix landed (markdown):** Keep chip dest/next/rem. No reason paragraph on the chip. Do not steal `hud.js` / `hud.css` / `controls.js`. Expand later PR1 write-set to `src/systems/galaxychart.js` **only** so existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, including chart Cancel. Do **not** close the chart on engage (P2 inbox waits). Do **not** treat HUD toast-under-overlay as NAV-03 leftover law. `apLine` already maps tokens in `AP_LINES` (`autopilot.js` 220–223); PR1 must add cancel-family tokens to **both** `AP_LINES` and `BREAK_LINE` so `apLine(reason)` is not blank. Chart may consume `autopilotDisengaged` (`autopilot.js` 193) or paint `ctx.autopilot.reason` while open. Unknown tokens stay blank. `restore` stays silent. Existing `AP_LIVE_LIFE` timer may stay. Do not restyle overlay z-index. Do not rewrite chart layout.
**Live gap (expected):** `src/` this wave is unchanged. Chart Cancel still returns after `disengage` without `showApLive` (`galaxychart.js` 621–624). Chart does not subscribe to `autopilotDisengaged`. That is later PR1, not an open freeze Major.
**Status:** addressed in freeze (contract §0.15 + `docs/Nav05HandoffDesign.md`). Do not reopen as a Wave 116 freeze defect. Later PR1 must land the named paint path before it reports DONE on player-facing copy.

#### 🟡 Minor: `missingLookup` and `lookupFail` share the second clause

**Location:** `out/w116/nav05/shared-contract.md:87–88`; `docs/Nav05HandoffDesign.md:212–213`
**Issue:** Both say “next gate is not in this system.” Diagnosis still works via **refused** vs **cancelled**. Same pattern as live missingHop/missingGate.
**Fix:** Keep the prefix split. Do not invent a third sentence unless PR2 playtest retunes.
**Status:** accepted deputize. Owner may override.

#### 🟡 Minor: HUD toasts force uppercase; chart live does not

**Location:** `src/ui/hud.css:716–730` (`.rw-toast` `text-transform: uppercase; white-space: nowrap`); `src/ui/hud.css:1963–1970` (`.rw-galaxy-ap-live` sentence case, `--dim`); deputize strings in contract §0.1
**Issue:** Same `AP_LINES` string, two casings. Chart-open fly cancel now uses the sentence-case live region (the surface the sighted player reads). HUD toasts still uppercase when the chart is closed. Distinct second clauses still read in caps. `nowrap` plus `letter-spacing: 0.16em` can run long at XL text scale; new lines are not longer than live “already in the destination system.” Header live uses `flex: 1; min-width: 0` without `nowrap`; long cancel lines wrap or clip in the existing slot (same as refuse).
**Fix:** Keep sentence-case `AP_LINES`. Do not author ALL CAPS strings. Do not retune `.rw-toast` or `.rw-galaxy-ap-live` in this leftover (`hud.css` is sibling-owned).
**Status:** accepted live pattern. Not a leftover edit.

#### 🟡 Minor: Chart Autopilot dim is not `disabled`

**Location:** `src/systems/galaxychart.js:595–616`; `src/ui/hud.css:1996–2000`
**Issue:** No-route uses `disabled = true`. MATCH / missing hop / lookup refuse uses `aria-disabled="true"` + `.is-dim` and still receives click so `apLive` can speak. Opacity 0.7 on dim. That is live NAV-03 and the right refuse pattern for new `missingLookup`. Color is not the only cue (`aria-disabled` + live text).
**Fix:** Do not flip dim to `disabled` in PR1 (would swallow the new refuse line).
**Status:** accepted. Honor live.

#### 💡 Suggestion: Chip dest / next / rem have no visible labels

**Location:** `src/systems/hud.js:1033–1036, 1977–1984`; `src/ui/hud.css:683–688`
**Issue:** Three unlabeled nowrap spans: dest name, next name, remaining integer. Nav panel uses NEXT / DEST labels (`hud.js` 980–983). Automine uses an AUTOMINE label. A player can confuse dest vs next. Leftover correctly forbids a chip rewrite.
**Fix:** Out of NAV-05 write-set. If HUD-02 ever retouches the chip, add terse DEST / NEXT / REM prefixes without a reason sentence.
**Status:** live. Do not steal `hud.js` to fix here.

#### 💡 Suggestion: “hub spoke cycle failed” is shop jargon

**Location:** `out/w116/nav05/shared-contract.md:91`; `docs/Nav05HandoffDesign.md:215`
**Issue:** Distinct from hub-not-listed and missing-gate. “Spoke cycle” is the KeyG modulo, not a player word.
**Fix:** Optional PR2: `Autopilot cancelled — hub route cycle failed.` Keep the `hubWrap` token.
**Status:** optional. Prefix + “hub” already diagnose.

#### 💡 Suggestion: Refuse can announce twice

**Location:** `src/systems/galaxychart.js:627–630`; `src/systems/hud.js:813–816`; contract Chart-open fly cancel
**Issue:** Chart refuse writes `apLive` and emits `commLine`. Fly-cancel PR1 will inherit that if `commLine` stays (`disengage` already `sayLine`s). Screen readers may hear the same sentence from chart `aria-live` and HUD toasts. Live NAV-03. Chart-open, the HUD copy is visual-hidden but still live in the a11y tree.
**Fix:** Optional: `showApLive` when `chartOpen`, skip duplicate `commLine` for that chart-open disengage only. Do not drop `commLine` when the chart is closed. Not required to keep the Major closed.
**Status:** optional. PR1 already touches `galaxychart.js` for fly-cancel paint; this skip is still not required.

---

### Accessibility (spec)

- No new unlabeled control. Cancel and Autopilot already named. Space `preventDefault` stays on those buttons (`guardAutopilotSpace`).
- New copy is status text (`commLine` / chart `role="status"`), not a color-only badge and not `innerHTML`.
- Keyboard: click/Enter on Autopilot; KeyM/KeyV/Digit unchanged. AP jump stays independent of KeyD.
- `reducedMotion`: no new loops. Gate overlay already respects reduced motion.
- Fail closed: missing / reserved hop → no emit, keep route, never throw. Missing `#rw-galaxy-ap-live` → no throw.
- Chart-open fly cancel: sighted player reads `#rw-galaxy-ap-live` (z-index 30). AT still hears polite-live toasts when `commLine` fires.

---

### Worker self-audit delta

`out/w116/nav05/ui-audit.md` now reports no open 🔴/🟠 and closes the chart-open Major in freeze. Chip cites in that file still mention `hud.js` 1033–1041 (correct this snapshot). This re-audit **agrees** on refuse, fly-cancel freeze paint, hub honor, and chip dest/next/rem.

Closed in freeze (do not reopen as CONSUME):

- One toast for every failure → deputize table (contract §0.1).
- Cancel in a valid routed zone → no cancel / no cycle when a physical hop ring exists (contract §0.1).
- Fly-path cancel English under the chart overlay → `#rw-galaxy-ap-live` `showApLive(apLine(reason))` while `chartOpen` (contract §0.15).

---

### Status

🔴 Blocker **0**. 🟠 Major **0** open. Prior Major **addressed** in freeze (named only; no `src/` this wave). Wave 116 designer re-audit: **CLEAN**. Later PR1 must land the named `galaxychart.js` live-region paint. Do not park the English table. Do not put copy on the 80 px hub. Do not claim `hud.js` for a chip paragraph. Do not close the chart on engage.
