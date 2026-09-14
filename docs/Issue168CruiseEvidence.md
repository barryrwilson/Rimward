# Issue #168 cruise safety repair and #171 dock takeover

The earlier cruise-only evidence below is historical. Independent review of combined commit `a3d79acfa6695d1629d3efb0593d0fac93bf8669` found a damaging asteroid contact during **stage**, so that artifact did not complete rendered acceptance. The stage transit repair is described below; final acceptance requires three consecutive safe rendered runs on the final combined, clean commit. Their raw results and exact commit/source hash belong in the final validation record and PR, without changing source between runs.

`approachDock {}` remains a command for the current station. Beyond 500u from its +X stage point it starts in dock/cruise, brakes into stage within 100u of that point (or within 500u of a blocking station), then uses corridor, settle, and the ordinary docking pulse. Ship tuning, human controls, persistence, event vocabulary, and route AP behavior are unchanged.

## Repair after independent review

The first implementation failed independent live review: a moving NPC was hit at cruise speed. The route planner intentionally skips ordinary ship/asteroid bodies, while the local avoidance lookahead was only 40u. At 120u/s and normal 90u/s² acceleration the stopping distance is 80u before hull clearance, so that lookahead was insufficient.

The private cruise planning bag now promotes ships and asteroids into planner obstacles. For a moving ship it encloses its present position and constant-velocity prediction through the stopping horizon. Cruise detours recompute against moving traffic instead of latching a stale waypoint. A separate relative-motion braking check samples the decelerating player sweep against moving obstacle spheres and idles before collision. Static obstacle and crossing traffic tests check swept relative hull clearance and require continued progress. Near-stage and ordinary route policies remain separate.

Sun-only detours remain respected; local avoidance cannot cut the planner's protected chord. The restored deterministic acceptance keeps every NPC and all normal simulation/collision systems. The previous NPC-excluding fixture is superseded and is not used as acceptance evidence.

## Explicit burner takeover

Ship code owns burner retirement and cooldown when the explicit dock helm takes over. Queued burner edges cannot restart it while that helm owns thrust. Fresh physical Space still cancels the dock helm before ordinary burner handling. The first takeover frame reuses the existing human radial pad governor, with its existing caps, to handle a burn that entered closer than physical stopping distance between commands; subsequent frames use ordinary docking physics.

For a hull already inside the conservative station keep ring, a stage chord pointing outward is allowed. Without this narrow geometry exception a station tangent and local avoidance fought each other while the hull tried to idle-turn away. The existing far-side tangent behavior and tests are retained.

Real-system #171 fixtures run 23 actual burner frames from a labeled initial +X pad-lane pose, then use public clearControl/approachDock. All traffic/collision/damage systems remain active:

| Handoff | First takeover frame | Berth | Events |
| --- | --- | --- | --- |
| 55.6u, 64.5u/s, burner active | 55.1489u, 27.0667u/s, burner retired | 26.1333s, speed 0 | docked only |
| 43.6u, 64.5u/s, burner active | 43.2667u, 20u/s, burner retired | 0.2333s, speed 0 | docked only |

Before repair these fixtures hit the station: the 56u case kept burner-multiplied creep while turning; the 44u case had less room than its braking distance. No original #171 pulse/provenance assertions were removed.

## Reproducible verification

- `node --import ./scripts/with-css-stub.mjs scripts/issue-168-cruise-test.mjs`: **39.1667 simulation seconds**, peak119.9998u/s, all phases, docked only, intact traffic. Stock Greenhand tuning; `makeNavHelpers` establishes the existing deterministic Veridian arrival-gate fixture. A second seed19 diagnostic remained safe and docked in41.9333s; it does not replace seed7 acceptance.
- `node --import ./scripts/with-css-stub.mjs scripts/issue-168-cruise-obstacles-test.mjs`: stationary asteroid, stationary freighter, moving crossing freighter, and two ±0.4rad initial heading variants all pass. Minimum swept hull clearances respectively12.63u,12.34u,72.03u,14.68u,106.88u. Each travels more than800u in12s; the test cannot pass by stopping forever. Braking-distance and invalid-input guards pass.
- `node --import ./scripts/with-css-stub.mjs scripts/dock-approach-test.mjs`: all assertions pass, including600u far-side and3km far-side detours, sun heat clearance, live Freehold spawn, near approach, named refusals, physical burner cancellation, pause, restore, and docking pulse. The candidate retains the passing baseline far-side outcomes.
- `node --import ./scripts/with-css-stub.mjs scripts/issue-171-burner-test.mjs`: existing raw pulse, no-flee, already-active and same-turn handoff pins pass. The integration worker owns the additional44u/56u real-system fixtures; both were executed against this repair's runtime by importing its boot harness.
- `node scripts/pad-speed-governor-test.mjs` and `node scripts/agent-schema-test.mjs`: pass.

## Rendered evidence

