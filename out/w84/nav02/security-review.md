## Security Review: NAV-02 in-flight next-gate guidance (Wave 84)

### Risk Level: Low

### Summary

Wave 84 is markdown only. Threats: XSS through system names, decorative marker as a lock body, stuffed `world.nav` (`path[1]` / proto `dest` / unknown keys), and `ctx.emit` spread smash. The first freeze invented `hopIndex` and a forked status enum; that would hide a legal NAV-01 bag (unknown keys drop) and never fire `NO ROUTE`. Consume now matches NAV-01 `{ dest, path, remaining, status }` with `path[1]`. Remaining notes are impl cautions.

Persona: security-auditor plus checklist (`C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`). Mode: deep audit of design + live data flow (no `src/` edits).

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server.

#### 🟠 HIGH (resolved): HUD XSS via system names

**Location:** `hud.js` 226–231, 356–365, 414–419, 1040; `gate.js` 578; `modelsbrowser.js` `innerHTML` (out of slice)  
**Issue:** Next/dest names come from `SYSTEMS[path[1]]` / `SYSTEMS[dest]`. `innerHTML` would execute a stuffed name.  
**Impact:** Script in the HUD overlay.  
**Fix applied:** Contract §1.12 / §7 / §10: `innerHTML` forbidden. `Object.hasOwn(SYSTEMS, id)` then `stripHudText`. Fallback `'—'`.

#### 🟠 HIGH (resolved): In-world marker as lock / rock body

**Location:** `reticle-aim.js` 107–147, 172–203; `controls.js` 198–214; `jump.js` 85–87  
**Issue:** Pickable decorative geometry would steal KeyV disc/cone or MATCH.  
**Impact:** Route replaces a combat lock.  
**Fix applied:** Contract §4 / §6: never write `targets.current`. Empty `raycast`. No `lockKind`.

#### 🟠 HIGH (resolved): Persist consume mismatch (`hopIndex` + forked enum)

**Location:** prior NAV-02 §2 vs `out/w84/nav01/shared-contract.md` §1.2–§1.4  
**Issue:** NAV-01 owns `{ dest, path, remaining, status }` with `'plotted'|'blocked'|'arrived'`. Sanitize **drops** unknown keys (`hopIndex`). Recalc is `'navRoute'` + bag rewrite, not persist `'recalc'`. A HUD that hid unless `hopIndex` was a finite int would never show. Branches on `'broken'` would never show `NO ROUTE`.  
**Impact:** Guidance stays hidden after a legal save; wrong-gate copy never maps.  
**Fix applied:** Contract §2 consumes NAV-01 exactly. Next = `path[1]`. Display bag `remaining`. Map `plotted` / `blocked` / `arrived` / omit. Transient `REROUTE` is session-only. No extra persist fields this slice.

#### 🟠 HIGH (resolved): Stuffed `path[1]` / proto dest / emit smash

**Location:** `ctx.js` 231–232; NAV-01 `'navRoute'` must be a fresh literal  
**Issue:** Stuffed `path[1] === '__proto__'` or `emit(world.nav)` spreads `path` / `type`.  
**Impact:** Prototype pollution; event-type smash; wrong gate marked.  
**Fix applied:** Contract §2.5 / §9 / §10: allowlist ids; hide if `path[1]` fails `Object.hasOwn`. Consume `'navRoute'` primitives. Do not emit the bag or invent `'navGuidance'`.

#### 🟡 MEDIUM: Banner still prints raw `to` when `SYSTEMS[to]` is missing

**Location:** `hud.js` 1040; `gate.js` 578  
**Issue:** Live arrival fallback is `String(e.to)`. Do not copy onto the nav readout.  
**Fix:** Contract requires `'—'`. Out of scope to change live banner.

#### 🟢 LOW: No secrets. Chart must not print clue ids.

### Passed Checks

- [x] Consume NAV-01 shape (no hopIndex required)
- [x] `status` tokens plotted/blocked/arrived
- [x] Recalc not persisted
- [x] No `innerHTML` in `hud.js`
- [x] Guidance must not write lock
- [x] Marker not a pick body
- [x] Single persist record
- [x] Emit payload constrained
- [x] `state.js` READ-ONLY

### Recommendations

1. PR1: pin a legal NAV-01 bag **without** `hopIndex` still paints NEXT from `path[1]`.
2. PR1: stuffed `path[1]` / reserved dest hides marker; `textContent` only.
3. PR3: empty `raycast`; `targets.current` unchanged.
4. PR4: `'blocked'` → `NO ROUTE`; never read `'recalc'` from the bag.
