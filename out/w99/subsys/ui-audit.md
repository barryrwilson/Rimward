# UI Audit: TGT-03 remaining subsystem targeting (Wave 99 design)

**Scope:** Frontend-facing HUD freeze in `docs/Tgt03SubsystemDesign.md` + `out/w99/subsys/shared-contract.md`. No product UI shipped. Worker applied `orchestrator/references/ui-audit.md`. Did **not** spawn `[designer]`.  
**Live surfaces honored:** 80 px hub, tgt rail, FORE/AFT, toasts off-column, `.rw-contacts` sibling, `.rw-edge-arrow`.

### Summary

The freeze keeps HUD-01 empty glass, reuses the existing target rail as the part picture, and refuses a lock box, hub pip, and new gauge. No Blocker or Major. Optional later bar emphasis stays on existing meters.

### What's done well
- Empty 80 px hub is explicit (contract §0.2; `hud.css` 184–191; `hud.js` 1194).
- FORE/AFT already uses fill vs hollow **plus the word** (`hud.js` 326–351) — color is not the only cue.
- Target SCREEN/SHELL/hull bars already exist off the reticle (`hud.js` 846–855).
- Toasts stay `textContent` on `.rw-toast`; attacker copy stays `Incoming fire.` / `Incoming dart.`
- Reduced-motion: no new `@keyframes` for parts.
- Digit 0/8/9 and KeyT/KeyV remain reachable for their live jobs.

### Findings

#### 🔴 Blocker: none

#### 🟠 Major: none

#### 🟡 Minor: Lock ENGINE has no tgt-rail bar
**Location:** `hud.js:846–855` vs player Plant ENGINE `hud.js:883–885`; contract §2 / owner Q5  
**Issue:** Three of four channels sit on the lock rail. Engine on the lock is geometry + toast only. A player who expects “subsystem targeting” as four bars will not see engine on the target.  
**Fix:** Default **do not add** a fourth bar (hub law + owner number missing). Do not compensate with a hub pip. Leave Q5 fail-closed.

#### 💡 Suggestion: PR2 emphasis must keep shape/word cues
**Location:** contract §2; `hud.css` `.rw-screen` / `.rw-shell`; FORE/AFT `.is-lit`  
**Issue:** A color-only “this layer is peeling” pulse would fail colorblind and reduced-motion.  
**Fix:** If PR2 ships, toggle an existing class on the meter **row** (label stays SCREEN/SHELL) and do not add a pulse that bypasses `body.rw-reduced-motion { #hud * { animation: none } }`.

### HUD-01 / a11y checklist (later impl)
- [x] Freeze: no widget in the 80 px hub
- [x] Freeze: no lock box
- [x] Freeze: no aim-glass incoming / subsystem gauge
- [x] Freeze: FORE/AFT hit-only (not on fire)
- [x] Freeze: contrast/colorblind vars stay on bars
- [x] Freeze: no new contacts/radar class for parts
- [x] Freeze: rail name stays `textContent`
- [x] Keyboard: do not steal T/V or Digit 0/8/9

Verdict: **CLEAN** for a design-only HUD freeze.
