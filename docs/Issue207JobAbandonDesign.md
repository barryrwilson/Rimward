# Issue 207 — Abandon ordinary accepted jobs

Base: `07e2fafa2a9312cc46d2ec8dec44d9fd51bd80d6` (origin/master).
Issue: #207 in this repository.
Stage: implementation complete; independent QA handoff pending.
Owner: orchestrator; specification: Sloane.

## Outcome and scope

A player who accidentally accepts ordinary work can drop it immediately at any dock's Jobs board, using either a visible button or `abandonJob { id }`. Supported kinds are mining, trade, hunt, passenger, explore, espionage, and war. These are repeatable jobs with existing replacement lifecycles. Charge exactly 1 standing point to the posting faction, resolved from the accepted job's originSystem, never the current dock. Present the named faction and cost before the button is activated, and in the success receipt/notice. No confirmation modal is required for this small, explicitly labelled action.

Ferry, legacy haul, recovery, chain, bounty and patrol jobs are excluded from this first pass. The board must explain why an accepted unsupported kind cannot be abandoned, and direct/API calls must explicitly refuse it without mutation. Ferry exclusion is essential: consignment ownership is derived from accepted ferry records, so simply failing a ferry would turn free fronted cargo into sellable property. Do not change its cargo or agreement.

## Acceptance contract

1. Each supported accepted card exposes an Abandon action labelled with its -1 posting-faction standing cost. It works at any dock and immediately removes the old job from active observation and HUD tracking. The same shared action implements the desk facade and public `abandonJob { id }` command.
2. Both UI and API require a docked player and the Jobs service. Resolve the live row by its ID; never trust passed object fields, cached card handles, kind, faction, state, or origin. Unsupported kinds, unknown/stale IDs, non-accepted rows, invalid posting faction, wrong service, and undocked calls refuse before changing jobs, standing, credits, cargo, progress, or rewards.
3. On success, transition through existing failed lifecycle and record one `jobState` event with outcome `abandoned`. Reuse each supported kind's existing replacement helper so the old accepted row does not linger as a misleading DONE card or return after save/load. A new offered replacement may reuse the existing normal slot policy. Do not introduce a new persisted state or field.
4. Apply -1 standing exactly once using the existing canonical standing mutation path. No credits, job/contact completion reward, kill/bounty award, delivery consumption, chain progression, or equipment grant occurs. Player-owned cargo stays aboard unchanged. Abandoning a passenger contract does not introduce cargo, which the current passenger implementation does not create.
5. Within a loaded session, repeating a command or clicking a stale card cannot charge twice or abandon a replacement posting. After reload, callers must re-observe live IDs before acting. Subsequent ordinary ticks, arrival at the former destination, killing the former quarry, and save/load cannot complete the abandoned contract or pay its contracted reward. Independent ordinary world bounties retain their preexisting semantics.
6. Successful notice and API receipt identify abandonment and the faction/cost. API command registry, mission capability documentation, service coverage and availability include the new command consistently. UI text uses text-safe DOM APIs.
7. Automated coverage includes one success for all seven kinds, cross-dock faction charging, duplicates/stale/forged IDs and objects, invalid origin, offered/done/failed rows, undocked/wrong-service calls, and every excluded kind. Test no reward/cargo mutation, active-list removal, terminal event once, ordinary follow-up ticks, and save/load. Run build and test:boot unchanged. Exercise a real visible board button and API parity in a live browser; inspect console errors.

## Current-code evidence (base above)

- `src/systems/station.js:4051-4085`: accepted ordinary rows are already visible across docks; offer origin gates are narrower.
- `src/systems/station.js:2487-2538`: detach/replacement helpers remove an old row and repopulate the ordinary slot. Equivalent helpers start at lines 2768, 3001, 3093, 3411, 3610 and 3871.
- `src/systems/station.js:4218-4241`: noteJobOutcome records the terminal outcome and suppresses duplicate agent watcher reporting.
- `src/systems/station.js:4751-4773`: war failed and lapsed paths replace their rows; parallel ordinary-kind paths use the same convention.
- `src/systems/station.js:7867-7895`: accept desk adapter resolves live IDs; abandonment should be stricter and never fall back to accepting a supplied object.
- `src/game/save.js:220`: persisted job states are offered/accepted/done/failed.
- `src/game/consignment.js:40-77`: accepted ferry rows derive reserved ownership; changing state alone releases cargo.
- `src/systems/agent-api.js:539-546`: accept command desk gating and adapter routing provide the matching public pattern.
- `src/game/agent-observe.js:940`: dock-gated command availability list needs parity.

