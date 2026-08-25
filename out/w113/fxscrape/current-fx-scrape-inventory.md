# FX remaining scrape / collision punch — live inventory

**Wave:** 113. Markdown only. Code wins over wishlist / PROGRESS / Wave 110 inventory line numbers.  
**Census date:** 2026-08-24.  
**Scope:** leftover **player ram / scrape world punch** after Wave 111 hull-local **weapon** shield ripple.  
**Cite, do not rewrite:** [`docs/Fx01RemainingDesign.md`](../../docs/Fx01RemainingDesign.md) (Wave 111 PR1 parent law).  
**Not this leftover:** FX-01 flash map. PHY-04 far **80 u** sample. PHY bounce / slide / damage knobs. HUD-01 hub. Digit. Recoil rewrite. Mark-pool rewrite. `spawnRipple` parent rewrite.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| Does PHY `bodyHit` call `spawnHitFx`? | **No.** Combat applyHit path 1840–1856 has **zero** `spawnHitFx` | Leftover is **REAL** |
| Do weapon hits call `spawnHitFx`? | **Yes.** NPC 1742; player 1799 | Weapon punch **LIVE** |
| Did Wave 111 parent weapon ripples? | **Yes.** `spawnRipple(pos, family, host)` 1050–1106; `host.add` when finite | **CONSUME** parent law |
| Would CONSUME of this scrape leftover be honest? | Only if scrape already called `spawnHitFx` | **Not honest.** Do **not** freeze CONSUME |

`spawnHitFx` callers in the whole tree (`src/**/*.js`): **two** — `combat.js` 1742 and 1799. Both are bolt/seeker hull tests. **None** on `bodyHit`.

`ctx.emit('bodyHit'` exists **once**: `ship.js` 935.

---

## 1. Wishlist / prior briefs (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Wave 54 muzzle / bolts / world ripple / sparks / shake / cues | wishlist; WAVE54 pins | **LIVE.** Consume |
| Wave 59 recoil + hull-mark pool 12 | WAVE59 pins | **LIVE.** Consume. Do not rewrite |
| Wave 111 hull-local **weapon** ripple | `docs/Fx01RemainingDesign.md`; `combat.js` 101–103, 1050–1106 | **LIVE.** Consume parent + park. Do not rewrite `spawnRipple` except to **call** it |
| Wave 110 inventory: PHY scrape has no `spawnHitFx` | `docs/Fx01RemainingDesign.md` “PHY scrape `bodyHit` still has no `spawnHitFx`”; old cites 1754–1770 | **Still true.** Path moved to **1840–1856**. Still no `spawnHitFx` |
| Wave 112 collision curve | owner: `PHY.IMPACT_MIN_SPEED` **8**, `PHY.IMPACT_SCREEN_PER_U` **0.35** | **LIVE** `physics.js` 11–12. **Do not retune** as this leftover |
| FX-01 flash map | Wave 111 optional PR2 | **Skippable.** Untextured `spawnFlash` still 990–1001. **Not** required PR1 here |
| PHY-04 80 u sample | `docs/Phy04AvoidDesign.md` PR3 skipped; `AVOID_LOOKAHEAD` 40 | **Skippable.** **Not** this leftover. **Not** required PR1 |

---

## 2. PHY emit (`src/systems/ship.js`) — consume bounce

Header: bounce is ship-owned. Combat must **not** steal `root.position` / `ship.velocity` writes.

| Surface | Live | Cite |
|---|---|---|
| Scratch `_hit` | `kind`, `speed`, `px/py/pz`, `vx/vy/vz`, normals | 95–100 |
| Emit gap | `BODY_HIT_EMIT_GAP = 0.15` | 101 |
| When | undocked, not jumping, not `dockPressed` | 905–906 |
| Resolver | `collectBodies` + `resolveMover` (`skipKind` `'player'`) | 907–928 |
| On hit | write pose + velocity from `_hit`; then maybe emit | 929–936 |
| Payload | `{ kind: _hit.kind, speed: _hit.speed, damage: 0 }` | 935 |
| Damage at emit | **always 0** | 935 |
| Contact on event | **none** (no `nx` / world point on the event) | 935 |

`collision.js` `resolveMover` writes `out.kind` from the struck body (`station` / `gate` / sphere kinds) at 520, 543. Non-finite velocity never becomes a hit (clears `hit` 460–473). **Do not change collision proxies.**

NPC bounce (`npc.js` `collectBodies` 2336) does **not** emit `bodyHit`. This leftover is **player scrape only**.

---

## 3. Combat applyHit (`src/systems/combat.js` 1b) — hole

