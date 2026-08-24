# UI Audit: TGT-03 CLOS meter on `.rw-combat-target` (Wave 102)

**Auditor:** `[designer]` (independent of `out/w102/clos/ui-audit.md` — do not rubber-stamp)
**Review file:** `out/w102/clos/designer-audit.md`
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Static desk-copy review. No Vite. No Playwright. [NO BROWSER COVERAGE]. Hangar career labels out of scope.
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits). Worker owns fixes.

Sources: `src/systems/hud.js`, `src/ui/hud.css`, `src/game/contacts-gate.js`, `out/w101/closure/shared-contract.md` §0 §1.1 §1.3 §2, `out/w102/clos/notes.md`, `out/w102/clos/probe.mjs`.

Focus this pass:

- Empty 80 px hub; no CLOS child on `.rw-reticle` / RANGE
- CLOS meter on `.rw-combat-target` next to DIST
- Authored `+N u/s` / `-N u/s` / `0 u/s` readable without color
- No new `@keyframes`
- Scanner 0 still shows DIST + CLOS on a live ship lock
- Rock / TGT-05 kinds hide the tgt rail

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Label `CLOS` + signed `u/s` text (color is not the only cue); `el()` / `textContent`; no `innerHTML`; `--rw-text-scale`; `body.rw-contrast` / `rw-colorblind` inherit rail tokens; reduced-motion keeps the number |
| Theming | `.rw-combat-clos` is tabular-nums only; value stays `.rw-value` / `--white`; no approach/recede hue class |
| Responsive | Extra meter row on existing `min-width: 168px` / `max-width: 220px` rail; `measureRails()` after CLOS write; hub still 80×80 |
| States | Live ship lock shows rail; first vel frame `0 u/s`; hide on no lock / destroyed / rock / station / gate / pod / landmark; scanner 0 ungated like DIST |
| Hierarchy | CLOS is the DIST sibling, not SPD, not RANGE, not Mk II «/» on `.rw-contacts` |

---

## UI Audit: CLOS on the combat target rail

### Summary
PR adds one labeled CLOS meter on `.rw-combat-target` immediately after DIST. The 80 px hub stays empty. Meaning is `CLOS` plus `+N` / `-N` / `0` `u/s`, not color and not a new motion. Scanner 0 still shows the pair. A rock lock hides the whole rail.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 1 minor, 1 suggestion.

Glance is honest: live ship lock only. Hub theft did not land.

### What's done well

- Picture matches DIST: `el('div', 'rw-meter')` then `.rw-label` `CLOS` then `.rw-value.rw-combat-clos` (`hud.js` 864–869). Source order puts CLOS after DIST. DOM children on `.rw-combat-target` keep that order.
- Hub stays empty. `.rw-reticle` is still 80×80 with pupil, three cilia, and `RANGE` only (`hud.css` 184–191; `hud.js` 709–712). No `CLOS` text and no `.rw-combat-clos` under the reticle. Comment still `keep the 80 px hub on glass` (`hud.js` 1212).
- Authored format is one `textContent` string (`hud.js` 252–257, 2062–2065): recede `+N u/s`, approach `-N u/s`, zero `0 u/s`. No rail «/». Mk II «/» stays on `.rw-contact-close` when scanner ≥ 2 (`hud.js` 1508–1523).
- Color is never the only cue. `.rw-combat-clos` sets `font-variant-numeric: tabular-nums` only (`hud.css` 913–915). Value inherits `.rw-value` `--white` (`hud.css` 69–73). Contrast raises `--white`; colorblind does not invent a CLOS hue. Sign + unit carry approach vs recede.
- No new `@keyframes` for CLOS. Existing bio hair sway on `.rw-combat-target::before/::after` is pre-existing (`hud.css` 1404–1456). `body.rw-reduced-motion #hud, #hud *` already kills HUD animation (`hud.css` 1185–1188); the number still writes.
- Scanner does not gate the rail. CLOS paints in the same `shipTgt` DIST block (`hud.js` 2044–2066). Wave F arc still uses `contactsGate` (`hud.js` 1411–1418; `contacts-gate.js` 8–19). Scanner 0 hides the arc and still shows DIST + CLOS on a live ship lock.
- Rock / TGT-05 fail-closed: `shipTgt` is live ship only (`hud.js` 1235–1240). `isRockLock` and `allowedLockKind` station / gate / pod / landmark keep `tgtRail` `.is-hidden`. Hide clears `last.railClos` so the next ship lock is a fresh write.
- First frame without a vel sample is `0 u/s` (`hud.js` 2062). Contract allows em-dash or `0 u/s`. Hide uses the existing rail, not a fake player SPD.
- `measureRails()` runs after CLOS text change (`hud.js` 2066) so bio `hairBoxForRail('tgt', …)` sees the extra row.