The live probe owns a loopback Vite instance, isolated Chrome profile and their processes. It starts a fresh Greenhand, flies the normal public route to Veridian, then approaches the station. It changes no world transform, ship tuning, traffic, or simulation clock. Timing is from the accepted command receipt to the docked event. Screenshots, console checks, runtime hashes, cleanup and events are retained in ignored evidence directories.

Runtime candidate commit: `8e10452bf46bc924818c178d2565e843c89da27d`. Runtime source SHA-256 across all three runs: `8ba001c777d1f44b77c492cf367d2b71d36b0a0fbd96c44067f1c4cd7afce2e0`.

| Probe directory under out/issue-168-cruise-live | Elapsed | Result |
| --- | --- | --- |
| 1789397621358/veridian-public | 52.6130s | Safe berth, no heat/impact; probe reports FAIL solely because its supplemental live40s check failed |
| 1789397779951/veridian-public | 38.2574s | PASS, safe berth, no heat/impact |
| 1789397984014/veridian-public | 48.5468s | Safe berth, no heat/impact; probe reports FAIL solely because its supplemental live40s check failed |

The first slow run lacks per-phase samples, so its extra time has not been causally attributed. The second run's samples place stage at44.9571, corridor47.9764 and settle59.1067 on the world clock, after approach at approximately21.68. It spends approximately6.6s initially idle-turning from the gate departure heading, with intermittent cruise braking/turning later. A live natural-route arrival reaches a different traffic clock/random history from the fixed fixture; the restored fixed fixture still meets the issue's40s criterion. The52.6130s result remains visible rather than being discarded.

The third run records real hull positions, radii and clearance. Cruise spends additional time turning around the stationary freighter `rec-24` at world time41.38–43.90, then holds while the moving freighter `rec-20` crosses at47.95–51.49. During that hold, the freighter surface clearance narrows from69.33u to32.11u; the player resumes as it passes. Stage begins at54.0133, corridor57.0421 and settle69.6754. Compared with the38.2574s run, the extra time is concentrated in cruise around traffic, while subsequent stage/corridor durations are similar. The minimum per-frame sampled ship/asteroid surface clearance across the full run is11.2136u; the controlled tests additionally check swept relative geometry. This evidence supports retaining conservative traffic waits, rather than changing the ship's speed/turn tuning to force every live traffic realization below40s.

All three runs have zero console errors/exceptions, identical start/end runtime hashes, normal Chrome exit, terminated owned Vite processes, and closed Vite/CDP ports. Each directory contains `result.json`, `arrival.png`, and `berth.png`. The final berth screenshot was visually inspected: Veridian station services are visible, the docked state is shown, and no horizontal layout overflow appears. The live probe's existing40s assertion was not weakened; the two timing failures are reported as such even though their safety/berth checks succeed.

## Stage transit repair after final review

The failing combined-source run is retained at `out/final-independent/cruise/veridian-public/result.json` in the integration workspace. At world time 49.8633 the hull was in stage at 29.7476u/s, with asteroid2 only 16.7315u beyond the hull surfaces; at 50.081 it took a 20.563u/s asteroid impact and 7.197 damage, cancelled, and never berthed. This was a safety failure, separate from the older supplemental live timing failures.

The repair extends private obstacle planning and braking through stage transit, including a station detour. It first retains the established station/sun route, then plans ship/asteroid clearance toward that chosen transit target. A traffic waypoint is recomputed and is never stored as a stationary station tangent. A second guard prevents the traffic sidestep from cutting into the station or sun; blocked traffic can command true idle, rather than leaving the 30u/s creep floor active. The same relative-motion stopping sweep now has braking authority during stage. A traffic detour also requires the hull to align before resuming creep. Ordinary route AP, corridor/settle, physical Space cancellation, human flight controls and ship tuning are unchanged.

Asteroid motion matters here: the asteroid owner updates orbital positions every frame, while its public rows expose positions but not private orbit elements. A private WeakMap samples those actual public row positions against simulation time. Samples warm during cruise, and stage uses their estimated velocities to enclose the stopping-horizon motion. Weak keys prevent asteroid-index reuse after system rebuild from sharing old motion. A fresh or stale sample starts at zero velocity and refreshes on the next valid update; no public or persistent field is added. The existing cruise behavior is retained while stage receives the additional moving-rock prediction.

A supplemental branch probe also exposed a freighter entering a stationary cruise hold: `out/stage-candidate-live/veridian-public/result.json` in the stage-repair workspace records `rec-22` overlapping the stopped hull at44.3866, cancelling with zero damage. The real-system asteroid reconstruction similarly showed that braking clear of asteroid2 can leave the stopped hull exposed to another orbiting rock. These failures are retained. The bounded hold-escape rule compares predicted braking and normal-creep trajectories for1.5s, starting with actual velocity and using the existing acceleration/drag equations. It permits ordinary creep only when an incoming moving body threatens the hold and the proposed swept path clears every collected physical body plus the station/sun keep-outs. AP steering is frozen only during that validated step so executed motion matches the proposed straight course; high-speed braking, physical full stop and blocked forward paths cannot use this exception. The check repeats each frame, applies only in dock cruise/stage, and introduces no new thrust/control or corridor policy.

