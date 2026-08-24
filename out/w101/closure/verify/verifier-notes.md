# Wave 101 TGT-03 closure pack — independent verifier (re-dispatch)

**Domain:** data. No Vite. No product `src/` edits.  
**Date:** 2026-08-23  
**Pack:** `docs/Tgt03ClosureDesign.md`, `out/w101/closure/*`

## Verdict

PASS after re-dispatch. Previous freeze defects (inclusive glyph band, stale AI line, `«-12` format) are closed in MERGE LAW.

## Checklist

| # | Check | Result |
|---|---|---|
| 1 | Inventory DIST cites vs live `hud.js` | **Pass.** 855–857 and 2018–2035 match |
| 2 | Scanner does not gate DIST | **Pass.** `contactsGate` gates the arc only |
| 3 | Contract forbids hub gauge, persist key, Digit steal, innerHTML, SKU/UU | **Pass.** `shared-contract.md` §0 |
| 4 | `hud.js` `innerHTML` | **Pass.** grep 0 |
| 5 | Glyph band vs live contacts | **Pass.** Contract copies exclusive `along < -4` / `along > 4` (`hud.js` 1490–1491). `|along| == 4` → no «/» |
| 6 | AI close-rate cite | **Pass.** `ENVELOPE_CLOSE_RATE = 40` is `npc.js` **112**. Line 111 is `ENVELOPE_CLOSE_DIST = 220` |
| 7 | Authored CLOS format | **Pass.** XOR. Deputize `+N u/s` / `-N u/s` / `0 u/s`. Forbidden `«-12 u/s` |
| 8 | Brief does not steal KeyT/KeyV, Digit 0/8/9, `.rw-contacts`, `.rw-edge-arrow`, 80 px hub | **Pass** |
| 9 | CLOS is core; fail-closed on non-ship | **Pass** |

## Live DIST (re-grep)

Unchanged: `hud.js` 855–857, 2018–2035.

## Live contacts glyph (re-grep)

`hud.js` 1490–1491:

```
if (along < -CONTACT_CLOSE_FLOOR) closeState = 'in';
else if (along > CONTACT_CLOSE_FLOOR) closeState = 'out';
```

Contract §1.1 / §1.3 / §9.3 copy those exclusive tests. Do not invent inclusive `>=`.

## Live NPC constant (re-grep)

`npc.js` 111 `ENVELOPE_CLOSE_DIST = 220`.  
`npc.js` 112 `ENVELOPE_CLOSE_RATE = 40`.

## Format pin

Worker `ui-audit.md` pins `+N` / `-N` / `0`. Glyph-only is owner override and must stay exclusive.

## Historical defects (closed)

1. MERGE LAW used inclusive `<=` / `>=` while live Mk II is exclusive.
2. Pack cited the AI rate on the `ENVELOPE_CLOSE_DIST` line.
3. Signed integer plus « prefix had no authored string.

## Passes (do not reopen)

Hub empty, DIST live, no SKU/UU/Digit, no KeyT/KeyV steal, no `src/` in this pack.
