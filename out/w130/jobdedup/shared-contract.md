# Msn04 job-posting identity shared contract

**Wave:** 130. Design only. No job-dedup ships in this wave.  
**Status:** MERGE LAW for `docs/Msn04JobDedupDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (mining fill/replace identity uniqueness).  
**Name:** two live mining cards at one origin must not share player-visible identity (commodity + need + reward + origin).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02*.md`, `docs/Msn03*.md`, `docs/Ast*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/Hud0*.md`, `docs/Ctl*.md`, `docs/AgentApiDesign.md`, `docs/OwnerDecisions*.md`. Do not steal NAV-10 dock approach, TGT-07 combat cycle, mining ore-scanner guidance (inbox P2 MSN/AST), AST-02 rich-region find, unique-four replacement. Do not write `out/w130/jobdedup/verify/**`. Do not write sibling `out/w130/` packs.

**Locked sources:** wishlist INBOX (P2, MSN) lines **184–186** (cite, do not edit); live inventory `out/w130/jobdedup/current-msn04-job-dedup-inventory.md` (code wins); MSN-01 replacement already live (`replaceMiningJob`); Wave 118 CTL-02 mutex + **never write `flags.paused`** (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest “jobs 8 and 9”: those numbers are `boardJobs` paint order, not `mine-*-n`.

**This leftover is mining identity uniqueness.** It is **not** ore-type scanner guidance. It is **not** unique-four replacement. It is **not** AST-02. It is **not** NAV-10. It is **not** TGT-07.

**Live hole:** `pickMiningCommodity` is independent (`station.js` **2238–2242**). `syncMiningJobs` fills two slots by **count** (`2293–2314`). `nextMiningId` only uniquifies ids (`2244–2263`). Two offered mining rows can paint `Mine Raw ore` + the same UU. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. Digit **2** stays Jobs (`DOCK_KEY_SERVICES[1]`, `station.js` **188**). **No new Digit.**
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. **Do not remap those keys.**
4. `innerHTML` forbidden later. Jobs pane stays `h()` `textContent` (`station.js` **4464–4468**). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY. Persist: **none** new. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist a “dedup mute” / god-mode twin flag. `world.jobs` stays the existing array.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Msn04 **cites** overlay-policy only. Do **not** claim `overlay-policy.js`.
7. MSN-01 one-in-one-out stays. Do **not** stop `replaceMiningJob`. Do **not** hide unique four. Do **not** splice unique-four `DONE` here (Msn03 unique-done sibling).
8. Pay formula stays. Do **not** retune `HAUL_MARGIN`, `FERRY_UNITS`, `miningPayBase`, `jobPayFor`, `PAY_QUOTED_MAX`, or book prices.
9. Do **not** add an ore-scanner filter or field marker. That is inbox P2 MSN/AST (later wave). Do **not** steal AST-02.
10. Agent API must **not** become a job-accept cheat. Do **not** claim `agent-api.js`. Do **not** add `act({ name: 'acceptJob' })` (or equal) that bypasses dock / Digit 2 / offered state.
11. Do **not** steal NAV-10 dock approach or TGT-07 combat cycle. Do **not** steal optional PR2s.
12. Fail closed:
    - Unknown commodity → skip the card / treat as `'ore'` on paint; **never throw**.
    - Empty or size-1 `MINING_ORE_KEYS` after exclusion → **omit** the second card. Do **not** force a twin. Do **not** spin forever.
    - Sanitize still **caps length**. PR1 must not raise or lower `JOBS_SANITIZE_MAX`. PR1 must not drop unique four or accepted jobs to “fix” twins.
    - Prototype / reserved ids: keep live `sanitizeOneJob` allowlist. Never `jobs[id] =`. Never `for-in` a job blob onto `world`.
    - Missing `COMMODITIES[key]` at mint → return `null` (no card), do not throw.
13. `reducedMotion`: **no** new animation. Color is not the only cue (distinct **title + pay text**).
14. Accessibility: distinct mining rows named in **text** (ore name + pay). **No new Digit.**
15. CPU: no per-frame DOM alloc beyond the live `renderJobs` path. Dedup runs when mining is minted (sync/replace), not every HUD frame in flight.
16. Prototype-safe: authored commodity keys only (`MINING_ORE_KEYS` / `ORE_TYPES` ∩ `COMMODITIES`). Never copy attacker keys from save into pick.
17. Do not “fix” known REDMARCH `castMatches` flake.
18. Do not steal sibling Wave 130 packs. Do not edit the wishlist or `PROGRESS.md`. Deputize defaults live in **this** contract.
19. Do **not** merge mining ids. Do **not** collapse two slots into one id. Two slots may remain; they must **differ in commodity** (or the second card is omitted).
20. Do **not** change `need`. Do **not** mint a fake second origin. Do **not** use `Math.random` as a security boundary (game pick only).

---

## 0.1 Wave 130 deputize (owner may override after playtest)

Pick a playable **mining identity uniqueness**. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Mining slots | 2 per system | `station.js` **225** |
| Ore table | `rawOre`, `livingRock` | **249–252**; `state.js` **387–409** |
| Need | `FERRY_UNITS` **4** | `station.js` **210**, **2276** |
| Margin | `HAUL_MARGIN` **1.4** | **204** |
| Deadline | 600 s | `MINING_DEADLINE` **236** |
| Raw ore book | 140 UU → 4×140×1.4 = **784** | `state.js` **354** |
| Id allocator | `nextMiningId` monotonic | **2244–2263** |
| Sanitize extra | same origin+**slot**, not commodity | `save.js` **606–635** |
| Agent job act | **not live** | `agent-api.js` **150** |

Do **not** “fix” the hole by hiding unique four, by merging ids, by changing pay, or by adding a scanner filter.

### Playable policy (smallest additive)

**Name:** when minting a mining card for an origin, pick a commodity that no other **offered or accepted** mining card at that origin already uses. If the table cannot supply a different key, **omit** the card.

| Piece | Freeze |
|---|---|
| **Who** | Mining fill (`syncMiningJobs`) and mining replace (`replaceMiningJob` / `makeMiningJob`). Not unique four. Not hunt/war record bind (already unique). |
| **Identity** | `commodity` (player name) + `need` + computed pay + `originSystem`. Live need and origin are already shared; uniqueness **is** commodity at origin. |
| **Slot 0** | Pick any legal hardness-1 key (live `pickMiningCommodity`). |
| **Slot 1** | Reroll / exclude until commodity **differs** from the other live mining card at that origin (offered **or** accepted). |
| **Table too small** | If every remaining key is used (live size 1, or both keys taken), **omit** the new card. Leave `MINING_SLOTS_PER_SYSTEM` at 2 as a **cap**, not a forced fill. |
| **Bounded pick** | Finite attempts (deputize: `MINING_ORE_KEYS.length + 2`). Then omit. **Never** `while (true)`. |
| **Existing twins** | On `syncMiningJobs`, if two live cards share commodity and at least one is **offered**, remint the offered twin (prefer slot 1) with exclusion. **Never** drop or rewrite an **accepted** card to heal twins. Two accepted same-commodity contracts stay until complete/expire. |
| **Ids** | Keep `nextMiningId`. Do **not** reuse the spliced id. Do **not** merge ids. |
| **Pay** | Unchanged formula. Distinct commodity ⇒ distinct name and (usually) distinct UU. Same UU with different names is **allowed** (not the inbox hole). |
| **Sanitize** | Unchanged cap and extra-slot drop. Do **not** add a persist “deduped” flag. Restored twins heal on next `renderJobs` sync (offered only). |
| **Families in PR1** | **Mining only.** Trade / passenger / explore twins are documented. Owner may later name a serial; this pack does **not** require it. |
| **Fail-closed** | never throw; never innerHTML; unknown commodity skip; omit rather than twin. |
| **Persist** | **none** new. |

### Later mint helper (named only)

Prefer one helper `pickMiningCommodityExcluding(usedSet)` (or equal) used by `makeMiningJob` after it scans live mining at `sysId` excluding the slot being filled. `usedSet` holds authored keys only. Unknown sibling commodity does not throw; skip it in the used set.

Do **not** interpolate save strings into HTML. Titles stay `Mine ${oreName}` via `textContent`.

Do **not** dual-stack a scanner toast as “guidance”. That is the other inbox item.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/station.js` (`pickMiningCommodity` / `makeMiningJob` / `syncMiningJobs` / `replaceMiningJob` only — mining identity).

**Do not claim:**

- `src/game/state.js` (`ORE_TYPES` / `COMMODITIES` / laser ladder)
- `src/game/save.js` sanitize cap / extra-slot law (read as they are; do not add WORLD_FIELDS)
- `src/systems/agent-api.js`
- `src/systems/overlay-policy.js`
- `src/systems/controls.js`
- `src/systems/hud.js` layout / hub / gauges
- `src/systems/combat.js` / `src/systems/asteroids.js` (ore guidance / AST-02)
- Unique-four `makeJobs` ids
- Trade / hunt / passenger / explore / spy / war allocators **in PR1**
- Sibling Wave 130 NAV-10 / TGT-07 paths

---

## 2. Partial merge forbidden

PR1 must land **together**: exclude sibling live commodity on mint + omit when table exhausted + offered-twin heal on sync + replace path uses the same helper + never throw. Shipping slot-1 reroll without replace-path exclusion leaves expire/complete twins. Shipping replace exclusion without sync fill leaves the inbox first paint.

Do **not** ship a sanitize-only “drop extra commodity” that can delete unique four or accepted jobs.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** mining identity | exclude used commodity on fill/replace; omit if table too small; offered-twin heal on sync; fail-closed; `textContent` rows stay | pay retune; unique-four hide/replace; ore scanner; AST-02; trade/passenger/explore dedup; Agent accept; persist key; Digit remap; `innerHTML`; `state.js`; sanitize cap rewrite |
| **PR2 other families (optional skip)** | trade / passenger / explore identity if owner asks after playtest | required with PR1 |
| **PR3 stills (optional skip)** | playtest still of two distinct mining rows | required with PR1 |

First remaining serial is **PR1**.
