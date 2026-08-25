# UI Audit: FX remaining scrape / collision punch (Wave 113 designer, iteration 2)

**review_file:** `out/w113/designer/fxscrape-ui-audit.md`  
**Wave:** 113. Spec re-audit after iteration 2. No product chrome ships this wave. Did not edit `src/`. Did not edit the integrator. No Vite. No Chrome.  
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`  
**Checklist:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`  
**Cite, do not rewrite:** `docs/Fx01RemainingDesign.md` (Wave 111 weapon hull-local ripple already shipped).  
**Prior Major to close:** stale HUD consume line numbers (toast 591–593 vs live 608–610; hub 709–712 vs 726–729; facing 846–847 vs 1127 / 1167 / 1407).

Reviewed:

- `docs/Fx01RemainingScrapeDesign.md`
- `out/w113/fxscrape/shared-contract.md` (merge law wins)
- `out/w113/fxscrape/current-fx-scrape-inventory.md`
- Worker `out/w113/fxscrape/ui-audit.md` (self-audit; not this file)
- Live HUD / FX surfaces in `src/` for file:line (code wins)

Focus: no punch pip on the 80 px hub; no extra toast spam; `reducedMotion` snap; Digit 0 unstolen; scrape must not look like a new HUD instrument; fail closed keeps today’s scrape feedback.

---

### Summary

Iteration 2 closed the prior **Major**. Inventory, contract, and brief now bind HUD consume to live `hud.js` toast **608–610**, hub **726–729**, and facing **863 / 1127–1128 / 1167–1169 / 1407–1417**. The leftover stays **world FX** via one later `spawnHitFx` call, not a hub widget. No Blocker. No open Major. Picture is still the same XOR family weapons already use.

### What's done well

- Player change is one call to live `spawnHitFx` (`docs/Fx01RemainingScrapeDesign.md:173–174`, `shared-contract.md:67–84`). No new string, Digit, SKU, or required panel.
- Empty 80 px hub freeze is explicit: no punch pip, combo meter, ram counter, or scrape glyph on `.rw-reticle` (`shared-contract.md:19`; live hub `src/ui/hud.css:184–193`; live children `src/systems/hud.js:726–729`).
- RANGE stays TGT-01 (`hud.js:729`, `1392–1404`). Contract now also forbids `rw-crosshair` (`730–731`) and `rw-contact-pip` (`835–849`) for ram (`shared-contract.md:19`).
- Facing-rail flash stays HUD-02 hair on `.rw-combat-self` (`hud.js:863`, `1127–1128`, `1167–1169`, `1407–1417`). Scrape already emits `playerHit` (`combat.js:1852`), so the rail already flashes. Spec does not move that flash onto the hub (`shared-contract.md:19, 139`).
- Hull-strike toast is consume, not a new line: live `toastForEvent` `'▲ Hull strike.'` on `bodyHit` when `e.damage > 0` (`hud.js:608–610`). `pushToast` refreshes the same key instead of stacking rows (`hud.js:1130–1150`, refresh `1133–1135`). Contract forbids a second scrape toast and forbids toasting `playerHit` (`shared-contract.md:19, 134`). Grep `'▲ Hull strike.'` is the bind, not stale line numbers.
- Player-outcome copy now names grind refresh on that same key (`docs/Fx01RemainingScrapeDesign.md:259`). It does not say “toasts once.”
- Digit 0 stays shipyard (`station.js:188`, `6100–6102`). Digit 8/9 dock root stay launch / epics (`station.js:6104–6106`). Outfitting 8/9 stay launcher / turret papers (`station.js:1644–1645`, `1691–1711`). Scrape punch is not a dock verb (`shared-contract.md:20`).
- `reducedMotion` reuses live helpers: ripple snap-one-frame (`combat.js:1051–1063`, `2033–2039`); sparks muted (`combat.js:962`); shake zeros (`ship.js:1207–1211`); HUD `@keyframes` already killed (`hud.css:1183–1188`, facing-flash `hud.css:305–307`). Spec forbids a new settings checkbox and extra `#hud` pulse (`shared-contract.md:40`).
- Slide-only `speed < 8` stays mute in the world (`combat.js:1847–1848`; `shared-contract.md:43`). Parking does not grow rings.
- First-person player host stays WAVE111 world-space (`combat.js:1065–1103`; `docs/Fx01RemainingDesign.md` parent law — cite only). Spec forbids full-size parent on the nose (`shared-contract.md:141`).
- Fail closed keeps today’s scrape language: bounce, `applyHit`, shake, `bodyHit` grit, `playerHit` thud, hull-strike toast, facing flash. Skip world FX only (`shared-contract.md:36, 162–174`; `docs/Fx01RemainingScrapeDesign.md:287–288`). Never freeze the sim. Never zero speed.
- Screen/shell-down strings stay consume (`hud.js:563–567`; `shared-contract.md:19`). A ram that peels a layer already has those toasts. No scrape shield copy.
- Kit mutate omit. Aim-glass gauges stay off (`docs/Fx01RemainingScrapeDesign.md:120`; `shared-contract.md:39`).
- Wave 111 weapon leftover is not reopened (`docs/Fx01RemainingDesign.md` cite-only). This leftover is the missing scrape call, not a parent rewrite.

