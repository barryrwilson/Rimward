# EXP remaining Unknowables dock / Archive two-way shared contract

**Wave:** 121. Design only. No Unknowables dock or Archive feature ships in this wave.  
**Status:** MERGE LAW for `docs/Exp04RemainingDockDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining Unknowables dock / Archive two-way leftover.** Live authored `veil` / station **The Quiet** / dedicated `buildUnknowablesStation` / Archive own crystal **400** / rival cube **900** already meet Wave 94 un-wait and wishlist EXP-02 two-way at Unknowables. Do **not** invent a later serial that adds a second dock, a `DETAIL_STATIONS.unknowables` hull, a generated SYSTEM, a new Digit, a new persist key, or invented UU.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/UnknowablesDockDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/OwnerDecisions*.md`, `docs/Nav07ChartLabelDesign.md`, Nav/Hud/Ctl leftover docs, Bio/Msn/Rep/Phy/Shp/Tgt docs. Do not write `docs/OwnerDecisionsWave121.md`. Do not steal sibling Wave 121 paths `out/w121/chartlabel/**`, `out/w121/hudrest/**`, `out/w120/**`, `out/w92/unk/**` (read ok).  
**Locked sources:** live inventory `out/w121/expdock/current-exp-dock-inventory.md` (code wins); wishlist Initiative EXP / EXP-02 (read only); Wave 82/93/94 owner files (cite; Wave 94 §5 un-wait binds); Wave 92 presence brief (cite); EXP brief (cite).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “Unknowables dock still waits.”

**This leftover is Unknowables origin dock + Archive two-way desk remaining.** It is **not** HUD. It is **not** NAV chart-label. It is **not** toast. It is **not** overlay mutex. It is **not** a second Unknowables dock. It is **not** `DETAIL_STATIONS` lockstep unless a later **named** serial needs a station module — prefer CONSUME because The Quiet already docks.

