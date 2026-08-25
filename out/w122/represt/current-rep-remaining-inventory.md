# Wave 122 remaining REP leftover — live inventory

**Wave:** 122. Markdown only. Code wins over wishlist REP-02 “local police behavior,” over `docs/RepStandingDesign.md` “Patrol remains Freehold until a named serial,” and over stale Wave 73 “police hail none / covering absent” rows.  
**Census date:** 2026-08-25.  
**Scope:** leftover **remaining REP after named REP slices shipped** (explain, kill −5, restitution 1200, police leave, covering, inbound refuse, Digit 9 copy, REP-03 climb copy, spy/war dest −2). Not HUD. Not NAV. Not MSN family caps. Not a new Digit.  
**Cite, do not rewrite:** [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) REP-01…04; [`docs/RepStandingDesign.md`](../../docs/RepStandingDesign.md); [`docs/Rep03RemedialDesign.md`](../../docs/Rep03RemedialDesign.md); [`docs/Rep04AttributionDesign.md`](../../docs/Rep04AttributionDesign.md); [`docs/Rep05ConsequencesDesign.md`](../../docs/Rep05ConsequencesDesign.md); [`docs/OwnerDecisionsWave82.md`](../../docs/OwnerDecisionsWave82.md); [`docs/OwnerDecisionsWave93.md`](../../docs/OwnerDecisionsWave93.md); [`docs/OwnerDecisionsWave112.md`](../../docs/OwnerDecisionsWave112.md).  
**Not this leftover:** HUD-01 hub. Digit 0/8/9 remap. Wanted score. Kit mutate. Aim-glass gauges. New penance `kind`. Restitution UU retune. Kill −5 retune. BIO graft cap retune. POD 160/240 retune. `state.js` write. New persist key.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

There is **no** `src/game/reputation.js`. Standing helpers live in `data-trade.js` (`standingRead`), `save.js` (`sanitizeReputation`), `kill-standing.js`, `restitution.js`, `police-leave.js`, `police-cover.js`. There is **no** `src/game/jobs-war.js` / `jobs-espionage.js`. War and spy writers live in `station.js`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| Digit 9 Standing explain (Wave 74)? | **Yes.** Ladder + HOW STANDING MOVES + LIVE CONSEQUENCES + restitution desk | **LIVE** |
| Kill victim-faction −5 (Wave 82/83)? | **Yes.** `KILL_STANDING_DELTA = -5`; `applyPlayerKillStanding` from `npc.js` **2326** | **LIVE** |
| Restitution 1200 Digit 9 (Wave 83)? | **Yes.** `RESTITUTION_UU = 1200`; two-step confirm; key → 0 | **LIVE** |
| Police leave `Leave this space.` band `< 0` and `> −10`, 300 u, once/visit (Wave 95)? | **Yes.** `police-leave.js`; ticked `npc.js` **2484**. **No** hail card (Wave 93 channel freeze) | **LIVE** |
| Covering Known+ local patrol vs pirate/ace player fights (Wave 104)? | **Yes.** `COVERING_LINE` `Patrol covering.`; `COVERING_STANDING_MIN` 10 | **LIVE** |
| Inbound Marked refuse `No passage.`; dock open (Wave 104)? | **Yes.** `destJumpRefused` standing `< −25`; `dock()` has **no** standing gate | **LIVE** |
| Digit 9 copy of leave / covering / jump refuse (Wave 107 copy; WAVE111 still pins `standingLiveNotes`)? | **Yes.** `standingLiveNotes` **1181**, **1184**, **1191** | **LIVE** |
| REP-03 Digit 9 climb after restitution-to-0; live +2 families; no new kind (Wave 111)? | **Yes.** `standingRemedialNotes` **1195–1203**; WAVE111 `noRemedialKind` | **LIVE** |
| Spy expose dest −2 on accepted lapse; war success dest −2 (Wave 83)? | **Yes.** `SPY_EXPOSE_DELTA = -2`; `WAR_TARGET_DELTA = -2` | **LIVE** |
| NPC patrols hard-coded Freehold in other faction space? | **No.** Spawn `faction: i === 0 ? def.faction : otherFaction` (`world.js` **374–385**) | **Closed** |
| Leave / covering use **system flag**, not Freehold constant? | **Yes.** `systemFactionOf` + `isLocalSystemPatrol` | **Closed** |
| Hunt uses the **patrol hull’s own faction** standing? | **Yes.** `standingOf` → `record.faction` / `state.faction` (`npc.js` **1138–1186**) | **Closed** |
| Patrol **job** still credits Freehold Compact +5? | **Yes.** `reputation.freehold += PATROL_REP` (`station.js` **3852**). Digit 9 **names** it. WAVE111 pins `Patrol adds +5` / `Freehold Compact only` | **Live Compact writer, not a police hole** |
| `patrol-employer-faction` as remaining police leftover? | Stale “later serial” prose in `RepStandingDesign.md` **123**, **216**, **244**. Code + Wave 111 honesty freeze it as Compact-only. Owner: freeze from **code**, not that prose | **Not leftover** |
| Wanted / `crimeScore` persist key? | **Absent.** `WORLD_FIELDS` **77–101**; WAVE74 `noCrimeScore` | **Honor** |

