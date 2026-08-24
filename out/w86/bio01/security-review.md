## Security Review: Wave 86 BIO-01 obtain design

### Risk Level: Medium (design-only; later impl writes hangar persist)

### Summary

This wave is markdown. The contract freezes hangar-row persist, proto-safe ids, `textContent` only, helper-side rank/cap gates, no new `localStorage` key, and a ban on invented drop % / UU. First-pass holes (UI-only gift, cargo SKU, emit-spread of hangar, evict-on-full, innerHTML copy) are closed in merge law. Remaining notes are implementation cautions.

### Findings

#### 🟠 HIGH: Gift/pirate must not trust desk visibility

**Location:** later `station.js` People render vs grant helper (contract §2.1, §7.4)

**Issue:** A hidden button is not an authorization check. A later worker could arm confirm from a crafted `ui` bag or skip `rep >= 50`.

**Impact:** Free living hull without Sworn; or grant at a non-Beautiful dock.

**Fix applied in design:** Helper re-checks dock, banner, `rep >= 50`, once-id, and cap on confirm. UI hide is not a gate. Contract §2.1.

#### 🟠 HIGH: Persist prototype / `__proto__` hull ids

**Location:** `hangar.js` 28–32, 163–167; `save.js` 104–113

**Issue:** `SAFE_ID` matches `__proto__`. A pirate `nextHullId` that took unsanitized classKey, or a smuggled gift id, could become a proto key if someone later used `for…in` or object-index maps.

**Impact:** Prototype pollution on hangar maps keyed by id.

**Fix applied in design:** Gift id is a source literal `hull_seed_gift`. Pirate ids use `nextHullId` after `^[a-z0-9_]+$` stem + `sanitizeHangarRecord` / `isSafeHullId`. Null / reserved → fail closed. Contract §1.5.

#### 🟠 HIGH: Invented economy numbers

**Location:** pirate drop %; commodity UU

**Issue:** A design brief that authors 5% or a seed price would fight Wave 82 owner law and can ship unbalanced persist.

**Impact:** Unauthorized economy; later src copies the invented number.

**Fix applied in design:** Contract forbids inventing drop % / UU / standing deltas. Pirate rate is owner-open pointing at `docs/OwnerDecisionsWave82.md`. Commodity deferred (no live SKU). Gift price 0 is already frozen. Live yard/graft UU cited only.

#### 🟡 MEDIUM: `ctx.emit` spread smash

**Location:** `ctx.js` 248–249

**Issue:** `emit(type, data)` spreads `data`. Emitting the hangar object would smash `type` and leak hull arrays.

**Fix applied in design:** `commLine` fresh `{ text, from }` only. Never `{ ...hangar }`. Contract §3.3, §7.3.

#### 🟡 MEDIUM: Living gift smuggled as `grafted`

**Location:** `hangar.js` 93–98

**Issue:** A save blob could set `grafted: true` on `hull_seed_gift` to force Beautiful −10 without Gilded confirm.

**Fix applied in design:** Rows go through `sanitizeHangarRecord` + `applyGraftedAllowlist`. Living deletes `grafted`. Grant helper starts living. Contract §1.2.

#### 🟡 MEDIUM: Hangar-full eviction as “security” of last resort

**Location:** `hangar.js` 322–331 `capHulls`

**Issue:** Using restore overflow logic to make room would delete player hulls (integrity / grief).

**Fix applied in design:** Grant refuses `'full'`. Must not call `capHulls` to grant. Contract §1.4.

#### 🟢 LOW: `Math.random` for pirate roll

**Location:** live precedent `data-trade.js` 181–183

**Issue:** Client RNG is predictable. This is a single-player local sim, same as data cubes.

**Fix:** Match live spill RNG. Not a network-trust boundary. No crypto required.

#### 🟢 LOW: `commLine` text

**Location:** contract §2.2 / §3.3 static strings

**Issue:** If a later worker interpolates NPC `name` into innerHTML, XSS.

**Fix applied:** Static Echo lines; `textContent` / `h()`. Names that appear on People cards already use `textContent` (`station.js` 4230–4233).

### Passed Checks

- [x] No secrets in this markdown
- [x] No new `localStorage` key (ride `rimward-save-v1` hangar)
- [x] No `innerHTML` in freeze
- [x] Prototype ids fail closed
- [x] Rank/cap in helper, not CSS only
- [x] No invented drop % / UU / standing delta
- [x] No path join / remote URL / `eval` for obtain
- [x] HUD never writes `hullKind`
- [x] `state.js` READ-ONLY this wave
- [x] No sibling-doc edits required to ship this freeze

### Recommendations

1. Later PR1: pin proto id, full hangar, living-drops-grafted before any desk lands.
2. Later PR3: if Wave 82 rate is still labeled defer, skip the roll; do not invent 0.05 in src comments as if it were live.
3. Keep pirate out of `spawnPod` so save sanitize cannot treat a seed as cargo.

### Method

Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` (deep audit: persist + economy + XSS). HIGH items resolved in contract/brief before DONE.
