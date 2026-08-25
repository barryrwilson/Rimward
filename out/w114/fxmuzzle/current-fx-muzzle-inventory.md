# FX remaining muzzle / bolt / beam — live inventory

**Wave:** 114. Markdown only. Code wins over wishlist / PROGRESS / Wave 110 inventory line numbers.  
**Census date:** 2026-08-24.  
**Scope:** leftover **fire-side muzzle / bolt / beam readability at the gun** after Wave 54 first pass, Wave 59 recoil + pooled scorches, Wave 111 hull-local **weapon** shield ripple, and Wave 114 sibling scrape punch.  
**Cite, do not rewrite:** [`docs/Fx01RemainingDesign.md`](../../docs/Fx01RemainingDesign.md) (Wave 111 PR1 parent law). [`docs/Fx01RemainingScrapeDesign.md`](../../docs/Fx01RemainingScrapeDesign.md) (scrape punch; sibling may have landed `combat.js` — **do not edit**).  
**Not this leftover:** scrape / ram `spawnHitFx`. WAVE111 `spawnRipple` parent. IMPACT 8 / 0.35. PHY bounce. HUD-01 hub. Digit. Recoil rewrite. Mark-pool rewrite. Hit-side `spawnFlash` map (skippable). PHY-04 80 u.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`. Sibling scrape landed `spawnHitFx` on `bodyHit` during this census (`combat.js` 1858–1860). Fire-side cites below are **today’s** files. Do **not** wait on further sibling `src/` landing.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| Does `spawnMuzzle` exist and fire? | **Yes.** Helper 1008–1029. Callers: player gun 1233, NPC missile 1294, player missile 1327, player turret 1387, NPC bolt 1414 | Fire-side muzzle **LIVE** |
| Do bolts read as family-tinted projectiles? | **Yes.** Sphere `PROJ_RADIUS` 0.4 + `makeGlowDot` child + visual streak 426–548, 912–941 | Readable projectiles **LIVE** |
| Does a combat beam exist as leftover? | **No hitscan weapon.** Charter 24–26. Mining lance is industrial Wave 51/55 (695–759, 1419–1539) | Readable beams **LIVE** (lance). Do not invent combat hitscan |
| Did Wave 111 parent weapon ripples? | **Yes.** `spawnRipple(..., host)` 1050–1106 | **CONSUME** parent law. Not fire-side |
| Did scrape get `spawnHitFx`? | **Yes, sibling.** 1858–1860 (try/catch). Weapon callers still 1742 / 1799 | Scrape is **not** this leftover. Do not steal |
| Would a muzzle crank PR be honest leftover? | Only if muzzle/bolts/lance **absent** | **Not honest.** Freeze **CONSUME** |

`spawnMuzzle` callers in `src/**/*.js`: **five** besides the helper — all in `combat.js` (1233, 1294, 1327, 1387, 1414). Mining never calls it (1004).

Name: **no remaining FX-01 muzzle leftover.**

---

## 1. Wishlist / prior briefs (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| FX-01 first pass Wave 54 | wishlist 1207–1228; `combat.js` 89–95 | **True.** Muzzle pool, bolt glow/streak, sparks 11, `playerFire`, WAVE54 pins |
| Stronger muzzle flashes | wishlist 1232 | **LIVE.** `spawnMuzzle` 1008–1029; pool 16; `makeGlowDot` map 609–624; WAVE54 pin `MUZZLE_POOL` + `spawnMuzzle` (`scripts/boot-test.mjs` 11657) |
| Readable projectiles and beams | wishlist 1233 | **LIVE.** Glow + streak; `PROJ_RADIUS = 0.4` (WAVE54 11660). Mining lance WAVE55 (`boot-test.mjs` 11671–11680) |
| Shield ripples | wishlist 1234 | **LIVE hull-local** Wave 111. **CONSUME.** Cite `docs/Fx01RemainingDesign.md`. Not fire-side |
| Hull sparks / marks / recoil / shake / audio | wishlist 1235–1239 | **LIVE.** Consume. Not this leftover |
| Remaining hull-local ripple | `docs/Fx01RemainingDesign.md` | **Shipped Wave 111.** Do not rewrite parent |
| Remaining scrape punch | `docs/Fx01RemainingScrapeDesign.md` | **Sibling Wave 114.** Live call 1858–1860. Do not steal |
| Wave 110: muzzle/bolts not missing | `docs/Fx01RemainingDesign.md` 36, 59; old cites 1002–1023 / 182 | **Still true.** Paths moved: muzzle **1008–1029**, `PROJ_RADIUS` **187** |
| Wave 110: crank muzzle is not leftover | `docs/Fx01RemainingDesign.md` 75, 289 | **Still true.** WAVE54 pins still lock 0.4 / spawnMuzzle |
| Wave 112 collision curve | `PHY.IMPACT_MIN_SPEED` **8**, `PHY.IMPACT_SCREEN_PER_U` **0.35** | **LIVE** `physics.js` 11–12. **Do not retune** |
| FX-01 flash map | Wave 111 optional PR2 | **Skippable.** Untextured **hit** `spawnFlash` 990–1001, pool 594–607. **Not** muzzle (muzzle **has** `map: muzzleTex` 609–614) |
| PHY-04 80 u sample | `AVOID_LOOKAHEAD` 40 | **Skippable.** **Not** this leftover |

Wave 54 verify: `scripts/boot-test.mjs` 11641–11668 pins `MUZZLE_POOL` / `spawnMuzzle`, `spawnRipple` / `spawnHitFx`, `SPARKS_PER_BURST = 11`, `PROJ_RADIUS = 0.4`, song cue keys, `SHAKE_FIRST_MAX = 0.12` / `SHAKE_CHASE_MAX = 0.35`, reducedMotion + `SHAKE_DECAY`, death burst pool.

Wave 55 verify: `scripts/boot-test.mjs` 11671–11680 pins mining contact `map: glowTex`, `makeBeamRibbon`, `LANCE_W0` / `LANCE_W1`.

Wave 59 verify: `scripts/boot-test.mjs` 11818–11872 pins recoil `playerFire` cannon/disruptor, flesh `recoilZ`/`recoilY`, `HULL_MARK_POOL === 12`. **Do not invert.**

---

## 2. Combat fire-side pools (`src/systems/combat.js`)

Header 89–95 documents Wave 54 muzzle + bolt glow/streak. Header 24–26: projectile-based weapons; mining beam is industrial, not a weapon. Header 101–103: Wave 111 parented ripples.

| Pool / const | Live | Cite |
|---|---|---|
| Bolt pool | 64 | 179 |
| `MUZZLE_POOL` | **16** | 185, 609–624 |
| Flash pool (hit square) | 16 | 184, 594–607 |
| `RIPPLE_POOL` | **16** | 186, 626–641 |
| `PROJ_RADIUS` | **0.4** | 187 |
| `PLAYER_HIT_RADIUS` | 2.4 | 188 |
| `NOSE_OFFSET` | 3.0 | 189 |
| `SPARKS_PER_BURST` | **11** | 201 |
| `MUZZLE_TTL` | 0.1 s | 205 |
| Glow scales | energy 7.2, disruptor 9.0, missile 8.6 | 208–210 |
| `STREAK_LEN` | 8.4 | 211 |
| `LANCE_W0` / `LANCE_W1` | 0.36 / 0.52 | 267–268 |
| Family colors | energy / disruptor / mining / missile / psionic | 198 |
| `IMPACT_GAP` | 0.2 s | 163 |

---

## 3. Spawn helpers (load-bearing fire-side)

### 3.1 `makeGlowDot` — 343–358

Engine-authored 64 px radial canvas. Shared by projectile glows, muzzle sprites, mining contact glow. **No user texture.** **No GLSL from save.**

### 3.2 `makeBeamRibbon` — 360–381

1D edge-fade for the mining lance quad. WAVE55 pin.

### 3.3 Bolt mesh — 426–548, occupy 912–941

Shared `SphereGeometry(PROJ_RADIUS, 8, 6)`. Additive family `MeshBasicMaterial`. Child `THREE.Sprite` glow (`map: glowTex`). Child streak cylinder `STREAK_LEN` 8.4, visual-only (comment 490). `orientBolt` 953–958 aligns streak to velocity. Disruptor stretches streak 1.2 / 0.78 (937). Hit tests still use `PROJ_RADIUS` on `mesh.position` (1718, 1787).

**Readable projectiles shipped.**

### 3.4 Muzzle pool init — 609–624

`muzzleTex = glowTex`. Per-sprite additive `SpriteMaterial` with **map**. Default `base: 2.4`, `grow: 3.2`, `ttl: MUZZLE_TTL`.

### 3.5 `spawnMuzzle` — 1008–1029

Family-tinted glow-dot at `_nose`. Mining never calls this (1004). First-person: `base` 1.15 / `grow` 1.5 and `position.addScaledVector(_dir, 2.4)` so the pop does not fill the 80 px glass (1004–1007, 1018–1025). `reducedMotion`: `snap` one static frame then hide (tick 2021–2042). Busy pool: loop returns without spawn (fail closed; bolt already occupied if `if (bolt)` gated the call).

Callers (only when a shot actually leaves a pool):

| Caller | Line | Gate |
|---|---|---|
| `firePlayerGun` | 1233 | `if (bolt)` after `spawnProjectile` |
| `spawnNpcMissile` | 1294 | after occupy |
| `tryPlayerMissile` | 1327 | after spend + occupy |
| `tryPlayerTurret` | 1387 | after `spawnProjectile` |
| `spawnNpcShot` | 1414 | `if (bolt)` |

NPC bolts **already muzzle**. Dry-fire / heat-lock / mining / dropped shot: **no** muzzle (header 46–47, 94–95).

### 3.6 `spawnFlash` — 990–1001  ← **hit-side**, not muzzle

World-space sprite. **No `map`.** Color + additive only (597–602). Grows 1.5 → 4.5 over 0.18 s (2006–2018). This is **impact flash**, called from `spawnHitFx` 1111. Optional later flash-map PR2 — **skippable**. **Not** fire-side leftover. Muzzle already uses `glowTex`.

### 3.7 `spawnRipple` / `spawnHitFx` — 1050–1117  ← **hit-side**, consume

WAVE111 parents ring to host; FP player host stays world-space (1066–1103). XOR: shielded ripple else sparks + stamp (1109–1116). **Do not rewrite parent.** **Do not steal scrape call.**

Weapon NPC: 1742. Weapon player: 1799. Scrape sibling: 1858–1860 (`try { spawnHitFx(pos, 'impact', shielded, host); }`). Sun-heat path below 1873: **no** `spawnHitFx` (not this leftover).

### 3.8 Mining lance — 695–759, `updateMining` 1419–1539

Core line + tapered ribbon (`makeBeamRibbon`) + contact `makeGlowDot`. Half-widths `beamWidth * LANCE_W0` (muzzle of the lance) and `* LANCE_W1` (contact) 1512–1513. `reducedMotion` pins pulse (1532–1536). **Industrial tool.** Do not retune as FX-01 leftover.

---

## 4. Recoil / shake / song / HUD (cite only; consume)

| Surface | Today | Cite |
|---|---|---|
| Recoil cannon/disruptor | flesh +Z/+Y on `playerFire` | `ship.js` 133–137, 1237–1263 |
| Shake caps | 0.35 / 0.12; fire punch 0.055 / 0.08 | `ship.js` 129–132, 1203–1279 |
| `reducedMotion` zeros kick | dock / jump too | `ship.js` 1207–1211 |
| `playerFire` bark | LIVE | `song.js` 64–67 |
| `npcFire` / `playerHit` / `bodyHit` | LIVE | `song.js` 51–63, 68 |
| Hub 80 px + RANGE | HUD-01 empty of extra children | `hud.css` 184–193; `hud.js` **726–729**; range pop **1392–1404** |
| Facing flash | `.rw-combat-self` 0.4 s | `hud.js` **863**, **1127–1128**, **1167–1169**, **1407–1417** |
| Hull-strike toast | scrape HUD, not muzzle | `hud.js` **608–610**; `pushToast` **1130–1150** |
| Digit 0 / 8 / 9 | shipyard / launch / Standing | `station.js` 188, 6098–6106, 6177–6179 |
| Persist | no FX key in `WORLD_FIELDS` | `save.js` 76–101 |
| `reducedMotion` setting | snap FX; body class | `ctx.js` 217; `settings.js` 72 |
| IMPACT knobs | min speed **8**; **0.35** / u/s | `physics.js` 11–12 |
| Mark pool | **12** | `hull-marks.js` 7 |

---

## 5. What is **not** missing (do not invent)

- Muzzle pop at the gun: **present**.
- Family-tinted readable bolts: **present**.
- Mining lance as the only beam: **present**.
- Recoil / shake / `playerFire` audio: **present** (other leftovers).
- Shield ripple parent: **present** Wave 111 (hit-side).
- Scrape world punch: sibling call **present** at 1858–1860 (ram-side).

The wishlist still **names** stronger muzzle flashes and readable projectiles/beams as FX-01 stack items. Code shows Wave 54/55 **shipped** them. Remaining FX-01 work after Wave 54 was hull-local ripple (Wave 111) then scrape (Wave 114 sibling). **No third fire-side hole.**

---

## 6. Grep record (this census)

```
spawnMuzzle(  combat.js 1008, 1233, 1294, 1327, 1387, 1414
spawnHitFx    combat.js 1110, 1742, 1799, 1859
PROJ_RADIUS   combat.js 187
makeGlowDot   combat.js 344
makeBeamRibbon combat.js 361
innerHTML     combat.js — none
```
