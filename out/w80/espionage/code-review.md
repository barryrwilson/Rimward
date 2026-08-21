## Code Review: MSN-02 renewable espionage (Wave 80 re-dispatch)

### Summary
Accepted spy cards now name the home dock. Missing `payQuoted` on the reward line uses origin `jobPayFor(explorePayBase())` like explore. WAVE80 REP-04 `bioPodStay` no longer forbids `'espionage'` strings.

### What's done well
- Accepted reward: `File intel from ${destName} at ${homeName}`.
- Accepted state: `gather at ${destName} then file at ${homeName}` and `intel aboard — file at ${homeName}`.
- Offered origin reward may still say “here”.
- Complete tick still fail-closes missing `payQuoted` to 0. UI fallback does not change that pay path.
- `bioPodStay` still pins BIO/POD numbers, patrol `freehold +=`, and no `kind: 'war'`.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: Dest eligibility is duplicated
**Location:** `src/game/save.js` `espionageDestEligible`; `src/systems/station.js` `espionageDestEligible`
**Issue:** Two copies of the rival-station rule.
**Fix:** Optional later extract.

### Test coverage
- Isolated pin-check PASS, including `acceptedNamesHome`, `acceptedNoFileHere`, `acceptedPayFallback`.
- Source grep: no `then file here` / `intel aboard — file here` in `station.js`.
- WAVE80 ESPIONAGE harness pins now include the home-dock copy strings.

### Verdict
Ship. Designer Major is fixed. No new Blocker/Major.
