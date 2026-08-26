## Code Review: HUD-06 PR1 home-station marker

**Method:** self-applied `[reviewer]` + `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. No reviewer spawn tool in this worker.

### Summary

PR1 matches the Wave 126 merge law: dedicated pip/chevron, inset 108, POS HOME with chartmark/NAV dist buckets, hide rules, create-once DOM. No Blocker or Major defects in the landed write-set.

### What's done well

- Own nodes (`.rw-home-mark`) instead of `edgeArrow` / `gateCue`.
- Behind-camera NDC flip matches TGT (`z > 1` then negate).
- Distance uses existing `formatNavDist` for the number string only; GATE `navDistVal` is untouched.
- Change caches avoid per-frame classList/text writes; one `homeProj` scratch Vector3.
- Station lock (`kind === 'station'`) hides glass marks and keeps the POS row.
- Fail-closed on missing flags, missing pose, non-finite coords/dist/NDC.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Pip label can clip at the glass edge

**Location:** `src/systems/hud.js:1845-1860`  
**Issue:** On-glass pip is not edge-clamped (correct vs chartmarks). A pad near the right/bottom edge can push the dist label off glass. POS HOME still names distance.  
**Fix:** Optional later: flip label side when `hpx` is near `vw`. Not required for PR1.  
**Status:** documented; POS row is the mandatory text cue.

#### 💡 Suggestion: Header HUD-06 blurb

**Location:** `src/systems/hud.js:37-38`  
**Issue:** File-header comments elsewhere narrate waves. This one states a steal constraint.  
**Fix:** Leave. It encodes “not a lock / not NAV-02 / not hub”.  
**Status:** accepted.

### Contract grep (this session)

| Check | Result |
|---|---|
| `.rw-home-mark` | present (`hud.js` create; `hud.css` style) |
| `innerHTML` in `hud.js` | 0 |
| `HOME_EDGE_INSET = 108` | present |
| `edgeArrow.style.transform` | TGT path only (~1465) |
| `gateCue.style.transform` | NAV-02 path only (~1783) |
| POS `HOME` literal | `hud.js` ~1045 |
| `navDistVal` home dist | not written |
| `@keyframes` on `.rw-home-mark` | none |
