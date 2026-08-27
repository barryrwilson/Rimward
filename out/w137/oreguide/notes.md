# Wave 137 Msn05 ore-type guidance notes

**Verdict:** leftover **REAL**. Name: **contract-to-rock match guidance**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none.

## Method

- Did **not** call `graph_propose` / `graph_approve`. Local markdown only under `docs/Msn05OreGuidanceDesign.md` and `out/w137/oreguide/**` except `verify/**`.
- Census live `src/systems/station.js` mining mint, Digit 2 Jobs, `h()` `textContent`, unique four.
- Census lock card + `mineBlocked` toast in `hud.js` / `combat.js`.
- Census `ORE_TYPES`, `ORE_BAND_WEIGHTS`, `fieldOre`, group-3 `Mine · belt`, `beltMineDist`.
- Census KeyT `collectCycleCands` / `cycleTarget` (TGT-07 hostiles-first cite).
- Census AST-02 arrival `Belt lies` + MATCH lamp (cite only).
- Census MSN-04 `pickMiningCommodityExcluding` (cite only; do not steal).
- Census `save.js` mining kind + `WORLD_FIELDS`.
- Census Agent observe `commodity` / `need` (cite only; do not claim `agent-api.js`).
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`. Did **not** write sibling `out/w137/routepersist/**` or `out/w137/evade/**`.

## Why REAL (not CONSUME)

CONSUME needed **both**: named mining job **and** find-without-lock (filter, marker, or equivalent).

Named job **is** live:

- `Mine ${oreName}` (`station.js` **2324**, **5244**).
- Detail already says reachable named ore (**2325**).

Find-without-lock **is not** live:

- Group-3 KeyT all rocks (`controls.js` **140–146**).
- Cue `Mine · belt Nu` (`hud.js` **2616**).
- Type after lock only (**2489–2511**).
- No field marker.

MSN-04 identity **does** exist. AST-02 belt find **does** exist. Those are **not** contract-to-rock match. Do **not** CONSUME on title-exists or belt-cue-exists.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Gate | accepted mining at current origin |
| T-cycle rocks | filter to authored accepted keys |
| Cue | `Mine · {oreName} {n}u` |
| Fallback | live belt + all-rock if no match left |
| Marker mesh | no |
| MATCH | MATCH |
| KeyV | free in PR1 |
| MSN-04 | stays |
| Persist | none |
| `state.js` | read-only |

## Later write-set (do not edit now)

- `src/systems/controls.js` `collectCycleCands` rock filter.
- `src/systems/hud.js` cue + match-gated `beltMineDist`.
- Do **not** claim `station.js` mint, `asteroids.js`, `state.js`, `save.js`, `agent-api.js`, `combat.js`, `automine.js`.

## Coupling (do not steal)

- MSN-04 mining identity (Wave 136 PR1 live; other families optional PR2).
- AST-02 work sector / `fieldOre` / arrival line.
- MATCH lamp.
- Automine KeyN.
- NAV-11 route persist. Agent evade.
- Wave 136 OPEN optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04).
- Agent pad 2B. In-repo LLM.

## Reviews

Security HIGH (XSS cue, prototype keys, Agent lock-by-ore, persist mute, overlay pause, uncaught throw) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after T-filter + named cue + fallback + no marker + TGT-07 kept. UI Blocker/Major **resolved as later mint** (live hunt stays until PR1).

## Re-review

After freeze (including origin `hasOwn(SYSTEMS)` skip): no new HIGH/CRITICAL. MEDIUM Agent inherit-filter and observe `commodity` documented, not expanded. Did not start Vite/Chrome. Did not write `out/w137/oreguide/verify/**`.

## Graph

Owner write-set is local files. Did not bind Drive publish. Did not `graph_propose` / `graph_approve`.
