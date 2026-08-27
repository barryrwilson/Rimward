# Agent evade / flee inventory

**Wave:** 137 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** outer-loop afterburner pulse (Space-equivalent) so an opted-in agent can break off / afterburner-flee.  
**Law:** **one** — named `act({ name: 'afterburner' })` pulse through live `pendingAfterburner` / `ship.js` burn machine. **Not** a third helm. **Not** pad approach (owner **2A**). **Not** Fear retune. **Not** teleport.  
**Not this leftover:** NAV-10 human SLOW cue. NAV-03 AP. Pad 2B far-pad. AI-05 PR2 home-berth bubble. NAV-11. MSN-05. Optional Agent API PR2 stills.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-27 Claude Fable — lines **292–297** — cite, do not edit):

> INBOX (P1, AGENT API/AI): A Fear 5 starter drifter cannot flee under
> agent control and dies a lot. Fable’s run was a pirate gauntlet; two hull
> losses. AI-05 starter grace is live, but this agent still could not break
> off, afterburner-flee, or reach a pad without a hand-rolled loop. Give the
> outer loop a usable evade/flee path (and/or pace Fear for agent playtests)
> without a cheat warp.

Agent API serial PR1–PR6 is **complete** (`docs/AgentApiDesign.md` header). This inbox item is a **new hole after that serial**. Wave 126 v1 froze “no `camera` / `afterburner` pulse” as human steal-the-stick (`docs/AgentApiDesign.md` **398**). That lock closed **v1 helm creep**. It did **not** give the outer loop a flee verb. **Do not edit** `docs/AgentApiDesign.md`. This pack owns the evade leftover.

If census had proved a named outer intent already lets an opted-in agent break off combat, afterburner-flee, or reach a safe vector **without** `__ctx` mouse/key synthesis and **without** teleport, this pack would freeze leftover **CONSUME** and named serial **none**. Census did not.

---

## 1. Live `act` names (primary hole)

| Surface | Today | Cite |
|---|---|---|
| Authored names | ping, disable, plotRoute, clearRoute, engageAutopilot, cancelAutopilot, engageAutomine, cancelAutomine, hailResolve, openService, acceptJob, trade, repairAll, feed, undock, dock, hail, selectTarget, pulse, setWeaponGroup, startGame, chooseOrigin | `agent-schema.js` **17–40** |
| Live set | PR1 ping/disable + PR2 desk/AP/AM + PR3 pulses + session start/origin | `agent-schema.js` **42–67** |
| `evade` | **not authored** | grep 0 in schema / dispatch |
| `afterburner` command | **not authored** | `COMMAND_NAMES` **17–40** |
| `flee` command | **not authored** | grep 0 |
| `pulse` edges | `dock` \| `hail` \| `target` \| `reticleLock` | `agent-api.js` **30**; `controls.js` **64** |
| `pulse` afterburner edge | **unknown** | `agent-api.js` **414–417**; `agentPulse` **252–276** |
| Dispatch default | `token: 'unknown'` | `agent-api.js` **432** |
| Unknown live name | `fail(..., 'unknown')` | `agent-api.js` **624** |
| Forbidden | teleport, setCredits, setHull, setCargo, god, win + cheat regex + warp | `agent-schema.js` **69–76**, **170–177** |
| Opt-in gate | `agent.optIn !== true` → `opt-in` | `agent-api.js` **610** |
| Pause | `flags.paused` → `paused` (except startGame / chooseOrigin) | `agent-api.js` **619–621** |
| Berth hold | `flags.berthHold` → `held` (CTL-03) | `agent-api.js` **622** |
| Never throw | `act` catch → `refuse` | `agent-api.js` **645–654** |
| Input write | Agent **does not** write `ctx.input` | `agent-api.js` **1–3** |
| Pulse sink | `agentPulse` / `agentSelectTarget` / `agentSetWeaponGroup` / `agentClearFullStop` | `agent-api.js` **11**; `controls.js` **239–313** |

**Hole:** An opted-in outer loop cannot tap Space. `act({ name: 'afterburner' })` and `act({ name: 'pulse', args: { edge: 'afterburner' } })` both fail **unknown**. `act({ name: 'evade' })` is unknown.

---

## 2. Afterburner (human inner loop — reuse, do not rewrite)

| Surface | Today | Cite |
|---|---|---|
| Binding | Space tap → `pendingAfterburner` | `controls.js` **29**, **490–492** |
| Help | `'Space — afterburner'` | `controls.js` **573** |
| TRACKED | `'Space'` | `controls.js` **54** |
| Publish | `input.afterburnerPressed` one frame then clear | `controls.js` **595**, **605** |
| Latch location | **`let pendingAfterburner` inside `initControls`** — **not** module-scope | `controls.js` **458** |
| Module pending* | target / hail / dock / reticleLock only | `controls.js` **67–70** |
| `agentPulse` | does **not** set afterburner | `controls.js` **248–276** |
| Burn start | `afterburnerPressed` + not active + `time >= burnerReadyAt` + power ≥ **15** | `ship.js` **758–766**; `POWER.afterburnerMin` `state.js` **147** |
| Burn window | ×2 for **6** s, cooldown **8** s | `ctx.js` **60**; `hangar.js` **571** |
| Drain | `POWER.afterburnerPerSec` **16** | `state.js` **147**; `ship.js` **773** |
| Docked / berth | burn machine skipped | `ship.js` **754–755** |
| Full stop | burn clears `input.fullStop` | `ship.js` **765**; `ctx.js` **83** |
| Observe | `ship.burnerActive` only — **no** `burnerReadyAt` | `agent-observe.js` **432** |
| HUD | BURNING / COOLDOWN / READY on aux bar | `hud.js` **2291–2301** |

