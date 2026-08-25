# Wave 116 NAV-05 remaining autopilot gate handoff — live inventory

**Wave:** 116 leftover census. Markdown only.  
**Date:** 2026-08-24.  
**Rule:** **Code wins.** Line numbers are a Wave 116 snapshot. Re-grep before a later impl. Do not treat Wave 84 “no autopilot in src” comments as live.

Locked sources (cite, do not rewrite): `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, `docs/Nav04HoverDesign.md`, `out/w84/nav03/**`. Inbox: `docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox P0 NAV (do not edit).

---

## 0. Verdict (code wins)

| Question | Answer |
|---|---|
| NAV-03 autopilot in `src/`? | **LIVE** (`src/game/autopilot.js`) |
| Sole `jumpRequested` writer? | **`src/systems/gate.js` 649** |
| Next hop? | **`world.nav.path[1]`** (`autopilot.js` 101–106; `gate.js` 642) |
| Restore flying? | **No.** `sanitizeNav` / `writeNav` always `autopilot: false` (`nav.js` 48–55, 191) |
| MATCH refuse? | **LIVE** (`apRefuseToken` `'match'`; `ship.js` `matchSpeedPressed && !apOn`) |
| PHY-02 bias? | **LIVE** `applyAvoidBias` (`autopilot.js` 275) |
| English distinct for lookup vs path vs hub vs hop vs gate vs arrive? | **NO.** `missingHop` and `missingGate` share “next gate is missing.” Path fail, lookup refuse, hub not-listed, and hub wrap all collapse to `missingGate` on the fly path. |
| Live plotted multi-hop asserts `systemLoaded` sequence? | **NO.** WAVE85 / WAVE88 pins check source greps, teleport-into-zone `jumpRequested`, or `yaw`/`throttle`/`wantJump`. No WAVE87 string in `scripts/boot-test.mjs`. |
| Handoff reliable in a valid zone? | **Not proven.** Nearest-assembly zone + hub not-listed cancel can fire `missingGate` while the routed ring is also inside `JUMP.zone` (60). |
| Leftover? | **REAL.** Not CONSUME. Serial is **not** none. |
| First serial name | **PR1 autopilot gate handoff** |

---

## 1. Autopilot command computer (`src/game/autopilot.js`)

Header (1–4): owns live channel. Does not move the mesh. Does not write `input.*`. **Does not emit `jumpRequested`.**

### 1.1 Channel

`CHANNEL_KEYS` 16–18: `engaged`, `yaw`, `pitch`, `throttle`, `wantJump`, `cycleHub`, `reason`.  
`emptyChannel` 62–71. `bindChannel` 74–87 strips unknown keys (no `for-in` merge from save).  
Live home: `ctx.autopilot` (`src/core/ctx.js` 96–105). **Not** `WORLD_FIELDS`.

### 1.2 English locker (`AP_LINES` 20–32)

| Token | Live English |
|---|---|
| `match` | Autopilot refused — MATCH is on. |
| `noDest` | Autopilot refused — plot a destination first. |
| `here` | Autopilot refused — already in the destination system. |
| `docked` | Autopilot refused — docked. |
| `jumping` | Autopilot refused — jump in progress. |
| `paused` | Autopilot refused — game paused. |
| **`missingHop`** | **Autopilot refused — next gate is missing.** |
| `cancel` | Autopilot cancelled. |
| `input` | Autopilot cancelled — manual helm. |
| **`missingGate`** | **Autopilot cancelled — next gate is missing.** |
| `arrive` | Arrived — autopilot off. |

`BREAK_LINE` 34–39 maps cancel tokens to `AP_LINES`: `cancel`, `input`, **`missingGate`**, `arrive` only.

**Collapse (leftover):** `missingHop` and `missingGate` differ only by refused vs cancelled. The rest of the sentence is identical. Fly-path lookup, NaN pose, `planApPath` fail, hub not-listed, hub wrap, and missing `path[1]` all call `disengage(ctx, 'missingGate')`. A player (and a verifier) cannot tell those failures apart.

### 1.3 Next hop / dest

- `nextHopId` 101–106: `path[1]` if `path.length >= 2` and hop is a string, else `''`.
- `destIdOf` 108–110: `nav.dest` string.
- `flyingFlag` 96–98: `Object.hasOwn(nav, 'autopilot') && nav.autopilot === true`.

### 1.4 Engage / refuse (`apRefuseToken` 165–178)

Order: no dest/path → `noDest`; dest === here → `here`; docked; jumping; paused; **MATCH** → `match`; dest !== here && !hop → **`missingHop`**; dest !== here && **`!resolveNavGatePos(ctx, hop)`** → **`missingHop`** (lookup refuse uses the hop token); else `''`.

`tryEngage` 199–213: refuse token or set `nav.autopilot = true`, emit `autopilotEngaged` `{ dest }`.

`disengage` 181–197: `nav.autopilot = false`, `zeroCmd`, `reason`, `resetApproach`. If was flying and reason !== `'restore'`: emit `autopilotDisengaged` `{ reason }` and `commLine` from `BREAK_LINE` only (unknown tokens emit the event with **no** toast).

### 1.5 Aim / handoff (`aimAtGate` 226–352)

1. `resolveNavGatePos(ctx, hop)` null or no ship → **`disengage('missingGate')`** (228–231).
2. `ctx.gate.jumping` → `zeroCmd`, return (233–236).
3. Non-finite ship or gate pose → **`missingGate`** (238–243).
4. `collectBodies` + `appendSunBody` + **`planApPath`** (247–262). If `!planned.ok` or aim not finite → **`missingGate`** (263–266). **Path planner is not a distinct toast.**
5. PHY-02 **`applyAvoidBias`** (275). Consume. Not a planner.
6. Throttle via `throttleForPath`. If `inZone && (nearTo === hop || nearHub)` cap 0.35 (307–309).
7. **`wantJump`** 317: `inZone && !docked && nearTo === hop`.
8. Hub branch 319–350: `inZone && nearHub && nearTo !== hop`:
   - Walk `systems[currentSystem].hub.routes` (authored, not live assembly). If hop **not listed** → **`missingGate`** (329–331).
   - `hubWrap > nearRouteCount` → **`missingGate`** (338–341).
   - Else `cycleHub = true`, `hubWrap += 1`.
9. Else `cycleHub = false`. Reset wrap only when `!inZone || !nearHub` (346–349). **Wrap is not reset when `nearTo === hop`.**

**Handoff gap:** zone identity is **`ctx.gate.nearTo` (nearest assembly)**. A hub that does not list the hop still triggers **immediate `missingGate`** even if a physical ring with `to === hop` is also inside `JUMP.zone` (60). That matches the inbox: reach the plotted gate zone, then cancel “next gate is missing.”

### 1.6 Fly tick (`flyTick` 354–391)

- Not flying → zero cmd.
- `inputBreak` (strafe/roll/throttle/afterburner/drift/fullStop / armed steer ≥ `AP_STEER_BREAK` 0.65). Chart open disarms steer (142–163).
- Paused or docked → zero cmd, **stay engaged**.
- **`scanEvents(ctx, 'systemLoaded')` reads `ctx.lastEvents` only** (132–140, 372–380). If `currentSystem === dest` → `arrive`. Else `resetApproach()`.
- Then `nextHopId`. If `!hop` or dest === current: arrive or **`missingGate`** (382–387).
- Else `aimAtGate`.

**Tick order (load-bearing):** `main.js` 104–136: **gate → controls → autopilot → … → jump → nav**. Gate sees **previous-frame** `wantJump` (same as `dockPressed`). Jump midpoint + `systemLoaded` run **after** AP in the same frame. AP sees `systemLoaded` on **`lastEvents` the next frame**, after NAV-01 has already sliced `path`.

`initAutopilot` 393–410: `update` calls `flyTick` only while `flyingFlag`.

No `Digit`, no `KeyM`, no `KeyV` in this file.

---

## 2. Gate (`src/systems/gate.js`) — sole `jumpRequested` emitter

### 2.1 Live lookup

`RESERVED_NAV_IDS` 419–423 (proto / constructor / …).  
`lookupLiveNavGate(to, expectSystem)` 459–476:

- reserved / `!_liveReady` / no assemblies → `null`.
- `expectSystem !== undefined && expectSystem !== _builtSystem` → `null`.
- Walk live assemblies: **physical `a.to === to` wins**; else hub if `hubListsHop`.
- Primitives only. Never a mesh.

`rebuild` 497–557: `_liveReady = false` at start; `_liveReady = true` at end (556). Early return on reserved/unknown system leaves `_liveReady` false.

### 2.2 Zone + AP jump (618–666)

Nearest assembly in `JUMP.zone` (squared). Publishes `inZone`, `nearTo`, `nearHub`, `nearRouteIndex`, `nearRouteCount`.

```
nextHop = nav.path[1]
apJump = nav.autopilot === true
      && ctx.autopilot.wantJump === true
      && near && near.to === nextHop
if (inZone && !docked && !jumping && (input.dockPressed || apJump))
  emit('jumpRequested', { to: near.to })
```

**`to` is always live `near.to`.** Never `world.nav.dest`. Never AP-stuffed id.

Then hub cycle (652–666): `autopilot && cycleHub && zoneHub && nextHop && zoneHub.to !== nextHop && !docked && !paused && !jumping` → modulo `routes` (same as KeyG 580–585). Updates `zoneHub.to` and `ctx.gate.nearTo`. **Cycle is after the emit check** (cannot jump and cycle the dest in one emit).

Grep: **only** `gate.js` in `src/` emits `jumpRequested` (aside from tests/scripts). WAVE85 pin `jumpOnlyGate` greps AP/ship/HUD/chart/npc.

### 2.3 Independence from KeyD

`apJump` is **OR** `input.dockPressed` (648). AP jump does **not** require the D key. CTL-01 (sibling) may rebind dock. This leftover must keep `apJump` independent.

---

## 3. Jump (`src/game/jump.js`)

- Consumes `jumpRequested` `{ to }` same frame (200–210). First event only.
- `beginJump` 101–118: non-string / unknown `SYSTEMS[to]` ignore. Standing refuse `JUMP_REFUSE_LINE` (no swap).
- Charge: `JUMP.chargeTime` (`state.js`; AP does not mention `chargeTime` — WAVE85 `chargeStay`).
- Midpoint 120–179: despawn, **null lock**, `currentSystem = to`, relocate, zero velocity, `jumpGraceUntil`, **`emit('systemLoaded', { to })` 165**.
- AP does **not** write `currentSystem`. No teleport in `autopilot.js`.

---

## 4. Guidance (`src/systems/nav-guidance.js`)

- `RESERVED_IDS` 17–21.
- `resolveAuthoredNavGate` 56–86: authored positions **for tests**. Not the fly aim.
- **`resolveNavGatePos` 89–97:** reserved → null; if `currentSystem` string, refuse reserved current, then **`lookupLiveNavGate(nextTo, cur)`**. **No authored ghost fallback** (comment 10–11).
- Next hop for HUD: `path[1]` (129–130).

---

## 5. Path math (`src/game/ap-path.js`)

Pure math. No ctx writes. No emit.

`planApPath` 352–409:

- Non-finite P or G → `{ ok: false, hold: 'none', … }` (360–369).
- Else **always `{ ok: true }`** even when detour does not clear (walkDetour `clear: false` still returns finite aim; `detourForObstacles` may `hit: false` and fall through to gate/widen).

**Census:** live `ok: false` is almost only NaN inputs. AP still maps that to **`missingGate`**. Distinct path toast is missing.

Skip keep: `gate` / `player` / `ship` / `asteroid` (41–43). Sun/station chords remain. PHY-02 bias is a **later** `applyAvoidBias` call, not this planner.

---

## 6. NAV-01 persist (`src/game/nav.js` + `save.js`)

- `WORLD_FIELDS` includes `'nav'` (`save.js` 99–100). Comment: `{ dest, path, remaining, status, autopilot }`.
- `writeNav` 48–55: **always `autopilot: false`** on keep/heal.
- `sanitizeNav` 192–269: drop unknown dest/status/path; blocked empty path; arrived must be here; plotted slice to `currentSystem`; `pathEdgesOk` else BFS; **no extra keys kept**. Restore cannot leave `autopilot: true`.
- WAVE85 boot: proto dest drop, stuffed keys drop, `autopilot: true` sanitizes false, snapshot does not round-trip true.

**This leftover:** `state.js` READ-ONLY. **No new persist key.** `world.nav` stays **one** record. Next hop stays `path[1]`. Restore still forces `autopilot: false`.

---

## 7. Chart Autopilot + in-flight chip

| Surface | Live | Cite |
|---|---|---|
| Chart button | `textContent = 'Autopilot'`; cancel label while flying | `galaxychart.js` 150–151, 590–594 |
| Click | `tryEngage` / `disengage('cancel')`; refuse via `apLine` + header live + `commLine`. Chart Cancel does **not** `showApLive`. Fly `disengage` never writes `apLive` | 619–634 vs 572–576 |
| Overlay vs HUD | Chart `z-index:30` 82% scrim; `#hud` `z-index:10`. Chip and toasts sit under the overlay while KeyM stays open | `hud.css` 1898–1912; `style.css` 24–28 |
| Space | `guardAutopilotSpace` preventDefault | `autopilot.js` 215–218; chart 153 |
| Chip | `#hud .rw-autopilot`; dest / next / rem / Cancel | `hud.js` 1012–1020, 1691–1694, 1953–1960 |
| Chip CSS | Chip in `#hud .rw-chip-stack` (`top: 14px`; `left: 50%`). WAVE85 pin greps `#hud .rw-autopilot` plus those two strings (they live on the stack, 648–652) | `hud.css` 648–715 |
| Cancel | `disengage(ctx, 'cancel')`; `aria-label` Cancel autopilot | `hud.js` 1016–1020 |

**Later impl write-set for NAV-05 must not claim `hud.js` / `hud.css` / `controls.js`.** Chip dest/next/rem copy stays. Do **not** put a reason paragraph on the chip. Failure English stays `AP_LINES` + `commLine` + chart `apLine`. Later PR1 **does** include `src/systems/galaxychart.js` **only** so existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, including chart Cancel. Do **not** close the chart on engage. Sibling HUD-02 / CTL-01 own HUD/CTL files. Overlay CSS stays in `hud.css` (do not restyle z-index here).

---

## 8. MATCH / PHY-02 / Digit / keys / hub

| Law | Live |
|---|---|
| MATCH refuse consume | `apRefuseToken` `'match'`; `ship.js` 742 `matchSpeedPressed && !apOn`; WAVE85 `matchRefuse` / `matchIgnore` |
| PHY-02 bias consume | `applyAvoidBias` export + AP call. Not a navmesh. Not `planApPath` in NPC. |
| Digit 0–9 | Dock services `station.js` `DOCK_KEY_SERVICES` 188 (shipyard is the Digit 0 slot). AP has no Digit. Chart has no Digit0. |
| KeyM | Chart toggle `galaxychart.js` 24, 669. AP does not steal. |
| KeyV | Reticle lock `controls.js` 44, 283–284. AP does not steal. |
| HUD-01 empty hub | Chip is **not** `.rw-reticle`. WAVE85 `chipCss`. |
| `innerHTML` | WAVE85 `noInner` greps hud + chart. AP/guidance/nav: no `innerHTML`. |
| `state.js` | AP reads `JUMP.zone` only (import 9). No write. |

---

## 9. Boot pins (NAV-03 / WAVE85 / WAVE87 / WAVE88)

| Pin | Where | What it actually asserts |
|---|---|---|
| WAVE85 NAV persist | `scripts/boot-test.mjs` ~18806–19062 | sanitize, `WORLD_FIELDS` nav, autopilot false |
| WAVE85 NAV chart | ~19065–19352 | click/plot, chartOpen |
| WAVE85 NAV guidance | ~19355–19536 | readout / cue / `path[1]` |
| **WAVE85 NAV-03 AP PR3–PR6** | **19539–19713** | sole gate emit, `apJump` predicate grep, MATCH refuse, WASD cancel, chart steer ignore, stuffed false, **no jump out of zone**, chip CSS, **arrive by stuffing `currentSystem` + fake `systemLoaded`** (19647–19651) — **not** a live hop |
| **WAVE85 AP path** | **19716–19870** | `canTransit`, live lookup, **teleport ship into veridian gate**, 3 ticks, **`jumpRequested` to veridian** (`zoneJump`). One local hop. **No `systemLoaded` sequence.** |
| **WAVE88 AP geometric** | **19873–20043** | `planApPath` sun detour / NaN fail / widen; live **`throttle`/`yaw`/`wantJump === false`** near a gate (`noOrbitCmd`, `wantJumpStay`). **Ship never leaves the system.** |
| WAVE87 | **ABSENT** from `boot-test.mjs` | Wave 87 leftover lives in frozen `out/w87/ap-path/**` probes, not a WAVE87 boot string |

**Inbox verification gap (leftover):** later pin **must** plot a **multi-hop** (example: freehold → `vd_survey` via `path[1] === 'veridian'` — already in WAVE85 `plotVia` 19767–19769), fly or charge through **real** `jump.js`, and assert `systemLoaded` `to` / `world.currentSystem` sequence. Steering commands alone are **not** enough.

Honor WAVE85 / WAVE88 pins. Do not invert them. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).

---

## 10. Tick / emit sequence (handoff)

```
frame N (ship already in routed zone, previous wantJump true):
  gate.update     publish inZone/nearTo
                  apJump? emit jumpRequested { to: near.to }
                  maybe cycleHub using previous cycleHub
  controls        dockPressed edge (D) — independent
  autopilot       publish this-frame wantJump / cycleHub
  …
  jump.update     consume jumpRequested; start charge
frame midpoint:
  jump            currentSystem swap; emit systemLoaded { to }
  nav             slice world.nav.path
frame N+1:
  gate            rebuild live assemblies; _liveReady true
  autopilot       lastEvents systemLoaded → arrive or resetApproach; new path[1]
```

Lag: `wantJump` is always **one frame** behind zone (documented NAV-03). Emit still requires **this-frame** `near.to === nextHop`. Stuck `wantJump` cannot jump a wrong spoke.

Cancel lag: `aimAtGate` can `disengage('missingGate')` **after** setting `wantJump` only on the hub-not-listed / wrap branch (`nearTo !== hop`, so `wantJump` is already false). The inbox cancel is **not** a double-emit; it is **abort instead of wait/cycle/steer**.

---

## 11. What is already good (consume, not this leftover)

- NAV-01 persist + BFS + restore `autopilot: false`.
- NAV-02 marker / readout consume `path[1]` + `systemLoaded`.
- NAV-03 engage/cancel/MATCH/chart button/chip/steer-break/PHY-02 bias/sole emit/no teleport.
- NAV-04 hover (Wave 96) — **cite, do not rewrite**.
- `planApPath` geometry (WAVE88) — consume as math; do not turn AP into a second planner.

---

## 12. What is leftover (real)

1. **Handoff:** nearest-hub not-listed / hub wrap / collapsed `missingGate` can cancel in a valid routed activation zone instead of jumping.
2. **Reason detail:** lookup vs path vs hub vs missing-hop vs missing-gate vs arrive are **not** distinct English.
3. **Verifier:** no live plotted multi-hop `systemLoaded` / `currentSystem` sequence pin.

If this census had shown distinct lines **and** a live multi-hop `systemLoaded` pin **and** no zone-cancel path, leftover would be CONSUME and serial **none**. It did not.
