# WAVE140 MKTFILL verify notes

**Status:** CLEAN

Did not run `npm run test:boot`. Did not edit `src/`. Did not start Vite or Chrome.

## Commands

### `node scripts/agent-api-hardening-test.mjs` (cwd `C:\Projects\WebSim`)

Exit 0. All pins true. Excerpt:

```
ok market omitted off desk
ok market block when service market
ok market fill omitted without peekFillUnit
ok market fillBuy from peekFillUnit
ok market fill omitted when peek non-finite
ok market peekFillUnit throw omit fill
ok jobs empty undocked
ok selectTarget docked
ok hailResolve missing api no-service
ok hailResolve closed
ok restore does not clear optIn
ok restore does not empty ring
AGENT API HARDENING PASS
```

Confirmed pins:

- `posted === 100` remains on market block, omit-without-peek, fill-with-peek, NaN omit, throw omit.
- omit-without-peek: no `fillBuy` / `fillSell` keys.
- fill-with-peek: `fillBuy === 125`, `fillSell === 80`, `posted === 100`.

### Isolated extra pins

`node out/w140/mktfill/verify/extra-pins.mjs`

Exit 0. Excerpt:

```
ok peekFill no desk.trade
ok peekFillUnit only tradeFillUnit
ok reservedName skip in marketBlock
ok Object.hasOwn COMMODITIES in marketBlock
ok no for-in world.prices
ok TRADE offset 5
ok isolated posted 100 with fill
ok isolated peekFill never calls trade
ok isolated sell Infinity omits fillSell keeps fillBuy
ok isolated Infinity omits both fill keys
ok reservedName constructor
ok isolated reservedName skip constructor row
EXTRA PINS PASS
```

Reserved-name inject used a process-local `COMMODITIES.constructor` assignment and restored it in `finally`. No production save was written.

## Static review (read only)

### `peekFill` (`src/game/agent-observe.js` 259–269)

- Calls `ctx.stationDesk.peekFillUnit` only.
- Does not call `desk.trade` or `tryTrade`.
- Missing peek / non-function / non-finite / throw → `null` (caller omits keys).

### `marketBlock` (`src/game/agent-observe.js` 271–299)

- `Object.keys(COMMODITIES)` index loop (not `for-in` on `world.prices`).
- `reservedName(commodity)` skip.
- `Object.hasOwn(COMMODITIES, commodity)`.
- Always sets `posted`. Adds `fillBuy` / `fillSell` only when peek returns a finite number.

### `peekFillUnit` (`src/systems/station.js` 6383–6390)

- `try { return tradeFillUnit(key, buying); } catch { return undefined; }`
- No `tryTrade`, no credit/cargo debit.
- Exposed on `ctx.stationDesk` bag (`peekFillUnit` next to `peekService`).

### `tradeFillUnit` (`src/systems/station.js` 4692–4714)

- Read-only fill math (`Math.round` of price × multipliers).
- Debit lives in `tryTrade` (4735–4756), not in peek.

### TRADE offset 5 (grep `scripts/boot-test.mjs`, not executed)

- Line 2809 comment: TRADE at offset 5.
- Line 2811: `const MARKET_CELL_TRADE = 5;`
- Wave 140 pin uses `MARKET_CELL_TRADE === 5`.

## Ports / processes

Verifier started no Vite, no Chrome, no CDP.

`netstat -ano | findstr "5175 9421"`:

```
  TCP    127.0.0.1:55175        127.0.0.1:65457        TIME_WAIT       0
```

No LISTENING on 5175 or 9421. 55175 is unrelated TIME_WAIT.

## Not flagged

Pre-existing WAVE127/132 boot fails. REDMARCH. `boot-test.mjs` was grepped only.
