## UI Audit: NAV-02 in-flight next-gate guidance (designer, Wave 84 freeze)

**Reviewer:** designer pass  
**Scope:** `docs/Nav02GuidanceDesign.md`, `out/w84/nav02/shared-contract.md`, prior `out/w84/nav02/ui-audit.md`, live HUD occupancy in `src/systems/hud.js` and `src/ui/hud.css`.  
**Not in scope:** product `src/` edits, wishlist, sibling NAV-01/NAV-03 trees.  
**Wave:** markdown design freeze only. No live `.rw-nav-readout` / `.rw-nav-gate-cue` / `nav-gate-marker` ships yet. Findings are freeze vs live occupancy.

### Summary

The freeze keeps next-gate chrome off the aim glass, rails, lead pip, projectile path, prompt, and TGT-03 contacts arc. Identity is a third instrument (`nav-gate`), not lock and not scanner. **Follow-up freeze (same wave):** contract §7 now caps readout `max-width: 180px` with name ellipsis; §13 lands docked/jumping hide and static motion in the **first** chrome PR. Persist copy consumes NAV-01 `plotted|blocked|arrived` (not a forked enum).

### What's done well

- Readout parks in `.rw-side-col` above POS (`shared-contract.md` §7; live POS `hud.js` 878–881, 1622–1635; column `hud.css` 830–840). That is the bottom-right career cluster, not `top:57%` rails (`hud.css` 769–787), not the 80 px hub (`hud.js` 1077), not lead (`hud.css` 475–527; `hud.js` 1155–1180), not prompt `bottom:20%` (`hud.css` 626–629).
- Off-screen find-aid is a **new** pooled node `.rw-nav-gate-cue`, not `.rw-edge-arrow`, not `.rw-contact-pip`, not `.rw-chartmark`, not a contacts SVG child (`shared-contract.md` §1.7, §5).
- Contacts arc stays scanner-gated **ships** (`hud.js` 44–47, 752–782, 1255–1293; `hud.css` 671–680). Boot pin “scanner 0 still cues; scanner 2 still ships-only” is the right regression.
- Guidance is not a lock: never writes `ctx.targets.current`; empty `raycast`; no `lockKind`; amber lock triangle and cyan gate chevron may coexist (`shared-contract.md` §4, §6; live lock chrome `hud.js` 688–702, 1182–1196).
- Color is never the only signal: `NEXT`/`DEST`/`JUMPS` labels, gate-notch chevron vs solid amber triangle vs landmark diamond vs hostile pip, tokens `--rw-accent` / `--dim` (`hud.css` 4, 8–26; contract §5).
- `reducedMotion`: static ring + static chevron; transform rotate+translate only (`shared-contract.md` §1.16, §5, §6). Live HUD already kills animation/transition under `body.rw-reduced-motion` (`hud.css` 974–978).
- Docked: station overlay owns the screen (`screens.css` 8–16, z-index 20 vs `#hud` z-index 10 in `style.css` 24–28). Jumping: center jump bar owns the hub (`hud.js` 632–659, 1051–1068). Freeze hides nav chrome in both.
- Combat: `.rw-aux` opacity 0.38 (`hud.css` 815), not `.rw-fade` / chartmark 0.14 (`hud.css` 88, 586). Route stays glanceable.
- Persistent readout, not `commLine` toasts (`hud.js` 1009–1020) and not a second aim-column banner (`hud.js` 1032–1048; toasts already `right:168px`, `hud.css` 588–594).
- Screen-reader: `role="status"` + `aria-live="polite"` on next/dest/remaining/status only; 5 Hz distance sits outside that child (`shared-contract.md` §7; throttle `hud.js` 50, 1451–1454). Cue is `aria-hidden`.
- Overlay stays `pointer-events: none` except the existing controls toggle (`hud.css` 5–6, 890). No new hit target, no focus trap, Digit/M/T/V/X/G untouched.
- `textContent` + `stripHudText` + `Object.hasOwn(SYSTEMS, id)` (`hud.js` 226–231, 356–365, 414–419). No `innerHTML`.

### Findings

#### 🔴 Blocker: (none)

No unusable or inaccessible defect in the freeze. Aim glass, lead, rails, prompt, and contacts arc stay clear if impl obeys placement and hide rules.

#### 🟠 Major: Side-col readout can cover the target rail at textScale 1.5

