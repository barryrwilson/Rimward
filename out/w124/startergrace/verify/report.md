# Wave 124 AI-05 starter grace / hostility pacing — verifier report

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` first `blocked_ambiguous` (`r-mt983rw2-e0908fbf`) against unrelated open-knowledge / automation / computer-use workflows (coverage 0.07). Second call `proceed_unmodeled` (`r-mt984899-c957bdfc`), agent `codex/agent-codex`, namespace `codex`. Did not `graph_approve` / `graph_propose`.  
**Verdict:** **CLEAN**

## Status

CLEAN

## What I tested

1. Inventory vs live `npc.js` (`playerInterestChance`, acquire, `alwaysHuntsPlayer`), `world.js`, `origins.js`, `JUMP.graceSeconds`.
2. Leftover identity: REAL, not CONSUME; hop grace is 60 s only; no extra starter window in `src/`.
3. Pack write-set: markdown only. `git status --short` on `src/` empty. No Vite / Chrome started.
4. Honor paths: pack cites and does not edit wishlist / `PROGRESS.md` / `docs/Ctl*` / `docs/OwnerDecisions*`. `docs/OwnerDecisionsWave124.md` absent.
5. Later write-set freeze: `npc.js` first; `world.js` only if spawn stamp needed; default PR1 no `world.js`. Forbidden: `controls.js`, `save.js` berth/recover, `overlay-policy.js`, hail cards.
6. AI-04 who unchanged. Dresk extra starter bypass; hop + death delay; do not cancel.
7. Contract wins vs brief. Deputize 180 / 90 / 0 extra named; not treated as impl bugs.
8. Tamper: non-finite timers grant no extra grace (contract §0.13). No new persist key. Hop clamp `now + 180`.
9. Flags: CONSUME, `src/` written, hail-card steal, god-mode persist key, Digit steal, sibling pack mix.

Non-blocking observation (not a pack invert): live ace `updateDuel` has no scratch override. Scratch lives in `updateHunt` **1736–1761**. PR1 that gates the duel hop site the same way as live hop will keep Illyx quiet under fire until the window ends, matching hop-60 today. Contract §0.19 fire-first is hunt-path legal; implementer must not invent a duel scratch in `physics.js` / hail cards.

## Bugs found

None. Leftover is **REAL**. Named serial **PR1 starter-grace**. Not CONSUME. Serial is not none.

## Environmental issues

- Working tree also has `docs/PLAYER-EXPERIENCE-WISHLIST.md` and `PROGRESS.md` modified. Diff is Wave 123 leftover census plus 2026-08-25 playtest INBOX capture. Those paths are **not** this worker’s files. Inbox P0 starter-grace item remains INBOX at **133–139**.
- Sibling packs exist on disk: `out/w124/berthfreeze/**` + `docs/Ctl03BerthFreezeDesign.md`; `out/w124/menuinput/**` + `docs/Ctl04MenuInputDesign.md`. This pack cites them as **do not steal** and did not write those paths.
- Graph first resolve was `blocked_ambiguous` on unrelated catalog hits. Second resolve `proceed_unmodeled`. No binding execute_workflows stack.

## Evidence

### 1. Write-set

`git status --short` on scoped paths:

- Worker pack: `docs/Ai05StarterGraceDesign.md` (untracked) + `out/w124/startergrace/**` (untracked: inventory, contract, notes, security-review, code-review, ui-audit).
- No `src/` change. No `scripts/` change. No `index.html` / `package.json` change.
- Honor: pack files do not include wishlist / `PROGRESS.md` / `docs/Ctl*.md` / `docs/OwnerDecisions*.md`. `docs/OwnerDecisionsWave124.md` is absent.
- Sibling Wave 124 packs exist; not this write-set.

### 2. Status / leftover line / serial / name

| Surface | Leftover | Named serial | Name |
|---|---|---|---|
| Brief Status row | leftover **REAL** | **PR1 starter-grace** | starter time grace + death cooldown |
| Contract header | **REAL.** Not CONSUME. Serial is **not** none | **PR1 starter-grace** | hostility pacing (when / how often / how close to home) |
| Inventory §0 | **REAL.** Do not freeze CONSUME | **PR1 starter-grace** | AI-05 starter grace / hostility pacing |
| Notes | leftover **REAL** | **PR1 starter-grace** | same |

Brief and contract leftover lines match. CONSUME path is documented as the unexpected census result and **not** taken.

### 3. Inventory vs live (data)

`grep starterGrace|deathGrace|deathCalm` in `src/**/*.js`: **0**.

| Claim | Live |
|---|---|
| `JUMP.graceSeconds` **60** `state.js` **588** | `graceSeconds: 60, // no hostile intent on arrival or new-game start (covers a gate hop)` |
| Origin stamp `origins.js` **116–123** | `jumpGraceUntil = (world.time \|\| 0) + JUMP.graceSeconds` at **120**; unpause **122** |
| Gate arrival `jump.js` **162** | `jumpGraceUntil = ctx.world.time + JUMP.graceSeconds` |
| `U.ENCOUNTER_BUBBLE` **800** `state.js` **27** | live |
| `LAW_ZONE_RADIUS` **300** `npc.js` **97** | live |
| `DEMAND_COOLDOWN` **300** `npc.js` **107** | live |
| Interest header **148–154**; `INTEREST` **155–163** | base 0.005 … max 0.20 |
| `playerRolled` / `playerInterested` / `calmUntil: 0` **235–250** | live |
| `playerInterestChance` **1697–1705** | `alwaysHuntsPlayer === true` → **1**; else temper + cargo − fear |
| `playerInterestedIn` **1707–1715** | roll once; no starter/death gate |
| Scratch override **1728–1761** | no `jumpGraceUntil` check; law zone still |
| `mayHuntPlayer` **1182–1190** | traders/miners never; patrols scratch+player or standing ≤ −10; pirates/aces eligible |
| Patrol hunt drop-to-player **1763–1781** | hop grace + law + bubble |
| Acquire pirates/aces **1802–1849** | not docked, `now >= jumpGraceUntil`, both outside 300 u, dist < 800, `playerInterestedIn` |
| Demand **1880–1907** | pirate, target player, hop grace, 300 s record cooldown, dist < `U.TARGET_RANGE` 600; `hailOpened` line `Your cargo or your hull.` |
| Telegraph **1667–1669**; `say` **335–337** | `Heave to. Cargo or hull.` / `Run if you like.` |
| Ace mode `makeAi` **212–213** | `role === 'ace' ? 'duel'` |
| Dispatch **2412–2417** | hunt → `updateHunt`; ace → `updateDuel` |
| Ace duel hop loiter **1927–1935**; law **1938–1942** | **no** interest roll |
| Dresk spawn heal `npc.js` **310–314** | name-keyed `alwaysHuntsPlayer = true` |
| Dresk inject `world.js` **939–959** | `rec.alwaysHuntsPlayer = true` at **957** |
| Illyx cast `world.js` **408–420** | Freehold ace when `cast.ace` |
| Vane spawn fn **464–537**; tick **1820–1821** | fear ≥ `ACES.hunter.fearThreshold` (25 at `state.js` **877**) |
| Pirate names `world.js` **227** | Red Marlow, Gallows Wren, Ninth Tooth, Sable Ilex |
| Pirate routes **348–360** | gate + lane mid |
| Freehold authored **42–44**, **54** | station `[120, 20, 620]`; field `[-450, -30, -250]` r 160; gate `[0, 60, -900]`; cast 8/4/2/`ace: true` |
| Station→field | √(570²+50²+870²) ≈ **1041 u** |
| Field→gate (Illyx) | √(450²+90²+650²) ≈ **796 u** (inside bubble 800) |
| Lane mid→field | lerp 0.5 station↔gate vs field ≈ **526 u** |
| Player cruise 120 `state.js` **38** | 1041/120 ≈ **8.7 s** (~9 s) |
| Origins `state.js` **743–767** | greenhand/beautiful Freehold; marked `setFear: 15`; ledgerDebt −1500 / redledger −10; drifter `startSystem: 'redmarch'` |
| `ACES.illyx` **887–904**; collector **1078–1084** | Dresk name live |
| `WORLD_FIELDS` `save.js` **77–81** | includes `jumpGraceUntil`; no starter/death key |
| `sanitizeRestored` **1087–1137** | heals `world.time` NaN/<0 → 0 at **1133**; **does not clamp** `jumpGraceUntil` |
| `healLiveRecords` **1139–1180** | “death recovery keeps NPCs running” |
| Same-system restore **1233–1237** | no `systemLoaded` if system unchanged; live AI fields survive |
| `freshStart` **1255–1288** | Freehold pad; **no** `jumpGraceUntil` stamp |
| Death overlay **71**, **1313–1342** | 2500 ms; Digit1 skip; recover restore or freshStart; `'She limped home.'` |
| `playerDestroyed` emit `combat.js` **1758** | save.js consumes; **npc.js has no listener yet** (PR1 hole) |
| Time clock `main.js` **149–150** | `world.time += dt` only when `!flags.paused` |
| Overlay does not pause | death overlay never sets `flags.paused` |
| Hail card `hail.js` **7–15**, **454–470** | `canShowHail` → open or defer |
| Calm hail `overlay-policy.js` **94–99** | `now >= ai.calmUntil` |
| HUD toasts `hud.js` **560–568**, **577–578** | `commLine` / `originChosen` |
| Empty hub `hud.css` **184–193** | 80×80 `.rw-reticle` |
| Digit 0/8/9 `station.js` **188** | `DOCK_KEY_SERVICES` … `launch`, `epics`, `shipyard` |
| Mix cap `traffic-feel.js` **29**, **157–161**; skip `traffic.js` **119–120** | `PIRATE_LIVE_SHARE` 0.4; authored sit-on skips cap |
| `ctx.stationPosition` `ctx.js` **66** | `[120, 20, 620]` |
| Wishlist inbox **133–139**; AI-04 **1257–1265** | INBOX P0 starter grace; AI-04 first pass DONE Wave 56 |

