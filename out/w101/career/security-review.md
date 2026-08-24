## Security Review: BIO-02 remaining career branches (Wave 101)

### Risk Level: Low

### Summary
Deep audit of the Wave 101 markdown pack (`docs/Bio02CareerDesign.md`, `out/w101/career` contract and inventory). No `src/` diff in this write-set. No CRITICAL or HIGH findings. The freeze forbids new class keys, Digit steal, new persist, `innerHTML`, invented UU, SKU sneak / omit-restore, HUD `hullKind` write, and Wave 97 graft reopen.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Markdown only. Nested subagents forbidden. Persist / Digit / XSS in scope.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later label PR must not parse copy as dest

**Location:** live `shipyard-desk.js` 234–240, 261–266; contract §2.3  
**Issue:** Confirm already takes `pending.destClass` after `livingTrainDests.includes` + `hasOwnProperty(SHIP_CLASSES)`. A PR1 that sets dest from the career word (`combat`) would fail closed today (not a class key) or, if someone also mints the key, would be a catalog smash.  
**Impact:** Failed confirm (safe) or a new key (forbidden).  
**Fix (applied in freeze):** Dest is the live key only. Career word is static paint. Do not parse it.

#### 🟢 LOW: `ctx.emit` smash if a later kit PR spreads a hangar blob

**Location:** `ctx.js` 263–264  
**Issue:** `emit` spreads `data` onto `{ type, t }`. Emitting a row would smash the queue.  
**Fix:** Contract §5: desk notice only. Never `{ ...row }`.

#### 🟢 LOW: Desk copy remains source literals

**Location:** `shipyard-desk.js` 376–394, 426–434; `station.js` 4302–4306  
**Issue:** Player-controlled hull `name` already rides hangar cards via `textContent`. Train hop uses `classLabel` (key or `'light'`).  
**Fix:** Keep career words as literals. No `innerHTML`.

#### 🟢 LOW: Restore still assigns player then hangar heal

**Location:** live `save.js` `WORLD_FIELDS` 76–101; hangar sanitize  
**Issue:** A crafted save cannot invent a career key that `classKeyOf` will keep (`hangar.js` 40–42 → `'light'`). Extra tokens already collapse. Career serial must not add a parallel field that skips sanitize.  
**Fix:** No new persist key. Ride hangar row.

### Passed Checks

- [x] No secrets, API keys, or credentials in the write-set
- [x] No network / auth / server trust boundary
- [x] `innerHTML` forbidden; `textContent` / `h()` / `el()`
- [x] Dest proto: `typeof string` + `LIVING_STOCK.includes` + `hasOwnProperty(SHIP_CLASSES)`
- [x] Hull ids: `SAFE_ID` + `RESERVED_IDS` (live train path)
- [x] No new `WORLD_FIELDS` / `localStorage` key
- [x] No invented UU or standing deltas (copy `yardPrice` / outfitter)
- [x] Digit 0 remains shipyard
- [x] HUD never writes `hullKind`
- [x] HUD `HAIR_CAREER` not bound as a career flag
- [x] No six new class keys
- [x] Live six-key `LIVING_STOCK` frozen (no SKU sneak, no omit-restore)
- [x] Graft 4000 / ungraft forbidden / NPC grafted off not reopened
- [x] No `src/` scheduled in Wave 101

### Recheck (after dest-parse and HAIR_CAREER freeze)

No new persist key, Digit, UU, or `innerHTML` landed in the brief or contract. Risk Level stays Low. No CRITICAL / HIGH.

### Recommendations

1. Keep `state.js` closed.
2. PR1 labels: static words only; Confirm still passes dest key.
3. Do not add a `career` world field.