**Location:** `shared-contract.md` §7 (placement freeze, no max-width/ellipsis); `hud.css` 28–30, 769–787, 817–840; `hud.js` 878–881; `ctx.js` 192 (`textScale` 0.85|1|1.2|1.5)  
**Issue:** Five labeled rows (`NEXT`/`DEST`/`GATE`/`JUMPS` + status) inserted above `.rw-pos` grow `.rw-side-col` (`flex-direction: column`, `align-items: stretch`, no max-width). Live POS coords are `white-space: nowrap` (`hud.css` 842–847); `.rw-sysname` is also nowrap (injected W2, `hud.js` 660–667). Long allowlisted names at `--rw-text-scale: 1.5` widen the column leftward into `.rw-combat-target` (`left: 50%` + 78 px, `max-width: 220px`). At ~900 px CSS width the rail’s right edge and a nowrap nav panel already overlap. Wrap-without-cap instead grows height toward the contacts band (`bottom: 5.5%`, height 72 px, `hud.css` 671–680) and the right rail (`top: 57%`). HUD-01 occupancy is closed.  
**Fix:** At PR1 CSS: treat readout as a **slim** instrument (POS-like meters, not a second Bio-sized `.rw-panel`). Cap width to the side-col (match POS `min-width: 0` + ~148–180 px). `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` on name values. Keep type at `calc(10–11px * var(--rw-text-scale))`. Status is a fifth row only when `REROUTE` / `NO ROUTE` / `ARRIVED`. Pin 1280×720 and a ~900-wide shot at `textScale` 1.5 in PR5. Do not move rails, prompt, or contacts.  
**Status:** resolved in freeze — `shared-contract.md` §7 `max-width: 180px` + ellipsis; PR1 not PR5.

#### 🟠 Major: Docked / jumping hide and reducedMotion must not wait for PR5

**Location:** `shared-contract.md` §13 PR5 vs §1.9, §5, §6, §7; live `#hud` stays mounted while docked (`style.css` 24–28 z-index 10; station overlay `screens.css` 8–16 z-index 20); jump fade `gate.js` overlay z-index 40; jump bar `hud.js` 1051–1068; `hud.css` 974–978  
**Issue:** Contract serializes `reducedMotion`, combat `.rw-aux`, and docked/jumping hide to **PR5**. PR1 readout is a named `aria-live` instrument. If PR1 merges without hide, the live region still speaks under the station overlay and during jump charge. If PR2/PR3 land a CSS pulse or scale-breath “for juice” before PR5, `body.rw-reduced-motion` is the only backstop (`hud.css` 974–978) — world-space rings in `gate.js` / a new module are **not** under that `#hud *` rule (gate VFX already special-case `ctx.settings.reducedMotion`, inventory `gate.js` 152–202, 520). Seizure risk on the 3D ring is a later-module problem, not HUD CSS.  
**Fix:** PR1: hide readout when `ctx.flags.docked` or `ctx.gate.jumping` (same pattern as contacts `hud.js` 1259 and chart marks `hud.js` 1420). PR2: no `@keyframes` on `.rw-nav-gate-cue`; document `prefers`/`body.rw-reduced-motion` + `ctx.settings.reducedMotion`. PR3: static shared material; no scale pulse / spin even before PR5. Keep PR5 as the boot-pin screenshot pass, not the first time hide/motion exist.  
**Status:** resolved in freeze — contract §13 PR1 hide docked/jumping; PR2 no `@keyframes`; PR3 static ring; PR5 screenshots only.

#### 🟡 Minor: Dual edge glyphs share EDGE_MARGIN 84

**Location:** `hud.js` 56, 1182–1196; `hud.css` 529–548; `shared-contract.md` §5  
**Issue:** Lock amber triangle and nav cyan chevron both clamp with the same behind-camera flip and `EDGE_MARGIN` 84. When lock and routed gate sit in one quadrant (or both behind), two glyphs stack. Shape contrast (notch vs solid triangle) is required but not sufficient if they share a pixel. Chart marks also edge-clamp to 84 (`hud.js` 1434–1436) and **stay** on the rim with a label.  
**Fix:** Nav cue inset ~12 px inside the lock arrow, slightly smaller glyph. Never merge classes. Hide cue when on-screen (already frozen).  
**Status:** open — impl pin. Do not reopen occupancy.

#### 🟡 Minor: On-screen ring vs lock bracket on the same gate

