# Current REP-05 inventory (Wave 103)

**Wave:** 103. Design only.  
**Rule:** Live code wins over comments, lore, `docs/RepStandingDesign.md` stale lines, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** remaining REP-02 later serials — **allies assisting in space** and **locked systems**. Live standing writers/readers, police leave, dock, jump, yard min-rep, locker, patrol hunt / pirate-work hunt.

This file is the source of truth for “REP-05 today.” The integrator brief and `shared-contract.md` must not invent UU, standing deltas, or persist keys that are not here. Deputize defaults live in the contract, not in this inventory.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/state.js` | `RANK_LADDER` 714–721; `rankFor` 722–725; `FACTIONS` 591–606; `ECON.fear.tributeOpensAt` 326; `U.DOCK_RANGE` 30 |
| `src/core/ctx.js` | default bag 153; `jumpRequested` listed 234 |
| `src/game/save.js` | `WORLD_FIELDS` 76–101; `sanitizeReputation` 919–938 |
| `src/game/data-trade.js` | `standingRead` 73–81 |
| `src/game/police-leave.js` | **LIVE** leave order |
| `src/systems/npc.js` | `LAW_ZONE_RADIUS` 95; `HOSTILE_STANDING` 96; `standingOf` 1044–1048; `mayHuntPlayer` 1088–1096; `findPirateWork` 1179–1199; `tickPatrolJob` 1274–1286; `tickPoliceLeave` 2378 |
| `src/systems/hail.js` | combat hail intents — **no** leave card (leave is `commLine`) |
| `src/systems/station.js` | dock, Digit map, locker, Standing notes, restitution UI, archive `No sale.` |
| `src/game/shipyard.js` | `MIN_REP` 64–71; hostile `rep < 0` 219 |
| `src/systems/shipyard-desk.js` | `'No sale.'` |
| `src/game/hangar.js` | graft cap −10; train `rep < 0` 810 |
| `src/game/restitution.js` | `RESTITUTION_UU` 1200 **live** |
| `src/game/kill-standing.js` | `KILL_STANDING_DELTA` −5 **live** |
| `src/game/jump.js` | `beginJump` — **no** standing gate |
| `src/systems/gate.js` | KeyG / zone emit `jumpRequested` 648–649 |
| `src/game/jobs-chains.js` | unique-chain Known gate `tier >= 1` 84–86 |
| `src/game/chart-hover.js` | rank on hover; no lock box |
| `src/systems/hud.js` | `commLine` toast; 80 px hub RANGE; never writes `hullKind` |
| `src/ui/hud.css` | `.rw-reticle` 80 px 184–191 |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | REP-02 672–681 (read only) |

---

## 1. Ladder (do not impersonate)

Live `RANK_LADDER` (`state.js` 714–721):

| min | name | tier | Live uses |
|---|---|---|---|
| 50 | Sworn | 3 | Yard 15% discount (`shipyard.js` 116); epic / gift elsewhere |
| 25 | Trusted | 2 | Frigate `minRep` 25 (`shipyard.js` 70); yard 10% |
| 10 | Known | 1 | Ace `minRep` 10 (`shipyard.js` 69); unique-chain `chainStandingGate` (`jobs-chains.js` 84–86); yard 5% |
| −10 | Stranger | 0 | Numeric 0 is this band. Hunt floor is **≤ −10** (`npc.js` 96, 1092) |
| −25 | Suspect | −1 | Band −25…<−10. Locker does **not** open at −25 |
| −1000 | Marked | −2 | Locker opens Freehold **< −25** (`station.js` 187, 2058) |

`rankFor` (`state.js` 722–725): first rung with `rep >= rung.min`. NaN falls through to Marked. Callers must pass a finite number via `standingRead`.

**This wave does not add rungs.**

---

## 2. Persist and default bag

| Surface | Today | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` | `save.js` persist path |
| Field | `'reputation'` on `WORLD_FIELDS` | `save.js` 76–78 |
| Extra law keys | **none.** No `wanted`. No `crimeScore`. No `world.crimes` | `save.js` 76–101; grep `wanted`/`crimeScore` in `src/` = 0 (except a comment in `organic.js`) |
| Sanitize | `sanitizeReputation` fresh bag; reserved / non-`FACTIONS` / non-finite drop | `save.js` 919–938, called 1135 |
| Default bag | `{ freehold: 0, redledger: 0, veridian: 0, hollow: 0 }` | `ctx.js` 153 |
| Missing keys | Beautiful, gilded, ferrous, assembly, congregation, lamplighter, independent, unknowables absent until a writer creates them | default vs `FACTIONS` 591–606 |
| Read miss | `standingRead` → 0 | `data-trade.js` 73–81 |

Fear is a separate scalar (`ctx.world.fear`). Not a wanted flag.

---

## 3. Digit map (do not steal)

`DOCK_KEY_SERVICES` (`station.js` 185):

`['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']`

