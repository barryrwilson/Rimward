# UI Audit: NAV-05 remaining autopilot gate handoff (Wave 116)

### Summary

No product chrome ships this wave. Spec picture is **existing chart Autopilot + in-flight chip dest/next/rem + distinct `commLine` / chart live-region cancel lines**. Re-dispatch freeze: later PR1 writes `galaxychart.js` **only** so existing `#rw-galaxy-ap-live` also `showApLive(apLine(reason))` on fly `disengage` while the chart is open, including chart Cancel. Chip dest/next/rem stays. Chart stays open on engage. No hub pip. No Digit. No Key remap. Fail closed keeps the route and does not freeze the sim.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Did **not** overwrite `out/w116/designer/nav05-ui-audit.md`. Spec audit, not a running page. Did **not** start Vite or Chrome. [NO BROWSER COVERAGE].

### What's done well

- Empty hub freeze: chip is `#hud .rw-autopilot`, not `.rw-reticle` (`hud.js` 1033–1041; WAVE85 `chipCss`).
- Chart Autopilot stays a real `button` with `aria-label` and `aria-live` refuse (`galaxychart.js` 150–153, 140–141, 572–575).
- In-flight Cancel stays a `button` with `aria-label` Cancel autopilot (`hud.js` 1037–1040). Space `preventDefault` stays (`guardAutopilotSpace`).
- Digit 0–9 / KeyM / KeyV stay. No new letter for handoff.
- Failure English is frozen literals, not dest-id concatenation.
- Prefix split (refused vs cancelled) plus distinct second clauses so a player can tell lookup vs path vs hub vs hop vs gate vs arrive.
- Chip dest/next/rem unchanged (this leftover does not claim `hud.js`).
- `innerHTML` forbidden later. Chart/chip already `textContent`.
- Contrast body already restyles `#hud .rw-autopilot` (`hud.css` 1172). No new unthemed color.
- Re-dispatch names the only allowed sighted paint path for fly cancel under an open chart: existing `#rw-galaxy-ap-live` (overlay z-index 30), not HUD toasts (z-index 10).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): One toast for every failure

**Location:** live `AP_LINES.missingHop` / `missingGate` `autopilot.js` 27, 30; inbox P0 NAV.

**Issue:** Live copy uses the same “next gate is missing” for refuse lookup, fly lookup, path fail, hub not-listed, hub wrap, and missing `path[1]`. The player cannot act. A verifier cannot diagnose.

**Fix landed (markdown):** deputize distinct strings (contract §0.1). Chart `apLine` + `disengage` `BREAK_LINE` + `commLine` carry them. Do not park.

**Status:** closed in contract. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): Cancel in the activation zone

**Location:** hub not-listed `autopilot.js` 329–331 vs `JUMP.zone` 60.

**Issue:** Reaching the plotted ring while a hub is nearer currently cancels instead of jumping. That is the player-facing handoff failure.

**Fix landed:** no cancel / no cycle when a physical hop ring exists; emit still requires `near.to === path[1]`.

**Status:** closed in contract §0.1.

#### 🟠 Major (closed in re-dispatch freeze): Fly-path cancel English under the chart overlay

**Location:** designer `out/w116/designer/nav05-ui-audit.md` Finding 🟠; live `hud.css` 1898–1912; `style.css` 24–28; `galaxychart.js` 572–576, 619–634; `autopilot.js` 181–196. Contract §0.15.

**Issue:** Player plots on KeyM, clicks Autopilot, chart stays open. Engage refuse is visible in `#rw-galaxy-ap-live` (z-index 30). Fly-path tokens painted only through `disengage` → `commLine` → `#hud .rw-toasts` (z-index 10). Chart Cancel did not `showApLive`. Fly `disengage` never wrote `apLive`. Prior write-set omitted `galaxychart.js` and forbade `hud.js`, so there was no allowed paint path on the surface the player looks at.

