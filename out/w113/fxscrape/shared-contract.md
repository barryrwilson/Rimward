# FX remaining scrape / collision punch shared contract

**Wave:** 113. Design only. No scrape-punch feature ships in this wave.  
**Status:** MERGE LAW for `docs/Fx01RemainingScrapeDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Phy*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave113.md`.  
**Locked sources:** live inventory `out/w113/fxscrape/current-fx-scrape-inventory.md` (code wins); Wave 111 weapon hull-local ripple (`docs/Fx01RemainingDesign.md` — **cite, do not rewrite**); Wave 54/59 FX; Wave 112 IMPACT knobs; PHY-01 bounce.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code.

**This leftover is world punch on player ram / scrape.** It is **not** PHY bounce. It is **not** IMPACT retune. It is **not** weapon-ripple rewrite. It is **not** FX-01 flash map. It is **not** PHY-04 80 u. It is **not** HUD-01 hub gauges. It is **not** a new Digit.

**Census:** leftover is **REAL**. `bodyHit` applyHit does **not** call `spawnHitFx`. If a later census shows it does, freeze **CONSUME** and do not ship a second path.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No punch pip, combo meter, impact meter, ram counter, or scrape glyph on the aim glass. RANGE stays TGT-01 (`hud.js` **726–729**, range pop **1392–1404**; `src/ui/hud.css` 184–193). **Do not** put punch chrome inside `.rw-reticle`. **Do not** reuse `rw-crosshair` (730–731) or `rw-contact-pip` (835–849) for ram. Facing-rail `selfHitFlashUntil` on `.rw-combat-self` (`hud.js` rail **863**, declare **1127–1128**, set **1167–1169**, apply **1407–1417**) is **HUD-02 hair** — consume; do not move it onto the hub. Hull-strike toast `'▲ Hull strike.'` on `bodyHit` when `e.damage > 0` (`hud.js` **608–610**) is **LIVE** — consume via `pushToast` **1130–1150** (same-key refresh 1133–1135, not a new row). Later serial **must not** add a second toast if that hull-strike toast already fires. Grep `'▲ Hull strike.'` — **do not** bind consume to 591–593 (`worldEvent` copy). **Do not** toast `playerHit` for scrape. **Do not** add `'▲ Scrape.'` / `'▲ SHIELD HIT.'`. Screen/shell-down strings (`hud.js` 563–567) already fire via `emitPlayerApplyHits` — consume.
3. Digit 0 stays **shipyard** (`station.js` 188, 6098–6102, 6145–6147, 6183–6184). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1645, 1691–1711, 6177–6179). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Scrape punch is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Canvas textures at init (`makeGlowDot` / `makeRippleRing` / `makeScorchDot`) stay engine-authored — **no user shader / GLSL / material from save**.
5. `src/game/state.js` is READ-ONLY later. **No** new `WEAPONS` ids (including **no** `WEAPONS.impact`). **No** FX keys on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Family `'impact'` already fail-closes to `{}` in `applyHit` (`state.js` 198) and to `FAMILY_COLORS.energy` in spawn helpers. **Keep that.**
6. Persist: **no** new `WORLD_FIELDS` key. Ripples and marks stay **scene only**. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.hullMarks`. **No** scrape FX blob. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from a save blob into a sprite / material. Do not index user strings as `WEAPONS[id]` beyond the live allowlist. Do not `Object.assign` a save pose onto a Three object. Copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz only (live `spawnRipple` / `stampHullMark`).
8. Recoil is **LIVE** (Wave 59). Do **not** rewrite flesh kick. Do **not** write `ship.velocity`, `input.throttle`, or `flags.matchSpeed`.
9. Hull-mark pool **12** is **LIVE**. Do **not** resize. Do **not** stamp through shields. Unshielded scrape **may** stamp via existing `spawnHitFx` XOR only. Do **not** rewrite the mark pool as the feature.
10. Camera shake is **LIVE** (`ship.js` 121–137, 1203–1279), including `bodyHit` 1223–1228. Do **not** land shake retune as this leftover. Caps `SHAKE_CHASE_MAX = 0.35` / `SHAKE_FIRST_MAX = 0.12` stay.
11. FX-02 audio: consume live `bodyHit` + `playerHit` CUES. **No** music. **No** radio. **No** new station ambience. Do **not** add a third scrape cue. Do **not** retune whalesong.
12. PHY-01 bounce / slide / `bodyHit` emit: **consume**. Home of later FX is **`combat.js` applyHit path only**. Do **not** steal `ship.js` bounce. Do **not** change collision proxies. Do **not** add contact fields to the `bodyHit` payload as a PHY rewrite. NAV / MATCH / hover / AP / PHY-04 avoid / PHY-05 pad-home / BIO gait — **not** this brief.
13. Wave 112 IMPACT knobs are **frozen copy**: `PHY.IMPACT_MIN_SPEED = 8`, `PHY.IMPACT_SCREEN_PER_U = 0.35` (`physics.js` 11–12). `IMPACT_GAP = 0.2` (`combat.js` 163). SUN_* stay (`physics.js` 15–18; `SUN_HEAT_TOAST_GAP` 2.5). **Do not retune IMPACT_* / SUN_* as this leftover.**
14. `RIPPLE_POOL = 16`, `HULL_MARK_POOL = 12` — **copy live. Do not retune as this leftover.**
15. Wave 111 `spawnRipple` parent law: **consume**. **Do not rewrite** except to **call** `spawnHitFx` / `spawnRipple` from scrape. First-person + player host already stays world-space (`combat.js` 1065–1103). Park helpers already exist (1031–1047, 1163–1177).
16. Do not edit sibling Bio/Nav/Msn/Rep/Phy/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`. Do not write `docs/OwnerDecisionsWave113.md`. Deputize defaults live in **this** contract.
17. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). WAVE54 / WAVE59 / WAVE111 FX pins **stay**.
18. CPU freeze: **no** new particle system. **no** third hit-FX pool. **no** per-hit `new THREE.Material`. Reuse `RIPPLE_POOL` / flash / sparks / mark pool via `spawnHitFx`. Do not alloc a bag per scrape.
19. Fail closed: if no host / first-person already handled by WAVE111 / missing mesh / non-finite `playerObj.position` / `spawnHitFx` throws internally, **keep today’s shake + `bodyHit` audio + HUD toast/flash**. **Skip world FX only.** **Never** freeze the sim. **Never** zero speed. **Never** skip `applyHit`. **Never** throw out of the scrape loop. Busy pool: skip new ring/flash/sparks/mark; damage still applies.
20. Kit mutate omit. Aim-glass gauges stay off. No Digit 0 shipyard steal.
21. **Do not** schedule FX-01 **flash map** or PHY-04 **80 u** as required PR1. Those Wave 112 skippable PRs stay skippable. This leftover is **not** those PRs.
22. **Do not** XOR-break `spawnHitFx`. Shielded scrape → ripple. Unshielded scrape → sparks + stamp. Same family as weapons.
23. `reducedMotion` **must** keep live snap-one-frame on ripple and live spark mute. Shake already zeros (`ship.js` 1207–1211). Do not invent a new settings checkbox. Do not add extra pulse / `@keyframes`.
24. Sun-heat / `sunKill` paths: **no** `spawnHitFx`. Not this leftover.
25. NPC bounce: **no** new `bodyHit`. Player scrape only.
26. Call site is combat’s existing damaging `bodyHit` applyHit loop (speed ≥ `IMPACT_MIN_SPEED`, gap, `kind !== 'player'`). **Do not** spawn world FX on slide-only `bodyHit` (`speed < 8`, `damage` 0).

