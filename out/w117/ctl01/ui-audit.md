## UI Audit: Wave 117 CTL-01 dock/jump prompt copy

### Summary
Dock and jump prompts name **J** in text. Hub still paints **G** for cycle and names **J** in the verb. Color chip is not the only cue. A/D stay strafe in the CONTROLS list.

### What's done well
- Station: `pKey = 'J'`, `pVerb = 'Dock'` (`hud.js` 2128). Chip and verb are both text.
- Gate: `pKey = 'J'`, `pVerb = 'Jump to ' + destName` (2137).
- Hub: `pKey = 'G'`; verb `J — Jump to ` + dest (2134–2135). Contract: G cycles; jump uses J.
- Help line: `H — hail · J — dock · C — camera` (`controls.js` 370). A/D line still “lateral strafe (D = right)” (360).
- Onboarding: `J — dock` / `J — jump the gate` via `textContent`.
- `el()` / `textContent` only. No `innerHTML`.

### Findings

No Blocker or Major.

#### 💡 Suggestion: Hub chip shows G, not J
**Location:** `src/systems/hud.js:2134-2135`
**Issue:** The key chip is G while jump is J. The verb names J. Players who look only at the chip may tap G (cycle) instead of J (jump).
**Fix:** Not PR1. Contract freezes hub chip as G. Optional PR2 chrome after playtest.

## Append: title skip attach

No prompt or chrome change. Title skip still blocks KeyJ while the overlay is attached. Detached stub does not hide the live prompt. No Blocker or Major.

### Accessibility
- Prompt names the key in text (`pKey` and/or verb). Pass.
- Contrast / chip color unchanged. `hud.css` not edited.
- Keyboard: dock/jump is KeyJ. Title typing J does not jump (skip + capture).
- Combat rails, class tokens, RANGE, tgtFacing not in this UI delta.
