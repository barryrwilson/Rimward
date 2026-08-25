# Code Review: FX remaining scrape / collision punch brief (Wave 113)

Design-only. Inventory cites live `bodyHit` emit (`ship.js` 935), combat applyHit **without** `spawnHitFx` (`combat.js` 1840–1856), weapon callers 1742 / 1799, WAVE111 `spawnRipple` parent 1050–1106, shake (`ship.js` 1223–1228), hull-strike toast (`hud.js` **608–610**, `pushToast` **1130–1150**), hub (`hud.js` **726–729**), facing flash (`hud.js` **863**, **1127–1128**, **1167–1169**, **1407–1417**), IMPACT 8 / 0.35 (`physics.js` 11–12), `RIPPLE_POOL` 16 / `HULL_MARK_POOL` 12. MERGE LAW deputizes one `spawnHitFx` call without `state.js` write, without bounce steal, without IMPACT retune, without hub/Digit. Flash map and PHY-04 80 u stay skippable. Leftover frozen **REAL**, not CONSUME. HUD consume cites re-censused iteration 2. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Design-doc checklist folded in. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is **scrape world punch via live `spawnHitFx`**, not bounce, not IMPACT retune, not Wave 111 parent rewrite; fail closed is skip FX; smallest additive is combat 1b only; PR plan is named-only; Digit/hub/`state.js`/no-new-key/reducedMotion/no-extra-toast freezes sit in MERGE LAW. Inventory line numbers match Wave 113 live `src/`. Weapon ripple named **LIVE consume**.

### What's done well

- Code-wins census: two `spawnHitFx` callers, both weapons; scrape path has none. Honest **REAL** leftover.
- Correctly separates **PHY bounce/damage** (LIVE consume) from **world FX** (ABSENT) so WAVE53 impact and WAVE111 parent pins are not inverted.
- Flash map and 80 u explicitly **not** required PR1 (Wave 112 skippable stay skippable).
- Fail-closed table matches skip-FX / never-zero-speed / never-skip-applyHit.
- First serial named **PR1 scrape `spawnHitFx`**; Digit 0/8/9 and `state.js` forbidden on that PR.
- Toast duplication fenced: hull-strike already fires at **608–610**; `pushToast` refreshes the same key **1133–1135**; no second string. Stale 591–593 / 709–712 / 846–847 / 1149–1151 **must not** be the consume bind.
- Slide-only `speed < 8` fenced so parking does not spawn rings.
- Home is `combat.js` 1b, not `ship.js` — PHY/FX boundary is honest.

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | REAL scrape `spawnHitFx` | §0 census REAL | Match |
| Fail closed | skip FX; never stop | §0.19 / §2 | Match |
| Smallest additive | call `spawnHitFx` | §0.1 | Match |
| New persist key | no | §0.6 | Match |
| Bounce / IMPACT | consume | §0.12–0.13 | Match |
| WAVE111 parent | consume / call | §0.15 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no punch pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| Extra toast | no | §0.2 | Match |
| Flash map / 80 u | not required PR1 | §0.21 / §3 | Match |
| First serial | PR1 scrape | §3; no Digit; no state.js | Match |
| `reducedMotion` | snap | §0.23 | Match |
| FP player host | WAVE111 | §0.15 / §2 | Match |

### PHY / FX boundary honesty

| Boundary | Freeze | Honest? |
|---|---|---|
| `ship.js` writes pose/velocity | consume; later FX does not write | Yes |
| Combat fills `e.damage` + applyHit | consume; FX after that | Yes |
| Collision proxies | do not change | Yes |
| IMPACT 8 / 0.35 | copy; do not retune | Yes |
| World punch | `spawnHitFx` only | Yes |
| Contact on event | not required; origin pos | Yes (smallest) |
| NPC bounce | no `bodyHit`; not this leftover | Yes |
| Sun heat | no `spawnHitFx` | Yes |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (fixed iteration 2): HUD consume cites were stale

