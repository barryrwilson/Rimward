# Issue 240 implementation and verification

Implemented and acceptance verified on `codex/issue-240-dossier-conflict`.
Runtime: `c0a20d329f2ac759b1d6bb775d5b49f00fb8741a`; baseline
`b8b2b5f2d7af1ca8135f732663c51a710e8c2a46`. The owner approved the reviewed
[design](Issue240DossierConflict.md), including the +50% rival premium and
Red Ledger -5 / Veridian Combine +2, with “I like it! Get it done!”.
PR #247 carries the implementation; merge and deployment remain separate.

## Player outcome

A fresh exclusive Red Ledger shadow assignment from Ledger Anchorage to
Veridian Spire discloses both buyers, prices, consequences and automatic
original filing before acceptance. Once the complete dossier is earned, the
pilot can return to honor the original agreement, decline the rival without
cost, or explicitly sell to Veridian for the higher total. One assignment owns
one evidence identity and can settle once. Unrelated contracts are preserved.
Old v1/v2 contracts retain their terms. Only the authored pairing creates v3.
Native buttons and stationAction use the same guarded choice and receipt.
No new action/event schema, job family, equipment or general faction war was
introduced.

## Independent review and automated checks

Claude Code implemented the change; Codex independently reviewed the exact
artifact. Initial review of `5ca13224` found two strict own-data validation
gaps in buyer arguments and v3 deep state. Repair `c0a20d32` closed both.
The unchanged six-case independent adversarial probe now rejects every case
without ledger/offer mutation. Independent code/security verdict: PASS, no
unresolved findings within the bounded scope.

- `npm run test:dossier-conflict`: 24 groups PASS.
- Independent courier-shadow: 52 checks PASS; deep-dossier: 9 groups PASS.
- The initial full source review also reran spy-benefits, abandonment,
  #203/#205/#209 and agent-schema suites successfully; the repair changes only
  the two validators and their regression tests.
- Final `npm run build`: PASS in 7.40 seconds.
- Full unchanged `npm run test:boot`: PASS, exit 0. The command was compared
  with the baseline rather than reduced for this task.
- GitHub build, boot and OPT-001 surface checks passed on the runtime commit.

Local raw evidence lives under ignored `out/issue-240/`: `build-c0a20d32.log`,
`boot-c0a20d32.log`, `rex-fix/rex-final-focused.log`, and
`review/VERDICT-c0a20d32.md` plus independent test/probe logs. These local files
are not shipped as public artifacts; this document preserves the bounded
results and identities for reviewers.

## Natural browser evidence

The natural career used the ordinary Rim Drifter origin and starting 600 UU,
purchased Mk I for 400 UU, and used public Agent API flight and native choices
with real traffic and time. No teleports, equipment grants, evidence edits,
save imports or clock acceleration were used.

An earlier controller used observation windows that included travel time; its
interruption also closed the browser. Same-profile recovery restored coherent
finances and evidence. The recovery controller initially failed to reselect
the courier, causing legitimate exposure and preserving basic evidence.
Those failed/incomplete attempts remain recorded separately, not relabeled as
successful natural runs.

On the repaired runtime, the pilot filed that surviving basic report once for
420 UU (200 → 620), then accepted a new exclusive assignment with a fresh
evidence token. Normal Mk I observation and cooling completed 30/30 dossier
seconds at simulation time 695.72. At Veridian, inspection did not sell the
report. An explicit native button click at t748.57 paid 945 UU once:
620 → 1565. Red Ledger moved 2 → -3; Veridian moved 0 → 2; other factions
remained unchanged. A stale stationAction was refused. Ordinary buyer reload,
natural return to Ledger at t814.61, and final reload retained 1565 UU with no
sold assignment and no second payment.

The whole earned ledger is `600 - 400 + 420 + 945 = 1565`. The new token differed
from the old one despite reused job/name identity. Source and bundle identity
remained stable. Browser console errors, warnings, exceptions and network
failures were empty. Natural success evidence is `live/recovery-3/`; earlier
attempts and `live/INTERRUPTION.md` retain their separate limits.

## Controlled browser evidence and layout

Separately labeled fixtures exercised honor, decline and betrayal; basic and
partial evidence with no buyer; stale captured callbacks after row replacement;
native/API receipts; exact faction/contact effects and unrelated jobs; reload
and death/recovery; and failed autosave with coherent prior-snapshot rewind.
The matrix passed on the final runtime. Injected storage-write failure is an
intentional fixture, not a claim that unsaved choices survive a crash.

Desktop and 768-pixel screenshots show wrapped, usable buyer controls with
visible focus. Full terms are split into bounded rows; the competing buyer is
first so its controls remain inside stationView's existing 120-row cap.
The existing Agent play overlay can overlap upper terms at narrow width;
the sell/decline controls and repeated immediate consequences remain usable.
This task does not claim a general overlay-layout repair. The stationView
notice retains its existing 240-character summary cap; the action receipt and
native notice retain full text.

Controlled artifacts are under `live/controlled-attempt-1/`; the consolidated
`live/REPORT.md`, `live/SUMMARY.json` and `live/CLEANUP.json` own detailed local
verification and cleanup evidence.

## Exact runtime and operational limits

Source SHA256:
`3226e763c8816250c4f6e419a76ac40d6b68032909ec2123df10a7e9a9149b6c`.
Production JavaScript `index-VJjQcscL.js` SHA256:
`1f71a1cb797e0767e49d6bb26e3ec5dc8c84e00957a2c7765ff8bc7e7eda2fc1`.

The owned browser/server processes stopped and ports 5194/9394 closed.
Automatic approval review blocked deletion of one temporary natural-browser
profile with the stated reason “blocked by policy”; it was retained, not
bypassed. The controlled profile was removed. No user save/profile was changed.

Secure-context UUID support is required for new conflicts; unsupported hosting
retains ordinary nonexclusive offers. Old builds cannot restore v3 contracts;
rollback needs prior code and a coherent pre-upgrade save. The approved prices
and standing deltas are initial tuning, not career-wide balance proof. Broader
faction conflicts and #234 docking reliability remain outside this change.
