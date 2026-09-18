# Issue #239 — contact briefings and scanner spy benefits

Implemented contract on `codex/issue-239-spy-benefits`, runtime pinned at
`c510a7e03e79b862c070c8d61889c895aab8b0e8`
(runtime source SHA-256
`55a96070fa8cd832f0135acbd31e3135ddea4a52d88c7baa89e3cf59c702f911`).

Scope is the owner-selected **contact briefing plus scanner 4 / 3.5 / 3** set
from the approved design `out/spy-design-scope/findings.md`
(SHA256 `49c70c83a8f49f6187b9cb171bb12f7e1a081e8928551cfd1553748a8002f445`) and
its design PASS. That artifact's pending-owner language is superseded by the
explicit authorization recorded in [the mission](missions/issue-239.md).

## Implemented contract

### Free flight-plan briefing from a local face

At the employer dock (`job.originSystem`) or the destination dock
(`job.destSystem`), every People card carries one extra button per accepted,
unexpired shadow assignment that dock can speak for:
`Ask about <courier> (<job id>) — free route briefing`. Adjacent card copy
states the price before the button charges it — `0 UU; no favor spent.` The job
id rides the label so two same-name postings stay distinguishable.

The brief adds exactly three route facts the posted briefing lacks, plus the
tactic they imply: the far turnaround is **1500 units** from the destination
dock along the same rendezvous line, the courier **shuttles out and back**, and
it **stops to pivot at either end** — so match its speed on the straight and
ease off when it turns rather than crowding it. All of it is static route
geometry from system data. It is not a sighting: no current position, live
target handle, arrival estimate, occluder, NPC intent or `recordId` is
disclosed, and `peekShadow`'s non-disclosure contract is unchanged.

Employer-side availability is the point — a pilot can ask before ever flying.
Destination-side availability helps reacquisition. Ordinary `Ask around`,
keeper/fence/dockmaster favors and every other People service are untouched.

The UI button and `stationAction({n, expect})` run the **same closure** and
produce the same copy; no new command, top-level observation, action schema or
contact API was added — the two derived projection fields described below are
the only observable addition. The established stale-label `expect` guard still
fails closed.

### Scanner tiers lower dossier exposure

`COURIER_SHADOW.deepSuspicionByScanner = [4, 3.5, 3]` (frozen) gives the
dossier-pursuit suspicion rate for stock / Wolfeye Mk I / Wolfeye Mk II inside
the qualifying 150–400 unit band. `deepSuspicionGain: 4` is retained as the
compatibility default. Nothing else moves: closer than 150 units still costs
10/s at **every** tier, and basic observation timing, selection, sight, hazard,
warning, grace, decay and range rules are identical at every tier.

One pure helper, `deepSuspicionGainFor(scannerTier)`, is the single rate the
integrator, the projection and all copy share. It is strict — only an in-range
integer tier selects a tuned rate, so a missing, fractional, negative,
oversized, non-numeric or non-finite tier reads as stock and a corrupt save can
never mint a cheaper pursuit. `scannerTier` arrives on the frame input from the
currently mounted `ctx.world.scanner`, supplied by **both** `shadowFrameInputs`
and the non-accepted offer input in `peekShadow`; the copy and evaluator
helpers read it only from their input and never from `ctx`.

Prices and capabilities are preserved: Mk I 400 UU, Mk II an additional 900 UU
requiring Mk I. Benefit, cost and prerequisite are stated **before** purchase on
the Mk I offer row, the Mk II offer row, and the Mk II prerequisite row a
scanner-0 pilot sees instead. The Mk II copy carries its honest limit, derived
from the tuning rather than asserted: from clean risk it can just finish one
uninterrupted 30-second attempt, but carried suspicion or any crowding can
still force a cooling break. There is no unconditional completion promise, and
the closing line scopes the new benefit to dossier exposure without denying the
eye's own established resolve, contact-duration or lock-closure capabilities.

At the production 0.1 s frame cap, a clean Mk II attempt reaches ready at
**30.1 elapsed seconds** with suspicion near **90.3** — a margin of roughly 9.7
points, less than one second of crowding at 10/s. Stock and Mk I expose before
completing 30 evidence seconds.

### Projection and terms

The existing shared shadow projection gained two derived fields,
`deep.suspicionGain` and `deep.suspicionNote`. They are published for offers
and accepted rows alike, built from the same input the terms were built from,
and they describe the rate that applies **while pursuing inside the 150–400
unit band** — they are published whether or not the pilot is in that band right
now, including before acceptance. No new top-level observation was added and no
agent-layer schema edit was needed. `stepShadow` additionally returns
`deepSuspicionGain` and `deepSuspicionNote`. One input therefore produces both
the instruction and `deep.terms`, so the Galaxy Chart's exact-string removal
still yields exactly one copy of the agreement.

### Not changed

No persisted schema, `COURIER_SHADOW.version` bump, save migration, ctx event,
agent action/observation schema, SKU, price, key binding or gauge. No edits to
`agent-schema.js`, `agent-observe.js` or `agent-api.js` were needed.

## Stale-closure safety

The briefing closure captures the face, the assignment and their identity at
paint time and trusts none of it when it fires. At execution it re-resolves the
live dock, panel, roster row and job row, requires the captured objects to
still **be** the live ones, re-checks target/`recordId`/origin/destination
identity, and re-runs the full briefing certificate — accepted state, a finite
future deadline, real origin and destination systems, a resolvable static
route, and the existing strict `sanitizeShadowState` contract validation. A
stale, ended, expired, settled, re-identified, relocated, corrupt or foreign
choice refuses with `Cannot read that flight plan now.`, which maps to the
established `Cannot …` → `unavailable` refusal token.

