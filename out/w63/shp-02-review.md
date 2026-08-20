# Code Review: `out/w63/shp-02-hangar.md` (SHP-02 hangar)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** Design note only. Compared against `save.js`, `station.js`, `state.js`, `ctx.js`, `ship.js`, `title.js`, HUD-02 hullKind law, and `out/w63/shared-contract.md`.  
**Pass:** After re-dispatch fixes (merge law, persist envelope, Unknowables numbered paths).

### Summary

The note is implementable. Persist shape matches shared-contract §1.2. A coder who follows only numbered steps cannot mount Unknowables as `'built'`. No blockers remain.

### What's done well

- Header states MERGE LAW: `out/w63/shared-contract.md` wins on conflict.
- Persist is `{ mountedId, hulls }` with the live hull as a row. Snapshot parks before copy.
- Unknowables force-`'living'` is a numbered step on pack, load, sanitize, player allowlist, restore copy, remount, buy, and snapshot park.
- Cap 8 with mounted-row-kept tail drop. Old 4/3 is marked rejected.
- Career gear lives on the hull row; world keys are mirrors.
- `freshStart` rebuilds one living starter (old keep-stored vault marked rejected).
- Service `'shipyard'` appended after `epics`. Digit 0 required. KeyY extra only.
- `classKey` admits `SHIP_CLASSES` (including frigate) and coerces unknown keys to `'light'`. BUY omit list is SHP-01, not persist drop.
- Bio is out of the write set. Events stay frozen. `state.js` remains read-only.
- Berth survival is the existing `clearAutosave` contract.

### Findings

#### 🔴 Blocker: Unknowables could mount `'built'`
**Location:** previous note §3.2 / §9 / §10 vs claim §2.5
**Issue:** Enum allowlist alone kept a legal `'built'` on faction `unknowables`.
**Fix:** Applied — explicit force step after every enum write (note §2.6 and each numbered path).
**Status:** resolved

#### 🔴 Blocker: Two files claimed win
**Location:** previous hangar header vs shared-contract status
**Issue:** Implementer could not obey both envelopes.
**Fix:** Applied — first line of the hangar note: shared contract wins.
**Status:** resolved

#### 🔴 Blocker: Persist envelope fought the contract
**Location:** previous §1 / §3 stored-only + `player.hangarId`
**Issue:** Contract §1.2 requires `{ mountedId, hulls }` and a live row.
**Fix:** Applied. Stored-only marked rejected. No new persist keys.
**Status:** resolved

#### 🟠 Major: Stale mounted row on snapshot
**Location:** note §1.3 (added)
**Issue:** Restore copies identity and cargo from the mounted row. A mid-flight save without park would roll back the live hold.
**Fix:** Applied — numbered park before WORLD_FIELDS copy.
**Status:** resolved

#### 🟠 Major: `freshStart` vault vs contract
**Location:** previous §12 / Q6
**Issue:** Keep-stored contradicted contract §1.3.
**Fix:** Applied — rebuild one living starter. Q6 marked rejected.
**Status:** resolved

#### 🟡 Minor: Live `cargoCapacity` is not clamped today
**Location:** `save.js` ~354; note §9
**Issue:** Current restore assigns any number. The note adds finite ≥ 20 and `{20,30,40}`.
**Fix:** Already law in §9. No further note change.
**Status:** implementation reminder

#### 🟡 Minor: No public `trySave` today
**Location:** `save.js` `trySave` is closed over in `initSave`
**Issue:** `requestAutosave` is a real export, not a one-liner. The first code PR must not reach into the closure.
**Fix:** Already specified as a `save.js` export that reuses the same gates.
**Status:** implementation reminder

#### 💡 Suggestion: Pane-local digits on Hangar vs Stock
**Location:** note §5.2
**Issue:** Digit 3+ means buy or switch depending on pane.
**Fix:** Re-read `ui.shipyardPane` at keydown. Already written.
**Status:** implementation reminder

### Contract checklist

- [x] Shared contract wins on conflict
- [x] Persist `{ mountedId, hulls }`; live hull is a row
- [x] Persist allowlist explicit (`WORLD_FIELDS` + contract row fields + player keep-list)
- [x] New Game vs death vs berth table; `freshStart` rebuilds one living starter
- [x] Capacity 8; 4/3 rejected
- [x] Career gear on hull row; world mirrors
- [x] Docked-only switch
- [x] Cargo-with-hull
- [x] Digit 0 + appended `'shipyard'`; KeyY extra
- [x] `classKey` = `SHIP_CLASSES` else `'light'`; BUY omit ace/cutter/frigate
- [x] Unknowables cannot mount `'built'` from numbered steps
- [x] Magical any-dock
- [x] HUD does not write `hullKind`
- [x] No wishlist / PROGRESS / `src/` / `scripts/` edits
- [x] Regression table covers mesh orphan, bio, cargo dup, Unknowables, berth wipe, stale park

### Verdict

Ready for a later implementation wave. Defaults in §16 stand unless the owner answers otherwise. Shared-contract defaults already override the rejected alternatives.
