# UI Audit: remaining FX leftover after named FX slices (Wave 123 CONSUME)

**Auditor:** `[designer]` (independent of `out/w123/fxrest/ui-audit.md`)
**Scope:** Wave 123 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: remaining FX after named FX-01/02/03 first pass + recoil/marks + WAVE111 hull-local ripple + Wave 114 scrape punch + Wave 114 muzzle CONSUME is **gone**. Specified later FX: **none** (reuse live muzzle / hull-local ripple / scrape punch). Named serial: **none**. Name: **no remaining FX leftover.** This leftover adds **no** chrome.
**Review file:** `out/w123/designer/fxrest-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Fx02RemainingFxDesign.md`, inventory `out/w123/fxrest/current-fx-remaining-inventory.md`, merge law `out/w123/fxrest/shared-contract.md`, worker self-audit `out/w123/fxrest/ui-audit.md` (read, not copied). Cite-only: `docs/Fx01RemainingMuzzleDesign.md` (do not rewrite). Live muzzle / ripple / scrape / hub / Digit / incoming-fire cites only: `src/systems/combat.js`, `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/station.js`, `src/systems/ship.js`, `src/game/hull-marks.js`, `src/game/physics.js`. Did **not** steal `out/w123/phyrest/**` or `out/w123/astrest/**`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w123/fxrest/shared-contract.md` wins if the brief forks. This wave does not ship FX chrome. Findings bind **later workers**: do not steal HUD-01 hub, do not add a punch pip on `.rw-reticle`, do not reopen muzzle CONSUME as REAL, do not steal Digit 0/8/9, do not invent a second incoming-fire live region.

## UI Audit: remaining FX player-facing punch (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**. Specified later FX is the **existing** family-tinted muzzle pop, WAVE111 hull-local ripple, and scrape `spawnHitFx`. CONSUME does **not** invent HUD chrome. Freeze does **not** steal HUD-01 hub, Digit 0/8/9, or Incoming fire. toast. Muzzle leftover stays **CONSUME**. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; stale wishlist bullets / skippable flash map, not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- CONSUME: no new HUD instrument to sell “remaining FX.” Brief §7 and contract §0.2 / §3: later UI = **none**.
- Empty hub freeze is explicit: no punch pip, fire meter, or bolt counter on `.rw-reticle` (`hud.css` **184–193**; `hud.js` **781** RANGE stays TGT-01; `hud.css` **207–218** `in-range` show).
- Facing-rail flash stays on `.rw-combat-self` (`hud.js` **919**, **1183–1184**, **1231–1232**, **1474–1482**) — HUD-02 hair, not a hub child.
- Scrape HUD stays `'▲ Hull strike.'` on damaging `bodyHit` (`hud.js` **660–662`) — consume; not a new fire toast.
- Incoming fire. stays the existing toast path (`hud.js` **653**, **847** `aria-live="polite"`). Pack forbids a second live region.
- Digit 0/8/9 stay shipyard / launch / epics (`station.js` **188**, **6171–6176**). Remaining FX is not a dock verb.
- Live fire-side: family-tinted muzzle glow-dot; first-person steps off the nose and stays small (`combat.js` **1008–1029**) so the 80 px glass stays readable.
- Live shield language: WAVE111 parented ring rides the hull; first-person player host stays world-space (`combat.js` **1050–1106**, `host.add` **1086**).
- Live scrape punch: damaging ram calls the same `spawnHitFx` family (`combat.js` **1858–1860`). XOR still shielded-ripple vs sparks+mark (`1110–1116`).
- `reducedMotion` keeps live snap-one-frame (`combat.js` **1009–1021**, **1051–1062`); shake already zeros (`ship.js` **1207–1211`). No new `#hud` `@keyframes`. No new settings checkbox.
- Kit mutate omit. Aim-glass gauges stay off.
- Wave 114 muzzle leftover (`docs/Fx01RemainingMuzzleDesign.md`) stays **CONSUME**. This pack does **not** reopen it as REAL.
- Worker self-audit agrees independently. Do not copy that file as the designer record.

### CONSUME steal check (Blocker if this leftover scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| HUD-01 hub child / punch pip on `.rw-reticle` | Brief Honor + Goals 6; contract §0.2; brief §6–7 | `.rw-reticle` 80×80 (`hud.css` **184–193**). RANGE word only (`hud.js` **781**). Punch is world sprites | **Pass.** Not scheduled. |
| Reopen muzzle CONSUME as REAL / crank `spawnMuzzle` | Contract §0.8 / §0.21; brief Status + §5; Wave 114 cite | `spawnMuzzle` LIVE (`combat.js` **1008–1029**). Name **no remaining FX-01 muzzle leftover** | **Pass.** Stays CONSUME. |
| Digit 0/8/9 theft / new FX Digit | Contract §0.3; brief Digit freeze | Digit 0 → shipyard; 8 → launch; 9 → epics (`station.js` **188**, **6171–6176**) | **Pass.** |
| Second incoming-fire live region | Contract §0.15; brief §7 / §9 | One toast `aria-live="polite"` (`hud.js` **847**). `Incoming fire.` is TGT/HUD (`hud.js` **653**) | **Pass.** |
| Steal WAVE111 `spawnRipple` parent | Contract §0.8 | `host.add` (`combat.js` **1086**); FP stays world-space (**1066–1103**) | **Pass.** Cite only. |
| Steal scrape `spawnHitFx` | Contract §0.8 | Damaging ram (`combat.js` **1858–1860**) | **Pass.** Cite only. |
| Retune IMPACT 8 / 0.35 | Contract §0.12 | `physics.js` **11–12** | **Pass.** |
| Aim-glass gauge / kit mutate | Contract §0.2 / §0.5 | Not proposed | **Pass.** |
| `innerHTML` FX copy | Contract §0.4 | Combat `innerHTML`: **none**. Toasts use `textContent` path | **Pass.** |
| New persist key / sprite persist | Contract §0.6 | Scene FX. `aftermath` already wreck data | **Pass.** |
| Hitscan combat beam | Contract §0.13 | Charter `combat.js` **24–26** | **Pass.** |
| User shaders from save | Contract §0.4 | Engine-authored `glowTex` / ripple / scorch | **Pass.** |
| Extra fire toast (`'▲ Muzzle.'` / `'▲ FIRE.'`) | Contract §0.2 | Hull-strike stays scrape HUD | **Pass.** |
| PHY / AST leftover steal | Brief Honor | This pack did not write sibling dirs | **Pass.** |
| Pause sim for FX | Contract §0.17 | Busy pool skips pop; never freeze | **Pass.** |

If a later worker adds a hub punch pip, an FX Digit, a second incoming-fire live region, or reopens muzzle CONSUME as REAL while these surfaces exist, that **violates this freeze** and is a Blocker then. This pack does **not** schedule that work. Serial plan: **PR1 remaining FX does not exist** (`docs/Fx02RemainingFxDesign.md` **229–232**; contract §3).

### Does CONSUME invent HUD chrome?

**No.** Brief §7: this wave no chrome; later UI none. Specified picture is live:

| Spec (later = none) | Live |
|---|---|
| Muzzle punch | `spawnMuzzle` glow-dot, FP small (`combat.js` **1008–1029**); map `glowTex` (**609–624**) |
| Shield ripple | WAVE111 `host.add` + FP world-space (`combat.js` **1050–1106**) |
| Scrape punch | `spawnHitFx(pos, 'impact', shielded, host)` (`combat.js` **1858–1860`) |
| Recoil / marks | flesh kick (`ship.js` **1237–1263**); pool 12 (`hull-marks.js` **7**) |
| Hub | 80 px empty (`hud.css` **184–193`). RANGE TGT-01 (`hud.js` **781`) |
| Digit | none for FX (`station.js` **188**, **6171–6176**) |
| Incoming fire. | Existing toast live region only (`hud.js` **653**, **847**) |

CONSUME adds **no** UI. Live muzzle, hull-local ripple, and scrape already cover the specified later picture. Wishlist FX-01 bullets stay **stale vs code**. Flash map and PHY-04 80 u stay **skippable**.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| `spawnMuzzle` | Pooled glow-dot; FP step 2.4; reduced snap | Wave 114 CONSUME | **Must not** crank or reopen REAL |
| WAVE111 parent | `host.add`; FP world-space | Wave 111 | **Must not** rewrite parent |
| Scrape `spawnHitFx` | Damaging ram **1858–1860** | Wave 114 | **Must not** steal |
| Recoil / mark pool 12 | Flesh kick; `HULL_MARK_POOL` | Wave 59 | **Must not** retune as leftover |
| IMPACT 8 / 0.35 | `physics.js` **11–12** | Wave 112 | **Must not** retune |
| Empty hub | 80 px | HUD-01 | **Must not** add a punch pip |
| RANGE | TGT-01 word | TGT | **Must not** add FX gauges |
| Facing flash | `.rw-combat-self` 0.4 s | HUD-02 hair | **Must not** move onto hub |
| Hull-strike toast | `'▲ Hull strike.'` | Scrape HUD | **Must not** add fire toasts |
| Incoming fire. | One `aria-live` toast region | TGT/HUD sibling | **Must not** add a second live region |
| Digit 0/8/9 | shipyard / launch / epics | Honor | **Must not** bind FX |
| Flash map | Untextured `spawnFlash` | Skippable | **Must not** require as leftover PR1 |
| `innerHTML` | Combat none | XSS freeze | **Must not** `innerHTML` FX copy |

### Accessibility / theming / states (live HUD + world FX, static)

| Check | Result |
|---|---|
| Contrast / tokens | RANGE uses `var(--cyan)` (`hud.css` **215**). Hull-strike / Incoming fire. reuse existing toast classes (`warn`). No new leftover color. World FX uses engine `FAMILY_COLORS` on sprites, not HUD chrome. |
| Keyboard | FX is output, not a control. Digit 0/8/9 stay dock. Do not bind FX to those keys. |
| Names | Visible English: RANGE, `'▲ Hull strike.'`, `'Incoming fire.'`. Color is not the only HUD cue. World punch is motion + audio (`playerFire` / `bodyHit`), not a pip. |
| Focus | Hub, RANGE, and toasts are not leftover focus targets. Correct. Do not autofocus-trap the sim. |
| Semantic HTML | Reticle is a `div` with RANGE child (`hud.js` **778–781**). Toasts already `role="status"` + `aria-live="polite"` (`hud.js` **846–847`). Do not add a second live region. |
| Empty | RANGE hidden until `in-range` (`hud.css` **207–218**). Busy muzzle/ripple pool skips pop (`combat.js` **1011–1028**, **1052–1105**). |
| Error | Fail-closed: scrape FX in `try/catch` (`1858–1860`). WAVE111 parent catch → scene copy (**1092–1102**). Never freeze the sim. |
| Disabled | N/A (output). |
| Loading | No spinner. Do not add one. |
| Hover | Hub `pointer-events: none` (`hud.css` **191**). Correct. |
| Reduced motion | Snap-one-frame muzzle/ripple; shake/recoil zero (`combat.js` **1009–1021**, **1051–1062**; `ship.js` **1207–1211`). Do not invent a new checkbox. |
| Responsive | Punch is world-space. Hub stays 80 px, off the combat rails. FP muzzle stays small so the glass stays readable. |
| Hub | 80 px stays empty of FX leftover chrome. |

### Specified later FX vs live muzzle / ripple / scrape

Punch is **world sprites + flesh recoil + song + existing hull-strike toast**. Not a HUD label.

| Specified later | Live today | This leftover |
|---|---|---|
| Muzzle punch | `spawnMuzzle` glow-dot, FP small | **consume**; Wave 114 CONSUME; do not crank |
| Shield ripple | WAVE111 `host.add` | **consume**; do not steal parent |
| Scrape punch | `spawnHitFx` **1858–1860** | **consume**; do not steal |
| Recoil / marks | flesh kick; pool 12 | **consume** |
| Hub / Digit | 80 px empty; Digit 0 shipyard | **do not add** |
| Incoming fire. | Existing toast live region | **do not add a second** |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Wishlist still lists muzzle / ripples / sparks as FX-01 bullets

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1405–1414** (cite only; this pack must not edit it)

**Issue:** A later reader of the wishlist can think remaining FX is still open and add a hub pip “so the player sees punch.”

**Why it is not leftover:** Code already ships muzzle, ripple, scrape, recoil, marks. Contract CONSUME + “no punch pip” is merge law. Editing the wishlist is another worker.

**Fix:** Do not invent leftover chrome. Do not reopen muzzle CONSUME as REAL.

**Status:** accepted — CONSUME named; not a missing chrome hole.

#### 🟡 Minor: Hit `spawnFlash` is still an untextured square next to mapped muzzle dots

**Location:** `src/systems/combat.js:990-1001` vs muzzle `map: glowTex` **609–614**

**Issue:** Hit squares can still look cheap. That is **FX-01 flash map**, skippable, not remaining leftover.

**Why it is not leftover:** Contract §0.11. Mapping `glowTex` onto hit flash as required PR1 would invent skippable work. Specified later UI must not put that map on the hub.

**Fix:** Do not require flash map as leftover PR1.

**Status:** accepted — skippable omit; CONSUME stands.

#### 💡 Suggestion: Digit 8/9 honor cite is the generic Digit handler

**Location:** inventory `out/w123/fxrest/current-fx-remaining-inventory.md` §9 (`station.js` **188**, **6035–6036**); live `station.js` **188**, **6171–6176**

**Issue:** Digit 0 is explicit (`d === 0` → last service = shipyard). Digit 8/9 are `i = d - 1` into `DOCK_KEY_SERVICES` (`launch` / `epics`). Inventory table compresses 0/8/9 onto **188** / **6035–6036** (menu labels). Brief table uses **188**.

**Fix:** Do not treat cite shorthand as Digit theft. Honor still holds. Do not bind FX.

**Status:** documentation nit — not leftover chrome.

#### 💡 Suggestion: Hull-strike toast is scrape HUD, not remaining FX chrome

**Location:** `src/systems/hud.js:660-662`

**Issue:** A later worker could add `'▲ FX leftover.'` or a fire combo chip “because toast exists.”

**Fix:** Consume hull-strike. Do not add fire toasts. Incoming fire. stays sibling. Do not add a second `aria-live` region.

**Status:** accepted — out of scope.

### Census cite check (code wins)

| Claim | Live | Notes |
|---|---|---|
| `spawnMuzzle` | `combat.js` **1008–1029** | Match. FP `base` 1.15 / `grow` 1.5; step 2.4. |
| Muzzle pool / map | **185**, **609–624** | Match. `MUZZLE_POOL` 16; `map: glowTex`. |
| WAVE111 parent | `combat.js` **1050–1106**, `host.add` **1086** | Match. FP skip parent **1066–1067**. |
| XOR spawnHitFx | **1110–1116** | Match. Shielded ripple else sparks+mark. |
| Scrape punch | **1858–1860** | Match. `try { spawnHitFx(...) }` |
| IMPACT knobs | `physics.js` **11–12** | Match. 0.35 / 8. |
| Mark pool 12 | `hull-marks.js` **7** | Match. |
| Recoil flesh | `ship.js` **1237–1263** | Match. Cannon/disruptor. |
| Shake caps | `ship.js` **129–130**, **1264** | Match. 0.35 / 0.12. |
| Empty hub 80 px | `hud.css` **184–193** | Match. |
| RANGE | `hud.js` **781**; `hud.css` **207–218** | Match. |
| Facing flash | `hud.js` **919**, **1231–1232**, **1474–1482** | Match. 0.4 s on `.rw-combat-self`. |
| Hull-strike toast | `hud.js` **660–662** | Match. |
| Incoming fire. toast | `hud.js` **653**, **847** | Match. One polite live region. |
| Digit 0 shipyard | `station.js` **188**, **6171–6173** | Match. |
| Digit 8/9 launch/epics | `station.js` **188**, **6175–6176** | Index 7/8 via `d - 1`. Honor holds. |
| Combat `innerHTML` | none | Match. |
| Muzzle leftover status | `docs/Fx01RemainingMuzzleDesign.md` Status **CONSUME** | Cite only. Not reopened as REAL. |

None of the cites reopen leftover. Inventory line numbers hold on this census date.

### Visual hierarchy

Hub empty → RANGE on lock → facing-rail flash on `.rw-combat-self` → hull-strike / Incoming fire. on the existing toast path → world muzzle / ripple / scrape. CONSUME keeps that split. A punch pip, FX Digit, muzzle REAL crank, or second incoming-fire live region would flatten hierarchy onto HUD-01 / dock keys / TGT toast.

### Worker self-audit

`out/w123/fxrest/ui-audit.md` is accurate on CONSUME, later UI = live muzzle / ripple / scrape, Digit/hub not stolen, muzzle leftover stays CONSUME, and “do not add a second incoming-fire live region.” Independent live read agrees. Do not copy that file as the designer record; this file is the parent `[designer]` pass.

### Verdict close

**CONSUME freeze is the UI-correct outcome.** Remaining FX leftover is gone. Live muzzle, hull-local ripple, and scrape punch already paint fire-side and hit-side punch. Do not add HUD chrome, a punch pip on `.rw-reticle`, Digit 0/8/9 theft, a second incoming-fire live region, or reopen muzzle CONSUME as REAL.
