# Wave 82 TGT-05 notes

`LOCK_CONE_PX = 12` in `src/game/reticle-aim.js`. Direct-hit body disc wins. Cone is CSS pixels around the visible pip, only when no disc contains it.

Probe: `node out/w82/tgt05/probe.mjs` → `fail=0` (see `probe-log.txt`).

Vite was already on http://localhost:5173 (not started a second instance).

Did not edit `scripts/boot-test.mjs`, `state.js`, `ctx.js`, or scoop magnet.
