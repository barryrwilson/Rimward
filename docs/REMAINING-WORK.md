# RIMWARD remaining work

Inventory date: 2026-09-10. Reconciled against master
`0dd7908e3929725d646958d43f63de57b68dc7c8` and the GitHub issue/PR API.
Before consolidation, this snapshot had **zero open issues and zero open pull
requests**. [Consolidation PR #97](https://github.com/barryrwilson/Rimward/pull/97)
now tracks the documentation and verification repairs; the unfiled candidates
below remain visible.

This is the compact current index. The assigned GitHub issue governs a selected
task; the wishlist preserves product intent and playtest observations.
`PROGRESS.md` and dated verification documents are historical evidence.
The [pre-consolidation index at this exact commit](https://github.com/barryrwilson/Rimward/blob/0dd7908e3929725d646958d43f63de57b68dc7c8/docs/REMAINING-WORK.md)
retains the detailed implementation claims, trader acceptance contracts, artifact
identities, raw failures and intermediate review states. Final PR records below
supersede its stale pending-review and not-yet-merged labels. Merge status alone
is not fresh QA, release readiness, or deployment evidence.

## Active outcomes

[Issue #121](https://github.com/barryrwilson/Rimward/issues/121) — `observe()`
gives no sign the simulation is suspended while lease TTLs keep expiring — is
**implemented and locally verified on `claude/next-issue-1e76da`**, based on
master `11ee8081`. `main.js` stamps the wall clock of every render-loop frame
(`ctx.frameWallMs`, `ctx.frameGapMs`); `observe()` publishes `frameAgeMs` and
`flags.suspended` (true once no frame has run for 1000 ms, while `t` freezes
and `flags.paused` stays false); a combat-lease wall deadline crossed while no
frame ran ends with terminal reason `suspended` instead of `expired` (state
`expired`, the normal full-stop release, focus does not renew the grant). A
deadline crossed with frames running, or a simulation-time expiry, still reads
`expired`; the raw manual lease has no wall clock and is untouched. Build,
unchanged boot, the new focused suite (`npm run test:suspended-clock`, 10
groups), the release-focused runner (17/17) and the live browser check (a
1.3 s main-thread stall after an accepted 1 s intent read `suspended`) pass
with no console errors. See
[the acceptance and evidence record](Issue121SuspendedClockEvidence.md).

[Issue #120](https://github.com/barryrwilson/Rimward/issues/120) — a `retreat`
intent cannot use the afterburner, so an ace paces the retreat until the hull
dies — is **implemented and locally verified on `claude/next-issue-2ba4be`**,
based on master `696f0ecb`. `setCombatIntent` accepts an optional
`burner: true` on `retreat` and `break-off` (attack intents refuse it with
`bad-args`; the default is unchanged). With the permission the controller
holds the ordinary afterburner once the target is astern, the pursuer is not
already falling behind, the burner is ready with power, no drift or visible
obstruction is live (including a boosted-speed lookahead before a burn starts)
and more than one second of authorization remains; an owned burn rides to the
ship's normal cutoff. `combat.burner { allowed, held, blocked }` reports the
state and the first unmet condition. A renewal may grant or revoke the
permission on the same maneuver; a burn the session did not request still
refuses `helm`; the raw `afterburner` pulse still answers `helm` under a combat
lease, now with a `detail`. Build, unchanged boot, the new focused suite
(`npm run test:retreat-burner`, 10 groups), the release-focused runner (16/16)
and the live browser check pass with no console errors. See
[the acceptance and evidence record](Issue120RetreatBurnerEvidence.md).

[Issue #116](https://github.com/barryrwilson/Rimward/issues/116) —
nearby rows give a pirate nothing to pick a prize with; station and gate
have no bearing — is **implemented and locally verified on
`claude/next-issue-16b598`**, based on master `696f0ecb`. Every
`targets.nearby` ship row now carries `faction`, `factionName`,
`resolveBand`, `surrendered`, `disabled` and `hailState` under the same
scanner tiers as the locked bracket (a masked Q-ship keeps its cover until the
Mk II eye; numeric resolve, `concealedMounts`, the `hail` object and vitals
stay on `targets.current`). `station.bearing` and `gate.to/kind/source/range/
bearing` publish ship-local unit bearings (x right, y up, nose `-z`) to the
station and to the active gate (plotted next hop, else nearest live gate).
Pod rows keep the issue #115 `id`/`units` contract. Locking, hailing, combat,
persistence and the API version are unchanged. Build, unchanged boot, the new
focused suite (`npm run test:nearby-rows`), the schema pins and the agent
regressions pass; the live browser check passes with no console error from
the change. See
[the acceptance and evidence record](Issue116NearbyRowsEvidence.md).

[Issue #117](https://github.com/barryrwilson/Rimward/issues/117) —
`playerHit` and `playerDestroyed` name no attacker — is **implemented and
locally verified on `claude/next-issue-57e919`**, based on master `270af60d`.
A `playerHit` from an NPC projectile now carries `attackerId`/`attackerName`
as primitives derived at the emit site through the existing
`escapePublicIdentity` bracket law (a masked Q-ship publishes its cover name
until the Mk II eye pierces it; impact and solar rows carry none).
`playerDestroyed` carries the last NPC hull that hit that life, even when the
killing blow is an impact, and the record clears on the receipt and on
`systemLoaded`. `sanitizeEvent` fails closed on malformed attacker fields.
Fold rules, keep class, the ring cap, combat behaviour and the API version are
unchanged. Build, unchanged boot, the new focused suite
(`npm run test:attacker-identity`), the schema, hardening and agent
regressions pass, and the live browser check passes with no console errors.
See [the acceptance and evidence record](Issue117AttackerIdentityEvidence.md).

[Issue #118](https://github.com/barryrwilson/Rimward/issues/118) —
`setCombatIntent` refuses `target-lost` on a fresh lock and refusal tokens
carry no detail — is **implemented and locally verified on
`claude/next-issue-77b2bb`**, based on master `031e0dda`. The folded target
check now returns one token per precondition: `lock-kind` (rock, pod, station,
gate or landmark lock), `stale-lock` (no lock or another id), `no-sample` (the
hull is locked but the HUD aim digest is missing, for another lock or weapon
group, older than 0.25 s or beyond 600 u) and `target-lost` only for a hull
that left the live roster. Argument refusals from `setControl` and
`setCombatIntent` (`bad-args`, `bad-seq`, `bad-ttl`, `stale`, `bad-axis`,
`bad-throttle`) and the four target refusals carry an additive `detail` string
naming the failing field or the unmet precondition; `lastIntent` mirrors it.
The manifest documents the one-rendered-frame rule on `selectTarget` and
`setCombatIntent`. Combat behaviour, terminal reasons, the lease model and the
API version are unchanged. Build, unchanged boot, the new focused suite
(`npm run test:refusal-tokens`), the schema pins and the agent/combat
regressions pass. See
[the acceptance and evidence record](Issue118RefusalTokensEvidence.md).

[Issue #119](https://github.com/barryrwilson/Rimward/issues/119) — NPC miner
`mineHit` receipts leak into the public event ring with no actor — is
**implemented and locally verified on `claude/next-issue-547450`**, based on
master `66b56f88`. Both internal emitters now tag the payload (`actor: 'npc'`
from the npc.js miner, `actor: 'player'` from the combat.js beam) and
`sanitizeEvent` admits only the player's beam to the ring, failing closed on
any other or missing actor. The public row is `{ asteroidId, actor: 'player',
count? }`; asteroid extraction, NPC cargo fill, fold/keep rules, the API
version and the ring cap are unchanged. Build, unchanged boot, the new focused
suite (`npm run test:miner-receipts`), the schema pins and the agent
regressions pass. See
[the acceptance and evidence record](Issue119MinerReceiptsEvidence.md).

[Issue #114](https://github.com/barryrwilson/Rimward/issues/114) — an agent that
follows the documented stop handshake and then starts a fight must not sit
still under fire while the view reports an intercept — is **implemented and
locally verified on `claude/next-issue-dcb4e3`**, based on master `66b56f88`.
An accepted `setCombatIntent` clears `input.fullStop` on acceptance, like
`engageAutopilot`; a live combat lease still held by the latch publishes
`control.combat.movementBlocked: 'full-stop'`. The fixture repro shows the
apply path already cleared the latch on the first applied frame, so the
playtest reading is most likely a frozen sim plus wall-clock expiry (#121,
unchanged here). Focused suite (7 groups), release-focused 15/15, build,
unchanged boot and the live browser check pass. Awaiting PR review and merge.
See [the acceptance and evidence record](Issue114CombatFullStopEvidence.md).

[Issue #115](https://github.com/barryrwilson/Rimward/issues/115) — a pirate
never observes its own scoops, and an oversized pod is refused silently — is
**implemented and locally verified on `claude/issue-work-4f8ccb`**, based on
master `196b954c`. `podCollected` is now a keep-class ring row carrying
`podId`, `units` and the primary `commodity`; the new keep-class
`podBlocked { podId, units, free }` receipt records a capacity refusal once per
pod per free-space value; every pod carries a session id and
`targets.nearby` pod rows publish `id` and `units`. Scooping rules, the
HUD line, persistence and the API version are unchanged. Build, unchanged boot,
the focused suite, the schema pins and the agent/salvage regressions pass; the
live browser check passes with no console errors. Awaiting PR review and merge.
See [the acceptance and evidence record](Issue115PodReceiptsEvidence.md).

[Issue #103](https://github.com/barryrwilson/Rimward/issues/103) — a raw
`setControl` throttle persists after the lease expires or is cleared, so an
agent can fly unattended — is **implemented and independently QA-approved on
`codex/issue-103-throttle-observability`**, based on master `7645aa22`. The
issue explicitly allows keeping the setpoint and documenting the already
published `observe().ship.throttle` instead of changing the semantics, and that
compatibility-preserving option is the accepted one. The baseline already
publishes `ship.throttle` and `flags.fullStop`, so the issue's "not observable"
premise is stale; the real gap is that nothing told a caller the field is the
persistent setpoint, that clearing does not brake, or that the supported stop is
`setControl { throttle: 0 }` confirmed across a live update — with both
`ship.throttle === 0` and `flags.fullStop === true` — before clearing. Lease
behaviour, the combat-release full stop and the API version are unchanged.
Focused checks (12 groups), build, unchanged boot and agent/combat regressions
pass. The live browser probe passes 5/5 pins with no console errors or uncaught
exceptions. Independent Codex QA returned PASS on
`f7593a085ca8ff710f9d21d4c2e127001785a227`, including four additional boundary
groups and source/security review. Publication awaits owner authorization after
automatic approval review rejected the push; no PR, merge or release is claimed.
Initial verification failures and their corrections remain in the
evidence record. See
[the acceptance and evidence record](Issue103ThrottleEvidence.md).

[Issue #102](https://github.com/barryrwilson/Rimward/issues/102) — make solar
hazards and damage visible to agents — is implemented and locally verified on
`codex/issue-102-solar-hazards`, based on master `d1b7d8f`. The bounded outcome
is a live sun danger-zone snapshot, public solar event receipts, and accurate
sun-avoiding navigation guidance. Authored layout and damage balance are outside
scope. Build, unchanged boot, 13 focused groups, five regression suites and 4/4
live browser pins pass. Independent Claude Code QA returned PASS on
`de3346a9322daa2d3027a0763a150abb2c61c4bf`, including its own live rerun and 50
additional checks. Awaiting PR review and merge. See
[the acceptance and evidence record](Issue102SolarHazardsEvidence.md).

[Issue #101](https://github.com/barryrwilson/Rimward/issues/101) — release
traffic slots after surrendered hulls finish station refuge — is implemented,
locally verified and independently QA-approved at `800917d43a18ff6fa6d1b87b91f2e25d5079b315`,
awaiting PR review and merge. At a full bubble, one safe completed encounter
folds only when a ready unfinished replacement can use its slot. Finished
ships can return in spare capacity; population, cargo and condition survive.
Selection, active pursuit, recent attacks, disabled salvage, named aces and
current job quarry remain protected. Build, unchanged boot, focused and related
regressions pass; live Chrome passes 3/3 pins with a clean console. See
[the acceptance and evidence record](Issue101TrafficRetirementEvidence.md).

The owner authorized consolidation and complete release validation on current
master before more features. The [consolidation record](RepoConsolidation20260910.md)
records completed preservation/cleanup and verification repairs. Final
[release run 34500771317](https://github.com/barryrwilson/Rimward/actions/runs/34500771317)
on `f0b4c62c3a7bef7296e1603c46dd90acea893532` returned **PASS** for all 10
gates and 15 evidence assertions. Independent source/contract review passed;
PR #97 owns the final documentation review and merge handoff. All 447 emitted
files match the baseline runtime exactly. Earlier failed runs remain recorded,
and their residual reliability observations remain below. No release was
published or new performance exception granted.

[Issue #100](https://github.com/barryrwilson/Rimward/issues/100) — keep hails
off the station desk while docked — is **implemented and verified, awaiting
merge**. The
runtime change is implemented and 37 focused checks pass with unchanged
`test:boot`, `test:hail-identity` and `test:agent-hardening`. Live browser
acceptance now **passes 7/7 pins on 2026-09-10** with a clean console, under
two recorded limitations: a harness-only dev-server override (`watch: null`
plus `noDiscovery`) needed to boot Vite on this workspace, and a labelled
fixture that stages only the rare hail. Independent behaviour and source QA
returned **PASS** at `1f9035c2`. The build hold is resolved by an exact
owner-approved byte exception for this artifact only, activated on 2026-09-10:
`npm run build` and `npm run bundle:report -- --json` now exit 0 while the raw
byte gates still fail. Independent QA of that activation returned **PASS** at
`17edf7ebabccb023b6df255eda47e5bf39176d93`, covering the ordinary build and
report, the exact chunk identity, nine negative matcher cases and the browser
boundary checks. That is the issue and byte-gate verdict only, not an overall
release or startup approval; the earlier failed remote TGT-07 run 34513272635
stays failed historical evidence.

[Issue #98](https://github.com/barryrwilson/Rimward/issues/98) — a hull that
surrenders can be told to dump its holds — is **implemented and locally
verified, awaiting independent QA and PR review**. A player-owned surrender card
offers `demandCargo` whenever the hull still holds a unit, on the same nonempty
gate the salvage card uses, and publishes it through `observe().hail`. An empty
hold omits the verb. Resolution reuses the existing branch: an ordinary manifest
(`rawOre`, `refinedMetals`) spills as pods unit for unit, the manifest clears,
fear rises **+2**, **no credits** move, the hull yields to the player and runs.
Issue #99 attribution, issue #100 dock refusal, disabled-hull salvage (no fear,
no receipt) and the wave-30 pirate demand are unchanged, as is
`spillShipCargo`'s separate special-data handling, which is out of scope. No new
schema, API version, key or persistent field. 57 focused checks pass, with
`npm run build`, root `npm run test:boot`, `test:surrender-attribution`,
`test:docked-hails`, `test:hail-identity`, `test:agent-schema` and
`test:agent-gameplay` all passing locally. Live browser acceptance
(`npm run test:surrender-cargo-live`) passes **6/6 pins** with a clean console,
under the recorded harness-only dev-server override and labelled fixtures; an
earlier live run failed only because the loaded fixture's resolve fell to 19 and
capitulated past the card (fixture corrected, no runtime change), and a
superseded dock pin failed on an unrelated dock approach and was replaced by a
real rendered-button payout pin. No independent QA, merge, release or deployment
is claimed. See
[Issue98SurrenderCargoEvidence.md](Issue98SurrenderCargoEvidence.md).

[Issue #99](https://github.com/barryrwilson/Rimward/issues/99) — surrender
attribution: only the player who actually broke a hull is owed for the yield —
is **implemented and locally verified, awaiting PR review and merge**. A break the player did not cause opens no bargaining card,
still yields the hull through the ordinary NPC loop, and pays no credits, fear,
milestone or patrol progress; its `npcSurrendered` receipt and lane incident name
`world`. A player-caused break is unchanged. Ownership follows the last
*effective* attacker, so a hit that reduces nothing takes no claim, and an
original surrender card whose claim has since lapsed refuses payout and `letGo`
with `stale`. Salvage and demand behaviour, the public API version and the persistent save
schema are unchanged; the internal surrender receipt gains a bounded causer.
Independent core QA returned **PASS** at
`78a3a2b3090e1a75469f138d4098847a3b644362`, covering 61 focused and 20
adversarial assertions, and the root final production build and full boot both
pass at that exact commit. Live browser acceptance
(`npm run test:surrender-attribution-live`) passes **5/5 pins** with a clean
console, and the existing #100 live probe still passes **7/7** with a clean
console, under the recorded harness-only dev-server override and labelled
fixtures. The final docs/test delta still gets independent review. Branch is
stacked on PR #107. See
[Issue99SurrenderAttributionEvidence.md](Issue99SurrenderAttributionEvidence.md).
[PR #106](https://github.com/barryrwilson/Rimward/pull/106) owns the final review
handoff and the current CI record. Nothing is merged, released or deployed. See
[Issue100DockedHailsEvidence.md](Issue100DockedHailsEvidence.md), the
[measured decision](releases/issue-100-measured-decision.md) and the
[public API contract](AgentApiDesign.md#issue-100--docked-hails).

## Completed and merged outcomes

All issue numbers in this table are closed. Linked PRs are merged into the
snapshot above; their review and verification records apply to their named
artifacts, with their stated limitations.

| Outcome | Issue / merged PR | Durable design or evidence |
|---|---|---|
| Freighter quantity, Buy Max and selected-commodity Sell All through ordinary bounded orders | [#56](https://github.com/barryrwilson/Rimward/issues/56) / [#96](https://github.com/barryrwilson/Rimward/pull/96) | [Bulk evidence](Issue56BulkTradingEvidence.md); [measured decisions](releases/issue-56-measured-decision.md). PR #96 records final independent QA on `7cb7e7951afe670b2b14fc6701f6e6f667706fb2`. |
| Fresh-start heading away from the sun, preserving saved headings and Drifter pose | [#95](https://github.com/barryrwilson/Rimward/pull/95) | [Starter evidence](StarterSunDriftEvidence.md). Final policy QA on `6f32b2e8b51d5037f5ea857c24847786361679c1` is recorded in the PR. |
| Reassess starter pacing and retain the existing protection | [#10](https://github.com/barryrwilson/Rimward/issues/10) / [#94](https://github.com/barryrwilson/Rimward/pull/94) | [Pacing evidence](Issue10StarterPacingEvidence.md). No additional safe bubble was justified by the samples. |
| Remove duplicate trade/survey offers while preserving distinct contracts and passenger parties | [#12](https://github.com/barryrwilson/Rimward/issues/12) / [#93](https://github.com/barryrwilson/Rimward/pull/93) | [Mission census](Issue12MissionDuplicateCensus.md) |
| Clear held fire when UI or pause owns input | [#11](https://github.com/barryrwilson/Rimward/issues/11) / [#92](https://github.com/barryrwilson/Rimward/pull/92) | [Fire ownership evidence](Issue11FireHeldEvidence.md) |
| Finite station stock and saved-time replenishment | [#55](https://github.com/barryrwilson/Rimward/issues/55) / [#91](https://github.com/barryrwilson/Rimward/pull/91) | [Liquidity design](MarketLiquidityProgressionDesign.md); [measured playtest](playtests/2026-09-09-issue-55-market-liquidity.md) |
| Reactive defense within the bounded combat lease | [#62](https://github.com/barryrwilson/Rimward/issues/62) / [#90](https://github.com/barryrwilson/Rimward/pull/90) | [Defense design](AgentReactiveDefenseDesign.md); [verification](playtests/2026-09-09-issue-62-reactive-defense.md). Final policy QA on `8f24357ff388d2d66756413b56746c1096341903` is recorded in the PR. |
| Sustain target-specific dogfighting between agent decisions | [#61](https://github.com/barryrwilson/Rimward/issues/61) / [#89](https://github.com/barryrwilson/Rimward/pull/89) | [Combat contract](AgentCombatIntentDesign.md); [playtest](playtests/2026-09-09-agent-combat-results.md) |
| Discoverable salvage guidance, accepted recovery markers and guarded recovery lifecycle | [#74](https://github.com/barryrwilson/Rimward/issues/74) / [#88](https://github.com/barryrwilson/Rimward/pull/88) | [Salvage contract](SalvageOnboardingDesign.md). Natural incidental cargo collection is distinct from a naturally offered recovery job. |
| Explain capacity-free passenger commitments, locked fares and independent parties | [#73](https://github.com/barryrwilson/Rimward/issues/73) / [#87](https://github.com/barryrwilson/Rimward/pull/87) | [Passenger policy](PassengerCommitmentPolicyDesign.md) |
| Persistent NPC flight to a real gate or station refuge | [#68](https://github.com/barryrwilson/Rimward/issues/68) / [#86](https://github.com/barryrwilson/Rimward/pull/86) | PR evidence distinguishes real gate departure from external station shelter. |
| Capitulation status and actionable hail feedback agree | [#67](https://github.com/barryrwilson/Rimward/issues/67) / [#85](https://github.com/barryrwilson/Rimward/pull/85) | Willingness and completed surrender remain distinct. |
| Accepted survey objective navigation through visible marker and public API | [#69](https://github.com/barryrwilson/Rimward/issues/69) / [#84](https://github.com/barryrwilson/Rimward/pull/84) | [API contract](AgentApiDesign.md#issue-69--accepted-survey-navigation) |
| Award First Scare only for player-earned intimidation | [#63](https://github.com/barryrwilson/Rimward/issues/63) / [#83](https://github.com/barryrwilson/Rimward/pull/83) | PR records attribution, persistence and live verification. |
| Shared outward, collision-clear station launch | [#65](https://github.com/barryrwilson/Rimward/issues/65) / [#82](https://github.com/barryrwilson/Rimward/pull/82) | Blocked clearance holds the berth with a retry. Extended by [#105](https://github.com/barryrwilson/Rimward/issues/105) ([evidence](Issue105LaunchHoldEvidence.md)): the hold notice and agent receipt name the blocking hull and range; a pirate/ace camping the lane draws a throttled security hail and physical clearance response. Every retry still requires full clearance. #105 passes focused checks, build, unchanged boot and all five live browser checks with a clean console. Independent Codex QA passed `b0e68ddc`; awaiting PR review and merge. |
| Persist completed dock transactions | [#71](https://github.com/barryrwilson/Rimward/issues/71) / [#81](https://github.com/barryrwilson/Rimward/pull/81) | Normal reload/graceful restart evidence does not establish forced-process crash durability. |
| Refuse duplicate ferry acceptance without cargo or agreement mutation | [#70](https://github.com/barryrwilson/Rimward/issues/70) / [#80](https://github.com/barryrwilson/Rimward/pull/80) | Legitimate completed-consignment reacceptance remains. |
| Restore the real player hull after cold asset load | [#54](https://github.com/barryrwilson/Rimward/issues/54) / [#79](https://github.com/barryrwilson/Rimward/pull/79) | Cold-load and stale-completion evidence in the PR. |
| Prevent same-station profitable buy/sell loops | [#53](https://github.com/barryrwilson/Rimward/issues/53) / [#78](https://github.com/barryrwilson/Rimward/pull/78) | Legitimate inter-system trading remains. |
| Separate successful station notices from errors | [#64](https://github.com/barryrwilson/Rimward/issues/64) / [#77](https://github.com/barryrwilson/Rimward/pull/77) | Additive immediate `notice` receipt; failure semantics retain their documented limits. |
| Identify hail speaker/conversation and reject stale responses | [#66](https://github.com/barryrwilson/Rimward/issues/66) / [#76](https://github.com/barryrwilson/Rimward/pull/76) | [API contract](AgentApiDesign.md) |
| Preserve fresh save/dock events under event-ring saturation | [#72](https://github.com/barryrwilson/Rimward/issues/72) / [#75](https://github.com/barryrwilson/Rimward/pull/75) | Bounded retention; no persistence schema change. |
| Agent Play v2 parity and integration repairs | [#57](https://github.com/barryrwilson/Rimward/pull/57) | Versioned public API, bounded control ownership and station parity; bridge remains loopback-only. |
| Reviewed Beautiful Ones production fleet | [#58](https://github.com/barryrwilson/Rimward/pull/58) | Approved studies in `reviews/beautiful-ones/`; player living ship remains the quality benchmark. |
| Models role/scale/lore summary card (RW-003 PR3) | [#28](https://github.com/barryrwilson/Rimward/issues/28) / [#46](https://github.com/barryrwilson/Rimward/pull/46) | [Models design](Mdl01ShipReferenceDesign.md). PR1/PR2 already merged as #25/#27. |
| Pause recovery/input, private ship-material disposal, bridge 413 and missing-token rejection | [#47–#51 via #52](https://github.com/barryrwilson/Rimward/pull/52) | Focused reliability checks and live evidence in the PR. |

Earlier completed work remains closed: RW-001 outer-pad approach and its #31
repair; RW-002 settings/rebinding; RW-004 runtime-error UX; RW-005 zero-cost
recovery policy; RW-006/RW-007 and #20 boot fixtures; OPT-001/OPT-002; and
REL-001 through REL-006. Their issue, PR and historical evidence links are
preserved in the immutable index above. The published
[v0.1.0 artifact](https://github.com/barryrwilson/Rimward/releases/tag/v0.1.0)
is historical and does not include all subsequent changes.

## Remaining candidates and evidence limits

These entries are not filed implementation issues or incomplete acceptance
criteria for already closed work. Reproduce on current code and bound the next
outcome before implementation; preserve the original product intent.

| Candidate | State and next action |
|---|---|
| Intermittent live dock approach collision | [Baseline run 34498199689](https://github.com/barryrwilson/Rimward/actions/runs/34498199689) records fresh Greenhand `approachDock` cancelling on `bodyHit` / `impact` near the +X stage. Docking passed in the intermediate and final runs; the original collider and cause remain unresolved. Preserve full public collision payload and pre-failure state on an unchanged fresh-start approach before selecting a bounded runtime fix. See the [diagnostic summary](RepoConsolidation20260910.md#residual-reliability-follow-ups). This is an unfiled follow-up, not a failed final gate or a proven repaired defect. |
| Smoke/capture reliability | [Intermediate run 34499466594](https://github.com/barryrwilson/Rimward/actions/runs/34499466594) had no eligible public combat target (`attempted:false`) and a Models `captureScreenshot` timeout with four missing flows. The final run passed; retain these as bounded smoke/capture diagnostic follow-ups, not independently confirmed gameplay bugs. |
| Performance headroom | The enforceable byte caps are now 3,671,906 minified / 1,098,526 gzip bytes: the owner approved doubling the #100 artifact counts by direct request on 2026-09-10, superseding the earlier 1,800,000 / 537,600 limits. Historic measurements are unchanged: #56 measured 1,835,632 minified / 549,169 gzip with a 7,340.4 ms startup median and one of five runs at 8,280 ms against 8,000 ms. The exact descriptor still pins the #100 artifact `assets/index-CY-oCepC.js` at 1,835,953 minified / 549,263 gzip for that exact bundle only. The 8,000 ms startup limit and the browser dependency boundary are unchanged and unwaived. Use the [#56](releases/issue-56-measured-decision.md) and [#100](releases/issue-100-measured-decision.md) measured decisions and the [performance contract](ProductionPerformanceBudget.md) when assessing new evidence. |
| Agent Play mouse ownership | Unfiled owner report from 2026-09-06: incidental pointer/UI movement should not interfere with agent flight, docking or mining, while explicit takeover remains available. Current `controls.js` deliberately makes mouse movement/clicks cancel a combat lease; that later human-takeover contract must be reconciled with the requested watch behavior. Do not claim #57 or #61 closed the whole observation. Recheck live pointer, click, focus and handoff behavior before selecting a change. |
| Raw afterburner/flee completion (local PIR-02) | Historical run observed residual motion and station contacts after the flee timer ended. Current `agent-flee.js` still ends by clearing its channel; #62's stable combat withdrawal is a different path. Repeat the raw flee expiry flow near/far from port before claiming a current defect or a completed fix. |
| Supported resumable API playtest runner (local PIR-07) | Local tooling proposal: expected build/API version, isolated profile, durable sequence recovery, acknowledged safe handoffs and sanitized evidence. Existing scenario probes do not by themselves establish the full resumable-runner contract. Scope only if selected; no browser credentials or in-game LLM runner. |
| Models loading/retry/disposal (RW-003 PR4) | Optional, unfiled follow-up retained from the [accepted design](Mdl01ShipReferenceDesign.md). PR3 is merged; its narrow-phone sidebar and side-by-side scale comparison remain separately parked. Inspect current loading and resource ownership before writing a new issue. |
| Historical station/Bloom visuals | [Preservation PR #60](https://github.com/barryrwilson/Rimward/pull/60) is closed **without merge**. Original work is preservation evidence, not current-master implementation. Any selected outcome needs a deliberate port and fresh QA; do not replay old source or backlog wholesale. |
| Other recorded limitations | #95 parks death-respawn heading and a recovery-pod boot-fixture hypothesis; #57 parks broad Chrome cleanup in its smoke runner; #96 parks quote-refresh/tiny-hold/live-region observations. See those PRs for precise scope and evidence; none is silently promoted to an implementation task here. |

The preserved local September 6–7 role playtests cover nine attempted careers,
not nine completed acceptance suites. Their filed findings map to #61–#74,
now closed and merged above. PIR-01/03/04/05/06/08/09 map to
#65/#66/#67/#63/#64/#61/#62 respectively; PIR-02/PIR-07 remain the candidates
above. Subsequent focused fixes do not turn the old interrupted attempts into
successful campaigns or justify cross-role balance conclusions. Broader repeat
campaigns and long-term progression remain optional evidence work.

## Not remaining work

- Wishlist outcomes that later waves or the merged records above close.
- NAV-11 route persistence: the earlier reported loss was stale versus code.
- An in-repository LLM runner, browser-bundled credentials, teleport-to-pad,
  a third helm, incidental gauges/keys/SKUs/save fields/kit mutation, or
  owner-omitted content.
- General refactoring or tooling with no selected player/reliability outcome.
- Historical OPEN/later/optional prose superseded by CLOSED/DONE/CONSUME.

## Converting a candidate into a task

Use standard GitHub issue handling outside Orca. A selected implementation
issue must name one player-visible or reliability outcome, current evidence,
bounded scope/exclusions, acceptance criteria, required tests and live flows,
dependencies/owner decisions, and likely overlapping files. Create external
issues only with user or task authorization. Orca auto-start applies only to
`orca:ready`; design, decision and optional items need their respective gates.