**Census:** leftover is **CONSUME**. Origin dock LIVE. Archive 400/900 LIVE. EXP-02 two-way LIVE at Unknowables. If a later census finds `veil` / The Quiet / Unknowables Archive **gone**, re-open this leftover as **REAL** and name **PR1** only after that census. Do **not** ship a second path while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land Unknowables dock or Archive work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6035–6036**, **6172**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. Archive stays on **Market** pane (`renderArchiveDesk` **4784**). **No new Digit.** First remaining serial (if owner re-opens after a true missing-dock census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` / `h()` only. Live `innerHTML` in `station.js` / `stations/unknowables.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** invented UU. **No** third data SKU. Tokens stay `dataCrystal` / `dataCube`. Copy Wave 82 integers only: drop **0.20**, own **400**, rival **900**, launder **250**.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. `ui.dataPending` / `ui.dataBusy` stay session dock UI. Data cargo stays hangar rows via `sanitizeDataCargoRow`.
7. Prototype-safe later helpers: `reservedId` + `Object.hasOwn(FACTIONS, …)` (`data-trade.js` **28–32**, **60–65**). `archiveDeskAllowed('__proto__')` stays false. No `for-in` merge of a raw desk blob. Do **not** persist desk pending as a world field.
8. Do **not** put `unknowables` in `DETAIL_STATIONS` (D3). Dedicated `buildUnknowablesStation` / `stations/unknowables.js` stays the hull. Placeholder is forbidden as an origin desk. Do **not** reverse Wave 42 D3 unless a later census proves it **already** reversed — census shows it is **not**.
9. Do **not** invent UU, a new Digit, a station builder for a **second** Unknowables dock, or a generated SYSTEM. Generator cluster stays **off**. Authored `veil` only.
10. Do **not** confuse hush landmark `th_veil` with system `veil`. Presence may stay. Dock is The Quiet at `veil`.
11. EXP-02 two-way at Unknowables is **LIVE**. Assembly Archive stays cube 400 / crystal 900. Unknowables Archive stays crystal 400 / cube 900. Hostile `standingRead(dockFaction) < 0` → `No sale.` Captured own-origin lots refuse at origin.
12. `archiveFilePrice` remaining Assembly-only is **not** a player-facing hole. Live Unknowables prices are `archivePriceAtDesk`. Do **not** schedule a `data-trade.js` mirror as leftover PR1.
13. Epic omit. New hush clue **no** (authored count stays 6). Contacts stay one `dockmaster` on `veil`.
14. Chart-label sibling owns later `galaxychart.js` a11y. This pack cites `veil` in `AUTHORED_IDS` only. Do **not** steal `out/w121/chartlabel/**`.
15. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave121.md`.
16. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
17. Fail-closed later (if owner re-opens after a **true** missing-dock census): missing builder → `archiveDeskAllowed` false; hostile → no sale; reserved ids → no row; short credits / full hold refuse. **Never** freeze the sim.
18. Bindings do not change here.

---

## 0.1 Wave 121 deputize (owner may override after playtest)

Pick playable dock defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent UU / SKU / Digit / SYSTEM.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| System id | `veil` | `authored-systems.js` **234–235** |
| Station | The Quiet | **243** |
| Faction | `unknowables` | **237**; `state.js` **605** |
| Builder | `assembleUnknowablesStation` | `stations/unknowables.js` **13–15**; `station.js` **308–321** |
| `DETAIL_STATIONS.unknowables` | absent | `station.js` **567–578** |
| Own UU | crystal **400** | `ARCHIVE_OWN_UU`; `archivePriceAtDesk` **1232–1235** |
| Rival UU | cube **900** | `ARCHIVE_RIVAL_UU`; **1237–1238** |
| Hostile | `standingRead(unknowables) < 0` | **1216–1218** |
| Desk host | Market pane | **1419–1420**, **4784** |
| Digit 0 | shipyard | **188** |
| Drop | **0.20** | `data-trade.js` **19** |
| Persist desk | **none** | `ui.dataPending` session |

### Smallest additive punch

**None.** Origin dock + two-way Archive already punch via live `veil` / The Quiet / `renderArchiveDesk`.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining Unknowables dock / Archive two-way leftover |
| Fail-closed | no builder → no desk; hostile → No sale; reserved id → drop row |
| Additive PR1 | **None.** Do not add a second dock. Do not add `DETAIL_STATIONS.unknowables`. |
| Not a leftover PR | chart-label; HUD; toast; overlay; invented UU; generated SYSTEM |
| Persist | existing hangar cargo + credits only |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent Unknowables dock work while `veil` / The Quiet / Archive 400/900 exist.
- First remaining serial (if owner re-opens after a true missing-dock census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** reverse D3, must **not** invent UU.
- If Archive pending is lost on undock, that is session UI. **Never** persist pending as a new world field.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- Own file = `ARCHIVE_OWN_UU` (400)
- Rival file = `ARCHIVE_RIVAL_UU` (900)
- Drop = `DATA_DROP_RATE` (0.20)
- Launder = `LAUNDER_UU` (250) — EXP-03; cite only

---

## 1. What CONSUME means

A later worker must **not** treat wishlist “Unknowables dock still waits” as a hole. Code has the dock. Code has the two-way desk. Markdown freeze records that fact.

Optional later census (named only, not PR1): re-grep `veil`, `The Quiet`, `archiveDeskAllowed`, `archivePriceAtDesk`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

`DETAIL_STATIONS` stays without `unknowables`. Dedicated module stays. Contacts / catalog / chart id / hush reverse gate already live. Do not add generator tones. Do not add `EPICS.unknowables`.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 Unknowables dock** | **Does not exist.** Leftover CONSUME | second dock; `DETAIL_STATIONS.unknowables`; generated SYSTEM; new Digit; persist pending; invented UU |
| **PR-census (optional skip)** | Re-grep `veil` / The Quiet / Archive 400/900 | New world field; D3 reverse |

First remaining Unknowables-dock serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 4. Wins vs integrator brief

If `docs/Exp04RemainingDockDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats wishlist prose.
