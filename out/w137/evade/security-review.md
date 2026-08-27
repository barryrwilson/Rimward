# Security Review: Agent evade leftover integrator

### Risk Level: Low (this markdown wave) / Medium (later PR1 if freeze is ignored)

### Summary

Wave 137 lands markdown only. Trust boundary is later `act({ name: 'afterburner' })` plus live `ship.js` burn. HIGH/CRITICAL items are frozen in merge law: no teleport, no warp-to-pad, no god-mode, no persist mute / persist `optIn`, no Fear rewrite, no third helm, no in-repo LLM, no `XAI_API_KEY`, no page WebSocket, never-throw, no `for-in`, no `innerHTML`. No HIGH/CRITICAL remain open in this pack.

## Security Audit: Wave 137 Agent afterburner evade (design freeze)

### Summary

Overall risk assessment: **low** for this markdown wave. Later PR1 is **medium** if an implementer ignores 2A / fail-closed. Freeze closes cheat warp, teleport, god-mode, and persist mute as CRITICAL.

### Findings

#### 🔴 CRITICAL: Cheat warp / teleport as “flee” — **resolved in freeze**

**Location:** later `agent-api.js` dispatch; live `agent-schema.js` **69–76**, **175**; `agent-api.js` **604–606**  
**Category:** Authorization / cheat  
**Issue:** An `evade` that assigns `ship.object.position`, `world.currentSystem`, or a pad pose would skip combat without playing. Inbox forbids a cheat warp.  
**Impact:** god-mode escape; skip physics; skip dock envelope.  
**Reproduction:** later `act({ name: 'evade' })` writes position or emits `jumpRequested`.  
**Fix (frozen):** name is `afterburner` only; forbidden names stay; non-finite pose → no write; agent-api does not own the mesh.  
**Status:** resolved in freeze

#### 🔴 CRITICAL: Persist mute / persist `optIn` — **resolved in freeze**

**Location:** `state.js` WORLD_FIELDS (read-only honor); `ctx.js` **120–125** session `ctx.agent`  
**Category:** Persistence / privilege  
**Issue:** Persisting “agent always burns”, “Fear 0 while opted in”, or `optIn` across restore would resume drive and mute hostility from a save file.  
**Impact:** hostile save god-mode; skip AI-05.  
**Reproduction:** add WORLD_FIELDS `agentEvade` / `fearMute` / restore `optIn`.  
**Fix (frozen):** persist **none**. No new WORLD_FIELDS. Restore must not resume agent drive (live nav already `autopilot: false` on write).  
**Status:** resolved in freeze

#### 🔴 CRITICAL: God-mode burn / infinite ready — **resolved in freeze**

**Location:** later act vs live `ship.js` **758–766**; `POWER.afterburnerMin` `state.js` **147**  
**Category:** Authorization  
**Issue:** Skipping `burnerReadyAt` or power min, or granting ×N burn only for agents, is a combat cheat.  
**Impact:** unkillable flee; energy cheat.  
**Fix (frozen):** pulse the live edge; inner machine unchanged; cooldown no-op stays.  
**Status:** resolved in freeze

#### 🔴 CRITICAL: In-repo LLM / key in bundle / page WS — **resolved in freeze**

**Location:** honor; grep `XAI_API_KEY` 0 in `src/`; no agent-api WebSocket  
**Category:** Secrets / remote control  
**Issue:** A flee “helper” runner with `XAI_API_KEY` or an unauthenticated page socket would remote-pilot the ship.  
**Impact:** key leak; LAN CSRF.  
**Fix (frozen):** no in-repo LLM ever; no key in bundle; no page WebSocket; PR6 loopback stays as live.  
**Status:** resolved in freeze

#### 🟠 HIGH: Pad warp / cheat dock as “reach a pad” — **resolved in freeze**

