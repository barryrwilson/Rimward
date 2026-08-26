## Code Review: Hail02 PR1 named miss-feedback

### Summary

Player KeyH miss and leftover KeyJ miss emit one `'hailMiss'` from `emitHailMiss`. HUD `toastForEvent` maps authored tokens to `textContent` toasts with a stable linger key. Salvage / Hail01 / dock / jump success still skip miss. No Blocker/Major remain.

### What's done well

- One never-throw helper with an authored verb/reason allow-list.
- Overlay vs calm vs salvage/no-hail reasons stay separate; salvage open path is unchanged.
- KeyJ observes leftover `dockPressed` after station/gate; does not consume the edge or rewrite snap.
- HUD linger key omits distance; slot count and 8 s window stay.
- Hail01 `DEMAND_SECONDS`, `bumpFear` on intents, and the HUD prompt block stay.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None after fix pass.

#### 🟡 Minor: Jump dest uses nearest authored gate, not live assembly

**Location:** `src/systems/hail.js` `emitDockJumpMiss`  
**Issue:** Gate distance reads `SYSTEMS` / `ctx.systems` gate positions, not `gate.js` assemblies. Hub junctions may not win the nearest-gate pick.  
**Justification:** Write-set forbids claiming `gate.js`. Leftover `dockPressed` plus `jumpRequested` skip still covers in-zone success. Pad-near KeyJ still names dock.

#### 🟡 Minor: Destroyed lock now toasts `no-hail` instead of silent calm refuse

**Location:** `src/systems/hail.js` player KeyH calm gate  
**Issue:** Calm refuse now requires `live.state && !live.state.destroyed`. A destroyed lock falls through to classify `no-hail`.  
**Justification:** `'hail calm'` on a wreck is false. Card still does not open.

#### 💡 Suggestion: Share `hailMissKeyName` with demand keys

Demand keys still interpolate raw `name`. Out of Hail02 write-set.

### Second pass

Re-read hail.js emit, hud.js `hailMissToast`, ctx.js comment. Blocker/Major still none.