Code wins: 60 s hop **is** the ~1 minute playtest clock. It is not a starter career window. Death restore keeps live `playerRolled` / `playerInterested` / duel. Law zone 300 u is pad-only.

### 4. Deputize (owner may override; not bugs)

| Origin | Extra | Start system | Live origin |
|---|---|---|---|
| `greenhand` | **180** | `freehold` | effects `{}` |
| `beautiful` | **180** | `freehold` | same berth |
| `marked` | **0** | `freehold` | `setFear: 15` |
| `ledgerDebt` | **0** | `freehold` | sells danger; Dresk inject |
| `drifter` | **0** | `redmarch` | `startSystem: 'redmarch'` |

Death: session `calmUntil` **90 s** + re-roll cold; Dresk keeps `alwaysHuntsPlayer` and still sits in 90 s delay. Home-berth bubble **PR2 optional**. Hop length stays **60**.

### 5. Contract wins / AI-04 / Dresk / write-set / tamper

- Merge law: `out/w124/startergrace/shared-contract.md` wins vs `docs/Ai05StarterGraceDesign.md`.
- AI-04 who stays: traders never hunt; patrols scratch or standing ≤ −10; pirates keep wave-32 roll. Grace gates/delays acquire / demand / duel. Grace does **not** retune `playerInterestChance` weights.
- Dresk: extra starter **bypass**; hop + death **honor**. Do not delete `alwaysHuntsPlayer`. Illyx / Vane not deleted.
- Later write-set: `npc.js` first. `world.js` only if spawn stamp needed. Default PR1: **no** `world.js`. Must not claim `controls.js`, `save.js`, `overlay-policy.js`, `hail.js` cards, `origins.js`, `jump.js` hop length, `traffic.js` / `traffic-feel.js`, `physics.js`, `state.js`.
- Tamper contract §0.13: missing/unknown origin → no extra; non-finite `world.time` / `jumpGraceUntil` / session death-until → **no extra grace**; clocks `> now + 180` clamp to `now + 180`. Formulas fail closed. No new `WORLD_FIELDS` / `localStorage` key. Do not persist `calmUntil`.
- HUD-01 empty hub. No grace pip. No Digit steal. No new Digit. `innerHTML` forbidden later.

### 6. Flags

| Flag | Result |
|---|---|
| CONSUME | **No.** Pack freezes REAL. |
| `src/` written this pack | **No.** |
| Hail-card steal | **No.** Call-out only; P1 owns lifecycle. |
| God-mode persist key | **No.** Session death + clamp; no `starterGraceUntil`. |
| Digit steal | **No.** Digit 0/8/9 stay. Death Digit1 skip stays. |
| Sibling pack mix | **No.** Did not write `out/w124/berthfreeze/**` or `out/w124/menuinput/**`. |

### 7. Processes

Started none. No Vite. No Chrome. No CDP. No formatter. No `npm run test:boot`.
