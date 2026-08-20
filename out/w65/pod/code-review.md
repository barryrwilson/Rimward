# Design-doc review — POD-02 trafficking (Wave 65)

**Method:** self-applied checklist (this task is design-only; review the markdown, not a `src/` diff).  
**Inputs:** `docs/Pod02TraffickingDesign.md`, `out/w65/pod/shared-contract.md`, `out/w65/pod/current-pod-inventory.md`, Wave 60/64 code cites.  
**Merge law:** `shared-contract.md` wins sibling conflicts.

---

## Checklist

| Check | Result |
|---|---|
| Every “today” claim has a file:line that is true | **PASS** — inventory cites `pods.js`, `station.js`, `save.js`, `ctx.js`, `hud.js`, `state.js`, `npc.js`. Digit table matches shipped ten-key list (`station.js` 119), not stale Wave 63 nine-key text. |
| Digit law does not insert an 11th dock service | **PASS** — People Digit 7. 1–9 and 0 untouched. |
| Market still unable to sell via `priceOf` | **PASS** — stays 0; explicit guard; no `COMMODITIES` row. |
| Confirm-before-debit frozen | **PASS** — Offer arms; Confirm pays; Digits do not debit. |
| Independent / hollow / beautiful not given a desk | **PASS** — buyer is `gilded` only. |
| Return path preserved | **PASS** — including Gilded home (both verbs) and all non-Gilded homes. |
| Open questions answered (not left to impl) | **PASS** — UU, rep, fear, Gilded-on-Gilded, empty/mixed/proto, reduced copy. |
| Tone frozen | **PASS** — spare, recorded-state, no joke, no gore, no “slave” in UI. |
| `state.js` READ-ONLY / module named | **PASS** — `src/game/trafficking.js`. |
| No Wave 65 impl / no wishlist edit | **PASS** — docs + `out/w65/pod/**` only. |
| Shape matches `ShpDesign.md` | **PASS** — front matter, goals/non-goals, merge table, alts, PR plan, closed questions. |

---

## Findings

### Blocking (would make an impl invent tone or prices)

None remaining after H1–H6 doc fixes (see `security-review.md`).

### Major (fixed in-doc)

| ID | Issue | Resolution |
|---|---|---|
| D1 | Ambiguous surface (People vs Market) | Frozen: People Digit 7. Market rejected (A/S sneak). |
| D2 | Missing fail-closed Unknowables | Frozen: no sale; refuse line if they are the only rows. |
| D3 | Persist of unsanitized name | First slice does not print `name`. Save cap stays 40. No new cargo keys. |
| D4 | Market commodity sneak | No `COMMODITIES` row. `priceOf` explicit 0. Dedicated verb. |
| D5 | Fear table said “per unit” then apply said “per lot” | Contract table now **per lot**. UU/rep stay per unit. |
| D6 | Hangar parked cargo omitted | Frozen: `ctx.cargo` only. |
| D7 | Sale chrome could ride `renderRescue` onto home | Frozen: not in `renderRescue`. Gate `ui.level === 2 && ui.service === 'people'`. One helper name: `trafficLots`. |

### Nits (non-blocking)

- Level-1 still shows Return (Wave 60). Sale stays off home. The home gate is now explicit.
- `applySurvivorRescue` mixed-source event still reports `other` (Wave 60). Sale lots are per source, so `survivorSold` stays exact.
- Wishlist word “slaves” is system language only. UI copy uses “transfer”. Do not paste the wishlist noun onto buttons.

---

## Serial PR plan (impl wave — not Wave 65)

Matches contract §8:

1. `save.js` allowlist pins  
2. `src/game/trafficking.js` tables + apply  
3. `station.js` People verb + `priceOf` guard  
4. `hud.js` toast + `ctx.js` comment  
5. Boot pins  

`state.js` READ-ONLY. Do not touch shipyard, HUD-02, scoop, or spawn.

---

## Status

**Approve for a later impl wave.** A worker can ship without inventing tone or prices. Contract wins if the brief is edited later.

## Final report excerpt

The brief freezes Gilded-only People sale, 160/240 UU, victim 0/−8, Gilded +2, fear +1/+2 per lot, Confirm-before-credit, no eleventh service, Market `priceOf` 0, Return preserved, Unknowables fail closed, `textContent` only, no new `WORLD_FIELDS`.
