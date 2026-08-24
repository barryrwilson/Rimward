## Code Review: yard-preview

### Summary
The desk mounts a look-only turntable per Yard offer and on Confirm papers. One extra WebGLRenderer blits into small 2D canvases so the 1 s dock rebuild does not open a context per row. Living SKUs use `makeLivingHull(classKey)`. Plated SKUs use `buildPlayerPlatedMesh` after `primeShipAsset`, with a box fallback.

### What's done well
- Own renderer, as `modelsbrowser.js` comments require.
- Disconnect-driven dispose: empty views cancel rAF, drop the GL canvas, and clear the mesh cache.
- Cache key is `hullKind:faction:classKey` while the pane is live.
- Does not call `configureShipAssets` (would overwrite the game KTX2 loader).
- Preview does not remount or debit.
- `try/catch` around living sculpt and GL render keeps the desk up.

### Findings

#### 🟡 Minor: Six GL scenes rebuilt on every overlay paint
**Location:** `src/systems/yard-preview.js:254-267, 378-412`
**Issue:** Station `render()` rebuilds the overlay each second. Each mount creates a new scene and light rig. The GL context and mesh cache are reused, so this is CPU churn, not a context leak.
**Fix:** Reuse view scenes across remounts if the 1 s rebuild shows up in profiling.

#### 🟡 Minor: Plated textures live on the game GL context
**Location:** `src/systems/yard-preview.js:110-120, 183-189`
**Issue:** Templates were decoded for the game renderer. A second context can show dark or missing KTX2 maps. Geometry still reads class silhouette.
**Fix:** If plated previews render black in a target browser, set `texture.needsUpdate` on first attach, or blit from a same-context path. Do not call `configureShipAssets` while the game is running.

#### 💡 Suggestion: Static living pose
**Location:** `src/systems/yard-preview.js:84-108`
**Issue:** Living previews do not run the CPU swim loop. Class silhouette still differs (light / cutter / heavy).
**Fix:** Optional idle deform later. Do not pull Beautiful NPC GLBs.

### Re-review
HIGH/Blocker items from the first pass (rAF leak on empty views, mesh cache growth after leaving Yard, `visibility:hidden` skipping GL paints) are fixed in the current files. No remaining Blocker or Major.
