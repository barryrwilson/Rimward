# RIMWARD BIO-04 psionic weapons

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-04 psionic weapons |
| **Author** | Wave 86 BIO-04 integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 92 impl. Missing `hullKind` counts as living (ship.js mesh). Merge law still wins over this brief. |
| **Wave** | 86 design; Wave 92 serial PR0–PR4. |
| **Owner request** | Living and psionic weapon families remain to be designed. Psionic weapons are restricted to living ships and Abominations (`grafted: true` built hulls count as Abominations). Conventional guns stay on living hulls (SHP-03). Do not ship `src/` or live bindings. |
| **Merge law** | [`out/w86/bio04/shared-contract.md`](../out/w86/bio04/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Sibling** | [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §6 (named hole; **do not** put a triad there). [`docs/Shp03WeaponsDesign.md`](Shp03WeaponsDesign.md) (read; do not edit). |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w86/bio04/current-bio04-inventory.md`](../out/w86/bio04/current-bio04-inventory.md) |
| Merge law | [`out/w86/bio04/shared-contract.md`](../out/w86/bio04/shared-contract.md) |
| Security review | [`out/w86/bio04/security-review.md`](../out/w86/bio04/security-review.md) |
| Design-doc review | [`out/w86/bio04/code-review.md`](../out/w86/bio04/code-review.md) |
| UI audit | [`out/w86/bio04/ui-audit.md`](../out/w86/bio04/ui-audit.md) |

---

## Overview

Live combat has four fire Digits and one auto turret: 1 cannon, 2 disruptor, 3 mining, 4 missiles (`dart`). Turret is seated equipment, not a fifth fire Digit. Wave 67 text that says “three groups / no Digit4” is stale. There is no psionic family. Heat is the only fire resource (`HEAT.max` 100). There is no power ledger and no psi capacitor.

Wishlist BIO-04 wants a psionic family that only living ships and Abominations may use. Conventional guns must remain on those hulls.

This brief is the integrator document for a **later** implementation wave. It freezes eligibility (`living` or `grafted: true` built), Digit 5 as the new group, a projectile `WEAPONS.psionic` row that reuses heat + LMB, Unknowables **miss**, HUD WPN/RANGE/lead **read** only, and a serial PR plan. Wave 86 lands this markdown only. Bindings do not change here.

`docs/BioLivingShipsDesign.md` §6 named the hole and forbade a three-resource triad **in that old brief**. This brief may design the family. It still **fails closed**: it does not invent a heat/power/psi triad. Live code has heat only.

HUD-01 aim glass stays off extras. `state.js` stays READ-ONLY this wave. Later impl needs a dedicated WEAPONS catalog PR.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “weapons today”: [`out/w86/bio04/current-bio04-inventory.md`](../out/w86/bio04/current-bio04-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| `WEAPONS` | `cannon`, `disruptor`, `mining`, `missile`, `turret` | `state.js` 97–119 |
| Groups | 1 / 2 / 3 / 4. Digit1–4. Turret auto | `combat.js` 182–184, 232–240, 1771–1774 |
| Digit 0 / 8 / 9 | Dock: Shipyard / Launch / Standing (epics). Outfitting 8/9 launcher/turret papers | `station.js` 174, 1555–1556, 5710–5717, 5760–5770 |
| Fire | Hold LMB. ROF + heat. Reticle aim. Optional frontal lead converge | `combat.js` 1088–1126, 1754–1768 |
| Heat | One pool `HEAT.max` 100 | `state.js` 120 |
| Power / psi | **No fields** on `SHIP_CLASSES` or `createShipState` | `state.js` 35–42, 140–161 |
| Unknowables | Ignore non-beam. Projectiles skip fields. Mining beam is the only coupler | `state.js` 169–171; `combat.js` 1499–1500, 1316–1347 |
| Hangar | Flat row. `hullKind` living\|built. `grafted: true` built only | `hangar.js` 82–108, 222–240, 731–764 |
| HUD | WPN / RANGE / lead for 1–4. HUD never writes `hullKind` | `hud.js` 71–81, 192–221, 1224–1298 |
| Events | `playerFire { weapon }` on real spawn | `ctx.js` 37, 232 |
| `innerHTML` | none in hud/combat/controls/station | grep 0 |

### Pain points

- Wishlist BIO-04: no psionic family. Living hulls already shoot conventional guns (SHP-03). The hole is a **restricted extra group**, not a replacement.
- A naive “add Digit 5” without a desk map would collide with dock **repair** and Outfitting mining Mk II. Combat is cold while docked, so flight Digit 5 is free **if** dock handlers stay.
- Live `GROUP_WEAPON[g] ?? 'cannon'` (`combat.js` 239) already lets a stuffed `weaponGroup` 5 fire cannon. A psionic group that forgets the map would still shoot cannon on ineligible hulls.
- `applyHit` would accept `beam: true` against Unknowables, but `testNpcHits` still skips fields. A second beam would fork mining. Fail-closed: miss.
- Inventing a psi capacitor would sneak in the power ledger SHP-03 left out.
- HUD-01 forbids an incoming gauge and a lock box on the aim glass. A “mind lock” pip would reopen TGT.

### Why now (design) / why not now (code)

The owner asked for the BIO-04 integrator after BIO-03 look freeze and SHP-03 guns. Inventory and merge law exist. Implementation waits so Digit conflict, Unknowables miss, and no-triad land against a frozen contract instead of a drive-by `WEAPONS` row in a feature PR. `state.js` 7–9 still forbids parallel catalog writes.

---

## Goals & Non-Goals

### Goals

1. Document live WEAPONS, groups, Digit map, Unknowables beam rule, hangar `hullKind`/`grafted`, HUD WPN, and `playerFire` from **live code**.
2. Freeze eligibility: living + grafted-built only. Built non-grafted dry-fire.
3. Freeze **one** new group Digit **5** that reuses heat + LMB. Conventional 1–4 + turret stay.
4. Freeze family = projectile `psionic`, not beam, not seeker, not mining reuse.
5. Freeze Unknowables **miss**.
6. Freeze no power/psi triad. Owner-open catalog numbers. No invented UU / ammo prices / standing.
7. Freeze HUD read-only WPN/RANGE/lead. Aim glass stays empty of new chrome. Copy `5 · —` (never “not available”).
8. Freeze player-only first impl. NPC missile law closed.
9. Freeze a later serial PR plan. This wave writes the brief only.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 86.
- No three-resource triad. No power ledger. No psi capacitor.
- No Digit 0 / 1–4 / 8 / 9 steal. No turret-as-Digit-5. No Digit 6/7 psi modes.
- No hangar persist key in the first impl (innate). No nested `loadout`.
- No HUD-01 incoming gauge, lock box, or new HUD tree. No HUD write of `hullKind`.
- No NPC Beautiful / Unknowables psionic fire. No NPC missile reopen.
- No BIO-01 obtain, BIO-02 evolution, BIO-03 bake, Unknowables dock, police leave, NAV, living-frigate buy.
- No mind lock, resolve write, or standing delta from firing psi.
- Do not edit the wishlist, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, or SHP-03.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Who fires? | Living `hullKind` **or** own `grafted: true` built | Wishlist; hangar graft law |
| Built non-grafted? | Select group 5, HUD `5 · —`, no shot, no heat | Empty group 4 pattern |
| Beautiful faction test? | **No** | Starter `independent`; `organic.js` is not `hullKind` |
| HUD family `bio` test? | **No.** Grafted is `mech` and **may** fire | `hud.js` 77; contract §1.2 |
| Conventional guns on living? | **Stay** (1–4 + turret) | SHP-03; wishlist BIO-04 is additive |
| New Digit? | **5** in flight | 1–4 live guns; 0/8/9 dock papers |
| Turret Digit? | **No.** Auto equipment | `combat.js` 1771–1774 |
| Unknown group fallback? | **null**, not cannon | Live `?? 'cannon'` hole |
| Beam / Unknowables? | **Miss.** `beam` not true. No second mining ray | `state.js` 169–171; inventory §2 |
| Resources? | Existing `HEAT` + `heatPerShot` only | No power field today |
| Persist SKU? | **None** first impl (innate) | Do not invent UU |
| NPC fire? | **Out** | Player-only; do not reopen darts |
| Aim glass extras? | **Off** | HUD-01 |
| WPN empty copy? | `5 · —` | Never “not available” |
| `state.js` this wave? | READ-ONLY | Header 7–9 |
| Catalog numbers? | Owner-open | `OwnerDecisionsWave82.md` |
| `innerHTML`? | **No** | `textContent` |
| New event? | **No.** Reuse `playerFire { weapon: 'psionic' }` literal | `ctx.js` 248–249 spread |
| Mind lock / TGT write? | **No** | TGT-05 closed |

### 2. Player outcome (later serial)

Fly a living hull (or a grafted built Abomination). Press **5**. WPN reads `5 ·` plus the catalog name. Hold LMB: a heat-limited psionic bolt leaves the nose, same aim glass as the cannon. Press **1–4**: conventional guns still work. Switch to a plated non-grafted hull: Digit 5 still selects, WPN reads `5 · —`, LMB does not shoot. Unknowable fields do not take the bolt. Beautiful traffic does not shoot it back.

### 3. Eligibility

Later helper `canFirePsionic(ctx)` (own `graftedOwnTrue` + `hullKind === 'living'`). Combat gates spawn. HUD gates label/lead/range. HUD does not write kind.

Unknowables **player** is forced living (`hangar.js` 411–412; `ship.js` 518) and may fire. Unknowables **NPC** fields ignore the bolt (§5).

Tamper: `'grafted': true` on a living row is stripped today (`hangar.js` 96). A stuffed `player.psionic = true` must be ignored (no such field). `sessionStorage['rw-hud-family']` must not grant fire.

### 4. Digit 5 and fire path

Later `controls.js`: `Digit5` → `input.weaponGroup = 5`. Help line lists 1–5. `PREVENT_DEFAULT` stays Space-only.

Later `groupWeapon`: `g === 5` → `'psionic'` (catalog present). `g === 4` unchanged. `g` in `{1,2,3}` unchanged. Else `null`.

Later player update (`combat.js` 1754–1768 pattern):

1. Docked / dead / overheated → no fire (live).
2. `wkey === 'mining'` → beam (live).
3. missile family → dart (live).
4. `wkey === 'psionic'`: if `!canFirePsionic` or catalog row missing/non-finite, return (no heat, no throw). Else ROF + `firePlayerGun` on the 64-pool + `addHeat` + `playerFire { weapon: 'psionic' }`.
5. Else existing guns.

Do not route psionic through `tryPlayerMissile` or `updateMining`.

### 5. Unknowables

Fail-closed **miss**. Catalog omits `beam: true`. Hit test does not special-case fields. Mining remains the only live coupler.

### 6. HUD readout

Existing WPN rail (`hud.js` 810–812) reads group 5. Lead and `.in-range` use catalog speed/range when eligible. Strain stays heat %. No capacitor. No lock box. No incoming psi. Reduced-motion follows live bolts (shot simulates; spark/muzzle animation off).

### 7. Catalog numbers (owner-open)

Do **not** invent UU, ammo prices, or standing deltas. Do not ship PR0 until an owner line records `WEAPONS.psionic` damage, rof, speed, range, `heatPerShot`, any hit multipliers, and `FAMILY_COLORS.psionic` hex. Point: [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md) (successor BIO-04 line).

Qualitative caps the impl may not violate without owner: not a seeker, not hitscan, not a second beam, heat-limited on the live pool, dodgeable projectile, family tint not equal to energy/disruptor/mining/missile.

### 8. Persist

None for first impl. Hangar rows stay flat. A future SKU is a new owner decision, not this freeze.

### 9. Serial PR plan (later impl only)

Matches contract §9.

| PR | Lands | Does not land |
|---|---|---|
| **PR0 catalog** | `WEAPONS.psionic` + family color + materials. Owner numbers required | Fire, Digit, HUD |
| **PR1 combat** | Group 5, eligibility, projectile, Unknowables miss, NPC refuse | Digit bind, HUD |
| **PR2 controls** | Digit5 + help + `ctx` comment | Desk remap |
| **PR3 HUD** | WPN / lead / range read group 5 | New tree, aim-glass gauge |
| **PR4 boot pins** | Living + grafted fire; built dry; Digit 0/8/9; no triad fields | Wishlist / PROGRESS.md |

---

## Detailed Design

### Fire eligibility matrix

| Mounted hull | `hullKind` | `graftedOwnTrue` | Digit 5 WPN | LMB psionic |
|---|---|---|---|---|
| Starter living | `living` | false (stripped) | catalog name | fire |
| Beautiful yard living | `living` | false | catalog name | fire |
| Unknowables player | `living` (forced) | false | catalog name | fire (NPC fields still miss) |
| Built clean | `built` | false | `5 · —` | no |
| Built Abomination | `built` | true | catalog name | fire |
| Missing player | — | — | `5 · —` | no |

HUD family on the Abomination row stays **mech**. Fire still allowed.

### `playerFire` / NPC

Reuse the frozen event. Literal payload. NPC `npcFire` does not gain a third weapon token in this serial.

### Security fences (impl)

- Own-key grafted only.
- No persist flag to smuggle.
- No `innerHTML`.
- No emit spread of player/world.
- Unknown `weaponGroup` must not cannon-fallback.

---

## Regression risks

- Digit 5 in `TRACKED` while docked also sets `weaponGroup` (harmless: weapons cold). Must not `preventDefault` or steal repair.
- Forgetting to close `?? 'cannon'` lets ineligible group 5 shoot cannon.
- `firePlayerGun` on a missing `WEAPONS.psionic` throws on `w.rof` or paints cyan via energy fallback. Catalog PR first; combat must still null-guard.
- `beam: true` plus a copied mining ray would damage Unknowable fields against fail-closed miss.
- A psi bar on the aim glass would reopen HUD-01.
- Feature-PR `state.js` writes would race Wave 68 catalog ownership.
- NPC `spawnNpcShot` with a stuffed `weapon: 'psionic'` would fire if not refused.

---

## Verification (later impl)

- Living starter Digit 5 fires; heat rises; `playerFire` token `psionic`.
- Built non-grafted Digit 5 shows `5 · —` and does not spawn / heat.
- Grafted built Digit 5 fires; HUD family remains mech; HUD did not write `hullKind`.
- Digits 1–4 + turret unchanged on living.
- Unknowable NPC: bolt passes; `applyHit` returns [].
- Dock Digit 0/8/9 still Shipyard / launcher papers / turret papers.
- No `power` / `psi` on `createShipState`. No new hangar key.
- `innerHTML` still 0. Reduced-motion: bolt simulates, sparks off.

Known boot FAILs stay: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.

---

## Open questions (owner)

Catalog numbers listed in §7. Everything else in this brief is freeze, not a question. Do not invent UU, ammo prices, or standing deltas while waiting.
