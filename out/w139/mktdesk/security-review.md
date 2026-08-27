# Security Review: Mkt01 MARKET desk layout leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 139 lands markdown only. Trust boundary is later MARKET pane paint: authored subtitle plus commodity **names** and fill numbers from `COMMODITIES` / `tradeFillUnit` / `world.prices`. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no Agent observe fill claim, no new persist flag, no prototype keys in the row loop, no pause write, never throw from `renderMarket`. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via commodity / notice / subtitle strings — **resolved in freeze**

**Location:** later `renderMarket`; live `station.js` **4544–4548** `textContent`; **4830–4859**; grep `innerHTML` in `station.js` empty  
**Issue:** `COMMODITIES[key].name` is authored, but a later rewrite that used `innerHTML` / `insertAdjacentHTML` for names, `n UU`, or a “Buy {name}” prefix would execute a tampered name if `COMMODITIES` is mutated or a future save overlay writes display strings.  
**Impact:** script in the station overlay.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `h()` `textContent`. Do not interpolate untrusted strings into HTML. Optional PR3 hidden prefixes also `textContent`.

#### 🟠 HIGH: Prototype / unknown commodity keys crash the overlay — **resolved in freeze**

**Location:** live `COMMODITY_KEYS.forEach` `station.js` **4839–4844**; `RENDERERS[ui.service](panel)` **6151** after `overlay.textContent = ''` **6109**  
**Issue:** `const com = COMMODITIES[key];` then `com.name` throws if `com` is missing. `priceOf` **2068** reads `ctx.world.prices[key]` without optional chaining. A throw after the overlay wipe blanks the desk (fail open).  
**Impact:** uncaught overlay blank; possible prototype key if a later loop used `for-in`.  
**Fix (frozen):** contract §0.11: skip unless `typeof key === 'string'` and `Object.hasOwn(COMMODITIES, key)` and the record is a non-null object. Missing name → key text. `tradeFillUnit` throw → skip row. Never throw from MARKET paint. No `for-in` onto `world`.

#### 🟠 HIGH: Agent observe fill / off-desk trade cheat — **resolved in freeze**

**Location:** `agent-observe.js` `marketBlock` **258–275** (cite only); sibling Wave 139 Agent fill pack  
**Issue:** A Mkt01 PR that added `buyFill`/`sellFill` (or equal) to observe, or a new `act({ name: 'tradeFill' })` that bypassed Digit 1 / Q/W/A/S / locker, would steal the sibling pack and give Agents a JSON oracle or a silent trade pulse.  
**Impact:** observe cheat; possible locker skip.  
**Fix (frozen):** contract §0.9–0.10: do not claim `agent-observe.js` or `agent-api.js`. Do not add fill JSON. Keyboard and `btn()` stay the trade path. Locker `'trade refused'` stays visible.

#### 🟠 HIGH: Persist mute / price god-mode — **resolved in freeze**

**Location:** `state.js` `COMMODITIES` **350–364**; `PRICE_BAND`; live `tradeFillUnit` **4692–4714**  
**Issue:** A new persist “marketLayoutOff” or a “fix overflow” that rewrote book prices / `tradeFillUnit` would let a hostile save hush fills or mint UU.  
**Impact:** econ desync; owner-looking wipe.  
**Fix (frozen):** persist **none** new. `state.js` READ-ONLY. Do not retune `tradeFillUnit` math.

#### 🟠 HIGH: Overlay pause as “layout lock” — **resolved in freeze**

**Location:** `overlay-policy.js` **4**  
**Issue:** Layout work that wrote `flags.paused` while the MARKET pane rebuilt would freeze the sim (CTL-02).  
**Impact:** pause desync.  
**Fix (frozen):** Mkt01 cites overlay only. Never write `paused`. Do not pause. Do not teleport.

#### 🟠 HIGH: Uncaught throw from MARKET paint — **resolved in freeze**

**Location:** `render()` **6109–6151**; `renderMarket` **4829–4872**  
**Issue:** Live paint has no try/catch around the commodity loop. One bad row blanks every station service chrome already mounted in that `render()`.  
**Impact:** overlay fail closed poorly (uncaught).  
**Fix (frozen):** contract §0.11: never throw from MARKET pane paint; skip the bad row.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent observe fill claim
- [x] Prototype-safe authored keys
- [x] Fail-closed never-throw / skip rather than blank overlay
- [x] Illegal rows not dropped
- [x] `state.js` not claimed
- [x] `flags.paused` not claimed
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: `tryTrade` still assumes `com` exists

**Location:** `station.js` **4730–4746**  
**Issue:** Keyboard Q/W/A/S call `tryTrade(COMMODITY_KEYS[ui.marketSel], …)` **6296–6298**. If selection points at a skipped unknown key, `tryTrade` may still throw.  
**Justification:** PR1 skip is paint-first. `tryTrade` already returns false for non-market / survivor / data. Do **not** retune trade math. Later skip should also refuse `tryTrade` on unknown keys without changing fill math (early `isMarketCommodity` already **4726**). Documented; not expanded.

### 🟡 MEDIUM: Observe already exposes `posted`

**Location:** `agent-observe.js` **267–273**  
**Issue:** External Agent already sees posted book, not fill. Inbox Agent fill is a **sibling**.  
**Justification:** Cite only. Mkt01 must not add fill fields.

### 🟢 LOW: Subtitle is an authored literal

**Location:** contract §0.20 `'MARKET — buy price and sell price'`  
**Issue:** No save interpolation.  
**Justification:** keep it a literal `textContent` argument.

### Recommendations

1. Later PR1: wrap `.market-actions`; subtitle player words; skip unknown keys; `textContent`; never throw.
2. Do not add WORLD_FIELDS or observe fill.
3. Do not write `flags.paused`.
