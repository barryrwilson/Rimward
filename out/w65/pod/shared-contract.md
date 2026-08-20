# POD-02 trafficking shared contract

**Wave:** 65. Design only. No trafficking ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Pod02TraffickingDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md` or `PROGRESS.md`.  
**Locked sources:** wishlist Initiative POD (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~677–710); `src/game/pods.js`; `src/systems/station.js`; `src/game/save.js` `sanitizeCargoRow` / `WORLD_FIELDS`; `src/core/ctx.js` event comment; `src/systems/hud.js` `survivorRescued`; `src/game/state.js` `RESCUE` / `COMMODITIES` / `FACTIONS`; `src/systems/npc.js` `spawnShipSurvivor`; Wave 64 digit law (`DOCK_KEY_SERVICES` + Digit 0 shipyard).

Integrator rule: a later implementation wave obeys this file. Inventory cites live in `out/w65/pod/current-pod-inventory.md`. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 65 is markdown only. Implementation is a later **serial** wave.
2. Trafficking is possible and costly. It is not a joke, a comedy beat, or a hidden debug sale.
3. Only **Gilded Chain** docks buy people (`currentDef.faction === 'gilded'`). Independent, hollow, beautiful, and every other flag do **not** grow a desk.
4. Fold the sale into **People** (Digit **7**). Do **not** add a `DOCK_KEY_SERVICES` key. Digits 1–9 stay Market…Standing. Digit **0** stays Shipyard.
5. Ordinary Market still cannot list or sell `survivor`. `priceOf('survivor')` is **0**. The desk uses a dedicated allowlisted verb.
6. No single digit completes a sale. Confirm control required (yard `Confirm papers` discipline).
7. Return on matching-faction home / People **stays**. Non-Gilded home docks do not hide Return.
8. Provenance already rides cargo rows. **No new `WORLD_FIELDS` key.** Cargo keep-list stays `commodity`, `units`, `faction`, `source`, `name` (cap 40).
9. World strings use `textContent`. No `innerHTML` / `insertAdjacentHTML` / `document.write` of names, notices, or save strings.
10. Unknowables survivors: **no sale** (fail closed). Wave 60 already refuses spawn (`npc.js` 1322).
11. Do not change scoop, spawn, merge, `RESCUE` numbers, or shipyard.
12. `state.js` is **READ-ONLY** unless a later serial owner must land a tiny table. Prefer `src/game/trafficking.js`.

---

## 1. Buyer and surface

### 1.1 Who buys

| Dock `faction` | Desk |
|---|---|
| `gilded` | Yes — People, level 2, only when eligible survivor cargo exists |
| `independent`, `hollow`, `beautiful`, `freehold`, `veridian`, `redledger`, `ferrous`, `assembly`, `congregation`, `lamplighter`, `unknowables` | **No desk.** Return still works when the dock faction matches cargo. |

Generated Gilded systems use the same rule (`currentDef.faction === 'gilded'`). Do not key on system id, origin, or `ctx.player.faction`.

Beautiful Ones: **never** a buyer. Selling Beautiful **victims** to Gilded is allowed (they are cargo, not the desk).

### 1.2 Where in the dock UI

**Chosen: People (Digit 7).** Not a gated Market row.

Why (digit law):

- Digit 1 Market already binds Q/W/A/S to `COMMODITY_KEYS` (`station.js` 2279–2286). A people-row on that table is a commodity sneak and a one-key sell risk.
- People already owns Return (`station.js` 1976–1997). The moral fork sits next to rescue.
- Digit 0 is Shipyard (`station.js` 2264–2266). Do not steal it.
- `DOCK_KEY_SERVICES` is frozen at the ten shipped keys (`station.js` 119). No eleventh service.

**Level-1 dock home:** `renderRescue` stays (`station.js` 2208). **Do not** put Offer / Confirm on level 1. **Do not** add sale chrome inside `renderRescue` (home shares that helper).

**Sale chrome gate (fail closed):** Offer / Confirm render only when **all** hold:

- `ui.level === 2 && ui.service === 'people'`
- `currentDef.faction === 'gilded'`
- `trafficLots(ctx).length > 0`

Call a dedicated helper from `renderPeople` after `renderRescue`. If someone later calls that helper from home, the `ui.level === 2 && ui.service === 'people'` check still hides the desk.

### 1.3 Gilded matching-faction cargo

At a Gilded dock, Gilded survivors are **home**.

| Verb | Offered? |
|---|---|
| Return survivors | **Yes** — existing `applySurvivorRescue(ctx, 'gilded')` |
| Offer to the Chain | **Yes, as a separate lot** — the player may sell Chain-born people to the desk |

Both appear when those units exist. They are not one button. Return does not sell. Sale does not return.

---

## 2. Prices and standing (frozen numbers)

Authored in code, **not** on the save blob. Same discipline as `YARD_LIST_UU`.

```js
// src/game/trafficking.js (later impl)
export const TRAFFIC_LIST_UU = Object.freeze({
  other: 160,
  playerKill: 240,
});