**Location:** `shared-contract.md` §4, §6; live bracket 60 px box `hud.css` 401–406; KeyV bore 30 `reticle-aim.js` (inventory); glow rest 96  
**Issue:** Player may KeyV the routed gate. Bracket corners + in-world ring then stack. A loud additive torus reads as a second lock and can wash faction glow.  
**Fix:** Thin dark-edged cyan stroke, scale ≤ rest glow, outside the bore, no strobe. Empty `raycast`. Do not reuse `reticleLock` chrome.  
**Status:** open — impl pin. Contract §6 already states the visual cap.

#### 🟡 Minor: Combat dim mix in the side-col

**Location:** `shared-contract.md` §7; `hud.css` 88, 815; `hud.js` 867–881  
**Issue:** Bio and POS are `.rw-fade` (0.14 in combat). Nav is `.rw-aux` (0.38). Intentional (route stays glanceable) but the cluster becomes three stacked opacities. At 0.38 the readout is still a small opaque panel in the corner — not aim/lead — so not a blocker.  
**Fix:** Keep `.rw-aux`. Do not use `.rw-fade`. Optional: drop panel fill on the nav block in combat (stroke/text only) so it does not look like a brighter Bio.  
**Status:** accept — freeze is correct.

#### 🟡 Minor: High-contrast / colorblind token coverage for new classes

**Location:** `hud.css` 936–965 (contrast tweaks list toast/banner/jump/prompt, not future nav); `hud.css` 4, 8–26, 937–942  
**Issue:** Impl that hardcodes `#6ff2e0` / amber on the chevron skips `body.rw-colorblind` and `body.rw-contrast`. Shape still carries meaning, but contrast-mode panels get the extra opaque scrim and the new nodes would not.  
**Fix:** Color via `--rw-accent` / `--cyan` / `--dim` / `--void`. Add `.rw-nav-readout` and `.rw-nav-gate-cue` to the contrast block beside `.rw-banner` / `.rw-jump`. HUD-02 may restyle without moving (`shared-contract.md` §11).  
**Status:** open — impl pin.

#### 💡 Suggestion: Instant JUMPS digit, no roll-up

Remaining is a discrete int (`shared-contract.md` §2.3). Instant `textContent` swap. No CSS pulse on change (also a `reducedMotion` footgun).

#### 💡 Suggestion: Do not inject a third W2 sheet

Live jump/banner CSS is already a wave-2 concession (`hud.js` 586–670). Contract prefers `hud.css`. Keep it there so `--rw-text-scale` and reduced-motion catch-all apply.

### Focus checklist (this pass)

| Focus | Verdict |
|---|---|
| Readout vs aim / lead / projectiles | **Pass.** Side-col above POS. Rails stay stroke-only at 57%. Lead and hub untouched. Do not toast or banner hop copy. |
| Distinct from scanner contacts | **Pass.** New class; no SVG pip; scanner 0 still shows cue; hide docked matches arc hide. |
| Off-screen cue | **Pass if** distinct glyph + hide-when-on-screen + same behind-camera flip. Dual-margin stacking is minor. |
| In-world marker not a lock | **Pass.** Decorative group, empty raycast, no `lockKind`, not in `ctx.ships`. |
| reducedMotion | **Pass in freeze; Major on PR order.** Static only. World-space module must read `ctx.settings.reducedMotion`, not only `body.rw-reduced-motion #hud`. |
| Color-not-only | **Pass.** Labels + notch chevron + tokens. |
| Docked / jumping hide | **Pass in freeze; Major on PR order.** Station z-20 and jump z-40 cover pixels; hide is still required for AT and jump-bar occupancy. |
| Combat dim | **Pass.** `.rw-aux` 0.38, not vanish. |
| textScale 1.5 wrap | **Pass in freeze.** Contract §7 caps 180 px + ellipsis in PR1. |

### Verdict

**Accept the design freeze for occupancy and identity.** Do not reopen HUD-01, TGT-03, or lock chrome. Width cap, ellipsis, docked/jumping hide, and static motion are frozen into the first chrome PRs.

| ID | Severity | File:line | Status |
|---|---|---|---|
| side-col 1.5 overflow | 🟠 Major | `hud.css` 830–840, 769–787; contract §7 | resolved in freeze |
| hide/motion vs PR5 | 🟠 Major | contract §13 vs §5–7; `style.css` 24–28 | resolved in freeze |
| dual EDGE_MARGIN | 🟡 Minor | `hud.js` 56, 1182–1196 | open, impl pin |
| ring vs bracket | 🟡 Minor | contract §6; `hud.css` 401–406 | open, impl pin |
| aux vs fade mix | 🟡 Minor | `hud.css` 88, 815 | accept |
| contrast selectors | 🟡 Minor | `hud.css` 958–965 | open, impl pin |