**Hole:** The inner burn machine is live. The outer loop cannot reach it without `__ctx` / synthetic `KeyboardEvent` / forging `ctx.input`. `pendingAfterburner` is trapped in the `initControls` closure. Lifting that latch is the later PR1 sink. Do **not** start a second burn machine in `agent-api.js`.

---

## 3. Autopilot / “safe vector” (gate-to-gate — not pad, not evade)

| Surface | Today | Cite |
|---|---|---|
| Plot | `plotRoute(ctx, dest)` system id | `nav.js` **279–300**; `agent-api.js` **206–222** |
| Dest bag | `world.nav.dest` + `path` + `autopilot: false` on write | `nav.js` **48–55** |
| AP refuse | noDest / here / docked / jumping / paused / match / missingHop / missingLookup | `autopilot.js` **184–197** |
| Engage | `agentClearFullStop` then `tryEngage` | `agent-api.js` **322–326** |
| Dest kind | **systems** (gates), not pad pose | `autopilot.js` **119–120**, **186–196**; `AgentApiDesign.md` **376** |
| `inputBreak` hypot latch | `optIn` like `chartOpen` / berthHold — mouse hypot does **not** steal | `autopilot.js` **153–157**, **164–165** |
| `inputBreak` still steals | strafe, roll, throttleHeld, **afterburnerPressed**, drift, fullStop | `autopilot.js` **172–177** |
| AM steal | same afterburner / fullStop | `automine.js` **185–187** |
| Arrive | currentSystem === dest → disengage `'arrive'` | `autopilot.js` **404–415** |
| Jump emit | `gate.js` only | honor; agent must not emit `jumpRequested` |

**Census:** `plotRoute` + `engageAutopilot` is a **gate** vector. It is **not** afterburner-flee. It is **not** pad approach. A pirate gauntlet at cruise **120** u/s vs cutter burn **210** (`state.js` **38–42**) can still kill a Fear 5 drifter on the way to the gate. AP does **not** satisfy the inbox evade hole.

---

## 4. Dock / pad (owner **2A** — cite, do not steal)

| Surface | Today | Cite |
|---|---|---|
| `dock` act | `station.inZone !== true` → `range`; else pulse KeyJ | `agent-api.js` **399–404** |
| Envelope | `U.DOCK_RANGE` **45** u | `state.js` **30** |
| Snap | 2× range (**90** u) zeros velocity then docks | `station.js` (human J; honor) |
| Tests | place hull in 45 u then `act dock` | `AgentApiDesign.md` **376** |
| Pad 2B | later owner pick; **not this pack** | wishlist **283–291**; `AgentApiDesign.md` **667**, **743** |
| NAV-10 | human HUD `SLOW — approach under 20 u/s` | `docs/Nav10DockApproachDesign.md`; `hud.js` **2280–2288** |

Inbox “reach a pad without a hand-rolled loop” is the **sibling pad 2B inbox**, not this leftover. Owner pick **2A** still stands. This pack **must not** land pad-seeker / third helm / warp-to-pad.

---

## 5. Observe combat / fear / targets

| Surface | Today | Cite |
|---|---|---|
| Combat flag | `flags.combat === true` | `agent-observe.js` **437** |
| Fear | `world.fear` finite | `agent-observe.js` **450** |
| Nearby | ≤12, nearest first, range ≤ 600 u, ships (+ rocks if group 3) | `agent-observe.js` **138–178**; `U.TARGET_RANGE` **32** |
| Nearby row | `kind`, `id`, `name`, `range` — **no** `ai.intent` | `agent-observe.js` **86–92**, **103–107** |
| Current lock | `targets.current` | `agent-observe.js` **402**, **477–479** |
| Omit | `npc.ai` internals, interest rolls | `agent-observe.js` **1–3**; `AgentApiDesign.md` **341** |
| Burner ready | **absent** | observe `ship` **414–434** |
| Events | `playerHit`, `playerDestroyed`, `recovered`, `bodyHit` on ring | `agent-schema.js` **82–104** |

Outer loop can **see** combat and fear. It cannot **flee**. Do **not** grow observe into a who-table or `npc.ai` dump as this leftover.

---

## 6. Fear 5 starter drifter + AI-05 (cite, do not rewrite)

