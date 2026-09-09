# RIMWARD remaining work

Inventory date: 2026-09-06, including the five reliability review fixes, the owner-reported Agent Play mouse-control defect, and four trader-playtest tasks below.

This is the compact backlog index. GitHub Project **Rimward** is the operational
queue used by Orca AI. The wishlist remains the product-intent and playtest
source; `PROGRESS.md` remains historical and must be read newest-first.

## Active outcomes

| Key | Priority | Readiness | Outcome | Source |
|---|---:|---|---|---|
| [#62](https://github.com/barryrwilson/Rimward/issues/62) | P1 | SOURCE, PROBE METHODOLOGY and FUNCTIONAL ACCEPTANCE PASS; G1 closed; production release blocked | Reactive defense runs inside the existing bounded combat lease, responds to visible warnings/hits without requiring attacker identity, and preserves human takeover, collision priority and stable withdrawal completion. No standalone helm or persistent stance. | [Design](AgentReactiveDefenseDesign.md) and [verification record](playtests/2026-09-09-issue-62-reactive-defense.md). Independent focused review passes `30c0b280`, retaining unchanged runtime `97c5ea1`; 19 defense groups, 33 combat-intent groups, boot and relevant regressions pass. Controlled 5/15/30-second and obstruction coverage retains worse enabled shield loss and a zero-damage bump. Clean natural `natural-30-g1-wren-07` on probe `b14e542e` runs 30.0226 monotonic seconds with confirmed incoming, no outer actions and clean lifecycle/teardown. Its local maneuver evidence is controller telemetry plus public motion, including seven noncontiguous strafe samples; aggregate motion starts with setup-carried momentum. Anonymous blocked-hit bounds are not new natural defensive-maneuver timing proof. All prior attempts and per-probe identities remain recorded. Production build exceeds unchanged limits by 21,216 minified / 6,222 gzip bytes; two of five cold starts exceed 8,000 ms. Owner exception decision and any authorized activation/review remain pending; no issue closure, merge or release approval claimed. |
| [#61](https://github.com/barryrwilson/Rimward/issues/61) | P1 | Verified; owner exceptions approved; PR ready | A bounded, explicitly renewed target-specific combat intent shares controls ownership with raw leases. Pursuit, periodic firing and repositioning continue between decisions; target terminals, human takeover and lifecycle changes release control. #62 defensive reactions remain separate. | [Combat intent contract](AgentCombatIntentDesign.md) and [verification record](playtests/2026-09-09-agent-combat-results.md). Independent source QA passes `11839b14`; focused checks, full boot and supplemental gameplay evidence pass within their stated scope. Historical build exceeded unchanged byte limits by 11,486 minified / 3,168 gzip bytes; all five startup samples fail the 8,000 ms (median 12,481.9 ms). Owner approved the exact measured byte and startup exceptions on 2026-09-09; build and bundle report now pass with the exact descriptor, all 447 emitted files and runtime source matching the reviewed candidate. Global limits unchanged; PR handoff ready, not merged. |
| [#74](https://github.com/barryrwilson/Rimward/issues/74) | P2 | Implemented; verification and review tracked in [PR #88](https://github.com/barryrwilson/Rimward/pull/88) | Jobs gives a stock Greenhand shared UI/API guidance for confirmed local recovery and a bounded station-to-gate search when none is posted. Accepted real-wreck recovery exposes a flight marker and matching bearing/range, requires two free hold units, credits only its own pod, preserves its deadline through restore, and retains collected/payment state. Expired or legacy unbounded leads fail explicitly; failed rows stay at the issuing board and are reclaimable at restore's job cap while accepted work remains protected. Foreign cards direct return to the issuing dock and quote its rate. Actual NPC aftermath and payouts remain unchanged; no guaranteed spawn, income, new persisted field, control or equipment. | [Decision and verification contract](SalvageOnboardingDesign.md), from the [source playtest summarized in issue #74](https://github.com/barryrwilson/Rimward/issues/74). Three fresh profiles were observed over bounded attempts, with later navigation interruptions retained. All three observed Freehold guidance and the bounded watch. One completed a natural collection-and-sale loop: 10 Provisions sold at Freehold, 350 to 1,350 UU with an empty hold after sale. This was incidental cargo, not a naturally offered recovery job. Commit `9fe768c` passed all three hosted gates; local full boot and regressions passed with later UI-only corrections separately evidenced. Initial Claude review required failed-recovery cap reclamation and complete natural evidence. Correction build passes at 1,799,978 B / 524.29 KiB gzip with unchanged budgets; 27 focused recovery pins and schema/hardening checks pass. Final verification and independent review are tracked in PR #88. Detailed timing, source identity and fixture/real-event distinctions are retained in `out/issue-74-evidence/` and the PR handoff. |
| [#73](https://github.com/barryrwilson/Rimward/issues/73) | P2 | Implemented; local verification complete; initial independent QA PASS on `303fdc8` | Retain capacity-free passengers: no buy-in or commodity reservation, origin quote locked on acceptance, 600-second delivery window, separate fares for distinct parties, two renewable slots per origin rather than a global ship capacity. Same-route stacking and a full ordinary hold remain intentional. Shared Jobs detail/reward text and public station observations explain the commitments before acceptance; accepted receipts repeat destination, fare and terms. Duplicate acceptance explicitly refuses without changing the agreement. Existing agreements and #71 persistence behavior remain intact; no fare cut, cabin system or market redesign. | [Passenger commitment policy](PassengerCommitmentPolicyDesign.md): historical accounting, alternatives, unique-haul fence and reproducible commands. Focused contracts, build (1,799,951 B / 523.14 KiB gzip), full boot and rendered headless Chrome single/double/mixed flows pass; zero console errors/exceptions. Single/double page Reload, focused fresh-process restores, and mixed graceful Chrome close/relaunch before and after delivery preserve agreements, cargo and exactly-once pay. Declared berth/funding fixtures are functional evidence, not new travel benchmarks. Local ledger `out/issue-73/live/probes.json`. Independent Claude QA passed initial artifact `303fdc8` on 2026-09-08 from source and recorded evidence; selector/doc follow-up verification and review are recorded with the final pull request artifact. |
| [#67](https://github.com/barryrwilson/Rimward/issues/67) | P2 | Implemented; local verification complete | The displayed hail state and the interaction actually offered now agree. The existing target status line separates `WILLING TO YIELD` (morale) from `YIELDED` (completed surrender), keeps `BARGAINING` and `DEAD IN SPACE`, and adds no passive metadata. The H prompt appears only when the key really opens a card; a deliberate press explains the refusal (`already yielded, no further terms` / `no terms offered`). `observe().targets.current.hail` publishes the same state, blocker, reason and next step the UI shows. No mechanics, economy, reward or schema version change. | `npm run test:capitulation-feedback` 188 pins PASS; `test:hail-identity`, `test:first-scare`, `test:agent-schema`, `test:agent-hardening` PASS. `npm run build` + full `npm run test:boot` PASS on `d617f1f2`; runtime `src` tree at `74dc0c20` is identical (`0718c73a`). `npm run test:capitulation-live` 9/9 PASS on `74dc0c20`, zero console errors or exceptions: real pre-fixture Marked 350 UU / fear 15, seeded willingness with no reward, a genuine public-ransom yield, repeated hails with no double dip, own/unrelated cards, empty holds, salvage, range and overlay. Ledger `out/issue67/live-74dc0c2-attempt1/probes.json`. |
| [#68](https://github.com/barryrwilson/Rimward/issues/68) | P2 | Implemented; local verification and independent QA complete | A fleeing NPC now runs for a real destination instead of open space. One escape plan on the record (`src/game/npc-escape.js`) owns the runner's chosen refuge — a physical outbound gate **or** the station holding lane, scored by distance plus pursuer exposure — its movement, and a whitelisted condition/peace snapshot. The plan survives the 1400 u traffic cull, re-instantiation, save/restore and the player's own jump: a reacquired runner is the same id at the same damage on the same route, never a healed hull on its old lane. Gate arrival shows a visible charge inside `JUMP.zone`, then a real `beginTransit` crossing (trader-only migration is unchanged; escape is an explicit guarded opt-in) with one terminal `npcEscaped` receipt, the lock released at true departure, and the same record arriving in the destination bank. Station arrival is a visible external hold with one `npcSheltered` receipt — still live, lockable and damageable, no immunity, docking, bounty or lock loss. Engine-out keeps its 30%-cruise contract and cannot charge; disabled cancels an accrued charge; destroyed/captured cancels the plan. Local hunt contracts fail with an explicit escaped-system line and no reward; patrol credit cannot be doubled; a surviving fleeing named ace no longer schedules a successor or a line-broken story. Pirate/ace wakes now point at the chosen refuge with a truthful no-salvage discovery; untagged legacy sites keep the wreck field. HUD and `observe().targets.current.escape` publish the same word. No new control, key, gauge, SKU, damage/repair tuning or API version. | Verified on `e179dfe5`: build (1,799,681 B; 522.95 KiB gzip), full boot, focused escape, schema/hardening, surrender/hail, safe-launch and dock approach/persistence PASS. Live browser `test:gate-escape-live` 8/8 PASS, zero console errors/exceptions; route, refuge, engine-out/disabled, retained chase, cull/reacquisition and real cross-system paid peace verified. Independent Quinn QA PASS, including blocked second escapes, truthful evade wakes and completed-plan restore. Reproduce with the committed scripts; local ledger `out/issue-68-evidence/live-e179dfe5/probes.json`. |
| [#69](https://github.com/barryrwilson/Rimward/issues/69) | P2 | Implemented; local verification complete | Accepted surveys expose their named landmark through the existing player-visible flight marker and `jobs.active[].objective` (identity/system, status/reason, local range/bearing and discovery radius). Public control reaches the site and files for the quoted payment. Unknown, malformed, expired and remote objectives withhold local geometry; no hidden clues/sites, chart/discovery mutations, new helm or save fields. | `npm run test:survey-navigation`: fresh Greenhand public-only 932.1 u flight, real discovery/progress, 420 UU quoted/paid; metadata restrictions and serialized restore/marker deduplication pass. Build, full boot (including agent gameplay), schema and hardening pass. Live browser verifies accepted-survey reload, visible marker/API parity, discovery and the 420 UU dock payment with no console errors; settlement is asynchronous after docking. [API contract](AgentApiDesign.md#issue-69--accepted-survey-navigation). |
| [#63](https://github.com/barryrwilson/Rimward/issues/63) | P2 | Implemented; local verification complete | First Scare requires a real downward resolve crossing from defiant/shaken into bargaining/capitulate after player damage since the previous resolve sample. Any NPC damage in that sample disqualifies ambiguous attribution. Seeded low resolve, passive play, stale hits and immune attacks never award it. Existing milestone persistence remains; public milestone evidence adds cause and visible target identity. | `npm run test:first-scare`, build, full boot and agent-schema pass. Visible fresh Greenhand passive control and public cannon-earned scare pass; supplemental rendered browser run verifies ordinary dock/autosave/reload preserves exactly one award without replay. Both browser runs report zero console errors/exceptions. No resolve tuning, new persisted fields or bluff changes; previously awarded save flags are preserved. |
| [#65](https://github.com/barryrwilson/Rimward/issues/65) | P2 | Implemented; focused tests, build, full boot and live verification complete | Give the ordinary station Launch and the agent `undock` one shared departure clearance. Docking now parks the ship immediately at zero velocity and speed with stale movement input cleared; the berth then releases along the outward radial at a collision-clear point, and a fouled lane holds the berth with an actionable line and a working retry instead of launching into it. | 2026-09-07 issue #65: the real cause was the retained inbound approach heading plus the creep resumed on launch — not an ordinary dock parked inside the station envelope. Live Freehold and Redmarch evidence available. |
| [AGENT-071](https://github.com/barryrwilson/Rimward/issues/71) | P1 | Implemented; build/full boot and live verification complete; independent review passed on original change | Save completed dock delivery passes (including passenger replacements), market trades, accepted jobs and services with persisted effects after their full mutations. Session-only bar rounds retain their prior behavior. Failed autosave requests retain a session-only retry at the berth through the existing encounter/mid-jump gates; storage failures surface their actual reason. No save-schema change. | 2026-09-07: focused persistence tests, build and full boot pass. Visible browser reload and graceful `Browser.close`/same-profile restart preserve delivery, trades and return ferry/passenger agreements; refusal checks preserve them, with zero console errors. Forced `taskkill /F` teardown restored an older snapshot and remains a crash-durability limitation. Historical passenger rollback despite redock is not proven to have the same cause. Recovery-contract marker restoration is addressed by #74; its final live and independent QA gates are tracked in that entry. |
| [AGENT-072](https://github.com/barryrwilson/Rimward/issues/72) | P2 | Implemented; local verification complete; independent review pending | Retain `saveBlocked`, `docked` and `undocked` lifecycle rows in the bounded agent session ring so fresh feedback survives a ring saturated with 16 distinct `mineHit` rows. Existing cap-16 eviction policy reused; no schema, version, or persistence change (save persistence stays #71). | 2026-09-07 issue #72: all three lifecycle events were discarded on arrival under mineHit saturation. Ring regressions added in `scripts/agent-schema-test.mjs`; live `dockedEvent`/`undockedEvent` pins in `scripts/agent-bridge-smoke.mjs`. |
| [AGENT-070](https://github.com/barryrwilson/Rimward/issues/70) | P2 | Implemented; build/full boot, independent review and visible browser verification complete 2026-09-07 | Refuse duplicate acceptance of an active ferry consignment before any cargo is granted. `acceptJob` now gates the `ferry` branch on job state first: an `accepted` consignment is turned away with a clear notice and no mutation, and the completed unique consignment's `done`→`offered` reset moved *after* the capacity gate, so a "no room" refusal preserves the whole job including its previous agreement (`originSystem`/`destSystem`/`payQuoted`). Legitimate completed-unique reacceptance and normal delivery/pay-once are unchanged; scope stays on `kind === 'ferry'` and no persistent field, control, UI or API schema changed. Save persistence stays #71 (not addressed here). | 2026-09-07 issue #70: the shared `ctx.stationDesk.acceptJob` handler fronted another four free Provisions on every re-accept and overwrote the live agreement. Regressions added to `scripts/boot-test.mjs` ("issue70 ferry duplicate accept") covering both the public `rw.act` path and the shared handler with a retained board handle. |
| [AGENT-064](https://github.com/barryrwilson/Rimward/issues/64) | P3 | Implemented; local verification complete | Report successful station actions as successes. `act({ name:'stationAction' })` previously returned the desk's success notice in `error`, so every caller read a completed purchase as a failure. `actResult` gains an additive `notice` string (default `''`, same `str()` filter, no version bump) present on every browser `actResult` receipt (transport/no-ctx bridge errors separate); a successful `stationAction` answers `ok:true`, `error:''`, `token:''` and `notice` equal to the exact displayed success line. Failure tokens, the notice-as-error failure text, the station classifier, the player button closures, `reqId`/`t` and `observe().station.view.notice` are unchanged; `observe().lastIntent` keeps its existing shape (notice is immediate-only) and now clears `error` on success. | 2026-09-07 issue #64. Regressions: receipt-shape pins in `npm run test:agent-schema`, dispatcher pins over a fake `stationDesk.perform` in `npm run test:agent-hardening`, live `stationBarNotice` parity pin in `npm run agent:bridge:smoke`. |
| [AGENT-066](https://github.com/barryrwilson/Rimward/issues/66) | P2 | Implemented; local verification complete | Make the public controller identify the actual open hail speaker, family and player-visible terms, and let it bind an action to that one conversation. `observe().hail` adds `conversationId`, `speaker {id,name}`, `kind` (`demand`/`surrender`/`salvage`/`conversation`) and `terms` (displayed line, button labels, only the monetary amounts the card prints) from a single authoritative snapshot of the open card in `hail.js` — never the selected target, never private NPC state, never the event ring. `hailResolve` accepts an optional `expectedConversationId`; `hail.js` compares it against the live card immediately before any effect, so a replaced card refuses with `stale` and moves no credits, cargo, surrender flag, AI state or event. Session-scoped opaque token: stable across redraw/countdown, new on close/reopen and on any semantic change. Legacy intent/index calls and the ordinary button and number-key paths are unchanged. No schema version, persisted field, new debug API, or gameplay/economy/combat change. | 2026-09-07 issue #66: peek exposed only open/intents, observation fell back to a stale ring, and `hailResolve` could not reject a replaced card. Regressions: `npm run test:hail-identity`, identity pins in `npm run test:agent-hardening`, live probe `npm run test:hail66-live`. |
| [TRADE-001](https://github.com/barryrwilson/Rimward/issues/53) | P1 | Implementation and local verification complete 2026-09-07; independent final review pending; Rimward project Todo | Prevent profitable immediate buy/sell loops at the same station after all price modifiers and rounding. Preserve legitimate inter-system trading. | 2026-09-06 trader playtest: Grand Auction Provisions bought for 216 UU and sold for 248 UU using ordinary keyboard controls. |
| [TRADE-002](https://github.com/barryrwilson/Rimward/issues/55) | P1 | Needs design/owner decision; depends on TRADE-001; Rimward project Todo | Establish meaningful market liquidity and trader progression after correcting the inverted spread; do not prescribe stock limits or retune ship prices before measuring the corrected economy. | Same playtest: 5,451 units cycled at one dock; a full freighter round trip earned about 34,700 UU against a 24,000 UU ship purchase. |
| [TRADE-003](https://github.com/barryrwilson/Rimward/issues/54) | P2 | Implemented; local verification complete | Render the purchased freighter's real model after cold save reload instead of retaining the grey fallback box. A cold remount shows the fallback until its GLB finishes loading, then swaps the real asset in under the same `player-plated` wrap — flight root, transform and `hullRig` identity unchanged. A completion that arrives after the player mounted something else is dropped (disposed rig, replaced `hullRig`, rig out of scene, or SKU mismatch), and a load failure keeps the flying fallback. The fit is measured on the detached incoming mesh, so warm and cold construction agree exactly and the live root rotation, flesh breath/third-person 0.55 view scale, and first-person visibility cannot distort hull size. | 2026-09-07 issue #54: live reload preserved cash and 160-unit capacity but displayed a grey box; player hull construction depended on an already-primed asset cache. Regressions: `node --import ./scripts/with-css-stub.mjs scripts/issue-54-cold-plated-hull-test.mjs` (53 assertions), live probe `node scripts/issue-54-live-cold-hull-probe.mjs` (6 pins, clean console) which buys/mounts a Gilded freighter through the real yard UI, saves through the game's own autosave, and cold-reloads with the GLB held at the network layer. |
| [TRADE-004](https://github.com/barryrwilson/Rimward/issues/56) | P2 | Needs design; coordinate with TRADE-001; Rimward project Todo | Add explicit quantity, buy-max and sell-all controls with clear transaction totals, bounded by available money and cargo. | Current +/-1 and +/-5 UI requires 64 five-unit input actions to fill and empty a 160-unit freighter hold. |
| Agent Play mouse ownership | P2 | Open; owner-reported; backlog only, implementation not started; no external issue created | Fix mouse control interfering with agent control while Agent Play owns the game. Incidental pointer movement and UI clicks must not steer the ship or interrupt agent-directed flight, docking, or mining. Preserve an explicit stop/human-takeover path and normal mouse flight after takeover. Acceptance: live visible-browser verification while moving the cursor, clicking UI, and changing focus during these flows; no stale mouse input applied on handoff. Do not assume the existing opt-in reticle latch covers every control path. | Barry's observation during the 2026-09-06 visible player-scenario playtest in the current workspace (`window.rimward` v1); backlog-only update explicitly authorized. |
| [RW-001](https://github.com/barryrwilson/Rimward/issues/2) | P1 | Implemented; live verification restored by [#31](https://github.com/barryrwilson/Rimward/issues/31) | Add a playable outer pad-approach intent with a braking profile. Owner choice 2B and the focused design were approved on 2026-08-27. `approachDock` reuses the existing Autopilot/ship helm, observes range/progress, brakes through a fixed `+X` corridor, and finishes only through the ordinary in-zone KeyJ pulse. The 2026-08-29 release-readiness audit found a live Freehold spawn regression (`blocked` / 30 u/s pad orbit). Stage now idle-turns onto the stage chord, ignores route-AP widen, and creeps instead of inheriting route cruise. Five consecutive `npm run agent:bridge:smoke` runs passed on one unchanged commit/tree, each with `approachBraked`, `approachDocked`, `approachUndocked`, `consoleClean`, and `teardownPortsFree`; forbidden teleport remained rejected. No teleport, third helm, or persisted approach state. | [Focused design](AgentApiPadApproachDesign.md); [Agent API parent and live-play capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-27-claude-fable-agent-api-live-play); follow-up [#31](https://github.com/barryrwilson/Rimward/issues/31) |
| [RW-002](https://github.com/barryrwilson/Rimward/issues/3) | P2 | Implemented; verification complete | Expand Settings with mouse sensitivity, invert X/Y, complete conflict-aware key rebinding, and separate music/effects/voice/UI volume. Brief: [Ctl06ExpandedSettingsDesign.md](Ctl06ExpandedSettingsDesign.md). PR1–PR5 on master (#16, #17, #29). GitHub #3 is closed. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| [RW-003](https://github.com/barryrwilson/Rimward/issues/4) | P2 | PR1–PR2 on master; PR3 summary card implemented and verified in [#46](https://github.com/barryrwilson/Rimward/pull/46); PR4 not filed | Turn Models into a browsable ship reference grouped by faction/class, with pirate variants, role/scale/lore summaries, and unambiguous loading progress. Brief: [Mdl01ShipReferenceDesign.md](Mdl01ShipReferenceDesign.md). Census: 245 catalog entries, of which 72 are trader/pirate skin duplicates sharing one sculpt. PR1 hygiene/shell: [#23](https://github.com/barryrwilson/Rimward/issues/23) / [#25](https://github.com/barryrwilson/Rimward/pull/25). PR2 grouping/variants: [#26](https://github.com/barryrwilson/Rimward/issues/26) / [#27](https://github.com/barryrwilson/Rimward/pull/27). PR3 summary card: [#28](https://github.com/barryrwilson/Rimward/issues/28) / [#46](https://github.com/barryrwilson/Rimward/pull/46). Next: PR4 loading/disposal. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| [RW-004](https://github.com/barryrwilson/Rimward/issues/5) | P3 | Implemented; verification complete | Recoverable runtime-error UX: startup vs mid-session copy, last-save line from trustworthy `savedAt` only, accessible Reload, Tab trap, and `npm run test:runtime-error-ux`. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| [RW-005](https://github.com/barryrwilson/Rimward/issues/6) | P3 | Implemented; verification complete | Keep zero-cost recovery. Overlay copy states no UU charge. Autosave restore and no-save Freehold starter are unchanged. Owner choice 1 on 2026-08-28. Brief: [DeathLossPolicyDesign.md](DeathLossPolicyDesign.md). GitHub #6 is closed. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| [RW-006](https://github.com/barryrwilson/Rimward/issues/7) | Maintenance | Implemented; verification complete | WAVE30 demand/pay fixture pins leftover hail, jump grace, death-calm, cargo, prices, and nearby hostiles. Probe: `scripts/wave30-hail-probe.mjs` (20/20). | [`PROGRESS.md` standing notes](../PROGRESS.md) |
| [RW-007](https://github.com/barryrwilson/Rimward/issues/13) | Maintenance | Implemented; verification complete | WAVE127 `ringHeld` drains the agent event ring; WAVE132 `dockOneFrame` sets `station.inZone` at act time. Probe: `scripts/wave127-132-probe.mjs` (20/20). Hosted boot job is a required check. | [First hosted CI evidence](https://github.com/barryrwilson/Rimward/actions/runs/33121116955); [`PROGRESS.md`](../PROGRESS.md) |
| [#20](https://github.com/barryrwilson/Rimward/issues/20) | Maintenance | Implemented; verification complete | Seed the full boot harness once so traffic, events, hail, and navigation exercise one reproducible world. Existing gate assertions are unchanged. Local verification: 20/20 consecutive `npm run test:boot` runs PASS on the same tree. Hosted verification: three consecutive boot jobs PASS on unchanged commit `0c8cca9`. | [Attempts 1](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/1), [2](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/2), and [3](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/3) |
| [REL-002](https://github.com/barryrwilson/Rimward/issues/32) | Maintenance | Implemented; verification complete | Isolate every Models live-probe run with fresh Vite/CDP ports, a unique external Chrome profile, exact CDP target selection, startup console capture, and condition-specific readiness evidence. Local verification: three consecutive `npm run test:rw008-live` runs completed V1–V10 with zero console errors/exceptions on the same tree; `npm run test:opt001-live`, `npm run build`, and `npm run test:boot` also pass. | [RW-008/RW-009 release-gate follow-up](https://github.com/barryrwilson/Rimward/issues/32) |
| [REL-004](https://github.com/barryrwilson/Rimward/issues/34) | P2 | Implemented; verification complete | Resolve the release-blocking development-tool advisories without downgrading the GLTF toolchain. Scoped npm overrides select patched `nanoid@3.3.18` for PostCSS and deduplicate GLTF CLI onto `sharp@0.35.4`; full and deployable-runtime audits are both clean. The CLI's declared `sharp~0.34.5` range does not yet include `0.35.4`, so this is a deliberate compatibility exception verified by clean install, build, boot, all 228 ship GLBs, ship optimization, and PNG-to-WebP texture resize/compression plus output validation. | [Ship asset pipeline](ShipAssetPipeline.md) |
| [REL-003](https://github.com/barryrwilson/Rimward/issues/33) | P1 | Implemented; verification complete | Protect `master` with the exact `Build` and `Boot harness` checks. The release-candidate workflow accepts one full commit SHA, verifies the checked-out tree, runs every release gate without hiding later results, uploads bounded evidence, and emits one fail-closed verdict. Hosted run [33287017191](https://github.com/barryrwilson/Rimward/actions/runs/33287017191) passed on exact master SHA `aabce00c94102cace49b865f933bfba814b86c71`, including bridge 14/14, Models 11/11, OPT-001 7/7, clean consoles and both zero-finding audit trees. | [Release-readiness audit](https://github.com/barryrwilson/Rimward/issues/33) |
| [REL-005](https://github.com/barryrwilson/Rimward/issues/35) | P1 | Implemented; v0.1.0 published | Publish v0.1.0 as an immutable, download-only static `dist/` archive. The release workflow produces the versioned ZIP, checksum, manifest, and final verdict from the same exact SHA. GitHub Release `v0.1.0` is on master `4e70a714`. Release notes record player-visible changes, deferred RW-010 scope, known limitations, verification, and the tested GLTF/sharp compatibility exception. | [Release procedure](RELEASING.md); [release notes](../CHANGELOG.md); [v0.1.0](https://github.com/barryrwilson/Rimward/releases/tag/v0.1.0) |
| [#51](https://github.com/barryrwilson/Rimward/issues/51) | P1 | Implemented; local verification complete | Defer paused death recovery until the live update loop can deliver `systemLoaded`. Preserve zero-cost recovery, timer/skip inputs, and exactly-once restoration. | `npm run test:pause-recovery`; live paused Veridian-to-Freehold recovery rebuilds the radius-60 environment once. |
| [#47](https://github.com/barryrwilson/Rimward/issues/47) | P2 | Implemented; local verification complete | Ignore gameplay keydown while paused; retain keyup cleanup and independent pause/settings/menu listeners. OPT-004 remains separate. | `npm run test:paused-input`; live camera/throttle/weapon and Settings checks. |
| [#48](https://github.com/barryrwilson/Rimward/issues/48) | P2 | Implemented; local verification complete | Release every instance-owned Beautiful Ones swim material, including late-LOD ownership, without disposing shared resources or siblings. | `npm run test:ship-material-release`; six rendered sibling spawn/release cycles return shader-program count to zero; live NPC removal disposes its private materials. |
| [#49](https://github.com/barryrwilson/Rimward/issues/49) | P2 | Implemented; local verification complete | Oversized action requests receive HTTP 413 before connection closure, with bounded buffering and no evaluator dispatch. Complete, chunked, and unfinished uploads are covered. | `npm run test:agent-bridge`; live CDP-backed HTTP 413 followed by successful HTTP/WS ping. |
| [#50](https://github.com/barryrwilson/Rimward/issues/50) | P3 | Implemented; local verification complete | Reject missing/empty programmatic bridge tokens before opening a listener. Keep valid CLI token behavior and existing authentication refusal paths. | `npm run test:agent-bridge`; live unauthenticated request returns 401 and authenticated observation/ping succeed. |
| AGENT-PLAY-PARITY | P1 | Implemented; merge gated on final independent QA and CI | Complete screenshot-free agent play: agent API v2 (`window.rimward` VERSION 2) with capability discovery and dynamic availability, a controls-owned expiring manual-control lease (steer/throttle/fire/drift) that refuses helm conflicts and clears on every unsafe transition, HUD-derived aim/lead/scanner-gated target geometry, full station-service parity via the exact player closures (bar, outfitting, people, epics, shipyard, launch — owner-authorized), in-flight job observation with terminal `jobState` outcomes, `recover` on the death-overlay path, and reqId/t receipts. Evidence: `npm run test:agent-schema`, `npm run test:agent-hardening`, wave 141 in `npm run test:boot`, `npm run test:agent-bridge`, and the scenario ledger from `npm run agent:bridge:smoke` (`out/w136/smoke/scenario-ledger.json`). No new mechanics, persistence, keys, or HUD gauges; bridge stays loopback-only. | Mission 43b34db25ae32972 (user request 2026-09-05) |

The five review fixes passed local verification:
`npm run build`, `npm run test:boot`, and the four focused regression commands.
Live browser verification captured no console errors. PR CI and the focused
release gate now include these regressions; no hosted verification or release
publication is claimed.

## Trader playtest tasks — 2026-09-06

These four tasks were requested by Barry after the visible trader run and
published with owner authorization as GitHub issues #53–#56 in the Rimward
project for Orca. No implementation is claimed. The existing Agent Play
mouse-ownership task remains separate.

Evidence directory (local, outside the repository):
`C:\Users\barry\orca\workspaces\WebSim\playtest-evidence\trader-million-2026-09-06-9kmrkdq5`.
It contains `trades.jsonl`, `audit-summary.json`, `findings.json`,
`million-trader-save.json`, `reload-verification.json`, and screenshots.
The run reconciles as 600 starting UU + 666 ordinary trading profit +
1,028,796 same-dock loop profit - 24,000 freighter cost = 1,006,062 UU cash.
The 10m 44s game-time result used automated order entry; it is not a normal
player pacing estimate. All transactions used ordinary UI or public actions;
no money, cargo, position, or time was injected.

### TRADE-001 — Prevent profitable same-station round trips

- **Scope:** Correct the authoritative buy/sell quote and fill calculation so
  an immediate round trip at one unchanged market cannot increase cash after
  faction, standing, epic, hermit, fixer, commodity and rounding modifiers.
  Preserve quote/fill agreement and profitable trading between markets.
- **Acceptance:** The observed Grand Auction 216-to-248 UU Provisions loop no
  longer profits through either keyboard trading or public agent actions.
  Cover modifier combinations and quantities 1, 5, 99 and chunked 160-unit
  holds; cash/cargo remain valid and displayed totals equal actual fills.
- **Exclusions:** Cash caps, order cooldowns and agent-only restrictions are
  not substitutes for fixing the spread. No ship-price or liquidity redesign.
- **Sources/overlap:** `src/game/state.js:643`,
  `src/systems/station.js:4692-4756`; shares market code with TRADE-002/004.
- **Verification:** Pricing-contract regression coverage, `npm run build`,
  `npm run test:boot`, and the live Grand Auction keyboard/agent reproduction
  with console-error checks.
- **Status (2026-09-07): implementation and local verification complete;
  independent final review pending.**
  `src/systems/station.js` splits the qty-1 fill into a buy chain and a full
  sell chain, then clamps the rounded sell to the rounded buy of the same dock.
  The sell side still applies every modifier; the clamp compares two quotes at
  one dock, so a price difference between markets still pays. Where a dock's
  sell modifiers previously exceeded its buy modifiers, that dock now pays at
  most its own buy quote, so some inter-market margins are lower than before
  the fix.
  - Focused script PASS at `94cf61de` — log `out/issue-53/focused.log`:
    `node --import ./scripts/with-css-stub.mjs scripts/issue-53-market-spread-test.mjs`
  - Live probe initial run exited 0, all 5 pins, console 0 / exceptions 0 —
    `out/issue-53/live/probes.json` and screenshots:
    `node scripts/issue-53-live-probe.mjs`
  - Parent `npm run build` and `npm run test:boot` PASS on `38db38d6`
    (`out/issue-53/build.log`, `out/issue-53/boot.log`); the later source delta
    at `94cf61de` is comment-only.
  - `npm run test:boot` also covers the two hermit pricing sections, which now
    assert the capped payout plus an explicit sell-never-exceeds-buy check.
  - Fixture improvements from the review (exact 160-unit hold on both
    mixed-chunk trips, a real public sale crossing fixer trust 29 to 30) are
    applied, and both reruns PASS: focused `out/issue-53/focused-final.log`;
    live `out/issue-53/live-final/probes.json` (exit 0, 5/5 pins, console 0 /
    exceptions 0, exact 160-unit capacity).

### TRADE-002 — Design market liquidity and trader progression

- **Scope:** After TRADE-001, measure corrected ordinary trade routes and
  freighter progression; propose an explicit liquidity/pacing design for owner
  approval. Evaluate stock/replenishment, demand/price impact and transaction
  costs as alternatives, not a pre-approved bundle of mechanisms.
- **Acceptance:** Produce a measured baseline with route profit, elapsed time,
  risk and time-to-freighter; state the chosen progression targets and
  tradeoffs. Obtain the owner's design decision before implementation.
  Implementation acceptance must then pin replenishment/depletion behavior,
  quote/fill consistency and a repeatable ordinary-route benchmark.
- **Dependencies/exclusions:** TRADE-001 first. Do not balance ship prices
  against exploit earnings or silently introduce new persistent market fields.
- **Sources/overlap:** `src/systems/station.js:4735-4756`,
  `audit-summary.json`; market code overlaps TRADE-001/004.
- **Verification:** Design evidence is a fresh live trading benchmark, not
  the exploit run. Any subsequent implementation requires focused economy
  contract tests, `npm run build`, `npm run test:boot`, live trading and
  console-error checks.

### TRADE-003 — Restore real player hull models after cold load

- **Scope:** Prime the mounted plated hull asset on cold load and install the
  real model once available rather than permanently retaining the fallback.
  The Gilded freighter asset exists; this is not a request for new ship art.
- **Acceptance:** Buy/mount the Gilded freighter, save, fully reload with a
  cold in-memory asset cache, and observe the real freighter model without
  first visiting the yard preview or waiting for matching NPC traffic.
  Cash, cargo and mounted hull persist; late asset completion cannot replace
  a different hull subsequently selected by the player.
- **Sources/overlap:** `src/systems/ship.js:375-387,478-490`,
  `src/systems/npc.js:203-207`, player hangar mounting and ship asset loading.
  Independent of the market-pricing work.
- **Verification:** Focused cold-load/late-completion coverage,
  `npm run build`, `npm run test:boot`, and live purchase/save/reload visual
  verification with console-error checks.
- **Status (2026-09-07):** Implemented on `codex/issue-54-cold-hull`.
  `remountPlayerHull` still dresses a cold rig in the fallback synchronously,
  then primes the SKU and swaps the real GLB in under the same
  `player-plated` wrap, so the flight root, its transform and `hullRig`
  identity never change. A stale completion is dropped when the rig was
  disposed, is no longer `ctx.ship.hullRig`, has left the scene, or no longer
  matches the mounted SKU. The fit is computed on the detached incoming mesh,
  so a rotated flight root, the flesh breath/third-person 0.55 view scale and
  first-person visibility cannot distort the hull size; warm and cold
  construction now produce the same wrap scale.
  Verified by `scripts/issue-54-cold-plated-hull-test.mjs` (53 assertions) and
  the live probe `scripts/issue-54-live-cold-hull-probe.mjs` (6 pins, clean
  console), which buys and mounts a Gilded freighter through the real yard UI,
  saves through the game's own autosave, and fully reloads with the freighter
  GLB held at the network layer: the rig flies the grey fallback while the
  asset is provably unprimed, then swaps to the real mesh on release with
  cash, cargo, capacity and mounted id intact.

### TRADE-004 — Add freighter-scale bulk trading controls

- **Scope:** Provide explicit quantity, buy-max (limited by cash and free
  hold space), and sell-all controls with readable unit/transaction totals.
  Preserve existing small-lot controls and ordinary transaction validation.
- **Acceptance:** Fill and empty a 160-unit hold without repeated five-unit
  input; verify partial affordability, a full hold, empty cargo and restricted
  goods. Previewed totals equal actual cash/cargo changes; human and agent
  paths obey the same economic rules without bypassing per-order limits.
- **Dependencies/exclusions:** Coordinate UI decisions and the shared quote
  contract with TRADE-001. No incidental new key/digit bindings, cargo tuning,
  equipment changes or unrelated market redesign.
- **Sources/overlap:** Market UI and trade validation in
  `src/systems/station.js`; overlaps TRADE-001/002.
- **Verification:** Focused bulk-transaction boundary coverage,
  `npm run build`, `npm run test:boot`, and live keyboard/pointer interaction
  with a freighter-sized hold and console-error checks.

## Optional follow-ups

These are deliberately optional, not incomplete acceptance criteria for work
already marked done.

| Key | Priority | Follow-up |
|---|---:|---|
| [OPT-001](https://github.com/barryrwilson/Rimward/issues/8) | P3 | Evidence refreshed; verification complete. Live pass on `72f03012` (2026-08-29, rebased) rates Hail01, HUD-06, Hail02, HUD-07, NAV-09, TGT-07, and CTL-03 all PASS, 7/7, with 0 console errors. TGT-07 gets its first live browser coverage. No defect found, so nothing reopened. Set: `out/w143/opt001/verify/` (rerun `npm run test:opt001-live`; CI job `live-ui-evidence.yml` uploads it as an artifact, and is not a required check). |
| [OPT-002](https://github.com/barryrwilson/Rimward/issues/9) | P3 | Implemented; verification complete. Fresh playtest: SLOW cue does not stop a cruise ram without J. Human pad closing-speed envelope (20–80 u/s in the 45–135 u band). Afterburner / pause / jump / dock / agent `approachDock` cancel. Live cruise ram now hits at ~20 u/s, not 120. |
| [OPT-003](https://github.com/barryrwilson/Rimward/issues/10) | P3 | Add the AI-05 home-berth safe bubble after a fresh starter-run pacing check. |
| [OPT-004](https://github.com/barryrwilson/Rimward/issues/11) | P3 | Harden CTL-04 `fireHeld` behavior while station/overlay input owns the controls. |
| [OPT-005](https://github.com/barryrwilson/Rimward/issues/12) | P3 | Extend MSN-04 duplicate prevention to non-mining mission families if current generation can still produce meaningful duplicates. |
| [REL-006](https://github.com/barryrwilson/Rimward/issues/36) | P3 | Post-v0.1.0; implemented; local verification complete. The production build enforces a 1,800,000-byte minified / 525 KiB gzip JavaScript budget and a runtime-only browser dependency boundary. A reproducible composition report and 8,000 ms cold local title-ready target are documented in [ProductionPerformanceBudget.md](ProductionPerformanceBudget.md); five cache-disabled production starts measured 4,187.0 ms median / 6,601.3 ms slowest with zero console errors. `npm run bundle:report`, `npm run build`, and `npm run test:boot` passed on this tree. Models-only lazy loading is measured and deliberately parked because its small shell saving would replace the load-bearing synchronous initialization contract. |

## Not remaining work

- Checked `DONE` wishlist rows and initiative prose already closed by later
  waves.
- NAV-11 route persistence; the census found the reported loss stale versus
  live code.
- An in-repository LLM runner, browser-bundled credentials, teleport-to-pad, a
  third helm, aim-glass gauges, kit mutation, or owner-omitted content.
- General refactoring/tooling work that does not block a selected player
  outcome.
- Historical `OPEN` lines that a later wave marks `CLOSED`, `DONE`, or
  `CONSUME`.

## Converting an item into an Orca task

An implementation issue must state:

- one player-visible or reliability outcome;
- current evidence and the relevant source/design links;
- bounded in-scope and out-of-scope work;
- acceptance criteria;
- verification commands plus the live browser flow when player-facing;
- dependencies, owner decisions, and files likely to overlap with other work.

Only issues labeled `orca:ready` should be started automatically. Items labeled
`orca:needs-design`, `orca:needs-decision`, or `scope:optional` stay visible in
the project but are not implementation-ready.
