# station.js overlay keydown — verify (w133 PR4)

Verdict: **CLEAN**

Source-only. Did not run `npm run test:boot`. No process started.

Graph: `graph_resolve` → `proceed_unmodeled` (`r-mtafec8o-b3142df0`). No binding workflow.

## Checks

| Item | Result | Evidence |
|---|---|---|
| Import `./key-code.js` | PASS | `src/systems/station.js:24` `import { decodeKeyCode } from './key-code.js';` |
| Overlay keydown does not use raw `e.code` | PASS | Listener `6164–6269`. Line `6166`: `const code = decodeKeyCode(e)`. File has no `e.code` / `e.key`. |
| Digit0 / Digit8 / Digit9 paths exist | PASS | See paths below. Numeric decode of `code.slice(5)`, not string literals `Digit0`/`Digit8`/`Digit9`. Meaning matches prior `e.code` branch. |
| No overlay HTML rewrite | PASS | Overlay still `document.createElement` + `h()`/`btn()` (`4430–4433`, `6018–6054`). No `innerHTML`/`outerHTML`. Git diff vs HEAD does not change overlay markup. |
| Do not run `test:boot` | PASS | Not run. |

## Digit 0 / 8 / 9 meaning (unchanged)

`DOCK_KEY_SERVICES` (`189`): market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard.

- **Digit0** (`d === 0`): last dock service (`shipyard`). Level 1 (`6176–6180`). Level 2 market while docked (`6221–6225`).
- **Digit8** level 1: `d - 1 === 7` → `launch`. Market level 2: `d >= 2 && d <= 9` (`6227–6230`). Outfitting level 2: `n === 8` → `armOutfitPapers` (`6255–6258`).
- **Digit9** level 1: `d - 1 === 8` → `epics` (Standing). Market level 2: same `2–9` band. Outfitting: `n === 9` → `armOutfitPapers`.

Empty decode (`''`) fails `Escape` / `Digit*` / `Key*` checks. No extra early return in this listener.

## Diff note (out of this checklist)

Uncommitted `station.js` also adds `ctx.stationDesk` and boolean returns on feed/repair/trade/acceptJob. Those hunks do not rewrite overlay HTML and do not change Digit 0/8/9 branches.

## Processes

None started. None to stop.
