# Security Review: NAV-09 leftover chart readability (Wave 128)

### Risk Level: Low

### Summary

Wave 128 lands markdown only. Live chart already uses `createElement` / `textContent` / `sanitizeSystemId` and does not persist zoom. The freeze forbids `innerHTML`, persist of map view, `eval` of filters, Agent teleport, and `for-in` into `world`. No 🔴 CRITICAL or 🟠 HIGH remains open. Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Mode: **Quick Scan** (design pack; no auth/payments). Did **not** start Vite or Chrome.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟠 HIGH (closed in freeze): `innerHTML` of system names

**Location:** later `galaxychart.js` itinerary / dest / zoom labels; live names already `textContent` (`galaxychart.js` **226**, **349**, **455**).

**Issue:** Authored and generated names are strings. HTML injection via `innerHTML` would XSS the overlay.

**Fix landed (markdown):** `textContent` / `createElement` / `createElementNS` only. `innerHTML` forbidden. Dest values pass `sanitizeSystemId`.

**Status:** closed in contract §0.8 / §0.12.

#### 🟠 HIGH (closed in freeze): persist zoom as god-mode map

**Location:** later session view; `WORLD_FIELDS` already has `nav` (`save.js` **103–104**), not zoom.

**Issue:** Persisting pan/zoom/filter (or unauthored reveal) on hostile save could look like a revealed map or survive as a second plot store.

**Fix landed (markdown):** zoom/pan/filter **session**. Reset on close. No new persist key. Itinerary **reads** `world.nav`. Do not persist flying Autopilot.

**Status:** closed in contract §0.9–§0.10.

#### 🟡 MEDIUM (closed in freeze): filter payload into world

**Location:** later faction/standing selects.

**Issue:** `for-in` merge of a filter object into `ctx.world` could pollute prototypes or write reputation.

**Fix landed (markdown):** authored `FACTIONS` keys + `RANK_LADDER` names only. Closure state. Never `for-in` into `world`. Unknown id ignore.

**Status:** closed in contract §0.12.

#### 🟡 MEDIUM (closed in freeze): standing throw / clue leak

**Location:** `standingRead` (`data-trade.js` **73–80**) already returns 0; clues forbidden (`galaxychart.js` **18–23**).

**Issue:** Missing reputation must not throw. Itinerary must not print unpublished clue / landmark `line`.

**Fix landed (markdown):** Unknown standing string; recorded `cast.pirates` + rank only; §25.

**Status:** closed in contract §0.1 itinerary / known risk.

#### 🟢 LOW: Agent observe of filter

**Location:** `agent-observe.js` `navSnap` **212–224** (plot only).

**Issue:** Observe may later read filter state. Not this wave. Must not grow a cheat teleport.

**Status:** accepted; contract §0.11. Not this leftover.

### Passed Checks

- [x] No secrets in this pack
- [x] Live `galaxychart.js` `innerHTML` count = 0
- [x] Dest options use `sanitizeSystemId` + `hasOwn`
- [x] `chartOpen` is session (`ctx.js` **217**)
- [x] Overlay never writes `flags.paused` (`overlay-policy.js` **4**)
- [x] No Agent chart teleport in freeze
- [x] Filter not `eval`
- [x] Names from authored `SYSTEMS` only

### Recommendations

1. Impl wave: keep itinerary / labels on `textContent`. Re-grep `innerHTML`.
2. Impl wave: no `WORLD_FIELDS` zoom key.
3. Impl wave: standing miss → `Unknown`; never throw.
