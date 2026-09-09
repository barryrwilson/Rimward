# Agent combat: supplemental live results, 2026-09-09

Latest completed live verification tested **`11839b14`**: natural08 completed the required 30/15/5-second wall-delay windows, fired 76 shots, reached both named-target surrenders and earned 300 UU patrol payment. The matched close04 assisted delay stayed mobile and fired five shots, versus zero motion/shots after baseline authority release. Natural firing gaps up to **37.0718 seconds**, two zero-damage combat asteroid contacts and earlier route-autopilot damage are preserved below. Independent Claude review passed the exact source and accepted the behavior evidence. Full boot passed. The owner approved the exact measured byte and startup exceptions on 2026-09-09; post-activation build and bundle report both pass, with all 447 emitted files identical to the approved candidate. The change is ready for its pull-request handoff. Historical failures below remain unchanged.

## Current artifact and gates

The latest assisted04 identity is commit `11839b1444eae7c807708a6f958e2b35eb0c0bba`, runtime SHA-256 `cf3f36cb0a43b0d27cbf5adc665e946e122e3ba2a52af1b66b2e6aeadd89755a`, with the unchanged harness hash below. Source/tools remained stable. Its harness, fixture source, RNG, initial fixture and seed match close03; source intentionally differs. Baseline04 completed with all seven paired identity checks matching. Natural08 completed on the same commit/runtime/harness identity, with stable source/tools and no console errors/exceptions.

The earlier `sustained-iab-07`, `assisted-close-final-03` and `baseline-close-final-03` recorded matching, stable identities:

- Commit: `fe44c84c7116d37aeb76a9dcb14bf6e2b4987a78`.
- Runtime SHA-256, using the live harness census: `95e48744644d09ed583c25b0fd2de38ce068879f9be5cc96522bbde478a6f189`.
- Three-script live harness SHA-256: `9a820ac72fcf0ec88692e05bd6b31036076f3e51cb0f503aa5b0f23a6d7ee3b4`.
- Controlled initial fixture SHA-256: `992207d896cc441d3abed3175df7dc559cd629a84e97f328b242bd32d99886b5`.
- Controlled fixture source / RNG SHA-256: `ddba242fd57b859b22c3e3939ef01350ea63a74a69baa9795b51c820567ea963` / `fb49a8a5d02a3d2e85ca4e7a9018a59d730b9699ef67c55ad65cbdb47710d469`.

| Gate | Latest evidence and status |
| --- | --- |
| Sustained combat quality | **Accepted by independent Claude review:** natural08 and close04 demonstrate periodic firing/motion. Longest natural gap 37.0718s; no every-pass firing requirement is added |
| Natural career outcome | **Latest natural08:** patrol paid 300 UU; both bounties remain accepted 0/1. Earlier natural07 paid 675 UU on its different source |
| Natural 5/15/30-second coverage on `11839b14` | **Complete wall-delay windows:** 30.021 / 15.016 / 5.025s, with valid ownership and no outer actions |
| Controlled 30-second coverage on `11839b14` | **Complete:** assisted moved 2,492.09 u and fired 5 shots; exact 17.1829s inter-shot gap retained |
| Focused controller checks | **PASS:** 33 groups, including a root rerun from the exact archived `11839b14` bytes with all three fixture hashes matching the archive |
| Full `npm run test:boot` on `11839b14` | **PASS:** complete boot and agent-gameplay checks; `BOOT TEST PASS — no update errors` |
| Production `npm run build` on `11839b14` | **FAIL:** 1,811,486 minified / 540,768 gzip bytes; exceeds unchanged limits by 11,486 / 3,168 bytes. Browser dependency boundary passed |
| Five production startup samples on `11839b14` | **FAIL:** all five exceed the 8,000 ms per-run limit; median 12,481.9 ms, maximum 13,825.1 ms |
| Approved build/report verification | **PASS:** both commands exit 0; all 447 emitted files and runtime source identical to the approved candidate; raw global byte failures retained, exact owner exception applied |
| Independent Claude acceptance | **Source PASS; behavior criteria satisfied; historical release FAIL before owner exceptions.** No actionable source defect remains. The evidence-only fixture digest finding is reconciled by the exact-archive rerun below |

Claude's E1 finding concerned one fixture digest, not game code: the working copy of `issue-61-crossing-public.json` had one CRLF terminator (14,539 bytes, SHA-256 `c6259802a15cd0cb3b5ff46cf415cd580063826476668e302f3cb5ac7a2d2201`), while the Git archive used LF (14,538 bytes, `530ea31c01556d3b0dca90f619bea76dabf97aeae737302faf95bbeec3881141`). Parsed JSON and normalized bytes are identical; the other two fixtures already used LF. Root copied the immutable source archive, added public assets archived from the same commit, verified all 372 archived file hashes, and reran `npm run test:combat-intent`: all 33 groups passed with unchanged start/end hashes and all three fixture digests matching the archive. The primary crossing test again recorded first firing geometry at 0.3167 seconds and 56 firing frames. No production source or test was changed.

