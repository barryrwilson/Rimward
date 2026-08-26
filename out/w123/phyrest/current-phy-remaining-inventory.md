# Wave 123 remaining PHY leftover after PHY-05 — live inventory

**Wave:** 123. Markdown only. Code wins over wishlist Initiative PHY (solid bodies, NPC avoid, lethal suns, traffic that does not tunnel stations) when those bullets are read as undone.  
**Census date:** 2026-08-25.  
**Scope:** remaining **PHY leftover after named PHY slices shipped**. Not NAV. Not TGT. Not FX. Not AST belts. Not autopilot. Not MATCH.  
**Cite, do not rewrite:** [`docs/Phy04AvoidDesign.md`](../../docs/Phy04AvoidDesign.md), [`docs/Phy05PadHomeDesign.md`](../../docs/Phy05PadHomeDesign.md); [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative PHY (read only); [`docs/OwnerDecisionsWave112.md`](../../docs/OwnerDecisionsWave112.md) collision curve (cite only).  
**Not this leftover:** HUD-01 empty hub. Digit 0/8/9. Kit mutate. Aim-glass gauges. Navmesh. PHY-04 PR3 80 u. New Digit. New persist key. UU. SKU. Power ledger.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

PHY constants live in **`src/game/physics.js`**, not `src/systems/physics.js`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| PHY-01 solid bounce/slide? | **Yes.** `resolveMover` after integrate; NPC `bounceLive`; restitution 0.15 / slide 0.85; impact min 8 + 0.35/u | **LIVE** (Wave 53; Wave 112 curve honor) |
| PHY-02 NPC avoid (Wave 58 station/gate keep-out)? | **Yes.** Cylinder path keep-out; torus probe; authored holds | **LIVE** (Wave 58) |
| PHY-04 two-sample 20 u mid + frame hold, no navmesh? | **Yes.** `mid = look * 0.5`; `addMidChordHit`; `writeFrameHold` does not write `record.route`; `planApPath` / `navmesh` absent in `npc.js` | **LIVE** (Wave 109) |
| PHY-04 PR3 far 80 u? | **No sample.** Owner skippable | **Not a hole** |
| PHY-03 sun heat/kill? | **Yes.** `sunZone` 1 heat / 2 lethal; `sunHeat` toast; `sunKill` packet | **LIVE** (Wave 53) |
| PHY-05 pad-home persist heal + patrol heavy hold outside D5? | **Yes.** Author `writeStationHold(..., 'heavy', gate)`; `healPadHome` includes patrol; `holdClassFor` patrol known-class else `'heavy'` | **LIVE** (Wave 110) |
| Example REAL: a role still homes to pad-center after save? | **No.** `station.clone()` absent in `src/`; patrol + trader + miner heal | **Not a hole** |
| Example REAL: sun lethal missing? | **No.** zone 2 packet + `sunKill` | **Not a hole** |
| Wishlist PHY still undone vs code? | **No.** Bullets live or owner-omitted (navmesh / 80 u) | **CONSUME** |

Name: **no remaining PHY leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/game/physics.js` | Frozen PHY table (not on `state.js`) |
| `src/game/collision.js` | bag, torus, sunZone, `resolveMover` |
| `src/systems/ship.js` | player bounce; sun stripped |
| `src/systems/npc.js` | avoid, mid sample, frame hold, bounce, sun bag, loiter ring |
| `src/game/world.js` | patrol author, `healPadHome`, `holdClassFor`, `recordPosition` |
| `src/game/traffic-feel.js` | `writeStationHold` |
| `src/game/traffic.js` | spawn at `recordPosition` |
| `src/systems/combat.js` | impact damage; sun heat/kill |
| `src/systems/hud.js` | sunHeat / sunKill toasts; RANGE token |
| `src/ui/hud.css` | 80 px empty hub |
| `src/game/save.js` | `WORLD_FIELDS` (no avoid / padHome) |
| `src/game/state.js` | no PHY keys (READ-ONLY later) |
| `src/systems/station.js` | Digit 0/8/9 |
| `src/game/autopilot.js` | cite-only `applyAvoidBias` after `planApPath` |
| `scripts/boot-test.mjs` | WAVE53 / WAVE58 / WAVE110; WAVE109 PHY-04 **named log absent** |
| `out/phy-verify/kernel-pins.mjs` | PHY-04 mid / no-navmesh pins |
| Honor docs | Phy04, Phy05, wishlist PHY, Owner Wave 112 |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code (stale line)

Initiative PHY (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **1273–1313**, cite only):

- Status names PHY-01 / PHY-02 / PHY-03 first pass DONE Wave 53; Wave 58 gate torus / holds / avoid; PHY-04 two-sample Wave 109; PHY-05 pad-home first impl Wave 110.
- PHY-01 bullets: volumes, bounce/slide, low-speed screens, high-speed tune later.
- PHY-02: NPC steer; collision is safety net; “not full path planning” still in AI-01 (**1081**).
- PHY-03: heat then lethal; telegraph enough to escape.
- Acceptance: cannot pass through major objects; low-speed survivable; traffic completes routes without routine collisions; sun lethal cannot be crossed.

**Code wins.** Bounce, avoid, sun, pad-home are **LIVE**. “Not full path planning” is **navmesh omit**, not leftover. PHY-04 PR3 80 u is **owner skippable**. This pack does **not** edit the wishlist.

Idea inbox has **no** unchecked PHY IDEA row.

Owner Wave 112 §6 (`docs/OwnerDecisionsWave112.md` **108–114**): keep live linear impact curve. Do not retune.

---

## 3. PHY table (`src/game/physics.js`)

| Surface | Live | Cite |
|---|---|---|
| Export | `Object.freeze` PHY; comment forbids `state.js` dup | **1–6** |
| Player r | 2.4 | **7** |
| Station D5 | r 32, y0 −26, y1 33 | **8–10** |
| Impact | 0.35 /u; min 8 | **11–12** |
| Bounce | rest 0.15; slide 0.85 | **13–14** |
| Sun | heat 2.4; lethal 1.12; DPS 6; ramp 18 | **15–18** |
| Avoid | look 40; gain 1.4 | **19–20** |
| Gate | bore 30; tube 2.2 | **21–22** |
| `state.js` PHY | **none** | grep 0 |

---

## 4. PHY-01 solid bounce/slide (Wave 53)

| Surface | Live | Cite |
|---|---|---|
| Bag | station cyl, gates torus, hub lantern as gate, rocks, ships, player | `collision.js` **345–455** |
| Station slot | kind `station`, r `STATION_CYL_RADIUS` | **352–360** |
| Gate slot | kind `gate`, r bore, y0 tube | **377–385** |
| Torus | bore empty, tube solid | **102–136**; WAVE58 `boreEmpty` / `tubeSolid` **11820–11821** |
| `resolveMover` | 2-pass overlap; skip `(kind,id)`; station cyl / gate torus / else sphere | **457–528** |
| Velocity | `resolveVelocity` rest + friction | **297–314** |
| Player | after integrate; strip `kind === 'sun'`; skip dock/jump/dockPressed | `ship.js` **905–937** |
| NPC | `bounceLive` → `resolveMover` skip self ship id | `npc.js` **730–757**, **2401**, **2434** |
| Impact damage | skip if speed `< IMPACT_MIN_SPEED`; else `speed * 0.35` family impact | `combat.js` **1848–1852** |
| Body toast | `bodyHit` only if `damage > 0` | `hud.js` **660–662** |
| WAVE53 pin | `WAVE53 PHY` frozen table, sphere/cyl, bounce, sunZone, collect | `boot-test.mjs` **11598–11658** |

Player FLT does **not** call `applyAvoidBias` (`ship.js` grep 0). Station/gate at cruise is **collision**, not leftover lookahead.

---

## 5. PHY-02 / Wave 58 keep-out + PHY-04 two-sample (Wave 109)

| Surface | Live | Cite |
|---|---|---|
| Collect | once per NPC update if `!jumping` | `npc.js` **2355–2358** |
| Sun in NPC bag | heat radius, not lethal | **705–722** |
| Station keep-out | hull + probe + XZ chord | **557–581** |
| Gate probe | torus; bore empty | **491–507** |
| 40 u probe | `look = PHY.AVOID_LOOKAHEAD` | **653–656** |
| Mid 20 u | `mid = look * 0.5`; `addMidChordHit`; skip station kind | **657–660**, **605–617**, **692–694** |
| Bias | dest + normalize(lateral) * look * gain (*2 if inside) | **696–699** |
| Fail-closed | missing live / bag / `!_phyOn` → dest copy | **643–650** |
| Frame hold | route/loiter dest in D5 → `writeStationHold` / miner helper; **no** `record.route` | **781–817**, **835–839** |
| Skip combat target / player self / AP gates | `skipAvoidBody` | **444–453** |
| Player AP | `planApPath` then `applyAvoidBias` on AP bag | `autopilot.js` **268**, **291** |
| NPC `planApPath` | **absent** | `npc.js` grep 0 |
| Navmesh | **absent** in `src/` | grep 0 |
| Far 80 u | **absent** (`look * 2` not in `npc.js`) | PHY-04 PR3 skippable |
| WAVE58 pin | torus + holds + `gateProbeHits` | `boot-test.mjs` **11783–11835** |
| WAVE109 PHY-04 named `console.log` | **absent** (WAVE109 block is MSN-03) | `boot-test.mjs` **22478** |
| Kernel pin | `phy04.midSample` / `phy04.noNavmeshPlan` | `out/phy-verify/kernel-pins.mjs` **176–189** |

Trader/miner authored holds: `world.js` **99–102**, **116–118**, **398–399**. Live miner hold: `npc.js` **993–1014**.

---

## 6. PHY-03 sun heat/kill (Wave 53)

| Surface | Live | Cite |
|---|---|---|
| Zone math | dist ≤ killR → 2; else ≤ heatR → 1; t ramps | `collision.js` **318–342** |
| Combat | skip jumping; `sunRadius > 0` | `combat.js` **1873–1880** |
| Heat | DPS `6 + t * 18`; toast gap 2.5 s | **1882–1888**; gap **164** |
| Lethal | packet `hullMax+screenMax+shellMax+1`; `sunKill` once | **1890–1897** |
| Toast | `▲ STAR HEAT — turn away.` / `✕ The star took the ship.` | `hud.js` **656–659** |
| Events | `sunHeat` / `sunKill` | `ctx.js` **246–247** |
| Player bounce strips sun | so heat/kill is combat, not slide | `ship.js` **910–915** |
| WAVE53 | `sunHeat` / `sunKill` / `sunTRamp` | `boot-test.mjs` **11647–11649** |

Sun lethal is **not** missing.

---

## 7. PHY-05 pad-home persist (Wave 110)

| Surface | Live | Cite |
|---|---|---|
| Patrol author | `writeStationHold(..., 'heavy', gate)` + gate + planet | `world.js` **374–381** |
| Old pad author | `station.clone()` **gone** | `src/` grep 0 |
| `healPadHome` roles | trader, miner, **patrol** | **709–712** |
| Proto-safe | `Object.hasOwn(SYSTEMS, sysId)`; new `{x,y,z}` | **715**, **732** |
| Eps | hypot ≤ 0.5 | **667**, **730** |
| `holdClassFor` patrol | known scale else `'heavy'` | **669–677** |
| Rebuild / tick | patrol heal | **457**, **846** |
| Trader/miner still | `normalizeTraderRecord` / `normalizeMinerRecord` call heal | **760**, **769** |
| Pirate/ace | **not** healed | WAVE110 `pirateAceUnchanged` **22844–22848** |
| Spawn | `recordPosition` from route | `world.js` **630–643**; `traffic.js` **105**, **117** |
| Hold math | cyl + hull + pad 12 + 0.05 | `traffic-feel.js` **14**, **71–102** |
| New persist key | **none** (`padHome` not in `WORLD_FIELDS`) | `save.js` **77–102**; WAVE110 **22856–22859** |
| WAVE110 pin | `WAVE110 PHY-05` | `boot-test.mjs` **22701–22869** |

Example REAL “role still homes to pad-center after save” is **false vs author + heal + live patrols**.

Patrol **live dest** is still a loiter ring 80–150 (`npc.js` **210–216**, **260**), already outside D5. Leftover was persist/author, now live.

---

## 8. HUD / Digit / persist / XSS

| Surface | Live | Cite |
|---|---|---|
| Empty hub | 80×80 `.rw-reticle` | `hud.css` **184–193** |
| RANGE | TGT-01 token on hub | `hud.js` **781** |
| Collision pip / heat gauge | **absent** | no PHY chrome in reticle |
| Digit 0 | last `DOCK_KEY_SERVICES` = shipyard | `station.js` **188**, **6171–6173** |
| Digit 8 / 9 | launch / epics | **188** indices 7 / 8 |
| `innerHTML` physics/collision/world/traffic-feel | **none** | grep 0 |
| `WORLD_FIELDS` avoid/padHome | **none** | `save.js` **77–102** |

---

## 9. Rejected as invented work (not leftover)

| Candidate | Why not a hole |
|---|---|
| Navmesh / A* / `planApPath` in NPC | Owner omit; PHY-04 freeze; grep 0 in `npc.js` |
| PHY-04 PR3 80 u | Owner skippable |
| Player FLT lookahead | Player collision LIVE; `applyAvoidBias` not in `ship.js` |
| Hub collision pip / heat gauge | HUD-01 empty hub |
| `world.avoid` / `world.padHome` | Persist already on `record.route` |
| PHY keys on `state.js` | Explicitly forbidden; grep 0 |
| Pirate/ace pad heal | Never used pad author |
| Retune 40 / 1.4 / sun radii / impact 8 / 0.35 | Landed knobs; Wave 112 |
| WAVE109 PHY-04 boot `console.log` | Not player-facing; kernel-pins exist |
| AST belts / FX punch / AP / MATCH | Other leftovers |

---

## 10. Neighbor freeze (do not claim)

| Neighbor | This leftover |
|---|---|
| NAV / AP | cite `applyAvoidBias` after path only |
| TGT | RANGE token cite only |
| FX | `sunHeat` toast copy cite only |
| AST | rock bag slots cite only |
| MATCH | not this work |

---

## 11. Verdict recap

Named PHY-01, Wave 58 PHY-02 keep-out, PHY-04 two-sample + frame hold, PHY-03 sun, PHY-05 pad-home are **LIVE**. Remaining wishlist bullets are **live or owner-omitted/skippable**. Example REAL holes are **false**. Freeze **CONSUME**. Named serial **none**. Name: **no remaining PHY leftover.**