| Digit | Dock root | Outfitting level 2 |
|---|---|---|
| 1–7 | market … people | feed/repair/outfit buys as live |
| 8 | **launch** (index 7) | launcher papers (`station.js` 6100–6102) |
| 9 | **epics / Standing** (index 8) | turret papers |
| 0 | **shipyard** (last entry) | — |

Comment at `station.js` 1620–1621 still says Digit 9 is Standing (true as `epics` pane) and Digit 8 Launch. **Code wins.** Digit 0 is shipyard (`station.js` 6023–6025).

Standing pane: `renderEpics` (`station.js` 5753–5797). `h()` is `textContent` (`station.js` 4350–4355).

`standingLiveNotes` (`station.js` 1160–1179) lists hunt, yards, ace/frigate min-rep, discounts, market sell, locker, graft, mining/patrol, restitution. **Does not** list police leave, allies, or jump locks.

---

## 4. Police leave — LIVE (do not redesign)

`docs/RepStandingDesign.md` still carries stale “hail police none / defer” rows. **Code wins.**

| Item | Live | Cite |
|---|---|---|
| Module | `src/game/police-leave.js` | whole file |
| Bind | `tickPoliceLeave(ctx)` each npc update | `npc.js` 28, 2378 |
| Who | local-system-faction `patrol` only; hull active; record/state faction must match system flag | `police-leave.js` 46–56, 87–97 |
| Blocked flags | `beautiful`, `unknowables` | `police-leave.js` 10 |
| When | `standingRead(systemFaction) < 0` **and** `> −10` | `police-leave.js` 116–117 |
| Range | **300 u** station law zone | `police-leave.js` 8, 67–74; must match `npc.js` 95 |
| Hunt band | skip leave when hunt already applies (≤ −10) | leave predicate excludes ≤ −10 |
| Channel | one `ctx.emit('commLine', { text: POLICE_LEAVE_LINE })` | `police-leave.js` 122–123 |
| Copy | `Leave this space.` | `police-leave.js` 5 |
| HUD toast | `commLine` → `pushToast` `textContent` | `hud.js` 494–502, 1112–1131 |
| Hail card | **none** | `hail.js` 48 `INTENT_ORDER` has no leave verb |
| Repeat | once per `systemLoaded` visit (module latch) | `police-leave.js` 12–16, 76–85, 107 |
| Persist | **none** | no `WORLD_FIELDS` write |
| Docked / jumping | skip | `police-leave.js` 108–109 |
| Combat with that patrol | skip | `police-leave.js` 58–65, 93 |
| Missing standing | `standingRead` 0 → no leave | `police-leave.js` 102–103, 116–117 |

Wave 93 numbers shipped. Wave 95 bind is live. **Do not reopen.**

---

## 5. Dock — not standing-gated (risky run)

| Surface | Today | Cite |
|---|---|---|
| Range | `U.DOCK_RANGE` **45** | `state.js` 30 |
| Approach | `dist <= U.DOCK_RANGE` → `dock()` | `station.js` 6170–6181 |
| `dock()` | sets `flags.docked`; **no** `standingRead` | `station.js` 5951–5978 |
| Rank line | shows live rank after dock | `station.js` 5893–5897 |

Wishlist REP-03: a deeply hostile player can still attempt a risky run. Live dock honors that. **Do not silently reverse.**

---

## 6. Jump — not standing-gated

| Surface | Today | Cite |
|---|---|---|
| Request | zone + KeyG / dockPressed / autopilot hop → `jumpRequested` `{ to }` | `gate.js` 648–649 |
| Consume | `beginJump(to)` if `SYSTEMS[to]` | `jump.js` 70–76, 152–154 |
| Standing | **none** | grep `standing`/`reputation` in `gate.js` = 0 |
| Arrival | band `commLine`; `FACTIONS[def.faction]` display name | `jump.js` 125–133 |
| Chart hover | rank name; independent → political independent; no lock widget | `chart-hover.js` 28–66 |
| Chart `blocked` | NAV plot unreachable, **not** standing | `galaxychart.js` 537 |

No inbound or outbound jump lock exists.

---

## 7. Yard / train min-rep — LIVE

| Surface | Today | Cite |
|---|---|---|
| `MIN_REP` | light/cutter/heavy/freighter **0**; ace **10**; frigate **25** | `shipyard.js` 64–71 |
| Hostile sale | `rep < 0` **or** `rep < minRepFor` → `'reputation'` | `shipyard.js` 219 |
| Desk copy | `'No sale.'` | `shipyard-desk.js` 36 |
| Discount | Known/Trusted/Sworn 5/10/15% | `shipyard.js` 114–119 |
| Living train | Beautiful `rep < 0` or below dest min-rep | `hangar.js` 809–810 |
| Digit 0 | shipyard | `station.js` 185, 6023–6025 |

---

## 8. Restricted locker — LIVE

