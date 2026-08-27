# Msn05 ore-type guidance shared contract

**Wave:** 137. Design only. No ore-guidance ships in this wave.  
**Status:** MERGE LAW for `docs/Msn05OreGuidanceDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (contract-to-rock match guidance).  
**Name:** a player with an accepted mining contract can find a matching rock without locking one rock at a time through the wrong ores.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Msn04JobDedupDesign.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02*.md`, `docs/Msn03*.md`, `docs/Ast*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/Hud0*.md`, `docs/Ctl*.md`, `docs/AgentApiDesign.md`, `docs/OwnerDecisions*.md`. Do not steal NAV-11 route persist, Agent evade, AST-02 belt model, MATCH lamp rewrite, MSN-04 mining identity, unique-four replacement, automine, Agent pad 2B, in-repo LLM. Do not write `out/w137/oreguide/verify/**`. Do not write sibling `out/w137/routepersist/**` or `out/w137/evade/**`.

**Locked sources:** wishlist INBOX (P2, MSN/AST) lines **201–206** (cite, do not edit); live inventory `out/w137/oreguide/current-msn05-ore-guidance-inventory.md` (code wins); Wave 136 MSN-04 identity already live (`pickMiningCommodityExcluding`); Wave 118 CTL-02 mutex + **never write `flags.paused`** (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest “nearest brine ice / slag iron at 434 u”: those are `collectCycleCands` range-sort results, not a missing job title.

**This leftover is contract-to-rock match guidance.** It is **not** MSN-04 job-identity dedup. It is **not** AST belt spawn. It is **not** MATCH speed lamp. It is **not** automine. It is **not** Agent pad 2B.

**Live hole:** Jobs already name `Mine Raw ore` (`station.js` **2324**, **5239–5245**). Group-3 KeyT still cycles **every** in-range rock (`controls.js` **140–146**). Group-3 cue still says `Mine · belt Nu` toward any work-sector rock (`hud.js` **2611–2617**). Type paints only after lock (`hud.js` **2489–2511**). No contract field marker. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. Digit **2** stays Jobs (`DOCK_KEY_SERVICES[1]`, `station.js` **189**). **No new Digit.**
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. KeyT targeting stays TGT-07 (hostiles-first then range; rocks group-3 non-hostile). **Do not remap those keys.**
4. `innerHTML` forbidden later. Jobs pane stays `h()` `textContent` (`station.js` **4544–4547**). Cue / lock / toast stay `textContent`. **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later unless census proves a tiny authored table is required. Prefer **no retune**. Persist: **none** new. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist a “guidance mute” / god-mode ore filter flag. Do **not** retune `ORE_BAND_WEIGHTS` to make the field homogeneous.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Msn05 **cites** overlay-policy only. Do **not** claim `overlay-policy.js`. CTL-03/04 not this pack.
7. MSN-04 mining identity stays. Do **not** stop `pickMiningCommodityExcluding`. Do **not** hide unique four. Do **not** merge mining ids. Do **not** remint cards as “guidance”.
8. Pay formula stays. Do **not** retune `HAUL_MARGIN`, `FERRY_UNITS`, `miningPayBase`, `jobPayFor`, `PAY_QUOTED_MAX`, or book prices.
9. MATCH lamp stays MATCH. Do **not** reuse MATCH for ore type. Do **not** steal AST-02 work-sector math, `fieldOre` identity, or `arrivalBeltLine`.
10. Agent API must **not** become a warp-to-ore / lock-by-commodity cheat. Do **not** claim `agent-api.js`. Do **not** add `act({ name: 'lockOre' })` (or equal) that bypasses KeyT/KeyV / range. Observe `commodity` / `need` is **cite only**.
11. Do **not** steal sibling Wave 137 packs (NAV-11 route persist, Agent evade). Do **not** steal optional PR2s listed in Wave 136 OPEN (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04) or Agent pad 2B or in-repo LLM.
12. Fail closed:
    - Never throw from job board / lock / cycle / cue.
    - Unknown `oreKey` on a rock → treat as non-match when the filter is on; do **not** crash.
    - Unknown job `commodity` → skip that job in the accepted-key set; generic copy `'ore'` if a name is required; **never throw**.
    - Job `originSystem` must be an own key of `SYSTEMS` and equal `ctx.world.currentSystem`. Reserved / proto origin → skip that job.
    - Prototype / reserved ids: never copy attacker keys from save into the filter set. Authored `ORE_TYPES` ∩ `COMMODITIES` only (prefer live mining hardness-1 keys when the job is mining).
    - Empty matching set (no accepted mining job, or no matching rock with `ore > 0` in the field) → **live** unfiltered cycle + live `Mine · belt Nu`. Do **not** spin forever. Do **not** pause.
    - Sanitize still **caps length**. PR1 must not raise or lower `JOBS_SANITIZE_MAX`.
13. `reducedMotion`: **no** new animation that ignores it. Color is not the only cue (**name the ore in text**).
14. Accessibility: matching guidance named in **text** (ore name + range). **No new Digit.**
15. CPU: no per-frame DOM alloc beyond the live HUD 5 Hz / cycle-on-tap paths. Filter runs on KeyT collect and on the existing cue slot, not a new scan of every rock into the contacts arc.
16. Prototype-safe: authored commodity keys only. Never `for-in` a job blob onto `world`.
17. Do not “fix” known REDMARCH `castMatches` flake.
18. Do not steal sibling Wave 137 packs. Do not edit the wishlist or `PROGRESS.md`. Deputize defaults live in **this** contract.
19. Do **not** add a new world object type (field marker mesh, chart ore pip, hub PPI). Prefer HUD/job copy or a scanner/T-cycle filter.
20. Do **not** pause. Do **not** teleport. Do **not** remap keys. Do **not** change `need`. Digit 2 stays Jobs. Unique-four stay.

---

## 0.1 Wave 137 deputize (owner may override after playtest)

Pick a playable **contract-to-rock match**. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key / third helm / field-marker entity.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Mining slots | 2 per system | `station.js` **226** |
| Job ore table | `rawOre`, `livingRock` | **250–253**; `state.js` **387–422** |
| Need | `FERRY_UNITS` **4** | `station.js` **makeMiningJob** **2327** |
| Job title | `Mine ${oreName}` | **2324**, **5244** |
| Cycle range | `U.TARGET_RANGE` **600** | `state.js` **32**; `controls.js` **129** |
| Group-3 cue | `Mine · belt ${n}u` | `hud.js` **2616** |
| Lock card | name after lock | `hud.js` **2489–2511** |
| Refusal | `mineBlocked` toast | `hud.js` **660–664** |
| MATCH word | `MATCH` | `hud.js` **389** |
| Band 0 mix | rawOre 62 / slag 22 / brine 8 / … | `state.js` **549** |
| Agent job act | live desk `acceptJob` | `agent-api.js` **359–366** — **do not claim** |

Do **not** “fix” the hole by making every rock raw ore, by hiding unique four, by merging ids, by changing pay, by reuse of MATCH, or by a new marker mesh.

### Playable policy (smallest additive)

**Name:** when at least one **accepted** mining job is live for the **current** system, group-3 rock targeting prefers rocks whose `commodity` / `oreKey` is in that job set, and the empty-lock cue **names the ore in text**.

| Piece | Freeze |
|---|---|
| **Who** | Group-3 KeyT rock collect (`collectCycleCands`) and group-3 empty-lock cue (`beltMineDist` / `pVerb`). Not unique four. Not MATCH. Not automine. Not contacts-arc ships. Not KeyV rewrite. |
| **When** | `job.kind === 'mining'` and `job.state === 'accepted'` and `typeof job.originSystem === 'string'` and `Object.hasOwn(SYSTEMS, job.originSystem)` and `job.originSystem === ctx.world.currentSystem`. Offered-only jobs do **not** filter. Reserved origin skipped. |
| **Key set** | Union of accepted mining `commodity` values that are authored (`Object.hasOwn(ORE_TYPES)` and `Object.hasOwn(COMMODITIES)` and not reserved). Unknown sibling skipped. |
| **T-cycle** | When the key set is non-empty **and** at least one list rock with `ore > 0` matches: group-3 rock cands must match that set. Ships stay in the cycle. Hostiles-first (TGT-07) stays. Rocks stay non-hostile. |
| **In-range empty** | Matching rocks may sit outside 600 u. Do **not** fall back to brine ice while a matching rock still exists in the field. T then cycles ships (and matching rocks that are in range). |
| **True empty** | If no matching rock with `ore > 0` remains in `asteroids.list`, **fall back** to live all-rock cycle + live `Mine · belt Nu`. |
| **Cue copy** | With a non-empty key set and a matching rock: `Mine · ${oreName} ${n}u` where `oreName` is `COMMODITIES[nearestMatch.commodity].name` (fail-closed `'ore'`) and `n` is the live finite integer u to that rock (same `beltMineDist` two-pass: work sector first, then full list, but **match-gated**). |
| **Cue fallback** | No accepted mining job, or no matching rock: keep `Mine · belt ${n}u`. Dock / Jump / Hail / Target still win. A rock lock still skips the cue. |
| **Lock card / toast** | Unchanged. Inbox called them good. |
| **Jobs copy** | Unchanged channel (`textContent`). Optional later still of the named title is not required. Do **not** dual-stack a scanner toast as the only guidance. |
| **Field marker** | **Forbidden** in PR1. No new mesh, no chart ore pip, no hub pip. |
| **MATCH** | Unchanged word and lamp. |
| **KeyV** | Unchanged. Player may still lock a wrong rock under the glass. The hunt hole is KeyT + unnamed cue. |
| **Automine** | Unchanged. Still requires a lock. |
| **MSN-04** | Identity uniqueness stays. |
| **Fail-closed** | never throw; never innerHTML; unknown key skip; fallback rather than empty-sim freeze. |
| **Persist** | **none** new. |

### Later helper (named only)

Prefer one tiny helper `acceptedMiningOreKeys(ctx)` (or equal) that returns a `Set` of authored keys. `collectCycleCands` and the cue path both use it. Do **not** put the helper in `agent-api.js`. Do **not** import a new Digit. Duplicate 20-line scans in `controls.js` and `hud.js` are allowed if a shared module would claim `state.js` writes.

Do **not** interpolate save strings into HTML. Ore names stay `textContent`.

Do **not** dual-stack MSN-04 remint as “guidance”.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/controls.js` (group-3 rock filter inside `collectCycleCands` only — do not remap KeyT, do not weaken TGT-07 hostiles-first).
- **Writer:** `src/systems/hud.js` (group-3 cue copy + match-gated `beltMineDist`; lock card / `mineBlocked` toast **unchanged**).

**Do not claim:**

- `src/game/state.js` (`ORE_TYPES` / `COMMODITIES` / `ORE_BAND_WEIGHTS` / laser ladder)
- `src/game/save.js` sanitize cap / `fieldOre` / WORLD_FIELDS
- `src/systems/station.js` mining mint / MSN-04 helpers / Digit map
- `src/systems/asteroids.js` spawn / work sector / `id === i`
- `src/systems/combat.js` hardness gate / `mineBlocked` payload
- `src/systems/agent-api.js` / `src/game/agent-observe.js`
- `src/systems/overlay-policy.js`
- `src/game/automine.js` / `src/game/jump.js` arrival line
- Unique-four `makeJobs` ids
- Sibling Wave 137 NAV-11 / Agent evade paths

---

## 2. Partial merge forbidden

PR1 must land **together**: accepted-job key set + group-3 T-cycle rock filter + named cue + fallback when no matching rock + never throw. Shipping the cue without the T-filter leaves the inbox hunt (nearest brine ice). Shipping the T-filter without named cue leaves `Mine · belt` as a lie about which ore. Shipping either without fallback can empty the cycle when living-rock is rare and gone.

Do **not** ship a contacts-arc rock dump. Do **not** ship a field-marker mesh. Do **not** ship MATCH-as-ore.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** contract-to-rock match | accepted mining key set; group-3 T-cycle filter; named cue `Mine · {ore} Nu`; fallback; fail-closed; `textContent` | field marker mesh; MATCH reuse; `ORE_BAND_WEIGHTS` retune; MSN-04 remint; unique-four hide; automine; Agent lock-by-ore; persist key; Digit remap; `innerHTML`; `state.js`; contacts-arc rocks; KeyV rewrite; TGT-07 order change |
| **PR2 stills (optional skip)** | playtest still: accepted Raw ore, group 3, cue names Raw ore, first T-lock is rawOre, hub empty, MATCH still MATCH | required with PR1 |
| **PR3 KeyV hint (optional skip)** | owner-asked only: reticle lock still free; do not auto-skip wrong rocks under the glass unless playtest says so | required with PR1 |

First remaining serial is **PR1**.
