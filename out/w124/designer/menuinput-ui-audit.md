# UI Audit: CTL-04 remaining station-menu input (Wave 124 designer)

**Auditor:** `[designer]` (independent of `out/w124/menuinput/ui-audit.md`)
**Scope:** Markdown-only leftover freeze. No `src/` UI this wave. Live WPN meter + station Digit labels are **current-state evidence**. Silent WPN change while Repair / Feed is the leftover. No new chrome is OK if WPN simply stops changing.
**Review file:** `out/w124/designer/menuinput-ui-audit.md`
**Pack:** `docs/Ctl04MenuInputDesign.md`, merge law `out/w124/menuinput/shared-contract.md`, worker self-audit `out/w124/menuinput/ui-audit.md` (read, not copied). Inventory cite-only: `out/w124/menuinput/current-ctl04-menu-input-inventory.md`.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites only: `src/systems/controls.js`, `src/systems/station.js`, `src/systems/hud.js`, `src/systems/hail.js`, `src/systems/overlay-policy.js`, `src/ui/screens.css`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits; pack files not rewritten)

Merge law: `out/w124/menuinput/shared-contract.md` wins if the brief forks. Later serials obey the contract. Findings bind **later workers**: skip Digit1–5 → `weaponGroup` while a play surface owns those digits; do not steal Digit 0/8/9; do not remap in-flight 1–5; do not invent hail-card chrome; do not paint “not available”.

## UI Audit: station-menu Digit vs WPN rail (design-only)

### Summary

No product chrome ships this wave. The leftover is **real**: docked Digit4 Feed and Digit5 Repair still write `input.weaponGroup`, so the live WPN rail silently becomes `4 · —` or `5 · Psionic bolt`. The freeze is a **silent non-change** of that rail after later PR1, not a new overlay. Digit 0/8/9 stay station. Digit 1–5 stay weapons in open-space flight. Hail Digit overlap is **cited**, not redesigned. Keyboard: docked menu digits must not also change WPN. 0 blockers. 0 majors.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted tradeoffs), 2 suggestions. Approve the spec for later PR1 **if** the skip lands only in `controls.js` Digit1–5, WPN copy does not grow “not available”, and Digit 0/8/9 stay out of controls.

### What's done well

- Player-facing fix is **stop the lie**, not extra chrome. Brief Player outcome (`docs/Ctl04MenuInputDesign.md` **243–247**): tap **5**, Repair opens, WPN does not change; tap **4**, Feed opens, WPN does not become `4 · —`. Contract §0.14 forbids “not available”. Worker self-audit agrees. That is the correct picture.
- Live station already names keys in text, so color is not the only cue: `4 — Feed & tend`, `5 — Repair`, legend `1-9, 0 select service · Esc/B launch` (`station.js` **6034–6047**).
- Live WPN rail already prefixes the group: `weaponHudLabel` returns `4 · —` / `5 · —` / `g · name` (`hud.js` **255–273**). Self rail is `WPN` + `rw-value` (`hud.js` **926–927**, **1940–1941**). After PR1 the prefix stays honest because the value **does not rewrite**.
- Digit map freeze matches live dock root: Digit 0 shipyard, Digit 8 launch, Digit 9 Standing (`station.js` **188**, **6034–6037**, **6169–6177**). Outfitting papers stay Digit **8/9**, not weapon groups 1–5 (`station.js` **6248–6250**). Contract §0.2 / brief Honor: **do not steal**.
- In-flight 1–5 stay WPN. TRACKED is Digit1–5 only (`controls.js` **41–48**). Help already names `1/2/3/4/5 — weapon group` (`controls.js` **378**). Open-space assign stays (`controls.js` **329–344** gated later). Do not remap.
- Hail overlap is a **cite**, not a new hail card. Live comment `hail.js` **431–432**: Digit1–3 also switch groups. Buttons already keep `[n]` + verb (`hail.js` **416**). Contract §0.5 / brief Non-goals: hail-demand lifecycle out of scope. Skip `flags.hailOpen === true`; hail still **resolves**.
- Keyboard freeze is skip-in-switch, not a trap: station 1–9/0 stay reachable (`station.js` **6156–6177**). Esc/B launch stay (**6161–6166**, **6047**). PR1 does not `stopImmediatePropagation`. Digit-in-field skip reuses typing / `playSurfaceBlocked` / `shouldSkipDockPulse` (`overlay-policy.js` **72–91**; `controls.js` **68–82**).
- HUD-01 empty 80 px hub stays empty. Aim-glass gauges stay off. No WPN pip on the reticle. No new CSS. `innerHTML` forbidden later. `reducedMotion` n/a (no new motion).
- Fail-closed never blanks the sim: missing `flags.docked` flies as not-docked; skip never throws (contract §0.12 / §2). Empty group copy stays `—`, not a spinner (`hud.js` **259**, **267**).
- Worker self-audit did **not** skip with “not available”. It did **not** demand a docked WPN picker. Independent designer record agrees; do not copy that file as this record.

