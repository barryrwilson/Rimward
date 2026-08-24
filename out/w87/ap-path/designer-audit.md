## UI Audit: NAV-02 ring / off-screen cue / AP aim (live gate zone origin)

**Auditor:** `[designer]` (independent of `out/w87/ap-path/ui-audit.md`)
**Scope:** Ring, off-screen cue, GATE distance, and autopilot aim share `resolveNavGatePos` / `lookupLiveNavGate`. Files: `src/systems/nav-guidance.js`, `src/systems/hud.js` (cue / readout / chip), `src/systems/gate.js` (live lookup + zone origin), `src/ui/hud.css`, `src/game/autopilot.js` (aim only).
**Method:** Static checklist (`orchestrator/references/ui-audit.md`). Worker self-audit was read, not copied. No `src/` edits. No Playwright.
**Status of this pass:** review only.

### Summary

The cyan ring, off-screen chevron, GATE distance, and autopilot aim now use one live zone origin. HUD DOM and CSS for this chrome stay the same. Wave 85 live-region and hide rules still hold. No unusable or inaccessible defect on the ring, cue, readout, or autopilot chip. Verdict **CLEAN**.

### What's done well

- One resolver feeds every find-aid: `readNavGuidance` stores `pos: resolveNavGatePos(ctx, nextId)` (`nav-guidance.js:87–91`, `134–139`). HUD cue and GATE distance project that same `navInfo.pos` (`hud.js:1538–1582`, `1792–1823`). Autopilot `aimAtGate` calls the same helper (`autopilot.js:278–290`). Ring, chevron, GATE figure, and helm cannot disagree.
- Live lookup copies `{x,y,z}` from the assembly that owns the jump zone (`gate.js:420–456`, `391–398`, `578–588`). Physical `to` wins over hub routes (`gate.js:423–446`). Hub dest still aims the junction origin, not empty space. Fallback is authored hardware (`nav-guidance.js:55–91`).
- Ring still `nav-gate-marker` / `nav-gate-ring`, torus at `RING_RADIUS + 3`, additive cyan, empty raycast (`nav-guidance.js:12–13`, `162–170`, `149–157`). `lookAt(0,0,0)` matches live assemblies (`nav-guidance.js:185–187`; `gate.js:393–394`).
- Cue is still `.rw-nav-gate-cue`, `aria-hidden="true"`, `pointer-events: none` (`hud.js:707–711`; `hud.css:939–947`). Hidden on-glass (`hud.js:1558–1563`). Edge-clamped with `EDGE_MARGIN` 84 (`hud.js:60`, `1572–1581`). Shape is two ticks + notch in `--rw-accent`, not the amber lock triangle (`.rw-edge-arrow`, `hud.css:529–548`, `950–973`).
- Readout still sits in `.rw-side-col` above POS (`hud.js:887–910`). Cap `max-width: 180px`, ellipsis on names (`hud.css:893–918`). Docked / jumping park readout, ring, and cue (`hud.js:1522–1552`). Combat dims via `.rw-aux`, not the chip.
- Live region contract still holds: outer section `aria-live="off"` / `aria-atomic="false"`; `role="status"` + `aria-live="polite"` on `.rw-nav-readout-live` only; GATE is a sibling (`hud.js:887–905`). Wave 85 Major stays closed.
- Chip stays `#hud .rw-autopilot` at `top: 14px; left: 50%` (`hud.css:602–619`). Not banner (`hud.js:601–604`), not jump (`hud.js:636–640`), not NAV-02. Cancel is `type="button"`, `aria-label="Cancel autopilot"`, hover / `:focus-visible` ring (`hud.js:950–954`; `hud.css:630–651`). Contrast lists the chip (`hud.css:1091–1098`). Reduced motion: no cue `@keyframes`; ring spin zeros (`nav-guidance.js:188–190`; `hud.css:1108–1111`).
- Copy stays `textContent`. `NO ROUTE` / `ARRIVED` / `REROUTE` are words. Names go through `navSystemName` / `stripNavText`. No `innerHTML`. Marker is not lock chrome.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: (none new)

Prior Wave 85 nits still true and unchanged by this origin share: cue and lock arrow can share a corner (`hud.js:60`, `1259–1265`, `1572–1581`); side-col height at `textScale` 1.5 (`hud.css:881–900`); nav panel has no `align-self: flex-end` (`hud.css:895–900`). Do not treat those as this pass.

#### 💡 Suggestion: World ring still ignores colorblind tokens

**Severity:** Suggestion
**Location:** `src/systems/nav-guidance.js:149–157`; remap at `src/ui/hud.css:1070–1075`
**Issue:** Cue and readout use `var(--rw-accent)` and become Okabe-Ito sky `#56B4E9` under `body.rw-colorblind`. The torus stays `0x6ff2e0`. Shape still names the routed gate. Color is not the only signal.
**Suggestion:** Optional: tint the shared material to `#56B4E9` when `ctx.settings` colorblind is on. Not required for this pass.
**Status:** open (pre-existing; not a Blocker/Major)

#### 💡 Suggestion: Keep the marker on the bore / zone origin

**Severity:** Suggestion
**Location:** `src/systems/nav-guidance.js:185`; `src/systems/gate.js:391–398`, `450–456`, `584–588`
**Issue:** Faction sculpts add side geometry. The marker, cue, GATE distance, jump zone, and autopilot aim all sit on assembly `x,y,z` (group origin). That is the jump zone. Offset toward decorative mesh would split chrome from the zone the player must enter.
**Suggestion:** Do not offset the ring toward sculpt mesh.
**Status:** no action

### Occupancy (this delta)

| Surface | Touched? |
|---|---|
| New HUD nodes / CSS | No (this increment). Cue / readout / chip already exist. |
| Aim glass | Cue still off-screen only (`hud.js:1558–1563`) |
| Lock chrome | Distinct class |
| Jump overlay / banner / toasts | Unchanged slots |
| Autopilot chip | Unchanged pin; aim now live origin |

Hide docked / jumping: yes (`hud.js:1522–1552`).  
`reducedMotion` static: yes.  
GATE outside live child: yes (`hud.js:887–905`).

### Verdict

**CLEAN.** 0 🔴 Blocker. 0 🟠 Major. Live origin share aligns ring, cue, GATE distance, and autopilot aim on the jump zone. HUD chrome and a11y from Wave 85 still stand.

Static audit only. Browser / overlap pins stay with the verifier.
