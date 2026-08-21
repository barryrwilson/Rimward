## Code Review: MSN-02 renewable faction-war (Wave 80)

### Summary
First impl matches merge law: kind `'war'`, ids `war-<sys>-<n>`, two slots, one-in-one-out, rival-gate dest, dest-faction patrol quarry, origin `payQuoted` from `PATROL_REWARD`, space-side witness complete, employer +2, target 0. Hunt family and unique ace stay. Cap is live (incl. espionage room) plus war room only.

### What's done well
- Sanitize walks `Object.keys` / index `for`. Fresh job literals. Cap drop order puts extra war after extra spy, then done/failed families, then last-resort that keeps honest offered spy and war.
- `warDestId` walks live gates for the first rival with a station. Tick/accept/UI rebind that dest.
- Quarry eligibility is `role === 'patrol'`, not pirate, not ace, not Named Gun names, dest-faction only, existing banks only (no `ensureBank`).
- Complete copies hunt cadence: incident `destroyed` + `causer === 'player'` + record dead/captured. No origin-dock AND. `failed` before pay.
- Unique haul dest bind and unique four ids are untouched.

### Findings

No blocking product findings. WAVE80 WAR boot object is all true. Isolated pin-check PASS.

#### 🟡 Minor: dest-bank preference can starve origin rival patrols
**Location:** `src/systems/station.js` `pickWarQuarry`
**Issue:** Dest bank is scanned first. After a dest visit, both slots can bind dest-home patrols and leave origin-bank dest-faction patrols unused.
**Why not block:** Contract allows origin or dest existing banks. Empty slots remain legal. Complete still replaces.

### Verdict
Approve for Wave 80 first impl. Do not treat WAVE4 / WAVE26 / WAVE35 / WAVE78 passenger known FAILs as war bugs.
