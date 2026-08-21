## UI Audit: NAV-02 in-flight next-gate guidance (Wave 84 design)

### Summary

No live UI shipped this wave. Freeze now locks side-col **max-width 180px + ellipsis** and **docked/jumping hide + static motion in the first chrome PR**. Occupancy vs aim glass, rails, lead, prompt, and TGT-03 contacts stays clear. Persist copy uses NAV-01 tokens (`plotted` / `blocked` / `arrived`), not a forked enum.

### What's done well

- Readout in `.rw-side-col` above POS, not rails/hub/prompt/contacts.
- Distinct `.rw-nav-gate-cue` (not lock arrow, not scanner pip, not chartmark).
- Color not the only signal: `NEXT`/`DEST`/`JUMPS` + gate-notch chevron + `--rw-accent`.
- `aria-live` scoped to next/dest/remaining/status; distance outside.
- Combat `.rw-aux` 0.38, not vanish.
- `NO ROUTE` is a word, not a large hop count (distinct from far).

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major (resolved): Side-col overflow at `textScale` 1.5

**Location:** `hud.css` 769–787, 830–840; contract §7  
**Issue:** Uncapped nowrap names grow into `.rw-combat-target`.  
**Fix applied:** PR1 CSS freeze: `min-width: 0`; `max-width: 180px`; name `ellipsis`. Type `calc(10–11px * var(--rw-text-scale))`. PR5 only pins screenshots.

#### 🟠 Major (resolved): Hide / reducedMotion deferred to PR5

**Location:** contract §13 vs §5–§7  
**Issue:** First readout is `aria-live`; 3D ring is not under `#hud *` reduced-motion CSS.  
**Fix applied:** PR1 hides when docked or jumping. PR2 no `@keyframes`. PR3 static ring via `ctx.settings.reducedMotion`. PR5 is not the first hide/motion.

#### 🟡 Minor: Dual EDGE_MARGIN 84

Optional 12 px inset inside the lock arrow. Do not merge classes.

#### 🟡 Minor: Ring vs lock bracket on the same gate

Thin dark-edged cyan stroke; scale ≤ rest glow.

#### 🟡 Minor: Contrast selectors

Add `.rw-nav-readout` / `.rw-nav-gate-cue` to `body.rw-contrast` beside banner/jump at impl.

#### 💡 Suggestion: Instant JUMPS digit, no roll-up. Keep CSS in `hud.css`.

### Focus checklist

| Focus | Verdict |
|---|---|
| Readout vs aim / lead | Pass. Side-col + 180 px cap. |
| Distinct from scanner | Pass. New class. |
| Docked / jumping hide | Pass in PR1 freeze. |
| reducedMotion | Pass in first drawing PR. |
| `textScale` 1.5 | Pass in PR1 freeze (ellipsis). |
| Persist copy | Pass. `plotted`/`blocked`/`arrived`. |
