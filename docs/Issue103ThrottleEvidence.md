# Issue #103 — Raw control throttle observability

## Mission and acceptance contract

Source: [issue #103](https://github.com/barryrwilson/Rimward/issues/103).
Baseline: master `7645aa225e9b8b34853111c6118b066fbabd91f0`; branch
`codex/issue-103-throttle-observability`.

Stage: implemented, locally verified and independently QA-approved at
`f7593a085ca8ff710f9d21d4c2e127001785a227`; awaiting publication authorization.
Rex directed the Claude Code implementation harness and executed the
focused/build/boot/regression checks; Clawd coordinated scope and executed the
live browser probe. Quinn reviewed through the independent Codex harness.
No push, PR, merge, release or deployment is claimed.

The accepted option is the issue's explicitly permitted compatibility-preserving
choice: keep the setpoint and document the existing `observe().ship.throttle`.
Current `agent-observe.js` already publishes `num(input.throttle, 0)` and
`flags.fullStop`. The issue's observability premise was partly stale: the missing
piece was a discoverable explanation of the reading and explicit stop protocol.

Acceptance criteria:

1. Document the persistent manual input setpoint, its distinction from the
   requested lease target and actual speed, positive-target ramp, and retention
   after raw lease expiry or `clearControl`.
2. Document `throttle: 0` as the existing full-stop command on the next eligible
   controls update. Require `ship.throttle === 0` and `flags.fullStop === true`
   before clearing; read `ship.speed` for actual rest.
3. Preserve and document the combat-release full stop. Preserve API v2, commands,
   observation fields, raw-control behavior, and state ownership.
4. Make the protocol discoverable in both `setControl` and `clearControl` help.
5. Verify real controls plus public act/observe transitions, malformed requests,
   detached snapshots, relevant regressions, build, and unchanged boot test.
6. Exercise raw ramp, expiry, clear and commanded stop in a live browser using
   actual frames and public actions; check console health and disclose fixtures.

Non-goals: approachDock repair, automatic braking on raw lease expiry, new
observation fields, gauges, keys, persistence, equipment, bridge changes,
credentials, browser LLMs or dependencies.

## Implementation

Only runtime help text changes in `src/game/agent-schema.js`. `clearControl`
retains its existing args/roles shape and adds a note using the existing frozen
command-spec pattern. No changes to controls, ship physics, observation or API
dispatch behavior are made. The API guide, backlog and wishlist explain the
contract. Package scripts expose focused and live regression probes.

The focused fixture installs real controls and the public API. Positive throttle
ramps at 0.5/s; omitted/null targets leave the setpoint alone. Raw expiry/clear
retain the last applied value. Explicit zero applies zero/fullStop on an update;
clearing before that update discards the request. Combat clear and expiry still
apply their existing full stop. Snapshot mutation and malformed throttle values
cannot alter a valid active raw lease through the public API.

## Verification

Executed September 11, 2026 UTC (September 10 local). Raw output is retained in
ignored `out/issue-103-evidence/`; generated artifacts are not committed.

| Check | Result and evidence |
|---|---|
| `npm run test:throttle-observability` | PASS, 12 groups; `focused.log`. Real ramp/last-live-tick expiry, clear/idempotence, omission/null, zero handshake, malformed values, combat clear/expiry, detached finite JSON snapshots. |
| `npm run build` | PASS, 146 modules, bundle policy passes at 1796.88 KiB minified / 537.90 KiB gzip; `build.log`. No policy change. |
| `npm run test:boot` | PASS, `BOOT TEST PASS — no update errors`; `boot.log`. Boot test is unchanged and includes agent-gameplay checks. |
| Agent/combat regressions | PASS: `test:agent-schema`, `test:agent-hardening`, `test:combat-intent` (33 groups), `test:reactive-defense` (19 groups); `regressions.log`. |
| `npm run test:throttle-observability-live` | PASS, 5/5 pins, zero console errors and uncaught exceptions; `live-command-approved.log`, `live/result.json`, `live/console.txt`. |
| Diff hygiene | `git diff --check` passes; runtime behavior files and `scripts/boot-test.mjs` unchanged. |

The first focused run failed because its expiry assertion compared an earlier
ramp snapshot (0.1667 after 20 frames) with the final setpoint (0.25 after 30
applied frames). `focused-initial.log` preserves the failure. The corrected test
captures the last live tick, proves the ramp advanced, and requires exact
retention at the transition and 120 later ticks. It does not weaken the contract.

The initial live command failed to create its temporary profile under the
filesystem sandbox, before browser startup (`live-command.log`). An approved
local run passed. Pre-run inspection corrected the fixture's Object3D lookAt
orientation; local +Z faces the star and the ship's -Z nose faces away. A late
comment clarification did not change executable probe logic.

## Live browser evidence and limits

The probe uses headless Chrome with platform graphics, isolated loopback Vite
and CDP ports, an owned temporary profile and owned-process cleanup. It retains
the existing probe-only `watch: null` / `noDiscovery` workaround. Production
configuration is unchanged.

The public handle starts Greenhand and drives through `rimward.act`/`observe`.
One disclosed `__ctx` orientation fixture reapplies the normal spawn orientation
with `lookAt(sunPosition)`. It measures the actual nose/outward dot product as 1.
No throttle, speed, position, time, lease, event or flag is fabricated. All
sampled sun zones remain clear.

- Active input ramps to the requested 0.35 setpoint across actual frames.
- Expiry reports `expired`, throttle 0.35 and speed 61.5; thrust persists.
- Explicit clear reports `cleared`, throttle 0.5 and speed 75; it does not brake.
- The first sampled frame after the zero request reports throttle 0,
  `fullStop: true`, and speed 74.0468. Speed then reaches 0 and stays there
  through four seconds sampled after clear. Zero throttle is not instant rest.

Screenshots are `live/01-launched-clear.png` through
`live/05-commanded-zero-stops.png`. This is an orientation-assisted raw-control
check, not an organic campaign. Combat-release and malformed-state checks are
runtime fixtures, not additional live combat flights. The probe's bounded
wall-time sampling windows were sufficient for this run; this is not a
cross-platform timing, full-release or startup-performance certification.

## Review and rollback

Quinn returned **PASS** on `f7593a085ca8ff710f9d21d4c2e127001785a227`
on 2026-09-11 UTC through Codex, independently of the Claude Code builder.
The focused 12 groups, schema, hardening, combat-intent 33 groups and
reactive-defense 19 groups all passed independent reruns. Four additional
boundary groups covered zero expiring before application, positive resume and
downward ramp, held-input release, and omitted/malformed throttle handling.
The QA fixture's initial negative-zero equality assertion was corrected;
its initial failure remains in the raw evidence. No committed tests were altered.

QA independently inspected the recorded build/boot output and coordinator-run
live evidence, including the final screenshot. It did not repeat those runs.
No blocking correctness, security or regression finding was identified. The
live stop pin checks deceleration; raw observations and the screenshot separately
prove actual rest for this run. The original eight-file artifact and clean
working tree were verified before and after review. Detailed verdict and raw
checks remain in ignored `out/issue-103-evidence/qa-verdict.md` and `qa-*.log`.

Next step: owner authorization to push this branch and create a draft PR.
Automatic approval review rejected the attempted push because the request did
not explicitly authorize external publication. No remote write occurred.
This documentation-only follow-up records QA and the hold; merge and deployment
remain separate gates.

Revert the implementation commit to restore prior help/docs/test scripts. No
migration or saved-state rollback is required because runtime behavior and
persisted state are unchanged.
