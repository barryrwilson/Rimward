# Issue #234: light-hull arrival diagnosis and recovery feedback

Status: partial progress. The missing recovery instruction is addressed; arrival
collision avoidance and repeated blocked approaches remain unresolved. This
document does not claim that issue #234's overall arrival outcome is complete.

## Scope and evidence identity

Diagnosis used baseline `a923f9df5858e4b2752bf1f668c744caede8d5b1`.
The natural browser run recorded runtime hash
`3e92994a6fa0d096b184891a0a762d6c3cd68970062c8149aaebb338def824e4`,
unchanged across the run, with no runtime source modifications. Its 275.5 wall
seconds began at `2026-09-17T02:04:58.320Z`. It used the Greenhand starter light
hull, while the original spy playtest used Rim Drifter. Traffic, collision
damage, solar clearance, clocks, and gameplay tuning were intact. Navigation
used public `plotRoute`, `engageAutopilot`, and queued `approachDock` commands;
retries were explicit public commands, not automatic reacquisition.

The browser rendered at the normal rate and captured screenshots, console
errors, events, and roughly quarter-second flight samples. There were no
teleports or injected gameplay state in this natural run. The separate
feedback-only browser probe deliberately uses cancellation fixtures; it is not
natural arrival evidence.

Raw evidence is intentionally untracked:

- Original: `C:/Projects/WebSim/out/spy-playtest-20260917/` (`REPORT.md`,
  `actions.jsonl`, `observations.jsonl`, `results.json`).
- Fresh: `out/issue-234/live/light-dock-natural/` (`result.json`,
  `trace-0.25s.json`, `events.json`, `cancellation-windows.json`, screenshots).
- Historical extraction: `out/issue-234/spy-trace-mine.json`.
- Final feedback verification: `out/issue-234/feedback-toast-final/dock-feedback/`.
- Claude Code prompts/output: `out/issue-234/claude-*.txt` and
  `out/issue-234/claude-*.jsonl`.

## Original four cases

| Case | Evidence | Diagnosis limit |
| --- | --- | --- |
| Hollow Reach impact | Ship contact at t=753.982, speed 10.10, damage 3.54; failure first observed t=775.8, range 660u | Stopping after this contact is correct. The prior avoidance geometry is absent. |
| Freehold impact | Failure first observed t=1031.6, range 1508u | Triggering collision is missing from the sampled event ring; do not assign a body or cause. |
| Freehold blocked | Cruise stationary at about 384u from t=1065.7, failure first observed t=1081.6 | Nearby ships are present; Sable Ilex closes from 119u to 26u while the player is stationary. The trace does not identify the exact blocking guard. |
| Veridian blocked | Stage closes to about 58u then widens to 196u before failing near 185u | A ship passes nearby, but distance widening alone cannot distinguish a safe tangent from a defective plan. |

Original nearby bearings are ship-local, not world coordinates. They cannot be
added directly to the player position to reconstruct world trajectories.
Neither the four original traces nor the new run establishes that these cases
share one cause. No original case is declared fixed by the feedback change.

## Fresh natural route results

| Leg | Result |
| --- | --- |
| Freehold to Veridian | Ship impact at t=45.074 (speed 3.213, damage 0), then three blocked retries at t=71.357/82.045/117.597, ranges 273.9/284.2/290.8u. Still undocked at end, t=118.159. |
| Veridian to Freehold | Docked at the actual destination, t=177.377, without cancellation. |
| Freehold to Hollow Reach | Gate impact at t=238.276 (speed 38.321, damage 0); docked at the actual destination after an explicit retry, t=265.456. |

The Veridian blocked episodes had nearby ships, including Tessellate and
Patient Sorrow at roughly 40–61u in the first two retries. This confirms a
traffic-associated failure class, not that the safety stop should be removed.
Hollow's new contact was with a gate, unlike the original ship contact.

The run captured 1,036 flight samples and 3,176 events. Two additional ship
touches had speed 0.935 and 0 with zero damage. The existing harmless-touch
contract requires both zero damage and absolute speed below 1u/s; the two
impact cancellations therefore remain correct under that contract even though
their recorded damage is zero. Event impact speed is not the same quantity as
the ship's speed in a later observation.

