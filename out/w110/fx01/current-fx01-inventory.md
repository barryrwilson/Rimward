# FX-01 remaining combat punch — live inventory

**Wave:** 110. Markdown only. Code wins over wishlist / PROGRESS comments.  
**Census date:** 2026-08-24.  
**Scope:** leftover FX-01 **feel / readability of fire and hits** after Wave 54 first pass and Wave 59 recoil + pooled hull scorches.  
**Not this leftover:** PHY bounce. NAV. HUD-01 hub gauges. New SKUs. FX-02 music / radio (first pass DONE). FX-03 lasting wrecks / cargo / pods (`world.js`). Recoil rewrite. Hull-mark pool resize.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Wishlist / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| FX-01 first pass Wave 54 | wishlist 1146–1158; PROGRESS 2810–2828 | **True.** Muzzle pool, bolt glow/streak, world-space shield ripple, sparks 11, `playerFire`, camera shake, WAVE54 boot pins |
| Recoil + pooled scorches Wave 59 | wishlist 1148, 1157–1158; PROGRESS 2827–2828 (said “did not ship” — **stale**) | **Shipped.** WAVE59 boot pins recoil + `HULL_MARK_POOL === 12` |
| Lasting wrecks / cargo / pods in `world.js` | wishlist 1149–1150, 1178–1181 | **True.** FX-03 burst is `npc.js`; aftermath is **not** this leftover |
| Weapon effects can still read weak; hits can still lack punch | wishlist 1151; owner Wave 110 | **Open leftover.** Census: punch stack is live, but **shielded hits do not ride the hull** |
| Stronger muzzle flashes | wishlist 1162 | **LIVE.** `spawnMuzzle` 1002–1023; pool 16; WAVE54 pin |
| Readable projectiles / beams | wishlist 1163 | **LIVE.** Glow + streak; `PROJ_RADIUS = 0.4`; mining lance Wave 55 |
| Shield ripples | wishlist 1164 | **Partial.** World-space ring **LIVE**. **Hull-local ride ABSENT** |
| Hull sparks / debris | wishlist 1165 | **Sparks LIVE** unshielded. Death chips are FX-03 (`npc.js` 2126+). **Consume sparks** |
| Restrained camera shake | wishlist 1166 | **LIVE.** `ship.js` 121–137, 1207–1279. WAVE54 pin. **Consume. Not PR1** |
| Weapon / impact audio | wishlist 1167; FX-02 1171–1176 | **LIVE.** `song.js` CUES. **Do not reopen music / radio** |
| Visible recoil | wishlist 1168 | **LIVE Wave 59.** Cannon / disruptor flesh kick. **Consume. Do not rewrite** |
| Persistent damage marks | wishlist 1169 | **LIVE pool 12.** Scene only. **Consume. Do not resize** |

Wave 54 verify: `scripts/boot-test.mjs` 11641–11668 pins `MUZZLE_POOL` / `spawnMuzzle`, `spawnRipple` / `spawnHitFx`, `SPARKS_PER_BURST = 11`, `PROJ_RADIUS = 0.4`, song cue keys, `SHAKE_FIRST_MAX = 0.12` / `SHAKE_CHASE_MAX = 0.35`, reducedMotion + `SHAKE_DECAY`, death burst pool.

Wave 59 verify: `scripts/boot-test.mjs` 11818–11872 pins recoil `playerFire` cannon/disruptor, flesh `recoilZ`/`recoilY`, `HULL_MARK_POOL === 12`, `stampHullMark` on unshielded + `parkMarksOnHost` on `npcDestroyed`. **Do not invert these pins.**

---

## 1. Combat FX pools (`src/systems/combat.js`)

Header 89–99 documents Wave 54 FX-01 and Wave 59 FX-DECALS.

