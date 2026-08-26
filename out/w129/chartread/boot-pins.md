# Wave 129 NAV-09 PR1 proposed boot pins

Do **not** land in `scripts/boot-test.mjs` from this worker. Orchestrator / boot owner may add.

Do **not** “fix” known REDMARCH `castMatches` FAILs.

## Keep (must still pass)

| Pin | Probe |
|---|---|
| Dest control | `galaxychart.js` still has `id = 'rw-galaxy-dest'` |
| KeyM | `e.code === 'KeyM'` and `isTypingFocus()` skip still live |
| AP button close | Autopilot click `else` still `setOpen(false)` after `tryEngage` success |
| `showApLive` body | `apLive.textContent = line`; `apLiveUntil = line ? ctx.elapsed + AP_LIVE_LIFE : 0` |
| No `innerHTML` | `!chartSrc.includes('innerHTML')` |
| No pause write | `!/flags\.paused\s*=/.test(chartSrc)` |
| Overlay call only | import `isTypingFocus` / `canOpenPlayCard`; do not own `overlay-policy.js` |
| Hit size | `HIT_CSS_DIAMETER = 24` |
| Digit 0/8/9 | unchanged (this file does not edit `station.js`) |
| Jump | `!chartSrc.includes('jumpRequested')` |
| WAVE85 `noPrevent` | this PR **does not** add `preventDefault(` / `stopPropagation(` (wheel zoom still works; `html` overflow is hidden) |

## Add

```js
{
  const chartSrc = readFileSync(new URL('../src/systems/galaxychart.js', import.meta.url), 'utf8');
  const hudCss = readFileSync(new URL('../src/ui/hud.css', import.meta.url), 'utf8');
  const w129 = {
    destKept: chartSrc.includes("id = 'rw-galaxy-dest'") || chartSrc.includes('id = "rw-galaxy-dest"'),
    zoomIds: chartSrc.includes("id = 'rw-galaxy-zoom-in'")
      && chartSrc.includes("id = 'rw-galaxy-zoom-out'")
      && chartSrc.includes("id = 'rw-galaxy-zoom-reset'"),
    zoomCopy: chartSrc.includes("textContent = 'Zoom in'")
      && chartSrc.includes("textContent = 'Zoom out'")
      && chartSrc.includes("textContent = 'Reset view'"),
    filters: chartSrc.includes("id = 'rw-galaxy-filter-faction'")
      && chartSrc.includes("id = 'rw-galaxy-filter-standing'"),
    itinerary: chartSrc.includes("id = 'rw-galaxy-itinerary'")
      && chartSrc.includes("textContent = 'Itinerary'"),
    dragPx: chartSrc.includes('MAP_DRAG_PX = 4'),
    labelScale: chartSrc.includes('MAP_LABEL_SCALE = 2'),
    hit24: chartSrc.includes('HIT_CSS_DIAMETER = 24'),
    noInner: !chartSrc.includes('innerHTML'),
    noPauseWrite: !/flags\.paused\s*=/.test(chartSrc),
    noJump: !chartSrc.includes('jumpRequested'),
    typing: chartSrc.includes('isTypingFocus()'),
    cssZoom: hudCss.includes('.rw-galaxy-zoom')
      && hudCss.includes('min-height: 24px'),
    cssItin: hudCss.includes('.rw-galaxy-itinerary')
      && hudCss.includes('overflow: auto'),
    zUnchanged: /z-index:\s*30/.test(hudCss.split('.rw-galaxy-chart')[1] || ''),
  };
  console.log('wave129 nav09 chartread:', JSON.stringify(w129));
  if (!Object.values(w129).every(Boolean)) { console.log('WAVE129 NAV-09 CHARTREAD FAIL'); errors++; }
}
```

## WAVE85 `noPrevent`

Leave the existing pin. This PR zooms the SVG `viewBox` on `wheel` without `preventDefault`, so the pin stays green. If a later wave must cancel page scroll, rewrite the pin to allow `wheel` only (do not drop the “no key intercept” intent).