### Live current-state evidence (the leftover)

Inbox repro is **live in chrome**, not stale copy.

| Surface | Live paint / bind | What the player sees today | Cite |
|---|---|---|---|
| Dock root Digit4 | `4 — Feed & tend` | Feed opens **and** WPN becomes group 4 | `station.js` **188**, **6034–6037**; `controls.js` **338–340** |
| Dock root Digit5 | `5 — Repair` | Repair opens **and** WPN becomes group 5 | `station.js` **6034–6037**; `controls.js` **342–344** |
| Station overlay | `.screen-overlay` z 20 scrim | Looks modal; digits still reach flight handlers | `station.js` **4430**; `src/ui/screens.css` **8–16** |
| Station legend | `1-9, 0 select service · Esc/B launch` | Menu owns 0–9 in copy | `station.js` **6047** |
| Digit 0 / 8 / 9 | Shipyard / Launch / Standing | Stay station; controls does **not** TRACK them | `station.js` **6169–6177**; `controls.js` **41–48** |
| WPN rail | label `WPN` + `weaponHudLabel` | `4 · —` empty group; `5 · —` or `5 · ` + psionic name | `hud.js` **255–273**, **926–927**, **1940–1941** |
| Flight help | `1/2/3/4/5 — weapon group: …` | True in open space; **false as exclusive** while docked | `controls.js` **378** |
| Hail `[n]` | `[idx+1] verb` + Digit1–3 overlap comment | Hail resolve **and** WPN write | `hail.js` **416**, **431–432** |
| Combat docked | weapons cold | Player may miss the WPN rewrite until undock | inventory / `combat.js` (cite-only) |

**Today (must not keep after PR1):** station bubble maps Digit4/5 to Feed/Repair and does **not** stop the event (`station.js` **6156–6177**). Controls bubble then assigns `weaponGroup` with **no** `flags.docked` test (`controls.js` **329–344**). HUD paints the new group. That silent WPN change **is** the leftover.

**After PR1 (freeze):** same station labels, same WPN widget, same flight help. Digit1–5 **do not assign** `weaponGroup` while `flags.docked === true` (and hail / play surfaces per contract §0.1). No new chrome required.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Silent WPN on Repair / Feed | Digit5 / Digit4 write group (`controls.js` **338–344**) | Brief Player outcome **243–247**; contract leftover | **Must** skip write; station service still opens |
| WPN chrome | `.rw-combat-wpn` + `weaponHudLabel` (`hud.js` **255–273**, **926–927**) | No new widget; no “not available” (§0.14) | **Must not** add disabled copy or overlay |
| Digit 0 | shipyard (`station.js` **188**, **6171–6173**) | §0.2 / §0.11 | **Must not steal**; **must not** add Digit0 to controls |
| Digit 8 dock root | launch (`station.js` **6034**, **6169–6177**) | §0.2 | **Must not steal** |
| Digit 9 dock root | Standing / epics | §0.2 | **Must not steal** |
| Outfitting 8/9 | arm papers (`station.js` **6248–6250**) | Not weapon-group 1–5 | **Must not** treat 8/9 as WPN |
| Digit 1–5 open space | unconditional assign (`controls.js` **329–344**) | Stay WPN | **Must not skip** with no overlay |
| Hail cards | `[n]` + overlap comment (`hail.js` **416**, **431–432**) | Cite; skip WPN write; do not design cards | **Must not** restyle hail; **must not** stop hail resolve |
| Keyboard docked | station 0–9 + Esc/B (`station.js` **6047**, **6156–6166**) | Menu digits must not also change WPN | Skip in Digit switch; **no** `stopImmediatePropagation` default |
| HUD-01 hub | empty 80 px; no WPN pip | Honor | **Must not** add a hub child |
| `innerHTML` | skip uses flags + `e.code` | §0.9 | **Forbidden** on WPN / help |
| `reducedMotion` | n/a | §0.13 | **Must not** invent a settings checkbox |
| `fireHeld` | chart conjunct only | PR2 optional, not Digit switch | **Must not** stuff into PR1 |

