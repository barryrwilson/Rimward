# Msn04 procedural job-posting identity inventory

**Wave:** 130 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** deduplicate procedural mining postings that share player-visible identity.  
**Not this leftover:** mining ore-type guidance (inbox P2 MSN/AST). AST-02 rich-region find. Unique-four replacement (MSN-01 / `Msn03UniqueDoneDesign.md`). NAV-10 dock approach. TGT-07 combat cycle.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass — **184–186** — cite, do not edit): The Freehold board showed two identical `Mine Raw ore, 784 UU` postings as jobs 8 and 9. MSN-01 covers replacement of completed jobs, not duplicate generation.

---

## 1. Mining fill (primary hole)

| Surface | Today | Cite |
|---|---|---|
| Slot cap | `MINING_SLOTS_PER_SYSTEM = 2` | `station.js` **225** |
| Ore table | hardness `<= 1` keys that exist on `COMMODITIES` | `station.js` **249–252** |
| Live table size | **2** keys: `rawOre`, `livingRock` | `state.js` **387–409**, **354–355** |
| Pick | independent `Math.random` index; empty table → `'rawOre'` | `pickMiningCommodity` **2238–2242** |
| Id | `mine-<sysId>-<n>`; scan max then increment `miningSeq` | `nextMiningId` **2244–2263** |
| Card | `kind: 'mining'`, `slot` 0/1, `need: FERRY_UNITS` (**4**), `reward: miningPayBase` | `makeMiningJob` **2269–2291** |
| Title | ``Mine ${COMMODITIES[commodity].name}`` | **2283** |
| Pay formula | `round(need * priceOf(ctx, commodity) * HAUL_MARGIN)` then `jobPayFor` at origin | `miningPayBase` **2265–2267**; `HAUL_MARGIN` **204**; accept **4838–4839**; render **5242–5251** |
| Fill | count live offered/accepted mining at origin; push until count is 2; first free slot 0 then 1 | `syncMiningJobs` **2293–2314** |
| Replace | splice + `makeMiningJob` same origin+slot; skip if slot still taken | `replaceMiningJob` **2332–2343**; expire/pay **3932–3977** |
| Commodity uniqueness | **none.** Two slots may pick the same key | `makeMiningJob` **2273**; `syncMiningJobs` **2306–2313** |

`makeMiningJob` does **not** read sibling live cards. `syncMiningJobs` tracks **slot numbers**, not commodities. `nextMiningId` only makes **ids** unique. Distinct ids (`mine-freehold-8` vs `mine-freehold-9`) can still paint identical player rows.

**Inbox 784 UU:** book `COMMODITIES.rawOre.base` is **140** (`state.js` **354**). `4 * 140 * 1.4 = 784`. When Freehold `world.prices.rawOre` matches book (or is missing and `priceOf` falls through to book, `station.js` **2063–2068**), both rows quote **784** UU.

**Inbox jobs 8 and 9:** Digit rows are `boardJobs` index `i + 1` (`station.js` **5145**, **5214**), not the `mine-*-n` suffix. Unique four plus overlays plus first mining slot can land the twin pair at board positions 8 and 9 at Freehold.

---

## 2. Player-visible mining identity

Inbox identity for this leftover: **commodity + need + reward + origin**.

| Field | Live | Same for twins? |
|---|---|---|
| Commodity | `job.commodity` → `COMMODITIES[key].name` (`'Raw ore'`) | Yes if pick collides |
| Need | `FERRY_UNITS` **4** always at mint | Always same |
| Origin | `originSystem` = current dock on fill | Always same for the two slots |
| Reward | `miningPayBase` then origin `jobPayFor` / `payQuoted` | Same when commodity matches |
| Title row | `Mine Raw ore` | Same |
| Pay row | `Deliver 4 Raw ore here — pays 784 UU` | Same |
| Deadline | `ctx.world.time + 600` at mint | Same frame fill → same clock |
| Id | `mine-<sys>-<n>` | **Different** (not player identity) |
| Slot | 0 vs 1 | Hidden from the row copy |

`miningOreName` (`station.js` **2345–2347**) maps unknown commodity to `'ore'` without throw. Render pay uses the same hasOwn gate (`5243–5247`). Mint path `COMMODITIES[commodity].name` (`2274`) assumes the pick key is on `COMMODITIES`.

**P(twin) at live table size 2:** independent rolls → **1/2**. The playtest pair is the expected path, not a rare seed.

---

## 3. Sanitize vs twins

| Surface | Today | Cite |
|---|---|---|
| Persist key | `WORLD_FIELDS` includes `'jobs'` | `save.js` **80–83** |
| Cap | `4 + 2*N*7 families + 16 + 7` | `save.js` **125–142** |
| One-job heal | kind/state allowlist; mining id `mine-<SYSTEMS>-<n>`; proto/`__proto__` drop; commodity must be `ORE_TYPES` ∩ `COMMODITIES` | `sanitizeOneJob` **302–399** |
| Id collision | first id wins; later duplicate **id** dropped | `sanitizeJobs` **790–798** |
| Extra family | extra **same origin+slot** offered (keep lowest `n`, keep accepted) | `extraOfferedFamily` **606–631**; `extraOfferedMining` **633–635** |
| Cap drop | extra same-slot mining first; never unique four; never accepted | `dropJobsUntilCap` **768–850** |

Sanitize **does not** treat two slots with the same commodity as extras. Slot 0 + slot 1 both `rawOre` is **legal** for restore. Cap drop does **not** close the inbox hole. Distinct ids survive.

---

## 4. Digit 2 Jobs board

