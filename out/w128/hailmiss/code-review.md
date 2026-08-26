## Code Review: Hail02 miss-feedback leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `hail.js` **652–667**, `hud.js` demand-only `hailOpened`, silent KeyJ, and no KeyH→Fear write. Contract forbids CONSUME, fake cards, overlay pause, Agent hail, HUD layout steal, Hail01 retune, persist mute, and `innerHTML`. No Blocker/Major remain after KeyJ include, linger-key-without-distance, primitive event fields, and skip-list (title/open card/success).

### What's done well

- Code-wins inventory with file:line for every gate (`playSurfaceBlocked`, `canOpenPlayCard`, `hailCalmOk`, `canHailDisabled`).
- Playtest Fear claim **disproved** (`npc.js` hailPressed = 0; `bumpFear` not on press) and then locked so PR1 cannot “fix” it by writing Fear.
- Hail01 Honor reservation cited; Wave 127 demand path not reopened.
- Dock/jump included **because** census is silent, with write-set still `hail.js` (observe leftover `dockPressed` after station/gate).
- HUD-04 linger reused; no second toast stack.
- CONSUME path documented and rejected with evidence.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `hail.js` **652–667**; `hud.js` **682–686**  
**Issue:** Salvage success card exists. That is not named miss. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Silent `allow === false` hole unnamed — **resolved in freeze**

**Location:** `hail.js` **654–667**  
**Issue:** Overlay/calm/surface refuse continued with no emit. Contract deputize covers overlay/calm; surface skip is intentional (title/settings).

#### 🟠 Major: Linger flood if distance is in the key — **resolved in freeze**

**Location:** `hud.js` **1293–1317**  
**Issue:** `{n} u` changes each press. Frozen: key omits distance.

#### 🟠 Major: KeyJ omit vs inbox — **resolved in freeze**

**Location:** `station.js` **6321–6330**; `gate.js` **678–679**; honor “include only if silent”  
**Issue:** Census is silent. Frozen: KeyJ miss **in PR1**, no remap, no snap rewrite.

#### 🟠 Major: Event payload `ship` vs Agent observe — **resolved in freeze**

**Location:** `agent-schema.js` **84** hailOpened never keeps ship  
**Issue:** A miss event carrying `ship` would leak a live hull into later observe harvest. Frozen: primitives only.

#### 🟠 Major: Fake card / Hail01 collision — **resolved in freeze**

**Location:** `hail.js` `openCard`; HUD demand key `warn|demand|{name}`  
**Issue:** Opening a dummy hail or reusing demand keys would steal Hail01. Frozen: no fake card; miss keys `warn|hailmiss|*`.

### 🟡 Minor: HUD bargain prompt still lies until a later owner override

**Location:** `hud.js` **2394–2396**  
**Issue:** `H — Hail` on live bargain while KeyH cannot open that card.  
**Justification:** HUD-07 / layout steal if rewritten here. PR1 toast `{name} — no hail` is the additive. Open owner question #3.

### 🟡 Minor: `berthHeld` jump stays silent by default

**Location:** `gate.js` **678**; `overlay-policy.js` **187–193**  
**Issue:** Jump under berth hold is silent.  
**Justification:** CTL-03 sibling. Contract default: skip toast.

### 🟡 Minor: Jump dest not a “contact”

**Location:** inbox “unseen or unselected contact”  
**Issue:** Jump miss names dest/gate, not a ship lock.  
**Justification:** subject is the jump target the player asked for, not a random hull.

### 💡 Suggestion: Optional PR2 stills

Skippable after playtest. Do not block PR1.

### 💡 Suggestion: Shared name helper with Hail01 `demandToastName`

Keep the helper in `hail.js` so HUD never sees a hull. Do not rewrite all commLine `from` (HUD-04).
