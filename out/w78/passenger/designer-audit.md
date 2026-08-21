## UI Audit: Digit 2 Jobs — passenger escort (Wave 78)

**Scope:** `renderJobs` passenger branch only. Digit 2. No new Digit. Hunt cards and unique ferry must still render. HUD-02 closed.
**Method:** Parent `[designer]` pass. `orchestrator/references/ui-audit.md`. Review only; no product source edits.
**Date:** 2026-08-21

### Summary
Passenger cards reuse live `job-card` chrome: title, detail, origin quote, Accept, remaining time. Dest copy comes from `otherSystemId` plus `SYSTEMS` station names, never a raw `destSystem` key. Hunt siblings and unique `ferry-consignment` stay on the same board. No Blocker or Major findings.

### What's done well
- Passenger stays inside `renderJobs`. Digit 2 is still Jobs (`DOCK_KEY_SERVICES[1] === 'jobs'`). No HUD passenger glance (`hud.js` has no `passenger` string). `src/systems/station.js:152`, `3387-3399`, `3993-3995`, `4034-4038`, `4122-4129`.
- Cards reuse `.job-card` / `.job-title` / `.job-detail` / `.job-reward` / `.job-state` / `.job-accepted` / `.screen-btn`. No passenger-only hex colors or extra animation. `src/ui/screens.css:230-272`, `src/systems/station.js:3401-3562`.
- Title, detail, reward, and accepted line rebuild from templates. Dest id is `otherSystemId(ctx, originId)`; display name is `passengerStationName` (`SYSTEMS[sysId].station?.name ?? SYSTEMS[sysId].name`) with fail-closed `'the far station'`. Authored dests read as `Freehold Landing` / `Veridian Spire`, not `freehold` / `veridian`. `station.js:1717-1719`, `2363-2366`, `3425-3430`, `3490-3497`, `3549-3555`.
- Offered: real `<button type="button">` labeled `Accept (n)` plus `miningTimeLeftLabel`. Hover and `:focus-visible` rings stay on `.screen-btn`. `station.js:2989-3000`, `1987-1996`, `3506-3511`; `screens.css:88-100`, `256-258`.
- Accepted: `ACCEPTED — dock at <dest>` plus ` · t left` when the deadline is finite. Class `job-state job-accepted` (amber `var(--rw-warm)`). `station.js:3549-3559`; `screens.css:261-267`.
- Reward uses origin `jobPayFor(..., FERRY_REWARD)` while offered and stamped `payQuoted` when accepted. `station.js:3490-3497`, `3370-3372`.
- Copy is escort language: `Escort passengers`, `Carry a booked party to <dest>`, `Escort to <dest> — pays <est> UU`. No survivor, cargo, hold, slave, stock, or meat voice. Accepted passenger has no `(have N)` cargo line (trade still does). `station.js:3429-3430`, `3497`, `3534-3543`, `3549-3555`.
- `h()` sets `textContent` only. No `innerHTML` in `station.js`. Dest names never interpolate `job.destSystem` as a raw key.
- Hunt still has its own title/detail/reward/accepted branches and `syncHuntJobs` still runs before passenger. Overlay pirate rows and unique ace stay sibling `job-card`s. `station.js:3398`, `3419-3424`, `3479-3489`, `3502-3505`, `3544-3548`.
- Unique ferry stays a unique card: id `ferry-consignment`, kind `'ferry'`, title `Ferry a consignment`, reward `Ferry ${FERRY_UNITS} fronted Provisions…`. Passenger kind `'passenger'` does not steal that chrome. `station.js:1756-1761`, `3448-3455`, `3519-3521`.
- Offered passenger is home-only via `boardJobs`. Accepted passenger still shows at other docks. `acceptJob` also refuses a foreign origin. `station.js:2530`, `3344-3352`.
- Jobs note states passenger credits the dock flag (`+2`) with mining and hunt. `station.js:3391-3392`.
- `reducedMotion`: passenger copy is static. No passenger animation in `renderJobs`. No `@keyframes` on `.job-card`.
- HUD-02 stays closed. No new Digit.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** `src/systems/station.js:3507`, `4158-4160`
**Issue:** Unique four + overlay cap + mining + trade + hunt + two passenger can push Accept past Digit 9. Digit keys index `boardJobs()[n - 1]` only.
**Fix:** Keep two passenger slots. Mouse Accept still binds the job object (`() => acceptJob(job)`). Existing UX; not a reason to cut slots (contract §12.2).
**Status:** open (document; do not cut slots)

#### 🟡 Minor: Two offered passenger cards share the same title, dest, and pay
**Location:** `src/systems/station.js:3425-3430`, `3490-3497`
**Issue:** Both slots use `Escort passengers` and the same `otherSystemId` dest. Mining names ore, trade names cargo, hunt names the quarry. Passenger cards differ only by `Accept (n)` and remaining time. A player can treat them as one posting.
**Fix:** Optional later: a one-word party tag on the title row (`Party 1` / slot). Not required for first impl; both jobs are equivalent escort contracts.
**Status:** open (nice to have)

#### 💡 Suggestion: Standing note now lists passenger with mining and hunt
**Location:** `src/systems/station.js:3391-3392`
**Issue:** Players see mining, hunt, and passenger share employer standing. Patrol still names Freehold. Hierarchy is clear.
**Fix:** None.
**Status:** accepted copy

### Passed checks
- Contrast: `.job-title` `#e6eef7` and `.job-detail` `#9fb2c6` on `.job-card` `#0d1522` meet WCAG AA (detail ~8:1). High-contrast mode already lifts `.job-detail` (`screens.css:557-559`). Reward uses `var(--rw-good)`; accepted state uses `var(--rw-warm)`.
- Focus: Accept is a native button; `.screen-btn:focus-visible` outline 2px `var(--rw-accent)`.
- Keyboard: Digit 2 opens Jobs. Digit 1–9 accept offered rows 0–8. Tab + Enter/Space on Accept. Mouse Accept works past index 8.
- States: offered (Accept + time), accepted (amber state + time), empty slot (no card if no dest), refuse notices (`Take that contract at the posting dock.`, `That posting has no far dock.`, `That posting is not valid.`).
- XSS: `h()` sets `textContent` only. Dest names come from `SYSTEMS`, then `'the far station'`. UI never prints a raw `destSystem` id.
- Theming: no passenger one-off colors.
- Hierarchy: `Escort passengers` vs unique `Ferry a consignment` vs `Hunt <name>` vs overlay `Bounty:`.
- `reducedMotion`: no extra passenger animation.
- Hunt cards still render. Unique ferry still a unique `kind: 'ferry'` card. Digit 2 only. HUD-02 closed.

### Verdict
CLEAN for designer purposes. 0 Blocker, 0 Major, 2 Minor, 1 Suggestion.
