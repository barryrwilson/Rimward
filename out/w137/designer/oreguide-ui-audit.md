# UI Audit: Msn05 ore-type guidance leftover freeze (Wave 137)

**Auditor:** `[designer]` (independent of `out/w137/oreguide/ui-audit.md`)
**Scope:** Later player-facing freeze only. Wave 137 ships **no** product UI. Audit the PR1 contract-to-rock match: accepted mining key set, group-3 T-filter, named cue `Mine · {ore} Nu`, fallback when no match. Honor: no field-marker mesh, MATCH stays MATCH, color is not the only cue, Digit 2 stays Jobs, HUD-01 hub stays 80 px empty.
**Review file:** `out/w137/designer/oreguide-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Msn05OreGuidanceDesign.md`, merge law `out/w137/oreguide/shared-contract.md` (wins on conflict), census `out/w137/oreguide/current-msn05-ore-guidance-inventory.md`. Worker self-audit `out/w137/oreguide/ui-audit.md` read, not copied. Live cites: `src/systems/hud.js`, `src/systems/controls.js`, `src/systems/station.js`, `src/ui/hud.css`, `src/game/state.js`. No Playwright. No Vite. No Chrome. [NO BROWSER COVERAGE].
**Date:** 2026-08-26
**Product source:** review only (no `src/` / wishlist / `PROGRESS.md` / worker pack edits)

Merge law: `out/w137/oreguide/shared-contract.md` wins if the brief forks. Findings bind **later PR1**. Serial is named only. This wave does not close the live hunt in `src/`.

## UI Audit: Msn05 later named cue + group-3 T-filter (leftover freeze)

### Summary

No product chrome ships this wave. The pack freezes leftover **REAL** / **PR1**: when an accepted mining job is live in this system, the existing group-3 prompt names the ore in text and KeyT rock membership matches that key set, with live `Mine · belt Nu` + all-rock cycle as true-empty fallback. Color-only ore, MATCH-as-ore, hub pip, field-marker mesh, Digit remap, and CONSUME-on-title are forbidden. Live hunt stays until PR1 (expected). No open Blocker or Major in the freeze.

**Counts:** 🔴 Blocker **0** open. 🟠 Major **0** open. 🟡 Minor **4**. 💡 Suggestion **3**.

### Verdict

**CLEAN.** Named-text cue, T-filter with fallback, MATCH word, empty hub, and Digit 2 Jobs are sound in the freeze. The freeze does **not** claim the live hole is closed.

---

### Honor / Blocker gate