Console errors and exceptions were both zero, the runtime hash stayed stable,
and both loopback listeners closed. The harness's PASS means evidence capture
and cleanup succeeded. It does not mean all three approaches succeeded.

## Confirmed fix and intentionally unchanged behavior

Before this change, the persistent HUD receipt and public `commLine` named the
cause but offered no next action. The shared `DOCK_APPROACH_LINES.blocked` and
`.impact` messages now retain their distinct causes and add: “Wait for
clearance or steer clear, then retry the approach.” An API pilot retries using
`approachDock`. Machine-readable reason tokens remain `blocked` and `impact`.

The controller still relinquishes propulsion on cancellation; reading the
message never retakes the helm. No avoidance, collision, watchdog, gate,
freighter, deadline, or solar-clearance logic is changed. Existing #221 and
zero-damage-touch contracts remain requirements, not exceptions to bypass.

The longer persistent receipt overlapped Controls and Manifest at 800x600.
A selector limited to `[data-dock-failure]` caps it at 400px (or the viewport
minus 32px) and wraps the full message. Independent QA then found that the
same extended text still clipped in the transient commLine toast. Only the
two exact shared cancellation messages now receive a dedicated toast class;
that class wraps at 360px (with a viewport cap) and uses flow spacing below
the persistent receipt and onboarding hint. Other helm/commLine styles and
text-safe DOM rendering are preserved.

The initial feedback change is committed at
`82baa6a256349a5fe71f8245847456bca749c060`; the QA toast correction is
`ef2a83af419ddbe15583e40da4b6d0d775803b46`. The final browser pass finished at
`2026-09-17T02:44:05.722Z`, with source hash
`d50bf52d8d4f7cf39f5b4e7873532916d3782d86f6c70c48368012bc0b32a40e`
unchanged across the run. Both blocked and impact receipts measured 400px,
wrapped with no element overflow at 1440x900 and 800x600. The probe verified
the cause and recovery action in the HUD and public commLine, and measured
every visible cancellation toast against the viewport, Controls, Manifest,
onboarding hint, persistent receipt, and other cancellation toasts. All four
reason/viewport combinations passed explicit no-clipping/no-intersection
assertions, including two simultaneous cancellation toasts. It also verified
persistence past six seconds, retained cancellation reason, explicit API retry
acceptance, and receipt clearing after acceptance. Console errors and
exceptions were zero; Chrome exited and both listeners closed. Compact and
after-retry screenshots were inspected. Expired slots leave vertical space;
no actual overflow or overlap was observed in these verified flows.

Verification setup failures are retained separately. An earlier browser-readiness
failure coincided with confirmed host memory pressure; a later retry overlapped a surviving
owned probe child and encountered a port conflict. Those attempts are not
counted as product verification. A clean pre-layout probe completed with the
existing Browser.close timeout recorded, while confirming actual process exit
and port closure. No shared harness or boot timeout was changed.

The first layout probe measured only the persistent chip, so its PASS did not
cover transient-toast clipping. The corrected probe includes both surfaces and
fails on clipping or intersections; it no longer reports that no CSS change
is warranted merely because the persistent chip fits.

## Remaining investigation

The fresh probe's initial NPC sampler captured distances but its guessed name
and velocity fields were null. Zero moving-ship counts in that raw trace mean
missing measurements, not stationary traffic. Planner branch, selected
waypoint, predicted clearance, and watchdog progress state were not recorded.
Consequently, the evidence is insufficient to choose a safe navigation fix.

The next bounded diagnosis should capture those controller decisions and
actual NPC record positions/velocities for a reproducing approach, then pin a
specific avoidable defect separately from legitimate obstruction. Do not
extend timers, suppress contact, or claim the generic blocked class is solved
because a later retry docks. The supplied natural probe now fails closed on
launch/route refusals and verifies the destination before counting completion.
Its local wall-budget callback does not change the shared harness. These probe
guard corrections received syntax checks; the recorded natural flight preceded
them, and its reported successful destinations were independently verified from
the saved end checkpoints.
