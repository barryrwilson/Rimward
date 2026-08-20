## Security Review: SHP-03 weapons design (Wave 67)

### Risk Level: Medium (after fixes). Design-only. No live persist/UI shipped.

### Summary

The proposed persist/UI is a local-save game with XSS and tamper as the real threats. First pass flagged HIGH persist-fork and Digit-8 Launch steal. Those are now frozen in the contract. No CRITICAL remains in the markdown.

### Findings

#### 🔴 CRITICAL

None after re-review.

#### 🟠 HIGH: World blob could grant a dart the hangar row does not have — **resolved**

**Location:** `docs/Shp03WeaponsDesign.md` §6; `out/w67/shp03/shared-contract.md` §1.3  
**Issue (first pass):** `WORLD_FIELDS` would copy `world.launcher` before hangar sanitize. A crafted blob could keep `launcher: 'dart'` on a starter or light after restore, the same class as unsanitized `hullKind: 'built'`.  
**Impact:** Free rack / ammo without a seated hull.  
**Fix applied:** Numbered restore order: copy fields → sanitize hangar → overwrite world from **mounted row**. Missing hangar forces `''` / `0` / `''`. `spendMissileAmmo` writes row and world together.

#### 🟠 HIGH: Outfitting Digit 8/9 bound on the dock root would steal Launch / Standing — **resolved**

**Location:** `station.js` 2406–2454; contract §2.2; integrator §8  
**Issue (first pass):** Digit 8 on level 1 is Launch. Digit 9 is Standing. A global Digit8 buy handler would undock-steal or sell a rack from the dock list.  
**Impact:** Boot-test Digit collisions; accidental debit; lost Launch key.  
**Fix applied:** Gate `ui.level === 2 && ui.service === 'outfitting'` only. Explicit fail-closed note.

#### 🟠 HIGH: Ammo decrement on world only, then desk reads the row — **resolved**

**Location:** `save.js` 180–181 parks on snapshot, but swap/desk can read the row first.  
**Issue:** Combat that writes only `ctx.world.missileAmmo` leaves the hangar row stale until park.  
**Fix applied:** `spendMissileAmmo` dual-write. Spend only after a successful spawn.

#### 🟡 MEDIUM: Two `missileAmmo` heals (trunc vs integer) — **resolved (verifier)**

**Location:** contract §1.2 vs §1.3 (first pass)  
**Issue:** Finite trunc+clamp would admit `'2'` coerced or `2.9`→2. Live scanner uses integer membership (`hangar.js` 35–37; `save.js` 306–309).  
**Fix applied:** One `healMissileAmmo` law in §1.2, §1.3, integrator §6, and inventory persist: integer clamp `0..catalogMax`, else 0. Empty launcher → 0. Do not trunc.

#### 🟡 MEDIUM: Catalog names in dock copy

**Location:** planned `station.js` `h()` path (`station.js` `h()` already uses `textContent`).  
**Issue:** A future `innerHTML` of `LAUNCHER_IDS.dart.line` would XSS.  
**Impact:** Saved/authored strings in DOM.  
**Fix:** Contract §0.7 and integrator §8 already require `textContent`. Residual: impl wave must not “upgrade” `h()`. **Keep as watch item, not a design hole.**

#### 🟡 MEDIUM: `SAFE_ID` is not a catalog check

**Location:** `save.js` 95; contract §7  
**Issue:** `constructor` matches `/^[a-z0-9_]+$/i`.  
**Fix:** `Object.hasOwn` on authored tables + reserved-id set + `ID_MAX`. Already in contract. **Keep.**

#### 🟢 LOW: Session weapon debug

**Issue:** HUD already has `sessionStorage['rw-hud-family']` (`hud.js` 76–81). A missile debug key could leak into hangar.  
**Fix:** Contract forbids persist of session weapon debug. **Keep.**

#### 🟢 LOW: Hail Digit4 overlap

**Location:** `hail.js` 403–404  
**Issue:** Group 4 uses Digit4 in flight. Hail already overlaps Digit1–3.  
**Fix:** Accept as known. Do not change hail. **Keep.**

### Passed Checks

- [x] No secrets in this design (no keys, no tokens)
- [x] No new `localStorage` channel
- [x] Allowlist + drop unknown hangar keys (Wave 64 pattern)
- [x] Price from authored catalog, not blob
- [x] Confirm-before-debit for new SKUs
- [x] XSS: `textContent` law
- [x] Prototype keys dropped
- [x] Integer ammo (`'2'` → 0), same class as scanner
- [x] Class gate on sanitize **and** outfitter **and** fire
- [x] No incoming gauge (does not add a DOM sink for attacker strings on the aim glass)
- [x] This worker did not edit `src/`

### Recommendations

1. Impl PR1 must land the numbered restore order, not “heal world keys in place then maybe hangar.”
2. Impl PR3 must extend the existing outfitting `else if` (`station.js` 2448), not a new window listener.
3. Do not reuse `addHeat` after a null spawn for ammo.

### Re-review (after HIGH fixes)

HIGH persist-fork, Digit-8 steal, and ammo dual-write are written into merge law. No remaining 🔴/🟠 in the markdown. Residual 🟡/🟢 are impl-watch items with one-line justifications above.

### Re-review (verifier pass 2)

`healMissileAmmo` is one integer law in contract §1.2 and §1.3. Digit 8/9 still gated to outfitting level 2 (Launch not stolen). No new XSS or persist channel. Open: catalog `textContent` watch; `SAFE_ID` vs `Object.hasOwn`.
