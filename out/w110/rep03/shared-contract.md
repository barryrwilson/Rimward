# REP-03 remaining remedial missions shared contract

**Wave:** 110. Design only. No remedial-mission feature ships in this wave.  
**Status:** MERGE LAW for `docs/Rep03RemedialDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Rep05ConsequencesDesign.md`, `docs/Rep04AttributionDesign.md`, `docs/RepStandingDesign.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Phy*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, `docs/Ast*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave110.md`.  
**Locked sources:** wishlist REP-03 (hostile leave, risky dock, restitution to neutral, **then** remedial missions rebuild genuine standing, POD-01 survivor return); live inventory `out/w110/rep03/current-rep03-inventory.md` (code wins); Wave 83 restitution desk; Wave 95 police leave; Wave 104/107 covering + jump refuse + Digit 9 live copy; live Digit 2 renewable families that already write `MINING_REP`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over “remedial missions are not shipped” if that is read as “no standing writers exist.” **Writers exist. Named Digit 9 loop copy does not.**

**This leftover is Digit 9 framing of existing renewable job standing writes after restitution-to-0.** It is **not** a new job `kind`. It is **not** a wanted meter. It is **not** Digit 2 reopen. It is **not** REP-05 covering/jump. It is **not** POD-01 (LIVE). It is **not** restitution retune.

**Police leave** is **landed**. Do **not** add a second hail.

**Restitution 1200 → 0** is **landed**. Do **not** retune `RESTITUTION_UU`.

**Risky dock** is **landed**. Do **not** standing-gate berth.

**POD-01** survivor return is **landed**. Do **not** retune `RESCUE`.

**REP-05** covering / inbound jump / Digit 9 live-consequence lines are a **sibling**. Do **not** edit `docs/Rep05ConsequencesDesign.md`. Do **not** impersonate covering Known 10, jump −25, or kill −5.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No wanted pip, standing pip, remedial marker, or law-ring on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `src/ui/hud.css` 184–193). **Do not** put remedial chrome inside `.rw-reticle`. **No new DOM on the hub.** **No toast required** (job `commLine` + Digit 9 notes already exist).
3. Digit 0 stays **shipyard** (`station.js` 188, 6075–6077). Digit 8 dock root stays **launch**. Digit 9 dock root stays **Standing** (`epics`). Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 6152–6154). Digit 2 stays **Jobs**. First remaining serial **must not steal Digit 0/8/9**. **Must not steal Digit 2.** **No new Digit.** Remedial copy is a Digit 9 note, not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Live `station.js` `h()` already uses `textContent` (4387–4392).
5. `src/game/state.js` is READ-ONLY later. **No** `REMEDIAL_*` on `state.js`. **No** new `RANK_LADDER` rungs. **No** new class keys. Do **not** retune `RESTITUTION_UU` (1200). Do **not** retune `MINING_REP` (2), `PATROL_REP` (5), `KILL_STANDING_DELTA` (−5), `COVERING_STANDING_MIN` (10), `JUMP_REFUSE_STANDING` (−25), `RESCUE`, or `WAR_TARGET_DELTA`. Do **not** invent UU except a later consolation integer that is **not** 1200 — **this leftover does not need one** (chain compact-thanks +2 UU already exists; do not add another).
6. Persist: **no** new `WORLD_FIELDS` key. Inventory proves standing writes already live on `world.reputation` and jobs on `world.jobs` (`save.js` 76–78, 918–938). Autosave stays `rimward-save-v1`. **No** `world.wanted`. **No** `world.remedial`. **No** new `localStorage` key.
7. Prototype-safe later helpers: never `for-in` merge from save reputation into a bag. Use `standingRead` / `writeFactionStanding` / `Object.hasOwn(FACTIONS, key)`. Do not index user strings as `bag[userKey]` without `Object.hasOwn(FACTIONS, key)`. Do not `innerHTML` job titles from save.
8. Do **not** standing-gate dock. Risky run stays (`station.js` 6222–6233).
9. Do **not** reopen Digit 2 family caps, unique four (`save.js` 152–157), or MSN-03 chain gate (`jobs-chains.js` 84–86 Known `tier >= 1`).
10. Do **not** add a new job `kind` unless a re-census proves **no** existing kind writes positive dock-flag standing after 0. Inventory **proves** mining/trade/hunt/passenger/explore/espionage/war already do. **Prefer reuse.**
11. Do **not** impersonate kill −5, covering Known 10, or jump −25 as remedial knobs.
12. BIO/MSN unique SKU, PHY-05 pad-home, kit mutate omit — **not** this brief.
13. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Phy/Owner docs, wishlist, `PROGRESS.md`, `docs/Rep05ConsequencesDesign.md`, `docs/Rep04AttributionDesign.md`, `docs/RepStandingDesign.md`. Do not write `docs/OwnerDecisionsWave110.md`. Deputize defaults live in **this** contract.
14. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). Later serial **may** add a Digit 9 copy pin. Do not edit `boot-test.mjs` in the Wave 110 markdown worker.
15. CPU freeze: **no** wanted meter sim. Copy is O(notes) on Digit 9 render. Do not alloc a new bag per job.
16. Fail closed: if the remedial-notes helper is missing, Digit 9 still shows **Pay restitution** / short note / live `standingMoveNotes` / `standingLiveNotes` / ladder / epics. **Never** blank Standing. **Never** throw. **Never** hide restitution when standing `< 0`. **Never** steal Digit 0/2/8/9 when helper is missing.
17. Reuse live standing writers (`MINING_REP` / existing job success deltas / `writeFactionStanding`). Do **not** add a parallel writer. Do **not** retune those deltas.
18. Do **not** claim patrol rebuilds the **offended** dock flag. Patrol credits **Freehold only** (`station.js` 3784, 1156).
19. Do **not** claim jobs are locked until restitution. Renewable families already post at standing `< 0`. Restitution is the **reset to 0**; jobs are the **climb from 0**. Copy must not lie. Climb notes **must remain visible at standing ≥ 0** (not parented to the Pay-restitution block).
20. Beautiful graft cap stays (`hangar.js` 152–167). Copy must not claim grafted Beautiful climbs to Known while the cap holds.

---

## 0.1 Wave 110 deputize (owner may override after playtest)

Pick playable remedial defaults. **Writers already exist** (inventory §3). Do not park. Do not invent a new `kind`. Do not invent UU / Digit / wanted.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `RESTITUTION_UU` | **1200** | `restitution.js` 5 |
| Restitution write | offended key **= 0** | `restitution.js` 62 |
| `MINING_REP` | **2** dock/origin flag | `station.js` 232, 3902 |
| `PATROL_REP` | **5 Freehold** | `station.js` 206, 3784 |
| `RANK_LADDER` at 0 | Stranger tier 0 | `state.js` 714–721 |
| Known | min **10** tier 1 | `state.js` 717 |
| Chain gate | Known | `jobs-chains.js` 84–86 |
| Family caps | 2 / system | `station.js` 225–231 |
| Leave / covering / jump / kill | live | inventory §4 |

Do **not** “fix” REP-03 by adding `kind: 'remedial'` or by lowering the chain gate to Stranger.

### Smallest additive leftover (reads as copy, not a new career)

**Name:** after restitution to **0**, Digit 9 names **existing** renewable job families as the path that rebuilds **positive** standing with the offended (dock) flag.

| Piece | Freeze |
|---|---|
| Fail-closed | If `standingRemedialNotes` (name may vary) is missing, **do not** throw. Keep Pay restitution + live move/live notes. Never blank Digit 9. |
| Additive PR1 | Export a small notes helper (or one extra frozen string from existing `standingMoveNotes`) that Digit 9 `renderEpics` prints via live `h(..., textContent)`. String uses live `MINING_REP`, dock-flag language, and Known 10 from `ladderNameAt(10)`. Point at **Jobs board** (Digit 2) without binding a new hotkey. |
| Not PR1 | new `kind`; Digit 2 sync/accept rewrite; family caps; unique four; chain gate; `RESTITUTION_UU`; `MINING_REP` retune; `state.js`; `WORLD_FIELDS`; HUD; wanted; leave/covering/jump; POD-01 deltas |
| Families named | mining, trade, hunt, passenger, explore, spy, war — the live +2 dock/origin writers |
| Not named as rebuild | unique four except Freehold patrol (say Freehold only if patrol is mentioned); chains (Known gate) |
| Shape | One or two `screen-note` lines under **HOW STANDING MOVES** (preferred) or a short **AFTER RESTITUTION** subhead that still uses `h()` textContent. **Normative: do not nest climb notes inside the standing `< 0` RESTITUTION block** (`station.js` 5821). After pay that block **hides**; the climb line must still show. **No new Digit.** |
| Persist | **none** |
| Climb math | 0 + five × `MINING_REP` 2 = **10 Known**. Honest. Do not invent a fifth job. |

Owner freeze (do not invert):

- Prefer reuse live standing writers over a new `WORLD_FIELDS` key.
- Persist rewrite is **not** required. Inventory: restitution-to-0 leaves job sources for that faction.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`. Must **not** steal Digit 2.
- If the notes helper misses, Digit 9 is unchanged (live). **Never blank Standing.**
- Copy must not lie: jobs already work below 0; restitution is reset; genuine climb is +2 dock-flag work from 0.

