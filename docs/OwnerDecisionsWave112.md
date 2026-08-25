# RIMWARD Owner decisions — Wave 112

| Field | Value |
|---|---|
| **Title** | Deputized answers to remaining wishlist grooming questions |
| **Author** | Wave 112 orchestrator (owner deputized 2026-08-24: pick, note, keep going) |
| **Date** | 2026-08-24 |
| **Status** | Binding. Later briefs must not re-invent these numbers. Owner may override in a successor file after playtest. |
| **Wave** | 112 — markdown only. No `src/`. |
| **Predecessor** | [`docs/OwnerDecisionsWave101.md`](OwnerDecisionsWave101.md) / Wave 100 standing deputize rule |

The owner asked for judgement calls on the eleven `docs/PLAYER-EXPERIENCE-WISHLIST.md` **Open questions for future grooming**. This file is the authored record. Live code wins where a question is already shipped. Do not mint new UU, SKUs, Digits, or persist keys to paper over a missing answer.

Wave 100 standing rule still binds: pick a playable default, write this file, keep going. The owner may change a pick after playtest.

Do not invent further UU, drop rates, or standing deltas without a successor line.

Integrator honor: HUD-01 empty 80 px hub. Digit 0 shipyard. Digit 8/9 stay. `state.js` READ-ONLY unless a later serial is named. Kit mutate omit. Aim-glass gauges stay off. Power-as-mount-ledger stays out (Wave 93); live `POWER` afterburner / psionic pool (Wave 94) consume.

Next leftover serial is still HUD-02 class silhouettes (`docs/Hud02RemainingSilhouettesDesign.md`). These calls do **not** block that PR1.

---

## Closed this wave

Live integers stay copied. Do not re-author them:

| Item | Live | Cite |
|---|---|---|
| Weapon keys | cannon, disruptor, mining, missile, turret, psionic | `state.js` `WEAPONS` |
| Heat | max 100, cool 12/s, unlock 40 | `HEAT` |
| Power pool | max 100, regen 8/s, afterburner 16/s | `POWER` (flight + psionic) |
| Mass | seat-count | Wave 68 |
| Mounts | `MOUNT_TABLE` | `state.js` 66–73 |
| Scanner 0/1/2 | none / Mk I bubble 800 / Mk II 2× + pierce | `U.ENCOUNTER_BUBBLE`; `ctx.world.scanner` |
| Yard list | 8000 / 11000 / 20000 / 24000 / 28000 / 80000 | `YARD_LIST_UU` |
| Min rep | 0 / 0 / 0 / 0 / 10 / 25 | `MIN_REP` |
| Rank | Known 10, Trusted 25, Sworn 50 | `RANK_LADDER` |
| Impact | min 8 u/s, 0.35 screen per u/s | `PHY.IMPACT_*` |
| Job deadline | 600 s | `MINING_DEADLINE` |
| Seed gift | `hull_seed_gift`, Sworn ≥ 50, 0 UU | `bio-seed.js` |
| Pirate seed | 0.05 | `PIRATE_SEED_DROP_RATE` |
| Market seed | 40000 UU | `SEED_MARKET_UU` |
| Graft | 4000 UU; ungraft forbidden | `GRAFT_LIST_UU`; Wave 97 |
| Traffic sale | other 160 / playerKill 240 | `TRAFFIC_LIST_UU` |
| Restitution | 1200 UU | `RESTITUTION_UU` |

---

### 1. Extra conventional weapon families

**Decision:** **none.** Close the wait.

The live set is the set: energy cannon, disruptor, mining ladder, dart rack, auto turret, psionic bolt. Do not add rail, flak, beam-combat, or a seventh `WEAPONS` id.

A later serial may retune live numbers after playtest. It must not invent a new family without a successor owner line.

---

### 2. Mount, ammunition, power, heat, and mass

**Decision:** **consume four live laws. Do not add a fifth limiter.**

| Law | Role |
|---|---|
| Heat | Gun fire resource (`HEAT`). Overheat stops shots. |
| Power | Afterburner + psionic only (`POWER`). **Not** a mount ledger. |
| Mass | Seat-count (Wave 68). |
| Ammo | Dart rack count already on the hull. No second ammo ledger. |
| Mounts | `MOUNT_TABLE` as shipped. Light/cutter/freighter: no missile/turret. Heavy/ace/frigate: live missile/turret caps. |

Do not retune `MOUNT_TABLE`. Do not reopen a SHP-03 power ledger. Do not gate cannon on power.

---

### 3. Targeting aids per scanner tier

**Decision:** **core HUD stays ungated. Scanner only gates the contacts arc.**

| Scanner | What it adds |
|---|---|
| 0 | No `.rw-contacts` arc. Lead, RANGE, MATCH, FORE/AFT, toasts, CLOS, KeyK engine, edge arrow still work. |
| Mk I (`>= 1`) | Contacts arc inside `ENCOUNTER_BUBBLE` 800. |
| Mk II (`>= 2`) | 2× bubble + lock closure pierce already live. |

