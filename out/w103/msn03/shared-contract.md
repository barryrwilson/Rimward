# MSN-03 unique DONE hide shared contract

**Wave:** 103. Design only. No unique-DONE feature ships in this wave.  
**Status:** MERGE LAW for `docs/Msn03UniqueDoneDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`, `vite`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Msn03ChainsDesign.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02*.md`, `docs/Hud03AlertsDesign.md`, `docs/Rep05ConsequencesDesign.md`, `docs/Tgt*.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Shp*.md`, `docs/Hud02IdentitiesDesign.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave103.md`. Do not edit `src/systems/station.js`, `src/game/save.js`, `src/game/jobs-chains.js`.  
**Locked sources:** leftover named in `docs/Msn03ChainsDesign.md` §4; live inventory `out/w103/msn03/current-msn03-unique-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/jobs-chains.js` (read); `src/game/state.js` (READ-ONLY); `src/systems/hud.js` (read).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 70/81 line numbers.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 103 MSN-03 unique-DONE worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. Digit **2** stays **Jobs** (`DOCK_KEY_SERVICES[1]`, `station.js` 185, 6021–6028). Digit **0** stays **shipyard**. Digit **8** dock root stays **launch**. Digit **9** dock root stays **epics** (label Standing). Do **not** steal those Digits. Do **not** add a memorial Digit.
3. HUD-01 empty **80 px** hub (`src/ui/hud.css` 184–189). No quest widget on the aim glass. Digit 9 is Standing / EPICS, not a quest log steal.
4. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**.
5. Persist: **no** new `WORLD_FIELDS` key. Unique four already persist in `world.jobs` (`save.js` 79, 152–157). Sentinel `state: 'done'` already exists (`save.js` 151; `completeJob` `station.js` 3707–3720). Autosave stays `rimward-save-v1`.
6. **Hide-on-board ≠ delete-from-save.** Do **not** drop unique four from persist. Do **not** splice unique DONE rows. `ensureJobs` reseeds `makeJobs` only when `jobs.length === 0` (`station.js` 2109–2112).
7. `uniqueJobId` allowlist stays `Object.hasOwn(UNIQUE_JOB_KIND, id)` (`save.js` 289–291). Prototype-safe. Reserved ids invalid (`save.js` 109–113, 234–251). Do **not** switch to `in` or `UNIQUE_JOB_KIND[id]` as the existence test.
8. `innerHTML` forbidden. `textContent` / existing `h()` / `btn()` only (`station.js` 4350–4361). Overlay wipe stays `overlay.textContent = ''` (5872).
9. Do **not** invent UU, standing deltas, or SKUs. Unique four rewards stay live integers (inventory §3). Do **not** reopen chain step splice, last-step dart/auto grants, or renewable family caps. Wave 82 chain SKUs stay on **chains** (`jobs-chains.js` 27–33). Unique complete does **not** call `grantChainSku`.
10. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–87).
11. Do **not** “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs. WAVE26 re-offers ferry by **mutating** `state` to `'offered'` before Digit 2 (`scripts/boot-test.mjs` 5933). Hide **done** does not hide that offered card.
12. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave103.md`. Standing deputize (`docs/OwnerDecisionsWave100.md`): pick a playable default, note it here, do not park.
13. Do not reopen MSN-02 families, overlay pirate cap **2**, recovery wreck, or chain one-in-one-out.

---

## 0.1 Wave 103 deputize (owner may override after playtest)

**Picture:** hide unique DONE on the Jobs board the **same way** chain `done` is hidden. Keep the persist row so they do not re-post. Do **not** add a memorial pane. Do **not** add a Digit.

| Question | Default | Why |
|---|---|---|
| Hide which rows? | Exact unique four + `state === 'done'` | Mirror `boardJobs` chain skip (`station.js` 3616) |
| Persist? | Keep the four rows | Cap headroom 4; `ensureJobs` empty-reseed |
| Memorial pane / Digit? | **No** | Digit 2/0/8/9 freeze |
| uniqueRetry haul/ferry Accept on DONE? | **Unreachable** after hide | Live leftover (`station.js` 5206–5208, 4687–4692). Ace/patrol already one-shot. Hide closes mouse retry without splicing. Leave uniqueRetry source in place this serial (WAVE26 does not need the DONE Accept button) |
| Empty board copy? | **No new string** unless `boardJobs.length === 0` after hide **and** playtest asks | Families still sync on home docks. Header `JOBS BOARD — … postings` stays |
| Export `uniqueJobId`? | **Optional.** Prefer exact four id strings in `boardJobs` | Avoid `src/game/save.js` unless DRY is required. Existence test must not use `in` |
| `state.js`? | No write | READ-ONLY |
| SKU / UU? | None | Unique rewards stay live integers |

This deputize is playable. Owner may restore uniqueRetry after playtest. Until then, implement hide + persist-keep. Do not park.

---

## 1. Unique four (do not grow)

Exact live map (`save.js` 152–157):

```
'bounty-ace'          → bounty
'patrol-lane'         → patrol
'haul-provisions'     → haul
'ferry-consignment'   → ferry
```

