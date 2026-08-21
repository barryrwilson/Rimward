## UI Audit: NAV-02 HUD recheck (designer, Wave 84 freeze)

**Reviewer:** designer recheck after worker freeze  
**Prior:** `out/w84/nav02/designer-audit.md`, `out/w84/nav02/ui-audit.md`  
**Scope:** `docs/Nav02GuidanceDesign.md`, `out/w84/nav02/shared-contract.md` (merge law wins), live occupancy in `src/systems/hud.js` / `src/ui/hud.css`.  
**Not in scope:** product `src/` edits, wishlist, sibling NAV-01/NAV-03 trees.  
**Wave:** markdown design freeze only. No live `.rw-nav-readout` / `.rw-nav-gate-cue` / `nav-gate-marker` ships. Recheck is freeze vs live occupancy.

### Recheck targets (owner)

| Target | Freeze cite | Result |
|---|---|---|
| Consume `plotted` / `blocked` / `arrived` | contract §1.3, §1.6, §2.2–§2.3; brief merge table | **Held** |
| 180 px cap + name ellipsis in **PR1** | contract §1.10, §7, §13 PR1 | **Held** |
| Hide docked / jumping in **PR1** | contract §1.10, §7, §13 PR1; brief §5 / PR plan | **Held** |
| Static `reducedMotion` in first drawing PR | contract §1.17, §5, §6, §13 PR2–PR3 | **Held** |

### Summary

Prior 🟠 Majors (side-col overflow at `textScale` 1.5; hide/motion deferred to PR5) stay **resolved in freeze**. Persist copy consumes NAV-01 tokens only. Occupancy vs aim glass, rails, lead, prompt, and TGT-03 contacts stays clear. No new 🔴/🟠.

### What's done well

- HUD map uses bag `status` only: omit → hide; `plotted` + allowlisted `path[1]` → next/dest/`remaining`/distance; `blocked` → dest + `NO ROUTE` (word, not hop count); `arrived` → hide marker/cue, optional `ARRIVED` then hide; unknown → hide (`shared-contract.md` §2.3). Recalc is session `REROUTE`, not a persist enum (§2.4).
- Next hop is `path[1]`. No `hopIndex`. `remaining` is the bag integer (§1.5, §2.2). Legal NAV-01 restore still paints.
- Readout parks in `.rw-side-col` **above** `.rw-pos` (`shared-contract.md` §7; live POS `hud.js` 878–881; column `hud.css` 830–840). Not rails `top:57%` (`hud.css` 769–787), not 80 px hub, not lead (`hud.css` 475–527; `hud.js` 1155–1180), not prompt `bottom:20%` (`hud.css` 626–629), not contacts `bottom:5.5%` (`hud.css` 671–680).
- PR1 CSS freeze: `min-width: 0`; **`max-width: 180px`**; name `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`; type `calc(10–11px * var(--rw-text-scale))`. Must not grow into `.rw-combat-target` at `textScale` 1.5 (`ctx.js` 192). PR5 pins shots only.
- Distinct `.rw-nav-gate-cue` (not `.rw-edge-arrow`, not `.rw-contact-pip`, not `.rw-chartmark`, not contacts SVG). Guidance never writes `ctx.targets.current`.
- PR1 hide when `ctx.flags.docked` or `ctx.gate.jumping` (contacts `hud.js` 1259; chart marks `hud.js` 1420; jump bar `hud.js` 1051–1068). Station overlay z-20 vs `#hud` z-10 (`screens.css` 8–16; `style.css` 24–28). Live region must not speak under dock/jump.
- Cue: no `@keyframes` in PR2. Ring: static under `ctx.settings.reducedMotion` in PR3 (world-space is not under `body.rw-reduced-motion #hud`, `hud.css` 974–978; gate VFX already special-case the setting, `gate.js` 152–202). Transform rotate+translate only on the chevron.
- Combat `.rw-aux` 0.38 (`hud.css` 815), not `.rw-fade` / chartmark 0.14. `aria-live` on next/dest/remaining/status only; distance outside. `textContent` + `stripHudText`. `pointer-events: none`.

### Findings

#### 🔴 Blocker: (none)

No unusable or inaccessible defect remains in the freeze.

#### 🟠 Major: (none remain)

| Prior ID | Was | Freeze now | Recheck |
|---|---|---|---|
| Side-col overflow at `textScale` 1.5 | 🟠 Major | contract §7 `max-width: 180px` + name ellipsis in **PR1** | **resolved** |
| Hide / `reducedMotion` deferred to PR5 | 🟠 Major | §13 PR1 hide docked/jumping; PR2 no `@keyframes`; PR3 static ring via `ctx.settings.reducedMotion`; PR5 screenshots | **resolved** |

Do not reopen as open Majors. Impl must still land the CSS and hide in PR1, and static motion in the first PR that draws cue/ring.

#### 🟡 Minor: Dual EDGE_MARGIN 84 (open, impl pin)

