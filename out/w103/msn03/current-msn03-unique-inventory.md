# Wave 103 — live unique-four DONE / Jobs board / persist inventory (MSN-03 leftover)

**Wave:** 103. Design only. Code wins over stale comments and over Wave 70/81 inventory line numbers.  
**Locked sources:** `src/game/save.js`, `src/systems/station.js`, `src/game/jobs-chains.js` (read), `src/game/state.js` (READ-ONLY), `src/systems/hud.js` (read), `src/ui/hud.css` (read).  
**Not this file’s job:** implement hide-on-board. Do not treat comment banners as law. Do not wait on sibling HUD-03 / TGT / BIO / REP-05 files.

If this inventory and live code disagree, **live code wins**. Re-sample before an implementation wave.

---

## 0. What exists (one page)

Live `UNIQUE_JOB_KIND` is **exactly four** ids (`save.js` 152–157):

| id | kind |
|---|---|
| `bounty-ace` | `bounty` |
| `patrol-lane` | `patrol` |
| `haul-provisions` | `haul` |
| `ferry-consignment` | `ferry` |

`uniqueJobId(id)` is `Object.hasOwn(UNIQUE_JOB_KIND, id)` (`save.js` 289–291). Prototype-safe. Reserved ids are invalid earlier in `jobIdTokens` (`save.js` 234–251).

Unique four persist **inside** `ctx.world.jobs`. There is **no** extra `WORLD_FIELDS` key for them (`save.js` 76–101, `'jobs'` at 79). `JOB_STATES` already includes `'done'` (`save.js` 151). `completeJob` writes `state: 'done'` and does not splice (`station.js` 3707–3720).

**Chain leftover vs unique leftover:** `boardJobs` already hides `kind === 'chain' && state === 'done'` (`station.js` 3616). Unique DONE rows **still paint**. `docs/Msn03ChainsDesign.md` §4: “Unique `DONE` rows remain until a later serial. This slice hides **chain** `done` only.” That later serial is this leftover.

Unique complete paths **do not** call `grantChainSku` (`station.js` 3481–3489). Chain last-step grants stay on chains (`jobs-chains.js` `CHAIN_GRANT` 27–33). Unique four rewards stay live integers (table §3). No dart/auto on unique complete.

---

## 1. Persist / sanitize (unique four)

| Surface | Live law | Cite |
|---|---|---|
| Autosave key | `'rimward-save-v1'` | `save.js` 66 |
| `WORLD_FIELDS` `'jobs'` | yes | `save.js` 79 |
| Unique persist key | **none.** Rows live in `jobs` | — |
| `JOB_KINDS` | includes bounty, patrol, haul, ferry, chain, families, recovery | `save.js` 150 |
| `JOB_STATES` | `offered` \| `accepted` \| `done` \| `failed` | `save.js` 151 |
| Unique map | exact four ids | `save.js` 152–157 |
| `uniqueJobId` | `Object.hasOwn(UNIQUE_JOB_KIND, id)` | `save.js` 289–291 |
| Unique kind match | `UNIQUE_JOB_KIND[id] !== kind` → drop | `save.js` 315–316 |
| Hyphen tokens | split `-`; `SAFE_ID` per token; `RESERVED_IDS` on full id and each token | `save.js` 104, 109–113, 240–251 |
| Cap | `4 + 14*N + 16 + CHAIN_ROOM(7)` | `save.js` 126–138 |
| Drop unique? | **never** (`!uniqueJobId(j.id)` on every drop pass) | `save.js` 806–831 |
| `dropJobsUntilCap` | index `for`; skip when `canDrop` false | `save.js` 764–777 |
| Unique bounty vs overlay | overlay `bounty-pirate-*` needs `system`; unique bounty may copy `system` | `save.js` 476–484 |
| `JOB_FIELD_ALLOW` | no `faction`, no launcher/SKU field | `save.js` 158–163 |
| Restore empty jobs | `[]` then `ensureJobs` reseeds unique four | `save.js` sanitize; `station.js` 2109–2112 |

**Cap arithmetic (inventory-time formula; `N_SYSTEMS = Object.keys(SYSTEMS).length`):**

```
JOBS_SANITIZE_MAX = 4 + 14*N_SYSTEMS + 16 + 7
```

The leading **4** is unique-four headroom. Hide-on-board must **not** drop that 4 from persist, or `ensureJobs` reseeds offered unique cards.

`uniqueJobId` is **not** exported. `station.js` does not import it. Board hide can match the four exact id strings.

---

## 2. Seed / complete / uniqueRetry (live)

