# Courier shadowing design review and handoff

Stage: design review complete; owner implementation-scope approval pending.
This record supersedes the pending-review status in the frozen design document.

## Reviewed artifact

- Contract: [Courier shadowing and suspicion](Issue236237CourierShadowingDesign.md).
- Exact reviewed commit: `45f08800c701578f94820604338fb8d4b5049eed`.
- Gameplay source base: `83ec515879ed116621ff843ddc382e341047e364`, unchanged.
- Specification author: Codex agent in Sloane role, with separate lifecycle and player-feedback discovery agents.
- Independent reviewer: Claude Code in Quinn/Knox roles, read-only.
- Verdict: **PASS for design readiness and owner scope approval**, not gameplay QA.
- Review date: 2026-09-17 UTC.

The first review identified slot allocation, introductory-job isolation, save bounds,
creation lifecycle and public rendezvous gaps. The second review closed those
findings and identified an unsafe station-to-gate route. The final review accepted
the perpendicular route and its full observation-envelope clearance contract.
The reviewer checked gate clearance across all seven authored systems; generated
systems, actual motion, complete obstruction checks and playability remain
implementation evidence requirements.

## Non-blocking implementation clarifications

Carry these three reviewer notes into the first implementation handoff:

1. LOS blocker tests use synthetic geometry: a fully certified route keeps static
   blockers outside the observation envelope. Do not claim those tests are a
   natural live occlusion reproduction.
2. Expired unaccepted offers become `failed` and use “Shadow posting withdrawn”
   before normal replacement. They never apply standing or payment effects.
3. “Every gate” clearance includes hub gate bodies, using their actual bounds.

These clarifications add no saved fields, events or player actions. The contract
file remains byte-for-byte as independently reviewed.

## Approval and next owner

The owner selected #236/#237, but #236 separately requires: “Name any necessary
schema/event additions in the design and obtain explicit scope before implementation.”
The approval block at the end of the contract now names those additions: the
`courier-shadow` subtype, separate capacity, `mission` and six `shadow` fields,
bounded courier identity, read-only API projection, lifecycle guards, LOS and
provisional tuning. No new event vocabulary is proposed.

Upon that scope approval, Rex/Fiona implements on an isolated branch, followed by
independent exact-commit review, build, unchanged boot and natural live-browser
flows. No product code, implementation test, merge or deployment is part of this
design result. #236/#237 remain open; #238 stays parked. Provisional tuning and
the existing #234 docking failure can affect the required end-to-end playtest.

Local raw reviewer reports and transcripts are retained under
`out/issue-236-237/review-{1,2,3}.{md,jsonl}`; these ignored artifacts are not
repository deliverables. This committed record preserves the verdict and limits.
