# Security Review: Wave 66 PR1 survivor cargo persist pins

**Scope:** `src/game/save.js` (`sanitizeFaction`, `sanitizeCargoRow`, `WORLD_FIELDS`), `scripts/boot-test.mjs` WAVE66 SAVE PINS.
**Mode:** Deep audit (prototype-key smuggling, extra cargo keys, XSS at persist, WORLD_FIELDS expansion).
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
Survivor cargo is rebuilt as a keep-list literal. Extra keys drop. Reserved ids (`__proto__`, `constructor`, `prototype`, and the hangar reserved set) cannot become `row.faction`. `peopleTrafficked` is not a world field. WAVE66 SAVE PINS are all-true.

### Findings

#### 🟡 MEDIUM: stored name may still hold HTML text
**Location:** `src/game/save.js` `sanitizeSurvivorName` 137–141
**Issue:** Controls, bidi, and zero-width marks strip. Cap is 40. `<img>` / `<script>` text still persist.
**Impact:** Persist is not a render sink. A later `innerHTML` of `row.name` would XSS. This PR does not render names.
**Status:** open — render must use `textContent` (contract §6). Persist must not HTML-escape cargo strings.
**Justification:** Encoding belongs at the UI boundary. PR1 has no UI.

#### 🟢 LOW: exported `WORLD_FIELDS` array is mutable
**Location:** `src/game/save.js` `WORLD_FIELDS` 73–92
**Issue:** The pin import can `push('peopleTrafficked')` at runtime and change snapshot/restore.
**Impact:** Console / later module mutation only. A crafted save blob still cannot add the key unless the array already lists it.
**Status:** open — nearby style is a plain array. Restore pin still refuses a smuggled `world.peopleTrafficked`.
**Justification:** Same class as any exported const array. Freeze is optional later.

#### 🟢 LOW: reserved-id check is case-sensitive
**Location:** `src/game/save.js` `RESERVED_IDS` 100–104; `sanitizeFaction` 129
**Issue:** `__PROTO__` / `Constructor` match `SAFE_ID` and are not in the set.
**Impact:** Those strings are ordinary own-keys. They do not pollute `Object.prototype`.
**Status:** open — contract names the three exact prototype keys. Pins cover those exact strings.

### Resolved this pass
1. **HIGH (fixed in impl):** `SAFE_ID` matched `__proto__`. `sanitizeFaction` now rejects `RESERVED_IDS` before the regex. A reserved cargo faction drops the survivor row.

### Passed checks
- [x] No secrets in the save / boot-pin diff
- [x] No `innerHTML` / `eval` / function hydrate from the blob
- [x] Cargo rows are fresh literals; never `Object.assign` a raw save object
- [x] Extra keys (`price`, `loadout`, enumerable `__proto__`) drop
- [x] Reserved faction ids do not land as `row.faction`
- [x] `source` is `'playerKill'` else `'other'`
- [x] Name: strip controls, trim, cap 40; empty omitted
- [x] Ordinary goods stay `{ commodity, units }`
- [x] No new `WORLD_FIELDS` key; `peopleTrafficked` does not restore
- [x] No `src/game/trafficking.js`; no `survivorSold`; no reputation write
- [x] No `h()` / HUD / scoop / spawn / rescue change

### Recommendations
1. Later sale wave: print names only via `textContent` after `sanitizeSurvivorName`.
2. Optional: `Object.freeze(WORLD_FIELDS)` if a later owner wants a hard list.
