# CLEAN

**Auditor:** `[designer]` (independent of `out/w139/mktdesk/ui-audit.md`)  
**Scope:** Wave 139 Mkt01 MARKET desk layout leftover freeze. No product UI ships this wave. Audit the freeze: TRADE overflow at 560 px, wrap not raise-min, player-word subtitle, Q/W/A/S kept, `textContent`, color not only cue, no new Digit.  
**Review file:** `out/w139/designer/mktdesk-ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Mkt01DeskLayoutDesign.md`, merge law `out/w139/mktdesk/shared-contract.md` (wins on conflict). Inventory `out/w139/mktdesk/current-market-desk-layout-inventory.md` (code wins). Worker self-audit `out/w139/mktdesk/ui-audit.md` read, not copied. Fable `out/orch-fable/t3/ui-audit.md` is evidence, not live truth. Live cites: `src/systems/station.js` MARKET pane, `src/ui/screens.css` `.market-*` / `.screen-panel`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].  
**Date:** 2026-08-27  
**Product source:** review only (no `src/` / worker-doc edits)

Merge law: `out/w139/mktdesk/shared-contract.md` wins if the brief forks. Findings bind **later PR1**. Serial is named only. This wave does not ship `src/`.

## UI Audit: Mkt01 MARKET desk layout leftover freeze

### Summary

No product chrome ships in Wave 139. Live TRADE `+1`/`+5`/`−1`/`−5` still overflow the 10em track at `.screen-panel` `min-width: 560px`, and the subtitle still says “fill units”. The freeze names leftover **REAL** / **PR1**: `flex-wrap: wrap` on `.market-actions` (do not raise TRADE min), subtitle `'MARKET — buy price and sell price'`, fail-closed skip, `textContent`, Q/W/A/S kept, Digit 1 stays Market. Color stays extra, not the only cue. No 🔴/🟠 remain **in the freeze**. Live clip and jargon stay until PR1 (expected).

**Counts:** 🔴 Blocker **0** open (**2** live holes named as later mint). 🟠 Major **0** open (**4** closed in freeze). 🟡 Minor **4**. 💡 Suggestion **4**.

### Verdict

**CLEAN.** Wrap-not-raise, player-word subtitle, Q/W/A/S, `textContent`, color-not-only, and no-new-Digit honor the leftover. Do not CONSUME. Do not treat live overflow as a freeze defect.

---

### Honor / Blocker gate