**Location:** `hud.js` 56, 1182–1196; `hud.css` 529–548; `shared-contract.md` §5  
**Issue:** Lock amber triangle and nav cyan chevron both clamp with the same behind-camera flip and `EDGE_MARGIN` 84. Same-quadrant stack is possible. Chart marks also clamp to 84 (`hud.js` 1434–1436).  
**Fix:** Optional ~12 px inset inside the lock arrow; slightly smaller glyph. Never merge classes. Hide cue when on-screen (already frozen).  
**Status:** open — impl pin. Not occupancy reopen.

#### 🟡 Minor: On-screen ring vs lock bracket on the same gate (open, impl pin)

**Location:** `shared-contract.md` §4, §6; live bracket 60 px `hud.css` 401–406; glow rest 96  
**Issue:** KeyV on the routed gate stacks bracket corners + in-world ring. A loud additive torus reads as a second lock.  
**Fix:** Thin dark-edged cyan stroke; scale ≤ rest glow; outside the bore; no strobe. Empty `raycast`. Do not reuse `reticleLock`.  
**Status:** open — impl pin. Contract §6 already caps the visual.

#### 🟡 Minor: High-contrast / colorblind selectors for new classes (open, impl pin)

**Location:** `hud.css` 936–965 (lists toast/banner/jump/prompt, not future nav); tokens `hud.css` 4, 8–26  
**Issue:** Hardcoded `#6ff2e0` / amber on the chevron skips `body.rw-colorblind` and `body.rw-contrast`. Contrast panels get an extra opaque scrim; new nodes would not.  
**Fix:** Color via `--rw-accent` / `--cyan` / `--dim` / `--void`. Add `.rw-nav-readout` and `.rw-nav-gate-cue` to the contrast block beside `.rw-banner` / `.rw-jump`. HUD-02 may restyle without moving (`shared-contract.md` §11).  
**Status:** open — impl pin.

#### 🟡 Minor: Combat dim mix in the side-col (accept)

**Location:** `shared-contract.md` §7; `hud.css` 88, 815; `hud.js` 867–881  
**Issue:** Bio/POS are `.rw-fade` (0.14). Nav is `.rw-aux` (0.38). Intentional.  
**Fix:** Keep `.rw-aux`. Do not use `.rw-fade`. Optional: drop panel fill in combat (stroke/text only).  
**Status:** accept — freeze is correct.

#### 💡 Suggestion: Instant JUMPS digit, no roll-up

Bag `remaining` is a discrete int (`shared-contract.md` §2.3). Instant `textContent` swap. No CSS pulse on change.

#### 💡 Suggestion: Keep CSS in `hud.css`

Do not inject a third W2 sheet (`hud.js` 586–670). `--rw-text-scale` and `body.rw-reduced-motion #hud *` then apply.

### Focus checklist (recheck)

| Focus | Verdict |
|---|---|
| Persist copy | **Pass.** `plotted` / `blocked` / `arrived` only. Transient `REROUTE` is HUD memory. |
| Readout vs aim / lead / projectiles | **Pass.** Side-col above POS. 180 px cap in PR1. |
| `textScale` 1.5 | **Pass in freeze.** Ellipsis + cap. PR5 screenshots only. |
| Distinct from scanner | **Pass.** New class; no SVG pip. |
| Off-screen cue | **Pass if** distinct glyph + hide-when-on-screen. Dual-margin stack is minor. |
| In-world marker not a lock | **Pass.** Decorative group, empty raycast, no `lockKind`. |
| Docked / jumping hide | **Pass in PR1 freeze.** Same pattern as contacts / chart marks. |
| reducedMotion | **Pass in first drawing PR.** Cue: no `@keyframes`. Ring: `ctx.settings.reducedMotion` static. |
| Color-not-only | **Pass.** Labels + notch chevron + tokens. |
| Combat dim | **Pass.** `.rw-aux` 0.38. |

### Verdict

**CLEAN.** No 🔴 Blocker and no open 🟠 Major remain. Accept the design freeze for occupancy, identity, persist copy, PR1 width/hide, and static motion in the first chrome that draws cue/ring. Do not reopen HUD-01, TGT-03, or lock chrome.

| ID | Severity | File:line | Status |
|---|---|---|---|
| consume plotted/blocked/arrived | — | contract §2.3 | held |
| side-col 1.5 overflow | 🟠 Major | `hud.css` 830–840, 769–787; contract §7 | resolved in freeze (PR1 180 px + ellipsis) |
| hide/motion vs PR5 | 🟠 Major | contract §13 vs §5–7 | resolved in freeze (PR1 hide; PR2/PR3 static) |
| dual EDGE_MARGIN | 🟡 Minor | `hud.js` 56, 1182–1196 | open, impl pin |
| ring vs bracket | 🟡 Minor | contract §6; `hud.css` 401–406 | open, impl pin |
| contrast selectors | 🟡 Minor | `hud.css` 958–965 | open, impl pin |
| aux vs fade mix | 🟡 Minor | `hud.css` 88, 815 | accept |
