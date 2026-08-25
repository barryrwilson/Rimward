# UI Audit: FX-01 remaining hull-local shield ripple (Wave 110 designer)

**Reviewed:** `docs/Fx01RemainingDesign.md` vs merge law `out/w110/fx01/shared-contract.md`, worker `out/w110/fx01/ui-audit.md`, live HUD-01 hub, `reducedMotion` shake, first-person glass.  
**Wave:** 110 markdown-only spec. No product chrome ships. Later serial parents `RIPPLE_POOL`.  
**Guide:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`  
**Stance:** spec vs live HUD. Review only. Did not edit `src/`.

### Summary

The brief does **not** add a punch pip on `.rw-reticle`, does **not** ignore `reducedMotion`, and does **not** parent a full-size ripple on first-person player glass. Those three flag paths stay **frozen forbidden**. Picture is a world ring that rides the struck hull. Hub, RANGE, Digit, and facing-rail flash stay as live HUD-01 / HUD-02. Open issues are wording forks for first-person **fallback** (world-space at the nose can still sit on glass) and “small snap” vs the live one-frame `snap` path. No 🔴 Blocker. No open 🟠 Major on the three flag rules.

### What's done well

- Honor line and goals freeze HUD-01 empty aim glass: no punch pip, combo meter, impact meter, or hit-count (`docs/Fx01RemainingDesign.md:13`, `:98`, `:109`, `:236`; contract §0.2 `out/w110/fx01/shared-contract.md:25`).
- Live hub is an 80 px pointer-events-none ring plus RANGE only (`src/ui/hud.css:184–193`, `:207–220`; `src/systems/hud.js:709–712`). Spec does not add a child.
- Facing-rail hit language stays on `.rw-combat-self` (`hud.js:846`, `:1109–1151`, `:1391–1399`; `hud.css:897–899`). Spec consumes HUD-02 hair and does not move it onto the hub (`Fx01RemainingDesign.md:214–218`, `:236`; contract §0.2).
- `reducedMotion` keeps the live one-frame ripple snap and zeros extra pulse (`Fx01RemainingDesign.md:42`, `:198`, `:246`; contract §0.19). Shake already zeros (`src/systems/ship.js:1207–1211`).
- First-person player host: no full-size parent (`Fx01RemainingDesign.md:137`, `:194`, `:246`, `:310`; contract §0.1 formula and §2). Muzzle already shrinks and steps off the nose (`combat.js:998–1021`).
- Fail-closed missing pose keeps today’s world-space ring. Combat does not halt. No freeze-until-pool-free. Correct empty/error analog for world FX.
- No new control, Digit, toast, persist key, or HUD `@keyframes`. Both HUD families keep the same glance set.
- Recoil and mark pool stay consume. This leftover does not sell punch with a second camera kick or a hub widget.

### Findings

No 🔴 Blocker (open).  
No 🟠 Major (open) for punch pip, ignored `reducedMotion`, or full-size first-person parent.

#### 🟠 Major (frozen): Punch pip on `.rw-reticle`

**Location:** `docs/Fx01RemainingDesign.md:13`, `:74`, `:109`, `:236`; `out/w110/fx01/shared-contract.md:25`; live hub `src/ui/hud.css:184–193`; RANGE `src/systems/hud.js:709–712`

**Issue:** A later serial that injects a punch / combo / impact child into the 80 px aim glass would smash HUD-01. Live hub children today are pupil, three cilia, and RANGE. RANGE is TGT-01 in-range only (`hud.css:218–220`).

**Fix:** Keep the freeze. PR1 must not append nodes under `.rw-reticle` or restyle `::before` / `::after` / `.rw-reticle-range` as a hit pip.

**Status:** frozen. Spec does **not** add this. Flag would fire if a later serial lands it.

#### 🟠 Major (frozen): Full-size ripple parented to first-person player glass

**Location:** muzzle glass law `src/systems/combat.js:998–1021`; ripple grow `combat.js:1962–1964` (`2.2 + 7.2*k`); camera on nose `src/systems/ship.js:84` (`FIRST_PERSON_NOSE` z=−2.8); spec `Fx01RemainingDesign.md:137`, `:194`, `:246`; contract formula `shared-contract.md:92–99` and §2 `:156`

**Issue:** Parenting the live expanding ring to the living hull in first person would sit an additive billboard on the aim glass (wishlist: do not obscure aim with particles).

**Fix:** Spec already fail-closes first-person **player** host to scene/world-space (or an FP-small band). Chase/third player host and NPC hosts still parent when pose is finite.

**Status:** frozen. Spec does **not** parent full-size on first-person player glass.

#### 🟠 Major (frozen): `reducedMotion` extra pulse

**Location:** spec `Fx01RemainingDesign.md:42`, `:77`, `:198`, `:246`, `:272`; contract §0.19 `shared-contract.md:42`; live ripple snap `combat.js:1027–1038`, `:1921`, `:1944–1954`; sparks gated `combat.js:956`; shake/recoil zero `src/systems/ship.js:1207–1211`; HUD CSS kill `src/ui/hud.css:1183–1189`; facing flash static outline `hud.css:305–308`

**Issue:** Extra scale/opacity pulse or new `#hud` hit `@keyframes` under `body.rw-reduced-motion` would smash the live a11y bar.

