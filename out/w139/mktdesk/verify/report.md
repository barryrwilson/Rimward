# Wave 139 Mkt01 MARKET desk leftover — verifier report

## Status
CLEAN

## What I tested
- Worker write-set: listed markdown only. No `src/` land in this pack. No `PROGRESS.md`. No wishlist. No sibling `out/w139/badge` / `out/w139/mktfill` from this pack. No `out/w139/mktdesk/verify/**` from the worker.
- Live MARKET pane vs `src/systems/station.js` (subtitle, Q/W/A/S, Digit 1, `h()` `textContent`, `tradeFillUnit`, illegal refusal).
- Live `.market-*` vs `src/ui/screens.css` (panel 560 px, six-column min tracks, `.market-actions` no wrap, `.market-fill` nowrap).
- Contract vs design: leftover **REAL**, named serial **PR1**, one layout law **wrap** (not raise TRADE min).
- Line cites vs live file:line.
- Observe JSON: later write-set does **not** claim `agent-observe.js`. Live `marketBlock` still `posted`.
- MDN: `flex-wrap` initial `nowrap` overflows; `wrap` is the one-dimension overflow fix (no Chrome).
- Did **not** start Vite or Chrome. Did **not** run boot-test.

## Bugs found
None.

## Environmental issues
None. Owner forbade Vite/Chrome. Graph research-and-briefing asked for browser; this verify stayed on disk.

## Evidence

### Worker scope
Untracked pack files:

- `docs/Mkt01DeskLayoutDesign.md`
- `out/w139/mktdesk/current-market-desk-layout-inventory.md`
- `out/w139/mktdesk/shared-contract.md`
- `out/w139/mktdesk/security-review.md`
- `out/w139/mktdesk/code-review.md`
- `out/w139/mktdesk/ui-audit.md`
- `out/w139/mktdesk/notes.md`

Working-tree edits to `src/systems/station.js`, `src/ui/screens.css`, `src/game/agent-observe.js`, `PROGRESS.md`, and `docs/PLAYER-EXPERIENCE-WISHLIST.md` are other / prior work. This leftover did **not** mint wrap or the player-word subtitle. `git diff src/ui/screens.css` adds the six-column grid + `.market-fill` nowrap, **not** `flex-wrap`. `git diff src/systems/station.js` MARKET hunk still paints `'MARKET — buy and sell fill units'`. Wishlist **318–323** still INBOX (cite). `PROGRESS.md` has no `Mkt01` / `mktdesk` string.

### Leftover REAL / PR1 (earned)
Overflow and jargon are both live. CONSUME would be wrong. Named serial is **not** none.

| Hole | Live | Cite |
|---|---|---|
| Subtitle jargon | `'MARKET — buy and sell fill units'` | `station.js` 4830 |
| TRADE actions | `display: flex; gap: 6px;` **no** `flex-wrap` | `screens.css` 215–218 |
| TRADE min | `minmax(10em, 1.7fr)` | `screens.css` 181 |
| Panel floor | `min-width: 560px`; `overflow-y: auto` only | `screens.css` 28–31 |
| Buttons | `+1` `+5` `−1` `−5`; padding `3px 9px` | `station.js` 4853–4856; `screens.css` 220–224 |
| Q/W/A/S | legend + `tryTrade` 1/5 buy/sell | `station.js` 4859, 6296–6300 |

Fit math (code, not browser): content box ≈ `560 − 22 − 22 = 516` px. Six min tracks `32.5em` at 14 px + five 10 px gaps ≈ **505** px. TRADE min `10em` = **140** px. Four padded nowrap buttons exceed that (Fable ~170–180 px; min-content also > 140 px). Raising TRADE min grows the six-min sum past 516 px unless the panel min grows. Wrap is the smaller law. MDN: `flex-wrap: nowrap` overflows; `wrap` moves items to the next line.

