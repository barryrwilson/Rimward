# UI Audit: FX remaining muzzle leftover pack (Wave 114)

**review_file:** `out/w114/designer/fxmuzzle-ui-audit.md`  
**Wave:** 114. Markdown leftover pack. Review only. No product `src/` edits. No `scripts/` edits.  
**Persona:** designer (`orchestrator/assets/designer-persona.md`) + `orchestrator/references/ui-audit.md`.  
**Sources:** `docs/Fx01RemainingMuzzleDesign.md`; `out/w114/fxmuzzle/shared-contract.md`; `out/w114/fxmuzzle/current-fx-muzzle-inventory.md`. Worker self-audit `out/w114/fxmuzzle/ui-audit.md` re-audited, not copied. Live cites checked against `src/` (read-only).  
**Pack mode:** CONSUME. Named serial: none. No remaining fire-side leftover.

### Summary

The brief and contract freeze leftover **CONSUME**. They do not add a hub pip, Digit, persist key, aim-glass chrome, fire toast, or settings checkbox. They do not reopen scrape punch or WAVE111 `spawnRipple` parent as this leftover. HUD-01 empty 80 px hub and live `reducedMotion` muzzle snap stay. No Blocker or Major.

**Verdict: CLEAN**

**Counts:** 🔴 Blocker **0**. 🟠 Major **0**. 🟡 Minor **0** (open on this pack). 💡 Suggestion **0** (required).

---

### What's done well

- CONSUME is the player-facing freeze, not a fake PR1. Additive punch is **none** (`docs/Fx01RemainingMuzzleDesign.md` 137–158, 247–258; `shared-contract.md` 69–83, 166–177).
- HUD-01 empty hub is explicit: no punch pip, combo meter, muzzle meter, fire glyph, or bolt counter on `.rw-reticle` (`shared-contract.md` 20; brief 12, 82, 264, 278). Live hub is still 80×80 with pupil, three cilia, RANGE (`src/ui/hud.css` 184–193; `src/systems/hud.js` 726–729). RANGE pop stays TGT-01 (`hud.js` 1392–1404).
- Facing-rail flash stays HUD-02 hair on `.rw-combat-self` (`shared-contract.md` 20; `hud.js` 863, 1127–1128, 1167–1169, 1407–1417). The pack forbids moving it onto the hub.
- No extra toast. Pack forbids `'▲ Muzzle.'` / `'▲ FIRE.'` (`shared-contract.md` 20). Live hull-strike string stays scrape HUD (`hud.js` 608–610).
- Digit 0 remains shipyard (`station.js` 188, 6098–6102, 6145–6147). Digit 8 dock root is launch; Digit 9 is epics (`DOCK_KEY_SERVICES` `station.js` 188; Digit handler 6098–6106). Outfitting 8/9 stay papers (`station.js` 6177–6179). Muzzle is not a dock verb.
- Persist stays scene-only. No `world.muzzleFx`. `WORLD_FIELDS` has no FX key (`save.js` 76–101; contract 24; brief 70, 125).
- No new settings checkbox. Live `CHECKBOXES` still has one `reducedMotion` row (`settings.js` 40–47). Body class stays `rw-reduced-motion` (`settings.js` 72). Default stays `ctx.js` 217 (`src/core/ctx.js`).
- `reducedMotion` keeps the live one-frame muzzle snap (`combat.js` 1008–1027 `snap`; tick hide `2021–2042`). Shake already zeros (`ship.js` 1207–1211). Mining lance pins pulse, it does not add `@keyframes` (`combat.js` 1530–1536). Contract forbids extra pulse (`shared-contract.md` 41).
- First-person muzzle stays small and stepped so the 80 px glass does not flood (`combat.js` 1004–1025; inventory 100; brief 270). CONSUME does not grow `base` / `grow`.
- Kit mutate omit. Aim-glass gauges stay off (`shared-contract.md` 38; brief 42).
- Scrape `spawnHitFx` is sibling consume (`combat.js` 1858–1860). WAVE111 parent is consume (`combat.js` 1050–1106). Both are named **not this leftover** (inventory 7, 20–21; contract 11, 30, 33; brief 28, 79–80, 146–147, 274–276).

