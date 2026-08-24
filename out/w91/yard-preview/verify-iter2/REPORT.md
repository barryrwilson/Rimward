## Status
CLEAN

## What I tested
Vite on `127.0.0.1:5177`. Title skip + clear save. Jump to `bt_cradle`, dock, Digit 0 shipyard, Digit 2 Yard. Port 5173 was left running.

- Beautiful Ones living light / cutter / heavy in 128×84 tiles. Pixel occupancy vs background `0x070c14` (threshold 18). BBox of occupied pixels. 16×10 RMSE.
- Digit 5 Confirm papers on heavy: same world scale, 168×108 canvas, living manta (not a zoomed light).
- `ctx.settings.reducedMotion = true`: canvas `toDataURL` identical after 900 ms. Full-page shots `04-reduced-a.png` / `04-reduced-b.png` were taken while freeze was on.
- Launch, jump to freehold (start system), dock, Yard: plated GLB silhouettes, not grey fallback blobs. Light vs heavy size cue.
- Console: 0 errors, 0 page errors, 0 yard-preview errors.

### Living occupancy (128×84 buffer)
| class  | occ px | occFrac | bbox w×h | bbox area |
| light  | 49     | 0.0046  | 12×6     | 72        |
| cutter | 126    | 0.0117  | 21×8     | 168       |
| heavy  | 395    | 0.0367  | 34×16    | 544       |

Heavy / light occupancy = 7.978. Heavy / light bbox area = 7.556. Cutter bbox is longer (21 vs 12). Light vs heavy 16×10 RMSE = 19.799 (was 1.65 in iter 1).

### Confirm heavy
occFrac 0.0362 (matches list heavy 0.0367). BBox 43×21 on 168×108. Not a zoomed light (confirm vs light occ ratio 7.87).

### Freehold plated occupancy
| class     | occ px | occFrac | bbox w×h | bbox area |
| light     | 110    | 0.0102  | 20×9     | 180       |
| cutter    | 215    | 0.0200  | 31×12    | 372       |
| heavy     | 821    | 0.0764  | 49×26    | 1274      |
| frigate   | 515    | 0.0479  | 46×23    | 1058      |
| freighter | 309    | 0.0287  | 49×12    | 588       |
| ace       | 72     | 0.0067  | 19×7     | 133       |

Heavy / light occupancy = 7.49. GLB contrast > 190, greyFrac ≤ 0.008. No blob.

Frigate and freighter use their own span (fill their tiles; they do not share light scale). Ace vs light RMSE 3.357 is class-near on the shared light–heavy span, not a same-size fill-to-fit fail.

## Bugs found
None.

## Environmental issues
None. One Canvas2D `willReadFrequently` warning came from verifier `getImageData`, not from `yard-preview.js`.

## Evidence paths
- Screenshots: `out/w91/yard-preview/verify-iter2/01-dock-cradle.png`, `02-yard-living.png`, `03-confirm-heavy.png`, `04-reduced-a.png`, `04-reduced-b.png`, `05-after-cancel.png`, `06-plated-early.png`, `07-plated-ready.png`
- Crops: `crop-living-{light,cutter,heavy}.png`, `crop-confirm-heavy-confirm.png`, `crop-plated-{light,cutter,heavy,freighter,ace,frigate}.png`
- Logs: `results.json`, `browser-console.txt`, `pw-yard-preview.js`
