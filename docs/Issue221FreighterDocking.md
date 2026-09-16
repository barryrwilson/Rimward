# Predictable freighter docking — issue #221

Owner: Rex/Codex implementation worker. Stage: testing; independent Claude QA
pending. Specification: [GitHub issue #221](https://github.com/barryrwilson/Rimward/issues/221).
Base: `c57aea1442f1ee46f8eaf9c04a0fa50bc4a9fda2`.
Initial runtime candidate: `5ae35c02d88cdd50b6106ad19c99a0b55654dc82`.
Repaired runtime: `a0852d6bb365725a14b1ad1b78286143b37ae820`.
Final solar-ordering runtime: `59eb6090cdb9a418da49a0352699b6a8035049fb`.
The final artifact adds the regression repairs recorded below.

## Acceptance and implementation

- A real Yard freighter (220 hull, 160 hold) completes the approach without
  repeated commands. Freighter proportional steering uses the available RCS;
  physical class turn caps stay unchanged. Clear, aligned outer-stage legs
  target 24 u/s. Station tangents, traffic detours, recovery and final corridor
  retain authored creep and braking. Escape creep cannot raise stage thrust
  while the safety brake applies.
- Direct freighter `approachDock` shares the queued handoff's gate-bore exit
  preparation on its first control tick. Direct agile-hull entry is preserved.
- A stage/cruise watchdog stall gets one replan under the same helm. It clears
  the cached tangent/side, idles, and plans again from live bodies halfway
  through the existing watchdog budget. It does not reset the deadline or
  replenish traffic credit. Persistent stalling retains its original bound. Pause/berth hold do not spend watchdog time;
  impact, invalid state and manual cancel retain precedence. Hard planner
  rejection still stops immediately; the same-helm retry addresses the
  progress-watchdog stalls consistent with the reported arrival timings.
- An unexpected handback leaves a text-safe HUD status line with its reason.
  New accepted helm or successful docking clears it; deliberate cancel is not
  presented as a failure.
- No new keys, gauges, persisted fields, equipment or bridge changes. Build,
  boot and independent approval remain parent gates; builder does not merge.

## Focused builder evidence

- `npm run test:freighter-dock`: PASS. Seed 7, explicit dock/credit fixture calls
  real Yard purchase/Hangar mount. One initial gate-center pose, then real
  systems and physics: 1,525 u to berth in 68.72 sim seconds, no contact, heat,
  death or reissued approach. An 85-second regression cap remains on this
  deterministic fixture.
- Same test labels stationary-pose controller fixtures separately. They prove
  mid-window retry, same-helm resume to berth, persistent bounded failure and
  full stop, pause, cancel, impact precedence, HUD visibility and clearing.
- `npm run test:dock-corridor`: PASS, all six old/new/fresh/repeat/cancel/freighter
  processes. Actual mounted freighter takes 51.5 sim seconds on the corridor
  fixture, below its 65-second regression cap, no contact/heat/death.
  Earlier unchanged flight-law comparison was 66 seconds. Cancellation receipt
  scenarios are now spaced beyond the authored five-second comm repeat interval;
  production deduplication is unchanged.
- `npm run test:dock-approach`: PASS. Mid-window idle retry preserves the
  original 10-second stationary failure deadline.
- `npm run test:arrival-dock`: PASS; light-hull queued bore-edge round trip and
  cancellation cleanup preserve #201.
- `node --import ./scripts/with-css-stub.mjs scripts/issue-168-stage-obstacles-test.mjs`:
  PASS, moving asteroid regression, positive clearance and completed berth.

## Rendered evidence and limits

`npm run test:freighter-dock-live` runs disposable loopback Vite/Chromium,
records source hashes, rendered checkpoints, console errors/exceptions and
process/port cleanup. It uses real Yard/Hangar owners under disclosed credit,
docked and initial pose fixtures. Traffic/collision remain active throughout
flight. After a real station-owner undock, a separate deliberate controller
handback tests the HUD; it is not a natural collision claim.

Retained runs (all under local `out/issue-221/`):

- `live/freighter/result.json`: pre-final-braking-guard source, PASS, about
  65.6 sim seconds, no contacts. Initial receipt fixture left the station panel
  open; therefore this does not establish final unobscured flight HUD quality.
- `live-final/freighter/result.json`: final runtime source, FAIL under the initial
  stricter probe. Docked in 89.93 sim seconds without reissue, but three ship
  contacts (0, 0, 0.447 u/s), all zero damage, violated its no-contact assertion.
  This run is retained, not omitted in favor of a later pass. No console errors.
  The nominal 85-second live cap was not an issue acceptance criterion.
- The revised probe records every contact and a 250ms flight trace. It accepts
  only the already-merged #200 harmless contact contract (finite speed below
  1 u/s, zero damage); heat, death, fast/damaging contact and failed helm still
  fail. Its 120-second liveness budget bounds the run, while measured timing is
  reported instead of implying identical live traffic behavior on every frame
  schedule. The focused deterministic latency caps above are unchanged.

