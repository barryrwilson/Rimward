# Wave 99 turret probe notes

Command:

```
node --import ./scripts/with-css-stub.mjs out/w99/turrets/probe.mjs
```

Result 2026-08-23: **PROBE PASS** (gate, toast matrix, missing target, cannon omit, cap 4, vsNPC drop, Unknowable miss, cap source greps).

`npm run test:boot` WAVE99: first run failed only `npcCapConst` and `playerCapFiltered` (grep used `p.` while counters used `pool[i].`). Counters now use `p`. Other WAVE99 pins were true, including live emit, telegraph cold, demand cold, HUD tree. WAVE98 TGT-03 stayed true. WAVE83 missiles stayed true.

Known boot FAILs ignored: WAVE4 fence, WAVE80 REP-04, WAVE85 nav, WAVE92 BIO. Did not start Vite 5173 or CDP 9410.
