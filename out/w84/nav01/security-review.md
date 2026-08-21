## Security Review: NAV-01 design freeze (Wave 84)

### Risk Level: Medium (design-only; residual after freeze)

### Summary

Wave 84 adds no `src/` surface. The freeze covers XSS via system names, proto dest/path ids, persist-smuggled `path` / `hopIndex` / bad `status`, `ctx.emit` type smash, chart click stealing TGT lock, and `innerHTML`. Verifier HIGH (sibling `hopIndex` / `active|recalc|broken`) is **closed** by consume table §1.4.1. Residual risk is impl-wave discipline.

### Findings

#### 🔴 CRITICAL

None remaining.

#### 🟠 HIGH (fixed in freeze)

##### H1: Chart `stopPropagation` would violate merge law 4

**Location:** first-draft contract §3.3 (removed). Live: `galaxychart.js` 21–24, 243–244; orchestrator law 4.  
**Issue:** Using overlay pointer `stopPropagation` to block LMB fire would weaken “must not call preventDefault/stopPropagation”.  
**Impact:** Law break; also easy to swallow other pointer handlers later.  
**Fix applied:** `ctx.flags.chartOpen` + `controls.js` ignores LMB. Chart never stopPropagation.

##### H2: `SAFE_ID` matches `__proto__`; short reserved lists leak

**Location:** `save.js` 101, 105–110, 233; `controls.js` 84–86.  
**Issue:** Importing `controls.js` `reservedToken` would accept other reserved keys (`toString`, `valueOf`, …). `RESERVED_IDS` is not exported from `save.js`.  
**Impact:** Dest / path ids as proto keys; `SYSTEMS[id]` / bag merge hazards.  
**Fix applied:** `sanitizeSystemId` uses the **full** save set (duplicate or export). Unknown dest fail closed. `Object.hasOwn(SYSTEMS)`.

##### H3: `emit('navRoute', world.nav)` smashes `type`

**Location:** `ctx.js` 231–232.  
**Issue:** Spread of a stuffed bag can overwrite `type` or inject `path` arrays into the event queue.  
**Impact:** Event-graph confusion; possible handler misfires.  
**Fix applied:** Literal `{ dest, hops, status }` only. `dest` is `''` on clear. Explicitly forbid spreading `world.nav`.

##### H4: Persist `path` array smuggle / omit keep

**Location:** `save.js` 75–98, 953, 1163–1168.  
**Issue:** Unbounded or proto-indexed path; legacy snapshot omitting `nav` could keep a live bag; `autopilot.engaged` on the same object.  
**Impact:** Restore of hostile ids; AP resume (NAV-03) against law 11.  
**Fix applied:** Allowlist fields, cap `N_SYSTEMS`, omit-delete, drop unknown keys including `autopilot`.

##### H5: Plot writing `ctx.targets.current`

**Location:** `jump.js` 85–87 already nulls lock; `controls.js` KeyV.  
**Issue:** Click-to-plot that reused lock would steal TGT and then lose it every hop.  
**Fix applied:** Law 5 restated; plot never assigns the lock.

##### H6: Sibling `hopIndex` / foreign status would smash or wipe the bag

**Location:** verifier `out/w84/nav01/verify.txt` §6; contract §1.3–§1.5.  
**Issue:** NAV-02 assumed `hopIndex` and `status: active|recalc|broken`. NAV-01 healer deletes unknown status. A stored index is a second cursor and drifts after slice.  
**Impact:** Restore of a “valid” sibling blob would **delete** the player’s route, or HUD would read the wrong next hop.  
**Fix applied:** Consume table §1.4.1. Next hop = `path[1]`. Status allowlist `plotted|blocked|arrived` only. Recalc is an event. `hopIndex` never allowlisted. Sanitize drops those keys / deletes bad status.

#### 🟡 MEDIUM

##### M1: `SYSTEMS[id].name` in `commLine` / SVG text

**Location:** contract §5.2; `galaxychart.js` 207.  
**Issue:** Catalog names are trusted-enough for `textContent` (not HTML). A future generated name with control chars could confuse toasts, not XSS.  
**Fix deferred:** strip control chars if a name is ever copied from save. Catalog-only names this slice.  
**Why not HIGH:** `textContent` / SVG text nodes do not parse HTML.

##### M2: 100-node click surface / `data-system-id`

**Location:** `galaxychart.js` 187.  
**Issue:** Click must read the attribute this module stamped from `Object.keys(SYSTEMS)`, then re-sanitize.  
**Why not HIGH:** Contract requires `sanitizeSystemId` on click, not raw attribute trust as the only gate.

##### M3: `svgEl` `Object.entries(attrs)`

**Location:** `galaxychart.js` 52–55.  
**Issue:** Untrusted attr **names** would become attributes.  
**Why not HIGH:** Contract requires literal attr maps, not save blobs.

#### 🟢 LOW

##### L1: `commLine` copy includes dest name

Player-facing. Static templates. No UU. Accept.

##### L2: New event type expands the freeze comment

Listed for impl. No payload meshes. Accept.

### Passed Checks

- [x] No secrets in these markdown files
- [x] No `innerHTML` proposed
- [x] No lock steal proposed
- [x] Chart must not read clue / landmark discovery
- [x] One persist key `nav`
- [x] Prototype dest/path fail closed
- [x] No `hopIndex` / second cursor; foreign status deletes the bag
- [x] Emit smash forbidden
- [x] `state.js` READ-ONLY
- [x] Autopilot not engaged on restore
- [x] No teleport
- [x] Digit 0–9 not stolen
- [x] No second `WORLD_FIELDS` key

### Recommendations

1. Impl PR1 pins: proto dest, omit-delete, allowlist drop of extra keys.
2. Impl PR3 pins: KeyV lock unchanged after a plot click; `fireHeld` false while `chartOpen`.
3. Impl PR4 pins: `navRoute` payload keys only `dest|hops|status`.

### Re-review (after H1–H6)

HIGH/CRITICAL remaining: **0**. Medium items are impl-discipline, not freeze holes. Sibling consume table is merge law.
