# Remaining AST leftover after AST-01/02 shared contract

**Wave:** 123. Design only. No asteroid feature ships in this wave.  
**Status:** MERGE LAW for `docs/Ast03RemainingAstDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining AST leftover.** Live Wave 69 closed-form Kepler-lite belts, work sector, sparse `fieldOre` persist, arrival line + group-3 mine cue; Wave 70 MATCH on a locked rock holds in the rock rest frame; Wave 71 MATCH lamp lights on that rock lock already meet the owner census. Wishlist AST-01/AST-02 still **say** individual stellar orbits, a broad belt/cloud, mining still practical. Code wins: those jobs are live or owner-omitted. Do **not** invent a later serial that adds a second belt model, a new Digit, a new persist key, UU, SKU, kit mutate, aim-glass gauges, or a hub PPI.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AstOrbitsDesign.md`, `docs/OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave123.md`. Do not steal sibling Wave 123 paths `out/w123/phyrest/**`, `out/w123/fxrest/**`. Do not steal `out/w122/**`, `out/w71/**`, `out/w70/**`, `out/w69/**`, `out/w67/**` (read ok).  
**Locked sources:** live inventory `out/w123/astrest/current-ast-remaining-inventory.md` (code wins); wishlist Initiative AST (read only); `docs/AstOrbitsDesign.md` (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “single local cluster” / “Oort-cloud-like” prose.

**This leftover is remaining AST after named AST slices (AST-01/02 + Wave 70/71 MATCH).** It is **not** PHY bounce. It is **not** FX. It is **not** NAV. It is **not** mining jobs MSN. It is **not** a MATCH rewrite. It is **not** a second belt model.

**Census:** leftover is **CONSUME**. Closed-form Kepler-lite LIVE. Work sector LIVE. Sparse `fieldOre` LIVE. Arrival belt line LIVE. Group-3 `Mine · belt` LIVE. Rock MATCH rest-frame LIVE. MATCH lamp on rock LIVE. `id === array index` LIVE. If a later census finds those **gone** (example: rocks a single local clump with no orbit, or depletion identity lost on orbit), re-open leftover as **REAL** and name **PR1** only after that census. Do **not** ship a second belt while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-AST work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit. **No** hub PPI. **No** radar pip. **No** rock pip on the 80 px hub.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6171–6173**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. Group-3 mine cue stays. **No new Digit.** First remaining serial (if owner re-opens after a true missing-AST census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` only. Live `innerHTML` in `asteroids.js` / `hud.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** invented UU. **No** SKU. **No** kit mutate. `ORE_TYPES` stays data. Wave 52 rock look is DATA (`ORE_TYPES[key].rock`).
6. Persist: **no** new `WORLD_FIELDS` key. `fieldOre` already exists (`save.js` **99**). Do **not** persist rock pose, meshes, quaternions, or THREE. Positions stay off the blob. `world.time` stays the orbit clock.
7. Prototype-safe later helpers: `sanitizeFieldOre` reserved ids (`save.js` **110–114**, **184–232**). Sparse keys are decimal index strings. Ore keys never on the blob. `kindFromDef` uses `Object.hasOwn(FIELD_KINDS, k)`. No `for-in` merge of a raw `fieldOre` bag. Leave live `pickOreType` `for…in` until a serial owner rewrites it; do not copy the pattern.
8. Keep `ctx.asteroids.list[i].id === i`. Do **not** invent UUIDs. Do **not** break `id === array index`. Mutate the live `position` Vector3 in place.
9. Closed-form pose from `ctx.world.time`. Do **not** integrate orbital angle with `dt`. Do **not** invent a second Kepler table. `ORBIT_K = 1500` local copy stays.
10. Work sector stays the AST-02 travel tax. Do **not** scatter the field into an unbounded Oort. Count cap 160. Cloud still uses `field.radius`.
11. Find-aid stays arrival `commLine` + group-3 context cue. Do **not** reopen HUD-02 chart marks, mystery landmarks, or scanner-arc rocks as leftover.
12. MATCH rock rest-frame and MATCH lamp: **cite, do not rewrite**. This is not a MATCH leftover.
13. PHY bounce, FX, NAV, mining Jobs MSN: **sibling — do not steal**. This is not PHY. Not FX. Not NAV. Not MSN.
14. Do **not** invent remaining AST work if leftover is gone. Wave 123 deputize below.
15. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake). Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave123.md`.
16. Fail-closed later (if owner re-opens after a **true** missing-AST census): reserved ids drop; unknown `field.kind` → band default; omitted `fieldOre` deletes the live bag; NaN `world.time` heals to `0`; **never freeze the sim**.
17. Bindings do not change here.

---

## 0.1 Wave 123 deputize (owner may override after playtest)

Pick playable AST defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent a second belt model / Digit / persist key / hub PPI.

**Do not invent remaining AST work if leftover is gone.**

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| Identity | `list[i].id === i` | `asteroids.js` **1898–1906** |
| Pose | closed-form `writeOrbitPose` from `world.time` | `asteroids.js` **97–108**, **2015–2027** |
| `ORBIT_K` | 1500 | `asteroids.js` **73** |
| Kind | `belt` / `sparse` / `cloud` from band or `field.kind` | `asteroids.js` **88–95** |
| Work sector | `workFrac` 0.60 belt/sparse, 0.50 cloud; `WORK_HALF` 0.7 | `asteroids.js` **75**, **1650–1654** |
| Cap | 160 | `asteroids.js` **1644** |
| Persist | sparse `fieldOre` on `WORLD_FIELDS` | `save.js` **99**, **184–232** |
| Arrival line | `Belt lies N u sun-relative, off the station.` | `jump.js` **48–58**, **178** |
| Group-3 cue | `Mine · belt Nu` | `hud.js` **2200–2206** |
| MATCH rock | rest-frame `_lockVel` | `ship.js` **851–897** |
| MATCH lamp | `isRockLock` lights MATCH | `hud.js` **356**, **1896** |
| Hub | 80 px empty | `hud.css` **184–193** |
| Digit 0 | shipyard | `station.js` **188** |

### Smallest additive punch

**None.** Named AST slices already punch via live belts / work sector / `fieldOre` / arrival line / group-3 cue / rock MATCH / MATCH lamp.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining AST leftover |
| Fail-closed | reserved ids drop; unknown kind → band default; omitted `fieldOre` deletes bag; never pause |
| Additive PR1 | **None.** Do not add a second belt, hub PPI, Digit, persist key, MATCH rewrite. |
| Not a leftover PR | PHY bounce; FX; NAV; MSN mining jobs; MATCH rewrite |
| Persist | existing `world.fieldOre` only; no pose |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining AST work while Wave 69/70/71 surfaces exist.
- First remaining serial (if owner re-opens after a true missing-AST census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** break `id === index`, must **not** add a `WORLD_FIELDS` key.
- Chart / scanner / landmark rock marks are **owner omit**, not a hole.
- Unbounded Oort is **owner omit**, not a hole.
- Authored `field.kind` on six systems is **optional data**, not leftover PR1 (band default LIVE).
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- `omega = ORBIT_K * r ** -1.5` with `ORBIT_K = 1500`
- `phase = phase0 + omega * ctx.world.time`
- Work sector: `ceil(workFrac * count)` in `az0 ± 0.7` rad
- Overlay remaining = `min(seeded, persisted)`

---

## 1. What CONSUME means

A later worker must **not** treat wishlist “single local cluster” or “Oort-cloud-like region” as a hole. Code has Kepler-lite belts, kinds, work sector, persist, find-aid, rock MATCH, MATCH lamp. Markdown freeze records that fact.

Optional later census (named only, not PR1): re-grep `writeOrbitPose`, `fieldOre`, `Mine · belt`, `arrivalBeltLine`, `rockMatch`, MATCH lamp `isRockLock`, `list.push({ id: i`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

`ctx.asteroids.list[i].id === i` stays. `fieldOre` stays one sparse bag. `world.time` stays the orbit clock. HUD-01 hub stays empty. Digit 0/8/9 stay. Group-3 mine cue stays. Wave 51 `oreKey` / `hardness` stay. Wave 52 `ORE_TYPES[key].rock` stays DATA.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining AST** | **Does not exist.** Leftover CONSUME | second belt model; Oort; chart rock marks; new Digit; new persist key; MATCH rewrite; `innerHTML`; UUID ids |
| **PR-census (optional skip)** | Re-grep `writeOrbitPose` + `fieldOre` + `Mine · belt` + `arrivalBeltLine` + rock MATCH + MATCH lamp + `id === i` | New world field; hub pip; boot-log invention |

First remaining AST serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not break `id === index`.

---

## 4. Wins vs integrator brief

If `docs/Ast03RemainingAstDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats wishlist prose.
