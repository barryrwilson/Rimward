# BIO-04 psionic weapons shared contract

**Wave:** 86. Design only. No `src/`, live bindings, or catalog rows in this wave.  
**Status:** MERGE LAW for `docs/Bio04PsionicsDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/Bio01ObtainDesign.md`, `docs/Bio02EvolutionDesign.md`, `docs/Bio03*.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, NAV docs, or `out/w86/bio01/**` / `out/w86/bio02/**`.  
**Locked sources:** wishlist BIO-04 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1090–1093); live inventory `out/w86/bio04/current-bio04-inventory.md`; `docs/BioLivingShipsDesign.md` §6 (named hole only — **no triad in that file**); SHP-03 power-out; HUD-01 aim glass (`docs/HudUtilityChangeProposal.md`); `docs/OwnerDecisionsWave82.md` (do not invent UU / ammo prices / standing deltas).

Integrator rule: a **later** serial obeys this file. Inventory cites live code. Code wins over Wave 67 comments.

---

## 0. Law in one page

1. Wave 86 is markdown only. Implementation is a **later serial**. Do not schedule `src/` here.
2. Psionics fire only from **living** hulls (`player.hullKind === 'living'`) **or** Abominations (`graftedOwnTrue(player)` on a **built** hull). Built non-grafted **must not** fire.
3. Conventional guns **stay** on living hulls and Abominations (Digits 1–4 + auto turret). Do not strip cannon/disruptor/mining/dart/turret because the hull is living or grafted.
4. **One** new flight weapon group: **Digit 5** → `weaponGroup = 5` → `WEAPONS.psionic`. Do not steal Digit 0 (Shipyard), Digits 1–4 (live guns), Digit 8/9 (dock Launch/Standing; Outfitting launcher/turret papers).
5. Reuse **existing** `HEAT` pool + catalog `heatPerShot` + LMB `fireHeld` + Digit select. **No power ledger. No psi capacitor. No G/S/E / heat-power-psi triad.**
6. Psionic is a **projectile** family, **not** `beam: true`. Unknowables **miss** (live `applyHit` + `testNpcHits` skip). Do not add a mining-style Unknowable ray for this family.
7. First impl is **innate** on eligible hulls. **No** new hangar persist key. **No** SKU price. **No** ammo. Nested `loadout` stays forbidden.
8. Player-only. Beautiful / Unknowables **NPC** psionic fire is **out**. Do not reopen NPC missile law (`npcFire` stays `'cannon'|'missile'`).
9. HUD-01 aim glass stays **off** extras: no incoming gauge, no lock box, no new HUD tree. Existing WPN / RANGE / lead **may read** group 5. HUD **never writes** `hullKind`. WPN empty copy is `5 · —` (never the words “not available”).
10. `state.js` is READ-ONLY this wave. Later impl needs a **dedicated WEAPONS catalog PR** (same law as Wave 68 PR0). Do not invent UU, ammo prices, or standing deltas; owner-open numbers → `docs/OwnerDecisionsWave82.md` (or a successor line).
11. No `innerHTML`. Prototype-safe own-key `grafted`. `ctx.emit('playerFire', { weapon: 'psionic' })` **literal** only — never spread player/world.
12. Do not open BIO-01 obtain, BIO-02 evolution, BIO-03 bake, Unknowables dock, police leave, NAV, living-frigate buy. Do not “fix” WAVE4 / WAVE26 / WAVE35 boot FAILs.

---

## 1. Eligibility (combat reads; HUD reads; HUD never writes)

### 1.1 Who may fire

Export one helper in the **later** impl (prefer `hangar.js` next to `graftedOwnTrue`; combat + HUD import):

`canFirePsionic(ctx)` is true only when:

- `ctx.player` exists, and
- `ctx.player.hullKind === 'living'`, **or**
- own-key `grafted === true` on `ctx.player` (`graftedOwnTrue`).

False otherwise (missing player, `hullKind === 'built'` without own `grafted: true`, tampered `'grafted': 1` / proto, HUD family skin).

### 1.2 Must not

- Do **not** use `isBeautiful(player.faction)` or `hudFamily() === 'bio'` as the fire test. Starter is `independent` living. Grafted Abominations stay **`mech`**.
- Do **not** use Unknowables faction as the living test. Hangar already forces Unknowables → `hullKind: 'living'` and **deletes** `grafted` (`hangar.js` 86–108, 411–412). An Unknowables **player** living hull **may** fire; Unknowable **NPC fields** still ignore the shot (§3).
- HUD / sessionStorage / `rw-hud-family` **must not** grant fire.
- Do not persist `canPsi` / `psiEnabled`. Eligibility is derived every shot from hangar-healed fields.

### 1.3 Built non-grafted

Digit 5 may still **select** group 5 (same empty-group-4 pattern). Combat must **not** spawn, **not** add heat, **not** emit `playerFire`. HUD shows `5 · —`.

---

## 2. Digit conflict (resolved against live 1–4 + dock 0/8/9)

| Digit | Flight (later) | Dock root (live, keep) | Outfitting L2 (live, keep) |
|---|---|---|---|
| 0 | untracked | Shipyard | — |
| 1 | cannon | market | cargo |
| 2 | disruptor | jobs | scanner |
| 3 | mining | bar | Q-ship |
| 4 | missiles (`dart`) | feed | scanner 2 |
| **5** | **psionic (new)** | repair | mining Mk II |
| 6 | untracked | outfitting | mining Mk III |
| 7 | untracked | people | mining Mk IV |
| 8 | untracked | launch | launcher papers |
| 9 | untracked | epics / Standing | turret papers |

Rules:

- Later `controls.js` `TRACKED` adds **`Digit5` only**. Do not `preventDefault` Digit 5 (Space remains the only swallow).
- Docked combat stays cold (`combat.js` 1666–1669). Desk Digit 5 stays repair / mining-head / hangar remount.
- **Turret stays auto equipment**, not Digit 5, not Digit 6.
- Unknown `weaponGroup` (0, 6, 7, …) must **not** fall through to cannon. Return `null` like empty group 4. Live `GROUP_WEAPON[g] ?? 'cannon'` (`combat.js` 239) is a hole the impl **closes** for any `g !== 1..5`.
- Same close for `hudWeaponKey` (`hud.js` 202 `?? 'cannon'`).

---

## 3. Family (one group; reuse heat + Digit fire)

### 3.1 Catalog (later dedicated `state.js` PR)

| Field | Freeze |
|---|---|
| Key | `psionic` |
| `family` | `'psionic'` (not `energy`, `disruptor`, `mining`, `missile`) |
| `beam` | **omit / not true** |
| `turn` | **omit** (not a seeker) |
| Ammo | none |
| Damage / rof / speed / range / `heatPerShot` / hit multipliers / bolt hex | **Owner-open** → `docs/OwnerDecisionsWave82.md` successor. Do not invent UU, ammo prices, or standing. |

Qualitative (not numbers): dodgeable projectile; ROF + heat gated like cannon/disruptor; spawn from the same 64-bolt pool; reticle aim + existing frontal `CONVERGE_DOT` only; **no** hitscan; **no** mining beam reuse; **no** dart seeker reuse.

`FAMILY_COLORS.psionic` lands in the **same** catalog PR as materials. Until then, `projMats[w.family] ?? projMats.energy` would paint cyan — **forbidden to ship** a psionic bolt on energy tint. Catalog PR and combat materials PR are serial (catalog first).

`nextFireAt.psionic` on the live clock object (`combat.js` 862).

Missing catalog: if `!Object.hasOwn(WEAPONS, 'psionic')` or the row has no finite `rof`/`speed`/`range`/`heatPerShot`, treat group 5 as empty (`null`). Do not throw on `w.rof`. Do not spawn. Do not fall through to cannon.

### 3.2 Unknowables

Default **miss**. Do not set `beam: true`. Do not add Unknowable entries to the psionic hit test. Mining remains the only beam that couples to fields (`state.js` 169–171; `combat.js` 1316–1347, 1499–1500).

### 3.3 Conventional guns stay (SHP-03)

Living + grafted-built keep Digits 1–4 and the auto turret. Psionic is **additive**.

### 3.4 Resources

Allowed: `player.heat` / `HEAT` / `heatPerShot` / overheat lockout (live).  
Forbidden: power ledger, psi pool, capacitor persist, heat-per-fit ledger, G/S/E triad, FreeSpace energy triplet.

---

## 4. Persist / SKU / UU

First impl: **innate**. Sanitize hangar stays flat. Do **not** add `psionic`, `psiAmmo`, `psiCap`, or nested `loadout`.

If a later wave wants a bought SKU: **stop** and owner-open price + Digit into `docs/OwnerDecisionsWave82.md`. Do not steal Outfitting 8/9. Do not invent UU here.

`healPlayerHullKind` already deletes stray `player.launcher` / `turret` / `missileAmmo` (`hangar.js` 416–418). Do not grow unsanitized `player.psionic`.

---

## 5. NPC

`npcFire.weapon` stays `'cannon' | 'missile'`. `spawnNpcShot` must **refuse** `family === 'psionic'` (belt: even if a future event is stuffed). Beautiful NPC and Unknowable field **do not** fire psionics in the first impl.

Do not reopen Wave 82 NPC missile Q1/Q2/cadence.

---

## 6. HUD (read-only WPN)

- `hudWeaponKey`: group 5 → `'psionic'` if catalog exists, else `null`.
- `weaponHudLabel`: if group 5 and (`!canFirePsionic` or no catalog) → `5 · —`. Else `5 · ` + `WEAPONS.psionic.name`. `textContent` only.
- Lead: `WEAPONS.psionic.speed` when eligible and `speed > 0`; else hide (mining pattern).
- Range pop: `WEAPONS.psionic.range` when eligible; else 0.
- Strain row stays **heat %**. No second bar.
- No incoming psi gauge. No lock box. No aspect ring. No new rail. No HUD write of `hullKind` / `grafted`.
- Reduced-motion: follow live bolt law (simulate the shot; suppress spark/muzzle animation).

---

## 7. Events / XSS / proto

- Reuse frozen `playerFire { weapon }`. Token `'psionic'` when a bolt actually leaves the pool.
- Emit **literal** `{ weapon: 'psionic' }`. `ctx.emit` spreads `data` (`ctx.js` 248–249).
- No new frozen event.
- Names via `textContent`. No `innerHTML`. No `eval`.
- `graftedOwnTrue` stays own-key === true. Reserved ids unchanged.

---

## 8. Closed doors

BIO-01 gift/pirate seed. BIO-02 class evolution. BIO-03 look/bake. BIO-05 tissue overlay. Living-frigate **buy**. Unknowables dock. Police leave. NAV-01/02/03. HUD-02 reopen. POD-02. Power ledger. Mind lock / resolve write / standing from firing psi. Chaff. Digit 6/7 extra psi modes. `state.js` feature-PR writes. WAVE4 / WAVE26 / WAVE35 boot FAIL “fixes”.

---

## 9. Serial PR plan (later impl only)

| PR | Lands | Does not land |
|---|---|---|
| **PR0 catalog** | `WEAPONS.psionic` + `FAMILY_COLORS.psionic` + bolt materials. Owner numbers required. | Fire, Digit, HUD, persist |
| **PR1 combat** | `groupWeapon` 5; unknown group → null; `canFirePsionic`; projectile fire + heat; Unknowables miss; `spawnNpcShot` refuse | Digit bind, HUD, NPC fire |
| **PR2 controls** | `TRACKED` Digit5; `weaponGroup = 5`; help line `1–5`; `ctx.js` comment | Desk Digit remap |
| **PR3 HUD** | `hudWeaponKey` / label / lead / range read group 5; `5 · —` ineligible | New HUD tree, aim-glass gauge |
| **PR4 boot pins** | Eligible living + grafted fire; built non-grafted dry; Unknowables miss; Digit 0/8/9 untouched; no triad fields | Wishlist / PROGRESS.md |

`npm run test:boot` and Chrome vite+swiftshader verify are **later-impl**. Known WAVE4 / WAVE26 / WAVE35 FAILs stay.