| Surface | Today | Cite |
|---|---|---|
| Gate | fear ≥ **40** (`tributeOpensAt`) **or** `reputation.freehold < −25` | `station.js` 187, 2055–2058, 4497–4500; `state.js` 326 |
| −25 | Suspect; does **not** open | `standingLiveNotes` 1175 |
| `< −25` | Marked; opens | same |
| Always-open docks | `tradesRestricted === true` | `station.js` 2052–2053 |
| Fence | session `fenceUnlocked` | `station.js` 2057, 5984 |

This is **not** a universal wanted flag. Freehold standing + fear only.

---

## 9. Other live standing gates (do not steal)

| Surface | Today | Cite |
|---|---|---|
| Unique MSN-03 chains | `rankFor(standingRead).tier >= 1` (Known) | `jobs-chains.js` 84–86; `station.js` 3469, 4954 |
| Archive desk | dock Assembly/Unknowables; `standingRead < 0` → `'No sale.'` | `station.js` 1192–1194, 1414–1416 |
| Restitution | `RESTITUTION_UU` **1200**; dock of offended flag; set key to 0 if negative | `restitution.js` 5, 45–66; Digit 9 UI `station.js` 5768–5790 |
| Kill write | victim faction `−5`; skip pirate/ace/independent/reserved | `kill-standing.js` 6, PIRACY_ROLES |
| Graft | Beautiful `min(current, −10)` while grafted | `hangar.js` 123–166 |
| Market sell | `+2%` per positive rank tier | `station.js` 4535–4536 |
| Hunt player | patrols at standing **≤ −10** | `npc.js` 1091–1093 |

---

## 10. Patrol space behavior (not player-ally standing)

| Surface | Today | Cite |
|---|---|---|
| Hunt player | patrol + `standingOf <= −10` **or** scratched by player | `npc.js` 1088–1094 |
| `standingOf` | `table[fac]` without `hasOwn` / `standingRead` | `npc.js` 1044–1048 |
| Pirate work | `findPirateWork` / `hunterHasWork`: pirate/ace hunting a civilian **or** the player, **outside** law zone | `npc.js` 1149–1161, 1179–1199 |
| Patrol job tick | if `mayHuntPlayer` **or** `findPirateWork` → `mode = 'hunt'` | `npc.js` 1274–1280 |
| Law zone | **300 u**; no hostile intent develops | `npc.js` 95, 1157, 1650+ |
| Ally escort | **none** | no escort mode |
| Standing-gated covering | **none** | pirate-work hunt is **ungated** law, not Known+ |

Traders/miners flee hunters (`tickTraderJob` / `tickMinerJob`). They do not assist the player.

---

## 11. HUD / DOM / events

| Surface | Today | Cite |
|---|---|---|
| Hub | `.rw-reticle` **80 px**; RANGE child; pupil; cilia | `hud.css` 184–191; `hud.js` 709–712 |
| Ally pip / lock box | **none** | no ally HUD |
| `hullKind` | HUD **reads**; never writes | `hud.js` 80–87 |
| `commLine` toast | `textContent` | `hud.js` 494–502, 1130 |
| `el()` / `h()` | `createElement` + `textContent` | `hud.js` 244–248; `station.js` 4350–4355 |
| `innerHTML` | **none** in station/hud/police-leave/jump | grep: modelsbrowser only |
| New event | prefer existing `'commLine'` | `ctx.js` 234 lists `jumpRequested` already |

---

## 12. Fail-closed factions

| Key | In `FACTIONS` | Default bag | Police leave | Kill write | Notes |
|---|---|---|---|---|---|
| independent | yes | no | no system flag match unless a system flies it | skip | `chart-hover.js` 53 political independent |
| hollow | yes | **yes** 0 | systemFactionOf requires `SYSTEMS` + `FACTIONS` | write if hasOwn | authored hush; no `FACTION_SERVICES` row |
| unknowables | yes | no | **blocked** | write if hasOwn | Archive `No sale.` if standing < 0 |
| beautiful | yes | no | **blocked** | write | graft cap −10 |

`standingRead` missing/reserved/non-finite → **0**.

---

## 13. Wishlist leftover (read only)

`docs/PLAYER-EXPERIENCE-WISHLIST.md` 672–681 REP-02 wants standing to affect mission access, prices, **restricted-system or station access**, equipment/ships, **allies and assistance**, local police.

Live today: missions (employer + unique Known gate), prices, locker, yards, hunt, police leave. **Missing:** standing-gated player allies; standing-gated jump/system lock. Dock is intentionally open.

---

## 14. Stale comments (do not copy)

| Stale | Live |
|---|---|
| `RepStandingDesign.md` hail police **none** / police leave **defer** | `police-leave.js` + `npc.js` 2378 |
| `Rep04AttributionDesign.md` police leave **deferred**; kill attrib **none** | leave live; `KILL_STANDING_DELTA = -5` |
| Wave 73 inventory “no bag heal” | `sanitizeReputation` live |
| `RANK_LADDER` cites 672–678 | live **714–721** |
| Digit 9 comment vs shipyard | Digit 0 shipyard; Digit 9 `epics` |
