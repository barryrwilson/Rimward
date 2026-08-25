# FX-01 remaining combat punch shared contract

**Wave:** 110. Design only. No combat-punch feature ships in this wave.  
**Status:** MERGE LAW for `docs/Fx01RemainingDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Phy05PadHomeDesign.md`, `docs/Phy04AvoidDesign.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave110.md`.  
**Locked sources:** wishlist FX-01 (1146–1193); live inventory `out/w110/fx01/current-fx01-inventory.md` (code wins); Wave 54 first pass; Wave 59 recoil + hull-mark pool 12; FX-02 audio first pass; FX-03 death burst.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale PROGRESS “recoil did not ship.”

**This leftover is feel / readability of fire and hits.** It is **not** PHY bounce. It is **not** NAV. It is **not** HUD-01 hub gauges. It is **not** a new SKU.

**Wave 54** muzzle, bolts, world-space ripple pool, sparks, camera shake, combat cues are **LIVE**. **Consume.** Do not retune `PROJ_RADIUS`, `SPARKS_PER_BURST`, or shake caps as the leftover (WAVE54 boot pins).

**Wave 59** recoil + `HULL_MARK_POOL === 12` are **LIVE**. **Consume.** Do **not** rewrite recoil. Do **not** grow or persist the mark pool.

**FX-02** first pass is **DONE**. Do **not** reopen music, radio, or station ambience.

**FX-03** / `world.js` wrecks, cargo, pods are **other**. Do **not** steal aftermath.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No punch pip, combo meter, impact meter, or hit-count on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `src/ui/hud.css` 184–193). **Do not** put punch chrome inside `.rw-reticle`. Facing-rail `selfHitFlashUntil` on `.rw-combat-self` (`hud.js` 846–847, 1391–1399) is **HUD-02 hair** — consume; do not move it onto the hub.
3. Digit 0 stays **shipyard** (`station.js` 188, 5938–5941, 6073–6077). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1633–1712). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Combat punch is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Canvas textures at init (`makeGlowDot` / `makeRippleRing` / `makeScorchDot`) stay engine-authored — **no user shader / GLSL / material from save**.
5. `src/game/state.js` is READ-ONLY later. **No** new `WEAPONS` ids. **No** FX keys on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Persist: **no** new `WORLD_FIELDS` key. Inventory: hull marks are **scene only** (`combat.js` park on `systemLoaded` 1105, 1735). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.hullMarks`. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from a save blob into a sprite / material. Do not index user strings as `WEAPONS[id]` beyond the live `WEAPONS[wkey] ? weapon : 'cannon'` allowlist pattern. Do not `Object.assign` a save pose onto a Three object.
8. Recoil is **LIVE** (Wave 59). Do **not** rewrite flesh kick. Do **not** write `ship.velocity`, `input.throttle`, or `flags.matchSpeed`.
9. Hull-mark pool **12** is **LIVE**. Do **not** resize. Do **not** stamp through shields. Unshielded `stampHullMark` stays.
10. Camera shake is **LIVE** (`ship.js` 121–137, 1207–1279). Do **not** land shake retune as required PR1. Caps `SHAKE_CHASE_MAX = 0.35` / `SHAKE_FIRST_MAX = 0.12` stay unless a later **optional** playtest PR says otherwise (same skip pattern as PHY-04 PR3).
11. FX-02 audio: consume live CUES. **No** music. **No** radio. **No** new station ambience. Do not retune whalesong.
12. PHY / NAV / MATCH / hover / AP / PHY-04 avoid / PHY-05 pad-home / BIO gait/cadence — **not** this brief. Do **not** steal `world.js` sibling Wave 110 writes.
13. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Phy05PadHomeDesign.md`. Do not write `docs/OwnerDecisionsWave110.md`. Deputize defaults live in **this** contract.
14. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). WAVE54 / WAVE59 FX pins **stay**. Later serial **may add** a hull-parent ripple pin. Do not invert `spawnRipple` / recoil / pool-12 greps.
15. CPU freeze: **no** new particle system. **no** per-hit `new THREE.Material`. Reuse `RIPPLE_POOL`. Parent with existing `worldHitToLocal`. Do not alloc a bag per shot.
16. Fail closed: if hull-parent helper missing / host pose non-finite / host disposed, keep **live world-space ripple** (today’s `position.copy(pos)`). Bolts, recoil, marks, muzzle, shake **still play**. **Never** freeze the sim. **Never** zero speed. **Never** throw on NaN host.
17. Reuse **`RIPPLE_POOL` / `spawnRipple` / `worldHitToLocal`**. Do **not** add a third hit-FX pool. Do **not** parent ripples through the hull-mark pool root as a hack that fights Wave 59 park.
18. Do **not** XOR-break unshielded sparks + marks. Shielded → ripple (now hull-local). Unshielded → sparks + stamp (unchanged).
19. `reducedMotion` **must** mute extra pulse / parented scale animation (keep live snap-one-frame then hide). Shake already zeros (`ship.js` 1207–1211). Do not invent a new settings checkbox.
20. Kit mutate omit. No Digit 0 shipyard steal.

