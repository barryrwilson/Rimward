## Code Review: NAV-02 in-flight next-gate guidance design (Wave 84)

### Summary

Markdown-only integrator set after a persist-consume fix. Live `src/` still has no `nav`. NAV-02 now consumes NAV-01 `{ dest, path, remaining, status }` with next hop `path[1]`. Guidance is not a lock. Distinct `.rw-nav-gate-cue`. Advance display on `systemLoaded` / `'navRoute'`. First chrome PR includes width cap, docked/jumping hide, and static motion.

Persona: reviewer plus checklist (`C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`).

### What's done well

- Inventory still matches live `src/` (`WORLD_FIELDS` 75–98; `jump.js` 123; contacts scanner ships).
- Sibling shape is copied from `out/w84/nav01/shared-contract.md` §1.2 / §2.3 / §4, not guessed.
- `remaining` is the bag field; HUD does not invent `hopIndex`.
- `blocked` is distinct from far (no hop count).
- Recalc HUD is session-only after `systemLoaded` / `'navRoute'`.
- HUD-01 occupancy + lock non-write unchanged.

### Findings

#### 🔴 Blocker: (none after fix)

#### 🟠 Major (resolved): Consume vs NAV-01 owner shape

**Location:** prior contract §2.2 `hopIndex` + `'active'|'recalc'|'broken'`  
**Issue:** After NAV-01 persist, sanitize drops `hopIndex`. HUD fail-closed hide. `'recalc'` never stored so `REROUTE` never fired; `'broken'` never stored so `NO ROUTE` never fired.  
**Fix applied:** Contract §2.2–§2.4 / brief merge table. Map `plotted` → `path[1]`; `blocked` → `NO ROUTE`; `arrived` → hide; omit → hide. Transient `REROUTE` from last `path[1]` vs new bag.

#### 🟠 Major (resolved): Width / hide deferred to PR5

**Location:** prior §13 PR5  
**Issue:** Designer: side-col at `textScale` 1.5 can cover the target rail; live region would speak while docked if PR1 lacks hide.  
**Fix applied:** Contract §7 / §13: `max-width: 180px` + ellipsis in PR1. Hide docked/jumping in PR1. Cue/3D static in the PR that draws them. PR5 is screenshots only.

#### 🟠 Major (resolved): Advancing on `jumpRequested` / writing the bag

**Location:** `gate.js` 558–559; `jump.js` 144 vs 123  
**Fix applied:** NAV-02 never writes dest/path/remaining/status. Re-read after midpoint `systemLoaded`.

#### 🟡 Minor: Dual edge glyphs share `EDGE_MARGIN` 84

Optional 12 px inset. Shape contrast required. Not a consume bug.

#### 🟡 Minor: Module owner for the 3D ring

`gate.js` vs `nav-guidance.js` left to impl; read-only bag.

#### 💡 Suggestion: Do not duplicate NAV-01 `commLine`

NAV-01 already toasts route updated / no route. NAV-02 readout only.

### Cite audit (inventory vs live + sibling)

| Claim | Source | Match |
|---|---|---|
| No `'nav'` in live save | `save.js` 75–98 | yes |
| NAV-01 bag `{ dest, path, remaining, status }` | nav01 contract §1.2 | yes |
| Next = `path[1]` | nav01 §2.3 | yes |
| Status plotted/blocked/arrived | nav01 §1.3 | yes |
| Recalc is event | nav01 §1.3 / §4 | yes |
| Unknown keys drop | nav01 §1.4 | yes |
| `systemLoaded` midpoint | `jump.js` 123 | yes |
| Same-system restore no emit | `save.js` 1207–1208 | yes |