Flag **Blocker** if the brief would drop Q/W/A/S, add a Digit, `innerHTML` names, hide restricted rows, raise TRADE min **and** wrap as two required laws, drop panel `min-width: 560px` as the fit, use `overflow-x` as the only fit, or make BUY vs SELL color-only. Hub, Digit, keyboard, and color-not-only **pass** in freeze.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| TRADE fit at 560 px | Contract §0.19 / §0.1 wrap; design Goals 3 | `.market-actions` flex, **no wrap** (`screens.css` **215–218**); TRADE `minmax(10em, 1.7fr)` (**181**); panel `min-width: 560px`, `overflow-y: auto` only (**27–31**); four `btn` (`station.js` **4853–4856**) | **Pass in freeze.** Live clip is the leftover. PR1 wrap. Track min **unchanged**. |
| Wrap, not raise-min | Contract §0.19, §0.1 “Why wrap, not raise min”; design alternatives | Specified six-min sum ≈ 505 px vs content box ≈ 516 px (`screens.css` **27–32**, **181–182**). Four-button min-content exceeds 10em (~140 px). Raising TRADE min grows the six-min sum past the content box. | **Pass.** One layout law. Do not drop panel min. Do not use `overflow-x` as the only fit. |
| Player-word subtitle | Contract §0.20; design deputize | `'MARKET — buy and sell fill units'` (`station.js` **4830**); `.screen-sub` uppercase + `letter-spacing: 0.22em` (`screens.css` **45–51**) | **Pass in freeze.** Later `'MARKET — buy price and sell price'` via same `h('div', 'screen-sub', …)` / `textContent`. Do not name `tradeFillUnit` on the pane. |
| Q/W/A/S kept | Contract §0.3, §0.13; design Honor | Legend **4859**; KeyQ/W/A/S **6296–6300**; arrows **6294–6295** | **Pass.** Do not put hotkeys in the TRADE head. Flight Q/W/A/S stay undocked. |
| `textContent` / no `innerHTML` | Contract §0.4 | `h()` sets `textContent` (**4544–4548**); `btn()` is `h('button', …)` (**4551–4555**); grep `innerHTML` in `station.js` empty | **Pass.** Names, UU, HOLD, refusal, subtitle stay `textContent`. |
| Color not only cue | Contract §0.12 | BUY/SELL **words** as heads (**4835–4836**); cells `` `${n} UU` `` (**4846–4847**); TRADE labels `+1`/`+5`/`−1`/`−5` (**4853–4856**); legend Q/W buy · A/S sell (**4859**); STATUS `Legal` / `RESTRICTED` (**4845**); refusal `'trade refused'` (**4850–4851**). Fills share body color (`screens.css` **194–201**). Heads use `--rw-accent` (**186–188**). Colorblind remaps `--rw-*` (**565–568**). | **Pass.** Optional BUY/SELL tint is PR3 skip, not raw red/green. Plus/minus is a sign cue, not a hue cue. |
| No new Digit | Contract §0.2, §0.8 | `DOCK_KEY_SERVICES[0] === 'market'` (**189**); Digit 1 menu (**6123–6126**, **6258–6265**); Digit 1 on MARKET arms seed when visible (**6289–6292**); Digit 2–9/0 still pick dock services (**6302–6313**) | **Pass.** Digit 1 stays Market. Digit 0/8/9 stay. HUD-01 hub stays empty. |
| Illegal rows visible | Contract §0.7 | Closed locker paints `'trade refused'` span, does **not** hide the row (**4850–4851**, **4730–4733**) | **Pass.** Wrap **buttons**, not fills. `.market-fill` nowrap stays (**199–201**). |
| `tradeFillUnit` math | Contract §0.5 | Helper **4691–4714**; pane **4842–4847**; `tryTrade` **4736**, **4745** | **Pass.** Do not retune to shorten `n UU`. |
| `reducedMotion` | Contract §0.12, §0.1 playable | No market `@keyframes`; no `@media (prefers-reduced-motion)` in `screens.css` | **Pass.** Wrap is static CSS. Do not add button motion. |
| Focus / real buttons | Contract §0.13 | TRADE uses `btn()` `<button type="button">` (**4551–4555**, **4853–4856**). `.screen-btn:focus-visible` 2 px accent outline + hover (`screens.css` **88–99**, **220–224**) | **Pass.** |
| Fail-closed paint | Contract §0.11, §2 | `com.name` can throw (**4840**, **4844**); `RENDERERS[ui.service](panel)` after `overlay.textContent = ''` (**6109**, **6151**); no skip in `forEach` (**4839–4857**) | **Pass in freeze.** PR1 skip unknown key; missing name → key text; never throw. Live throw is a paint hole, not CONSUME. |
| Agent observe / badge | Contract §0.9–0.10 | Not claimed | **Pass.** Desk layout only. |

