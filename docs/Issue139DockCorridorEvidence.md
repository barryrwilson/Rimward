# Issue #139 — station loiterers keep clear of the docking lane

[Issue #139](https://github.com/barryrwilson/Rimward/issues/139).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/issue-139` from
master `0251f4a6`. Build, unchanged boot, the new focused suite, the
release-focused runner and the repository's own headless-Chrome bridge smoke
(the CI flow that recorded the failure) pass locally on 2026-09-11. No
independent QA, merge, release or deployment is claimed.

## Reproduction record

The baseline CI run retained a fresh Greenhand `approachDock` ending on
`bodyHit` / `impact` at 127.27 u from the station and 7.74 u from the +X
stage point, with the collider unidentified (the station's reach is 34.4 u).

Headless reproduction on the boot harness (real autopilot, ship physics,
collision, traffic and NPC systems ticking together; `scripts/issue-139-dock-corridor-test.mjs`
group 2, seed 7):

| Field | Value |
|---|---|
| Pre-failure pose | the approach parks the hull at the corridor entry, **128.0 u** from the station and **9.7 u** from the stage point, speed 0, `autopilot.phase = 'corridor'`, for 4–6 s while it turns into the corridor — the same pose the CI run retained |
| Collider | a station-anchored **loitering NPC hull** (`bodyHit { kind: 'ship', speed: 10.4, damage: 3.6 }`); nearest hull at the hit frame is the loiterer, 12.4 u away |
| Where | 108.7 u from the station, 26.8 u from the stage point, inside the +40..+135 u corridor, outside the station's 34.4 u reach |
| Outcome | `autopilot.reason = 'impact'`, `engaged = false`, `phase = 'failed'` |
| Why | `npc.js` built every station-anchored loiter path as a full ring around the station, radius 80–150 u, with its **first waypoint on the +X axis** — the docking axis. A loiterer turning at that waypoint, or flying the chord to the next one, crosses the corridor while the player sits at the stage entry or creeps down the corridor at 30 u/s. The intermittency is the ring radius roll (80 + 70 × random) and the phase of the loiter cycle. In the same boot the real Freehold patrol Lancer Po loitered on an 82 u ring whose first waypoint sat on the +X axis inside the corridor. |

Six unseeded-timing fresh boots with no injected loiterer docked; the
collision needs a loiterer at the wrong radius and phase, which is what
"intermittent" meant.

## Fix

`src/systems/npc.js` `stationLoiterWaypoints(center, radius)` replaces the
station-anchored `ring(anchor, 80 + random × 70, 4)`. The path is a sweep
along the far side of the station — four points on the −X half at 90°, 150°,
210° and 270° — listed out and back (six entries) so the unchanged
wrap-around follower ping-pongs instead of closing the loop through the
lane. Every point and every chord stays at `x ≤ anchor.x`, so no loiterer
enters the +X approach corridor or the outward launch lane (#65 / #105). The
radius band, the y jitter, the loiter speed and every other mode are
unchanged; the `ring(startPos, 90, 3)` fallback for route/mine hulls with no
route is untouched.

Not changed: the dock approach's `impact` cancel (an agent re-issues
`approachDock`), the planner's deliberate ignoring of moving `ship` bodies,
NPC avoid gains, and collision damping — none of those would name the
collider, and the issue excluded blanket damping.

## Verification

- `npm run build` — passes.
- `npm run test:boot` — `BOOT TEST PASS — no update errors` (unchanged test).
- `npm run test:dock-corridor` — 17 pins, four groups: sweep geometry at
  80 / 127 / 150 u (points and chords on the far side, radius kept, the list
  ping-pongs); the defect reproduced with the OLD ring injected on a live
  cutter (`bodyHit` kind `ship`, `impact`, nearest hull is the loiterer,
  the hit lands in the corridor outside the station's reach); the NEW sweep
  at the same radius never touches the approach (docked, no `bodyHit`, the
  loiterer stays on the far side); an unchanged fresh Greenhand
  `approachDock` docks; every live station loiterer the real spawn path
  produced obeys the far-side rule.
- `npm run test:release-focused` — `FOCUSED RELEASE REGRESSIONS PASS (22/22)`
  (entry `dockCorridor`; `test:dock-approach`, `test:safe-launch` and
  `test:lane-hold` are in the runner and pass).
- `npm run agent:bridge:smoke` — the release workflow's real-browser flow
  (Vite + loopback bridge + ephemeral headless Chrome, fresh Greenhand
  `approachDock` to the berth): see the run record below.
- Live pane: on a fresh Greenhand game the live Freehold patrol Watchful Apt
  loiters on the new sweep (waypoint x offsets `0, −75, −75, 0, −75, −75`
  from the station) and `approachDock` engages; the pane could not fly the
  approach to the berth because the desktop window was occluded and the
  page's frames ran only in short bursts (about 2 s of simulation per
  screenshot), so the headless-Chrome smoke above is the live evidence.

## Smoke run record

Ten consecutive local `npm run agent:bridge:smoke` runs on 2026-09-11/12
(Vite on 127.0.0.1:5188, loopback bridge on 8877, ephemeral headless
Chrome, fresh Greenhand origin, real `approachDock` from the default spawn):

| Run | `approachObserved` / `approachBraked` / `approachDocked` / `dockedEvent` | `consoleClean` | Other pins | Wall time |
|---|---|---|---|---|
| 1–8, 10 | all true | true | all 26 pins true (exit 0) | 72–77 s each |
| 9 | all true | true | only `systemTransition` false — the later jump step timed out at 90 s (`AP engaged and nav plotted but jump never happened`), unrelated to docking; the smoke/capture reliability candidate in `docs/REMAINING-WORK.md` covers it | 145 s |

Ten of ten approaches reached the berth with no `bodyHit` cancellation and
no console error, against the issue's acceptance line. The earlier local
attempt that read `vite not ready` was an environment fault (this worktree
had no `node_modules`; the smoke resolves Vite by absolute path), fixed by
a junction to the main checkout's install, not by any change in the repo.

## Risks and notes

- Loiterers now sweep the −X side only. Pirates and patrols that used to
  orbit the whole station are seen on the far side and never between the
  pad and the +X lane; hunts, demands, security orders and traffic routes
  are unchanged.
- Persisted records carry no waypoints; the sweep applies to every hull the
  moment it instantiates, on old saves too.
- The reproduction pin injects the old ring shape on a live cutter at seed 7
  and radius 120 u; it documents the collider and is expected to keep
  colliding under the current approach timing.
