## UI Audit: later BIO-04 Digit 5 WPN / RANGE / lead (designer)

**Reviewer:** designer pass  
**Scope:** `docs/Bio04PsionicsDesign.md` HUD freeze, `out/w86/bio04/shared-contract.md` §0.9 / §2 / §6, prior `out/w86/bio04/ui-audit.md`, live WPN / Digit fire in `src/systems/hud.js`, `src/systems/controls.js`, `src/systems/combat.js`, `src/systems/station.js`, `src/ui/hud.css`.  
**Not in scope:** product `src/` edits, brief edits, catalog numbers, combat Unknowables / NPC law except as HUD readout.  
**Wave:** 86 markdown freeze only. No live Digit 5, no `WEAPONS.psionic`, no new HUD tree.

### Summary

The later HUD freeze reuses the live self-rail WPN row, lead pip, and `.in-range` hub. It does not add aim-glass chrome, a lock box, an incoming gauge, or a psi/power bar. Empty copy is `5 · —`. Grafted fire keeps HUD family `mech`. Digit 5 is flight-only; dock Digit 5 stays repair / mining Mk II.

**Verdict: CLEAN**

No remaining 🔴 Blocker or 🟠 Major in the freeze. Wave 86 ships no chrome. Later PR3 must close live `hudWeaponKey` / `weaponHudLabel` cannon fallback before Digit 5 is a player bind.

### What's done well

- WPN already sits on the HUD-01 self rail (`hud.js` 810–812, 1728–1730). Writes are 5 Hz `textContent` on change. Freeze adds no rail and no DIST row.
- Empty group 4 already teaches `4 · —` (`hud.js` 209–210). Group 5 copies that grammar. Never “not available” / N/A.
- Lead and range already key off `hudWeaponKey` (`hud.js` 1224–1229, 1288–1297). Mining hides (speed 0). Empty group 4 does not cannon-fallback **inside the `g === 4` branch**. Freeze extends the same consumers.
- Strain is heat % of `HEAT.max` (`hud.js` 869–873, 1731–1732). Plant / Flight / Heat stay `.rw-aux`. No capacitor, no G/S/E.
- Aim glass stays empty of extras: no incoming gauge, no lock box, no aspect ring (HUD-01 rule 2; `docs/HudUtilityChangeProposal.md` §2–§3). Dart toast `lastIncomingDartAt` (`hud.js` 560–561) is existing comm, not a glass gauge.
- HUD family is `built` → `mech`, `living` → `bio` (`hud.js` 72–80). Grafted Abominations stay **mech** and may still fire. HUD never writes `hullKind` / `grafted`. `sessionStorage['rw-hud-family']` skins only.
- Color is not the only cue: WPN text carries catalog name or em-dash. `.in-range` is dashed vs solid hub (`hud.css` 192–201), not a new color-only pip.
- `el()` sets `textContent` (`hud.js` 230–233). Grep: no `innerHTML` in `hud.js` / `combat.js` / `controls.js` / `station.js`.
- Reduced-motion already simulates bolts and seekers (`combat.js` 1794, 1861–1862); sparks skip (`combat.js` 924); muzzle/ripple snap one frame (`combat.js` 970–978, 1814). Freeze follows that law. Treating the bolt as FX would delete the gun.
- Dock map is live and unstolen: L1 Digit 5 = repair (`station.js` 174 `DOCK_KEY_SERVICES` index 4; 5710–5717). Outfitting L2 Digit 5 = mining Mk II (`station.js` 5765–5766). Digit 0 / 8 / 9 stay shipyard / launch papers / turret papers.
- Combat is cold while docked (`combat.js` 1666–1669). `PREVENT_DEFAULT` is Space-only (`controls.js` 46–47). Later Digit 5 must not swallow the desk key.

### Frozen later chrome (do not reopen)

