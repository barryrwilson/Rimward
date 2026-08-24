## UI Audit: BIO-04 WPN rail (Digit 5 / psionic)

### Summary
Digit 5 reuses the existing WPN rail, lead pip, and RANGE class. Eligible copy is `5 · Psionic bolt`; ineligible or missing catalog is `5 · —`. There is no new HUD tree, no aim-glass gauge, no incoming psi bar, and no HUD write of `hullKind`. Grafted-built family stays `mech`.

### Scope checked
- `src/systems/hud.js` (`hudWeaponKey`, `weaponHudLabel`, lead, range, family, strain)
- `src/systems/controls.js` Digit 5 + help line
- `src/ui/hud.css` (no psionic / Digit 5 rules; no new gauge)
- `out/w86/bio04/shared-contract.md` §6 HUD law
- `out/w92/bio04/ui-audit.md` worker self-audit
- `out/w92/bio04/browser-notes.txt` and `out/w92/bio04/wpn-digit5.png`

### What's done well
- Empty group copy matches missiles: em dash, never the words “not available” (`hud.js:222-224`; contract §0.9 / §6).
- Eligible name is catalog `WEAPONS.psionic.name` via `textContent` only (`hud.js:224`, `1803-1804`; `el()` at `hud.js:239-244` never uses `innerHTML`).
- `hudWeaponKey` returns `'psionic'` only when `psionicCatalogOk()`; unknown groups stay `null`, not cannon (`hud.js:199-207`).
- Lead uses `WEAPONS.psionic.speed` when eligible and `speed > 0`; mining-style hide when ineligible (`hud.js:1264-1267`, `1285-1286`).
- Range pop uses `WEAPONS.psionic.range` when eligible; else `0` so `.in-range` stays off (`hud.js:1328-1336`). Reticle still shows the existing static `RANGE` word (`hud.js:697`), not a numeric gauge.
- Heat panel title is still `Heat`; strain is still `player.heat / HEAT.max` (`hud.js:895-899`, `1805-1806`). Incoming dart toast timer is unchanged; no psi incoming bar (`hud.js:569-570`, `1046`).
- `hudFamily` treats `hullKind === 'built'` as `mech` before living/bio (`hud.js:76-84`). HUD caches `player.hullKind`; it does not assign it (`hud.js:1050`, `1672-1678`).
- Digit 5 is TRACKED and not in `PREVENT_DEFAULT` (`controls.js:43`, `48-49`, `259`, `308-310`). Help lists `1/2/3/4/5` (`controls.js:343`).
- Magenta-rose stays on the bolt, not on WPN chrome. Color is not the only fire signal (Digit + name).
- Browser still: living starter WPN `5 · Psionic bolt`, bio family, no extra glass widgets (`wpn-digit5.png`, `browser-notes.txt`). Grafted-built: WPN name on, family still `mech`. Forced built: `5 · —`, family `mech`.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Digit 5 help line wraps in the controls panel

**Location:** `src/systems/controls.js:343`
**Issue:** The binding line is now `1/2/3/4/5 — weapon group: cannon / disruptor / mining / missiles / psionic`. The controls panel is `max-width: 280px` (`hud.css:1077-1081`). The live still wraps the line after `cannon /`.
**Why it matters:** The list stays readable. A second rail or a shorter exclusive help row would violate HUD-01 (no new tree).
**Fix:** Leave. Do not add a new rail or a Digit-5-only panel.

#### 💡 Suggestion: No family swatch on the WPN rail

**Location:** `src/systems/hud.js:836-838`, `src/ui/hud.css:918-920`
**Issue:** WPN value stays `--white`. Magenta-rose identity is on the projectile, not the label.
**Why it matters:** Color is never the only signal. Digit 5 + `Psionic bolt` already name the group. A swatch or psi tint would be extra aim-glass chrome (contract §6 / HUD-01).
**Fix:** None. Do not add a swatch, lock box, aspect ring, or incoming gauge.

### Contract HUD law (pass/fail)

| Law | Result |
|---|---|
| WPN `5 · ` + catalog name when eligible | Pass — `hud.js:222-224`; still `5 · Psionic bolt` |
| WPN `5 · —` when `!canFirePsionic` or no catalog | Pass — same branch; still never “not available” |
| Lead reads group 5 speed when eligible; else hide | Pass — `hud.js:1264-1267` |
| Range pop reads group 5 range when eligible; else 0 | Pass — `hud.js:1328-1332` |
| Strain row stays heat %; no second bar | Pass — `hud.js:895-899`, `1805-1806` |
| No incoming psi gauge / lock box / aspect ring / new rail | Pass — existing reticle + LEAD + RANGE word only |
| HUD never writes `hullKind` / `grafted` | Pass — read + cache only |
| Grafted HUD family stays `mech` | Pass — `hudFamily` built → `mech`; browser notes |
| HUD family / session skin does not grant fire | Pass — fire test is `canFirePsionic`, not `hudFamily` |
| `hud.css` new chrome | Pass — no Digit 5 / psi rules added |

### Aim glass
- No incoming psi gauge.
- No lock box.
- No aspect ring.
- Existing `.in-range` may light when eligible range contains the lock (`hud.js:1333-1336`).
- Existing LEAD pip may show when eligible `speed > 0` (`hud.js:1269-1287`).

### Verdict
Pass. No 🔴/🟠. Worker self-audit matches this pass. Quick wins already documented as leave-as-is.
