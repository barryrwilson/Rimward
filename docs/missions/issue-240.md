# Issue 240 implementation mission

Owner authorization: user said "I like it! Get it done!" after reviewed design and proposed +50% rival premium, Red Ledger -5 / Veridian +2 standing, destination-dock sale. These choices and the scoped v3 persistence are approved. Implement through independent review and verification; release requires established reviewed-artifact gates.

Contract: docs/Issue240DossierConflict.md copied unchanged from approved design SHA256 EF3DF8AE43C7D91C43215919D560AA06C20B9A81EFFAB782DA9A4DF90AC5A48C. Prior pending-choice prose in that design is superseded by this explicit approval.
Baseline: b8b2b5f2d7af1ca8135f732663c51a710e8c2a46.
Branch: codex/issue-240-dossier-conflict.
Stage: implementation.
Builder: Rex using Claude Code harness. Independent code/security QA: Quinn using Codex. Live QA: dedicated browser verifier. Root coordinates and runs final full build/boot.
Scope and acceptance: entire bounded implementation contract and matrix in the design; no unrelated docking, factions, job families or equipment changes.
Next action: independent code/security review by Quinn on the immutable commit, then the live browser gate. Root runs the full build/boot.
Evidence: out/issue-240 (ignored local logs). No runtime PASS or deployment claimed.
Rollback: prior code plus coherent pre-upgrade save backup. Old builds cannot restore v3 jobs safely; no global save-version change.

## Implementation evidence (Rex, pending independent and live gates)

Status: implemented and self-reviewed on the branch. NOT independently
reviewed, NOT live-verified, NOT merged.

Source write set (nothing outside it):

- `src/game/state.js` — `DOSSIER_CONFLICT` named scenario tuning: the exact
  `ledger-veridian-dossier-v1` literal, the redmarch/veridian pairing, the
  redledger/veridian factions, the approved +50% buyer premium, the approved
  -5 / +2 betrayal standings, the quoted +2 honour standing and the 8-character
  public reference length. No display names are duplicated: `FACTIONS` and
  `SYSTEMS` remain the single source for "Red Ledger", "Veridian Combine",
  "Ledger Anchorage" and "Veridian Spire".
- `src/game/courier-shadow.js` — the isolated v3 variant: `EVIDENCE_ID`
  (strict canonical UUID v4), `newEvidenceId` (cryptographic source only, no
  insecure fallback), `conflictBuyerPay` (the one bounded C = D + 50%
  arithmetic), `freshConflictState`, `sanitizeShadowConflict` and the v3 branch
  of `sanitizeShadowState`, the late `shadowConflictJobValid` complete pass,
  explicit v3 preservation in `stepShadow`, `setShadowConflict` /
  `voidShadowConflict`, and the shared copy (`shadowConflictTerms` appended to
  `shadowDossierTerms`, `shadowTermLines`, `shadowConflictAdvert`,
  `dossierReference`, `evidenceRef`, and the betrayal / decline / honour
  receipts).
- `src/game/save.js` — the late complete pass in `sanitizeOneJob`, after the
  existing `payQuoted` and `deadline` parsing and the required-deadline checks;
  and `dropDuplicateEvidence`, an unconditional collision sweep in
  `sanitizeJobs` over structurally valid rows, before duplicate job-id
  elimination and independent of `dropJobsUntilCap`. It rejects accepted rows
  exactly like offered or terminal ones.
- `src/systems/station.js` — `makeShadowConflict` and the v3 offer in
  `makeShadowJob`; acceptance validating the complete contract before writing
  any field; `honored` set before the existing settlement effects; `void`
  through the single `replaceShadowJob` terminal funnel; the fail-closed
  malformed-v3 guards in `tickShadowFrame` and `tickShadowJob`;
  `dossierBuyerBlocked`, `dossierBuyerJobs` and the shared `chooseDossierBuyer`
  mutation; the `renderDossierBuyer` Jobs section; and the conflict projection
  in `peekShadow`.
