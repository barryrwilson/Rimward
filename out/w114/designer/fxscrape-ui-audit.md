# UI Audit: FX scrape PR1 world punch (Wave 114)

Persona: designer (orchestrator `ui-audit.md`). Re-audit of worker `out/w114/fxscrape/ui-audit.md`. Did not copy that file blindly.

Cite for player outcome: `docs/Fx01RemainingScrapeDesign.md` **Player outcome** (263–271). Contract: `out/w113/fxscrape/shared-contract.md`. Product files reviewed: `src/systems/combat.js` scrape loop 1840–1871 and `spawnHitFx` 1110–1117 (helpers 960–1161, tick 2006–2082). Consume checks: `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/settings.js`, `src/systems/station.js` Digit 0.

### Summary

World punch is one live `spawnHitFx` call on the damaging ram path. No hub pip, no second toast, no Digit steal, no new settings checkbox. `reducedMotion` still snaps one ripple frame and mutes sparks. Fail-closed skip of world FX does not skip damage. No Blocker or Major.

**Verdict: CLEAN**

---

### What's done well

- No punch chrome on the 80 px hub. Combat does not create a child of `.rw-reticle` (`hud.js` 726–729 still pupil / three cilia / RANGE only; `hud.css` 184–193 still 80×80). Facing flash stays on `.rw-combat-self` (`hud.js` 863, 1167–1169, 1407–1417).
- `'▲ Hull strike.'` is still the one HUD string (`hud.js` 608–610). Combat fills `e.damage` and does not toast scrape, `'▲ Scrape.'`, or `'▲ SHIELD HIT.'`. Same-key refresh stays `pushToast` 1130–1150.
- Digit 0 remains shipyard (`station.js` 188, 6100–6102, 6145–6147, 6183–6184). PR1 does not bind a dock verb.
- Settings `CHECKBOXES` (`settings.js` 40–47) still has no scrape / punch row. Live `reducedMotion` is reused.
- Shielded ram samples `player.screen || player.shell` **before** `applyHit` (`combat.js` 1850–1851), then `spawnHitFx(pos, 'impact', shielded, host)` (1859). XOR (`1110–1117`): ripple if shielded, else sparks + `stampHullMark`. Matches player outcome: screens up → hull-local ring (WAVE111 parent in `spawnRipple` 1065–1103; first-person player host stays world-space); screens down → sparks + scorch.
- Slide `speed < PHY.IMPACT_MIN_SPEED` (8) `continue`s before applyHit and FX (`1848`). No world FX below 8 u/s. `bodyHit` toast stays mute while `e.damage` is 0.
- Fail closed: missing / non-finite host skips `spawnHitFx` (`1856–1861`); `applyHit` + `playerHit` already ran (`1852–1855`). `try/catch` around FX and park (`1859–1866`). Never zeros speed. No `innerHTML` in `combat.js`.
- `reducedMotion` is live helpers, not a new pulse: `spawnRipple` snap + one-frame hide (`1051–1062`, `2044–2053`); `spawnSparks` early return (`962`); spark tick hide (`2067–2081`). No extra `@keyframes`.
- Family `'impact'` still fail-closes color to energy cyan (`FAMILY_COLORS` 198; spawn helpers `?? FAMILY_COLORS.energy`). No `WEAPONS.impact`. No `state.js` write.
- Sun path (`1873+`) still has no `spawnHitFx`. Weapon callers 1742 / 1799 unchanged. Mark pool still `HULL_MARK_POOL` 12.

---

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Untextured impact flash square (inherited, skippable)

**Location:** `src/systems/combat.js:990–1001` (`spawnFlash`), called from `spawnHitFx` `1110–1111`; scrape site `1859`
**Severity:** Minor
**Issue:** `spawnFlash` has no `map` (pool materials `597–602`). Rams inherit the same untextured additive square weapons already show. Player outcome asks for the weapon punch family, not FX-01 glow map. Contract forbids landing flash map as required PR1.
**Suggestion:** Do not land flash `glowTex` in this leftover. Keep skippable.
**Status:** documented; skippable; not a PR1 defect.

#### 💡 Suggestion: Origin pos can bury the unshielded scorch

**Location:** scrape pos `combat.js:1856–1859` (`host.position`); `stampHullMark` `1137–1160`; `liftLocalOffset` in `src/game/hull-marks.js:48–56`
**Severity:** Suggestion
**Issue:** Contract froze origin (not a PHY contact field). `worldHitToLocal` of the host origin is `(0,0,0)`. `liftLocalOffset` returns when length is 0, so the scorch sits at hull center (scale 0.62). Sparks still emit from that origin and read. The ring still parents and scales past the hull (2.2→9.4). The scorch itself may hide inside the mesh.
**Suggestion:** Do not add a `bodyHit` contact in this PR. If a later serial wants a visible stamp, pass a tiny along-forward world offset at the combat call site only — do not rewrite `spawnRipple` parent law.
**Status:** accepted origin; not required PR1.

#### 💡 Suggestion: Family `'impact'` tints energy cyan

**Location:** `src/systems/combat.js:198` `FAMILY_COLORS`; scrape `'impact'` at `1859`; fallback `?? FAMILY_COLORS.energy` in `spawnRipple` `1060`, `spawnFlash` `995`, `spawnSparks` `968`
**Severity:** Suggestion
**Issue:** Scrape rings match energy, not a unique scrape hue. Player outcome names “family-tinted ring (energy fallback)”. Contract forbids `FAMILY_COLORS.impact` and `WEAPONS.impact`.
**Suggestion:** Keep fallback.
**Status:** accepted.

---

### Consume (focus checklist)

| Check | Result | Cite |
|---|---|---|
| No punch pip / new child on `.rw-reticle` / 80 px hub | Pass | `hud.js` 726–729; `hud.css` 184–193; combat PR1 is `combat.js` 1b only |
| No second hull-strike toast | Pass | grep `'▲ Hull strike.'` → `hud.js` 610 only |
| `reducedMotion` snaps one ripple frame, mutes sparks | Pass | `spawnRipple` 1051–1062 + tick 2044–2053; `spawnSparks` 962 |
| Shielded ram → hull-local ring; unshielded → sparks+scorch; slide &lt; 8 u/s → no world FX | Pass | XOR 1110–1117; WAVE111 1065–1103; slide 1848; `PHY.IMPACT_MIN_SPEED` 8 |
| Digit 0 not stolen; no new settings checkbox | Pass | `station.js` Digit 0 shipyard; `settings.js` 40–47 |
| Fail closed: missing host skips FX, scrape still damages | Pass | applyHit 1852 then gated FX 1856–1861 |

Player outcome (`docs/Fx01RemainingScrapeDesign.md` 263–271): bounce, 0.35 / u/s, hull-local ring in chase/third, first-person ring not filling the glass (WAVE111 world-space), one `'▲ Hull strike.'` toast, sparks+scorch when screens down, slide below 8 u/s mute, hub empty, Digit 0 shipyard, `reducedMotion` snap — **met** in this PR.

### Worker self-audit

Worker `out/w114/fxscrape/ui-audit.md` verdict (no Blocker/Major; skippable flash; energy fallback) matches this pass. Origin-stamp note is additive; it does not change CLEAN.
