# Courier shadowing implementation review — #236 / #237

Runtime candidate: `da1dc8cfa06e87eb0f3c16343b1e173bcd45e3c7`, on
`codex/issues-236-237-courier`, based on `dab0eea2`. Implementation was authored
through Claude Code in the Rex role; independent code and natural-play review
used Codex in the Quinn role. Clawd coordinated and performed the bounded Knox
security review. The owner approved the schema and scope on 2026-09-17.

Verdict: **PASS for the approved implementation and acceptance scope**.
This record and the accompanying status updates are documentation-only additions
after the reviewed runtime; they do not change its tested source.

## Implemented outcome

The Jobs desk offers a separate named-courier assignment alongside introductory
espionage. The pilot travels to its stated off-lane rendezvous, selects the
courier through ordinary targeting, accumulates 30 seconds at 150–400 units,
and returns to the employer for the accepted quote. Crowding attracts a named
warning; withdrawal stops grace consumption. Exposure ends only this assignment.
The acquired report survives subsequent loss of its courier.

The implementation includes bounded save fields, exact courier ownership and
lifecycle cleanup, static and live route-clearance checks, text-safe shared
UI/API status and exactly-once employer settlement. Session-only planet bounds
in `solarsystem.js` are the documented write-set adjustment. There are no new
events, keys, gauges, equipment, dependencies or agent commands.

## Independent review and automated evidence

Code/regression review and bounded security review PASS on the exact runtime
candidate. Earlier candidates failed review; their materialization, detection,
save-validation, warning-copy, rendezvous and HUD findings were repaired and
retested. The final HUD chooser prioritizes local danger by estimated exposure
time, then remaining grace, without changing any per-job state or API output.

- All 52 focused grouped checks pass, including independent reruns and the
  original multi-job HUD regression reproduction.
- `npm run build` and unchanged `npm run test:boot` pass on this candidate.
- Real NPC motion in a synthetic fixture ran 240 simulated seconds, ten end
  turns and 7,200 frames. Maximum hull offset was 41.96 units inside the
  50-unit corridor.
- Route certification covered seven authored and fourteen representative
  generated systems: fourteen route candidates passed the seeded-load
  certificate and seven were omitted (four gate,
  two planet and one asteroid clearance failures). Moving planet bounds are
  also checked at materialization and during play.
- Synthetic tests cover LOS blockers, inclusive observation/detection edges,
  delayed ticks, malformed saves, warning grace, lifecycle loss, multi-job
  isolation, expiry, abandonment and payment after restore. These fixtures
  are not claims of naturally reproducing every geometry or lifecycle case.

Local raw evidence is retained under ignored `out/issue-236-237/`, including
`independent-review-da1dc8cf.md`, `security-review-da1dc8cf.md`,
`independent-focused-da1dc8cf.log`, `warning-priority-{focused,build,test-boot}.log`
and `route-omission-report.md`.

## Natural browser evidence

Fresh stock Greenhand runs use native randomness and public `observe`/`act`
gameplay controls. No save injection, teleportation, altered simulation clock,
invulnerability or suppressed traffic is used. CDP provides browser transport,
screenshots, viewport checks and ordinary page reload. The controller uses
normal throttle and steering; physical match-speed is not separately exercised.

Career attempt 5 acquired all 30 seconds at world time 125.12, deliberately
lost/reacquired contact, collected an introductory spy report by ordinary
destination docking and returned to Freehold Landing. The frozen 420 UU quote
for each job paid exactly 840 UU in total (350 → 1190); both jobs disappeared
and repeated ticks paid nothing further. The acquired shadow report survived
the courier becoming unavailable before filing. Console errors and exceptions
were empty. Acceptance to acquisition took about 86.44 simulated seconds;
acceptance to settlement took about 290.94 seconds. Source and shared harness
hashes remained unchanged.

Career evidence: `live-da1dc8c-attempt-5/courier-career/`. Its original result
reports `scenarioComplete: true`, but `checksCompleted: false` because Chrome
exceeded the harness's six-second shutdown check. The unmodified result records
closed ports; `cleanup-followup.json` independently confirms the owned Chrome
and Vite processes were subsequently absent. This cleanup timing failure is
not reported as a clean harness exit.

Rendered mission status was inspected at desktop and 768-pixel narrow widths
on this runtime; the earlier Agent-play overlap is resolved. The settlement
screenshot independently shows both 420 UU receipts, 1190 credits and +4
combined standing.

Combined warning/reload/exposure attempt 4 reached a named warning at world
time 82.5019 and withdrew at 90.2566. Holding 500 units above the rendezvous
allowed a normal autosave. Reload restored world time 111.5146 from a
pre-reload time of 167.6469, preserving the same job ID, 420 UU quote, absolute
deadline, zero observation progress and exactly 6.874600000023842 seconds of
remaining warning grace. This is a coherent autosave rewind, not clock mutation.

The pilot deliberately closed in again in that restored history. Exposure was
observed at 148.9916, with the visible message “Courier identified the tail.
Assignment lost; withdraw.” Ordinary escape completed at 158.0616 with hull
100, screen 40, shell 60, credits 350, fear 0 and combat false. Zero faction
standing writes are established by code review and focused tests; the public
flight API does not expose standing, so no live standing measurement is claimed.
Root also inspected the warning, exposure and retreat screenshots directly.

Combined evidence: `live-da1dc8c-warning-4/courier-warning-reload/`. Both
`scenarioComplete` and `checksCompleted` are true; source and harness hashes
are stable, console errors and exceptions are empty, dedicated Chrome/Vite
processes exited and ports closed. An ignored harness copy only adjusted the
repository path, CDP transport timeout from 20 to 60 seconds and shutdown wait
from 6 to 20 seconds. These transport changes did not alter game behavior.
All natural runners are stopped. The independent tester's final scoped verdict
is retained in `out/issue-236-237/final-live-verdict.md`.

## Limits and handoff

Natural attempts encountered ordinary pirate loss of the courier and the
existing #234 blocked/impact docking problem. Failed or interrupted attempts
remain evidence; they were not converted into passes by changing game state.
The successful career used an ordinary approach retry after an impact stop.
Controller startup, reacquisition and asynchronous docking assertions required
runner corrections; these are separate from product fixes.

Provisional tuning remains provisional: a successful starter-hull run is not
a broad balance or docking-reliability conclusion. Optional deep intelligence
(#238) remains parked. No merge or deployment is authorized or performed, and
the everyday checkout is unchanged. Before future deployment retain the prior
artifact and a compatible pre-feature save backup; older readers can discard
the new subtype. A later authorized merge requires the documented local
checkout handoff.