- `src/core/ctx.js` — contract comment only.
- `src/game/agent-schema.js` — missions role help text only. No new action or
  event schema: `stationAction` carries the choice.
- `scripts/issue-240-dossier-conflict-test.mjs` and the `test:dossier-conflict`
  script in `package.json`.

`src/systems/galaxychart.js` was NOT changed: the conflict terms ride on the
shared `shadowDossierTerms` string and the shared ready instruction, which the
Chart already renders.

Focused tests: 22 groups, all passing (`npm run test:dossier-conflict`, exit 0,
`out/issue-240/rex/issue-240-final.log`). Adjacent suites reran green after the
full source slice: issue-236-237 (52), issue-238 (9), issue-239 (32),
issue-203-205-209 and agent-schema.

Self-review: `out/issue-240/rex/SELF-REVIEW.md`. Coordinator spot-check
findings 1-4 are all fixed and pinned by regressions.

Recorded deviations and honest limits, for the independent reviewer:

1. The rival comm line renders "Veridian Combine +2" where the design text
   reads "Veridian +2", because the name is read from `FACTIONS` rather than
   duplicated as tuning. Same for "Red Ledger".
2. Exclusivity is named in the posted TITLE and stated in full in the derived
   terms beside the reward, NOT appended to `detail`: the existing briefing
   already runs close to `JOB_DETAIL_MAX`, so an appended paragraph would be
   truncated on the first save round-trip.
3. The docked panel's notice keeps the existing 240-character view cap, so the
   274-character betrayal receipt is shown truncated there; the `stationAction`
   receipt is the full production text and the two are asserted equal under
   that cap. This is the established behaviour for every notice.
4. The competing-buyer section is drawn FIRST on the destination Jobs board.
   Appended last it fell outside the station view's 120-row cap and stopped
   being observable at all.
5. The pay-bound fallback is proven at `conflictBuyerPay` across its whole
   range plus the live factory agreeing with it; a natural D at the 20000 bound
   is not reachable from ordinary play, so it is not exercised end to end.
6. Not tested here, deliberately: death/recovery, failed autosave, and every
   live browser concern (layout, keyboard and focus order, narrow viewport,
   console and network logs). Those belong to the live verifier.

Implementation candidate handoff (2026-09-18): Rex/Claude source and focused tests complete; runtime frozen for independent QA and browser verification. `npm run test:dossier-conflict` passed all 22 groups, exit 0; evidence `out/issue-240/rex/rex-verified-22.log`. `git diff --check` passed. Self-review record `out/issue-240/rex/SELF-REVIEW.md` records resolved findings and residual bounded API truncation risk; this is not independent QA approval. Exact commit recorded by handoff after commit. Root owns build, unchanged boot, independent code/security review, natural live run plus focused death/recovery and failed-autosave verification. Backlog/wishlist completion status and final evidence may follow as docs-only changes after gates. No merge or deployment claimed. Source/test changes performed only through Claude Code; Rex coordinator inspected diff and independently reran focused suite.

Validation repair (2026-09-18, worktree issue-240-validation-fix): the independent Quinn/Knox verdict `out/issue-240/review/VERDICT-5ca13224.md` returned FAIL on two bounded validation findings. F1 `chooseDossierBuyer` now checks the argument bag with `Reflect.ownKeys`, an exact `{id,evidenceId,choice}` key set and own data descriptors BEFORE any value is read, so a symbol extra key, a non-enumerable extra key or an accessor field refuses with `invalid-args` and never runs a getter. F2 `sanitizeShadowState` now applies the existing `exactOwnKeys` helper to a v3 `deep` before any deep property is read; v1 and v2 keep their previous rules unchanged. Two focused groups were added (24 groups total, exit 0) and the unmodified independent probe now reports `ok:false/changed:false` and `accepted:false` on all six rows. Logs: `out/issue-240/rex-fix/`. This repair awaits independent re-review; no live browser evidence is claimed at the changed SHA.
