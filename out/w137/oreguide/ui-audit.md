# UI Audit: Msn05 ore-type guidance leftover integrator

### Summary

No product UI ships in Wave 137. Audit is of the live group-3 find path and later match guidance. Blocker/Major UI holes in **live** play (KeyT nearest brine ice; cue says `belt` while the contract says Raw ore) are accepted as leftover **REAL** and frozen as PR1 named cue + T-filter. Color-only distinction, MATCH-as-ore, field-marker mesh, hub pip, and contacts-arc rocks are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Live lock card already names the ore in **text** after lock (`hud.js` **2496–2511**). Inbox called it good. PR1 keeps it.
- Live `mineBlocked` toast already uses authored lines (`hud.js` **660–664**). Inbox called it good. PR1 keeps it.
- Jobs pane already uses `h()` `textContent` and `Mine ${oreName}` (`station.js` **4544–4547**, **5244**). Color is not the only cue on the desk.
- Group-3 cue already occupies the **one** context prompt slot. Later named copy can ride that slot. Dock / Jump / Hail / Target still win (`hud.js` **2572–2617**).
- Digit 2 stays Jobs. No new Digit. HUD-01 hub stays empty.
- `reducedMotion`: no new animation in the freeze.
- MATCH lamp stays the word MATCH on SPD (`hud.js` **389**). Ore guidance does not steal it.

### Findings

#### 🔴 Blocker: Lock-one-at-a-time hunt — **resolved as later mint**

**Location:** live `collectCycleCands` `controls.js` **140–146**; cue `hud.js` **2616**  
**Issue:** After `Mine Raw ore`, first T-lock can be brine ice; next can be slag iron at 434 u. Type waits for the lock card.  
**Fix:** PR1 T-filter + `Mine · Raw ore Nu`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Color-only or MATCH-as-ore cue — **resolved in freeze**

**Location:** honor a11y / MATCH `hud.js` **389**, **2274**  
**Issue:** Tinting the MATCH lamp, the belt cue, or rock meshes by ore without naming the ore would fail color-not-only and steal MATCH.  
**Fix:** name the **ore** in cue text. Color is extra, not the only cue. MATCH stays MATCH.

#### 🟠 Major: Field marker / hub pip / chart ore mark — **resolved in freeze**

**Location:** HUD-01 hub; Wave F contacts `hud.js` **1728–1754**; AST find-aid  
**Issue:** A new world marker, hub PPI, or chart pip would flatten hierarchy onto HUD-01 / HUD-07 / AST-02. Inbox allowed a marker; honor prefers HUD/filter.  
**Fix:** reuse the existing prompt slot. No new mesh. No contacts-arc rocks.

#### 🟠 Major: Unlock-all ore names on every rock — **resolved in freeze**

**Location:** lock card **2489–2511**  
**Issue:** Painting `Raw ore` on every unlocked rock would make the lock card redundant and flood glance text. Inbox said type after lock is the current tell; the ask is **filter or marker**, not a second lock card.  
**Fix:** keep lock-gated names. Guidance is cycle membership + one cue line.

#### 🟠 Major: Remap KeyT / new Digit / pause chrome — **resolved in freeze**

**Location:** TGT-07 `cycleTarget` **171–184**; Digit 2 `station.js` **189**  
**Issue:** A “next matching ore” key or Digit 3 Jobs-for-ore would steal TGT-07 and the dock map.  
**Fix:** keep KeyT. Filter membership. Digit 0/8/9 stay. Digit 2 stays Jobs. Do not pause.

### 🟡 Minor: KeyV can still lock brine ice

**Location:** `controls.js` **35**, **269–271**  
**Issue:** Player who aims at a wrong rock still locks it.  
**Justification:** Glass stays honest. Optional PR3. Cue + T close the inbox hunt.

### 🟡 Minor: Cue `pKey` stays `3`

**Location:** `hud.js` **2615**  
**Issue:** Prompt key is weapon group 3, not T. Player still taps T to cycle.  
**Justification:** Live AST-02 pattern. Do not steal the slot for a second verb. Named ore in `pVerb` is the new tell.

### 🟡 Minor: Distant match leaves T without rocks

**Location:** `U.TARGET_RANGE` 600 vs cue range across the field  
**Issue:** Cue may read `Mine · Raw ore 800u` while T only cycles ships.  
**Justification:** Player flies the named range (same as today’s `Mine · belt 800u`). Do not silently T-lock brine ice to “give a rock”.

### 🟡 Minor: Fallback belt copy when Living rock is gone

**Location:** contract fallback  
**Issue:** Cue returns to `Mine · belt Nu` after the last matching unit.  
**Justification:** Honest empty-of-contract-ore. Owner question #3. No new toast flood.

### 💡 Suggestion: Optional PR2 still

One still: Freehold Digit 2 accept Raw ore, undock, group 3, cue names Raw ore, first T rock lock is rawOre, lock card still names it, MATCH still MATCH, hub empty, no pause, unique four still on the board when redocked.

### 💡 Suggestion: Do not add “H1 only” chrome

Mining jobs are already hardness-1. Naming the ore is enough. Do not print laser tier on the cue.
