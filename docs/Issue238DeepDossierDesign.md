# Optional complete dossier — issue #238

## Contract and evidence

Design by Sloane for [#238](https://github.com/barryrwilson/Rimward/issues/238), within tracker #233. Baseline: `a983981b73fa6ae99999a003a92a8848d8df89ee` (merged #236/#237). This document proposes the bounded implementation contract and initial playtest tuning; it does not claim user approval of balance, completed implementation, QA PASS, or deployment authority. Base contracts are settled. After independent design review, this is a concrete handoff under the user's “Next issue” request; no generic additional approval gate is implied.

Discovery used the everyday checkout's existing Graft graph before source reads. The isolated worktree initially had no graph; its source baseline is identical. The installed Graft tool subsequently built the isolated worktree graph for implementation discovery. The approved historical [base design](Issue236237CourierShadowingDesign.md) explains intent; current code below governs where that older document differs.

| Current behavior | Exact baseline evidence |
| --- | --- |
| Basic offer freezes posted reward; acceptance copies it to `payQuoted`, starts a 900-second deadline, initializes observation | `src/systems/station.js:3688-3719,6522-6558` |
| Thirty seconds selected at 150–400 units with certified geometry and clear sight produces basic-ready; acquired reports stop all mission risk/progress | `src/game/courier-shadow.js:722-880` |
| Risk is independent of selection; close range gains 10/s, safe time decays 5/s, warning at 40, exposure needs 100 and 8 warned danger seconds | `src/game/state.js:790-820`; `src/game/courier-shadow.js:763-820` |
| Visible-frame integration, warning presentation, exposure, acquisition and autosaves are centralized | `src/systems/station.js:3836-3880`; `src/game/courier-shadow.js:695-701` |
| Expiry precedes settlement; acquired report survives record loss; employer settlement terminalizes before reward and replaces row | `src/systems/station.js:3887-3956` |
| Courier ownership lasts for every accepted shadow job, including basic-ready | `src/game/courier-shadow.js:631-640`; `src/game/world.js:868-874` |
| Save sanitization rejects unknown nested fields and contradictory progress/history | `src/game/courier-shadow.js:563-613`; `src/game/save.js:570-600` |
| Shared projection feeds Jobs and public API; job API retains generic acquired/return status | `src/systems/station.js:8367-8399`; `src/game/agent-observe.js:467-524` |
| Galaxy Chart already works in flight, has accessible buttons, continues simulation, uses remappable chart binding (fallback M), and closes on docking | `src/systems/galaxychart.js:211-260,947-974,1331-1339,1394-1439` |
| Job abandonment is a separate docked Jobs action with standing cost | `src/systems/station.js:8570-8596` |

## Player outcome and deliberate choice

Keep introductory spy jobs and the named courier's basic objective unchanged. One optional dossier attempt is available only on newly posted contracts supporting this version. Basic remains useful: it records the courier's identity and observed local route. A complete dossier additionally records sustained corroboration of that same named courier's route and traffic pattern. This is textual evidence, not fabricated knowledge of cargo, secret contacts or hidden intent.

Post both exact amounts in the initial Jobs offer and freeze both at acceptance. At basic completion say:

> Basic report ready. File at <employer> before the deadline for <B> UU. Optional: open Galaxy Chart (<current binding>) → Shadow assignment to attempt a complete dossier for <D> UU total (+<D-B>). It needs 30 more seconds at 150–400 units. Staying within 400 units now attracts attention, even without selection. Open beyond 400 or break sight to cool off. Exposure ends the dossier attempt; your basic report survives.

Use an ordinary button section in the existing Galaxy Chart; no new key/digit or overlay type. It lists each eligible accepted job by unique ID, target name and employer. Its fully visible terms include the two amounts, remaining deadline, additional requirement, current warning history/grace, withdrawal rule and evidence-loss consequence. Native buttons are **“Attempt complete dossier — <D> UU total”** and, while pursuing, **“End dossier attempt; keep basic report”**. Closing the chart or ignoring the offer is never consent or forfeiture. A player can simply return for B. Starting closes the chart through its existing close path so the pilot can fly; it neither changes helm ownership nor steers the ship. A new action is explicitly added to the public API as the equivalent of clicking this existing-surface interaction, not a navigation or completion command.

Start requires a live accepted supported job, basic complete, not previously attempted/closed, original deadline still future, alive and undocked player outside berth/jump/pause, exact selected courier detectable in destination, certified corridor, clear sight and 150–400 range. Report failed conditions explicitly; do not silently select a target, reset risk or start remotely. Chart need not be open for the API, as with other equivalent player actions; all world eligibility checks are identical. Beginning preserves suspicion, warning history and spent grace. Terms warn if prior history means less room to linger. The safe escape is always available by flying away. No minimum grace is gifted by the choice.

## State and lifecycle

Keep `job.state`, `need: 1` and binary `progress` semantics. Once basic completes, `progress` stays 1 until the normal job terminal outcome. Deep readiness is additional state, never progress 2 and never a second job.

| Durable deep status | Public phase after basic | Meaning / payment currently earned |
| --- | --- | --- |
| `available` | `basic-ready` | Basic banked, optional attempt unused; B |
| `pursuing` | `pursuing-deep` | One attempt active, partial deep evidence retained on pauses; B |
| `ready` | `deep-ready` | Full corroborated dossier banked, all mission risk stops; D |
| `closed` | `basic-ready` | Optional attempt ended permanently; B; explain reason |
| `legacy` | `basic-ready` | Earlier accepted contract keeps original basic-only terms; B |

Before basic, use existing seeking/observing/paused phases. Before starting, no deep seconds or deep risk accrue however long the pilot remains. Basic-ready may retain a live courier because current ownership already does so; no courier spawning/retargeting rule changes are needed.

While pursuing, selected safe-band clear-sight observation accumulates **30 additional seconds**, capped exactly at 30, independently from the original 30. Same identity, geometry, no-scanner requirement and frame integration bounds apply. Deselection, broken sight, out-of-range, temporary mesh retirement or uncertified corridor pause evidence without clearing it. Exposure resolves before deep completion in an interval. Completion ends optional risk and banks D until deadline/abandonment/ordinary recovery rules.

| Interruption / outcome | Required effect |
| --- | --- |
| Selection lost, outside observation range, sight blocked | Pause deep seconds. Risk follows its independent rules; no re-entry reset. |
| Courier exists but mesh absent or temporarily outside certified corridor | Pause all mission integration, preserve evidence/risk; deadline continues. |
| Dock away from employer / berth hold / leave destination system | Freeze evidence/risk/grace. Resume on return to same courier if still present and attempt pursuing. |
| Genuine bound-record destruction, capture, dereliction, migration or permanent loss | Before basic: existing failure. After basic: set available/pursuing attempt closed with `target-lost`; clear incomplete deep evidence, preserve B. Ready dossier remains D. Never respawn. Resolve this even offscreen using existing initialized-bank safeguards. |
| Exposure during deep | Close attempt with `exposed`, clear incomplete deep evidence, retain basic and B. Stop mission risk. Say “Tail identified; dossier opportunity lost. Basic report still files for B before deadline.” No global standing, police or attack effect. |
| Explicit end-attempt button/API | Close with `withdrawn`, clear incomplete deep evidence, preserve B; cannot retry. This is distinct from abandoning the job. |
| Expiry (`now >= deadline`) | Existing whole-job failure wins before start, progress or settlement, regardless of evidence tier. No extension at opt-in/completion/reload. |
| Employer docking before deadline | Auto-file earned tier: D only if ready, otherwise B (including pursuing). Terminalize once; no follow-on premium payment. |
| Explicit job abandonment at a permitted dock | Existing job/standing consequences; zero payment and release ownership. Do not alias end-attempt to abandonment. |
| Death / reload | Existing coherent recovery snapshot semantics. Restore credits, job, risk and evidence together. No evidence transfer across snapshots; warning must be presented again before grace resumes. |
| Terminal job/repost | Existing cleanup and new unique offer. New offer cannot inherit deep evidence/quotes or target identity. |

Banked basic is protected against the optional attempt, not against the already communicated contract deadline or the player's explicit whole-job abandonment. Both qualifications must appear in terms.

## Proposed playtest tuning and risk

Use named constants in `src/game/state.js`. Proposed first test: 30 additional observation seconds; total dossier pay `D = clampJobPay(B + round(B * 0.50))`. This is a 50% premium proposal for the extra sustained exposure, not a deduction from the historical 420 UU introductory jobs and not a claim of balanced earnings. Omit the optional offer when the bounded quote cannot exceed B; preserve basic availability. Store the computed terms, not a dynamically recalculated premium.

During pursuing only, clear mutual sight within the certified envelope gains 4 suspicion points/s at 150–400 inclusive and the existing 10/s below 150. These rates are alternatives, never additive. This risk is independent of selection. Outside 400 or blocked sight decays at existing 5/s while mission integration is active. Existing warning at 40, maximum 100 and eight cumulative warned-danger seconds remain; “dangerous” for pursuing means clear sight at <=400, including selection loss. Existing warning-crossing frame and visible-presentation safeguards remain. Deep warning wording must say **open beyond 400 or break sight**; a reused 150-unit instruction would be wrong. Basic warning wording stays unchanged.

From zero suspicion, uninterrupted deep observation warns around 10 seconds and risks exposure around 25 seconds, before 30 seconds can complete. Thus at least one withdrawal/cooling maneuver is intended; observation progress survives it. Values are approximate because the warning-crossing frame does not integrate evidence/grace. A pilot can leave earlier and return. Cooling does not replenish spent grace or erase warning history. The whole observation/risk ray stays within the existing 400-unit certified envelope; no larger geometry certificate is introduced. Pane toggling has no effect on integration. Chart remains live and timers follow the same visible-frame rules as flight; no modal pause assumption. HUD warning must remain legible with chart open or be repeated within its mission section.

Playtest these values with a starter light hull and no special equipment: basic exit, warning comprehension, opening beyond 400, cooldown, reacquisition, successful dossier, interrupted dossier and return travel within the original 900 seconds. Record real elapsed times, realized payments and near-misses. Adjust only this issue's proposed deep constants if evidence warrants; freeze a single reviewed tuning set before final verification. No base deadline, route, physics or economy rebalance is part of this issue.

## Explicit JSON-safe additions and migration

Bump the **nested shadow schema** to `v: 2`; no new world-level field or global save-version requirement. Retain all six existing shadow fields and add exactly one whitelisted plain object `shadow.deep`:

| Field | Validation and semantics |
| --- | --- |
| `state` | Exact enum `available`, `pursuing`, `ready`, `closed`, `legacy` |
| `observedSeconds` | Finite 0–30; zero for available/closed/legacy, <30 for pursuing, exactly 30 for ready |
| `payQuoted` | Finite integer in existing payout bound; D for supported contracts, 0 for legacy. Store at offer creation and copy unchanged through acceptance; no multiplier after acceptance. |
| `closedReason` | Exact enum `''`, `exposed`, `withdrawn`, `target-lost`; nonempty iff closed |

Basic pay remains `job.reward` on offer and `job.payQuoted` on acceptance; deep amount is named `payQuoted` within the nested terms because it is the posted agreement even before acceptance. Offered supported rows must have available/zero evidence/empty reason, with D>B. Accepted available/pursuing/ready/closed rows require D>B using accepted B. Pursuing/ready/closed require `progress === 1`, original observedSeconds exactly 30, and courierCreated true. Available can precede basic. Legacy requires zero deep amount/evidence and empty reason. Offered rows cannot be closed/pursuing/ready/legacy. Preserve every existing warning, creation and binary-progress invariant. Reject unknown keys, nonfinite/out-of-range values and contradictory new payloads; never repair a malformed supported job into a payable introductory job or invent premium terms.

Migration: validate v1 through the existing v1 sanitizer first. Valid v1 accepted shadow jobs normalize to v2 legacy, retaining original deadline/quote/evidence/risk and no deep eligibility. Valid v1 offered rows remain v1 basic-only offers until acceptance; acceptance freezes their existing basic quote and creates v2 legacy state (never the fresh v2 available state). The parser/runtime explicitly support these unworked v1 offers, and their projection says no optional dossier. Never advertise or compute a premium retroactively. No v1 offered row is serialized as v2 legacy. Failed/terminal v1 rows retain existing sanitizer treatment and cannot resurrect eligibility. Tests pin v1 offered acceptance as well as accepted migration. Fresh v2 offers with no room for a positive bounded premium must likewise use the preserved basic-only v1 offer path; do not create invalid available D=B data.

Runtime must carry nested state through every `stepShadow` reconstruction; merely attaching it at acceptance loses it today. Autosave on opt-in, explicit end, exposure, basic/deep completion and target-loss closure using the existing request path. Ordinary progressive evidence/risk uses existing periodic snapshot cadence. No promise is made that an unsaved frame survives a crash.

## API and UI contract

Expose additive read-only `jobs.*[].shadow.deep` with `state`, `observedSeconds`, `requiredSeconds`, `payQuoted`, `premium`, `canStart`, `startBlockedReason`, `closedReason`, `riskRange`, and the same precommitment `terms` text as the chart. Public shadow.phase differentiates basic-ready, pursuing-deep and deep-ready even when contact pauses; `contactReason` continues to explain the pause. Keep top-level acquired/return status compatible: a pursuing pilot can still return with basic. Top-level displayed `reward` and Jobs payout preview mean amount earned now (B until ready, then D); `job.payQuoted` stays B, so consumers can inspect both agreements. Publish optional offer terms on offered rows but no live risk history. Keep currentTargetId's existing detectability rule; no remote position/secret intent disclosures.

Add public action `chooseShadowDossier` with exact args `{id, choice: 'begin'|'end'}` and corresponding internal station mission method. The schema/action allowlist, help text and agent parity coverage must explicitly include it. Lookup by full job ID, validate own primitive arguments and re-check current state synchronously in shared mutation code. Human callback captures the expected job object as well as ID; stale rerender callbacks refuse. Begin on pursuing/ready/closed/legacy and end outside pursuing refuse without mutation, payment, new target, grace reset or autosave. Unrelated/introductory/terminal/foreign IDs refuse. No implicit selection of the first job, fallback to a replacement row or multi-job broadcast. No new event vocabulary: existing commLine is sufficient; record schema/API method contracts in ctx documentation without adding invented events.

The Galaxy Chart mission section, Jobs card, HUD status and API derive from the same projection/terms generator. Use textContent/native DOM, binding labels and existing styling/accessibility conventions. No raw world string goes into HTML. In multiple jobs, retain existing urgent-local-warning HUD priority, and show the selected job's identity on the chart button. The chart section refreshes eligibility and evidence while open. Preserve existing chart pan/zoom/route/keyboard behavior; buttons must not trigger chart plot or flight fire.

## Settlement, scope and verification handoff

Keep the existing single employer settlement path. Determine earned tier from validated deep state, terminalize the row before credits/contact/standing/history effects, then replace once. One delivered history row and one set of contact/standing effects per contract. A deep payout is D total, never B plus D. Saving/reloading the post-settlement world cannot duplicate either tier. Reloading an older snapshot restores older credits and evidence together; this issue does not introduce an external anti-rollback ledger.

Recommended bounded write set: `src/game/state.js`, `src/game/courier-shadow.js`, `src/game/save.js`, `src/systems/station.js`, `src/systems/galaxychart.js`, `src/game/agent-schema.js`, `src/systems/agent-api.js`, projection wiring in `src/game/agent-observe.js` only if required, `src/core/ctx.js` contract comments only, existing stylesheet only for the chart section, focused issue-238 tests and docs/backlog status. Existing HUD projection should suffice; a narrow warning-priority/wording adjustment is allowed if necessary. Preserve world/NPC ownership and route code; expand that write set only for a demonstrated contract defect with review. No contacts/equipment benefits, second contact, decoy, corroboration mission family, allegiance conflict, new global currency, key/digit, gauge, skill tree, loot, equipment SKU, or bridge exposure.

Order: (1) shared state/schema/quote/transition evaluator and focused pins; (2) human chart choice plus API parity and copy; (3) independent security/regression review and live playtest on the exact artifact; (4) document evidence, park #239/#240, and follow separately authorized merge/local handoff procedures. Rollback is the pre-change commit plus pre-upgrade save backup; old code rejects v2 shadow data, so use a coherent prior snapshot on rollback rather than claiming downgrade compatibility.

Acceptance tests must prove:

1. Basic completion displays B, D total/premium, extra requirement, deadline, opt-in surface and exposure consequence. Ignoring/closing chart never starts risk. Safe basic pays B once at employer.
2. Begin succeeds only after basic and all eligibility gates; ordinary flight/selection/hail/plot/docking never begins. UI and API produce identical mutation/refusal; stale callback, wrong ID, repeated begin/end and malformed args do nothing.
3. Deep follows only the exact courier; selected 150–400 clear/certified seconds accrue. Observation without selection, wrong identity, unsupported blockers, offscreen or delayed/hidden frames cannot grant progress. Existing base pins remain valid.
4. Risk at <150 and 150–400 follows the respective rate, independent of selection; >400/blocked sight cools, geometry failures freeze; warning precedes grace, including reload. Chart toggles and second jobs do not reset/transfer risk. Prior basic warning carries through opt-in.
5. Warning → withdraw → resume → ready succeeds on starter equipment. Uninterrupted exposure closes only optional attempt, retains B, cannot retry. Temporary interruption preserves partial evidence; explicit end/permanent target loss clears only incomplete deep evidence. Ready survives target loss.
6. Exactly-at-deadline start, observation and employer docking fail according to base expiry precedence. Non-employer dock/system travel/death/reload behave as the lifecycle table; in-progress employer arrival pays only B and ends all future premium entitlement.
7. Basic and deep settle the communicated accepted amounts despite standing changes, repeated observation, duplicate ticks, duplicate actions and post-payment reload. Deep produces one history/contact/standing result; simultaneous jobs stay distinct.
8. Save/reload every phase; v1 offer and accepted compatibility; JSON round-trip; corrupt nested state/quote/unknown fields fail closed; max jobs budget preserved. No mutation while viewing API/chart. No omniscient target handle.
9. `npm run build`, unchanged `npm run test:boot`, existing #236/#237 tests and relevant save/API/quote/abandon regression tests. New focused issue-238 test file should exercise meaningful lifecycle and shared action behavior.
10. Live browser verifies both filing choices, warnings/readability under chart, interrupted attempt, multiple-job identity, save/reload, binding discoverability and chart accessibility; capture console errors and exact commit. No automated pass substitutes for this flow.

No unresolved product decision blocks the recommended implementation. Premium, deep seconds and deep suspicion gain above are explicit initial proposals subject to the bounded playtest, not silently approved balance. Independent review may uncover a concrete conflict; amend this document before implementing a conflicting alternative.


## Issue acceptance traceability

The seven acceptance criteria below are copied verbatim from issue #238 (`gh issue view 238 --json body`, retrieved 2026-09-17). Pointers identify the design contract and the numbered acceptance tests under “Settlement, scope and verification handoff”; these are planned verification, not claims of passing implementation.

| Exact issue acceptance criterion | Contract and verification pointers |
| --- | --- |
| Reaching basic completion explicitly says the report can be filed now, names the payment, and explains the optional next step. | “Player outcome and deliberate choice”: basic-completion message names employer, B, D, requirement and Galaxy Chart entry. Acceptance tests 1 and 10. |
| The player knowingly opts into greater exposure through a clear existing control/interaction; no hidden automatic loss of a completed basic report. | “Player outcome and deliberate choice”: explicit chart button, terms and eligibility; “State and lifecycle”: binary progress and banked basic. Acceptance tests 1, 2 and 5. |
| The premium, additional requirement and detection consequences are explained before commitment. Decide and document what evidence survives an interrupted attempt. | “Player outcome and deliberate choice”: precommitment terms; “State and lifecycle”: interruption table; “Proposed playtest tuning and risk”: bounded premium and additional exposure. Acceptance tests 1, 4, 5 and 8. |
| Basic and deep outcomes pay their own accepted/communicated amounts once, only at the employer; repeated observation and reload cannot multiply payouts. | “Explicit JSON-safe additions and migration”: frozen amounts; “Settlement, scope and verification handoff”: earned-tier selection, terminal-before-effects and coherent snapshot rules. Acceptance tests 6, 7 and 8. |
| Mission-local suspicion provides readable risk and an escape opportunity. | “Proposed playtest tuning and risk”: warning/grace presentation, independent proximity risk, withdrawal beyond 400 or broken sight, persistent warning history. Acceptance tests 4, 5 and 10. |
| Deadline, target loss, abandonment and transition behavior remain coherent with the base mission. | “State and lifecycle”: explicit interruption/outcome table; “Explicit JSON-safe additions and migration”: save/death compatibility. Acceptance tests 5, 6 and 8. |
| UI and API distinguish basic-ready, pursuing-deep and deep-ready states. | “State and lifecycle”: durable/public phase table; “API and UI contract”: shared projection and action parity. Acceptance tests 2, 8 and 10. |