System order: station → ship → npc → **combat** → hud. Same-frame `bodyHit` is visible.

```
1840–1856  Body impact (same-frame bodyHit from ship.js; combat ticks after ship).
           Family 'impact' is not a WEAPONS key.
           Gate: player live; IMPACT_GAP 0.2 s; e.type === 'bodyHit'; e.kind !== 'player'
           speed < PHY.IMPACT_MIN_SPEED → continue (slide only; no applyHit)
           damage = speed * PHY.IMPACT_SCREEN_PER_U
           applyHit(player, { damage, family: 'impact', facet: 'fore', now })
           e.damage = damage
           emit playerHit { damage, family: 'impact', fromAft: false }
           emitPlayerApplyHits(events)
           _lastImpactAt = now; break
           // NO spawnHitFx
           // NO shielded sample
           // NO parkRipplesOnHost on scrape-kill
```

| Step | Weapon `testPlayerHit` 1785–1804 | Scrape 1840–1856 |
|---|---|---|
| Host | `playerObj` | unused for FX |
| `shielded` | `player.screen > 0 \|\| player.shell > 0` **before** applyHit | **absent** |
| `applyHit` | yes | yes (speed ≥ 8, gap, kind filter) |
| `playerHit` emit | yes (`family` from bolt; `shielded`) | yes (`family: 'impact'`; **no** `shielded`) |
| `spawnHitFx` | **yes** `(p.mesh.position, p.family, shielded, playerObj)` | **NO** |
| Park on destroy | marks + ripples 1800–1803 | only via later `playerDestroyed` reclaim if something else parked |

Sun heat 1859–1886 also `applyHit` family `'impact'` with **no** `spawnHitFx`. **Not this leftover.** Do not give the star a hull punch.

`IMPACT_GAP = 0.2` (`combat.js` 163). Separate from ship emit gap 0.15. **Do not retune.**

---

## 4. `spawnHitFx` / WAVE111 ripple parent (consume)

### 4.1 XOR — `combat.js` 1109–1117

```
spawnFlash(pos, family)
if (shielded) spawnRipple(pos, family, host)
else { spawnSparks(pos, family); stampHullMark(pos, host) }
```

Unknown `family` (including `'impact'`) tints `FAMILY_COLORS.energy` via `??` in flash / ripple / sparks (990–995, 1060, 968). **No `WEAPONS.impact`.** `applyHit` already uses `Object.hasOwn(WEAPONS, family) ? WEAPONS[family] : {}` (`state.js` 198) → 1:1 shield then hull. **Do not write `state.js`.**

### 4.2 `spawnRipple` — Wave 111 LIVE — 1050–1106

- Pool slot `host: null` at init 640.
- Finite host + not first-person player: `worldHitToLocal` + `RIPPLE_LIFT` 0.16 (207) + `host.add` + `f.host = host`.
- Else / catch: scene parent + `position.copy(pos)`; `f.host = null`.
- Busy pool: loop returns without waiting. Shot / scrape damage **must still apply**.
- `reducedMotion`: `snap` one frame at scale 5.5 (1057–1063); tick parks after one seen frame (2033–2039).

**Do not rewrite this parent law.** Later scrape PR1 **calls** `spawnHitFx` so this path runs.

### 4.3 Park — consume

`parkRipple` / `parkRipplesOnHost` / `parkAllRipples` 1031–1047. Reclaim on `npcDestroyed` / `playerDestroyed` / `systemLoaded` 1163–1177 and update `systemLoaded` 1815–1822. Weapon kills also park immediately (1743–1746, 1800–1803).

### 4.4 Marks / sparks / flash — consume

| Helper | Live | Cite |
|---|---|---|
| `stampHullMark` | host-parented; fail return | 1137–1161 |
| `HULL_MARK_POOL` | **12** | `hull-marks.js` 7 |
| `HULL_MARK_LIFT` | 0.12 | `hull-marks.js` 9 |
| `spawnSparks` | world drift; `reducedMotion` no emit | 961–988 |
| `SPARKS_PER_BURST` | 11 | 201 |
| `spawnFlash` | untextured square, world | 990–1001; pool 594–607 |
| `RIPPLE_POOL` / `RIPPLE_TTL` | **16** / 0.2 s | 186, 206 |
| `worldHitToLocal` | numeric pose copy | `hull-marks.js` 19+ |

---

## 5. Shake (`src/systems/ship.js`) — consume; next-frame

Combat emits `playerHit` **after** ship this frame. Ship reads `lastEvents` (1203–1205). Scrape shake therefore lands **next** frame. **Do not rewrite.**

