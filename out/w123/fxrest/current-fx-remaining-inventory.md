# Wave 123 remaining FX leftover after named FX slices — live inventory

**Wave:** 123. Markdown only. Code wins over wishlist Initiative FX bullet list.  
**Census date:** 2026-08-25.  
**Scope:** remaining **FX leftover after named FX slices shipped**. Not PHY bounce. Not AST. Not HUD toast. Not Incoming fire. toast. Not muzzle PR1.  
**Cite, do not rewrite:** [`docs/Fx01RemainingDesign.md`](../../docs/Fx01RemainingDesign.md), [`docs/Fx01RemainingScrapeDesign.md`](../../docs/Fx01RemainingScrapeDesign.md), [`docs/Fx01RemainingMuzzleDesign.md`](../../docs/Fx01RemainingMuzzleDesign.md); [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative FX (read only).  
**Not this leftover:** HUD-01 empty hub. Digit 0/8/9. Kit mutate. Aim-glass gauges. New persist key. UU. SKU. Hitscan combat beam. User shaders from save. Second incoming-fire live region. PHY-04 80 u (skippable). FX-01 flash map (skippable). FX-02 music/radio (closed). IMPACT 8 / 0.35 retune.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| FX-01/02/03 first pass (Wave 54)? | **Yes.** Muzzle pool, bolt glow/streak, ripple helper, sparks 11, `playerFire`, shake, song CUES, death burst | **LIVE** (Wave 54) |
| Recoil + pooled hull scorches (Wave 59)? | **Yes.** Flesh kick cannon/disruptor; `HULL_MARK_POOL === 12`; stamp unshielded; park on destroy | **LIVE** (Wave 59) |
| Hull-local shield ripple (Wave 111)? | **Yes.** `spawnRipple(..., host)` parents via `worldHitToLocal`; FP player stays world-space; fail closed to scene | **LIVE** (Wave 111) |
| Scrape punch `spawnHitFx` on damaging ram (Wave 114)? | **Yes.** Damaging `bodyHit` applyHit calls `spawnHitFx(pos, 'impact', shielded, host)` | **LIVE** (Wave 114) |
| Muzzle leftover CONSUME (Wave 114)? | **Yes.** `spawnMuzzle` + glow/streak bolts + mining lance **LIVE**. Name **no remaining FX-01 muzzle leftover.** Do **not** reopen as REAL | **CONSUME** (Wave 114) — stays CONSUME |
| Wishlist FX-01 bullets still a remaining hole? | **No.** Each bullet is LIVE, CONSUME, skippable, or closed (see §2) | **Not a hole** |
| Second unnamed player-facing FX hole? | **No.** Idea inbox has no open FX IDEA. Flash map / 80 u skippable. Music/radio closed | **Not a hole** |

Name: **no remaining FX leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/combat.js` | `spawnMuzzle` / `spawnRipple` / `spawnHitFx` / `stampHullMark` / scrape / XOR / pools |
| `src/game/hull-marks.js` | pool 12; `worldHitToLocal` |
| `src/systems/ship.js` | recoil + shake |
| `src/systems/song.js` | combat CUES |
| `src/systems/npc.js` | death burst / FX-03 visual |
| `src/game/world.js` | wreck aftermath meshes + `aftermath` |
| `src/game/physics.js` | IMPACT 8 / 0.35 |
| `src/game/save.js` | `WORLD_FIELDS` (no FX sprite key; `aftermath` exists) |
| `src/game/state.js` | READ-ONLY later; WEAPONS cite |
| `src/systems/hud.js` | RANGE, hull-strike toast, facing flash |
| `src/ui/hud.css` | 80 px hub |
| `src/systems/station.js` | Digit 0/8/9 |
| `src/systems/settings.js` / `src/core/ctx.js` | `reducedMotion` |
| `scripts/boot-test.mjs` | WAVE54 / WAVE55 / WAVE59 pins |
| Honor docs | Fx01 remaining / scrape / muzzle; wishlist Initiative FX |
| Prior packs | `out/w114/fxmuzzle/**`, `out/w114/fxscrape/**`, `out/w111/fx01/**`, `out/w110/fx01/**` (read) |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code (stale bullets)

Initiative FX (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **1379–1438**, cite only):

- Status: FX-01/02/03 first pass DONE Wave 54; recoil + scorches Wave 59; Wave 111 hull-local ripple; Wave 114 scrape punch; Wave 114 muzzle CONSUME (**1381–1389**).
- FX-01 still **lists** stronger muzzle, readable projectiles/beams, shield ripples, hull sparks, restrained shake, sounds, recoil, persistent marks (**1405–1414**).
- FX-02: prioritize weapon/impact/engine/warning; do **not** prioritize music/radio/station ambience (**1416–1421**).
- FX-03: visual burst DONE; lasting salvage/cargo/pods in `world.js` (**1423–1434**).

Idea inbox: **no** open FX IDEA (**44–76** all `[x] DONE` NAV/CTL/HUD).

**Code wins.** Treating the FX-01 bullet list as REAL leftover would double-ship Wave 54/55/59/111/114. This pack does **not** edit the wishlist.

| Wishlist bullet | Live | Verdict |
|---|---|---|
| Stronger muzzle flashes | `spawnMuzzle` glow-dot, family tint, FP-safe | **LIVE**; leftover already **CONSUME** (Wave 114). Do not reopen |
| Readable projectiles / beams | sphere `PROJ_RADIUS` 0.4 + glow + streak; mining lance ribbon+core+glow | **LIVE** (Wave 54/55). Hitscan combat beam **forbidden** |
| Shield ripples | WAVE111 parented ring; XOR shielded | **LIVE** |
| Hull sparks and debris | `spawnSparks` 11 chips unshielded; death burst `npc.js`; wreck meshes `world.js` | **LIVE** |
| Restrained camera shake | caps 0.35 / 0.12; `playerFire` / `playerHit` / `bodyHit` / wreck rumble | **LIVE** |
| Strong weapon / impact sounds | `song.js` CUES `playerFire` / `npcFire` / `playerHit` / `bodyHit` | **LIVE**; music/radio **closed** |
| Visible recoil | cannon/disruptor flesh +Z/+Y | **LIVE** Wave 59 |
| Persistent damage marks | pool 12, host-parented, scene only | **LIVE** Wave 59 |

---

## 3. Named slice: FX-01/02/03 first pass (Wave 54)

| Surface | Live | Cite |
|---|---|---|
| Charter | projectile-based; mining industrial; no hitscan | `combat.js` **24–26** |
| `MUZZLE_POOL` / `spawnMuzzle` | 16; glow-dot map; family tint; FP small step | **185**, **609–624**, **1008–1029** |
| Bolts | sphere + child glow + visual streak; `PROJ_RADIUS` 0.4 | **187**, **426–541**, **490–536** |
| `RIPPLE_POOL` / `spawnRipple` | 16; ring texture | **186**, **626–641**, **1050–1106** |
| Sparks | 11 chips; `reducedMotion` no emit | **201–204**, **961**, **643–664** |
| `playerFire` emit | only when a shot leaves a pool | **1233–1235**, **1325–1327**, **1387–1389** |
| Shake | lastEvents; caps | `ship.js` **121–137**, **1203–1264** |
| Audio | CUES include playerFire / npcFire / bodyHit | `song.js` **45–69** |
| Death burst | pool 3; `emitDeathBurst` | `npc.js` **104**, **2196–2218**, **2340–2341** |
| WAVE54 pin | `MUZZLE_POOL` / `spawnMuzzle` / `spawnRipple` / `spawnHitFx` / sparks 11 / `PROJ_RADIUS` / cues / shake / death pool | `boot-test.mjs` **11661–11688** |

---

## 4. Named slice: recoil + pooled hull scorches (Wave 59)

| Surface | Live | Cite |
|---|---|---|
| Recoil event | `playerFire` cannon/disruptor | `ship.js` **1237–1247** |
| Recoil flesh | `flesh.position.z += recoilZ`; `y += recoilY` | **1262–1263** |
| Recoil zero | reducedMotion / docked / jump | **1207–1210** |
| No throttle write | never `input.throttle` | WAVE59 pin `noThrottle` |
| Mark pool | **12** | `hull-marks.js` **7**; `combat.js` **686** |
| Stamp unshielded | XOR sparks + `stampHullMark` | `combat.js` **1110–1116** |
| Park destroy | `parkMarksOnHost` on `npcDestroyed` | **1166–1169** |
| WAVE59 pin | recoil + `HULL_MARK_POOL === 12` + stamp + park | `boot-test.mjs` **11838–11892** |

---

## 5. Named slice: hull-local shield ripple (Wave 111)

| Surface | Live | Cite |
|---|---|---|
| Header | parent to host; FP player world-space | `combat.js` **101–103** |
| `spawnRipple(pos, family, host)` | `worldHitToLocal` + `RIPPLE_LIFT`; `host.add` | **1050–1106** |
| FP player host | skip parent; world-space | **1066–1067**, **1097–1103** |
| Fail closed | catch → scene copy; never freeze | **1092–1102** |
| Park | death / load / destroy | **1031–1047**, **1166–1175**, **1744–1746** |
| XOR | shielded ripple else sparks+mark | **1109–1116** |
| WAVE111 boot `console.log` | **absent** (REP-03 pin at **22872** is sibling) | honor: live `host.add`; `out/w111/fx01/` probe. **Not** a player-facing hole |

**Do not steal** WAVE111 `spawnRipple` parent.

---

## 6. Named slice: scrape punch (Wave 114)

| Surface | Live | Cite |
|---|---|---|
| IMPACT knobs | min speed **8**; **0.35** / u/s | `physics.js` **11–12** |
| Throttle | one scrape / `IMPACT_GAP` 0.2 s | `combat.js` **163**, **1843** |
| Damaging ram | applyHit family `'impact'`; emit `playerHit` | **1840–1855** |
| World punch | `try { spawnHitFx(pos, 'impact', shielded, host); }` | **1858–1860** |
| Weapon callers | NPC **1742**; player **1799** | do not steal scrape path |
| Hull-strike toast | `'▲ Hull strike.'` if `damage > 0` | `hud.js` **660–662** |

**Do not steal** scrape `spawnHitFx`. **Do not retune** IMPACT 8 / 0.35.

---

## 7. Named slice: muzzle leftover CONSUME (Wave 114)

Cite [`docs/Fx01RemainingMuzzleDesign.md`](../../docs/Fx01RemainingMuzzleDesign.md). Name: **no remaining FX-01 muzzle leftover.**

| Surface | Live | Cite |
|---|---|---|
| Muzzle | pooled glow-dot, FP-safe, family tint | `combat.js` **185**, **609–624**, **1008–1029** |
| Callers | player gun / missile / turret; NPC bolt / missile | **1233**, **1294**, **1327**, **1387**, **1414** |
| Bolts | glow + streak; `PROJ_RADIUS` 0.4 | **187**, **426–541** |
| Mining lance | ribbon + core + contact glow; **no** `spawnMuzzle` | **695–759**, **1419+** |
| WAVE55 pin | `makeBeamRibbon` / `map: glowTex` / `LANCE_W*` | `boot-test.mjs` **11691–11706** |

Do **not** reopen this leftover as REAL. Do **not** crank `base`/`grow`/`PROJ_RADIUS`. Do **not** invent a hitscan combat beam.

---

## 8. FX-02 audio / FX-03 aftermath

| Surface | Live | Cite |
|---|---|---|
| Combat cues | playerHit / npcHit / bodyHit / playerFire / npcFire | `song.js` **51–69** |
| Music / radio | **closed** (wishlist FX-02) | not a remaining leftover |
| Death burst | `emitDeathBurst`; world.js stages lasting | `npc.js` **2340–2341** |
| Wreck data | `stageAftermath` kind `'wreck'` from real kills | `world.js` **1322–1338** |
| Wreck mesh | `makeWreckMesh`; tick expire + ember | **1262**, **1249**, **1890–1908** |
| Persist | `aftermath` already on `WORLD_FIELDS` | `save.js` **77–79** |

FX-03 lasting wrecks/cargo/pods are **not** missing. Do not invent a second wreck system.

---

## 9. Ctx / persist / honor

| Surface | Live | Cite |
|---|---|---|
| Empty hub | 80 px reticle | `hud.css` **184–193** |
| RANGE | TGT-01 word on hub; `in-range` show | `hud.js` **781**; `hud.css` **207–218** |
| Facing flash | `.rw-combat-self` 0.4 s | `hud.js` **919**, **1183–1184**, **1231–1232**, **1474–1482** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188**, **6035–6036** |
| `reducedMotion` | settings + body class; snap FX; zero shake | `settings.js` **72**; `ctx.js` **217**; `ship.js` **1207–1211** |
| FX sprite persist | **none** in `WORLD_FIELDS` | `save.js` **77–101** |
| Combat `innerHTML` | **none** | grep 0 |

---

## 10. Grep remaining holes (rejected as leftover)

| Candidate | Live | Verdict |
|---|---|---|
| Crank muzzle / `PROJ_RADIUS` | `spawnMuzzle` + WAVE54 pins | **not a hole** — Wave 114 CONSUME; do not reopen |
| Hitscan combat beam | charter forbids | **do not invent** |
| Unparented ripple | WAVE111 `host.add` | **gone** |
| Scrape without world FX | `spawnHitFx` **1858–1860** | **gone** |
| Missing recoil / marks | WAVE59 LIVE | **gone** |
| Missing shake / song | WAVE54 LIVE | **gone** |
| Missing wreck aftermath | `world.js` `aftermath` + meshes | **gone** |
| Flash map (`spawnFlash` no `map`) | untextured square **990–1001** | **skippable** — not required PR1 |
| PHY-04 80 u | PR3 skipped; `AVOID_LOOKAHEAD` 40 | **skippable** |
| Music / radio | FX-02 closed | **not this leftover** |
| Hub punch pip | HUD-01 empty | **do not invent** |
| Second incoming-fire live region | Incoming fire. is TGT/HUD sibling | **do not invent** |
| Named WAVE111 FX `console.log` absent | live `host.add`; probe `out/w111/fx01/` | **not a player-facing FX hole**; do not edit `scripts/` from this pack |

---

## 11. Boot pins (read only; do not edit)

| Pin | What it proves |
|---|---|
| WAVE54 FX | muzzle / ripple / sparks 11 / `PROJ_RADIUS` / song keys / shake caps / death pool |
| WAVE55 MINING LANCE | ribbon + glowTex contact + `LANCE_*` |
| WAVE59 FX | recoil event/flesh/zero; mark pool 12; stamp unshielded; park destroy |
| WAVE111 named FX log | **not present** (REP-03 sibling pin exists) |

---

## 12. Name

**no remaining FX leftover.** Freeze leftover **CONSUME**. Named serial **none**. Do **not** invent remaining FX product work. Muzzle leftover stays **CONSUME**.
