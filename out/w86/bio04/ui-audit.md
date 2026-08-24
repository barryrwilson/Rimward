## UI Audit: BIO-04 psionic WPN readout (design freeze)

### Summary

BIO-04 does not add a HUD tree. The freeze reuses the live WPN rail, lead pip, and `.in-range` pop for Digit 5. Aim glass stays empty of incoming gauges and lock boxes. Ineligible / missing catalog copy is `5 · —`, never the words “not available”. Reduced-motion follows live bolts.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Markdown only. Do not edit product UI. Nested subagents forbidden. No designer agent this pass; this is the worker self-audit.

### What's done well

- WPN already exists on the self rail (`hud.js` 810–812, 1728–1730) with 5 Hz `textContent` writes.
- Empty group 4 already teaches `4 · —` (`hud.js` 210). Group 5 copies that pattern.
- Lead already keys off `hudWeaponKey` speed (`hud.js` 1224–1229). Mining hides; empty group 4 does not cannon-fallback.
- Range pop already keys off catalog range (`hud.js` 1288–1298).
- Strain is heat % of `HEAT.max` (`hud.js` 1731–1732) — a real live resource, not a new psi bar.
- HUD-01 glance placement is unchanged. HUD-02 family still `built` → `mech`, `living` → `bio`. Grafted stays mech **and** may fire (WPN still reads).
- Color is not the only cue: WPN text carries the catalog name / em-dash.
- `innerHTML` grep 0. Reduced-motion already gates sparks/muzzle (`combat.js` 924, 1861–1862) while bolts simulate.

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### U1: New aim-glass chrome (incoming / lock box / psi capacitor)

**Location:** `docs/HudUtilityChangeProposal.md` §2 rule 2; HUD-01 empty glass; TGT remaining names missile warnings.  
**Issue:** A mind-lock pip, incoming psi gauge, or capacitor bar would sit on the shot path.  
**Fix applied:** Contract §0.9 / §6. Existing WPN / RANGE / lead **read** group 5 only. No new rail, gauge, or lock box.

##### U2: Copy “not available” / N/A on ineligible hulls

**Location:** task UI law; `weaponHudLabel` `hud.js` 206–221.  
**Issue:** Career copy that says the gun is “not available” is banned. It also reads as a shop error.  
**Fix applied:** `5 · —` (same empty-group-4 grammar). Never those words.

##### U3: HUD family used as a disabled state

**Location:** `hud.js` 71–81.  
**Issue:** Hiding Digit 5 on `mech` would block Abominations (grafted built). Showing a bio-only badge would write identity the HUD does not own.  
**Fix applied:** Family skin does not gate WPN. Eligibility is hangar-healed fields. HUD never writes `hullKind`.

##### U4: Digit help vs dock collision, unlabeled 5

**Location:** `controls.js` 334 help line `1/2/3/4`.  
**Issue:** Players would not know 5 exists; stealing 8/9 labels would lie at the desk.  
**Fix applied:** Later help line lists 1–5. Dock Digit 5 stays Repair. Flight only.

#### 🟡 Minor

##### U5: Colorblind family tint

**Issue:** A new `FAMILY_COLORS.psionic` hex is owner-open. Color-only identity would fail HUD-01 shape+color.  
**Default:** WPN text + bolt motion. Hex must not equal energy/disruptor/mining/missile. Colorblind body class stays.  
**Why not Major:** Name on the rail is the primary cue.

##### U6: Reduced-motion still must shoot

**Location:** `combat.js` 1794 seekers simulate; sparks hide.  
**Issue:** Treating psionic as “FX” under `reducedMotion` would delete the gun.  
**Accept:** Contract §6 — simulate the bolt; suppress spark/muzzle animation like other guns.

##### U7: Lead pip for a slow bolt

**Issue:** Owner-open speed. A very slow bolt makes a large lead offset.  
**Accept:** Same TOF math as cannon/disruptor. Hide if `speed` 0 or ineligible. No extra lead chrome.

#### 💡 Suggestion

Keep controls help to one line (`1–5 — weapon group: …`). Do not add a second onboarding card.

### HUD freeze (readout)

| Element | Later impl | Must not |
|---|---|---|
| WPN | `5 · <catalog name>` or `5 · —` | “not available”, N/A, innerHTML |
| Lead | Catalog speed when eligible | Lock box, aspect ring |
| Range | `.in-range` from catalog range when eligible | New DIST row |
| Strain | Heat % (live) | Psi / power bar |
| Aim glass | Unchanged reticle | Incoming gauge, capacitor |
| Family | Unchanged mech/bio | Write `hullKind` |

### States

| State | WPN | Fire |
|---|---|---|
| Living / grafted, catalog present | `5 ·` name | LMB + heat |
| Built non-grafted | `5 · —` | none |
| Catalog missing | `5 · —` | none |
| Overheat | name stays; live overheat lockout | none (live) |
| Docked | desk owns Digit 5 | weapons cold |
| `reducedMotion` | unchanged text | bolt yes; spark/muzzle no |

### Passed checks

- [x] Keyboard: Digit 5 added to flight only; 0/8/9 untouched
- [x] Contrast: existing tokens; text cue on WPN
- [x] No new HUD tree
- [x] Empty / disabled copy is em-dash, not “not available”
- [x] Aim glass extras off
- [x] Reduced-motion named
