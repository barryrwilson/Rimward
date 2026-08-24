# Security Review: BIO-08 anatomy-native locomotion brief (Wave 107)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is a frozen six-key gait map, hasOwn lookup, GPU uniform **floats**, no DOM, no persist, no Digit, no `state.js` write. XSS, proto-index, persist-world, and shader-source interpolation stay contract-frozen. No CRITICAL or HIGH.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied. No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (classKey from hangar JSON, GPU compile strings, persist). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could proto-index `LIVING_GAIT[classKey]` from hangar JSON

**Location:** live `hangar.js` 40–41 `classKeyOf`; contract `out/w107/bio08/shared-contract.md` §0.8; later `gaitFor`.

**Issue:** This wave does not ship JS. A later PR that does `LIVING_GAIT[player.classKey]` without `hasOwn` could read `__proto__` / `constructor` if a caller bypasses `classKeyOf`. Live remount already heals via `classKeyOf`. GPU `userData.classKey` is now stashed from `canonicalClass` (`ship-assets.js` 455) — still re-heal with `gaitFor` hasOwn.

**Impact:** Unexpected object / inherited property used as gait weights; possible `NaN` displacement (visual). Not RCE. Not persist smash.

**Fix (frozen):** `gaitFor` uses `Object.hasOwn` (or `hasOwnProperty.call`) on the freeze; miss classKey → **light**; miss gaitId → **live spine+flap**. PR3 stashes `userData.classKey` from `canonicalClass` only (`ship-assets.js` 119–121). Never parse a user string into shader source.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could interpolate `classKey` / `gaitId` into `onBeforeCompile` GLSL

**Location:** live `ship-assets.js` 72–93 authored template string; contract §5, §0.11.

**Issue:** Gait must be **uniform floats**, not `shader.vertexShader += gaitId`. A later “helpful” compile-key per species that concatenates blob text would be an injection footgun and would also violate the one-shader freeze.

**Impact:** Unexpected shader compile / malformed GLSL. Class keys today are allowlisted, so practical XSS is low; the freeze is still required.

**Fix (frozen):** keep authored GLSL; add `uSwimSpineX` / `uSwimFlapY` / `uSwimKickZ` / `uSwimRadial` as floats; `customProgramCacheKey` stays **one** constant (live `rimward-beautiful-swim-hz-sweep`, `ship-assets.js` 55, 101). Authored, not user text.

**Status:** mitigated in contract.

#### 🟢 LOW: Persist / Digit / SKU theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.7; `save.js` `WORLD_FIELDS` 76–101; `station.js` 185, 6026–6030.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: `Math.random()` swim phase is live and stays

**Location:** `ship-assets.js` 465.

**Issue:** Not CSPRNG. Visual phase only. Not a session secret. Do not persist. Do not “upgrade” to `crypto.getRandomValues` in this leftover.

**Status:** accept; out of BIO-08.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; no gait persist; no localStorage gait key
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` gait fields
- [x] Prototype-safe law copied (`classKeyOf` + `gaitFor` hasOwn)
- [x] No new `ctx.emit` type
- [x] HUD never writes `hullKind`
- [x] No UU / SKU
- [x] Shader source stays authored; one program
- [x] Unknown class fail-closed to light; missing gait fail-closed to live mix (not a crash, not a stub mesh)
- [x] Unknowables NPC still receive no Beautiful swim uniforms

### Recommendations

1. Later PR1: export `gaitFor` with `hasOwn` in the same commit as the table.
2. Later PR3: keep allowlisted `userData.classKey` (`ship-assets.js` 455); do not split `assetInstanceKey` without `hasOwn` on the class token.
3. Later PR4: grep `mixer.timeScale`, `WORLD_FIELDS` for gait, `state.js` diff empty, `innerHTML` 0 on touched files, no `eval` / shader string concat of `classKey`.
4. Do not log player names beside gait ids.
