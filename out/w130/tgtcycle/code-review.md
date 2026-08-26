## Code Review: TGT-07 combat cycle leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `controls.js` **114–142** (`d2` only), no attacker-lock binding, TGT-03 toast without selection, and HUD contacts already ranking `ai.intent` for display. Contract forbids CONSUME, dual law, new key, Incoming toast lock, Agent `act target`, HUD layout steal, persist auto-lock, and Q-ship pierce. No Blocker/Major remain after one-law freeze, envelope-vs-bubble gate, and intent-not-role.

### What's done well

- Code-wins inventory with file:line for gather, sort, wrap, KeyT pulse, KeyV kinds, Incoming toast, `playerHit`, `ai.intent`, `flags.combat`, contacts sort, Q-ship cover, Agent unknown.
- Playtest “third press” **matches** d2 wrap; `ctx.js` **88** “nearest hostiles” **disproved**.
- TGT-06 CONSUME cited as a **prior** leftover; this pack is a **new** inbox hole, not a PPI revival.
- One law frozen: (a) not (b). Prefer cycle order as the owner asked.
- Hostile bit reused from HUD contacts / AI-04 — no new faction table.
- Gate uses 600 u envelope, not 800 u combat bubble alone.
- CONSUME path documented and rejected with evidence.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `controls.js` **139**; TRACKED **46–53**  
**Issue:** TGT-03 Incoming fire. exists. HUD contacts rank hostiles. That is **not** KeyT order. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Dual law in PR1 — **resolved in freeze**

**Location:** inbox “or add a target my attacker key”; honor one law  
**Issue:** Shipping sort **and** a new key (or skip-to-attacker + sort) is two products. Frozen: law (a) only. Law (b) is a later owner replace, not a stacked PR1.

#### 🟠 Major: Hostile defined from role / save bit / standing — **resolved in freeze**

**Location:** `save.js` **1025–1028**; `npc.js` **1256–1264**  
**Issue:** `ai.hostile` is not `makeAi`. Role pirate without intent is a fleeing hull. Standing is eligibility. Frozen: `ai.intent === true`.

#### 🟠 Major: Gate = `flags.combat` only — **resolved in freeze**

**Location:** `npc.js` **2680–2684** (`ENCOUNTER_BUBBLE` 800) vs `TARGET_RANGE` 600  
**Issue:** Combat flag can be true for a hostile outside the T list, or disagree with who T can select. Frozen: gate on **in-envelope candidates**.

#### 🟠 Major: Incoming toast as selector — **resolved in freeze**

**Location:** `npc-fire-toast.js` **8–64**; TGT-03  
**Issue:** Using the warning channel to set `targets.current` steals TGT-03 and lacks a shooter id. Frozen: do not claim toast / `playerHit`.

#### 🟠 Major: Write-set creep into `hud.js` / `npc.js` — **resolved in freeze**

**Location:** contacts sort `hud.js` **1738–1751** already hostiles-first  
**Issue:** “Align HUD and T” by rewriting contacts is HUD-07. Frozen: later writer is `cycleTarget` (+ help / ctx comment).

### 🟡 Minor: Wrap from an existing friendly lock may still pass other non-hostiles

**Location:** contract wrap = live `(idx + 1) % n`  
**Issue:** Playtest from **empty** is fixed. From a hauler lock, next T may not be the ace on the first extra press.  
**Justification:** skip-to-attacker is law (b). Documented in player outcome. Owner may override after playtest.

### 🟡 Minor: JS `Array.sort` stability on equal `d2`

**Location:** later sort comparator  
**Issue:** Two ships at the same range may swap order vs live scan.  
**Justification:** live sort is already unstable on ties. Do not add an id tie-break (could leak record keys).

### 🟡 Minor: Help line optional

**Location:** `controls.js` **406** `'T — cycle target'`  
**Issue:** Behavior can change while help stays silent.  
**Justification:** deputize **include** help update; owner may keep the short line.

### 💡 Suggestion: Optional PR2 stills

One still: empty lock, ace 59 u, nearer hauler, first T = ace, hub empty, Incoming fire. still present, no new key overlay.

### 💡 Suggestion: Keep contacts HUD sort as the **display** twin

Do not merge the two sorters. Cycle stays controls. Arc stays HUD.