---

## 0.1 Wave 113 deputize (owner may override after playtest)

Pick playable scrape-punch defaults. Inventory proves weapon `spawnHitFx` is LIVE and scrape `spawnHitFx` is **ABSENT**. Do not park. Do not invent UU / SKU / Digit. Do not invent shaders from save.

### Live knobs (copy; do not retune as the leftover)

| Knob | Live | Cite |
|---|---|---|
| `PHY.IMPACT_MIN_SPEED` | **8** | `physics.js` 12 |
| `PHY.IMPACT_SCREEN_PER_U` | **0.35** | `physics.js` 11 |
| `IMPACT_GAP` | 0.2 s | `combat.js` 163 |
| `BODY_HIT_EMIT_GAP` | 0.15 s | `ship.js` 101 |
| `RIPPLE_POOL` / `RIPPLE_TTL` / `RIPPLE_LIFT` | 16 / 0.2 s / 0.16 | `combat.js` 186, 206–207 |
| `HULL_MARK_POOL` | **12** | `hull-marks.js` 7 |
| SUN DPS / ramp / mults | 6 / 18 / 2.4 / 1.12 | `physics.js` 15–18 |
| `AVOID_LOOKAHEAD` | 40 | `physics.js` 19 |
| Shake caps | chase 0.35 / first 0.12 | `ship.js` 129–130 |
| `PROJ_RADIUS` / `SPARKS_PER_BURST` | 0.4 / 11 | `combat.js` 187, 201 |

