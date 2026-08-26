## Code Review: Wave 126 Agent API leftover freeze (design docs)

### Summary
Census after Wave 125 matches the draft architecture. Leftover is **REAL**. Named serial is **PR1** (observe handle), not CONSUME / none. Contract wins. Blocker/Major items found in the draft were frozen in merge law (hold token, AM steal, equal-length token compare, observe allowlist, badge not hub). No remaining Blocker/Major.

Method: self-applied `reviewer.md` + orchestrator `code-review.md` against live `src/` line cites vs this pack.

### What's done well
- Handle-first, same schema later on 127.0.0.1 CDP. No HTTP in PR1.
- Inner loop stays AP/AM/controls. Outer loop is `observe()` + `act({ v, name, args })`.
- `__ctx` stays debug (`src/main.js` **79**). Ownership of `ctx.input` stays `controls.js` (`src/core/ctx.js` **15**).
- Empty `e.code` is named PR4, not a silent TRACKED weaken in PR1.
- Pad approach is an explicit v1 non-goal. Dock reuses `station.js` **6321–6330**.
- Wave 125 `berthHold` is cited and not stolen. Digit 0/8/9 stay. HUD-01 hub stays empty.
- Owner locks 1A/2A/3A/4C/5/pause A are not reopened.

### Findings

#### 🔴 Blocker (resolved in freeze): CONSUME vs live census

**Location:** leftover status; grep `window.rimward` in `src/`  
**Issue:** Census must prove a versioned handle with observe+intents before CONSUME. Live code has none.  
**Fix:** Freeze leftover **REAL**, named serial **PR1**.  
**Status:** resolved.

#### 🟠 Major (resolved in freeze): Wave 125 line-cite drift

**Location:** prior inventory overlay **7 / 83–91 / 175–185**; gate **678**; AM latch  
**Issue:** Wave 125 added `berthHeld` / `setBerthHold` (`overlay-policy.js` **187–204**), gate emit skip (`gate.js` **678**), AP hypot latch on hold (`autopilot.js` **153–177**), ship skip (`ship.js` **754**). Automine still latches **chart only** (`automine.js` **169–171**).  
**Fix:** Inventory rev 3 + contract law 20. PR3 latches **`optIn` only**. Do not add `berthHold` to automine.  
**Status:** resolved.

#### 🟠 Major (resolved in freeze): `act` vs live `berthHold`

**Location:** `src/core/ctx.js` **211**; `src/game/autopilot.js` **395–398**  
**Issue:** Without a freeze, PR2 `engageAutopilot` could arm a flying flag under the records desk. Hold is not KeyP. Mapping onto `paused` would steal LOAD (Wave 28).  
**Fix:** `token: 'held'` for `act` except ping/disable. Never write hold. Never impersonate pause.  
**Status:** resolved.

#### 🟠 Major (resolved in freeze): Same-tab watch vs hypot

**Location:** `src/systems/controls.js` **380–383**, **461–478**; `autopilot.js` **176–177**  
**Issue:** Draft already named PR3 latch. Copy that called the canvas a watch surface in PR1 would lie.  
**Fix:** Contract law 8; watch claim starts at PR3.  
**Status:** resolved (already in draft; restated).

#### 🟠 Major (resolved in freeze): `lastEvents` as product log

**Location:** `src/main.js` **155–156**; `src/systems/hud.js` **64**  
**Issue:** One-frame queue cannot feed 1–2 Hz observe.  
**Fix:** `ctx.agent.events` ring cap 16.  
**Status:** resolved (already in draft; restated).

#### 🟡 Minor: Init comment vs later agent-api slot

**Location:** `src/main.js` **104–136**  
**Issue:** Later PR1 must insert `initAgentApi` after hail/save/chart and before HUD so harvest sees this-frame `ctx.events` before **155–156** rotate. Easy to drop after HUD.  
**Fix:** Named in design §3. Keep. Not a freeze bug.

#### 🟡 Minor: `cycleTarget` is a closure

**Location:** `src/systems/controls.js` **114–142**  
**Issue:** PR3 must export or wrap; cannot call from agent-api today.  
**Fix:** Already in inventory §5. Pulse `target` via `agentPulse`.

#### 💡 Suggestion: Desk attach names

**Location:** `station.js` **4788**, **4616**, **6079**, **6129**; `hail.js` **144**  
**Issue:** Closures are real. `ctx.models` pattern (`modelsbrowser.js` **832–836**) is the right attach.  
**Fix:** Keep `stationDesk` / `hailApi`. Do not hang fns on pose `ctx.station` **4404–4411**.

### Re-review
Inventory cites match Wave 125. Leftover REAL / PR1. Contract laws 20–21 closed hold, dump, and token compare. No remaining Blocker/Major.

### Contract census (this pack)
- `window.rimward` in `src/`: **none**
- `__ctx`: `main.js` **79** debug
- TRACKED empty `code`: **drops** (`controls.js` **316**)
- HTTP in PR1: **forbidden**
- `0.0.0.0`: **forbidden**
- in-repo LLM / PR7 / PR8: **forbidden**
- teleport / credit writers: **forbidden**
- WORLD_FIELDS agent key: **none**
- Hail01 / Hud06 docs: **not edited**
