# NAV-10 docking approach assistance inventory

**Wave:** 130 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** docking approach-speed cue (and later optional J-press governor).  
**Not this leftover:** NAV-03 gate-to-gate Autopilot. PHY-01 bounce/slide. HUD-06 HOME pip. Hail02 KeyJ miss toast. CTL-01 KeyJ bind. CTL-03 berthHold. Agent API `act dock`. TGT-07 combat cycle. MSN-04 job dedup.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass — **175–179** — cite, do not edit): The J prompt appears, but there is no approach-speed cue or brake assist, so a cruise-speed approach ends in a bounce off the station hull. A `"SLOW — approach under 20 u/s"` cue or an approach governor on J would close the loop. NAV-03 covers system-to-system autopilot only.

CONSUME test (owner): if a **named** approach-speed cue **and** a brake/governor that prevents cruise-speed bounce-into-pad already live → freeze **CONSUME** and named serial **none**. Census: **neither** is live.

---

## 1. Dock bind / KeyJ (cite; do not remap)

| Surface | Today | Cite |
|---|---|---|
| KeyJ pulse | `pendingDock = true` unless `shouldSkipDockPulse` | `controls.js` **330–331**, **73–87** |
| Publish | `input.dockPressed` one frame | `controls.js` **426**; `ctx.js` **90** (`edge: J (not D)`) |
| KeyD | lateral strafe only | `controls.js` **23–24**, **397** |
| Help | `'H — hail · J — dock'` | `controls.js` **409** |
| Title / models / typing | skip dock pulse | `controls.js` **73–87** |
| Tracked | `KeyJ` in `TRACKED` | `controls.js` **49** |

CTL-01 Wave 117 is **live**. KeyJ stays dock/jump. KeyD stays strafe. This leftover **does not** remap.

---

## 2. Pad zone / snap / dock success (no speed gate)

| Surface | Today | Cite |
|---|---|---|
| Dock range | `U.DOCK_RANGE = 45` | `state.js` **30** |
| `inZone` | `dist <= U.DOCK_RANGE` | `station.js` **6308–6319** |
| Snap band | `!inZone && dist <= U.DOCK_RANGE * 2` (45 < dist ≤ 90) | `station.js` **6323–6328** |
| Snap pose | `liveStation + (36, 0, 0)`; `velocity.set(0,0,0)`; `speed = 0` | `station.js` **6324–6327** |
| Dock call | `dist <= DOCK_RANGE && !flags.docked` → `dock()` | `station.js` **6329** |
| Consume KeyJ | `dist <= DOCK_RANGE` → `dockPressed = false` | `station.js` **6330** |
| `dock()` | `flags.docked = true`; overlay; emit `'docked'` | `station.js` **6099–6125** |
| Speed check on dock | **none** | `station.js` **6321–6330** vs `dock()` **6099–6125** |
| Approach governor | **none** | grep `governor` / `approachSpeed` in `station.js` / `ship.js` / `hud.js` = NPC combat only (`npc.js` **2182**) |

`dock()` does **not** read `ship.speed`. In-zone KeyJ docks at cruise. Snap (outside zone, ≤ 90 u) already zeros velocity. Do **not** invent a third teleport. Do **not** extend snap past 2×.

Init order: `initStation` **before** `initShip` (`main.js` **112**, **120**). Same-frame in-zone J: station docks, then ship sees `flags.docked` and parks (`ship.js` **948–957**).

---

## 3. J prompt (appears; no speed text)

| Surface | Today | Cite |
|---|---|---|
| Context prompt | one verb, bottom-center | `hud.js` **1036–1039**, **2532–2536** |
| Dock copy | `pKey = 'J'`; `pVerb = 'Dock'` **only if** `station.inZone && !docked` | `hud.js` **2535–2536** |
| Jump copy | else `gate.inZone` → `J` / `Jump to {dest}` (or hub `G`) | `hud.js` **2537–2546** |
| Write | `promptKey.textContent` / `promptVerb.textContent` | `hud.js` **2591–2594** |
| `innerHTML` | **none** in `hud.js` | grep |
| CSS | `.rw-prompt` / `.rw-prompt-key` / `.rw-prompt-verb` | `hud.css` **807–838** |
| SLOW copy | **absent** | grep `SLOW` / `approach under` in `hud.js` = **0** |

