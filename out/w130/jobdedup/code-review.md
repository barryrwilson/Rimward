# Code Review: Msn04 job-posting identity leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `pickMiningCommodity` **2238–2242**, `syncMiningJobs` **2293–2314**, `nextMiningId` ids-only, and sanitize extra-**slot** not extra-commodity. Contract forbids CONSUME, id merge, unique-four hide, pay retune, scanner steal, Agent accept, persist mute, and `innerHTML`. No Blocker/Major remain after mining-only PR1, omit-if-exhausted, offered-twin heal, bounded pick, and replace-path exclusion.

### What's done well

- Code-wins inventory with file:line for pick, fill, replace, Digit 2 paint, sanitize extra, and family twin table.
- Playtest “jobs 8 and 9” mapped to `boardJobs` index, not `mine-*-n`.
- 784 UU derived from live book (`4 * 140 * 1.4`), not a magic inbox number.
- MSN-01 replacement cited as **live** and **not** the hole; replace still needs exclusion.
- Other families (trade/passenger/explore) documented; PR1 still mining-only so optional PR2s are not stolen.
- CONSUME path documented and rejected with evidence.
- Fail-closed omit vs infinite reroll named before impl.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `station.js` **2238–2242**, **2293–2314**  
**Issue:** Distinct ids exist. That is not player-visible uniqueness. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Slot fill ignores commodity — **resolved in freeze**

**Location:** `syncMiningJobs` **2306–2313**  
**Issue:** Count/slot only. Contract deputize excludes sibling live commodity and heals offered twins.

#### 🟠 Major: Replace path would keep the hole — **resolved in freeze**

**Location:** `replaceMiningJob` **2341–2342**; complete/expire **3932–3977**  
**Issue:** Replacement calls `makeMiningJob` with no exclusion, so MSN-01 can mint a twin of the remaining slot. Frozen: same helper on fill **and** replace (partial merge forbidden).

#### 🟠 Major: Table size 1 would recreate twins — **resolved in freeze**

**Location:** `pickMiningCommodity` **2239–2240** empty → `'rawOre'`; live table size 2  
**Issue:** Forced fill to 2 slots with one legal key is the inbox bug. Frozen: omit the second card.

#### 🟠 Major: Infinite reroll — **resolved in freeze**

**Location:** later pick loop  
**Issue:** `while (pick === sibling)` with a size-1 table never exits. Frozen: `length + 2` attempts, then omit.

#### 🟠 Major: Unique-four / pay / scanner scope — **resolved in freeze**

**Location:** honor; inbox **187–192** (ore guidance, other item); `makeJobs` **2098–2130**  
**Issue:** Easy steal. Frozen: mining helpers only; pay formula untouched; no scanner; no unique-four splice.

#### 🟠 Major: Sanitize commodity drop — **resolved in freeze**

**Location:** `save.js` **606–635**, **810**  
**Issue:** Extending extra-family drop from slot to commodity could delete accepted or unique-four under cap pressure. Frozen: cap unchanged; heal is runtime offered remint.

### 🟡 Minor: Passenger rows are always identical

**Location:** `makePassengerJob` **2796**; two slots **2820–2827**  
**Issue:** Authored twins (`Escort passengers` ×2).  
**Justification:** Not the playtest hole. Optional PR2 skip. Owner question #1.

### 🟡 Minor: Trade `TRADE_SEED` double-weights provisions

**Location:** `station.js` **248**  
**Issue:** P(provisions) = 1/2 per card; twins likely.  
**Justification:** Documented; not PR1. Do not retune seed here (would be a stealth economy change).

### 🟡 Minor: Explore `slot % lms.length`

**Location:** **2866–2869**  
**Issue:** One landmark → two `Survey ${same}` cards.  
**Justification:** Optional PR2. Landmark wrap is a feature for slot indexing, not this leftover.

### 🟡 Minor: `makeMiningJob` assumes `COMMODITIES[commodity].name`

**Location:** **2274**  
**Issue:** Throw if pick ever returns a missing key.  
**Justification:** Frozen fail-closed `null` on missing hasOwn. Live table is gated **249–252**.

### 💡 Suggestion: Optional PR2 stills / other families

Skippable after playtest. Do not block PR1.

### 💡 Suggestion: Shared exclude helper name

`pickMiningCommodityExcluding(used)` keeps `makeMiningJob` and replace on one path. Do not fork a second random call in `syncMiningJobs` only.
