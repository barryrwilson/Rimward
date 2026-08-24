# Wave 102 BIO-02 PR1 career labels — verify

Command:

```
node --import ./scripts/with-css-stub.mjs out/w102/career/probe.mjs
```

Result: `PROBE PASS` (2026-08-23). Re-run after WAVE92 button restore: `PROBE PASS`.

Pins:
- Six live `SHIP_CLASSES` keys. No career keys.
- `CAREER_WORD` exact: heavy combat, ace hunter, freighter trade, light explore, cutter cutter, frigate capital.
- Offer **name** includes extra word except cutter (stays cutter).
- Offer **button** exact `Offer heavy` / `Offer ace` / `Offer freighter` / `Offer cutter` / `Offer frigate` / `Offer light`. Not `Offer heavy combat`.
- Confirm hop `{from} → {dest}` keys. `trainPending.destClass` is the key. `trainMounted(ctx, dest)` uses that key.
- Digit 0 / last `DOCK_KEY_SERVICES` is `shipyard`.
- No `innerHTML` in `shipyard-desk.js`.
- `LIVING_STOCK` still six keys including frigate.
- Yard buy names stay `classLabel` only.

WAVE92 BIO-02 `findOverlayButton92b('Offer heavy')` should pass after this restore.

Vite Digit-0 walk: not run in this worker (probe is the required pin). No Vite or Chrome process started.

Kit mutate: omit.
