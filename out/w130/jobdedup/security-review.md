# Security Review: Msn04 job-posting identity leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 130 lands markdown only. Trust boundary is later `world.jobs` mint plus credit pay on mining complete, plus Digit-index accept, plus save restore of job blobs. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no Agent accept cheat, no new persist flag, no sanitize drop of accepted/unique-four, no prototype id merge, omit rather than infinite reroll. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via ore / station / title strings — **resolved in freeze**

**Location:** later `renderJobs`; live `station.js` **4464–4468** `textContent`; `makeMiningJob` **2283–2284**; `jobText` in `save.js` **287–290**  
**Issue:** `COMMODITIES[key].name` is authored, but `job.title` / `job.detail` restore from save (`sanitizeOneJob` still keeps title/detail). A later rewrite that used `innerHTML` / `insertAdjacentHTML` would execute a tampered title.  
**Impact:** script in the dock Jobs pane.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `h()` `textContent`. Do not interpolate save strings into HTML.

#### 🟠 HIGH: Pay duplication via identical offered twins — **resolved in freeze**

**Location:** `syncMiningJobs` **2293–2314**; accept mining **4831–4840**; complete **3960–3976** (`credits += pay`)  
**Issue:** Two offered cards with the same commodity, need 4, and same `payQuoted` can both be accepted (distinct ids). Player delivers 4 + 4 of the same ore and is paid twice at the same rate. Inbox twins are the mint that enables this.  
**Impact:** credit duplication vs one intended posting.  
**Fix (frozen):** PR1 identity uniqueness so two live mining cards at one origin do not share commodity (except pre-existing accepted pairs, which PR1 must not rewrite). Do not add a second payout path. Keep failed-first complete (`3960–3961`) so a crash mid-replace cannot pay twice.

#### 🟠 HIGH: Sanitize / persist god-mode board — **resolved in freeze**

**Location:** `save.js` WORLD_FIELDS **80–83** `'jobs'`; `sanitizeJobs` **783–850**; `JOBS_SANITIZE_MAX` **133–142**  
**Issue:** A new persist “dedup mute” or a sanitize pass that drops unique four / accepted jobs “to fix twins” would let a hostile save empty the board or hush contracts. Extra-family drop today is same origin+**slot**, not commodity (`606–635`). Raising/lowering the cap or adding `jobs[id] =` would reopen prototype pollution.  
**Impact:** owner-looking board wipe; persist pollution.  
**Fix (frozen):** persist **none** new. No WORLD_FIELDS. Sanitize cap **unchanged**. Twin heal is runtime offered remint in `station.js`, never “drop accepted”. Keep proto/`__proto__` skip in `sanitizeOneJob` **307–311**. Never `jobs[id] =`.

#### 🟠 HIGH: Agent cheat job-accept — **resolved in freeze**

**Location:** `agent-api.js` **129–150** unknown; live accept is Digit 2 pane `station.js` **6230–6232**  
**Issue:** A Msn04 PR that implemented `act({ name: 'acceptJob' })` (or equal) without dock / offered / Digit-index gates would let an Agent stamp `payQuoted` and front cargo off the desk.  
**Impact:** off-keyboard accept; possible double-accept of twins before uniqueness lands.  
**Fix (frozen):** contract §0.10: do not claim `agent-api.js`; do not add job-accept act.

#### 🟠 HIGH: Prototype / reserved commodity keys — **resolved in freeze**

**Location:** `makeMiningJob` **2273–2274**; `sanitizeOneJob` mining commodity **394–399**; `reservedId` on commodity  
**Issue:** A pick that read save-supplied keys (or `for-in` on a job blob) could mint `__proto__` / `constructor` ids or throw on `COMMODITIES[commodity].name`. `nextMiningId` prefixes `mine-${sysId}-` from `SYSTEMS` keys, not attacker strings, if `sysId` is hasOwn-gated (**2270**, **2245**).  
**Impact:** prototype pollution on jobs array; throw → uncaught overlay.  
**Fix (frozen):** pick only `MINING_ORE_KEYS` (hardness-1 ∩ `COMMODITIES`). Unknown commodity → `null` card / paint `'ore'`; **never throw**. Bounded reroll; omit if exhausted. Keep live id tokenizer.

#### 🟠 HIGH: Overlay pause as “board lock” — **resolved in freeze**

**Location:** `overlay-policy.js` **4**  
**Issue:** Dedup handling that wrote `flags.paused` would freeze the sim (CTL-02).  
**Impact:** pause desync.  
**Fix (frozen):** Msn04 cites overlay only. Never write `paused`.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent job-accept pulse
- [x] Credit writer claimed only as “do not retune / keep failed-first”
- [x] Prototype-safe authored commodity keys
- [x] Fail-closed never-throw / omit rather than infinite loop
- [x] Sanitize cap unchanged
- [x] Unique four not dropped
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Pre-PR1 accepted twin pair can still double-pay

**Location:** contract §0.1 “two accepted same-commodity stay”  
**Issue:** A save already holding two accepted Raw ore mining jobs still pays twice.  
**Justification:** dropping accepted jobs is the worse persist hole. Heal offered only. Documented owner question #2.

### 🟡 MEDIUM: `Math.random` pick is not cryptographic

**Location:** `pickMiningCommodity` **2241**  
**Issue:** Predictable rolls.  
**Justification:** game board flavor, not a secret. Do not swap in `crypto.getRandomValues` as a fake security fix. Identity uniqueness is the control.

### 🟢 LOW: Title/detail from save still round-trip

**Location:** `sanitizeOneJob` **361–363**  
**Issue:** Paint prefers live `Mine ${oreName}` for `kind === 'mining'` (**5150–5156**), so tampered titles are overwritten on the Jobs pane. Detail too.  
**Justification:** keep that rewrite; do not start trusting save title as HTML.

### Recommendations

1. Later PR1: exclusion set from live mining at origin; bounded pick; omit; offered-twin heal; `textContent` only.
2. Do not sanitize-drop by commodity.
3. Do not add Agent accept.
