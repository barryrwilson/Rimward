## Code Review: BIO-02 design freeze (Wave 86)

### Summary

Design-only. Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Inventory and contract were re-read against `hangar.js` `switchTo` / `already-mounted`, `applyFlightEnvelope`, `bio.js` growth, `LIVING_STOCK`, and Digit 0. Blockers in the first pass (same-id `switchTo`, Digit 3 steal, invented UU, career keys) are closed in merge law.

### What's done well

- Growth vs training is a hard split; `bio.js` stays the only `ctx.bio` writer.
- Envelope reuses Wave 64 `applyFlightEnvelope` (`burn / cruise`).
- Ladder uses live `LIVING_STOCK` / `SHIP_CLASSES` instead of new keys.
- Hangar-pane papers matches graft (no `DOCK_KEY_SERVICES` insert).
- Frigate fail-closed named as SKU-sneak, not forgotten.
- `state.js` READ-ONLY; later catalog PR is explicit.

### Findings

#### 🔴 Blocker (fixed in freeze)

##### B1: `switchTo(mountedId)` cannot remount in place

**Location:** `hangar.js` 692, 697–718. Brief first sketch said “call switchTo.”  
**Issue:** Same id returns `{ ok: false, reason: 'already-mounted' }`. A later worker who followed that sentence would no-op after debit or would unmount to a dummy hull.  
**Fix applied:** Contract §0.8 / §5. Mutate row → `applyFlightEnvelope` + `applyMountedFlight` / `callRemount`. `switchTo` remains the **other-row** swap.

##### B2: Digit 3 Train tab steals hull digits

**Location:** `shipyard-desk.js` 104–113, 284–298. Hull index `n - 3`.  
**Issue:** A third tab on Digit 3 makes Hangar mount Digit 3 ambiguous and banner-dependent.  
**Fix applied:** Train is a Hangar **offer row**, like graft. Digit 1/2 unchanged.

##### B3: Invented career keys / train UU

**Location:** wishlist 1073–1076; Wave 82 “Do not invent further UU.”  
**Issue:** First impl that added `support` or `TRAIN_LIST_UU = 15000` would fight READ-ONLY catalog and owner law.  
**Fix applied:** Career forms **out**. UU owner-open. Dest `heavy` only.

##### B4: Envelope `multiplier = burn`

**Location:** `hangar.js` 561. Wave 70 already warned.  
**Issue:** Copy-paste of burn onto multiplier makes light 240×.  
**Fix applied:** Contract §1 restates live write. Serial PR3 must call the helper, not re-author the map.

#### 🟠 Major (fixed in freeze)

##### M1: Living remount ignores `classKey`

**Location:** `ship.js` 526–528 `buildLivingVisual()`.  
**Issue:** Reviewers could treat “evolve to heavy” as a mesh swap and block on BIO-03 GLBs.  
**Fix applied:** Brief §3 / contract §1. First impl is envelope + vitals + seats. CPU manta stays.

##### M2: `cargoCapacity` reset to 20 on sanitize-from-scratch

**Location:** `healCargoCapacity` min 20; outfitter upgrades (`station.js` 185–187).  
**Issue:** `buildStockRow` uses 20. A train that rebuilt the row like a buy would dump upgraded hold size and then trim cargo.  
**Fix applied:** Keep hangar `cargoCapacity` and `cargo`. Trim only if over cap.

##### M3: `healLauncher` with stale classKey

**Location:** `weapon-fit.js` 57–61 unknown key → **light** (0 missile seats).  
**Issue:** Healing **before** writing `classKey = 'heavy'` would strip a future heavy rack; healing with a typo key would use light.  
**Fix applied:** Contract §5 steps 3–4: mutate key, then heal with the **new** key. Light/cutter → heavy gains seats; empty stays empty.

##### M4: Unknowables living light at a Bloom

**Location:** force living `hangar.js` 86–90; no Unknowables station `station.js` 533.  
**Issue:** Ambiguous if origin-Unknowables docked at Beautiful could train to heavy.  
**Fix applied:** Refuse Unknowables faction rows/player. Beautiful-dock-only. No invented dock.

#### 🟡 Minor

##### m1: Success copy vs `SHIP_CLASSES.heavy.role` (`combat`)

Do not show “combat” as a career unlock. Copy uses the key `heavy`. Documented in §7.3.

##### m2: PR4 debit blocked

PR1–PR3 could land a dead button. Contract §11 allows wait or hard `credits` refuse without mutate. Impl should pick **wait** unless the owner confirms UU in the same wave.

#### 💡 Suggestion

- Later: extract `evolveMountedClass(ctx, dest)` next to `graftMounted` so desk stays THREE-free and snap/restore is shared with `switchTo`.
- Do not export a parallel envelope map from `shipyard.js`.

### Residual after freeze

None at Blocker/Major. Owner UU remains a **gate**, not a code defect.

---

## Recheck (designer majors, Wave 86 patch)

Checklist re-applied. Merge law now splits **mutate** (§4.1) from **paint** (§4.2). That was the contract-vs-copy fight.

### 🔴 Blocker

None.

### 🟠 Major (closed in this patch)

##### R1: One hangar matrix

**Location:** `shared-contract.md` §4.2; `docs/Bio02EvolutionDesign.md` merge table.  
**Issue:** “Visible only when all gates hold” hid hostile / short-credits copy.  
**Fix applied:** Hostile = note `No sale.` no button. Short credits = keep Offer. Do not copy `graftOfferVisible` rep early-return.

##### R2: `trainPending` station sites

**Location:** contract §7.2 table.  
**Issue:** Esc-only cancel.  
**Fix applied:** Named `ui.trainPending`, `cancelTrainPending` on Esc 5723, fallthrough, Back, `selectService`, dock, undock, leave Hangar; confirm `mountedId` + `redraw()`.

### 🟡 Minor (closed)

Layout after `hulls.forEach`; hop name; Beautiful legend; first-match refuse priority.

### Residual after recheck

None at Blocker/Major. PR2 must follow §4.2 / §7.2 or the majors return.
