# Issue #102 — Agent-visible solar hazards

## Mission and acceptance contract

Source: [issue #102](https://github.com/barryrwilson/Rimward/issues/102).
Selected from the open queue by the owner's “Next issue!” request on
2026-09-10 local. Baseline: master
`d1b7d8f8985b43dc191096178ac1a7434deb7429`; branch:
`codex/issue-102-solar-hazards`.

Implementation artifact: `57a81c65a0511bb2b022bf506a00d06f2a6450f2`
(`Expose live solar hazards and damage events to agents`). The subsequent
evidence/backlog commit changes documentation only.

Stage: independently QA-approved, awaiting PR review and merge. Rex owns source and test implementation through the
Codex fallback harness; Clawd coordinates scope and evidence and executed the
live probe. Quinn's independent Claude Code review returned PASS on
`de3346a9322daa2d3027a0763a150abb2c61c4bf`.

The selected outcome is that an agent can identify the live star's danger
boundaries before entering them and recognize actual solar damage through
the public API. Freehold's direct station-to-Veridian-gate line passes through
the heat zone; the issue records repeated raw-control deaths there.

Acceptance criteria:

1. Public observation exposes the live sun position, heat boundary and lethal
   boundary using the same physics constants as damage. Current relative
   geometry and zone must agree with the runtime where available.
2. Actual solar heat and lethal-core events reach the bounded, sanitized public
   event stream with meaningful timestamps and readable solar identity.
   Weapon heat remains distinguishable from solar exposure.
3. Snapshots remain detached and JSON-safe. Missing/uninitialized suns and
   changes of system cannot retain stale geometry. Existing session and
   damage-suppression rules remain effective.
4. The API guide describes the existing sun-avoiding navigation commands and
   the responsibility of a caller steering with raw control.
5. Focused tests, relevant API/combat regressions, `npm run build`, and the
   unchanged `npm run test:boot` pass. Live browser flows exercise observation,
   actual heat damage, escape from the heat zone, and console health.

Scope is additive solar observability and supporting documentation/tests.
Authored station/gate layout, damage balance, raw control leases (#103), launch
holds (#105), persistence, equipment, keys, gauges, bridge security and an
in-browser LLM are excluded.

## Baseline findings

- `src/game/physics.js` sets heat radius to `sunRadius * 2.4` and lethal radius
  to `sunRadius * 1.12`; Freehold therefore has 144 u and 67.2 u boundaries.
  `sunZone` includes equality at each boundary.
- `src/systems/combat.js` already emits `sunHeat` and `sunKill`, but the agent
  schema does not admit them. The HUD uses those events for its star warning.
  Existing heat payload `t` also shadows the event's world-time field.
- `src/game/autopilot.js` calls `appendSunBody` and `planApPath`; the normal
  live system's heat sphere already participates in route avoidance. Raw
  `setControl` does not provide that route planner.

## Verification and handoff

Implementation adds `hazards.sun` with live position/radius, shared heat/core
boundaries, current distance, zone, intensity and heat DPS. Unavailable geometry
is null; snapshots own their JSON data. The existing `sunHeat`/`sunKill` events
are admitted to the public ring. Heat warnings retain the existing cadence,
fold repeated warnings, and carry separate world-time `t` and heat `intensity`.
System load resets the warning cooldown. Damage and authored layout are
unchanged. The API guide documents normal route avoidance and raw-control
responsibility.

Raw local evidence is in ignored `out/issue-102-evidence/`; no generated
screenshots or build output are part of the source commit.

| Check | Result and evidence |
|---|---|
| `npm run test:solar-hazards` | PASS, 13 scenario groups; `focused.log`. Real combat-to-public heat/core events, boundaries, live configuration, detached snapshots, suppression, timestamp integrity, sanitation, bounded retention. |
| `npm run build` | PASS; `build.log`. 146 modules, current bundle policy passes at 1,795.72 KiB minified / 537.47 KiB gzip. No budget change or exception. |
| `npm run test:boot` | PASS, `BOOT TEST PASS — no update errors`; unchanged boot test, `boot.log`. Existing solar boundary/damage and sun-detour checks pass. |
| Agent and combat regressions | PASS: `test:agent-schema`, `test:agent-hardening`, `test:agent-gameplay`, `test:combat-intent`, `test:reactive-defense`; `regressions.log`. |
| `npm run test:solar-hazards-live` | PASS, 4/4 pins, zero console errors and uncaught exceptions; `live-command-revised.log`, `live/result.json`, `live/console.txt`. |

## Live browser evidence

Executed on 2026-09-11 UTC (September 10 local), headless Chrome with platform
ANGLE/Intel graphics, an isolated temporary profile and loopback Vite/CDP ports.
Only the probe's own child processes and checked temporary profile are cleaned
up. The harness uses the existing `watch: null` / `noDiscovery` Vite workaround;
production configuration is unchanged.

1. Normal public new-game/origin flow reports Freehold's sun at `[0,0,0]`,
   radius 60, heat boundary 144, lethal boundary 67.2, in clear space.
2. Public `plotRoute(veridian)` and `engageAutopilot` succeed and report the
   correct route. This is route engagement, not a completed gate crossing.
3. A disclosed fixture places the player at 136 u from the sun, zeroing exposed
   motion controls without modifying damage, events, time or the sun. Real
   frame updates reduce shields from 40 to 39.94094 and emit `sunHeat` at
   world time 1.2809, intensity 0.10417 and DPS 7.87501. Weapon heat remains 0.
   The screenshot shows the existing `STAR HEAT — turn away` HUD warning.
4. The fixture moves the player outside the heat zone. Shields rise from the
   immediate exit baseline 37.68116 to 38.10516 after 3.1 seconds, live zone
   is `clear`, heat DPS is 0, and the historical heat event retains its timestamp.

Screenshots: `live/01-freehold-observation.png`,
`live/02-real-solar-damage.png`, `live/03-clear-after-exit.png`.
These are fixture-assisted solar-exposure checks, not an organic campaign;
normal flight may continue to settle after positioning. Lethal-core and
system-change checks are automated fixtures, not additional live traversals.

The first attempt failed to create its temporary profile under the filesystem
sandbox (`live-command.log`). An authorized local run then passed 3/4 pins
but used the pre-screenshot shield reading as its exit baseline, inadvertently
counting real damage during capture before exit. The revised probe captures
the baseline in the same evaluation as exit positioning. Zone, no-new-heat-event
and shield checks remain enforced. The original failure is preserved in
`live-initial/` and `live-command-approved.log`; it is not relabelled a pass.

## Independent review and release boundary

The attempted Claude Code builder launch was rejected by automatic approval
review because project-source export to that external service lacked explicit
authorization. It did not run. The Codex fallback is permitted by Rex's role
instructions. The separate-engine QA gate is still required by the team
operating rules; no same-engine check will be labelled independent QA.

The owner subsequently explicitly authorized Claude Code reading the relevant
source and running independent tests. Quinn used `claude-opus-5[1m]` and
returned **PASS** on `de3346a9322daa2d3027a0763a150abb2c61c4bf`, with a clean
working tree and no implementation drift. Raw stdout is preserved in
`out/issue-102-evidence/qa-stream.jsonl`; the complete extracted verdict is
`qa-verdict.md`. The reviewer made no source changes.

Independent runs passed the 13-group solar suite, build, unchanged boot,
agent-schema, agent-hardening, combat-intent (33 groups), reactive-defense
(19 groups) and the live solar probe (4/4, zero console errors/exceptions).
The independent live rerun refreshed `live/`; the numerical trace above is
the coordinator's earlier run preserved in `live-command-revised.log`.
The boot command also includes the agent-gameplay checks. In addition, the
reviewer ran 30 schema and 20 runtime checks covering hostile field values,
ring saturation, boundary agreement, stale geometry, snapshot mutation,
docked suppression, actual heat damage and timestamps. Its runtime probe
initially used the wrong fixture state path, then corrected that probe;
the initial failure and successful rerun remain in captured stdout.

Non-blocking observations, kept outside this issue's implementation scope:

- `_sunKillEmitted` resets on system load, so a synthetic same-system revival
  followed by another core death omitted a second `sunKill` while still emitting
  `playerDestroyed`. This is pre-existing behaviour; the real recovery flow
  was not replayed. Reproduce that flow before selecting a separate repair.
- Core-death rows do not coalesce, but remain bounded like other significant
  receipts. Geometry/DPS remains visible while damage is suppressed, as the
  guide documents; callers must read session flags too.
- Navigation uses authored sun radius while observation/damage uses live
  radius. Normal systems agree; privileged radius changes are outside the
  documented route guarantee.
- The live fixture derives its heat placement from observed radius; the
  independent numerical boundary checks cover this shared test input.

Review limits: one Windows run per suite; no completed gate crossing,
full-release or startup-performance claim. The reviewer did not inspect the
live screenshots or historical ignored Wave 126 contract. The coordinator
inspected the heat screenshot; current issue scope and current code/tests
govern the accepted change.

Coordinator source inspection found no expansion of public commands, persistent
state, DOM rendering, bridge exposure or credentials. Solar observation admits
only known geometry and primitive event fields. This inspection is not the
independent QA gate. No full-release or startup-performance certification is
claimed.

Next gate: PR review and merge handoff. The independent verdict approves the
named implementation and evidence artifact; subsequent status documentation
does not alter source or tests. Merge and deployment are not claimed here.
