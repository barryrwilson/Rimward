## Security Review: BIO living ships design (Wave 70)

### Risk Level: Medium

### Summary

Wave 70 is markdown only. The threat model is a local browser game: save tamper, prototype keys, XSS through world strings, skipped faction hostility, and silent sale of living tissue. First-pass HIGH holes (hostility only on purchase; HUD/kind smuggle; innerHTML) are closed in the contract. Re-dispatch: envelope `burn` mapping is a sim-correctness issue, not a new trust-boundary hole. Remaining notes are implementation cautions.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Abomination hostility only on purchase

**Location:** contract §7.5 (first draft); wishlist BIO-05 “owning/flying”  
**Issue:** A hand-edited `hangar.hulls[].grafted: true` would restore tissue without writing `reputation.beautiful`. Patrols would not hunt. The warning on the Gilded desk would not apply to tamper.  
**Impact:** Player owns an Abomination with Beautiful still at 0 (Stranger / no hunt).  
**Fix applied:** Ownership invariant — while any hangar row is grafted, cap Beautiful at live `HOSTILE_STANDING` (−10) on sanitize, restore, remount, and confirm. Tamper cannot skip it. Strip later does not auto-heal.

#### 🟠 HIGH (resolved): Graft without warning

**Location:** wishlist regression “irreversible faction hostility without warning”  
**Issue:** One-click Digit buy (like a naive Digit3 papers debit) would flip standing to enemy with no copy.  
**Impact:** Career lockout vs Beautiful yards/patrols with no informed consent.  
**Fix applied:** Two-step pending + `textContent` warning, same family as Confirm papers / Gilded transfer. Esc cancels. No debit until confirm. Hotkey must arm pending, not confirm.

#### 🟠 HIGH (resolved): `hullKind` / `grafted` smuggle via HUD or blob

**Location:** `save.js` wholesale `player`; HUD-02 history  
**Issue:** Extra player keys persist. HUD writing `hullKind: 'built'` already forced mech before Wave 64 heal. A BIO HUD write of `grafted` would be worse. Nested `loadout` was rejected in SHP. Unknown commodities already ride `sanitizeCargoRow` without a `COMMODITIES` check — a fake seed string would persist.  
**Impact:** Family flip, fake seeds, proto ids.  
**Fix applied:** HUD never writes `hullKind` or `grafted`. `grafted` is `own() === true` only. Living and Unknowables drop `grafted`. Seeds are hangar rows, not cargo. `RESERVED_IDS` on hull ids. No nested loadout. No `COMMODITIES` seed in a feature PR.

#### 🟡 MEDIUM: Graft price unspecified → free tissue until owner sets UU

**Location:** contract §7.7  
**Issue:** Design forbids inventing a price. A worker might debit 0 and still apply hostility (cost is political) **or** pick `HIDDEN_MOUNTS.cost` 900.  
**Impact:** Economy skip, or a silent wrong constant.  
**Fix:** First impl must not guess UU. Hostility still applies. Named data owner authors a constant next to `YARD_LIST_UU` before any debit. Documented as proposed, needs owner.

#### 🟡 MEDIUM: Reputation bag `for…in` copy

**Location:** `world.js` 1093 already `for (const f in ctx.world.reputation)`  
**Issue:** New BIO writes that merge a blob into reputation could promote `__proto__`. Default bag lacks `beautiful`; creating the key is required.  
**Impact:** Prototype pollution on a hostile write.  
**Fix applied:** Direct assign `reputation.beautiful` only after the key is a real `FACTIONS` id. Do not copy enumerables from save into reputation in BIO code. Do not copy `world.js` `for…in` in new BIO.

#### 🟡 MEDIUM: World string XSS

**Location:** station / shipyard-desk live `h()` + `textContent`; `modelsbrowser.js` still uses `innerHTML`  
**Issue:** Graft warning, gift lines, and comm must not use `innerHTML`. Faction names from `FACTIONS` are authored; row `name` is already `stripControlChars`.  
**Fix applied:** Contract §10 / §0.12: `textContent` only. BIO does not touch models-browser.

#### 🟢 LOW: Wrong envelope map would not smuggle persist, but would break flight

**Location:** inventory §2 (fixed); `hangar.js` 477  
**Issue:** Assigning `afterburner.multiplier = cls.burn` is not XSS or persist tamper. It would make a living class-evolution remount 240× cruise.  
**Fix applied:** Design now cites `burn / cruise`. Later PRs must call `applyFlightEnvelope`. No new persist field.

#### 🟢 LOW: `livingRock` confused with a ship seed

**Location:** `COMMODITIES.livingRock` base 600; origin cargo  
**Issue:** Overloading food as a seed would make a common ore hatch a hull.  
**Fix applied:** Contract forbids using `livingRock` as a seed. Seeds are hangar rows.

#### 🟢 LOW: GPU swim `Math.random()` phase

**Location:** `ship-assets.js` 397–398  
**Issue:** Not a security issue. Noted so BIO-03 does not copy unseeded RNG into persist.  
**Fix:** none in Wave 70. Visual serial uses seeded RNG if pose must be stable.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key
- [x] No `innerHTML` for BIO UI
- [x] Proto ids reserved on hangar rows (live) and required on new fields
- [x] HUD does not write `hullKind`
- [x] Abomination warning frozen
- [x] Hostility uses a live constant (−10), not an invented Marked dump
- [x] Sale of living tissue is Gilded-only, two-step, fail-closed
- [x] `state.js` READ-ONLY (no silent `WEAPONS` insert)
- [x] Ownership invariant closes restore tamper vs hostility
- [x] Wave 70 does not ship `src/`

### Recommendations

1. Implementation PR3: pin restore of `{ grafted: true }` → `reputation.beautiful <= -10` without a Gilded visit.
2. Implementation: pin cancel graft leaves standing and `grafted` unchanged.
3. Do not debit a guessed graft price.
4. Keep player living remount off the Abomination path (identity + exploit of “tissue as living” to steal bio HUD / swim).
