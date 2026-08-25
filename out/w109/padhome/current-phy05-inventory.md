# PHY-05 remaining pad-home — live inventory

**Wave:** 109. Markdown only. Code wins over wishlist / PROGRESS comments.  
**Census date:** 2026-08-24.  
**Scope:** leftover PHY-02 / AI-01 authorship after Wave 58 trader/miner holds and Wave 59 `healPadHome`. Patrol (and any other) **pad-center home** still persists in `record.route[0]`.  
**Not this leftover:** PHY-04 two-sample / frame hold retarget (sibling, `docs/Phy04AvoidDesign.md`). PHY-01 bounce. PHY-03 sun radii. FLT. NAV-03/04. Digit/HUD. New persist keys.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Wishlist / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Wave 58: trader/miner station holds; patrol still pad center | PROGRESS 2888–2891; wishlist AI-01 855–859 | **True.** `writeStationHold` on trader/miner author; patrol `station.clone()` |
| Wave 59: `healPadHome` rewrites trader/miner `route[0]` on pad | PROGRESS 2919–2921 | **True.** Role gate `trader`/`miner` only (`world.js` 705) |
| Old saved trader pad home until bank rebuild | PROGRESS 2896–2897 (Wave 58 OPEN) | **Closed for trader/miner** by Wave 59. **Open for patrol** |
| Ships do not fly through stations | wishlist AI-01 857–859 | **Partial.** Live keep-out + bounce exist. Patrol **spawn** can still sit on pad via `recordPosition` |
| NPC traffic completes routes without routine collisions | wishlist PHY-02 1049–1051, 1064 | **Open leftover.** Pad-center persist still aims traffic through D5 after save/load |
| PHY-04 remaining avoid is lookahead, not persist | wishlist 1034–1036; `docs/Phy04AvoidDesign.md` | **True.** PHY-04 PR2 is **frame-only**. Must **not** write `record.route` |

Wave 58 verify: `out/w58/routes/probe.mjs` and `out/w58/routes/verifier.mjs` **pin** `src.patrolCenter` as the clone string. That pin is a leftover snapshot, not a forever law. Live `scripts/boot-test.mjs` WAVE58 does **not** grep that clone string (it pins trader `writeStationHold` / miner hold).

Wave 59 verify: `out/w59/routes/verifier.mjs` 186–201 **`leave.patrol.pad`** — `healPadHome` must **not** move patrol wp0. That pin is the leftover. WAVE59 **boot** pins trader/miner hold + NaN; they do **not** assert patrol skip.

---

## 1. Station cylinder (honor; do not retune)

`src/game/physics.js` 8–10.

| Key | Value |
|---|---|
| `STATION_CYL_RADIUS` | **32** |
| `STATION_CYL_Y0` / `Y1` | −26 / 33 |

Hold math: `STATION_CYL_RADIUS + hull + STATION_HOLD_PAD + HOLD_OUT_EPS` (`traffic-feel.js` 14, 17, 77).

`STATION_HOLD_PAD` = **12**. `HOLD_OUT_EPS` = 0.05.

Heavy hull `scaleFor('heavy').target` = **17.0** (`ship-scale.js` 128–131) → `hullRadiusFor('heavy')` = **8.5**. Authored patrol class is `heavy` (`world.js` 378).

---

## 2. Authored routes (`createRecords`)

`src/game/world.js` `createRecords` 322–422. `makeRecord` 282–306 runs `plainRoute` (JSON `{x,y,z}` rounded).

| Role | `route[0]` (home) | Rest | Cite |
|---|---|---|---|
| **trader** | `stationHoldVec` → `writeStationHold(..., 'freighter', gate)` | dest gate (jittered copy) | 98–102, 332–341 |
| **miner** | `writeStationHold(..., 'light'\|'cutter', field)` | field (jittered) | 387–404 |
| **patrol** | **`station.clone()` pad center** | jittered gate, jittered planet | **374–385** |
| pirate | jittered **gate** | lane mid, gate | 348–357 |
| ace / aspirant | jittered **gate** | planet, gate | 407–419, 609–614 |

**Grep `station.clone()` in `src/`:** **one hit** — patrol author at `world.js` 381.

Module comment 19–23 still says “Patrols keep station → gate → planet.” `plainRoute` comment 262–263 is **stale** (says waypoint 0 is gate for patrols; live wp0 is station).