Flag **Blocker** or **Major** if the freeze would hide ore type (color-only), reuse MATCH, grow the hub, or leave KeyT unfiltered while claiming the hole is closed. Hub, MATCH, named text, Digit 2, and KeyT-with-filter **pass** in freeze.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| Color is not the only cue | Contract §0.13–0.14; design Honor | HUD already pairs palette with text (`hud.js` **48–49**, **51–55**). Lock meta names ore (`hud.js` **2496–2511**). Cue is `textContent` (`hud.js` **2637–2639**). | **Pass.** PR1 names `COMMODITIES[nearestMatch].name` in `pVerb`. Fail-closed `'ore'`. Color extra is optional, never the only tell. |
| MATCH stays MATCH | Contract §0.9, §0.1 MATCH; design Goals 5 | Lamp text `'MATCH'` (`hud.js` **389**); on when `flags.matchSpeed` and ship or rock lock (`hud.js` **2274**). | **Pass.** Unchanged word and lamp. Do not tint `.rw-match-lamp` as ore. |
| HUD-01 empty 80 px hub | Contract §0.2; design Honor | `.rw-reticle` 80×80, `pointer-events: none` (`hud.css` **184–193**) | **Pass.** No hub pip, no PPI, no aim-glass gauge. |
| Digit 2 stays Jobs | Contract §0.2, §0.20; `DOCK_KEY_SERVICES[1]` | `station.js` **189**; menu `i + 1` → Digit 2 Jobs (`station.js` **6124–6126**) | **Pass.** No new Digit. Digit 0/8/9 stay. |
| KeyT stays TGT-07; filter membership | Contract §0.1 T-cycle; §2 partial merge | Unfiltered rocks (`controls.js` **140–146**); hostiles-first (`controls.js` **171–184**) | **Pass in freeze.** PR1 must land key set + T-filter + named cue + fallback **together**. Live unfiltered cycle is leftover REAL, not CONSUME. Freeze does **not** claim the hunt is closed. |
| No field-marker mesh | Contract §0.19, §0.1 Field marker | Census: none. Contacts arc is ships only (`hud.js` **1728–1754**) | **Pass.** No mesh, chart ore pip, hub pip, or contacts-arc rocks. |
| Cue slot reuse | Contract §0.1 Cue copy; design Picture | One prompt; Dock / Jump / Hail / Target win (`hud.js` **2572–2617**) | **Pass.** Named ore rides `pVerb`. Rock lock still skips the cue. |
| `innerHTML` forbidden | Contract §0.4 | Jobs `h()` `textContent` (`station.js` **4544–4547**, **5303**); prompt `textContent` (`hud.js` **2637–2639**) | **Pass.** Ore names stay `textContent`. |
| `reducedMotion` | Contract §0.13 | No new animation in freeze | **Pass.** |
| Lock card / toast stay | Contract §0.1; inbox good | Lock names ore after lock (`hud.js` **2489–2511`); `.ore-blocked` extra on NEEDS (`hud.css` **447**; `hud.js` **2519–2521**). Toast `▲ ` + `blockedLine` (`hud.js` **660–664**) | **Pass.** Do not paint ore on every unlocked rock. |

If a later worker tints MATCH or belt cue **instead of** naming the ore, adds a hub child, remaps Digit 2, ships cue without T-filter (or T-filter without named cue), adds a field marker, or CONSUMEs because Jobs already say `Mine Raw ore`, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Live hole (hunt) | **Open in `src/`, accepted as leftover REAL.** Group-3 KeyT pushes every in-range rock. Cue says `Mine · belt Nu`. Type waits for lock. | `controls.js` **140–146**; `hud.js` **2611–2617**, **2489–2511** |
| Jobs already name ore | **Pass (keep).** Title `Mine ${oreName}`; detail names reachable ore. Not a field filter. Do not CONSUME. | `station.js` **2324–2325**, **5239–5245**; `miningOreName` **2425–2427** |
| PR1 named cue | **Pass in freeze.** `Mine · ${oreName} ${n}u` to nearest match; fail-closed `'ore'`. Same two-pass as `beltMineDist`, match-gated. | contract §0.1 Cue copy; `hud.js` **545–584**, **2615–2616** |
| PR1 T-filter | **Pass in freeze.** When accepted keys exist **and** any matching `ore > 0` remains in `asteroids.list`, group-3 rock cands match that set. Ships stay. Hostiles-first stays. Rocks stay non-hostile. | contract §0.1 T-cycle / In-range empty; `controls.js` **123–194** |
| Partial merge | **Pass in freeze.** Cue without T-filter leaves nearest brine ice. T-filter without named cue leaves `Mine · belt` as a lie. Either without fallback can empty Living rock. | contract §2; design mermaid **155–174** |
| True-empty fallback | **Pass in freeze.** No accepted mining job, or no matching `ore > 0`: live all-rock cycle + `Mine · belt Nu`. Do not pause. Do not spin. | contract §0.12 empty matching set; `hud.js` **2616** |
| Distant match vs 600 u | **Accepted.** Cue may read `Mine · Raw ore 800u` while T only cycles ships. Do not fall back to brine ice while a match exists in the field. | `U.TARGET_RANGE` `state.js` **32**; contract In-range empty |
| Two accepted mining jobs | **Pass.** Union of keys; cue names nearest match’s ore. | contract §0.1; design Player outcome **233** |
| Offered-only jobs | **Pass.** Do not filter until accepted at current origin (`hasOwn(SYSTEMS)`). | contract §0.1 When |
| KeyV | **Pass (PR1).** Glass stays honest. Wrong rock under the reticle still locks. Optional PR3 only if owner asks. | `controls.js` **35**, **269–271** |
| pKey stays `3` | **Pass (live AST-02).** Verb names the ore; key chip stays weapon group 3. Player still taps T to cycle. Do not steal the slot for a second verb. | `hud.js` **2615**; `.rw-prompt-key` `hud.css` **831–841** |
| Hierarchy | **Pass.** Dock / Jump / Hail / Target still win the one prompt. | `hud.js` **2572–2611** |
| Keyboard | **Pass.** KeyT targeting. Digit 2 Jobs. KeyH/J/L/M/P stay. No new Digit. | contract §0.3 |
| Theming | **Pass.** Prompt uses `--cyan` / `--void` (`hud.css` **817–847**). Contrast restyles `#hud .rw-prompt` (`hud.css` **1257–1264**). Lock blocked uses `var(--amber)` plus NEEDS text (`hud.css` **447**). No new unthemed ore hue required. | — |
| States | **Pass.** Empty = belt fallback. Unknown key skip. Never throw. Offered = no filter. Rock lock hides cue. | contract §0.12 |
| CPU / contacts | **Pass.** Filter on KeyT collect and existing cue slot. No per-frame contacts-arc rock dump. | contract §0.15 |
| MATCH lamp extra glyph | Mech family already prefixes the lamp with a tick (`hud.css` **1544–1553**) **and** the word MATCH. Freeze must not replace that word with an ore swatch. | `hud.js` **389** |

---

### What's done well

- Census refuses CONSUME. Jobs already paint `Mine Raw ore` / `Mine Living rock` (`station.js` **2324**, **5244**). That is identity copy, not a scanner. The inbox hunt is unfiltered KeyT + `Mine · belt` (`controls.js` **140–146**; `hud.js` **2616**).
- PR1 reuses the **one** live context prompt (`hud.js` **2572–2617**; `hud.css` **817–847**). Named ore rides `pVerb`. Dock / Jump / Hail / Target still win. No second glance row. No rail move.
- Ore type is frozen as **text**: cue name + range; lock card after lock; Jobs `textContent`. Color may ride along. Color is never the only cue (`hud.js` **48–49**).
- MATCH stays the SPD lamp word (`hud.js` **389**, **2274**). The freeze does not steal match-speed for “ore match”.
- HUD-01 hub stays the 80×80 empty reticle (`hud.css` **184–193**). No ore pip. Contacts arc stays ships (`hud.js` **1728–1754**).
- Digit 2 stays Jobs (`station.js` **189**, **6124–6126**). No Digit 3 “ore board”. Unique four stay on the desk.
- Partial merge is named before impl: key set + T-filter + named cue + fallback must land together (contract §2). That is the right guard against a lying `Mine · belt` or an empty Living-rock cycle.
- True empty falls back to live belt + all-rock, not a new `Mine · Living rock gone` channel and not a pause (design Open owner question **3** default).
- In-range empty keeps the named range and does **not** silently T-lock brine ice to “give a rock” (contract In-range empty; `U.TARGET_RANGE` **600**).
- Inbox-good surfaces stay: lock card ore + H + units/NEEDS (`hud.js` **2496–2511`); `mineBlocked` authored line (`hud.js` **660–664`). Do not unlock-all names on every rock.
- Fail-closed copy `'ore'` matches live `miningOreName` (`station.js` **2425–2427`) more closely than a crash or a color swatch.
- Worker self-audit agrees: live hunt is leftover REAL / later mint; integrator must not CONSUME. This pass **agrees**. Do not reopen field-marker mesh as required PR1.

---

### Findings

#### 🔴 Blocker

None open in the freeze. Live lock-one-at-a-time hunt (`controls.js` **140–146**; `hud.js` **2616**) is leftover **REAL** and named **PR1**. The freeze does not claim that hole is closed.

#### 🟠 Major

None open in the freeze. Color-only, MATCH-as-ore, hub pip / field marker, unlock-all rock names, and Digit/KeyT remap are forbidden before the first `src/` scan.

#### 🟡 Minor: Cue `pKey` stays `3` while the player taps T

**Location:** `hud.js` **2615–2616**; `hud.css` **831–841**
**Issue:** The prompt key chip shows weapon group 3. Cycle is KeyT (`controls.js` **33**, **163–194**). After PR1 the verb names Raw ore / Living rock, but the chip still says `3`.
**Justification:** Live AST-02 pattern. Do not steal the slot for a second verb or remap KeyT. Named ore in `pVerb` is the new tell.

#### 🟡 Minor: KeyV can still lock brine ice

**Location:** `controls.js` **35**, **269–271**; contract §0.1 KeyV
**Issue:** A player who aims at a wrong rock still locks it. Type then appears on the lock card (`hud.js` **2489–2511`).
**Justification:** Glass stays honest. Inbox hunt is T + unnamed cue. Optional PR3 only if the owner asks.

#### 🟡 Minor: Distant match leaves T without rocks

**Location:** `state.js` **32** `U.TARGET_RANGE` 600; contract In-range empty; `beltMineDist` `hud.js` **545–584**
**Issue:** Cue may read `Mine · Raw ore 800u` while T only cycles ships (or hostiles-first). The player must fly the named range.
**Justification:** Same as today’s `Mine · belt 800u`. Do not silently T-lock brine ice to fill the cycle.

#### 🟡 Minor: Fallback belt copy when the contract ore is gone

**Location:** contract Cue fallback; design Open owner question **3**
**Issue:** After the last matching unit, the cue returns to `Mine · belt Nu` even if the accepted card still says Living rock.
**Justification:** Honest empty-of-contract-ore. No new toast flood. Owner default.

#### 💡 Suggestion: Skip `ore === 0` in the later T-filter

**Location:** live `collectCycleCands` `controls.js` **140–146** (no `ore > 0` check); cue `beltMineDist` **558** (`ore > 0`)
**Issue:** If PR1 filters only `oreKey` and leaves spent husks in the cand list, first T can be a depleted matching rock while the cue points at a live unit farther out.
**Fix:** When the filter is on, rock cands should match the key set **and** `ore > 0`, same as the cue.

#### 💡 Suggestion: Do not tint MATCH or the prompt by ore as “extra” color

**Location:** `.rw-match-lamp` `hud.js` **389**; `hud.css` **222–229**, **1544–1553**; `.rw-prompt-verb` `hud.css` **843–847**
**Issue:** Extra hue on the speed lamp or a per-ore prompt wash would still steal MATCH / AST-02 cyan even if the verb names the ore.
**Fix:** Keep MATCH cyan + word. Keep the group-3 prompt on existing `--cyan`. Lock-card `.ore-blocked` amber + NEEDS text already shows the hardness pattern.

#### 💡 Suggestion: Optional PR2 still

One still: Freehold Digit 2 accept Raw ore, undock, group 3, cue names Raw ore, first T rock lock is rawOre, lock card still names it, MATCH still MATCH, hub empty, no pause, unique four still on the board when redocked.

---

### Out of scope (do not reopen)

- MSN-04 mining identity / unique-four / pay (`station.js` mint).
- AST-02 work sector / `fieldOre` / `Belt lies …`.
- Automine KeyN. Agent lock-by-ore. NAV-11. Agent evade.
- `ORE_BAND_WEIGHTS` retune. `state.js` write. New persist key.
- `innerHTML` ore names. `flags.paused`. New Digit.
- Wave 137 product `src/` (none this wave).
