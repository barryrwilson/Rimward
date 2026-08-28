# OPT-001 optional live evidence refresh

**Issue:** [#8](https://github.com/barryrwilson/Rimward/issues/8) — `[OPT-001][QA] Refresh optional live UI evidence`
**Source under test:** `e38360f38bea7faf56a8bb4445c62c880f9e31e8` (master head; this branch adds no `src/` change)
**Date:** 2026-08-28
**Status:** **CLEAN** — 7 / 7 surfaces PASS. 0 console errors, 0 uncaught exceptions.

## Reproduction state

One live run, one save, one browser session.

| Item | Value |
|---|---|
| Harness | `scripts/opt001-live-probe.mjs` (Chrome CDP; reads `window.__ctx`, never edits `src/`) |
| Server | Vite dev `http://127.0.0.1:5186/` (`--strictPort`), started and stopped by the harness |
| Browser | Chrome `--headless=new --use-angle=swiftshader`, viewport 1440×900, CDP 9486 |
| Profile | outside the repository (`%TEMP%`); nothing browser-side is committed |
| Save | `localStorage` cleared, then New Game → origin **Freehold Greenhand** (`world.origin === 'greenhand'`), system `freehold`, undocked |
| Harness pins | player hull/screen raised so the pass survives ambient pirates; two named test ships spawned through `npc.js spawnLiveShip` and removed afterwards; `ai.intent` pinned on the TGT-07 hostile (see below) |

Rerun with:

```
npm run test:opt001-live
```

CI runs the same probe. `.github/workflows/live-ui-evidence.yml` executes it
on a pull request that touches `src/`, `index.html`, or the probe, and on
manual dispatch. It uploads this directory as a run artifact for 30 days.
The workflow is deliberately **not** a required check; see the stability note
below.

The harness writes this directory. `out/` is an ignored path, so a rerun
overwrites the stills without touching the repository index.

## Results

| Surface | Result | What the live run showed | Still |
|---|---|---|---|
| **Hail01** demand lifecycle | **PASS** | Demand card names the source (`HAIL — Vane Rook`, `Red Ledger · Vane Rook`), states the amount (`80 UU or hull`) and a live deadline, and offers three compliance paths (`[1] Pay tribute`, `[2] Show teeth`, `[3] Refuse`). Deadline ticked 20 s → 16 s. `[1]` resolved it: credits 500 → 420, `ai.demandOutcome === 'paid'`, outcome toast `Vane Rook — tribute taken. They run.` | `07-hail01-demand-card.png`, `08-hail01-demand-outcome.png` |
| **HUD-06** home marker | **PASS** | POS rail row `HOME  Freehold Landing · 181u`, on-glass square pip created on `#hud` (not on `.rw-reticle`), distance label on the pad. Opening the Galaxy Chart hid the row, the pip, and the chevron. | `01-hud06-home-marker.png` |
| **Hail02** miss feedback | **PASS** | KeyH with no lock → one `warn` toast `No lock — hail`; exactly one `hailMiss` and **zero** `hailOpened` in that press. KeyJ out of range → `Freehold Landing — dock out of range (152 u)` with an integer range. No dock, no pause. | `05-hail02-no-lock.png`, `06-hail02-dock-miss.png` |
| **HUD-07** deconfliction | **PASS** | Reticle is 80×80 with pupil + 3 cilia + RANGE word only — no PPI, compass, or gauge child. Cruise RANGE and LEAD words at opacity `0.14`. With a lock, `.rw-target-name` carries `.rw-yield` and is `display:none`; the name paints once on the rail (`Vesper-9`). | `03-hud07-deconflict.png` |
| **NAV-09** chart readability | **PASS** | Chart carries `Zoom in` / `Zoom out` / `Reset view` (all ≥ 24 px tall), a 13-entry faction filter and a standing filter. Plotting a route to Aegis painted a 4-leg itinerary; leg 1 reads `Bastion — Ferrous Hegemony — Stranger — hub route — Stranger; pirate traffic 3`. | `02-nav09-chart.png` |
| **TGT-07** combat cycle | **PASS** | With a friendly at 120 u and a hostile at 380 u, KeyT from an empty lock selected the **hostile** at 380 u. With the same pair and the hostile bit cleared, KeyT selected the **nearest** ship at 120 u. Hostiles-first gates on `ai.intent`, then falls back to range. **This is the first live browser coverage for TGT-07** — wave 136 shipped it with `[NO BROWSER COVERAGE]`. | `04-tgt07-hostile-first.png` |
| **CTL-03** berth freeze | **PASS** | Under throttle (`input.throttle 0.51`), KeyL opened Berth Records: `flags.berthOpen` and `flags.berthHold` true, `flags.paused` **false**, ship position drift over 2 s = **0.000 u**. The modal states `L or ESC to close — your ship holds. This is not Pause (P).` KeyL again cleared both flags and flight resumed. | `09-ctl03-berth-hold.png`, `10-ctl03-resumed.png` |

## Console

`console.txt` holds the whole session. **0 entries of type `error`. 0 `Runtime.exceptionThrown`.** The known WAVE127 / WAVE132 boot warnings did not appear in this browser run.

## Harness honesty notes

These are how the run was staged, not product findings.

- **TGT-07 intent pin.** The pair sits inside the 300 u station law zone, where `npc.js` clears NPC hostile intent every AI tick, so a spawned trader cannot hold `ai.intent` long enough to press a key. The harness pinned `far.ai.intent = true` on a 16 ms interval across the KeyT press and read the bit back at assert time (`intent: true`, `nearIntent: false`). The contract defines "hostile" as exactly `ai.intent === true`, so this pins the documented input, not the outcome. The ungated control run used no pin.
- **Ambient traffic.** Live pirates opened their own demand cards during the pass. Hail02 is therefore asserted on the emitted `hailMiss` / `hailOpened` counts for that one press, and Hail01 on `ai.demandOutcome` plus the credit delta, not on whether the card element happened to be empty a second later.
- **Order.** CTL-03 runs first, right after the boot settles. The ship then sits about 180 u out, alive and undocked, with nothing spawned. Late in a pass the ship closes on the station, and a collision recovery refuses the KeyL open. The step ends with a double tap on F, so the ship holds station range for every later check.
- **TGT-07 staging.** Ambient traffic drifts through the 600 u cycle envelope. The harness therefore re-parks every other ship and re-seats the spawned pair until the candidate set is exactly those two, and only then presses KeyT. The retry is on the setup. The assertion never repeats, and a set that never settles is recorded as a failure, not a pass.
- **The TGT-07 assertion tests the law, not one ship.** With a hostile present, the lock must be the nearest hostile, and a non-hostile must sit closer. Without a hostile, the lock must be the nearest candidate.
- **One assertion was corrected mid-pass.** The first Hail01 check required the deadline to read exactly `20s`. That asserts harness timing, not the contract: the card is sampled a beat after it opens, so one run read `19s` and failed. The check now requires a deadline of 15–20 s that counts down. The product behaviour did not change between runs, and the failing run recorded the same card text, the same countdown, and the same `paid` outcome.
- **Survivability.** `player.hull` / `player.screen` were raised so a starter Greenhand run could complete all seven checks in one session. No world, save, or state field was written.
- The three harness ships (`OPT NEAR FRIEND`, `OPT FAR HOSTILE`, `Vane Rook`) were removed from `ctx.ships` and the scene after their checks.

## Commands

| Command | Result | Log |
|---|---|---|
| `npm run build` | PASS (`✓ built in 10.06s`) | `build.log` |
| `npm run test:boot` | PASS (`BOOT TEST PASS — no update errors`) | `boot-test.log` |

## Stability

The probe renders a real WebGL frame and drives a live simulation, so it is
less stable than the boot harness. Measured on this machine:

| Build | Runs | Failures |
|---|---:|---:|
| First build | 10 local | 2 |
| After the CTL-03 reorder and the TGT-07 staging | 5 local | 0 |
| After the Hail02 event assertion | 3 local | 0 |
| Same build, first CI runs | 2 CI | 2 |
| After the fixed sleeps became bounded polls | 5 local, 1 CI | 1 local, 1 CI |
| After the ship-asset wait | 1 local | 0 |

Five staging flakes were found and fixed. None was product behaviour.

1. **CTL-03** failed once when the ship reached the station late in a pass.
   The collision recovery then refused the KeyL open. CTL-03 now runs first,
   from the settled boot state, and ends in a full stop.
2. **TGT-07** failed once when ambient traffic entered the 600 u cycle
   envelope. The probe now re-stages the candidate set before it presses.
3. **Hail02** failed on the first CI run. The toast rail holds five slots, and
   ambient chatter on the slower runner evicted the dock-miss line before the
   read. The check now reads the emitted `hailMiss` payload — `verb: 'dock'`,
   `reason: 'dock-range'`, integer `dist` — and treats the rail text as
   supporting evidence.
4. **HUD-06 and Hail02** failed on the second CI run. Both were fixed sleeps
   that are long enough on a desktop and too short on a shared runner: the
   POS row hides one throttled HUD tick after the chart opens, and the miss
   event landed after the 400 ms read. Every race-prone read is now a bounded
   poll for the expected condition, and a poll that times out returns the last
   real value, so the assertion still fails rather than passing on a retry.

5. **TGT-07** failed on the third CI run with `spawn-failed`. `spawnLiveShip`
   returns `null` until the requested faction/class asset is loaded, and on a
   cold runner none of a fixed try list was ready. The probe now takes its
   spawn combos from the ships already flying — those assets are proven — then
   primes the rest and waits up to 15 s for one to become ready. The last
   local run picked `freehold / light / miner` from live traffic.

**Residual flake.** One local run of the polling build failed on TGT-07 and
Hail01, and that run's data was overwritten before capture, so its cause is
unknown. Every failure since has carried its data and had a real cause.
Keep the workflow off the required-check list until it runs clean for a while.
It uploads the evidence directory on failure as well as on success, so the
next failure arrives with its own `probes.json` and stills.

## Defects

**None in the seven surfaces.** Nothing in this pass reopens completed behavior.

### Observed but out of scope: `npm run test:boot` is intermittent

This is reported, not fixed. The issue is evidence-only, and this is not one
of the seven surfaces.

`src/`, `scripts/boot-test.mjs`, and `index.html` on this branch are identical
to master `e38360f3`:

```
git diff --stat e38360f3 HEAD -- src/ scripts/boot-test.mjs index.html   # empty
```

The harness still fails at random, and **a different check fails each time**:

| Where | Result | Failing check |
|---|---|---|
| CI run 33189821819 | PASS | — |
| CI run 33190959203 | FAIL | `WAVE117 NAV-05 HANDOFF FAIL` |
| CI run 33195085194 | PASS | — |
| Local | FAIL | `WAVE30 DEMAND HAIL FAIL`, `WAVE30 PAYTRIBUTE FAIL` |
| Local | FAIL | `WAVE30 DEMAND HAIL FAIL`, `WAVE30 PAYTRIBUTE FAIL` |
| Local, 5 other runs | PASS | — |

Roughly 2 failures in 8 local runs, and 1 in 3 hosted runs. `PROGRESS.md`
already records a `REDMARCH castMatches` flake, so nondeterminism in this
harness is a known theme; `WAVE30` and `WAVE117` look like new instances.
The likely cause is an unseeded random in world or NPC generation, which
would make the harness order-dependent rather than the product wrong.

RW-007 names the hosted boot job a required check. A required check that
fails at random blocks unrelated pull requests, so it is filed on its own:
**[#20](https://github.com/barryrwilson/Rimward/issues/20)** — `[QA] npm run
test:boot fails at random on an unchanged tree`. The owner authorized that
issue; it is labeled `orca:triage`, so the backlog key and the row in this
inventory are left to triage.

## Evidence index

Committed:

```
scripts/opt001-live-probe.mjs         harness (rerunnable; npm run test:opt001-live)
.github/workflows/live-ui-evidence.yml  CI job; uploads this directory
out/w143/opt001/verify/report.md      this file
out/w143/opt001/verify/probes.json    every measurement, keyed by surface, with the source SHA
out/w143/opt001/verify/console.txt    full browser console + exception log
out/w143/opt001/verify/run.log        harness transcript
out/w143/opt001/verify/build.log      npm run build
out/w143/opt001/verify/boot-test.log  npm run test:boot
```

Not committed — ten labeled stills, written to the same directory by a rerun:

```
01-hud06-home-marker.png   06-hail02-dock-miss.png
02-nav09-chart.png         07-hail01-demand-card.png
03-hud07-deconflict.png    08-hail01-demand-outcome.png
04-tgt07-hostile-first.png 09-ctl03-berth-hold.png
05-hail02-no-lock.png      10-ctl03-resumed.png
```

Git keeps every version of a binary forever, so the stills stay out of the
history. They live on the pull request instead, and any reviewer regenerates
them with one command.

Prior evidence this refresh supersedes: `out/w127/demand/`, `out/w127/homemarker/`,
`out/w129/hailmiss/`, `out/w129/deconflict/`, `out/w129/chartread/`,
`out/w125/berthfreeze/`, and `out/w136/tgtcycle/` (static only). Those stay as
history; this directory is the current-master set.