**Location:** first-pass inventory §7; contract §0.2; brief current-state table. Designer `out/w113/designer/fxscrape-ui-audit.md`.

**Issue:** Pack pointed “no extra toast / no hub pip” at `hud.js` 591–593 (`worldEvent`), 709–712 (sysname CSS), 846–847 (contact-pip lastX), 1149–1151 (`pushToast` write, not facing). A later PR that grepped those lines and missed `'▲ Hull strike.'` could add a second scrape toast.

**Fix:** Re-census. Bind toast **608–610** + `pushToast` **1130–1150**. Bind hub **726–729** + `hud.css` 184–193. Bind facing **863**, **1127–1128**, **1167–1169**, **1407–1417**. Grep `'▲ Hull strike.'` and `.rw-reticle`.

**Status:** fixed this pass in inventory, contract, brief, reviews.

#### 🟡 Minor: Scrape pos is hull origin, not contact

**Location:** contract §0.1 pos freeze; live `bodyHit` payload `ship.js` 935 has no world point.

**Issue:** Weapon hits stamp at bolt `p.mesh.position`. Scrape PR1 uses `playerObj.position`. The ring/scorch sits at the ship origin (plus WAVE111 lift), not the station skin. That is coarser than a ram glance.

**Fix:** Accept as smallest combat-only additive. Do not require `ship.js` to grow the event. Owner may later pass `_hit` normals **without** stealing bounce; that is not PR1.

**Status:** documented; deputized origin pos.

#### 🟡 Minor: `spawnFlash` remains an untextured square

**Location:** `combat.js` 594–607, 990–1001.

**Issue:** Scrape will inherit the cheap quad. Punch leftover is the missing `spawnHitFx` call, not the flash map.

**Fix:** Optional skippable flash map. **Not** required PR1.

**Status:** accepted; contract §0.21.

#### 🟡 Minor: `'impact'` tints energy cyan

**Location:** `FAMILY_COLORS` `combat.js` 198; spawn helpers `?? FAMILY_COLORS.energy`.

**Issue:** A ram ring reads as a cannon screen hit. Adding `FAMILY_COLORS.impact` or `WEAPONS.impact` would be a color/`state.js` retune.

**Fix:** Consume energy fallback. Do not write `state.js`.

**Status:** frozen.

#### 💡 Suggestion: Later optional boot pin `scrapeCallsSpawnHitFx`

**Location:** scrape loop `combat.js` 1840–1856.

**Issue:** WAVE54 already greps `spawnRipple` / `spawnHitFx` existence. Boot will still pass if scrape never calls it.

**Fix:** Later optional pin: damaging bodyHit loop contains `spawnHitFx`. Do not edit boot in this markdown worker. Do not invert WAVE54.

**Status:** frozen as named-only (brief acceptance item 6).

### Cite spot-check (live)

| Claim | Live |
|---|---|
| `spawnHitFx` callers | `combat.js` 1742, 1799 only |
| Scrape loop no FX | 1840–1856 |
| WAVE111 `host.add` | 1086–1088 |
| `PHY.IMPACT_MIN_SPEED` 8 | `physics.js` 12 |
| `PHY.IMPACT_SCREEN_PER_U` 0.35 | `physics.js` 11 |
| `RIPPLE_POOL = 16` | `combat.js` 186 |
| `HULL_MARK_POOL = 12` | `hull-marks.js` 7 |
| Hull-strike toast | `hud.js` **608–610** (`'▲ Hull strike.'`); not 591–593 |
| Toast write | `pushToast` **1130–1150** |
| Hub + RANGE | `hud.js` **726–729**; pop **1392–1404** |
| Facing flash | **863**, **1127–1128**, **1167–1169**, **1407–1417** |
| `el()` | **261–266** |
| Digit 0 shipyard | `station.js` 188, 6098–6102 |
| `WORLD_FIELDS` no FX | `save.js` 76–101 |
| `AVOID_LOOKAHEAD` 40 not 80 | `physics.js` 19 |
