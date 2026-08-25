# HUD-02 Wave 113 notes

Worker: PR1 living facing class tokens. No Vite. No Chrome CDP. Probe: `node out/w113/hud02/probe.mjs` → PASS.

## Landed

| Path | Role |
|---|---|
| `src/systems/hud.js` | `SHIP_CLASSES` allowlist; `data-class-key` at init + 5 Hz independent of hullKind family if |
| `src/ui/hud.css` | Bio-only class clips inside 22×10; light keeps generic organism |
| `scripts/boot-test.mjs` | WAVE113 pin block before final `errors === 0` |
| `docs/Hud02RemainingSilhouettesDesign.md` | Status / wave / verifier record. Wave 111 inventory kept as pre-PR1 census |
| `out/w113/hud02/probe.mjs` | Allowlist, omit-on-unknown, mech omit, no innerHTML, no hullKind write, selectors, hub tree |

## Formula

```
raw = ctx.player && ctx.player.classKey
key = (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) ? raw : ''
if (family !== 'bio') key = ''
write-on-change to root.dataset.classKey or delete
```

Mech / unknown / `__proto__` omit the attribute. Generic bio CSS still paints.

## Freeze honored

- HUD-01 empty 80 px hub. No reticle child.
- Digit 0/8/9 not touched.
- `state.js` read-only. No persist key. `rw-hud-family` stays mech|bio.
- No `innerHTML`. No lock classKey. No `hudFamily` rewrite.
- WAVE62 / WAVE65 pins not inverted.
- Kit mutate omit. No song CUES. No HUD-03 skin.

## Reviews

Self-applied security / code / UI. No CRITICAL / HIGH / Blocker / Major. Medium persist-mirror and light-no-op documented.

## Iteration 2 (pin only)

WAVE113 boot pin used `getAttribute` / `childElementCount`. The boot stub does not mirror `dataset` into attributes and has `children.length` only. Pin now matches WAVE62 (`dataset.classKey`, `dataset.family`, `children.length`). Harness JSON all true. WAVE26 FAIL stays 5. No `hud.js` / `hud.css` change.

## Ports

This worker did not start Vite or Chrome. Probe used Node only. Host 127.0.0.1:5173 was already LISTENING (PID 34660) at report time; not claimed by this worker. 9430 was not LISTENING.

## WAVE26

Known boot FAIL is pre-existing. Do not treat as this PR.
