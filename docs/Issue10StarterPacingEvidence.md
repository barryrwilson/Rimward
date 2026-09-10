# Issue 10: home-berth pacing reassessment

Local evidence on master `383b0878b7403253f7544fd66d6edf00c801f25a`.
Issue: https://github.com/barryrwilson/Rimward/issues/10

The completed starter samples do not demonstrate a hostile-pressure gap that
justifies another home-berth bubble. Keep the shipped grace and station law
rules. This report records local verification; independent review is tracked with
the task handoff. No gameplay has changed.

## Current behavior

- Origin selection stamps a 60-second arrival grace period.
- Greenhand and Beautiful also block unsolicited pirate acquisition and ace
  duels while world time is below 180 seconds in Freehold. The periods overlap;
  this is not a 240-second combined window.
- Ordinary hunt acquisition and pursuit respect the station's 300-unit law
  zone. Ace duels also stop active intent inside it. A retained ace target
  reference alone does not establish an active attack.
- Returning does not restart the origin timer. Death calm is a separate
  90-second session countdown. Protection from hostile acquisition does not
  promise immunity to collisions, sun damage, or player-provoked retaliation.

Source: `src/game/origins.js` origin choice and `src/systems/npc.js`
`starterGraceBlocksAcquire`, `updateHunt`, and `updateDuel`.

## Reproducible simulation

The probe boots each case in a fresh process with empty saves and seeded RNG
before game imports. It runs the real subsystem updates at 60 Hz, including
NPC movement, projectiles, collision and damage. Rendering and DOM are stubbed.
Navigation uses public actions; it does not inject NPCs, clock jumps, positions,
health, or immunity. Two origins, four seeds (1592594996, 1, 42, 20260910), and
four paths produced 32 completed diagnostic runs.

| Path | Cases | Observed result |
|---|---:|---|
| Dock, launch, leave, return | 8 | Survived 120s at full 40 screen / 60 shell / 100 hull. Launched at 27s, crossed 650u at 36s, redocked at 76.5s. |
| Dock, launch, watch outside | 8 | Survived 240s at full defenses. Reached 683-692u from the station. |
| Untouched initial controls | 8 | Sun-core death at 25.233s. Hostile exposure is censored at death. |
| Straight forward at throttle 0.5 | 8 | Sun-core death at 10.300s. Hostile exposure is censored at death. |

All cases recorded zero active hostile intent toward the player,
player-directed NPC shots, weapon hits, and pirate demands. The 16 navigated
cases provide full first-minute survival evidence. The 16 sun losses do not.
Ambient combat continued (6,046 NPC shots at other targets across scheduled
simulation horizons, including time after the sun deaths).

Fourteen isolated grace contracts cover the 179.99/180/180.01 boundaries,
origin-system exit/re-entry before and after expiry, and related eligibility.
Those are pure policy-input fixtures, not actual travel measurements. A second
fresh-process seed-1 dock-return run produced byte-identical JSON
(SHA-256 `41c5ffddd9d6f08f9b3b179603fcbdd23736a6b17116fe9a418ef3c74449826`).

Run from the repository root:

```powershell
node --import ./scripts/with-css-stub.mjs scripts/issue-10-starter-pacing-probe.mjs --out out/issue-10-evidence
```

## Rendered browser starter runs

Separate disposable Chrome profiles used real animation time and Intel D3D11
WebGL. Seeded RNG was disclosed; no clock, NPC, position or defensive-stat
injection was used in these natural starter scenarios. Both origins used the
public full-stop control while reading for the first minute, then normal dock,
launch, departure, and autopilot return actions. Ambient surrender hails were
released through public `letGo`; temporary launch holds were respected.