### Freeze checks
| Freeze | Result |
|---|---|
| One layout law: wrap `.market-actions` | Contract §0.19 / §0.1. Design deputize matches. No raise-min as required PR1. |
| Subtitle later `'MARKET — buy price and sell price'` | Contract §0.20. `.screen-sub` `text-transform: uppercase` (`screens.css` 45–50). |
| Keep Q/W/A/S | Live `KeyQ`/`KeyW`/`KeyA`/`KeyS` (`station.js` 6296–6300). Not remapped. |
| Digit 1 Market | `DOCK_KEY_SERVICES[0] === 'market'` (`station.js` 189); level-1 Digit `i + 1` (6124–6126). |
| Keep `h()` `textContent` | `station.js` 4544–4548. No `innerHTML` in `station.js`. |
| Do not retune `tradeFillUnit` | Later writers: CSS wrap + subtitle/skip only. Helper 4692–4714 stays. |
| Do not claim observe fill JSON | Contract §1 does not list `agent-observe.js`. Live rows `{ commodity, name, posted, hold, legal }` (258–275). |
| Illegal rows stay | `'trade refused'` (`station.js` 4850–4851). |
| Merge law | Design points at contract; both REAL / PR1 / wrap / same subtitle. No freeze conflict. Contract wins if later drift. |

Residual (not a leftover-law miss): inventory/design say **11** authored keys; live `COMMODITIES` has **12** (`state.js` 350–364). Skip still uses `Object.hasOwn`. Design §2 “PR1 only wraps TRADE and rewords the subtitle” is about fills/keys; the PR1 table still includes fail-closed skip (contract §2).

### Line cites (spot-check)
| Claim | Live |
|---|---|
| Subtitle `station.js` 4830 | `'MARKET — buy and sell fill units'` |
| Heads 4833–4838 | COMMODITY / STATUS / BUY / SELL / HOLD / TRADE |
| `tradeFillUnit` 4692–4714 | qty-1 buy/sell helper |
| BUY/SELL cells 4842–4847 | `` `${buyUnit} UU` `` / `` `${sellUnit} UU` `` |
| `tryTrade` uses helper 4736 / 4745 | yes |
| `h()` 4544–4548 | `textContent` |
| Digit 1 `189`, `6124–6126` | Market first; hot `i + 1` |
| Seed Digit 1 on MARKET 6289–6292 | `armSeedPapers` when visible |
| Level-2 Digit 2–9/0 6302–6313 | other dock services |
| Digit 0 last / shipyard 6258–6265 | yes |
| Legend 4859 | `↑/↓ select · Q/W buy 1/5 · A/S sell 1/5` |
| Archive after notes 4872 | `renderArchiveDesk(...)` |
| `RENDERERS.market` 6082–6083; call 6151 | yes |
| Overlay wipe 6109 | `overlay.textContent = ''` |
| Panel scroll restore 6159 | `panel.scrollTop = scrollY` |
| Seed papers 4795–4826 | `renderSeedPapers` |
| `holdUnits` 1029–1032 | yes |
| `isMarketCommodity` 1043–1045 | `Object.hasOwn(COMMODITIES, key)` |
| `priceOf` 2064–2068 | market path `ctx.world.prices[key] ?? COMMODITIES[key].base` |
| `COMMODITIES` 350–364 | 12 keys, provisions … wakeglass |
| Overlay never writes pause `overlay-policy.js` 4, 196 | comments; no `flags.paused` write |
| Flight KeyQ/W/A/S `controls.js` 50–51 | in `TRACKED` |
| KeyH/J/L/M/P empty in `station.js` | grep empty |
| Observe `market:` 481 | `market: marketBlock(...)` |
| `.screen-sub` 45–51 | uppercase + 0.22em tracking |
| Focus ring 96–99 | 2 px accent outline |
| Colorblind overlay tokens 565–568 | Okabe-Ito `--rw-*` |
| Wishlist INBOX 318–323 | TRADE wrap-or-raise + fill-units subtitle |
| Fable overflow 20–24 | ~170–180 px vs 10em |

### Deputize (not playtested in browser)
- Wrap `.market-actions`; do not grow TRADE min; do not drop 560 px.
- Subtitle player words; keep BUY/SELL UU from `tradeFillUnit`.
- Q still buys 1. Restricted still visible.

## Evidence paths
- Screenshots: none (no Vite/Chrome)
- Logs: none
- Test output: `out/w139/mktdesk/verify/report.md`, `out/w139/mktdesk/verify/write-set.txt`
