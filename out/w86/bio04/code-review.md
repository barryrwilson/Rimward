# Code Review: BIO-04 psionic weapons design (Wave 86)

### Summary

The brief matches live combat after Wave 68: five `WEAPONS` keys, Digit 1–4 fire groups, auto turret, Unknowables non-beam ignore, hangar `hullKind`/`grafted`, HUD WPN `textContent`. First-pass holes (triad, Digit 8 steal, `?? 'cannon'` fallthrough, beam-to-hit-Unknowables, HUD family as fire test, persist SKU/UU, NPC fire, missing-catalog throw) are closed in the contract. Remaining notes are implementation cautions, not design blockers.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Markdown only; no `src/` edits. Nested subagents forbidden.

### Re-review (after first-pass fix)

First-pass 🔴/🟠 (`?? 'cannon'` / missing catalog `w.rof` throw, triad, Unknowables beam, Digit conflict, HUD-as-writer) closed in contract §0–§3 and the brief fire path. No remaining Blocker/Major.

### What's done well

- Inventory cites live `file:line` (2026-08-21) and states Wave 67 “three groups” is stale. Code wins.
- Merge law is explicit: `out/w86/bio04/shared-contract.md` wins over the brief.
- Eligibility is hangar-healed `living` **or** own `grafted: true`. Grafted HUD `mech` still allowed. Beautiful faction is not the test.
- Conventional guns stay. Psionic is Digit 5 additive.
- Digit map is checked against flight 1–4, dock 0/8/9, Outfitting 8/9 papers.
- Resources: existing `HEAT` only. Owner-open catalog numbers. No invented UU.
- Unknowables miss without forking mining.
- Player-only; `npcFire` tokens frozen.
- Serial PRs: catalog PR0 before combat. `state.js` READ-ONLY this wave.
- `innerHTML` forbidden. Emit literal. Innate persist (no nested loadout).
- Known WAVE4 / WAVE26 / WAVE35 FAILs stay.

### Findings

#### 🔴 Blocker (resolved): Three-resource heat/power/psi triad

**Location:** `state.js` 120, 140–161; `docs/BioLivingShipsDesign.md` §6; SHP-03 power-out.  
**Issue:** A psi capacitor is the power ledger SHP-03 left out.  
**Fix applied:** Contract §0.5 / §3.4. Heat only.

#### 🔴 Blocker (resolved): Steal Digit 0/1–4/8/9 or make turret a fire Digit

**Location:** `controls.js` 289–301; `station.js` 174, 5767–5769; `combat.js` 1771–1774.  
**Issue:** Fifth gun on Digit 4 would drop missiles. Digit 8/9 would drop launcher/turret papers.  
**Fix applied:** Digit **5** flight-only. Turret stays auto.

#### 🟠 Major (resolved): Unknown `weaponGroup` falls through to cannon

**Location:** `combat.js` 239; `hud.js` 202.  
**Issue:** Live `?? 'cannon'` means stuffed group 5 already fires cannon. A psionic map miss would shoot cannon on plated hulls.  
**Fix applied:** Contract §2: only 1–5 map; else `null` like empty group 4.

#### 🟠 Major (resolved): Missing catalog throws / cyan bolt

**Location:** `combat.js` 1763–1766, 892–894.  
**Issue:** `firePlayerGun` dereferences `w.rof`; unknown family materials use energy.  
**Fix applied:** Contract §3.1 null-guard. Catalog PR0 first. Do not ship energy-tinted psionics.

#### 🟠 Major (resolved): `beam: true` to hit Unknowables

**Location:** `state.js` 169–171; `combat.js` 1499–1500.  
**Issue:** Inventory does not support a second beam family. Default is miss.  
**Fix applied:** Projectile, `beam` not true, no mining ray copy.

#### 🟠 Major (resolved): HUD `bio` / persist SKU as eligibility

**Location:** `hud.js` 71–81; `hangar.js` 222–240.  
**Issue:** Grafted Abominations are `mech` and must still fire. A persist flag smuggles.  
**Fix applied:** `canFirePsionic` on healed player fields. Innate. HUD reads only.

#### 🟡 Minor: NPC refuse is belt-and-suspenders

**Location:** `combat.js` 1267–1270.  
**Issue:** `spawnNpcShot` would fire a stuffed psionic token.  
**Accept:** Contract §5 names the refuse. Not a design hole.

#### 🟡 Minor: Dock Digit 5 dual listener

**Location:** later `controls.js` + `station.js` 5710–5717.  
**Issue:** Flight TRACKED Digit5 also flips `weaponGroup` at the repair desk.  
**Accept:** Weapons cold while docked. Must not `preventDefault`.

#### 💡 Suggestion: Shared helper in `hangar.js`

Keep `graftedOwnTrue` private; export `canFirePsionic(ctx)` from the same module so HUD and combat cannot drift.

### Test coverage (later impl)

PR4 pins: living fire, grafted fire, built dry, Unknowables miss, Digit 0/8/9, no triad fields, `playerFire` token, `innerHTML` still 0. Do not “fix” known boot FAILs.
