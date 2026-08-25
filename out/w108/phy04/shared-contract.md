# PHY-04 remaining NPC avoid shared contract

**Wave:** 108. Design only. No avoid feature ships in this wave.  
**Status:** MERGE LAW for `docs/Phy04AvoidDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave108.md`.  
**Locked sources:** wishlist PHY leftover (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1020–1053: NPC avoid still lookahead, not full path planning; traffic should complete routes without routine collisions); live inventory `out/w108/phy04/current-phy04-inventory.md` (code wins); Wave 53 PHY first pass; Wave 58 gate torus / station holds / station-gate avoid (PROGRESS 2884–2907; `out/w58/`).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 53 “gates have no volume” comments.

**PHY-01** (solid bodies + bounce/slide) is **landed**. Not this leftover. Do **not** replace `resolveMover`. Collision stays the safety net.

**PHY-03** (sun heat/kill) is **landed**. Do **not** retune `SUN_HEAT_MULT` 2.4, `SUN_LETHAL_MULT` 1.12, `SUN_HEAT_DPS`, `SUN_HEAT_RAMP`.

**FLT** player flight is **other work**. Manual helm has no lookahead (`ship.js` grep `applyAvoidBias` = 0). Player station/gate is Wave 53/58 **collision**. Do not add player FLT avoid.

