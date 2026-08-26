# Wave 130 NAV-10 docking approach notes

**Verdict:** leftover **REAL**. Name: **docking approach-speed cue**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none. Designer Major (MATCH / target SPD) **resolved in freeze**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): first pass `execute_workflows` (`r-mta67emk-fd0a17d7`) selected browser-assisted work (false bind). Re-dispatch `proceed_unmodeled` (`r-mta6yec7-c18c3e85`). This wave is **local repo markdown**. Owner forbids Vite, Chrome, Playwright, and CDP. Did **not** open a browser. Did **not** `graph_approve` / `graph_propose`.
- Census live `src/systems/station.js` `inZone`, 2× snap, `dock()` (**6308–6330**, **6099–6125**).
- Census `src/systems/controls.js` KeyJ `pendingDock` / `dockPressed` (**330–331**, **426**). KeyD strafe.
- Census `src/systems/hud.js` context prompt `J` / `Dock` (**2535–2536**), shared `makeSpeed` MATCH factory (**378–401**), self **1089** / **2243–2244**, target **1101** / **2524**, Hail02 `dock-range` (**808**), HUD-06 HOME (**75**, **981–987**, **1975–1992**). `hud.css` MATCH **222–229**, hub **184–193**.
- Census `src/systems/ship.js` bounce skip `dockPressed` / docked / jumping (**907–939**).
- Census `src/game/physics.js` / `collision.js` station cylinder 32 + player 2.4.
- Census `src/systems/hail.js` `emitDockJumpMiss` (**301–373**) — out of range only.
- Census `src/systems/gate.js` NAV-03 `apJump` (**671–679**).
- Census `src/systems/agent-api.js` **129–150** — no `dock` act.
- Census `src/systems/overlay-policy.js` never `paused`.
- Cite siblings; do not steal. Code wins.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`. Did **not** write `src/`. Did **not** edit the wishlist.

## Why REAL (not CONSUME)

Named hole still live:

- J prompt is `'Dock'` with **no** speed / `SLOW` / `20 u/s` (`hud.js` **2535–2536**).
- SPD is a generic integer + MATCH, not an approach cue.
- Dock path has **no** speed governor (`station.js` **6321–6330**).
- Cruise without a timely J still **bounces** PHY-01 (`ship.js` **907–939**).
- NAV-03 does not fly the pad. Hail02 names miss **range**, not speed.

2× snap **does** zero velocity on a tap between 45 and 90. In-zone J **does** dock at cruise. That is **not** a named approach-speed cue **and** not a governor that prevents bounce-into-pad when the player does not tap. Do **not** CONSUME on snap/dock success alone.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Channel | HUD prompt copy + **self** `.rw-slow-lamp` (not MATCH, not `tgtSpeed`) |
| Threshold | 20 u/s (inbox) |
| Lamp band | 3 × `U.DOCK_RANGE` |
| Governor | not PR1 (optional tap-clamp later) |
| KeyJ | tap stays |
| PHY bounce | stays |
| Persist | none |

## Later write-set (do not edit now)

- Prefer `src/systems/hud.js` + `src/ui/hud.css`.
- Do **not** claim `controls.js`, `hail.js`, `agent-api.js`, `state.js`, `collision.js`, `autopilot.js`.
- Do **not** claim HUD-06 pip, Hail02 keys, MATCH node, or `tgtSpeed`.

## Coupling (do not steal)

- PHY-01 bounce / IMPACT.
- NAV-03/05/06/07/09.
- Hail02 miss toast.
- HUD-06 HOME. HUD-07 layout.
- CTL-01 KeyJ. CTL-02 pause. CTL-03 berthHold. CTL-04 digits.
- Agent API dock pulse.
- Wave 130 TGT-07 / MSN-04.

## Graph

Re-dispatch `resolution_id` `r-mta6yec7-c18c3e85`. Decision `proceed_unmodeled`. First-pass browser workflow was a **false bind**. Local write-set completed as the owner assigned. Did not start Chrome.

## Re-dispatch (designer Major)

Root cause: `makeSpeed()` is shared. One `.rw-match-lamp` with text `MATCH` sits on self **and** target SPD. Contract v1 said “MATCH sibling” without freezing a second node or self-rail only.

Freeze now: `.rw-slow-lamp` on `.rw-combat-self .rw-speed` only. MATCH copy frozen. `tgtSpeed.set(targetSpeedNow)` stays speed-only. Independent hide. Hub 80 px unchanged.

## Reviews

Security HIGH (XSS copy, Agent dock, persist mute, pause, teleport/bounce-off) **resolved in freeze**. Code Blocker/Major **resolved in freeze**, including designer MATCH/`tgtSpeed` Major. UI Blocker/Major **resolved as later copy** plus MATCH-reuse freeze (live J prompt stays speed-blind until PR1).
