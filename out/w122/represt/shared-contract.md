# Remaining REP leftover shared contract

**Wave:** 122. Design only. No REP feature ships in this wave.  
**Status:** MERGE LAW for `docs/Rep06RemainingRepDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining REP leftover.** Live Digit 9 Standing, kill victim −5, restitution **1200**, police leave `Leave this space.`, covering `Patrol covering.`, inbound `No passage.`, Digit 9 copy of those three lines, REP-03 climb copy, spy expose dest −2, war success dest −2 already meet the named shipped slices. Live NPC patrols spawn as **system flag** (plus optional neighbor), not Freehold-hard-coded. Leave / covering read **system faction**. Hunt reads the patrol hull’s own faction. Patrol **job** Compact +5 is live unique-four + Digit 9 honesty (WAVE111), **owner-frozen as skippable**, not a police hole. Do **not** invent a later serial that retargets patrol jobs, adds a hail leave card, adds `world.wanted`, adds a Digit, or adds a penance `kind`.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/RepStandingDesign.md`, `docs/Rep03RemedialDesign.md`, `docs/Rep04AttributionDesign.md`, `docs/Rep05ConsequencesDesign.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave122.md`. Do not steal sibling Wave 122 paths `out/w122/navrest/**`, `out/w122/tgtrest/**`. Do not steal `out/w111/**`, `out/w107/**`, `out/w104/**`, `out/w74/**` (read ok).  
**Locked sources:** live inventory `out/w122/represt/current-rep-remaining-inventory.md` (code wins); wishlist REP-01…04 (read only); RepStanding / Rep03 / Rep04 / Rep05 (cite, do not edit); Owner Wave 82/93/112 (cite).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale `RepStandingDesign.md` “Patrol remains Freehold until a named serial” when that sentence is read as NPC police in other faction space.

**This leftover is remaining REP after named REP slices.** It is **not** HUD. It is **not** NAV. It is **not** a new Digit. It is **not** a galaxy wanted score. It is **not** `patrol-employer-faction` unless a later census proves spawn/leave/covering forced Freehold.