| Surface | Live law | Cite |
|---|---|---|
| Seed | `makeJobs` returns the four rows | `station.js` 2074–2107 |
| Empty array | `ensureJobs` assigns `makeJobs` | `station.js` 2109–2112 |
| Ace refresh | skip when `bounty-ace` is `done` | `station.js` 2115–2124 |
| Ace pay | `jobPay(ctx, job.reward)`; default bounty **2500** | `station.js` 218–219, 4199–4209 |
| Patrol pay / rep | `PATROL_REWARD` **300**; `reputation.freehold += PATROL_REP` **5** | `station.js` 202–204, 3738–3753 |
| Haul pay | dest `payQuoted` or 140% of buy; `HAUL_UNITS` **5**; `HAUL_MARGIN` **1.4**; `reward` seed **0** | `station.js` 205–206, 2093–2098, 4221–4244 |
| Ferry pay | `FERRY_REWARD` **350**; `FERRY_UNITS` **4** | `station.js` 207–208, 2100–2105, 4245–4252 |
| Complete | `state = 'done'`; no splice | `station.js` 3707–3720 |
| Unique SKU grant | **none** | unique branches never call `grantChainSku` |
| Chain SKU | Freehold `dart` / Red Ledger `auto` if `canSeat` | `jobs-chains.js` 27–33; `station.js` 3481–3512 |
| `uniqueRetry` UI | DONE haul/ferry still show **Accept** | `station.js` 5206–5208 |
| Ferry DONE accept | reset to `offered`, clear origin/dest/`payQuoted`, then front cargo | `station.js` 4687–4705 |
| Haul DONE accept | no special reset; falls through to `state = 'accepted'` + stamp | `station.js` 4986–4993 |
| Digit accept | only `state === 'offered'` | `station.js` 6082–6084 |
| WAVE26 re-offer | boot-test **mutates** ferry to `offered` before Digit 2 | `scripts/boot-test.mjs` 5933–5954 |

**Code wins on uniqueRetry:** haul and ferry are **not** board-one-shot today. Ace and patrol paint `DONE` with no Accept (`station.js` 5302–5303). Digit 1–9 cannot uniqueRetry (done ≠ offered). Mouse Accept can.

WAVE26 quote tests re-set ferry to **offered** before they open Digit 2. Hide-on-board of **done** does not hide those re-offered cards.

---

## 3. Unique four live reward integers (do not invent)

| Id | Live number | Notes |
|---|---|---|
| `bounty-ace` | ace `bounty` or **2500** | `DEFAULT_ACE_BOUNTY` 219; pay via `jobPay` |
| `patrol-lane` | **300** UU + Freehold **+5** | `PATROL_REWARD` / `PATROL_REP`; need **2** |
| `haul-provisions` | seed reward **0**; pay = dest quote of `round(5 * originPrice * 1.4)` | WAVE26 snapshot |
| `ferry-consignment` | **350** UU | dest `jobPayFor`; need **4** |

Do **not** mint a new UU table. Do **not** copy `dart` 6500 / `auto` 4200 onto unique four.

---

## 4. Jobs board (Digit 2)

| Surface | Live law | Cite |
|---|---|---|
| Dock keys | `market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard` | `station.js` 185 |
| Digit 1–9 / 0 | index `d-1`; Digit **0** = last = **shipyard** | `station.js` 6021–6028 |
| Digit **2** | `jobs` | keys[1]; label `Jobs board` 5886 |
| Digit **8** | `launch` | |
| Digit **9** | `epics` (label **Standing**) | 5886, `renderEpics` 5753, `RENDERERS` 5845–5856 |
| `boardJobs` unique | **no** unique DONE skip | `station.js` 3603–3628 |
| `boardJobs` chain | skip `kind === 'chain' && state === 'done'` | 3616 |
| `boardJobs` families | hide foreign **offered** | 3609–3615 |
| Render | `h()` `textContent`; `btn()` | 4350–4361, 5009–5305 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Overlay wipe | `overlay.textContent = ''` | 5872 |
| Unique title | live `job.title` / `job.detail` (not regenerated) | 5030–5031 vs family regen |
| Empty board copy | **none.** `forEach` no-ops | 5027 |
| Overlay pirate cap | **2** | 220, 2156 |
| Chain sync | `syncChainJobs` on render | 5025 |

Home board can exceed 9 cards. Digit 1–9 accept only index 0–8 **and** `offered`. Mouse Accept still works.

---

## 5. HUD / Digit freeze (honor, do not steal)

| Surface | Live law | Cite |
|---|---|---|
| Empty hub | 80 px `.rw-reticle` | `src/ui/hud.css` 184–189 |
| HUD family | **reads** `player.hullKind`; never writes it | `hud.js` 80–87 |
| Quest widget on glass | **none** | — |
| Digit 9 | Standing / epics, not a quest log | `station.js` 185, 5886 |

---

## 6. Owner SKUs (Wave 82) — unique four are not grant targets

`docs/OwnerDecisionsWave82.md` MSN-03 unique SKU grants (Freehold `dart` / Red Ledger `auto` / else credits +2) apply to **chain last step**. Live `CHAIN_GRANT` matches (`jobs-chains.js` 27–33). Unique four complete paths do **not** seat gear. Do not reopen those SKUs here.

---

## 7. What is still missing (this leftover)

1. Unique `state === 'done'` still appears on every Jobs board (`boardJobs` 3603–3628 has no unique skip).
2. Ace / patrol DONE cards are memorial clutter (`DONE` at 5303).
3. Haul / ferry DONE cards also offer **uniqueRetry** Accept (5206–5208).
4. Persist already keeps the four rows so `ensureJobs` does not re-post. Hide ≠ delete.
5. No memorial Digit. No HUD quest widget. No `world.uniqueDone` key.

---

## 8. Stale cites (do not copy)

Wave 70/81 `station.js` line numbers for `boardJobs` / `makeJobs` / Digit 0 are stale. Live Digit 0 is `station.js` 6023–6025. Live `boardJobs` is 3603–3628. Live `UNIQUE_JOB_KIND` is `save.js` 152–157. Wave 81 inventory that said “there is no `kind: 'chain'`” is stale; chains shipped.