If later PR1 only skips `input.weaponGroup` on Digit1–5 when docked / hailOpen / `hailDigitsAllowed === false` / playSurface / typing / title / models, and does not paint new copy, this freeze holds.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): WPN rail lies while Repair / Feed own Digit4–5

**Location:** `src/systems/controls.js:329–344`; `src/systems/hud.js:255–273`, `926–927`, `1940–1941`; `src/systems/station.js:6034–6037`
**Issue:** Player taps **5 — Repair**. Station opens Repair. Controls also sets group 5. Rail becomes `5 · ` + psionic name, or `5 · —`. Player taps **4 — Feed & tend**. Rail becomes `4 · —` (empty group, cannot fire after undock). Combat is cold while docked, so the change is **silent**. That is the P1 leftover. A later worker that CONSUMEs this or remaps station 4/5 would leave the lie or break painted labels.
**Fix landed (markdown):** PR1 `shouldSkipWeaponGroupDigits` when `flags.docked === true`. WPN stays at the pre-dock group. Station service still opens. No new WPN overlay.
**Status:** closed in contract §0.1 / brief Player outcome. Do not reopen as CONSUME. Do not “fix” with chrome.

#### 🟠 Major (closed in freeze): extra chrome / “not available” as the skip cue

**Location:** contract §0.14; `docs/Ctl04MenuInputDesign.md:201`, **237–238**; `src/systems/hud.js:255–273`
**Issue:** A later worker could paint `5 · not available` or a disabled WPN widget while docked so the player “understands” the skip. That is extra chrome. It also lies: the live group is still the old group, not a missing weapon.
**Fix landed:** No new copy. The rail **does not change**. Station legend already teaches menu digits (`station.js` **6047**). Digit prefix in `weaponHudLabel` stays the non-color cue.
**Status:** closed. UI audit must not skip with “not available”. No new chrome is OK.

#### 🟡 Minor: Player cannot change WPN while docked

**Location:** `out/w124/menuinput/shared-contract.md:91–94`; `docs/Ctl04MenuInputDesign.md:204`; `src/systems/station.js:6248–6250`
**Issue:** After PR1, docked Digit1–5 never retarget weapons. A combat-first player may want to pre-select cannon before undock. Level-2 Feed still uses Digit1–3 for biomass / rock / tend (`station.js` **6235–6238**); Repair Digit1 is repair-all (**6239–6240**). Those stay station verbs. They must not write WPN either (`flags.docked` remains true).
**Fix:** That is the point of the inbox. Outfitting still uses Digit 8/9 papers, not groups 1–5. Owner may override after playtest. Do not park. Do not add a docked WPN picker.
**Status:** accepted — documented tradeoff, not a missing widget.

#### 🟡 Minor: Hail Digit1–3 still look like weapon keys in the CONTROLS list

**Location:** `src/systems/controls.js:378`; `src/systems/hail.js:416`, **431–432**
**Issue:** Flight help still says 1–5 are weapon groups. Hail buttons also number 1–n. After PR1 the **write** is scoped; the help line stays flight-true. Overlap is **cited** (`hail.js` **431–432**). This leftover must not grow a hail card or a second CONTROLS line.
**Fix:** Do not add help chrome. Hail buttons already name `[n]` + verb. Skip WPN when `hailOpen`; hail resolve stays `hailDigitsAllowed`.
**Status:** accepted — cite overlap, no new hail card.

#### 💡 Suggestion: Chart / berth have no Digit legend, yet live Digit1–5 still change WPN

