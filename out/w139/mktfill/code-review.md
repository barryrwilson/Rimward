# Code Review: Agent market fill leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `marketBlock` posted-only rows (`agent-observe.js` **267–273**), nested `tradeFillUnit` used by pane and `tryTrade` (`station.js` **4692–4714**, **4842–4843**, **4736**, **4745**), and `act trade` already filling through the desk (`agent-api.js` **369–382**). Contract forbids CONSUME, desk rewrite, helper move, TRADE offset retune, duplicate math, observe-side `tryTrade`, persist, and sibling theft. No Blocker/Major remain after REAL/PR1, show-both, peek-not-move, and tight write-set.

### What's done well

- Code-wins inventory with file:line for observe rows, posted helper, fill helper, pane cells, `trade` dispatch, TRADE offset **5**, hardening posted-only pin.
- Playtest “wrong unit if it trusts JSON posted” **matches** posted-only rows + fill desk.
- Pane fill DONE (wishlist **286–288**) is treated as **not** this leftover.
- One law frozen: observe fill buy/sell matching `tradeFillUnit`, keep posted, do not rewrite the desk.
- Nested helper census is honest (not exported). Peek/export deputize avoids a fake import.
- CONSUME path documented and rejected with evidence.
- Badge / TRADE wrap / evade / pad 2B explicitly out.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `agent-observe.js` **267–273**; hardening **318–325**  
**Issue:** Pane fill and `trade` fill exist. That is **not** observe fill. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Comment-only “trade uses fill” as the default fix — **resolved in freeze**

**Location:** inbox “or document”; `postedPrice` comment **243**; `docs/AgentApiDesign.md` **337**  
**Issue:** Agents read JSON, not comments. Frozen: **show both** on the row. Comment-only is not CONSUME.

#### 🔴 Blocker: Desk rewrite / helper move as the fix — **resolved in freeze**

**Location:** `station.js` **4692–4766**, **4830–4856**  
**Issue:** Changing `tryTrade` to posted undoes pane honesty. Moving the helper into `state.js` claims READ-ONLY. Frozen: read live helper; do not move body; pane/TRADE offset out.

#### 🟠 Major: Duplicate fill math in observe — **resolved in freeze**

**Location:** `tradeFillUnit` **4692–4714** (rank, faction, epic, hermit, restricted, fixer)  
**Issue:** A copied formula that omits fixer markup would lie. Frozen: peek/export only.

#### 🟠 Major: Write-set creep into layout / badge / `trade` dispatch — **resolved in freeze**

**Location:** contract §1  
**Issue:** TRADE wrap, badge Manifest overlap, and `agent-api.js` trade tokens are siblings or already live. Frozen: observe + optional pin + allowed read hook only.

#### 🟠 Major: `tradeFillUnit` left nested with no read path — **resolved in freeze**

**Location:** `station.js` **4692** nested; not in export list **1043+**  
**Issue:** A PR that only adds JSON keys cannot match fill without a hook or duplication. Frozen: `peekFillUnit` (default) or export without move, same PR1 as the JSON fields.

#### 🟠 Major: `for-in` prices as row source — **resolved in freeze**

**Location:** `save.js` **86**; contract §0.14  
**Issue:** Save tables are not the authored catalog. Frozen: `COMMODITIES` own keys only.

### 🟡 Minor: Hardening fake ctx will omit fill

**Location:** `agent-api-hardening-test.mjs` **51–104**  
**Issue:** No `stationDesk.peekFillUnit`.  
**Justification:** omit is fail-closed. Keep `posted === 100`. Live fill pin is a different harness.

### 🟡 Minor: AgentApiDesign **337** vs this leftover

**Location:** `docs/AgentApiDesign.md` **337** (honor, not edited)  
**Issue:** Readers of the old table may refuse fill keys.  
**Justification:** new doc + contract win for fill fields only. Do not rewrite AgentApiDesign.

### 🟡 Minor: `postedPrice` vs `priceOf` special cases

**Location:** `agent-observe.js` **242–256**; `station.js` **2064–2069**  
**Issue:** Two helpers.  
**Justification:** observe iterates `COMMODITIES` only; survivor/data never appear. Do not unify in this leftover.

### 💡 Suggestion: Optional PR2 stills

One still: docked Vigil, Digit 1, observe `fillBuy` ≠ `posted` for Provisions, `act trade` qty 1 buy debits `fillBuy`, hub empty, TRADE offset 5, no extra toast.

### 💡 Suggestion: Keep field names `fillBuy` / `fillSell`

Do not name them `buy` / `sell` (collides with `side`).