`cast.patrols`: authored Freehold 2, Veridian 3, Redmarch 1, Hollowreach/Hush/Verge 0. No other `role: 'patrol'` factory in `src/`. Boot tests inject patrol records without routes.

---

## 3. Hold helpers (reuse; do not add a third)

### 3.1 `writeStationHold` — `traffic-feel.js` 71–102

Pure data. No THREE, no DOM, no ctx writes. Writes `out.{x,y,z}` outside D5. Direction = station → `fromPos` in XZ. Bad `fromPos` → origin, then +X. Y clamped to cylinder band. **This is the persist writer.**

`stationHoldPoint` 105–107 is a one-shot wrapper.

### 3.2 `healPadHome` — `world.js` 666–726

```
PAD_HOME_EPS = 0.5
holdClassFor: trader → 'freighter'; else classKey light|cutter else 'light'
```

Gate:

1. Missing rec → return
2. **`role !== 'trader' && role !== 'miner'` → return** ← **patrol skip**
3. Missing / unknown `system` (`Object.hasOwn(SYSTEMS, sysId)`) → return
4. Missing / NaN station → return
5. Missing / empty `route` → return
6. NaN wp0 x/z → return
7. `hypot(wx-sx, wz-sz) > PAD_HOME_EPS` → return (already off pad)
8. Else `route[0] = writeStationHold({x:0,y:0,z:0}, station, holdClassFor(rec), holdFromPos(...))` and recompute `legLens`

`holdFromPos` 675–695: `route[1]` if finite xz, else gates[0], else +X of station.

**Idempotent** for already-held trader/miner. **No-throw** on NaN / bad system (boot WAVE59 `nanSafe`).

**If a later serial only adds `role === 'patrol'` and does not extend `holdClassFor`:** patrol `classKey` is `heavy`, so holdClassFor falls through to **`'light'`**. Light hold is too close for a heavy hull. Inventory: **must extend `holdClassFor`**.

### 3.3 `minerHoldFromStation` — `npc.js` 900–922

Live scratch. `MINER_HOLD_PAD` 12, arrive 28. Used by `steerMinerHome` 957–968 and flee 2010. **Not** a persist writer. Do **not** invent a third helper; do **not** persist this scratch object.

---

## 4. Callers today

| Site | Heals patrol? | Cite |
|---|---|---|
| `normalizeTraderRecord` | no (role trader) | 730–756; calls `healPadHome` |
| `normalizeMinerRecord` | no (role miner) | 759–762 |
| `rebuildTransitRegistry` | trader/miner only | 447–459, 1361, 1443, 1802 |
| `tickBank` | trader/miner normalize; patrol **ticks** without heal | 822–911 |
| save restore | `healLiveRecords` re-adopts ids / `live` flags. **No pad heal.** | `save.js` 1151–1179, 1210 |

Patrol pad homes in old **and new** banks survive restore because nothing rewrites them.

---

## 5. Abstract tick + spawn (why persist matters)

### 5.1 `tickBank` home dock — `world.js` 895–902

When `legT <= 0` and `leg === 0`, traders **and patrols and miners** set `state = 'docked'`. Comment: “Waypoint 0 is home.” For patrol, home is still the **pad**.

Docked records do not instantiate (`traffic.js` 99 `state !== 'enroute'`). On undock they become `enroute` with `leg=0`, `legT=0`.

### 5.2 `recordPosition` — `world.js` 629–643

Spawn point for `traffic.js` 105, 117, 155.

- `docked` or single wp → **`route[0]`**
- else lerp `route[leg]` → `route[leg+1]` by `legT`

A patrol that just left dock, or one still on the first metres of station→gate, has a spawn **inside the D5 cylinder** (r 32). `spawnBlocked` (`traffic-feel.js` 128+) is **hull-vs-hull**, not station cylinder. Close-spawn skip is player range 80, not pad.

`makeRecord` scatters `legT: Math.random()` on first leg (293). Fresh patrols can spawn anywhere on pad→gate, including **inside** the cylinder when `legT` is small.

### 5.3 Live dest is **not** `record.route` for patrol

`npc.js` `makeAi` 210–214: patrol falls through to **`loiter`**. Waypoints: `ring(record.anchor ?? station, 80+rand*70, 4)` (257–258) — radius **80–150**, outside r 32.