If a later worker raises TRADE min as a second required law, drops `min-width: 560px`, ships wrap without the subtitle (or the reverse), `innerHTML`s names, remaps Q/W/A/S, adds a Digit, hides restricted rows, or tints BUY/SELL without words, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| 560 px TRADE overflow | **Live hole. Frozen as PR1 wrap.** Content box ≈ `560 − 22 − 22 = 516` px. Specified track mins `6.5+5+4+4+3+10` em = 455 px + five `10` px gaps = **505** px. Last track 10 em ≈ **140** px. Four padded buttons + three `6` px gaps exceed 140 px. Flex does not wrap. Panel has no `overflow-x`. Mouse TRADE clips or spills. Keyboard still works. | `screens.css` **27–32**, **178–182**, **199–201**, **215–224**; `station.js` **4853–4856**, **4859**, **6296–6300** |
| Why wrap beats raise-min | **Sound.** Inflating TRADE min grows the six-min sum past 516 px unless the panel min also grows. Growing the panel min steals every station pane. `overflow-x: auto` hides the hole. Wrap keeps the 560 px floor and Q/W/A/S. | contract §0.19; inventory §2; design alternatives |
| Wrap math | **Sound.** After wrap, min-content of `.market-actions` falls toward one button (~`padding: 3px 9px` + two glyphs + border), well under 10 em. At 560 px the last track still sits near 10 em, so 2×2 wrap is the expected mouse row. At `max-width: 780px` the 1.7fr track can hold one row. | `screens.css` **28–29**, **181**, **215–224** |
| Subtitle player words | **Sound.** BUY/SELL already show qty-1 UU from the same helper as `+1`/`−1`. “Fill units” names the helper. “Buy price and sell price” names the player action. Glyph count is similar; `.screen-sub` tracking need not change. | `station.js` **4830**, **4842–4847**; `screens.css` **45–51** |
| Partial merge | **Sound.** Wrap without subtitle leaves jargon. Subtitle without wrap leaves clipped hits. Skip without wrap/copy still blanks the overlay on a bad `com`. One PR. | contract §2 |
| Color-not-only | **Pass.** Heads, `n UU`, `+`/`−` labels, Q/W/A/S legend, `RESTRICTED` / `trade refused` words. Fill color is body `#dfe9f4`, not a red/green spread. | `station.js` **4833–4859**; `screens.css` **186–201** |
| Keyboard | **Pass.** Arrows wrap `ui.marketSel`. Q/W buy 1/5. A/S sell 1/5. Legend under the table. Digit map unchanged. | `station.js` **4859**, **6294–6313** |
| States | Loading: none (docked 1 s rebuild already restores `scrollTop`). Empty: authored 11 keys; PR1 skip can leave heads-only (see Suggestion). Error: `tryTrade` notices; `aria-live="polite"` on `.station-notice`. Disabled: closed locker replaces buttons with `'trade refused'` (not a dead control). Focus/hover: live on `.screen-btn`. | `station.js` **4736–4756**, **4850–4851**, **6100–6159**; `screens.css` **88–99** |
| Visual hierarchy | **Pass.** `.screen-sub` then grid then `.screen-legend`. TRADE head is the word TRADE. Seed papers / archive stay out of this leftover. | `station.js` **4830–4859**, **4795–4826** |
| Theming | Heads/focus use `--rw-accent`. Colorblind remaps overlay `--rw-*`. High-contrast restyles panel/buttons. Leftover adds no new hex. Wrap is layout, not a new token. | `screens.css` **11–13**, **88–99**, **186–188**, **565–586** |
| Table semantics | **Accepted gap, not PR1.** Div grid, not `<table>`. Two UU numbers can sound like one price twice. Optional PR3. | `station.js` **4832–4848**; contract §0.1 |
| Responsive | Panel min 560 / max 780 / `max-height: 82vh` / `overflow-y: auto`. Wrap adds height, not width. Eleven rows already scroll. | `screens.css` **27–32**, **178–184** |

---

### What's done well

