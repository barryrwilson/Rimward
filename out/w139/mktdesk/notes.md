# Wave 139 Mkt01 MARKET desk layout notes

**Verdict:** leftover **REAL**. Name: **TRADE wrap + player-word subtitle**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/Mkt01DeskLayoutDesign.md` and `out/w139/mktdesk/**` except `verify/**`.
- `graph_resolve` for this census+brief: `execute_workflows` → `claude/workflow-code-review`. Applied security / code / UI reviews **self** on the freeze (parent: do not spawn `[designer]`; do not start Vite/Chrome).
- Census live `src/systems/station.js` `renderMarket`, `h()` `textContent`, `tradeFillUnit`, Q/W/A/S, Digit 1 Market, illegal `'trade refused'`.
- Census `src/ui/screens.css` `.screen-panel` `min-width: 560px`, six-column `.market-table`, `.market-actions` no wrap, `.market-fill` nowrap.
- Census `COMMODITIES` in `state.js` (read only).
- Census overlay-policy never writes `flags.paused` (cite only).
- Census `agent-observe.js` `marketBlock` `posted` (cite only; do not claim).
- Census wishlist **318–323** (cite, do not edit). Fable `out/orch-fable/t3/ui-audit.md` as evidence, not live truth.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** write sibling Agent fill / Agent badge paths.

## Why REAL (not CONSUME)

CONSUME needed **both**: TRADE already wrap/fit at 560 px **and** subtitle already player words (buy price / sell price, not fill units).

Fit **is not** live:

- `.market-actions { display: flex; gap: 6px; }` no wrap (`screens.css` **215–218**).
- TRADE min `minmax(10em, 1.7fr)` = 140 px at 14 px (`screens.css` **181**).
- Four padded TRADE buttons ~170–180 px (`station.js` **4853–4856**).

Player words **are not** live:

- `'MARKET — buy and sell fill units'` (`station.js` **4830**).

Q/W/A/S **do** exist. BUY/SELL UU **do** exist. Those are **not** desk layout. Do **not** CONSUME on keyboard-works or fills-honest.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Layout law | wrap `.market-actions` (`flex-wrap: wrap`) |
| TRADE min track | **unchanged** |
| Panel min 560 | **unchanged** |
| Subtitle | `MARKET — buy price and sell price` |
| Q/W/A/S | keep |
| Digit 1 | Market |
| `tradeFillUnit` | unchanged |
| Illegal rows | keep visible |
| Observe fill JSON | do not claim |
| Persist | none |
| `state.js` | read-only |
| Fail-closed | skip unknown; name → key; never throw |

## Later write-set (do not edit now)

- `src/ui/screens.css` `.market-actions` wrap.
- `src/systems/station.js` MARKET subtitle + row skip.
- Do **not** claim `state.js`, `agent-observe.js`, `agent-api.js`, `overlay-policy.js`, `hud.js`, `controls.js`.

## Coupling (do not steal)

- Agent market-fill observe JSON (sibling Wave 139).
- Agent badge layout (sibling Wave 139).
- Archive desk / seed papers on the MARKET pane.
- Wave optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04).
- Agent pad 2B. In-repo LLM.

## Reviews

Security HIGH (XSS names, prototype keys, Agent fill steal, persist mute, overlay pause, uncaught throw on paint) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after wrap-not-raise, subtitle player words, skip, Q/W/A/S kept. UI Blocker/Major **resolved as later mint** (live overflow + jargon stay until PR1).

## Re-review

After freeze (wrap is the one layout law; fail-closed skip named): no new HIGH/CRITICAL. MEDIUM unused `market-head-actions` and missing table semantics documented, not expanded. Did not start Vite/Chrome. Did not write `out/w139/mktdesk/verify/**`.

## Graph

Owner write-set is local files. Did not bind Drive publish. Did not `graph_propose` / `graph_approve`.
