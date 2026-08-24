## Security Review: BIO-06 class-scaled living fin cadence brief (Wave 104)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is a frozen six-key float table, `hasOwn` lookup, GPU uniform floats, no DOM, no persist, no Digit, no `state.js` write. XSS, proto-index, persist-world, and shader-source interpolation stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor + orchestrator `security-review.md`. Self-applied. No `src/` edits.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could proto-index `LIVING_CADENCE[classKey]` from hangar JSON

**Location:** live `hangar.js` 40–41 `classKeyOf`; `hangar.js` 227; contract `out/w104/bio06/shared-contract.md` §0.8; later `cadenceFor`.

**Issue:** This wave does not ship JS. A later PR that does `LIVING_CADENCE[player.classKey]` without `hasOwn` could read `__proto__` / `constructor` if a caller bypasses `classKeyOf`. Live remount already heals via `classKeyOf`, but GPU `userData` is not healed today (`ship-assets.js` 439 stores a composed key).

**Impact:** Unexpected object / inherited property used as scales; possible `NaN` Hz (visual). Not RCE. Not persist smash.

**Fix (frozen):** `cadenceFor` uses `Object.hasOwn` (or `hasOwnProperty.call`) on the freeze; miss → **light**. PR3 stashes `userData.classKey` from `canonicalClass` only (`ship-assets.js` 118–119). Never parse a user string into shader source.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could interpolate `classKey` into `onBeforeCompile` GLSL

**Location:** live `ship-assets.js` 64–85 authored template string; contract §5.

**Issue:** Cadence must be a **uniform float**, not `shader.vertexShader += classKey`. A later “helpful” compile-key per class that concatenates blob text would be an injection footgun.

**Impact:** Unexpected shader compile / malformed GLSL. Class keys today are allowlisted, so practical XSS is low; the freeze is still required.

**Fix (frozen):** keep authored GLSL; add `uSwimSweep` as a float; `customProgramCacheKey` stays the live constant `rimward-beautiful-swim-hz` (`ship-assets.js` 49, 95) unless a later pin proves a second program is required — still authored, not user text.

**Status:** mitigated in contract.

#### 🟢 LOW: Persist / Digit / SKU theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.7; `save.js` `WORLD_FIELDS`; `station.js` 185, 6023–6025.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: `Math.random()` swim phase is live and stays

**Location:** `ship-assets.js` 430.

**Issue:** Not CSPRNG. Visual phase only. Not a session secret. Do not persist. Do not “upgrade” to `crypto.getRandomValues` in this leftover.

**Status:** accept; out of BIO-06.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; no cadence persist
- [x] No new `localStorage` key
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` / `WEAPONS` index from a blob string without hasOwn
- [x] Prototype-safe law copied (`classKeyOf` + `cadenceFor` hasOwn)
- [x] No new `ctx.emit` type
- [x] HUD never writes `hullKind`
- [x] No UU / SKU
- [x] Shader source stays authored
- [x] Unknown class fail-closed to light (player bar, not a crash)

### Recommendations

1. Later PR1: export `cadenceFor` with `hasOwn` in the same commit as the table.
2. Later PR3: stash allowlisted `userData.classKey` at `buildShipAsset`; do not split `assetInstanceKey` without `hasOwn` on the class token.
3. Later PR4: grep `mixer.timeScale`, `WORLD_FIELDS` for cadence, `state.js` diff empty, `innerHTML` 0 on touched files.
4. Do not log player names beside Hz.
