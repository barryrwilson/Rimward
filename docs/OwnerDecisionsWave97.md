# RIMWARD Owner decisions — Wave 97

| Field | Value |
|---|---|
| **Title** | Owner judgement calls that close remaining BIO-05 NPC / plated / badge / ungraft questions |
| **Author** | Wave 97 orchestrator (owner deputized 2026-08-23) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Later briefs must not re-invent these numbers. Owner may override in a successor file. |
| **Wave** | 97 |
| **Predecessor** | [`docs/OwnerDecisionsWave94.md`](OwnerDecisionsWave94.md) |

The owner deputized judgement calls on the remaining BIO-05 items Wave 96 left owner-open (Wave 93 style). This file is the authored record. Do not pick different numbers.

Wave 97 is **markdown only**. Do not land `src/` against these lines in this wave. Wave 97 does **not** schedule BIO-05 `src/` PRs.

Do not invent further UU or standing deltas without a new owner line in this file or a successor.

Live integers stay copied from Wave 82 / Wave 96. Do not re-author them:

| Item | Integer |
|---|---|
| Graft list price | `GRAFT_LIST_UU = 4000` |
| Hostility cap while any grafted hangar row | `HOSTILE_STANDING = −10` |
| Kill standing | `KILL_STANDING_DELTA = −5` |
| Destroy-Abomination Beautiful | `ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5` |

Player graft sale / warn / cap / Digit 5 stay **closed** (Wave 72 / Wave 82). Do not reopen them. Do not rewrite grafts as if they were absent.

Integrator freeze: [`out/w97/bio05/shared-contract.md`](../out/w97/bio05/shared-contract.md). If this file and that contract conflict, the **contract wins**. Pointer: [`docs/Bio05AbominationsDesign.md`](Bio05AbominationsDesign.md).

---

## Closed this wave

### NPC grafted traffic

**Decision:** **off**. World look stays player-only.

Do not set `grafted` on NPC spawn. Live `npc.js` / `traffic.js` stay without a graft flag. `createShipState` still does not copy `grafted`.

The kill helper stays. Live +5 still almost never fires. Do not change the helper integers.

| Item | Decision |
|---|---|
| NPC spawn `grafted` | **off**. Do not write the flag |
| Kill helper | stays (`ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5`) |
| Recap | still `min(current, −10)` while the player owns tissue |
| Beautiful victim | kill **−5** only (Wave 82) |
| World look | player-only Abominations |

A later successor owner file may reopen NPC Abomination traffic. This file does not.

**Impl:** none in Wave 97. PR3 stays skipped until a successor owner file opens it.

### Plated tissue overlay

**Decision:** **omit**. Keep plated. Close the wait.

Grafted built stays plated GLB. HUD stays mech. `makeLivingHull` stays the player living quality bar. Do not replace `makeLivingHull`. Do not convert grafted built into a living mesh.

| Item | Decision |
|---|---|
| Player grafted mesh | plated `buildBuiltVisual` |
| Tissue overlay on plated rig | **omit** |
| Replace `makeLivingHull` | **no** |
| HUD family | grafted stays **mech**. HUD never writes `hullKind` |

A later successor owner file may reopen a plated overlay. This file does not.

**Impl:** none in Wave 97.

### Hangar grafted badge

**Decision:** **omit**. Close the wait.

Digit 9 + Gilded warn already tell the beat. Hull cards stay name + class · faction · mounted. Do not add a `grafted` label.

Live copy (restate only; do not rewrite):

- Warn: `Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.`
- Reduced: `Beautiful Ones become enemies.`

**Impl:** none in Wave 97.

### Ungraft SKU

**Decision:** **forbidden**. Close the wait.

No `state.js` SKU. No commodity. Do not add `COMMODITIES` rows. Do not open a dedicated ungraft PR.

Removing the last graft (if a later prune exists) still does **not** auto-heal Beautiful standing.

**Impl:** none in Wave 97. `state.js` stays closed.

### Player graft loop

**Decision:** **closed**. Do not reopen sale, warn, UU, cap, or Digit 5.

Wave 72 / Wave 82 already ship Gilded papers, `grafted: true` on built, debit **4000 UU**, Beautiful `min(current, −10)`, Digit 5 on grafted built, HUD mech.

### Persist / HUD / Digit / innerHTML (restate)

| Item | Decision |
|---|---|
| Persist | hangar row only. No new `WORLD_FIELDS`. No new `localStorage` |
| `innerHTML` | **forbidden**. `textContent` / `h()` / `el()` |
| Digit 0 | shipyard |
| HUD `hullKind` | HUD never writes. Grafted stays mech |

---

## Wave 97 implementation split

This wave writes `docs/OwnerDecisionsWave97.md`, a Bio05 status bump, and `out/w97/bio05/**` scratch only.

Not in Wave 97 `src/`: NPC grafted spawn, plated overlay, hangar badge, ungraft SKU, player graft desk.

| PR | Wave 97 |
|---|---|
| **PR1 inventory pins** | optional later. Not scheduled here |
| **PR2 player leftover** | **skipped**. Loop complete |
| **PR3 NPC / visual** | **skipped** until a **successor** owner file (not this one) opens it |
