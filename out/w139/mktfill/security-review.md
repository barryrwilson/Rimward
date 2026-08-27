# Security Review: Agent market fill leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 139 lands markdown only. Trust boundary is later observe JSON that reads authored commodity keys plus a **read-only** desk peek of live `tradeFillUnit`, while `world.prices` restore from save. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no `for-in` prices, no persist god-mode fill mute, no observe-side `tryTrade` sample, prototype/reserved keys drop, never throw, no credit grant. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via commodity / name strings — **resolved in freeze**

**Location:** later `agent-observe.js` `marketBlock`; live pane `station.js` **4844** `h()` `textContent`; `COMMODITIES[key].name` authored (`state.js` **350–364**)  
**Issue:** Observe is JSON today. A later HUD/badge/toast that used `innerHTML` / `insertAdjacentHTML` for `row.name` or a fill label would execute a tampered string if anyone copied save fields into names.  
**Impact:** script in station overlay or agent chrome.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; pane stays `h()` `textContent`. Observe stays JSON. Names only after `Object.hasOwn(COMMODITIES, key)` and `str(own(com, 'name'))`.

#### 🟠 HIGH: Prototype / reserved keys from `world.prices` — **resolved in freeze**

**Location:** later fill read; live `postedPrice` already `hasOwn` (`agent-observe.js` **247**); save `'prices'` `save.js` **86**  
**Issue:** A fill builder that did `for (const key in ctx.world.prices)` (or copied `__proto__` / `constructor`) would pollute rows or throw on `.base`.  
**Impact:** prototype pollution; uncaught observe throw; attacker-named “commodities”.  
**Fix (frozen):** never `for-in` `world.prices`. Rows from authored `COMMODITIES` own keys only. `reservedName` skip. Unknown skip. `hasOwn(COMMODITIES)` required.

#### 🟠 HIGH: Observe samples fill by executing `desk.trade` — **resolved in freeze**

**Location:** live `tryTrade` mutates credits/cargo (`station.js` **4736–4754**); `agent-api.js` **382**  
**Issue:** A PR that “discovered” fill by buying qty 1 and rolling back (or not) would debit UU, bump hermit milestone, or desync hold.  
**Impact:** god-mode probe / credit theft / persist milestone.  
**Fix (frozen):** `peekFillUnit` is read-only; must not call `tryTrade`. Observe must not invoke `desk.trade` to sample fill.

#### 🟠 HIGH: Persist god-mode fill mute / price rewrite — **resolved in freeze**

**Location:** `save.js` WORLD_FIELDS **86** `'prices'`  
**Issue:** A new persist “agentUsePosted” or sanitize pass that overwrites live prices with fill (or zeros fill modifiers) would let a hostile save hush scarcity or print UU.  
**Impact:** owner-looking economy cheat.  
**Fix (frozen):** persist **none** new. No WORLD_FIELDS. `state.js` READ-ONLY. Do not retune `HERMIT` / epic / rank. Fill is runtime from the live helper.

#### 🟠 HIGH: Uncaught throw from observe fill — **resolved in freeze**

**Location:** live `buildObservation` already try/catch (`agent-observe.js` **495–497**); later peek  
**Issue:** A later `.peekFillUnit` on a missing desk, or `Math.round` on `undefined`, could throw before the catch if someone hoists work, or poison `ok: true` snapshots with `NaN` (`JSON.stringify` → `null`).  
**Impact:** observe fail-closed poorly; agents treat `null` fill as free.  
**Fix (frozen):** never throw from `marketBlock` / peek. Non-finite → **omit**. Missing hook → omit fill, keep posted. Wrap peek in try/catch.

#### 🟠 HIGH: Duplicate fill math drift as a cheat surface — **resolved in freeze**

**Location:** nested `tradeFillUnit` `station.js` **4692–4714** vs later observe  
**Issue:** Copied multipliers that omit fixer / hermit buy-trust would show a cheap JSON fill while `tryTrade` charges more (or the reverse). That is the inbox hole in a new shape.  
**Impact:** wrong-unit trades; agents “budget” a lie.  
**Fix (frozen):** do not duplicate math. Read live helper without moving it. Peek/export only.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No observe-side trade sample
- [x] Prototype-safe authored keys
- [x] Fail-closed never-throw / omit rather than NaN
- [x] No WORLD_FIELDS
- [x] `state.js` not claimed
- [x] `trade` act not rewritten
- [x] REDMARCH flake not “fixed”
- [x] No in-repo LLM / page WS / API key

### 🟡 MEDIUM: Fake-ctx hardening has no desk peek

**Location:** `scripts/agent-api-hardening-test.mjs` **51–104**, **313–325**  
**Issue:** After PR1, fake ctx without `peekFillUnit` omits fill. Pins must keep `posted === 100` and must not require fill on that stub.  
**Justification:** fail-closed omit is correct. Live desk pin belongs in boot-test or a desk stub. Documented; not expanded.

### 🟡 MEDIUM: AgentApiDesign **337** still says posted-only shape

**Location:** `docs/AgentApiDesign.md` **337** (honor, not edited)  
**Issue:** Later fill fields drift from the v1 example. Hostile readers may refuse PR1 or implement a second observe shape.  
**Justification:** leftover doc + contract win for fill fields. Do not edit AgentApiDesign in this pack. Owner may copy the row shape later.

### 🟢 LOW: `postedPrice` does not call exported `priceOf`

**Location:** `agent-observe.js` **242–256** vs `station.js` **2064–2069**  
**Issue:** survivor/data special cases live in `priceOf`; those keys are not in `COMMODITIES`, so rows never include them.  
**Justification:** same authored key set as the pane (`COMMODITY_KEYS`). Not a hole. Do not iterate `priceOf` over `world.prices`.

### Recommendations

1. PR1: authored keys + peekFillUnit read-only + omit non-finite + keep posted.
2. Pin fill ≠ posted on a hermit/epic dock. Do not change TRADE offset 5.
3. Do not spawn Vite/Chrome in the leftover pack.
