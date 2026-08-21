## UI Audit: Wave 82 TGT-05 lock categories + 12 px cone

### Summary
No HUD-01/HUD-02 layout move. Hit still uses the existing target bracket (`textContent` name + distance). Miss still uses the existing comm line. Combat rail, lead, RANGE, and MATCH lamp stay ship/rock only. No Blocker/Major findings.

### What's done well
- Station / gate / pod / landmark show authored (or static) name + dist only.
- Gate dest uses `SYSTEMS[to].name` plus a static `HUB` suffix; raw tokens are not printed when a display name exists.
- Pod name line is `CARGO` / ore commodity name / `SURVIVOR` — not stuffed survivor names.
- Landmark name comes from authored `landmarks[].id`; clue id/text never paint.
- Unknown untagged `{position}` hides rather than painting `ASTEROID`.
- Dock / Jump prompts still win over hail / T / mine / V. A station lock does not replace D-dock.
- First-person pick still uses the centered pip (`fillCamRay` offset `0,0`).

### Findings

None at Blocker or Major.

#### 💡 Suggestion: empty authored name
**Location:** `src/systems/hud.js` kind branches
**Issue:** If an authored station/gate/landmark name is missing after strip, the bracket can show dist with a blank name line.
**Fix:** Live authored names exist; no layout change. Fail-closed empty string is safer than a guessed label.

### States
- Hit: existing bracket, immediate.
- Miss: `Nothing under the reticle.` + `reticleLock { hit:false }`.
- MATCH lamp off for the four kinds (flag cannot stay armed: ship.js `matchLive` is false).
- Combat rail hidden for kinds.
