# Security Review: Org01 origin consequence preview leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 141 lands markdown only. Trust boundary is later origin-overlay paint: authored `ORIGINS` names/lines plus derived credits, ranks, system names, and clue words. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no prototype origin ids, no new persist mute flag, never throw from overlay paint, Digit listener still removes on pick. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via origin name / line / clue / preview strings — **resolved in freeze**

**Location:** later overlay rows; live `origins.js` **121**, **141**, **150** `textContent`; grep `innerHTML` in `origins.js` empty  
**Issue:** `ORIGINS[id].name` / `.line` and clue `line` are authored, but a later rewrite that used `innerHTML` / `insertAdjacentHTML` for preview rows or “clue {id}” would execute a tampered string if `ORIGINS` is mutated.  
**Impact:** script in a full-screen overlay (z-index 60).  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `textContent`. Do not interpolate untrusted strings into HTML. Clue words from authored line via `textContent`.

#### 🟠 HIGH: Prototype / unknown origin ids crash paint or apply — **resolved in freeze**

**Location:** live `ORIGIN_IDS = Object.keys(ORIGINS)` **29**; Digit `choose(ORIGIN_IDS[n])` **157**; `applyEffects` `ORIGINS[id].effects` **53**; Agent path `Object.hasOwn` **166**  
**Issue:** Digit path does not `hasOwn`. `Object.keys` on a polluted prototype can yield `__proto__`. `ORIGINS[id].effects` then throws. Reputation merge uses `Object.keys(fx.reputation)` **59**. Overlay row `ORIGINS[id].name` **141** throws and can leave a half-built card.  
**Impact:** uncaught overlay throw; possible prototype write if a later loop assigned onto `world`.  
**Fix (frozen):** contract §0.12: skip unless `typeof id === 'string'` and `Object.hasOwn(ORIGINS, id)` and the record is a non-null object. Reserved keys skip. Missing effect field omit row. Never throw from overlay paint. Digit and click both go through that guard. `applyEffects` must not throw on unknown id (do not write `world.origin`). No `for-in` onto `world`.

#### 🟠 HIGH: Persist mute / origin god-mode — **resolved in freeze**

**Location:** `save.js` `WORLD_FIELDS` includes `'origin'` **91**; live write `ctx.world.origin = id` **128**  
**Issue:** A new persist “originPreviewOff” or a “fix” that skipped `applyEffects` while still recording origin would let a hostile save hush consequences or mint a career without the overlay. Invented credits on the overlay (not derived) would desync from live 350 / −1500 / 600.  
**Impact:** career desync; owner-looking wipe.  
**Fix (frozen):** persist **none** new. `state.js` READ-ONLY. Derive numbers from live effects + defaults. Choice still writes `ctx.world.origin` as today. No new WORLD_FIELDS.

#### 🟠 HIGH: Uncaught throw from overlay paint — **resolved in freeze**

**Location:** `initOrigins` row loop **136–146**; `choose` **125–134**  
**Issue:** Live paint has no try/catch per origin. One bad id throws during init and can leave `paused` true with no card. `choose` reads `ORIGINS[id].line` **133** after apply.  
**Impact:** hard-stuck pause; fail open on throw.  
**Fix (frozen):** contract §0.12: never throw from overlay paint; skip the bad origin; `choose` guards `hasOwn` before apply; on apply miss do not set `world.origin`.

#### 🟠 HIGH: Digit steal after pick — **resolved in freeze**

**Location:** live `window.removeEventListener('keydown', onKey)` **126**; `controls.js` Digit1–5 WPN **548–562**; skip while `paused` **117**  
**Issue:** A preview PR that left the origin listener after `choose`, or that bound Digit 0/8/9, would steal station digits or weapon groups. A PR that did not remove the listener would eat Digit1–5 forever.  
**Impact:** weapons dead; station Digit 0/8/9 stolen.  
**Fix (frozen):** keep remove-on-pick. Digit1–5 origin **until** pick only. Digit 0/8/9 ignored on overlay; station after pick. Do not remap. Agent `chooseOrigin` already returns `no-service` when closed (`agent-api.js` **302**).

#### 🟠 HIGH: Overlay pause as extra lock / Ctl05 steal — **resolved in freeze**

**Location:** live `ctx.flags.paused = true` **100**; Ctl05 sibling; CTL-02 hail/chart/berth never write paused  
**Issue:** Preview work that added a second pause flag, or that claimed pause-menu chrome, would freeze the sim or steal KeyP. Clearing pause before pick would let WPN digits fire under the overlay.  
**Impact:** pause desync; Digit steal.  
**Fix (frozen):** keep live origin pause until pick. Do not steal Ctl05. Do not write paused from hail/chart/berth. Do not unpause before `choose`.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] Prototype-safe authored origin keys
- [x] Fail-closed never-throw / skip rather than crash overlay
- [x] Digit listener remove-on-pick kept
- [x] `state.js` not claimed
- [x] Agent `chooseOrigin` not rewritten
- [x] Creditor / AI-05 / Onb01 / Ctl05 not claimed
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Live Digit `choose` lacks `hasOwn` — **resolved in freeze**

**Location:** `origins.js` **157** vs Agent **166**  
**Issue:** Keyboard path is weaker than Agent path today.  
**Fix (frozen):** PR1 Digit/click uses the same `hasOwn` guard. Authored id order list in `origins.js`. Not expanded as `src/` this wave.

### 🟡 MEDIUM: Station / pause class steal as “overflow fix” — **resolved in freeze**

**Location:** later `screens.css`; live station `.screen-panel` `screens.css` **29–31** (cite only)  
**Issue:** Copying `.screen-panel { max-height: 82vh; overflow-y: auto }` onto the origin card would steal station/pause chrome and still leave an unfocusable mouse-only scroller.  
**Fix (frozen):** compact sublines first; dedicated `.rw-origin-*` only if CSS moves; overflow backup not primary; do not reuse `.screen-panel` / `.screen-btn`.

### 🟡 MEDIUM: `applyEffects` reputation `Object.keys`

**Location:** `origins.js` **59**  
**Issue:** If `fx.reputation` were a polluted object, keys could be unexpected. Authored literals are plain objects.  
**Justification:** PR1 fail-closed: iterate with `Object.hasOwn` / skip reserved. Do not change authored deltas.

### Recommendations

1. Later PR1: wrap paint and `choose` in skip/never-throw; `textContent` only.
2. Keep Digit map and listener remove. Do not add persist.
3. Derive preview; do not duplicate a `state.js` table that can lie.
