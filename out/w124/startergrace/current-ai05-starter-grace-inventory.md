# Wave 124 AI-05 starter grace / hostility pacing — live inventory

**Wave:** 124. Markdown only. Code wins over wishlist Initiative AI-04 (who is hostile) when that section is read as covering **when / how often / how close to home**.  
**Census date:** 2026-08-25.  
**Scope:** remaining **starter hostility pacing** after AI-04 who-is-hostile. Not PHY avoid. Not AI-01 spawn clearance. Not pirate mix cap. Not hail cards. Not onboarding encyclopedia.  
**Cite, do not rewrite:** [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Idea inbox P0 ONBOARDING/AI (**133–139**); Initiative AI-04 (**1257–1265**, first pass DONE Wave 56).  
**Not this leftover:** HUD-01 empty hub. Digit 0/8/9. Kit mutate. Aim-glass gauges. CTL-03 berth hold. CTL-04 menu digits. P1 hail-demand lifecycle. P2 onboarding lesson. New Digit. New persist key. UU. SKU.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| AI-04 who-is-hostile? | Traders never hunt. Patrols need scratch or standing ≤ −10. Pirates keep wave-32 interest roll. Aces duel. Dresk `alwaysHuntsPlayer` | **LIVE** (Wave 56 / 32). **Not this leftover.** |
| Jump / new-game hostile-intent grace? | `JUMP.graceSeconds` **60**. Origin pick and gate arrival stamp `world.jumpGraceUntil`. Hunt acquire, demand, and ace duel wait on it | **LIVE, too short for Greenhand** |
| Starter-system time grace (authored window after origin, longer than hop)? | **No.** Origin uses the same 60 s hop stamp. No `starterGrace` symbol. No origin-keyed window | **HOLE** |
| Post-death pirate interest cooldown? | **No.** `recover()` restores snapshot; live NPCs keep `playerRolled` / `playerInterested` / duel. Does not re-stamp grace. `freshStart()` does not stamp `jumpGraceUntil` | **HOLE** |
| Home-berth safe bubble beyond law zone? | Law zone **300 u** already breaks hostile intent. Mining field is ~1040 u from the station. Lane pirates sit outside 300 u. Not a starter bubble | **Partial (law zone). Not starter pacing** |
| Named guns / Dresk cancelled by existing grace? | **No.** Illyx is Freehold cast ace. Vane injects on fear. Dresk never rolls | **Must not delete** |
| Leftover vs AI-04? | AI-04 is **who**. Inbox is **when / how often / how close to home** | **REAL. Not CONSUME. Serial PR1** |

Name: **AI-05 starter grace / hostility pacing.** Freeze leftover **REAL**. Named serial **PR1 starter-grace**. Do **not** freeze CONSUME.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/npc.js` | Interest, acquire, demand, duel grace, law zone, telegraph toast |
| `src/game/world.js` | Freehold pirates, Illyx, Vane successor, Dresk inject |
| `src/game/origins.js` | Origin pick; stamps `jumpGraceUntil` + 60 s |
| `src/game/state.js` | `JUMP`, `ORIGINS`, `ACES`, `ORIGIN_ARCS`, `U` (READ-ONLY later) |
| `src/game/save.js` | `WORLD_FIELDS`, death `recover` / `freshStart`, live-NPC heal |
| `src/game/jump.js` | Arrival grace stamp |
| `src/game/authored-systems.js` | Freehold cast, station, field, gate |
| `src/game/traffic.js` | Pirate instantiate + mix cap skip for authored |
| `src/game/traffic-feel.js` | `PIRATE_LIVE_SHARE` / `pirateLiveCap` (do not retune) |
| `src/systems/hail.js` | Demand card vs toast (cite only) |
| `src/systems/overlay-policy.js` | Session `calmUntil` hail gate |
| `src/systems/hud.js` | `commLine` / `originChosen` toasts |
| `src/systems/combat.js` | `playerDestroyed` emit |
| `src/main.js` | `world.time` only while unpaused |
| `src/core/ctx.js` | `stationPosition` |
| `src/ui/hud.css` | 80 px empty hub |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code

Idea inbox (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **133–139**, cite only):

> Give the starter system a new-player grace period. A pirate ace attacked ~1 minute after the origin pick and destroyed the ship; after respawn a new demand arrived within another minute; four attacks landed in ~10 minutes. Mining and trade are not playable under this pressure. Add a spawn-area grace window, a pirate interest cooldown after a player death, or a patrolled safe bubble near the home berth. AI-04 defines who is hostile; nothing covers hostility pacing or starter difficulty.

Initiative AI-04 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1257–1265, status first pass DONE Wave 56):

- Traders never hunt the player.
- Patrols need a scratch or standing ≤ −10.
- Pirates keep the wave-32 interest roll.
- Pirates remain the primary source of unsolicited aggression.

**Code wins.** Who-is-hostile is **LIVE**. Pacing is **not**. 60 s hop grace **is** the ~1 minute playtest failure, not a starter career window.

Sibling inbox **do not steal:**

- P1 hail-demand lifecycle (**140–147**): toast without card. Call out only.
- P2 onboarding encyclopedia lesson (**86–91**).
- CTL-03 berth / CTL-04 menu digits (other Wave 124 packs).

This pack does **not** edit the wishlist.

---

## 3. Player-interest model (`src/systems/npc.js`)

| Surface | Live | Cite |
|---|---|---|
| Header | Wave-32 once-per-instance roll. Dresk never rolls | **148–154** |
| `INTEREST` | base 0.005, temperSpan 0.01, cargoSpan 0.10, fearRepel 0.004, min 0.005, max 0.20 | **155–163** |
| `playerRolled` / `playerInterested` | instance fields; `calmUntil: 0` | **235–250** |
| `playerInterestChance` | `alwaysHuntsPlayer === true` → **1**. Else temper + cargo − fear | **1697–1705** |
| `playerInterestedIn` | roll once; no starter/death gate | **1707–1715** |
| Scratch override | pirate/ace: lastAttacker player + hull/screen dip → interested. **No** `jumpGraceUntil` check. Law zone still | **1728–1761** |
| Patrol hunt | `mayHuntPlayer`: scratch+player attacker **or** standing ≤ −10 | **1182–1190**, **1763–1781** |
| Acquire | pirates/aces: not docked, `now >= jumpGraceUntil`, both outside **300 u** law, dist < `U.ENCOUNTER_BUBBLE` (800), `playerInterestedIn` | **1802–1849** |
| Demand | pirate, target player, `!demandSent`, jump grace, `demandedAt` ≥ **300 s**, dist < `U.TARGET_RANGE` (600). Emits `hailOpened` line `Your cargo or your hull.` | **1880–1907** |
| Telegraph toast | `Heave to. Cargo or hull.` (pirate) / `Run if you like.` (ace) via `commLine` | **1667–1669**, `say` **335–337** |
| Ace duel | **no** interest roll. Jump grace loiter **1927–1935**. Law zone **1938–1942**. Then helix/feint/fury | **1912–1935** |
| Dresk heal | name-keyed `alwaysHuntsPlayer = true` on spawn | **310–314** |
| Law zone | `LAW_ZONE_RADIUS = 300` | **97** |
| `DEMAND_COOLDOWN` | 300 s per record | **107** |

**There is no starter-system gate. There is no death re-roll. `calmUntil` is hail/passage, not death pacing.**

---

## 4. Jump / origin grace (too short)

| Surface | Live | Cite |
|---|---|---|
| `JUMP.graceSeconds` | **60** — “no hostile intent on arrival or new-game start (covers a gate hop)” | `state.js` **584–589** |
| Origin confirm | `jumpGraceUntil = (world.time \|\| 0) + JUMP.graceSeconds` | `origins.js` **116–123** |
| Gate arrival | `jumpGraceUntil = world.time + JUMP.graceSeconds` | `jump.js` **162** |
| Time clock | `world.time += dt` only when `!flags.paused` | `main.js` **149–150** |
| Origin overlay | pauses until Digit1–5 / click; then unpause | `origins.js` **92–94**, **121–122** |
| Persist | `jumpGraceUntil` is a `WORLD_FIELDS` key | `save.js` **81** |
| Sanitize | `sanitizeRestored` heals `world.time` NaN/<0 → 0. **Does not clamp** `jumpGraceUntil` | `save.js` **1133**, **1087–1137** |

Playtest “ace ~1 minute after origin pick” **matches 60 s**. Hop grace is **not** starter career grace. Putting 180 s on `JUMP.graceSeconds` would also toothless **every gate hop**. Do not retune hop length as the fix.

---

## 5. Origins / named guns / Dresk

| Surface | Live | Cite |
|---|---|---|
| Greenhand | Freehold. Empty effects. Playtest case | `state.js` **743–747** |
| Ledger Debt | −1500 credits, redledger −10. Sells danger | **748–752** |
| Marked | `setFear: 15`, veridian −15. Sells danger | **753–757** |
| Beautiful | bond/hunger/livingRock. Same Freehold berth | **758–762** |
| Drifter | `startSystem: 'redmarch'`, fear 5 | **763–767** |
| Illyx | Freehold cast ace when `cast.ace` | `world.js` **408–420**; `ACES.illyx` `state.js` **887–904** |
| Vane | inject redmarch at fear ≥ 25; `spawnHunterSuccessor` | `world.js` **464–537**; `state.js` **870–886** |
| Dresk | `injectCollector` role pirate, `alwaysHuntsPlayer = true` | `world.js` **939–959**; `ORIGIN_ARCS` **1078–1084** |
| Illyx rematch | spawn bumps resolve | `npc.js` **300–308** |

Grace **may delay** Freehold first contact. Grace **must not** delete Illyx / Vane / Dresk.

---

## 6. Freehold traffic vs home berth

| Surface | Live | Cite |
|---|---|---|
| Freehold cast | 8 traders, **4 pirates**, 2 patrols, **ace: true** | `authored-systems.js` **54** |
| Pirate names | Red Marlow, Gallows Wren, Ninth Tooth, Sable Ilex | `world.js` **227** |
| Pirate routes | haunt **gate + lane mid** (lerp station↔gate), not the pad | `world.js` **348–360** |
| Station | Freehold Landing `[120, 20, 620]` | `authored-systems.js` **42** |
| Field (mine) | `[-450, -30, -250]`, radius 160 | **43** |
| Gate | `[0, 60, -900]` to veridian | **44** |
| Station→field | ≈ **1041 u** (outside 300 u law; outside dock 45) | computed from **42–43** |
| Field→Illyx gate | ≈ **796 u** ≈ `U.ENCOUNTER_BUBBLE` **800** | `state.js` **27**; authored **43–44** |
| Lane mid→field | ≈ **526 u** (inside bubble) | `world.js` **350–351** |
| Mix cap | `PIRATE_LIVE_SHARE` 0.4; at least 1. Authored sit-on skips cap | `traffic-feel.js` **29**, **157–161**; `traffic.js` **119–120** |
| Config station | `[120, 20, 620]` | `ctx.js` **66** |

A Greenhand who reaches the rocks in ~9 s at cruise 120 is already inside Illyx’s bubble and the lane pirates’ bubble. Law zone 300 u protects the pad, **not** mining or the lane.

**Do not** retune PHY avoid, AI-01 spawn clearance, or pirate mix cap as this leftover.

---

## 7. Death recover (pacing hole)

| Surface | Live | Cite |
|---|---|---|
| Destroy emit | `combat.js` → `playerDestroyed` | `combat.js` **1758** |
| Overlay | 2500 ms hold; Enter / Space / **Digit1** skip | `save.js` **71**, **1313–1342** |
| Does **not** pause | overlay only; `world.time` still advances | `save.js` **1332–1336** vs `main.js` **149–150** |
| Recover + snap | `restore(ctx, snap)` then bio anxious; `'She limped home.'` | **1318–1329** |
| Recover no snap | `freshStart` → Freehold pad; **no** `jumpGraceUntil` stamp | **1255–1288**, **1324–1326** |
| Restore NPCs | “death recovery keeps NPCs running”; re-adopt records by id | **1139–1180**, **1211** |
| Same-system restore | no `systemLoaded`; live AI instance fields **survive** | **1233–1237**, **1147–1148** |
| Fear | restored from snapshot; not reset to 0 | `WORLD_FIELDS` **78**; restore **1187–1188** |
| Time | restored; not reset | **78**, **1133** |

After a Greenhand death at t ≈ 90 s: hop grace is already over; Illyx is still in duel; `playerInterested` stays true on live pirates; a new demand can land inside a minute. **This is the playtest second beat.**

---

## 8. Hail demand toast vs card (cite only; do not solve)

| Surface | Live | Cite |
|---|---|---|
| Demand emit | `hailOpened` + `demand` + line `Your cargo or your hull.` | `npc.js` **1906** |
| Telegraph | `commLine` `Heave to. Cargo or hull.` (HUD toast) | `npc.js` **1669**; `hud.js` **560–568** |
| Card open | `hail.js` `canShowHail` → `openCard` or defer | `hail.js` **25–26**, **454–470** |
| Calm hail | `overlay-policy.js` `now >= ai.calmUntil` | **94–99** |

If overlay defers/refuses the card, the telegraph toast can still fire. Inbox P1 hail lifecycle owns that hole. **A demand toast during starter grace is a sibling hole** if acquire is not gated. PR1 gates acquire so the toast should not start. Do **not** design hail cards here.

---

## 9. Persist / HUD / digits (honor)

| Surface | Live | Cite |
|---|---|---|
| `WORLD_FIELDS` | includes `jumpGraceUntil`; **no** starterGrace / deathCalm key | `save.js` **77–101** |
| Empty hub | 80 px `.rw-reticle` | `hud.css` **184–193** |
| Digit 0/8/9 | dock services list includes shipyard / launch / epics | `station.js` **188** |
| Death Digit1 | skip overlay (keep) | `save.js` **1342** |

No grace pip exists. Do not add one.

---

## 10. Example REAL holes vs live

| Claim | Live? |
|---|---|
| No hostile-intent timer at all | **False.** 60 s hop/new-game exists |
| 60 s is starter career pacing | **False.** Comment says it covers a **gate hop** |
| Death cools pirate interest | **False.** Live AI survives restore |
| Law zone is a mining safe bubble | **False.** Field ~1041 u; Illyx ~796 u from rocks |
| AI-04 leftover is who-is-hostile | **False.** Who is done. When is not |
| Starter grace already in `npc.js` | **False.** Grep `starterGrace` / `deathGrace` = none |

Rejected as invented work: PHY-02 rewrite, pirate mix retune, spawn clearance retune, hail card redesign, encyclopedia lesson, berth KeyL, menu Digit theft, hub pip, new `WORLD_FIELDS` key.

---

## 11. Coupling

Later write-set **this leftover owns:** `src/systems/npc.js` (acquire / interest / calm / duel grace read). `src/game/world.js` **only** if a later census proves spawn-injection must stamp (PR1 default: **no** — use `world.origin` + `world.time` + session death flag).

**Do not claim:** `controls.js`, `save.js` berth panel, `overlay-policy.js`, `station.js` menus, `hail.js` cards, `origins.js` (stamp already exists; extra window is npc-side), `state.js` (READ-ONLY).