### Prior Major (closed this pass)

#### 🟠 Major (fixed iteration 2): HUD consume cites were stale — later serial can add toast spam

**Location (first pass):** inventory / contract / brief bound consume to `hud.js` 591–593, 709–712, 846–847.

**Issue (first pass):** Those lines are `worldEvent` copy, injected `#hud .rw-sysname` CSS, and contact-pip `lastX`/`lastY`. A later PR that “consumed” them could miss `'▲ Hull strike.'` and add `'▲ Scrape.'`.

**Live Wave 113 spot-check (this pass):**

| Surface | Live | Pack bind now |
|---|---|---|
| Hull-strike toast | `hud.js:608–610` `'▲ Hull strike.'` | brief `64`, contract `19`, inventory `181` |
| Toast write / same-key refresh | `pushToast` `1130–1150` (refresh `1133–1135`) | brief `64`, `259`; contract `19`; inventory `182` |
| Hub + RANGE | `hud.js:726–729`; RANGE pop `1392–1404`; `hud.css:184–193` | brief `66`; contract `19`; inventory `176–177` |
| Facing flash | rail `863`; declare `1127–1128`; set `1167–1169`; apply `1407–1417` | brief `65`; contract `19`; inventory `185` |
| Do **not** bind | `worldEvent` `586–593`; sysname CSS `705–712`; pip `lastX` `846–847` | brief `80`; contract `19`; inventory `172` |

**Status:** **closed.** Inventory, contract, and brief match live `hud.js`. Brief pain point `80` tells a later serial not to consume 591–593. Worker `out/w113/fxscrape/ui-audit.md` and `code-review.md` also mark this Major fixed.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None open.

#### 🟡 Minor: Origin-centered ring reads as a halo, not a scrape nick

**Location:** `shared-contract.md:76, 99–100`; `docs/Fx01RemainingScrapeDesign.md:205–206`; weapon contact `combat.js:1799` vs scrape pos `playerObj.position`; `bodyHit` payload has no world point (`ship.js:935`).

**Issue:** Weapons stamp at bolt mesh. Scrape PR1 parks flash/ring/scorch on the hull origin (plus WAVE111 lift). Chase still reads “the hull got punched.” A glance on station skin can look like a core halo. First-person world-space at origin is not a contact nick.

**Fix:** Accept for PR1 (smallest combat-only additive). Do **not** draw a HUD contact pip, RANGE tick, or `.rw-contact-pip` to “fix” it. Do not grow `bodyHit` as a PHY feature this leftover.

**Status:** documented. Unchanged from iteration 1. Not extra chrome.

#### 🟡 Minor: First-person origin `spawnHitFx` is not the Wave 111 nose-safe case

