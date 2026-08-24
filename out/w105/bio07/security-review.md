## Security Review: BIO-07 distinct species-inspired living ship bodies brief (Wave 105)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is NPC GLB body law, anti-rigidity, six live class keys, Wave 95 fail-closed GLB, no DOM, no persist, no Digit, no `state.js` write, no SKU add. XSS, proto-index, path join, remote GLB, `eval`, and shader-source interpolation stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor + orchestrator `security-review.md`. Self-applied. No `src/` edits from this worker.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later bake CLI could interpolate unsanitized faction/class into Blender filepath

**Location:** live `scripts/build-ship-assets.py` 429–442 `PILOTS`; contract `out/w105/bio07/shared-contract.md` §4, §7; later PR8.

**Issue:** This wave does not ship Python. A later PR that concatenates a save/network string into a `.blend` / GLB `filepath` would be path injection. Live bake uses authored `FACTIONS` / `CLASSES` tokens.

**Impact:** Unexpected file write / read outside `assets-source/ships/beautiful/` or `public/assets/ships/beautiful/`. Not live this pack.

**Fix (frozen):** Blender args stay allowlisted tokens. Runtime join stays `canonicalFaction` / `canonicalClass` before `` `${ASSET_ROOT}/…` `` (`ship-assets.js` 114–119, 387–390). No user-authored model URL.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could interpolate `classKey` into `onBeforeCompile` GLSL or HUD HTML

**Location:** live `ship-assets.js` 59–86 authored template string; `hud.js` 709–712; `modelsbrowser.js` 114 `innerHTML`; contract §5, §7.

**Issue:** BIO-07 must not name a class by concatenating blob text into shader source or `innerHTML`. Class keys today are allowlisted, so practical XSS is low; the freeze is still required.

**Impact:** Unexpected shader compile or DOM XSS if a later debug overlay names hulls with `innerHTML`.

**Fix (frozen):** keep authored GLSL; no new DOM; `textContent` / `h()` / `el()` only if a later UI names a class. Models Browser `innerHTML` stays out of this leftover.

**Status:** mitigated in contract.

#### 🟢 LOW: Persist / Digit / SKU theft if later serial ignores MERGE LAW

**Location:** contract §0.8, §5; `shipyard.js` 16–30; `station.js` 185; `save.js` `WORLD_FIELDS`.

**Issue:** A later body PR could add `world.hullLook`, steal Digit 0, or append a seventh living SKU.

**Status:** accepted residual; design-only wave. Contract forbids.

#### 🟢 LOW: `Math.random()` swim phase is live and stays

**Location:** `ship-assets.js` 430.

**Issue:** Not CSPRNG. Visual phase only. Not a session secret. Do not persist. Do not “upgrade” in this leftover.

**Status:** accept; out of BIO-07.

#### 🟢 LOW: Generic `BUILDERS['beautiful']` stub could replace a failed pilot class

**Location:** `build-ship-assets.py` 354–361, 420–424; contract §0.9, §4.

**Issue:** If a later bake drops a key from `PILOT_CLASSES`, the sphere+box stub ships. That is a visual fail-closed smash and a path still served from the same origin.

**Fix (frozen):** keep Wave 95 GLB; do not drop `PILOT_CLASSES` keys.

**Status:** mitigated in contract.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` / `scripts/` / `public/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; no look persist
- [x] No new `localStorage` key
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` / path join from a blob string without allowlist
- [x] Prototype-safe law copied (`canonicalClass` / `canonicalFaction`)
- [x] No new `ctx.emit` type
- [x] HUD never writes `hullKind`
- [x] No invented UU / new SKU
- [x] Shader source stays authored
- [x] Unknown class fail-closed to light
- [x] No remote GLB; glow stays a mesh
- [x] `eval` / `new Function` forbidden

### Recommendations

1. Later PR1/PR2: bake only `beautiful` + that class token from the allowlist.
2. Later PR8: grep `innerHTML`, `WORLD_FIELDS`, `eval`, `https://` in touched bake/runtime files; keep `assertSelfContainedGlb`.
3. Do not log player names beside class anatomy notes.
4. PR7 (shared organs) must not accept user strings as organ names into object keys without `hasOwn`.
