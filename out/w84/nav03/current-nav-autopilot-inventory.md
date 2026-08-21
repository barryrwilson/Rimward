# NAV-03 current navigation / autopilot inventory

**Wave:** 84. Design only. Code wins.  
**Scope:** live flight, gates, jump, NPC avoid, chart, HUD, save. No `world.nav` in `src/` yet (NAV-01 owns that shape).  
**Not this file:** NAV-01 plot/chart highlight; NAV-02 HUD next-gate marker. Sibling workers own those. Do not treat this inventory as their contract.

Line numbers are from the tree at inventory time. They go stale. Re-read the cited files at impl.

---

## 0. Headline

There is **no** autopilot. There is **no** `world.nav`. The player steers with the reticle, ramps throttle on R/F, and taps **D** in `JUMP.zone` 60. `gate.js` is the only `jumpRequested` emitter. `jump.js` runs the charge and midpoint swap. NPC PHY-02 avoid is a **lookahead bias**, not a path planner, and `applyAvoidBias` is **not** exported.

---

## 1. Persist / world

| Surface | Today | Cite |
|---|---|---|
| Autosave key | `rimward-save-v1` | `save.js` 66 |
| `WORLD_FIELDS` | time, credits, fear, reputation, currentSystem, markets, recordBanks, records, incidents, aftermath, prices, activeEvent, milestones, jobs, scanner, shipName, jumpGraceUntil, contacts, mystery, epics, origin, onboarding, aceRivalry, originArc, concealedMounts, miningLaser, hangar, launcher, missileAmmo, turret, fieldOre | `save.js` 75–98 |
| `world.nav` | **Absent** | grep 0 |
| Snapshot world copy | `for (const k of WORLD_FIELDS) if (ctx.world[k] !== undefined) world[k] = ctx.world[k]` | `save.js` 948–953 |
| Restore | copies listed keys; unknown `currentSystem` → `'freehold'`; omitted hangar/fieldOre/jobs **deleted** | `save.js` 1156–1168 |
| Sanitize | hangar, cargo, fieldOre, jobs, reputation, miningLaser, bio, ship pose | `save.js` `sanitizeRestored` ~1085–1109 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | `save.js` 106–110 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` | `save.js` 101 |
| `flags.saveRestored` | set true on restore | `save.js` 1159; `ctx.js` 182 |
| Jump autosave flag | `JUMP.saveOnJump: true` | `state.js` 547 |

NAV-03 must **not** add a second `WORLD_FIELDS` key. Extra flying fields ride the **same** `world.nav` record NAV-01 will own.

---

## 2. Input and flight writer

| Surface | Today | Cite |
|---|---|---|
| Input writer | `controls.js` **only** | `ctx.js` 15–16, 69–91 |
| Ship transform writer | `ship.js` **only** | `ctx.js` 16–17, 93–102 |
| MATCH throttle law | `ship.js` must **not** write `ctx.input.throttle` | `ctx.js` 32; `ship.js` 60, 649 |
| MATCH flag | `flags.matchSpeed`; writer `ship.js` | `ctx.js` 30, 181; `ship.js` 697–706 |
| MATCH cancel | dock, jump, lost lock, `input.throttleHeld` (R/F) | `ship.js` 703–706 |
| Steer | reticle `steerX`/`steerY`; always written from mouse | `controls.js` 7–11, 309–311; `ship.js` 746–766 |
| Strafe / roll | WASD, QE | `controls.js` 16–18, 337–329 |
| Throttle | persistent 0..1; R/F ramp 0.5/s; double-tap F = `fullStop` | `controls.js` 19, 49–50, 280–287 |
| Afterburner | Space edge | `controls.js` 20, 259–260; `ship.js` 708–723 |
| Drift | Shift hold | `controls.js` 21 |
| Dock / jump key | `input.dockPressed` KeyD one-frame | `controls.js` 85, 268–269, 353 |
| MATCH key | KeyX `matchSpeedPressed` | `controls.js` 27, 274–276 |
| Reticle lock | KeyV; must not steal | `controls.js` 26, 277–278 |
| Tracked keys | WASD, QE, RF, T, H, C, X, V, Digit1–4, Shift, Space | `controls.js` 37–44 |
| Digit 0 | **not** in `TRACKED`; dock shipyard | `station.js` 5710–5717; `DOCK_KEY_SERVICES` 174 |
| KeyM | galaxy chart; no preventDefault | `galaxychart.js` 21–24, 240–250 |
| KeyG | hub cycle in `gate.js` (not controls) | `gate.js` 500–507; HUD copy `controls.js` 339 |
| KeyP | pause; loop frozen | `main.js` 149–167 |
| Collision skip | docked, jumping, or `dockPressed` | `ship.js` 842–843 |
| Steer during jump | **yes** today (`if (!docked)` only) | `ship.js` 708–840 |
| Docked park | zero vel; MATCH off | `ship.js` 879–886 |

There is **no** analog command channel besides `ctx.input`. Autopilot cannot write `ctx.input` (controls-owned). Autopilot cannot fight MATCH by writing throttle.

---

## 3. Gate zone and jump

| Surface | Today | Cite |
|---|---|---|
| `JUMP.zone` | 60 | `state.js` 543 |
| `JUMP.chargeTime` | 2.5 s | `state.js` 544 |
| `JUMP.arrivalOffset` | 50 | `state.js` 545 |
| `JUMP.graceSeconds` | 5 | `state.js` 546 |
| Zone walk | nearest assembly within zone²; not jumping; not docked | `gate.js` 535–557 |
| Publish | `inZone`, `nearTo`, `nearHub`, `nearRouteIndex`, `nearRouteCount` | `gate.js` 552–556; `ctx.js` 153–161 |
| **Only** jump emit | `if (inZone && ctx.input.dockPressed) emit('jumpRequested', { to: near.to })` | `gate.js` 558–560 |
| Hub cycle | KeyG; `routeIndex = (i+1)%n`; `to = routes[routeIndex]` | `gate.js` 500–507, 469–474 |
| Hub rebuild | `to: hub.routes[0]`, `routeIndex: 0` | `gate.js` 469–474 |
| Jump consume | same-frame `jumpRequested` → `beginJump(to)` if `SYSTEMS[to]` | `jump.js` 33–34, 70–77, 139–148 |
| Unknown `to` | **ignore** | `jump.js` 71 |
| Midpoint | despawn NPCs; **null** `targets.current`; swap `currentSystem`; relocate + `lookAt(0,0,0)`; zero velocity; `systemLoaded` | `jump.js` 79–123 |
| Junction arrival | if dest `hub.routes` contains origin, arrive at `hub.position` | `jump.js` 100–103 |
| Gate overlay | fade + `textContent` label | `gate.js` 482–586 |
| Tick order | gate **before** controls; jump **after** ship/world | `main.js` 98–128 |

`to` on the event is always the **live near assembly**, not a stuffed save dest. Hub selection is **only** `nearRouteIndex` / KeyG. There is no second jump path.

`beginJump` does not check `inZone`. Zone is enforced only at the emit site. A second emitter that skips the zone is a teleport-class cheat.

---

## 4. PHY avoid (NPC)

| Surface | Today | Cite |
|---|---|---|
| `PHY.AVOID_LOOKAHEAD` | 40 | `physics.js` 19 |
| `PHY.AVOID_GAIN` | 1.4 | `physics.js` 20 |
| `PHY.SUN_HEAT_MULT` | 2.4 | `physics.js` 15 |
| `PHY.SUN_LETHAL_MULT` | 1.12 | `physics.js` 16 |
| `PHY.IMPACT_MIN_SPEED` | 8 | `physics.js` 12 |
| `PHY.PLAYER_RADIUS` | 2.4 | `physics.js` 7 |
| `PHY.GATE_BORE` / `GATE_TUBE` | 30 / 2.2 | `physics.js` 21–22 |
| Station cylinder | r 32, y −26…33 | `physics.js` 8–10 |
| `applyAvoidBias` | lateral offset around nearest lookahead hit; **not exported** | `npc.js` 590–638 |
| `steerLive` | avoid then turn; **not exported** | `npc.js` 728–734 |
| `gateProbeHits` | **exported** | `npc.js` 459 |
| `minerHoldFromStation` | **exported** | `npc.js` 880 |
| Sun body | `sunRadius * SUN_HEAT_MULT` in `_bodies` | `npc.js` 641–661 |
| Bounce net | `bounceLive` + `resolveMover` | `npc.js` 664+; player `ship.js` 842–875 |
| Combat flag | `flags.combat` if any `ai.intent` in `U.ENCOUNTER_BUBBLE` | `npc.js` 2256–2260; `ctx.js` 28 |

PHY-02 is **bias**, not A\*. Wishlist PHY text: still lookahead, not full path planning (`PLAYER-EXPERIENCE-WISHLIST.md` 786–790). Collision is the safety net.

---

## 5. Chart and HUD

| Surface | Today | Cite |
|---|---|---|
| Chart | DOM/SVG overlay; KeyM; Escape/close | `galaxychart.js` 5–31, 240–250 |
| Chart pause | **does not** pause | `galaxychart.js` 21–24 |
| Chart z-index | **30** (full-screen scrim) | `hud.css` 1421–1431 |
| `#hud` z-index | **10** | `style.css` 28 |
| Toasts | `top: 14px; right: 168px`; `aria-live` on `#hud .rw-toasts` | `hud.css` 588–594; `hud.js` 723–727 |
| Arrival banner | **top-right** `top: 96px; right: 14px` | `hud.js` 597–601, 734–739 |
| POS sysname | left stack, not top-center | `hud.js` 660, 878–880 |
| Chart open flag on ctx | **none** (local `open`) | `galaxychart.js` 230–236 |
| Chart docked | force close | `galaxychart.js` 258 |
| Node click | **none** (no plot UI in live chart) | `galaxychart.js` 184–209, 257–281 |
| Autopilot button | **none** | — |
| `innerHTML` in chart/hud/gate/station | **none** (station uses `h()` / `textContent`) | grep 0 on those four for `innerHTML` |
| 80 px hub | reticle clamp `cx-44` | `hud.js` 1077 |
| Jump charge box | **center of glass** (`left/top 50%`); `pointer-events: none` | `hud.js` 632–646, 742–744 |
| Context prompt | D Dock; else D/G Jump; else Hail/Target | `hud.js` 1750–1764 |
| Hub prompt | `G route i/n · D — Jump to NAME` | `hud.js` 1758–1761 |
| Hull bands | `>0.5` ok; `>0.25` warn; else crit | `hud.js` 1518–1526 |
| `hullBand` event | warn\|crit, ≤1/2s | `hud.js` 1523–1525; `ctx.js` 227 |
| Combat fade | `#hud.in-combat` | `hud.js` 1487–1495 |

