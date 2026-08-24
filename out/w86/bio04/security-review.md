## Security Review: BIO-04 psionic weapons design freeze (Wave 86)

### Risk Level: Medium (design-only; residual after freeze)

### Summary

Wave 86 adds no `src/` surface. The freeze covers persist-smuggled psi flags, HUD-granted fire, `grafted` proto tamper, `ctx.emit` type smash, `innerHTML` on WPN names, Unknowables damage via a fake beam, Digit 8/9 desk steal, and a sneaked power/psi ledger. Residual risk is impl-wave discipline (catalog PR order, `?? 'cannon'` close).

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Markdown only. Nested subagents forbidden.

### Findings

#### 🔴 CRITICAL

None remaining.

#### 🟠 HIGH (fixed in freeze)

##### H1: Persist `psiEnabled` / capacitor would be a smuggle flag

**Location:** `hangar.js` 222–240 (unknown keys drop); `save.js` WORLD_FIELDS.  
**Issue:** A new hangar or world key that means “may fire psionics” lets a save blob grant guns on a built non-grafted hull. A psi pool is a second resource (power ledger in disguise).  
**Impact:** Tampered saves bypass living/Abomination restriction; economy/resource invention.  
**Fix applied:** First impl **innate**. Eligibility derived from hangar-healed `hullKind` + own `grafted === true`. No new persist key. No capacitor.

##### H2: HUD or sessionStorage granting fire

**Location:** `hud.js` 71–88 `hudFamily` / `rw-hud-family`; `ctx.js` 20 HUD reads `hullKind` only.  
**Issue:** A HUD write of `hullKind` or a debug family override used as the fire test would let mech skins shoot, or let the HUD mint living.  
**Impact:** Client-side privilege; breaks SHP ownership.  
**Fix applied:** Combat reads `canFirePsionic`. HUD family is **not** the test. Grafted `mech` may fire. Session override must not grant fire. HUD never writes `hullKind`.

##### H3: `grafted` proto / truthy tamper

**Location:** `hangar.js` 82–84 `graftedOwnTrue`.  
**Issue:** `grafted: 1` or inherited proto `true` must not count as Abomination.  
**Impact:** Built hulls fire psionics without the Beautiful hostility graft path.  
**Fix applied:** Reuse live own-key === true. Living / Unknowables still strip the flag.

##### H4: `emit` spread smash / `innerHTML` WPN name

**Location:** `ctx.js` 248–249; `hud.js` 1729–1730 `textContent`.  
**Issue:** `emit('playerFire', player)` overwrites `type` and dumps hull fields. `innerHTML` on a catalog name is XSS if a later SKU name is ever save-sourced.  
**Impact:** Event-graph confusion; HTML injection.  
**Fix applied:** Literal `{ weapon: 'psionic' }`. `textContent` only. No `innerHTML`. No new event.

##### H5: `beam: true` to “hit Unknowables”

**Location:** `state.js` 169–171; `combat.js` 1316–1347, 1499–1500.  
**Issue:** Marking psionic as beam plus a copied mining ray would damage fields the freeze says miss.  
**Impact:** Faction combat law break; mining fork.  
**Fix applied:** `beam` not true. No second Unknowable ray. Projectiles keep skipping fields.

##### H6: Digit 8/9 SKU steal / invented UU

**Location:** `station.js` 1555–1556, 5767–5769; `docs/OwnerDecisionsWave82.md`.  
**Issue:** A bought psionic SKU on Outfitting 8/9 would steal launcher/turret papers and invent a price.  
**Impact:** Desk regression; economy invention.  
**Fix applied:** Innate Digit 5. No SKU. Owner-open any later price. Do not steal 0/8/9.

#### 🟡 MEDIUM

##### M1: Stuffed `npcFire` `{ weapon: 'psionic' }`

**Location:** `combat.js` 1267–1270, 1729–1751.  
**Issue:** `spawnNpcShot` fires any non-missile `WEAPONS` key. A stuffed event would spawn NPC psionics.  
**Why not HIGH:** First impl is player-only; contract requires refuse `family === 'psionic'`. No network; single-player ctx.  
**Fix deferred to PR1:** explicit refuse (named in contract §5).

##### M2: Catalog missing then `w.rof` throw

**Location:** `combat.js` 1763–1766.  
**Issue:** Feature PR before catalog PR throws or energy-tints the bolt.  
**Why not HIGH:** Serial PR0 first; contract null-guards missing row.

#### 🟢 LOW

##### L1: Digit 5 also sets `weaponGroup` while docked

**Location:** later `controls.js` TRACKED.  
**Issue:** Desk Digit 5 still means repair. Both listeners fire. Weapons are cold.  
**Why not HIGH:** No `preventDefault`; combat returns while docked.

### Passed Checks

- [x] No secrets in design files
- [x] No `innerHTML` path
- [x] No new persist key / localStorage weapon key
- [x] Prototype-safe grafted
- [x] HUD does not write `hullKind`
- [x] No power/psi ledger
- [x] `playerFire` literal token
- [x] Unknowables miss default
- [x] UU / ammo / standing not invented
- [x] NPC missile law not reopened

### Recommendations

1. Impl PR1 must close `?? 'cannon'` and refuse NPC psionic even if the event is stuffed.
2. Do not add a persist SKU without a new owner UU line.