Do not add Mk III. Do not put CLOS, engine-select, Incoming fire, or Incoming dart behind a buy. Do not put a lock box or radar PPI on the 80 px hub.

---

### 4. Ship classes and faction yard inventories

**Decision:** **consume live catalogs. No seventh class.**

`CORE_STOCK` / `LIVING_STOCK` stay the six live keys. Beautiful and Unknowables sell living lists (`LIVING_STOCK`). Other flags sell plated `CORE_STOCK`.

Do not add a plated Beautiful / Unknowables frigate SKU. Living frigate buy already shipped Wave 94. Ace still needs Known 10. Frigate still needs Trusted 25.

---

### 5. Prices and reputation thresholds

**Decision:** **keep live `YARD_LIST_UU` / `MIN_REP` / `RANK_LADDER` / graft 4000 / seed 40000 / restitution 1200.**

Do not retune for “feel.” Hostile `rep < 0` still paints `No sale.` Rank discounts stay the live Digit 9 table. A later playtest file may change one integer. It must name that integer.

---

### 6. High-speed collision damage

**Decision:** **keep live linear curve.**

`PHY.IMPACT_MIN_SPEED = 8` (slide only below). Above that, `PHY.IMPACT_SCREEN_PER_U = 0.35` into the live screen → hull peel. No quadratic. No hull-instant-kill from a bump. Sun heat/lethal stay `SUN_*`. Bounce restitution 0.15 stays.

Do not retune until playtest shows unfair deaths at docking speeds or no fear at rams.

---

### 7. Generous mission deadlines

**Decision:** **600 s for every ordinary renewable family.**

`MINING_DEADLINE` already stamps mining, trade, hunt, passenger, explore, spy, and war. Keep one number. Do not invent per-family clocks. Unique four and MSN-03 chains keep their live expire law. Do not tighten 600.

---

### 8. First procedural mission family

**Decision:** **mining. It is DONE (Wave 71).**

Do not restart the vertical slice. Later career work uses the live two-slot families. Do not add a new `kind` to “pick a first family.”

---

### 9. Living-ship seeds: signal, store, accidental sale

**Decision:** **consume the three live paths. Seeds are hangar hulls, not cargo.**

| Path | Live |
|---|---|
| Gift | `hull_seed_gift` at Sworn ≥ 50, 0 UU, People Confirm |
| Pirate | drop 0.05, hangar stem `seed_pirate` |
| Market papers | 40000 UU, stem `seed_market` |

Hangar cap 8 fail-closed. Seed rows are hulls. Digit 1 Market never lists them. Digit 7 People sells survivors only. `priceOf('survivor')` stays 0. No `COMMODITIES` seed SKU (Wave 93 omit of cargo seed still stands; Wave 94 market papers stay).

Accidental sale: **forbidden** by type. A later serial may add Hangar copy “not for sale” if play still confuses a seed row with cargo. It must not debit a seed as ore.

---

### 10. Abomination cleanse and warning

**Decision:** **no cleanse. Ungraft stays forbidden (Wave 97).**

Graft Confirm papers **are** the warning. `GRAFT_LIST_UU = 4000`. While any grafted hangar row remains, Beautiful standing caps at −10. Destroy-Abomination Beautiful `+5` stays. NPC grafts stay off.

Do not add a cleanse desk, UU, or Digit. Do not let Digit 1 Market or Digit 0 Hangar strip tissue.

---

### 11. Trafficking presentation, restriction, reaction

**Decision:** **consume Wave 66. Gilded People Digit 7 only.**

| Item | Live |
|---|---|
| Buyer | Gilded Chain only |
| Surface | Digit 7 Confirm |
| List | recovered 160 UU / playerKill 240 UU |
| Market | never sells people |
| Return | matching-faction dock still works |
| Contacts | do not buy |
| Victim faction | never buys |

Tone stays `docs/Pod02TraffickingDesign.md`. Do not add a second buyer. Do not retune 160 / 240. Do not put a slave pip on the hub.

---

## Explicit non-picks

| Temptation | Verdict |
|---|---|
| New `WEAPONS` id | **Forbidden** §1 |
| Mount power ledger | **Forbidden** §2 |
| Scanner Mk III / hub PPI | **Forbidden** §3 |
| Seventh ship class | **Forbidden** §4 |
| Retune yard UU / 600 s / 0.35 impact | **Forbidden** until playtest successor |
| Restart MSN first slice | **Forbidden** §8 |
| Cargo seed SKU | **Forbidden** §9 |
| Ungraft / cleanse | **Forbidden** §10 |
| Extra trafficking buyer | **Forbidden** §11 |
| HUD-01 hub child / new Digit | **Forbidden** honor |

---

## What this does not schedule

HUD-02 class-silhouette PR1 stays the next leftover serial. Optional playtest PRs stay skippable (FX-01 flash map, PHY-04 80 u sample). WAVE26 boot FAIL stays harness, not this file.

Wave 112 does **not** ship `src/`.
