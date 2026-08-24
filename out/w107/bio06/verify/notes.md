# WAVE107 BIO-06 verifier notes

**Verdict:** CLEAN
**Date:** 2026-08-24
**Domain:** mixed
**Graph:** `execute_workflows` matched document-production on "verify". Ignored as a false match. No Word/Docs runtime used.

Did not edit `src/`, `scripts/`, or `docs/`. Evidence only under `out/w107/bio06/verify/`.

## Probe / pins

`node out/w107/bio06/probe.mjs` exit 0.
`node out/w107/bio06/boot-pins.mjs` exit 0. All nine keys true.

`npm run test:boot` printed:

```
wave107 bio-06: {"lightEnvelope":true,"lightCadence":true,"monotonicHz":true,"protoSafe":true,"noCadenceWorldField":true,"digit0Shipyard":true,"npcReducedAmp0":true,"swimHzMatch":true,"uSwimSweep":true}
BOOT TEST FAIL — 5 errors
```

The five errors are WAVE26 ferry quote / lane delivery / old-save fallback / save fields / restore. WAVE4/35/80/85/92 had no FAIL lines.

## Static honor

Light player branch does not multiply `hzScale`. Unknown/`__proto__` → light row. NPC `uSwimAmp` 0 under reducedMotion; `uSwimSweep` is a separate float. Mixer uses `setTime` only. `injectSwim` GLSL is authored; `classKey` is not spliced into shader source. NPC speed-norm uses `classCruise`. WORLD_FIELDS has no cadence key.

`state.js` dirty vs HEAD is sibling (cargo, POWER, psionic, preferEngine, jump grace). `SHIP_CLASSES` has no cadence field.

`applyFlightEnvelope` sets `ship.maxSpeed = cls.cruise`, so light `speedNorm` and classCruise stay aligned for living remounts.

## Browser

Vite: `127.0.0.1:5177` only (`--strictPort`). Did not use 5178.

1. Title overlay. Screenshot `title.png`.
2. NEW GAME confirm (autosave present). Reload.
3. Origin Digit 1 Greenhand.
4. Flight: `classKey=light`, `hullKind=living`. Double-tap F → speed 0.
5. Hub 80×80, five children (pupil, three cilia, RANGE). No cadence/fin widget. Screenshots `hub-flight.png` (creep) and `hub.png` (idle 0 u/s).
6. Console: Vite debug connects only. 0 errors, 0 warnings.

Did not remount a heavier living class in the yard. Live flap Hz for non-light classes is `[NO BROWSER COVERAGE]`. Table + ship.js branch cover that path.

## Ports / teardown

Playwright `browser_close`. Wrapper kill left node PID 28568 on 5177; killed that process. 5177 is TIME_WAIT only, not LISTENING. 5178 has no rows.
