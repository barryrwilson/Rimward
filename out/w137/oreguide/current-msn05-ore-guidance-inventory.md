# Msn05 contract-to-rock match guidance inventory

**Wave:** 137 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-26).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** give mining contracts ore-type guidance so the player can find a matching rock without a lock-one-at-a-time hunt.  
**Not this leftover:** MSN-04 mining identity uniqueness (twins). AST-02 work-sector find / MATCH lamp. Unique-four replacement. Automine. Agent pad 2B. NAV-11 route persist. Agent evade.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-25 second pass — **201–206** — cite, do not edit): The contract asks for Raw ore, but a rock reveals its type only after a lock, one rock at a time (nearest rock was brine ice; next lock slag iron at 434 u). The refusal toast and lock card are good. Add an ore filter to the scanner or attach a field marker to the contract. AST-02 covers finding rich regions, not matching a rock to a contract.

---

## 1. Mining job generation / board copy (names a specific ore)

| Surface | Today | Cite |
|---|---|---|
| Slot cap | `MINING_SLOTS_PER_SYSTEM = 2` | `station.js` **226** |
| Ore table | hardness `<= 1` keys that exist on `COMMODITIES` | `station.js` **250–253** |
| Live table size | **2** keys: `rawOre`, `livingRock` | `state.js` **387–422**, **354–355** |
| Pick | `pickMiningCommodityExcluding(usedSet)`; bounded `n + 2`; omit if empty | `station.js` **2239–2253** |
| Sibling exclude | offered/accepted mining at origin, authored keys only | `miningSiblingCommodities` **2267–2278**; `makeMiningJob` **2310–2312** |
| Card | `kind: 'mining'`, `slot` 0/1, `commodity` authored, `need: FERRY_UNITS` (**4**) | `makeMiningJob` **2306–2332** |
| Title | ``Mine ${COMMODITIES[commodity].name}`` | **2324** |
| Detail | ``Cut reachable ${oreName} in this system's field and deliver ${need} units at ${stationName}.`` | **2325** |
| Fill | count to 2; omit if pick returns null; heal offered twins | `syncMiningJobs` **2372–2394** |
| Replace | splice + `makeMiningJob` same origin+slot | `replaceMiningJob` **2412–2423** |
| Paint rewrite | always `Mine ${oreName}` + reachable-cut detail | `renderJobs` **5239–5245** |
| Pay line | `Deliver ${need} ${oreName} here — pays ${est} UU` | **5331–5340** |
| Unknown name | `'ore'` without throw | `miningOreName` **2425–2427** |
| Digit 2 Jobs | `DOCK_KEY_SERVICES[1] === 'jobs'` | **189**, **6124–6125** |
| Row paint | `h()` `textContent`; `${i + 1}. ${title}` | **4544–4547**, **5303–5304** |
| Digit accept | `boardJobs(...)[n - 1]` if offered | **6319–6321** |
| Unique four | `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` | `makeJobs` **2106+**; `uniqueFourId` **2451–2452** |

**Job identity already names the ore.** Wave 136 MSN-04 PR1 is **live**. Two mining rows at one origin do not share commodity (offered heal). That is **not** this leftover. This leftover is **finding** the named ore in the field.

Inbox “Raw ore” matches `COMMODITIES.rawOre.name` (`state.js` **354**). Mining contracts are **not** a generic unlabeled haul. The playtest hole is the **field**, not the card title.

---

## 2. Field composition vs mining table (why the hunt exists)

| Surface | Today | Cite |
|---|---|---|
| Band 0 weights | `rawOre` 62, `livingRock` 5, `slagIron` 22, `brineIce` 8, `chromeSalt` 3 | `state.js` **548–554** |
| Pick | `pickOreType(band, rng)` | `state.js` **561–571**; `asteroids.js` **1698–1701** |
| List row | `{ id: i, position, radius, ore, commodity: oreKey, oreKey, hardness }` | `asteroids.js` **1898–1906** |
| `id === index` | Wave 51 contract | `asteroids.js` **1734**, **1898–1899** |
| `fieldOre` | sparse remaining units; `WORLD_FIELDS` | `save.js` **105–106**; `asteroids.js` persist path **1554+** |

A Freehold (band 0) field is **majority** raw ore, **not** all raw ore. Nearest rock can be brine ice (H2) or slag iron (H2). Mining jobs only mint hardness-1 keys. The contract ore and the nearest rock **often disagree**. AST-02 work-sector density does not sort by `oreKey`.

---

## 3. Lock card / refusal toast (inbox: good — keep)

| Surface | Today | Cite |
|---|---|---|
| Lock name | `'ASTEROID'` until a rock lock exists | `hud.js` **2489–2490** |
| Lock meta | ore **name** + `H` + units/NEEDS + dist | **2496–2511** |
| Unknown ore | `'Ore'` | **2497–2498** |
| Color | `.ore-blocked` extra; text still names NEEDS | **2519–2521**; header **51–55** |
| Refusal toast | `'mineBlocked'` → `▲ ` + `blockedLine` | `combat.js` **1573–1584**; `hud.js` **660–664** |
| Throttle | 1/s per asteroid id; reset on `'systemLoaded'` | `combat.js` **1576–1579**, **1833** |
| Blocked line | authored per H2+ ore | `state.js` brineIce **442**, slagIron **426** |

