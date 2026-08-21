# Design-doc review: Wave 77 MSN-02 passenger ferry

**Scope:** `docs/Msn02PassengerDesign.md`, `out/w77/passenger/shared-contract.md`, `out/w77/passenger/current-passenger-inventory.md`. Markdown only.  
**Method:** Self-applied `reviewer` persona + orchestrator `code-review.md` checklist. Designer agent **not available**.  
**Date:** 2026-08-20.  
**Rule:** if brief and contract disagree, **contract wins**.

Sampled live vs inventory (12+): unique ferry complete `station.js` 2202–2206 / 2395–2402; `holdUnits` 962–965; `addCargo` survivor skip 1668–1677; Digit 2 `DOCK_KEY_SERVICES` 152 / labels 3424 / accept 3548–3550; live cap `save.js` 115–122; `JOB_KINDS` 127; `makeJobs` 1724–1756; `otherSystemId` 1711–1713; trade dest rebind 2323–2324; `FERRY_REWARD` 175; `priceOf('survivor')` 1689–1690; `h()` 2489–2494; `WORLD_FIELDS` `'jobs'` 78; `ctx.js` no jobs default 123–148; People Digit 7 `renderTrafficDesk` 1550–1553; `trafficking.js` 8.

---

## Code Review: passenger design pack

### Summary

Inventory matches live Wave 76 board (mining + trade + unique ferry one-shot). Contract freezes `kind: 'passenger'`, two slots, cap = **live 420 + passenger room only**, no cargo token, origin `FERRY_REWARD`. Brief shape matches `docs/Msn02TradeDesign.md`. No 🔴/🟠 remaining.

### What's done well

- Code-wins inventory; Wave 75 trade inventory line numbers called stale.
- Unique `ferry` vs renewable `passenger` collision defended; unique complete still `done` / no splice.
- Cap formula cites **live** `4+4*N+16` (420), then adds `PASSENGER_ROOM` only. Hunt/explore rooms excluded (sibling workers).
- People lots stay POD-02. `priceOf('survivor')` 0. No 160/240 reopen.
- Pay reuses live `FERRY_REWARD` 350 at **origin**; unique ferry dest stamp stays on unique ferry.
- Serial PR plan named-only. No `src/` this wave.
- XSS / proto / stuffed pay / dest rebind / reputation key law copied from the trade contract and adapted.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None. Author pass closed:

1. **Stale live cap 220.** Wave 75 trade contract called live cap `4+2*N+16` (220). Live is already `4+4*N+16` (**420**) after Wave 76 (`save.js` 115–122). Passenger contract cites 420 as live, then `+ PASSENGER_ROOM` → 620 at 100. Using 220 as live would have dropped trade.
2. **Kind `'ferry'` reuse.** Would collide with unique consignment and WAVE4/WAVE26 pins. Frozen as `'passenger'`.
3. **Fronting copy.** Unique ferry `addCargo('provisions', 4)` (2759). Passenger fail-closed to **no cargo token**. Hangar token marked **proposed, needs owner**.
4. **Cap eating siblings.** Formula does not add hunt or explore rooms.

#### 🟡 Minor: Home board Digit overflow grows again

**Location:** brief §7; `station.js` 3548–3550  
**Issue:** Unique four + overlays + 2 mining + 2 trade + 2 passenger can exceed 9 cards.  
**Fix:** Documented. Mouse Accept stays. Do not cut slots. Same as trade serial.

#### 🟡 Minor: Unique ferry pay still dest-stamped (not a passenger bug)

**Location:** `station.js` 2758, 2396; contract §3.4  
**Issue:** Two ferry-shaped quotes will exist: unique dest-priced Provisions vs renewable origin-priced passenger. Testers may confuse them.  
**Fix:** PR5 pins unique ferry `done` + dest stamp unchanged, and passenger origin stamp + dest rebind. Copy must say “escort”, not “consignment”.

#### 💡 Suggestion: Shared `miningTimeLeftLabel`

**Location:** `station.js` 1981–1989  
**Issue:** Name says mining; trade already reuses it. Passenger should reuse or rename in impl, not invent a third clock.  
**Fix:** Impl PR4. Not a design hole.

### Stale-cite check

| Claim | Live | Result |
|---|---|---|
| Unique ferry `completeJob` → `done`, no splice | 2202–2206, 2395–2402 | pass |
| `holdUnits` sums including survivor rows | 962–965 | pass |
| `addCargo` does not merge survivor into bulk | 1668–1677 | pass |
| Digit 2 Jobs | 152, 3424, 3548–3550 | pass |
| Live cap 420 | `save.js` 115–122 | pass |
| `JOB_KINDS` has trade, not passenger | 127 | pass |
| Unique four ids | 1724–1756 | pass |
| Trade dest rebind | 2323–2324 | pass |
| Unique ferry dest stamp | 2396, 2754–2758 | pass |
| `innerHTML` none | grep 0 | pass |
| POD UU 160/240 | `trafficking.js` 8 | pass (do not reopen) |
| `WORLD_FIELDS` `'jobs'` | 78 | pass |
| No `jobs` on `ctx` default | `ctx.js` 123–148 | pass |

Wave 70 / Wave 75 **line numbers** must not be copied into impl PRs. This pack re-cites 2026-08-20 live.

### Contract vs brief

| Topic | Brief | Contract | Winner |
|---|---|---|---|
| Kind | `passenger` | `passenger` | match |
| Slots | 2 | 2 | match |
| Live cap | 420 | 420 (`4+4*N+16`) | match |
| Impl cap | 620 (`4+6*N+16`) | live + `PASSENGER_ROOM` | match |
| Hunt/explore in cap | no | no | match |
| Cargo token | none; hangar needs owner | fail closed; proposed needs owner | match |
| Pay | origin `FERRY_REWARD` 350 | same | match |
| Dest | `otherSystemId` rebind | same; not unique-ferry stamp | match |
| Unique ferry | stay `done` | stay `done` | match |
| `survivor` on jobs | no | drop job if `commodity` present | match (contract stricter, wins) |
| Digit | 2 | 2 | match |

No conflict that requires a brief rewrite. If one appears later, **contract wins**.

### Coverage gaps (impl wave, not this pack)

- No browser / `test:boot` this wave (domain: data).
- PR5 boot pins listed, not landed.
- WAVE4 / WAVE26 / WAVE35 known FAILs must stay unfixed.

### Finding count

| Severity | Open | Resolved in markdown |
|---|---|---|
| 🔴 Blocker | 0 | 0 |
| 🟠 Major | 0 | 4 (cap 220, kind ferry, fronting, sibling rooms) |
| 🟡 Minor | 2 | — |
| 💡 Suggestion | 1 | — |

**Verdict:** design pack is consistent with live code and the trade-brief shape. Safe to freeze. Designer agent not available / not needed (markdown design-only).
