# UI Audit: remaining TGT leftover (Wave 122 CONSUME)

**Auditor:** `[designer]` (independent of `out/w122/tgtrest/ui-audit.md`)
**Scope:** Wave 122 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: remaining TGT after named TGT-01…TGT-05 is **gone**. Specified later UI: **none**. Named serial: **none**. Name: **no remaining TGT leftover.**
**Review file:** `out/w122/designer/tgtrest-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Tgt06RemainingTgtDesign.md`, inventory `out/w122/tgtrest/current-tgt-remaining-inventory.md`, merge law `out/w122/tgtrest/shared-contract.md`, worker self-audit `out/w122/tgtrest/ui-audit.md` (read, not copied). Live cites: `src/systems/hud.js`, `src/ui/hud.css`, `.rw-contacts` / empty hub only as needed; also `src/game/npc-fire-toast.js`, `src/game/contacts-gate.js`, `src/game/reticle-aim.js`, `src/systems/controls.js`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w122/tgtrest/shared-contract.md` wins if the brief forks. This wave does not ship targeting chrome. Findings bind **later workers**: do not invent a hub PPI, an aim-glass gauge, a second incoming live region, a new Digit, or a leftover TGT-06 serial while named slices already paint the jobs.

## UI Audit: remaining TGT player-facing targeting (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**. Live HUD already ships lead, RANGE, MATCH, scanner-gated `.rw-contacts`, lock `.rw-edge-arrow`, DIST+CLOS, ENGINE bar, Incoming dart./fire. toasts, and KeyV lock cats. Census against live code holds. CONSUME does **not** hide a real targeting a11y hole. Freeze does **not** schedule hub theft or aim-glass gauges. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 3 minors (accepted; not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- Empty 80 px hub stays empty of radar, CLOS, ENGINE, and incoming chrome (`.rw-reticle` `hud.css` 184–193; clamp `hud.js` 1293). Contacts sit `bottom: 5.5%`, `width: min(400px, 46vw)` (`hud.css` 787–796). Combat rails sit off-column (`hud.css` 885–904; DIST/CLOS `hud.js` 937–942).
- Color is not the only cue: MATCH **word** (`hud.js` 356, 1896–1900), RANGE **word** (`hud.js` 781; `hud.css` 207–219), CLOS **signed number** (`hud.js` 291–296, 2148–2151), contact **shape** tick/chevron/diamond (`hud.js` 405–408; `hud.css` 826–850), FORE/AFT **words** (`hud.js` 375–400), toast **English** (`npc-fire-toast.js` 8–9).
- Incoming dart/fire ride the existing HUD-04 stack: `.rw-toasts` `role=status` `aria-live=polite` (`hud.js` 844–847). Show writes `aria-hidden=false` then `textContent` (`1209–1211`). Expire restores `aria-hidden=true` (`1238–1243`). No `aria-live=assertive` under `src/`.
- Contacts wrap and SVG stay `aria-hidden=true` (`hud.js` 877–882). Edge-arrow stays `aria-hidden=true` (`816–817`). Pictures, not live regions. Contract §5 matches live.
- Jump/dock park hides the same `.rw-contacts` (`contacts-gate.js` 18–19; `hud.js` 1497–1501) and the lock arrow (`hud.js` 1418–1420). `#hud .is-hidden` is `display: none` (`hud.css` 36). Scanner 0 hides the arc only; DIST/CLOS/lead/MATCH stay core (`hud.js` 1494–1495).
- Off-glass **ship** lock still paints the tgt rail (`shipTgt` `hud.js` 1316–1321, 2130–2163). AT still gets name, DIST, CLOS, ENGINE without the triangle.
- KeyT / KeyV / KeyK / KeyX stay distinct (`controls.js` 44, 296–318). Digit 0/8/9 are not targeting keys. Cone 12 px (`reticle-aim.js` 15, 321).
- Reduced-motion already kills HUD animation (`hud.css` 1184–1189) plus contacts enter (`873–875`). Mk II «/» is text (`hud.js` 1603–1606). Contract §0.15 forbids a leftover radar-sweep keyframe.
- `el()` uses `textContent` (`hud.js` 283–288). `innerHTML` in `hud.js`: none. Toast and lock copy stay text.
- Worker self-audit agrees: leftover gone; do not add PPI / hub gauge / second incoming region. This pass agrees independently.

