# Issue #11 measured byte exception

The owner responded **Approved** in the current issue #11 Codex task on
**2026-09-09**, authorizing scoped source/tests/evidence export for independent
Claude review and renewal of the exact byte exception below conditional on
source QA PASS. The coordinator relayed that approval to the builder and
authorized activation after Claude returned source/code, security and
behavior/acceptance PASS on `65f5d522a814c6b8fe282028de5a44105004ccc0`.

Approval reference: **Codex task issue #11 owner approval, 2026-09-09**.

The approval covers only the complete measured JavaScript chunk set below.
It does not increase global limits, approve future changed artifacts, waive
the browser dependency audit or startup requirement, or authorize publication,
merge, deployment or issue closure. Issue #55's separate startup and pacing
exceptions are not represented as approval for this candidate.

## Exact artifact and byte decision

Runtime source remains unchanged from implementation commit
`65f5d522a814c6b8fe282028de5a44105004ccc0`. The policy change replaces only the
approved descriptor in `scripts/bundle-policy.mjs`; the exact matcher,
global budgets, browser audit, gameplay, tests and probes remain unchanged.
Companion documentation records the resulting verification status.

| Field | Approved measurement |
|---|---|
| JavaScript file | `assets/index-wgaNWMGI.js` |
| SHA256 | `05b1fc317b5218753d3923a6a64d6f2017d3b8b94da0bb42c0bedfc802bc31be` |
| Minified bytes | 1,824,955; 24,955 over the unchanged 1,800,000 limit |
| Gzip bytes | 545,098; 7,498 over the unchanged 537,600 limit |
| JavaScript chunk count | 1 |
| Runtime source census SHA256 | `406749ead4b576b2def1dd88aaeee395397b2f8feeafb3df9ca47586b0430882` |

This is an increase of **442 minified bytes and 93 gzip bytes** over the
previous approved issue #55 bundle. Removing the entire fix would still
leave the base over both normal limits. The raw global byte flags remain
false; the matched owner-approved exception is reported separately.

The unchanged matcher requires exact aggregate counts and the complete chunk
set's filenames, SHA256 digests and per-chunk sizes. A changed, added,
missing or duplicated chunk falls back to the fixed budgets. The browser
dependency audit remains unconditional.

The approval reference and release-note path are reviewed metadata. The
matcher checks that their strings are nonempty; it does not authenticate
owner approval or inspect this note. Owner approval and independent review
remain separately attributed evidence.

## Source review and accepted minor finding

Claude independently ran the focused fire and existing paused-input tests,
reviewed the exact source/diff, and inspected raw baseline/live/boot/build
evidence. Source/code, security and behavior/acceptance all passed. The full
verdict is retained as `QA-SOURCE.md` under the raw evidence root.

The reviewer permitted a documented nonblocking exception: when fire is
rebound to a keyboard code, pressing it under a full blocking owner returns
before the handler's `player-override` lease revocation. Default mouse fire
still revokes the lease first. Paused and Settings key handlers already
returned early before this change; the new difference concerns the other
blocking owners (chart, berth, dock, title, Models or typing focus) when the
keydown reaches controls. Per-update agent lease safety gates remain intact.
The coordinator accepted this low-impact transient input-path difference;
the exact approved runtime has not been modified to address it.

The reviewer ran neither the full boot nor production build, and could not
independently recompute the source census during that source review because
its hashing shell pipeline was denied. Recorded boot/live evidence and later
local artifact checks are therefore attributed separately. A read-only
artifact-check script is provided for independent policy review.

## Local verification and remaining review

The implementation's focused test passes 256/256, the unchanged full boot and
paused-input tests pass, live ownership checks pass 41/41 and actual headed
tab-focus checks pass 5/5. Both final live runs have no console errors or
uncaught exceptions, matching source hashes and closed owned ports.
The details and preserved earlier failures are recorded in
[Issue11FireHeldEvidence.md](../Issue11FireHeldEvidence.md).

| Check | Local result | Retained evidence |
|---|---|---|
| `npm run build` | PASS; exact issue #11 exception reported | `approved-build.log` |
| `npm run bundle:report -- --json` | PASS; both raw byte flags false, exact exception applied | `approved-bundle-report.log` |
| Browser dependency audit | PASS; only `three`, no unexpected packages or forbidden sources | Same bundle report |
| Runtime identity and emitted JS equivalence | PASS; 131 source files match reviewed Git contents and census; complete emitted Rollup chunk set matches the approved filename, digest and sizes | `approved-artifact-check-final.json` |

The read-only `artifact-check.mjs` independently reads source files and
reviewed Git objects, hashes emitted JavaScript and recomputes gzip sizes.
It does not write files, access the network or mutate Git. It also checks the
pre-existing copied `public/assets/basis/basis_transcoder.js` byte-for-byte
against both its source and reviewed Git object; that 57,529-byte public
asset is separate from the Rollup chunk set measured by the unchanged policy.
An initial checker attempt incorrectly counted that public file as a Rollup
chunk; its failed output remains as `approved-artifact-check.json`. The
corrected checker verifies the public file separately rather than ignoring it.

Independent review of the policy activation artifact remains pending;
source QA is not policy QA.

No production deployment or cold-start remeasurement is claimed. The startup
requirement remains in force; this byte approval supplies no startup waiver.

Raw evidence remains outside Git under
`C:/Projects/WebSim/out/issue-11-evidence/`, including `RELEASE-DECISION.md`,
`candidate-bundle.json`, browser results and the coordinator's review records.
