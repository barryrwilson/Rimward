# Issue #238 — implementation acceptance and evidence

**Status: implementation and acceptance verified; ready for PR.** This record is not an independent QA verdict. Sloane compiled the design, builder, independent-review and completed live evidence. No merge or deployment is claimed. The [mission record](missions/issue-238.md) owns subsequent gate decisions; the [design](Issue238DeepDossierDesign.md) includes all seven verbatim issue criteria and their test mappings.

## What the player can choose

The named-courier assignment now offers an explicit choice after basic observation: return for the accepted basic payment, or open the existing Galaxy Chart and select one optional complete-dossier attempt. The chart and API disclose the additional requirement, total payment and premium before commitment. Basic-ready, pursuing-deep and deep-ready are distinct, and the same validated action serves the human button and `chooseShadowDossier` API.

The proposed tuning is 30 additional selected observation seconds at 150–400 units, a frozen 50% premium, and 4 suspicion points/second inside 400 while pursuing; crowding below 150 retains 10/second. Open beyond 400 or break sight to cool. Warning history and spent grace survive pauses/reload. Exposure, explicit withdrawal or genuine target loss closes the optional attempt while retaining the earned basic report. Partial deep evidence survives temporary interruptions; a complete dossier survives subsequent target loss. The original deadline and explicit whole-job abandonment can still invalidate payment. Employer settlement pays one earned total, never basic plus a second dossier payout. These values remain provisional tuning, not a broad balance conclusion.

Versioned, strict JSON-safe nested state preserves basic-only v1 contracts, freezes both communicated quotes, and rejects malformed supported contracts. No new key, gauge, equipment SKU, global wanted system, currency or bridge exposure is introduced. Introductory spy work remains separate.

## Exact artifacts and reviewed corrections

| Artifact | Evidence / meaning |
| --- | --- |
| Base `a983981b73fa6ae99999a003a92a8848d8df89ee` | Merged #236/#237 contract and runtime. |
| Design `79050a1fec8bebe7199f145a478ad1e2c801fedf` | Independent Claude Quinn design-readiness PASS, `out/issue-238/design-review-1.md`. Its issue-text coverage limit was repaired by the design's verbatim acceptance table before implementation closure. |
| Initial runtime `8628d4afa4bda114947ee54e825d918f89a48750` | Independent implementation FAIL, `out/issue-238/implementation-review-1.md`; unchanged boot failed the chart input contract. Original logs and natural failures remain preserved. |
| Repaired runtime `b199fe698877d6b82c0dbde9c8f5d51564be306b` | Independent Claude Quinn/Knox code/security PASS, `out/issue-238/implementation-review-2.md`; build and full unchanged boot pass. This verdict explicitly excludes natural browser acceptance. |
| Final candidate `7838c9e21c7231dda5c77a853ebaefbf0e618edf` | Bounded final polish for review notes A–C: Space keyup reaches its release owner, closed-state copy no longer repeats consequences/raw enums, and Jobs terms are deduplicated. Independent final code/security PASS (`implementation-review-3.md`); final build/unchanged boot exited 0, all 9 dossier and 52 base courier groups pass. Successful natural deep evidence is recorded below. |

The first review's eight findings were closed at b199fe69: native chart keyboard behavior, truthful terms for each state, per-job temporary notices, throttled single-read projection, null-safe Jobs terms, a discoverable focused test command and binding fallback. Live checks at that candidate confirmed Tab, Escape, chart key and Space choice behavior plus readable desktop/768px layout. The final Space-keyup polish passes independent code review, focused regression and the supplemental native browser fixture below.

A natural deep run exposed a genuine cold-restore defect: before traffic recreated a live hull, the abstract blockade casualty selector could choose the temporarily non-live mission courier and mark it permanently dead. The reviewed write-set expansion adds one ownership exclusion to that abstract selector in `src/game/world.js`. It does not make the ship invulnerable to live combat or resurrect a genuinely lost target. The new regression drives real system update order, checks survival after every system/frame, checks genuine dead/captured/derelict/inTransit loss, and proves ordinary traders and released mission records remain eligible casualties. Independent review confirmed this boundary. The original serialized failing blob was not retained: the regression reconstructs the boundary, not an exact-byte replay. Ordinary non-mission traders can still suffer the pre-existing restore-gap abstract casualty behavior; that is outside #238 and no external follow-up issue was created.

## Verification already recorded

All local paths below are ignored evidence under `out/issue-238/`, not committed screenshots/profiles or assertions that the final candidate inherits every browser result.

