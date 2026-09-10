# Issue 99 — Surrender Attribution

- Date: 2026-09-10
- Issue: https://github.com/barryrwilson/Rimward/issues/99
- Branch: `codex/issue-99-surrender-attribution`, stacked on PR #107
- Immutable runtime/focused implementation commit: `78a3a2b3090e1a75469f138d4098847a3b644362`
- Status: implemented and locally verified. Core QA PASS; final PR review and
  merge remain. No merge, no release, no deployment.

## Behavior

The last *effective* damaging attacker determines the explicit player/world
`npcSurrendered` receipt. Projectile and psionic hits that cause no damage do
not change ownership; effective hits still do. NPC, unknown, or dead attacker breaks never open player payout
hails and never credit fear, seed, milestone, ace, or patrol rewards; the world
still records the incident causer as `world`. Actual NPC capitulation remains
yielded, with no fresh fight and no second payout. Genuine player bargaining and
ransom flows continue unchanged.

Admission and deferred revalidation, plus the whole-original-card click, key, and
API boundaries, fail stale when the player's claim on that specific surrender no
longer holds — that is, when player attribution has lapsed to another causer, or
when the original surrender target has become disabled or already yielded. It is
not a matter of "effects being absent". A disabled original surrender
refuses immediate resolution, but the next steady update creates a legitimate
salvage card with a new identity; demand, salvage, and conversation are
preserved.

No new persisted fields or schema, no UI keys/equipment changes, and no #98 cargo
demand feature.

## Evidence

Independent **core QA PASS** — Quinn, `out/issue-99/quinn-core-verdict.md`,
against the immutable runtime/focused commit above. 61 focused assertions and 20
adversarial assertions PASS. Hail identity, docked hails, capitulation feedback,
first scare, reactive defense, agent hardening, and gate escape passed.

Root final validation at the exact core commit:

- Production build **PASS** — `out/issue-99/root-build-final.log`, exact chunk
  `assets/index-DSOfx5AM.js` (raw byte counts are not restated here).
- Full boot **PASS** — `out/issue-99/root-boot-core.log`.

The final docs/test delta on top of the core commit still goes to independent
review; this document records core QA plus root final validation, not merge
approval.

Commands:

- `npm run test:surrender-attribution`
- `node --import ./scripts/with-css-stub.mjs scripts/issue-99-surrender-attribution-test.mjs` (works at the core commit, before the npm alias final delta)
- `npm run test:boot`
- `npm run build`
- `npm run test:surrender-attribution-live`
- `npm run test:docked-hails-live`

## Live harness

Accepted evidence: **PASS 5/5** (N1, N2, P1, S1, C1) with zero console errors and
zero uncaught exceptions at `out/issue-99/live-final/result.json`, with
screenshots and `run.log`. Root ran the pass and visually inspected the
screenshots. The existing #100 live probe also passes **7/7 with a clean
console** at `out/issue-99/docked-live/probes.json`, with screenshots and
`run.log`; its acceptance tests are unchanged (its fixture now takes legitimate
initial player damage, hull −1, attacker `player`).

Disclosed privileged fixture access: initial low defenses, a stated last-
effective-attacker combat history, the S1 attacker flip and C1's staged
`state.disabled`. Outcomes are produced by the live NPC loop, the live hail card
handlers and the live world ledger — no synthetic surrender or hail event and no
expected-outcome writes. S1 exercises a programmatic DOM click on the retained
button (`button.click()`, not physical human input); P1 and C1 exercise the
public API resolution path; N2 dispatches a real `KeyH` key event. Vite is
harness-only with `server: { watch: null }` and `optimizeDeps.noDiscovery`.

This is controlled fixture browser coverage, not a natural campaign playtest.

An earlier run recorded a P1 failure at `out/issue-99/live/result.json`. It was a
harness timing diagnostic, not a runtime defect: the probe sampled `surrendered`
before the next-frame world incident had been consumed. The final harness waits
for the matching incident row, and `out/issue-99/live-final/result.json` is the
accepted result.

## Compatibility and rollback

The public API version and the persistent save schema are unchanged. The internal
existing `npcSurrendered` payload gains a bounded player/world causer. Missing
attribution fails closed. Rollback is a revert of the core commit plus the
validation delta through the reviewed process.

Status: implemented and locally verified; core QA PASS; final PR review and merge
remain. This document is not merge or deployment approval.