- `live-reviewed/freighter/result.json`: initial candidate runtime, PASS,
  69.28 sim seconds, no contact, no console errors/exceptions, source stable.
  Real station-owner undock and a receipt visible six sim seconds after handback
  are verified; the line clears on an accepted new helm. Screenshots were
  inspected. Child processes exit and both ports close.

The parent full boot found four initial-candidate regressions: a replanned
watchdog incorrectly replenished both time and moving-traffic credit; direct
light-hull gate preparation changed an established cruise path/fixture. The
repair replans halfway through the original unchanged deadline without restoring
credit, and limits additional direct gate preparation to freighters on their
first control tick. Existing stationary/traffic watchdog tests are unchanged.
`npm run test:agent-playtest-fixes` passes all 17/17 child regressions on the
repaired runtime, including the four that failed in the initial candidate.
All prior live results above describe the initial candidate, not this repair.
Pre-solar-fix repaired runtime evidence:
`out/issue-221/live-repaired/freighter/result.json`, PASS on runtime
`a0852d6bb365725a14b1ad1b78286143b37ae820`. Source SHA-256
`dc260fbe00efbfc7fa1df4f9b33c5faed40ba696f4882c4f6003b3d1646216cf`
was unchanged from browser start through cleanup. One command docks in 65.60
sim seconds. The complete contact log includes one ship separation touch at
17.04 seconds (speed 0, damage 0), accepted by the existing #200 contract; no
harmful event or failed helm occurs. After real undocking, the blocked reason
remains visible after six sim seconds and clears on a new accepted approach.
The unobscured screenshot was inspected. Zero console errors/exceptions; Vite
and Chrome exited and their loopback ports closed. Live variability
is measured; its cause is not established by a passing rerun. This issue does not
promise a fixed docking time under arbitrary traffic or hostile encounters.

## Final solar-ordering repair

Independent Claude review identified a first-tick omission: freighter gate
preparation rebuilt the obstacle bag after the sun had been appended. The
final runtime prepares the gate before collecting the complete obstacle bag.
A controller-level regression places the sun across an otherwise direct stage
chord and compares first/following tick avoidance without moving the pose. It
fails on the preceding runtime and passes after the fix. No production debug
surface or planner behavior was added. Dock-approach and #221 focused checks
pass. The #172 suite passes all five authored gate approaches, each retaining
solar clearance and reaching a real berth.

Final rendered run: `out/issue-221/live-sunfix/freighter/result.json`, PASS on
runtime `59eb6090cdb9a418da49a0352699b6a8035049fb`. Source SHA-256
`a686cdc32f9f95eb0ca5f72c821f97ba93e58d88554c77f5eb6a0fb192d9fc5b`
was stable throughout. One approach completes in 81.05 sim seconds. Two recorded
ship separation touches (at 9.05 and 49.38 seconds) have speed 0 and damage 0;
no harmful event or failed helm occurs. Real station-owner undock, a visible
receipt after six sim seconds and clearing on retry pass. The final screenshot
was inspected unobscured, with no horizontal overflow. Console errors and
exceptions are empty; both child processes exit and loopback ports close.
These final measurements supersede the earlier runs as evidence for the exact
final runtime; earlier variability and failure records remain preserved.

## Review and rollback

Builder applied the orchestrator security/code checklists. A potential unsafe
interaction between accepted escape creep and increased stage thrust was fixed
with the explicit braking guard. Parent regression review then caught deadline/
traffic-credit replenishment and light-hull cruise changes; both were repaired
and all 17 unchanged regression children pass. No remaining high/critical self-review finding:
textContent only, no new endpoints or secrets, session scratch resets on new
approach/restore/cancel, no JSON schema or system-order changes. A designer-agent
audit was skipped; existing HUD style/status semantics and rendered screenshots
cover the small line change. Independent QA reviews an exact immutable artifact.

Rollback: revert this issue's commits. No migration or saved-state repair.