| Gate / scenario | Recorded result and location |
| --- | --- |
| Focused contract and regression | At b199fe69, all 9 dossier groups and 52 base courier checks passed in independent re-review, along with agent schema and bridge self-test. Earlier API hardening and abandonment checks passed at 8628d4a; raw `focused-*.log` and both review reports retain the candidate boundaries. |
| Build and unchanged boot | b199fe69 PASS: `build-b199fe6.log`, `boot-b199fe6.log`. The earlier `boot-8628d4a.log` failure remains preserved; no boot weakening is claimed. |
| Natural interrupted deep / exposure | 8628d4a: `live-8628d4a-attempt-1/courier-exposure/result.json` and screenshots. Exposure retained basic; employer paid exactly 420 UU once (350 → 770), repeated settlement and ordinary post-payment reload did not duplicate it. Console/network checks were empty and source/harness identities stable; cleanup evidence is retained. |
| Natural basic choice | b199fe69: `live-b199fe6-attempt-2/courier-basic/result.json`. Basic filing paid the accepted 420 UU once; repeat ticks and ordinary reload stayed paid once. Console errors/exceptions were empty. Wrapper browser shutdown exceeded its timing window; `wrapper-cleanup-followup.json` independently confirms cleanup. Do not report the wrapper as a clean exit. |
| Failed first natural deep | 8628d4a: `live-8628d4a-attempt-1/live-findings.md` and `courier-deep/` evidence. Pursuing evidence 20.1414/30 restored at t246.423, then target-lost closed the attempt 0.4031 seconds later. This led to the restore repair; it is not deep-success evidence. The narrow chart overlap also led to the layout repair. |
| Other incomplete journeys | `live-b199fe6-attempt-1/`: deep controller did not sustain the cooling dwell; basic did not locate its courier after observed combat. Neither is a PASS or proof of permanent destruction. Attempt2 corrected only the ignored flight controller, not game timers, traffic or source. Old attempts remain inspectable. |

## Final candidate verification

On `7838c9e21c7231dda5c77a853ebaefbf0e618edf`, independent Claude Quinn/Knox returned final code/security **PASS** in `out/issue-238/implementation-review-3.md`, closing A–C with no open substantive findings. Root recorded both `build-7838c9e.log` and unchanged `boot-7838c9e.log` exits as 0. Independent final focused verification passed all 9 dossier contract groups and all 52 base courier groups. The review accepts the earlier basic/exposure browser evidence without repeating unchanged flows. The narrowly expanded world ownership scope is recorded in the mission and reviewed; unrelated gameplay changes are not included.

The final natural deep run **passed**: `out/issue-238/live-7838c9e-attempt-2/courier-deep/result.json`. A starter-hull journey deliberately began the attempt, received the warning, withdrew/cooled, reloaded during pursuit, reacquired the same courier and completed 30/30 at simulation time 330.5525. The accepted complete-dossier total was 630 UU; employer settlement changed credits from 350 to 980 once. Repeated ticks and ordinary post-payment reload retained 980 with no payable job. This verifies the cold-restore repair through the actual natural flow rather than only its reconstructed fixture.

`checksCompleted`, source stability and measurement source/harness stability are true. Console warnings, errors, exceptions and network failures are empty. Both dedicated Chrome and Vite processes exited and their ports closed. Six read-only raw-save manifests are retained beside the result. Root visually inspected the final deep-ready chart. This is a bounded successful playtest of the proposed tuning, not evidence of career-wide balance.

The preceding final-candidate attempt1 remains preserved under `live-7838c9e-attempt-1/`: the start button became legitimately disabled as the courier moved while screenshots were taken. Attempt2 corrected only controller transport/scheduling; gameplay, timers, traffic and source stayed unchanged. Do not count attempt1 as success or discard it.

## Final supplemental UI fixture — PASS

`out/issue-238/fixture-7838c9e-attempt-3/dossier-focused-ui/result.json` verifies the final `7838c9e2` runtime with real native input: hold default Space, Tab to the exact dossier-row button, release Space, close with Escape, then obtain a public `setControl` lease without `player-override`. Native Space on the end-attempt button closes job A only, leaving B unchanged. Repeated end/begin, malformed arguments and wrong IDs refuse. A native Settings remap of the chart key to U appears in the terms, and all four Jobs rows show their agreement once.

Checks completed with stable runtime/harness identities, empty console errors/exceptions/network failures, exited dedicated processes, closed ports and removed temporary profile. This controlled multi-row fixture supplements the natural journeys; it is not career or economy evidence. Earlier incomplete/controller-setup attempts remain preserved and are not counted as passing flows.

All #238 implementation acceptance gates are now verified on the final candidate plus the explicitly scoped unchanged predecessor flows accepted by independent review. The change is ready for PR; issue closure belongs to merge. No merge, deployment or everyday-checkout update is claimed here, and those actions retain their separate authorization/evidence requirements.
#234 arrival reliability remains separate. #239 contacts/equipment and #240 allegiance conflicts remain outside this issue; the broader spy-career playtest should precede their implementation. Downgrade rollback uses the prior runtime plus a coherent pre-v2 save snapshot; old runtime compatibility with the new nested data is not claimed.
