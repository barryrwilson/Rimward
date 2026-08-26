# Wave 129 Hail02 PR1 — proposed boot pins

Parent merges into `scripts/boot-test.mjs`. Do **not** land this file as a boot run.
Do **not** run full `npm run test:boot` in this worker.

## Source pins (string / regex)

```js
const hail129 = readFileSync(join(here, 'src/systems/hail.js'), 'utf8');
const hud129 = readFileSync(join(here, 'src/systems/hud.js'), 'utf8');
const ctx129 = readFileSync(join(here, 'src/core/ctx.js'), 'utf8');
const npc129 = readFileSync(join(here, 'src/systems/npc.js'), 'utf8');
const agent129 = readFileSync(join(here, 'src/systems/agent-api.js'), 'utf8');
const controls129 = readFileSync(join(here, 'src/systems/controls.js'), 'utf8');

const w129hailmiss = {
  emitHelper: hail129.includes('export function emitHailMiss')
    && hail129.includes("ctx.emit('hailMiss', payload)"),
  primitivesOnly: hail129.includes('const payload = { name, verb, reason }')
    && !/emit\('hailMiss'[\s\S]{0,200}ship:/.test(hail129),
  authoredTokens: hail129.includes("'overlay-chart'")
    && hail129.includes("'overlay-berth'")
    && hail129.includes("'dock-range'")
    && hail129.includes("'jump-zone'")
    && hail129.includes("'no-hail'"),
  ctxComment: ctx129.includes("'hailMiss' { name, verb, reason, dist }"),
  hudBranch: hud129.includes("case 'hailMiss':")
    && hud129.includes('function hailMissToast')
    && hud129.includes("cls: 'warn'")
    && hud129.includes('warn|hailmiss|'),
  lingerKeyNoDist: hud129.includes('`warn|hailmiss|${verb}|${reason}|${keyName}`')
    && hud129.includes('out.length < 48'),
  textContent: hud129.includes('slot.el.textContent = text')
    && !hail129.includes('innerHTML')
    && !/hailMiss[\s\S]{0,800}innerHTML/.test(hud129),
  noPause: !/flags\.paused\s*=/.test(hail129),
  noFearOnMiss: !/emitHailMiss[\s\S]{0,400}bumpFear/.test(hail129),
  noAgentHail: !agent129.includes("act({ name: 'hail'")
    && !hail129.includes("act({ name: 'hail'"),
  noControlsRemap: controls129.includes('hailPressed')
    && controls129.includes('dockPressed'),
  hail01timer: /const DEMAND_SECONDS = 20/.test(hail129),
  toastSlots: hud129.includes('const TOAST_SLOTS = 5')
    && hud129.includes('const TOAST_DEDUP_WINDOW = 8'),
  promptUntouched: hud129.includes("pVerb = 'Hail — dead in space'")
    && hud129.includes("pKey = 'H'; pVerb = 'Hail'"),
  noNpcHailPressed: !npc129.includes('hailPressed'),
};
```

## Runtime pins (after origin pick, one fly tick)

1. `ctx.input.hailPressed = true` with `ctx.targets.current = null` → one `'hailMiss'` `{ name: 'No lock', verb: 'hail', reason: 'none' }`, no `ship`, no `'fearChanged'`.
2. Disabled hull `dist > U.TARGET_RANGE` + KeyH → `{ verb: 'salvage', reason: 'range', dist: finite int }`. Same hull `dist <= 600` → `'hailOpened'` salvage, **no** `'hailMiss'`.
3. Live friendly lock + KeyH → `{ verb: 'hail', reason: 'no-hail' }`. `ctx.world.fear` unchanged.
4. `flags.chartOpen === true` + KeyH → `{ reason: 'overlay-chart' }`. Chart stays open. `flags.paused` stays false.
5. KeyJ leftover `dockPressed` far from pad (and nearer pad than gate) → `{ verb: 'dock', reason: 'dock-range' }`. Nearer gate, not in zone → `{ verb: 'jump', reason: 'jump-zone' }`. `jumpRequested` / `'No passage.'` / `flags.docked` frames emit **no** hailMiss.
6. HUD toast key shape `warn|hailmiss|{verb}|{reason}|{keyName}` has **no** distance field. Copy uses em dash ` — `.

## Honor

- Hail ports if a live probe is added later: Vite **5173**, CDP **9410** only. Kill the tree after.
- Do not “fix” REDMARCH `castMatches`.
