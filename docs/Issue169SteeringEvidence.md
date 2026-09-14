# Issue #169 steering evidence

Built on `0991593bd905d00451b9f7d2b5f58eea737d3ac2`, branch `codex/agent-api-steering`.

## Finding and bounded change

The original no-turn symptom did **not** reproduce in isolated real Chrome on this base. Fresh Greenhand, launched, `clearControl`, and public raw leases renewed every 400 ms all rotated the actual ship quaternion on pitch, yaw, and roll. Three receipts per measured axis were accepted; observations remained manual/active. The live probe records `__ctx` quaternion, input, bio turn factor, and helm flags read-only, while all actions go through `window.rimward.act`. There are no pose, time, input, or other game-state fixtures.

The confirmed discrepancy is pitch sign: positive raw `steerY` previously pitched up. Issue #169 explicitly requires mouse-style positive-down pitch. The raw lease input boundary now negates pitch; internal combat pitch and the human reticle retain positive-up flight coordinates. Yaw, roll, throttle, TTL, sequence validation, and refusal tokens are unchanged. Zero pitch remains ordinary zero.

Checks of current code explain why no downstream drop was found: `main.js` runs controls before helms, bio and ship; controls publishes the surviving lease after physical reticle input; `discardPhysical` clears private held keys and mouse fire, not lease axes; raw `observe().control` does not clear those axes. Real-browser traces corroborate input delivery and nonzero turn factor.

## Live baseline and post-change evidence

Local raw evidence is under `out/issue-169-before/`, `out/issue-169-after/`, and the final probe rerun in `out/issue-169-after-final/`. Each run records result JSON, console output, run log, screenshots, live quaternion samples and receipts. Generated evidence is intentionally untracked. The final run reported a locked temporary Chrome profile file during cleanup; its owned Chrome process had exited. The residue is confined to the ignored probe profile directory.

| Axis at +0.7 | Baseline degrees / sim seconds | First post-change degrees / sim seconds |
| --- | --- | --- |
| Pitch | 16.143888 / 1.0063, up | 16.102177 / 1.0037, down |
| Yaw | 16.147097 / 1.0065 | 16.131054 / 1.0055 |
| Roll | 16.137471 / 1.0059 | 16.098968 / 1.0035 |

Both runs used actual animation frames and Intel UHD / ANGLE rendering. Both had zero console errors and zero uncaught exceptions. All three axes exceeded the required 10 degrees in approximately one simulation second.

The current low-speed light-hull RCS floor is 0.40 rad/s (22.918 degrees/s at full deflection), so +0.7 correctly produces about 16.043 degrees/s. Turn rate increases with speed under the existing `hoverTurnRateFor` law and bio multiplier. The issue's approximate 37 degrees/s is not a fixed rate in current tuning; no ship tuning was changed.

The coordinator also loaded this worktree in the actual Codex Browser pane and visually confirmed fresh Greenhand launch. That tool did not permit public API evaluation, so the original pane-specific no-turn report remains unverified there. The isolated Chrome result must not be described as reproduction or repair of a confirmed downstream drop.

## Regression checks

- `npm run test:throttle-observability`: 20 pins pass. Eight new pins exercise actual ship rotation for both signs of all three axes, unchanged human mouse-up behavior, and survival of a one-frame API burner pulse under a raw lease. The pre-change test failed specifically on positive-down pitch.
- `npm run test:combat-intent`: all 35 regression groups pass, including real combat flight and issue #163 raw/combat/helm input ownership.
- `node scripts/issue-169-live-probe.mjs`: three live axes must rotate >10 degrees, have the documented sign, and remain manual/active while every renewed receipt succeeds. A temporary browser profile and loopback Vite server are created and cleaned up only for this run.
- Migrated survey controller: `node --import ./scripts/with-css-stub.mjs scripts/issue-69-survey-navigation-test.mjs` passes public flight (931.1 units to discovery), progress, payout, restrictions, geometry and restore checks.
- Syntax checks and `git diff --check` pass.
- The coordinator owns full build/boot and independent Claude QA on the integrated artifact.

## Compatibility and integration requirement

This intentionally changes the raw API pitch convention. Existing raw controllers that aim using positive local bearing Y must negate their outgoing `steerY`; do not negate the shared ship input, combat controller, or defense controller. Migration targets identified from the graph: `scripts/lib/agent-parity-waves.mjs` (fight141, objective steering, fight142, recovery), `scripts/agent-bridge-smoke.mjs`, `scripts/issue-69-survey-navigation-test.mjs`, `scripts/issue-61-live-probe.mjs`, `scripts/issue-62-live-probe.mjs`, `scripts/issue-74-natural-live-probe.mjs`, and `scripts/issue-74-recovery-live-probe.mjs`. The coordinator expanded this worker's write set to migrate these clients in the same change. Their pursuit mathematics, thresholds and acceptance assertions remain unchanged; only outgoing raw pitch changes sign.

Required API design/manifest prose: Raw `setControl` axes are normalized in -1..1. Positive `steerX` yaws the nose right; positive `steerY` pitches the nose down, following screen/mouse Y; negative `steerY` pitches up. Positive `roll` rotates about the ship's local +Z axis (right wing rises). To aim at a ship-local bearing `[x,y,z]`, send negative pitch from `atan2(y, hypot(x,z))`. Actual turn rate uses existing class, speed and bio factors; a lease does not bypass those limits. This sign conversion applies only to raw API requests; human mouse-up and combat pitch remain unchanged.

## Builder review

Self-applied orchestrator security and code checklists: no high/critical findings. The only production edit is the validated raw pitch mapping; no public routes, secrets, persisted fields, or authority expansion. The probe listens on loopback, uses a fresh owned browser process/profile, and verifies the resolved profile deletion scope. Code review identified the raw-client compatibility migration above, which is included in this artifact rather than hidden behind a compatibility claim. Independent QA is still required; this document is builder evidence, not approval. Visual design audit is not applicable to this input-contract change.

## Related #171 controls integration

A separate follow-up commit adds the transient `ctx.input.agentAfterburnerPressed` contract field. `agentPulse('afterburner')` queues its own pending edge, which is combined with physical Space when controls publishes the next frame. The marker is true only for an API edge with no simultaneous physical edge; human Space takes precedence in either ordering. Both pending queues clear after publication. Marker resets cover the next frame, initialization, berth, blur, pause/opt-out, and combat output/release. This allows the dock helm to ignore the raw API burner edge without ignoring manual cancellation. It changes neither a persistent record nor the event vocabulary.

Builder checks: throttle suite now passes 22 pins, including queued marker lifetime, later human Space, simultaneous physical/API edges in either order, pause/opt-out cancellation, and blur cleanup. Combat-intent still passes all 35 groups; raw output is retained in `out/issue-169-after-final/combat-provenance.log`. The cruise worker owns same-frame and already-applied API burner-to-dock integration tests, plus unchanged human burner cancellation. Self-applied security/code checklists found no high/critical issue in this bounded provenance change; independent integrated QA remains required.