The graft graph on this new worktree initially had stale station spans; the line numbers above were checked directly against the base source after graph discovery.

## Bounded write set

- `src/systems/station.js`: shared abandonment policy/action, accepted-card button/refusal copy, desk facade, immediate existing replacement and terminal outcome.
- `src/game/state.js`: named -1 abandonment standing tuning constant, if exported tuning is needed (no persistent field).
- `src/systems/agent-api.js`: command dispatch and desk gating; success notice parity.
- `src/game/agent-schema.js`: command name/schema, mission/service capability descriptions.
- `src/game/agent-observe.js`: dock/service availability parity only.
- `scripts/issue-207-job-abandon-test.mjs`: focused regression coverage, using existing harness.
- `scripts/issue-207-job-abandon-live-probe.mjs`: durable live verification flow when consistent with existing issue probes.
- `package.json`: focused test command only if needed by normal repository test conventions.
- `docs/Issue207JobAbandonDesign.md`: this mission/specification and implementation/review evidence.
- `docs/REMAINING-WORK.md` and `docs/PLAYER-EXPERIENCE-WISHLIST.md`: bounded status update describing completed ordinary abandonment and explicit remaining exclusions.

No changes to save format, consignment accounting, core event vocabulary, new keyboard controls, HUD gauges, equipment or keys. No external issue writes, merge, or deployment are authorized by this design. Builder produces isolated branch plus exact commit and evidence; independent QA evaluates that immutable artifact. Rollback is reverting the reviewed change before any separately authorized deployment. No unresolved owner decision blocks this accepted first-pass scope.


## Implementation evidence — 2026-09-16

Shared station action resolves only live IDs, validates dock/service/state/kind/origin before world mutation, charges canonical posting-faction standing, records `abandoned`, and invokes existing ordinary replacements. Accepted cards show a text-safe named -1 cost. Excluded accepted kinds show an explanation. Public command registry, mission capabilities, service coverage, availability, receipt and documentation agree.

Focused verification: `node --import ./scripts/with-css-stub.mjs scripts/issue-207-job-abandon-test.mjs` passes actual acceptance and abandonment for seven kinds, cross-dock standing, active removal, zero cargo/credit mutation, single terminal event, follow-up ticks, former-destination arrival, former-quarry death fixtures, unchanged progress/contact/equipment state, save/restore, exclusions, malformed/stale inputs, and service/dock gates. A replacement is accepted before retrying the old ID and retained DOM button.

Live verification: `node scripts/issue-207-job-abandon-live-probe.mjs` passes at loopback port 5187 using disposable Chromium, rendered Jobs board, native CDP mouse click, public API parity, duplicate refusal, unchanged credits/cargo, and zero console errors/exceptions. The saved 1440x900 screenshot was inspected; the full named standing cost is readable within the card. Evidence remains untracked at `out/issue-207-live/abandon/`. The harness explicitly places the ship at a safe berth; this does not claim natural flight. Dedicated designer audit and mobile/tablet checks were not run; existing semantic button styling is reused.

Builder self-applied security and code review checklists: no open HIGH/CRITICAL findings; no new network boundary, secrets, dependency, HTML injection or persisted field. Refusal avoids a board rebuild because board rendering can populate world postings. Independent QA and root build/unchanged boot verification remain separate gates.

Existing generator limitation accepted by the orchestrator: numeric IDs remain unique through normal replacements and within a loaded session. If hunt/war cannot generate a replacement, a separately reloaded session can eventually reuse an old absent numeric suffix. Re-observe after reload; do not replay pre-reload cached IDs. Abandoned contracts themselves are absent from saves and cannot resurrect or pay. Durable cross-session replay protection would require separate persistence scope; no tombstones or save-sanitizer changes are included.

Root production build passed (155 modules, `index-BGITmr2O.js`). Existing station desk regression and agent schema tests also pass.