- Census refuses CONSUME. Keyboard-works and BUY/SELL UU already live are **not** the leftover. Overflow **and** jargon are both missing; serial is **PR1**, not none (`station.js` **4830**; `screens.css` **215–218**).
- One layout law. Inbox said wrap **or** raise min. Freeze picks wrap. Raise-min as a competing required law would fight the 516 px content box (inventory §2).
- Copy path is already `h()` `textContent` (`station.js` **4544–4548**). Freeze forbids `innerHTML` / `insertAdjacentHTML` / `document.write` for names, fills, HOLD, refusal, and subtitle.
- TRADE uses real `<button type="button">` via `btn()` (`station.js` **4551–4555**, **4853–4856**). `.screen-btn:focus-visible` already draws a 2 px `--rw-accent` ring (`screens.css` **95–99**). Hover shares that accent (`screens.css` **88–93**).
- Hotkeys sit in `.screen-legend` under the table (`station.js` **4859**). TRADE head is the word TRADE (**4838**). That avoids a wrapping head in the last track.
- BUY and SELL already show qty-1 UU from `tradeFillUnit`, the same helper as `tryTrade` (`station.js` **4691–4714**, **4736**, **4745**, **4842–4847**). Inbox honesty of two fills stays. PR1 does not retune math.
- Restricted rows stay in the grid with `'trade refused'` instead of hidden or dead buttons (`station.js` **4850–4851**). Status is the word `RESTRICTED`, not a hue-only mark (**4845**).
- Fill cells use body color and `.market-fill { white-space: nowrap }` so `184 UU` does not split (`screens.css` **194–201**). Freeze wraps **buttons**, not fills.
- Colorblind tokens retint overlay `--rw-accent` / `--rw-warm` / `--rw-good` (`screens.css` **565–568`). Heads already use the accent token (**186–188**).
- Digit 1 stays Market (`station.js` **189**, **6123–6126**). Digit 2–9/0 still pick other dock services on MARKET (**6302–6313**). HUD-01 hub stays empty. No new Digit.
- `reducedMotion`: no market animation live; PR1 wrap is static CSS.
- Notices already use `aria-live="polite"` (`station.js` **6155–6157**). Fail-closed skip is named so a bad row cannot blank the overlay after `overlay.textContent = ''` (**6109**, **6151**).
- Worker self-audit (`out/w139/mktdesk/ui-audit.md`) already called the freeze clean of 🔴/🟠. This designer pass **agrees**. Do not reopen raise-min, panel-min drop, or color-only BUY/SELL as PR1.

---

### Findings

#### 🔴 Blocker: TRADE overflow at 560 px — **resolved as later mint**

**Location:** `src/ui/screens.css:215-218` (`.market-actions`); `src/ui/screens.css:181` (TRADE `minmax(10em, 1.7fr)`); `src/ui/screens.css:27-31` (panel min / `overflow-y`); `src/systems/station.js:4853-4856` (four TRADE buttons)  
**Issue:** Four `+1`/`+5`/`−1`/`−5` buttons with `padding: 3px 9px` and `gap: 6px` exceed the last track’s 10 em (~140 px). Flex does not wrap. `.market-fill` nowrap stops BUY/SELL from feeding TRADE. The panel does not grow and does not set `overflow-x`. Mouse hits clip or spill at the live 560 px floor. Keyboard Q/W/A/S still work (`station.js:4859`, `station.js:6296-6300`). This is unusable mouse TRADE at the authored panel minimum, so the leftover is **REAL**, not a taste nit.  
**Fix:** Later PR1 `flex-wrap: wrap` on `.market-actions`. Keep `display: flex` and `gap: 6px`. Do **not** raise the TRADE min track as a second law. Do **not** drop `.screen-panel` `min-width: 560px`. Do **not** use `overflow-x: auto` as the only fit. Live hole remains until PR1 (expected). Integrator must not CONSUME.  
**Status:** closed in freeze (live until PR1)

#### 🔴 Blocker: Competing layout laws (wrap **and** raise-min) — **resolved in freeze**

**Location:** inbox “wrap or raise”; `out/w139/mktdesk/shared-contract.md` §0.19; `src/ui/screens.css:181` vs `src/ui/screens.css:27-32`  
**Issue:** Raising TRADE min without growing the panel increases the six-column min sum past the ~516 px content box and still overflows. Doing wrap **and** raise-min as two required laws fights. Dropping panel min-width would steal Jobs / Bar / every station pane.  
**Fix:** One law: wrap. TRADE min stays `minmax(10em, 1.7fr)`. Panel min stays `560px`.  
**Status:** closed in freeze

#### 🟠 Major: Subtitle helper jargon — **resolved as later mint**

**Location:** `src/systems/station.js:4830`; `.screen-sub` `src/ui/screens.css:45-51`  
**Issue:** `MARKET — buy and sell fill units` is honest to `tradeFillUnit` and opaque to the player. BUY/SELL heads already name the columns.  
**Fix:** PR1 `'MARKET — buy price and sell price'` through `h()` `textContent`. Keep `.screen-sub` uppercase / tracking. Do not keep “fill units” to save glyphs. Do not name the helper on the pane.  
**Status:** closed in freeze (live until PR1)

#### 🟠 Major: Color-only BUY vs SELL — **resolved in freeze**

**Location:** honor a11y; Fable optional tint `out/orch-fable/t3/ui-audit.md` (suggestion, not live truth); live fills `src/ui/screens.css:194-201`, `src/systems/station.js:4846-4847`  
**Issue:** Tinting fills without words would fail color-not-only. Live cells already say `n UU` under BUY/SELL heads. TRADE labels already use `+` vs `−`. Legend already maps Q/W vs A/S.  
**Fix:** PR1 keeps words. Optional token tint is PR3 skip (`--rw-warm` / `--rw-good`), not raw red/green. Colorblind tokens already swap those variables (`screens.css:565-568`).  
**Status:** closed in freeze

#### 🟠 Major: Hotkeys in TRADE head / new Digit / pause chrome — **resolved in freeze**

**Location:** legend `src/systems/station.js:4859`; Digit 1 `src/systems/station.js:189`, `src/systems/station.js:6123-6126`, `src/systems/station.js:6289-6313`  
**Issue:** Stuffing `Q/W/A/S` into the TRADE head wraps the head in the last track. A new Digit or pause overlay would steal dock map / CTL-02.  
**Fix:** Keep legend under the table. Keep Q/W/A/S. Digit 0/8/9 stay. Digit 1 stays Market. Do not write `flags.paused`. Do not steal Digit 1 seed-papers arm.  
**Status:** closed in freeze

#### 🟠 Major: Hide restricted / shrink fills / `innerHTML` names to “fit” — **resolved in freeze**

**Location:** `src/systems/station.js:4850-4851`; `.market-fill` `src/ui/screens.css:199-201`; `h()` `src/systems/station.js:4544-4548`  
**Issue:** Dropping illegal rows, wrapping `184 UU` mid-number, retuning `tradeFillUnit` to shorten glyphs, or `innerHTML`ing commodity names would steal locker honesty, scan, econ, or XSS safety.  
**Fix:** Wrap **buttons**, not fills. Restricted stays. `textContent` stays. Helper math stays.  
**Status:** closed in freeze

---

#### 🟡 Minor: Grid is not a real table

**Location:** `src/systems/station.js:4832-4848`  
**Issue:** Screen readers hear a flat stream of `div` cells. Two UU numbers can sound like one price twice. No `th`/`td`, no `role="table"`.  
**Suggestion:** Optional PR3 `role="table"` / `role="columnheader"` / `role="cell"`, or a visually hidden `Buy n UU` / `Sell n UU` prefix via `textContent` (not `innerHTML`). Not required with PR1.  
**Status:** open (justified skip)

#### 🟡 Minor: `.screen-sub` tracking still long

**Location:** `src/ui/screens.css:45-51`; later subtitle `station.js` **4830**  
**Issue:** Player-word subtitle is about the same character count as the jargon line. Uppercase + `letter-spacing: 0.22em` at 12 px may still wrap on a crowded head.  
**Suggestion:** Inbox asked for player words, not a shorter tracking token. Do not restyle all station subs. Do not keep “fill units” to save glyphs. Owner default `'MARKET — buy price and sell price'` stands.  
**Status:** open (justified skip)

#### 🟡 Minor: Wrap may stack TRADE on two rows

**Location:** later `.market-actions` wrap; grid `align-items: center` `src/ui/screens.css:178-184`; selected inset `src/ui/screens.css:203-206`  
**Issue:** Hit row gets taller. Name / status / fill cells stay one line and stay vertically centered. `.market-row-sel` inset on each cell will not paint a full-height row bar.  
**Suggestion:** Honest fit. Panel already scrolls vertically (`screens.css:31`). Better than clip. Do not raise TRADE min to force one row. Do not add animation to “smooth” the stack.  
**Status:** open (accepted)

#### 🟡 Minor: Unused `market-head-actions` class

**Location:** `src/systems/station.js:4838`  
**Issue:** Class has no rule in `src/ui/screens.css`. Harmless leftover from when hotkeys lived in that head.  
**Suggestion:** Optional drop. Not required to drop. Do not add a rule that puts hotkeys back in the TRADE head.  
**Status:** open (optional)

---

#### 💡 Suggestion: Pair wrap with `min-width: 0` on `.market-actions`

**Location:** later `src/ui/screens.css` `.market-actions` (**215–218**); grid item default `min-width: auto`  
**Issue:** Grid items use min-content as a floor. Today that floor is four nowrap buttons, which is why the last track blows past 10 em. `flex-wrap: wrap` should drop min-content toward one button. Some engines still inflate a flex grid child until the item can shrink.  
**Fix:** PR1 may add `min-width: 0` (or `min-width: 0; flex-wrap: wrap`) on `.market-actions` **in addition to** wrap. That is not a second layout law and is not a TRADE min raise. Do not set `min-width: 0` without wrap (buttons would clip). Measure at 560 px in the impl wave; do not add a resize observer.

#### 💡 Suggestion: Optional PR2 still

One still: dock, Digit 1 Market, panel width 560 px, TRADE `+1`/`+5`/`−1`/`−5` visible (wrapped if the track is tight), subtitle reads buy price and sell price, Q buys 1, S sells 5, closed locker still shows `trade refused`, hub empty, no pause, Digit 0/8/9 unchanged.

#### 💡 Suggestion: Do not add hover animation or color-only BUY/SELL

Wrap is enough. Live hover already changes border/color via `--rw-accent` (`screens.css:88-93`). Do not add motion that ignores `reducedMotion`. Do not tint fills in PR1.

#### 💡 Suggestion: Pre-existing contrast / empty-skip (not PR1)

**Location:** `.screen-legend` `src/ui/screens.css:60-65` (`#5f7185`); `.market-illegal` / `.market-refusal` **209–213**, **226–229** (`#e06a5a`); `body.rw-contrast` list **599–610** omits those classes; PR1 skip in `station.js` **4839–4857**  
**Issue:** High-contrast mode brightens `.screen-note` and buttons but not the market legend or restricted/refusal red. Those hues are also hardcoded, not `--rw-*`. Words still carry the meaning (`RESTRICTED`, `trade refused`, Q/W/A/S text), so this is not color-only. Fail-closed skip of every bad key could leave heads with no rows and no empty copy.  
**Fix:** Out of band. Do not retoken red or restyle all legends as “desk layout”. If skip-all happens, heads-only is fail-closed enough; do not invent a new empty-state widget this leftover.

---

### States checklist (freeze)

| State | Live | Freeze |
|---|---|---|
| Default | Six-column desk, four TRADE buttons, jargon subtitle | Wrap + player subtitle |
| Hover | `.screen-btn:hover` accent (`screens.css:88-93`) | Keep; no new motion |
| Focus | `.screen-btn:focus-visible` 2 px ring (`screens.css:95-99`) | Keep |
| Disabled | Closed locker: span `'trade refused'`, not `disabled` buttons (`station.js:4850-4851`) | Keep visible row |
| Error | `ui.notice` + `aria-live="polite"` (`station.js:6155-6157`) | Keep; skip bad rows instead of throw |
| Empty | Authored 11 commodities (`state.js:350-364`) | Skip unknown; no new empty chrome |
| Loading | 1 s docked rebuild; `scrollTop` restore (`station.js:6100-6159`) | No extra DOM / no resize observer (contract §0.14) |

---

### What later PR1 must not do (UI)

- Raise TRADE `minmax(10em, 1.7fr)` as required law.
- Drop `.screen-panel` `min-width: 560px`.
- Use `overflow-x: auto` as the only “fit”.
- Put Q/W/A/S in the TRADE head.
- Add a Digit, HUD pip, or pause overlay.
- `innerHTML` commodity names or UU.
- Hide restricted rows or wrap `.market-fill`.
- Retune `tradeFillUnit` to shorten glyphs.
- Color-only BUY vs SELL (raw red/green).
- New animation that ignores `reducedMotion`.
- Claim Agent observe fill JSON or Agent badge layout.

---

### Verdict (repeat)

**CLEAN.** No 🔴/🟠 remain in the freeze. Live TRADE clip at 560 px and “fill units” jargon stay until named serial **PR1** (wrap + `'MARKET — buy price and sell price'` + fail-closed skip). Q/W/A/S, `textContent`, color-not-only, Digit 1 Market, and wrap-not-raise hold.
