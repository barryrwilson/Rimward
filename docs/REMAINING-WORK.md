# RIMWARD remaining work

Inventory date: 2026-08-28, after RW-004 / RW-006 / RW-007 and the local
verification for issue #20.

This is the compact backlog index. GitHub Project **Rimward** is the operational
queue used by Orca AI. The wishlist remains the product-intent and playtest
source; `PROGRESS.md` remains historical and must be read newest-first.

## Active outcomes

| Key | Priority | Readiness | Outcome | Source |
|---|---:|---|---|---|
| [RW-001](https://github.com/barryrwilson/Rimward/issues/2) | P1 | Implemented; verification complete | Add a playable outer pad-approach intent with a braking profile. Owner choice 2B and the focused design were approved on 2026-08-27. `approachDock` now reuses the existing Autopilot/ship helm, observes range/progress, brakes through a fixed `+X` corridor, and finishes only through the ordinary in-zone KeyJ pulse. No teleport, third helm, or persisted approach state. | [Focused design](AgentApiPadApproachDesign.md); [Agent API parent and live-play capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-27-claude-fable-agent-api-live-play) |
| [RW-002](https://github.com/barryrwilson/Rimward/issues/3) | P2 | Design accepted; PR2 landing | Expand Settings with mouse sensitivity, invert X/Y, complete conflict-aware key rebinding, and separate music/effects/voice/UI volume. Brief: [Ctl06ExpandedSettingsDesign.md](Ctl06ExpandedSettingsDesign.md). PR1: FIELDS-only persist, invert/sensitivity, Settings TRACKED mutex. PR2: music/effects/voice/UI buses, AUDIO grouping. Next: PR3 bind map. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| [RW-003](https://github.com/barryrwilson/Rimward/issues/4) | P2 | Design accepted 2026-08-29; PR1 filed as [#23](https://github.com/barryrwilson/Rimward/issues/23) | Turn Models into a browsable ship reference grouped by faction/class, with pirate variants, role/scale/lore summaries, and unambiguous loading progress. Brief: [Mdl01ShipReferenceDesign.md](Mdl01ShipReferenceDesign.md). Census: 245 catalog entries, of which 72 are trader/pirate skin duplicates sharing one sculpt. Slices: PR1 hygiene/shell, PR2 grouping/variants, PR3 summary card, PR4 loading/disposal. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| [RW-004](https://github.com/barryrwilson/Rimward/issues/5) | P3 | Implemented; verification complete | Recoverable runtime-error UX: startup vs mid-session copy, last-save line from trustworthy `savedAt` only, accessible Reload, Tab trap, and `npm run test:runtime-error-ux`. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| [RW-005](https://github.com/barryrwilson/Rimward/issues/6) | P3 | Needs owner decision | Decide and then make the death-loss policy explicit. Current behavior restores the hull at the last berth without charging credits. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| [RW-006](https://github.com/barryrwilson/Rimward/issues/7) | Maintenance | Implemented; verification complete | WAVE30 demand/pay fixture pins leftover hail, jump grace, death-calm, cargo, prices, and nearby hostiles. Probe: `scripts/wave30-hail-probe.mjs` (20/20). | [`PROGRESS.md` standing notes](../PROGRESS.md) |
| [RW-007](https://github.com/barryrwilson/Rimward/issues/13) | Maintenance | Implemented; verification complete | WAVE127 `ringHeld` drains the agent event ring; WAVE132 `dockOneFrame` sets `station.inZone` at act time. Probe: `scripts/wave127-132-probe.mjs` (20/20). Hosted boot job is a required check. | [First hosted CI evidence](https://github.com/barryrwilson/Rimward/actions/runs/33121116955); [`PROGRESS.md`](../PROGRESS.md) |
| [#20](https://github.com/barryrwilson/Rimward/issues/20) | Maintenance | Implemented; verification complete | Seed the full boot harness once so traffic, events, hail, and navigation exercise one reproducible world. Existing gate assertions are unchanged. Local verification: 20/20 consecutive `npm run test:boot` runs PASS on the same tree. Hosted verification: three consecutive boot jobs PASS on unchanged commit `0c8cca9`. | [Attempts 1](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/1), [2](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/2), and [3](https://github.com/barryrwilson/Rimward/actions/runs/33210901143/attempts/3) |

## Optional follow-ups

These are deliberately optional, not incomplete acceptance criteria for work
already marked done.

| Key | Priority | Follow-up |
|---|---:|---|
| [OPT-001](https://github.com/barryrwilson/Rimward/issues/8) | P3 | Capture/update the optional live still set for Hail01, HUD-06, Hail02, HUD-07, NAV-09, TGT-07, and CTL-03. Keep this evidence-only unless a live defect is found. |
| [OPT-002](https://github.com/barryrwilson/Rimward/issues/9) | P3 | Implemented; verification complete. Fresh playtest: SLOW cue does not stop a cruise ram without J. Human pad closing-speed envelope (20–80 u/s in the 45–135 u band). Afterburner / pause / jump / dock / agent `approachDock` cancel. Live cruise ram now hits at ~20 u/s, not 120. |
| [OPT-003](https://github.com/barryrwilson/Rimward/issues/10) | P3 | Add the AI-05 home-berth safe bubble after a fresh starter-run pacing check. |
| [OPT-004](https://github.com/barryrwilson/Rimward/issues/11) | P3 | Harden CTL-04 `fireHeld` behavior while station/overlay input owns the controls. |
| [OPT-005](https://github.com/barryrwilson/Rimward/issues/12) | P3 | Extend MSN-04 duplicate prevention to non-mining mission families if current generation can still produce meaningful duplicates. |

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
