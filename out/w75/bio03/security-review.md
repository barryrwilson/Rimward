## Security Review: BIO-03 Beautiful Ones NPC fleet design (Wave 75)

### Risk Level: Low

### Summary

Wave 75 is markdown only. The threat model for a later visual serial is local asset-path injection, remote GLB fetch, `eval` of model names, world-string XSS, persist of visual RNG, and HUD/`hullKind` smuggle. First-pass HIGH holes are closed in the contract. This wave adds no runtime surface.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Asset path injection on faction/class

**Location:** `ship-assets.js` 13, 23–36, 50–56, 201–205; contract §6  
**Issue:** `` `${ASSET_ROOT}/${faction}/${classKey}/${lod}.glb` `` is a path join. A later BIO-03 worker who skipped `canonicalFaction` / `canonicalClass` and concatenated a hangar or URL `faction` (`../`, `beautiful%2f..%2f`) could load off-root files or throw the loader at unexpected URLs.  
**Impact:** Same-origin file disclosure or broken loads from tampered traffic records.  
**Fix applied:** Contract §6: join only after allowlists `NPC_FACTIONS` / `NPC_CLASSES`. Unknown → `independent` / `light`. Never concatenate raw save/network strings. Inventory cites live canonical helpers.

#### 🟠 HIGH (resolved): Remote GLB URLs

**Location:** `ASSET_ROOT = '/assets/ships'`; `loader.loadAsync(path)` `ship-assets.js` 213; test reader 207–211  
**Issue:** A “procedural vs GLB” debate that allowed `https://` model URLs would pull untrusted binaries into `GLTFLoader` (scripts, external buffers).  
**Impact:** XSS / unexpected network in a later visual wave.  
**Fix applied:** Contract §0.14 / §6: same origin only. No `http://` / `https://` GLB. `assertSelfContainedGlb` already rejects external `buffers[].uri` / `images[].uri` (180–198). Owner Q1 fail-closed keeps the local bake path.

#### 🟠 HIGH (resolved): `eval` / dynamic shader from model names

**Location:** `ship-assets.js` 137–163 `onBeforeCompile`; grep: no `eval` / `new Function`  
**Issue:** A later “data-driven shader” that `eval`s a class key or interpolates unsanitized names into GLSL would execute attacker strings.  
**Impact:** Script in the WebGL compile path.  
**Fix applied:** Contract §6: no `eval` / `new Function`. Shader inject stays authored source. Model names are allowlisted tokens, not code.

#### 🟠 HIGH (resolved): HUD / persist smuggle of look flags

**Location:** HUD-02 history; `save.js` wholesale player; `Math.random` phase `ship-assets.js` 397–398  
**Issue:** Persisting `swimPhase` or letting HUD write `hullKind` / a new `npcLook` key would smuggle prototype ids and flip family.  
**Impact:** Family flip; proto ids on hangar rows.  
**Fix applied:** No new persist key. Phase visual-only. HUD never writes `hullKind` or `grafted`. `state.js` READ-ONLY. `RESERVED_IDS` on hangar ids (live). No new frozen event.

#### 🟡 MEDIUM: World string XSS if a later verify line uses `innerHTML`

**Location:** `shipyard-desk.js` (no `innerHTML`); `modelsbrowser.js` still uses `innerHTML` (out of scope)  
**Issue:** Class labels or “living frigate” copy printed with `innerHTML` would execute.  
**Fix applied:** Contract §0.12 / §8: `textContent` only. BIO-03 does not touch models-browser.

#### 🟡 MEDIUM: Procedural ship path would skip GLB self-contain checks

**Location:** contract §13 Q1; Bloom is procedural (`station.js` 255)  
**Issue:** If the owner later chose Three.js ships without a loader, remote-URL checks do not apply — but a hybrid that `fetch`es extra maps by name could reintroduce injection.  
**Fix:** Default keep GLB. If owner overrides, that serial must re-apply canonical names and no remote URLs. Documented, not a Wave 75 hole.

#### 🟢 LOW: `JSON.parse` of local GLB JSON in tests

**Location:** `ship-assets.js` 192  
**Issue:** Parse of authored GLB JSON is not `eval`. A malicious checked-in GLB could still be a large JSON blob.  
**Fix:** Keep `assertSelfContainedGlb`. Do not parse GLB JSON from user input. Not a BIO-03 persist path.

#### 🟢 LOW: GPU swim `Math.random()` phase

**Location:** `ship-assets.js` 397–398  
**Issue:** Not a security issue. Must not copy unseeded RNG into persist.  
**Fix applied:** Contract §0.13 / §4: visual only.

#### 🟢 LOW: `userData.glow` must stay a mesh

**Location:** `ship-assets.js` 373–385; Wave 42  
**Issue:** Replacing glow with a hex or sprite-only flag would break `npc.js` scale/visible writes (1915, 1941).  
**Fix applied:** Contract §0.14 / §6. Not XSS; sim-correctness + FX.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key
- [x] No `innerHTML` for BIO-03 UI
- [x] No `eval` of model names (live + freeze)
- [x] Same-origin asset root; canonical faction/class
- [x] Self-contained GLB (no external uri) already in live tests
- [x] HUD does not write `hullKind`
- [x] Proto ids reserved on hangar rows (live)
- [x] `state.js` READ-ONLY
- [x] No new frozen event
- [x] Wave 75 ships no `src/` / `public/` / shaders

### Recommendations

1. Later visual PRs must keep `canonicalFaction` / `canonicalClass` on every path join (HIGH freeze).
2. Do not add a user-facing “load this GLB URL” debug without the same allowlist.
3. If owner overrides GLB→procedural, re-audit fetch and shader strings before merge.