**NAV-03 / NAV-04** Autopilot / MATCH / hover are **other workers**. Do **not** steal. Do **not** import `planApPath` into the NPC tick.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No avoid pip, traffic arrow, or keep-out ring on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `hud.css` 184–193). **Do not** put avoid chrome inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` 188, 6041–6043). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers. First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Avoid is not a dock verb. **No toast required.**
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. This serial has **no new DOM**.
5. `src/game/state.js` is READ-ONLY later. **No** `SHIP_CLASSES` avoid fields. **No** new class keys. **No** PHY keys on `state.js` (`physics.js` 4–5). Do **not** invent UU. Do **not** invent standing deltas. Do **not** invent SKU.
6. Persist: **no** new `WORLD_FIELDS` key. **No** persist key. **No** new `localStorage` avoid key. Autosave stays `rimward-save-v1` (`save.js` 16, 76–101). Avoid is **live steering**. Recompute each frame from the collision bag. Do not persist `avoidHits`, detours, or hold samples.
7. Prototype-safe later helpers: never `for-in` merge from a save blob into avoid state. There is **no** avoid blob. Bag slots stay `{ kind, x, y, z, r, y0, y1, id }` (`collision.js` 50, 56–65). Do not index user strings as bag kinds.
8. Collision response stays the safety net (PHY-01). Do **not** replace bounce/slide. Do **not** delete `bounceLive` / player `resolveMover`.
9. Sun heat/kill stays (PHY-03). Player bounce still **strips sun** (`ship.js` 908–914). NPC `appendSunBody` still uses heat radius, not lethal radius (`npc.js` 677).
10. Autopilot / MATCH / hover stay other workers. NPC **must not** call `planApPath`. Player AP may keep `applyAvoidBias` after its own path (`autopilot.js` 275). Do **not** change `skipAvoidBody` player-gate skip (bore stays a lane for AP).
11. This leftover is **NPC** avoid unless a later census proves manual player still tunnels stations/gates. Wave 108 census: player does **not** tunnel D5/torus at cruise; leftover stays NPC.
12. BIO-06/08 motion, BIO-07 meshes, kit mutate omit — **not** this brief.
13. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Owner docs, wishlist, `PROGRESS.md`. Do not write `docs/OwnerDecisionsWave108.md`. Deputize defaults live in **this** contract.
14. Do not “fix” known boot FAILs.
15. CPU freeze: **no** per-NPC A* grid. **no** navmesh. **no** extra `{ count, items }` alloc per NPC per frame. Reuse module `_bodies` / `_aimAvoid` / collision scratch. At most **two extra probes** per body per NPC beyond the live 40 u sample (deputize §0.1).
16. Fail closed: if avoid data missing, keep **live** lookahead bias (or dest if `!_phyOn`). **Never** freeze NPCs in place. **Never** zero cruise because the bag is empty.
17. Gate torus math already shipped (Wave 58). Do **not** rewrite `torusOverlap` / `gateProbeHits` as the PHY-04 feature. Consume them.
18. Station keep-out path test already shipped (`stationKeepOutHits`). Do **not** delete it. Additive samples apply to **non-station** kinds first.

---

## 0.1 Wave 108 deputize (owner may override after playtest)

Pick playable avoid defaults. **No live second sample exists** (inventory §12). Do not park. Do not invent UU / SKU / Digit. Do not invent a planner.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `AVOID_LOOKAHEAD` | **40** | `physics.js` 19 |
| `AVOID_GAIN` | **1.4** | `physics.js` 20 |
| Inside-station gain | `look * gain * 2` | `npc.js` 653 |
| Station path test | hull + probe + XZ chord | `npc.js` 537–561 |
| Gate probe | torus, bore empty | `npc.js` 471–487 |
| Collect | once per NPC update | `npc.js` 2262–2264 |
| Bounce | every live tick if `_phyOn` | `npc.js` 2337 |

Do **not** “fix” PHY-04 by cranking lookahead to 200 or gain to 8. That is still a bias, and it yanks combat envelopes.

### Smallest additive steer (reads as path, not a planner)

**Name:** two-sample lookahead (live 40 u + mid-chord 20 u), still a **lateral aim bias**.

| Piece | Freeze |
|---|---|
| Fail-closed | Live `applyAvoidBias`: one probe at 40 u, station keep-out, gate ring lateral, inside XZ eject. If the mid sample helper is missing, **keep this**. |
| Additive PR1 | One extra probe at **t = 0.5** along hull → 40 u heading point, for kinds **other than** `station` (station already has a path test). Same `probeHitsBody` / `addLateralAway` / `nearestGateRing`. Same `_v2` accumulate + one normalize. |
| Not PR1 | A* , navmesh, `planApPath`, dest rewrite persist, Digit, HUD, `state.js` |
| Samples cap | Live 40 u + **one** mid sample. Optional PR3 may add **one** far sample at **80 u** (`2 * lookahead`) only after playtest still shows routine sun/asteroid hits. Never a third extra. |
| Hold reuse PR2 | **Live retarget only.** If the current route/loiter dest sits in / through the station cylinder and `stationKeepOutHits` is 1 or 2, aim `writeStationHold` / `minerHoldFromStation` for **this frame**. Do **not** write `record.route`. Do **not** persist. Patrol pad-center dest may use this; trader/miner authored holds already exist. |
| Gate torus | **Already shipped.** PR1 may sample the tube at t=0.5. Do not change bore-empty law. Player AP still skips gate bodies. |

Owner freeze (do not invert):

- Keep lookahead as fail-closed.
- The extra sample is **cheap math on the existing bag**, not a graph.
- Combat still skips the current target (`skipAvoidBody`).
- Avoid still **does not replace** combat / waypoint aims — only adds offset (`npc.js` 605–606).
- If both samples miss, dest is unchanged (live).
- If bag / `_phyOn` / object missing, dest is unchanged (live). **Never stop.**

### Formulas (later impl)

```
look = PHY.AVOID_LOOKAHEAD            // 40; do not retune as the feature
mid  = look * 0.5                     // 20; deputize
far  = look * 2                       // 80; PR3 only if playtest still collides

fwd  = -Z * live.quaternion
p1   = pos + fwd * look               // live
p0.5 = pos + fwd * mid                // PR1 additive

hits += probe at p1                   // live
hits += probe at p0.5 if kind != station
station: keep stationKeepOutHits(p1, pos)   // live path test; do not double-count as two laterals unless already live

if hits && lateral.lenSq > 1e-8:
  outAim = dest + normalize(lateral) * look * gain * (insideStation ? 2 : 1)
else:
  outAim = dest