The independent review found the exact-artifact exception proposal ready for an owner decision. The owner subsequently approved this artifact's byte and startup exceptions; the exact byte descriptor is now applied and post-activation build/report validation passes. Its low-severity metadata caveat remains explicit: the matcher checks nonempty reference strings, not release-note existence/content or approval authenticity. The actual approval, unchanged limits and exact scope are recorded in the [release exception](../releases/issue-61-measured-exception.md).

The final full boot completed successfully on `11839b14`. Production build failed the unchanged 1,800,000 minified / 537,600 gzip byte budgets. A separately named diagnostic candidate preserved those failures while emitting the unchanged production transforms for startup measurement; emitting that candidate is not a passing release build.

| Cold production start | Navigation-to-title-ready ms | 8,000 ms gate |
| --- | --- | --- |
| 1 | 13,825.1 | FAIL |
| 2 | 12,481.9 | FAIL |
| 3 | 9,883.9 | FAIL |
| 4 | 13,196.1 | FAIL |
| 5 | 8,318.2 | FAIL |

All five starts used fresh browser profiles, disabled caches, the corrected title-ready contract, foreground activation and the documented background/occlusion flags. All recorded error arrays were empty. Runtime source, probe script and candidate artifact stayed stable; every spawned browser exited, its CDP port closed and its temporary profile was removed. Startup median was **12,481.9 ms** and maximum **13,825.1 ms**. These are completed failures, not pending measurements.

Diagnostic artifact-manifest SHA-256: `1c8de3a5ac6597e3c873c5c2daa5b50bdc2d3bed7844fc14b3b7a365e1380f52` (447 files). Production JavaScript `assets/index-CiM3Wsov.js`: `66073df56bfe1b856882c550c4f942b2055dfa88dfc27c7f317a3ee7766c471a`. Production probe SHA-256: `6e9a0c74a970a2828dc4302a69db78aa31159a86d1af3fcecf73462711757caa`.

The exact-artifact exception proposal passed its offline validator **45/45** after a duplicate-filename rejection was added. The owner's subsequent approval covers the exact byte descriptor and, separately, these startup measurements. Global budgets remain unchanged. Both post-activation commands exited 0; the report retains raw global byte flags false and reports the actual approval separately. Browser dependency audit passes with only three. All 447 emitted files match the approved candidate manifest byte-for-byte, and the runtime source census remains identical.

## Natural08: completed delay coverage and patrol outcome

Natural08 used a fresh Greenhand origin, native RNG and ordinary public actions. The requested bounded career duration was 180 wall seconds; it stopped after **142.844 wall seconds** when the required coverage, both named-target terminals and patrol payment had actually occurred. It must not be described as 180 seconds of completed combat.

Red Marlow's initial 30-second attempt ended after 15.044 wall / 15.045 simulation seconds, with 24 shots, at actual surrender t49.2909; control released t49.2982. That attempt is partial. Gallows Wren supplied the complete required windows, with no outer actions and valid target-specific combat authority throughout each:

| Required window | Wall / simulation seconds | Movement | Shots / unattributed target-hit increments | Reported body hits |
| --- | --- | --- | --- | --- |
| 30s | 30.021 / 30.024 | 2,283.76 u | 14 / 2 | 2 asteroid contacts, both damage 0 |
| 15s | 15.016 / 15.014 | 1,160.36 u | 8 / 7 | 0 |
| 5s | 5.025 / 5.026 | 401.07 u | 0 / 0 | 0 |

The run continued with later windows recording 0, 7, 9, 3 and 11 shots; the final 15-second attempt ended at surrender after 8.824 wall seconds and stays partial. Total cumulative player-fire count was 76. Gallows surrendered at t174.6687; control released and patrol completed at t174.6766. Credits were 350 initially, 650 at career final t175.5745 and 650 at finalStop t176.8006: **+300 UU patrol only**. Both named bounties remained accepted 0/1. Unrelated Innisfree/Tallow-3 surrenders in the event ring are not credited as the selected target's terminal.

The longest exact inter-shot gap was **37.0718 simulation seconds**, t95.2373 count 46 → t132.3091 count 47. All 163 intervening observations retained active Gallows ownership; the only outer actions were three explicit renewals. Approximate fire blocks were 21.4097 seconds alignment, 14.7432 reposition and 0.6580 obstruction, plus 0.2609 seconds attributed to an unblocked boundary sample. The ship moved about 2,940 u and sampled speed stayed at least 40.8 u/s. The second-longest exact gap was 26.5454 seconds. These gaps are preserved alongside subsequent firing and eventual surrender; no uniformly frequent-fire or every-pass firing claim is made.