Focused checks on the stage source candidate preserve the intact-traffic fixed acceptance at39.1667s, all existing near/far-side/sun dock assertions, controlled cruise obstacle cases, and the actual44u/56u burner takeover fixtures. Independent real-system stage regression and final combined browser evidence are required in addition to these checks. A branch-only browser run is supplemental and must not be substituted for the final combined-source gate.

The continuous public-flow diagnostic on clean commit `ed4ba89e51b82fc3ada104e2382836c700f6ce34` (hold-escape runtime plus enhanced probe) berthed safely in39.2320s. Evidence is `out/stage-hold-candidate-live/veridian-public/result.json` in stage-repair: all cruise/dock phases, only the docked event, minimum sampled hull clearance2.7217u, zero console errors/exceptions, stable runtime SHA-256 `6dad5d52f0c2404e1d22b402fec6e6f63ffda5b47a3c8edf211db565c9788e8c`, and closed owned ports. This is direct continuous-flow evidence for the repair, but remains supplemental to the three final combined-source runs.

Cold late-state reconstructions remain explicitly failed diagnostics. Starting a fresh approach at the last recorded pre-impact pose still contacted asteroid2 at low speed after braking; starting0.25s earlier cleared asteroid2 but a following asteroid48 reached the stationary hull. Passive trajectory checks confirmed the nose faced that incoming rock and correctly rejected forward creep even when testing that threat alone. These reconstructions omit the continuous approach's earlier route and motion history; they are not presented as successful replays or repaired acceptance cases, and no later pose/velocity correction or actor removal was used to turn them green.

## Repeated-stage liveness and bounded traffic waiting

The final combined safety gate on clean `590104a48db470ca7f4515d83a1db44127eaa0fb` completed three consecutive natural public-route journeys with the same runtime SHA-256 `6dad5d52f0c2404e1d22b402fec6e6f63ffda5b47a3c8edf211db565c9788e8c`. All reached berth without body contact, cancellation, heat, console errors, or exceptions. Elapsed times were63.6580s,49.8822s,36.8453s; the first two raw probes remain timing failures. Run2 also recorded a Chrome cleanup timeout, followed by two checks confirming that owned PID had exited; its original result remains unchanged. The complete evidence and timing analysis are in the integration workspace's ignored `out/final-stage-live-summary.md` and `.json`. Independent review closed the earlier stage-impact and source-provenance blockers on this artifact.

That review separately exposed a repeated-docking liveness failure: after the real NEW-sweep docking and undock sequence, the next stage approach held272.7683u from its target while successive moving rocks changed its traffic detours. The unchanged10s no-progress watch cancelled at world47.9333. An ignored diagnostic loader observed that same watch without terminating the stage: the moving-traffic hold ended after roughly17s and the ship subsequently docked safely. A second diagnostic limited the distant traffic-planning window; it advanced farther but still failed at a later hold. Neither diagnostic loader nor the rejected planning change ships in the repair. The exact failing sequence and independent controls are documented in [Issue168StageLivenessEvidence.md](Issue168StageLivenessEvidence.md).

The repair leaves all helm, traffic geometry, station/sun guards, braking and hold escape unchanged. It gives an idle stage a limited amount of waiting credit only when the actual promoted bodies intersecting its chosen route are all moving and their current motion projects them clear of that chord within the existing10s watchdog window. Any static or projected-unclearing intersecting body vetoes the credit, and unrelated motion cannot justify it. Linear projection is a reason to wait briefly, not a guarantee that a body will retain its velocity.

Credit is cumulative and capped at10s for an entire episode without at least1u of improved stage distance. Changing blocker identities or improving/changing yaw cannot refill the budget. Once credit is exhausted, the ordinary blocked watch continues; static blocked paths receive no credit. No public channel, persistent record, ship tuning or control authority is added. The unchanged exact repeat regression now reaches both berths safely, the existing static blocked control still terminates at10.7s, and the shared10-check regression group passes. The final source still requires its independent moving-wait controls, fresh build/boot checks and one affected natural browser journey on the frozen combined artifact; ignored final logs and the release review carry those results without amending the tested commit.

## Review and limits

Builder security/regression review found no new credentials, external endpoint, action authority, unsafe DOM writes, persistence, or event surface. Only private planning geometry and ship-owner takeover state are added. Finite-input refusals, held-helm boundaries, loopback binding and owned-process cleanup remain. Constant-velocity prediction is bounded avoidance, not a guarantee against every arbitrarily accelerating NPC encounter. Independent combined review, build, boot suite and the near-pad live browser check are coordinated by the parent task.
