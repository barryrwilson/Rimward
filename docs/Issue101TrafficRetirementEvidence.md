# Issue #101 — Release traffic slots after station refuge

[Issue #101](https://github.com/barryrwilson/Rimward/issues/101).

## Mission

Status: implemented, locally verified and independently QA-approved;
awaiting PR review and merge.
Implementation: Rex/Codex; coordination and live execution: Clawd.
Base: `c32df0b9e2ec6a9aab1fae785763713d9814b393` (current master at kickoff).
Branch: `codex/issue-101-traffic-retirement`.
Source/test artifact: `800917d43a18ff6fa6d1b87b91f2e25d5079b315`.

The owner requested the next issue on 2026-09-10. Issues #98–#100 are merged;
#101 is the next selected outcome. The reported station encounter filled all
ten live slots with completed yields and a patrol, preventing an eligible
loaded trader from appearing while the player remained nearby.

Baseline code confirmed that traffic returned before selecting a spawn candidate
at ten live ships, while ordinary range culling cannot remove station holders
inside the player's instantiation bubble.

## Acceptance contract

1. An unselected surrendered hull that completes station refuge releases its
   live slot
   when eligible new traffic needs capacity, even while the player remains
   near the station. Finished encounters cannot hold contested slots forever.
2. At the hard ten-hull cap, completed station encounters cannot indefinitely
   prevent an otherwise eligible enroute cargo trader from instantiating.
3. Retirement cannot immediately reinstantiate the same finished encounter
   into a contested slot,
   reset its surrender or condition, or duplicate cargo or rewards.
   It also cannot permanently suppress the finite population of a system.
4. Active escape routes and gate charges retain their existing behavior;
   selected runners retain the existing pursuit protection. Disabled salvage,
   active combatants and ordinary traffic are not retired as completed yields.
   Named aces and quarry named by offered or accepted jobs remain available.
5. The hard live cap and pirate mix stay bounded. Existing save/restore and
   system transitions preserve the resulting encounter state using existing
   JSON-safe fields.
6. Focused lifecycle/cap regressions, `npm run build`, unchanged
   `npm run test:boot`, and relevant escape/surrender regressions pass.
7. A live browser exercises the contested-cap flow, records trader arrival
   and completed-hull removal, and checks console errors. Any fixture staging
   and environmental workaround are explicitly disclosed.

No changes to issue #102 solar observations, #103 raw throttle semantics or
#105 station launch policy. No increased cap, new persistent field, public API,
event vocabulary, equipment, key or gauge is authorized by this implementation.

## Handoffs and evidence

- Kickoff: clean isolated branch created from the merged master revision above.
- Build handoff: Rex owns runtime source, focused tests and live probe.
- Independent QA: Quinn/Claude Code returned PASS on the exact source/test
  artifact above, independently of the Codex implementation harness.
- Next gate: final documentation review and PR handoff.
- No merge, release or deployment is claimed.

## Implementation decision

The completed-encounter predicate uses the existing station shelter dwell
(20–36 seconds), rather than adding another clock. A completed plan
(`phase: done`, `reason: sheltered`) with a surrendered, non-disabled hull
identifies a finished encounter. Its record, cargo and condition remain intact.
Named aces, selected ships and current job quarry are excluded from retirement.

At a full bubble, a safe completed encounter gives up one slot only after an
unfinished replacement passes the existing candidate and asset-readiness
checks. Finished records can return at lower priority when spare capacity is
available; they are not permanently removed from the system's population.
This keeps one spawn per frame and the hard ten-hull cap.

For surrendered hulls, an idle unselected player's proximity alone is no longer
pressure that continually renews the station wait. Recent damage, NPC hunters
and a selected pursuer keep their existing protection. Retirement grants no
rewards or repair and adds no event or persistent state.

The initial proposal permanently excluded completed records from materializing.
Independent acceptance preflight rejected that policy: non-trader record banks
do not refill, so permanent suppression could empty a system. It also found
that pirate bounty jobs bind by target name and system rather than `recordId`.
The committed implementation uses capacity replacement and a name/system-aware
job guard. Preflight is recorded in
`out/issue-101-evidence/qa-preflight-retry.txt`;
it is not a final verdict. The initial review attempt failed to connect inside
the sandbox and the network-enabled retry completed.

## Local automated verification

All commands below passed on the committed source/test tree. Raw logs are in
`out/issue-101-evidence/` and remain untracked.

| Check | Evidence |
|---|---|
| `npm run test:traffic-retirement` | `focused-final.log`: seven scenario groups, including real station dwell, ten-hull capacity, one spawn per frame, 180 seconds without full-cap replay, three real snapshot/restores, natural return into spare capacity and a subsequent new trader admission. |
| `npm run test:gate-escape` | `gate-escape-revised.log`: PASS. |
| `npm run test:surrender-cargo` | `surrender-cargo-revised.log`: PASS. |
| `npm run test:surrender-attribution` | `surrender-attribution-revised.log`: PASS. |
| `npm run build` | `build-revised.log`: PASS, including current bundle policy. No budget change or exception added. |
| `npm run test:boot` | `boot-revised.log`: `BOOT TEST PASS — no update errors`; the boot test was not edited. |

The focused suite also verifies nonempty cargo and unchanged condition/rewards,
selected active and completed hulls, disabled salvage, recent hits, NPC hunters,
active combat, aces, offered/accepted bounty-name/system and record-bound jobs,
pending assets and blocked clearance. The jump pin exercises the actual removal
boundary and `systemLoaded` flag healing; it is not a flown gate crossing.

## Live browser verification

`npm run test:traffic-retirement-live`: **PASS, 3/3 pins, zero console errors
and zero uncaught exceptions**, on 2026-09-11 UTC (September 10 local).
Headless Chrome with platform ANGLE/Intel GPU, isolated profile and loopback
Vite/CDP ports. The run tears down only its own processes and validates the
profile path before deleting it.

| Pin | Result |
|---|---|
| Full cap | Ten live ships, nine surrendered station runners, loaded Patient Sorrow not yet live. |
| Retirement and admission | After 22.4475 seconds of real game time, one finished hull folded and Patient Sorrow appeared. Eight surrendered holders plus the ordinary patrol and new trader remained: ten total. Player position, three units of raw ore aboard each surrendered record, hull condition, credits and fear were unchanged. |
| No replay | The same retired hull stayed abstract for ten further seconds while the full bubble remained bounded at ten. |

Ledger and screenshots: `out/issue-101-evidence/live/result.json`,
`console.txt`, `run.log`, `01-full-station-bubble.png`,
`02-trader-admitted.png`. Root execution log:
`out/issue-101-evidence/live-command-final.log`.

Disclosed limits:

- This is a rare-condition fixture, not an organic surrender campaign. It
  starts through the public new-game/origin API, then stages nine previously
  surrendered runners at their chosen station approach endpoints with cargo
  and damage history, an ordinary patrol and an eligible trader. It places
  the player near the station with zero throttle/full stop. Actual frame
  updates recognize arrival, run the dwell and perform replacement; no
  completion, retirement, trader spawn or reward outcome is written by the
  harness. The population/cargo ledger reads internal state.
- Vite uses the same harness-only `watch: null` and `noDiscovery` workaround
  as prior issue probes. Production configuration is unchanged.
- The initial browser attempt failed at temporary-profile creation under the
  filesystem sandbox. That failure remains in `live-command.log`; the final
  run used approved access. Earlier preflight-stage automated logs are kept
  separately from the final/revised logs above.
- Build and issue acceptance pass; no new startup/performance, full-release,
  merge or deployment certification is claimed.

## Independent QA

**PASS** on `800917d43a18ff6fa6d1b87b91f2e25d5079b315`, using Claude Code
(`claude-opus-5`) independently of the Codex builder. Quinn verified artifact
identity and unchanged source/test tree, and independently ran all six commands
in the automated verification table: focused suite, build, boot, escape,
surrender cargo and surrender attribution. All passed. It also reviewed the
live ledger and the probe's isolation/cleanup; it did not rerun the browser.

The review confirmed current job-target reachability, protected encounter
guards, capacity and one-spawn-per-frame behavior, preserved record snapshots,
and that pending/blocked replacements cannot evict an existing hull. No new
security boundary or blocking regression was found. Raw reviewer stdout is
preserved in `out/issue-101-evidence/qa-final-stream.jsonl`; its final verdict
is extracted in `qa-final-verdict.md`. Separate reviewer log writes were denied
by its read-only permissions, so the captured stdout is the independent
execution record.

Non-blocking notes retained without expanding scope:

- The candidate loop can repeat job checks before cheaper range/system filters;
  reordering that work is an optional optimization for the existing small casts.
- The live assertion has an upper dwell bound only; the saved trace separately
  demonstrates the actual 22.4-second dwell.
- A finished hull returning into spare capacity can fold again if an unfinished
  ship becomes eligible immediately afterward. That bounded visual turnover
  preserves traffic priority and the finite population.