Later `boardJobs` skip:

```
if (j.state === 'done' && (
  j.id === 'bounty-ace' || j.id === 'patrol-lane'
  || j.id === 'haul-provisions' || j.id === 'ferry-consignment'
)) continue;
```

Place **next to** the live chain skip (`station.js` 3616). Do **not** hide unique `offered` or `accepted`. Do **not** hide overlay `bounty-pirate-*` DONE in this serial. Do **not** hide family rows.

If a later PR exports `uniqueJobId`, board may call it **only** if the export stays `Object.hasOwn`. Do not index `UNIQUE_JOB_KIND` with a raw blob key via `in`.

---

## 2. Persist keep

| Action | Law |
|---|---|
| `completeJob` unique | stays `done` sentinel; no splice |
| Sanitize drop | every `dropJobsUntilCap` pass keeps `uniqueJobId` |
| Cap formula | unchanged (`save.js` 129–138) |
| New `WORLD_FIELDS` | **forbidden** |
| Delete unique DONE on hide | **forbidden** |
| `makeJobs` ids | unchanged (boot pins) |

Hide is a **filter** in `boardJobs`. It is not a healer.

---

## 3. UI (Jobs pane only)

Stay inside `renderJobs` / `boardJobs`. Digit **2**. Two menu levels stay.

- Chain `done` hide stays (`station.js` 3616).
- Unique `done` hide is additive.
- `h()` / `btn()` / `textContent` only.
- Unique offered/accepted cards stay as live (ace hunt line, haul/ferry quotes, Accept).
- uniqueRetry Accept on DONE becomes unreachable because the card is not on the board. Do **not** rewrite `acceptJob` ferry-done reset this serial unless a later owner restores retry.
- Digit accept stays `state === 'offered'` (`station.js` 6082–6084).
- `reducedMotion`: no extra animation; copy stays.
- No HUD glance. No Digit 9 chain/unique log.

Authored empty line is **out** unless playtest proves a dock with `boardJobs.length === 0`. Do not invent “Completed contracts” copy.

---

## 4. uniqueRetry leftover (inventory contradiction)

Live haul/ferry DONE cards show Accept (`station.js` 5206–5208`). Ferry DONE accept resets the persist row to offered (`4687–4692`). That **contradicts** MsnMissionsDesign “never posts a replacement,” but **code wins**.

Wave 103 deputize **closes the board surface** of uniqueRetry by hiding DONE. It does **not** delete the persist row. It does **not** “fix” WAVE26 (tests re-offer by assignment, then Digit 2). It does **not** change haul dest-bind (WAVE35).

If the owner wants haul/ferry forever-repeat, restore uniqueRetry **after** playtest: stop hiding those two ids when `done`, or flip them back to `offered` on complete (out of this serial).

---

## 5. Security freeze

- Job ids: hyphen tokens; `RESERVED_IDS`; `Object.hasOwn` unique map.
- Do not `for…in` merge a jobs blob.
- Unique titles stay `textContent`. Do not `innerHTML` stuffed `job.title`.
- Do not write `reputation[userString]`. Unique patrol still uses live `reputation.freehold +=` (`station.js` 3747). Do not reopen.
- Do not copy stuffed `job.faction`.
- Do not seat dart/auto from unique complete.
- Digit theft forbidden.

---

## 6. Serial PR plan (named only — do not land in Wave 103)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 `boardJobs` hide** | skip unique four + `state === 'done'`; chain hide stays | splice unique, delete persist, uniqueRetry rewrite, SKU, Digit, HUD |
| **PR2 boot pins** | unique four still in `world.jobs` when `done`; Digit 2 Jobs; Digit 0 shipyard; hide chain done still; WAVE26/WAVE35 still pass via offered re-set; no `innerHTML`; no new `WORLD_FIELDS` | wishlist / PROGRESS / OwnerDecisions |

`state.js` untouched. `jobs-chains.js` untouched. `save.js` untouched unless a tiny `export function uniqueJobId` is required for DRY (not required).

---

## 7. Coupling

| Neighbour | Law |
|---|---|
| Chains | hide chain done **stays**. Do not splice last-step law |
| Families | 2-slot rooms stay. Do not hide offered families |
| Overlay pirates | cap 2 stays |
| EPICS / Digit 9 | unchanged |
| Hangar SKUs | unique four do not grant |
| HUD-01 / HUD-03 sibling | no glass widget |
| WAVE26 / WAVE35 | do not “fix” |

---

## 8. Fail-closed later impl

| Condition | Result |
|---|---|
| Unique `offered` / `accepted` | **visible** |
| Unique `done` | **hidden** on board; **kept** in `world.jobs` |
| Jobs array empty after heal | `ensureJobs` reseeds four **offered** uniques |
| `__proto__` job id | drop (live) |
| Stuffed unique kind mismatch | drop (live `UNIQUE_JOB_KIND[id] !== kind`) |
| Hide implemented as splice | **illegal** |
| New Digit / memorial | **illegal** |
