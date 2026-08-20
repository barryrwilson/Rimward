## Code Review: SHP-03 weapons design (Wave 67)

### Summary

The brief matches Wave 64 flatten law, Digit 0 Shipyard, and HUD-02 closed skins. First pass had majors on `state.js` write-sets and restore order. Those are fixed. Remaining notes are minor.

### What's done well

- Inventory cites live `file:line` and calls out stale `save.js` 87–88 writer comment.
- Nested `loadout` stays dead. Three flat keys only.
- Incoming gauge is off with a HUD-01 reason, not a taste note.
- Mass is seat counts; power is explicitly out. Heat stays the shipped pool.
- Serial PR0 is the only `state.js` **write**. PR1–PR5 import.
- Missiles spawn on the reticle, then seek. Turrets do not steer groups 1–2.
- Living + conventional does not flip `hullKind`.
- `playerFire` reuse avoids a fake freeze of a new ctx event.

### Findings

#### 🔴 Blocker: PR1 persist without an id table — **resolved**

**Location:** serial plan  
**Issue (first pass):** PR1 cannot allowlist `dart` if `LAUNCHER_IDS` does not exist yet. A parallel `state.js` edit in PR1 would also break Frozen 2.  
**Fix:** `weapon-fit.js` lands **with PR0**. PR1 imports (read). Unknown ids → `''`. PR3 must not add SKUs to that file.

#### 🔴 Blocker: Restore world vs hangar — **resolved**

**Location:** integrator §6  
**Issue:** Same as security HIGH persist-fork.  
**Fix:** Numbered restore order aligned with `save.js` 387–389 + `sanitizeHangar` + row overwrite.

#### 🟠 Major: Digit 8 Launch steal — **resolved**

**Location:** contract §2.2  
**Fix:** Level-2 outfitting gate only.

#### 🟠 Major: Ammo spend vs `addHeat` pool-miss bug — **resolved**

**Location:** `combat.js` 997–1001 already adds heat when spawn returns null.  
**Issue:** Copying that for ammo would drain a rack into the void.  
**Fix:** Spend ammo (and missile heat) only after spawn. Documented as a named regression.

#### 🟡 Minor: Suggested dart numbers are not playtested

**Location:** integrator §3.1  
**Issue:** 22 dmg / 260 speed / 8 ammo are starting points.  
**Fix:** Catalog PR0 may tune **in code** without a persist-shape change. Do not persist the numbers. **Keep — expected.**

#### 🟡 Minor: Turret sharing the 64-bolt pool vs a sub-cap

**Location:** integrator §4.2  
**Issue:** Two wordings exist: share pool with max 2 live turret bolts.  
**Fix:** Contract + integrator already prefer a **sub-cap of 2**. Impl uses that. **Keep.**

#### 💡 Suggestion: Group 4 fallback

**Location:** integrator §6  
**Issue:** Today `GROUP_WEAPON[x] ?? 'cannon'` would fire cannon on unknown group 4. Spec now says fire as group 1 if rack empty, HUD `4 · —`.  
**Fix:** PR3 must not use the `?? 'cannon'` fallback for group 4. Already specified. **Keep.**

### Flatten / ShpDesign check

| Law | Brief |
|---|---|
| Flat hangar, unknown keys drop | Yes. No nested loadout. |
| Digit 0 Shipyard, 1–9 stay | Yes. Outfitting grows. |
| Confirm papers for expensive new SKUs | Yes. Digit 1–7 one-shots not reopened. |
| HUD-02 Q1–Q3 closed | Yes. No skin checkbox. No `hullKind` write. |
| Remount-on-buy | Not reopened. |
| POD-02 | Not reopened. |
| `state.js` READ-ONLY for feature PRs | PR0 exclusive write. |
| World strings `textContent` | Yes. |

### Re-review (after HIGH/Blocker fixes)

No remaining 🔴/🟠. 🟡/💡 are catalog-tune and impl-watch, not contract holes.

### Verifier pass 2 (three items)

| Item | Severity | Resolution |
|---|---|---|
| `missileAmmo` heal was two rules (trunc vs integer) | MEDIUM | **Resolved.** One `healMissileAmmo` in contract §1.2, §1.3, integrator §6, inventory persist: `Number.isInteger` then clamp `0..catalogMax`, else 0. Empty launcher → 0. Do not trunc. Matches scanner integer class (`hangar.js` 35–37; `save.js` 306–309). |
| Integrator named docked Digit4 as Outfitting | MEDIUM | **Resolved.** Level 1 Digit4 is Feed (`DOCK_KEY_SERVICES` index 3). Outfitting is Digit 6. Digit4 in outfitting level 2 stays Wolfeye Mk II. Digit 0 is Shipyard. Digit 8 on the dock root stays Launch. |
| Inventory `fireHeld` cite `controls.js` 80 | LOW | **Resolved.** Cite is `controls.js` 171–173, 250 and `ctx.js` 80. Line 80 of `controls.js` is the end of the target-cycle helper. |

### Re-review (after verifier fixes)

No remaining 🔴/🟠. The three verifier items above are closed. 🟡/💡 catalog-tune and turret sub-cap stay impl-watch.

### This worker’s tree

Allowed paths only: `docs/Shp03WeaponsDesign.md`, `out/w67/shp03/**`. This worker did not edit `src/`. The workspace may still show other dirty `src/` files from sibling work; they are out of scope.