| Surface | Freeze | Live cite |
|---|---|---|
| Flight Digit 5 | `TRACKED` + `weaponGroup = 5` → `psionic` | `controls.js` 37–41, 289–301 (1–4 only today) |
| Dock Digit 5 | Repair (L1). Mining Mk II (outfitting L2) | `station.js` 174, 5710–5717, 5765–5766 |
| WPN | `5 · <catalog name>` or `5 · —` | `hud.js` 206–221, 810–812, 1729–1730 |
| Lead | Catalog speed when **eligible** and `speed > 0`; else hide | `hud.js` 1224–1248 |
| Range | `.in-range` from catalog range when **eligible**; else 0 | `hud.js` 1288–1297 |
| Strain | Heat % only | `hud.js` 869–873, 1731–1732 |
| Family | Unchanged mech/bio. Grafted stays mech | `hud.js` 72–80 |
| Aim glass | No new tree, lock box, incoming, capacitor | HUD-01; contract §0.9 / §6 |
| Copy XSS | `textContent` only | `hud.js` 230–233 |
| `reducedMotion` | Bolt simulates; spark/muzzle animation off | `combat.js` 924, 1794, 1861–1862 |

### Live holes PR3 must close (specified, not freeze defects)

These are **today’s** HUD. They are why PR3 exists. Do not ship Digit 5 with them open.

| Hole | Location | If left open |
|---|---|---|
| Unknown group → cannon | `hud.js` 202 `WEAPON_KEYS[g - 1] ?? 'cannon'`; `combat.js` 239 same | Stuffed or selected group 5 reads/fires **Energy cannon** |
| No group 5 label branch | `hud.js` 206–221 | WPN becomes `5 · Energy cannon` via fallback |
| Digit 5 not tracked | `controls.js` 37–41, 289–301, 334 help `1/2/3/4` | No flight select; help lies |

### Findings

No 🔴 Blocker. No 🟠 Major. The freeze matches live WPN / empty-group-4 / dock Digit 5. Later impl must not reopen the items below as new chrome.

#### 🟡 Minor: `hudWeaponKey` must not return `psionic` on a dry hull

**Location:** contract §6 (`hudWeaponKey`: catalog → `'psionic'`; label/lead/range re-test `canFirePsionic`); live lead/range (`hud.js` 1227–1231, 1290–1294) read **only** `hudWeaponKey`

**Issue:** Empty group 4 is `null` at `hudWeaponKey`, so lead hides and range is 0 with no extra gate. Group 5 ineligible is specified as catalog-present `'psionic'` plus a second eligibility check. If PR3 maps group 5 in `hudWeaponKey` and forgets `canFirePsionic` on lead/range, a plated non-grafted hull gets a lead pip and `.in-range` pop for a gun that does not fire. That is a HUD-01 lie on the aim glass.

**Fix:** Treat ineligible / missing catalog like empty group 4: `hudWeaponKey` returns `null`. Then `weaponHudLabel` can still force `5 · —` when `g === 5`. Lead/range inherit hide/0. Do not rely on three call sites to remember eligibility.

**Status:** open — impl pin. Freeze already says “when eligible”; align the helper so the pattern cannot drift.

#### 🟡 Minor: Serial WPN lie between PR2 and PR3

**Location:** contract §9 PR2 Digit bind then PR3 HUD; `hud.js` 202

**Issue:** After Digit 5 is `TRACKED` and before `?? 'cannon'` dies in HUD, WPN, lead TOF, and range envelope all read **cannon** while combat (PR1) may already fire `psionic` or null. Glance and shot disagree.

**Fix:** Do not call Digit 5 done until PR3 closes `hudWeaponKey` / `weaponHudLabel`. Prefer one merge if PR2 would ship alone. Help line `1–5` lands with the bind (`controls.js` 334).

**Status:** open — serial pin. Contract already names PR3.

#### 🟡 Minor: Dock Digit 5 also sets flight `weaponGroup`

**Location:** later `controls.js` `TRACKED` Digit5; `station.js` 5710–5717 (desk owns Digit without `preventDefault`)

**Issue:** Repair (and outfitting Mk II) still work if Space remains the only swallow. The flight group still flips to 5 under the station overlay. On undock, WPN may already show `5 · —` (built) or the catalog name (living/grafted). Same class as live Digit 1–4 at the desk.

**Fix:** Do not `preventDefault` Digit 5. Do not remap the desk. Optional: ignore Digit weapon writes while `ctx.flags.docked` — not required; weapons are cold (`combat.js` 1666–1669).