| Pool / const | Live | Cite |
|---|---|---|
| Bolt pool | 64 | 174 |
| Flash pool | 16 | 179, 588–601 |
| `MUZZLE_POOL` | **16** | 180, 603–618 |
| `RIPPLE_POOL` | **16** | 181, 620–635 |
| Spark bursts | 16 (same as FLASH_POOL) | 637–658 |
| Hull marks | **12** via `HULL_MARK_POOL` | `hull-marks.js` 7; combat 660–687 |
| `PROJ_RADIUS` | **0.4** | 182 |
| `PLAYER_HIT_RADIUS` | 2.4 | 183 |
| `SPARKS_PER_BURST` | **11** | 196 |
| `SPARK_TTL` / speed / size | 0.48 s / 24 u/s / 0.85 | 197–199 |
| `MUZZLE_TTL` | 0.1 s | 200 |
| `RIPPLE_TTL` | 0.2 s | 201 |
| Glow scales | energy 7.2, disruptor 9.0, missile 8.6 | 202–204 |
| `STREAK_LEN` | 8.4 | 205 |
| Family colors | energy / disruptor / mining / missile / psionic | 193 |

Bolts: sphere `PROJ_RADIUS` + child glow sprite + visual-only streak (`combat.js` 419–548). Hit tests ignore streak. **Readable projectiles shipped.**

Mining lance is Wave 55 industrial tool (`combat.js` 59–80, 689+). **Not** a combat punch leftover. Do not retune `beamWidth`.

---

## 2. Spawn helpers (load-bearing)

### 2.1 `spawnMuzzle` — 1002–1023

Family-tinted glow-dot at nose. Mining never calls it. First-person steps the sprite along `_dir` (2.4) and uses smaller `base`/`grow` so it does not fill the 80 px glass. `reducedMotion`: `snap` one static frame then hide (tick 1921–1943).

Callers: `firePlayerGun` 1154, `spawnNpcMissile` 1215, `tryPlayerMissile` 1248, `tryPlayerTurret` 1308, `spawnNpcShot` 1335. **NPC bolts already muzzle.** Consume. Do not retune scales as the leftover. First-person muzzle already steps off the nose and stays small (998–1021) — later hull-local ripple **must not** undo that glass law on the player host.

### 2.2 `spawnFlash` — 984–996

World-space sprite. **No `map`.** Material is color + additive only (588–596). Grows 1.5 → 4.5 over 0.18 s (1906–1919). Mining contact glow **forbids** untextured squares (76–77); weapon flashes **still are squares**. Optional later PR2 — **not** PR1.

### 2.3 `spawnRipple` — 1026–1043  ← leftover hole

Expanding ring via `makeRippleRing` (396–414). `scene.add(sprite)` at init (631–633). `sprite.position.copy(pos)` **world space**. **No `host`.** **No `worldHitToLocal`.** **Does not ride the struck hull.**

`reducedMotion`: snap one frame at scale 5.5, then hide (1027–1038, 1944–1965). Animate path: scale 2.2 + 7.2·k, opacity `1 - k²` (1962–1964).

### 2.4 `spawnSparks` — 954–982

Animated Points burst. **Returns immediately if `ctx.settings.reducedMotion`** (956). Unshielded ship hits only (via `spawnHitFx`). World-space drift, not parented. Tick hides live bursts under reducedMotion (1967–1988).

### 2.5 `spawnHitFx` — 1045–1053  ← XOR

```
spawnFlash(pos, family)
if (shielded) spawnRipple(pos, family)
else spawnSparks + stampHullMark
```

`shielded` = `screen > 0 || shell > 0` (NPC 1647; player 1711). **Shielded hits never spark and never stamp.** Marks-through-shields is **not** this leftover (Wave 59 law: scorches when shields already down).

### 2.6 Hull marks — consume Wave 59

`stampHullMark` 1073–1097: `worldHitToLocal` + `liftLocalOffset` + `host.add(sprite)`. Fail closed: missing host / non-finite → **return** (1074–1086). Slot via `nextMarkSlot`. Park on `npcDestroyed` / `playerDestroyed` / `systemLoaded` / orphan parent (1099–1118). Kill shot parks so wrecks stay clean (1664, 1718). **Scene only. No save field.**

`hull-marks.js`: `HULL_MARK_POOL = 12`, `HULL_MARK_SIZE = 0.62`, `HULL_MARK_LIFT = 0.12`. No renderer import.

---

## 3. Hit emit sites

| Path | FX | Cite |
|---|---|---|
| NPC hull (`testNpcHits`) | `spawnHitFx(..., shielded, s.object)` | 1647–1664 |
| Player hull (`testPlayerHit`) | emit `playerHit` + `spawnHitFx(..., playerObj)` | 1703–1718 |
| PHY scrape (`bodyHit`) | damage + emit `playerHit`; **no** `spawnHitFx` | 1754–1770 |
| Mining contact | lance glow / chips — Wave 55 | 1490+ |

