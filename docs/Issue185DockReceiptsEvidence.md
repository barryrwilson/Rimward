# Issue #185 — successful docking receipts

## Mission

- Source: https://github.com/barryrwilson/Rimward/issues/185
- Outcome: a successful auto-dock produces no contradictory out-of-range miss or already-docked refusal.
- Base: `4d0f4af4` (current master at kickoff).
- Branch: `codex/issue-185-dock-receipts`.
- Stage: implementation; Rex owns the bounded fix and regression evidence.
- Next gate: independent Quinn review of the exact implementation commit.

## Acceptance contract

1. A completed approach emits its successful docking receipt without a false `hailMiss` with reason `dock-range`.
2. The helm's completion path does not re-request docking and emit an already-docked refusal.
3. Automated regression coverage exercises completion; legitimate manual and out-of-range refusals remain valid.
4. `npm run build` and the unchanged `npm run test:boot` pass.
5. A live browser approach completes and its receipts and console are checked.

## Scope and exclusions

Confirm the cause in current code before editing. Bound changes to docking/hail completion and relevant tests. No new controls, persisted fields, equipment, docking tolerances, or unrelated market work. Preserve the original checkout's user changes.

## Evidence

Builder: Rex using Codex fallback. Claude Code initially failed with connection
refused in the sandbox; its escalated retry was interrupted. Parent subsequently
restored Claude availability for independent review.

The hail update classified a dock pulse before station consumed it, despite the
measured range being inside `U.DOCK_RANGE`. The dock controller completed correctly,
but `disengage('docked')` reused the explicit request refusal text. The fix gates
the range miss on distance and excludes successful completion from that refusal
mapping; docking tolerance and request validation are unchanged.

- Focused full-system regression: `node --import ./scripts/with-css-stub.mjs scripts/issue-185-dock-receipts-test.mjs` PASS.
- `npm run build`: PASS.
- Unchanged `npm run test:boot`: PASS (`BOOT TEST PASS — no update errors`).
- Rendered Chrome probe: `node scripts/issue-185-dock-receipts-live-probe.mjs` PASS;
  Intel ANGLE renderer, one docked receipt, no false range/refusal receipts,
  explicit already-docked refusal preserved, zero console errors or exceptions.
  Initial 120u pose is a fixture; subsequent flight uses the real controller.
  Raw results and screenshots are local under `out/issue-185-live/dock-receipts/`.
  Source hashes match across the run; browser and Vite ports close afterward.

No persistence migration or dependency change. Revert the candidate commit to
roll back. Independent QA, merge, and deployment are not claimed.