A later zero-shot 15-second trial measured 15.802 wall but 14.1426 simulation seconds; it meets the wall-delay criterion and is not 15 simulation seconds. This does not affect the separately completed required 15-second trial above. The longest-gap trace's maximum observation spacing was 1.907 wall / 0.670 simulation seconds.

The two combat contacts were **asteroids**, at t68.2755 and 68.4258, both recorded damage 0 during reposition. The first was preceded by an obstructed state. Hull/screen/shell/engine remained 100/40/60/100 around them; selected Gallows was approximately 101 → 92 → 79 u away across the bracketing observations. These are not selected-ship impacts.

Earlier route-autopilot transit, with combat owner `none`, advanced asteroid contact count 0 → 2 between t31.6795 and 32.0751 and lost screen 40 → 0 plus shell 60 → 58.6196. Only the later coalesced event survives in the public ring (t32.039, damage 0); it cannot establish the first contact's speed/damage. The ship regenerated during the subsequent Red fight. Thus the full run reports four cumulative asteroid contacts, two during combat, and cannot be described as damage-free transit.

FinalStop showed full vitals, speed/throttle 0, no held fire or owner and AP/automine off. Root separately confirmed the retained visible IAB page paused afterward. Source/tools were stable, console errors/exceptions zero, and the queue closed. No optional docking return flight was attempted.

## Close04: periodic firing in a matched full delay

On frozen `11839b14`, the unchanged stock close fixture completed 8.020 wall / 8.015 simulation seconds of warmup and 30.016 wall / 30.017 simulation seconds of delay, with no outer action during either window. Warmup moved 658.80 u with zero shots; the delay moved 2,492.09 u with five shots and three unattributed target-hit increments. Both windows reported zero body hits and zero stationary-threat time. Minimum sampled separation was 16.463 u warmup and 44.372 u delay. Hull/shell/engine loss was zero; the delay lost 2.318 screen. Both windows reported an approach/pass/separation cycle.

The full firing timeline is **t130.6138, 130.7806, 147.9635, 148.1344 and 148.3018**. All five cumulative counts were individually observed. The initial grant-to-first-shot gap was 10.3014 seconds. Between the second and third shots, **17.1829 seconds** elapsed; all 77 intervening public observations retained active ownership of the same target. Two shotless pass cycles occurred inside that gap. After the fifth shot, active ownership continued another **10.3573 seconds**, including a further shotless pass.

The 30-second delay was approximately 15.2765 seconds alignment-blocked, 13.8513 reposition-blocked and 0.8889 unblocked. Observed pass intervals fired 2 / 0 / 0 / 3 / 0 shots. This improves on close03's zero-shot delay. The observed gaps remain reviewable, but they alone are not designated a new defect: issue scope does not require every pass to fire or every encounter to be won. No target terminal occurred. Root confirmed the retained IAB page paused after completion; source/tool identities were stable and console errors/exceptions were zero.

Baseline04 also completed on the identical source/harness/fixture/RNG/initial-state/pair identity. Its full 30-second delay measured 30.004 wall / 30.006 simulation seconds, 0 u movement, 0 shots, 30.006s stationary-threat proxy and 9.597 u minimum separation. Two reported ship body hits occurred at t142.3005 and t153.1769; **both had speed 0 and damage 0**, so they must not be described as damaging impacts. Net screen loss was 14.746; hull/shell/engine loss was 0. Baseline warmup was 8.271 wall seconds overall, with 8.023 wall / 8.025 simulation seconds sampled, 273.09 u movement and 0 shots. Both legs survived and were separately paused by Root. Natural08 subsequently completed as documented above.

## Material earlier evidence retained

