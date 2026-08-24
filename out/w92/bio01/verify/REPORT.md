## Status
BUGS_FOUND

## What I tested
- Headless `node out/w92/bio01/probe.mjs` — all gift/pirate/proto/graft pins PASS.
- Extra hunt `out/w92/bio01/verify/hunt.mjs` — double grant, built no remount, reserved ids, dump-then-destroy latch, full no eviction/no cargo, Digit 0 source, HUD/COMMODITIES greps.
- WAVE92 helper pins isolated (not the full boot-test suite). Overlay Digit 0 / People desk covered by CDP instead.
- Grep of worker files: no `innerHTML`; HUD does not write `player.hullKind`; no COMMODITIES seed SKU; `PIRATE_SEED_DROP_RATE = 0.05` (DATA_DROP_RATE stays 0.20).
- Frontend Vite `127.0.0.1:5180` + Chrome CDP `9440` (`chrome-profile`): New Game, jump `bt_cradle`, dock, People.
- Forced `reputation.beautiful = 50` and `10`. Papers, Esc cancel, Confirm, already, Digit 0 shipyard, console errors.
- Full hangar refuse: headless (browser rest run did not finish after extra Esc undock).
- Stopped Vite 5180 and Chrome 9440. No LISTENING on those ports.

## Bugs found

### Bug 1: WAVE92 `srcPins.rate` fails on a comment
- Severity: LOW
- Repro: `scripts/boot-test.mjs` WAVE92 pin `!bio92src.includes('DATA_DROP_RATE')` against `src/game/bio-seed.js`.
- Expected: pin true; pirate rate 0.05 and source does not copy `DATA_DROP_RATE`.
- Actual: live rate is 0.05 (probe PASS). The comment `Do not copy DATA_DROP_RATE.` makes `includes` true, so WAVE92 BIO-01 FAIL if the full boot-test runs.
- Evidence: `src/game/bio-seed.js` lines 8–10; `out/w92/bio01/verify/hunt.log` (`FAIL rate.not.data`); `out/w92/bio01/verify/probe.log` (`ok rate`).

## Environmental issues
- Full `scripts/boot-test.mjs` was not run (suite is long). WAVE92 overlay pins were replaced by CDP + helper hunt.
- First CDP Digit 0-after-gift and full-refuse UI checks failed because two Esc keydowns undocked. That is harness error, not a product fail. Headless already refused a full hangar with no eviction. Digit 0 remains last `DOCK_KEY_SERVICES` (`shipyard`); People Digit 1 only arms papers.
- Follow-up CDP rest runs hit evaluate timeouts; 09/10 screenshots are stale overlay after undock. Trust 01–08 and probe/hunt.

## Evidence
- Probe: `out/w92/bio01/verify/probe.log` — PROBE PASS
- Hunt: `out/w92/bio01/verify/hunt.log`, `hunt.json`
- Grep: `out/w92/bio01/verify/grep.txt`
- CDP: `out/w92/bio01/verify/cdp-summary.json`, `cdp.log`
- Screenshots (valid):
  - `01-dock-menu.png` — `0 — Shipyard`
  - `02-digit0-shipyard.png` — SHIPYARD
  - `03-people-rank10.png` — no Sworn papers
  - `04-people-sworn.png` — `1 — Papers`
  - `05-armed-papers.png` — Confirm papers
  - `06-esc-cancel.png` — no grant
  - `07-gift-ok.png` — `hull_seed_gift` + `A living seed rests in the hangar.`
  - `08-already.png` — `You already carry that gift.`
- Live grant dump: mounted `hull_starter`, row `hull_seed_gift` living/light/beautiful, no `grafted`, credits 350 unchanged, no gift console errors.