| Surface | Today | Cite |
|---|---|---|
| Drifter origin | `setCredits: 600`, `setFear: 5`, `startSystem: 'redmarch'` | `state.js` **763–767** |
| Apply | `ctx.world.fear = fx.setFear` | `origins.js` **56** |
| Hop grace | `JUMP.graceSeconds` **60** | `state.js` **588**; `origins.js` **129**; `jump.js` **163** |
| Extra starter | greenhand/beautiful **180**; marked/ledgerDebt/**drifter 0** | `npc.js` **169–174** |
| Drifter start system | `redmarch` | `npc.js` **181** |
| Death calm | session `deathCalmLeft` **90** s of dt | `npc.js` **184–185**, **1843–1859** |
| Tamper | remaining > 180 → 0 | `npc.js` **183**, **1791–1792** |
| Gate | `starterGraceBlocksAcquire` | `npc.js` **1818–1840** |
| Interest fear | `fearRepel` 0.004 per fear point (higher fear slightly **repels**) | `npc.js` **163** |
| Home-berth bubble | **optional AI-05 PR2** — not live | `docs/Ai05StarterGraceDesign.md` honor |

AI-05 hop + death calm **is live**. Drifter extra starter is **0**. Fear **5** is a **low** name — pirates still look. Playtest two hull losses match “grace live, still cannot flee.” Prefer an **outer command** over retuning Fear. Do **not** steal AI-05 PR2.

---

## 7. Hypot / optIn / fullStop (honor)

| Surface | Today | Cite |
|---|---|---|
| Agent channel | session `ctx.agent`; not persist | `ctx.js` **120–125** |
| Query opt-in | `?agent=1` | `agent-api.js` **47–70**, **633** |
| Enable | trusted click only | `agent-api.js` **657–664** |
| Hypot latch | `optIn` true → no mouse steal | `autopilot.js` **153–157** |
| Afterburner steal | **yes** (human Space) | `autopilot.js` **175** |
| `fullStop` act | **none** | dispatchLive **316–432** |
| `agentClearFullStop` | AP/AM engage only | `controls.js` **238–245**; `agent-api.js` **323**, **333** |
| CTL-02 pause | never write `flags.paused` | honor |
| CTL-03 | `act` while held → `held` | `agent-api.js` **622** |

PR1 afterburner **must** still steal AP/AM the same as Space. Do **not** special-case agent burn to keep AP (that is a third helm merge). Hypot latch stays.

---

## 8. Forbidden / tokens / badge

| Token / surface | Today | Cite |
|---|---|---|
| `unknown` | bad / non-live name | `agent-api.js` **624**, **432** |
| `forbidden` | cheat names + `console.warn` | `agent-api.js` **604–606** |
| `opt-in` | not opted in | **610** |
| `paused` | overlay pause | **621** |
| `held` | berthHold | **622** |
| `range` | dock out of zone | **401–402**, **421–422** |
| `docked` | selectTarget while docked | **408** |
| `no-service` / `closed` / desk | hail / desk | dispatchLive |
| `refuse` | throw catch | **653** |
| Warp / teleport | forbidden | `agent-schema.js` **175** |
| Badge | Wave 134/Fable pin top-right; Last: `{name}` | `style.css` **32–43**; `agent-api.js` **457–467**, **571–574** |
| Badge overlap Manifest | **sibling inbox** | wishlist **303–305** |
| `XAI_API_KEY` in src | **none** | grep 0 |
| Page WebSocket | **none** in agent-api | grep 0 |

---

## 9. Wave 126 v1 “no afterburner pulse” (honor as history, not this leftover)

`docs/AgentApiDesign.md` **398**: “No `camera` / `afterburner` pulse (those are human steal-the-stick).”

That sentence froze **Wave 126 v1** so PR3 would not grow a third helm. Agent API leftover serial is **complete**. This Wave 137 inbox is **evade/flee for the outer loop**. Deputize: **reopen afterburner as a named outer `act`** that uses the **same** steal as Space. Do **not** rewrite AgentApiDesign. Contract for this leftover wins on conflict with that v1 pulse table **for afterburner only**. Pad 2A, no third helm, no teleport, no in-repo LLM **stay**.

---

## 10. Verdict table

| Question | Answer | Why |
|---|---|---|
| Named evade / flee / afterburner `act`? | **No** | `COMMAND_NAMES`; dispatch **432** unknown |
| Pulse edge afterburner? | **No** | `PULSE_EDGES` four names; `agentPulse` **276** unknown |
| Can outer loop tap Space without `__ctx`? | **No** | `pendingAfterburner` is initControls-local **458** |
| Does AP afterburner-flee? | **No** | AP is gate-to-gate; Space **cancels** AP |
| Does dock reach a pad from range? | **No** | in-zone KeyJ; `range` if not `inZone` |
| Is pad 2B this leftover? | **No** | owner **2A**; sibling inbox **283–291** |
| Is NAV-10 this leftover? | **No** | human SLOW cue |
| Is AI-05 starter grace live? | **Yes** | hop 60 + death 90; drifter extra **0** |
| Does Fear 5 need a rewrite as the fix? | **No** | prefer outer command |
| Cheat warp live? | **No** | forbidden names |
| CONSUME? | **No** | hole live |
| Named serial | **PR1** | leftover REAL |

**Freeze leftover REAL.** Name: **Agent afterburner evade**. Name later serial **PR1**.
