# Security Review: REP faction-standing design (Wave 73)

**Scope:** `docs/RepStandingDesign.md`; `out/w73/rep/shared-contract.md`; `out/w73/rep/current-rep-inventory.md`. Markdown only. Live cites: `save.js` reputation restore, `state.js` `rankFor`, `station.js` Standing, `hangar.js` / `trafficking.js` writers, `npc.js` hunt, `hail.js`.  
**Mode:** Deep audit (save-tamper reputation bag, proto keys, NaN, XSS, hostile yard skip, no universal crime score).  
**Method:** Self-applied `security-auditor` persona + orchestrator `security-review.md` checklist. Trust boundary is `rimward-save-v1` `world.reputation` plus dock/HUD strings.

### Risk Level: Medium (pre-impl persist hole; contract closes it)

### Summary

Wave 73 is markdown only. No `src/` ships. The trust boundary is the unsanitized reputation object on restore, plus rank/comm strings. First-pass gaps (wholesale bag, `__proto__` keys, NaN → Marked, `for…in` merge, `innerHTML`, universal wanted flag, guessed restitution) are closed in merge law §1, §4, §5, §7. Residual risk is single-player save tamper of finite faction numbers — the same class as editing credits — once sanitize holds.

### Findings

#### 🟠 HIGH (resolved in contract): Unsanitized `world.reputation` on restore

**Location:** `save.js` 75, 698–700; inventory §2  
**Issue:** Restore assigns the reputation object wholesale. No faction/finite/proto heal. A crafted blob can be an array, a setter object, or `{ __proto__: …, constructor: …, beautiful: "Sworn" }`.  
**Impact:** Prototype pollution if later code assigns `reputation[key]` from keys of the blob; `rankFor(NaN)` → Marked; string values break `+=` into concatenation (`"0" + 5` → `"05"` then `"055"`).  
**Fix applied:** Contract §1.2: `sanitizeReputation` from `sanitizeRestored`; fresh `{}`; `Object.keys` only; drop `RESERVED_IDS`, non-`FACTIONS`, non-finite; never `Object.assign` / `for…in` from the snap.

#### 🟠 HIGH (resolved in contract): NaN / missing math vs `rankFor` and yards

**Location:** `state.js` 680–682 `rankFor`; `shipyard.js` 80–86 already finite-checks; `station.js` 2888 `?? 0` does **not** catch NaN; `station.js` 1825 `freehold +=` on missing key → NaN  
**Issue:** `rankFor(NaN)` fails every `>=` and returns **Marked**. `NaN < 0` is false, so a caller that skips a finite helper could skip hostile yard refuse. Patrol `+=` on a missing `freehold` after a wiped bag yields NaN.  
**Impact:** Tamper-to-Marked hunt, or privilege skip of `rep < 0` if a new writer copies the patrol pattern.  
**Fix applied:** Contract §1.3: drop non-finite on restore; writers create keys with finite current (`?? 0` then add); callers use `standingRead` (hangar/yard shape). Do not change `rankFor` (`state.js` READ-ONLY).

#### 🟠 HIGH (resolved in contract): Prototype keys / `for…in` blob merge

**Location:** `world.js` 1093 greenhand `for (const f in ctx.world.reputation)`; origins `Object.keys` is safer (`origins.js` 57); live trafficking/graft already `hasOwn(FACTIONS)`  
**Issue:** A save that plants enumerable junk or reserved ids can be walked by greenhand beats or copied by a naive merge. `SAFE_ID` matches `__proto__`.  
**Impact:** Pollution of `Object.prototype` if any impl does `bag[userKey] =`; false greenhand max-rep from inherited keys.  
**Fix applied:** Contract §0.11, §1.2, §7: `RESERVED_IDS` + `hasOwn(FACTIONS)` before index/assign. Fresh bag. Never `for…in` assign from save. Greenhand later should iterate `Object.keys(FACTIONS)` (impl caution, not first-slice UI).

#### 🟠 HIGH (resolved in contract): Universal crime score as a second persist key

**Location:** wishlist REP-04 “does not become a universal crime rating”; owner freeze  
**Issue:** A later worker could add `world.wanted` or `crimeScore` to “make police work,” dual-write with reputation, skip sanitize, and lock every faction at once.  
**Impact:** Privilege (cannot recover locally); persist fork; XSS if a wanted board interpolates names via `innerHTML`.  
**Fix applied:** Contract §0.2, §5.1: no sibling key, no `WORLD_FIELDS` addition, no wanted flag. Attribution per victim/employer only.

