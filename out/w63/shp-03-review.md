# Code Review: out/w63/shp-03-loadouts.md

**Mode:** Design-note review (no game-code change).  
**Persona:** reviewer + orchestrator `code-review.md`.  
**Scope:** `out/w63/shp-03-loadouts.md` against wishlist SHP-03, locked HUD/TGT rules, and cited combat/persist code.

## Code Review: SHP-03 loadouts design

### Summary
The note decides first-slice vs later, hull vs world, mount counts, skipped mass/power, missile sketch, living-hull rule, outfitter digits, persist heals, owner defaults, and a serial PR train after SHP-01/02. First slice does not require missiles. Legacy `WORLD_FIELDS` migration is specified. HUD non-goals are honored.

### What's done well

- Cites shipped code instead of inventing families: `WEAPONS`, `MINING_LASERS`, `GROUP_WEAPON`, `WORLD_FIELDS`, `sanitizeRestored`, `DOCK_KEY_SERVICES`, Digit1–7 in outfitting.
- First slice is the minimum that fixes shared `miningLaser` across stored hulls.
- Light `general: 2` + mining provision protects living-starter quality.
- Mass/power explicitly deferred so SHP-01/02 are not blocked.
- Reserved turret/missile **counts** without TGT-04 or HUD lock-box work.
- Outfitter stays put; no mid-list dock service insert.

### Findings

#### 🟡 Minor: Write-through window can desync if a third writer appears

**Location:** `out/w63/shp-03-loadouts.md` §3.2

**Issue:** PR1–PR2 keep `ctx.world.miningLaser` as a mirror. Any new writer that sets only the world key after migrate will look like it worked until the next hull overwrite.

**Fix:** PR2 comment at each remaining world write: outfitter + swap only. Implementation should grep `world.miningLaser` / `world.scanner` / `world.concealedMounts` assignments.

**Status:** accepted as implementer caution. Not a design hole.

#### 🟡 Minor: Cargo contents vs racks split needs SHP-02 to read this

**Location:** §3.1 Q3 / cargoCapacity row

**Issue:** Racks are per-hull; contents stay SHP-02. If SHP-02 stores one global `ctx.cargo` and a small hull is mounted under a large hold, overflow is undefined here.

**Fix:** Default (already implied): SHP-02 clamps or refuses swap when `cargoUsed > incoming cargoCapacity`. This note should not invent a second cargo array.

**Status:** owner default is enough; SHP-02 must not ignore capacity.

#### 💡 Suggestion: `MOUNT_TABLE` general stays 2 even on frigate

**Location:** §4

**Issue:** Wishlist “every conventional weapon family” is deferred via reserved missile/turret counts. If a later non-missile family appears (e.g. a second energy gun), `general` must rise. Call that out in the later-slice PR, not now.

**Status:** acceptable. First slice has only two general families.

#### 💡 Suggestion: `ctx.world.scanner` is not constructed in `ctx.js`

**Location:** `src/core/ctx.js` world init (scanner absent); `station.js:1403` `??= 0`

**Issue:** Migrate must treat `undefined` scanner as 0 the same way station init does. The heal table already maps missing/invalid → 0.

**Status:** covered by sanitize.

### Findings closed during this pass

- Stored hull `v === 1` skipping heal — fixed in §3.3 (`sanitizeLoadout` always).
- `Object.assign` of hangar loadout — forbidden in §9 / regression table.

### Blockers

None for a design-only wave.

- First slice does **not** require missiles or turrets.
- Legacy `WORLD_FIELDS` migration is specified (§3.3) and preserves wave-51 / wave-34 heals.
- HUD glance set / WPN text / no lock box / no HUD-03 / no TGT-04 implementation are explicit.
- No `src/` or `scripts/` edits.

### Verdict

Accept the design note. Implementation must follow PR1 sanitize-every-hull before any hangar persist of `loadout`.
