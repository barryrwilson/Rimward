# Issue #238 — optional complete dossier

- Outcome: offer a deliberate, informed choice between filing earned basic intelligence and pursuing a riskier complete dossier on the existing named courier mission.
- Source of truth: https://github.com/barryrwilson/Rimward/issues/238; tracking #233.
- Base: a983981b73fa6ae99999a003a92a8848d8df89ee (merged #236/#237).
- Branch/worktree: codex/issue-238-deep-dossier; C:/Projects/WebSim-issue-238.
- Stage: specification; Sloane owns docs/Issue238DeepDossierDesign.md. Clawd coordinates; independent Claude Quinn reviews the pinned specification.
- Authority: owner requested the next issue using orchestrator. Scope is #238 only. No merge or deployment authority is inferred.
- Scope: one opt-in deep observation opportunity, accepted basic/deep prices, readable risk and escape, explicit surviving evidence, strict JSON-safe state and API distinctions, single employer settlement.
- Non-goals: #234 docking repair, #239 contacts/equipment, #240 double agents, broad stealth/economy changes, new keys/gauges/SKUs.
- Acceptance: all seven acceptance items in #238; before coding, resolve state/reward design and proposed playtest tuning against current code.
- Current evidence: everyday checkout clean at base; no open PR; #236/#237 merged. Existing graph available in everyday checkout; fresh worktree has no generated graph.
- Next gate: finish bounded specification and independently review immutable artifact. Implementation and its security/regression/browser gates follow only after the contract is settled.
- Rollback: design-only changes are reversible. Runtime rollout must retain compatible save backups and exact prior artifact; no runtime rollout has occurred.

## Specification handoff

Sloane froze the design at commit `79050a1fec8bebe7199f145a478ad1e2c801fedf`.
Independent Claude Quinn review is running against that immutable artifact.
Rex/Fiona is preparing the exact implementation write set while review runs;
source edits remain gated on resolution of concrete design findings.
The proposed deep tuning is 30 additional seconds, +50% frozen pay and 4/s
suspicion within 400 units; these are playtest hypotheses, not measured balance.
Dependency setup completed with `npm ci --ignore-scripts --no-audit --no-fund`.
The installed Graft tool generated the isolated worktree index successfully.

## Independent design verdict

Claude Quinn returned PASS for specification readiness on
`79050a1fec8bebe7199f145a478ad1e2c801fedf` (raw report:
`out/issue-238/design-review-1.md`). It checked baseline integration claims,
risk arithmetic, state/settlement boundaries and strict save requirements.
Coverage limit: the reviewer could not fetch the issue because its read-only
allowlist did not include gh; the seven verbatim acceptance criteria are being
added with traceability. This is a documentary gap, not a gameplay PASS.

Rex/Fiona now owns implementation. Carry-forward cautions include early parsing
and strict rejection of malformed accepted basic pay, literal v1 validation,
preserving the posted deep quote at acceptance, separate deep exposure handling,
target loss after basic, explicit API availability and the undocked shared action.
No merge or deployment has occurred or is authorized by this verdict.
