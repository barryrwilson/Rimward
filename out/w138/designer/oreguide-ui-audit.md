# Designer UI audit — Wave 138 MSN-05 PR1 HUD cue

**Auditor:** `[designer]` (independent of `out/w138/oreguide/ui-audit.md`)
**Review file:** `out/w138/designer/oreguide-ui-audit.md`
**Scope:** Named group-3 empty-lock cue + match-gated `beltMineDist`; group-3 T-filter only as it changes what the player locks. MATCH lamp / prompt CSS read-only.
**Merge law:** `out/w137/oreguide/shared-contract.md` (wins on conflict).
**Method:** Code + worker boot stills. No Vite. No Chrome. [NO BROWSER COVERAGE].
**Product source:** review only (no `src/` / wishlist / `PROGRESS.md` edits).

## UI Audit: Wave 138 MSN-05 ore cue

### Summary
PR1 reuses the live group-3 prompt to name the nearest matching ore in text, then range. MATCH stays MATCH. Hub stays empty. Dock / Jump / Hail / Target still win. Fallback is `Mine · belt Nu`. **CLEAN.**

### What's done well
- Named copy is `Mine · ${oreName} ${n}u` with authored `COMMODITIES` names (`hud.js` 2651–2655). Boot stills: `Mine · Raw ore 200u`, `Mine · Living rock 90u`. Color is not the only cue.
- Fail-closed name `'ore'` when the commodity row has no name (`mining-ore-keys.js` 71–80).
- Fallback `Mine · belt Nu` when there is no accepted mining job or no matching `ore > 0` rock (`hud.js` 2653–2655; `beltMineDist` 556–558, 593). Boot stills: `Mine · belt 40u` for no-job and empty-match.
- Two accepted jobs: cue names the nearest match, not a slot-0 pin (boot: Living rock at 90u).
- Cue writes `promptKey.textContent` / `promptVerb.textContent` (`hud.js` 2676–2677). No `innerHTML` / `insertAdjacentHTML` / `document.write` on the cue path.
- Priority order is unchanged: Dock, Jump, Hail, then Target, then the mine cue (`hud.js` 2600–2640). A rock lock skips the cue (`!isRockTarget`).
- MATCH lamp text is still `'MATCH'` (`hud.js` 392). It lights only on `flags.matchSpeed` with a ship or rock lock (`hud.js` 2302–2303). CSS word is unchanged (`hud.css` 222–229).
- HUD-01 hub stays 80×80 empty (`hud.css` 184–193; `hud.js` 1555). No field-marker mesh, chart ore pip, or hub PPI. Contacts arc stays ships.
- Digit 2 stays Jobs (`station.js` 189). No new Digit. Cue chip stays live `3` (`hud.js` 2652). KeyT is still TGT-07 cycle.
- Lock card still `ASTEROID` + ore after lock (`hud.js` 2518–2539). `mineBlocked` toast unchanged (`hud.js` 688–692).
- Prompt theming stays tokens (`--cyan`, `--void`; `hud.css` 817–847). Contrast restyle still covers `.rw-prompt` (`hud.css` 1257–1264).
- `reducedMotion`: no new animation on the cue. Existing `body.rw-reduced-motion` still kills HUD animation (`hud.css` 1271–1276).
- Kit mutate omit. No new persist chrome. Helper is read-only (`mining-ore-keys.js`).

### Honor / Blocker gate

| Honor | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px hub | **Pass.** | `hud.css` 184–193 |
| MATCH lamp stays MATCH | **Pass.** | `hud.js` 392, 2302–2303; `hud.css` 222–229 |
| Ore name in **text** | **Pass.** | `hud.js` 2653–2655 |
| No new Digit; Digit 2 Jobs; cue key may stay `3` | **Pass.** | `station.js` 189; `hud.js` 2652 |
| No field marker / chart pip / hub PPI | **Pass.** | cue + T-filter only |
| `innerHTML` forbidden; `textContent` only | **Pass.** | `hud.js` 2676–2677 |
| Dock / Jump / Hail / Target win | **Pass.** | `hud.js` 2600–2640 |
| Fallback `Mine · belt` | **Pass.** | `hud.js` 2653–2655 |
| `reducedMotion`: no new ignore | **Pass.** | no new cue animation |
| Kit mutate omit; no persist chrome | **Pass.** | `mining-ore-keys.js` |

### States

| State | Cue | Cite |
|---|---|---|
| Empty — no accepted mining job | `Mine · belt Nu` | `matchOn` false → `oreName` null |
| Empty — accepted job, no matching `ore > 0` | `Mine · belt Nu` | `fieldHasMatchingOre` false |
| Named — accepted job + matching rock | `Mine · {ore} Nu` | nearest match, work sector then list |
| Lock present (rock) | Cue skipped | `!isRockTarget` |
| Dock / Jump / Hail / Target live | Mine cue skipped | `if (!pKey && …)` |

### Findings

No Blocker or Major findings.

#### 🟡 Minor: T-cycle can lock a spent matching husk
**Location:** `src/systems/controls.js:154-164` vs `src/systems/hud.js:577`
**Issue:** The cue two-pass skips rocks with `!(ore > 0)`. Group-3 collect still pushes matching rocks with `ore === 0`. First T can lock a depleted matching husk while the prompt ranges a live unit farther out.
**Fix:** When `matchOn` is true, skip rocks that do not have `ore > 0`, same as `beltMineDist`.
**Status:** open — not a contract Blocker; membership filter landed.

#### 💡 Suggestion: cue still uses prompt key `3`
**Location:** `src/systems/hud.js:2652`
**Issue:** Live group-3 cue already used key `3`. PR1 does not remap T. The chip says `3`; cycle is KeyT.
**Fix:** None. Honor allows live `3`. Keep KeyT as TGT-07.
**Status:** accepted — matches today.

#### 💡 Suggestion: distant match vs 600 u
**Location:** `src/systems/hud.js:552-594`; `U.TARGET_RANGE` 600
**Issue:** Cue may read `Mine · Raw ore 800u` while T only cycles ships. Player flies the named range.
**Fix:** None for PR1. Do not silently T-lock brine ice.
**Status:** accepted — contract In-range empty.

#### 💡 Suggestion: fallback belt copy after last matching unit
**Location:** `src/systems/hud.js:2653-2655`
**Issue:** After the last matching unit, copy returns to `Mine · belt Nu` even if the accepted card still says Living rock.
**Fix:** None. Honest empty-of-contract-ore. No new toast channel.
**Status:** accepted — contract Cue fallback.

### Verdict
**CLEAN.** Named-text ore cue, T-filter with belt fallback, MATCH word, empty hub, Digit 2 Jobs, and `textContent` honor all hold. Worker self-audit agrees on CLEAN; this pass does not copy it. One open Minor (spent husk on T) is not a ship-stop.