### CONSUME steal check (Blocker if the freeze scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| Hub PPI / radar pip | Brief Overview + Goals 4; contract §0.2 / §0.9; serial **none** | No `PPI` / `.rw-ppi` under `src/` | **Pass.** Not scheduled. |
| Aim-glass gauge / extra hub dial | Contract §0.2; inventory §5 | Reticle children: pupil, 3 cilia, RANGE word (`hud.js` 778–781). RANGE is a pop, not a dial (`hud.css` 207–219) | **Pass.** Not scheduled. |
| Second incoming-fire live region / assertive | Contract §0.9 / §5 | One toast polite stack (`hud.js` 844–847). Banner/nav live are **siblings**, not incoming | **Pass.** |
| Incoming **gauge** | Inventory §5; WAVE omit | Toast copy only (`npc-fire-toast.js` 47–64) | **Pass.** |
| Second `.rw-contacts` / `.rw-radar` | Contract §0.11 | One wrap (`hud.js` 877) | **Pass.** |
| Second edge-arrow class / NAV-02 steal | Brief pain; inventory §8 | `.rw-edge-arrow` `816–817` vs `.rw-nav-gate-cue` `818–822` | **Pass.** Keep split. |
| New Digit / KeyT V K X steal | Contract §0.3 | Digit 0 shipyard honor; TRACKED keys unchanged | **Pass.** |
| `innerHTML` lock names | Contract §0.4 | `textContent` / `el()` | **Pass.** |
| Persist CLOS / part / MATCH | Contract §0.6 | Session only | **Pass.** |
| HUD-02 `classKeyToken` restyle leftover | Contract §0.10 | Cite only (`hud.js` 102–108) | **Pass.** |
| HUD-04 linger retune | Contract §0.10 | 5 slots, 8 s linger (`hud.js` 63–66) | **Pass.** |
| Pause sim for targeting | Contract §0.7 | Never | **Pass.** |

If a later worker adds a hub PPI, an aim-glass gauge, a second incoming live region, or a leftover TGT-06 serial while these surfaces exist, that **violates this freeze** and is a Blocker then. This pack does **not** schedule that work. Serial plan: **PR1 remaining TGT does not exist** (`docs/Tgt06RemainingTgtDesign.md` 149–151; contract §2).

### Does CONSUME hide a real targeting a11y hole?

**No.** Player-facing targeting jobs already have an AT path or an owner-frozen picture.

| Job | Sighted instrument | AT / keyboard path | Hole leftover? |
|---|---|---|---|
| Nearby traffic (“radar”) | `.rw-contacts` picture, scanner-gated | Arc is `aria-hidden`. Ship lock still has tgt-rail name/DIST/CLOS. KeyT cycles ships. PPI omit | **No.** Picture + rail. Adding radar speech would be a second live region. |
| Off-glass lock | `.rw-edge-arrow` `aria-hidden` | **Ship:** tgt rail stays (`hud.js` 1318–1321). **Kind lock:** bracket hides off-glass; triangle is visual only (TGT-05 standing) | **No.** Do not add lock-bearing speech as leftover. |
| Incoming fire / dart | Toast English | Same polite stack unhides chip (`hud.js` 1209–1211). 2.5 s gap (`npc-fire-toast.js` 10–11) | **No.** Do not add assertive or a second region. |
| DIST / CLOS | Tgt rail labels + signed rate | Text nodes, tabular CLOS (`hud.css` 914–916). Scanner does not gate | **No.** |
| MATCH | `MATCH` word on SPD | Word, not color-only (`hud.js` 356) | **No.** |
| RANGE | Ring weight + RANGE word | Word (`hud.css` 207–219) | **No.** Do not invent a hub gauge. |
| ENGINE part | Bar + `is-part` amber label | KeyK. Label still **ENGINE**. Color is extra (see Minor) | **No leftover PR.** Standing TGT-03. |
| KeyV cats | Cone 12 + bracket | KeyV / KeyT. On-glass bracket name is text | **No.** |

