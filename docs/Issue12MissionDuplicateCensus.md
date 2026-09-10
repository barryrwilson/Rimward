# Issue #12 / OPT-005: simultaneous mission offers

The current generators produced meaningful duplicate **trade** and **survey** offers. The bounded fix changes only those two generators and their offered-row maintenance. Passenger parties remain independently payable under the approved [#73 commitment policy](PassengerCommitmentPolicyDesign.md).

## Reproducible census

Baseline: `8b55b87ef7167612266704e8a7668d0ea42f1d32`. The same census script ran against an extracted baseline tree and the candidate. Each run visits all **101 actual station origins**, with generation seeds **1, 42, 1592594996**: **303 boards**. The script asserts that relocation reached the requested origin and that every offered row corresponds to a rendered card; it captures the production card title, detail and reward line. Seeded world record banks are generated on first visit and reused, while offers are rebuilt for every seed. These are deterministic functional fixtures, not natural travel, encounter or income measurements. Relocation explicitly bypasses faction launch holds.

Identity uses the displayed objective and terms: family, origin, destination, target, commodity, quantity, rendered reward and detail. Physical landmark IDs distinguish different survey sites even when names match; recovery wreck IDs identify separate physical objectives. IDs, slots, sequence numbers and timestamps alone never establish a meaningful difference. The script is an audit, not a production display-text filter. Target risk and employer obligations remain in the actual detail/reward copy; no filter touches hunt, war, spy or other families.

| Family | Offers before → after | Identical simultaneous pairs before → after | Finding / current guard |
| --- | ---: | ---: | --- |
| Mining | 606 → 606 | 0 → 0 | Existing MSN-04 commodity exclusion and offered-twin healing. |
| Trade | 606 → 606 | 114 → 0 | Unconstrained weighted commodity rolls created the same five-unit delivery to the same station for the same pay. Now choose from eligible weighted commodities. |
| Hunt | 471 → 471 | 0 → 0 | `huntBoundRecordIds` / eligible quarry binding exclude a sibling target; genuine different quarries retained. |
| Passenger | 606 → 606 | 303 → 303 | Intentional distinct booked parties; same-route stacking and separate fares are explicit player-facing terms under #73. Both remain acceptable. |
| Explore / survey | 606 → 315 | 291 → 0 | Modulo selection repeated the only eligible landmark at 97 origins. Now one offer per identical physical objective/pay, up to two for distinct sites. |
| Espionage | 567 → 567 | 0 → 0 | Distinct eligible rival destinations; bound destination set. |
| Faction war | 35 → 35 | 0 → 0 | Bound eligible security records; low counts reflect actual available rivals and targets, not an assumed full board. |
| Bounty (including pirate overlays) | 774 → 774 | 0 → 0 | Unique pirate target key / named-ace row. A hunt and bounty may refer to the same pirate but have different kill versus kill-or-capture terms and existing coordinated settlement; not collapsed. |
| Unique haul | 303 → 303 | 0 → 0 | One global `haul-provisions` record; explicit unique-haul payment fence unchanged. |
| Unique ferry | 303 → 303 | 0 → 0 | Repeatable `ferry-consignment` is one global record, reset for its next consignment. |
| Patrol | 303 → 303 | 0 → 0 | One global `patrol-lane` record. |
| Recovery | 0 natural fixture rows | Supplemental: 2 distinct wrecks retained | Real aftermath eligibility means a fresh world has none. Two explicitly inserted valid wreck fixtures produce two physical recovery objectives; four board refreshes never duplicate either wreck. Both accept. |
| Employer chains | 0 fresh-standing rows | Supplemental: all 4 employers | Standing fixtures unlock Freehold, Red Ledger, Veridian and Hollow chains. Repeated rendering posts one per employer; accepted and done rows prevent repost. Completed chains are not renewable. |

The 303 passenger pairs are reported rather than erased from the census. Their independent payment contract is a deliberate exception, not an ID-based claim of variety. Recovery's matching generic text likewise does not justify removing separate wreck objectives.

## Concrete before/after evidence

Baseline seed 1 at Hollowreach posts `trade-hollowreach-6` and `trade-hollowreach-7`:

* **Haul Provisions**
* “Buy or hold 5 Provisions and deliver to Ledger Anchorage.”
* “Deliver 5 Provisions to Ledger Anchorage — pays 1120 UU”

Baseline seed 1 at Freehold posts `explore-freehold-0` and `explore-freehold-1`:

* **Survey The Shepherd**
* “Fly to The Shepherd in Freehold Drift. Redock here to file.”
* “File the survey at this dock — pays 420 UU”
* Both resolve to physical landmark `fh_shepherd` in `freehold`.

The candidate has no matching trade or survey pairs in any sampled board. Trade still fills two slots, including under constant-zero RNG; the authored provision weighting remains in the eligible candidate pool. Survey fills one at Freehold and two distinct objectives at Hollowreach. Three seed runs are reproducible coverage, not a proof over all possible random histories; the deterministic eligibility and constant-RNG pins test the actual exclusion rules.

## Preservation and lifecycle

Only offered legacy twins are replaced or withdrawn. Accepted agreements are preserved, including two already accepted same-objective contracts. An accepted legacy survey in slot 1 continues resolving to its original site; the resolver and saved schema are unchanged. Expiry replaces that slot when its objective becomes eligible again. Two distinct sites still support two simultaneous surveys.

Trade exclusion compares the effective delivery destination, quantity and quote. A same-commodity accepted contract with a different locked reward or destination does not block a new offer. Commodity weights are filtered, not rebalanced globally. The source changes neither prices nor payouts. Survey identity includes the actual system/landmark and locked quote. No new fields, keys, equipment, mission family or global de-duplication layer were introduced.

Focused tests cover constant RNG; ordinary acceptance and duplicate-acceptance refusal; accepted-slot occupancy; refresh stability; one-in/one-out expiry replacement; offered legacy twins; two accepted legacy agreements; accepted survey slot 1; different locked trade rewards and destinations; two-site survey retention; passenger double acceptance; separate recovery targets; and four single-instance chains. Existing full boot assertions that required two copies of Freehold's one survey site are updated to assert its one real objective. All other boot checks remain intact.

## Commands and evidence

Candidate:

```powershell
node --import ./scripts/with-css-stub.mjs scripts/issue-12-mission-census.mjs --out=out/issue-12/candidate-census.json
npm run build
npm run test:boot
node scripts/issue-12-live-probe.mjs
```

To reproduce the before census, extract `git archive 8b55b87ef7167612266704e8a7668d0ea42f1d32` into a separate directory, copy **only** the candidate `scripts/issue-12-mission-census.mjs` there, install/resolve the baseline dependencies, and run the same command with `--baseline --out=out/issue-12/baseline-census.json`. `--baseline` records known duplicate counts and expects the old two-copy Freehold behavior; it skips candidate-only healing assertions. It does not patch or simulate the baseline generator.

Local raw evidence is retained under `C:/Projects/WebSim/out/issue-12-evidence/`: `baseline-census.json`, `baseline-census.log`, `candidate-census.json`, `candidate-census.log`, the extracted baseline tree, and `live/` browser results/screenshots. The final corrected runs supersede provisional runs that did not assert successful relocation past a launch hold. Raw JSON and browser artifacts are intentionally not committed.

Both final census runs pass. The live probe independently exercises rendered boards, acceptance/expiry/refill, legacy slot 1, and double-passenger settlement. Final full boot and independent QA are recorded by the coordinating task against the exact artifact. The ordinary build reports **1,825,869 minified / 545,409 gzip bytes**, **914 / 311 bytes** above the prior exact artifact exception. Limits and exception descriptors are unchanged; this release gate remains visible rather than being waived by the census change. Reverting the bounded station change restores previous generation; no save migration is needed.