### Formulas (later impl)

```
// honor live writers; do not fork math
applyRestitution → bag[faction] = 0   // already live; do not change
job success (mining|trade|hunt|passenger|explore|espionage|war)
  → dock/origin faction += MINING_REP (2)   // already live; do not change

// Digit 9 extra note (new copy only)
After restitution, this dock is 0 (Stranger).
Jobs board mining, trade, hunt, passenger, explore, spy, and war add +2 to this dock's flag.
That is how standing climbs from 0. Five such jobs reach Known 10.
Patrol adds +5 Freehold only.
```

Do **not** persist a “remedial offered” flag. Standing `< 0` already gates the restitution block.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| New job `kind` `'remedial'` / `'penance'` | **Forbidden** §0.10 |
| New `WORLD_FIELDS` / wanted meter | **Forbidden** §0.6 |
| Steal Digit 2 / new Digit | **Forbidden** §0.3 |
| Steal Digit 0/8/9 | **Forbidden** §0.3 |
| `state.js` write | **Forbidden** §0.5 |
| Retune `RESTITUTION_UU` / `MINING_REP` | **Forbidden** §0.5 |
| Impersonate kill −5 / covering 10 / jump −25 | **Forbidden** §0.11 |
| Lower chain gate to Stranger | **Forbidden** §0.9 |
| Reopen unique four / family caps | **Forbidden** §0.9 |
| Standing-gate dock | **Forbidden** §0.8 |
| Hub pip / RANGE rewrite | **Forbidden** §0.2 |
| Second police hail | **Forbidden** — leave is LIVE |
| Retune graft / `RESCUE` | **Forbidden** §0.5, §0.20 |
| Invent consolation UU = 1200 | **Forbidden** §0.5 |
| Claim jobs locked until restitution | **Forbidden** §0.19 |
| Claim patrol rebuilds every dock flag | **Forbidden** §0.18 |
| Blank Digit 9 if helper missing | **Forbidden** §0.16 |
| `innerHTML` job titles | **Forbidden** §0.4 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| Digit 9 remedial note helper | REP-03 PR1 (`station.js` notes + `renderEpics`) | Digit 9 panel |
| `standingMoveNotes` / `standingLiveNotes` | optional one-line extend; **must remain if helper missing** | `renderEpics` |
| Job success standing | **none** (already live) | Digit 9 numbers, NPC hunt/leave |
| `applyRestitution` | **none** | Digit 9 desk |
| Digit 2 `sync*` / `acceptJob` | **none** | — |
| `jobs-chains.js` gate | **none** | — |
| `state.js` | **none** | `RANK_LADDER` / `RESCUE` read |
| HUD / Digit map | **none** | — |
| `WORLD_FIELDS` | **none** | — |
| police-leave / cover / jump / kill | **none** | consume |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| Remedial notes helper missing | Digit 9 live copy; Pay restitution still works; never throw |
| `standingMoveNotes` unchanged | still true (mining +2 exists) |
| Standing `< 0` | restitution desk unchanged |
| Standing `=== 0` | restitution hidden; jobs still +2 |
| Beautiful graft | cap −10; do not lie about Known |
| Unknown faction / reserved | `standingRead` 0; `writeFactionStanding` false |
| Digit 2 helper missing | **irrelevant** — this leftover does not rewrite Digit 2 |
| NaN standing | `standingRead` 0 |

