# Security Review: Msn05 ore-type guidance leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 137 lands markdown only. Trust boundary is later group-3 KeyT cand collect plus HUD cue copy that read `world.jobs` commodity strings and rock `oreKey` values restored from save. HIGH/CRITICAL items are frozen in merge law: no `innerHTML`, no Agent lock-by-ore, no new persist flag, no prototype keys in the filter set, no pause write, never throw from board/lock/cycle/cue. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via ore / job / cue strings — **resolved in freeze**

**Location:** later `hud.js` cue; live `hud.js` **2637–2638** `textContent`; `station.js` **4544–4547** `textContent`; lock meta **2517–2518**  
**Issue:** `COMMODITIES[key].name` is authored, but `job.commodity` / `job.title` restore from save. A later rewrite that used `innerHTML` / `insertAdjacentHTML` for `Mine · ${oreName}` would execute a tampered name.  
**Impact:** script in the HUD prompt or Jobs pane.  
**Fix (frozen):** contract §0.4: `innerHTML` forbidden; keep `textContent` / `h()`. Do not interpolate save strings into HTML. Paint names only after `Object.hasOwn(COMMODITIES, key)`.

#### 🟠 HIGH: Prototype / reserved commodity keys in the filter set — **resolved in freeze**

**Location:** later `acceptedMiningOreKeys`; live `save.js` mining commodity **394–400**; `controls.js` reservedToken **314–316**  
**Issue:** A filter that did `used.add(job.commodity)` from a hostile save (`__proto__`, `constructor`) could pollute `Set`/`Object` behavior or throw on `COMMODITIES[commodity].name`. Rock `oreKey` is authored at spawn (`asteroids.js` **1898–1905**) but list rows are live objects.  
**Impact:** prototype pollution; uncaught overlay/cycle throw.  
**Fix (frozen):** add a key only if it is a string, not reserved, and `Object.hasOwn(ORE_TYPES)` and `Object.hasOwn(COMMODITIES)`. Skip the job unless `originSystem` is an own `SYSTEMS` key equal to `currentSystem`. Unknown oreKey → non-match / `'ore'` copy; **never throw**.

#### 🟠 HIGH: Agent lock-by-ore / warp cheat — **resolved in freeze**

**Location:** `agent-api.js` `acceptJob` **359–366** (desk, cite only); `agentSelectTarget` `controls.js` **292–312** uses `collectCycleCands`  
**Issue:** A Msn05 PR that implemented `act({ name: 'lockOre', commodity: 'rawOre' })` (or equal) without range / group-3 gates would let an Agent stamp `targets.current` onto any matching rock, including out of envelope, or teleport. Observe already reports `commodity` / `need` (`agent-observe.js` **208–215**).  
**Impact:** off-keyboard lock; possible range skip.  
**Fix (frozen):** contract §0.10: do not claim `agent-api.js`; do not add lock-by-commodity act. If `collectCycleCands` later filters, `agentSelectTarget` **inherits** the same in-range list. Do not add a second cand picker.

#### 🟠 HIGH: Persist god-mode guidance mute — **resolved in freeze**

**Location:** `save.js` WORLD_FIELDS **84–106** `'jobs'` / `'fieldOre'`  
**Issue:** A new persist “oreFilterOff” or sanitize pass that drops mining jobs “to fix hunt” would let a hostile save hush contracts or wipe `fieldOre`.  
**Impact:** owner-looking board/field wipe.  
**Fix (frozen):** persist **none** new. No WORLD_FIELDS. Filter is runtime from accepted jobs. Sanitize cap **unchanged**. Keep proto skip in `sanitizeOneJob` **307–311**.

#### 🟠 HIGH: Overlay pause as “search lock” — **resolved in freeze**

**Location:** `overlay-policy.js` **4**  
**Issue:** Guidance that wrote `flags.paused` while scanning the belt would freeze the sim (CTL-02).  
**Impact:** pause desync.  
**Fix (frozen):** Msn05 cites overlay only. Never write `paused`. Do not pause. Do not teleport.

#### 🟠 HIGH: Uncaught throw from cycle / cue — **resolved in freeze**

**Location:** live `cycleTarget` already try/catch **165–193**; `beltMineDist` **545–584**  
**Issue:** A later `.name` on a missing COMMODITIES key, or `rock.oreKey` on a null row, could throw outside the live catch and blank the HUD.  
**Impact:** overlay/HUD fail closed poorly (uncaught).  
**Fix (frozen):** contract §0.12: never throw from job board / lock / cycle / cue. Unknown → skip / `'ore'` / live fallback.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent lock-by-ore pulse
- [x] Prototype-safe authored keys
- [x] Fail-closed never-throw / fallback rather than infinite loop
- [x] Sanitize cap unchanged
- [x] Unique four not dropped
- [x] `state.js` not claimed
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: `agentSelectTarget` inherits the filter

**Location:** `controls.js` **297** `collectCycleCands`  
**Issue:** After PR1, Agent cycle/id match uses the filtered rock list. An Agent that asked for a brine-ice index while a Raw ore contract is accepted gets `no-service` if that rock is filtered out.  
**Justification:** Same envelope as KeyT. Honest. Do not add a backdoor unfiltered cand list. Documented; not expanded.

### 🟡 MEDIUM: Observe already exposes job `commodity`

**Location:** `agent-observe.js` **208–215**  
**Issue:** External Agent already sees which ore the contract wants.  
**Justification:** Live observe; cite only. Msn05 must not add a new observe field that points at a rock id as a cheat.

### 🟢 LOW: Cue copy round-trips authored names only

**Location:** contract §0.1 cue uses `COMMODITIES[nearestMatch.commodity].name`  
**Issue:** If hasOwn fails, copy is `'ore'`.  
**Justification:** fail-closed generic; keep it.

### Recommendations

1. Later PR1: authored key set from accepted mining at current origin; T-filter; named `textContent` cue; fallback; never throw.
2. Do not add WORLD_FIELDS.
3. Do not add Agent lock-by-ore.