Wishlist TGT-03 candidate names (radar / arrows / attacker / closure / missile / subsystem / lead) are **stale vs code**. Treating them as missing chrome would invent work. Code wins.

Standing omit (PPI, aim-glass gauges, incoming gauge, salvage `lockKind`) is **not** an a11y hole this leftover may fill.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Lead + RANGE | Ungated (`hud.js` 1387–1407, 1457–1468) | TGT-01 landed | **Must not** retune as leftover |
| MATCH + KeyX | Lamp + flag (`hud.js` 356, 1896; `controls.js` 308–309) | TGT-02 landed | **Must not** add a second lamp |
| `.rw-contacts` | Scanner gate + jump park | TGT-03 arc + radar | **Must not** add PPI / second class |
| `.rw-edge-arrow` | Park dock/jump; `aria-hidden` | TGT-03 awareness | **Must not** merge with NAV-02 cue |
| Incoming dart./fire. | HUD-04 polite chips | Toast live; gauge omit | **Must not** add a second incoming region |
| DIST + CLOS | Tgt rail | TGT-03 CLOS core | **Must not** double CLOS or persist rate |
| ENGINE + KeyK | `.rw-engine-tgt` `is-part` | Wave 100 engine only | **Must not** add hull/screen as leftover |
| KeyV cats | Cone 12; station/gate/pod/landmark | TGT-05 | **Must not** add salvage kind |
| Empty hub | 80 px | HUD-01 | **Must not** add a radar pip or gauge |
| Toasts | 5 slots, linger 8 s | HUD-04 sibling | **Must not** retune linger |

### Accessibility / theming / states (live HUD, static)

| Check | Result |
|---|---|
| Contrast / tokens | Targeting chrome uses `--cyan` / `--amber` / `--dim` / `--white`. Contrast restyle already hits contacts stroke (`hud.css` 877–878). HUD-03 KeyO is sibling — do not restyle leftover by class. |
| Keyboard | KeyT/V/K/X remain. Contacts, edge-arrow, lead, rails: `pointer-events: none` (`hud.css` 191, 529, 795, 895). Correct: not controls. |
| Names | Visible English on RANGE, MATCH, DIST, CLOS, ENGINE, Incoming dart./fire. Contact pips have **no** names (picture). |
| Focus | Targeting pictures are not focus targets. Automine rock button is existing mining chrome, not leftover. |
| Semantic HTML | Toast root `role=status`. Contacts/edge `aria-hidden`. Tgt rail is a `<section>` without a leftover name (HUD-01 standing). |
| Empty | Scanner 0 / dock / jump: arc `is-hidden`. No lock: tgt rail `is-hidden` (`hud.js` 1321). Hidden chips `aria-hidden`. |
| Error | Incoming is warn-class toast + words. Fail-closed: unknown `lockKind` drop; parked jump hides fire toast (`npc-fire-toast.js` 61). |
| Disabled | N/A for pictures. |
| Loading | No spinner. Do not add one. |
| Hover | Not required. |
| Reduced motion | Existing HUD kill + contacts enter kill. Do not add a sweep. |
| Responsive | Contacts `min(400px, 46vw)`. Rails `min-width: 168px` off reticle ±78 px. Toasts top-right, off glass (`hud.css` 635–646). |
| Hub | 80 px stays empty of targeting leftover chrome. |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Contacts arc and edge-arrow are `aria-hidden`

**Location:** `src/systems/hud.js:816-817`, `877-882`

**Issue:** Sighted players get bearing + off-glass lock triangle. AT does not hear the arc or the triangle.

**Why it is not leftover:** Owner froze contacts and the lock arrow as pictures, not live regions (`shared-contract.md` §5). Incoming fire already announces on the toast stack. Off-glass **ships** still expose name/DIST/CLOS on the tgt rail (`hud.js` 1316–1321, 2130–2151). Adding assertive radar or lock-bearing speech would fight HUD-04 “no second incoming live region” and contract §0.9.

**Fix:** Do **not** name TGT-06 PR1. Owner may file a later a11y idea in the inbox (other worker).

**Status:** accepted — not leftover; CONSUME stands.

#### 🟡 Minor: RANGE in-range uses `display` + ring weight

**Location:** `src/ui/hud.css:195-219`; `src/systems/hud.js:1457-1468`

