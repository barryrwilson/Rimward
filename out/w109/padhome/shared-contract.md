# PHY-05 remaining pad-home shared contract

**Wave:** 109. Design only. No pad-home feature ships in this wave.  
**Status:** MERGE LAW for `docs/Phy05PadHomeDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Phy04AvoidDesign.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave109.md`.  
**Locked sources:** wishlist PHY-02 / AI-01 (traffic must not treat the station cylinder as a tunnel, including after save/load); live inventory `out/w109/padhome/current-phy05-inventory.md` (code wins); Wave 58 trader/miner holds; Wave 59 `healPadHome`; PHY-04 sibling frame-only retarget (`out/w108/phy04/shared-contract.md` PR2 — **other worker**, do not change `applyAvoidBias` here).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments (“waypoint 0 is gate for patrols”).

**This leftover is authorship / persist heal.** It is **not** lookahead. It is **not** PHY-04 two-sample. It is **not** a navmesh.

**PHY-01** bounce/slide is **landed**. Collision stays the safety net. Do **not** replace `resolveMover`.

**PHY-03** sun heat/kill is **landed**. Do **not** retune sun radii.

**PHY-04** remaining avoid is a **sibling**. Do **not** specify changing `applyAvoidBias`. PHY-04 PR2 must **not** write `record.route`. This leftover **may** write `record.route[0]` on existing arrays.

