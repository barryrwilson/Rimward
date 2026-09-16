# Trader API clarity — issues 203, 205, 209

Selected by the owner on 2026-09-16. Base master:
`b709268b92aea0771b49e2c9ed37137f56ff0fd5`.
Branch: `codex/issues-203-205-209`.
Final application source: `375acde2bc8080d01716efc98e649c4170a2cd5b`.

## Outcomes

- [#203](https://github.com/barryrwilson/Rimward/issues/203): every market row
  quantity control and bulk preset, confirm, and remainder-review action exposes
  its commodity. The existing text-view cap is documented as 120 entries and
  240 characters per text. Complete commodity data remains in `market.rows`.
- [#205](https://github.com/barryrwilson/Rimward/issues/205): accepted
  return-to-origin jobs expose derived `payAt` and `status` fields. The existing
  spy desk copy already names the home reporting dock and is preserved.
- [#209](https://github.com/barryrwilson/Rimward/issues/209): restricted `trade`
  commands return `restricted` and retain the dockmaster explanation. Bulk
  `stationAction` refusals retain their existing `unavailable` token.

Payout rules, economic tuning, abandonment, commands, and persisted data are
unchanged. No merge or deployment is claimed.

## Verification

One Codex builder owned application changes. A separate Codex verifier owned the
browser probe. Claude independently reviewed code and security, including the
exact final application commit, and returned PASS. The first review identified
missing metadata on remainder review and overly broad token documentation;
both were resolved and explicitly re-reviewed.

| Check | Result |
|---|---|
| Focused `scripts/issue-203-205-209-test.mjs` with CSS import stub | PASS, including real partial-fill remainder review |
| Existing bulk-trade, market-pane, market-liquidity regressions | PASS |
| Agent schema, desk, and refusal-token regressions | PASS |
| `npm run build` | PASS, including production bundle policy |
| Unchanged `npm run test:boot` | PASS, including origin-discovery checks |
| Independent Claude code/security delta review | PASS on `375acde2bc8080d01716efc98e649c4170a2cd5b` |
| Final isolated Chromium rerun | PASS on the final source, including remainder review |

The new remainder regression creates a 99-unit partial fill and a 61-unit
remainder using a disclosed save-side-effect fixture. It verifies commodity
identity, no resource mutation when reviewing, and preparation of only the
remaining quantity.

## Live coverage and evidence limits

The initial real Chromium run passed all 44 quantity actions across 11
commodities, restricted-buy resource immutability, and a generated spy contract
through intel collection and one-time 420 UU payment at its home station. Five
screenshots were inspected, with no console errors, exceptions, warnings, or
recorded network failures. Source hashing was stable and processes/ports closed.

The expanded final probe adds remainder review. Intermediate attempts exposed
harness cleanup timeouts and fixture waits that were too short for desk repaint
and station-position updates. Raw failed attempts are preserved; the probe now
waits for the relevant live state. Application source did not change during
these verification repairs.

Browser coverage uses explicit berth, cargo, and credits fixtures with public
game actions. It does not claim natural flight. The pre-existing shared browser
harness uses a disposable profile and loopback-only services, with Chromium's
existing `--no-sandbox` setting; this change introduces no new exposure.

Local raw evidence is intentionally excluded from Git:
`out/issues-203-205-209/build-final.log`, `boot-final.log`,
`claude-review.txt`, `claude-review-final.txt`, and `live/desk-clarity/`.
Reproduce the browser checks with
`node scripts/issue-203-205-209-live-probe.mjs`.

Final browser rerun passed on application commit
`375acde2bc8080d01716efc98e649c4170a2cd5b`, including all quantity controls,
61-unit remainder review, immutable restricted refusal, matching spy-card/API
instructions and exactly one 420 UU return payment. Six screenshots were inspected.
Console errors, exceptions, warnings and recorded network failures were all zero.
Source hash remained `1638ada9b57c41e518e6ebdb1861421178f4cc043e2e000ab132431907663cf2`.
Chrome exited normally, Vite terminated and both ports closed. The raw final
`live/desk-clarity/result.json` records PASS; failed intermediate attempts remain
alongside it for audit. No application findings remain unresolved.
Final reproducible live probe commit:
`686efa45a332e0d0453099da4475cb81e88b81f2`.