Comment at 1714: “HUD owns all pixels (incl. subtle screen-edge flash on shield hits) — emit only.” Live HUD flash is **facing-rail** `selfHitFlashUntil` (`hud.js` 1109–1151, 1391–1399) on `.rw-combat-self`, **not** the 80 px hub.

---

## 4. Recoil + camera shake (`src/systems/ship.js`) — consume

Header 64–67. Constants 121–137:

| Knob | Live |
|---|---|
| `SHAKE_DECAY` / `RECOIL_DECAY` | 12 /s (~0.2 s) |
| `SHAKE_HIT_PER_DMG` | 0.03 (cannon 8 → 0.24 u) |
| `SHAKE_CHASE_MAX` | **0.35** |
| `SHAKE_FIRST_MAX` | **0.12** |
| `SHAKE_FIRE_CANNON` / `DISRUPTOR` | 0.055 / 0.08 |
| `RECOIL_CANNON_Z/Y` | 0.16 / 0.07 |
| `RECOIL_DISRUPTOR_Z/Y` | 0.22 / 0.1 |

Apply 1203–1279: `lastEvents` only. `reducedMotion \|\| docked \|\| ctx.gate.jumping` → **zero** shake and recoil (1207–1211). Recoil is flesh-child local +Z/+Y. **Never** writes `ship.velocity`, `input.throttle`, or `flags.matchSpeed` (68–69; WAVE59 `noThrottle`). Recoil fire impulse only if `weapon === 'cannon' \|\| 'disruptor'` (1237–1247). Missile / turret / psionic: **no flesh kick** (consume; do not extend as this leftover).

**Camera kick on player hull damage is LIVE.** Do **not** name shake as the remaining leftover. Do **not** land shake as required PR1.

---

## 5. Audio (`src/systems/song.js`) — consume FX-02

CUES 45–121. Combat-relevant:

| Type | Live |
|---|---|
| `playerHit` | square + triangle hull thud (51–54) |
| `npcHit` | light metallic tick (55) |
| `playerFire` | gun bark (64–67) |
| `npcFire` / `npcFireMissile` | thinner / dart sting (68–69) |
| `shieldDown` | hollow break (47–50) |
| `npcDestroyed` | short crump (56–59) |
| `bodyHit` | PHY scrape (60–63) |
| `engineOut` / `sunHeat` | warning / hiss |

Volley cap ~8 on `npcFire` / `npcHit` (142–144, 440–448). Mute / `masterVolume` live (462–464). Combat bed while `flags.combat` (466–471). **Do not reopen music, radio, station ambience as this leftover.** Do not retune whalesong.

---

## 6. Death burst (FX-03 — consume, not punch leftover)

`npc.js` `DEATH_BURST_SLOTS = 3` (104), `makeDeathBurstPool` 2126–2172, `emitDeathBurst` 2194+. `reducedMotion` snaps flash, `chipSize: 0` (`deathBurstScale` 2175–2191). Lasting salvage / cargo / pods stay `world.js`. **Do not steal FX-03.**

---

## 7. Persist / `state.js` / settings

| Surface | Live | Cite |
|---|---|---|
| `WORLD_FIELDS` | no hull-mark / FX key | `save.js` 76–101 |
| Hull marks on disk | **none** (park on `systemLoaded`) | combat 1105, 1735 |
| Autosave | `rimward-save-v1` | `save.js` 16 |
| `state.js` | READ-ONLY this leftover; `WEAPONS` / `ORE_TYPES.sparkColor` already exist | honor |
| Settings key | `rimward-settings-v1` (not WORLD_FIELDS) | `settings.js` 7–8, 24 |
| `ctx.settings.reducedMotion` | default false | `ctx.js` 214–217 |
| Body class | `rw-reduced-motion` | `settings.js` 72 |
| Colorblind / contrast | `rw-colorblind` / `rw-contrast` | 70–71 |

**No new persist key.** Marks already persist **in scene only**. Confirm.

---

