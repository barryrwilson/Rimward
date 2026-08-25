# WAVE108 BIO-08 verifier notes

**Verdict:** CLEAN
**Date:** 2026-08-24
**Domain:** mixed
**Graph:** `graph_resolve` → `proceed_unmodeled` (`r-mt7eoztb-c83872b2`). No graph_propose. No src edits.

Did not edit `src/`, `scripts/`, or `docs/`. Evidence only under `out/w108/bio08/verify/`.

## Probe / pins

`node out/w108/bio08/probe.mjs` exit 0. Log ends `BIO08 PROBE PASS`.

`npm run test:boot` printed:

```
wave107 bio-06: {"lightEnvelope":true,"lightCadence":true,"monotonicHz":true,"protoSafe":true,"noCadenceWorldField":true,"digit0Shipyard":true,"npcReducedAmp0":true,"swimHzMatch":true,"uSwimSweep":true}
wave108 bio-08: {"protoSafe":true,"unknownClassIsLight":true,"missingGaitLiveMix":true,"lightPlayerCpu":true,"cadenceUnchanged":true,"digit0Shipyard":true,"digit8Digit9":true,"noGaitWorldField":true,"gpuGaitUniforms":true,"mixerNotGait":true,"tableDeputize":true,"npcReducedAmp0":true,"threeFree":true}
BOOT TEST FAIL — 5 errors
```

The five errors are WAVE26 ferry quote / lane delivery / old-save fallback / save fields / restore. WAVE4/35/80/85/92 had no FAIL lines.

## Static honor

- `gaitFor` miss / `__proto__` / constructor / non-string → light (shark-caudal axes). `axesForGait` miss → `LIVE_GAIT_MIX` 1,1,0,0.
- `LIVING_CADENCE` numbers match Wave 107. `living-cadence.js` has no gait token.
- Player light CPU skips gait weights. Other living remounts multiply spine/flap and add Z kick + radial after breath/heart.
- GPU: four uniforms, one program key `rimward-beautiful-swim-gait`. Mixer uses `setTime`, not `timeScale`.
- `WORLD_FIELDS` has no gait key.
- Digit 0 remains shipyard. Digit 8 launch, digit 9 standing/epics.
- Ace flapY 0.12. Frigate radial 0.28 < squid 1.00.
- No `innerHTML` on `ship.js` / `ship-assets.js` / `living-gait.js`.

## Browser

Vite: `npx vite --port 5178 --strictPort`. Bind was `[::1]:5178` only. Playwright `http://127.0.0.1:5178/` refused. Used `http://localhost:5178/`. Did not kill 5173/9222.

1. Title overlay. Screenshot `title.png`. Click `data-title-action="new"` (no title key). Origin click Greenhand.
2. Flight: `classKey=light`, `hullPath=living`, `living.swim=true`. Vertex sample mag 0.132 over 17 s (CPU swim).
3. Hub `.rw-reticle` 80×80, five children (pupil, three cilia, RANGE). Zero gait/species nodes. Screenshots `hub-flight.png` (creep ~30 u/s) and `hub.png` (double-tap F, 0 u/s).
4. Dock: moved ship into `DOCK_RANGE` 45, pressed D. Menu `8 — Launch`, `9 — Standing`, `0 — Shipyard`. Digit 0 opened shipyard hangar (`hull_starter` light). Screenshot `digit0-shipyard.png`.
5. Console: Vite debug connect only. 0 errors, 0 warnings.

Heavier-class Beautiful flap axis: `[NO BROWSER COVERAGE]`. Did not remount a non-light living class.

## Ports / teardown

Playwright `browser_close`. Killed Vite PID 33412. 5178 TIME_WAIT only, not LISTENING. 9410 has no rows. 5173 pid 6364 and 9222 pid 20800 still LISTENING.
