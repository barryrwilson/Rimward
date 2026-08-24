## Code Review: yard-preview (iteration 2)

### Summary
`frameObject` no longer fits each mesh to the tile. Living SKUs (and plated light–heavy) share the heavy charter span. Frigate and freighter keep their own span so they are not clipped.

### What's done well
- Shared family scale restores `livingRestScale` in the well.
- `fit` still centres the bbox, so rotation stays on the hull.
- `reframeFamily` updates siblings when a larger hull joins the cache.
- Confirm papers uses the same world scale; heavy is not a zoomed light.

### Findings

#### 🟡 Minor: Confirm-light sits small in a large well
**Location:** `src/systems/yard-preview.js:161-173`
**Issue:** A lone light confirm still uses the heavy family span. The hull reads small. That is the size contract.
**Fix:** None. Do not special-case confirm with fill-to-fit.

#### 💡 Suggestion: Frigate / freighter still fill their own tiles
**Location:** `src/systems/yard-preview.js:174-176`
**Issue:** Classes above heavy use own span so they are not clipped. They do not share scale with light.
**Fix:** Optional later: a compressed plated ladder. Out of scope for the living light/heavy bug.

### Re-review
The HIGH fill-to-fit bug is fixed. No remaining Blocker or Major.