```

`live.avoidHits` stays a **count** on the dummy/live object. Not HUD. Not persist.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Navmesh / flow field / A* grid per NPC | **Forbidden** §0.15 |
| Import `planApPath` into `steerLive` | **Forbidden** §0.10 |
| Crank `AVOID_LOOKAHEAD` / `AVOID_GAIN` as the leftover | **Forbidden** (still a bias; envelope yank) |
| Replace bounce with “stop until clear” | **Forbidden** §0.8, §0.16 |
| Freeze hull when bag empty | **Forbidden** §0.16 |
| Persist detour waypoints | **Forbidden** §0.6 |
| Avoid pip / RANGE rewrite | **Forbidden** §0.2 |
| Digit / SKU / UU “navigator” | **Forbidden** §0.3, §0.5 |
| Player FLT lookahead | **Forbidden** §0.11 |
| Retune sun lethal/heat | **Forbidden** §0.9 |
| Rewrite gate torus from scratch | **Forbidden** §0.17 |
| Rewrite trader/miner authored holds | **No** — already Wave 58; consume |
| `state.js` PHY table | **Forbidden** §0.5 |
| New `ctx.emit` avoid type | **No** unless a later owner serial needs telemetry; default **none** |
| Toast “traffic clear” | **No** |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `applyAvoidBias` | PHY-04 PR1 (npc.js) | `steerLive`; player AP (do not break export) |
| `PHY.AVOID_*` | **none** (honor 40 / 1.4) | npc.js, kernel pins |
| `collectBodies` / `resolveMover` | **none** this leftover (honor) | npc, ship, AP collect |
| `writeStationHold` | PR2 may **call** | world.js routes stay owner |
| `planApPath` | **none** | autopilot only |
| `state.js` | **none** | cruise read via existing `SHIP_CLASSES` |
| HUD / Digit | **none** | — |
| `WORLD_FIELDS` | **none** | — |

Export `applyAvoidBias` **stays**. Boot / AP import it (`autopilot.js` 10; `boot-test.mjs` WAVE85).

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `ctx.gate.jumping` / `!_phyOn` | dest unchanged; no bounce (live) |
| Missing bag / count 0 | dest unchanged |
| Missing `live.object` | dest unchanged |
| Mid-sample helper not yet landed | **live single probe** |
| Hold writer missing in PR2 | **live dest + live keep-out** |
| NaN positions | existing collision NaN-safe; do not throw |
| Unknown `body.kind` | treat as sphere if `r` finite; else skip |
| Combat target in bag | skip (live `skipAvoidBody`) |
| Player AP + gate | skip (live; bore is the lane) |

Never: `speed = 0` because avoid missed. Never: `ai.mode = 'wait'`. Never: persist a hold sample onto `record.route` from avoid.

---

## 3. Serial PR plan (named only)

Do **not** implement in Wave 108.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 two-sample** | Mid probe t=0.5 in `applyAvoidBias` for non-station kinds; module scratch only; keep 40 / 1.4; keep export | `state.js`; Digit; persist; navmesh; `planApPath`; player FLT |
| **PR2 live hold retarget** | Frame-only station hold aim when dest/path is through D5; call existing `writeStationHold` / `minerHoldFromStation`; no route write | Patrol persist rewrite; AI job rewrite; pad-heal reopen except consume `healPadHome` |
| **PR3 far sample (optional)** | One 80 u sample if playtest still shows routine sun/asteroid hits | Third extra sample; gain/lookahead retune; sun radius retune |
| **PR4 pins** | Kernel/boot source pins for two-sample + fail-closed dest; grep no persist key; no hub child; no Digit steal | Known boot FAIL fixes; wishlist rewrite |

First remaining serial is **PR1**. It must **not** steal Digit 0/8/9. It must **not** write `state.js`.

---

## 4. Security freeze (later impl)

1. No persist blob → no proto merge from save.
2. No new DOM / `innerHTML`.
3. No user-authored shader / HTML from avoid.
4. Bag `kind` is engine-authored (`station|gate|asteroid|ship|player|sun`). Unknown → skip or sphere; never `obj[kind]()` dispatch from a string in a save.
5. Do not log player names beside `avoidHits`.
6. No secrets.

---

## 5. Acceptance direction (implementation wave)

1. Representative trader/miner legs complete without **routine** station/gate/asteroid/sun **bounces**. Occasional bounce still allowed (safety net).
2. Live single-probe path still works if PR1 helper is absent (fail closed).
3. `AVOID_LOOKAHEAD` 40 and `AVOID_GAIN` 1.4 unchanged unless owner overrides after playtest.
4. PHY-01 bounce still fires on ram. PHY-03 heat/kill radii unchanged.
5. Player manual flight unchanged. Player AP still threads gates (`skipAvoidBody` gate skip).
6. No avoid persist key. Digit 0 shipyard. Hub 80 px empty of new children.
7. No navmesh. No per-NPC grid. No extra bag alloc per NPC.
8. Jump / empty bag: NPCs keep flying the dest.
9. Combat envelope still aims; avoid is additive; current target skipped.
10. `innerHTML` = 0 on paths the serial touches.
