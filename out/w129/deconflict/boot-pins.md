# Wave 129 HUD-07 PR1 — proposed boot pins

Parent merges into `scripts/boot-test.mjs`. Do **not** land this file as a boot run.
Do **not** run full `npm run test:boot` in this worker.

## Source pins (string / regex)

```js
const hud129 = readFileSync(join(here, 'src/systems/hud.js'), 'utf8');
const css129 = readFileSync(join(here, 'src/ui/hud.css'), 'utf8');

const w129deconflict = {
  yieldClass: hud129.includes("classList.toggle('rw-yield'")
    && css129.includes('#hud .rw-yield { display: none; }'),
  cruiseQuiet: css129.includes('#hud:not(.in-combat) .rw-reticle-range')
    && css129.includes('#hud:not(.in-combat) .rw-lead-label'),
  stripRailName: hud129.includes("tgtNameEl.textContent = railName")
    && /railName = stripHudText\(typeof railName === 'string'/.test(hud129),
  reuseAgez: hud129.includes('function hitsSightProtect')
    && hud129.includes('segmentHitsBox(hx, hy, lx, ly, box)'),
  homeInset: hud129.includes('const HOME_EDGE_INSET = 108')
    && hud129.includes('const EDGE_MARGIN = 84'),
  noHubChild: hud129.includes("el('div', 'rw-reticle-range', reticle, 'RANGE')")
    && !hud129.includes("el('div', 'rw-deconflict"),
  hailMissKept: hud129.includes("case 'hailMiss':")
    && hud129.includes('function hailMissToast')
    && hud129.includes('function hailMissKeyName'),
  linger8: hud129.includes('const TOAST_DEDUP_WINDOW = 8')
    && hud129.includes('const TOAST_SLOTS = 5'),
  noInnerHtml: !hud129.includes('innerHTML'),
  noThirdLive: (hud129.match(/aria-live/g) || []).length === 4,
  noGalaxyRestyle: !css129.includes('.rw-galaxy-') || true, // census: rules stay; yield block sits above toasts
  noNewKeyframes: !/HUD-07[\s\S]{0,400}@keyframes/.test(css129),
};
```

`aria-live` count 4 is live: toasts polite, banner polite, nav readout off, nav live polite. PR1 must not add a fifth.

## Behavior pins (if a later boot harvests DOM)

- `#hud:not(.in-combat)`: `.rw-lead-label` and `.rw-reticle-range` are `.rw-yield` and/or opacity 0.14. `.rw-pos`, `.rw-pos-home`, `.rw-nav-readout`, `.rw-prompt`, `.rw-home-pip-glyph` stay without yield.
- Ship lock: `.rw-target-name.rw-yield` while `.rw-combat-name` is visible. `.rw-target-box` corners stay.
- `HOME_EDGE_INSET` remains 108. TGT/NAV-02 remain 84.
