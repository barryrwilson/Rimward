# Repository consolidation — 2026-09-10

**Final release validation: PASS** on `f0b4c62c3a7bef7296e1603c46dd90acea893532`.
Consolidation preserves local work, completes bounded cleanup and repairs
verification drift. Earlier failed attempts remain recorded, including an
intermittent docking collision whose cause is unresolved. No release was
published and no production runtime behavior changed.

Baseline application: `0dd7908e3929725d646958d43f63de57b68dc7c8`.
[Consolidation PR #97](https://github.com/barryrwilson/Rimward/pull/97) carries
the documentation and test repairs. Production runtime source remains unchanged
from that baseline. All results below retain their individual artifact scope.

## Repository state

| Area | Recorded state |
|---|---|
| Local preservation | Sixteen original modified/untracked files copied and hash-verified; original tracked patch and reference/worktree inventories retained. Local evidence is under `out/consolidation-2026-09-10/`; private file contents are not published. |
| Recovery points | Named stash `preserve pre-consolidation local notes 2026-09-10` (`abf1784f9a6b8429ef404c760e85f2fb0483d933`) and verified `repository-before.bundle` and `repository-with-reflogs.bundle` retained locally. |
| Main working folder | Moved from the detached historical checkout to current master on clean branch `codex/current-workspace-2026-09-10` at the baseline SHA above. PR #97 records the merge handoff and any subsequent fast-forward; neither is preclaimed here. Original notes remain preserved. |
| Backlog | Merged outcomes reconciled in [the index](REMAINING-WORK.md), with immutable links preserving historical evidence. Unfiled product decisions and optional work remain visible. |
| Cleanup | Completed: eight worktrees and 21 branches removed; 35 worktrees and 32 branches remain. The exact hash-bound 8/21 plan received independent Claude PASS before execution. Dirty, unique, junction, external and protected states remain retained in the inventory. |
| Cleanup preservation and integrity | Preserved 4,289 evidence files (734,273,815 bytes) and 61 Git administration files (3,911,778 bytes), independently rehashed after deletion. `git fsck --connectivity-only --no-dangling` passed. |

## Release verification

[Baseline run 34498199689](https://github.com/barryrwilson/Rimward/actions/runs/34498199689)
completed on the exact baseline SHA with a raw **FAIL** verdict. The downloaded
verdict and logs are authoritative; workflow step summaries can conceal failed
outcomes under `continue-on-error`.

| Gate/evidence | Baseline result and disposition |
|---|---|
| Build and package | PASS. Package version/source identity and archive byte count/checksum integrity passed. This creates a candidate artifact, not a published release. |
| Focused regressions | All 12 commands passed, but verdict expected 11 and omitted `hailIdentity`, so evidence validation failed. |
| Models live | All 12 flows passed, including V11; verdict expected 11 and omitted V11, so evidence validation failed. |
| Optional live surfaces | 7/7 passed. Models and optional runs recorded zero console errors/exceptions; Models profile cleanup passed. |
| Dependency audits | Full and production trees each reported zero vulnerabilities. |
| Boot harness | FAIL: recovery job accepted, but its pod was not scooped and the job did not complete. The bounded test-helper repair and subsequent validation are recorded below; the original failure remains retained. |
| Agent bridge smoke | FAIL: ordinary fresh Greenhand `approachDock` ended with `bodyHit` / `impact`. Console evidence was clean and teardown released ports; those passes do not clear the gameplay failure. |

Verification repairs in
[`60a6b5f4e75f6dfd70c20fe936ba470d4fcf99c6`](https://github.com/barryrwilson/Rimward/commit/60a6b5f4e75f6dfd70c20fe936ba470d4fcf99c6)
and
[`54419392fb1607c4dd0fca8909975eb6a95594a1`](https://github.com/barryrwilson/Rimward/commit/54419392fb1607c4dd0fca8909975eb6a95594a1)
restore exact producer/verdict agreement: 14 focused checks, including combat
and reactive defense, and 12 Models flows. Combat fixtures now provide valid
sun geometry while retaining their intended heading. Local combat 33/33 and
defense 19/19 groups passed; 27 verdict scenarios passed, including missing,
duplicate, failed and wrong-artifact rejection. These are test/evidence repairs,
not changes to ship behavior. The historical failures remain recorded.

The recovery-test helper was repaired in
[`f0b4c62c3a7bef7296e1603c46dd90acea893532`](https://github.com/barryrwilson/Rimward/commit/f0b4c62c3a7bef7296e1603c46dd90acea893532).
Scoped checks passed under Node 22.23.2 and 24.14.1; the full uninstrumented
boot harness passed under Node 22. Independent Claude source/contract review
passed on `60a6b5f4` and on the final delta through `f0b4c62c`.
Required GitHub Build and Boot passed in
[CI run 34500776243](https://github.com/barryrwilson/Rimward/actions/runs/34500776243).
The complete release workflow subsequently passed on that exact artifact.

The verification history retains each attempt:

| Run | Artifact and raw outcome |
|---|---|
| [34498199689](https://github.com/barryrwilson/Rimward/actions/runs/34498199689) | Baseline `0dd7908e`: FAIL for boot recovery, live dock collision and the two verdict-contract mismatches described above. |
| [34499466594](https://github.com/barryrwilson/Rimward/actions/runs/34499466594) | Intermediate `60a6b5f4`: FAIL. Boot recovery remained; bridge `combatPath` had no eligible public target (`attempted:false`); Models capture hit a `captureScreenshot` timeout and omitted four flows. Docking passed in this attempt, which does not erase or explain the baseline collision. |
| [34500771317](https://github.com/barryrwilson/Rimward/actions/runs/34500771317) | Final test-repair artifact `f0b4c62c`: **PASS** in the downloaded raw verdict, all 10 workflow gates and 15 evidence assertions. |

These runs evaluate distinct code/test artifacts as bounded corrections land;
they do not replace failures with repeated attempts on an unchanged artifact.
Production runtime source and release acceptance thresholds remain unchanged.

Final evidence: focused regressions 14/14, Models 12/12, optional surfaces 7/7,
and the actual bridge command plus all 14 required bridge pins passed. Recorded
browser console errors/exceptions were zero; both dependency audit trees had
zero vulnerabilities, and required port/profile cleanup passed. Archive SHA256
`e290de919b9d8994f62de56cf74c940cd600a78f770496664c047ae9a22d76d7`
matches the manifest and source identity. Independent comparison of all 447
distribution files against baseline `0dd7908e` found identical paths, sizes
and SHA256 hashes: 39,402,057 bytes, zero differences. This is validation of
the existing runtime artifact, without a new performance waiver or publication.
PR #97 owns the final documentation review and merge handoff.

## Residual reliability follow-ups

Docking passed in the intermediate and final runs. The baseline collision is
an intermittent observation requiring diagnosis, not a currently failed final
gate or a proven fixed defect.

The failing observation was near the +X staging point: 7.74 units from that
point and 127.27 units from the station. The station's player-inclusive radial
collision reach is 34.4 units. The retained post-contact pose does not establish
which body was hit; the smoke retained event names but discarded the collision
payload. The old simplified docking fixture also lacks current fresh-start
heading/momentum and live body collisions.

Next diagnostic: retain full public `bodyHit` payload and pre-failure snapshots
on an unchanged fresh-start approach; identify collider and phase before
selecting a bounded correction. Do not reset the heading, suppress collisions,
remove obstacles or replace a failed attempt with a retry-to-green. A resulting
player-visible fix needs its own bounded scope. This is an unfiled follow-up
linked to the baseline run, not a newly created issue.

The intermediate bridge's lack of an eligible public combat target and Models
`captureScreenshot` timeout remain separate smoke/capture reliability
observations. Keep bounded diagnostic evidence if they recur; neither alone
establishes a gameplay defect. The final run passed their required flows.

The [approved performance decision](releases/issue-56-measured-decision.md)
remains unchanged: 1,835,632 minified / 549,169 gzip bytes; startup median
7,340.4 ms with one 8,280 ms run. Exact byte and separate startup acceptances
preserve raw failures against the unchanged 1,800,000 / 537,600-byte limits
and 8,000 ms startup target. They grant no future growth. This consolidation
does not introduce a new waiver or claim that the historical raw misses passed.
