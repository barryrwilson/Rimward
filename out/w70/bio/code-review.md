## Code Review: BIO living ships design (Wave 70)

### Summary

The brief matches live hangar / ship / shipyard / bio / HUD code. First-pass holes (origin as the only obtain path, growth-center gating cannon, living frigate drive-by, psionic triad, hostility only on purchase, BIO-03 claiming meshes, envelope `burn` assigned as multiplier) are closed. Remaining notes are implementation cautions, not design blockers. Self-applied; no separate designer agent.

### What's done well

- Inventory cites `file:line` and states code wins, including stale `organic.js` header vs GPU swim.
- Living starter preserve is explicit and matches Wave 64 remount (`makeLivingHull` rebuild, Unknowables force, boot `buildLivingVisual`).
- Obtain freeze uses live yards (`LIVING_STOCK`, `YARD_LIST_UU`) instead of inventing a seed SKU or `COMMODITIES` row.
- Growth vs `switchTo`: envelope copy is already shipped; class evolution reuses it; `bio.growth` stays visual.
- BIO-04 is a named non-goal without a fake weapon table.
- Living frigate omit is a BIO decision, not a Wave 67 leftover copy.
- HUD-02 stays closed; Abomination remains `mech`.
- `state.js` READ-ONLY; serial PRs put persist+warning before art.
- Hostility uses live `HOSTILE_STANDING` −10; warning is two-step `textContent`.

### Findings

#### 🔴 Blocker (resolved): Hostility as purchase-only

**Location:** wishlist BIO-05 owning/flying; first draft §7.5  
**Issue:** Restore tamper of `grafted: true` would skip Beautiful enemy standing.  
**Fix applied:** Ownership invariant on sanitize/restore/remount/confirm. Security review HIGH closed.

#### 🔴 Blocker (resolved): Growth-center required for starter cannon

**Location:** wishlist BIO-02; SHP-03 already “do not require BIO-02 growth-center”  
**Issue:** A later worker could refuse Digit 1 until a Beautiful desk visit.  
**Fix applied:** Contract §1.3 / §4.6; brief goals; SHP-03 cited.

#### 🔴 Blocker (resolved): Invented psionic triad / living frigate SKU

**Location:** BIO-04; Wave 67 `CORE_STOCK` frigate leftover  
**Issue:** Design-only wave could still author `WEAPONS.psi` or append frigate to `LIVING_STOCK`.  
**Fix applied:** BIO-04 out; frigate buy **keep omit**; `state.js` READ-ONLY.

#### 🟠 Major (resolved): Inventory mapped `burn` → `afterburner.multiplier`

**Location:** inventory §2 (first draft); live `hangar.js` 477  
**Issue:** `applyFlightEnvelope` sets `multiplier = cls.burn / cls.cruise` (light 240/120 = 2). A later PR that copies `burn→multiplier` would make afterburner 240× cruise.  
**Fix applied:** Inventory cites the live formula. Contract §4.2 and brief §4 require a **call** to `applyFlightEnvelope`, not a rewritten map. Verifier pin 11.

#### 🟠 Major (resolved): Nested seed loadout / `livingRock` as hull

**Location:** SHP flatten law; `COMMODITIES.livingRock` food  
**Issue:** A seed object on the hangar row or a common ore hatching a ship would fight persist heal and mining.  
**Fix applied:** Hangar row only; `livingRock` remains food; commodity path deferred.

#### 🟠 Major (resolved): BIO-03 pretends Wave 70 ships meshes

**Location:** `public/assets/ships/beautiful/` already has six classes  
**Issue:** Easy to “land” a shader in the design wave or claim GLBs as this brief’s delivery.  
**Fix applied:** Contract §5 / §0.9; brief §5; verifier pin 8.

#### 🟠 Major (resolved): Abomination remounts `makeLivingHull`

**Location:** `meshKindFor` living unless `hullKind === 'built'`  
**Issue:** Writing `hullKind: 'living'` to mean tissue would steal the benchmark mesh and flip HUD to bio.  
**Fix applied:** Abomination stays `built` + `grafted`; living remount forbidden; HUD mech.

#### 🟡 Minor: `flesh.scale` growth already runs on plated remounts

**Location:** inventory §1; `ship.js` 978–986  
**Issue:** An Abomination (plated) would still pulse with `bio.growth`. That is live, not a BIO invention. It may even help “tissue” read.  
**Fix:** none in Wave 70. Implementation must not disable living starter growth to “fix” plated scale.

#### 🟡 Minor: Default reputation bag lacks `beautiful`

**Location:** `ctx.js` 128  
**Issue:** `standingOf` treats missing as 0. Graft must create the key.  
**Fix:** Contract §7.5 already. PR3 pin create-key + cap.

#### 🟡 Minor: PR1 allowlists `grafted` before PR3 hostility

**Location:** contract §12  
**Issue:** A mid-wave save with `grafted: true` after PR1 and before PR3 would not yet cap standing. Serial windows are expected.  
**Fix:** PR3 must land the invariant before graft UI is player-reachable. PR1 must not expose a Gilded graft button.

#### 💡 Suggestion: Gift reserved id `hull_seed_gift`

**Location:** contract §3.3  
**Issue:** `SAFE_ID` allows it. `nextHullId` uses `hull_${classKey}_${i}` and will not collide unless a yard stem is `seed`.  
**Fix:** none required. If gift lands, keep the reserved id in sanitize as optional skip, not a second persist key.

### Alignment check (brief vs inventory vs contract)

| Freeze | Inventory | Contract | Brief |
|---|---|---|---|
| Wave 70 no src | — | §0.1 | header / non-goals |
| Living starter | ship.js boot + remount | §1 | §2 |
| Origin ≠ second hull | origins + ORIGINS.beautiful | §3.1 | §3.1 |
| Yards living stock | shipyard.js 26–39 | §3.2 / §8 | §3.1 / §8 |
| Frigate omit | LIVING_STOCK no frigate | §8 | §8 |
| Growth visual only | bio.js + flesh.scale | §4.1 | §4 |
| Envelope on class swap | hangar `multiplier = burn / cruise` (`hangar.js` 477) | §4.2 call live fn | §4 / current-state table |
| No growth-center for cannon | SHP-03 + live groups | §4.6 | goals |
| BIO-03 later art | GLB + GPU swim | §5 | §5 |
| BIO-04 out | no WEAPONS row | §6 | §6 |
| Abomination built+grafted | field absent today | §7.1 | §7 |
| Warning + −10 invariant | HOSTILE_STANDING −10 | §7.4–7.5 | §7 |
| HUD never writes kind | hud.js 67–75 | §9 | §9 |
| Hangar rows, no loadout | sanitizeHangarRecord | §0.4 | §9 |
| state.js RO | header comment | §11 | §10 |

No remaining contradiction. Contract wins if a later edit drifts.

### Test coverage (later impl)

Not this wave. Implementation pins belong in `scripts/boot-test.mjs` / probes: starter swim flags, Beautiful buy no remount, graft warning before debit, restore grafted → standing ≤ −10, Unknowables drop grafted, HUD does not write `hullKind`, `listYardOffers` beautiful has no frigate.
