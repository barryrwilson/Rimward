# Security Review: out/w63/shp-03-loadouts.md

**Mode:** Deep audit of persist / save-trust design (no game-code change).  
**Persona:** security-auditor + orchestrator `security-review.md`.  
**Scope:** `out/w63/shp-03-loadouts.md` plus the sinks it cites (`src/game/save.js`, `src/game/state.js`, `src/systems/station.js`, `src/systems/combat.js`, `src/systems/hud.js`, `src/systems/npc.js`, `src/systems/hail.js`, `src/core/ctx.js`).

## Security Review: SHP-03 loadout persist

### Risk Level: Low (design artifact) / Medium (existing save restore if SHP-03 implements without §8 / §3.3)

### Summary
The note is markdown only. It names the real trust boundary (`rimward-save-v1` hand-edits) and copies the wave-34 / wave-51 heal pattern onto a per-hull loadout. The first draft skipped stored-hull sanitize after `loadout.v === 1`; that gap is closed in the note. No secrets, no network, no new HTML sinks.

### Findings

#### 🟡 MEDIUM: Hangar restore is a new trust boundary SHP-02 can get wrong

**Location:** `out/w63/shp-03-loadouts.md` §3.3, §9; existing `src/game/save.js:359` `Object.assign(ctx.player, snap.player)`

**Issue:** Today `player` is assigned wholesale and only numeric vitals are healed. A hangar array will be the same class of blob. If SHP-02 `Object.assign`s hull records and SHP-03 only heals the mounted ship, a stored `{ v: 1, miningLaser: 99 }` or `{ __proto__: ... }` waits until swap.

**Impact:** Free Deepcore / prototype pollution on swap, not on boot.

**Fix (already in note):** `sanitizeLoadout` on every hangar hull every restore; never `Object.assign` the loadout; `v === 1` skips migrate-copy only.

**Status:** resolved in design. Implementation PR1 must land the helper before hangar persist grows.

#### 🟡 MEDIUM: Save-supplied combat stats

**Location:** `src/game/state.js:145` `applyHit` looks up `WEAPONS[family]`; `src/systems/combat.js` uses `miningLaserFor` + catalog `damage`

**Issue:** A loadout that persisted `damage` / `rof` would become a stat editor. The note forbids those keys and requires catalog lookup.

**Impact:** God-gun via localStorage.

**Fix:** §9.2. Readers must not prefer save numbers over `WEAPONS` / `MINING_LASERS`.

**Status:** specified. No code in this wave.

#### 🟢 LOW: `SAFE_ID` is not an equipment allowlist

**Location:** `src/game/save.js:85` `SAFE_ID = /^[a-z0-9_]+$/i`; `sanitizeFaction` 111–117

**Issue:** `constructor` matches `SAFE_ID`. Equipment must use `Object.hasOwn(catalog, id)`, which the note requires.

**Impact:** Prototype-key seat if someone copies the faction sanitizer.

**Status:** specified in §9.1 / §9.3.

#### 🟢 LOW: World-key mirrors during PR1–PR2

**Location:** `save.js` `WORLD_FIELDS` 65–82; `sanitizeRestored` 246–256

**Issue:** While mirrors exist, a tampered world `miningLaser: 99` could win if heal order is world-then-hull.

**Impact:** Same as today’s world-key cheat unless hull-first overwrite is coded.

**Fix:** §3.2 / §9.5: heal hull, then overwrite world from hull when `loadout.v === 1`.

**Status:** specified.

#### 🟢 LOW: Missile rack in an old save on a newer-then-older build

**Location:** design §6 / §9.4

**Issue:** A later build could persist a launcher id. An older first-slice build must drop it, not crash or keep an unknown object.

**Status:** specified (drop unknown ids).

### Passed Checks

- [x] No secrets, API keys, or tokens in the design note
- [x] No `src/` / `scripts/` edits (no new executable sink)
- [x] Equipment persist is allowlisted; combat stats are not persisted
- [x] Wave-51 `miningLaser` 0..3 and wave-34 `scanner` 0..1..2 heals are kept
- [x] `concealedMounts` stays literal-`true` only
- [x] Prototype keys called out (`constructor` ≠ safe)
- [x] No new `settings.js` / HUD-03 keys
- [x] HUD still `textContent` WPN path; no `innerHTML` instruction
- [x] No insert into `DOCK_KEY_SERVICES` (boot-test digit contract)
- [x] First slice cannot persist a missile rack this build does not know
- [x] Living starter not gated on BIO-02
- [x] `player.loadout` stray key is deleted if present

### Recommendations

1. Land `sanitizeLoadout` in the same PR as the first hangar field write (PR1), not as a follow-up.
2. Keep outfitter as the only purchase writer; combat/HUD read-only toward loadout.
3. When dropping `WORLD_FIELDS` keys (PR3), keep the world heals one release if any reader remains.

### Lifecycle mapping

- 🔴/🟠 = fix before DONE — none on the design artifact after §3.3 clarify.
- 🟡 = specified for implementers; not a design-wave code fix.
- 🟢 = documented.

**review_file:** `out/w63/shp-03-security.md`  
**Severity counts:** critical 0, high 0, medium 2 (specified), low 3 (specified).
