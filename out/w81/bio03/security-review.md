# Security Review: BIO-03 per-class look and bake (Wave 81)

### Risk Level: Low

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
Mode: deep audit of the **later** look/bake threat model. Wave 81 is markdown only; this wave adds no runtime surface.

### Re-review (after first-pass fix)

No 🔴/🟠 remain open. `PILOT_CLASSES` fallthrough (sphere stub replacing a failed class) is closed in contract §6 as a bake fail-closed, not a new network surface. Passed checks unchanged.

### Summary

Wave 81 ships no loaders, no GLBs, and no `src/` edits. The threat model for a later look + bake serial is local asset-path injection, remote GLB fetch, `eval` of model names, `userData` prototype smuggle, glow-not-a-mesh, and HUD/`hullKind` persist smuggle. First-pass HIGH holes are closed in `out/w81/bio03/shared-contract.md`. Live `ship-assets.js` already canonicalizes faction/class before path join.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Asset path injection on faction/class

**Location:** `ship-assets.js` 13, 23–36, 114–119, 230–234, 387–390; contract §6–§7  
**Issue:** `` `${ASSET_ROOT}/${faction}/${classKey}/${lod}.glb` `` is a path join. A later BIO-03 worker who skipped `canonicalFaction` / `canonicalClass` and concatenated a hangar or URL `faction` (`../`, `beautiful%2f..%2f`, `__proto__`) could load off-root files or throw the loader at unexpected URLs. Bake CLI `filepath` interpolation of a raw class token has the same class of bug on disk.  
**Impact:** Same-origin file disclosure or broken loads from tampered traffic records.  
**Fix applied:** Contract §0.14 / §6 / §7: join only after allowlists `NPC_FACTIONS` / `NPC_CLASSES`. Unknown → `independent` / `light`. Never concatenate raw save/network strings. Bake args must be tokens from `FACTIONS` / `CLASSES` in `build-ship-assets.py`. Inventory cites live canonical helpers (`canonicalFaction` 114–116, `canonicalClass` 118–119, `buildShipAsset` 387–390).

#### 🟠 HIGH (resolved): Remote GLB URLs

**Location:** `ASSET_ROOT = '/assets/ships'` (`ship-assets.js` 13); `loader.loadAsync(path)` 242; test reader 236–240  
**Issue:** A “procedural vs GLB” debate that allowed `https://` model URLs would pull untrusted binaries into `GLTFLoader` (scripts, external buffers). A look serial that “references” a CDN plate as a mesh would be the same hole.  
**Impact:** XSS / unexpected network in a later visual wave.  
**Fix applied:** Contract §0.14 / §6: same origin only. No `http://` / `https://` GLB. `assertSelfContainedGlb` already rejects external `buffers[].uri` / `images[].uri` (209–228). Owner Q1 fail-closed keeps the local bake path. Live grep: the only `https://` in `ship-assets.js` is a three.js docs comment (147).

#### 🟠 HIGH (resolved): `eval` / dynamic shader from model names

**Location:** `ship-assets.js` 59–87 `onBeforeCompile`; grep: no `eval` / `new Function`  
**Issue:** A later “data-driven shader” that `eval`s a class key or interpolates unsanitized names into GLSL would execute attacker strings. A bake-time `eval` of a model name would be the same class.  
**Impact:** Script in the WebGL compile path.  
**Fix applied:** Contract §6: no `eval` / `new Function`. Shader inject stays authored source (`injectSwim`). Model names are allowlisted tokens, not code.

#### 🟠 HIGH (resolved): HUD / persist smuggle of look flags

**Location:** HUD-02; `save.js` wholesale player; `Math.random` phase `ship-assets.js` 430  
**Issue:** Persisting `swimPhase`, class-look blobs, or letting HUD write `hullKind` / a new `npcLook` key would smuggle prototype ids and flip family.  
**Impact:** Family flip; proto ids on hangar rows.  
**Fix applied:** No BIO-03 persist. Phase visual-only. HUD never writes `hullKind` or `grafted`. Grafts stay `built` + `grafted`. `state.js` READ-ONLY. No new frozen event.

