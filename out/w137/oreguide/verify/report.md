# Wave 137 Msn05 ore-guidance leftover — verifier report

**Domain:** data (markdown freeze). No Vite. No Chrome. No Playwright. No CDP. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` `execute_workflows` (`r-mtayuxox-61d86630`), agent `omp/agent-omp`, namespace `omp`, primary `omp/workflow-software-delivery`. Did not `graph_approve` / `graph_propose`. Did not start a server. Did not claim a port.  
**Verdict:** **CLEAN**

## 1. Required artifacts (non-empty)

| Path | Bytes | Empty? |
|---|---:|---|
| `docs/Msn05OreGuidanceDesign.md` | 20644 | no |
| `out/w137/oreguide/current-msn05-ore-guidance-inventory.md` | 9708 | no |
| `out/w137/oreguide/shared-contract.md` | 13482 | no |
| `out/w137/oreguide/security-review.md` | 5957 | no |
| `out/w137/oreguide/code-review.md` | 5071 | no |
| `out/w137/oreguide/ui-audit.md` | 4808 | no |
| `out/w137/oreguide/notes.md` | 3560 | no |

Worker did not write `out/w137/oreguide/verify/**` (this pass creates that tree).

## 2. This pack did not write product trees

`git ls-files --others` for the pack is markdown only:

- `docs/Msn05OreGuidanceDesign.md`
- `out/w137/oreguide/*.md` (the seven files above)

No pack file under `src/`, `scripts/`, `public/`, `index.html`, or `package.json`.

Working tree is dirty in those trees from **other** Wave 136/137 workers. `git diff` on `src/systems/controls.js` and `src/systems/hud.js` does not add an ore-key filter or a named `Mine · {ore}` cue. This pack did not land those edits.

Wishlist INBOX (P2, MSN/AST) ore-type guidance **stays** unchecked at lines **201–206**. This pack did not mark it DONE.

## 3. Sibling steal

| Sibling | Pack behavior |
|---|---|
| NAV-11 (`out/w137/routepersist/**`, `docs/Nav11RoutePersistDesign.md`) | Named as not-this. Not written. |
| Agent evade (`out/w137/evade/**`, `docs/AgentApiEvadeDesign.md`) | Named as not-this. Not written. |
| MATCH lamp | Honor: word stays `MATCH`. Not reused as ore match. |
| MSN-04 identity / other families | Cite-only. Do not remint. Do not hide unique four. Optional PR2 families listed as steal-forbid. |
| Pad 2B | Named as not-this. |
| AST-02 / `fieldOre` / arrival | Cite-only. |
| Automine / Agent API / `state.js` | Not claimed in later write-set. |

Later write-set is named: `src/systems/controls.js` (`collectCycleCands` rock filter only) and `src/systems/hud.js` (named cue + match-gated `beltMineDist`). Explicit **do not claim**: `station.js` mint, `state.js`, `asteroids.js`, `agent-api.js`, MATCH.

## 4. REAL leftover vs live code

**Verdict REAL / named serial PR1 is correct.** Live filter + named cue is **not** already present. CONSUME would be wrong.

| Surface | Live (2026-08-26/27 working tree) | Filter by accepted mining ore? |
|---|---|---|
| Jobs copy | `makeMiningJob` title ``Mine ${oreName}`` `station.js` **2324**; paint **5244** | Names ore on the card. Not a field filter. |
| Mining table | hardness `<= 1` ∩ `COMMODITIES` → `rawOre`, `livingRock` **250–253**; `state.js` **354–355**, **387–422** | — |
| Group-3 KeyT | `collectCycleCands` **140–146** pushes **every** in-range rock | **No.** No `oreKey` / job-commodity test. |
| Cue | `pVerb = 'Mine · belt ' + n + 'u'` `hud.js` **2616** | **No.** Name is `belt`. |
| `beltMineDist` | **545–584** nearest `ore > 0` (work sector then full list) | **No** commodity gate. |
| Lock card | name `'ASTEROID'`; ore name after lock **2489–2511** | Type waits for lock. |
| Marker | no job-linked rock mesh / chart ore pip | none |
| MATCH | lamp text `'MATCH'` **389**; `matchOn` **2274** | Speed hold, not ore. |

Inbox sequence (nearest brine ice, then slag iron) maps to mixed `ORE_BAND_WEIGHTS` band 0 (`state.js` **549**) plus unfiltered range-sort. Jobs already say `Mine Raw ore`. That is identity copy, not find-without-lock.

## 5. Merge law / honor

`out/w137/oreguide/shared-contract.md` exists and is MERGE LAW (wins over the design brief).

- `innerHTML` forbidden later; Jobs / cue / lock / toast stay `textContent` / `h()`.
- **No new Digit.** Digit 2 stays Jobs (`DOCK_KEY_SERVICES[1]`, `station.js` **189**).
- MATCH stays MATCH. Not reused.
- Persist none new. `state.js` READ-ONLY later. No WORLD_FIELDS. No UU/SKU.
- Fail-closed: never throw; unknown key skip; fallback to live belt/cycle.
- Partial merge forbidden: key set + T-filter + named cue + fallback together.

## 6. Coupling note (not a pack bug)

Agent evade later write-set also names `src/systems/controls.js` (lift `pendingAfterburner` / `agentPulse('afterburner')`). This pack later names the same file for `collectCycleCands` rock filter only.

**Note for the impl wave:** merge both hunks in one file; do not let evade rewrite collect, and do not let ore-guidance touch the afterburner latch.

This pack does **not** already edit `controls.js`. That would have been a bug. It did not.

## 7. Cite drift (not leftover-wrong)

Facts hold. A few line numbers sit 1–3 lines off live (census vs dirty tree):

- `combat.js` `systemLoaded` reset live **1836** (inventory **1833**).
- `jump.js` is `src/game/jump.js`; `arrivalBeltLine` **49–60**, emit **179** (inventory **49–59**, **179**).
- `uniqueFourId` live **2451–2454** (inventory **2451–2452**).

None of those invert REAL / PR1 / write-set.

## 8. Processes / ports

This verifier started no Vite, Chrome, Playwright, or CDP. No port claimed.
