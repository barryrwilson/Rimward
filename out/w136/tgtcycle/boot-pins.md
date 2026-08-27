# Wave 136 TGT-07 PR1 — proposed boot pins

Parent may merge into `scripts/boot-test.mjs`. Do **not** land this file as a boot run.
Do **not** run full `npm run test:boot` in this worker.

## Source pins (string / regex)

```js
const fs = require('fs');
const path = require('path');
const ctl136 = fs.readFileSync(path.join(here, 'src/systems/controls.js'), 'utf8');
const ctx136 = fs.readFileSync(path.join(here, 'src/core/ctx.js'), 'utf8');

const w136tgtcycle = {
  helpLine: ctl136.includes("'T — cycle target (hostiles first in combat)'")
    && !ctl136.includes("'T — cycle target',"),
  hostileFn: ctl136.includes('function isCycleHostile(ref)')
    && ctl136.includes('ref.ai && ref.ai.intent === true'),
  gateNotCombatFlag: ctl136.includes('function cycleTarget(ctx)')
    && !/function cycleTarget[\s\S]{0,900}flags\.combat/.test(ctl136),
  gatedSort: ctl136.includes('const ha = isCycleHostile(a && a.ref) ? 0 : 1')
    && ctl136.includes('cands.sort((a, b) => a.d2 - b.d2)'),
  wrapLive: ctl136.includes('cands[(idx + 1) % cands.length].ref'),
  oneWalk: ctl136.includes('for (const s of ships)')
    && !ctl136.includes('for (const s in ships)')
    && !ctl136.includes('for (const k in ctx.ships)'),
  noInnerHtml: !ctl136.includes('innerHTML'),
  noNewTracked: ctl136.includes("'KeyT', 'KeyH', 'KeyC', 'KeyX', 'KeyV', 'KeyN', 'KeyK', 'KeyJ'")
    && !ctl136.includes('targetAttacker')
    && !ctl136.includes('KeyY'),
  ctxComment: ctx136.includes('targetPressed: false, // edge: T (cycle; hostiles first when one is in envelope)'),
  noClassPierce: !/function isCycleHostile[\s\S]{0,400}classKey/.test(ctl136)
    && !/function isCycleHostile[\s\S]{0,400}coverClass/.test(ctl136),
};
```

## Synthetic cand-sort probe (idea; do not require in this wave)

Replica of `isCycleHostile` + gated `cands.sort` + wrap. No Three.js. No Vite.

1. Three ships `d2` 20 / 40 / 59. Only 59 has `ai.intent === true`. Current lock `null`. First cycle = the 59 hull.
2. Same distances, all `intent` false or missing. First cycle = d2 20.
3. Group-3 rock at d2 10 plus hostile at 59. Rock never first when gated. Rock never `isCycleHostile`.
4. Unrevealed Q-ship: `state.coverClass` / `classKey` present, `ai.intent === true`. Ranks hostile. Sort must not read class fields.
5. Destroyed / missing `ai` / `lockKind: 'station'` / throwy `ai` getter → not hostile; `cycleTarget` must not throw.
6. `idx === -1` (empty lock) → `cands[0]` after sort (nearest hostile when gated).

Owner harvest: a later boot wave may paste the replica into `scripts/boot-test.mjs`. This worker does not edit that file.