### Smallest additive punch (world family, not a HUD pip)

**Name:** scrape / ram **`spawnHitFx`** on the existing combat applyHit path.

| Piece | Freeze |
|---|---|
| Fail-closed | Missing `playerObj` / missing mesh / non-finite position / helper throw → **no** `spawnHitFx`; bounce, `applyHit`, shake, `bodyHit` cue, hull-strike toast, facing flash **still play**. Never `speed = 0`. Never skip `applyHit`. |
| Additive PR1 | After live `applyHit` + `e.damage` + `playerHit` emit on the **existing** 1840–1856 loop: 1) `host = playerObj` if finite mesh. 2) `pos = playerObj.position` if `isFiniteVec3`. 3) `shielded = player.screen > 0 \|\| player.shell > 0` **before** applyHit (same as `testPlayerHit` 1793). 4) `spawnHitFx(pos, 'impact', shielded, host)`. 5) If `player.destroyed`, `parkMarksOnHost` + `parkRipplesOnHost` like 1800–1803. 6) Wrap FX in try/catch so a bad mesh cannot abort damage. |
| Not PR1 | IMPACT_* retune; SUN_* retune; new pool; hub child; Digit; persist; `state.js` write; shake rewrite; recoil rewrite; `spawnRipple` parent rewrite; flash `glowTex` map; PHY-04 80 u; navmesh; collision-proxy change; `ship.js` bounce steal; extra toast; sun FX; `FAMILY_COLORS.impact`; contact-point field on `bodyHit` |
| Host | `ctx.ship.object` already in the update (`playerObj` 1831). Pass it like weapon hits. |
| Pos | Finite `playerObj.position`. **Do not** change `ship.js` emit to carry contact as a PHY feature. Origin is the smallest combat-only additive. WAVE111 converts it to local + lift when parented. |
| Family | `'impact'` (already on applyHit / `playerHit`). Color fallback energy. **No** `state.js` write. |
| Shielded XOR | **keep** `spawnHitFx` law |
| Unshielded | sparks + stamp via XOR (pool 12 recycle) |
| Persist | **none**. Scene only |
| Alloc | reuse live pools; no per-scrape material |
| Audio / HUD | consume; no new toast; no extra `playerHit` |
| FP player host | WAVE111 world-space copy — consume |
| Slide-only | no `spawnHitFx` |

Owner freeze (do not invert):

- Prefer **one call** to live `spawnHitFx` over a new scrape FX module.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- Flash map and 80 u stay **skippable**, not required PR1.
- If FX fails, scrape still damages and still shakes. **Never stop.**

### Formulas (later impl; named only)

```
// inside existing damaging bodyHit loop, after applyHit + e.damage + playerHit emit
// honor IMPACT_MIN_SPEED / IMPACT_GAP already gating this loop
shielded = (player.screen > 0 || player.shell > 0) // sample BEFORE applyHit
host = playerObj
pos = host && host.position
if (host && pos && isFiniteVec3(pos.x, pos.y, pos.z)) {
  try { spawnHitFx(pos, 'impact', shielded, host) }
  catch { /* skip FX; never freeze */ }
  if (player.destroyed) {
    parkMarksOnHost(host)
    parkRipplesOnHost(host)
  }
}
// missing host → today's scrape (shake + audio + HUD)
// spawnRipple parent law unchanged (WAVE111)
// reducedMotion: live snap / no sparks
```

