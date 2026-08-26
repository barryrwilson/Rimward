## Security Review: TGT-07 combat cycle leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 130 lands markdown only. Trust boundary is later KeyT sort of live ships plus Agent lock. HIGH/CRITICAL items are frozen in merge law: no `act({name:'target'})`, no persist auto-lock, no Q-ship class pierce, never-throw on missing `ai`, no `for-in`, no pause. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: Agent cheat lock — **resolved in freeze**

**Location:** later `agent-api.js`; live `agent-api.js` **129–150** unknown; `agent-observe.js` **306** reads `targets.current`  
**Issue:** A TGT-07 PR that implemented `act({name:'target'})` without envelope / intent / wrap would let an Agent set any hull, including out of 600 u or an unrevealed Q-ship by hidden class.  
**Impact:** off-keyboard lock; combat cheat; HUD-02 cover leak if class is the pick key.  
**Fix (frozen):** contract §0.18: do not claim `agent-api.js`; do not add `act target`. Later Agent cycle must reuse live `cycleTarget` rules.

#### 🟠 HIGH: Persist god-mode auto-lock — **resolved in freeze**

**Location:** `state.js` WORLD_FIELDS (read-only honor)  
**Issue:** Persisting “always cycle hostiles” or “snap lock to last shooter” would let a hostile save force combat targeting forever.  
**Impact:** owner-looking auto-aim.  
**Fix (frozen):** persist **none**. No new WORLD_FIELDS. No localStorage key.

#### 🟠 HIGH: Q-ship cover pierce — **resolved in freeze**

**Location:** `hud.js` **127–129**, **2417**; HUD-02 cover class  
**Issue:** Ranking by hidden `state.classKey` / `record.classKey` on `qship && !revealed` would unmask a cutter as the “real” hostile class.  
**Impact:** cover identity leak; HUD-02 steal.  
**Fix (frozen):** hostile bit is `ai.intent` only. Cover class stays HUD-02. Cycle must not read hidden class to sort.

#### 🟠 HIGH: Prototype / throw on bad hull — **resolved in freeze**

**Location:** later `cycleTarget`; live `controls.js` **123–127** already skips missing object / destroyed  
**Issue:** `ref.ai.intent` without optional chain, or `for-in` on `ctx.ships`, would throw or pick `__proto__` rows.  
**Impact:** combat input crash; unexpected lock.  
**Fix (frozen):** contract §0.13 / §0.17: never throw; missing `ai` → not hostile; keep index/`for…of` walk; skip non-finite `d2`.

#### 🟠 HIGH: Overlay pause — **resolved in freeze**

**Location:** `overlay-policy.js` never-pause honor  
**Issue:** Cycle handling that wrote `flags.paused` would freeze the sim.  
**Impact:** pause desync.  
**Fix (frozen):** never write `paused`. Cycle is sort only.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent `target` pulse
- [x] No credit / position writers claimed
- [x] Prototype-safe intent bit (no faction table merge)
- [x] Fail-closed never-throw
- [x] Q-ship cover not a sort key
- [x] TGT-03 Incoming toast not a lock writer
- [x] REDMARCH flake not “fixed”

### 🟡 MEDIUM: Intent is a live combat flag, not standing

**Location:** `npc.js` **247**, **1696**; `mayHuntPlayer` **1256–1264**  
**Issue:** Using standing ≤ −10 or pirate **role** would mark non-firing hulls hostile and could be gamed with a faction table.  
**Fix applied:** deputize `ai.intent === true` only. Eligibility stays AI-04.

### 🟡 MEDIUM: `playerHit` shooter would enable silent law (b)

**Location:** `combat.js` **1797**  
**Issue:** Adding `shooter` to `playerHit` “for cycle” creates an attacker-lock channel without a key.  
**Justification / freeze:** do not claim `combat.js`. Law (a) does not need shooter identity.

### 🟢 LOW: `ctx.js` comment already claims hostiles

**Location:** `ctx.js` **88**  
**Issue:** Comment lies; a later reader may skip the sort fix.  
**Justification:** optional PR1 comment; not a trust boundary.

### Recommendations

1. Later PR1: gated `intent` sort in `cycleTarget` only.
2. Do not grow Agent `act` names in this leftover.
3. Do not persist cycle policy.
