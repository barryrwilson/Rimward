# FX remaining muzzle / bolt / beam shared contract

**Wave:** 114. Design only. No fire-side FX feature ships in this wave.  
**Status:** MERGE LAW for `docs/Fx01RemainingMuzzleDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining FX-01 muzzle leftover.** Live `spawnMuzzle`, family-tinted bolt glow/streak, and the Wave 55 mining lance already meet the wishlist fire-side punch. Do **not** invent a later serial that cranks muzzle scale, `PROJ_RADIUS`, glow, or beam width.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, `docs/Fx01RemainingScrapeDesign.md`, `docs/Hud02RemainingMechSilhouettesDesign.md`, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Phy*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave114.md`. Do not steal sibling Wave 114 paths `out/w114/hud02mech/**` or `out/w114/fxscrape/**`.  
**Locked sources:** live inventory `out/w114/fxmuzzle/current-fx-muzzle-inventory.md` (code wins); Wave 111 weapon hull-local ripple (`docs/Fx01RemainingDesign.md` — **cite, do not rewrite**); Wave 114 scrape punch (`docs/Fx01RemainingScrapeDesign.md` — **cite, do not rewrite**; sibling `spawnHitFx` on `bodyHit` may already be live in `combat.js` — **do not steal that call**); Wave 54/59 FX; Wave 112 IMPACT knobs.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code.

**This leftover is fire-side muzzle / bolt / beam readability at the gun.** It is **not** scrape / ram punch. It is **not** WAVE111 `spawnRipple` parent rewrite. It is **not** IMPACT retune. It is **not** PHY bounce. It is **not** FX-01 flash map. It is **not** PHY-04 80 u. It is **not** HUD-01 hub gauges. It is **not** a new Digit. It is **not** a hub pip.

