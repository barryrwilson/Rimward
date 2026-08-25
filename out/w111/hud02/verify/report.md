# HUD-02 remaining class-silhouette pack — verifier report

**Status:** CLEAN  
**Domain:** data (static). No Vite. No Chrome. No new processes.  
**Census date:** 2026-08-24  
**Graph:** `codex/workflow-software-delivery` (`execute_workflows`).

## Pack files (this worker)

Untracked markdown only (`git status --short`):

- `docs/Hud02RemainingSilhouettesDesign.md`
- `out/w111/hud02/current-hud02-silhouette-inventory.md`
- `out/w111/hud02/shared-contract.md`
- `out/w111/hud02/security-review.md`
- `out/w111/hud02/code-review.md`
- `out/w111/hud02/ui-audit.md`
- `out/w111/hud02/notes.md`

No `src/` or `scripts/` in this pack. Sibling Wave 111 source edits were not treated as this worker.

## Checklist

| Gate | Result |
|---|---|
| No `src/` / `scripts/` in pack | PASS |
| Inventory `hud.js` / `hud.css` cites still exist | PASS (see residual nits) |
| Contract forbids hub / Digit / `state.js` write / `innerHTML` / new persist | PASS |
| Integrator vs contract | PASS — integrator states contract wins |
| Leftover real | PASS — `hud.js` never reads `classKey`; one generic bio facing glyph |
| Not CONSUME | PASS |

## Leftover (live)

`src/systems/hud.js` has **zero** matches for `classKey`, `data-class-key`, `data-class`, `SHIP_CLASSES`, `innerHTML`.

`src/ui/hud.css` has **zero** matches for `classKey`, `data-class-key`, `data-class`, wayfinder / shieldback / gardenback selectors.

Live family switch is `hudFamily` → `'mech' | 'bio'` (`hud.js` 81–89). Session override is `rw-hud-family` mech|bio only (92–97). `#hud.dataset.family` is set at init (1083) and on 5 Hz hullKind/faction/override change (1719–1737). `last` cache tracks `family` / `kind` / `faction` / `hudOverride` (1060) — no `classKey`.

Facing DOM is one tree: `.rw-facing-sil` + nose/body spans + FORE/AFT words (`makeFacing` 337–344). Two copies: self 847, target 858. Bio CSS is one 22×10 box, one ellipse nose, **one** organism polygon (`hud.css` 1503–1526). Mech is one plate (`1262–1284`).

BIO-07 / `makeLivingHull` remain 3D (`ship.js` 264–268 modest cutter/heavy sil; 280–339 sculpt). Overlay does not consume those bodies.

Hangar already persist `classKey` (`save.js` `WORLD_FIELDS` hangar at 94; `src/game/hangar.js` `classKeyOf` 40–42). HUD does not.

**Verdict:** leftover is real. Not CONSUME.

## hud.js / hud.css cites (still exist)

| Inventory / contract cite | Live |
|---|---|
| `hudFamily` 81–89 | yes |
| session 92–97 | yes |
| `el()` 244–249 | yes |
| color-never-only comment 336; `makeFacing` 337–344; `set` 348+ | yes |
| RANGE 709–712 | yes (`RANGE` text at 712) |
| self 847 / target 858 | yes |
| init family 1078–1084 / 1083 | yes |
| `emitFamilyTick` 1087–1090 | yes |
| `selfHitFlashUntil` 1109–1110 | yes |
| facing path 1389–1408 | yes |
| contact enter 1535–1540 | yes |
| 5 Hz family 1719–1737 / 1730 | yes |
| hub `.rw-reticle` 184–193 | yes 80×80 |
| RANGE CSS 207–220 | yes |
| `.rw-facing-sil` 239–244 | yes 22×10 |
| nose 246–255; body 257–265; FORE/AFT 272–317 | yes |
| facing flash reducedMotion 305–307 | yes |
| reducedMotion kill 1185–1188 | yes |
| mech plate 1262–1284 | yes |
| bio sil 1503–1526 / ends through 1536 | yes |
| iris reducedMotion 1616–1620 | yes (block continues 1621) |

Supporting cites also still exist: `SHIP_CLASSES` `state.js` 37–44; `song.js` family CUES 114–130; WAVE62 `boot-test.mjs` 11875–11972 (independent/Beautiful/built/living/session/blocked); WAVE65 13372–13414; Digit 0/8/9 `station.js` 188, 5963–5966, 6101; outfitting papers 1644–1712; settings `rimward-settings-v1` `src/systems/settings.js` 7–8, 24; `FIELDS` 29–38; body classes 70–72.

Wave 61 law still says do not switch family on `classKey` alone (`out/w61/shared-contract.md` §3.2).

## Contract forbids (normative)

- Hub child / class pip on `.rw-reticle` — §0.2
- Digit 0/8/9 steal; no new Digit — §0.3
- `innerHTML` / SVG from `classKey` — §0.4
- `state.js` write — §0.5
- New persist / `WORLD_FIELDS` / session class picker — §0.6
- Fail closed generic living chrome — §0.12 / §2
- PR1 named only; no src this wave — §0 / §3

Integrator `docs/Hud02RemainingSilhouettesDesign.md` merge law: if conflict, **contract wins**. Deputize tables and PR plan match (allowlisted `#hud[data-class-key]` + authored CSS on existing `.rw-facing-sil` / bio chrome).

## Residual nits (do not invert leftover)

These are citation / merge-law wording slips. They do not make the leftover fake and they do not reopen hub / Digit / `state.js` / persist / `innerHTML`.

1. **Contract self-wording:** §0.1 fail-closed says omit `data-class-key` when family is not bio. The §0.1 formula and §2 omit **CSS** on mech and still set the attribute from allowlisted `classKey`. Visual fail-closed is the same if selectors stay under `#hud[data-family="bio"]`. Later PR1 should pick one and follow MERGE LAW §0.12 (generic chrome; mech gains no class facing rules).
2. **Inventory §8 bio hair:** cites `hud.css` 1483–1488 as bio hair `content: none`. Those lines are reduced-motion hair hide for **bio and mech**. Bio `.rw-hair-off` is 1477–1481. The line numbers exist; the label is off.
3. **Inventory §4 `mountedClassKey`:** cites `station.js` 1648–1653. That span is `mountedHangarRowOf`. `mountedClassKey` is 1659–1664. Station still reads class; HUD still does not.
4. **BIO-07 name table:** `out/w106/foundation/notes.md` 7–15 maps light/heavy to SHARK/WHALE. Integrator overview uses bible glance names (wayfinder / shieldback). Inventory cites both. HUD glyphs remain absent either way.

## What was not run

No Vite. No Chrome. No Playwright. No boot-test execution. Static grep + line reads only.
