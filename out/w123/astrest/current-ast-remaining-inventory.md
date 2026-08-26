# Wave 123 remaining AST leftover after AST-01/02 — live inventory

**Wave:** 123. Markdown only. Code wins over wishlist Initiative AST “single local cluster” / “Oort-cloud-like region.”  
**Census date:** 2026-08-25.  
**Scope:** remaining **AST leftover after named AST slices shipped** (AST-01/02 Wave 69; Wave 70 rock MATCH rest-frame; Wave 71 MATCH lamp on rock). Not PHY bounce. Not FX. Not NAV. Not mining jobs MSN. Not MATCH rewrite.  
**Cite, do not rewrite:** [`docs/AstOrbitsDesign.md`](../../docs/AstOrbitsDesign.md); [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative AST (read only).  
**Not this leftover:** HUD-01 empty hub. Digit 0/8/9. Aim-glass gauges. Kit mutate. Second belt model. New persist key. UU. SKU. Hub PPI. UUID asteroid ids.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| AST-01 individual stellar orbits (closed-form Kepler-lite, farther slower)? | **Yes.** `writeOrbitPose` / `omegaForR` each update from `world.time` | **LIVE** (Wave 69) |
| AST-01 broad belt / sparse / cloud, not one stationary clump? | **Yes.** Annulus `R ± field.radius`; `kindFromDef`; WAVE69 `notClump` | **LIVE** (Wave 69) |
| AST-02 mining still practical (work sector ≥60%)? | **Yes.** `workN` / `WORK_HALF`; WAVE69 `workSector` | **LIVE** (Wave 69) |
| AST-02 depletion identity across motion / save / revisit? | **Yes.** `id === i` + sparse `fieldOre`; overlay `min(seeded, persisted)` | **LIVE** (Wave 69) |
| Arrival line + group-3 mine cue? | **Yes.** `arrivalBeltLine`; `Mine · belt Nu` | **LIVE** (Wave 69 PR4) |
| MATCH on locked rock holds in rock rest frame? | **Yes.** `rockMatch` copies `_lockVel`; skip world damping | **LIVE** (Wave 70) |
| MATCH lamp lights on that rock lock? | **Yes.** `matchOn` uses `isRockLock`; `.rw-match-lamp` | **LIVE** (Wave 71) |
| Rocks still a single local clump with no orbit? | **No.** Closed-form xyz every update; WAVE69 `notClump` | **Not a hole** |
| Depletion identity lost on orbit? | **No.** Index `i` + `fieldOre[sys][String(i)]` | **Not a hole** |
| Remaining wishlist chart/scanner/landmark rock marks? | Owner omit (AstOrbitsDesign §7). Find-aid is commLine + group-3 | **Not a hole** |
| Unbounded Oort / 100 authored belts / UUID ids? | Owner omit. Cap 160; band default kind; `id === i` | **Not a hole** |
| Wishlist “single local cluster” still true vs code? | **No.** Wave 69 landed. Code wins | **CONSUME** |

Name: **no remaining AST leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/asteroids.js` | Kepler-lite, kind, work sector, keep-out, `id === i`, `fieldOre` write/overlay, closed-form update |
| `src/systems/rock-surface.js` | Wave 52 look DATA; cite only |
| `src/game/state.js` | `ORE_TYPES` READ-ONLY; `hardness` / `.rock` |
| `src/game/save.js` | `WORLD_FIELDS.fieldOre`; `sanitizeFieldOre`; omit-delete |
| `src/game/jump.js` | arrival belt `commLine` |
| `src/systems/hud.js` | group-3 `Mine · belt`; MATCH lamp `isRockLock` |
| `src/systems/ship.js` | rock MATCH rest-frame |
| `src/systems/controls.js` | group-3 T-cycle; `dropStaleRockLock`; KeyX |
| `src/game/collision.js` | `collectBodies` live rock xyz |
| `src/game/world.js` | `fieldPoint` = `field.center` |
| `src/systems/npc.js` | `nearestSoftRock` hardness ≤ 1, `ore > 0` |
| `src/core/ctx.js` | `world.fieldOre` ownership comment |
| `src/ui/hud.css` | empty 80 px hub; MATCH lamp |
| `src/systems/station.js` | Digit 0/8/9 |
| `scripts/boot-test.mjs` | WAVE69 / WAVE70 / WAVE71 pins |
| Honor docs | AstOrbitsDesign; wishlist Initiative AST; `out/w67/ast`, `out/w69`, `out/w70/minehold`, `out/w71/match-lamp` (read) |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code (stale lines)

Initiative AST (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **1317–1375**, cite only):

**Status** (**1319–1324**): first impl DONE Wave 69 (closed-form Kepler-lite belts, work sector, `fieldOre`, arrival line + group-3 cue). Wave 70 MATCH rest-frame. Wave 71 MATCH lamp. NPC miners already held relative.

**Player problem** (**1325–1327**) still says a single local cluster. **Code wins.** Rocks occupy a Kepler-lite annulus. This pack does **not** edit the wishlist.

AST-01 bullets (**1335–1346**): individual orbits, broad region, r/inc/phase/speed, farther slower, per-system kinds. **LIVE** via `writeOrbitPose` + `kindFromDef` (`belt`/`sparse`/`cloud`). “Multiple bands” / faction-authored `field.kind` is **optional data**; band default is LIVE. Not leftover PR1.

AST-02 bullets (**1348–1356**): find-aid, travel tax, NPC/mission reach, depletion identity. **LIVE** via work sector + commLine + group-3 cue + miners + `fieldOre`. Chart/scanner/landmark marks are **owner omit** (`docs/AstOrbitsDesign.md` §7). Missions name **system + ore key**, not asteroid UUID (WAVE71 `noAsteroidId`; not this leftover).

Acceptance “Oort-cloud-like” is **bounded cloud** (`incAmp` 0.55, still `field.radius`, cap 160). Unbounded Oort is **owner omit**.

---

## 3. AST-01 orbits + kinds (Wave 69)

| Surface | Live | Cite |
|---|---|---|
| `ORBIT_K` | 1500 local copy | `asteroids.js` **73** |
| Pose | `phase = phase0 + omega * time`; Kepler xyz | **97–108** |
| Omega | `ORBIT_K * r ** -1.5` | **127–129** |
| Kind | `field.kind` allowlist else band 0–1 `belt`, 2 `sparse`, 3–4 `cloud` | **77**, **88–95** |
| Authored `field.kind` | **none** on authored six; band default | `authored-systems.js` grep 0 on `field.kind` |
| Build count | `min(max(0, field.count), 160)` | `asteroids.js` **1644** |
| Annulus | `beltR = hypot(cx,cz)`; `rLo/rHi = R ± field.radius` | **1656–1659** |
| Inc | belt/sparse `±0.12`; cloud `±0.55` | **1660** |
| Closed-form update | mutate live `position` every tick | **2015–2027** |
| Tumble | local spin; skip far (`TUMBLE_RANGE2`); skip `reducedMotion` | **76**, **2035–2048** |
| Orbit under `reducedMotion` | **still posed** (tumble skipped, phase not frozen) | **2010–2027** vs tumble **2048** |
| WAVE69 not clump | `meanR > 0.6 * RA` | `boot-test.mjs` **14284** |

Rocks are **not** a stationary clump around `field.center`. `field.center` is the work-sector **anchor**.

---

## 4. AST-02 work sector + identity + persist (Wave 69)

| Surface | Live | Cite |
|---|---|---|
| Work frac | 0.60 default; cloud 0.50; clamp 0..1 | `asteroids.js` **1650–1654** |
| Work N | `ceil(workFrac * count)`; `i < workN` | **1654**, **1753** |
| Sector | `WORK_HALF = 0.7` rad (~80°) around `az0` | **75**, **1655**, **1754–1756** |
| Identity | `list.push({ id: i, position, radius, ore, commodity, oreKey, hardness })` | **1898–1906** |
| Shared Vector3 | `list[i].position` is `rocks[i].position` | **1757**, **1900** |
| `fieldOre` write | sparse on extract; drop key when remaining === seeded | **1567–1590**, **2124** |
| Overlay | `min(seeded, trunc(v))`; same-system restore without `systemLoaded` | **1593–1639**, **2001–2008** |
| `WORLD_FIELDS` | `'fieldOre'` after hangar write-through, before `nav` | `save.js` **98–101** |
| Sanitize | reserved ids; index regex; cap 32 systems / 160 idx / 64 remaining | `save.js` **110–118**, **184–232** |
| Omit-delete | missing key deletes live bag | `save.js` **1193–1194** |
| WAVE69 pins | `idEqIndex`, `workSector`, `depleteRoundtrip`, `fieldOreWorldField`, `cap160` | `boot-test.mjs` **14281–14293** |

Depletion stays on index `i` while the rock orbits. Identity is **not** lost on orbit.

---

## 5. Find-aid (Wave 69 PR4)

| Surface | Live | Cite |
|---|---|---|
| Arrival line | `Belt lies N u sun-relative, off the station.` `from: Echo` | `jump.js` **48–58** |
| Emit | every midpoint swap, all bands | `jump.js` **177–178** |
| Group-3 cue | weapon group 3, no rock lock: `Mine · belt Nu` | `hud.js` **2200–2206** |
| Dist helper | nearest work-sector `ore>0`, else any `ore>0`, else `field.center` | `hud.js` **487–527** |
| Prompt copy | `textContent` | `hud.js` **2226–2227** |
| WAVE69 source | `beltLine`, `hudMineCue` | `boot-test.mjs` **14291–14292** |

Chart rock icons, mystery marks, scanner-arc rocks: **absent by design**. Not a remaining hole.

---

## 6. MATCH rock rest-frame (Wave 70) + lamp (Wave 71)

| Surface | Live | Cite |
|---|---|---|
| KeyX | `pendingMatchSpeed` | `controls.js` **308–309** |
| Rock lock detect | list membership + `lockKind === 'rock'` or untagged no object/state | `ship.js` **692–696** |
| Rest frame | `rockMatch` → `_targetVelocity` from `_lockVel` + relative creep/strafe | `ship.js` **851–864** |
| No world damping | skip exp damping while `rockMatch` | `ship.js` **895–897** |
| Fail closed | NaN pose: `matchLive` needs `lockPosOk && velOk` | `ship.js` **732–736** |
| HUD lamp | `el(..., 'MATCH')`; `matchOn` ship **or** rock | `hud.js` **356**, **1896** |
| `isRockLock` HUD | list + kind | `hud.js` **438–444** |
| Stale lock drop | `dropStaleRockLock` | `controls.js` **134–140** |
| WAVE70 | `rockArm`, `noLock`, `throttleCancel`, `shipArm` | `boot-test.mjs` **14299–14383** |
| WAVE71 lamp | `lampRock` source pin | `boot-test.mjs` **14519–14521** |

This leftover does **not** rewrite MATCH.

---

## 7. Mining / PHY / miners (cite; not this leftover)

| Surface | Live | Cite |
|---|---|---|
| Group 3 T-cycle | rocks in cands when `weaponGroup === 3` | `controls.js` **100–106** |
| PHY | `collectBodies` copies live list xyz | `collision.js` **411–421** |
| Miners | `fieldPoint` = `field.center` | `world.js` **142–151** |
| Soft pick | hardness ≤ 1, `ore > 0` | `npc.js` **946–966** |
| Pod inherit orbit vel | `writeOrbitVel` on extract | `asteroids.js` **111–125**, **2136–2145** |
| Rock look | `applyRockSurface(mat, profile)` from `ORE_TYPES[key].rock` | `asteroids.js` **1478**; `state.js` **386–406**; `rock-surface.js` **1–12** |

Keep-out: sun heat, planet slot torii, station cylinder, gate torii (`asteroids.js` **1829–1896**). WAVE69 `sunMiss`.

---

## 8. Honor freezes (live)

| Surface | Live | Cite |
|---|---|---|
| Empty hub | 80×80 px | `hud.css` **184–193** |
| MATCH lamp CSS | `.rw-match-lamp`; hidden class | `hud.css` **222–229** |
| Digit 0 | last of `DOCK_KEY_SERVICES` = shipyard | `station.js` **188**, **6171–6173** |
| Digit 8 / 9 | launch / epics (`DOCK_KEY_SERVICES` index 7 / 8) | `station.js` **188**, **6175–6176** |
| `innerHTML` `asteroids.js` | **none** | grep 0 |
| `innerHTML` `hud.js` | **none** | grep 0 |
| New persist key | **none** proposed; `fieldOre` already listed | `save.js` **77–101** |
| `state.js` | READ-ONLY this pack | `ORE_TYPES` **386** |

---

## 9. Rejected as invented work (not a named serial)

- Second belt model / second Kepler table / n-body.
- Unbounded Oort stream.
- Galaxy-chart rock icons, mystery landmark ids, scanner-arc rocks.
- UUID asteroid ids / break `id === index`.
- New `WORLD_FIELDS` key / persist pose.
- New Digit / hub PPI / aim-glass gauge / kit mutate / invented UU / SKU.
- MATCH rewrite (Wave 70/71 already live).
- Mining Jobs MSN rewrite (Wave 71 sibling).
- PHY bounce leftover (sibling `out/w123/phyrest/**`).
- FX leftover (sibling `out/w123/fxrest/**`).
- Authored `field.kind` on six systems as leftover PR1 (band default LIVE).

---

## 10. Boot pins (cite; do not fix known FAILs)

| Pin | What |
|---|---|
| WAVE69 **14187–14296** | belt occupancy, `idEqIndex`, `notClump`, `workSector`, `fieldOre`, sun miss, cap 160, belt line, mine cue, stale lock |
| WAVE70 **14299–14383** | KeyX rock MATCH; ship MATCH; throttle not written |
| WAVE71 **14386–14543** | MATCH lamp on rock (`lampRock`); mining jobs sibling pins — not this leftover |

Do not “fix” REDMARCH `castMatches` flake from this pack.
