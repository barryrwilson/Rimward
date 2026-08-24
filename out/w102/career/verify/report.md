# Wave 102 BIO-02 PR1 career labels — independent verify

Status: **CLEAN**

Date: 2026-08-23

Command:

```
node --import ./scripts/with-css-stub.mjs out/w102/career/probe.mjs
```

Result: `PROBE PASS` (all 40 `ok` lines). Log: `probe-log.txt`.

## What I tested

1. Read Offer + Confirm paths in `src/systems/shipyard-desk.js`.
2. Ran the Wave 102 career probe.
3. Confirmed Digit 0 is Shipyard in `station.js`.
4. Confirmed `trainMounted(ctx, dest)` still takes the class key.
5. Did not start Vite. Port 5173 was not listening. **[NO BROWSER COVERAGE]**

Did not flag CLOS/`hud.js`. Did not flag boot-test.

## Pins (code)

- Offer button uses `careerOfferLabel(destClass)`: heavy combat, ace hunter, freighter trade, light explore, cutter, frigate capital. Cutter does not double.
- Offer hop line may append the static word (`light → heavy combat`). Dest is still the class key.
- Confirm hop is `` `${fromClass} → ${destClass}` `` with `classLabel` keys only (`light → heavy`). No career word on Confirm.
- `setTrainPending` stores `destClass: dest` from `offer.destClass`.
- `confirmTrain` sets `const dest = pending.destClass` then `trainMounted(ctx, dest)`.
- Yard pane names use `classLabel` only. No `CAREER_WORD` / `careerOfferLabel` in `renderBuyPane`.
- No `innerHTML` in `shipyard-desk.js`.
- `CAREER_WORD` is `Object.freeze` on a null-prototype map. Lookup uses `hasOwnProperty`.
- Digit 0: last `DOCK_KEY_SERVICES` entry is `shipyard`.
- Kit mutate: omit (no career-kit / mutate path in the desk).

## Bugs

None.

## Env

- Probe ran on this host. Exit 0.
- Vite 5173 / 5174 not used. No extra process started.
- Graph `graph_resolve` returned `codex/workflow-document-production` (match coverage 0.1 on “verify” / “word”). That workflow targets Word / Google Docs. This verify is code + probe. No Word or Drive artifact.

## Evidence

- Probe stdout: `out/w102/career/verify/probe-log.txt`
- Worker notes (prior): `out/w102/career/verify/notes.md`
- Offer paint: `src/systems/shipyard-desk.js` 456–467
- Confirm hop + dest key: `src/systems/shipyard-desk.js` 264–298, 406–419
- Yard names: `src/systems/shipyard-desk.js` 351, 374
- Digit 0: `src/systems/station.js` 185