| Origin | World / wall seconds | Result |
|---|---:|---|
| Greenhand, seed 101 | 240.454 / 240.327 | No hostile target, active intent, demand or weapon hit. One collision impact at 90.33s, 197.58u from station, cost 11.123 screen; shell/hull stayed 60/100. Returned to dock at 224.71s. |
| Beautiful, seed 202 | 240.294 / 242.389 | No hostile target, active intent, demand or damage. Full defenses. Three ambient surrender hails, including one during the first minute; returned to dock at 224.25s. |

Both completed with zero browser console errors/exceptions, unchanged runtime
source hash, and closed Vite/CDP ports. First-minute and dock-return screenshots
were captured. Earlier Chrome-startup and probe-handling failures are retained
as failed attempts; they are not included as passing gameplay evidence.

Run natural scenarios:

```powershell
$env:ISSUE10_OUT = Join-Path $PWD 'out/issue-10-live'
node scripts/issue-10-live-probe.mjs
```

## Controlled hostile pursuit

A separate adversarial setup placed the player 600u from the station and a
native pirate cutter 740u away at world time 200, with forced interest and
high pirate personality/resolve to sustain the test. The pirate was created
from an existing world record through the normal asset/spawn path when no
eligible live pirate was present. Player defenses were not altered. This is a
boundary test, not a natural encounter-frequency sample.

After public refusal of its demand, the hunter fired a missile and cannon at
203.278s and 203.656s. Ordinary player controls then flew inward: by 209.202s,
at 229u from the station, target and active intent were cleared. A further
five-second hold remained clear; no hunter shot was recorded while the player
was inside 300u. Actual damage left screen at 0 and shell at 46, while hull
remained 100, confirming the test did not give the player immunity.

Ordinary turning and departure reached 457u at 225.805s. The pirate reacquired
the player at 249.102s, 479u from the station, with the normal telegraph phase.
All seven hunter shots occurred outside the law zone (313-600u). Console and
exceptions were clean, runtime source unchanged, and teardown closed both
ports. Root inspected screenshots of incoming fire and the starter dock flows.

```powershell
$env:ISSUE10_OUT = Join-Path $PWD 'out/issue-10-pursuit'
$env:ISSUE10_PURSUIT = '1'
node scripts/issue-10-live-probe.mjs
Remove-Item Env:ISSUE10_PURSUIT
```

The native hail-open event can use `t` for its countdown. Do not interpret
that field as world time in historical raw hail rows; use action receipts and
samples. The final probe adds an explicit observed-world-time field for
future captures. This telemetry-only addition did not change game behavior
and is not represented as a rerun of these historical captures.

## Verification, limits and decision

`npm run build` and `npm run test:boot` passed. The build uses the existing
issue-12 exact-artifact exception: 1,825,869 minified bytes / 545,409 gzip bytes.
No runtime, asset, build-policy, save-schema or tuning change is part of this
issue. Runtime source SHA-256 remains
`d92f394200164ec91b737a891dba709eb92950ac6001867dac03926ecfc02440`.

These finite scripted samples do not estimate encounter probabilities or prove
universal safety. They exercise stock beginner starts (Greenhand empty hold; Beautiful two
livingRock units) and particular
berth paths; they do not settle prolonged mining, cargo-heavy runs, deliberate
aggression, or every danger origin. A new spatial/temporal rule would therefore
be speculative on this evidence. Reassess if a fresh trace shows unsolicited
home-berth aggression that the current rules fail to contain.

The sun losses are a separate initial-heading/coasting observation, not an
AI hostility failure. Any follow-up should reproduce that onboarding hazard in
its own issue; this task does not alter flight physics or grant immunity.

Raw local evidence: `out/issue-10-evidence/starter-pacing-summary.json`,
`diagnostic-rollup.json`, `reproducibility.json`, build/boot logs, and
`live/verified/natural-greenhand/result.json` plus
`live/final/natural-beautiful/result.json`, and
`live/pursuit-sustained/controlled-pursuit/result.json`. Generated output and disposable
profiles are excluded from the committed artifact. The independent review
verdict is retained with the task handoff; no merge, deployment, or GitHub
issue closure is claimed.
