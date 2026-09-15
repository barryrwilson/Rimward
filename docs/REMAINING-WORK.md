# RIMWARD remaining work

Agent API scope refreshed 2026-09-14 against master
`0991593bd905d00451b9f7d2b5f58eea737d3ac2` (merge of PR #167).
The merged-outcome table retains the 2026-09-13 inventory at
`cc7be05969e0ad2514428454dd9057ddb5849052`; it is historical evidence,
not a claim that no issues remain open. The piracy aftermath set (#146–#159)
is merged, and its
[index at `cc7be059`](https://github.com/barryrwilson/Rimward/blob/cc7be059/docs/REMAINING-WORK.md)
retains the long per-issue prose.
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

Issue [#186](https://github.com/barryrwilson/Rimward/issues/186), owner decision
2, is implemented on `codex/issue-186-trader-shipyard`: the larger cargo hull
the yard already sells is made visible once the outfitter's two hold racks are
spent. The maxed-rack note still reads the real capacity; below it, when that
capacity is under `cargoHoldFor('freighter')`, the pane names the freighter's
stock hold and the Shipyard Yard pane, or says this yard stocks no freighter and
points at another dock. A maxed freighter is told nothing further. Yard cards
and the confirm box read `cargoHoldFor` / `cargoHoldMax`, so a buyer sees the
stock hold and the hold with racks before signing. No new hull, SKU, price,
stock, standing rule, save field or key. Focused regression is
`npm run test:bigger-hold`; `npm run build` and an unchanged `npm run test:boot`
pass. This is a visibility outcome: the trader's UU ceiling and market
liquidity are not claimed as solved. Independent Codex QA passed implementation
`15af18b9ad9d3cf04622c065e373d080a364eda0`: seven real headless Chrome
screenshots were visually inspected, with clean console output. Purchase checks
verified existing refusal gates and a 160-unit freighter with the expected debit.
Browser checks used disclosed fixtures; they do not claim natural progression.
Evidence: `out/issue-186-evidence/quinn-verdict.md`, `quinn-live/result.json` and
`quinn-purchase/result.json` in the local evidence workspace. No merge or
deployment is claimed.

Issue [#175](https://github.com/barryrwilson/Rimward/issues/175), owner-selected
Option B, is implemented on `codex/issue-175-counter-spread`: commodity sell
fills are capped at 95% of the same counter's buy fill, rounded down to whole
UU. Existing lower sell offers and all modifier chains remain intact. The pane,
agent observation and actual transactions share the fill; an unchanged-counter
round trip costs UU while inter-system price differences can still pay.
See [implementation evidence](Issue175CounterSpreadEvidence.md). Independent QA
is pending; this is not a merge or deployment claim.

Issue [#182](https://github.com/barryrwilson/Rimward/issues/182) is implemented
on the isolated `codex/issue-182-arrival-cargo` candidate: a delivery pays for a
run, not for an errand at the far market. Docking empty at a destination and
buying that dock's own stock no longer settles a trade agreement or the unique
`haul-provisions` consignment. Each berth visit takes one shared arrival
manifest — what the hold actually carried the moment the hull berthed — and
every unit that leaves the hold spends it down through `removeCargo`, whatever
took it: a trade delivery, the unique consignment, a ferry consignment, a mining
delivery or a market sale. A trade row and the consignment must therefore find
their units both aboard AND still on the manifest, so a sold-and-rebought unit
cannot be reused and two competing agreements cannot claim the same five units.
Goods that really arrived still settle exactly as before, and issue #181's
same-berth batch and its consignment-first order are preserved. The desk states
the one refusal in plain words — the goods must arrive with the ship — once per
agreement per berth, so the half-second delivery tick cannot spam it.

Scope held: this is the dock snapshot the issue allows, in the narrow per-berth
shape the coordinator selected. The manifest is module-scoped session state —
no new persisted field, no save-schema change, no stamp on a commodity row, and
no new UI surface, key or equipment. The limitation that follows is stated rather
than hidden: the manifest is taken at dock, dropped at launch, and re-taken fresh
on the next dock, so a redock re-reads the hold as it then stands. A save
reloaded while docked never runs the berth's dock path, so the delivery tick
takes a fresh manifest from the restored hold the same way — a player who buys at
the dock, saves and reloads inside that berth can still settle the run. Carrying
the fact across a launch or a reload would need broader persisted provenance
tracking, which is outside this issue's selected scope.

Focused regression is `npm run test:arrival-cargo`; boot adds a runtime
`WAVE182` pin; the browser pass is `npm run test:arrival-cargo-live`. Independent
QA is pending; this is not a merge or deployment claim.

Issue [#181](https://github.com/barryrwilson/Rimward/issues/181) is implemented
on the isolated `codex/issue-181-same-berth-settlement` candidate: a delivered
unique consignment no longer fences the berth it paid in. `haul-provisions` is
settled first in a delivery pass whatever the job order is, and it reserves only
the five Provisions it was quoted on, so ordinary trade deliveries for other
commodities and every passenger party settle in the same berth with no relaunch.
The one remaining hold — units aboard but committed to the unique consignment —
is named on the desk row and in `observe().jobs.active[].holdReason`, derived per
read with no new persisted field. Destination, commodity, deadline and
idempotence checks are unchanged, and the shared fence helper still guards survey
filing, chain steps and the generic accepted branch; freeing those kinds is a
separate question. Destination-purchase provenance was parked at the
time and is now answered by
[#182](https://github.com/barryrwilson/Rimward/issues/182), above. See [the policy section](PassengerCommitmentPolicyDesign.md).
Focused regression is `npm run test:same-berth`; boot adds `WAVE181`; the browser
pass is `npm run test:same-berth-live`. Merged as
[PR #191](https://github.com/barryrwilson/Rimward/pull/191).

Issue [#176](https://github.com/barryrwilson/Rimward/issues/176) is implemented
on the isolated `codex/issue-176-two-gate-jobs` candidate: every authored
charted job board posts exactly one destination two gates away, shared across
the haul/trade, ferry and passenger families and never more than one. The
shortest-distance walk is confined to the charted authored ring, so no posting
names a procedural or unseen detour. Reward scales 140% -> 175% of buy cost and
the delivery window scales one generous window per gate; both card copy and the
reward line state the distance. The seat counts accepted work and is per origin,
so a long run cannot be farmed two at a time from one dock while another
origin's board keeps its own. Distance is derived from the posting's existing
`originSystem`/`destSystem` pair, so no new persisted field is added and
`sanitizeJobs` gained no new narrowing. The unique `haul-provisions` tutorial
contract deliberately stays a one-gate run. See
[the design section](Msn02TradeDesign.md) (§5a). Focused regression is
`npm run test:two-gate-jobs`; boot adds `WAVE176`. Independent QA, the final
build/boot gate and a live browser pass are pending; this is not a merge or
deployment claim.

Issue [#177](https://github.com/barryrwilson/Rimward/issues/177) is implemented
on the isolated `codex/issue-177-consignment` candidate: a ferry's fronted
Provisions are derived as consigned from the live contract, named in the hold
total, the market pane, the bulk preview, the HUD meter and `observe()`, and
kept out of every public sell path — `Sell All`, the row sell buttons, the
keyboard sells and the `trade` action. No new persisted field is added and the
short-landing settlement rule is unchanged. See
[evidence](../reviews/issue-177-consignment-evidence.md). Independent QA is
pending; this is not a merge or deployment claim. Delivery ordering between a
haul and an aboard consignment remains a separate question.

Issue [#183](https://github.com/barryrwilson/Rimward/issues/183) is implemented
on `codex/issue-183-route-dock`: an agent can ask for the station in one step.
`approachDock` sent while a route lease is engaged is accepted and queued
against that route's destination, with an `{ ok: true, status: 'queued' }`
receipt and `observe().autopilot.queuedDock` naming the bound system. The route
helm keeps the ship to the final arrival; the existing cruise/stage/corridor/
settle controller then takes the berth with no second command. The wish is
session-only (never persisted, never restored) and ends on any lease
cancellation, the Escape takeover, a manual break, `clearRoute`, or any
`plotRoute` — a same-destination replot included — so it can never ride a later
route. Every other refusal is unchanged, including `autopilot` for a repeat
while the dock helm is already flying. Only a queued route carries its lease
through the automatic per-jump recalc; an ordinary route still comes off the
helm at every jump. `npm run test:route-dock` flies the real system loop for a
one-hop and a two-hop case and runs as a checked child of `npm run test:boot`;
its queue pins fail on the pre-fix source. Independent QA and live browser
validation remain pending; this is not a merge or deployment claim.

Issue [#185](https://github.com/barryrwilson/Rimward/issues/185) is implemented
on `codex/issue-185-dock-receipts`: successful docking no longer produces an
in-range `dock-range` miss or the helm's own already-docked refusal. Manual
out-of-range and explicit already-docked refusals remain. See
[evidence](Issue185DockReceiptsEvidence.md); independent review remains pending.

Issue [#184](https://github.com/barryrwilson/Rimward/issues/184) is implemented
on `codex/issue-184-station-touch`: in the dock autopilot `stage` and `settle`
phases only, a `bodyHit` row against the station with `damage === 0` and a
finite `|speed|` under 1 u/s no longer cancels the approach. Every other row
still cancels, including a malformed or non-finite speed or damage, another
body kind, a speed at or above the floor, and any other phase. All `bodyHit`
rows in the frame are judged, so a harmless touch cannot mask a real impact.
The #173 cancellation full stop and weapon-hit separation are unchanged, and
other autopilot modes are untouched. `scripts/issue-139-dock-corridor-test.mjs`
pins the new cases; its ten keep-the-helm pins fail on the pre-fix source.
Independent QA and live browser validation remain pending; this is not a merge
or deployment claim.

Issue [#173](https://github.com/barryrwilson/Rimward/issues/173) is implemented
on `fix/issue-173-dock-cancel`: impact, blocked, and stale dock cancellations
latch full stop unless hail or a combat lease owns the helm. The impact notice
names hull contact. Real weapon projectiles remain distinct from physical
contact; simultaneous contact still cancels. See [evidence](Issue173DockCancelEvidence.md).
Independent review and publication remain pending; zero-damage contact policy
belongs to #184.

Issue [#172](https://github.com/barryrwilson/Rimward/issues/172) is implemented
on the local `fix/issue-172-dock-sun` candidate; independent QA is pending.
PR #180 already retained solar detours. This follow-up scans all valid planner
keep-out bodies and adds the five authored-gate solar approach cases to the
boot gate. The cases use real jump arrival positions, a stationary hull facing
the station stage, and isolated NPC traffic; solar damage, asteroids, station
collision and actual berth completion remain active. Arrival-turn gate-ring
contacts and zero-damage contact cancellation are outside this issue.

The five Agent API playtest outcomes below are implemented on the local
`codex/agent-api-fixes` candidate. Focused builder checks and live evidence
are recorded; **final integrated QA and publication remain pending**. This
status is not a merge or deployment claim. See the
[mission record](AgentApiFixes20260914.md) for artifact identity and gates.

| Outcome | Issue | Evidence |
|---|---|---|
| Cruise-speed current-station approach with braking and sun/body avoidance | [#168](https://github.com/barryrwilson/Rimward/issues/168) | [Cruise evidence](Issue168CruiseEvidence.md), [bounded station-detour progress](Issue168DetourProgressEvidence.md), [parked-hull exit](Issue168CruisePadExitEvidence.md); final combined verification pending; retains planned sun detours overlapping #172. |
| Documented raw pitch sign and real-hull steering regressions | [#169](https://github.com/barryrwilson/Rimward/issues/169) | [Steering evidence](Issue169SteeringEvidence.md); original no-turn symptom unreplicated in isolated Chrome. |
| Named desk refusals, service-pane launch and station-local offered work | [#170](https://github.com/barryrwilson/Rimward/issues/170) | [Desk evidence](Issue170DeskEvidence.md). |
| Raw burner pulse without flee ownership, with immediate dock handoff | [#171](https://github.com/barryrwilson/Rimward/issues/171) | [Desk/burner evidence](Issue170DeskEvidence.md); combat retreat authorization unchanged. |
| One displayed haul quote across desk, observation and acceptance | [#178](https://github.com/barryrwilson/Rimward/issues/178) | [Quote evidence](Issue170DeskEvidence.md); accepted pay stays fixed. |

Unrelated dock-cancellation, market presentation, consignment, and new mission
work remains governed by its own issues. This refresh does not claim their
completion or a census of every open GitHub issue.

[#163](https://github.com/barryrwilson/Rimward/issues/163), Agent Play mouse
ownership, merged in [PR #165](https://github.com/barryrwilson/Rimward/pull/165).
[#166](https://github.com/barryrwilson/Rimward/issues/166), station-hold
pressure, is included in this base through
[PR #167](https://github.com/barryrwilson/Rimward/pull/167). The 300 u hold
radius and a dwell readout remain design candidates, not part of this task.

Parked follow-ups recorded by the merged issues, none promoted to a task:

- Station security reacting to a hostile hunter near the dock, ace demand
  behaviour and starter cruise speed versus an ace (#125); a job that sends a
  patrol across a gate (#125).
- The optional fear-rating suppression of rival pirate interest (#123).
- A visible prize crew flying a captured hull to the station, the
  pirate-faction Q-ship re-entry, and a boarding that survives a save/restore
  or a range cull (#147).
- A visible salvage tug for the NPC derelict claim; the salvage hail (H) on a
  derelict still keys on `disabled` (#148).
- Rare-ore respawn weighting and respawn size for a reseeded asteroid slot
  (#149).
- A pirate scooping a spill it did not cause, and a pirate purse that is ever
  spent (#151).
- Strip-and-keep of weapons before a hull sale, selling the mounted hull, and
  buying back a sold hull (#158).
- Flying a claimed hull back physically, repairs or refits as part of a keep,
  and NPC claimants of a derelict (#159).

## Completed and merged outcomes

All issue numbers in this table are closed. Linked PRs are merged into the
snapshot above; their review and verification records apply to their named
artifacts, with their stated limitations.

| Outcome | Issue / merged PR | Durable design or evidence |
|---|---|---|
| Only Escape takes the ship back from Agent Play; pointer motion, clicks, flight keys and the fire button are discarded while a lease or an agent-engaged helm owns it, and the HUD says so | [#163](https://github.com/barryrwilson/Rimward/issues/163) / branch `claude/next-issue-519546` | `agentOwnsShip` / `markAgentHelm` in `src/systems/controls.js`; `observe().control.input === 'escape'`; the Escape-only contract in [AgentApiDesign.md](AgentApiDesign.md) and [AgentReactiveDefenseDesign.md](AgentReactiveDefenseDesign.md); issue #163 pins in `test:combat-intent`, `test:reactive-defense`, wave 132/141 of `test:boot`; live check 2026-09-13. |
| A claimed derelict is kept as an owned hull, sold, or returned at the shipyard desk by the player's choice; a kept hull carries the kit its class implies and `hot: true` | [#159](https://github.com/barryrwilson/Rimward/issues/159) / [#161](https://github.com/barryrwilson/Rimward/pull/161) | `settleClaimedHull` in `src/game/derelict.js`; **Claimed hulls** pane in `shipyard-desk.js`; `npm run test:prize` section 8 inside `test:boot`; live check 2026-09-13. Nothing settles on dock any more. |
| The shipyard buys an unmounted hull back from the hangar (`HULL_RESALE` home/foreign rates; a hot hull sells anywhere at the fence rate) | [#158](https://github.com/barryrwilson/Rimward/issues/158) / [#160](https://github.com/barryrwilson/Rimward/pull/160) | `sellHangarHull` in `src/game/shipyard.js`; `npm run test:hull-sale` (58 pins) inside `test:boot`; live check 2026-09-13. |
| An NPC pirate may claim the crew and the hull of a yielded trader and fence the prize; a crewless hull is claimable by the player (H on a locked derelict) onto `world.claimedHulls` | [#147](https://github.com/barryrwilson/Rimward/issues/147) / [#157](https://github.com/barryrwilson/Rimward/pull/157) | `src/game/prize.js`, `PRIZE` / `PRIZE_CLAIM` in `state.js`; `npm run test:prize` inside `test:boot`. A named quarry is never a prize; a prize sale does not feed the market. |
| An NPC pirate scoops the pods it took and sells the haul at the local station fence | [#151](https://github.com/barryrwilson/Rimward/issues/151) / [#156](https://github.com/barryrwilson/Rimward/pull/156) | `src/game/pirate-haul.js`, `PIRATE_HAUL` in `state.js`; `npm run test:pirate-haul` (38 pins) inside `test:boot`. Receipts `npcPodCollected` / `npcFenced` stay off the agent ring. |
| An unclaimed yielded hull is a derelict that anyone can claim and that folds away after 30 minutes | [#148](https://github.com/barryrwilson/Rimward/issues/148) / [#155](https://github.com/barryrwilson/Rimward/pull/155) | `src/game/derelict.js`, `DERELICT` in `state.js`; `npm run test:derelict` (45 pins) inside `test:boot`; live check 2026-09-12. |
| The wave-142 war scenario in `npm run test:boot` is deterministic | [#153](https://github.com/barryrwilson/Rimward/issues/153) / [#154](https://github.com/barryrwilson/Rimward/pull/154) | Harness-only: `pickWarQuarry` reads the war dest bank first; the fixture parks at the head of the dest bank. No player-facing change. |
| A mined-out asteroid breaks up, leaves the field, and a rock of another ore reseeds its slot after 3–5 minutes of world time | [#149](https://github.com/barryrwilson/Rimward/issues/149) / [#152](https://github.com/barryrwilson/Rimward/pull/152) | `ASTEROID_RESPAWN` in `state.js`, `world.fieldRespawn`; pinned in `test:boot` (section "Issue #149"); live check 2026-09-12. |
| A trader that yields its cargo runs for a refuge instead of parking dead-stick | [#146](https://github.com/barryrwilson/Rimward/issues/146) / [#150](https://github.com/barryrwilson/Rimward/pull/150) | `capitulate` in `npc.js` routes every crew-aboard yield through the #68 escape plan; pinned in `test:boot` (section "Issue #146"); live check 2026-09-12. |
| Built hulls trail a velocity-driven drive plume in the faction's glow colour | [#145](https://github.com/barryrwilson/Rimward/pull/145) | `src/systems/thruster-fx.js`; pinned in `test:boot`. Organic hulls keep their bioluminescent surge. |
| The Assembly fleet is redesigned: survey head, can spine, report dish | [#144](https://github.com/barryrwilson/Rimward/pull/144) | Wave-16 ship art; approved studies under `reviews/`. |
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
| Agent Play mouse ownership | **Implemented for [#163](https://github.com/barryrwilson/Rimward/issues/163)** (owner report 2026-09-06; owner decision 2026-09-13: Escape is the only takeover). `controls.js` no longer drops a lease on pointer motion, clicks, flight keys or fire; an agent-engaged helm (autopilot, dock approach, automine, flee) is marked by the bridge and released only by Escape. Kept here as the record of the observation; the completed table carries the durable evidence. |
| Historical raw afterburner/flee report (local PIR-02) | The old raw command acquired a flee helm. #171 replaces that command with a single burner pulse, so its old flee-timer observations do not describe the new raw path. Tactical combat withdrawal retains its separate bounded authorization. See the current Agent API candidate and its live evidence before filing any remaining motion or station-contact defect. |
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

### Issue #174 — remembered station prices (implementation, review pending)

The branch adds historical SELL quotes captured when viewing a docked market,
a Market toggle naming the best remembered station and age per commodity,
chart hover/selection readouts, save normalization and agent row parity.
[Contract and current verification](Issue174PriceMemory.md). Build, boot and
focused regressions and ten live browser checks pass; independent QA remains pending.
