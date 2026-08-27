# Security Review: Wave 140 PR1 MARKET desk layout

### Risk Level: Low

### Summary

Desk layout PR1 wraps TRADE CSS, paints a player-word subtitle via `textContent`, and skips bad commodity rows. Trust boundary is authored `COMMODITIES` keys into DOM text. No HIGH/CRITICAL remain after implement. No observe steal. No throw from `renderMarket`.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None.

#### 🟡 MEDIUM: Boot harness poisons `COMMODITIES.provisions` — **documented, restored**

**Location:** `scripts/boot-test.mjs` WAVE140 MKTDESK  
**Issue:** The pin sets `COMMODITIES.provisions = null` then `{ name: '' }` to prove skip and key fallback. `market.js` `baselineFor` reads `.base` on tick. First run ticked while null and logged `UPDATE ERR`. Restore now runs before any tick and again in `finally`.  
**Impact:** Harness only. Live play never poisons `COMMODITIES`.  
**Fix:** Keep restore-before-tick. Do not leave a null record across `tick()`.  
**Status:** resolved in harness

#### 🟢 LOW: Outer catch swallows archive desk paint errors

**Location:** `src/systems/station.js` `renderMarket`  
**Issue:** Fail-closed wrap covers `renderArchiveDesk` as well as row skip. A later archive throw stays silent instead of blanking the overlay.  
**Impact:** Overlay stays up. Archive copy may omit for that paint.  
**Status:** open (accepted fail-closed)

### Passed Checks

- [x] No secrets in code
- [x] Commodity name / UU / subtitle / refusal use `h()` `textContent` (`station.js` **4544–4548**, **4831**, **4850–4857**)
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `renderMarket`
- [x] Prototype skip: `typeof key === 'string'` and `Object.hasOwn(COMMODITIES, key)` and non-null object
- [x] Missing name paints the key, not HTML
- [x] `tradeFillUnit` / `priceOf` throw skips that row; no blank overlay
- [x] `renderMarket` does not throw
- [x] No `agent-observe.js` / `agent-api.js` write
- [x] No `state.js` write
- [x] No `flags.paused` write
- [x] No new persist key / Digit / HUD pip
- [x] `peekFillUnit` untouched

### Recommendations

1. Keep names on `textContent`.
2. Do not add observe fill fields in this pack.
3. Do not tick the sim while a boot pin holds a null `COMMODITIES` record.