**Defect found and fixed during implementation.** The refusal path originally
called `render()`. A People rebuild re-resolves the roster through
`contactsForSystem`, which repairs a replacement row's banked favors — an
economy write on a path whose whole contract is that it writes nothing. Against
a same-ID replacement contact this reproduced as favors `0 → 2`. The narrow fix
is that a refusal now updates **only** the existing `.station-notice` footer
node of the panel this desk already owns, via native `textContent` with
`aria-live="polite"`, creating it at the same footer position if absent. It
performs no `render()`, no People rebuild and no `contactsForSystem` call, and
returns without touching anything while a view capture owns the builders, while
undocked, with the overlay closed, or with no rendered panel of its own — the
API receipt still carries `ui.notice` in every one of those cases. Global
`contactsForSystem` and ordinary `render()` semantics are unchanged.

## Verification evidence

Focused suites, all re-run **after** the notice fix; raw logs under
`out/issue-239/focused-*.log`:

| suite | result |
|---|---|
| `test:spy-benefits` (new; 16 groups / 32 checks) | exit 0 |
| `test:courier-shadow` (52 groups) | exit 0 |
| `test:deep-dossier` (9 groups) | exit 0 |
| `test:agent-desk` | exit 0 |
| `test:refusal-tokens` | exit 0 |

Earlier in the same implementation, `test:agent-schema`,
`test:agent-hardening`, `test:agent-gameplay`, `test:agent-playtest-fixes`,
`test:fence-marker` and `issue-207-job-abandon-test.mjs` each passed; the only
runtime change after those runs was the scoped notice fix above.

The new suite covers the strict invalid/missing tier fallback; 20 scripted
seconds of pursuit giving 80 / 70 / 60 suspicion with 19.9 evidence seconds at
every tier; unchanged 10/s crowding and unchanged basic observation at every
tier; stock and Mk I exposing while a clean Mk II reaches ready at ~90.3 with
its ~9.7 margin, which one second of prior crowding consumes; the warning
crossing on its own frame at every tier, that frame skipping its evidence and
grace integration while suspicion still integrates and already-banked evidence
is retained — which is why 20 elapsed seconds yields 19.9 evidence seconds;
gear changes altering only the next frame's rate with no evidence, suspicion,
warning or grace reset; instruction/terms parity for chart stripping;
pre-purchase UI and API parity at the real prices with the prerequisite; offer
and accepted terms tracking the live mount; free briefing at both docks with
identical copy and no minting on repeat; and reload preserving risk, evidence,
dossier phase and the mounted eye.

Refusal coverage asserts no-mutation **before** any `peekView()`/`observe()`
call, because those capture passes run `buildPanel` and would normalize the
roster themselves. It includes same-ID new-object replacement of both the job
and the contact, a departed face, a dead pilot, an undocked card and a card
fired from another service. The banked-favor case arms `favorBank` with a real
`addFavor` and keeps a positive control proving `contactsForSystem` does repair
a same-ID replacement, so the asserted `0` is a real guarantee and not an empty
bank. Reverting the refusal branch to `render()` still reproduces the original
`2 !== 0` failure.

## Limits and parked work

- **These tests are synthetic.** They drive the real pure integrator and the
  real booted desk through its own player closures, but they are not natural
  browser play.
- Root-owned gates: `npm run build` **PASS** in 10.26 s against `c510a7e0`
  (`out/issue-239/build-c510a7e.log`) and independent Codex code/security review
  **PASS** on the pinned runtime (report path forthcoming). Unchanged
  `npm run test:boot` and live browser verification remain **pending**; their
  receipts are not in hand and are not claimed. `test:boot` itself is
  unchanged.
- The station view caps every notice at 240 characters. The full briefing is
  returned by the `stationAction` receipt and rendered on the native notice
  node; no claim is made that the truncated `observe().station.view.notice`
  contains the whole tactic. All outfitting note rows are at or under the cap
  and are tested for verbatim UI/API parity.
- The mounted-gear no-reset coverage uses synthetic tier changes and save
  restore. It is not a claim about an actual natural hangar swap.
- The concealed-mounts spy role is explicitly parked: no supporting inspection
  path exists in current code and none was invented.
- #240 employer/competitor evidence conflict stays parked and separate.
- Tuning remains provisional playtest balance, not a measured conclusion.
- Merge is authorized by the owner once the required gates pass, and root and
  Owen execute it. No merge, push or deployment has been performed here.

## Security self-review

No secrets, credentials or model runner enter the bundle. No new ctx event,
persisted field, save format, schema or SKU. All world and content strings go
through text-safe DOM APIs (`textContent`); the one native DOM write is the
refusal notice, which sets `textContent` on a node this desk owns and is
guarded against capture passes, undocked state and a missing panel. Inputs are
validated strictly: scanner tiers fall back to stock on anything but an
in-range integer, and briefing closures re-verify live identity and the full
contract before answering. The new briefing callback adds no economy, progress or
mission-risk mutation on either its success or its refusal path; ordinary
rendering and the existing `peekView`/capture roster normalization are
unchanged, and no universal purity claim is made for every observation path.
No high or critical finding is open in this builder review.

## Rollback

Plain commit revert. No persisted field, version or save format changed, so no
save migration is required for downgrade. Deployment backup policy is not
waived here and is not this document's to decide.