`tickPatrolJob` 1275–1286: hunt if legal work, else loiter. `updateLoiter` 1500–1504 steers those ring points. `updateRoute` is **trader**.

So **live loiter dest is already outside D5**. The leftover is **authorship / spawn / save**, not loiter aim. PHY-04 PR2 frame retarget would not rewrite `route[0]` and would not move `recordPosition`.

Flee (any role) may `minerHoldFromStation` (2010) — live only.

---

## 6. Persist

`save.js` `WORLD_FIELDS` 76–101 includes `recordBanks` and `records`. Routes ride those arrays. **No** `world.padHome` / `world.holds` key.

Autosave key `rimward-save-v1` (`save.js` 16). Snapshot copies `WORLD_FIELDS` wholesale (979). Restore assigns defined keys (1186–1187).

`healPadHome` already replaces `route[0]` with a **new** `{x,y,z}` from `writeStationHold`. It does not `Object.assign` a save waypoint. `SYSTEMS` lookup uses `Object.hasOwn` (707).

Inventory: persist rewrite **can** live on existing `record.route`. **No new WORLD_FIELDS key.**

---

## 7. HUD / Digit / state.js (freeze)

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 `.rw-reticle`; pupil + 3 cilia + RANGE | `hud.js` 709–712; `hud.css` 184–193 (`src/ui/hud.css`) |
| `el()` | `createElement` + `textContent` | `hud.js` 244–249 |
| Digit 0 | shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 188, 6041–6043 |
| Digit 8 dock root | launch (index 7) | 188, 6045–6046 |
| Digit 9 dock root | epics / Standing | 188 |
| Outfitting Digit 8/9 | launcher / turret papers | 1633–1712 |
| `state.js` PHY keys | **none** (`physics.js` 4–5) | honor READ-ONLY |
| Pad-home pip | **absent** | — |

Hull-strike toast only if `damage > 0` (`hud.js` 591–593). No pad-home toast.

---

## 8. PHY-04 sibling (do not restate as this leftover)

| Piece | PHY-04 | PHY-05 |
|---|---|---|
| `applyAvoidBias` two-sample | sibling PR1 | **do not specify** |
| Frame hold aim if dest punches D5 | sibling PR2; **no route write** | **not** this leftover |
| `healPadHome` patrol persist | explicitly **not** PHY-04 | **this** leftover |
| Navmesh / `planApPath` | forbidden | forbidden |

---

## 9. Boot pins that encode the leftover

| Pin | File | Meaning |
|---|---|---|
| `src.patrolCenter` | `out/w58/routes/probe.mjs` 95; `out/w58/routes/verifier.mjs` 126 | Author still `station.clone()` |
| `leave.patrol.pad` | `out/w59/routes/verifier.mjs` 199 | Heal must leave patrol on pad |
| WAVE58 boot `srcHold` | `boot-test.mjs` 11812 | Trader `writeStationHold` string; **not** patrol clone |
| WAVE59 boot trader/miner hold | `boot-test.mjs` 11831–11868 | Trader/miner already healed |

Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate) are **other**. Do not “fix” them in this leftover.

---

## 10. Fail-closed live behavior

| Condition | Live |
|---|---|
| `healPadHome` missing role | rec unchanged; traffic still flies |
| NaN wp0 / bad system | no-throw; rec unchanged |
| Jump / `!_phyOn` | dest unchanged; no bounce (`npc.js` 2261, 749) |
| Empty bag | dest unchanged |
| Patrol live | loiter ring, not pad route |

Never: `speed = 0` because hold helper missing. Never: freeze hull in place.

---

## 11. What is **not** pad-center

Pirate, ace, aspirant, trader (after Wave 58/59), miner (after Wave 58/59). Do **not** rewrite those homes as this leftover.

---

## 12. Absent (this leftover)

| Feature | Status |
|---|---|
| Patrol authored hold | **absent** (`station.clone()`) |
| `healPadHome` patrol role | **absent** |
| `holdClassFor` `'heavy'` | **absent** (falls to `'light'`) |
| `tickBank` / rebuild patrol heal | **absent** |
| New `WORLD_FIELDS` key | **must stay absent** |
| Pad-home HUD pip / Digit | **must stay absent** |
| Third hold helper | **must stay absent** |
