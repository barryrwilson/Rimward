# UI Audit: TGT-03 remaining awareness (frozen HUD)

**Scope:** Frozen copy, cues, motion, contrast, glass occupancy. Design-only; no product UI edit.  
**Persona:** `orchestrator/references/ui-audit.md` (do not spawn [designer]).  
**Pass:** 2.

## UI Audit: lock edge cue + attacker toast

### Summary

The freeze reuses the live lock triangle and the live off-column toast channel. It does not put a gauge on the 80 px hub, does not steal the NAV-02 chevron, and keeps FORE/AFT as a hit glance. Copy is two short static warn lines. No Blocker/Major remain.

### What's done well
- HUD-01 empty hub stays empty (no lock box, no missile gauge, no firing pip).
- Lock cue class `.rw-edge-arrow` vs gate `.rw-nav-gate-cue` — shape already differs (triangle vs ticks+notch).
- Color uses `var(--amber)` / `--rw-warn`; colorblind/contrast body classes already remap.
- Reduced motion: no new `@keyframes` on the lock cue; global HUD `animation: none`.
- Attacker warning prefers existing `.rw-toasts` (`role="status"`, `aria-live="polite"`) matching `Incoming dart.`
- FORE/AFT is **not** reused as a muzzle lamp (would duplicate hit language).
- Toast CSS already `text-transform: uppercase` + `--rw-text-scale`.
- Fail-closed empty: no lock → hide arrow; docked/jumping → park + no fire toast.

### Findings

#### 🔴 Blocker: None (pass 2)

#### 🟠 Major: Duplicate lock/gate class would mix route and target
**Location:** `hud.css:575-594` vs `1003-1037`  
**Issue:** A new lock class that copied NAV-02 ticks, or a rename onto `.rw-nav-gate-cue`, would make two jobs one glyph.  
**Fix:** Contract: keep both classes; both may show.  
**Status:** addressed in freeze

#### 🟠 Major: Firing widget on the aim glass
**Location:** HUD-01 hub `hud.js:1184-1186`  
**Issue:** Incoming gauge / lock box on the 80 px hub is closed.  
**Fix:** Toast only.  
**Status:** addressed in freeze

#### 🟡 Minor: Lock arrow is color + shape, no word
**Location:** `hud.css:585-594`  
**Issue:** HUD law wants color never the only cue. Triangle + rotation is the shape cue; no LOCK word (default).  
**Fix:** Keep; names live on bracket/rail when on-glass.  
**Status:** accepted  
**Justification:** HUD-02 already lists the edge arrow as a core instrument; adding LOCK would fight EDGE_MARGIN overlap with the gate chevron.

#### 🟡 Minor: `aria-live="polite"` for incoming fire
**Location:** `hud.js:760-762`  
**Issue:** Assertive might be “more combat,” but dart already uses this polite live region. Changing it would re-announce every comm toast.  
**Fix:** Reuse polite; do not retune the region this serial.  
**Status:** accepted  
**Justification:** match shipped dart; avoid double-speaking the 5-slot stack.

#### 💡 Suggestion: Park lock arrow while docked
Already default-yes in contract §1.5 / §9. Matches NAV-02 `navPark`.

### Frozen copy (do not paraphrase later)

| Moment | Literal | Surface |
|---|---|---|
| Cannon vs player | `Incoming fire.` | toast `warn` |
| Dart vs player | `Incoming dart.` | toast `warn` (shipped) |
| Reticle miss | `Nothing under the reticle.` | commLine (TGT-05; do not change) |

Do not add `Incoming psionic.` Do not add a LOCK caption on the triangle.

### Contrast / motion / layout
- `body.rw-colorblind` remaps `--rw-warn` (Okabe-Ito). Triangle stays a triangle.
- `body.rw-contrast` darkens toast panels; lock glyph still uses `--amber`.
- `body.rw-reduced-motion`: no new sweep/pulse on the lock cue; FORE/AFT already outline-only.
- Toast stack stays top-right off the aim column (`hud.css:634-641`).
- Digit 0/8/9 chrome untouched.

### Pass 2
Class steal and glass-gauge Majors remain closed in the freeze. Copy table unchanged. No new Blocker.
