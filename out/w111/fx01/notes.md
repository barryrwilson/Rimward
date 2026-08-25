# FX-01 Wave 111 PR1 notes

Hull-local shield ripple. Recoil, marks pool 12, muzzle, bolts, shake untouched.

## Landed

| Path | Role |
|---|---|
| `src/systems/combat.js` | Ripple `host`, parent via `worldHitToLocal` + `RIPPLE_LIFT`, park, FP skip, fail closed |
| `docs/Fx01RemainingDesign.md` | Status/wave row + verifier record paths |
| `out/w111/fx01/probe.mjs` | Isolated pins |
| `out/w111/fx01/security-review.md` | Self-applied |
| `out/w111/fx01/code-review.md` | Self-applied |
| `out/w111/fx01/ui-audit.md` | Self-applied |

## Pins

- `RIPPLE_POOL` 16 / `RIPPLE_TTL` 0.2
- `HULL_MARK_POOL` 12
- No new `WORLD_FIELDS`
- WAVE54 / WAVE59 greps hold
- Did not edit `scripts/boot-test.mjs`

## Processes

No Vite. No Chrome. Ports 5172 / 9412 not used.

## Reviews

No open CRITICAL / HIGH / Blocker / Major after first pass. No code fix required. Second pass: same.
