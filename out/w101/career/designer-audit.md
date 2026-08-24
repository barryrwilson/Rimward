# UI Audit: BIO-02 remaining career Hangar labels (Wave 101 freeze)

**Auditor:** `[designer]` (independent of `out/w101/career/ui-audit.md` — do not rubber-stamp)
**Review file:** `out/w101/career/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live Digit 0 / Hangar papers. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits, no brief edits). Wave 101 does not ship UI.

Sources: `docs/Bio02CareerDesign.md`, `out/w101/career/shared-contract.md` (merge law), `out/w101/career/ui-audit.md` (worker self-audit), live `src/systems/station.js`, `src/systems/shipyard-desk.js`. Cross-check: `src/ui/screens.css` focus tokens; `src/systems/hud.js` `HAIR_CAREER`; `src/game/save.js` `WORLD_FIELDS`.

Focus this pass:

- Digit **0 / 8 / 9** theft = Blocker
- Second Offer list / kit mutate (worker froze omit)
- Career labels vs clutter on Hangar papers
- `innerHTML` / named dest XSS
- No new persist / settings panel

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Real `btn()` Offer / Confirm / Cancel; visible labels; Digit 0 Shipyard; Digit 8 Launch / Digit 9 Standing; Hangar Digit 8/9 hull rows; Outfitter Digit 8/9 papers; train Offers stay click / Tab, not a Digit; `textContent` / no `innerHTML` |
| Theming | Reuse Hangar papers; no career HUD family; no dest-only hue; no new overlay |
| Responsive | Labels ride existing dest rows; no second Offer column; pending still replaces the hull list |
| States | Hostile `No sale.`; short credits keep Offer; Confirm refuse; kit mutate omit; no settings kill-switch |
| Hierarchy | Confirm hop stays `{from} → {dest}` **keys**; career word is optional Offer copy only |

---

## UI Audit: remaining career branches on live Hangar papers

### Summary
Wave 101 is a markdown freeze. It restates live Beautiful Hangar train papers and **omits** a Career Digit, a Hangar kit-mutate Offer list, a persist flag, and a settings panel. Optional PR1 may add a **static career word** to existing dest Offers. Digit 0 stays Shipyard. Digit 8 stays Launch (dock) / hull 5 (Hangar) / launcher papers (Outfitter). Digit 9 stays Standing / hull 6 / turret papers. No Blocker or Major remains open in this freeze.

### Verdict
**CLEAN.** 0 blockers, **0 majors**, 3 minors, 3 suggestions.

Worker residual “No Blocker or Major remaining” is **correct**. Digit 0/8/9 theft, a second Offer list, `innerHTML` dest copy, and a persist/settings panel are **fail-closed** in merge law. They are not proposed chrome.

### What's done well

- Dock Digit **0** still selects Shipyard: `DOCK_KEY_SERVICES` last key, labels include Shipyard, `KeyY` still works (`station.js` 186, 5801–5805, 5917–5922). Contract forbids a new `DOCK_KEY_SERVICES` key (`shared-contract.md` §0.6). Brief: Digit 0 stays Shipyard (`Bio02CareerDesign.md` 36, 117, 164, 216).
- Dock Digit **8** is Launch (index 7). Digit **9** is Standing / `epics` (index 8). A new Career row in that array would shift both, or steal Digit 0 if appended as last. Freeze: **no new Digit**, no mid-list tab (`shared-contract.md` §0.6, §3).
- Hangar Digit **1** / **2** stay panes. Digit **3+** and Hangar Digit **0** still Mount (`shipyard-desk.js` 18–20, 143–151, 469–496). Digit **8** on Hangar is hull index 5. Digit **9** is hull index 6. Train Offers are click `Offer {dest}`, **not** a Digit (`426–434`). Career chrome, if any, copies that click Offer (`shared-contract.md` §0.6; `Bio02CareerDesign.md` 131).
- Outfitter stays Digit **6**. Live Digit **8 / 9** there arm launcher / turret papers (`station.js` 5976–5986). Kit mutate **omit** — player already buys scanner / mining / concealed / racks at Outfitting (`Bio02CareerDesign.md` 118, 133; `shared-contract.md` §2.2). No second Hangar Offer column of kits.
- Live dest Offers already sit **under** the hull loop as full-width `shipyard-buy-row` (`shipyard-desk.js` 426–435). Pending Confirm **replaces** the list (`376–395`). PR1 may add a **word** to those dest rows, not a side column (`shared-contract.md` §2.3; worker U3).
- Confirm hop is `{from} → {dest}` via `classLabel` + `hasOwnProperty` (`shipyard-desk.js` 376–385). Dest on Confirm is the **key** from `livingTrainDests`, never a parsed career word (`shared-contract.md` §2.3).
- Hostile Bloom paints `No sale.` with **no** Offer (`trainPaint` 221–222). Short credits keep Offers; Confirm refuses `Not enough credits.` Color is not the only cue.
- Cargo-keep stays a sibling `screen-note` (`TRAIN_CARGO_NOTE`, `386`). Reduced-motion: freeze is copy only; no extra pulse (`Bio02CareerDesign.md` 255).
- Copy host is `h()` `textContent` (`station.js` 4302–4306). Overlay clear is `overlay.textContent = ''` (`5787`). `shipyard-desk.js` has no `innerHTML`. Hull `name` may ride `textContent` only (`shared-contract.md` §0.9).
- Buttons are `type="button"` (`station.js` 4309–4313). Confirm papers (warm) before Esc — Cancel. `.screen-btn:focus-visible` outline already exists (`screens.css` 89–99).
- `ui.trainPending` is session chrome. Same cancel sites as graft: Esc, Back, `selectService`, dock, undock, leave Hangar pane (`station.js` 5817–5823, 5846–5854, 5859–5873, 5893–5901, 5930–5941; `shipyard-desk.js` 104–132). Do not persist `careerPending` (`shared-contract.md` §0.7).
- Persist stays `WORLD_FIELDS.hangar` only (`save.js` 76–101). No career key. No `localStorage` kill-switch. No settings panel (`Bio02CareerDesign.md` 261). HUD never writes `hullKind`. `HAIR_CAREER` is inset 18, not a flag (`hud.js` 80–88, 101; `shared-contract.md` §0.8, §2.3).
- Notice already has `aria-live="polite"` (`station.js` 5833–5836). Career freeze adds no HUD pip.

### Findings

#### 🔴 Blocker

None remaining. Digit 0/8/9 theft, a second kit Offer list, `innerHTML` dest copy, and a persist/settings panel are forbidden in merge law and are **not** in the proposed PR1 surface.

#### 🟠 Major

None remaining.

Closed this pass (Blocker-class if a later serial undoes the freeze):

- **Digit 0 / 8 / 9 theft.** Dock 0 Shipyard, 8 Launch, 9 Standing. Hangar 0 last hull, 8/9 hulls 5–6. Outfitter 8/9 launcher/turret. Career is Hangar click Offer like train. Never a new `DOCK_KEY_SERVICES` key.
- **Second Offer list / kit mutate.** Omit. Outfitter Digit 6 already sells the kits. Successor kit papers (if an owner file opens §2.2) stay click Offer, no Digit, no new UU.
- **Named dest XSS.** Confirm dest is `livingTrainDests` key + `hasOwnProperty(SHIP_CLASSES)`. Career words are static literals. No `innerHTML`. Do not interpolate `row.name` into Confirm. Do not parse the Offer label back into a dest.
- **Persist / settings panel.** Hangar row only. No `WORLD_FIELDS.career`. No `localStorage`. No feature-flag chrome. No HUD `HAIR_CAREER` bind.

#### 🟡 Minor: Steal-map copy names 0 / 3+ / 5 / 6, not dock 8 / 9

**Location:** `docs/Bio02CareerDesign.md` 65; `out/w101/career/shared-contract.md` §0.6; `out/w101/career/ui-audit.md` U1; live `station.js` 186, 5801–5814, 5917–5926, 5976–5986; `shipyard-desk.js` 143–151, 487–496
**Issue:** Pain points and worker U1 list Career Digit steal as Shipyard (0), hull 3+, Repair (5), Outfitting (6). They do not name dock Digit **8** Launch, Digit **9** Standing, Hangar Digit **8 / 9** Mount, or Outfitter Digit **8 / 9** papers. Blanket law still says no new Digit, so this is not an open Blocker. A naive PR1 that reads the pain-point list as the full map could still bind Offers to 8/9 “because those were not listed.”
**Fix:** PR1 (and PR3 pins) treat Digit **8** and **9** as occupied on dock, Hangar, and Outfitter. Do not add a Career Digit. Do not bind dest Offers to 8/9. Optional: one sentence in the successor pin that names Launch / Standing / hull 5–6 / launcher-turret.

#### 🟡 Minor: Career words lengthen five dest Offers

**Location:** `shipyard-desk.js` 223–231, 426–434; `shared-contract.md` §2.3; `Bio02CareerDesign.md` 131
**Issue:** A living hull already lists up to five dest cards under up to eight hull rows. Live Offer copy is `Offer {dest}` (the key). PR1 may append a short word (`combat`, `hunter`, `trade`, `explore`, `capital`; `cutter` stays `cutter`). Long labels on both the hop name **and** the button bury Mount and fight the 560 px panel. Confirm hop must stay `{from} → {dest}` **keys**. Printing `light → combat` would teach a fake dest.
**Fix:** One extra word on the Offer **button** or meta only (`Offer heavy · combat`). Keep Confirm name as `classLabel` keys. Keep words in the contract table. Do not print mining/stealth as two `cutter` Offers — career there is Digit 6 loadout.

#### 🟡 Minor: Dead `TRAIN_HEAVY_NOTE` still sits in the desk

**Location:** `shipyard-desk.js` 94; `shared-contract.md` §2.3; `out/w101/career/ui-audit.md` U6
**Issue:** Live paint never uses this line. Wave 94 trains to any other living key. If PR1 shows it on `frigate` / `ace`, the desk lies.
**Fix:** Contract already forbids revival as dest-stop law. PR1 must not paint it. Leave the unused string unless a later desk cleanup owns it.

#### 💡 Suggestion: Do not add a Career legend line until labels ship

**Location:** `shipyard-desk.js` 457–459
**Issue:** Beautiful Hangar already appends `Train on Hangar · Esc cancels papers`. A Career legend with no labels is clutter.
**Fix:** Keep the live Train legend. Add a career word to that line only if PR1 ships labels. Do not add a Digit.

#### 💡 Suggestion: Successor kit mutate must not add a second Offer column

**Location:** `shared-contract.md` §2.2; live `renderHangarPane` hulls + graft + dest loop
**Issue:** Worker freeze omit is the right Hangar density call. If a successor owner file opens one-confirm kit papers, a six-row kit list beside five dest Offers would bury Mount (worker U3).
**Fix:** Until that owner file exists, omit. If opened: one click Offer, pending **replaces** the list (train/graft pattern), debit = sum of live outfitter integers, writer = `writeMountedGear` only, no `classKey` write, no Digit.

#### 💡 Suggestion: Career word map is literals; dest stays the Offer object

**Location:** `shared-contract.md` §2.3, §0.9, §0.14; `setTrainPending` `shipyard-desk.js` 234–247
**Issue:** Parsing `Offer heavy combat` back into a dest, or concatenating `row.name` into Confirm, is the XSS / dest-confusion hole this freeze exists to kill. Live pending already stores `destClass` from `livingTrainDests`.
**Fix:** PR1: `hasOwn` dest key → static word. Click handler still passes `offer.destClass`. Confirm still `classLabel`. Hull `name` only via existing `textContent` on Mount rows.

### Keyboard (later PR1 must keep)

- Level 1 Digit **0** / `KeyY` → Shipyard. Digit **8** Launch. Digit **9** Standing. Unchanged.
- Digit **1** Hangar, Digit **2** Yard.
- Digit **3+** and Hangar Digit **0** Mount. Digit **8 / 9** on Hangar still hulls. No-op while `trainPending`.
- Train / career Offers: click or Tab onto `btn()`. **No** dest Digit.
- Esc cancels papers, then Back. KeyB undock nulls `trainPending`.
- Outfitter Digit **6** kits; Digit **8 / 9** launcher / turret. Career does not steal them.
- Undocked weapon digits stay behind `ui.open`. Digit **5** dock Repair / undocked psionic stay.

### Checks

- [x] Digit 0 Shipyard unchanged (no Career dock service)
- [x] Digit 8 Launch / Hangar hull / Outfitter launcher unchanged
- [x] Digit 9 Standing / Hangar hull / Outfitter turret unchanged
- [x] Digit 1 Hangar / Digit 2 Yard unchanged
- [x] Digit 3+ hull Mount unchanged
- [x] Kit mutate omit (no second Offer list)
- [x] PR1 labels ride existing dest rows; Confirm hop stays keys
- [x] Hostile `No sale.`; short credits keep Offer
- [x] No `innerHTML`; `h()` `textContent`
- [x] Dest is `livingTrainDests` key, not a parsed career word
- [x] No new persist / `localStorage` / settings panel
- [x] HUD never writes `hullKind`; `HAIR_CAREER` not bound
- [x] No new overlay / z-index / extra pulse

### Closed vs worker ui-audit

- **U1** Career Digit steal — **closed** in freeze; this pass also names Digit **8 / 9** (worker listed 0 / 3+ / 5 / 6 only). Residual: Minor steal-map copy.
- **U2** Six named career hulls as new class chrome — **closed**. Words on existing dest keys.
- **U3** Hangar kit papers crowding dests — **closed**. Kit mutate omit.
- **U4** HUD career family / `hullKind` write — **closed**.
- **U5** Five dest Offers + longer labels — still **Minor** (accepted for later serial).
- **U6** Dead `TRAIN_HEAVY_NOTE` — still **Minor** (do not revive).

### Residual after this audit

Three minors (steal-map omits 8/9 in the pain-point list; Offer label length; dead heavy note). Three suggestions (legend, successor kit column, literal dest map). None block the Wave 101 markdown freeze. PR1 must not undo Digit 0/8/9 occupancy or add a second Hangar Offer list.