Type is **lock-gated**. Unlocked rocks do not paint an ore name on the bracket. Inbox called the toast and lock card **good**. Msn05 must **not** rewrite refusal copy or drop the lock-card ore line.

---

## 4. Scanner / cycle / group-3 cue (primary hole)

| Surface | Today | Filter by contract ore? | Cite |
|---|---|---|---|
| Group-3 KeyT cycle | ships in range + **all** rocks in `U.TARGET_RANGE` **600** | **No.** Nearest then next, any `oreKey` | `controls.js` `collectCycleCands` **123–148**; `cycleTarget` **163–194**; `state.js` **32** |
| Hostiles-first | TGT-07: intent ships first when any hostile in envelope; rocks never hostile | Cite only | `controls.js` **151–184** |
| Group-3 cue | no rock lock: `Mine · belt ${n}u` toward nearest **any** work-sector rock with `ore > 0` | **No.** Name is `belt`, not the contract ore | `hud.js` **2611–2617**; `beltMineDist` **545–584** |
| Contacts arc | ships only; scanner-gated | **No rocks** | `hud.js` **1728–1754** |
| KeyV reticle lock | lock under the glass | Not a type filter | `controls.js` **35**, **269–271** |
| Arrival line | `Belt lies N u sun-relative, off the station.` | Region, not ore | `jump.js` **49–59**, **179** |
| MATCH lamp | SPD word `MATCH` on ship or rock lock + match-speed | **Not** ore type | `hud.js` **381–389**, **2274** |
| Field marker on contract | **none** | — | census: no job-linked rock mark, no chart ore pip, no world marker type |
| Automine | KeyN on a **locked** asteroid | Lock-first; not this leftover | `controls.js` **36**; `automine.js` |

Playtest sequence maps to live cycle: first T-lock is nearest rock (brine ice), next lock can be slag iron at hundreds of u. Cue still says `belt`, not `Raw ore`.

**No live scanner ore filter. No live contract field marker. No equivalent.** Naming the ore on the Jobs card does not skip brine ice on KeyT.

---

## 5. AST-02 / MATCH (cite only — not the hole)

AST-02 already shipped: work sector, sparse `fieldOre`, arrival `Belt lies …`, group-3 `Mine · belt Nu` (`docs/AstOrbitsDesign.md`; `docs/Ast03RemainingAstDesign.md` leftover **CONSUME**). MATCH on a locked rock holds in the rock rest frame; the lamp reads `MATCH`.

Inbox: AST-02 covers finding **rich regions**, not matching a rock to a contract. Census agrees. Do **not** reopen Kepler-lite, `fieldOre` identity, MATCH semantics, or the MATCH word.

---

## 6. MSN-04 mining identity (cite only — do not steal)

Wave 136 PR1: exclude sibling live commodity on fill/replace; omit if table exhausted; heal offered twins; unique four stay; Digit 2 Jobs; pay unchanged (`docs/Msn04JobDedupDesign.md`; `station.js` **2239–2394**). Optional PR2 other families stay optional (Wave 136 OPEN).

Msn05 does **not** remint cards, merge ids, hide unique four, or retune pay. Commodity uniqueness **stays**.

---

## 7. Save / Agent / overlay honor (cite only)

| Surface | Today | Msn05 claim |
|---|---|---|
| Persist `'jobs'` / `'fieldOre'` | `WORLD_FIELDS` | **Do not** add a guidance flag | `save.js` **84–106** |
| Mining sanitize | id `mine-<SYSTEMS>-<n>`; commodity `ORE_TYPES` ∩ `COMMODITIES`; proto skip | **Do not** rewrite cap | `save.js` **306–316**, **325–328**, **394–403** |
| Agent observe jobs | `id`, `kind`, `state`, optional `commodity` / `need` / `progress` | **Cite only.** Do not claim observe shape as a cheat | `agent-observe.js` **195–226** |
| Agent `acceptJob` | live desk `acceptJob({ id })` when Digit 2 Jobs | **Do not** add lock-by-commodity / warp-to-ore | `agent-api.js` **359–366** |
| Overlay pause | **never** writes `flags.paused` | **Cite only** | `overlay-policy.js` **4** |
| HUD-01 hub | 80 px empty aim glass | **Do not** add an ore pip | honor |
| `state.js` | `ORE_TYPES` / `COMMODITIES` / `ORE_BAND_WEIGHTS` | **READ-ONLY** later unless a tiny authored table is required; prefer **no retune** | — |

---

## 8. What would have been CONSUME

CONSUME + serial **none** only if **both** were live:

1. A mining job already names a specific ore, **and**
2. The player can find matching rocks **without** a lock-one-at-a-time hunt (filter, marker, or equivalent).

Census: (1) **is live** (Jobs title/detail/pay name `Raw ore` / `Living rock`). (2) **is not live** (KeyT all rocks; cue says `belt`; lock card after lock only; no marker).

Do **not** CONSUME on named job copy alone. Do **not** CONSUME on AST-02 belt cue. Do **not** CONSUME on lock-card-after-lock (that **is** the hunt).

---

## 9. Leftover verdict

**REAL.** Named later serial **PR1** (contract-to-rock match guidance: group-3 T-cycle ore filter + named cue). Not CONSUME. Serial is **not** none.

Deputize the **smaller** freeze: HUD/cycle filter, not a new world object type, not MATCH reuse, not band-weight retune, not automine.
