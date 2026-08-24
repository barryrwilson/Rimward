# Beautiful Ones cutter — hammerhead guardian (wave 106)

Authoring-only. No bake, no Blender, no measure in this pass.

## Body plan

Adult hammerhead shark. Not a manta. Not a scaled copy of the light reef
shark.

- Fusiform indigo hull, longer and thicker than light. Tail ends at
  `z = l*0.462`, so the driver glow at `z = +l*0.47` reads as wake.
- **Cephalofoil** is the outline-breaker. Hull stations flare to
  `b*0.520` half-beam across a short Z-run at the brow, then snap in at
  the neck. Paired nacre tip + bar lobes on ±X finish the T-bar.
  Extra brow beam vs thorax is `0.213*l` from the loft, more with lobes
  (`>= 0.15*l` required). This is a shark hammer, not a swept wing.
- Triangular dorsal, heterocercal caudal, thick pectorals that cup
  inward (tips inboard and down). No digit fan. No teeth. No upper jaw.
- Five gill slits per side.
- Open round belly chamber under the thorax, with grown-lip docking
  lips. The hold stays open.
- Moderate sensory tissue along the foil leading edge (nacre row + two
  tip crowns).
- Pearl dorsum is a *narrow* second loft, not a manta cap.
- One port-forward healed scar.

Envelope: `l=11.0`, `b=l*0.48`, `h=l*0.30`. Span band [6.60, 15.40].
Vertex aim 6 000–47 000. Hammer beam allowed (minBeamOverLength 0.35).

## LOD

| detail | contents |
|--------|----------|
| 3 | full gills, foil nacre, crowns, veins, scar, lips, folds, flow |
| 2 | fewer repeats (organ ladders) |
| 1 | primary + chamber hint, gills, crown, scar, lips |
| 0 | loft, hammer lobes, dorsal, caudal, pectorals |

Silhouette is never trimmed.

## Silhouette checklist

| view | hammerhead cutter | light reef shark | manta |
|------|-------------------|------------------|-------|
| above | T-bar head, narrow neck, fusiform trunk | compact diamond, wing span owns the outline | wide wings for most of Z |
| side | tall triangular dorsal, heterocercal tail, hanging open hold | short tail, soft crest, no gill row | flattened pancake, no shark tail |
| front | wide flat brow, pectorals cup below | small cephalic paddles | wing pair |

Travel axis remains `-Z → +Z`.

## Paint dual rule

- hull indigo — `cutter.hull` / `ROLE_HULL`
- pearl — `living-…` / `fin-…` / `living-lip-…` / `ROLE_ARMOUR`
- nerve — `nerve-…` / `sensory-crown-…`
- scar and flow — `ROLE_TRIM`
- gill wells — `ROLE_RECESS`
- glow list only for cyan

No `kit.box`, no windows, no nozzles, no turrets.

## Verify

```
python -m py_compile scripts/ship_builders/beautiful/cutter.py
```

Must call `shark_dorsal`, `shark_caudal`, `shark_pectoral`, `gill_slits`,
`belly_chamber`. Head stations and nacre lobes must flare into a
cephalofoil.
