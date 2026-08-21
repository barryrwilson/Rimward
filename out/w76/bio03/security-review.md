## Security Review: BIO-03 Wave 76 NPC GPU swim

### Risk Level: Low

### Summary
Motion-slice edits stay on same-origin allowlisted GLB paths and authored shader source. No remote URLs, no `eval`, no persist keys, no `innerHTML`.

### Findings

None at critical/high/medium.

#### 🟢 LOW: Shader inject remains string replace on authored GLSL
**Location:** `src/systems/ship-assets.js:59-86`
**Issue:** `onBeforeCompile` prepends uniforms and replaces `#include <begin_vertex>`. Source is a fixed template, not a model name or network string.
**Impact:** None unless a later PR concatenates untrusted text into the inject.
**Fix:** Keep inject authored. Do not `eval` model names (already forbidden).

### Passed Checks

- [x] No secrets in code
- [x] Asset paths join only after `canonicalFaction` / `canonicalClass` (`NPC_FACTIONS` / `NPC_CLASSES`)
- [x] `ASSET_ROOT = '/assets/ships'` same origin; no `http://` / `https://` GLB URLs
- [x] `assertSelfContainedGlb` still rejects external `uri`
- [x] No `eval` / `new Function` of model names
- [x] No `innerHTML`
- [x] No new persist / `localStorage` key
- [x] Swim phase stays `Math.random` on `userData` (visual only)
- [x] `userData.glow` remains a Group with a mesh child
- [x] `npc.js` change is speed-pass only (`velocity.length()`)

### Recommendations

1. Later class-look bake must keep canonical path join and self-contained GLB checks.
2. Do not move shader source onto save rows or hangar blobs.