**Census:** leftover is **CONSUME**. If a later census finds Standing / leave / covering / jump refuse / kill −5 / restitution 1200 / spy-war −2 **gone**, or `world.js` patrol spawn hard-codes `faction: 'freehold'`, re-open as **REAL** and name **PR1** only after that census. Do **not** ship patrol-employer while local police already use the system flag.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-REP work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6034–6038**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. **No new Digit.** First remaining serial (if owner re-opens after a true missing-REP census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` / `h()` only. Live `innerHTML` in `station.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** `crimeScore` / `wanted`. `RANK_LADDER` stays six rungs. `RESTITUTION_UU` **1200** stays. Kill delta **−5** stays. Police leave band stays.
6. Persist: **no** new `WORLD_FIELDS` key. Keep `'reputation'` + `sanitizeReputation`. Autosave stays `rimward-save-v1`.
7. Prototype-safe later helpers: `standingRead` + `Object.hasOwn(FACTIONS)` (`data-trade.js` **73–81**). `sanitizeReputation` drops reserved / non-finite (`save.js` **919–940**). No `for-in` merge of a raw reputation blob.
8. Do **not** invent a galaxy wanted score, a new Digit, a new persist key, invented UU, kit mutate, aim-glass gauges, or a new penance mission family.
9. Do **not** retarget `reputation.freehold += PATROL_REP` as leftover PR1. Compact unique-four + Digit 9 “Freehold Compact only” is **live truth** (WAVE111). `RepStandingDesign.md` “later serial `patrol-employer-faction`” is **stale vs code** for police behavior.
10. Do **not** add a hail leave card. Wave 93: `commLine` only. Live `INTENT_ORDER` has no leave verb.
11. Do **not** reopen restitution 1200, kill −5, covering Known 10, jump `< −25`, BIO graft cap −10, POD rescue +4/+1, Digit 7 160/240.
12. Do **not** steal NAV / TGT leftover siblings. Do not edit honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave122.md`.
13. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake).
14. Fail-closed later (if owner re-opens after a **true** missing-REP census): missing standing → `standingRead` 0; reserved ids drop; leave/covering skip blocked flags; jump skip dest flags; dock stays open. **Never** freeze the sim.
15. Bindings do not change here.

---

## 0.1 Wave 122 deputize (owner may override after playtest)

Pick playable remaining-REP defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent wanted / Digit / UU / penance `kind`.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| Ladder | six rungs Sworn 50 … Marked −1000 | `state.js` **714–721** |
| Kill | −5 victim faction | `kill-standing.js` **6** |
| Restitution | 1200 UU → 0 | `restitution.js` **5**, **62** |
| Leave | `< 0` and `> −10`, 300 u, `Leave this space.` | `police-leave.js` **5–8**, **117** |
| Covering | Known 10, `Patrol covering.` | `police-cover.js` **6–9** |
| Jump refuse | dest `< −25`, `No passage.` | `jump.js` **7–10** |
| Spy expose | dest −2 on accepted lapse | `station.js` **233**, **4168** |
| War success | dest −2 | `station.js` **234**, **3583** |
| Patrol spawn | `def.faction` / neighbor | `world.js` **379** |
| Patrol job | Freehold Compact +5 | `station.js` **3852** |
| Digit 0 | shipyard | **188** |
| Persist | `'reputation'` only | `save.js` **77** |

### Smallest additive punch

**None.** Remaining REP already punches via live Standing / leave / covering / jump refuse / kill / restitution / spy-war.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining REP leftover |
| Fail-closed | standing miss → 0; blocked flags skip; dock open; never pause |
| Additive PR1 | **None.** Do not retarget patrol jobs. Do not add hail leave. Do not add wanted. |
| Not a leftover PR | NAV rest; TGT rest; BIO graft; POD UU; MSN family caps |
| Persist | existing `'reputation'` + `'jobs'` only |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining REP work while leave / covering / inbound refuse / Digit 9 / kill −5 / restitution 1200 / spy-war −2 exist and patrols spawn as the system flag.
- First remaining serial (if owner re-opens after a true missing-REP census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** add `wanted`.
- Patrol Compact +5 job is **not** a police hole. **Never** silently retarget it as leftover PR1.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- Kill = `KILL_STANDING_DELTA` (−5)
- Restitution = `RESTITUTION_UU` (1200) → standing 0
- Leave band = standing `< 0` and `> −10`, radius 300
- Covering min = `COVERING_STANDING_MIN` (10)
- Jump refuse = dest standing `< JUMP_REFUSE_STANDING` (−25)
- Spy expose / war dest = −2
- Patrol job = `PATROL_REP` (5) on `freehold`

---

## 1. What CONSUME means

A later worker must **not** treat `RepStandingDesign.md` “Patrol remains Freehold until a named serial” as a hole in **local police**. Code has system-flag patrols, leave, covering, and hull-local hunt. Markdown freeze records that fact.

Patrol job Compact +5 stays. Digit 9 already tells the player.

Optional later census (named only, not PR1): re-grep `Leave this space.`, `Patrol covering.`, `No passage.`, `KILL_STANDING_DELTA`, `RESTITUTION_UU`, `SPY_EXPOSE_DELTA`, `faction: i === 0 ? def.faction`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

`RANK_LADDER` stays six. Digit 9 stays Standing. Digit 0 stays shipyard. Unique four `patrol-lane` stays Compact. Covering stays Known 10. Jump refuse stays Marked exclusive. Dock stays open. BIO cap stays −10. POD rescue stays 4/1.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining REP** | **Does not exist.** Leftover CONSUME | `patrol-employer-faction`; hail leave card; wanted; new Digit; new persist key; penance `kind`; UU invention |
| **PR-census (optional skip)** | Re-grep leave / covering / jump / kill −5 / 1200 / spawn `def.faction` | New world field; Digit steal; `state.js` write |

First remaining REP serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 4. Wins vs integrator brief

If `docs/Rep06RemainingRepDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats stale “later serial” prose.
