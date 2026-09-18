# Issue #239 — contacts and equipment earn optional spy roles

**Current stage: implementation complete on a pinned runtime; build and
independent code/security review PASS; boot and live verification pending.**
No merge or push has occurred yet.

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
PASS on the pinned runtime (report path forthcoming).

Still pending: unchanged `npm run test:boot` (session 95359 still running) and
the natural live stock browser campaign, which is ongoing. Neither receipt is
in hand, so neither is claimed. The new tests are synthetic — real pure
integrator and real booted desk, not natural flight.

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

Unchanged boot and the natural browser campaign against the pinned runtime.
Once those receipts land alongside the existing build and independent
code/security PASS, root and Owen execute the authorized merge; issue closure
follows it. No merge has occurred.
