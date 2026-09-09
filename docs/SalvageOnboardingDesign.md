# First salvage opportunity — issue #74

The chosen entry point is Jobs, available to a stock Greenhand. Short SALVAGE
rows above the numbered cards explain whether recovery work is posted and
how to search when none exists. They use the board's existing text-safe
render/capture path, so a human and a public controller read the same lead.
Each row fits the station observation's 240-character text limit.

No local recovery is a legitimate outcome. The suggested bounded search is
ordinary station-to-gate traffic/pods, then Jobs at the next dock; if nothing
appears, choose other work. This is explicitly a search route, not a report
that a wreck exists. It does not guarantee a spawn rate, income, or upgrade.
Historical bar rumors, decorative wreck landmarks and escape wakes are not
turned into fabricated salvage opportunities. Actual NPC destruction remains
the source of the real wreck aftermath that backs recovery cards.

For an available card, accept with two free hold units, launch, follow the
Recovery pod flight diamond, approach slowly to scoop, and return to the
issuing dock for payment. The public objective uses the same pod's range and
ship-local bearing even beyond normal nearby-contact range. No new helm,
control key, scanner requirement, gauge or equipment SKU is involved. Other
salvage cargo goes to Market; survivor disposition retains the People rules.

## Correctness boundary

Acceptance revalidates the actual wreck's identity, kind, origin system,
position and expiry as well as the open offer and available hold capacity.
A closed, foreign or expired posting refuses without another marker. The
existing job deadline becomes the earlier of wreck expiry and acceptance plus
300 world seconds. No payout or multiplier changes are made.

A session-only map binds each accepted job to its exact spawned pod object.
An unrelated `podCollected` cannot credit it, and one recovery cannot credit
another. Event timestamps handle a legitimate collection just before deadline
even when the station sees that event on the following frame. Pods at or after
the deadline cannot be collected. A full hold leaves the complete pod intact.

Only existing job fields persist: ID, wreck ID, origin, collected flag, state,
and deadline. Uncollected markers re-derive from that same still-live wreck
with remaining lifetime, without resetting the deadline or creating copies.
A same-context restore replaces job identity and invalidates discarded
timeline markers and collection events. Collected markers never respawn;
collected and paid jobs survive restore and pay only once at the issuing dock.
Legacy accepted jobs without a deadline fail explicitly. Collection/expiry
request autosave using the existing encounter, mid-jump and storage retry
rules. This is no new promise of storage durability.

## Build constraint and bounded maintenance

The base production JavaScript was 1,799,951 bytes against a 1,800,000-byte
limit. To fit this outcome without raising the budget, repeated station
slot getters, occupancy predicates, detach/replacement preconditions, four
identical slot-filling loops, four identical delivery-standing blocks, and
the offered-kind board filter share their existing logic. Per-family
eligibility, expiry, rates and exceptions remain. Full boot and the existing
job-family regressions guard this mechanical deduplication. No world spawn or
economy table changed.

## Verification contract

- `npm run test:salvage-onboarding` exercises controlled offer/acceptance,
  capacity, exact attribution, concurrent markers, expiry boundaries,
  floating times, deadline-preserving restore, legacy failure and payment.
- `npm run test:salvage-live` uses explicitly labelled injected
  destruction-event/aftermath fixtures for a recovery beyond nearby range, public
  steering, visible marker parity, collection/disposition and reload.
- `npm run test:salvage-natural-live` runs independent fresh Greenhand browser
  profiles using native RNG on the same bounded starting route. It records
  availability and active search separately from travel and non-search
  setup/inspection/controller overhead.
  Natural opportunity absence must be reported honestly; fixture results do
  not establish natural frequency or first-session profitability.
- Production build, full boot, relevant regressions, browser layout and
  console checks, and independent QA must pass before delivery is approved.

Local evidence is in `out/issue-74-evidence/` in the main checkout. Verification
results and availability timings are finalized in the issue handoff; this
design does not itself assert that a natural opportunity was observed.

At the automated handoff, production build passes at 1,799,979 JavaScript
bytes / 524.30 KiB gzip with both existing budgets unchanged. Full boot passes,
including its recovery and other mission-family checks. The 23 focused recovery
pins, agent schema/hardening, dock persistence, survey navigation and passenger
commitment policy checks pass. Root logs are `final-build.log`, `final-boot.log`
and the accompanying `final-*.log` files. The final recovery reward-row display
uses the issuing dock's rate even at another station: a generated 1.15-rate
issuer shows 345 UU at a 1.20-rate foreign dock. Final UI evidence is in
`foreign-card-build.log`, `focused-final-ui.log` and
`FOREIGN-CARD-UI-SUPPLEMENT.md`; the latter proves the one-line display change
from the prior tested source by exact hash reversal. Settlement is unchanged.
Live lifecycle/natural routes and independent QA remain pending at this handoff.
