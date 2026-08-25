# Security Review: FX remaining scrape / collision punch brief (Wave 113)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is one later `spawnHitFx` call on the live damaging `bodyHit` applyHit path. No DOM, no new persist key, no Digit, no `state.js` write, no user shaders from save, never freeze the sim on a busy pool. XSS, proto-from-save, persist-world, Digit theft, and freeze-on-busy-pool stay contract-frozen. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (save `WORLD_FIELDS`, settings localStorage, HUD/Digit, canvas textures, event injection). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could load a user material / GLSL string from save

**Location:** live textures are engine canvas (`combat.js` `makeGlowDot` 344–358, `makeRippleRing` 403–419, `makeScorchDot` 384–400); `save.js` `WORLD_FIELDS` 76–101; contract `out/w113/fxscrape/shared-contract.md` §0.4, §0.6.

**Issue:** This wave does not ship JS. A later PR that stored a shader, data-URL, or material JSON on the save blob and assigned it to `sprite.material` would be a script/content injection surface in a WebGL client. Inventory proves PR1 needs **no** persist. Live engine never reads GLSL from `localStorage`. Scrape PR1 must **call** existing maps, not load new ones.

**Impact:** Not live. Prototype would be a new trust boundary.

**Fix (frozen):** No user shaders. Canvas maps stay authored at init. No `world.fx` / scrape key.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `for-in` / `Object.assign` a save pose onto a host mesh

**Location:** live `spawnRipple` copies numeric pose fields (`combat.js` 1079–1081); contract §0.7.

**Issue:** PR1 reuses WAVE111 `worldHitToLocal`. A naive merge from a tampered snapshot is unnecessary — hosts are live Three objects. Still freeze: copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz only.

**Impact:** Unexpected keys on scratch; not RCE in the current engine.

**Fix (frozen):** Keep live field copies. Never merge save keys into sprites. Scrape must not invent a saved contact pose.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Console-injected `bodyHit` can already applyHit; FX must not amplify it

**Location:** live combat loop `combat.js` 1840–1856; `ctx.emit` is local; `out/phy-verify/security-review.md` already notes fake `speed` can one-shot the local player.

**Issue:** A later scrape FX that scaled pool alloc, shader compile, or DOM from `e.speed` / `e.damage` without the live finite/min-speed gate could turn a console poke into a hitch. Damage itself is already a local-client equivalent of editing the running process — not a network issue.

**Impact:** Availability hitch only if later serial allocs per scrape. Contract forbids new pools and per-hit materials.

**Fix (frozen):** Reuse `spawnHitFx`. Honor `IMPACT_MIN_SPEED` / `IMPACT_GAP` already on the loop. Do not trust `e.damage` for spawn size. Do not `eval` event fields.

**Status:** mitigated in contract §0.18–0.19, §0.26.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 6098–6106; hub `hud.js` **726–729**; hull-strike `hud.js` **608–610**.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Freeze-on-busy-pool would be an availability bug, not a crash

**Location:** contract §0.19, §2.

**Issue:** A later “wait until a ripple slot is free” would stall combat when the pool is busy. Contract forbids `speed = 0` and skipping `applyHit`. Skip FX only.

**Status:** mitigated in contract. This is the scrape-specific availability freeze.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Fx01RemainingScrapeDesign.md`; `out/w113/fxscrape/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM; live `el()` is `createElement` + `textContent` (`hud.js` **261–266**)
- [x] Hull-strike consume bound to live `'▲ Hull strike.'` (`hud.js` **608–610**), not `worldEvent` 591–593
- [x] No new `WORLD_FIELDS` key; ripples/marks scene only
- [x] Digit 0/8/9 steal forbidden
- [x] No `WEAPONS` new ids; `state.js` READ-ONLY
- [x] No user shaders / GLSL from save
- [x] Numeric pose copy; no proto-from-save merge
- [x] No UU / SKU
- [x] Fail closed never freeze sim (availability)
- [x] Busy pool skips FX; damage still applies
- [x] `reducedMotion` mute frozen
- [x] Recoil / mark pool / WAVE111 parent not rewritten
- [x] IMPACT knobs not retuned as leftover
- [x] No persist of scrape FX
- [x] No Digit bind

### Recommendations

1. Keep fail-closed skip-FX. Do not wait on a free slot.
2. Keep canvas atlases engine-authored at init.
3. Do not serialize `host` pointers or ripple slots.
4. Do not index `e.kind` into `WEAPONS` or materials.
