# Code Review: SHP remaining catalog leftover (Wave 115)

Design-only. Inventory cites live `LIVING_STOCK` six keys including `frigate` (`shipyard.js` 29), `CORE_STOCK` six (`shipyard.js` 28), Digit 0 shipyard (`station.js` 188, 6100–6102), `HANGAR_CAP` 8 (`hangar.js` 27), `MOUNT_TABLE` (`state.js` 66–73), `YARD_LIST_UU` / `MIN_REP` (`shipyard.js` 16–23, 64–71). MERGE LAW deputizes **CONSUME** with remaining serial **none**, without `state.js` write, without a seventh class, without a new `WEAPONS` id. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Design-doc checklist folded in. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is **catalog consume**, not a missing frigate SKU, not kit mutate, not HUD-02. Wishlist SHP-01 omit-frigate is named **stale**. Independent / Hollow empty catalogs are named **Wave 64/67 omit**, not a hole to fill. First serial is **none**. Digit 0/8/9 and `state.js` / no-new-key freezes sit in MERGE LAW. Inventory line numbers match Wave 115 live `src/`.

### What's done well

- Code-wins census: living frigate buy, plated frigate buy, hangar cap 8, Digit 0, SHP-03 guns, Wave 94 `POWER` (not mount ledger) dropped from “remaining.”
- Correctly refuses to restore Wave 86 omit against live `LIVING_STOCK`.
- Correctly refuses a seventh class and new `WEAPONS` id (Wave 112 §1 / §4).
- Independent / Hollow empty documented with live `YARD_STOCK` miss + `yardStockFor` `[]`, not invented as a fill-SKU.
- Kit mutate left in BIO-02 omit; no owner successor file cited because none exists.
- Sibling HUD packs named as steal-forbidden paths.
- Fail-closed table matches live empty catalog / `No sale.` / cap-8 / `'busy'`.

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | CONSUME; serial none | §0.1 remaining serial none | Match |
| Living frigate | Wave 94 live | §0.8 do not strip | Match |
| Seventh class | forbidden | §0.5 / §0.8 | Match |
| New `WEAPONS` | forbidden | §0.14 | Match |
| Mount power ledger | out | §0.13 | Match |
| Kit mutate | omit | §0.11 | Match |
| Independent / Hollow | omit | §0.10 | Match |
| UU retune | forbidden | §0.15 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| New persist key | no | §0.6 | Match |
| `src/` this wave | no | §0.1 / §4 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist / BIO docs still say omit living frigate

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` ~742; stale comments in older BIO briefs (cite-only).

**Issue:** Copy drift can bait a later worker. This leftover is allowed to **cite** that drift, not edit those files (scope).

**Fix:** None in this write-set. Contract + inventory already mark the line **STALE**.

**Status:** accepted; out of scope to edit wishlist.

#### 🟡 Minor: `YARD_LIST_UU` object key order lists `ace` before `freighter`

**Location:** `shipyard.js` 16–23 vs Wave 112 table 8000/11000/20000/24000/28000/80000.

**Issue:** Values match (ace 28000, freighter 24000). A naive “rewrite the object in Wave 112 order” would be a noisy non-fix.

**Fix:** Do not reorder as leftover work. Values are the law.

**Status:** documented; consume.

#### 💡 Suggestion: WAVE catalog pin names stay in `scripts/boot-test.mjs`

**Location:** historical WAVE64 / WAVE65 / WAVE67 / WAVE94 pins.

**Issue:** This worker must not edit the harness. Contract §0.17 / §0.21 already honor pins.

**Status:** honor, do not invert.

### Verdict

**Approve** as markdown consume freeze. No Blocker/Major. Remaining serial **none** is supported by live six-key `LIVING_STOCK` including `frigate`.
