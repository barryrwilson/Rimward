## Code Review: docs/Bio01ObtainDesign.md + out/w86/bio01 merge law

### Summary

The brief matches live obtain surfaces after Wave 72 grafts and Wave 64 hangar: cap 8, `LIVING_STOCK` light/cutter/heavy, Unknowables living light, Digit 0 shipyard, `RANK_LADDER` Sworn 50, hangar sanitize, HUD read-only `hullKind`, `isBeautiful` faction-only. Gift honors `hull_seed_gift` / Sworn ≥ 50. Pirate is persist + fail-closed without an invented percent. Commodity stays deferred (no live SKU). No Blockers remain after merge-law freeze.

### What's done well

- Inventory cites live file:line for every acceptance surface.
- Merge law wins on conflict; sibling BIO/NAV/SHP files are do-not-edit.
- Yard no-remount pattern is reused (restore `mountedId`) instead of a new remount path.
- Gift class frozen to living `light` without a new `SHIP_CLASSES` key.
- `state.js` READ-ONLY with an explicit later dedicated PR only for owner-opened commodity.
- Known boot FAILs are named as non-goals.

### Findings

#### 🔴 Blocker: (none after fix)

First pass would have blocked on an invented pirate 0.05 in the freeze table. Contract §3.2 keeps the percent owner-open and points at `docs/OwnerDecisionsWave82.md`. Brief Key Decision 4 matches.

#### 🟠 Major: Gift desk must not steal Digit 0

**Location:** `docs/Bio01ObtainDesign.md` §4; `station.js` 5710–5715

**Issue:** A new `DOCK_KEY_SERVICES` insert would move Digit 0 off shipyard. A Yard SKU digit would collide with hangar row 8.

**Fix applied:** People desk + confirm papers. Level-1 Digit 0 untouched. Optional People level-2 Digit 1 only while gift is visible. Contract §0.11, §2.2.

#### 🟠 Major: Pirate must not share gift reserved id

**Location:** contract §1.2–1.3

**Issue:** Reusing `hull_seed_gift` for a pirate grant would skip a later Sworn gift (once-id) or overwrite the gifted hull.

**Fix applied:** Pirate uses `nextHullId` stem `seed_pirate`. Never `hull_seed_gift`. Collision fail-closed.

#### 🟠 Major: Cap 8 vs `capHulls`

**Location:** `hangar.js` 322–331 vs grant helper

**Issue:** Restore overflow **drops unmounted extras**. Using that to “accept” a 9th gift would delete player property.

**Fix applied:** Grant uses `canAcceptPurchase` only. Contract §1.4.

#### 🟡 Minor: `commLine` vs new event

**Location:** contract §3.3

**Issue:** If pirate fires in combat HUD noise, Echo may miss. A new event would need a `ctx.js` freeze comment.

**Fix:** Prefer `commLine`. New event only if a later owner proves it cannot carry the line. Not a design blocker.

#### 🟡 Minor: Repeatable pirate vs once

**Location:** open owner Q2

**Issue:** Repeatable rare grants can fill a hangar with living lights.

**Fix:** Default documented: repeatable until cap. Owner may later make once. Gift stays once.

#### 💡 Suggestion: Helper home `hangar.js` not `state.js`

Matches SHP: yard prices live on `shipyard.js`; hangar mutations live on `hangar.js`. Pirate rate constant, if copied from Wave 82, sits next to `GRAFT_LIST_UU` or the grant helper.

### Contract vs brief

| Topic | Contract | Brief | Winner |
|---|---|---|---|
| Gift id | `hull_seed_gift` | same | same |
| Sworn | ≥50 live ladder | same | same |
| Cap 8 | fail-closed | same | same |
| Drop % | not invented; Wave 82 pointer | same | contract |
| Commodity | deferred | deferred | same |
| Digit 0 | shipyard | shipyard | same |
| `state.js` | READ-ONLY; PR5 skip | same | same |
| Sibling edits | forbidden | forbidden | same |

### Method

Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Blocker/Major resolved in contract/brief before DONE.