The J prompt **is** live. It does **not** name speed. It does **not** name `20 u/s`.

---

## 4. SPD rails (shared factory; MATCH only)

| Surface | Today | Cite |
|---|---|---|
| Factory | `makeSpeed(parent)` builds one `.rw-match-lamp` whose `textContent` is **`MATCH`** | `hud.js` **378–401** |
| Self rail | `selfSpeed = makeSpeed(selfRail)` | `hud.js` **1089** |
| Target rail | `tgtSpeed = makeSpeed(tgtRail)` — **same factory** | `hud.js` **1101** |
| Self `set` | `selfSpeed.set(ctx.ship.speed, matchOn)` | `hud.js` **2243–2244** |
| Target `set` | `tgtSpeed.set(targetSpeedNow)` — **no** match arg | `hud.js` **2524** |
| MATCH CSS | `.rw-match-lamp` / `.is-hidden` | `hud.css` **222–229** |
| Combat rail width | min 168 / max **220** px | `hud.css` **950–955** |
| HUD-01 hub | 80×80 `.rw-reticle` | `hud.css` **184–193** |
| SLOW node | **absent** | grep `.rw-slow-lamp` = **0** |
| Light cruise | **120** u/s | `state.js` **38**; `ctx.js` **54** |
| Light creep | **30** u/s | `state.js` **38**; `ctx.js` **55** |
| Light `stopTime` | **2.0** s | `state.js` **38** |
| Accel | **90** u/s² | `ctx.js` **56** |
| Full stop | double-tap F → `input.fullStop`; `fwdSpeed = 0` | `controls.js` **348–353**; `ship.js` **876–877** |

**Root cause for designer Major:** MATCH and SLOW cannot share one node. `makeSpeed` is not self-only. If PR1 swaps MATCH copy or adds SLOW inside the shared factory, Wave D match-speed is stolen and the **target** glance can show a pad-approach lamp. PR1 must add `.rw-slow-lamp` on **self** SPD only.

SPD integer + MATCH is **not** a named approach-speed cue. Inbox copy is **not** on the rail.

**Creep vs 20:** live light creep is **30** u/s. Inbox `"under 20 u/s"` is **below** creep. Without double-tap F (or a later governor), the hull cannot hold 20 while still creeping. Do **not** retune `SHIP_CLASSES` / `state.js`.

---

## 5. PHY-01 bounce (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| Station cylinder | radius **32**; y **[-26, 33]** | `physics.js` **8–10** |
| Player radius | **2.4** | `physics.js` **7** |
| Contact radius | 32 + 2.4 = **34.4** | derived; `out/phy-verify/code-review.md` |
| Slide / bounce | `resolveMover` cylinder | `collision.js` **457**, **502–503** |
| Restitution / friction | 0.15 / 0.85 | `physics.js` **13–14** |
| Damage floor | `IMPACT_MIN_SPEED` **8** u/s | `physics.js` **12** |
| Player apply | every undocked non-jump frame **unless** `dockPressed` | `ship.js` **907–939** |
| Docked park | velocity **0** | `ship.js` **948–957** |

`inZone` starts at **45** u. Hull contact is **34.4** u. The J-prompt band while bounce can still fire is **~10.6** u.

At cruise **120** u/s that band lasts **~0.088** s. The player who sees `J — Dock` and does not tap J in that window **bounces**. That is PHY-01. NAV-10 must **not** rewrite `resolveMover` / restitution.

`dockPressed` skips bounce **one frame**. In-zone J docks that frame (station before ship). Bounce is the path when the player **does not** dock.

---

## 6. Hail02 KeyJ miss (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| Miss emit | leftover `dockPressed` after no dock / jump / `'No passage.'` | `hail.js` **301–373** |
| Dock miss reason | `'dock-range'` | `hail.js` **183**, **369** |
| HUD copy | `{name} — dock out of range ({n} u)` | `hud.js` **808** |
| Linger key | `warn\|hailmiss\|dock\|dock-range\|{keyName}` | `hud.js` **816** |
| In-zone success | skip miss (`'docked'` this frame) | `hail.js` **313** |