#### 🟠 HIGH (resolved): `userData` prototype pollution / glow not a mesh

**Location:** `ship-assets.js` 404–416, 427–440; `npc.js` 1382, 1916, 1942  
**Issue:** Assigning unsanitized class names as `userData` keys, or `Object.assign` of a save blob onto `userData`, can set `__proto__` / `constructor`. Replacing `userData.glow` with a hex or sprite-only flag would throw when `npc.js` writes `.scale` / `.visible`.  
**Impact:** Prototype pollution on the mesh object; combat FX crash (availability), not XSS by itself.  
**Fix applied:** Contract §7: own keys only (`glow`, `swimUniforms`, `swimPhase`, mixer, lod, proxy). No `Object.assign` of untrusted blobs. Glow stays a Group with a mesh child (Wave 42).

### Findings (open, not blockers for this markdown wave)

#### 🟡 MEDIUM: World string XSS if a later verify line uses `innerHTML`

**Location:** `shipyard-desk.js` (no `innerHTML`); `modelsbrowser.js` still uses `innerHTML` (out of scope)  
**Issue:** Class labels or “living frigate” copy printed with `innerHTML` would execute.  
**Fix applied in law:** Contract §0.13 / §7: `textContent` only. BIO-03 does not touch models-browser.  
**Why not raised to HIGH:** No UI ships in Wave 81. Law already forbids `innerHTML`.

#### 🟡 MEDIUM: Procedural ship path would skip GLB self-contain checks

**Location:** contract §14 Q1; Bloom is procedural (`station.js` 271)  
**Issue:** If the owner later chose Three.js ships without a loader, remote-URL checks do not apply — but a hybrid that `fetch`es extra maps by name could reintroduce injection.  
**Fix:** Default keep GLB. If owner overrides, that serial must re-apply canonical names and no remote URLs. Documented, not a Wave 81 hole.

#### 🟢 LOW: `JSON.parse` of local GLB JSON in tests

**Location:** `ship-assets.js` 221  
**Issue:** Parse of authored GLB JSON is not `eval`. A malicious checked-in GLB could still be a large JSON blob.  
**Fix:** Keep `assertSelfContainedGlb`. Do not parse GLB JSON from user input. Not a BIO-03 persist path.  
**Justification for leave:** Live test-only path; Wave 81 does not change it.

#### 🟢 LOW: GPU swim `Math.random()` phase

**Location:** `ship-assets.js` 430  
**Issue:** Not a security issue. Must not copy unseeded RNG into persist.  
**Fix applied:** Contract §4 / §9: visual only.  
**Justification for leave:** Visual RNG; law already forbids persist.

#### 🟢 LOW: Bake writes under `public/assets/ships/`

**Location:** `build-ship-assets.py` 29, 509–517; `compress-ship-assets.mjs` 9  
**Issue:** A later bake with a non-allowlisted faction string could write outside `beautiful/`.  
**Fix applied in law:** Contract §6: bake **beautiful** only; CLI tokens from `FACTIONS` / `CLASSES`. Wave 81 does not run bake.  
**Justification for leave:** Closed in law; no bake this wave.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key
- [x] No `innerHTML` for BIO-03 UI
- [x] No `eval` of model names (live + freeze)
- [x] Same-origin asset root; canonical faction/class before join
- [x] Self-contained GLB (no external uri) already in live tests
- [x] No remote GLB URLs
- [x] `userData.glow` stays a mesh
- [x] Prototype-safe `userData` own-keys freeze
- [x] HUD never writes `hullKind`
- [x] Power ledger out
- [x] No `src/` / bake / `public/` edits in this wave

### Recommendations

1. Later look/bake PRs: grep `canonicalFaction` / `canonicalClass` at every new path join before merge.
2. Later bake: pass only `beautiful` + live six class tokens; do not interpolate save strings into Blender `filepath`.
3. Keep `assertSelfContainedGlb` on any new LOD files.
4. Confirm `userData.glow` still has a mesh child after bake (npc.js 1916 / 1942).