**Census:** leftover is **CONSUME**. `spawnMuzzle` is LIVE (pool 16, `makeGlowDot` map, family tint, first-person small step). Bolts are LIVE (sphere `PROJ_RADIUS` 0.4 + glow + streak). Mining lance is LIVE (ribbon + core + contact glow). WAVE54 / WAVE55 boot pins lock those surfaces. If a later census finds those helpers gone, re-open this leftover. Do **not** ship a second fire-side path while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land fire-side FX in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. No punch pip, combo meter, muzzle meter, fire glyph, or bolt counter on the aim glass. RANGE stays TGT-01 (`hud.js` **726–729**, range pop **1392–1404**; `src/ui/hud.css` 184–193). **Do not** put fire chrome inside `.rw-reticle`. **Do not** reuse `rw-crosshair` or `rw-contact-pip` for muzzle. Facing-rail `selfHitFlashUntil` on `.rw-combat-self` (`hud.js` rail **863**, declare **1127–1128**, set **1167–1169**, apply **1407–1417**) is **HUD-02 hair** — consume; do not move it onto the hub. Hull-strike toast `'▲ Hull strike.'` on `bodyHit` when `e.damage > 0` (`hud.js` **608–610**) is **LIVE scrape HUD** — consume; **not** this leftover. **Do not** add `'▲ Muzzle.'` / `'▲ FIRE.'`.
3. Digit 0 stays **shipyard** (`station.js` 188, 6098–6102, 6145–6147, 6183–6184). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1645, 6177–6179). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Muzzle is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Canvas textures at init (`makeGlowDot` / `makeBeamRibbon` / `makeRippleRing` / `makeScorchDot`) stay engine-authored — **no user shader / GLSL / material from save**. Combat `innerHTML` today: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new `WEAPONS` ids. **No** FX keys on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Family `'impact'` already fail-closes to `{}` in `applyHit` (`state.js` 198) and to `FAMILY_COLORS.energy` in spawn helpers. **Keep that.**
6. Persist: **no** new `WORLD_FIELDS` key. Muzzle sprites, bolts, ripples, and marks stay **scene only**. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.muzzleFx`. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from a save blob into a sprite / material. Do not index user strings as `WEAPONS[id]` beyond the live allowlist. Do not `Object.assign` a save pose onto a Three object. Copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz only (live `spawnRipple` / `stampHullMark`).
8. Recoil is **LIVE** (Wave 59). Do **not** rewrite flesh kick as this leftover. Do **not** write `ship.velocity`, `input.throttle`, or `flags.matchSpeed`.
9. Hull-mark pool **12** is **LIVE**. Do **not** resize. Do **not** stamp through shields. Do **not** rewrite the mark pool as fire-side FX.
10. Camera shake is **LIVE** (`ship.js` 121–137, 1203–1279), including `playerFire` punch 1237–1247. Do **not** land shake retune as this leftover. Caps `SHAKE_CHASE_MAX = 0.35` / `SHAKE_FIRST_MAX = 0.12` stay. Fire punch `SHAKE_FIRE_CANNON = 0.055` / `SHAKE_FIRE_DISRUPTOR = 0.08` stay.
11. FX-02 audio: consume live `playerFire` / `npcFire` / `playerHit` / `bodyHit` CUES (`song.js` 45–69). **No** music. **No** radio. **No** new station ambience. Do **not** add a third fire cue. Do **not** retune whalesong.
12. PHY-01 bounce / slide / `bodyHit` emit: **consume**. **Not** this leftover. Home of scrape FX is sibling Wave 114 (`docs/Fx01RemainingScrapeDesign.md`). Do **not** steal `ship.js` bounce. Do **not** steal scrape `spawnHitFx` (`combat.js` **1858–1860** as of this census). NAV / MATCH / hover / AP / PHY-04 avoid / PHY-05 pad-home / BIO gait — **not** this brief.
13. Wave 112 IMPACT knobs are **frozen copy**: `PHY.IMPACT_MIN_SPEED = 8`, `PHY.IMPACT_SCREEN_PER_U = 0.35` (`physics.js` 11–12). `IMPACT_GAP = 0.2` (`combat.js` 163). SUN_* stay (`physics.js` 15–18). **Do not retune IMPACT_* / SUN_* as this leftover.**
14. `MUZZLE_POOL = 16`, `RIPPLE_POOL = 16`, `HULL_MARK_POOL = 12`, `PROJ_RADIUS = 0.4`, `MUZZLE_TTL = 0.1`, glow scales energy **7.2** / disruptor **9.0** / missile **8.6**, chase muzzle `base` **2.4** / `grow` **3.2**, FP muzzle `base` **1.15** / `grow` **1.5**, `STREAK_LEN = 8.4` — **copy live. Do not retune as a leftover PR.** WAVE54 pins `MUZZLE_POOL` / `spawnMuzzle` / `PROJ_RADIUS = 0.4`. WAVE55 pins `makeBeamRibbon` / `map: glowTex` on mining contact / `LANCE_W0` / `LANCE_W1`.
15. Wave 111 `spawnRipple` parent law: **consume**. **Do not rewrite.** First-person + player host already stays world-space (`combat.js` 1050–1106). This leftover **must not** steal `spawnRipple` parent. Scrape **must not** steal WAVE111 parent either — sibling **calls** `spawnHitFx` only.
16. Do not edit sibling Bio/Nav/Msn/Rep/Phy/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, `docs/Fx01RemainingScrapeDesign.md`, `docs/Hud02RemainingMechSilhouettesDesign.md`. Do not write `docs/OwnerDecisionsWave114.md`. Deputize defaults live in **this** contract.
17. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). WAVE54 / WAVE55 / WAVE59 / WAVE111 FX pins **stay**. Do **not** invert them to “make muzzle stronger.”
18. CPU freeze: **no** new particle system. **no** third muzzle pool. **no** per-shot `new THREE.Material`. Reuse live `MUZZLE_POOL` / bolt glow / streak. Do not alloc a bag per shot.
19. Fail closed: if host/mesh/pos is bad, **keep today’s muzzle/bolt**. Busy muzzle pool: skip the pop; the bolt still leaves if the bolt pool had a slot. **Never** freeze the sim. **Never** zero speed. **Never** throw out of the fire loop. Dry bolt pool already drops the shot (live `spawnProjectile` null).
20. Kit mutate omit. Aim-glass gauges stay off. No Digit 0 shipyard steal.
21. **Do not** schedule FX-01 **flash map** (`spawnFlash` untextured square) or PHY-04 **80 u** as required PR1. Those stay skippable. Untextured **hit** flash is **not** fire-side muzzle. Mapping `glowTex` onto `spawnFlash` remains Wave 111 optional PR2 — skippable.
22. **Do not** XOR-break `spawnHitFx`. Shielded → ripple. Unshielded → sparks + stamp. **Do not** steal scrape `spawnHitFx` call. **Do not** add muzzle from `spawnHitFx`.
23. `reducedMotion` **must** keep live snap-one-frame on muzzle and ripple and live spark mute. Shake already zeros (`ship.js` 1207–1211). Do not invent a new settings checkbox. Do not add extra pulse / `@keyframes`.
24. Sun-heat / `sunKill` paths: **no** muzzle. Not this leftover.
25. Mining beam is an **industrial tool**, not a weapon hitscan (`combat.js` 24–25, 59–80). Mining **never** calls `spawnMuzzle` (1004). Do **not** turn mining into a combat beam leftover. Do **not** retune `LANCE_W0` / `LANCE_W1` / `beamWidth`.
26. Combat weapons stay **projectile-based** (`combat.js` 24–26). Do **not** invent a hitscan combat beam as “readable beams.” Readable weapon shots are the live bolt glow + streak. Readable industrial beam is the live mining lance.
27. **Do not** wait on sibling `out/w114/fxscrape/**` or further `combat.js` scrape edits. Census fire-side from **today’s** `spawnMuzzle` / bolt / lance. Scrape punch is a **different leftover**.

---

## 0.1 Wave 114 deputize (owner may override after playtest)

Pick playable fire-side defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent UU / SKU / Digit. Do not invent HTML from weapon id. Do not invent user shaders from save.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| `MUZZLE_POOL` / `MUZZLE_TTL` | 16 / 0.1 s | `combat.js` 185, 205 |
| Chase muzzle `base` / `grow` | 2.4 / 3.2 | 623, 1018–1019 |
| FP muzzle `base` / `grow` / step | 1.15 / 1.5 / `_dir` × 2.4 | 1018–1025 |
| `PROJ_RADIUS` | **0.4** | 187 |
| Glow scales | 7.2 / 9.0 / 8.6 | 208–210 |
| `STREAK_LEN` | 8.4 | 211 |
| `LANCE_W0` / `LANCE_W1` | 0.36 / 0.52 | 267–268 |
| `PHY.IMPACT_MIN_SPEED` | **8** | `physics.js` 12 |
| `PHY.IMPACT_SCREEN_PER_U` | **0.35** | `physics.js` 11 |
| `HULL_MARK_POOL` | **12** | `hull-marks.js` 7 |
| Shake caps | chase 0.35 / first 0.12 | `ship.js` 129–130 |

### Smallest additive punch

**None.** Fire-side already punches via live `spawnMuzzle` + bolt glow/streak + mining lance. Prefer **no new call** over a new FX module. If a later owner re-opens after playtest, prefer **one additive call or one authored texture reuse** — not a new module — and fail closed to today’s muzzle/bolt if host/mesh/pos is bad. **Never freeze the sim.**

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining FX-01 muzzle leftover |
| Fail-closed | Busy muzzle pool skips the pop; bolt still flies if spawned. Missing `_dir` in a bad merge: skip FP step, keep nose copy. Never `speed = 0`. |
| Additive PR1 | **None.** Do not crank `base`/`grow`/`PROJ_RADIUS`/`GLOW_SCALE_*`/`STREAK_LEN`/`LANCE_*`. |
| Not a leftover PR | IMPACT_* retune; scrape `spawnHitFx` steal; WAVE111 parent rewrite; flash `glowTex` map; PHY-04 80 u; hub child; Digit; persist; `state.js` write; shake/recoil/mark rewrite; music |
| Host | Live nose `_nose` from `playerMuzzleDir` / NPC nose. Mining uses its own lance. |
| Persist | **none**. Scene only |
| Alloc | reuse live pools |
| Audio / HUD | consume `playerFire`; no new toast; no hub pip |
| FP | live small muzzle + 2.4 step along `_dir` — consume |

Owner freeze (do not invert):

- Do **not** invent fire-side work while `spawnMuzzle` + bolt glow/streak + mining lance exist.
- First remaining serial (if owner re-opens) must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- Flash map and 80 u stay **skippable**.
- If muzzle pool is busy, fire still happens. **Never stop.**

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

```
// LIVE today — consume. Do not add a second spawnMuzzle path.
// firePlayerGun / tryPlayerMissile / tryPlayerTurret / spawnNpcShot / spawnNpcMissile
if (bolt) spawnMuzzle(_nose, w.family)
// mining never calls spawnMuzzle
// reducedMotion: snap one frame then hide (tick 2021–2042)
// first-person: base 1.15, grow 1.5, position += _dir * 2.4
```

Do **not** persist muzzle slots.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Invent REAL leftover despite LIVE `spawnMuzzle` | **Forbidden** — CONSUME |
| Crank muzzle `base`/`grow` / `PROJ_RADIUS` / glow | **Forbidden** — WAVE54 pins; not a remaining leftover |
| Hitscan combat beam | **Forbidden** §0.26 |
| Retune mining `LANCE_*` as combat punch | **Forbidden** §0.25 |
| Required PR1 FX-01 flash map | **Forbidden** — skippable; hit-side, not muzzle |
| Required PR1 PHY-04 80 u | **Forbidden** — skippable |
| Retune `IMPACT_MIN_SPEED` / `IMPACT_SCREEN_PER_U` | **Forbidden** — Wave 112 knobs |
| Steal scrape `spawnHitFx` (`combat.js` 1858–1860) | **Forbidden** §0.12 / §0.22 |
| Rewrite `spawnRipple` parent | **Forbidden** §0.15 |
| Rewrite recoil / shake / mark pool | **Forbidden** §0.8–0.10 |
| Third FX pool / per-shot material | **Forbidden** §0.18 |
| User shader from save | **Forbidden** §0.4 |
| `innerHTML` | **Forbidden** §0.4 |
| Punch pip / RANGE rewrite / hub child | **Forbidden** §0.2 |
| Digit / SKU / UU / `state.js` write | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` key | **Forbidden** §0.6 |
| Freeze sim until muzzle pool free | **Forbidden** §0.19 |
| Extra fire toast | **Forbidden** §0.2 |
| Reopen music / radio | **Forbidden** §0.11 |
| Move HUD facing-flash onto `.rw-reticle` | **Forbidden** §0.2 |
| Invert WAVE54/55/59/111 boot pins | **Forbidden** §0.17 |
| Wait on sibling scrape `src/` | **Forbidden** §0.27 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `spawnMuzzle` / bolt glow / mining lance | **none** (CONSUME) | fire loops |
| scrape `spawnHitFx` call | sibling scrape (not this pack) | live XOR / WAVE111 parent |
| `spawnRipple` parent law | **none** (call only) | `spawnHitFx` |
| `ship.js` bounce / recoil / shake | **none** | consume |
| IMPACT_* / SUN_* | **none** | copy live |
| hull-mark pool | **none** | consume |
| `song.js` CUES | **none** | consume |
| HUD toast / facing flash / hub | **none** | consume |
| `state.js` | **none** | `WEAPONS` / `applyHit` read |
| Digit / hub / `WORLD_FIELDS` | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| Muzzle pool busy | skip pop; bolt still flies if spawned |
| Bolt pool dry | drop shot (live); no muzzle |
| First-person | live small sprite + 2.4 step; never full-size on the glass |
| `reducedMotion` | snap one muzzle frame; no sparks; shake already zero |
| Bad pos / missing mesh | skip muzzle; never freeze |
| Mining held | lance only; no `spawnMuzzle` |
| Docked | weapons cold (live return) |
| Scrape / ripple / IMPACT | not this leftover; do not steal |

---

## 3. Serial PR plan (named only)

**Do not implement in Wave 114.** Leftover is **CONSUME**. There is **no** fire-side PR1.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 fire-side muzzle** | **Does not exist.** CONSUME | crank muzzle; new pool; hitscan beam; Digit; hub; persist; `state.js`; IMPACT; scrape steal; ripple-parent rewrite; flash map; 80 u |
| **FX-01 flash map** | **Not this serial.** Stays Wave 111 optional / skippable | Required PR1 here |
| **PHY-04 80 u** | **Not this serial.** Stays skippable | Required PR1 here |
| **PR-census (optional skip)** | Re-grep `spawnMuzzle` + `PROJ_RADIUS = 0.4` + `makeBeamRibbon`. If still present, leftover stays CONSUME | New world field; hub pip; WAVE54 invert |

First remaining **fire-side** serial is **none**. Wishlist “stronger muzzle flashes” and “readable projectiles and beams” are **LIVE**. Owner may override after playtest by **re-census**, not by shipping a crank PR from this pack.

---

## 4. Persist / proto

Muzzle sprites, bolts, ripples, and marks are **not** saved. CONSUME writes **no** Three parent pointers. Restore after `systemLoaded` already parks marks and ripples (live). No `for-in` on save waypoints. No `WORLD_FIELDS` growth. No shader string from settings.
