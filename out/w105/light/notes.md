# Wave 105 — Beautiful light (young wayfinder)

**Status:** Shipped. Wave 95 GLB kept under `wave95-keep/` and not restored.

## Glance

- Dropped `fold_crease` box courses. Wing-root muscle is two buried ellipsoids.
- One fitted pearl canopy became two low overlapping nacre lofts (brow + shoulder).
- Eye spheres became flat snout lobes. Throat is a belly loft, not a turret pod.
- Soft wide crest. Paddle wings (tip chord 1.35, thick 0.16). Crown stays 8 filaments forward.
- Not a player CPU manta clone: crown-forward, compact Z, short tail, cephalic pads.

## Bake

- Blender 5.2.0 LTS (`fbe6228777e7`)
- `blender -b -P scripts/build-ship-assets.py -- beautiful --class=light`
- `node scripts/compress-ship-assets.mjs beautiful/light`
- Did not bake other classes. Did not edit `src/` or shared organs.

## Gates (this class)

```
beautiful     light      verts= 18620 size=7.8(Z) len/beam=1.14 ht/len=0.42 beam/len=0.88 cover=82.0%
probe-ship-islands: ONE CONNECTED BODY
lod0/1/2 meshopt=true
```

Span 7.8 inside 4.08–9.52. Wave 95 was 8.0. Wide manta: len/beam 1.14 kept (owner: do not force 1.15). Cover 82% ≥ 80%. Verts in 4000–25000. Light 7.8 vs ace 7.7 uses live 15% slack.

## Stills

- `out/w105/light/light-render.png`
- `out/w105/light/beautiful-shape.png` (faction sheet; light is top row)
- `out/w105/light/beautiful-render.png`

## Preserve

- No `src/` writes. Player `makeLivingHull` untouched.
- GPU swim / glow mesh stay on live `ship-assets.js`.
- Fail-closed copies: `out/w105/light/wave95-keep/`
