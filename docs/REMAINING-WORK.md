# RIMWARD remaining work

Inventory date: 2026-09-12. Reconciled against master
`5e0ff560ae9de92821243c0e0aacc5ef008b4b52` and the GitHub issue/PR API.
This snapshot has **zero open issues and zero open pull requests**. The two
issues the 2026-09-11 pass filed from candidates below ([#138](https://github.com/barryrwilson/Rimward/issues/138),
[#139](https://github.com/barryrwilson/Rimward/issues/139)) are merged.
[Consolidation PR #97](https://github.com/barryrwilson/Rimward/pull/97) is the
earlier documentation and verification repair; every issue it left in review
has since merged and moved to the completed table.

This is the compact current index. The assigned GitHub issue governs a selected
task; the wishlist preserves product intent and playtest observations.
`PROGRESS.md` and dated verification documents are historical evidence.
The [pre-consolidation index at `0dd7908e`](https://github.com/barryrwilson/Rimward/blob/0dd7908e3929725d646958d43f63de57b68dc7c8/docs/REMAINING-WORK.md)
retains the detailed implementation claims, trader acceptance contracts, artifact
identities, raw failures and intermediate review states; the
[index at `6bb15385`](https://github.com/barryrwilson/Rimward/blob/6bb15385/docs/REMAINING-WORK.md)
retains the long per-issue verification prose for #98–#125 that the table
below compresses. Final PR records supersede their stale pending-review and
not-yet-merged labels. Merge status alone is not fresh QA, release readiness,
or deployment evidence.


## Active outcomes

Every issue from #98 to #139 is merged (see the table below). The piracy
aftermath set filed on 2026-09-12 is open:

| Outcome | Issue / PR | Status |
|---|---|---|
| A trader that yields its cargo runs for a refuge instead of parking dead-stick | [#146](https://github.com/barryrwilson/Rimward/issues/146) / [PR #150](https://github.com/barryrwilson/Rimward/pull/150) | Implemented: `capitulate` in `npc.js` routes every crew-aboard yield (`jettison`, `cutEngines`, `flee`) through the #68 escape plan; only `crewPods` still drifts. Pinned in `npm run test:boot` (section "Issue #146"); live check 2026-09-12. NPC pirates do not scoop spilled pods today (player scoop only): [#151](https://github.com/barryrwilson/Rimward/issues/151). |
| A pirate may claim the crew and the hull of a yielded trader | [#147](https://github.com/barryrwilson/Rimward/issues/147) | Open; depends on #146. |
| An unclaimed derelict is claimable and folds away after 30 minutes | [#148](https://github.com/barryrwilson/Rimward/issues/148) | Open; the `crewPods` drift hull is the derelict. |
| A mined-out asteroid breaks up, leaves the field, and a new rock of another ore seeds its slot a few minutes later | [#149](https://github.com/barryrwilson/Rimward/issues/149) / [PR #152](https://github.com/barryrwilson/Rimward/pull/152) | Merged 2026-09-12: `asteroids.js` collapses a zero-ore rock to radius 0 with a shard burst, keeps the slot in `ctx.asteroids.list` (`id === index`), writes `world.fieldRespawn[sys][index] = { at, due, ore, seed, grown }` (`ASTEROID_RESPAWN` tuning in `state.js`, 3–5 min of world time), and grows a rock of the recorded ore into the same orbit at `due`; the record rides `WORLD_FIELDS` and `save.js` sanitizes it. Beam, reticle, target cycle, agent rows and collision skip radius-0 slots. Pinned in `npm run test:boot` (section "Issue #149"); live check 2026-09-12 (break-up, grow-in, `reducedMotion` snaps). Parked: rare-ore respawn weighting and respawn size are unchanged from the field's band draw. |
| An NPC pirate scoops the pods it took and sells the haul at a fence | [#151](https://github.com/barryrwilson/Rimward/issues/151) | Open; filed 2026-09-12 from the #146 review; follows #146. |
| The wave-142 war scenario in `npm run test:boot` passes deterministically | [#153](https://github.com/barryrwilson/Rimward/issues/153) | Harness-only fix: `station.js` `pickWarQuarry` reads the war dest bank (veridian) before the origin bank, so the labelled fixture in the freehold bank only posted when veridian held fewer than two eligible patrols; the fallback real record then yielded and ran (#146). `agent-parity-waves.mjs` now parks the fixture at the head of the dest bank and pins the live quarry's personality (resolve floor 70, never capitulates) on both paths. No change to #146 player-facing behaviour. |

Parked follow-ups recorded by the merged issues, none promoted to a task:
station security reacting to a hostile hunter near the dock, ace demand
behaviour and starter cruise speed versus an ace (#125); the optional
fear-rating suppression of rival pirate interest (#123); a job that sends a
patrol across a gate (#125).

## Completed and merged outcomes

All issue numbers in this table are closed. Linked PRs are merged into the
snapshot above; their review and verification records apply to their named
artifacts, with their stated limitations.

| Outcome | Issue / merged PR | Durable design or evidence |
|---|---|---|
| Station loiterers keep clear of the +X docking lane (the intermittent fresh-Greenhand `approachDock` collision) | [#139](https://github.com/barryrwilson/Rimward/issues/139) / [#142](https://github.com/barryrwilson/Rimward/pull/142) | [Reproduction and evidence](Issue139DockCorridorEvidence.md); `npm run test:dock-corridor`; ten consecutive local bridge smoke runs docked. |
| `test:refusal-tokens` pins the #120 burner contract and runs in the release-focused runner | [#138](https://github.com/barryrwilson/Rimward/issues/138) / [#141](https://github.com/barryrwilson/Rimward/pull/141) | Test and docs only; [#118 evidence](Issue118RefusalTokensEvidence.md) notes the pin follows #120. |
| Death inside an encounter returns to the last berth with a rewind and hold receipt; patrol standing law is local | [#125](https://github.com/barryrwilson/Rimward/issues/125) / [#137](https://github.com/barryrwilson/Rimward/pull/137) | [Evidence](Issue125DeathRecoveryEvidence.md); `npm run test:death-recovery`. |
| The fence's marker banks on a paying pirate outcome, not only a bounty claim | [#124](https://github.com/barryrwilson/Rimward/issues/124) / [#136](https://github.com/barryrwilson/Rimward/pull/136) | [Evidence](Issue124FenceMarkerEvidence.md); `npm run test:fence-marker`. |
| At most two NPC pirates work traders at once; a prize the player engages is yielded | [#123](https://github.com/barryrwilson/Rimward/issues/123) / [#135](https://github.com/barryrwilson/Rimward/pull/135) | `PIRACY` tuning in `state.js`; `npm run test:shared-lane` (21 checks). Fear-rating suppression of rival interest parked. |
| A deliberate hail demands terms from a willing hull | [#122](https://github.com/barryrwilson/Rimward/issues/122) / [#134](https://github.com/barryrwilson/Rimward/pull/134) | [Design](Hail03PlayerTermsDesign.md); [evidence](Issue122PlayerTermsEvidence.md). |
| `frameAgeMs` / `flags.suspended`; a wall expiry during a stall reads `suspended` | [#121](https://github.com/barryrwilson/Rimward/issues/121) / [#133](https://github.com/barryrwilson/Rimward/pull/133) | [Evidence](Issue121SuspendedClockEvidence.md). |
| A `retreat` or `break-off` intent may hold the afterburner (`burner: true`) | [#120](https://github.com/barryrwilson/Rimward/issues/120) / [#132](https://github.com/barryrwilson/Rimward/pull/132) | [Evidence](Issue120RetreatBurnerEvidence.md). Left the #118 burner pin stale → [#138](https://github.com/barryrwilson/Rimward/issues/138). |
| NPC miner `mineHit` receipts stay off the agent ring | [#119](https://github.com/barryrwilson/Rimward/issues/119) / [#128](https://github.com/barryrwilson/Rimward/pull/128) | [Evidence](Issue119MinerReceiptsEvidence.md). |
| `setCombatIntent` target refusals split (`no-sample`, `stale-lock`, `lock-kind`) with receipt `detail` | [#118](https://github.com/barryrwilson/Rimward/issues/118) / [#129](https://github.com/barryrwilson/Rimward/pull/129) | [Evidence](Issue118RefusalTokensEvidence.md). Suite was red on master until [#138](https://github.com/barryrwilson/Rimward/issues/138). |
| `playerHit` / `playerDestroyed` name the attacker under the bracket identity law | [#117](https://github.com/barryrwilson/Rimward/issues/117) / [#130](https://github.com/barryrwilson/Rimward/pull/130) | [Evidence](Issue117AttackerIdentityEvidence.md). |
| Prize-ranking fields on nearby rows; station and gate bearings | [#116](https://github.com/barryrwilson/Rimward/issues/116) / [#131](https://github.com/barryrwilson/Rimward/pull/131) | [Evidence](Issue116NearbyRowsEvidence.md). |
| Scoop receipts are keep-class; refused pods report `podBlocked` | [#115](https://github.com/barryrwilson/Rimward/issues/115) / [#126](https://github.com/barryrwilson/Rimward/pull/126) | [Evidence](Issue115PodReceiptsEvidence.md). |
| A combat intent clears the full-stop latch and names it when it holds | [#114](https://github.com/barryrwilson/Rimward/issues/114) / [#127](https://github.com/barryrwilson/Rimward/pull/127) | [Evidence](Issue114CombatFullStopEvidence.md). |
| Persistent raw-control throttle and the verified stop sequence are documented and observable | [#103](https://github.com/barryrwilson/Rimward/issues/103) / [#112](https://github.com/barryrwilson/Rimward/pull/112) | [Evidence](Issue103ThrottleEvidence.md). |
| Solar hazards and damage are visible to agents | [#102](https://github.com/barryrwilson/Rimward/issues/102) / [#111](https://github.com/barryrwilson/Rimward/pull/111) | [Evidence](Issue102SolarHazardsEvidence.md). |
| Completed station encounters no longer starve traffic | [#101](https://github.com/barryrwilson/Rimward/issues/101) / [#110](https://github.com/barryrwilson/Rimward/pull/110) | [Evidence](Issue101TrafficRetirementEvidence.md). |
| Hail cards stay off docked station menus | [#100](https://github.com/barryrwilson/Rimward/issues/100) / [#106](https://github.com/barryrwilson/Rimward/pull/106) | [Evidence](Issue100DockedHailsEvidence.md); [API contract](AgentApiDesign.md#issue-100--docked-hails). Bundle bytes ride the #100/#107 approved exception. |
| A surrendered hull can hand over its holds (`demandCargo`) | [#98](https://github.com/barryrwilson/Rimward/issues/98) / [#109](https://github.com/barryrwilson/Rimward/pull/109) | [Evidence](Issue98SurrenderCargoEvidence.md). |
| Surrender is attributed to the last effective damage; a world-caused break pays nothing | [#99](https://github.com/barryrwilson/Rimward/issues/99) / [#108](https://github.com/barryrwilson/Rimward/pull/108) | [Evidence](Issue99SurrenderAttributionEvidence.md). |
| Bundle byte caps doubled by owner request | [#107](https://github.com/barryrwilson/Rimward/pull/107) | [#100 measured decision](releases/issue-100-measured-decision.md); [performance contract](ProductionPerformanceBudget.md). |
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
| Shared outward, collision-clear station launch | [#65](https://github.com/barryrwilson/Rimward/issues/65) / [#82](https://github.com/barryrwilson/Rimward/pull/82) | Blocked clearance holds the berth with a retry. Extended by [#105](https://github.com/barryrwilson/Rimward/issues/105) ([evidence](Issue105LaunchHoldEvidence.md)): the hold notice and agent receipt name the blocking hull and range; a pirate/ace camping the lane draws a throttled security hail and physical clearance response. Every retry still requires full clearance. #105 passes focused checks, build, unchanged boot and all five live browser checks with a clean console. Independent Codex QA passed `b0e68ddc`; merged in [PR #113](https://github.com/barryrwilson/Rimward/pull/113). |
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
| Intermittent live dock approach collision | **Resolved by [#139](https://github.com/barryrwilson/Rimward/issues/139) / [PR #142](https://github.com/barryrwilson/Rimward/pull/142)**: the collider was a station-anchored loitering NPC hull on a ring whose first waypoint sat on the +X docking axis; loiterers now sweep the far side of the station. Kept here only as the record of the baseline observation ([run 34498199689](https://github.com/barryrwilson/Rimward/actions/runs/34498199689)); no follow-up remains. |
| Smoke/capture reliability | One of ten local #139 bridge smoke runs (2026-09-12) timed out only on the later `systemTransition` jump pin (90 s) with docking and console clean, so the flake is real and unrelated to docking. [Intermediate run 34499466594](https://github.com/barryrwilson/Rimward/actions/runs/34499466594) had no eligible public combat target (`attempted:false`) and a Models `captureScreenshot` timeout with four missing flows. The final run passed; retain these as bounded smoke/capture diagnostic follow-ups, not independently confirmed gameplay bugs. |
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