**Status:** accept — freeze is correct. Code-review already named the dual listener.

#### 🟡 Minor: WPN value has no ellipsis

**Location:** `hud.css` 820–857 (rail `max-width: 220px`; ellipsis only on `.rw-combat-name`); owner-open `WEAPONS.psionic.name`

**Issue:** Group 4 already concatenates name + ammo (`hud.js` 215). A long psionic name at `--rw-text-scale: 1.5` can wrap or spill the self rail toward the hub. Empty `5 · —` is short and safe.

**Fix:** Keep the catalog name as short as live guns (`Energy cannon`, `Disruptor`, `Dart rack`). Optional: `nowrap` + ellipsis on `.rw-combat-wpn .rw-value` like the target name. Do not add a second WPN row.

**Status:** open — owner name + PR3 CSS if the string is long.

#### 💡 Suggestion: One help line

Keep `1–5 — weapon group: …` on the existing controls list (`controls.js` 325–342). Do not add an onboarding card or a dock footnote that Digit 5 is also Repair.

#### 💡 Suggestion: Do not skin WPN by HUD family

`5 · —` is the dry state for built non-grafted. Do not dim, hide, or recolor the row when `data-family="mech"`. Grafted mech must still read the catalog name.

### Accessibility checklist (later impl)

- [ ] Keyboard: flight Digit 5 selects group only; LMB still fires; Space remains the only `preventDefault`
- [ ] Dock Digit 5 still Repair (L1) and mining Mk II (outfitting 5); 0 / 8 / 9 untouched
- [ ] WPN copy is text, not color-only (`5 · name` / `5 · —`)
- [ ] No “not available” / N/A
- [ ] No `innerHTML`; `weaponName.textContent` only
- [ ] Contrast: existing rail tokens; no new psionic HUD palette
- [ ] Colorblind: name on the rail; bolt motion; hex must not equal energy/disruptor/mining/missile
- [ ] Reduced motion: bolt still simulates; spark/muzzle animation off (live law)
- [ ] No new focus target, hit target, or HUD tree
- [ ] HUD family override / `rw-hud-family` does not grant fire and does not hide Digit 5 on mech
- [ ] Lead and `.in-range` hide/zero when ineligible (prefer `hudWeaponKey` null)

### States (later impl)

| State | WPN | Lead / `.in-range` | Fire |
|---|---|---|---|
| Living, catalog present | `5 ·` name | Catalog speed/range | LMB + heat |
| Grafted built, catalog present | `5 ·` name. Family stays **mech** | Catalog speed/range | LMB + heat |
| Built non-grafted | `5 · —` | Hide / 0 | None. No heat |
| Catalog missing / non-finite | `5 · —` | Hide / 0 | None |
| Missing player | `5 · —` | Hide / 0 | None |
| Overheat (eligible) | Name stays | Live envelope | Live lockout |
| Docked | Desk owns Digit 5 | Weapons cold | None |
| `reducedMotion` | Unchanged text | Unchanged | Bolt yes; spark/muzzle no |

### Passed checks (freeze vs live occupancy)

- [x] No new HUD tree; WPN / RANGE / lead may read group 5
- [x] Aim glass extras off (no incoming, lock box, capacitor, aspect ring)
- [x] Digit 5 flight-only; dock 5 = repair / Mk II
- [x] Built non-grafted `5 · —` and no shot
- [x] Living and grafted-built may fire; grafted HUD stays `mech`
- [x] Strain stays heat %
- [x] `textContent` only
- [x] Reduced-motion still simulates the bolt
- [x] HUD never writes `hullKind`

### Method

Read `docs/Bio04PsionicsDesign.md`, `out/w86/bio04/shared-contract.md`, `out/w86/bio04/ui-audit.md`, and live `hud.js` WPN/lead/range/family, `controls.js` Digit 1–4 / TRACKED, `combat.js` groupWeapon / docked / reducedMotion, `station.js` Digit 5 desk, `hud.css` rails / in-range. Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` and designer persona. Review only. No `src/` edits. No brief edits.

**CLEAN** — freeze is implementable on the live WPN rail and empty-group-4 pattern. Later PR3 closes cannon fallback and eligibility on the same helpers; it does not invent chrome.
