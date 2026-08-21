# Code Review: Wave 79 REP-04 design brief (design-doc review)

### Summary

Inventory cites live Wave 78-era files (sanitize shipped, hunt/passenger/explore employer +2 exist, kill writes do not). Contract and brief agree on fail-closed delta, victim-only keys, `lastAttackerOf` witness, and no `src/` this wave. First-pass Major (incident `causer` as sufficient witness) is already forbidden in both files. Second pass: brief merge table now names `standingRead` vs `npc.standingOf`. Remaining nits are copy-level.

### Re-run (after brief/contract fixes)

- No Blocker/Major still open.
- Minor Digit 9 hunt-copy gap left documented, not “fixed.”
- Contract still wins on drift.

### What's done well

- Live line numbers re-opened (`save.js` 671–691, `station.js` Digit 9 4196–4216, patrol 2777, combat 1541–1547, world incident window 1597–1604). Wave 73 inventory is not copied blindly.
- Hunt employer +2 is **not** treated as victim piracy. Overlay/ace have no rep — cited.
- Leaky `npcHit` → incident `causer` is called out; kill standing does not copy Jobs law.
- Serial plan matches the assigned order: helper → bind → copy → pins. No Wave 79 `src/` schedule.
- Espionage/war: rules cited from `docs/RepStandingDesign.md` §7, no job numbers, no `kind: 'espionage'`.
- Police/restitution named as deferred, not designed.
- `JOB_FIELD_ALLOW` has no `faction` — save cannot retarget standing via a job field.

### Findings

#### 🟠 Major: Do not treat hunt `playerDestroyedName` as the kill-write witness

**Location:** live `station.js` 2642–2647; contract §0.6 / §3.2; brief §5
**Issue:** Hunt/overlay complete on `inc.kind === 'destroyed' && inc.causer === 'player'`. World stamps that causer from **any** `npcHit` in 8 s, including NPC-vs-NPC (`world.js` 1597–1604, `combat.js` 1542). A first-pass brief that said “Witness Rule / live incident causer” without the last-attacker override would punish NPC-vs-NPC.
**Fix:** Already frozen: `lastAttackerOf === 'player'` is necessary. Incident `causer` is **not** sufficient. Brief table §5 lists the signals.

**Status:** resolved in brief/contract (this pass).

#### 🟡 Minor: Digit 9 omits hunt/passenger/explore +2

**Location:** `station.js` 1072–1081 vs 3638–3639
**Issue:** Jobs board copy names those families; Standing move notes still list mining/patrol/rescue/sale/graft only. Accurate inventory. This serial must not “fix” that copy except the kill line after a real write.
**Fix:** Leave the gap. Do not expand Digit 9 scope.

**Status:** documented in inventory §3. No brief change required.

#### 🟡 Minor: `handleDestroyed` vs combat run order

**Location:** `npc.js` 2110–2111 comment (“combat.js … runs after us”)
**Issue:** Bind-in-`handleDestroyed` still runs: same-frame emit is visible on `ctx.events`; splice backstop uses `lastEvents`. Not a double-write if the helper is only there.
**Fix:** Impl PR2 pin: one call site; `deathHandled` guard.

**Status:** contract §3.1 already single call site.

#### 💡 Suggestion: Owner question on Unknowables

**Location:** brief open Q4; `npc.js` 1321–1322 skip Unknowables crew pods
**Issue:** Pod spawn skips Unknowables; standing skip-list is independent/missing/reserved only. Consistent with `FACTIONS` having `unknowables`.
**Fix:** Leave as owner default “write if allowlisted.” Do not add a silent skip in the contract.

### Re-check vs live code (this pass)

| Claim | Live? |
|---|---|
| `sanitizeReputation` exists | **Yes** `save.js` 672–691, 865 |
| Digit 9 explain shipped | **Yes** `station.js` 4196–4216 |
| Kill standing write | **No** (grep writers on `npcDestroyed` / `handleDestroyed`) |
| `crimeScore` / `wanted` fields | **No** |
| Patrol `freehold += 5` | **Yes** 2777 |
| Hunt +2 employer | **Yes** 2658 |
| `INTENT_ORDER` leave | **No** `hail.js` 48 |
| `JOB_KINDS` espionage | **No** `save.js` 138 |
| `RANK_LADDER` six rungs | **Yes** 672–678 |
| `station.js` innerHTML | **0** |
| `'reputationChanged'` | **0** in `src/` |
| Incident default faction `independent` | **Yes** `world.js` 1609 |
| Player-only sun `applyHit` | **Yes** `combat.js` 1644–1659 |

### Contract vs brief

No remaining disagreement on persist key, fail-closed delta, skip independent, skip pirate/ace, witness, police/restitution, patrol, job kinds, innerHTML, or PR order. If they drift later, **contract wins**.
