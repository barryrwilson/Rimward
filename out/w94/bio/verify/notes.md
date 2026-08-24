# Wave 94 STOCK+TRAIN+SEED verifier notes

Law: `docs/OwnerDecisionsWave94.md` §1–§3.
Write-set: `src/game/shipyard.js`, `src/systems/shipyard-desk.js`, `src/game/hangar.js`, `src/game/bio-seed.js`, Beautiful Market papers in `src/systems/station.js`.
No project source edits by this verifier.

## Probe

`node --import ./out/w94/bio/css-register.mjs out/w94/bio/probe.mjs` → **PROBE PASS** (exit 0).

## §1 Living yard stock

| Check | Result |
|---|---|
| `LIVING_STOCK` six living classes | `['light','cutter','heavy','freighter','ace','frigate']` frozen |
| Unknowables uses same list | `UNKNOWABLES_STOCK = LIVING_STOCK`; `hullKindFor` → `living` |
| `YARD_LIST_UU` / `MIN_REP` | light 8000/0, cutter 11000/0, heavy 20000/0, freighter 24000/0, ace 28000/10, frigate 80000/25 |
| Hostile `rep < 0` | buy `reason === 'reputation'`; yard paints `No sale.` |
| No remount-on-buy | mounted id + player class stay |
| Hangar cap 8 fail-closed | extra pin `buy.full` true |
| NPC GLB | not rewritten in this write-set |

## §2 Living train dests

| Check | Result |
|---|---|
| Dest set | every other `LIVING_STOCK` key; same class omitted |
| Debit | `trainListPrice(rep, dest) === yardPrice(dest, rep)` |
| Rank / hostile | no Offer below `minRepFor(dest)`; hostile paints `No sale.` |
| Short credits | Offer stays; Confirm → `credits` |
| Success standing | train path does not write reputation |
| Unknowables / grafted | `faction` / `living` refuse |
| Confirm copy | `{from} → {dest}` on Hangar papers |
| Envelope | `applyFlightEnvelope` burn/cruise; cargo kept; no `switchTo` in train body |
| Digit 0 | dock menu last key is `shipyard` |
| Hangar Offers | one Offer per dest |

`nextTrainClass('light')` returns `'cutter'` (first dest). That is a valid `LIVING_STOCK` dest.

## §3 Seed commodity

| Check | Result |
|---|---|
| Not `COMMODITIES` | no `seed` / `seed_market` keys; not `livingRock` |
| Desk | Beautiful **Market** `renderSeedPapers` / Confirm papers |
| Gift | still People `renderGiftPapers` / `grantSwornGift` |
| Grant row | living `light`, faction `beautiful` |
| Id | `nextHullId` stem `seed_market` → `hull_seed_market_N`; never `hull_seed_gift` |
| Price | `SEED_MARKET_UU = 40000`; rank 0 (credits only) |
| Hostile | Offer hidden; `No sale.` |
| Repeat / cap | repeat until cap 8; Confirm `full` keeps credits |
| Remount | none; hangar row only |

## Boot-test Wave 92 pins (MEDIUM, harness)

`scripts/boot-test.mjs` still pins Wave 92 BIO-02:

- `nextTrainClass('light') === 'heavy'` now `'cutter'`
- `livingTrainDest('frigate') == null` now `'light'`
- `trainMounted(ctx)` with no dest now returns `class` before some old refuse reasons

Parent must update the harness. Not a worker bug: dest is a valid living class.

## Browser

Vite not started. CDP 9415 not used. `[NO BROWSER COVERAGE]` after node probe + static desk review.

## Verdict

**CLEAN** for the worker write-set.
MEDIUM note only for `scripts/boot-test.mjs` Wave 92 pins.
