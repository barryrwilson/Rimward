## Status
BUGS_FOUND

## What I tested
- Probe: `node out/w109/msn03sku/probe.mjs` exit 0. All 21 pins PASS. Log: `out/w109/msn03sku/verify/probe.log`.
- Boot: `npm run test:boot` (~3 min). WAVE109 MSN-03 pins all true. WAVE83 STATION FAIL. Five WAVE26 FAILs (pre-existing). No WAVE4 / WAVE35 FAIL. Full log: `out/w109/msn03sku/verify/boot-full.log`. Excerpt: `boot-wave109.txt`.
- Static: `CHAIN_GRANT` Veridian `auto`, Hollow `dart`. `grantChainSku` verifies `writeMountedGear` and does not write credits. `finishChainStep` adds +2 UU only when grant is false after `parsed.step < 3` return. Proto splice path has no pay. Unique four still does not call `grantChainSku`. Digit 0/2/8/9 comments and `DOCK_KEY_SERVICES` unchanged. `git diff` touches `jobs-chains.js`, `station.js`, `scripts/boot-test.mjs` only. No `state.js` write. No `chainSku` in `WORLD_FIELDS`. Catalog still `dart` / `auto`. `station.js` has no `innerHTML` assignment.
- Browser: Vite `http://localhost:5179/`. Playwright NEW GAME → Greenhand. Hub `.rw-reticle` 80×80, five children (pupil, three cilia, RANGE), no SKU pip. Dock menu: `2 — Jobs board`, `8 — Launch`, `9 — Standing`, `0 — Shipyard`. Digit 2 chain extra lines: `Dart rack` / `Auto turret`, no `6500` / `4200`. Digit 0 SHIPYARD hangar. Digit 9 STANDING. Digit 8 undock; overlay `textContent` empty.
- Live grant trace (`window.__ctx` inject + job tick): light last Freehold +24 UU (22+2), empty racks; heavy last Freehold seats empty dart, pay only; heavy last Veridian seats auto, pay only; step 1 does not add +2; proto id spliced; ace last Hollow seats empty dart.

## Bugs found
### HIGH — WAVE83 last-step pins stale (in-scope leftover)
Worker did not update WAVE83 `lastFreeholdLight` / `lastVeridianNoSku` / `lastHollowNoSku`. Boot:

```
wave83 station: {...,"lastFreeholdLight":false,"lastFreeholdHeavy":true,"lastVeridianNoSku":false,"lastHollowNoSku":true,...}
WAVE83 STATION FAIL
```

- `lastFreeholdLight` still expects `credits === credFh + 22`. Wave 109 fail-closed +2 UU makes this `+24`.
- `lastVeridianNoSku` still expects launcher/turret unchanged. After Wave 109 a heavy hull seats `auto`.
- `lastHollowNoSku` stays true because Freehold heavy already seated `dart` and the pin only checks id equality. The pin still encodes “no SKU”. It does not prove Hollow grant.

Product last-step behavior matches Wave 109 (live inject + WAVE109 pins). This is a harness leftover, not a grant-path product defect.

### LOW — Jobs copy article
Digit 2 extra line is `Last paper may seat a Auto turret if this hull has a hardpoint.` Catalog name is correct. Shop costs are absent. Article `a` before Auto is grammar only.

## Environmental issues
- First `npm run test:boot` hit the 120s tool cap before WAVE83/109. Second run at 300s completed. WAVE26 five FAILs are pre-existing (ferry quote, lane delivery, old-save fallback, save fields, restore). Not this wave.
- Vite `--strictPort 5179` bound. Playwright used `http://localhost:5179/`.
- Live last-step grants used harness job inject and a dock-range move (`DOCK_RANGE` 45). Not a full paper-chain playthrough.

## Evidence
- Screenshots: `out/w109/msn03sku/verify/title.png`, `origin.png`, `hub-flight.png`, `dock-menu.png`, `digit2-jobs.png`, `digit0-shipyard.png`, `digit9-standing.png`, `digit8-launch-hub.png`
- Logs: `probe.log`, `boot-full.log`, `boot-wave109.txt`, `live.json`, `notes.md`
- WAVE109 object (all true): `freeholdDart`, `redledgerAuto`, `veridianAuto`, `hollowDart`, `noGildedKey`, `specHasOwn`, `lightFailClosed`, `seatedWriteVerify`, `protoDropNoPay`, `uniqueFourNoGrant`, `digit0Shipyard`, `digit2Jobs`, `digit8Digit9`, `noNewWorldFields`, `noStateWrite`, `noInnerHtml`, `jobsHintCopy`, `noShopDebit`, `noReducedMotionAnim`
- Graph: `codex/workflow-browser-assisted-work` (resolution `r-mt7hg3dg-9a5bb271`). Local browser only. External-send gate not used.