Never: new persist key. Never: `innerHTML`. Never: steal Digit 0/2/8/9. Never: blank Standing.

---

## 3. Serial PR plan (named only)

Do **not** implement in Wave 110.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 Digit 9 copy** | Fail-closed notes helper + `renderEpics` `textContent` line(s) naming live +2 families after 0; Known 10 climb; patrol Freehold-only if mentioned | `state.js`; Digit 0/2/8/9 steal; new `kind`; new `WORLD_FIELDS`; family caps; unique four; chain gate; UU retune; HUD; leave/covering/jump; POD-01 |
| **PR2 pins** | Optional WAVE boot / grep: Digit 9 string names Jobs / +2 / after restitution; grep no new persist key; no hub child; no `kind: 'remedial'`; `innerHTML` = 0 on touched paths | Known boot FAIL fixes (WAVE4/26/35); wishlist rewrite |
| **PR3 census (optional)** | Re-grep job writers still +2 with no standing gate; only if a later wave added a gate | New world field; retune `MINING_REP` |

First remaining serial is **PR1**. It must **not** steal Digit 0/8/9. It must **not** steal Digit 2. It must **not** write `state.js`.

---

## 4. Security freeze (later impl)

1. No new persist blob → no proto merge from save.
2. No new DOM on hub. Digit 9 uses live `h()` `textContent`.
3. No user-authored HTML from job titles / faction names. `factionDisplayName` already drops unknown keys.
4. Faction allowlist `Object.hasOwn(FACTIONS)`. Unknown → skip write (live `writeFactionStanding`).
5. Do not `for-in` a save reputation bag in the new helper (helper is copy-only).
6. Do not log player names beside standing.
7. No secrets.
8. Never blank Digit 9 (availability).
9. Do not debit UU in the copy PR. Restitution debit stays in `applyRestitution`.
10. Do not impersonate 1200 / −5 / 10 / −25 in new constants.

---

## 5. Acceptance direction (implementation wave)

1. After `applyRestitution` ok, dock standing is 0 (Stranger) unless Beautiful graft caps −10.
2. Digit 2 still offers mining (and live sibling families). Completing one adds **+2** to that dock flag. Standing becomes **+2** (or stays capped if graft).
3. Digit 9 names that path. Copy does not invent a `kind`. Copy does not say jobs were locked until pay.
4. Fail closed: missing helper → live Digit 9 (Pay restitution / move / live notes). Never throw. Never blank.
5. Five +2 successes from 0 reach Known 10 (unless graft). Chains still gate Known. Covering still Known. Do not retune those.
6. No new persist key. Digit 0 shipyard. Digit 2 Jobs. Digit 8 launch. Digit 9 Standing. Hub 80 px empty of new children.
7. No wanted meter. No new job kind. No `state.js` write.
8. Police leave / dock-open / restitution 1200 / POD-01 / covering / jump unchanged.
9. `innerHTML` = 0 on paths the serial touches.
10. Known boot FAILs untouched.
