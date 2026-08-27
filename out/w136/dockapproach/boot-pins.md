# Wave 136 NAV-10 PR1 — proposed boot pins

Parent merges into `scripts/boot-test.mjs`. Do **not** land this file as a boot run.
Do **not** run full `npm run test:boot` in this worker.

## Source pins (string / regex)

```js
const hud136 = readFileSync(join(here, 'src/systems/hud.js'), 'utf8');
const css136 = readFileSync(join(here, 'src/ui/hud.css'), 'utf8');
const station136 = readFileSync(join(here, 'src/systems/station.js'), 'utf8');
const state136 = readFileSync(join(here, 'src/game/state.js'), 'utf8');
const controls136 = readFileSync(join(here, 'src/systems/controls.js'), 'utf8');

const w136dockapproach = {
  slowVerb: hud136.includes("const DOCK_SLOW_VERB = 'Dock · SLOW — approach under 20 u/s'"),
  slowSpeed: hud136.includes('const DOCK_SLOW_SPEED = 20'),
  localBand: hud136.includes('const DOCK_SLOW_RANGE_MULT = 3')
    && hud136.includes('U.DOCK_RANGE * DOCK_SLOW_RANGE_MULT'),
  promptKeyJ: hud136.includes("pKey = 'J'")
    && /pVerb = \(!skipSlow && Number\.isFinite\(dockSpd\) && dockSpd > DOCK_SLOW_SPEED\)/.test(hud136),
  promptDockFallback: hud136.includes("? DOCK_SLOW_VERB")
    && hud136.includes(": 'Dock';"),
  selfSlowNode: hud136.includes("el('span', 'rw-slow-lamp is-hidden', selfSpeedVal, 'SLOW')"),
  matchStays: hud136.includes("el('span', 'rw-match-lamp is-hidden', value, 'MATCH')"),
  tgtSpeedOnly: /tgtSpeed\.set\(targetSpeedNow\)/.test(hud136)
    && !/tgtSpeed\.set\([^)]*SLOW/.test(hud136),
  noMakeSpeedSlowDefault: !/function makeSpeed\([^)]*\)[\s\S]{0,500}rw-slow-lamp/.test(hud136),
  jumpCopyUntouched: hud136.includes("pVerb = 'Jump to ' + destName"),
  hideJumpOwns: hud136.includes('gate.inZone && !(station && station.inZone)'),
  hideHold: hud136.includes('flags.berthHold')
    && hud136.includes('ctx.flags.berthHold'),
  hideJumping: hud136.includes('gate.jumping'),
  homeInset: hud136.includes('const HOME_EDGE_INSET = 108')
    && hud136.includes('const EDGE_MARGIN = 84'),
  cssSlow: css136.includes('.rw-slow-lamp')
    && css136.includes('.rw-slow-lamp.is-hidden { display: none; }')
    && css136.includes('letter-spacing: 0.04em'),
  cssMatch: css136.includes('.rw-match-lamp')
    && /content:\s*'MATCH'|value, 'MATCH'/.test(hud136),
  hub80: css136.includes('.rw-reticle {')
    && /width:\s*80px/.test(css136.slice(css136.indexOf('.rw-reticle {'), css136.indexOf('.rw-reticle {') + 220)),
  noInnerHtml: !hud136.includes('innerHTML')
    && !hud136.includes('insertAdjacentHTML')
    && !hud136.includes('document.write'),
  noToastSlow: !/pushToast\([^)]*SLOW/.test(hud136),
  noPausedWrite: !/flags\.paused\s*=/.test(hud136),
  noStateWrite: state136.includes('DOCK_RANGE: 45')
    && !state136.includes('DOCK_SLOW'),
  noStationEdit: !station136.includes('rw-slow-lamp')
    && !station136.includes('DOCK_SLOW'),
  keyJStays: controls136.includes('pendingDock')
    && controls136.includes('dockPressed'),
};
```

`hub80` must stay 80×80. Do not grow the reticle.

## Live ctx probes (optional, after a tick)

Park a stub ship at cruise toward `ctx.station.position`.

| Setup | Expect |
|---|---|
| `station.inZone === true`, `!flags.docked`, `ship.speed = 120` | prompt key `J`; verb exact `Dock · SLOW — approach under 20 u/s`; `.rw-slow-lamp` without `is-hidden` on **self** SPD only |
| same, `ship.speed = 20` | verb `Dock`; `.rw-slow-lamp` has `is-hidden` |
| same, `ship.speed = NaN` | verb `Dock`; lamp hidden; no throw |
| `dist = 100` (`<= 135`), speed `120`, `!inZone` | no Dock prompt; self lamp visible `SLOW` |
| `dist = 200`, speed `120` | lamp hidden |
| `gate.inZone && !station.inZone` | Jump copy unchanged; self lamp hidden |
| `flags.docked` or `gate.jumping` or `flags.berthHold` | no SLOW verb; lamp hidden |
| MATCH on + SLOW on | `.rw-match-lamp` text `MATCH`; `.rw-slow-lamp` text `SLOW`; both independent `is-hidden` |
| target rail | no `.rw-slow-lamp`; `tgtSpeed` number only |

Do not assert PHY bounce or 2× snap in this pin set. Those are not PR1.