**Issue:** In-range is a thicker ring plus the RANGE word (`display: none` until `.in-range`). Color-blind still has the word.

**Why it is not leftover:** TGT-01 already ships the word. A hub dial would steal HUD-01 empty glass. HUD-03 KeyO remap is sibling.

**Fix:** Do not invent an aim-glass gauge.

**Status:** accepted — not leftover; CONSUME stands.

#### 🟡 Minor: ENGINE selected-part cue is label color

**Location:** `src/ui/hud.css:910-912`; `src/systems/hud.js:2159-2162`

**Issue:** `is-part` sets `.rw-label` to `--amber`. The word stays **ENGINE**. Color-blind KeyO remaps amber, but the selected vs idle state is still color, not an extra word.

**Why it is not leftover:** Wave 100 already shipped KeyK + ENGINE bar. Adding “SEL” / a second bar would be subsystem polish, not remaining TGT leftover. Keyboard KeyK remains the control.

**Fix:** Do not name leftover PR1. Do not add hull/screen as leftover.

**Status:** accepted — not leftover; CONSUME stands.

#### 💡 Suggestion: Keep NAV-02 gate cue off the lock arrow

**Location:** `src/systems/hud.js:816-822`

**Issue:** Two chevrons exist (lock vs route). Merging them would mix jobs and steal NAV-02.

**Fix:** Keep split. Inventory §8 already walls this.

**Status:** already frozen.

#### 💡 Suggestion: Contract “later impl” formulas are live copy, not a PR

**Location:** `out/w122/tgtrest/shared-contract.md:77-86`; `docs/Tgt06RemainingTgtDesign.md:149-151`

**Issue:** A naive later worker can read “Formulas (later impl)” as permission to ship a second picture.

**Fix:** Obey the same block: leftover CONSUME; **do not implement**. Serial **none**. Re-open a **named** slice only if that instrument disappears from `src/`.

**Status:** freeze already says do not implement.

### Census cite check (code wins; shorthand paths)

| Claim | Live | Notes |
|---|---|---|
| Lead + LEAD label | `hud.js` 813–815 | Match |
| RANGE pop | `hud.js` 781, 1457–1468; `hud.css` 207–219 | Match |
| Edge-arrow + park | `hud.js` 816–817, 1418–1420 | Match |
| Contacts wrap + gate | `hud.js` 876–878, 1497–1501; `contacts-gate.js` 18–19 | Match |
| DIST + CLOS | `hud.js` 937–942, 2143–2151 | Match |
| ENGINE `is-part` | `hud.js` 934, 2159–2162 | Match |
| MATCH lamp | `hud.js` 356, 1896–1900 | Match |
| Incoming toast route | `hud.js` 649–654; `npc-fire-toast.js` 8–64 | Match |
| Empty hub 80 px + clamp | `hud.css` 184–193; `hud.js` 1293 | Match |
| Toast polite stack | `hud.js` 844–847, 1209–1211 | Match |
| KeyV cone 12 | `reticle-aim.js` 15, 279–310, 321 | Match |
| `innerHTML` hud.js | none | Match |
| PPI class | none under `src/` | Match |
| Reduced motion | `hud.css` 1184–1189 | Match |

None of the cites reopen leftover. Inventory line numbers hold on this census date.

### Visual hierarchy

Hub empty → lead/RANGE on glass → rails DIST/CLOS/ENGINE off-column → contacts bottom → toasts top-right. CONSUME keeps that split. A PPI or aim-glass gauge would flatten hierarchy onto the 80 px hub.

### Worker self-audit

`out/w122/tgtrest/ui-audit.md` is accurate on CONSUME, leftover gone, contacts/edge `aria-hidden` as not leftover, and “do not add a hub PPI / incoming gauge / second arrow class.” Independent live read agrees. ENGINE `is-part` color is an extra documented minor; it does not reopen leftover. Do not copy that file as the designer record; this file is the parent `[designer]` pass.

### Verdict close

**CONSUME freeze is the UI-correct outcome.** Remaining TGT leftover is gone. Named slices already paint the jobs. Do not add a hub PPI, an aim-glass gauge, a lock box, or a second incoming live region.