## 8. HUD / Digit (freeze)

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 `.rw-reticle`; pupil + 3 cilia + RANGE | `hud.js` 709–712; `src/ui/hud.css` 184–193 |
| `el()` | `createElement` + `textContent` | `hud.js` 244–249 |
| Hit flash | `.rw-combat-self` facing rail, 0.4 s | `hud.js` 846–847, 1109–1151, 1391–1399 |
| Hull-strike toast | `bodyHit` only if `damage > 0` | `hud.js` 591–593 |
| Digit 0 | shipyard (last of `DOCK_KEY_SERVICES`) | `station.js` 188, 5938–5941, 6073–6077 |
| Digit 8 dock root | launch (index 7) | 188, 5938, 1633–1634 |
| Digit 9 dock root | epics / Standing (index 8) | 188, 5938, 1633–1634 |
| Outfitting Digit 8/9 | launcher / turret papers | 1633–1712 |
| Punch pip on `.rw-reticle` | **absent** | — |

HUD-01 empty 80 px hub. **No impact meter on the glass.** Facing-rail flash is HUD-02 hair, not a hub child.

---

## 9. `reducedMotion` honor (combat / ship)

| Path | Behavior | Cite |
|---|---|---|
| Muzzle / ripple | one snap frame, then hide | combat 1003–1038, 1921–1965 |
| Sparks | no emit; hide live | 956, 1967–1983 |
| Mining particles | no emit; expire hidden | 79–80, 1994–1996 |
| Seekers / bolts | **still simulate** (combat, not decoration) | 1901–1902 |
| Shake / recoil | zero | ship 1207–1211 |
| HUD family ticks | no emit | hud 1088 |
| Death burst | static flash, no chips | npc 2182–2185 |

Leftover must **mute shake / extra pulse** under `ctx.settings.reducedMotion`. Existing `body.rw-*` stay.

---

## 10. Fail closed (live)

| Condition | Result |
|---|---|
| Bolt pool dry | shot dropped; no alloc (`spawnProjectile` 937) |
| Muzzle / ripple / spark pool busy | helper returns; shot still live |
| `stampHullMark` bad host / NaN | return; combat continues |
| Docked | weapons cold (`combat.js` 1739–1742) — **existing station freeze**, not this leftover |
| Missing FX helper (later) | bolts / recoil / marks **must still play**. **Never** freeze sim. **Never** `speed = 0` |

Combat does not write player speed. Ship recoil does not write throttle.

---

## 11. Boot pins (honor; do not invert)

| Pin | File | Meaning |
|---|---|---|
| WAVE54 FX | `boot-test.mjs` 11654–11665 | muzzle, ripple, sparks 11, proj 0.4, cues, shake caps, death pool |
| WAVE59 FX | `boot-test.mjs` 11857–11864 | recoil cannon/disruptor, flesh, pool 12, unshielded stamp, park on destroy |
| WAVE55 lance | 11671–11686 | mining — **not** this leftover |

Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate) are **other**. Do not “fix” them.

---

## 12. Census verdict — what remains

**Dropped from remaining (shipped; consume):**

- Stronger muzzle flashes (Wave 54).
- Readable projectiles + mining lance (Wave 54/55).
- World-space shield ring pool (Wave 54 `spawnRipple`).
- Hull sparks on unshielded hits (Wave 54).
- Restrained camera shake (Wave 54 `ship.js`).
- Weapon / impact audio (FX-02 Wave 54).
- Visible recoil (Wave 59).
- Persistent hull marks pool 12 (Wave 59, scene only).
- Death burst / wreck aftermath (FX-03 / `world.js`).

**Absent punch (this leftover):**

Shielded-hit language does **not** parent to the struck hull. `spawnRipple` copies a world point onto a scene sprite. A moving target leaves the ring in empty space. Unshielded hits already ride via `stampHullMark`. Camera shake already punches the player view. The smallest additive remainder is **hull-local shield ripple** (reuse `RIPPLE_POOL` + existing `worldHitToLocal`).

**Not absent (do not pick as PR1):** camera shake. Recoil. Mark pool. Muzzle. Bolt glow. Audio. HUD hub child.

**Optional after playtest (not required PR1):** map `glowTex` on `spawnFlash` so weapon hits are not untextured squares (Wave 55 mining already did this for the lance).
