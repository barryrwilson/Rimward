# RIMWARD remaining work

Inventory date: 2026-09-04, including the five reliability review fixes below.

This is the compact backlog index. GitHub Project **Rimward** is the operational
queue used by Orca AI. The wishlist remains the product-intent and playtest
source; `PROGRESS.md` remains historical and must be read newest-first.

## Active outcomes

| Key | Priority | Readiness | Outcome | Source |
|---|---:|---|---|---|
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

The five review fixes passed local verification:
`npm run build`, `npm run test:boot`, and the four focused regression commands.
Live browser verification captured no console errors. PR CI and the focused
release gate now include these regressions; no hosted verification or release
publication is claimed.

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
