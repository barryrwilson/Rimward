# Security review — POD-02 trafficking design (Wave 65)

**Method:** self-applied checklist on `docs/Pod02TraffickingDesign.md` + `out/w65/pod/shared-contract.md` + inventory cites. No `src/` edits.  
**Threat model:** local browser game. Save tamper, DOM XSS from world strings, prototype-key smuggling, Digit-complete debit, market commodity sneak.  
**Risk level after fixes:** Low (design). Impl wave must keep the pins.

---

## Checklist

| Check | Result |
|---|---|
| Fail-closed persist (no new `WORLD_FIELDS`; name cap 40; extra keys drop) | **PASS** — contract §4.2. Milestone id rides existing `milestones`. |
| XSS via survivor `name` / faction strings | **PASS** — `textContent` only; first slice does not print `name`; `commLine` authored; HUD toast builders use `textContent` (`hud.js` 196 `el()`, 834 `slot.el.textContent = text`). |
| Reputation exploits (`__proto__`, unknown faction, oversize units) | **PASS** — `isFactionKey` + `hasOwn(FACTIONS)`; Unknowables no sale; unit cap = hold (same as rescue). |
| Double-sale / Digit-complete debit | **PASS** — Confirm only; recompute; `trafficBusy`; People must not copy bar Digit-1 complete. |
| Market commodity sneak | **PASS** — no `COMMODITIES` row; explicit `priceOf` 0; dedicated verb; A/S stay on `COMMODITY_KEYS`. |
| Buyer scope | **PASS** — `faction === 'gilded'` only. Beautiful / Independent / Hollow have no desk. |
| Return path preserved | **PASS** — one-click rescue stays; not routed through pending. |
| Unknowables fail closed | **PASS** — no sale even if save carries the key. |
| Hangar parked cargo | **PASS** (fixed) — `ctx.cargo` only. |
| Offer on dock home | **PASS** (iter 2) — not inside `renderRescue`. Gate `ui.level === 2 && ui.service === 'people'`. |
| Secrets / eval / innerHTML | **PASS** — none specified. |

---

## Findings

### CRITICAL

None remaining.

### HIGH (found in draft, fixed in brief + contract)

#### H1 — Digit-complete sale if People copies bar/feed
**Issue:** Level-2 bar / feed / repair debit on Digit 1. An implementer could bind Digit 1 to Confirm.  
**Fix:** Contract §3 — Digits do not debit. Confirm is click-only. Digit 0 on People is not Shipyard and not Confirm.

#### H2 — Market sneak via `prices.survivor` / A/S
**Issue:** Live `priceOf('survivor')` is 0 only because markets are built from `COMMODITY_KEYS`. Tamper or a `COMMODITIES` add would price people.  
**Fix:** Explicit `priceOf` guard. No `COMMODITIES` row. Sale is not `tryTrade`.

#### H3 — XSS if lot lines print live `row.name`
**Issue:** Scoop copies `name` without cap (`pods.js` 495). Save caps at 40. A live unsaved name can be long / control-rich.  
**Fix:** First slice prints count + `FACTIONS[faction].name` + source word only. No `name` interpolation. `h()` / toast stay `textContent`.

#### H4 — Proto reputation write
**Issue:** Rescue already guards `hasOwn(FACTIONS)`. Sale must not invent `reputation[userString]`.  
**Fix:** Eligibility + write guards. Reserved keys never eligible.

#### H5 — Double-sale / vanished lot
**Issue:** Offer then Return then Confirm, or double-click Confirm.  
**Fix:** Recompute at Confirm. Zero units → no UU. `trafficBusy`. Pending is session-only.

#### H6 — Parked hangar holds
**Issue:** Wave 64 parks cargo on hull rows. A naive walk of `hangar.hulls` could sell people who are not aboard.  
**Fix:** `ctx.cargo` only.

#### H7 — Offer leaked onto level-1 home via `renderRescue`
**Issue:** Brief told implementers to add the transfer block inside `renderPeople` / `renderRescue` after Return. `renderRescue` also runs on home (`station.js` 2208). That ships Alt S3.  
**Fix (iter 2):** Sale chrome is **not** in `renderRescue`. Dedicated helper from `renderPeople` only. Fail-closed gate `ui.level === 2 && ui.service === 'people'`. Contract §1.2 matches the brief.

### MEDIUM (accepted leftovers)

#### M1 — Save-minted units
A hand-edited hold of 20 `other` survivors still cashes 3200 UU and +40 Gilded at the desk (cap = hold). Same class as Wave 60 rescue review. Local sim. No server.

#### M2 — `cargoValue` tamper
`state.js` 1070–1071 can count a stuffed `prices.survivor`. `state.js` is READ-ONLY this family. Pins must not treat `cargoValue` as a people price. Later serial owner may skip `survivor` in that reducer.

#### M3 — `addCargo('survivor')` faction-less row
Existing hole (`station.js` 1024–1027). Market cannot reach it. Sale eligibility fails closed (no faction). Do not use `addCargo` on this path.

### LOW

- First-sale milestone is witnessed (player confirmed). Safe.
- Fear per lot (not per unit) avoids a five-body sale outranking `killedSurrendered`.

---

## Resolved in this wave (docs)

H1–H7 written into `shared-contract.md` (wins) and `docs/Pod02TraffickingDesign.md`. Cites: HUD toast `hud.js` 834; market table `market.js` 61–66.

## Open

None that block an impl wave. M1–M3 stay as pins / non-goals.

## Final report excerpt

Design is fail-closed on persist, XSS, proto keys, Unknowables, non-Gilded desks, Market sneak, Digit law, and double-sale. Confirm-before-credit is frozen. Return stays. Implementers must not invent a Market row or an eleventh dock key.
