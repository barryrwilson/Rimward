# Security Review: FX-01 remaining combat punch brief (Wave 110)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is hull-local parent of the existing shield-ripple pool, no DOM, no new persist key, no Digit, no `state.js` write, no user shaders from save, never freeze the sim. XSS, proto-from-save, persist-world, and Digit theft stay contract-frozen. No CRITICAL or HIGH after first-person glass-flood freeze. No new trust boundary.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (save `WORLD_FIELDS`, settings localStorage, HUD/Digit, canvas textures). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could load a user material / GLSL string from save

**Location:** live textures are engine canvas (`combat.js` `makeGlowDot` 337–352, `makeRippleRing` 396–414, `makeScorchDot` 377–394); `save.js` `WORLD_FIELDS` 76–101; contract `out/w110/fx01/shared-contract.md` §0.4.

**Issue:** This wave does not ship JS. A later PR that stored a shader, data-URL, or material JSON on the save blob and assigned it to `sprite.material` would be a script/content injection surface in a WebGL client. Inventory proves PR1 needs **no** persist. Live engine never reads GLSL from `localStorage`.

**Impact:** Not live. Prototype would be a new trust boundary.

**Fix (frozen):** No user shaders. Canvas maps stay authored at init. No `world.fx` key.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `for-in` / `Object.assign` a save pose onto a host mesh

**Location:** live `stampHullMark` reads `host.position` / `quaternion` / `scale` (`combat.js` 1077–1092); contract §0.6–0.7.

**Issue:** PR1 reuses `worldHitToLocal` with a module scratch pose. A naive `Object.assign(_markPose, saved)` from a tampered snapshot is unnecessary — hosts are live Three objects, not save records. Still freeze: copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz only (live already does this).

**Impact:** Unexpected keys on scratch; not RCE in the current engine.

**Fix (frozen):** Keep live field copies. Never merge save keys into sprites.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 5938–5941, 6073–6077; `hud.js` 709–712.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Freeze-on-busy-pool would be an availability bug, not a crash

**Location:** contract §0.16, §2.

**Issue:** A later “wait until a ripple slot is free” would stall combat when the pool is busy. Contract forbids `speed = 0` and skipping `applyHit`.

**Status:** mitigated in contract.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Fx01RemainingDesign.md`; `out/w110/fx01/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; ripples/marks scene only
- [x] Digit 0/8/9 steal forbidden
- [x] No `WEAPONS` new ids; `state.js` READ-ONLY
- [x] No user shaders / GLSL from save
- [x] Numeric pose copy; no proto-from-save merge
- [x] No UU / SKU
- [x] Fail closed never freeze sim (availability)
- [x] `reducedMotion` mute frozen
- [x] Recoil / mark pool not rewritten
- [x] Settings stay `rimward-settings-v1` (not world)

---

### Recommendations

1. Later PR1: park ripples on the same destroy/load events as marks so a despawned host cannot keep a live sprite.
2. Later PR2 grep: no `WORLD_FIELDS` growth; no `innerHTML` on `combat.js` / `ship.js`.
3. Do not persist ripple `host` uuids.

---

### Re-review

First-person player-host full-size parent was a glass / DoS-adjacent overlay risk (center fill). Frozen as fail-closed world-space / FP-small in contract §0.1, §2, and explicit non-picks. No remaining HIGH.
