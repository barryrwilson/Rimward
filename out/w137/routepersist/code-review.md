## Code Review: NAV-11 chart-close dest keep leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **CONSUME** is correct vs live `galaxychart.js` **935–962** (`setOpen(false)` does not `clearRoute`), **1375–1376** (retarget + AP sync while closed), **1129–1134** (plot-first only if `!navHasRoute`), `nav.js` **4–6** / **271–300**, `save.js` **107–108**. Contract forbids REAL PR1, new WORLD_FIELD, NAV-06 invert, NAV-03 fly, Agent claim, pause, teleport, and `innerHTML`. No Blocker/Major remain.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- CONSUME test applied honestly: dest survive **and** AP not plot-first both required; both live.
- File:line census for `setOpen`, close button, `activateSystem`, dest `<select>`, AP copy, `world.nav`, save, Autopilot `noDest`, NAV-06, Agent cite-only.
- Deputize picks the **smaller** freeze: do not invent work; later REAL = UI re-sync not a new persist key.
- NAV-06 close is named as **not** dest drop. Close paths share one `setOpen(false)`.
- Sibling write-sets listed (NAV-03/06/09/10, ore, evade, pad 2B).
- Fail-closed missing bag → idle is live and frozen.
- Contract-wins vs brief is explicit.

### Findings

#### 🔴 Blocker: CONSUME would be wrong if close cleared dest — **resolved in freeze**

**Location:** `galaxychart.js` **935–962** vs `clearRoute` **1198–1200**  
**Issue:** Inbox playtest claimed dest gone + plot-first. Live close does not call `clearRoute`. Frozen **CONSUME** / serial **none**.

#### 🔴 Blocker: New persist key while `nav` exists — **resolved in freeze**

**Location:** `save.js` **107–108**  
**Issue:** A REAL PR1 that added `chartDest` would split dest from AP/HUD.  
**Fix:** Prefer no new persist key. Later REAL = `setOpen(true)` re-sync only.

#### 🟠 Major: Treat AP visible label as dest name hole — **resolved in freeze**

**Location:** `galaxychart.js` **1127–1137**; status **1063**; HUD DEST `hud.js` **2434**  
**Issue:** Owner CONSUME says “AP button still names that dest.” Visible button is `Autopilot`. Plot-first is aria when idle. Dest name is status / select / HUD. Inventing dest text on the AP button would steal NAV-03/05 copy.  
**Fix:** Freeze “names dest” = not plot-first + dest still on status/select/HUD without a second plot.

#### 🟠 Major: Invert NAV-06 to “keep dest” — **resolved in freeze**

**Location:** `galaxychart.js` **1167–1168**  
**Issue:** Skipping `setOpen(false)` on Autopilot success would reopen NAV-06. Dest already survives that close.  
**Fix:** cite only; do not invert.

#### 🟠 Major: `lastPlotKey` skip as dest drop — **resolved in freeze**

**Location:** `galaxychart.js` **996–1002**, **952–961**  
**Issue:** Reopen does not force `retargetPlot(true)`. If close cleared paint, skip could look idle while the bag lived.  
**Fix:** Census: close does **not** clear destSelect / status / plotLayer. Skip keeps live paint. Do not freeze PR1 for a non-hole. Optional later REAL UI re-sync named only.

### 🟡 Minor: Wishlist INBOX still unchecked

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **207–210** vs live close  
**Issue:** A later worker could treat the playtest as REAL leftover.  
**Justification:** This pack already says code wins and does **not** edit the wishlist (owner freeze).

### 🟡 Minor: Dest `<select>` `change` ignores empty

**Location:** `galaxychart.js` **1204–1208**  
**Issue:** If a browser reset the hidden select to `''`, change would not `clearRoute` (good) and `lastPlotKey` skip would not rewrite value until bag identity changed.  
**Justification:** Not dest drop; AP still uses `world.nav`. Optional later REAL re-sync covers it. CONSUME stands.

### 💡 Suggestion: Optional PR2 census grep

Re-grep `setOpen` for `clearRoute` if owner doubts CONSUME after playtest. Do not block. Do not add boot pins from this pack.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / pause / sibling freezes repeat on purpose (merge law). No invented serial name.

### Test coverage

This pack does not add tests. Live plot persist already sits in NAV-01 / WAVE85 pins (cite only; this pack does not edit `scripts/`). Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