**FLT / NAV-03 / NAV-04** are **other workers**. Do **not** steal MATCH/hover/AP. Do **not** import `planApPath` into NPC. Do **not** add player FLT avoid.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No pad-home pip, hold marker, or station-ring on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `src/ui/hud.css` 184–193). **Do not** put pad-home chrome inside `.rw-reticle`. **No new DOM.** **No toast required.**
3. Digit 0 stays **shipyard** (`station.js` 188, 6041–6043). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers. First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Pad-home is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only.
5. `src/game/state.js` is READ-ONLY later. **No** `SHIP_CLASSES` pad-home fields. **No** new class keys. **No** PHY keys on `state.js`. Do **not** invent UU. Do **not** invent standing deltas. Do **not** invent SKU.
6. Persist: **no** new `WORLD_FIELDS` key. Inventory proves rewrite lives on existing `record.route` (`save.js` 76–101 already serializes `recordBanks` / `records`). Autosave stays `rimward-save-v1`. Allowed write: **`record.route[0]`** `{x,y,z}` via `writeStationHold` (same shape Wave 59). **No** `world.padHome`. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from a save waypoint into a hold. Assign a **new** plain `{x,y,z}` (live `healPadHome` already does this). Do not `Object.assign(route[0], saveWp)`. Do not index user strings as `SYSTEMS[sysId]` without `Object.hasOwn` (live 707). Role allowlist only.
8. Collision response stays the safety net (PHY-01). Do **not** replace bounce. Do **not** freeze hulls to “wait for a hold.”
9. Sun heat/kill stays (PHY-03). Do **not** retune radii.
10. Autopilot / MATCH / hover stay other workers. NPC **must not** call `planApPath`. **No navmesh. No A\*.**
11. PHY-04 two-sample / frame retarget is **sibling**. Do **not** change `applyAvoidBias` as this leftover. Do **not** restated PHY-04 as the pad-home fix.
12. BIO-06/08 motion, BIO-07 meshes, kit mutate omit — **not** this brief.
13. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Phy04AvoidDesign.md`. Do not write `docs/OwnerDecisionsWave109.md`. Deputize defaults live in **this** contract.
14. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). Later serial **may** invert `out/w58/routes` `src.patrolCenter` and `out/w59/routes/verifier.mjs` `leave.patrol.pad` as **this** leftover’s pins — those are leftover snapshots, not the known FAIL list. `scripts/boot-test.mjs` WAVE58/59 do **not** currently grep the patrol clone string; PR2 may **add** a patrol-hold boot pin. Do not edit `boot-test.mjs` in the Wave 109 markdown worker.
15. CPU freeze: **no** per-NPC A* grid. **no** navmesh. Heal is O(1) per record on existing tick/rebuild loops. Do not alloc a new bag per NPC.
16. Fail closed: if hold helper missing, keep **live dest** (patrol loiter ring / hunt target / current wp). **Never** freeze NPCs in place. **Never** zero cruise because hold data is missing. **Never** throw on NaN / bad system (live heal already no-ops).
17. Reuse **`writeStationHold` / `healPadHome`**. Do **not** add a third helper. Do **not** persist `minerHoldFromStation` scratch.
18. Do **not** rewrite pirate / ace / trader / miner homes as this leftover. Inventory: only patrol authors `station.clone()`.
19. Do **not** change live loiter ring radius as the fix. Live dest is already outside D5. The leftover is persist + author + spawn via `recordPosition`.

---

## 0.1 Wave 109 deputize (owner may override after playtest)

Pick playable pad-home defaults. **Patrol `route[0]` is still pad** (inventory §2). Do not park. Do not invent UU / SKU / Digit. Do not invent a planner.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `STATION_CYL_RADIUS` | **32** | `physics.js` 8 |
| `STATION_HOLD_PAD` | **12** | `traffic-feel.js` 14 |
| `PAD_HOME_EPS` | **0.5** | `world.js` 666 |
| Patrol author | `station.clone()` | `world.js` 381 |
| `healPadHome` roles | trader, miner | `world.js` 705 |
| `holdClassFor` heavy | **falls to `'light'`** | `world.js` 668–673 |
| Patrol live mode | loiter ring 80–150 | `npc.js` 210–214, 257–258 |

Do **not** “fix” PHY-05 by cranking loiter radius or `AVOID_LOOKAHEAD`. That does not heal save/load spawn.

### Smallest additive heal (reads as hold, not a planner)

**Name:** patrol (and any remaining pad-center home) **authored + persist** hold **outside D5**, matching trader/miner hold law.

| Piece | Freeze |
|---|---|
| Fail-closed | If `writeStationHold` / `healPadHome` missing, **do not** rewrite. Live dest stays. Hulls keep flying. Never `speed = 0`. |
| Additive PR1 | 1) Author patrol `route[0]` with `writeStationHold(..., holdClassFor, fromPos)` instead of `station.clone()`. Gate and planet legs stay. 2) Extend `healPadHome` role allowlist with **`patrol`**. 3) Extend `holdClassFor` so patrol **`heavy`** (and known `classKey`) is **not** forced to `'light'`. 4) Call `healPadHome` from existing `rebuildTransitRegistry` + `tickBank` patrol branch (same pattern as miner). |
| Not PR1 | `applyAvoidBias` edit; navmesh; `planApPath`; Digit; HUD; `state.js`; new `WORLD_FIELDS`; third helper; pirate/ace rewrite |
| Hold class | trader → **freighter** (Wave 58 shared route). miner → `light`/`cutter` else `light`. **patrol → `rec.classKey` if it is a known scale class (`light`/`ace`/`cutter`/`heavy`/`frigate`/`freighter`), else `'heavy'`.** |
| fromPos | live `holdFromPos`: `route[1]` else primary gate else +X. Patrol authored fromPos = dest **gate** (same as trader). |
| Shape | Keep 3 patrol waypoints. Rewrite **wp0 only**. Recompute `legLens`. Idempotent via `PAD_HOME_EPS`. |
| Persist | New plain `{x,y,z}` on `route[0]`. No proto merge. No new world field. |
| Spawn | After heal, `recordPosition` at undock / low `legT` sits **outside** D5. Bounce remains net. |

Owner freeze (do not invert):

- Prefer reuse `writeStationHold` / `healPadHome` over a third helper.
- Persist rewrite is allowed on existing `record.route` only.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- PHY-04 sibling does **not** write `record.route`.
- If both author and heal miss, dest is unchanged (live). **Never stop.**

### Formulas (later impl)

```
// honor live writeStationHold; do not fork math
holdR = PHY.STATION_CYL_RADIUS + hullRadiusFor(holdClass) + STATION_HOLD_PAD + HOLD_OUT_EPS
dir   = XZ(fromPos - station); fallback origin then +X
wp0   = station.xz + normalize(dir) * holdR
wp0.y = clamp(station.y, station.y+Y0, station.y+Y1)

heal if role in {trader, miner, patrol}
     and hypot(wp0.xz - station.xz) <= PAD_HOME_EPS (0.5)
     and system/station/wp0 finite