---

### Findings

No 🔴 Blocker or 🟠 Major.

No 🟡 Minor on this markdown pack. The worker wishlist note is a later-reader risk on a file this worker must not edit. It is not a chrome add in the brief.

No 💡 Suggestion that this leftover must land.

---

### Focus checklist

| Check | Result | Cite |
|---|---|---|
| Brief does **not** add a hub pip | **Pass.** Forbidden in honor, pain points, non-goals, PR table, player outcome. | `Fx01RemainingMuzzleDesign.md` 12, 82, 122, 155, 264, 278; `shared-contract.md` 11, 20, 122 |
| No new Digit | **Pass.** Digit 0/8/9 frozen. “No new Digit.” Muzzle is not a dock verb. | brief 12, 69, 86, 123, 155–157; contract 21, 123; `station.js` 188, 6098–6106, 6177–6179 |
| No persist key | **Pass.** Scene only. No `WORLD_FIELDS` FX key. No `world.muzzleFx`. | brief 70, 83, 125, 141; contract 24, 103, 181–183; `save.js` 76–101 |
| No aim-glass chrome | **Pass.** Do not put fire chrome inside `.rw-reticle`. Do not reuse `rw-crosshair` / `rw-contact-pip`. RANGE stays TGT-01. | contract 20; `hud.js` 726–729, 1392–1404; `hud.css` 184–193 |
| No new settings checkbox | **Pass.** Reuse live `reducedMotion`. `CHECKBOXES` unchanged in this pack (markdown only). | contract 41, 125; brief 125; `settings.js` 40–47, 72 |
| CONSUME does **not** reopen scrape punch as this leftover | **Pass.** Census cites sibling call; steal forbidden. Do not wait on `out/w114/fxscrape/**`. | inventory 7, 21, 157; contract 12, 27, 116; brief 34, 80, 146; `combat.js` 1858–1860 |
| CONSUME does **not** reopen WAVE111 ripple parent as this leftover | **Pass.** Parent law consume. Hit-side, not fire-side. | inventory 20, 118–120; contract 15, 117; brief 79, 120, 147; `combat.js` 1050–1106 |
| HUD-01 empty hub stays | **Pass.** Live children remain pupil / cilia / RANGE. Pack names no new hub child. | `hud.js` 726–729; `hud.css` 184–193; brief 68, 278 |
| `reducedMotion` snap stays | **Pass.** Live `snap` + one-frame hide. No extra `@keyframes`. Mining pins opacity, no new HUD pulse. | `combat.js` 1009–1016, 2021–2042, 1530–1536; contract 41, 99, 158; brief 109, 170, 270 |

Player outcome (`docs/Fx01RemainingMuzzleDesign.md` 268–280): live family-tinted muzzle pop, FP-small step, glow-streak bolt, live mining lance with **no** weapon muzzle, scrape/ripple/IMPACT named out, empty hub, Digit 0 shipyard, `reducedMotion` snap — **met as freeze text**. This wave ships no new chrome.

---

### Worker self-audit

Worker `out/w114/fxmuzzle/ui-audit.md` verdict (no Blocker/Major; no chrome; HUD-01 / Digit / persist / `reducedMotion` honored) **matches** this pass.

- Worker 🟡 on wishlist 1232–1233 is a cite-only warning. This pack must not edit the wishlist. It does not change CLEAN.
- Worker 💡 on untextured `spawnFlash` is hit-side skippable (`combat.js` 594–607, 990–1001). Not fire-side leftover. Correctly left out of PR1 (there is no PR1).

No inflate: a leftover CONSUME pack that refuses chrome is not a UI defect.
