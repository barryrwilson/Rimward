# Wave 114 HUD-02 PR1 — plated class hint

## Landed
- `classKeyToken` family gate: `bio` **or** `mech` may return allowlisted `ctx.player.classKey`.
- One writer stays: `applyClassKeyAttr`.
- Authored CSS `#hud[data-family="mech"][data-class-key]` for heavy/ace/cutter/frigate/freighter.
- Light: no extra rule (generic plate).
- WAVE114 boot pin before `if (errors === 0)`. WAVE113 block not edited.
- Probe: `node out/w114/hud02mech/probe.mjs`.

## WAVE113 coupling (do not treat as living-token regression)
WAVE113 still greps:
- `mechOmit`: mech family must omit `dataset.classKey`
- `noMechClass`: no `#hud[data-family="mech"][data-class-key`

PR1 inverts both on purpose. Scope forbade editing the WAVE113 block. Expect `WAVE113 HUD-02 CLASS FAIL` on full boot until a later pin wave rewrites those two keys. Living tokens (heavy/ace/light bio, proto/unknown omit) still hold. WAVE62 / WAVE65 source pins stay.

Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate) were not touched.

## Ports
This worker did not start Vite or Chrome. Ports 5174 and 9430 unused.