**Location:** WAVE111 `fpPlayer` `combat.js:1065–1103`; muzzle glass warning `combat.js:1004–1007`; scrape pos = hull origin (`shared-contract.md:76`); `spawnFlash` scale 1.5→4.5 (`combat.js:990–1001`, `1992–2005`); player outcome `docs/Fx01RemainingScrapeDesign.md:259`.

**Issue:** Weapon FP fail-closed world-space uses **bolt contact**. Scrape uses **ship origin**. Camera sits on the nose. A world sprite at origin can vanish behind the camera or clip the near plane as a glass wash. The brief says the ring “does not fill the glass (WAVE111 world-space).” That claim is borrowed from weapon geometry. A wash would look like a new HUD bloom even with an empty `.rw-reticle`.

**Fix:** Playtest PR1 first-person ram. Keep WAVE111 parent skip. Do **not** parent full-size onto the player hull. Do **not** add hub chrome if the world sprite is hard to see. Fail closed = skip `spawnHitFx`, keep today’s toast/audio/shake. Do not invent a scrape pip.

**Status:** open for PR1 playtest. Not a hub child in the spec.

#### 🟡 Minor: `reducedMotion` still inherits `spawnFlash` fade on a grind

**Location:** `spawnHitFx` always `spawnFlash` (`combat.js:1110–1111`); `spawnFlash` has no snap (`combat.js:990–1001`); tick fade `combat.js:1992–2005`; ripple snap `1051–1063`; sparks mute `962`; contract `shared-contract.md:40`; acceptance `docs/Fx01RemainingScrapeDesign.md:289–290`.

**Issue:** Spec correctly freezes live snap for ripple and live mute for sparks/shake. Flash still grows and fades. A wall grind at ≥ 8 u/s can pulse a world quad every `IMPACT_GAP` 0.2 s. That is inherited WAVE54, not a new `#hud` `@keyframes`. Do not “fix” it with a hub strobe or a new settings checkbox.

**Fix:** Keep live helpers. Do not add HUD pulse. Do not retune IMPACT as FX. If playtest shows scrape flash as a vestibular extra vs discrete weapon hits, skip is **whole** `spawnHitFx` fail-closed, not a new mute widget.

**Status:** documented. Spec already forbids extra HUD pulse.

#### 🟡 Minor: Untextured hit flash next to a parented ring

**Location:** `spawnFlash` pool `combat.js:594–607`, `990–1001`; skippable flash map `shared-contract.md:38, 185`; `docs/Fx01RemainingDesign.md` optional PR2 (cite only).

**Issue:** Hard square plus riding ring can clash. Punch leftover is the missing scrape **call**, not the map.

**Fix:** None required this leftover. Do not put a textured pip on the hub as a substitute.

**Status:** documented.

#### 💡 Suggestion: Energy cyan ram must not grow a HUD legend

**Location:** `'impact'` → `FAMILY_COLORS.energy` `combat.js:1060`; `applyHit` empty weapon row `state.js` (inventory `current-fx-scrape-inventory.md:107`); colorblind HUD `settings.js:70`; world sprites not remapped.

**Issue:** Screens-up ram tints like a cannon hit. Colorblind body class tints HUD, not world sprites. A legend on the hub would smash HUD-01.

**Fix:** Keep energy fallback (no `WEAPONS.impact`, no `state.js` write). No hub swatch. Chase ring + existing toast/audio is enough.

**Status:** frozen by contract §0.5.

### Closed this pass (no longer open)

| First-pass item | Why closed |
|---|---|
| 🟠 Stale HUD consume lines | Pack now cites live toast / hub / facing; grep `'▲ Hull strike.'` |
| 🟡 “Toasts once” hides grind refresh | Player outcome now names same-key refresh (`docs/Fx01RemainingScrapeDesign.md:259`) |
| 💡 Do not reuse RANGE / crosshair / contact pips | Contract §0.2 now names `rw-crosshair` 730–731 and `rw-contact-pip` 835–849 |
| 💡 Screen-peel already has `'✕ Screen down.'` | Contract §0.2 now consume `hud.js` 563–567 |

