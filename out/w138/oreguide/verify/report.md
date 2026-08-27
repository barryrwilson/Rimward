## Status
CLEAN

## What I tested
- `npm run test:boot` (WAVE138 oreguide pin + cue log). Ignored WAVE127 / WAVE132 fails.
- Static merge-law read of `src/game/mining-ore-keys.js`, group-3 `collectCycleCands`, `beltMineDist` + named cue, `scripts/boot-test.mjs` WAVE138 block. Confirmed no `state.js` write in the helper; `station.js` / `agent-api.js` tree diffs are other waves, not this PR write-set.
- Live Vite :5181 + Playwright: Digit 2 Jobs at Freehold, accept Mine Raw ore, undock, arm group 3. Named cue, first T-lock raw ore while nearer slag/brine exist, HUD-01 80 px hub, MATCH still MATCH. Fallback `Mine · belt` with no accepted mining job. Hostiles-first dummy ship. Origin skip (veridian job while in freehold). Reserved / unknown commodity jobs no throw.

## Bugs found

## Environmental issues

## Evidence
- Screenshots: `out/w138/oreguide/verify/01-jobs-digit2.png`, `out/w138/oreguide/verify/02-cue-raw-ore.png` (Target won — ships in 600u), `out/w138/oreguide/verify/03-cue-raw-near-wrong-ore.png` (`3 MINE · RAW ORE 45U`), `out/w138/oreguide/verify/04-tlock-rawore.png` (empty hub; lock off-camera), `out/w138/oreguide/verify/05-fallback-belt-cue.png`
- Logs: `out/w138/oreguide/verify/boot-test.log`, `out/w138/oreguide/verify/browser-notes.txt`
- Test output: boot pin (all true; no `WAVE138 OREGUIDE FAIL`):

```
wave138 oreguide: {"helperKeys":true,"cycleFilter":true,"cueNamed":true,"beltMatchGated":true,"lockCard":true,"mineBlocked":true,"matchWord":true,"tgt07":true,"uniqueFour":true,"digit2Jobs":true,"sanitizeCap":true,"noWorldFields":true,"noInnerHtml":true,"noLockOre":true,"noFieldMarker":true,"noStateWrite":true,"cueTextContent":true,"cycleRaw":true,"cueRaw":true,"cycleToday":true,"cueToday":true,"cycleEmptyMatch":true,"cueEmptyMatch":true,"cueUnion":true,"uniqueLive":true,"unknownNoThrow":true}
wave138 oreguide cues: {"cueRawText":"Mine · Raw ore 200u","cueTodayText":"Mine · belt 40u","cueGoneText":"Mine · belt 40u","cueUnionText":"Mine · Living rock 90u"}
BOOT TEST FAIL — 2 errors
```

Live DOM (Playwright evaluate): named cue `Mine · Raw ore 78u` with nearest slagIron 32u; first T-lock `commodity=rawOre`; fallback `Mine · belt 76u` then T-lock `brineIce`; hostiles-first lock `W138HOSTILE`; origin-skip T-lock `slagIron`. Reticle 80×80, children `rw-reticle-pupil` / three `rw-reticle-cilia` / `rw-reticle-range`. MATCH word unchanged. Prompt uses `textContent`. No `innerHTML` in helper, cycle region, or hud.js. KeyT still TGT-07 (`isCycleHostile` unchanged). Digit 2 Jobs live. Unique four live.
