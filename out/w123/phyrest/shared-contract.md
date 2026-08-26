# Remaining PHY leftover after PHY-05 shared contract

**Wave:** 123. Design only. No PHY feature ships in this wave.  
**Status:** MERGE LAW for `docs/Phy06RemainingPhyDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining PHY leftover.** Live PHY-01 bounce/slide, PHY-02 Wave 58 station/gate keep-out, PHY-04 two-sample 20 u mid + frame hold (no navmesh), PHY-03 sun heat/kill, PHY-05 patrol heavy hold + persist heal already meet the owner census. PHY-04 PR3 far 80 u is **skippable**. Do **not** invent a later serial that adds a navmesh, ships 80 u as leftover, retunes sun radii, retunes the Wave 112 impact curve, adds a hub collision pip, a new Digit, or a new persist key.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`, `docs/Nav*`, `docs/Tgt*`, `docs/Rep*`, `docs/OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave123.md`. Do not steal sibling Wave 123 paths `out/w123/astrest/**`, `out/w123/fxrest/**`. Do not steal `out/w122/**`, `out/w110/**`, `out/w109/**`, `out/w108/**`, `out/w58/**`, `out/w53/**` (read ok).  
**Locked sources:** live inventory `out/w123/phyrest/current-phy-remaining-inventory.md` (code wins); wishlist Initiative PHY (read only); Phy04 / Phy05 briefs (cite only); Owner Wave 112 collision curve (cite).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist PHY-02 “not full path planning” when that sentence is read as a remaining hole.

**This leftover is remaining PHY after PHY-05.** It is **not** NAV. It is **not** TGT. It is **not** FX. It is **not** AST belts. It is **not** autopilot. It is **not** MATCH. It is **not** a navmesh. It is **not** PHY-04 PR3 80 u.