Name: **no remaining REP leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/station.js` | Digit 9, restitution desk, patrol job +5 Freehold, spy/war −2, `h()` |
| `src/game/data-trade.js` | `standingRead` |
| `src/game/state.js` | `RANK_LADDER`, `FACTIONS`, `U.DOCK_RANGE`, `RESCUE` |
| `src/game/world.js` | patrol spawn faction |
| `src/systems/npc.js` | hunt, covering tick, leave tick, kill standing |
| `src/systems/hail.js` | no leave verb |
| `src/game/police-leave.js` | leave band / local patrol |
| `src/game/police-cover.js` | covering Known 10 / local patrol |
| `src/game/jump.js` | inbound refuse |
| `src/game/kill-standing.js` | victim −5 |
| `src/game/restitution.js` | 1200 / key = 0 |
| `src/game/save.js` | `WORLD_FIELDS` `reputation`; `sanitizeReputation` |
| `scripts/boot-test.mjs` | WAVE74 / 82 / 83 / 104 / 111 (WAVE107 block is BIO-06; leave string still pinned in WAVE104) |
| Honor docs | wishlist REP; RepStanding / Rep03 / Rep04 / Rep05; Owner 82 / 93 / 112 |

Did **not** start Vite or Chrome. Domain is **data**. Did **not** run `npm run test:boot`.

---

## 2. Wishlist vs code (stale lines)

Wishlist REP-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **948–957**, cite only): standing should affect mission access, prices, restricted-system or station access, equipment/ships, **allies and assistance**, **local police behavior**.

REP-05 already shipped covering (allies in space as local patrol cover) and inbound Marked refuse. Dock stays a risky run (REP-03). Police leave already shipped.

Wishlist REP-03 leave / restitution / remedial / POD return: **LIVE** (Wave 95 / 83 / 111 / POD-01).  
Wishlist REP-04 victim attribution / war dest / spy secret-vs-expose: **LIVE** (Wave 82/83).  
Wishlist REP-01 dedicated screen: **LIVE** Digit 9.

`docs/RepStandingDesign.md` **123 / 216 / 244** still names optional later `patrol-employer-faction` and “Patrol remains Freehold.” That row is **MSN unique-four Compact writer**, not NPC police spawn. Wave 111 Digit 9 **must** say patrol is Freehold Compact only (`scripts/boot-test.mjs` **22968–22969**). Code wins: do **not** freeze REAL from that stale later-serial sentence.

This pack does **not** edit the wishlist or `RepStandingDesign.md`.

---

## 3. Standing bag / ladder / persist

| Surface | Today | Cite |
|---|---|---|
| Ladder | Sworn 50, Trusted 25, Known 10, Stranger −10, Suspect −25, Marked −1000 | `state.js` **714–721** |
| `rankFor` | first rung `min <= rep`; NaN falls to Marked | **722–725** |
| `standingRead` | miss / reserved / non-finite / unknown key → 0 | `data-trade.js` **73–81** |
| Persist | `'reputation'` on `WORLD_FIELDS` | `save.js` **77–78** |
| Sanitize | fresh bag; reserved / non-FACTIONS / non-finite drop | `save.js` **919–940** |
| Wanted / crimeScore | **none** | `WORLD_FIELDS` **77–101**; WAVE74 **15293–15298** |
| `state.js` | READ-ONLY later; six rungs | honor |

WAVE74 pins Digit 9 `epics` as service **8**, Digit 0 shipyard, ladder Sworn 50, no `crimeScore`/`wanted` (`boot-test.mjs` **15288–15302**).

---

## 4. Digit 9 Standing (explain + copy + restitution + climb)

`DOCK_KEY_SERVICES` (`station.js` **188**): `…, 'launch', 'epics', 'shipyard'`. Dock-root labels **6034**: Digit 8 Launch, Digit 9 Standing, Digit 0 Shipyard.

`renderEpics` **5887–5983**:

| Block | Live | Cite |
|---|---|---|
| Rank line | dock flag + `rankFor(standingRead)` | **5891–5895** |
| LADDER | `standingLadderLines()` | **1132–1138**, **5898–5900** |
| RESTITUTION | only standing `< 0`; 1200; Pay / Confirm / Esc | **5903–5924**, **5866–5885**, Esc **6186** |
| HOW STANDING MOVES | `standingMoveNotes()` | **1151–1160**, **5926–5928** |
| Climb after 0 | `standingRemedialNotes()` always after moves (fail-closed try) | **1195–1203**, **5929–5941** |
| LIVE CONSEQUENCES | `standingLiveNotes()` | **1163–1192**, **5943–5945** |
| DOM | `h()` `textContent`; **no** `innerHTML` in `station.js` | **4464–4468** |
| Notice | `aria-live="polite"` | **6066–6068** |

Live leave / covering / jump copy in `standingLiveNotes`:

- **1181** `Hostile band standing below 0 and above -10, ${POLICE_LEAVE_RADIUS} u: ${POLICE_LEAVE_LINE}`
- **1184** Known `COVERING_STANDING_MIN` + `COVERING_LINE`
- **1191** inbound dest below `JUMP_REFUSE_STANDING` + skip names + dock open + `JUMP_REFUSE_LINE`

Patrol honesty:

- **1156** `Patrol jobs add +${PATROL_REP} standing with ${freehold}.` (`freehold` display = **Freehold Compact**, `state.js` **592**)
- **1202** `Patrol adds +${PATROL_REP} ${freehold} only.`
- Jobs board note **5130** same Compact credit

WAVE111 pins climb helper, no `kind: 'remedial'`, Digit 0/2/8/9, hub 80 px, no wanted field, copyHonesty including Freehold Compact only (`boot-test.mjs` **22872–22979**).

---

## 5. Kill −5 (REP-04)

| Symbol | Live | Cite |
|---|---|---|
| Delta | **−5** | `kill-standing.js` **6** |
| Writer | `applyPlayerKillStanding` | **128–174** |
| Roles | trader / miner / patrol only | `PIRACY_ROLES` **17** |
| Faction | victim hull faction; skip independent / reserved / missing | **151–154** |
| Grafted victim | Beautiful +5 unless victim already beautiful | **8–9**, **75–78**, **169–170** |
| Then | `applyAbominationStanding` (BIO cap −10) | **172** |
| Call | `npc.js` after `npcDestroyed` | **2326** |
| WAVE82 pin | `KILL_STANDING_DELTA === -5` | `boot-test.mjs` **18042** |

No galaxy wanted write.

---

## 6. Restitution 1200

| Symbol | Live | Cite |
|---|---|---|
| UU | **1200** | `restitution.js` **5** |
| Offended | `SYSTEMS[id].faction` if `FACTIONS` | **7–12** |
| Pay | docked, currentSystem match, standing `< 0`, debit 1200, **`bag[faction] = 0`**, graft cap, `commLine` | **45–66** |
| WAVE83 | UU, confirm, Esc, short, graft cap −10 | `boot-test.mjs` **18568–18572** |

Do **not** retune 1200.

---

## 7. Police leave (Wave 95 live; WAVE104 still pins the line)

| Symbol | Live | Cite |
|---|---|---|
| Copy | `Leave this space.` | `police-leave.js` **5** |
| Radius | **300** (law zone) | **8** |
| Band | `standing < 0 && standing > -10` | **117** |
| Who | local **system** faction patrol, not in combat with player | **47–56**, **87–96**, **119** |
| System flag | `SYSTEMS[currentSystem].faction` + `Object.hasOwn(FACTIONS)` | **18–27** |
| Skip flags | `beautiful`, `unknowables` | **10** |
| Channel | `commLine` once per `systemLoaded` visit | **121–124** |
| Hail card | **none** | `hail.js` `INTENT_ORDER` **58** — no leave verb |
| Tick | `npc.js` **2484** | |
| WAVE95 pin block | **absent** in `boot-test.mjs` (grep WAVE95 = 0) | WAVE104 still asserts `POLICE_LEAVE_LINE` **22239–22240** |

Owner Wave 93 (`docs/OwnerDecisionsWave93.md` **22–36**, cite): local-system-faction patrols; no hail card. Live matches.

---

## 8. Covering + inbound refuse (REP-05 / Wave 104)

| Symbol | Live | Cite |
|---|---|---|
| Copy | `Patrol covering.` | `police-cover.js` **6** |
| Min standing | **10** (Known) | **9** |
| Radius | **300** | **12** |
| Who | local system-faction patrol; pirate/ace player already fights; not vsPlayer; not inside law zone | **52–61**, **102–112**, **129–154** |
| Skip flags | beautiful / unknowables / independent / hollow | **15** |
| Tick + hunt | `tickPoliceCover` `npc.js` **2485**; `findCoveringWork` **1372**, **1827** | |
| Jump copy | `No passage.` | `jump.js` **7** |
| Jump gate | dest standing **< −25** | **10**, **25–33** |
| Skip dest | unknowables / hollow / independent | **13** |
| `beginJump` | refuse + `commLine` once per dest per visit; no charge | **104–111** |
| Dock | `dock()` **6100+** sets `flags.docked`; **no** standing read | **6100–6116** |
| Dock range | `U.DOCK_RANGE` **45** | `state.js` **30** |
| WAVE104 | covering + jump + leave strings; no wanted field | `boot-test.mjs` **21960–22269** |

---

## 9. Patrol spawn / hail / hunt (the named leftover question)

### 9.1 NPC patrols are **not** Freehold-only

`world.js` `createRecords` **374–385**:

```
faction: i === 0 ? def.faction : otherFaction,
role: 'patrol',
```

`def.faction` is the **system** flag. Extra patrols may fly the neighbor (`gates[0].to`) faction. Names pool `PATROL_NAMES` **235–238** is only a **name** table (freehold / veridian lists); missing keys fall through `poolName(..., 'Patrol')`. Faction on the record is **not** forced to `freehold`.

### 9.2 Hunt is hull-local, not Compact-global

`npc.js` `standingOf` **1138–1142** reads `live.record.faction ?? live.state.faction` from `ctx.world.reputation`. Patrol hunt at `<= HOSTILE_STANDING` (**−10**, **98**, **1186**). A Gilded-space patrol hunts on **Gilded** standing. That is local police.

`standingOf` does not use `standingRead` (no reserved-id drop). Census only: **not** a remaining REP leftover. Do not “fix” it here.

### 9.3 Leave / covering ignore non-local patrols

`isLocalSystemPatrol` requires role `patrol` and record/state faction **equal** to the system flag. A neighbor-flag extra patrol does **not** order leave or cover. That is fail-closed local law, not a Freehold hard-code.

### 9.4 Patrol **job** still Compact +5 (documented; not police)

| Piece | Live | Cite |
|---|---|---|
| Kind | unique `patrol-lane` | `station.js` **2111–2114** |
| Copy | “the Compact's thanks” | **2113** |
| Payout | `ctx.world.reputation.freehold += PATROL_REP` (`PATROL_REP` **5**) | **205–206**, **3852–3856** |
| Reward line | `+${PATROL_REP} Freehold rep` | **5332** |
| Digit 9 | “Patrol … Freehold Compact only” | **1156**, **1202**, **5130** |
| WAVE111 | `copyHonesty` `/Freehold Compact only/` | `boot-test.mjs` **22968–22969** |

This is the unique-four Compact contract. Retargeting it to dock flag would **lie** vs Digit 9 and **break** WAVE111. Owner Wave 73 froze “do not silently retarget patrol `freehold`” (`RepStandingDesign.md` **100**, **216**). Wave 111 later **named that truth on Digit 9**. Owner test: patrol-employer live **or** owner-frozen as skippable. Census: **skippable Compact writer**, not a player-facing police hole.

Example REAL hole from the Wave 122 brief (“patrol still hard-coded Freehold while the player is in another faction’s space”) is **false vs spawn/leave/covering/hunt**.

---

## 10. Spy dest −2 / war dest −2

| Piece | Live | Cite |
|---|---|---|
| `SPY_EXPOSE_DELTA` | **−2** | `station.js` **233** |
| Expose | accepted lapse deadline **or** dest-fail | `applySpyExpose` **3024–3028**; ticks **4168**, **4181** |
| Secret success | employer +`MINING_REP` (2); **no** dest write on success path | **4207**; WAVE83 `spySuccessEmployer` |
| `WAR_TARGET_DELTA` | **−2** | **234** |
| War success | employer +2 and dest −2 if dest ≠ employer | `warPayComplete` **3571–3583** |
| WAVE83 | `SPY_EXPOSE_DELTA = -2`; `WAR_TARGET_DELTA = -2` | `boot-test.mjs` **18559**, **18564** |

Owner Wave 82 (`docs/OwnerDecisionsWave82.md` **51–63**, cite) recorded those integers. Live matches.

---

## 11. Honor surfaces (cite; do not retune)

| Surface | Live | Cite |
|---|---|---|
| Empty hub | 80 px + RANGE | `hud.css` **184–189** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188**, **6034–6038** |
| BIO graft cap | Beautiful `min(current, −10)` while grafted | `hangar.js` (Digit 9 **1159**, **1188**) |
| POD rescue | +4 other / +1 playerKill | `state.js` **331–336** |
| `innerHTML` in station | **none** (grep 0) | `station.js` |
| `WORLD_FIELDS` | no wanted / crimeScore / patrolEmployer | `save.js` **77–101** |
| Known boot FAILs | do not “fix” REDMARCH `castMatches` flake | honor |

---

## 12. What is **not** a remaining hole

| Tempting “fix” | Why it is not leftover |
|---|---|
| Hail leave card | Wave 93: commLine only. Live leave is commLine |
| Patrol job → dock employer | Compact unique-four; Digit 9 + WAVE111 honesty; owner “do not silently retarget” |
| Extra patrol flying neighbor flag | Spawn mix, not Freehold hard-code; leave/covering already ignore them |
| `standingOf` vs `standingRead` | Existing hunt helper; not named leftover |
| Galaxy wanted | Forbidden REP-04; WAVE74 pin |
| New Digit / persist / UU / penance kind | Honor omit |
| Reopen restitution 1200 / kill −5 / covering 10 / jump −25 | Landed knobs |
| `src/game/reputation.js` missing | Helpers already split; do not invent a module |

---

## 13. Boot pins (read only)

| Pin | What it proves |
|---|---|
| WAVE74 `boot-test.mjs` **15015–15384** | sanitizeReputation, Digit 9 epics, no crimeScore/wanted, RANK_LADDER six |
| WAVE82 **18003–18057** | `KILL_STANDING_DELTA === -5` |
| WAVE83 **18060–18597** | spy −2, war −2, restitution 1200, no restitution Digit, no wanted |
| WAVE95 | **no** labeled block (leave still live; WAVE104 pins the line) |
| WAVE104 **21960–22269** | covering, inbound refuse, leave line, no wanted |
| WAVE107 **22272–22349** | **BIO-06** cadence, not Digit 9. Digit 9 consequence copy lives in `standingLiveNotes` and WAVE111 |
| WAVE111 **22872–22979** | climb copy, no new kind, patrol Compact-only honesty |

---

## 14. Freeze

Leftover **CONSUME**. Named serial **none**. Name: **no remaining REP leftover.**

If a later census finds leave / covering / inbound refuse / Digit 9 Standing / kill −5 / restitution 1200 / spy-war −2 **gone**, or NPC patrols **forced** `faction: 'freehold'` in `world.js` createRecords, re-open this leftover as **REAL** and name **PR1** only after that census. Do **not** ship `patrol-employer-faction` while local police already fly the system flag.
