# Wave 106 — Beautiful heavy (humpback whale shieldback)

**Class:** `beautiful/heavy`. New body plan. Old manta shield-fin file replaced.

## Body plan

Humpback whale. Dense fusiform. Blunt head toward -Z. Deep thorax. Horizontal
fluke. Long thin pectorals (style `humpback`) are the outline-breaker.

Not a manta (no raised shield walls, no wing pairs).
Not a shark (no triangular dorsal, no vertical caudal).
Not a blue whale (not extreme length, not tiny pectorals).

## Calls

- `sf.grown_loft` — indigo body
- `an.whale_pectoral(..., style='humpback')` — both flanks, always
- `an.whale_fluke` — horizontal lobes, always
- `an.dorsal_ridge` — soft pads, always
- `org.dorsal_mantles` — detail >= 1
- `org.belly_chamber` — detail >= 1
- `an.blowhole` — head crown, detail >= 1
- `org.breathing_vents` — grown lips, detail >= 2
- `org.sensory_crown` — low watchful brow, detail >= 2
- `an.vein_fan` — pectoral roots and mantle folds, detail >= 2
- `an.muscle_fold` — nacre gathering at the skirt, detail >= 2
- `an.flow_line` — pearl / indigo boundary, detail >= 2
- `an.healed_scar` — one port-aft welt, detail >= 2

Does not call `shark_dorsal`, `shark_caudal`, `shark_pectoral`, `squid_arm`,
`fin_membrane`, or `kit.box`.

## Envelope (authored, not baked)

Driver: l = 17.0, b = 8.84, h = 5.78.
Nose z ≈ l*-0.445. Tail z ≈ l*+0.462. Glow z = +l*0.47.
Pectoral tip x ≈ l*0.372 (spanX ≈ 12.6). Flipper length ≈ 0.32 * l.
Fluke span ≈ l*0.34, horizontal.
Span band [10.20, 23.80]. Height over length under 0.60.

## LOD

| detail | contents |
|--------|----------|
| 3 | full veins, pads, crown, vents, scar, flow |
| 2 | fewer pads / veins |
| 1 | masses + fluke + pectorals (mantles, pouch, blowhole) |
| 0 | loft + fluke + pectorals + ridge |

Silhouette is not trimmed.

## Paint

Role tag and name selector agree. Hull indigo. Fins `fin-…` pearl.
Mantles `living-body-mantle-…` pearl. Veins `nerve-…` accent. Glow cyan.

## Silhouette checklist (self)

- Top: bulky fusiform + long thin pecs + wide horizontal fluke.
- Side: deep chest, drooped pecs, low ridge, fluke is a line (not a shark tail).
- Front: round chest, pecs out and down, no manta diamond.
- Vs blue whale: shorter, much longer pecs, no dorsal gardens.
- Vs manta: no vertical shield fins, no second lower wing pair.

## Verify

```
python -m py_compile scripts/ship_builders/beautiful/heavy.py
```

Bake and measure are out of this worker's scope.
