# Collected spy intel status — issue 235

Worked on 2026-09-16 in the isolated worktree `C:/Projects/WebSim-issue-235`.
Branch: `codex/issue-235-spy-status`. Base:
`a923f9df5858e4b2752bf1f668c744caede8d5b1`. Follow-up to closed
[#205](Issues203205209TraderClarity.md); tracking issue #233.

## Outcome

After an agent collects the intel, `observe().jobs.active[]` for that espionage
contract reports `Intel acquired—return to <station> to file.` The station named
is the row's own `payAt`, which is also the station the Jobs desk card already
names in its `intel aboard — file at <station>` line. Before collection the row
keeps the #205 briefing line and every existing field, including `destSystem`.

## Implementation

`initStation.peekJobReturn` in `src/systems/station.js` gained one branch. It
reads the same `job.progress` the desk card reads, for `kind === 'espionage'`
only, and returns the filing wording instead of the generic briefing. Everything
else in that function is unchanged: the accepted-only gate, the per-family origin
selection, the chain step 1/3 employer origin, the `SYSTEMS` validation and the
station-name derivation.

Deliberately unchanged, per the issue:

- no new saved contract field — `progress` is already persisted and already read;
- no new API command, event, receipt token or observation key;
- no reward, deadline, standing or settlement change;
- mining, explore, recovery and chain rows keep the briefing line at every
  progress value;
- destination-payment jobs, kill rewards, offered jobs and invalid origins still
  expose no `payAt`/`status` at all.

## Verification

| Check | Result |
|---|---|
| `node --import ./scripts/with-css-stub.mjs scripts/issue-203-205-209-test.mjs` | PASS (4 named regressions plus the chain check) |
| Same test with the new branch disabled | FAILS on the collected-status assertion, so the coverage is not vacuous |
| Live Chromium probe `scripts/issue-203-205-209-live-probe.mjs` | PASS, verdict `PASS` in `out/issue-235/live/desk-clarity/result.json` |
| Live console errors / exceptions / warnings / network failures | 0 / 0 / 0 / 0 |
| `npm run build`, `npm run test:boot` | Not run here by instruction; the coordinator runs the full build and boot suites |

The focused test was extended rather than duplicated:

- the accepted spy contract is observed at `progress` 0 and 1, asserting the
  exact briefing and filing strings, `payAt`, `progress`, `need`, `destSystem`,
  `originSystem`, and that the rendered desk card says `gather at` and then
  `intel aboard` for the same two states;
- the filing wording survives undocking into flight;
- **abandoned**: a collected contract abandoned through the public `abandonJob`
  command pays nothing, leaves `jobs.active`, and yields `peekJobReturn === null`;
- **delivered**: a second accepted contract settles at its origin for exactly its
  `payQuoted` (420 UU), is noted `delivered`, and five further job sweeps add no
  further credits;
- **lapsed**: a third accepted contract with an expired deadline closes with no
  payment and is noted `lapsed`;
- **two employers**: fixture rows at `veridian` prove the collected wording names
  Veridian's station and never Freehold's, alongside the real Freehold contract;
- **other families**: collected (`progress: 1`) mining, explore and recovery
  fixtures keep the generic briefing line.

Live evidence in `out/issue-235/live/desk-clarity/` (untracked) covers one
generated espionage contract accepted at Freehold Landing, collected at the rival
dock and filed at home: `spy-accepted.png`,
`spy-intel-return-instruction.png`, `spy-paid-at-origin.png`, plus the market and
refusal checkpoints the shared probe already covered, and `result.json` with the
full observations. `result.json` records `spy.wording`, the before/after rows and
`spy.settlement = { reward: 420, paidOnce: true }`.

Reproduce with:

```
ISSUE74_OUT=out/issue-235/live ISSUE74_PORT=5235 node scripts/issue-203-205-209-live-probe.mjs
```

The probe now honours a pre-set `ISSUE74_OUT` instead of overwriting it; its
default output path is unchanged. Vite was pinned to loopback `127.0.0.1:5235`.
Chromium's DevTools port is assigned by the shared harness
(`scripts/issue-74-live-harness.mjs`, loopback-only, ephemeral — 54255 on this
run); pinning it would require editing that shared harness, which is outside this
issue's write set.

Browser coverage uses the existing explicit berth, credits and cargo fixtures
with public game actions. It does not claim natural flight.

## Review

Both implementation-stage reviews were self-applied to the diff from the
orchestrator checklists (`references/security-review.md`, then
`references/code-review.md`); no subagent was used, by instruction.

Security review — risk level Low, quick scan. The change adds no endpoint,
command, credential, storage, network or DOM sink; it builds one display string
from a static `SYSTEMS` entry already validated by `Object.hasOwn`, and returns
it through the existing loopback-only agent observation. No HIGH or CRITICAL
finding.

- LOW, accepted: the status embeds the authored station name without the
  control-character strip and length cap that `spyStationName` applies.
  `SYSTEMS` is a static module constant rather than save data, and the existing
  #205 line in the same function already reads the name the same way. Tightening
  it would change the pre-collection wording path, which this issue must
  preserve.

Code review — no HIGH or CRITICAL finding. One MEDIUM question was raised and
closed by inspection: the new gate is
`Number.isFinite(job.progress) && job.progress >= 1`, while the desk card at
`src/systems/station.js:6544` tests `job.progress >= 1` alone, so a non-numeric
`progress` could in principle disagree with the board. `src/game/save.js:493`
rejects any job whose `progress` is not a finite non-negative number, so no
loaded or live state reaches that divergence; the stricter guard was kept. The
only consumer of `peekJobReturn` is `src/game/agent-observe.js:480`, so no
player-visible desk text moves. Two MINOR notes were accepted as intentional:
the wording strings are repeated in the source, focused test and live probe,
because the exact string is the contract under test, and a weak
`Object.hasOwn(row, 'reward')` assertion was replaced with `row.reward > 0`.

The reviews were re-run after that one fix. The fix is test-only, the focused
test still passes, and it introduced no new finding.

Independent Codex QA is still pending. No self-approval, merge or release is
claimed.