| Surface | Today | Cite |
|---|---|---|
| Dock Digit 2 | `DOCK_KEY_SERVICES[1] === 'jobs'` | `station.js` **188**, **6169–6176** |
| Pane | `ui.level === 2 && ui.service === 'jobs'` | **2368**, **5125** |
| Sync on paint | bounty / pirate / recovery / **mining** / trade / hunt / passenger / explore / spy / war / chain | **5131–5141** |
| Row paint | `h()` `textContent`; `${i + 1}. ${title}` | **4464–4468**, **5214** |
| Mining title rewrite | always `Mine ${oreName}` | **5150–5156** |
| Mining pay rewrite | `Deliver ${need} ${oreName} here — pays ${est} UU` | **5242–5251** |
| Digit accept | `boardJobs(...)[n - 1]` if offered | **6230–6232** |
| Unique four | `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` | `makeJobs` **2098–2130**; `uniqueFourId` **2371–2374**; `boardJobs` **3673–3684** |

`innerHTML` is **not** used on this pane (`h()`). Digit 0 is shipyard (`DOCK_KEY_SERVICES` last + Digit 0). Digit 8/9 stay outfitting papers on that desk (`1644–1645`, **6248–6250**). Msn04 does **not** remap digits.

---

## 5. Other renewable families (same-row twins)

PR1 may stay **mining-only**. Census still records other twins so the owner can override.

| Family | Slots | Identity uniqueness live? | Twin risk | Cite |
|---|---|---|---|---|
| Mining | 2 | **No** commodity exclusion | **Yes** — playtest hole | `syncMiningJobs` **2293–2314** |
| Trade | 2 | **No** commodity exclusion | **Yes.** `TRADE_SEED` is `provisions, provisions, refinedMetals, rawOre` (P(provisions)=1/2). Dest is the same `otherSystemId`. Need is `HAUL_UNITS` **5**. Same commodity → same haul row | `TRADE_SEED` **248**; `pickTradeCommodity` **2405–2407**; `makeTradeJob` **2450–2475**; `syncTradeJobs` **2477–2498** |
| Passenger | 2 | **No** identity split | **Always.** Both cards title `'Escort passengers'`, same dest, same `FERRY_REWARD` | `makePassengerJob` **2783–2804**; `syncPassengerJobs` **2806–2827**; render **5170–5175** |
| Explore | 2 | Landmark by `slot % lms.length` | **Yes if one landmark.** Two slots wrap to the same site | `pickExploreLandmark` **2866–2869**; `resolveExploreSite` **2872–2881** |
| Hunt | 2 | `recordId` bound; skip if quarry used | **No same-quarry twin.** Two cards can still share fallback name if records collide (sanitize has `extraDuplicateHuntRecords`) | `huntBoundRecordIds` **2610–2618**; `syncHuntJobs` **2683–2716**; `save.js` **704–733** |
| Espionage | 2 | dest = rival list `[slot]`; skip if dest bound | **No** if rival list length ≥ 2. Slot 1 is **omitted** if list length is 1 (`n >= list.length`) | `resolveEspionageDest` **3083–3089**; `syncEspionageJobs` **3161–3183** |
| War | 2 | `recordId` bound | **No same-quarry twin** | `warBoundRecordIds` **3328–3337**; `syncWarJobs` **3449–3458** |
| Unique four | 1 each | Fixed ids | **No.** Not renewable fill | `makeJobs` **2098–2130** |
| Pirate bounty overlay | cap 2 | named targets | Not this leftover | `PIRATE_BOUNTY_CAP` **223** |
| Recovery | 1 wreck | wreck id | Not this leftover | `syncRecoveryJob` on render **5133** |
| Chains | per employer | authored ids | Not this leftover | `syncChainJobs` **5141** |

Hunt and war already bind **record** identity. Espionage binds **dest**. Mining and trade bind only **slot**. Passenger is authored identical. Explore wraps landmarks.

---

## 6. MSN-01 replacement (not the hole)

MSN-01 (`docs/MsnMissionsDesign.md`) is one-in-one-out: complete or expire splices the row and posts a **new** mining card for the same origin+slot (`replaceMiningJob` **2331–2343**). Replacement **does** run. The new card still calls `pickMiningCommodity` with no sibling exclusion, so replacement can mint a twin of the remaining live slot.

Unique-four `DONE` hide-without-splice is `boardJobs` **3680–3684** / Msn03 unique-done. **Do not** reopen unique-four replacement here.

---

## 7. Agent / overlay / HUD honor (cite only)

| Surface | Today | Msn04 claim |
|---|---|---|
| Agent `act` | `ping` / `disable` / else `'unknown'` | **Do not** add job-accept cheat | `agent-api.js` **129–150** |
| Overlay pause | **never** writes `flags.paused` | **Cite only** | `overlay-policy.js` **4** |
| HUD-01 hub | 80 px empty aim glass | **Do not** add a job pip | honor |
| `state.js` | `COMMODITIES` / `ORE_TYPES` / `FERRY_UNITS` live | **READ-ONLY** later | — |

---

## 8. What would have been CONSUME

CONSUME + serial **none** only if live fill already forbade two offered (or other live) mining cards with the same player-visible identity (commodity + need + reward + origin) at once.

Census: **not live.** Slot fill is count-based. Pick is independent. Sanitize keeps both slots.

---

## 9. Leftover verdict

**REAL.** Named later serial **PR1** (mining identity uniqueness on fill and replace). Not CONSUME. Serial is **not** none.

Trade, passenger, and one-landmark explore **can** twin. They are **not** the playtest hole. PR1 stays mining-only unless the owner overrides after playtest. Optional later families are **not** required with PR1 (do not steal optional PR2s).