Hail02 names **out-of-range** KeyJ. It does **not** name approach speed. It does **not** brake. Do **not** reuse `hailMiss` as the SLOW cue (HUD-04 flood + wrong verb).

---

## 7. NAV-03 Autopilot (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| AP | `world.nav.autopilot`; flies **gates** | `ship.js` **738–739**; `gate.js` **671–679** |
| Jump OR | `dockPressed \|\| apJump` in `JUMP.zone` | `gate.js` **678–679** |
| Pad approach | **not** AP | `docs/Nav03AutopilotDesign.md`; Agent API v1 same |

NAV-03 is gate-to-gate. It does **not** fly the pad. Inbox names this limit. Do **not** land `agentHelm` / pad AP here.

---

## 8. HUD-06 home marker (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| HOME POS + pip + chevron | live Wave 127 | `hud.js` **37**, **75**, **981–987**, **1201**, **1975–1992**, **2343** |
| Inset | **108** (TGT/NAV-02 keep 84) | `hud.js` **75** |
| Hide | docked / jump / hail / chart / berth | `hud.js` **1986–1992** |

HOME is bearing + distance to the pad. It is **not** a speed cue. Do **not** retune inset. Do **not** put SLOW on the pip.

---

## 9. Overlay / digits / Agent / persist

| Surface | Today | Cite |
|---|---|---|
| Never `flags.paused` | overlay header | `overlay-policy.js` **4**, **196–203** |
| `berthHeld` | session hold; not pause | `overlay-policy.js` **188–193** |
| Digit 0/8/9 | station services | honor; `station.js` dock overlay |
| Agent `act` | ping / disable / pause / held / **unknown** | `agent-api.js` **129–150** |
| Agent `dock` | **not live** | grep `agent-api.js` dock = **0** |
| Persist approach mute | **none** | `save.js` `WORLD_FIELDS`; `state.js` READ-ONLY |

---

## 10. Time-to-hull (why in-zone-only cue is late)

| Quantity | Value | How |
|---|---|---|
| J prompt start | 45 u | `U.DOCK_RANGE` |
| Hull contact | 34.4 u | 32 + 2.4 |
| Band | 10.6 u | 45 − 34.4 |
| Time at 120 u/s | ~0.088 s | 10.6 / 120 |
| Light stopTime | 2.0 s | `state.js` **38** |
| Δv 120 → 20 at 90 u/s² | ~1.11 s | (100) / 90 |
| Distance while braking | ~78 u | mean 70 × 1.11 |

A SLOW line that appears **only** with `J — Dock` (inZone) cannot brake a cruise approach before PHY contact. Cue band must start **before** 45 u (deputize 3 × `DOCK_RANGE` = 135 u on the **self** `.rw-slow-lamp`). Do **not** write `state.js` for that multiple. Do **not** reuse MATCH. Do **not** write `tgtSpeed`.

---

## 11. Verdict table

| Question | Answer | Why |
|---|---|---|
| Does J prompt appear in pad zone? | **Yes** | `hud.js` **2535–2536** |
| Named approach-speed cue (`SLOW` / `20 u/s`)? | **No** | prompt verb is `'Dock'` only |
| SPD names approach? | **No** | integer speed + MATCH only |
| Distinct self SLOW node? | **No** | shared `makeSpeed` MATCH node only |
| Brake assist / approach governor on J? | **No** | KeyJ is one-frame edge; dock has no speed cap |
| Does in-zone J dock at cruise? | **Yes** | no speed gate; station then park |
| Does cruise without J bounce the hull? | **Yes** | PHY-01; skip only `dockPressed` / docked / jump |
| Does 2× snap already zero vel? | **Yes** (45–90 u tap) | `station.js` **6323–6328** |
| Does NAV-03 fly the pad? | **No** | gates only |
| Does Hail02 close this loop? | **No** | out-of-range miss only |
| CONSUME? | **No** | cue **and** governor both absent |
| Named serial | **PR1** | leftover REAL |

**Freeze leftover REAL.** Name later serial **PR1**.
