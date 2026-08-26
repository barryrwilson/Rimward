# Remaining FX leftover after named FX slices shared contract

**Wave:** 123. Design only. No remaining FX feature ships in this wave.  
**Status:** MERGE LAW for `docs/Fx02RemainingFxDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining FX leftover.** Live FX-01/02/03 first pass (Wave 54), recoil + pooled hull scorches (Wave 59), hull-local shield ripple (Wave 111), scrape punch `spawnHitFx` (Wave 114), and muzzle leftover **CONSUME** (Wave 114) already meet the owner census. Wishlist FX-01 bullets (muzzle, bolts/beams, ripples, sparks, shake, sounds, recoil, marks) are **LIVE** or **owner-omitted/skippable**. Do **not** invent a later serial that adds a hub pip, a new Digit, a new persist key, UU, SKU, kit mutate, aim-glass gauges, a hitscan combat beam, user shaders from save, or a second incoming-fire live region.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Fx01RemainingDesign.md`, `docs/Fx01RemainingScrapeDesign.md`, `docs/Fx01RemainingMuzzleDesign.md`, `docs/OwnerDecisions*`, sibling Wave 123 packs. Do not write `docs/OwnerDecisionsWave123.md`. Do not steal `out/w123/phyrest/**`, `out/w123/astrest/**` (read ok). Do not steal `out/w114/**`, `out/w111/**`, `out/w110/fx01/**`, `out/w59/**`, `out/w54/**`, `out/w122/**` (read ok).  
**Locked sources:** live inventory `out/w123/fxrest/current-fx-remaining-inventory.md` (code wins); wishlist Initiative FX (read only); Wave 111 hull-local ripple (`docs/Fx01RemainingDesign.md` — **cite, do not rewrite**); Wave 114 scrape (`docs/Fx01RemainingScrapeDesign.md` — **cite, do not rewrite**); Wave 114 muzzle CONSUME (`docs/Fx01RemainingMuzzleDesign.md` — **cite, do not rewrite**; name **no remaining FX-01 muzzle leftover**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist FX-01 bullet lists.

**This leftover is remaining FX after named FX slices.** It is **not** PHY bounce. It is **not** AST. It is **not** HUD toast. It is **not** Incoming fire. toast. It is **not** muzzle PR1. It is **not** WAVE111 `spawnRipple` parent rewrite. It is **not** scrape `spawnHitFx` steal. It is **not** IMPACT 8 / 0.35 retune. It is **not** FX-02 music/radio. It is **not** FX-01 flash map. It is **not** PHY-04 80 u.

**Census:** leftover is **CONSUME**. Named slices **LIVE**. Muzzle leftover stays **CONSUME**. If a later census finds those helpers **gone**, re-open this leftover as **REAL** and name **PR1** only after that census. Do **not** ship a second FX path while they exist. Do **not** reopen muzzle CONSUME as REAL.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-FX work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. No punch pip on `.rw-reticle`. Aim-glass gauges stay off. Kit mutate omit. RANGE stays TGT-01 (`hud.js` **781**; `hud.css` **184–193**, **207–218**). Facing-rail `selfHitFlashUntil` on `.rw-combat-self` (`hud.js` **919**, **1183–1184**, **1231–1232**, **1474–1482**) is **HUD-02 hair** — consume; do not move it onto the hub. Hull-strike toast `'▲ Hull strike.'` on `bodyHit` when `e.damage > 0` (`hud.js` **660–662**) is **LIVE scrape HUD** — consume. **Do not** add `'▲ Muzzle.'` / `'▲ FIRE.'` / `'▲ FX leftover.'`.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6035–6036**, **6172**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. **No new Digit.** First remaining serial (if owner re-opens after a true missing-FX census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Canvas textures at init (`makeGlowDot` / `makeBeamRibbon` / `makeRippleRing` / `makeScorchDot`) stay engine-authored — **no user shader / GLSL / material from save**. Combat `innerHTML` today: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** invented UU. **No** SKU. **No** kit mutate. **No** new `WEAPONS` ids.
6. Persist: **no** new `WORLD_FIELDS` key. Muzzle sprites, bolts, ripples, marks stay **scene only**. FX-03 wreck **data** already rides `aftermath` (`save.js` **77–79**). Do **not** add `world.fx`. Do **not** persist muzzle/ripple/mark sprites. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Prototype-safe later helpers: never `for-in` merge from a save blob into a sprite / material. Do not `Object.assign` a save pose onto a Three object. Copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz only (live `spawnRipple` / `stampHullMark`).
8. Recoil / mark pool **12** / hull-local ripple / scrape / muzzle CONSUME: **cite, do not steal**. Do **not** rewrite flesh kick. Do **not** resize `HULL_MARK_POOL`. Do **not** steal WAVE111 `spawnRipple` parent. Do **not** steal scrape `spawnHitFx` (`combat.js` **1858–1860**). Do **not** reopen muzzle leftover as REAL.
9. Camera shake is **LIVE** (`ship.js` **121–137**, **1203–1264**). Caps `SHAKE_CHASE_MAX = 0.35` / `SHAKE_FIRST_MAX = 0.12` stay. Do **not** land shake retune as this leftover.
10. FX-02 audio: consume live `playerFire` / `npcFire` / `playerHit` / `bodyHit` CUES (`song.js` **45–69**). **No** music. **No** radio. **No** new station ambience. FX-02 music/radio stay **closed**.
11. PHY-04 **80 u** stay skippable (`docs/Phy04AvoidDesign.md` PR3 skipped). FX-01 **flash map** (`spawnFlash` untextured square, `combat.js` **990–1001**) stay skippable. **Not** required PR1. **Not** a remaining FX leftover hole.
12. Wave 112 IMPACT knobs are **frozen copy**: `PHY.IMPACT_MIN_SPEED = 8`, `PHY.IMPACT_SCREEN_PER_U = 0.35` (`physics.js` **11–12**). `IMPACT_GAP = 0.2` (`combat.js` **163**). **Do not retune IMPACT_* as this leftover.**
13. Combat weapons stay **projectile-based** (`combat.js` **24–26**). Do **not** invent a hitscan combat beam. Mining is an industrial tool (`combat.js` **24–25**). Mining **never** calls `spawnMuzzle`.
14. Do **not** invent a hub pip, a new Digit, a new persist key, UU, SKU, kit mutate, aim-glass gauges, user shaders from save, or a second incoming-fire live region unless inventory proves a real hole. Census did **not**.
15. Incoming fire. toast is **TGT / HUD**, not this leftover. Do not add a second live region.
16. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake). WAVE54 / WAVE55 / WAVE59 FX pins **stay**. Do **not** invert them to “make remaining FX.”
17. Fail closed: busy FX pool skips the pop; keep the bolt if spawned. **Never** freeze the sim. **Never** zero speed. **Never** throw out of the fire / scrape loop.
18. `reducedMotion` **must** keep live snap-one-frame on muzzle and ripple and live spark mute. Shake already zeros (`ship.js` **1207–1211**). Do not invent a new settings checkbox.
19. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave123.md`.
20. Bindings do not change here.
21. **Wave 123 deputize:** do **not** invent remaining FX work if leftover is gone. Census proves leftover is gone. Muzzle CONSUME stays CONSUME.

---

## 0.1 Wave 123 deputize (owner may override after playtest)

Pick playable remaining-FX defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent remaining FX work if leftover is gone. Muzzle CONSUME stays CONSUME.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| `MUZZLE_POOL` / `MUZZLE_TTL` | 16 / 0.1 s | `combat.js` **185**, **205** |
| `RIPPLE_POOL` / `RIPPLE_TTL` | 16 / 0.2 s | **186**, **206** |
| `HULL_MARK_POOL` | **12** | `hull-marks.js` **7** |
| `PROJ_RADIUS` | **0.4** | `combat.js` **187** |
| `SPARKS_PER_BURST` | **11** | **201** |
| `PHY.IMPACT_MIN_SPEED` | **8** | `physics.js` **12** |
| `PHY.IMPACT_SCREEN_PER_U` | **0.35** | **11** |
| Shake caps | chase 0.35 / first 0.12 | `ship.js` **129–130** |
| Hub | 80 px empty | `hud.css` **184–193** |
| Digit 0 | shipyard | `station.js` **188** |
| WAVE111 parent | host.add + FP world-space | `combat.js` **1050–1106** |
| Scrape punch | `spawnHitFx` on damaging ram | **1858–1860** |
| Muzzle leftover | **CONSUME** | `docs/Fx01RemainingMuzzleDesign.md` |

### Smallest additive punch

**None.** Named FX slices already punch via live muzzle / bolts / lance / ripple parent / scrape `spawnHitFx` / recoil / marks / shake / song / wreck aftermath.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining FX leftover |
| Fail-closed | skip pop if pool busy; never `speed = 0`; never freeze the sim |
| Additive PR1 | **None.** Do not invent remaining FX work. |
| Muzzle leftover | stays **CONSUME**. Do not reopen as REAL. |
| Not a leftover PR | IMPACT_* retune; scrape steal; WAVE111 parent rewrite; flash map; PHY-04 80 u; hub pip; Digit; persist; `state.js` write; music/radio; hitscan beam; incoming-fire second region |
| Persist | none new. Scene FX. Existing `aftermath` for wrecks |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining FX work while named slices exist.
- Muzzle leftover CONSUME stays CONSUME.
- First remaining serial (if owner re-opens after a true missing-FX census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** steal `spawnRipple` parent, must **not** steal scrape `spawnHitFx`, must **not** retune IMPACT 8 / 0.35.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- `MUZZLE_TTL = 0.1`
- `RIPPLE_TTL = 0.2`
- `PROJ_RADIUS = 0.4`
- `HULL_MARK_POOL = 12`
- `PHY.IMPACT_MIN_SPEED = 8`
- `PHY.IMPACT_SCREEN_PER_U = 0.35`

---

## 1. What CONSUME means

A later worker must **not** treat wishlist FX-01 bullets as a remaining hole. Code has muzzle, bolts, lance, hull-local ripple, scrape punch, sparks, shake, song, recoil, marks, death burst, and wreck aftermath. Markdown freeze records that fact.

Muzzle leftover already froze **CONSUME** in Wave 114. This remaining-FX leftover does **not** reopen it.

Optional later census (named only, not PR1): re-grep `spawnMuzzle` + `spawnRipple` `host.add` + scrape `spawnHitFx` + `HULL_MARK_POOL === 12` + `stampHullMark` + `playerFire` recoil + `DEATH_BURST_SLOTS`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

Named FX helpers stay. WAVE111 parent stays. Scrape call stays. Muzzle CONSUME stays. Overlay / toast / Incoming fire. / PHY bounce / AST stay siblings. HUD-01 hub stays empty. Digit 0/8/9 stay.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining FX** | **Does not exist.** Leftover CONSUME | hub pip; Digit; persist; hitscan beam; user shaders; second incoming-fire region; IMPACT retune; scrape steal; WAVE111 parent rewrite; muzzle crank; flash map; 80 u; music/radio |
| **PR-census (optional skip)** | Re-grep named-slice live cites | New world field; hub pip; boot-log invention; muzzle REAL reopen |

First remaining FX serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`. Muzzle CONSUME is **not** PR1.

---

## 4. Wins vs integrator brief

If `docs/Fx02RemainingFxDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats wishlist prose. Muzzle leftover CONSUME beats any later “crank muzzle” REAL.
