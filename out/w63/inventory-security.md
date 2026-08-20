## Security Review: out/w63/current-shp-inventory.md

### Risk Level: Medium

### Summary
The brief is design-only markdown. It adds no runtime surface. Residual risk is the **already shipped** save-tamper set (`classKey`, extra player keys, credits, `cargoCapacity`, unsanitized names). The inventory names those holes and does not invent a persist schema.

### Findings

#### 🟡 MEDIUM: Wholesale `ctx.player` persist (pre-existing)

**Location:** `src/game/save.js` 170, 359; documented in inventory §5.3–5.4  
**Issue:** `snapshot` writes `player: ctx.player`. `restore` `Object.assign`s. Extra keys keep. `hullKind` and a tampered `classKey` load.  
**Impact:** A hand-edited save can force HUD `mech`, frigate turn, or inflated integrity if those numbers are finite.  
**Fix (later SHP persist wave, not this file):** allowlist `hullKind` to `living`|`built` (delete anything else); decide whether `classKey` rebuilds vitals from `SHIP_CLASSES`. Do not add a schema in this brief.

#### 🟡 MEDIUM: Credits and cargoCapacity are not magnitude-clamped (pre-existing)

**Location:** `save.js` 242, 354; inventory §5.3  
**Issue:** Credits heal only when non-finite. `cargoCapacity` assigns any `typeof number` (including `NaN`).  
**Impact:** Local save edit grants a huge purse or a broken hold cap.  
**Fix:** later save wave; this brief only names the hole.

#### 🟢 LOW: XSS via `shipName` / `player.name`

**Location:** `save.js` 68, 359; `station.js` 1450–1454, 2182–2183; `contacts.js` 466–469  
**Issue:** Names persist unsanitized. Current UI uses `textContent`.  
**Impact:** No XSS today. A later name field that uses `innerHTML` would fire.  
**Fix:** keep `textContent`; if SHP adds a rename UI, reuse `stripControlChars` + `NAME_MAX` (`save.js` 90–124).

#### 🟢 LOW: Equipment ladders are already allowlisted

**Location:** `save.js` 244–256  
**Issue:** None for scanner / miningLaser / concealedMounts.  
**Impact:** N/A — this is the model later hull fields should copy.  
**Fix:** none in this wave.

### Passed Checks

- [x] No `src/` edits
- [x] No proposed persist schema beyond naming holes
- [x] No secrets in the brief
- [x] Scanner / mining / concealed heals cited correctly
- [x] HUD named as a `hullKind` non-writer
- [x] Dock UI name paint cited as `textContent`

### Recommendations

1. Later SHP persist: allowlist `hullKind`; do not rely on `sanitizeRestored` to drop junk.
2. Later rename UI: `textContent` + the survivor-name strip helpers.
3. Do not treat `cargoCapacity` or `credits` as already safe.
