## Security Review: NAV-04 galaxy-map hover (design freeze)

### Risk Level: Low

### Summary
Deep audit of the Wave 95 markdown freeze (inventory, merge law, brief). No `src/` diff. No CRITICAL or HIGH findings after contract fences for `innerHTML`, allowlisted `standingRead`, proto ids, no mystery read, and no persist key.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Catalog faction is already visible on every charted node

**Location:** live `galaxychart.js` 251–258 (node color); contract §3.5  
**Issue:** Wishlist asks unknown for undiscovered ownership. Live code has **no** system-visit bag. The chart already paints `FACTIONS[sys.faction].color` for every charted disc at init. A hover panel that prints that same allowlisted name does not add a new catalog leak versus color. Inventing visit fog would add a `WORLD_FIELDS` key (forbidden unless the owner authors it).  
**Impact:** Players who never jumped to a generated system can still read the banner on hover, as they can already infer it from fill.  
**Fix (accepted in freeze):** Uncharted systems never exist as hit discs. Mystery stays unread. Bad / reserved faction keys print **Unknown** and do not call `standingRead` on a non-FACTIONS key. No visit persist. Owner Q1 default **none**.

#### 🟢 LOW: `svgEl` still uses `Object.entries(attrs)`

**Location:** `galaxychart.js` 57–60; contract §6  
**Issue:** Untrusted attr **names** would XSS/inject SVG.  
**Fix:** Later impl passes **literal** maps only (same NAV-01 law). Hover marker attrs are authored strings.

#### 🟢 LOW: No hover `ctx.emit`

**Location:** contract §0.14  
**Issue:** `ctx.emit` spreads `data` onto `{ type, t, ...data }` (`ctx.js` 231–232). Emitting a model with a `type` field would smash the queue.  
**Fix:** Hover emits **nothing**.

### Passed Checks

- [x] No secrets, API keys, or credentials in the write-set
- [x] No network / auth / server trust boundary
- [x] `innerHTML` forbidden; `textContent` / `h()` / SVG text
- [x] `sanitizeSystemId` on `data-system-id` (reserved / proto / unknown fail closed)
- [x] Standing from `standingRead` (FACTIONS allowlist + reserved → 0)
- [x] Unknown political path does not `standingRead` a non-allowlisted key
- [x] Uncharted systems cannot be hovered (no node)
- [x] `world.mystery` must not be read
- [x] No new `WORLD_FIELDS` / `localStorage` key
- [x] Hover does not write `world.nav` or `world.reputation`
- [x] No standing deltas / UU invented
- [x] Digit 0 remains shipyard (chart closed while docked)

### Recommendations

1. Impl PR1 pins: reserved faction key → Unknown; `__proto__` dest → no panel.
2. Impl PR2: never assign `innerHTML`; never `emit` the model.
3. Keep mystery imports out of `galaxychart.js` / `chart-hover.js`.