---

## 0.1 Wave 110 deputize (owner may override after playtest)

Pick playable punch defaults. Inventory proves **camera shake is LIVE** and **world-space shield ripples are LIVE**. Hull-local ripple ride is **ABSENT**. Do not park. Do not invent UU / SKU / Digit. Do not invent shaders from save.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `RIPPLE_POOL` / `RIPPLE_TTL` | 16 / 0.2 s | `combat.js` 181, 201 |
| Ripple spawn | world `position.copy(pos)` | 1026–1043 |
| `spawnHitFx` XOR | shielded ripple else sparks+mark | 1045–1053 |
| `HULL_MARK_POOL` | **12** | `hull-marks.js` 7 |
| Shake caps | chase 0.35 / first 0.12 | `ship.js` 129–130 |
| Recoil | cannon/disruptor flesh | `ship.js` 1237–1263 |
| `PROJ_RADIUS` | 0.4 | `combat.js` 182 |
| `SPARKS_PER_BURST` | 11 | 196 |

Do **not** “fix” FX-01 by cranking shake, glow scale, or muzzle `base`. That reopens WAVE54/59 pins and is not the absent leftover.

### Smallest additive punch (reads as on the hull, not a HUD pip)

**Name:** hull-local **shield-hit ripple** on the struck host.

| Piece | Freeze |
|---|---|
| Fail-closed | If host / pose / `worldHitToLocal` fails, keep world-space sprite (live). Shot still hits. Never `speed = 0`. Never skip `applyHit`. |
| Additive PR1 | 1) Give ripple slots a `host` (nullable). 2) On shielded `spawnHitFx`, parent the ring to `host` at local offset via `worldHitToLocal` + small lift (same math as marks). 3) Animate scale/opacity in **local** space; sprite billboards as today. 4) Park to scene pool on `npcDestroyed` / `playerDestroyed` / `systemLoaded` / orphan parent (same reclaim as marks). 5) `reducedMotion` keeps snap-one-frame. 6) **First-person + player host:** do **not** parent a full-size ring to the living hull (muzzle already shrinks for glass — `combat.js` 998–1021). Keep world-space copy **or** the live FP muzzle-scale band. Chase/third player host may parent. NPC hosts always parent when pose is finite. |
| Not PR1 | shake retune; recoil rewrite; mark pool resize; persist marks; flash `glowTex` map; muzzle scale; `PROJ_RADIUS`; audio / music; HUD hub; Digit; `state.js`; new `WORLD_FIELDS`; third pool |
| Host | `s.object` / `playerObj` already passed to `spawnHitFx` (inventory §3) |
| Shielded XOR | **keep**: no sparks, no scorch through screen/shell |
| Unshielded | unchanged sparks + stamp |
| Persist | **none**. Scene only, like marks |
| Alloc | reuse 16 ripple sprites; no per-hit material |

Owner freeze (do not invert):

- Prefer reuse `RIPPLE_POOL` + `worldHitToLocal` over a new mesh / shader.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- If census had shown shake **and** ripples both missing, PR1 would still be hull-local ripple (cheaper). Shake is **not** missing — do not land it as required PR1.
- If parent fails, world-space ripple still plays (live). **Never stop.**

### Formulas (later impl)