**Location:** contract §0.1 other play surfaces; worker self-audit chart/berth note; controls Digit cases `src/systems/controls.js:329–344`
**Issue:** Player on the map or berth can accidentally switch WPN. Those surfaces do not paint 1–5. After PR1, `hailDigitsAllowed === false` / `chartOpen` / `berthOpen` skip the write.
**Fix:** Skip is enough. Do not paint 1–5 on the chart. Do not invent a “digits blocked” banner.
**Status:** accepted — no new chrome.

#### 💡 Suggestion: Docked WPN rail still reads as a live weapon while combat is cold

**Location:** `src/systems/hud.js:926–927`, **1940–1941**; contract §0.14
**Issue:** After PR1 the rail keeps the pre-dock `g · name`. A glance at WPN still looks armed. That is honest (group unchanged) and better than a fake disabled state. Station scrim already owns attention (`screens.css` **8–16**).
**Fix:** Keep the rail. Do not dim it. Do not add “docked” suffix. Optional later (not this leftover): owner playtest whether the rail glance confuses; still no “not available”.
**Status:** optional — freeze already forbids extra copy.

### Accessibility

- **Keyboard:** Docked menu Digit 0–9 stay the station map (`station.js` **6156–6177**). Digit1–5 must **not** also write WPN. Flight Digit1–5 stay reachable in open space. Skip is silent **non-change**, not a focus trap. Esc/B launch stay (`station.js` **6047**, **6161–6166**). PR1 does not steal Esc.
- **Names:** Station buttons already include the digit in the label (`6036–6037`). WPN value already includes the group prefix (`hud.js` **255–273**). Hail already includes `[n]` (`hail.js` **416**).
- **Contrast:** Existing cyan-on-void rails and station scrim (`screens.css` **8–16**, `--rw-accent`). No new color-only cue. Contrast/colorblind overrides already exist on `.screen-overlay` (`screens.css` **561+**). Spec adds no palette.
- **Focus:** Typing skip prevents Digit-in-field from changing WPN (`controls.js` **68–82**; `overlay-policy.js` **72–81**). Live station buttons use existing `.screen-overlay` focus-visible (`screens.css` **97**). No new control.
- **Motion:** `reducedMotion` n/a. Do not invent menu animation.

### Responsive / states

- Station panel already scrolls (inventory / `station.js` ~**6012–6016**). Skip adds no DOM, so no overflow regress.
- Empty WPN group already shows `—` (`hud.js` **259**, **267**). PR1 keeps whatever group was live. No loading spinner. No disabled widget.
- Error: never throw; missing flags fly as not-docked (contract §2). Overlay helper miss still skips when `docked === true`.
- Hover: no new buttons. Hail hover styles stay hail-owned (`hail.js` **413–418**) and **out of write-set**.

### Theming

No new CSS. `.screen-overlay` / `.station-overlay` and `.rw-combat-wpn` stay. Kit mutate omit. Labels stay `textContent` / `el()` / `h()` / `btn()`. `innerHTML` forbidden later (contract §0.9).

### Worker self-audit vs this record

`out/w124/menuinput/ui-audit.md` independently closed the same two majors (silent WPN rewrite; “not available” chrome), accepted the docked-no-WPN-change tradeoff, cited hail overlap without a new card, and refused chart Digit legends. This designer pass **agrees**. It adds live WPN/station evidence lines and the keyboard rule “docked menu digits must not also change WPN” as freeze, not as extra chrome. Do not treat the worker file as the parent `[designer]` record.

### Later-serial steal check (Blocker if a later worker ships these)

| Forbidden later work | Freeze | Result this wave |
|---|---|---|
| New WPN overlay / “not available” | §0.14; brief Non-goals | **Pass.** Not scheduled. |
| Steal Digit 0/8/9 | §0.2 / §0.11 | **Pass.** Station-only. |
| Remap flight 1–5 off weapons | §0.1 open space **must** set | **Pass.** |
| Hail-card redesign | §0.5; cite `hail.js` **431–432** | **Pass.** Cite only. |
| `stopImmediatePropagation` as default | §0.7 | **Pass.** Skip in controls. |
| HUD-01 hub pip | Honor | **Pass.** |
| `innerHTML` help/WPN | §0.9 | **Pass.** |
| Settings rebind / new Digit | §0.8 / §0.17 | **Pass.** |
| CONSUME / serial none | Census: leak live | **Pass.** Leftover **REAL**. Serial **PR1**. |
