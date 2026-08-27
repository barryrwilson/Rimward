# RIMWARD remaining work

Inventory date: 2026-08-27, after Wave 142 (`42107bbf`).

This is the compact backlog index. GitHub Project **Rimward** is the operational
queue used by Orca AI. The wishlist remains the product-intent and playtest
source; `PROGRESS.md` remains historical and must be read newest-first.

## Active outcomes

| Key | Priority | Readiness | Outcome | Source |
|---|---:|---|---|---|
| RW-001 | P1 | Needs design + owner unlock | Add a playable outer pad-approach intent with a braking profile. Keep docking as in-zone `KeyJ`; do not teleport or add a third helm unless owner choice 2B explicitly unlocks it. This is the only unfinished outcome in the broader Agent API wishlist row. | [Agent API parent and live-play capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-27-claude-fable-agent-api-live-play); [Agent API design](AgentApiDesign.md) |
| RW-002 | P2 | Ready to design | Expand Settings with mouse sensitivity, invert X/Y, complete conflict-aware key rebinding, and separate music/effects/voice/UI volume. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| RW-003 | P2 | Ready to design | Turn Models into a browsable ship reference grouped by faction/class, with pirate variants, role/scale/lore summaries, and unambiguous loading progress. | [2026-08-25 playtest capture](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-latest-67fb1a0-build) |
| RW-004 | P3 | Ready | Replace the fatal startup wording with recoverable runtime-error UX: plain-language failure, last-save reassurance/time when known, and a reload action. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| RW-005 | P3 | Needs owner decision | Decide and then make the death-loss policy explicit. Current behavior restores the hull at the last berth without charging credits. | [Second 2026-08-25 playtest](PLAYER-EXPERIENCE-WISHLIST.md#playtest-capture--2026-08-25-second-pass-agent-playtest-67fb1a0-build) |
| RW-006 | Maintenance | Ready | Make the demand/hail boot fixture deterministic. The known intermittent pair is `WAVE30 DEMAND HAIL` + `WAVE30 PAYTRIBUTE`; it predates current gameplay work. | [`PROGRESS.md` standing notes](../PROGRESS.md) |

## Optional follow-ups

These are deliberately optional, not incomplete acceptance criteria for work
already marked done.

| Key | Priority | Follow-up |
|---|---:|---|
| OPT-001 | P3 | Capture/update the optional live still set for Hail01, HUD-06, Hail02, HUD-07, NAV-09, TGT-07, and CTL-03. Keep this evidence-only unless a live defect is found. |
| OPT-002 | P3 | Add the NAV-10 docking approach governor after a fresh playtest confirms the cue alone is insufficient. |
| OPT-003 | P3 | Add the AI-05 home-berth safe bubble after a fresh starter-run pacing check. |
| OPT-004 | P3 | Harden CTL-04 `fireHeld` behavior while station/overlay input owns the controls. |
| OPT-005 | P3 | Extend MSN-04 duplicate prevention to non-mining mission families if current generation can still produce meaningful duplicates. |

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
