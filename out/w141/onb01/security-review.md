# Security Review: Onb01 first-minute flight-lesson leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 141 lands markdown only. Trust boundary is later hint paint and `seen` ids restored from save, plus HUD CONTROLS list built from authored `config.controls` strings. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no pause write, no new persist mute flag, prototype-safe hint ids, never throw from hint paint, do not steal overlay/pause. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via hint / encyclopedia / origin line — **resolved in freeze**

**Location:** live `onboarding.js` **102** `textContent`; `hud.js` **319–324**, **1288** `textContent`; origin toast **662–663**  
**Issue:** `seen` restores from save. HINTS **text** is authored today. A later rewrite that used `innerHTML` / `insertAdjacentHTML` for lesson copy, encyclopedia lines, or `ORIGINS[id].line` would execute a tampered string if anyone later pulled copy from save.  
**Impact:** script in the hint chip or HUD.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `textContent` / `el()`. Lesson copy is **authored literals** in the HINTS table. Do not interpolate save strings into HTML.

#### 🟠 HIGH: Prototype / reserved ids in `seen` — **resolved in freeze**

**Location:** `onboarding.js` **75**, **147** `seen.includes(hint.id)`; `save.js` WORLD_FIELDS **91** `'onboarding'` with **no** dedicated sanitize  
**Issue:** A hostile save `{ onboarding: { seen: ["__proto__", "constructor"] } }` or a non-array `seen` can throw or pollute if later code does `seen[id] = true` on a plain object. Live code uses an array `includes` / `push`.  
**Impact:** uncaught hint `update` throw; possible prototype confusion if PR1 switches to a map.  
**Fix (frozen):** contract §0.10: skip unless `typeof id === 'string'` and the id is an authored HINTS id. `seen` not an array → treat empty; never throw. Do not `for-in` the blob. Do **not** add WORLD_FIELDS. Default: fail-closed in `onboarding.js`, not `save.js`.

#### 🟠 HIGH: Persist mute / lesson skip as god-mode — **resolved in freeze**

**Location:** `save.js` **90–91**; `onboarding.js` **104** push-on-SHOW  
**Issue:** A save that already lists every lesson id (or a new `flightLessonOff` field) would skip teaching. Live `seen` already works that way for the eight hints. A **new** persist mute would look like an owner setting and is a second channel.  
**Impact:** hostile save hushes first-minute lesson forever.  
**Fix (frozen):** persist **none** new. Reuse `seen`. Client `settings.hints` stays the honest mute (`settings.js` **46**). Do not add `WORLD_FIELDS` `flightLesson`. Do not auto-mark all ids seen on restore.

#### 🟠 HIGH: Overlay pause as “tutorial lock” — **resolved in freeze**

**Location:** `overlay-policy.js` **4**; `origins.js` **100**, **132**; `main.js` **185**  
**Issue:** A lesson that wrote `flags.paused` while teaching, or that auto-opened chart/hail/berth, would freeze the sim (CTL-02) or steal Ctl05 / Hail02 / NAV overlay.  
**Impact:** pause desync; stacked play cards; KeyP stolen.  
**Fix (frozen):** Onb01 never writes `paused`. Cites overlay only. Do not auto-open hail/chart/berth/pause. Origins pause on the overlay stays **origins.js / Org01**.

#### 🟠 HIGH: Uncaught throw from hint paint — **resolved in freeze**

**Location:** `onboarding.js` **110–155** `update`; `when` closures **37–67**  
**Issue:** `SYSTEMS[ctx.world.currentSystem]` is guarded in `dock` (**42–44**). A later lesson `when` that reads `ORIGINS[ctx.world.origin].name` without `hasOwn`, or `seen.includes` on a non-array, throws and can stall the system loop (onboarding `update` has no try/catch).  
**Impact:** first-minute throw; HUD/loop fail closed poorly.  
**Fix (frozen):** contract §0.10: never throw from `update` / `show` / `when`. Wrap `when` miss as skip. Unknown origin → no lesson, not a crash.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage key
- [x] No `innerHTML` freeze
- [x] Prototype-safe authored hint ids
- [x] Fail-closed never-throw / skip rather than crash
- [x] `state.js` not claimed
- [x] Overlay/pause not stolen
- [x] No teleport
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Hostile `seen` stuffed with all authored ids skips the lesson

**Location:** `onboarding.js` **147**; `save.js` **91**  
**Issue:** After PR1, a crafted save can include `look`/`throttle`/… and skip teaching.  
**Justification:** Same envelope as live eight hints. Honest persist. Client `hints` setting is the mute. Do not add a second sanitizer that **clears** `seen` (that would re-dump veterans). Documented; not expanded.

### 🟡 MEDIUM: WAVE6 boot-test keys on retired `move`

**Location:** `scripts/boot-test.mjs` **1719–1750**  
**Issue:** PR1 retires id `move`. Harness would fail closed on `moveSeen` / fragment `throttle` as first card.  
**Justification:** Contract §0.1 later retarget with PR1. This wave does not edit the harness. Partial merge forbids lesson without harness retarget.

### 🟢 LOW: Encyclopedia lines are authored, not save data

**Location:** `controls.js` **590–608**  
**Issue:** None live. Keep `textContent`.  
**Justification:** Cite only.

#### 🟠 HIGH: Hint node built with inline styles then later `innerHTML` tokens — **resolved in freeze**

**Location:** live `onboarding.js` **81–88**; later `hud.css` / possible `#hud` reparent  
**Issue:** A later rewrite that did `hud.innerHTML += hintHtml` or copied `hint.text` into a template would XSS. Reparent that **clones** via HTML also copies attacker `seen` if anyone later paints ids.  
**Impact:** script in `#hud`.  
**Fix (frozen):** move the **existing** node (`appendChild` of the live element). Keep `textContent`. Authored `role` / `aria-live` / `aria-atomic` string literals only. If `#hud` is missing, stay on `body`; never throw.

### 🟢 LOW: Extra polite live region next to toasts

**Location:** toasts `hud.js` **1064–1067**; later hint `role="status"`  
**Issue:** Two polite regions can both speak on origin pick (sting + look).  
**Justification:** Designer asked for the rail to announce. Keep **polite**, not assertive. Do not steal toast rewrite (HUD-07). Accept overlap.

### Recommendations

1. Later PR1: try/skip around HINTS `when` + authored-id allow-list on `seen`.
2. Later PR1: `textContent` only; collapse encyclopedia; never `paused`.
3. Later PR1: reparent by node move, not HTML; token class in `hud.css`.
4. Do not claim `save.js` unless a later census proves a cap is required.

### Re-review (Wave 141 pass 3)

Designer fold: hint tokens + same-node live region. No new HIGH/CRITICAL. Reparent fail-closed if `#hud` missing. MEDIUM `seen` skip and WAVE6 retarget unchanged. Markdown only.