**Census:** leftover is **CONSUME**. Bounce LIVE. Avoid LIVE. Sun LIVE. Pad-home LIVE. If a later census finds PHY-01..05 **gone**, or a role still pad-homes after save, or sun lethal missing, re-open this leftover as **REAL** and name **PR1** only after that census. Do **not** ship a second path while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-PHY work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit. No collision pip, keep-out ring, or heat gauge on the aim glass. RANGE stays TGT-01 (`hud.js` **781**; `hud.css` **184–193**). **Do not** put PHY chrome inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6171–6173**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. **No new Digit.** First remaining serial (if owner re-opens after a true missing-PHY census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. This serial has **no new DOM**. Live `innerHTML` in `physics.js` / `collision.js` / `world.js` / `traffic-feel.js` / `npc.js` avoid helpers: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** PHY keys on `state.js`. **No** `SHIP_CLASSES` collision fields. **No** invented UU. **No** SKU. **No** kit mutate. PHY table lives in `src/game/physics.js` **6–23** (`Do not duplicate these keys on state.js.`).
6. Persist: **no** new `WORLD_FIELDS` key. Inventory: avoid is live steering; pad-home rewrite lives on existing `record.route` (`save.js` **77–102** already serializes `recordBanks` / `records`). **No** `world.avoid`. **No** `world.padHome`. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from a save waypoint into a hold. Assign a **new** plain `{x,y,z}` (live `healPadHome` already does this). Do not index user strings as `SYSTEMS[sysId]` without `Object.hasOwn` (live `world.js` **715**). Bag slots stay `{ kind, x, y, z, r, y0, y1, id }` (`collision.js` **50–65**). Do not persist `avoidHits`.
8. Collision response stays the safety net (PHY-01). Do **not** replace `resolveMover` / `bounceLive`. Do **not** freeze hulls.
9. Sun heat/kill stays (PHY-03). Do **not** retune `SUN_HEAT_MULT` 2.4, `SUN_LETHAL_MULT` 1.12, `SUN_HEAT_DPS`, `SUN_HEAT_RAMP`. Player bounce still **strips sun** (`ship.js` **910–915**). NPC `appendSunBody` still uses heat radius (`npc.js` **722**).
10. PHY-04 two-sample / frame hold stay. Do **not** retune `AVOID_LOOKAHEAD` 40 / `AVOID_GAIN` 1.4 as leftover. Do **not** import `planApPath` into NPC. **No navmesh. No A\*.** PHY-04 PR3 far 80 u stays **skippable** — not leftover PR1.
11. PHY-05 pad-home stays. Do **not** add a third hold helper. Do **not** rewrite pirate/ace homes. Do **not** force `holdClassFor` patrol to `'light'`.
12. Wave 112 impact curve stays linear (`IMPACT_MIN_SPEED` 8, `IMPACT_SCREEN_PER_U` 0.35, `RESTITUTION` 0.15). Do **not** retune as leftover.
13. Autopilot / MATCH / hover / NAV / TGT / FX / AST stay other workers. Do **not** steal. Player FLT has **no** lookahead (`ship.js` grep `applyAvoidBias` = 0). Player AP may keep `applyAvoidBias` after its own path (`autopilot.js` **291**). Do **not** change `skipAvoidBody` player-gate skip.
14. Power ledger out. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake; WAVE26 closed Wave 119). Missing named `WAVE109` PHY-04 `console.log` in `boot-test.mjs` is **not** a player-facing hole (`out/phy-verify/kernel-pins.mjs` already pins mid-sample).
15. Do not invent a navmesh, a new Digit, a new persist key, UU, SKU, kit mutate, aim-glass gauges, or a hub collision pip.
16. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave123.md`.
17. Fail-closed later (if owner re-opens after a **true** missing-PHY census): missing bag / `!_phyOn` → dest unchanged; missing heal helper → live dest; reserved ids drop; **never freeze the sim**.
18. Bindings do not change here.

---

## 0.1 Wave 123 deputize (owner may override after playtest)

Pick playable PHY defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent remaining PHY work if leftover is gone.** Do not invent navmesh / 80 u leftover / Digit / persist.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| Station cyl | r **32**, y −26..33 | `physics.js` **8–10** |
| Impact | min **8**, 0.35 /u, rest **0.15** | `physics.js` **11–13**; `combat.js` **1848–1849** |
| Sun | heat **2.4**, lethal **1.12**, DPS **6**, ramp **18** | `physics.js` **15–18** |
| Avoid | look **40**, gain **1.4**, mid **20** | `physics.js` **19–20**; `npc.js` **653–657** |
| Gate | bore **30**, tube **2.2** | `physics.js` **21–22** |
| Hold pad | **12** | `traffic-feel.js` **14** |
| Pad-home eps | **0.5** | `world.js` **667** |
| Patrol author | `writeStationHold(..., 'heavy', gate)` | `world.js` **381** |
| `healPadHome` roles | trader, miner, patrol | `world.js` **712** |
| Hub | 80 px empty | `hud.css` **184–193** |
| Digit 0 | shipyard | `station.js` **188** |

### Smallest additive punch

**None.** PHY-01..05 already punch via live bounce / keep-out / two-sample / sun / pad-home.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining PHY leftover |
| Fail-closed | missing bag → dest; missing heal → dest; never pause |
| Additive PR1 | **None.** Do not add navmesh, 80 u leftover, hub pip, persist key. |
| Not a leftover PR | PHY-04 PR3 80 u (skippable); AST belts; FX punch; AP; MATCH |
| Persist | existing `record.route` only; no avoid blob |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining PHY work while PHY-01..05 exist.
- First remaining serial (if owner re-opens after a true missing-PHY census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** add a navmesh, must **not** persist avoid.
- If far 80 u is still absent, that is PHY-04 PR3 skippable, not a hole.
- Wishlist “not full path planning” is **lookahead honesty**, not leftover PR1.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- `look = PHY.AVOID_LOOKAHEAD` (40)
- `mid = look * 0.5` (20)
- `far = look * 2` (80) — **not leftover**
- `holdR = PHY.STATION_CYL_RADIUS + hullRadiusFor(class) + STATION_HOLD_PAD + HOLD_OUT_EPS`
- `heatR = sunRadius * 2.4`; `killR = sunRadius * 1.12`

---

## 1. What CONSUME means

A later worker must **not** treat wishlist PHY bullets as a hole. Code has bounce, avoid, sun, pad-home. Markdown freeze records that fact.

**Wave 123 deputize:** do not invent remaining PHY work if leftover is gone.

Optional later census (named only, not PR1): re-grep `resolveMover`, `addMidChordHit`, `sunKill`, `healPadHome` patrol, `writeStationHold(..., 'heavy'`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

PHY table stays in `physics.js`. `state.js` stays without PHY keys. `record.route` stays the only persist rewrite. HUD-01 hub stays empty. Digit 0/8/9 stay. Bounce stays the net. Sun radii stay. Avoid stays two-sample. Pad-home stays trader/miner/patrol.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining PHY** | **Does not exist.** Leftover CONSUME | navmesh; 80 u leftover; bounce replace; sun retune; impact retune; hub pip; new Digit; new persist key; `innerHTML`; `state.js` write |
| **PR-census (optional skip)** | Re-grep bounce / mid sample / sunKill / patrol hold / healPadHome | New world field; boot-test WAVE109 PHY-04 log invention |

First remaining PHY serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 4. Wins vs integrator brief

If `docs/Phy06RemainingPhyDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats wishlist prose.
