# UI Audit: BIO-08 Wave 108 gait first impl (living motion; HUD-adjacent)

**Auditor:** parent `[designer]` pass (persona + `ui-audit.md`)
**Review file:** `out/w108/bio08/designer-audit.md`
**Scope:** `src/game/living-gait.js`, `src/systems/ship.js` living CPU loop, `src/systems/ship-assets.js` GPU swim / uniforms, `docs/Bio08LocomotionDesign.md`, `out/w107/bio08/shared-contract.md`
**Worker self-audit:** `out/w108/bio08/ui-audit.md` (checked; not treated as gospel)
**Stance:** Review only. No `src/` edit. No Vite. No Chrome.

### Summary
Wave 108 lands silent locomotion only. No new HUD child, Digit, toast, or desk swim. Authored axis mixes match the deputize table. Ace flapY stays low. Frigate radial stays below squid. Player light CPU still uses the unweighted sculpt. NPC `reducedMotion` still zeros amp. No Blocker. No Major.

**Verdict: CLEAN**

### Checklist (task gates)

| Gate | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px hub; no gait pip / species disc / RANGE rewrite | **Pass** | `src/ui/hud.css:184-219`; `src/systems/hud.js:709-712` |
| Digit 0 shipyard; Digit 8/9 stay; no new Digit; no toast | **Pass** | `src/systems/station.js:188, 6039-6046, 6118-6120` |
| Player light living feel preserved | **Pass** | `src/systems/ship.js:987-1021` |
| Ace must not read as manta wings | **Pass (source)** | `living-gait.js:23-28`; GPU `uSwimFlapY` |
| Frigate must not be a radial sunburst | **Pass (source)** | `living-gait.js:37-42` (`radial` 0.28 < squid 1.00) |
| No `innerHTML`; HUD never writes `hullKind` | **Pass** | no `innerHTML` on write-set; `hud.js:81-89` read only |
| `reducedMotion`: NPC amp 0; player CPU swim still on | **Pass** | `ship-assets.js:513,525`; `ship.js:954-1028` |
| No Digit 0 desk swim | **Pass** | `yard-preview.js:89,115` `update: null` |

Headless source review cannot prove live silhouette in a browser. Task forbids Chrome. Family intent is pinned in the table and uniforms.

### What's done well
- `living-gait.js` is THREE-free. Numbers match contract §0.1. `gaitFor` uses `Object.hasOwn`. Unknown classKey maps to light. Unknown gaitId maps to live mix `1,1,0,0`.
- Player **light** (and unknown class) skips gait weights. Breath 0.25 Hz, heart 1.1 Hz, idle 0.5 / cruise 2.3, mood, veins, and unweighted X spine + Y flap stay on the live lines.
- Non-light living remounts keep breath/heart radial first, then multiply spine/flap and add Z kick + radial pulse. `makeLivingHull` is not replaced.
- Beautiful NPC stays one program (`rimward-beautiful-swim-gait`). Gait is four floats. `uSwimAmp` / `uSwimSweep` are not overloaded as gait. Mixer `timeScale` is not set by class.
- Ace `flapY` 0.12 and squid `radial` 1.00 fight manta wings. Frigate `radial` 0.28 stays below squid. Frigate `kickZ` 1.00 is the trail bias.
- aSwim bake stays bbox `|x|` wingness (fail-closed). No stub mesh path.
- Hub markup is still pupil + three cilia + `RANGE`. CSS hub is still 80×80 px. `RANGE` is still TGT-01 (`display: none` until `.in-range`).
- Digit 0 still selects the last `DOCK_KEY_SERVICES` entry (`shipyard`). Digit 8/9 on dock root stay launch / epics. Outfitting Digit 8/9 still arm papers.
- Yard living preview still has `update: null`. No second CPU swim on the desk.
- No gait persist key. No `SHIP_CLASSES` gait field. No new toast / `commLine` / Digit for gait.
- No new control, so no missing focus, hover, or name on a new widget.

---

### Findings

None at Blocker or Major.

#### 💡 Suggestion: Live flap-axis family is unproven in a browser
**Location:** Beautiful NPC traffic (no file line; source-only review)
**Issue:** Ace vs manta and frigate vs sunburst are proven as authored floats, not as a side-by-side silhouette on GPU meshes. `aSwim.y` is still `|x|` wingness (`ship-assets.js:313-314`). Axis mix is the intended fix this wave.
**Fix:** Optional playtest at fleet range after this serial. Do not add a hub pip or species disc to “explain” gait.
**Status:** Open / out of this pass (Chrome forbidden). Not a source defect.

---

### Accessibility
- No new interactive HUD or dock control. Keyboard map is unchanged.
- KeyO `reducedMotion`: NPC `uSwimAmp` 0 and mixer frozen (`ship-assets.js:513,525`). Player living CPU vertex loop has **no** `reducedMotion` gate (`ship.js:954-1028`). That split is the live quality bar. Do not “fix” it.
- Afterburner trail still hides under `reducedMotion` (`ship.js:60,1088-1121`). That is trail chrome, not living swim.
- No new text, contrast token, or focus ring. No new empty/error/disabled state.

### Theming
- No new HUD color. No hardcoded gait chrome. Motion is mesh/shader only.

### Responsive / hierarchy
- Hub size unchanged (80 px). No overflow risk from this serial. No new primary action.

### States
- Loading / empty / error / disabled / focus / hover: N/A (no new widget).
- Fail-closed motion: unknown classKey → light; unknown gaitId → live spine+flap; missing swim uniforms → no GPU write.

### Worker self-audit delta
Worker `out/w108/bio08/ui-audit.md` also reports no Blocker/Major and the same browser-coverage suggestion. Independent read of the write-set and HUD/Digit neighbors agrees.

### Severity rollup
- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 0
- 💡 Suggestion: 1 (browser silhouette; optional)

**Verdict: CLEAN**