| Earlier run / artifact | Finding; not pooled with latest evidence |
| --- | --- |
| Natural07, `fe44c84` | Both target terminals, 48 shots; requested 30s attempts ended after 6.697/9.567s, leaving all scheduled delay coverage incomplete. Patrol paid 300 UU before career final; Gallows bounty added 375 UU during cleanup, total 675. One between-target route-AP ship collision lost 20.397 screen; both combat windows had zero contacts. |
| Close03, `fe44c84` | Assisted full 30s moved 2,563.35 u but fired zero shots; at least 33.5241s active no-fire, with repeated pass-to-reposition transitions. C2 correction followed. Narrow coverage PASS did not override this firing failure. |
| Natural06, `f616805` | Full 30/15/5 windows completed; a 117.3472s inter-shot gap included a 0.0416s hail-related authority break. A conservative 72.8505s continuously observed active-combat no-fire stretch remained. Red eventually surrendered. No career job paid; a later optional docking flight killed the player at t278.0987. Raw death remains a failure. |
| Natural05, `e467bc7` | Full 30/15/5 coverage, then a 48.9736s continuously owned no-fire gap. No accepted job completed; normal return ended docked. Claude identified required C1 turn-authority correction and recommended C2 crossing-aware avoidance. |
| Close02, `e467bc7` | Assisted 30s moved 1,886.07 u and fired four shots; zero reported body hits, minimum 51.743 u. Global approach/separation metric false. |
| Natural04, `30f77ed` | Patrol paid 350 → 650 UU after surrenders. Natural 5/15s completed; 30s attempts ended at surrender. Later search asserted on legitimate `noDest`; raw harness failure retained. |
| Close01, `30f77ed` | Frontal-convergence ship impact at t133.2887, speed 26.9458 and damage 9.4310; prompted narrow-front cooldown correction. |
| Earlier release checks, `e467bc7` | Full boot passed, but build failed at 1,810,612 / 540,486 bytes and all five startup samples failed (median 10,348.0 ms; maximum 12,786.3 ms). Not pooled with final-source results. |
| Early startup probes | `production-startup-01` used an invalid readiness contract. `production-startup-diagnostic-02` measured a valid 9,302.4 ms under prior flags; neither replaces the later five-start results. |

`npcHit` lacks shooter identity: target-hit counts are uncredited activity, damage is not cumulative, and net vitals include recharge. The stationary-threat proxy is speed below 1 u/s with public combat/nearby-hostile/recent-hit evidence, not time under actual fire. `bodyHit` is throttled and lacks other-body identity; zero reported events does not prove zero contact. Throttle zero alone does not prove a stopped ship.

## Reproducible evidence paths

Commands run from the repository root. Generated evidence lives beneath `out/issue-61-live/`; it is intentionally excluded from version control and these links require the retained local evidence or a separately shared verification packet. Paths are relative to this document, not tied to a developer's checkout.

- [Natural08 raw result](../../out/issue-61-live/sustained-iab-08/result.json), [assessment](../../out/issue-61-live/sustained-iab-08/natural08-assessment.json), [37-second gap timeline](../../out/issue-61-live/sustained-iab-08/natural08-no-fire-timeseries.json), [contact context](../../out/issue-61-live/sustained-iab-08/natural08-contact-proof.json), and [verbatim API proof](../../out/issue-61-live/sustained-iab-08/natural08-raw-proof.jsonl).
- [Close04 matched assessment](../../out/issue-61-live/assisted-close-final-04/final-pair-assessment.json), [assisted raw result](../../out/issue-61-live/assisted-close-final-04/result.json), [baseline raw result](../../out/issue-61-live/baseline-close-final-04/result.json), and [baseline zero-damage contact proof](../../out/issue-61-live/baseline-close-final-04/baseline04-impact-proof.jsonl).
- [Final diagnostic candidate result](../../out/issue-61-live/diagnostic-production-11839-final/result.json), [artifact manifest](../../out/issue-61-live/diagnostic-production-11839-final/artifact-manifest.json), and [five final startup measurements](../../out/issue-61-live/production-startup-11839-final/result.json).
- Retained earlier raw results use the same root with run names `sustained-iab-05`, `sustained-iab-06`, `sustained-iab-07`, `assisted-close-final-03` and `baseline-close-final-03`. The failure summaries above remain part of this record.

Recorded commands below name completed runs; use new evidence names for an explicitly authorized rerun because existing results must not be overwritten. IAB runs require `ISSUE61_TRANSPORT=iab`, a fresh `ISSUE61_PAGE_ORIGIN` assigned by the run coordinator and navigation of the visible IAB tab to the printed URL. Run one test at a time and pause the retained page after measurement.

```powershell
npm run test:boot
npm run build
node scripts/issue-61-live-probe.mjs --mode controlled --pilot assisted --encounter close --delay 30 --pair close-final-04 --name assisted-close-final-04
node scripts/issue-61-live-probe.mjs --mode controlled --pilot baseline --encounter close --delay 30 --pair close-final-04 --name baseline-close-final-04
node scripts/issue-61-live-probe.mjs --mode natural --duration 180 --name sustained-iab-08
node scripts/issue-61-production-live.mjs --mode candidate --name diagnostic-production-11839-final
node scripts/issue-61-production-live.mjs --mode startup --name production-startup-11839-final --candidate diagnostic-production-11839-final --count 5
```

Independent source review and the owner's measured byte/startup exception decision are complete. Post-activation build/report checks pass with all 447 emitted files and gameplay source identical to the reviewed candidate. The change is ready for the coordinator's pull-request handoff. No merge or deployment is claimed.
