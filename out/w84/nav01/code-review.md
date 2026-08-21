## Code Review: NAV-01 design freeze (Wave 84)

### Summary

Inventory cites match today’s `src/` (chart, jump, save `WORLD_FIELDS` 75–98, emit spread, KeyM law). The contract copies orchestrator laws 1–15 without a second persist key or `state.js` write. First-pass Majors (law-4 pointer swallow, non-exported `RESERVED_IDS`, same-system restore, `.rw-galaxy-route` collision) are fixed in the freeze. PR plan is a later serial, not this wave.

### What's done well

- Live inventory separates **hub gold** `.rw-galaxy-route` from a player plot.
- Graph freeze unions `gates[].to` and one-way `hub.routes` (chart undirected-dedupe is display-only).
- Jump ownership stays `jump.js` / `gate.js`; advance is `systemLoaded`, not KeyD.
- Idle persist is omission + omit-delete (hangar/jobs precedent).
- Sibling boundary: consume table §1.4.1 — next = `path[1]`; status `plotted|blocked|arrived`; no `hopIndex`; `remaining` required; `autopilot` may join later, `hopIndex` must not.
- Verifier-facing header / contract-wins table matches Wave 81 / Wave 77 shape.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### B1: Law 4 vs pointer stopPropagation

**Location:** first-draft §3.3.  
**Issue:** Weakened orchestrator law 4.  
**Fix applied:** `ctx.flags.chartOpen` + controls LMB ignore.

##### B2: Sanitize home vs non-exported reserved set

**Location:** `save.js` 106–110 (no `export`).  
**Issue:** Brief said “import SAFE_ID / RESERVED_IDS”; the Set is private. `controls.js` reservedToken is a shorter list.  
**Fix applied:** Duplicate full save set or export `reservedId` in PR1. Contract forbids the short list.

##### B3: Same-system restore skips `systemLoaded`

**Location:** `save.js` 1207–1208.  
**Issue:** Recalc-only-on-jump would leave a mid-route path with `path[0]` still the old origin after a same-system load.  
**Fix applied:** Sanitize slice + `initNav` `recalcIfNeeded` on first update.

##### B4: CSS class collision

**Location:** `hud.css` 1510–1516.  
**Issue:** Reusing `.rw-galaxy-route` paints plots as hub one-ways.  
**Fix applied:** `.rw-galaxy-plot*` only.

##### B5: Cross-cut persist vs NAV-02 cursor/status

**Location:** verifier HIGH-1 / HIGH-2.  
**Issue:** `hopIndex` + `active|recalc|broken` cannot merge with `remaining` + `plotted|blocked|arrived`. Recalc as persist would be deleted by the healer.  
**Fix applied:** §1.4.1 consume table. NAV-01 does **not** add `hopIndex`. Siblings MUST read `path[1]` and the NAV-01 enum.

##### B6: Hit disc 16 chart units / hub ring steal

**Location:** designer Major; `galaxychart.js` 35, 194–198; `hud.css` 1530–1536.  
**Issue:** 16 chart units ≈ 10 CSS px. `fill: none` misses. Hub rings intercept.  
**Fix applied:** contract §3.3.1 — ≥ 24 CSS px, filled hit, rings `pointer-events: none`, plot above rings, hit discs on top. PR3 named.

#### 🟡 Minor

##### N1: `N_SYSTEMS` is live `Object.keys(SYSTEMS).length`

**Location:** `save.js` 124.  
**Issue:** Path cap must use the live count at impl time, not a hardcoded 100.  
**Why not Major:** Contract already says `N_SYSTEMS`. Impl must not freeze `100` in `state.js`.

##### N2: PR1–PR5 are named but not scheduled

**Location:** contract §9.  
**Issue:** Orchestrator forbids landing them this wave. Brief repeats that.  
**Accept:** Intentional.

##### N3: `ctx.flags.chartOpen` is a new flag

**Location:** `ctx.js` 175–183.  
**Issue:** Extra session bit. Not persist. Needed so chart does not swallow events.  
**Accept:** Better than law-4 break.

#### 💡 Suggestion

- Impl may share one `sanitizeSystemId` with TGT gate `to` checks later; out of this slice.
- Owner Q5 copy strings can be retuned without a persist change.

### Inventory accuracy (spot-check)

| Claim | Live? |
|---|---|
| `WORLD_FIELDS` 75–98 has no `nav`/`route` | Yes |
| Chart has no click handlers | Yes (`galaxychart.js` 238–281) |
| KeyM no preventDefault | Yes (240–250) |
| Jump nulls `targets.current` | Yes (`jump.js` 85–87) |
| `emit` spreads `data` | Yes (`ctx.js` 231–232) |
| Digit 0 shipyard | Yes (`station.js` 5712–5714) |
| HUD chart marks read mystery | Yes (`hud.js` 1415–1423) — galaxy chart must not |

### Re-review (after B1–B6)

Blocker/Major remaining: **0**. Contract wins over the brief. Sibling consume table is explicit. PR plan is serial and later.