**Fix landed (markdown):** Keep chip dest/next/rem. No reason paragraph on the chip. Do not steal `hud.js` / `hud.css` / `controls.js`. Expand later PR1 write-set to include `src/systems/galaxychart.js` **only** so existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, including chart Cancel. Do **not** close the chart on engage (P2 inbox waits). Do **not** treat HUD toast-under-overlay as NAV-03 leftover law.

**Status:** closed in contract §0.15 + `docs/Nav05HandoffDesign.md`. Named only. No `src/` this wave. Designer file left as the independent prior pass (not overwritten).

#### 🟡 Minor: `missingLookup` and `lookupFail` share the second clause

**Location:** contract English table.

**Issue:** Refuse vs cancel both say “next gate is not in this system.” Diagnosis still works via **refused** vs **cancelled**.

**Fix:** Keep the prefix split (same pattern as live missingHop/missingGate). Do not invent a third sentence unless playtest PR2 retunes.

**Status:** accepted deputize. Owner may override.

#### 🟡 Minor: HUD toasts force uppercase; chart live does not

**Location:** `.rw-toast` `text-transform: uppercase` (`hud.css` 716–730); `.rw-galaxy-ap-live` sentence case (`hud.css` 1963–1970).

**Issue:** Same `AP_LINES` string, two casings. Distinct second clauses still read.

**Fix:** Keep sentence-case `AP_LINES`. Do not author ALL CAPS. Do not retune `.rw-toast` (`hud.css` is sibling-owned).

**Status:** accepted live pattern. Not a leftover edit.

#### 🟡 Minor: Chart Autopilot dim is not `disabled`

**Location:** `galaxychart.js` 595–616; `hud.css` 1996–2000.

**Issue:** MATCH / missing hop / lookup refuse uses `aria-disabled` + `.is-dim` and still receives click so `apLive` can speak.

**Fix:** Do not flip dim to `disabled` in PR1 (would swallow the new refuse line).

**Status:** accepted. Honor live.

#### 🟡 Minor: Chip does not show the reason token

**Location:** `hud.js` 1977–1984; contract §0.12.

**Issue:** In-flight, the split line is toast / chart live, not chip text.

**Fix:** Do not put a paragraph on the chip (would steal HUD-02 `hud.js`). Keep dest/next/rem. Chart-open fly cancel now uses `#rw-galaxy-ap-live`.

**Status:** accepted.

#### 💡 Suggestion: Chip dest / next / rem have no visible labels

**Location:** `hud.js` 1033–1036.

**Issue:** Unlabeled nowrap spans. Leftover forbids a chip rewrite.

**Fix:** Out of NAV-05 write-set. Do not steal `hud.js`.

**Status:** live. Do not steal `hud.js` to fix here.

#### 💡 Suggestion: “hub spoke cycle failed” is shop jargon

**Location:** contract §0.1 `hubWrap`.

**Issue:** Distinct from hub-not-listed. “Spoke cycle” is KeyG modulo.

**Fix:** Optional PR2. Token stays `hubWrap`. Deputize string may stay.

**Status:** optional. Prefix + “hub” already diagnose. Jargon kept.

#### 💡 Suggestion: Refuse can announce twice

**Location:** `galaxychart.js` 627–630; `hud.js` 813–816.

**Issue:** Chart refuse writes `apLive` and emits `commLine`. Fly-cancel PR1 will inherit that if `commLine` stays.

**Fix:** Optional: `showApLive` when `chartOpen`, skip duplicate `commLine` for that chart click only. Do not drop `commLine` when the chart is closed. Not required to close the Major.

**Status:** optional.

### Accessibility (spec)

- No new unlabeled control. Cancel and Autopilot already named.
- New copy is status text (`commLine` / chart `role="status"`), not a mystery icon.
- Keyboard: still click/Enter on Autopilot; Space swallowed on those buttons; KeyM/KeyV/Digit unchanged.
- `reducedMotion`: no new loops. Gate overlay already respects reduced motion (`gate.js` 603).
- Chart-open fly cancel: sighted player reads `#rw-galaxy-ap-live`. AT still hears polite-live toasts when `commLine` fires.

### Status

No 🔴/🟠 open. Wave 116 re-dispatch pack may report DONE on UI audit.