```
// honor live spawnRipple TTL / reducedMotion snap; parent like stampHullMark
fpPlayer = (host === playerObj && ctx.flags.firstPerson === true)
if (fpPlayer || !host || !worldHitToLocal(wx,wy,wz, pose, local)) {
  sprite.position.copy(worldPos) // live fallback; scene parent (also FP player host)
} else {
  liftLocalOffset(local, smallLift)  // do not steal HULL_MARK_LIFT if it fights scorch
  host.add(sprite)
  sprite.position.set(local.x, local.y, local.z)
}
// reducedMotion: snap one frame then hide (live 1921–1965)
// animate: scale 2.2 + 7.2*k, opacity 1 - k*k (live) unless reduced
```

Do **not** persist ripple slots. Do **not** persist hull marks.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Required PR1 camera shake | **Forbidden** — LIVE; inventory §4, §12 |
| Rewrite recoil / add missile flesh kick | **Forbidden** — Wave 59 consume §0.8 |
| Grow `HULL_MARK_POOL` / persist marks | **Forbidden** §0.9, §0.6 |
| Stamp scorches through shields | **Forbidden** §0.18 |
| New particle system / debris mesh on each hit | **Forbidden** §0.15 |
| User shader from save | **Forbidden** §0.4 |
| `innerHTML` | **Forbidden** §0.4 |
| Punch pip / RANGE rewrite / hub child | **Forbidden** §0.2 |
| Digit / SKU / UU / `state.js` write | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` key | **Forbidden** §0.6 |
| Freeze sim until FX pool free | **Forbidden** §0.16 |
| Retune `PROJ_RADIUS` / sparks 11 / shake caps | **Forbidden** as the leftover §0.10 |
| Reopen music / radio | **Forbidden** §0.11 |
| Steal PHY / NAV / MATCH / hover / AP / pad-home | **Forbidden** §0.12 |
| Move HUD facing-flash onto `.rw-reticle` | **Forbidden** §0.2 |
| Required PR1 `spawnFlash` glow map | **No** — optional PR2 after playtest |
| Invert WAVE54/59 boot pins | **Forbidden** §0.14 |
| First-person player-host full-size parent | **Forbidden** — fills glass; world-space or FP-small |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| ripple `host` + local offset | FX-01 PR1 (`combat.js`) | tick 1944–1965, reclaim |
| `spawnRipple` / `spawnHitFx` | PR1 parent path | `testNpcHits` / `testPlayerHit` |
| `worldHitToLocal` | **none** (call only) | marks + new ripple |
| hull-mark pool | **none** | consume |
| recoil / shake | **none** | consume `ship.js` |
| `song.js` CUES | **none** | consume |
| `state.js` | **none** | `WEAPONS` / `applyHit` read |
| HUD / Digit | **none** | facing-rail consume |
| `WORLD_FIELDS` | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `worldHitToLocal` false / NaN | world-space ripple (live); never throw |
| host missing / `parent == null` | park to scene pool; world copy if still spawning |
| ripple pool busy | skip new ring; bolts still hit |
| `reducedMotion` | snap one frame; no extra pulse; sparks still gated |
| Missing helper in a partial merge | live `position.copy(pos)` path; recoil/marks/muzzle still play |
| `flags.firstPerson` and host is player hull | world-space or FP-small; **never** full-size parent on the nose |
| Docked | existing weapons-cold return (`combat.js` 1739–1742) — do not add a second freeze |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 hull-local shield ripple** | Parent `RIPPLE_POOL` to host via `worldHitToLocal`; park on destroy/load; reducedMotion snap; fail closed world-space | `state.js`; Digit; new persist key; shake retune; recoil rewrite; mark pool; HUD hub; music; `PROJ_RADIUS` |
| **PR2 flash map (optional)** | `spawnFlash` uses shared `glowTex` (no untextured square), after playtest still reads hits as cheap | Required if PR1 reads enough punch; known boot FAIL fixes |
| **PR3 census (optional skip)** | Re-grep ripple `host` after playtest; do **not** require shake | New world field; hub pip |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. PR2 is skippable (PHY-04 PR3 pattern). Do **not** land shake + ripple as required PR1.

---

## 4. Persist / proto

Ripple and marks are **not** saved. PR1 writes Three parent pointers only. Restore after `systemLoaded` already parks marks (live) — park ripples the same frame. No `for-in` on save waypoints. No `WORLD_FIELDS` growth.
