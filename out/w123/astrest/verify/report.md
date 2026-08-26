# Wave 123 remaining AST leftover — verifier report

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` `proceed_unmodeled` (`r-mt940n2x-e5042cf2`), agent `omp/agent-omp`, namespace `omp`. Did not `graph_approve` / `graph_propose`.  
**Verdict:** **CLEAN**

## 1. Write-set

`git status --short` on scoped paths:

- Worker pack: `docs/Ast03RemainingAstDesign.md` (untracked) + `out/w123/astrest/**` (untracked: inventory, contract, notes, security-review, code-review, ui-audit).
- No `src/` change. No `scripts/` change. No wishlist / `PROGRESS.md` / `docs/AstOrbitsDesign.md` / `docs/OwnerDecisions*` edit. `docs/OwnerDecisionsWave123.md` is absent.
- Sibling `out/w123/phyrest/**` and `out/w123/fxrest/**` exist as other Wave 123 leftover packs (PHY bounce / FX CONSUME). They are not this AST worker’s files. Notes in those packs name PHY/FX leftover, not AST.

## 2. Status / leftover line / serial / name

| Surface | Leftover | Named serial | Name |
|---|---|---|---|
| Brief Status row | leftover **CONSUME** | **none** | **no remaining AST leftover.** |
| Contract header **Leftover** / **Named serial** | **CONSUME** | **none** | **no remaining AST leftover.** |
| Inventory §0 | **CONSUME** | **none** | **no remaining AST leftover.** |
| Notes | **CONSUME** | **none** | **no remaining AST leftover.** |

Brief and contract leftover lines match. Serial PR1 is named as **does not exist**. Optional PR-census is grep only. No `src/` PR1 plan.

## 3. `id === array index` still cited and live

- Contract §0.8: `ctx.asteroids.list[i].id === i`. Do not invent UUIDs.
- Inventory §4: `list.push({ id: i, ...})` `asteroids.js` **1898–1906**.
- Live `src/systems/asteroids.js` **1898–1906**: `list.push({ id: i, position, radius, ore, commodity, oreKey, hardness })`.
- Live WAVE69 pin `scripts/boot-test.mjs` **14282**: `idEqIndex: listA.every((e, i) => e.id === i)`.

## 4. Inventory file:line spot-check (live)

Spot-checked against current `src/` / `scripts/`. No invented cites found.

| Claim | Live |
|---|---|
| `ORBIT_K` 1500 `asteroids.js` **73** | `const ORBIT_K = 1500` |
| `writeOrbitPose` **97–108** | phase + Kepler xyz |
| `omegaForR` **127–129** | `ORBIT_K * r ** -1.5` |
| `kindFromDef` **88–95** | allowlist else band `belt`/`sparse`/`cloud` |
| `FIELD_KINDS` **77** | `{ belt, sparse, cloud }` |
| `WORK_HALF` **75** | `0.7` |
| workFrac / workN **1650–1654** | cloud 0.50 else 0.60; `ceil(workFrac * count)` |
| cap 160 **1644** | `min(max(0, field.count), 160)` |
| annulus **1656–1659** | `beltR` / `rLo` / `rHi` |
| incAmp **1660** | cloud 0.55 else 0.12 |
| `inWork` / sectorOff **1753–1756** | `i < workN`; `WORK_HALF` |
| identity **1898–1906** | `id: i` |
| shared Vector3 **1757**, **1900** | `position` reused |
| `writeFieldOre` **1567–1590**, call **2124** | sparse bag; drop when remaining === seeded |
| overlay **1593–1639**, restore **2001–2008** | `min(seeded, trunc(v))` at **1609** |
| closed-form update **2015–2027** | mutate live `position` from `world.time` |
| tumble skip **76**, **2035–2048** | `TUMBLE_RANGE2`; `if (reduced) continue` |
| keep-out **1829–1896** | sun / planet / station / gate |
| `applyRockSurface` **1478** | live |
| `WORLD_FIELDS.fieldOre` `save.js` **99** (list **77–101**) | after hangar write-through, before `nav` |
| `RESERVED_IDS` / index regex **110–118** | live |
| `sanitizeFieldOre` **184–232** | reserved ids; cap 32/160/64 |
| omit-delete **1193–1194** | missing key deletes bag |
| `arrivalBeltLine` `jump.js` **48–58**, emit **178** | `Belt lies N u…`; `from: Echo` |
| group-3 cue `hud.js` **2200–2206** | `Mine · belt ` + n + `u` |
| `beltMineDist` **487–527** | work-sector ore>0 else any ore>0 else `field.center` |
| prompt `textContent` **2226–2227** | live |
| MATCH lamp el **356**, `matchOn` **1896** | `.rw-match-lamp`; ship **or** rock |
| `isRockLock` HUD **438–444** | list + kind |
| KeyX `controls.js` **308–309** | `pendingMatchSpeed` |
| `dropStaleRockLock` **134–140** | live |
| group-3 T-cycle **100–106** | rocks in cands |
| rock lock `ship.js` **692–696** | list + `lockKind` |
| NaN fail-closed **732–736** | `velOk` / `matchLive` |
| `rockMatch` rest-frame **851–864**, skip damping **895–897** | `_lockVel` |
| empty hub `hud.css` **184–193** | 80×80 px `.rw-reticle` |
| MATCH lamp CSS **222–229** | `.rw-match-lamp` / `.is-hidden` |
| Digit 0 `station.js` **188**, **6171–6173** | last of `DOCK_KEY_SERVICES` = `shipyard` |
| Digit 8/9 index 7/8 **188**, **6175–6176** | `launch` / `epics` via Digit handler |
| `ORE_TYPES` `state.js` **386–406** | `.rock` DATA |
| `rock-surface.js` **1–12** | Wave 52 comment |
| `collectBodies` `collision.js` **411–421** | live list xyz |
| `fieldPoint` `world.js` **142–151** | `field.center` |
| `nearestSoftRock` `npc.js` **946–966** | hardness ≤ 1, `ore > 0` |
| `innerHTML` `asteroids.js` / `hud.js` | grep 0 |
| authored `field.kind` | grep only `asteroids.js` **89** (reader); none on authored defs |
| wishlist Initiative AST **1317–1375**; status **1319–1324**; cluster prose **1325–1327** | live; pack did not edit |
| WAVE69 **14187–14296**; pins **14281–14293**; `notClump` **14284** | live |
| WAVE70 **14299–14383**; `rockArm` / `noLock` / `throttleCancel` / `shipArm` | live (`throttleUntouched` also present; not claimed as extra hole) |
| WAVE71 **14386–14543**; `lampRock` **14519–14521** | live at **14520–14521** |

## 5. Invented work check

Pack does **not** present as this wave:

- a second belt model / n-body / unbounded Oort
- a new Digit
- a new persist key / pose persist
- UUID asteroid ids
- PR1 `src/` implementation

Rejected-work lists and serial table say **PR1 does not exist**. Additive: **none**. Wave 123 deputize: do not invent remaining AST work.

## 6. Reviews (this markdown pack)

- Security: no open CRITICAL / HIGH.
- Design-doc: no open Blocker / Major. Minors accepted (stale wishlist cluster; unused authored `field.kind`).
- UI: no open Blocker / Major. Specified later UI = live group-3 cue + MATCH lamp; CONSUME adds none.

## 7. Observations (not bugs)

- Brief overview table cites Digit 0/8/9 at `station.js` **188**, **6171–6173**. **6171–6173** is Digit 0 only; Digit 8/9 go through **6175–6176**. Inventory names both. Freeze still forbids Digit steal.
- Live `beltMineDist` defaults `workFrac` 0.6 for every kind; `asteroids.js` uses 0.50 for cloud. Find-aid still works. Not a named REAL example (clump / lost identity). Pack correctly left it as not leftover PR1.
- `out/w123/phyrest/**` and `out/w123/fxrest/**` sit on disk as sibling leftover packs. This AST worker did not write them.

## 8. Processes

Verifier started none. Port 5173 has no listener. Existing user Chrome/node processes were not started here and were not killed.

## Status

**CLEAN**
