# Code Review: HUD-06 home-station marker design pack (Wave 126)

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `hud.js` (TGT arrow exists; station marker absent) and `station.js` pose/dock. Contract correctly forbids hub gauges, TGT/NAV-02 steal, persist, selected POI, `innerHTML`, and write-set creep. No Blocker/Major remain after hide-on-station-lock, inset 108, and POS HOME-as-text locks.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. **Did not** edit `src/`.

### What's done well

- Inventory file:line cites match live code (POS **1028-1031** / **1974-1986**, edge arrow **816** / **1415**, scanner **876**, dock prompt **2169-2170**, station pose **4394-4411** / **6304-6319**, `U.DOCK_RANGE` **45**).
- CONSUME path documented as unexpected and **not** taken.
- Write-set is `hud.js` + `hud.css` only. `station.js` is read-only. `nav.js` / `galaxychart.js` / `hail.js` / `agent-api.js` unclaimed.
- Chartmark **discipline** reused without stealing chartmark slots or diamond glyph.
- `formatNavDist` optional **call** is distinguished from GATE chrome steal.

### Findings

#### 🔴 Blocker: Reusing TGT `edgeArrow` would steal lock chrome
**Location:** `hud.js:816`, `1415-1433`; `hud.css:576-594`  
**Issue:** Brief temptation is “threats get an edge arrow; give the station one.” The live node is one amber triangle bound to `ctx.targets.current`. Restyling or dual-use would hide a combat lock or paint the pad as a threat.  
**Fix:** Contract §0.8 + deputize dedicated `.rw-home-mark`. **This file wins on conflict with a naive reuse.**  
**Status:** **resolved** in `shared-contract.md` / `Hud06HomeMarkerDesign.md`

#### 🔴 Blocker: Hub / RANGE gauge
**Location:** `hud.css:184-218`; `hud.js:1293` 80 px clamp  
**Issue:** A compass in the aim glass reopens HUD-01. Inbox is navigation, not a reticle child.  
**Fix:** Contract §0.2. POS HOME + world pip only.  
**Status:** **resolved**

#### 🟠 Major: NAV-02 GATE / `gateCue` collision
**Location:** `hud.js:818-822`, `1008-1026`, `1718-1752`  
**Issue:** Same NDC edge math at inset 84 would stack home on the next-gate identity. Printing dist on `navDistVal` steals NAV-02.  
**Fix:** New nodes; `HOME_EDGE_INSET = 108`; POS `HOME` row; GATE untouched. Optional `formatNavDist` is a number helper only.  
**Status:** **resolved** in contract §0.7, §0.1

#### 🟠 Major: Double chrome when the station is the lock
**Location:** `hud.js:2073-2075`; `reticle-aim.js:283-286`  
**Issue:** KeyV lock already names the station + `dist u` and can show the amber arrow off-screen. A second pip/chevron stacks.  
**Fix:** Hide on-glass home when `lockKind === 'station'`. Keep POS HOME.  
**Status:** **resolved** in contract §0.1 / fail-closed table

#### 🟠 Major: Selected POI is not the cheap path
**Location:** inbox “or a selected point of interest”; chartmarks `hud.js:824-841`  
**Issue:** A picker needs session selection, input, and possibly persist. Mystery landmarks already have diamonds. Parking on POI would delay the pad cue.  
**Fix:** Deputize home station first; POI **omit**. Do not park.  
**Status:** **resolved**

#### 🟡 Minor: Combat fade may hide HOME when the player is fighting far from pad
**Location:** POS `rw-fade` `hud.js:1028`; chartmark combat opacity `hud.css:632`  
**Issue:** Inbox drift may occur in or out of combat. Dim is consistent with non-critical instruments.  
**Fix:** Keep dim; text still exists. Do not put HOME on combat rails.  
**Status:** accepted — matches §13.2; not a census bug.

#### 🟡 Minor: Overlay hide uses three booleans
**Location:** `ctx.flags.hailOpen/chartOpen/berthOpen`  
**Issue:** Duplicate vs `overlayIsOpen`. Importing overlay-policy would expand write-set.  
**Fix:** Read flags in `hud.js` only. Do not edit overlay-policy.  
**Status:** accepted — contract §0.6

#### 💡 Suggestion: Scratch `homeProj` next to `chartProj`
**Location:** `hud.js:1101`  
**Issue:** Per-frame `Vector3` alloc would break the HUD perf contract (**31-34**).  
**Fix:** One init-scope scratch. Contract §0.15.  
**Status:** locked.

#### 💡 Suggestion: Do not add boot FAIL “fixes”
**Location:** REDMARCH `castMatches`  
**Issue:** Honor list.  
**Fix:** Contract §0.16.  
**Status:** locked.

### Verdict

**Approve markdown pack** for orchestrator consume. Leftover REAL. Serial **PR1**. Do not implement in Wave 126.

### Re-review (after freeze)

No remaining Blocker/Major. Minors accepted. Contract wins: dedicated nodes, inset 108, POS HOME text, POI omit, write-set `hud.js` + `hud.css` only.