#### 🟠 HIGH (resolved in contract): Restitution / kill deltas as unbounded save fields

**Location:** no live restitution; kill does not write (`combat.js` `npcDestroyed`)  
**Issue:** Inventing `job.restitution` or trusting a save-authored fine/kill penalty would mint credits or wipe standing.  
**Impact:** Economy/standing cheat cheaper than editing credits if unbounded.  
**Fix applied:** No restitution button without owner UU. Kill delta **proposed, needs owner**. Expire-style: writers use authored constants only. Sanitize does not honor unknown reputation keys.

#### 🟡 MEDIUM: Hostile yard skip is already finite-checked (live)

**Location:** `shipyard.js` 80–86, 191  
**Issue:** Live `dockReputation` returns 0 for non-finite, so NaN does **not** skip `rep < 0` today. Graft `hangar.standingOf` is the same. The HIGH is a **future writer** risk plus UI `?? 0` NaN display.  
**Impact:** Low on current yard path; high if PR4 copies patrol `+=`.  
**Fix:** Contract §1.3 standingRead. Documented. Not a Wave 73 code change.

#### 🟡 MEDIUM: `npc.standingOf` indexes `table[fac]` without `hasOwn`

**Location:** `npc.js` 1021–1026  
**Issue:** Faction string from `live.record.faction` without reserved-id drop. If records ever carry `__proto__`, the read is fail-open to inherited values.  
**Impact:** Hunt mis-fire. Record sanitize is a different module.  
**Fix:** Later hunt PR may add `hasOwn` + reserved drop. Do not change −10 in explain PRs. Out of first impl.

#### 🟡 MEDIUM: Beautiful graft vs restitution

**Location:** `hangar.js` 138–154 ownership invariant  
**Issue:** Setting `beautiful = 0` while a grafted row exists would skip BIO hostility if restitution forgot the cap.  
**Impact:** Tamper-or-pay to fly Abomination as Stranger.  
**Fix applied:** Contract §4.2: re-apply `min(current, −10)` after restitution. BIO wins.

#### 🟢 LOW: XSS via rank names and NPC lines

**Location:** `station.js` 2027–2032 `textContent`; `hud.js` 924 toast `textContent`  
**Issue:** Interpolated faction names and comm lines. Restored strings could hold `<script>`.  
**Impact:** None if `textContent` holds. `innerHTML` would be XSS.  
**Fix:** Contract §0.10 / §7. Rank names only from `RANK_LADDER`. `FACTIONS[k].name` after `hasOwn`.

#### 🟢 LOW: Single-player standing already writable

**Location:** `save.js` `'reputation'`  
**Issue:** Editing `freehold: 50` is not stronger than editing credits **if** proto/NaN/unknown keys drop.  
**Fix:** Sanitize so the bag is not the easier prototype or NaN cheat.

#### 🟢 LOW: No new secrets / telemetry

**Location:** design tree  
**Issue:** none.  
**Fix:** n/a.

### Passed Checks

- [x] No secrets in the design (no API keys, no telemetry)
- [x] No new `localStorage` key (`rimward-save-v1` only; `'reputation'` already listed)
- [x] No `crimeScore` / `wanted` persist
- [x] No `innerHTML` specified
- [x] Faction keys: `RESERVED_IDS` + `hasOwn(FACTIONS)`; `mine-__proto__` class of bug named
- [x] NaN cannot remain for `rankFor`
- [x] BIO cap cannot be skipped by restitution while grafted
- [x] Hostile yard path already finite-checked; new writers must copy that helper
- [x] `state.js` / `RANK_LADDER` not rewritten
- [x] Digit 0 shipyard; no Digit insert
- [x] Wave 73 markdown only

### Recommendations

1. Implementation PR1: pin `__proto__` / `constructor` dropped; `NaN` / `'50'` dropped; missing Beautiful stays missing; finite `freehold: 12` kept.
2. Implementation writers: never `bag.freehold += n` without `?? 0` finite current.
3. Do not add `'reputationChanged'` (extra event surface).
4. Owner must number restitution / kill deltas before those PRs.

### Re-run

Self-reapplied after contract §1 / §4.2 / §5.1 landed, and after the locker copy fix (gate is **Marked** `< −25`, not Suspect). No open 🔴 CRITICAL or 🟠 HIGH. Residual 🟡 live `npc.standingOf` and greenhand `for…in` are named later-impl cautions.