| Knob | Live | Cite |
|---|---|---|
| `SHAKE_BODY_PER_SPEED` | 0.012 (slide / damage 0) | 125 |
| `SHAKE_BODY_PER_DMG` | 0.03 (after combat fills damage) | 126 |
| `SHAKE_HIT_PER_DMG` | 0.03 (`playerHit`) | 124 |
| `SHAKE_CHASE_MAX` / `SHAKE_FIRST_MAX` | **0.35** / **0.12** | 129–130 |
| `bodyHit` impulse | dmg>0 → dmg×0.03 else speed×0.012; cap chase max | 1223–1228 |
| `playerHit` impulse | also applied (scrape emits both) | 1219–1222 |
| `reducedMotion` / dock / jump | zero shake **and** recoil | 1207–1211 |
| Recoil | cannon/disruptor flesh only | 1237–1263 |

Scrape already kicks the camera. Leftover is **world FX**, not a second shake.

---

## 6. Audio (`src/systems/song.js`) — consume

| Cue | Live | Cite |
|---|---|---|
| `bodyHit` | scrape grit; comment: playerHit still carries hull punch | 60–63 |
| `playerHit` | square + triangle thud | 51–54 |
| Damaging scrape | **both** cues (ship emit + combat `playerHit`) | live |

**Do not reopen music / radio (FX-02 closed).** Later serial must **not** add a third cue or a second `playerHit` emit.

---

## 7. HUD (`src/systems/hud.js`) — consume toast + facing flash

**Re-census Wave 113 iteration 2.** Do **not** bind consume to stale 591–593 / 709–712 / 846–847 / 1149–1151. Those lines are `worldEvent` copy, injected `#hud .rw-sysname` CSS, contact-pip `lastX`/`lastY`, and `pushToast` `textContent`. Later serial greps **strings and classes**, not those old numbers.

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 `.rw-reticle`; pupil + 3 cilia + RANGE | **726–729**; `src/ui/hud.css` 184–193 |
| RANGE pop | TGT-01 `in-range` on reticle | **729**, **1392–1404** |
| Crosshair | not scrape | 730–731 |
| Contact pips | HUD-02 contacts; not scrape | 835–849 (`lastX`/`lastY` at 847 — **not** facing flash) |
| `el()` | `createElement` + `textContent` | **261–266** |
| Hull-strike toast | `bodyHit` **only if** `e.damage > 0` | **608–610** `'▲ Hull strike.'` |
| Toast write | same key refresh; no stack | `pushToast` **1130–1150** (refresh 1133–1135); `TOAST_LIFETIME` 64 |
| `playerHit` toast | **none** | `toastForEvent` has no `playerHit` case |
| Screen/shell toast | live `'✕ Screen down.'` / `'✕ Shell down.'` | **563–567** — consume; not a scrape string |
| Facing flash | `playerHit` → `selfHitFlashUntil` 0.4 s on `.rw-combat-self` | rail **863**; declare **1127–1128**; set **1167–1169**; apply **1407–1417** |
| `worldEvent` copy | **not** hull-strike | 586–593 |

Grep later: `'▲ Hull strike.'` and `.rw-reticle`. **Do not** add `'▲ Scrape.'` / `'▲ SHIELD HIT.'`. **Do not** add a hub child. `pushToast` already extends the same `cls|text` key on grind (`IMPACT_GAP` 0.2 s). That is refresh, not a second toast.

Combat mutates `e.damage` on the **same** `bodyHit` object before HUD (1840–1856). Toast already fires for damaging rams. **Do not add a punch toast.** **Do not duplicate hull-strike.**

Punch pip on `.rw-reticle`: **absent**. HUD-01 empty hub. **Keep empty.** Do not paint scrape on RANGE, crosshair, or contact pips.

---

## 8. PHY knobs (copy live; do not retune)

| Knob | Live | Cite |
|---|---|---|
| `PHY.IMPACT_SCREEN_PER_U` | **0.35** | `physics.js` 11 |
| `PHY.IMPACT_MIN_SPEED` | **8** | `physics.js` 12 |
| `PHY.RESTITUTION` / `SLIDE_FRICTION` | 0.15 / 0.85 | 13–14 |
| `PHY.SUN_HEAT_MULT` / `SUN_LETHAL_MULT` | 2.4 / 1.12 | 15–16 |
| `PHY.SUN_HEAT_DPS` / `SUN_HEAT_RAMP` | 6 / 18 | 17–18 |
| `PHY.AVOID_LOOKAHEAD` | 40 (**not** 80) | 19 |
| `IMPACT_GAP` | 0.2 s | `combat.js` 163 |
| `SUN_HEAT_TOAST_GAP` | 2.5 s | `combat.js` 164 |

