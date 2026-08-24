# Wave 101 TGT-03 closure pack — independent verifier (recheck)

**Domain:** data. No Vite. No product `src/` edits.  
**Date:** 2026-08-23  
**Pack:** `docs/Tgt03ClosureDesign.md`, `out/w101/closure/*`

## Verdict

CLEAN. The three freeze defects stay closed in MERGE LAW and the brief.

## Recheck of previous freeze bugs

| # | Freeze | Result |
|---|---|---|
| 1 | MERGE LAW glyph band exclusive `<` / `>` | **Pass.** Live Mk II: `hud.js` 1490–1491 `along < -CONTACT_CLOSE_FLOOR` / `along > CONTACT_CLOSE_FLOOR`. Contract §1.1 / §1.3 / §9.3 copy those tests. Brief table + Q4 copy exclusive. Pack MERGE LAW has **no** `along <=` / `along >=`. At `|along| == 4` live paints no «/» (`closeState` stays `''`). |
| 2 | `ENVELOPE_CLOSE_RATE` cite | **Pass.** Live `npc.js` 111 = `ENVELOPE_CLOSE_DIST = 220`. Live `npc.js` 112 = `ENVELOPE_CLOSE_RATE = 40`. Contract §1.2 / §9.5, inventory §96 / §231, brief table line 77, brief Q4: **112**. No pack cite puts RATE on 111. |
| 3 | CLOS format XOR | **Pass.** Deputize `+N u/s` / `-N u/s` / `0 u/s`. Forbidden `«-12 u/s` by name. Rail **no** «/». Glyph-only is owner override only and stays exclusive. |

## Extra confirm

| # | Check | Result |
|---|---|---|
| A | DIST cites | **Pass.** Create `hud.js` 855–857 label `DIST`. Write `hud.js` 2018–2035 `distU + ' u'`. Comment 2018 “standard, not gated”. |
| B | Scanner does not gate DIST | **Pass.** `contactsGate` (`contacts-gate.js` 18–19) gates the arc (`hud.js` 1385–1389). DIST write is on `shipTgt` rail, not inside `showArc`. |
| C | Hub / Digit / persist / innerHTML | **Pass.** Hub 80×80 `hud.css` 184–191. Digit 0 shipyard `station.js` 186 + 5920–5922. Digit 8/9 dock = launch/epics (`DOCK_KEY_SERVICES` index 7/8). Outfit 8/9 papers `station.js` 5983–5985. `WORLD_FIELDS` (`save.js` 76–101) has no `closure` / `tgtRate`. `innerHTML` in `hud.js` = **0**. Contract §0 forbids hub child, persist key, Digit steal, `innerHTML`, SKU/UU. |
| D | No `src/` in this pack | **Pass.** Pack paths are untracked markdown: `docs/Tgt03ClosureDesign.md` + `out/w101/closure/`. Pack dir has no `.js`. Workspace dirty `src/` files are **not** this pack. |

## Live grep (recheck)

`hud.js` 75: `CONTACT_CLOSE_FLOOR = 4`.  
`hud.js` 1490–1491:

```
if (along < -CONTACT_CLOSE_FLOOR) closeState = 'in';
else if (along > CONTACT_CLOSE_FLOOR) closeState = 'out';
```

`hud.js` 1497: `'«'` / `'»'` / `''`. Equal 4 → empty.  
`npc.js` 111–112: DIST then RATE.

## Residual wording (not a freeze fail)

`shared-contract.md` §0.8 still says CLOS may include “optional static «/» chars” (textContent vs HTML). §1.1 XOR still forbids rail «/» on the deputize. Later serial must obey §1.1, not the older innerHTML sentence.

## Passes (do not reopen)

Hub empty. DIST live and ungated. No SKU/UU/Digit. No KeyT/KeyV steal. Exclusive glyph band. RATE cite 112. XOR signed format. No Vite. No product `src/` from this pack.