```

Do **not** persist `live.avoidHits`. Do **not** persist loiter ring points.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Navmesh / A* / import `planApPath` | **Forbidden** §0.10, §0.15 |
| Change `applyAvoidBias` / two-sample | **Forbidden** — PHY-04 sibling |
| PHY-04 PR2 persist write | **Forbidden** — that PR is frame-only |
| New `WORLD_FIELDS` key | **Forbidden** §0.6 |
| Third hold helper | **Forbidden** §0.17 |
| Persist `minerHoldFromStation` | **Forbidden** §0.17 |
| Freeze hull until hold exists | **Forbidden** §0.16 |
| Pad-home pip / RANGE rewrite | **Forbidden** §0.2 |
| Digit / SKU / UU | **Forbidden** §0.3, §0.5 |
| Player FLT avoid | **Forbidden** §0.10 |
| Retune sun lethal/heat | **Forbidden** §0.9 |
| Rewrite trader/miner holds | **No** — already Wave 58/59; consume |
| Heal pirate/ace pad | **No** — they do not author pad (inventory §2, §11) |
| Retune loiter ring as the leftover | **Forbidden** §0.19 |
| `state.js` PHY table | **Forbidden** §0.5 |
| Toast “clear of station” | **No** |
| Keep `out/w58` `src.patrolCenter` forever | **No** — invert in PR2 pins |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `healPadHome` role + `holdClassFor` | PHY-05 PR1 (`world.js`) | `normalizeTraderRecord` / miner / new patrol callers |
| patrol `createRecords` wp0 | PHY-05 PR1 | `recordPosition`, save |
| `writeStationHold` | **none** (call only) | world.js |
| `minerHoldFromStation` | **none** | npc live miner/flee |
| `applyAvoidBias` | **none** (PHY-04 sibling) | steerLive, AP |
| `planApPath` | **none** | autopilot only |
| `state.js` | **none** | cruise / SYSTEMS read |
| HUD / Digit | **none** | — |
| `WORLD_FIELDS` | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `writeStationHold` missing | rec unchanged; live dest; never `speed = 0` |
| `healPadHome` not yet extended | live dest; patrol still flies loiter |
| Missing bag / jump / `!_phyOn` | dest unchanged (live PHY-02) |
| NaN positions / unknown system | no-throw; rec unchanged (live) |
| Unknown `classKey` | patrol → `'heavy'` hold class; miner → `'light'` |
| Unknown role | skip heal |
| Combat / hunt dest | do not overwrite hunt target with a hold |
| PHY-04 helper missing | **irrelevant** — this leftover does not call it |

Never: `speed = 0` because hold missed. Never: `ai.mode = 'wait'`. Never: freeze-in-place. Never: new persist key.

---

## 3. Serial PR plan (named only)

Do **not** implement in Wave 109.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist heal** | Patrol author hold; `healPadHome` + `holdClassFor` + rebuild/tick callers; plain `{x,y,z}` wp0; fail-closed no-throw | `state.js`; Digit; new `WORLD_FIELDS`; `applyAvoidBias`; navmesh; `planApPath`; HUD; pirate/ace; third helper |
| **PR2 pins** | Invert `out/w58/routes` `src.patrolCenter` and `out/w59/routes` `leave.patrol.pad` into hold-off-pad; optional WAVE boot pin that patrol wp0 is off pad; grep no new persist key; no hub child; no Digit steal | Known boot FAIL fixes (WAVE4/26/35); wishlist rewrite |
| **PR3 census (optional)** | Re-grep `station.clone()` / pad hypot after playtest; only if a new factory appeared | New world field; loiter retune |

First remaining serial is **PR1**. It must **not** steal Digit 0/8/9. It must **not** write `state.js`.

---

## 4. Security freeze (later impl)

1. No new persist blob → no proto merge from save. Rewrite is one `{x,y,z}` assign.
2. No new DOM / `innerHTML`.
3. No user-authored shader / HTML from holds.
4. Role allowlist `trader|miner|patrol`. Unknown role → skip.
5. `SYSTEMS` via `Object.hasOwn`. Never `SYSTEMS[userString]` as existence via proto.
6. Do not `for-in` a save waypoint. Do not copy unknown keys from `route[0]`.
7. Do not log player names beside hold coords.
8. No secrets.
9. Never freeze NPCs (availability).

---

## 5. Acceptance direction (implementation wave)

1. New patrol `route[0]` sits outside D5 by hull+pad (heavy hold), matching trader/miner hold law.
2. Old saved patrol pad `route[0]` heals on rebuild/tick to the same hold. Idempotent.
3. After save/load, `recordPosition` at undock / low `legT` is outside the cylinder. Traffic does not treat D5 as a tunnel.
4. Fail closed: missing helper → live dest; never freeze; never zero speed; NaN no-throw.
5. PHY-01 bounce still fires on ram. PHY-03 radii unchanged. PHY-04 `applyAvoidBias` unchanged by this serial.
6. No new persist key. Digit 0 shipyard. Hub 80 px empty of new children.
7. No navmesh. No `planApPath` in NPC. No third hold helper.
8. Pirate/ace/trader/miner homes unchanged as data except already-shipped trader/miner holds.
9. `innerHTML` = 0 on paths the serial touches.
10. `out/w58` / `out/w59` leftover pins invert to hold-off-pad in PR2. Known boot FAILs untouched.
