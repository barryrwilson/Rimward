# Code Review: MSN-02 renewable faction-against-faction operations (Wave 79)

### Summary

Markdown-only design freeze. Inventory cites live Wave 78 jobs (`JOB_KINDS` without `'war'`; cap `4+10*N+16` = 1020 at 100). Merge law matches hunt-contract shape. Kind `'war'`, `WAR_ROOM` only, employer +2, target write fail-closed, unique ace untouched. One first-draft Blocker (origin-dock AND incident ring) and one Major (kind-token typo `war'`) were fixed in the brief/contract. No `src/` in this worker.

Persona: orchestrator `code-review.md`. Nested subagents are forbidden. UI audit is not applicable.

---

## Code Review: war brief / contract / inventory

### What's done well

- Live inventory uses current `save.js` / `station.js` line numbers (Wave 78 hunt/passenger/explore present). Code wins.
- Kind `'war'` is unused; justification vs hunt/bounty/patrol is explicit.
- Cap formula adds **only** `WAR_ROOM`. Espionage sibling is named, not numbered.
- Target faction binds from `SYSTEMS[warDestId].faction`, not `job.faction`.
- Named Guns / unique `bounty-ace` / hunt pirates are excluded from quarry eligibility.
- Serial PR plan is sanitize → sync → complete/expire → Digit 2 UI → boot pins. No `src` this wave.
- Employer delta cites live `MINING_REP` +2. Target delta is fail-closed with candidate 2 marked unshippable.
- Pay cites live `PATROL_REWARD` 300, clamp 0…20000. No new UU table. No kill UU.

### Findings

#### 🔴 Blocker: (none open)

First-draft Blocker **origin-dock AND witness** would fail honest dest kills when `MAX_INCIDENTS` 40 shifts the row. **Fixed:** space-side hunt cadence; do not trust stuffed `progress`; do not invent a visited key.

#### 🟠 Major: (none open)

First-draft Major **kind-token typo** in the brief merge table (`**\`war'\``) would freeze the wrong token. **Fixed:** `kind: 'war'`.

Stale “origin dock claim” lines in contract §5 and brief regression table would fight §3.6. **Fixed.**

#### 🟡 Minor: Same-faction generated gates starve slots

**Location:** contract §3.3 `warDestId`; inventory §5.1  
**Issue:** If every gate neighbor shares the origin faction, `warDestId` returns null and both slots stay empty.  
**Why it matters:** Some generated clusters may post zero war cards.  
**Fix:** Empty slots are already legal (contract §0.5 / §12.2). Do not invent a galaxy-wide rival table. Not blocking PR1.

#### 🟡 Minor: `cast.patrols === 0` until dest bank exists

**Location:** Verge/Hush `authored-systems.js` 179, 212; contract §3.4  
**Issue:** No origin rival patrol; dest bank missing until first visit.  
**Why it matters:** First-time Verge board has no war cards. Hunt already starves Verge’s second hunt slot.  
**Fix:** Default empty. Do not `ensureBank` from Jobs.

#### 💡 Suggestion: Jobs note line still omits war

**Location:** `station.js` 3638–3639 (live copy lists mining/hunt/passenger/explore + patrol)  
**Issue:** PR4 should extend that `textContent` note to mention dock-flag +2 for war, without copying Freehold patrol.  
**Fix:** Named in PR4 UI; not this wave.

### Contract vs brief vs inventory

| Check | Result |
|---|---|
| Kind unused | PASS — `JOB_KINDS` `save.js` 138 has no `'war'` |
| Unique ace untouched | PASS — contract §0.4 / §2.4 |
| Cap adds only war room | PASS — `live + WAR_ROOM`; no espionage term |
| Employer +2 live | PASS — `MINING_REP` `station.js` 194 |
| Target delta fail-closed | PASS — contract §0.11 / §5 |
| No kill UU | PASS — witness + record only |
| No `src/` this wave | PASS |
| Hunt-contract shape | PASS — §§0–13 mirror hunt |
| Digit 2 / no `innerHTML` | PASS |
| `state.js` READ-ONLY | PASS |
| Hyphen ids `war-<sys>-<n>` | PASS |
| `payQuoted` 0…20000 | PASS |
| 600 s fail-closed | PASS |
| `WAR_SLOTS_PER_SYSTEM = 2` | PASS |

### Resolved vs open

- **Resolved Blocker/Major this pass:** 1 Blocker, 2 Major (typo + stale origin-dock lines).
- **Open:** 0 Blocker/Major. Two Minors are documented defaults (empty slots).

No further design-doc edits required for Blocker/Major.