In-flight AP chrome must **not** sit on the 80 px hub. The jump charge box already occupies center **during** jump and is not a click target. `#hud` toasts sit **under** the open chart. `.rw-banner` is top-right, not a top-center slot.

---

## 6. Overlays / pause / hail

| Surface | Today | Cite |
|---|---|---|
| Station overlay | `flags.docked`; Digit 0 = shipyard | `station.js` 4200–4205, 5710–5717 |
| Pause | `flags.paused`; **systems do not tick** | `main.js` 140–146, 166–167 |
| Title | pauses at boot | `title.js` 5, 57 |
| Origins | pauses until pick | `origins.js` 90, 117 |
| Models browser | pauses while open | `modelsbrowser.js` 8 |
| Hail | world **stays live**; card uses Digit 1..n | `hail.js` 8–38 |
| Gate overlay | jump fade, `pointer-events: none` | `gate.js` 484–486 |

---

## 7. Events (frozen list)

`ctx.js` 198–228. Relevant:

- `'jumpRequested' { to }`
- `'systemLoaded' { to }`
- `'bodyHit' { kind, speed, damage }`
- `'sunHeat' { t, dps }`
- `'sunKill' { reason: 'sun' }`
- `'hullBand' { band }`
- `'hailOpened'` / `'hailClosed'`
- `'docked'` / `'undocked'`
- `'reticleLock' { hit }`
- `'commLine' { text, from }`

`emit` spreads `data` onto the event (`ctx.js` 230–231). Mesh / live ship refs on a **new** AP event are forbidden.

---

## 8. Init / tick order (load-bearing)

`main.js` 98–128:

title → starfield → solarsystem → asteroids → station → landmarks → **gate** → **controls** → settings → bio → **ship** → world → contacts → mystery → epics → **jump** → traffic → **npc** → combat → pods → wakes → hail → song → **save** → origins → onboarding → **galaxy chart** → models → **hud**

Gate reads **previous-frame** `dockPressed` (controls has not published this frame yet). Jump consumes `jumpRequested` **same frame** as gate emit.

Paused: the `for (system of systems)` loop does not run (`main.js` 140–143).

---

## 9. What NAV-03 cannot assume is live

- Plotted dest / hop list / remaining jumps (NAV-01).
- In-flight next-gate marker (NAV-02).
- Any `flags.autopilot`.
- Shared exported avoid helper (must extract or export later).
- Chart node click (NAV-01).

---

## 10. Regression risks already named in wishlist

Pathfinding on missing gates; HUD vs lock; control handoff spike; collide with traffic/station/gate; combat interrupt feel; save mid-route restores flying steer (`PLAYER-EXPERIENCE-WISHLIST.md` 778–782).
