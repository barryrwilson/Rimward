## UI Audit: NAV-02 ring / cue / AP aim

### Summary
No new HUD nodes or CSS. The cyan ring, off-screen cue, and autopilot aim now share `resolveNavGatePos` (live zone origin, else authored). Readout copy and ARIA are unchanged.

### What's done well
- Ring still `nav-gate-marker` / torus, `emptyNavRaycast`, additive cyan
- Cue still `.rw-nav-gate-cue`, hidden on-glass, edge-clamped
- Docked / jumping still park the readout (`navPark`)
- No `innerHTML`, no lock steal, no dest teleport chrome
- Hub dest aims the junction (same coords as `gate.js` zone), not empty space

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: (none)

#### 💡 Suggestion: Live overlay of ring on sculpt

**Location:** `src/systems/nav-guidance.js` marker at zone origin  
**Issue:** Faction sculpts add side geometry. The marker sits on the bore origin, which is the jump zone. That is the contract.  
**Fix:** None. Do not offset toward decorative mesh.

### Recheck
Probe `guidance.pos.liveVeridian` and `live.hub.matchesAuthored` are true. WAVE85 guidance source pins were not rewritten.