**Location:** wishlist **283–291**; `agent-api.js` **399–404**; owner **2A**  
**Issue:** Inbox mentions pad. A PR that snaps the hull into 45 u on `afterburner`/`evade` is cheat dock.  
**Impact:** skip approach; steal 2B.  
**Fix (frozen):** pad non-goal; dock `range` stays; tests place 45 u; write-set omits `station.js`.  
**Status:** resolved in freeze

#### 🟠 HIGH: Fear mute for agent playtests — **resolved in freeze**

**Location:** `npc.js` **169–185**, **1818–1840**; `ORIGINS.drifter` `state.js` **766**  
**Issue:** Inbox “and/or pace Fear”. A `?agent=1` extra 180 s or Fear=0 would steal AI-05 and flatten redmarch.  
**Impact:** origin danger deleted for agents; persist-looking mute if stamped on world.  
**Fix (frozen):** prefer outer command; do not claim `npc.js` / `origins.js`; AI-05 hop/death stay.  
**Status:** resolved in freeze

#### 🟠 HIGH: Prototype / throw on act payload — **resolved in freeze**

**Location:** later `dispatchLive`; live `commandArgs` `agent-api.js` **128–133**; `act` catch **645–654**  
**Issue:** `for-in` on `args` or missing `ctx.input` without try would throw into the outer loop or pick `__proto__`.  
**Impact:** flight-loop crash if later someone calls act from update; unexpected latch.  
**Fix (frozen):** never throw; never `for-in`; `Object.hasOwn`; catch `refuse`.  
**Status:** resolved in freeze

#### 🟠 HIGH: Overlay pause / berthHold bypass — **resolved in freeze**

**Location:** `agent-api.js` **619–622**; CTL-02 / CTL-03  
**Issue:** Afterburner that writes `flags.paused` or pulses while `berthHold` would freeze or move a held hull.  
**Impact:** pause desync; berth cheat.  
**Fix (frozen):** never write `paused`; held → `held`. Docked → `docked`.  
**Status:** resolved in freeze

#### 🟠 HIGH: Third helm keep-AP-through-burn — **resolved in freeze**

**Location:** `autopilot.js` **175**; Wave 126 **398**  
**Issue:** Special-casing agent afterburner so AP does not steal is a second flight computer.  
**Impact:** helm merge inversion; pad-seeker-shaped control.  
**Fix (frozen):** steal stays; no `agentHelm`.  
**Status:** resolved in freeze

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No teleport / warp command
- [x] No credit / position writers claimed
- [x] Prototype-safe act payload (no for-in)
- [x] Fail-closed never-throw
- [x] Pad 2A not stolen
- [x] AI-05 not rewritten
- [x] No page WebSocket / no bundle key
- [x] REDMARCH flake not “fixed”
- [x] Badge overlap Manifest left to sibling inbox

### 🟡 MEDIUM: Queued ok while on cooldown looks like success

**Location:** deputize queued + inner no-op  
**Issue:** Outer loop may think it fled. Observe `burnerActive` stays false.  
**Justification:** matches human Space (silent no-op). Optional `burnerReadyAt` observe. Do not skip cooldown.

### 🟡 MEDIUM: `pulse.edge = 'afterburner'` alias

**Location:** live `PULSE_EDGES` four names  
**Issue:** Two public verbs increase unknown-edge mistakes.  
**Justification:** deputize named act only. Alias optional-off.

### 🟢 LOW: Badge `Last: afterburner` is HUD-visible drive state

**Location:** `agent-api.js` **571–574**  
**Issue:** Same as other lastIntent names. Not a secret.  
**Justification:** observe already public on origin. No extra leak.

### Recommendations

1. Later PR1: named `afterburner` pulse only; lift pending latch; keep steal; keep forbidden list.
2. Do not grow pad dests or Fear tables in this leftover.
3. Do not persist evade policy.

---

## Security Review: AgentApiEvadeDesign.md / shared-contract.md

### Risk Level: Low

### Summary

Markdown freeze matches the security checklist for a later client-side play API. CRITICAL cheat paths are named and forbidden. No HIGH/CRITICAL remain open.
