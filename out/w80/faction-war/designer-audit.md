## UI Audit: Digit 2 war cards (`src/systems/station.js` `renderJobs`)

### Summary
War cards on the Jobs board name the quarry, dest station, dest flag, employer, pay, and remaining time before Accept. Copy uses Strike / witnessed kill, not spy “file here”. `h()` writes `textContent` only. Rec-n / system keys / clue ids do not appear on the card. Empty dest-bank slots omit the row; the board stays coherent. Verdict: **clean**.

### What's done well
- Title is `Strike <name>` from `warCardName`, which prefers the live record name, then `job.target`, then `'the marked patrol'`. Names matching `rec-(n)` never render (`src/systems/station.js:2918-2923`, `4413-4424`).
- Detail names dest **station** (not a system key), dest **faction display name**, and **employer display name**, plus “pays on a witnessed kill” — hunt’s dock-pay cadence, war’s dest-patrol facts (`4417-4425` vs hunt `4384-4389`).
- Reward line restates quarry + dest station + UU. Offered quotes origin `jobPayFor`; accepted uses `payQuoted` (`4510-4520`).
- Offered rows show `miningTimeLeftLabel` next to Accept; accepted rows append the same clock (`4531-4535`, `4602-4606`). `makeWarJob` stamps `deadline` at post time (`3002`), so time is visible **before** Accept.
- Accepted copy is `ACCEPTED — strike <name>` (`4602-4606`). Espionage still says “file at …” (`4507-4509`, `4590-4600`). War does not.
- Complete is space-side (`warPayComplete` / tick witness). The card has no Complete / redock / two-dock file control.
- `boardJobs` hides foreign **offered** war; **accepted** war stays on every board (`3186-3188`). `acceptJob` refuses unless `currentSystem === originSystem` (`4296-4299`). Digit Accept uses the same `boardJobs` list (`5208-5211`).
- `factionDisplayName` returns authored `FACTIONS[key].name` or `''`, never the key (`1043-1048`). Dest fallback is `'the far dock'` (`4417-4419`, `4514-4516`).
- Empty dest bank: `pickWarQuarry` / `syncWarJobs` stop when no eligible patrol (`3047-3057`). No ghost slot, no placeholder, no rec-n stub. Other families still fill Digit 2.
- DOM: `h()` sets `textContent` (`3842-3847`). War title / detail / reward / state all go through `h(...)`.

### Findings

No blocker. No major.

#### 🟡 Minor: accepted state line drops dest
**Location:** `src/systems/station.js:4602-4606`
**Issue:** Hunt restates location on the ACCEPTED line (`hunt <name> in this system`, `4569-4573`). War ACCEPTED is quarry-only (`strike <name> · t left`). Title / detail / reward still name dest, so a player who reads the whole card is fine. A player who scans only the warm ACCEPTED line at a **foreign** dock (accepted cards are visible everywhere) does not see dest on that line.
**Fix:** Mirror the reward clause: `ACCEPTED — strike <name> at <destName>`. Keep the time suffix.

#### 🟡 Minor: “patrols dest for Faction” can read as employer
**Location:** `src/systems/station.js:4420-4425`
**Issue:** `flagLine` is ` for ${targetName}`. Full detail: `<name> patrols <destStation> for <destFaction>. <employer> pays on a witnessed kill.` “For X” often means who hired the ship. The next sentence names the payer, so it parses, but dest flag vs job employer is the one fact hunt does not have to teach.
**Fix:** Prefer `<name>, a <destFaction> patrol at <destStation>. <employer> pays on a witnessed kill.`

#### 💡 Suggestion: location copy ignores live `rec.system`
**Location:** `src/systems/station.js:4413-4425`, `4510-4520`, `2938-2952`
**Issue:** Eligibility allows a dest-faction patrol in origin **or** dest. Copy always says the dest station. If the bound quarry is in origin space, the card still says strike at dest. Hunt always binds “this system” to the local pirate. This is rare (dest bank is preferred) and the **name** still identifies who to kill.
**Fix:** If `rec.system === origin`, say the origin station / “this system”; otherwise dest. Or say “dest-faction patrol” without pinning the station.

#### 💡 Suggestion: employer lives on detail only
**Location:** `src/systems/station.js:4420-4425`
**Issue:** Title is quarry-only. Employer is the last clause of detail. Matches hunt (quarry in title, payer in detail). Digit 2 is already dense.
**Why not fix now:** Hunt parity. Detail is visible before Accept.

### Focus checklist

| Question | Result |
| --- | --- |
| Who to kill before Accept? | Yes — title + detail + reward use `warCardName`. Fallback `'the marked patrol'` if the live name is missing or looks like `rec-n`. |
| Where? | Yes — dest **station** display name in detail and reward. Not a system key. |
| Pay? | Yes — `Strike … — pays N UU`. |
| Time? | Yes — `Xm left` / `Ns left` on offered and accepted. |
| Employer? | Yes — detail `<employer> pays on a witnessed kill.` Display name, not faction key. |
| rec-n / system keys / clue ids? | Not on the card. `job.id` (`war-<sys>-n`) and `recordId` are not rendered. Clue ids are not used. Accept notice uses snapshot `job.title` (`4345`), which `makeWarJob` fills from `warDisplayName` (`2982-2996`); live card title still goes through `warCardName`. |
| Hunt vs war? | Hunt = local pirate, “this system”, dock pays. War = dest-faction patrol, dest station + dest flag, origin employer pays. Verbs Hunt vs Strike. Fallbacks reaver vs patrol. |
| Empty dest-bank slot? | No row. No empty-state line. Board still has ace / patrol / haul / ferry and other renewables. Same omission pattern as hunt with no pirate. |
| Spy “file here” Major? | Does not repeat. War never says file / redock here / file at home. |

### Playwright
[NO BROWSER COVERAGE] — source audit only. No product UI was edited.

### Verdict
**clean**
