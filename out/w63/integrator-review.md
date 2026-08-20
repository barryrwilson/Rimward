# Code Review: `docs/ShpDesign.md` (Wave 63 SHP integrator)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** Accepted SHP design vs merge law, inventory, sibling notes, HUD-02 Q1–Q3. No `src/` edits. Designer pass skipped.  
**Wave:** 63 design only.

### Summary

The brief matches merge law. It rejects SHP-01 `'yard'` / remount-on-buy, flattens SHP-03 `loadout`, keeps world equipment mirrors, names `ctx.config.ship` remount, and freezes Digit 0 + `{ mountedId, hulls }` cap 8. HUD-02 Q1–Q3 stay closed. No Blockers. Wishlist SHP is PLANNED, not DONE.

### What's done well

- Front matter + verifier table cite inventory CLEAN, SHP-01 MEDIUM (contract wins), hangar recheck CLEAN, SHP-03 MEDIUM (flatten), shared recheck CLEAN.
- Frozen thirteen owner resolutions are written as law, not as open debate.
- Persist shape is copied from contract §1.2 field-for-field. Unknown keys drop.
- Dock contract quotes the shipped nine-key list and special-cases Digit 0.
- Buy vs remount is explicit: add a hangar row; Hangar pane mounts.
- Flight diagnosis matches shipped `ship.js` / `ctx.js`: turn follows `classKey`; cruise follows `config.ship`.
- SHP-03 first slice is existing ladders on flat rows, not missiles.
- Serial PR1–PR5 matches the four non-parallel-safe files.
- Open-questions table keeps defaults. HUD-02 Q1–Q3 are not reopened.

### Findings

#### 🔴 Blocker: none

#### 🟠 Major: none (sibling conflicts already resolved by merge law)

SHP-01 `'yard'` / no Digit 0 / remount-on-buy / world cargo, and SHP-03 nested `loadout` / drop-WORLD_FIELDS, are written as rejected. Verifier MEDIUM nits do not remain as implementer choice.

#### 🟡 Minor: SHP-01 first-slice Ledger `cutter` stock omitted

**Location:** `docs/ShpDesign.md` §6.2 vs `out/w63/shp-01-shipyards.md` §3  
**Issue:** SHP-01 wanted Ledger `light` + `cutter` as the first class split. Frozen 9 allows omit. This brief omits ace / cutter / frigate from first-slice BUY.  
**Fix:** Default stands. Owner may add `cutter` to a later catalog row without a persist change.  
**Status:** accepted default. Not a merge-law break (contract only requires omit `frigate`).

#### 🟡 Minor: SHP-01 Known/Trusted floors are catalog-optional

**Location:** brief §6.3 vs SHP-01 §5  
**Issue:** SHP-01 required Known for `light`. Contract default is refuse when `reputation < 0`.  
**Fix:** Brief keeps contract default; catalog rows may author a higher floor.  
**Status:** accepted.

#### 💡 Suggestion: Pin Digit0 and `freshStart` leftover `hullKind`

**Location:** `station.js` 2248–2251; `save.js` 379  
**Issue:** Implementers who only append the array will ignore Digit 0. `Object.assign` of a new light does not delete `hullKind`.  
**Fix:** Already law in the brief and PR1/PR3. Implementation must pin both.  
**Status:** open (implementation wave).

### Cross-check vs verification target

| Check | Result |
|---|---|
| `docs/ShpDesign.md` exists and matches merge law | Pass. |
| Wishlist SHP is PLANNED, not DONE | Pass. SHP-01/02 first slice PLANNED. SHP-03 first = move existing equipment; missiles later. |
| `PROGRESS.md` has Wave 63 after Wave 62 | Pass. Design only. Cites `out/w63/` notes + verifiers. No src edits claimed. |
| HUD-02 Q1–Q3 reopened? | Pass. Closed. |
| Service key `'shipyard'` + Digit 0 | Pass. `'yard'` rejected. |
| Buy adds hangar row | Pass. Remount-on-buy rejected. |
| Flat equipment fields; world mirrors stay | Pass. Nested `loadout` rejected. |
| No `src/` / `scripts/` / `public/` / `index.html` / `package.json` from this worker | Pass (integrator write set is docs + `out/w63/` + trackers). |