### Findings

#### 🔴 Blocker

None. CLOS is not on `.rw-reticle`. Scanner 0 does not hide DIST + CLOS. Rock lock hides the rail.

Closed this pass (Blocker if a later edit undoes them):

- **Hub theft.** Do not put CLOS, a tape, or a pip inside `.rw-reticle` or next to RANGE.
- **Color-only rate.** Do not paint approach/recede with hue and drop `+` / `-` / `0`.
- **Rail «/» on the signed deputize.** Mk II glyphs stay on `.rw-contact-close`.
- **Scanner gate on rail CLOS.** DIST is ungated; CLOS follows DIST.
- **Rock / kind vitals.** Asteroid and TGT-05 locks must not show ship CLOS.

#### 🟠 Major

None.

#### 🟡 Minor: CLOS value has no `nowrap`; DIST `u` is shorter than CLOS `u/s`

**Location:** `src/ui/hud.css:913-915` vs `.rw-combat-rail` `max-width: 220px` (`884–890`); value string `hud.js:253-257`
**Issue:** `.rw-combat-name` is `nowrap`. `.rw-combat-clos` is not. At `--rw-text-scale` 1.5 the authored `+N u/s` is longer than DIST `N u`. A large rounded rate can wrap inside the 220 px cap and jitter the rail height that `measureRails()` just measured.
**Fix:** Add `white-space: nowrap` on `.rw-combat-clos` (and optionally `.rw-combat-dist`) so digit changes stay one line. Do not move CLOS onto the hub to “save width.”

#### 💡 Suggestion: Extra meter row lengthens the tgt rail toward NAV-02

**Location:** `src/systems/hud.js:867-869`; `src/ui/hud.css:901-903`, `969-970`
**Issue:** CLOS is one more `.rw-meter` under DIST. NAV-02 already caps 180 px so scale 1.5 does not grow into the tgt rail. This pass did not run a viewport. Overlap is not proven.
**Fix:** None this PR unless a live 1.5 / short viewport clips the row. Keep `measureRails()` on CLOS write. Do not steal the 80 px hub to shorten the rail.

### Keyboard (must keep)

- CLOS is not a control. `#hud` stays `pointer-events: none` on the rail.
- KeyT cycle, KeyV reticle lock, KeyX MATCH, KeyK engine-select: untouched this pass (not re-audited as Hangar).
- Digit 0 / 8 / 9 occupancy: not in this HUD picture. Hangar career labels are out of scope.

### Checks

- [x] 80 px `.rw-reticle` empty of CLOS (pupil / cilia / RANGE only)
- [x] No CLOS class or `CLOS` text under `.rw-reticle`
- [x] CLOS meter on `.rw-combat-target` immediately after DIST
- [x] Class `.rw-combat-clos` on the rail value only (not contacts / reticle / lead / gate cue)
- [x] Deputize `+N u/s` / `-N u/s` / `0 u/s`; no rail «/»
- [x] Readable without color (label + sign + `u/s`)
- [x] `font-variant-numeric: tabular-nums`
- [x] No new `@keyframes` for CLOS
- [x] Reduced-motion: HUD anim off; number still updates
- [x] Scanner 0: DIST + CLOS still on live ship lock; arc stays hidden
- [x] Rock lock hides `.rw-combat-target`
- [x] station / gate / pod / landmark hide the rail
- [x] `el()` / `textContent`; no `innerHTML`
- [x] Hangar career labels not audited

### Residual after this audit

One minor (`nowrap` at large text scale). One suggestion (rail height vs NAV-02; unproven without a browser). None block the picture. Worker owns any CSS one-liner; this file is review only.
