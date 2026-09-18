# Issue #239 — contacts and equipment earn optional spy roles

**Current stage: pinned runtime passes build, unchanged boot, independent
code/security review and controlled browser fixtures; natural earned-career
verification is complete, pending final evidence review.** Draft PR #246
contains pushed commit `b207bbe0`, with all CI checks green at that commit.
No merge has occurred.

- Outcome: contacts and existing equipment change the pilot's information or
  exposure tradeoffs, while a starter-equipment spy mission stays viable.
- Source of truth: https://github.com/barryrwilson/Rimward/issues/239;
  tracking #233.
- Base: `b8c40a520bf1b43e35c5b83be3a2afbbb47e5b69` (merged #238 via PR #245).
- Branch/worktree: `codex/issue-239-spy-benefits`; `C:/Projects/WebSim-issue-239`.
- Pinned runtime: `c510a7e03e79b862c070c8d61889c895aab8b0e8`, runtime source
  SHA-256 `55a96070fa8cd832f0135acbd31e3135ddea4a52d88c7baa89e3cf59c702f911`.
- Approved design: `out/spy-design-scope/findings.md`, SHA256
  `49c70c83a8f49f6187b9cb171bb12f7e1a081e8928551cfd1553748a8002f445`, with an
  independent design PASS for readiness to owner choice.
- Non-goals: #234 docking repair, #240 employer/competitor evidence conflict,
  the concealed-mounts spy role, new SKUs, kit mutation, a global contact
  economy or a universal stealth stat.

## Authorization

The design artifact above closed with a genuine owner choice between a
contact-only slice and the recommended contact-plus-scanner slice, and claimed
no implementation approval. **That pending-owner language is superseded.** Root
reports that the user selected the recommended combined contact + scanner
4 / 3.5 / 3 set and, after asking about Merge, said "Get it done!".

That authorizes implementation of the combined slice as specified **and**
merge once the required gates pass. Root and Owen execute that merge after
independent QA, build, unchanged boot and live verification are all complete.
No merge has been performed. The selected 4 / 3.5 / 3 rates are approved;
the authorization is not itself a QA PASS or proof of broader game balance,
and it pre-approves no scope beyond the agreed contract.

## Owners

| Role | Owner |
|---|---|
| Orchestration and runtime gates (build, boot, browser campaign) | Root, with Owen |
| Implementation | Rex, Claude Code harness |
| Independent QA | Codex |
| Natural live play | spy_playtest |

## Implemented scope

The durable contract, evidence and limits live in
[Issue239SpyBenefits.md](../Issue239SpyBenefits.md). In short: a free
flight-plan briefing on existing People cards at the employer or destination
dock for an accepted unexpired shadow assignment, adding only the static
1500-unit turnaround, the out-and-back shuttle and the endpoint pivot plus the
match-straight / ease-turn tactic; and frozen dossier suspicion rates of 4 /
3.5 / 3 by mounted scanner tier inside the 150–400 unit band, with 10/s
crowding and all basic observation unchanged at every tier.

Write set: `src/game/state.js`, `src/game/courier-shadow.js`,
`src/systems/station.js`, `scripts/issue-239-spy-benefits-test.mjs`, one new
`test:spy-benefits` command in `package.json`, and these docs. No lockfile, no
save format, no ctx event, no API schema and no agent-layer edits.

## Verification status

Passing and recorded (`out/issue-239/focused-*.log`), all re-run after the
final scoped notice fix: `test:spy-benefits` (16 groups / 32 checks),
`test:courier-shadow` (52), `test:deep-dossier` (9), `test:agent-desk` and
`test:refusal-tokens`, each exit 0. Earlier in the implementation
`test:agent-schema`, `test:agent-hardening`, `test:agent-gameplay`,
`test:agent-playtest-fixes`, `test:fence-marker` and the #207 abandonment suite
also passed; the only runtime change after those runs was that notice fix.

Verified and root-owned: `npm run build` PASS in 10.26 s against `c510a7e0`
(`out/issue-239/build-c510a7e.log`), and independent Codex code/security review
PASS on the pinned runtime (`out/issue-239/review/CODEX-VERDICT.md`). The full
unchanged `npm run test:boot` passed (`out/issue-239/boot-c510a7e.log`). Interim
docs at `b207bbe0` passed review (`out/issue-239/review/CODEX-DOCS-VERDICT.md`).
Controlled browser fixtures passed, including native/UI/API copy and refusal
checks, with no console errors (`out/issue-239/ui-fixture/REPORT.md`). These
seeded checks are separate from natural progression.

One natural earned career paid stock basic plus introductory reports' 840 UU once (350 → 1190),
verified reload, then bought Mk I for 400 UU (1190 → 790). Ordinary traffic
damage made the next courier unavailable; abandoning that job and delivering
the independent introduction paid 420 UU (790 → 1210). A fresh Mk I assignment reached
14.129 dossier progress at 3.5 suspicion/s with reload preserving progress and
grace. Later exposure during slow tracking retained the basic payout of 420 UU
(1210 → 1630); no natural Mk I dossier completion is claimed.

The same profile bought Mk II for 900 UU (1630 → 730), completed a natural
30/30 dossier and received 630 UU once (730 → 1360) at simulation time 1206.64.
Repeated ticks and reload retained 1360 UU and no active job. The pilot used
the contact's static route facts to choose a midpoint tactic and cooled in
bursts; the exact clean uninterrupted completion claim is deterministic-only.
The original unavailable-target campaign wrapper failure is retained alongside
the successful same-profile recovery, not relabeled as a passing attempt.
Recovery 4 reached deep-ready but timed out withdrawing; recovery 5 settled
that same state. The consolidated `out/issue-239/live/REPORT.md`, `SUMMARY.json`
and `CLEANUP.json` record the unchanged source hash, empty browser error/network
logs, final ledger and closed owned processes/profile. These outcomes support
the bounded acceptance contract; independent final evidence review is pending.

## Implementation history worth keeping

Three builder review rounds tightened the artifact before the runtime was
pinned. The briefing certificate gained a finite-future-deadline, valid
origin/destination, named target/record and strict `sanitizeShadowState` check.
The pre-purchase copy was rescoped so it states the new dossier benefit without
denying the eye's established capabilities, and split so every outfitting note
row stays inside the station view's 240-character cap.

The substantive find was a banked-favor write on the refusal path: the refusal
originally called `render()`, and a People rebuild re-resolves the roster
through `contactsForSystem`, which repairs a replacement row's favors. Against
a same-ID replacement contact that reproduced as `0 → 2`. Root and Rex rejected
relaxing the test to a comparison baseline and required a narrow source fix; a
refusal now updates only the existing `.station-notice` footer node in place
via `textContent`, with no rebuild and no contact-helper change. An earlier
test-ordering defect — snapshotting the ledger before the fixture mutation and
restoring before comparing — was also corrected, since it masked exactly this
class of write.

## Rollback

Plain commit revert. No persisted field, version or save format changed, so no
save migration is needed for downgrade. Deployment backup policy is separate
and not waived here.

## Next gate

Review the final evidence update. Root and Owen then execute the authorized
merge; issue closure follows it. No merge has occurred.
