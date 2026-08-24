# UI Audit: Hangar train Offer career labels (Wave 102 PR1)

**Auditor:** `[designer]` (independent of `out/w102/career/ui-audit.md` — do not rubber-stamp)
**Review file:** `out/w102/career/designer-audit.md`
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Static desk-copy review. No Vite. No Playwright. [NO BROWSER COVERAGE]. CLOS HUD out of scope (`HAIR_CAREER` not audited).
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits). Worker owns fixes.

Sources: `src/systems/shipyard-desk.js`, `src/systems/station.js` (Digit 0 / `h()` `btn()` only), `src/ui/screens.css` (papers tokens, no career pulse), `out/w101/career/shared-contract.md` §0.6 §2.3, `docs/Bio02CareerDesign.md` PR1 labels, `out/w102/career/probe.mjs`.

Focus this pass:

- Offer name / Offer button extra career word
- Confirm hop still `{from} → {dest}` **keys** (career word as dest = Blocker)
- Digit 0 still Shipyard; no Career Digit (Digit steal = Blocker)
- No `innerHTML`
- Reduced-motion: no extra pulse
- Contrast via **text**, not color alone (the extra word is the cue)

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Real `btn()` Offer / Confirm / Esc — Cancel; visible labels; Digit 0 Shipyard; Hangar 1/2 panes; 3+ and 0 Mount; train Offers stay click / Tab, not a Digit; `textContent` / no `innerHTML`; extra word is the career cue, not hue |
| Theming | Reuse Hangar papers; no dest-only color; no new overlay; no career pulse class |
| Responsive | Labels ride existing dest rows; pending still replaces the hull list |
| States | Hostile `No sale.`; short credits keep Offer; Confirm refuse unchanged; reducedMotion no extra train pulse |
| Hierarchy | Confirm hop stays `{from} → {dest}` keys; career word is Offer copy only |

---

## UI Audit: Beautiful Hangar train Offers (career words)

### Summary
PR1 appends a static career word on Hangar train Offer **name** and Offer **button**. Confirm papers hop stays `{from} → {dest}` class keys. Digit 0 stays Shipyard. No Career Digit. No `innerHTML`. No extra reduced-motion pulse. Yard buy names stay class keys.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 2 minors, 2 suggestions.

Copy does **not** lie: dest on Confirm and `setTrainPending` is the live class key, never the career word. Digit 0 is not stolen.

### What's done well

- Offer name keeps the dest **key**, then the extra word (`light → heavy combat`). Button is `Offer heavy combat`. Cutter stays `cutter` (no `cutter cutter`). Words match contract §2.3: combat / hunter / trade / explore / capital (`shipyard-desk.js` 101–108, 164–171, 456–467).
- Confirm papers name is `${fromClass} → ${destClass}` via `classLabel` only. Career helpers are not called on that hop (`406–414`). Dest on click is `offer.destClass` (`464`). `confirmTrain` still `trainMounted(ctx, dest)` from `pending.destClass` (`291–298`). Probe: `light → heavy`, not `light → heavy combat` or `light → combat`.
- Digit **0** dock still Shipyard: last `DOCK_KEY_SERVICES` key, menu label `0 — Shipyard`, `KeyY`, level-1 Digit 0 (`station.js` 185, 5886–5888, 6020–6025). Hangar Digit 0 still last hull row (`shipyard-desk.js` 173–181, 520–529). Legend still `0 last row` (`490–493`).
- No Career Digit. `handleShipyardDigit` is 1 Hangar / 2 Yard / 3+ (and 0 as row 8) Mount. While `trainPending`, digits swallow like graft; they do not arm a dest (`520`). Offers stay click `btn()`. Digit 8/9 stay Launch / Standing / hull / outfitter papers (untouched).
- Copy host is `h()` `textContent` and `btn()` (`station.js` 4350–4361). `shipyard-desk.js` has **no** `innerHTML`. No `careerPending`. Hull `name` stays Mount-row `textContent` only (`429`).
- Reduced-motion: train Confirm does **not** add a pulse, CSS animation, or extra `reducedMotion` branch. Graft still shortens warning copy only (`390–395`). Train cargo note is static text (`416`). `.shipyard-confirm` is the existing cyan left border (`screens.css` 409–411), not a new career blink.
- Contrast cue is the extra **word**, same type color as hop (`shipyard-buy-name`). Career is not a hue swap. Hostile `No sale.` and prices stay text. Confirm stays warm **Confirm papers** like Yard / graft.
- Yard pane still `classLabel` only. No `careerOfferLabel` / `CAREER_WORD` on buy names (`351`, `374`).
- Empty / refuse / Esc — Cancel / `TRAIN_CARGO_NOTE` / `TRAIN_HULL_LINE` legend unchanged in control shape.