**Fix:** Keep live `snap` / `seen` one frame then hide. Do not add HUD CSS animation for hits. Shake stays zero. Sparks stay gated.

**Status:** frozen. Spec does **not** ignore `reducedMotion`.

#### 🟡 Minor: First-person player-hit fallback can still sit on the nose

**Location:** contract formula `shared-contract.md:92–94` (`fpPlayer` → `sprite.position.copy(worldPos)`); live `spawnRipple` `combat.js:1039`; player hit `combat.js` inventory cite 1703–1718; muzzle offset `combat.js:1012–1020`; camera `ship.js:84`

**Issue:** Forbidding **parent** of a full-size ring is not the same as keeping glass clear. A player-shielded hit in first person still occurs on the hull near `FIRST_PERSON_NOSE`. World-space copy at that `pos` is the live path today and can still fill the 80 px glass. Spec table allows “world-space **or** FP-small” (`Fx01RemainingDesign.md:137`; contract `:73`, `:156`) but the normative snippet always copies world pos for `fpPlayer`. “FP-small” without the muzzle step-along-shot (`addScaledVector(_dir, 2.4)` plus `base` 1.15) is still a nose sprite.

**Fix:** Later PR1 pick **one** FP player-host path: (a) skip the ring when `host === playerObj && firstPerson`, or (b) scene-parent + muzzle-style small scale **and** push off the nose. Do not treat `position.copy(pos)` as sufficient glass law. Do not parent. Shake cap `SHAKE_FIRST_MAX = 0.12` (`ship.js:130`, `:1264`) already limits camera motion; do not compensate with a bigger ring.

**Status:** open wording fork. Residual live world-space, not a new hub widget.

#### 🟡 Minor: “Small snap” collides with `reducedMotion` snap

**Location:** player outcome `docs/Fx01RemainingDesign.md:246` (“world-space or a small snap”); reducedMotion line same paragraph; live `f.snap` `combat.js:1033`, `:1947–1954`

**Issue:** Implementers can read “small snap” as “always use the one-frame `snap` path in first person,” which would mute punch for every FP player even when `reducedMotion` is off. Live `snap` means reduced-motion: one static frame at scale 5.5 then hide (`combat.js:1037–1038`). That is not an FP scale band.

**Fix:** Say “world-space or FP-small **scale** (muzzle band). `reducedMotion` still uses live `snap`.” Keep those two words apart.

**Status:** open (copy). Contract snippet already prefers world-space for `fpPlayer`.

#### 🟡 Minor: Untextured hit flash can clash with a riding ring

**Location:** `spawnFlash` `combat.js:984–996` (no `map`); grow `combat.js:1916–1918`; optional PR2 `Fx01RemainingDesign.md:227`, `:294`

**Issue:** A hard square plus a parented ring can read cheap. Out of PR1. Not a HUD chrome issue.

**Fix:** Optional PR2 `glowTex` after playtest. Do not put a flash pip on `.rw-reticle` to cover the cheap square.

**Status:** documented. Skip this leftover.

#### 💡 Suggestion: HUD CSS `reducedMotion` does not cover world sprites

