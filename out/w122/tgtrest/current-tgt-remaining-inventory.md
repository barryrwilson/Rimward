# Wave 122 TGT remaining leftover — live inventory

**Wave:** 122. Markdown only. Code wins over wishlist Initiative TGT candidate bullets and over stale “remaining awareness” wording.  
**Census date:** 2026-08-25.  
**Scope:** leftover **remaining TGT after named TGT-01…TGT-05 slices**. Not HUD-02 class tokens. Not HUD-04 toast flood. Not NAV-07 labels. Not overlay mutex.  
**Cite, do not rewrite:** [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative TGT; [`docs/Tgt03AwarenessDesign.md`](../../docs/Tgt03AwarenessDesign.md); [`docs/Tgt03RadarDesign.md`](../../docs/Tgt03RadarDesign.md); [`docs/Tgt03ClosureDesign.md`](../../docs/Tgt03ClosureDesign.md); [`docs/Tgt03SubsystemDesign.md`](../../docs/Tgt03SubsystemDesign.md); [`docs/Tgt05ReticleLockDesign.md`](../../docs/Tgt05ReticleLockDesign.md); [`docs/Tgt05LockCatsDesign.md`](../../docs/Tgt05LockCatsDesign.md); [`docs/NpcTurretsDesign.md`](../../docs/NpcTurretsDesign.md); [`docs/NpcMissilesDesign.md`](../../docs/NpcMissilesDesign.md); [`docs/OwnerDecisionsWave98.md`](../../docs/OwnerDecisionsWave98.md); [`docs/OwnerDecisionsWave100.md`](../../docs/OwnerDecisionsWave100.md); [`docs/OwnerDecisionsWave101.md`](../../docs/OwnerDecisionsWave101.md).  
**Not this leftover:** HUD-01 hub PPI. Aim-glass gauges. Incoming **gauge**. Kit mutate. New Digit. New persist key. UU / SKU invent. Second incoming-fire live region. HUD-02 `classKeyToken`.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| TGT-01 lead + RANGE? | **Yes.** `.rw-lead` + `.rw-reticle-range` pop on selected-weapon envelope | **LIVE** |
| TGT-02 MATCH lamp + KeyX? | **Yes.** `rw-match-lamp`; rock rest-frame + lamp on rock | **LIVE** |
| TGT-03 scanner-gated bearing arc? | **Yes.** `.rw-contacts`; Mk I bubble / Mk II 2× + «/» | **LIVE** |
| TGT-03 Incoming fire. + lock edge-arrow park? | **Yes.** toast + `.rw-edge-arrow` dock/jump park | **LIVE** |
| TGT-03 radar jump-park, no PPI? | **Yes.** `contactsGate(..., jumping)`; hide `.rw-contacts`; no PPI class | **LIVE** / PPI **omit** |
| TGT-03 CLOS next to DIST? | **Yes.** `+N` / `-N` / `0 u/s` on tgt rail | **LIVE** |
| TGT-03 KeyK engine + ENGINE bar? | **Yes.** `ctx.targets.part`; `.rw-engine-tgt` `is-part` | **LIVE** |
| TGT-04 player `auto` + NPC darts + NPC turret vsPlayer/vsNPC? | **Yes.** SKU `auto`; pirate+ace darts; class-gated turret | **LIVE** |
| TGT-05 KeyV + station/gate/pod/landmark cone 12? | **Yes.** `LOCK_CONE_PX = 12`; `lockKind` allowlist | **LIVE** |
| Wishlist TGT-03 radar still a player-facing hole? | **No.** Arc **is** radar. Hub PPI is standing omit | **Not leftover** |
| Off-screen arrows still missing? | **No.** `.rw-edge-arrow` live; NAV-02 cue is sibling | **Not leftover** |
| Attacker warnings still missing? | **No.** `Incoming fire.` + FORE/AFT hit flash | **Not leftover** |
| Distance / closure still missing? | **No.** DIST core + CLOS core | **Not leftover** |
| Missile warnings still missing? | **No.** `Incoming dart.` toast. Gauge standing omit | **Not leftover** |
| Subsystem targeting still missing? | **No.** KeyK engine-only after shields | **Not leftover** |
| Improved lead still missing? | **No.** TGT-01 ungated; scanner does not gate lead | **Not leftover** |
| Salvage / cargo / anomaly extra lockKind? | **No.** Wave 82 forbade salvage kind; cargo is hold; landmarks cover anomalies | **Owner omit** |
| New persist / Digit / SKU / PPI / gauge as leftover PR1? | **No.** Would invent work | **Forbidden** |
| Wishlist candidate list still true vs code? | **No.** Stale vs named slices | **CONSUME** |

Name: **no remaining TGT leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/hud.js` | lead, RANGE, MATCH, contacts, edge-arrow, CLOS, ENGINE, Incoming toasts |
| `src/ui/hud.css` | 80 px hub, `.rw-contacts`, `.rw-edge-arrow`, CLOS, ENGINE, MATCH |
| `src/systems/controls.js` | KeyT / KeyV / KeyK / KeyX |
| `src/systems/combat.js` | player `auto`; NPC shot; vsPlayer vsNPC turret |
| `src/systems/npc.js` | dart emit; `canNpcTurret`; vsPlayer / vsNPC |
| `src/core/ctx.js` | `targets.current` / `part`; flags MATCH; `npcFire` comment |
| `src/game/reticle-aim.js` | `LOCK_CONE_PX`; `lockKind` materialize |
| `src/game/npc-fire-toast.js` | dart / fire / turret toast matrix |
| `src/game/contacts-gate.js` | scanner heal; dock/jump park |
| `src/game/los-close.js` | signed LOS rate |
| `src/game/subsys-aim.js` | engine part toggle |
| `src/game/weapon-fit.js` | SKU `auto` |
| `src/game/save.js` | `WORLD_FIELDS` (no targeting key) |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 launch/epics + outfit papers |
| `src/systems/ship.js` | MATCH refuse on kind locks |
| `src/systems/hail.js` | hail refuse on kind locks |
| `scripts/boot-test.mjs` | WAVE F, 70, 71, 74, 82, 83, 98–102 |
| Honor docs | wishlist TGT; Tgt03*; Tgt05*; Npc*; Owner 98/100/101 |

Did **not** start Vite or Chrome. Domain is **data**. Did **not** run `npm run test:boot`.

---

## 2. Wishlist vs code (stale lines)

Initiative TGT (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **639–747**, cite only):

- Status header already records TGT-01/02 DONE, TGT-03 arc + awareness + radar park + engine + CLOS, TGT-04 auto + NPC missiles + turrets, TGT-05 KeyV + remaining cats.
- TGT-03 **699–707** still lists candidate capabilities: radar; off-screen arrows; attacker warnings; distance and closure; missile warnings; subsystem targeting; improved lead.

**Code wins.** Named slices already ship those player-facing jobs, or the owner omitted the extra chrome (PPI, aim-glass gauge, incoming gauge). This pack does **not** edit the wishlist.

TGT-05 extra words salvage / cargo / anomalies (**740–742**) are **not** a remaining hole: Wave 82 freeze forbade salvage kind (disabled ships stay ships); cargo is hold inventory; landmarks are the lockable world mark (including hush `th_veil` anomaly mesh as landmark, not a new kind).

---

## 3. Named slices (live)

### 3.1 TGT-01 lead + RANGE (Wave D)

| Surface | Today | Cite |
|---|---|---|
| Lead pip | `.rw-lead` + LEAD label | `hud.js` **813–815** |
| TOF | `dist / wSpeed`; `relVel` from target − ship | **1387–1407** |
| Skip tiny | `LEAD_MIN_SPEED = 6` | **71** |
| Mining / empty 4 | hide lead (`wSpeed` 0) | **1387–1395** |
| RANGE pop | `.rw-reticle-range` + `.in-range` when `targetDistNow <=` selected weapon range | **781**, **1457–1468**; `hud.css` **207–219** |
| Scanner gate | **None.** Core | comment **1494–1495** |

### 3.2 TGT-02 MATCH (Wave D / 70 / 71)

| Surface | Today | Cite |
|---|---|---|
| KeyX | `pendingMatchSpeed` | `controls.js` **44**, **308–309** |
| Flag | `ctx.flags.matchSpeed` | `ctx.js` **206** |
| Lamp | `MATCH` span; ship **or** rock lock | `hud.js` **356**, **1896–1900** |
| CSS | `.rw-match-lamp` | `hud.css` **222–229** |
| Rock MATCH | WAVE70 pin `rockArm` | `boot-test.mjs` **14299–14383** |
| Lamp on rock | WAVE71 HUD source pin | **14386+** |
| Kind refuse | station/gate/pod/landmark not MATCH | `ship.js` **691–696** |

### 3.3 TGT-03 Wave F contacts arc

| Surface | Today | Cite |
|---|---|---|
| DOM | `.rw-contacts` + SVG stroke + 24 pips | `hud.js` **876–906** |
| Gate | `contactsScanner` 0/1/2; hide docked or jumping | `contacts-gate.js` **8–19**; `hud.js` **1497–1501** |
| Mk I | `U.ENCOUNTER_BUBBLE`; cap 16 | **1515–1516** |
| Mk II | 2× bubble; 24 slots; lock «/» | **77**, **1591–1606** |
| Shape | civ tick / hostile chevron / lock diamond | `hud.js` **405–408**; `hud.css` **826–850** |
| Not a ring | bottom **5.5%**; empty middle | `hud.css` **787–796** |
| Boot | WAVE F hiddenCore / shownMk1 / civ / hostile / lock / hiddenDocked / Mk2 | `boot-test.mjs` **11491–11578** |

### 3.4 TGT-03 awareness (Wave 98)

| Surface | Today | Cite |
|---|---|---|
| Edge arrow | `.rw-edge-arrow`; `aria-hidden=true` | `hud.js` **816–817**; `hud.css` **575–594** |
| Park | docked **or** jumping hide | `hud.js` **1418–1420** |
| Behind camera | NDC flip `proj.z > 1` | **1373–1374** |
| Incoming fire. | cannon vs player (or ace omit); turret vs player | `npc-fire-toast.js` **8–9**, **54–64** |
| Incoming dart. | missile `target === 'player'` | **47–51** |
| HUD route | `case 'npcFire'` → `npcFireToast` | `hud.js` **14**, **649–654** |
| FORE/AFT | hit flash; not muzzle toast | facing block **1472–1491** |
| Boot | WAVE98 matrix + park/aria | `boot-test.mjs` **20747–20923** |

### 3.5 TGT-03 radar jump-park (Wave 99)

| Surface | Today | Cite |
|---|---|---|
| Helper | `contactsGate(scanner, docked, jumping)` | `contacts-gate.js` **18–19** |
| HUD | `showArc = contactsGate(...) && !!shipObj` | `hud.js` **1497–1501** |
| Jumping | hide arc; **do not** clear `world.scanner` | comment **59–60**, **1494–1495** |
| PPI | **none** under `src/` | grep `PPI` / `.rw-ppi` **0** |
| New class | reuse `.rw-contacts` | `hud.css` **787** |
| WAVE99 boot block | NPC turrets (sibling pin); radar park is **code** + WAVE F dock hide | `boot-test.mjs` **20926** |

### 3.6 TGT-03 CLOS (Wave 102)

| Surface | Today | Cite |
|---|---|---|
| Label | CLOS next to DIST on tgt rail | `hud.js` **937–942** |
| Format | `+N u/s` recede; `-N u/s` approach; `0 u/s` | **291–296** |
| Math | `losCloseRate` | `los-close.js` **20–27**; `hud.js` **1365–1367**, **2148–2151** |
| Scanner | **does not** gate CLOS | WAVE102 `scanner0ShowsRail` **21760–21762** |
| Non-ship | rail hide; rate 0 | `hud.js` **1316–1321**; WAVE102 `nonShipNoRate` |
| Persist | **none** | `save.js` **77–101** |
| Boot | WAVE102 | **21613–21785** |

### 3.7 TGT-03 subsystem (Wave 100)

| Surface | Today | Cite |
|---|---|---|
| KeyK | TRACKED + `toggleEnginePart` | `controls.js` **44**, **317–318**, **431** |
| Part bag | `ctx.targets.part` `'engine' \| null` | `ctx.js` **195**; `subsys-aim.js` **5–35** |
| ENGINE bar | tgt rail `.rw-engine-tgt`; `is-part` | `hud.js` **934**, **2156–2162**; `hud.css` **910–920** |
| Peel | screen → shell still first; engine after both 0 | Owner Wave 100; WAVE100 pin **21265–21320** |
| SKU | **none** | WAVE100 `noSku` |
| `lockKind` engine | **forbidden** | WAVE100 `noLockKindEngine` |

### 3.8 TGT-04 auto / NPC missiles / NPC turrets

| Surface | Today | Cite |
|---|---|---|
| Player SKU | `TURRET_IDS.auto` | `weapon-fit.js` **46–54** |
| Player fire | `tryPlayerTurret` not a weapon group | `combat.js` **1372–1390**, **1978–1980** |
| NPC dart | pirate+ace vs player; one after telegraph | `npc.js` **49–50**, **1679–1681**, **2063–2065** |
| Toast dart | `Incoming dart.` | WAVE83 **18600–18676** |
| NPC turret gate | `canSeat` heavy/ace/frigate + `mayHuntPlayer`; Unknowable never | `npc.js` **1207–1213** |
| vsPlayer emit | `weapon:'turret', target:'player'` | **1225–1227** |
| vsNPC emit | live NPC object | **1230–1235**; Owner Wave 101 |
| Combat | vsPlayer `bolt.vsPlayer = true`; vsNPC false | `combat.js` **1916–1929** |
| Toast turret | same `Incoming fire.` iff `target === 'player'` | `npc-fire-toast.js` **56–58**; Owner 101 Q5 |
| Incoming gauge | **none** | WAVE83 / WAVE98 / WAVE99 `inboundGauge` false |

### 3.9 TGT-05 reticle + remaining cats

| Surface | Today | Cite |
|---|---|---|
| KeyV | `tryReticleLock` | `controls.js` **311–312**, **452** |
| KeyT | cycle ships; rocks only group 3 | **85–114**, **296–297** |
| Cone | `LOCK_CONE_PX = 12` | `reticle-aim.js` **15**, **321** |
| Kinds | station / gate / pod / landmark | **279–310**; `allowedLockKind` `controls.js` **120–123** |
| WAVE74 | KeyV ships+rocks | `boot-test.mjs` **15015** |
| WAVE82 | cone 12 + station pick | **18003–18057** |

---

## 4. TGT-03 candidate bullets (code wins)

| Wishlist name | Player-facing job | Live instrument | Hole? |
|---|---|---|---|
| radar | nearby traffic picture | `.rw-contacts` scanner-gated arc + jump park | **No.** PPI omit |
| off-screen target arrows | find current lock off glass | `.rw-edge-arrow` (not NAV-02 cue) | **No** |
| attacker warnings | firing line off column | `Incoming fire.` toast; FORE/AFT is **hit** | **No** |
| target distance and closure | numeric DIST + rate | DIST + CLOS on tgt rail; Mk II «/» sibling on lock pip | **No** |
| missile warnings | dart inbound | `Incoming dart.` toast. Gauge omit | **No** |
| subsystem targeting | pick a part | KeyK engine after shields; ENGINE bar | **No** |
| improved lead and range | hit moving target | TGT-01 lead + RANGE (ungated) | **No** |

---

## 5. Standing omit (not leftover, not PR1)

| Omit | Live proof | Why not leftover |
|---|---|---|
| Aim-glass gauges | RANGE is a reticle pop, not a hub dial; no extra gauge nodes on `.rw-reticle` children besides RANGE | HUD-01 |
| HUD-01 empty 80 px hub | `.rw-reticle` 80×80; clamp `cx - 44` | `hud.css` **184–193**; `hud.js` **1293** |
| Hub radar pip / PPI | grep PPI **0** | Tgt03RadarDesign |
| Kit mutate | no TGT SKU mutate this leftover | honor |
| Incoming **gauge** | WAVE83/98/99 `inboundGauge` false | toast already live |
| Salvage `lockKind` | Wave 82 non-goal | disabled ships are ships |
| Aftermath wreck lock | Wave 82 out | decorative |
| Clue lock | Wave 82 §25 | landmark id only |
| Second incoming-fire live region | toasts ride HUD-04 polite stack | HUD-04 sibling |
| New Digit / persist / UU / SKU | Digit 0/8/9 live; `WORLD_FIELDS` has scanner/turret already, no CLOS/part | honor |

---

## 6. Honor surfaces (cite, do not steal)

| Surface | Today | Cite |
|---|---|---|
| Empty hub | 80 px | `hud.css` **184–193** |
| Digit 0 | shipyard last service | `station.js` **188**, **6034–6037**, **6171–6173** |
| Digit 8/9 dock | launch / epics (menu Standing) | **188**, **6034**, comment **1644–1645** |
| Digit 8/9 outfit | launcher / turret papers | **1691–1706** |
| HUD-02 `classKeyToken` | bio+mech allowlist; sibling | `hud.js` **102–108**, **1157** |
| HUD-04 toast | 5 slots, linger 8 s | `hud.js` **63–66**, **843–855** |
| Overlay mutex | hail/berth sibling | do not raise toast z |
| `innerHTML` hud.js | **none** | grep 0 |
| `el()` | `textContent` | `hud.js` **283–288** |
| `WORLD_FIELDS` targeting extra | **none** (`scanner` / `turret` already hangar) | `save.js` **77–101** |
| `state.js` | READ-ONLY this leftover | honor |
| `ctx.targets` | `current`, `part`, `reticleScreen` | `ctx.js` **193–197** |

---

## 7. Boot pins (read only; do not run)

| Pin | What it defends |
|---|---|
| HUD WAVE F **11491–11578** | arc present; scanner 0 hide; Mk I; civ/hostile/lock; dock hide; Mk II |
| WAVE70 **14299–14383** | KeyX rock MATCH; ship MATCH; throttle not written |
| WAVE71 **14386+** | MATCH lamp on rock |
| WAVE74 **15015–15384** | KeyV; KeyT preserve |
| WAVE82 **18003–18057** | cone 12; station `lockKind`; refuse kinds |
| WAVE83 MISSILES **18600+** | NPC dart pool; `Incoming dart.`; no inbound gauge |
| WAVE98 **20747–20923** | Incoming fire. matrix; edge park/aria; no gauge |
| WAVE99 TURRETS **20926–21262** | vsPlayer turret; Incoming fire. reuse; no gauge |
| WAVE100 **21265–21320** | KeyK; ENGINE bar; no persist part; no Digit steal |
| WAVE101 **21323–21610** | vsNPC turret |
| WAVE102 **21613–21785** | CLOS next to DIST; scanner 0 still shows rail; hub empty of CLOS |

Known boot FAILs (REDMARCH castMatches flake and others) are **not** this leftover. Do not “fix.”

---

## 8. False holes (do not freeze PR1)

| Temptation | Why it is not leftover |
|---|---|
| “Add radar” as a PPI disc | Arc is radar. Owner forbade hub PPI |
| Second off-screen arrow class | Would double `.rw-edge-arrow` or steal `.rw-nav-gate-cue` |
| Incoming-fire **gauge** or second live region | Toast live; gauge omit; HUD-04 owns the stack |
| Scanner-gated CLOS | Owner made CLOS **core** |
| Selectable hull/screen/FTL rooms | Owner Wave 100: engine only |
| Salvage / cargo / anomaly kinds | Wave 82 omit / not world lock kinds |
| Improved lead SKU | TGT-01 already ungated |
| `archiveFilePrice`-style “helper not mirrored” for CLOS | CLOS already writes `tgtClosVal` |
| WAVE99 boot block named TURRETS not RADAR | Jump park is live `contactsGate`; WAVE F still pins dock hide |
| Duplicate `INCOMING_DART_TOAST` const in `hud.js` **67** | Same authored string; not a player hole |
| Mk II «/» vs rail CLOS | Two jobs: pip qualitative vs rail numeric |

---

## 9. Census close

Remaining TGT leftover after named slices is **already gone**. Wishlist candidate names are **stale vs code** or **standing omit**. Freeze **CONSUME**. Named serial **none**. Name: **no remaining TGT leftover.**