Wave 112 skippable PHY-04 **80 u** stays skippable. This leftover does **not** schedule it.

---

## 9. Persist / `state.js` / Digit / settings

| Surface | Live | Cite |
|---|---|---|
| `WORLD_FIELDS` | **no** FX / hull-mark / scrape key | `save.js` 76–101 |
| Autosave | `rimward-save-v1` | `save.js` 16 |
| Settings | `rimward-settings-v1` | `settings.js` 7–8, 24 |
| `reducedMotion` default | false | `ctx.js` 217 |
| Body class | `rw-reduced-motion` | `settings.js` 72 |
| `state.js` | `WEAPONS` / `applyHit` — **no** `impact` weapon row | `state.js` 117, 197–261 |
| Digit 0 | shipyard last of `DOCK_KEY_SERVICES` | `station.js` 188, 6098–6102, 6145–6147, 6183–6184 |
| Digit 8 dock root | launch (index 7) | 188, 6104–6106 |
| Digit 9 dock root | epics / Standing (index 8) | 188, 6104–6106 |
| Outfitting Digit 8/9 | launcher / turret papers | 1644–1645, 1691–1711, 6177–6179 |
| `innerHTML` in `combat.js` | **none** | grep |
| `ctx` event | `'bodyHit' { kind, speed, damage }` | `ctx.js` 243 |

**No new persist key. No new Digit. No `state.js` write.**

---

## 10. Fail closed (live)

| Condition | Result |
|---|---|
| Slide `speed < 8` | bounce + `bodyHit` emit; **no** applyHit; **no** hull-strike toast (`damage` stays 0); speed-scaled shake |
| `IMPACT_GAP` busy | skip applyHit this scrape |
| `e.kind === 'player'` | combat skips (1846) |
| Ripple / spark / flash / mark pool busy | helper returns; combat continues |
| `stampHullMark` bad host / NaN | return |
| Docked | combat weapons-cold return 1825–1828 (**existing** station freeze) |
| Wave 111 parent fail | world-space ring; never throw (1097–1102) |
| Scrape FX today | **absent.** Shake + `bodyHit` cue + optional toast + `playerHit` thud/flash **already play** |

Later fail closed (normative in contract): missing host / first-person handled by WAVE111 / missing mesh → **skip `spawnHitFx` only**. Keep today’s shake + audio + HUD. **Never freeze. Never throw. Never zero speed. Never skip `applyHit`.**

---

## 11. Boot pins (honor; do not invert)

WAVE54 / WAVE59 / WAVE111 ripple-parent greps stay. This leftover must **not** invert `spawnRipple` / `spawnHitFx` existence, recoil, pool 12, IMPACT 8 / 0.35.

Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate) are **other**. Do not “fix” them.

FX-01 flash-map pin and PHY-04 80 u pin are **not** required here.

---

## 12. Census verdict — what remains

**Dropped from remaining (shipped; consume):**

- Wave 54 muzzle, bolts, sparks, camera shake, combat cues.
- Wave 59 recoil + hull-mark pool 12 (scene only).
- Wave 111 hull-local shield ripple **for weapon hits** (`spawnRipple` parent + park + FP world-space).
- PHY-01 bounce / slide / `bodyHit` emit / combat impact damage / hull-strike toast / `bodyHit` song cue / scrape shake.
- Wave 112 IMPACT knobs 8 / 0.35.

**Absent (this leftover is REAL):**

Player ram / scrape that already runs `applyHit` still has **no** world punch: no flash, no hull-local ripple, no sparks, no hull mark. Weapons have that family via `spawnHitFx`. PHY bounce and damage already work.

**Smallest additive later:** on the existing combat `bodyHit` applyHit path, call `spawnHitFx` with a finite `playerObj` host, family `'impact'` (energy color fallback), `shielded` sampled like `testPlayerHit`, `pos` = finite `playerObj.position`. Park on scrape-kill like weapons. Fail closed: skip FX, keep shake+audio+HUD.

**Not this leftover (do not pick as required PR1):**

- FX-01 `spawnFlash` glow map (skippable).
- PHY-04 80 u sample (skippable).
- IMPACT / SUN retune.
- New pool. Hub child. Digit. Persist. `state.js` write. Shake rewrite. Recoil rewrite. `spawnRipple` parent rewrite. Collision-proxy change. Ship.js bounce steal. Extra toast. Sun-heat FX.
