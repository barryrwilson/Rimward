# Wave 122 remaining REP leftover notes

**Verdict:** leftover **CONSUME**. Name: **no remaining REP leftover.** Named serial: **none**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (no active workflow). Resolution id `r-mt90us9z-d5f24651`. Did **not** `graph_approve` / `graph_propose`.
- Read live Digit 9 Standing / restitution / covering / jump / climb copy in `station.js`.
- Read `standingRead` (`data-trade.js`); **no** `src/game/reputation.js`.
- Read patrol spawn `world.js` **374–385**.
- Read hunt `npc.js` `standingOf` / `mayHuntPlayer`; ticks `tickPoliceLeave` / `tickPoliceCover` / `findCoveringWork`.
- Read `hail.js` `INTENT_ORDER` (no leave verb).
- Read `police-leave.js`, `police-cover.js`, `jump.js`, `kill-standing.js`, `restitution.js`.
- Read spy/war dest −2 in `station.js` (no `jobs-war.js` / `jobs-espionage.js` modules).
- Read `save.js` `WORLD_FIELDS` + `sanitizeReputation`.
- Cite boot WAVE74 / 82 / 83 / 104 / 111 (read only). WAVE107 labeled block is BIO-06; Digit 9 consequence copy still live in `standingLiveNotes`. WAVE95 labeled block absent; leave still live and WAVE104 pins the line.
- Honor: wishlist REP; RepStanding / Rep03 / Rep04 / Rep05; Owner 82/93/112 — cite, do not edit.
- Code wins over stale “Patrol remains Freehold until a named serial” **as police spawn**.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why CONSUME

Named slices are live:

- Digit 9 Standing explain + restitution 1200 + climb copy + leave/covering/jump copy.
- Kill victim −5.
- Police leave `Leave this space.` band `< 0` and `> −10`, 300 u, once/visit, `commLine`.
- Covering Known 10 `Patrol covering.`
- Inbound dest `< −25` `No passage.`; dock open.
- Spy expose dest −2 on accepted lapse; war success dest −2.

NPC police hole (example REAL) is **closed**:

- Spawn: `faction: i === 0 ? def.faction : otherFaction` (`world.js` **379**).
- Leave / covering: `systemFactionOf` + `isLocalSystemPatrol`.
- Hunt: hull faction via `standingOf`.

Patrol **job** Compact +5 is **not** that hole. Digit 9 and WAVE111 `copyHonesty` (`/Freehold Compact only/`) freeze it as live Compact unique-four. Owner Wave 73: do not silently retarget. Owner test: patrol-employer live **or skippable**. Census: **skippable**.

Rejected as invented work (not a named serial): hail leave card, `world.wanted`, patrol-employer PR1, new Digit, new persist key, penance `kind`, UU invention, `standingOf` rewrite.

## This pack

Markdown only:

- `docs/Rep06RemainingRepDesign.md`
- `out/w122/represt/**`

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave122.md`. Did not steal `out/w122/navrest/**`, `out/w122/tgtrest/**`, `out/w111/**`, `out/w107/**`, `out/w104/**`, `out/w74/**`.

## Reviews

- Security: self-applied auditor + security-review.md. No CRITICAL/HIGH. Re-review after lock: clean.
- Code/design-doc: self-applied code-review.md. No Blocker/Major. Minors accepted (stale RepStanding later-serial sentence; WAVE95 pin label missing; `standingOf` vs `standingRead`).
- UI: self-applied ui-audit.md. No Blocker/Major. Specified later UI is live Digit 9 / commLine; CONSUME adds none.

## Processes

Started none. No Vite. No Chrome.

## Coupling for orchestrator

Do **not** implement. NAV rest / TGT rest siblings own those trees. This leftover cited patrol/hail/Digit 9 only. Do not schedule PR1 `patrol-employer-faction`. Serial **none**.