Do **not** persist ripple or mark slots.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME this leftover without census | **Forbidden** — scrape has no `spawnHitFx` |
| Required PR1 FX-01 flash map | **Forbidden** — skippable; not this leftover |
| Required PR1 PHY-04 80 u | **Forbidden** — skippable; `AVOID_LOOKAHEAD` 40 stays |
| Retune `IMPACT_MIN_SPEED` / `IMPACT_SCREEN_PER_U` | **Forbidden** — Wave 112 knobs |
| Steal `ship.js` bounce / change proxies | **Forbidden** §0.12 |
| Rewrite `spawnRipple` parent | **Forbidden** — call only §0.15 |
| Rewrite recoil / shake / mark pool | **Forbidden** §0.8–0.10 |
| Third FX pool / per-hit material | **Forbidden** §0.18 |
| User shader from save | **Forbidden** §0.4 |
| `innerHTML` | **Forbidden** §0.4 |
| Punch pip / RANGE rewrite / hub child | **Forbidden** §0.2 |
| Digit / SKU / UU / `state.js` write / `WEAPONS.impact` | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` key | **Forbidden** §0.6 |
| Freeze sim until FX pool free | **Forbidden** §0.19 |
| Duplicate hull-strike toast | **Forbidden** §0.2 |
| Extra `playerHit` / third song cue | **Forbidden** §0.11 |
| `spawnHitFx` on slide-only `bodyHit` | **Forbidden** §0.26 |
| Sun-heat world FX | **Forbidden** §0.24 |
| Reopen music / radio | **Forbidden** §0.11 |
| Move HUD facing-flash onto `.rw-reticle` | **Forbidden** §0.2 |
| Invert WAVE54/59/111 boot pins | **Forbidden** §0.17 |
| First-person player-host full-size parent | **Forbidden** — WAVE111 already fail-closes |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| scrape `spawnHitFx` call | FX scrape PR1 (`combat.js` 1b) | live XOR / WAVE111 parent |
| `spawnRipple` parent law | **none** (call only) | scrape via `spawnHitFx` |
| `ship.js` bounce / emit | **none** | consume |
| collision proxies | **none** | consume |
| IMPACT_* / SUN_* | **none** | copy live |
| hull-mark pool / recoil / shake | **none** | consume |
| `song.js` CUES | **none** | consume |
| HUD toast / facing flash | **none** | consume |
| `state.js` | **none** | `applyHit` read |
| Digit / hub / `WORLD_FIELDS` | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| No `playerObj` / no mesh / non-finite pos | skip `spawnHitFx`; keep shake+audio+HUD+damage |
| `worldHitToLocal` false / NaN (WAVE111) | world-space ring; never throw |
| First-person + player host | WAVE111 world-space; **never** full-size parent on the nose |
| Ripple / flash / spark / mark pool busy | skip that sprite; `applyHit` already ran |
| `reducedMotion` | snap one ripple frame; no sparks; shake already zero |
| `spawnHitFx` throws | catch; never abort scrape loop |
| Slide `speed < 8` | no world FX (today) |
| Docked | existing weapons-cold return — do not add a second freeze |
| Missing helper in a partial merge | skip FX; bolts / bounce / damage still play |

---

## 3. Serial PR plan (named only)

**Do not implement in Wave 113.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 scrape `spawnHitFx`** | Call live `spawnHitFx` from damaging `bodyHit` applyHit path with finite `playerObj`; park on scrape-kill; try/catch fail closed; reducedMotion via live helpers | `state.js`; Digit; new persist key; IMPACT retune; bounce steal; ripple-parent rewrite; shake/recoil/mark rewrite; HUD hub; music; flash map; 80 u; sun FX; extra toast |
| **FX-01 flash map** | **Not this serial.** Stays Wave 111 optional / skippable | Required PR1 here |
| **PHY-04 80 u** | **Not this serial.** Stays skippable | Required PR1 here |
| **PR2 census (optional skip)** | Re-grep `bodyHit` loop for `spawnHitFx`; if present, leftover CONSUME | New world field; hub pip |

First remaining serial is **PR1 scrape `spawnHitFx`**. It must not steal Digit 0/8/9. It must not write `state.js`. Flash map and 80 u are **not** required PR1.

---

## 4. Persist / proto

Ripple and marks are **not** saved. PR1 writes Three parent pointers only through live `spawnHitFx`. Restore after `systemLoaded` already parks marks and ripples (live). No `for-in` on save waypoints. No `WORLD_FIELDS` growth. No shader string from settings.
