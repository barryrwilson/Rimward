# Code Review: Msn05 ore-type guidance leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live named mining titles (`station.js` **2324**, **5244**), unfiltered group-3 `collectCycleCands` **140–146**, and `Mine · belt` cue `hud.js` **2616**. Contract forbids CONSUME, field-marker mesh, MATCH reuse, MSN-04 remint, band-weight retune, Agent lock-by-ore, persist mute, and `innerHTML`. No Blocker/Major remain after T-filter + named cue + fallback, mining-accepted gate only, and later write-set limited to `controls.js` collect + `hud.js` cue.

### What's done well

- Code-wins inventory with file:line for mint copy, band weights, KeyT collect, cue, lock card, `mineBlocked`, AST-02 arrival, MATCH lamp, save mining, Agent observe `need`/`commodity`.
- CONSUME path documented and rejected: named Jobs card is not a field filter.
- Playtest brine ice / slag iron 434 u mapped to live nearest-then-next cycle + mixed `ORE_BAND_WEIGHTS`, not a missing title.
- MSN-04 cited as **live** and **not** the hole; AST-02 cited as region find, not match.
- Smaller freeze deputized (HUD/cycle) over a new marker type.
- Partial merge named: cue without T-filter leaves the hunt.
- Fail-closed fallback vs empty cycle named before impl.
- TGT-07 hostiles-first explicitly kept.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `station.js` **2324** vs `controls.js` **140–146**  
**Issue:** Jobs already say `Mine Raw ore`. That is half of the CONSUME test. Find-without-lock is missing. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: KeyT still hunts mixed ores — **resolved in freeze**

**Location:** `collectCycleCands` **140–146**; `cycleTarget` **186–190**  
**Issue:** Group 3 pushes every rock in 600 u, sorted by `d2`. Frozen: accepted-job key set filters rocks when any matching `ore > 0` exists in the field.

#### 🟠 Major: Cue without filter (or filter without cue) — **resolved in freeze**

**Location:** `hud.js` **2611–2617**; contract §2  
**Issue:** `Mine · belt` after a Raw ore accept still points at nearest any rock (often brine ice). Frozen: same PR names the ore **and** filters T. Partial merge forbidden.

#### 🟠 Major: Fallback missing would empty T — **resolved in freeze**

**Location:** later filter; livingRock weight **5** (`state.js` **549**)  
**Issue:** An accepted Living rock card with zero remaining units must not leave the player with a dead cycle and a lying cue. Frozen: fall back to live belt + all-rock when no matching `ore > 0` remains.

#### 🟠 Major: Marker mesh / MATCH / band retune scope — **resolved in freeze**

**Location:** honor; inbox **201–206**; `hud.js` **389** MATCH; `state.js` **548–554**  
**Issue:** Easy steal. Frozen: no new world object; MATCH stays MATCH; no `ORE_BAND_WEIGHTS` write; no MSN-04 remint; no automine.

#### 🟠 Major: Filtering offered jobs or KeyV as required PR1 — **resolved in freeze**

**Location:** contract §0.1 When / KeyV  
**Issue:** Offered cards are still on the desk; filtering flight targeting would surprise. KeyV-under-glass skip is a different honesty question. Frozen: accepted only; KeyV free in PR1 (optional PR3).

#### 🟠 Major: TGT-07 hostiles-first steal — **resolved in freeze**

**Location:** `cycleTarget` **171–184**  
**Issue:** A sort that put matching rocks before intent ships would reopen combat cycle. Frozen: filter rock membership only; hostile gate unchanged; rocks stay non-hostile.

### 🟡 Minor: Job detail already says “Cut reachable {ore}”

**Location:** `station.js` **2325**, **5245**  
**Issue:** Board copy already names the ore in the field.  
**Justification:** That is identity/copy, not targeting. Do not CONSUME. Do not rewrite detail as the PR1 fix.

### 🟡 Minor: Contacts arc is ships-only

**Location:** `hud.js` **1728–1754**  
**Issue:** Inbox said “scanner filter”. Live scanner arc is not rocks.  
**Justification:** Mapping to group-3 KeyT is the live targeting scanner analog. Dumping rocks onto the arc would steal Wave F / HUD-07. Frozen: do not claim contacts.

### 🟡 Minor: `agentSelectTarget` shares collect

**Location:** `controls.js` **297**  
**Issue:** Filter applies to Agent cycle too.  
**Justification:** One cand list. Security review accepts. Do not fork an unfiltered Agent path.

### 🟡 Minor: Two accepted mining jobs union

**Location:** contract key set  
**Issue:** Cue names nearest match, which may be Living rock while the player wanted the Raw ore card first.  
**Justification:** Honest. Owner question #2. Do not invent a Digit to pick which ore to hunt.

### 💡 Suggestion: Shared helper name

`acceptedMiningOreKeys(ctx)` keeps `controls.js` and `hud.js` on one gate. Duplicate 20-line scans are allowed if a shared module would claim `state.js`.

### 💡 Suggestion: Optional PR2 still

One still: Freehold, accepted Raw ore, group 3, cue `Mine · Raw ore`, first rock lock `rawOre`, hub empty, MATCH still MATCH, no pause.
