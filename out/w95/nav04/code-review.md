## Code Review: NAV-04 hover design freeze

### Summary

Markdown-only freeze matches live chart, `standingRead`, and `RANK_LADDER` at `state.js` 707–717. No Blocker/Major remain after the contract forbids plot-on-hover, a second persist key, local-standing invention, and mystery reads.

### What's done well

- Inventory cites **live** `galaxychart.js` (click 540–548, no hover, `veil` in `AUTHORED_IDS`) instead of Wave 84 “no node click”.
- Canonical standing path is `standingRead` + `rankFor`, not `dockReputation` and not a new ladder.
- Digit 9 format is copied from `station.js` 5675–5676, not the dock-root ` rep` suffix.
- Wave 94 `veil` / Unknowables is an explicit controlled banner.
- NAV-01/02/03 stay closed: hover must not write `world.nav`.
- Serial PR plan is later and ordered (model pins → DOM → flicker → freshness).

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None remaining. Prevented in freeze:

| Risk | Freeze |
|---|---|
| Hover calls `plotRoute` | Contract §2.1 / §5 |
| New persist key | §0.3 / §1.1 |
| `RANK_LADDER` stale 672 | Inventory + brief use **707–717** |
| Local standing `0` | Omit row |
| Contested/Unclaimed invented | Do not print |
| Mystery on chart | §0.8 |
| `state.js` write | §0.2 |

#### 🟡 Minor

##### C1: `data-faction` vs allowlist

**Location:** `galaxychart.js` 256 `sys.faction ?? 'independent'`; contract §3.2  
**Issue:** The SVG attribute already collapses missing faction to independent. If impl reads `data-faction` instead of `SYSTEMS[id].faction` + `FACTIONS` hasOwn, a bad key would show Independent.  
**Fix:** `hoverModel` reads `SYSTEMS[id].faction` only. Documented in the brief §5.

##### C2: `rankFor` on non-finite

**Location:** `state.js` 715–717  
**Issue:** Non-finite `rep` fails every `>=` and returns Marked.  
**Fix:** `standingRead` already returns finite `0`. Do not call `rankFor` on raw bag values.

#### 💡 Suggestion

- Export `hoverModel` from a tiny `chart-hover.js` so PR1 pins stay jsdom-free.
- When standing text is unchanged, skip `textContent` writes to keep `aria-live` quiet (already in contract §4.2).

### Consistency with live code

| Claim | Live |
|---|---|
| No hover today | grep 0 |
| Click plots | `galaxychart.js` 540–548 |
| `standingRead` | `data-trade.js` 72–81 |
| Digit 9 line | `station.js` 5675–5676 |
| No local standing | restitution uses faction key |
| No contested field | wishlist only |
| No gamepad | grep 0 in `src/` |
| `WORLD_FIELDS` has `nav` + `reputation` | `save.js` 76–100 |
| Chart never reads mystery | header 16–21 |
