## Status
BUGS_FOUND

## What I tested
Vite on 127.0.0.1:5176. Title skip + fresh save. Jump to bt_cradle, dock, Digit 0 shipyard, Digit 2 Yard.

- Each Beautiful Ones offer row has `.shipyard-preview` + `.shipyard-preview-canvas`.
- Living light / cutter / heavy crops and 16×10 RMSE.
- Digit 5 Confirm papers for heavy: preview stays, label heavy, canvas 168×108.
- `ctx.settings.reducedMotion = true`: canvas `toDataURL` identical after 850 ms. Restored to false.
- Esc cancel. Digit 3 arms light papers. Digit 1 Hangar, Digit 2 Yard.
- Jump to freehold (start system), dock, Yard: plated GLB silhouettes, not living blobs.
- Confirm papers buy heavy: credits 100000 → 82000, hangar gains `hull_heavy_1`, mounted stays `hull_starter` / light.
- Hangar ↔ Yard six times: max 3 preview canvases, max 1 offscreen WebGL canvas (`left: -4096px`). Hangar has 0 of each (dispose).
- Console: 0 errors, 0 warnings. Port 5173 was left running.

## Bugs found
### P3 — Living light and heavy are hard to tell apart
`frameObject` in `src/systems/yard-preview.js` fits each mesh to the same 128×84 tile. `livingRestScale` is lost. Only `livingSilhouette` remains.

- Cutter (`x: 0.88, z: 1.16`) is clearly longer and slimmer.
- Heavy (`x: 1.10, y: 1.32`) vs light identity is a few pixels of thickness.
- 16×10 RMSE light vs heavy = 1.65; light vs cutter = 8.58; cutter vs heavy = 8.31.

Player can split cutter from the other two. Light vs heavy in the list is easy to mix. Confirm-heavy preview matches the living manta, not a plated hull.

## Environmental issues
None. Grey fallback box did not appear on Freehold; plated assets were already primed, so the GLB showed on the first Yard paint.

## Evidence
- Screenshots: `out/w91/yard-preview/verify/01-dock-cradle.png`, `02-yard-living.png`, `03-confirm-heavy.png`, `04-reduced-a.png`, `04-reduced-b.png`, `05-after-cancel.png`, `06-plated-early.png`, `07-plated-ready.png`, `08-after-buy.png`
- Crops: `crop-living-{light,cutter,heavy}.png`, `crop-confirm-heavy.png`, `crop-plated-{light,cutter,heavy}.png`
- Logs: `results.json`, `browser-console.txt`, `pw-yard-preview.js`
- Freeze proof: in-page `toDataURL` match at reducedMotion (not the 04-a/b full-page shots; those ran after restore)