---

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets. Punch is world sprites + consume HUD.
- No new CSS tokens. `'impact'` uses live energy cyan. Do not hardcode a scrape color on `#hud`.
- No responsive overlay. 80 px hub size stays (`hud.css:188–189`).
- Empty / error / loading: N/A (no panel). Fail closed is **keep bounce + damage + toast + audio + facing flash**. That is the correct disabled-FX state.
- Vestibular: `body.rw-reduced-motion` already kills HUD animation (`hud.css:1185–1188`). Shake already zeros (`ship.js:1207–1211`). Ripple snaps (`combat.js:1057–1063`). Do not add `@keyframes` on `#hud` for rams.
- `innerHTML` forbidden later (`shared-contract.md:21`). Live HUD `el()` is `createElement` + `textContent` (`hud.js:261–266`).
- Contrast: hull-strike already `cls: 'warn'` (`hud.js:610`). Do not invent a new toast class for punch.

### Digit / hub freeze table (live lines)

| Surface | Spec | Live cite | Later serial |
|---|---|---|---|
| `.rw-reticle` child | none new | `hud.js:726–729`; `hud.css:184–193` | forbidden |
| Punch pip / combo / impact meter | none | absent | forbidden |
| RANGE | TGT-01 | `hud.js:729`, `1392–1404` | do not rewrite |
| Crosshair / contact pips | not scrape | `hud.js:730–731`, `835–849` | do not reuse |
| Facing flash | `.rw-combat-self` consume | `hud.js:863`, `1127–1128`, `1167–1169`, `1407–1417` | do not move to hub |
| Hull-strike toast | consume one string | `hud.js:608–610`; refresh `1133–1135` | do not add “SCRAPE” / “SHIELD HIT” |
| Screen/shell toast | consume live | `hud.js:563–567` | do not add scrape shield copy |
| Digit 0 | shipyard | `station.js:188`, `6100–6102` | do not steal |
| Digit 8/9 dock | launch / epics | `station.js:6104–6106` | do not steal |
| Outfitting 8/9 | launcher / turret papers | `station.js:1644–1645`, `1691–1711` | do not steal |
| Aim-glass gauges | off | kit mutate omit | omit |
| `reducedMotion` | live snap; no extra HUD pulse | `combat.js:962`, `1051–1063`; `ship.js:1207–1211`; `hud.css:1185–1188` | no new checkbox |

### Fail closed (player-facing)

| If | Player still gets | Player does not get |
|---|---|---|
| Bad host / NaN pos / throw | bounce, damage, shake, `bodyHit` + `playerHit` audio, hull-strike toast, facing flash | world flash / ring / sparks / mark |
| Slide `speed < 8` | bounce, scrape grit, small shake | applyHit, hull-strike toast, world FX |
| Busy FX pool | damage already applied | that sprite |
| `reducedMotion` | snap ring frame, toast, facing outline (`hud.css:305–307`), no shake, no sparks | extra HUD pulse |
| Docked | station screen (combat already returns `combat.js:1825–1828`) | scrape FX |

### Verdict

The prior **Major is fixed.** HUD consume cites now match live `hud.js`. Spec honors HUD-01 empty hub, Digit 0/8/9, `reducedMotion` snap (no new HUD pulse), fail-closed keep-today’s-scrape, and “not a new HUD instrument.” Remaining items are playtest / inherited WAVE54 FX, not toast spam or hub theft. Later serial must grep `'▲ Hull strike.'` and `.rw-reticle`, call `spawnHitFx` only, and must not grow chrome to sell the ring.

**Counts:** Blocker 0. Major 0 (open). Minor 4. Suggestion 1.

**Weapon leftover:** shipped in Wave 111 (`docs/Fx01RemainingDesign.md`). This audit does not reopen parent law.