### Findings

#### 🔴 Blocker

None. Career word is not used as dest key. Digit 0 is still Shipyard. No Career Digit.

Closed this pass (Blocker if a later edit undoes them):

- **Career word as dest.** Confirm hop and pending dest stay `SHIP_CLASSES` keys. Do not parse `Offer heavy combat` back into dest. Do not paint `light → combat`.
- **Digit steal.** No new `DOCK_KEY_SERVICES` key. Digit 0 dock Shipyard. Hangar 0 last hull. 1/2 panes. 3+ Mount. 5 Repair. 6 Outfitting. 8/9 occupied. Train Offers are click only.

#### 🟠 Major

None.

#### 🟡 Minor: Offer hop name carries the extra word; Confirm hop does not

**Location:** `src/systems/shipyard-desk.js:456-467` vs `406-414`
**Issue:** Offer name can read `light → heavy combat`. Confirm reads `light → heavy`. The extra word on the name is longer than the Wave 101 “button or meta only” suggestion. It is **not** a dest lie: the key `heavy` stays in the hop, and Confirm strips the word before debit. The mismatch is the contract cue.
**Fix:** Keep Confirm as keys. Worker need not change Offer name this PR unless copy length fights the 560 px panel. Do not move the word onto Confirm.

#### 🟡 Minor: Dead `TRAIN_HEAVY_NOTE` still sits in the desk

**Location:** `src/systems/shipyard-desk.js:94`
**Issue:** Paint never uses this line. Wave 94 trains to any other living key. Showing it on `frigate` / `ace` would lie.
**Fix:** Do not revive as dest-stop law. Leave unused unless a later desk cleanup owns it.

#### 💡 Suggestion: Longer Offer buttons wrap on existing `screen-btn`

**Location:** `Offer freighter trade` / `Offer frigate capital` (`shipyard-desk.js:464`; `screens.css:74-86`)
**Issue:** Buttons are longer. Hit target and keyboard path are unchanged (click Offer; no new Digit). Full-width `screen-btn` already wraps.
**Fix:** None this PR.

#### 💡 Suggestion: Digit 8 / 9 occupancy stays implicit

**Location:** Hangar legend `shipyard-desk.js:490-493`; dock menu `station.js:5886-5888`
**Issue:** PR1 legend names Train, not Career, and does not list dock 8 Launch / 9 Standing. That is correct (no Career Digit). A later serial must not bind Offers to 8/9 “because the legend omitted them.”
**Fix:** None this PR. Do not add a Career Digit line.

### Keyboard (must keep)

- Level 1 Digit **0** / `KeyY` → Shipyard. Digit **8** Launch. Digit **9** Standing. Unchanged.
- Digit **1** Hangar, Digit **2** Yard.
- Digit **3+** and Hangar Digit **0** Mount. Digit **8 / 9** on Hangar still hulls. No-op while `trainPending` (swallow, not dest arm).
- Train / career Offers: click or Tab onto `btn()`. **No** dest Digit. **No** Career Digit.
- Esc cancels papers, then Back. KeyB undock nulls `trainPending`.
- Outfitter Digit **6** kits; Digit **8 / 9** launcher / turret. Career does not steal them.

### Checks

- [x] Digit 0 Shipyard unchanged (no Career dock service)
- [x] Digit 1 Hangar / Digit 2 Yard unchanged
- [x] Digit 3+ hull Mount unchanged; Hangar Digit 0 last row
- [x] Digit 8 / 9 occupancy unchanged (not stolen)
- [x] Offer name + Offer button extra word; cutter stays `cutter`
- [x] Confirm hop `{from} → {dest}` keys; dest is `livingTrainDests` key
- [x] Career word not used as dest key
- [x] No `innerHTML`; `h()` `textContent`
- [x] Reduced-motion: no extra train pulse (copy only)
- [x] Contrast via extra word, not color alone
- [x] Yard names stay class keys
- [x] CLOS HUD not in this audit

### Residual after this audit

Two minors (Offer name vs Confirm hop length; unused `TRAIN_HEAVY_NOTE`). Two suggestions (wrap; do not invent Digit 8/9 career). None block PR1. Worker owns any copy fix; this file is review only.
