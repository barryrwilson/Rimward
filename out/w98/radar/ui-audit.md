# UI Audit: TGT-03 remaining radar (frozen HUD)

**Scope:** Frozen traffic picture, motion, contrast, glass occupancy, class steal. Design-only; no product UI edit.  
**Persona:** `orchestrator/references/ui-audit.md` (do not spawn [designer]).  
**Pass:** 2.

## UI Audit: scanner-gated nearby-traffic picture

### Summary

The freeze reuses the live bottom bearing arc as radar. It does not put a PPI on the 80 px hub, does not steal the lock triangle or NAV-02 chevron, and keeps friend/foe as **shape**. Later work is jump-park hide, not a new instrument. No Blocker/Major remain.

### What's done well
- HUD-01 empty hub stays empty (no lock box, no missile gauge, no radar pip, no disc).
- Traffic `.rw-contacts` vs lock `.rw-edge-arrow` vs gate `.rw-nav-gate-cue` — three jobs, three glyphs.
- Layout already sits under the prompt (`arc bottom: 5.5%`; prompt `bottom: 20%`; rails `top: 57%`).
- Color uses CSS vars (`--dim` / `--amber` / `--cyan`); colorblind/contrast body classes already remap.
- Shape carries friend/foe (tick / chevron / hollow diamond). Mk II closure is a glyph, not a color.
- Reduced motion: no **new** `@keyframes`; global HUD `animation: none`; live enter pulse already killed.
- Contacts wrap is already `aria-hidden="true"` (decorative). Toasts remain the live region.
- Fail-closed empty: scanner 0 → hide arc; docked → hide; later jumping → hide.
- Pointer-events none — does not steal clicks from Hail / settings.

### Findings

#### 🔴 Blocker: None (pass 2)

#### 🟠 Major: Second traffic widget / hub PPI
**Location:** HUD-01 hub `hud.js:1194`; Wave F `hud.css:787–795`  
**Issue:** A PPI disc, reticle ring, or `.rw-radar` class would double-paint Wave F and occupy the empty glass.  
**Fix:** Contract: reuse `.rw-contacts` only; hub stays empty.  
**Status:** addressed in freeze

#### 🟠 Major: Merge lock / gate / traffic
**Location:** `hud.css:575–594` vs `787–849` vs `1003–1037`  
**Issue:** One glyph for three jobs would mix crowd, lock, and route.  
**Fix:** Keep three classes; all may show.  
**Status:** addressed in freeze

#### 🟡 Minor: `is-aft` has no CSS
**Location:** `hud.js:1464–1468`; `hud.css` grep 0  
**Issue:** Aft is already the bowl of the arc (`contactYawToU`). Adding an aft word/icon as “radar” would clutter.  
**Fix:** Do not invent aft chrome.  
**Status:** accepted  
**Justification:** yaw mapping is the aft cue; extra chrome is a new widget.

#### 🟡 Minor: Enter pulse already animates
**Location:** `hud.css:863–874`  
**Issue:** Freeze says no **new** `@keyframes`. Live `rw-contact-enter` stays.  
**Fix:** Do not add a sweep. Reduced-motion already kills the live pulse.  
**Status:** accepted  
**Justification:** removing the live pulse is out of scope; adding a radar-spin is forbidden.

#### 💡 Suggestion: Park arc while jumping
Already default-yes in contract §1.3 / §9. Matches NAV-02 and the live lock-arrow park.

### Frozen copy / chrome (do not paraphrase later)

| Moment | Literal / glyph | Surface |
|---|---|---|
| Mk II lock inbound | `«` | pip `textContent` |
| Mk II lock outbound | `»` | pip `textContent` |
| Cannon vs player | `Incoming fire.` | toast (sibling; do not change) |
| Dart vs player | `Incoming dart.` | toast (do not change) |
| Pip names | **none** | — |

Do not add RADAR / PPI captions on the hub. Do not add a LOCK word on the traffic diamond (that mark is the lock **on the arc**, not the edge arrow).

### Contrast / motion / layout
- `body.rw-colorblind` remaps `--rw-warn` / `--rw-accent` (Okabe-Ito). Chevrons stay chevrons.
- `body.rw-contrast` strengthens `.rw-contacts-stroke`.
- `body.rw-reduced-motion`: no new sweep; enter keyframes already `animation: none`.
- Toast stack stays top-right off the aim column. Radar stays the bottom arc.
- Digit 0/8/9 chrome untouched. Outfitting 2/4 stay Wolfeye labels.

### Pass 2
PPI and class-steal Majors remain closed in the freeze. Jump-park is polish, not a new gauge. No new Blocker.
