# Wave 137 Agent evade leftover notes

**Verdict:** leftover **REAL**. Name: **outer-loop afterburner pulse** (Space-equivalent). Named serial: **PR1**. Not CONSUME. Named serial is **not** none. One law: **(a)** named `afterburner` act, not **(b)** pad 2B / Fear mute / third helm.

## Method

- Assigned Wave 137 leftover pack. Domain **data**. Local markdown only. Task forbade `graph_propose` / `graph_approve`. Did **not** call those tools. Did **not** start a Drive publish bind.
- Census live `src/systems/agent-api.js` acts: `plotRoute` **206–222**, AP/AM **322–340**, hail **406**, dock pulse **399–404**, `setWeaponGroup` **428–430**, `selectTarget` **407–413**, `pulse` **414–424**, dispatch default **432**, held **622**, unknown **624**, never-throw **645–654**.
- Census `src/game/agent-schema.js` `COMMAND_NAMES` **17–40**, forbidden **69–76**, warp **175**.
- Census `src/game/agent-observe.js` combat **437**, fear **450**, targets **477–479**, `burnerActive` **432** (no `burnerReadyAt`).
- Census `src/systems/controls.js` Space **29**, **490–492**; `pendingAfterburner` **458** (initControls-local); `agentPulse` **252–276**; hypot **641**; `fullStop` **521**, **680**; optIn is AP-side not controls.
- Census `src/game/autopilot.js` dests **119–120**, **186–196**; `inputBreak` **159–181**; hypot latch `optIn` **153–157**; afterburner steal **175**; berthHold via `berthHeld`.
- Census `src/systems/ship.js` burn **755–766**.
- Census AI-05 live hop/death: `docs/Ai05StarterGraceDesign.md`; `npc.js` **169–185**, **1818–1840**; `JUMP.graceSeconds` `state.js` **588**; drifter `setFear: 5` **766**.
- Census NAV-10 human SLOW: `docs/Nav10DockApproachDesign.md`; `hud.js` **2280–2288** — cite only.
- Census owner **2A** pad non-goal: `docs/AgentApiDesign.md` **173**, **227**, **376**, **667**, **743**. Did **not** edit that file.
- Code wins. Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`.

## Why REAL (not CONSUME)

Named hole still live:

- No `afterburner` / `evade` / `flee` in `COMMAND_NAMES`.
- `agentPulse` cannot set afterburner (`PULSE_EDGES` four names; pending latch is closure-local).
- AP is gate-to-gate.
- Dock is in-zone KeyJ (`range` out of zone).
- Fear pacing is AI-05 only (drifter extra **0**).

Wave 126 v1 “no afterburner pulse” (`AgentApiDesign.md` **398**) closed **helm creep** for that serial. It is **not** a live flee path. Do not CONSUME on AP + AI-05 + dock pulse alone.

CONSUME would require a named outer intent that already lets an opted-in agent break off, afterburner-flee, or reach a safe vector without `__ctx` synthesis and without teleport. Census did not prove that. Gate AP is **not** afterburner-flee.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Law | (a) named `act({ name: 'afterburner' })` Space-equivalent pulse |
| Sink | lift `pendingAfterburner` to module scope; `agentPulse('afterburner')` internal |
| Steal | afterburner still cancels AP/AM; hypot latch stays |
| Pad | **2A** out; tests place 45 u |
| Fear | AI-05 live; do not rewrite |
| Observe | optional `ship.burnerReadyAt` in PR1 |
| Persist | none |
| Name `evade` | **unknown** in PR1 |

## Later write-set (do not edit now)

- `src/game/agent-schema.js` — add live name `afterburner`.
- `src/systems/agent-api.js` — dispatch branch; docked → `docked`.
- `src/systems/controls.js` — lift pending latch; `agentPulse` afterburner.
- Optional: `src/game/agent-observe.js` `burnerReadyAt`.
- Do **not** claim `npc.js`, `station.js`, `ship.js` burn retune, `hud.js` layout, `style.css` badge, `state.js`.
- Do **not** claim NAV-11 / MSN-05 siblings.

## Coupling (do not steal)

- Pad 2B far-pad (`docs/AgentApiDesign.md`; wishlist **283–291**).
- NAV-10 human SLOW. NAV-03 AP dests.
- AI-05 PR2 home-berth bubble.
- NAV-11. MSN-05. `out/w137/routepersist/**`. `out/w137/oreguide/**`.
- Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 / CTL-03 / CTL-04.
- Agent API optional leftovers. Do not reopen PR1–PR6 handle.
- Badge Manifest overlap (wishlist **303–305**).

## Graph

Task lock: local markdown; do not `graph_propose` / `graph_approve`. No workflow bind used. Owner write-set is local files under `docs/AgentApiEvadeDesign.md` and `out/w137/evade/**` except `verify/**`.

## Reviews

Security HIGH/CRITICAL (teleport, god-mode burn, persist mute, Fear mute, pad warp, throw/proto, pause, third helm, LLM/key/WS) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after one-act, steal-honored, latch lift, 2A out. UI Blocker/Major **resolved as later act** (live agent still cannot flee until PR1). Open MEDIUM/LOW: cooldown queued-ok, hint does not mention steal, Manifest overlap sibling, Wave 126 table vs new leftover.

## Not started

Vite, Chrome, Playwright, CDP. No ports claimed. No `out/w137/evade/verify/**`.
