# RIMWARD Owner decisions — Wave 94

| Field | Value |
|---|---|
| **Title** | Owner calls that open the five Wave 93 outs and freeze shippable first impl |
| **Author** | Wave 94 orchestrator (owner: ship the parked items; do not re-park) |
| **Date** | 2026-08-23 |
| **Status** | Binding. Later briefs must not re-invent these numbers. |
| **Wave** | 94 |
| **Predecessor** | [`docs/OwnerDecisionsWave93.md`](OwnerDecisionsWave93.md) |

Wave 93 closed some items as **out** / **omit** / **Wait**. The owner rejected those parks. This file **reverses** them with concrete first-impl law.

Do not invent further UU, drop rates, or standing deltas without a successor line.

---

## 1. Living frigate / ace / freighter **buy**

**Decision:** Beautiful living yard sells the full live class set.

```
LIVING_STOCK = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']
```

Unknowables yard uses the same list (still `hullKind: 'living'`).

Prices and rank gates stay `YARD_LIST_UU` / `MIN_REP`:

| Class | List UU | Min rep |
|---|---|---|
| light | 8000 | 0 |
| cutter | 11000 | 0 |
| heavy | 20000 | 0 |
| freighter | 24000 | 0 |
| ace | 28000 | 10 |
| frigate | 80000 | 25 |

Hostile `rep < 0` still paints `No sale.` No remount-on-buy. Hangar cap 8 fail-closed. NPC GLB path unchanged.

---

## 2. Living train dests (ace / freighter / frigate)

**Decision:** at a Beautiful Hangar, a living non-grafted hull may train to **any other** key in `LIVING_STOCK`.

- Debit `yardPrice(dest, beautifulRep)`.
- Rank gate `minRepFor(dest)` on Beautiful standing. Below min-rep: no Offer (same copy family as yard).
- Hostile Beautiful: `No sale.`
- Short credits: keep Offer; Confirm refuses.
- Success writes **no** standing.
- Unknowables-faction hull: refuse (Beautiful care).
- Grafted built: refuse.
- Same class: no Offer.
- Confirm copy: `{from} → {dest}`.
- Envelope: Wave 92 path (`burn` / `cruise`, cargo keep, no `switchTo`).
- Digit 0 stays Shipyard. Hangar pane lists dest Offers (more than one is allowed).
- `trainListPrice(rep, dest)` replaces the heavy-only helper.

---

## 3. Seed commodity

**Decision:** **open**. Not a `COMMODITIES` cargo key. Not `livingRock`.

| Item | Decision |
|---|---|
| Desk | Beautiful **Market** Confirm papers (gift stays People) |
| Grant | hangar row living `light`, faction `beautiful` |
| Id | `nextHullId` stem `seed_market`. Never `hull_seed_gift` |
| Price | `SEED_MARKET_UU = 40000` |
| Rank | 0 (credits only) |
| Hostile Beautiful | `No sale.` |
| Repeat | until hangar cap 8 |
| Remount | no |
| Persist | hangar row only |

---

## 4. Power ledger

**Decision:** **in**. One pool, same shape as heat. **Not** on the aim glass.

```
POWER = {
  max: 100,
  regenPerSec: 8,
  afterburnerPerSec: 16,
  afterburnerMin: 15,
}
```

`createShipState` adds `power: POWER.max` (live. Not a new `WORLD_FIELDS` key).

| Drain | Amount |
|---|---|
| Afterburner | `afterburnerPerSec` while `burnerActive`. Cannot **start** if `power < afterburnerMin`. If pool hits 0 mid-burn, cut the burn (cooldown still starts) |
| `WEAPONS.psionic` | `powerPerShot: 10` plus existing `heatPerShot: 8`. No bolt if `power < 10` or overheated |
| Cannon / disruptor / mining / dart / turret | no power field (heat only) |

HUD: a **PWR** bar in `.rw-side-col` next to strain/heat. No pip, ring, or gauge on the aim glass. Reduced-motion: bar still reads, no extra pulse.

Regen: `POWER.regenPerSec` when not draining afterburner this frame. Clamp `[0, POWER.max]`.

No class power field. No psi capacitor. No triad. Mass stays seat-count.

---

## 5. Unknowables dock

**Decision:** **un-wait**. Authored origin system, dedicated station builder, Archive desk.

Do **not** put `unknowables` in `DETAIL_STATIONS` (VC kit). Follow Beautiful: a dedicated `buildUnknowablesStation` (new module `src/systems/stations/unknowables.js` plus a dispatch line). Placeholder is forbidden for this faction once the builder exists.

| Item | Decision |
|---|---|
| System id | `veil` |
| Name | `The Veil` |
| Faction | `unknowables` |
| Band | 3 |
| Gate | from `hush` (add the reverse link on `hush.gates`) |
| Station name | `The Quiet` |
| Archive | allowed when dock faction is `unknowables` **and** the dedicated builder exists |
| Own UU | crystal **400** (Wave 82 `ARCHIVE_OWN_UU`) |
| Rival UU | cube **900** (Wave 82 `ARCHIVE_RIVAL_UU`) |
| Hostile | `standingRead(unknowables) < 0` → no sale |
| Digit 0 | shipyard; living stock from §1 |
| People | `portraitFor('unknowables', id)` |
| Epic | **omit** this serial (no `EPICS` row) |
| New hush clue | **no** (count stays 6) |
| Contacts | one `dockmaster` on `veil` |
| Cast | `{ traders: 0, pirates: 0, patrols: 0, ace: false }` |
| Clues on `veil` | `[]` (verge precedent) |

`th_veil` landmark on `hush` may still land as presence (Wave 92/93). The dock is `veil`, not Threshold.

Generator cluster: **no**. Authored only.

---

## Wave 94 implementation split (write-sets)

1. **POWER** — `state.js` `POWER` + `createShipState.power`, `hud.js` / `hud.css` PWR bar, `combat.js` / `psionic.js` drain, `ship.js` afterburner gate. No `station.js`. No `shipyard.js`.
2. **STOCK+TRAIN+SEED** — `shipyard.js`, `shipyard-desk.js`, `hangar.js`, `bio-seed.js`, Beautiful Market papers in `station.js`.
3. **UNK dock** — **after** (2) because both write `station.js`. `authored-systems.js`, `contacts.js`, `data-trade.js` / Archive allow, dedicated station module, models catalog.

Do not edit `scripts/boot-test.mjs` in these workers. Write probes under `out/w94/<task>/`.
