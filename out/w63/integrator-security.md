# Security Review: `docs/ShpDesign.md` (Wave 63 SHP integrator)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Deep audit of persist / dock / identity / buy-price boundaries (design-only markdown; no runtime, no auth, no payments).  
**Scope:** `docs/ShpDesign.md` vs merge law `out/w63/shared-contract.md` and sibling notes. No `src/` edits in this wave.  
**Designer pass:** skipped (orchestrator instruction).

### Risk Level: Low

### Summary

The brief is a client persist + dock-desk contract. It does not add network, auth, or settings keys. World-string XSS, hangar allowlists, leftover `hullKind` after `freshStart`, nested-`loadout` drop, catalog price trust, and save-authored cruise are named and fail-closed. No CRITICAL or HIGH remain in the markdown. SHP sanitize is still open on implementation.

## Security Audit: SHP integrator brief

### Findings

#### 🟠 HIGH: World-string XSS if the yard desk uses `innerHTML`

**Location:** future `station.js` desk; today `h()` 1450–1454 uses `textContent`  
**Issue:** Hull names, `shipName`, faction names, catalog lines, and notices are world/save strings.  
**Impact:** Script in the shipyard list or dock notice.  
**Fix:** Brief law: `textContent` / `Text` nodes only. Overlay wipe via `overlay.textContent = ''` stays a wipe.  
**Status:** resolved in the brief. Implementers must not regress `h()`.

#### 🟡 MEDIUM: `hullKind` and hangar persist without an allowlist today

**Location:** `save.js` wholesale player 170 / 359; `sanitizeRestored` vitals-only 232–241  
**Issue:** Extra player keys keep. A HUD or desk write of `hullKind: 'built'` already forces `mech`. `freshStart` assign does not drop leftover keys.  
**Impact:** Unsanitized family switch; leftover purchased identity after a no-save death.  
**Fix:** Brief: HUD never writes. Hangar is `WORLD_FIELDS`. Allowlist `living`|`built`; delete else. Unknowables force `'living'` on every numbered path. `freshStart` rebuilds one living starter.  
**Status:** resolved in the brief. Open on SHP save code (not this wave).

#### 🟡 MEDIUM: Nested `loadout` would be stripped — or would skip sanitize

**Location:** SHP-03 sibling vs contract §1.2  
**Issue:** A child `loadout` is an unknown key. Contract drop-unknown-keys strips it. If implementers special-case the nest and `Object.assign` it, prototype keys and `damage: 999` ride in.  
**Impact:** Equipment never sticks, or combat stats smuggle.  
**Fix:** Brief flattens `scanner` / `miningLaser` / `concealedMounts` onto the row. Same heals as world. No nest.  
**Status:** resolved (integrator freeze). Verifier MEDIUM on SHP-03.

#### 🟡 MEDIUM: Trusting save-authored price / class / cruise

**Location:** buy path; remount `ctx.config.ship`  
**Issue:** Blob `price` / `bookValue` / hangar `maxSpeed` would grant free capitals or god-speed. Class-only remount would leave a heavy on 120/30.  
**Impact:** Local privilege / integrity.  
**Fix:** Catalog is code. Envelope from authored `SHIP_CLASSES`. Do not persist `config.ship`.  
**Status:** resolved in the brief.

#### 🟢 LOW: Prototype keys on hangar / player extras

**Location:** `Object.assign(ctx.player, snap.player)`  
**Issue:** Raw slot assign can copy `constructor` onto the live player.  
**Fix:** Fresh literals. Never `Object.assign(target, rawSlot)`.  
**Status:** resolved in the brief. Open as an implementation pin.

#### 🟢 LOW: New `localStorage` hangar key vs `clearAutosave`

**Location:** `save.js` 200–206  
**Issue:** A side-channel hangar key would survive New Game or vanish from berths.  
**Fix:** Hangar rides `{v:1}` via `WORLD_FIELDS` only.  
**Status:** resolved in the brief.

### Passed Checks

- [x] No secrets, API keys, or tokens in the brief
- [x] No new admin / privileged client path
- [x] No `innerHTML` of world strings directed
- [x] No HUD family persist key / no `settings.js` skin checkbox
- [x] HUD forbidden from writing `hullKind`
- [x] Unknowables cannot sanitize to `'built'`
- [x] Scanner / miningLaser / concealedMounts keep existing allowlists
- [x] Cargo uses existing `sanitizeCargoList`
- [x] Digit-0 service is append-only (no stolen Launch/Standing keys)
- [x] MATCH remount does not write `input.throttle`
- [x] Remount must not persist or blob-copy `ctx.config.ship`
- [x] Buy adds a row (no remount-on-buy trade)
- [x] N/A: API auth, SQL, crypto, wallets, CORS, server sessions

### Recommendations

1. Implementation: pin restore of `hullKind: 'nope'` → key deleted → `hudFamily` `bio`.
2. Implementation: pin Unknowables row cannot remain `'built'`.
3. Implementation: pin buy ignores blob `price` / `bookValue`; mounted id unchanged.
4. Implementation: pin remount of `heavy` / `freighter` retunes `ctx.config.ship` from authored class, not the blob.
5. Implementation: `sessionHudFamilyOverride` stays session-only; never copy onto hangar.
6. Implementation: pin `Digit0` → `shipyard` separately from `N - 1`.