**Location:** `src/ui/hud.css:1183–1189` (`animation/transition: none` on `#hud *` only); world tick `combat.js:1921–1965`; `ship.js:1207–1211`

**Issue:** Ripple sprites live on the Three scene, not under `#hud`. CSS reduced-motion is not a safety net for PR1 parent/scale animation.

**Fix:** Later serial must keep the JS `snap` flag on `spawnRipple` after reparent. Do not add hit `@keyframes` on `#hud` “to honor reduced motion.”

**Status:** reminder for PR1.

#### 💡 Suggestion: Do not reuse RANGE, iris, or facing flash as punch chrome

**Location:** RANGE `hud.js:712`, `hud.css:207–220`; iris `hud.css:320–327`; mech range pulse `hud.css:1232–1243`; bio pupil `hud.css:1616–1621`; facing flash `hud.js:1149–1151`, `hud.css:293–308`

**Issue:** Painting hit-count on RANGE, pulsing `.rw-reticle::after` on shield hit, or moving `selfHitFlashUntil` onto the hub would smash TGT-01 / HUD-01 / HUD-02.

**Fix:** Contract already forbids (`shared-contract.md:25`, `:117`). PR1 grep `.rw-reticle` and RANGE.

**Status:** frozen in contract.

### Accessibility / theming / layout / states

| Check | Spec vs live |
|---|---|
| Contrast | No new HUD paint. Ripple stays engine `makeRippleRing` + `FAMILY_COLORS` (`combat.js:397–414`, `:1035`). Palette tokens on `#hud` (`hud.css:9–27`) unused by this leftover. |
| Focus / keyboard / semantics | No new control. `.rw-reticle` is `pointer-events: none` (`hud.css:191`). |
| Theming | No new CSS variable. Do not hardcode a hub pip color. |
| Responsive | No overlay. 80 px hub is center-absolute (`hud.css:184–190`). Full-size FP parent would ignore that size and fill the canvas — forbidden. |
| Loading / empty / error / disabled | N/A panel. Fail closed = keep firing (`Fx01RemainingDesign.md:190–200`; contract §2). Busy pool skips a ring; never `speed = 0`. |
| Hover / focus | N/A. |
| Vestibular | `reducedMotion` mutes ripple pulse and zeros shake/recoil (`ship.js:1207–1211`). HUD CSS already kills `#hud` animation (`hud.css:1183–1189`). Facing flash becomes a static red outline (`hud.css:305–308`). |
| Visual hierarchy | Punch is world FX on the hull, not a label. Rails stay 57% / ±78 px (`hud.css:885–903`). |

### Digit / hub freeze table

| Surface | Live | Spec | Later serial |
|---|---|---|---|
| `.rw-reticle` | 80 px hub, pupil, cilia, RANGE (`hud.css:184–220`; `hud.js:709–712`) | no new child | **forbidden** punch pip |
| `.rw-reticle::before` / `::after` | dashed range ring + iris spin | consume | do not pulse as hit pip |
| Facing flash | `.rw-combat-self` 0.4 s (`hud.js:1149–1151`) | consume | do not move to hub |
| Digit 0 / 8 / 9 | shipyard / launch / Standing | freeze | do not steal |
| Toast | not required for punch | `playerHit` audio only | do not add “SHIELD HIT” |
| `reducedMotion` | snap FX; zero shake | keep | no extra pulse |
| First-person player host | muzzle FP-small + 2.4 step | no full-size parent | world-space or FP-small **with** glass offset |

### Cross-check vs worker `out/w110/fx01/ui-audit.md`

Worker audit found no open Blocker/Major and froze FP parent + hub pip. Designer agrees on those freezes. Additional open 🟡: FP **fallback** at hull `pos` can still occupy glass; “small snap” wording collides with `f.snap`.

### Verdict

Spec honors HUD-01 empty hub, live `reducedMotion` snap, and the first-person **no full-size parent** rule. Do not raise Blocker/Major on the three flag conditions: the brief does not add a punch pip on `.rw-reticle`, does not ignore `reducedMotion`, and does not parent a full-size ripple on first-person player glass. Later PR1 must still pick a glass-safe FP player-host fallback (skip or muzzle-style small+offset), keep JS `snap` (CSS on `#hud` does not cover scene sprites), and must not grow hub chrome to sell the hull-local ring.
