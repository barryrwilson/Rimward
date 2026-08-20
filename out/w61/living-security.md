## Security Review: HUD-02 living family brief (`out/w61/living-family.md`)

### Risk Level: Low

### Summary

Re-apply after Bio / contacts AGEZ. Extra family ink on those hosts is no longer assumed safe because they sit at the bottom. First wave ships zero extra Bio/contacts length. Rails keep `rw-hair-off`. No `innerHTML`, no extra DOM.

### Findings

#### 🔴 CRITICAL: none

#### 🟠 HIGH: Bio / contacts extra ink had no AGEZ hide (resolved)

- **Severity**: high (verifier HIGH)
- **Category**: Client-side integrity (duel readability)
- **Location**: `out/w61/living-family.md:86-87`, `:124-135`, `:358`, `:374`
- **Description**: §3.4 claimed Bio and contacts “stay off the 1600×900 aim glass.” Legal `H` reaches 44–1556, 44–856. Contacts ends ≈ (710, 785) / (890, 785). Bio sample `H` (1556, 856) is on the panel. Extra 8–16 px strokes would sit in the 56 px hub disk. Fade 0.14 is not a clip.
- **Impact**: Family ink on the hub / RANGE pair when the player aims at the arc or the Bio corner.
- **Reproduction**: Chase/third, place `H` on an arc end or on Bio; paint extra tangents / corners.
- **Remediation**: First wave extra length = 0 on Bio and contacts (`stroke-linecap: round` only). Any later extra px must use the same fail-closed hide. Retract the geographic-safety claim.
- **Status**: resolved

#### 🟠 HIGH: Rail AGEZ hide (already closed — do not reopen)

- **Status**: resolved in prior pass (`rw-hair-off` on rails)

#### 🟡 MEDIUM: Alt B fail-open clip (documented, not shipped)

- **Location**: `out/w61/living-family.md` §11 Alt B
- **Status**: open (accepted residual)

### Passed Checks

- [x] No secrets
- [x] `innerHTML` banned
- [x] DOM growth 0 for Alt A
- [x] Hide is a class toggle, not per-frame clipPath
- [x] Extra Bio/contacts strokes not shipped (no extra paint surface)
- [x] Audio mute / `masterVolume`
- [x] No new bio stats
- [x] No `src/` or `docs/` edits
- [x] Rail inset / wound cites left unchanged

### Recommendations

1. Probe `H` at (600, 513), (710, 785), and (1556, 856) on 1600×900.
2. Do not add Bio corners or contacts tangents without `rw-hair-off`.

### Persona notes (security-auditor)

Overall risk: **low**. Open: Alt B residual. Severity counts (open): critical 0, high 0, medium 1, low 0.
