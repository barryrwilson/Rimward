# Code Review: Agent evade leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `COMMAND_NAMES` (no afterburner/evade), `agentPulse` four edges, `pendingAfterburner` trapped in `initControls`, AP gate dests, in-zone dock, and AI-05 hop/death without a flee verb. Contract forbids CONSUME, pad 2B, third helm, Fear retune, teleport, persist, and dual `evade`+`afterburner`. No Blocker/Major remain after one-act freeze, steal-honored, 2A pad out, and tight write-set.

### What's done well

- Code-wins inventory with file:line for schema names, dispatch unknown, pulse edges, Space latch location, burn machine, AP dests, dock range, observe combat/fear/burner, AI-05 tables, forbidden warp.
- Playtest “hand-rolled loop” **matches** missing Space sink + 2A pad non-goal.
- Wave 126 **398** “no afterburner pulse” is treated as **v1 helm lock**, not CONSUME of this new inbox.
- One law frozen: named `afterburner` pulse, not pad helm, not Fear mute.
- Inner burn reused — no second machine.
- CONSUME path documented and rejected with evidence.
- Pad 2B / NAV-10 / NAV-03 / AI-05 PR2 explicitly out.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `agent-schema.js` **17–40**; `controls.js` **252–276**, **458**  
**Issue:** AP + dock + AI-05 exist. That is **not** afterburner-flee. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Pad 2B / third helm as the default fix — **resolved in freeze**

**Location:** inbox “reach a pad”; owner **2A**; `AgentApiDesign.md` **376**, **667**  
**Issue:** Shipping pad-seeker as evade steals a different wave and invents helm. Frozen: afterburner only. Tests still place 45 u.

#### 🔴 Blocker: Dual verb `evade` + `afterburner` in PR1 — **resolved in freeze**

**Location:** inbox “evade/flee path”; honor one named act  
**Issue:** Two names plus pulse-edge alias is three APIs. Frozen: `afterburner`. `act({ name: 'evade' })` stays unknown.

#### 🟠 Major: Fear retune as the fix — **resolved in freeze**

**Location:** inbox “and/or pace Fear”; `npc.js` **174** drifter extra 0  
**Issue:** Muting redmarch for agents steals AI-05 and origin danger. Frozen: prefer outer command. Do not claim `npc.js`.

#### 🟠 Major: Keep AP through agent burn — **resolved in freeze**

**Location:** `autopilot.js` **175**  
**Issue:** “Break off” might be read as fly-to-gate while burning. That is a merge rewrite. Frozen: steal stays. Re-engage AP after the edge.

#### 🟠 Major: Second burn machine in `agent-api.js` — **resolved in freeze**

**Location:** live `ship.js` **755–766**; header `agent-api.js` **1–3** does not write `ctx.input`  
**Issue:** Writing `burnerActive` / `burnerReadyAt` from act skips power and docked gates. Frozen: lift pending flag; controls publishes; ship.js decides.

#### 🟠 Major: Write-set creep into HUD / npc / station — **resolved in freeze**

**Location:** contract §1  
**Issue:** SLOW lamp, Manifest, home-berth bubble, dock snap are siblings. Frozen: schema + agent-api dispatch + controls latch (+ optional observe readyAt).

#### 🟠 Major: `pendingAfterburner` left inside `initControls` — **resolved in freeze**

**Location:** `controls.js` **458** vs module `pendingDock` **67–70**  
**Issue:** A PR that only adds a schema name cannot pulse Space. Frozen: lift latch in the same PR1.

### 🟡 Minor: Cooldown still returns queued ok

**Location:** contract inner no-op  
**Issue:** Outer loop must read `burnerActive` / `burnerReadyAt`.  
**Justification:** human Space is silent. Observe readyAt deputized on. Token `cooldown` is owner override.

### 🟡 Minor: Nearby targets omit `ai.intent`

**Location:** `agent-observe.js` **86–92**  
**Issue:** Agent sees combat flag + ranges, not who hunts.  
**Justification:** `npc.ai` dump is forbidden. Combat flag is enough to decide burn. Do not steal TGT-07.

### 🟡 Minor: Wave 126 **398** vs this leftover

**Location:** `docs/AgentApiDesign.md` **398** (honor, not edited)  
**Issue:** Readers of the old table may refuse the PR.  
**Justification:** new doc + contract win for afterburner only. Do not rewrite AgentApiDesign.

### 💡 Suggestion: Optional PR2 stills

One still: opted-in drifter, combat true, `act afterburner`, burner BURNING, hub empty, badge Last: afterburner, no pad snap, no Fear toast.

### 💡 Suggestion: Keep `pulse` public edges unchanged

Named act internally may call `agentPulse('afterburner')`. Do not advertise a fifth public pulse edge unless playtest asks.