export const TRAFFIC_REP = Object.freeze({
  victimOther: 0,
  victimPlayerKill: -8,
  gildedPerUnit: 2,
});

export const TRAFFIC_FEAR = Object.freeze({
  other: 1,
  playerKill: 2,
});
```

Per **eligible unit** on a confirmed lot (UU + standing). Fear is **once per confirmed lot**, not per unit.

| Source | UU paid / unit | Victim-faction rep / unit | Gilded rep / unit | Fear / lot |
|---|---|---|---|---|
| `other` | 160 | **0** | +2 | +1 |
| `playerKill` | 240 | **−8** | +2 | +2 |
| anything else | treat as `other` | 0 | +2 | +1 |

Why these numbers (inventory §8):

- UU sits between raw ore (140) and refined metals (240). Not a joke purse. Not a jackpot.
- `playerKill` pays more (temptation) and costs standing (wishlist: harm the victim faction).
- −8 is 2× rescue-`other` (+4) in reverse. Three `playerKill` sales drop a Known (10) name through Stranger toward Suspect (−25).
- Fear stays below ransom (+3) and far below `killedSurrendered` (+8).

`repDelta` on `survivorSold` is the **victim** change only (`0` or `−8 * count`). The Gilded +2 per unit is applied in code and is **not** stuffed into `repDelta`.

Do not multiply by epic `buyMult` / `sellMult`, hermit, fixer, or rank goodwill. The desk is not the market.

---

## 3. Eligibility and fail-closed

A cargo row is **eligible** for sale only when **all** hold:

1. `isSurvivorCargo(row)` (`commodity === 'survivor'`).
2. `typeof faction === 'string'` and `isFactionKey(faction)` (rejects `__proto__`, `constructor`, `prototype`, `''`).
3. `Object.hasOwn(FACTIONS, faction)`.
4. `faction !== 'unknowables'`.
5. `survivorUnitCount(row, holdCap)` > 0 (finite, ≥1, `<= floor(cargoCapacity)`; oversize stacks grant **nothing** and stay in the hold — same as rescue).

A desk may open only when:

- `currentDef.faction === 'gilded'`, and
- at least one eligible row exists.

Fail closed (no debit, no remove, no event):

| Case | Result |
|---|---|
| Empty hold | No transfer chrome |
| Mixed-faction hold | One **lot** per `(faction, source)`. Confirm sells that lot only |
| Only Unknowables / proto / missing faction / oversize | No Offer button. If those are the only survivor rows, one spare refuse: `The desk will not take them.` |
| Not a Gilded dock | No transfer chrome |
| Pending lot vanished (Return between Offer and Confirm) | Clear pending. Notice: `They are no longer in the hold.` No UU |
| `credits` / `reputation` / `fear` missing or not objects | Do not throw. Skip the write that cannot land. Still refuse the sale if credits cannot be paid **into** a finite purse — if `world.credits` is non-finite, refuse |
| Double click / Digit during pending | Confirm is the only debit. Digits do not debit |

`addCargo` / `removeCargo` / `tryTrade` stay out of this path.

**Mounted hold only.** Sale and Return read `ctx.cargo` (the live / mounted hold). Do **not** walk `ctx.world.hangar.hulls[*].cargo`. Parked people stay parked.

**Buyer re-check.** Confirm calls `applySurvivorSale` only when the **current** dock `faction === 'gilded'`. Do not trust `ui.trafficPending` or a button `data-*` for the buyer.

**Fear write.** Clamp `0..100` and emit `fearChanged` (same as `npc.js` `bumpFear` 323–326). Do not leave fear unclamped.

**Return vs Confirm.** Return stays the shipped one-click `applySurvivorRescue`. Do not route Return through `trafficPending`. Do not bind People Digit 1–9 to Confirm (bar / feed / repair complete on one Digit — People sale must not copy that).

---

## 4. Confirm, persist, events

### 4.1 Confirm

Mirror yard papers (`shipyard-desk.js` 198–219):

1. **Offer to the Chain** (click) arms `ui.trafficPending = { faction, source }` (plain literal; allowlisted keys only).
2. Panel rebuilds to Confirm + Esc cancel. Recompute price and count at **confirm** time, not from the armed snapshot’s UU.
3. **Confirm transfer** (click) runs `applySurvivorSale`.
4. No Digit completes the sale. People level-2 must **not** bind Digit 1–9 or Digit 0 to Confirm. If a later impl adds a Digit to **arm** a lot, that Digit must no-op while pending (yard pending rule).
5. Esc: if pending, cancel pending and stay on People. Second Esc backs to level 1.
6. Undock / leave People clears pending.
7. Dock does **not** auto-sell.

### 4.2 Persist

| Item | Rule |
|---|---|
| `WORLD_FIELDS` | **No new key.** |
| Cargo row | Existing sanitizer only. Name cap 40. Source allowlist. Faction via `sanitizeFaction`. Drop unknown keys. |
| Milestone `peopleTrafficked` | **Allowed.** First successful Confirm only (`!milestones.includes`). Witness-rule **safe**: the player completed the desk act. Rides existing `world.milestones`. |
| Count field `world.peopleTrafficked` | **Forbidden.** |
| Prices / deltas | Code tables only. Ignore any save-supplied `price`. |

### 4.3 Events (later impl — list, do not emit in Wave 65)

Add to the `ctx.js` comment in the impl wave:

```
'survivorSold' { faction, source, count, credits, repDelta }
```

- `faction` = victim lot faction  
- `source` = `'playerKill'` \| `'other'`  
- `count` = units removed  
- `credits` = integer UU paid  
- `repDelta` = victim standing change (0 or negative)

Also emit `commLine` with the spoken notice (same pattern as rescue). Optional first-sale `milestone` `{ id: 'peopleTrafficked', line }`.

Do **not** emit `atrocity`. Do not emit `survivorSold` from Wave 65.

---

## 5. Market law (do not sneak)

1. Do **not** add `survivor` to `COMMODITIES`.
2. `priceOf` must return **0** for `'survivor'` even if `world.prices.survivor` is tampered. Impl adds an explicit guard.
3. `tryTrade` keeps the `key === 'survivor'` refuse.
4. `removeCargo('survivor')` stays a no-op.
5. `cargoValue` / book / ransom treat survivor units as **0** (impl-wave pin; `state.js` is READ-ONLY — prefer a trafficking helper used by any new reader; do not rely on a parallel `state.js` edit).
6. Market Q/W/A/S never see a people row.

---

## 6. XSS, copy, settings

- `h()` / HUD toast / `commLine` use `textContent` / existing toast builders. No `innerHTML`.
- Do not interpolate `row.name` into HTML or CSS. If a later impl shows a name, run the save sanitizer (strip controls, cap 40) and assign `textContent`.
- Copy is spare, recorded-state, no gore theater, no joke. UI never says “slave”, “meat”, or “stock”.
- Reduced copy when `ctx.settings?.reducedMotion === true`. **No new settings key.**

Full / reduced strings are frozen in the integrator brief §4.

---

## 7. Rescue still works

- `applySurvivorRescue` stays the only Return mutator.
- `RESCUE` numbers stay 4 / 1.
- Non-Gilded matching-faction docks keep today’s Return chrome (level 1 + People).
- Gilded docks keep Return **and** add the gated sale block.
- Sale must not call `removeSurvivorsForFaction` for a different faction than the pending lot.
- Scoop / spawn / `survivorKey` / Unknowables skip are **read-only**.

---

## 8. Serial PR plan (later wave)

One owner at a time on `station.js`, `save.js`, `hud.js`. `state.js` READ-ONLY.

| PR | Owner | What |
|---|---|---|
| **PR1** | `save.js` pins only | Confirm cargo allowlist: survivor keeps faction/source/name cap 40; extra keys drop; `__proto__` cannot become a faction. No new `WORLD_FIELDS`. No UI. |
| **PR2** | new `src/game/trafficking.js` | `TRAFFIC_*` tables + `applySurvivorSale` + eligibility. Fail-closed. No DOM. |
| **PR3** | `station.js` | People level-2 Gilded block from `renderPeople` only (not `renderRescue`). Gate `ui.level === 2 && ui.service === 'people'`. Offer → Confirm. `priceOf('survivor')` explicit 0. `tryTrade` unchanged refuse. |
| **PR4** | `hud.js` + `ctx.js` comment | `survivorSold` toast (`warn`). List the event on the frozen comment. Do not emit from HUD. |
| **PR5** | boot pins | Empty hold, mixed lots, Unknowables, proto, oversize, double-confirm, non-Gilded no desk, Return still works, Market A/S cannot sell people. |

Rollback: revert the PR that failed. Leave sanitizer pins if UI rolls back.

---

## 9. Non-goals (locked)

- No impl in Wave 65.
- No new `COMMODITIES` row.
- No HUD-02 work. No shipyard work. No missiles.
- No scoop / spawn / merge change.
- No automatic sale on dock.
- No desk on Beautiful Ones / Independent / Hollow / non-Gilded flags.
- No Unknowables sale.
- No eleventh dock service.
- No Digit-complete sale.
- No `state.js` drive-by tables.
- Do not edit the wishlist or `PROGRESS.md` from this family.
