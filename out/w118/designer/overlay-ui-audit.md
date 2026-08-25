# UI Audit: Wave 118 PR1 overlay-priority (designer recheck)

**Scope:** Recheck after worker closed hail Digit skip while paused. Mutex hail / chart / berth, incoming hail defer, salvage calm, Digit skip under covering screens.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `src/systems/overlay-policy.js`; `src/systems/hail.js`; `src/game/save.js` berth overlay; `src/systems/galaxychart.js` open gate; `src/core/ctx.js` session flags; `src/main.js` pause banner; `docs/Ctl02OverlayDesign.md`; merge law `out/w117/overlay/shared-contract.md`. Worker `out/w118/overlay/ui-audit.md` is **not** a substitute.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`. Static read of live `src/`. No process to stop. Port 5178 unused.

### Summary

Prior 🟠 Major (hail Digit 1–9 under the pause banner) is **closed**. `hailDigitsAllowed` reads `ctx.flags.paused` and returns false. Hail / chart / berth do not write pause. KeyP does not close hail. **No 🔴 Blocker. No remaining 🟠 Major.** Mutex, defer, berth Digit skip, settings/title/models skip, named close, and `[n]`+verb stay.

### What's done well

- **Pause Digit skip (this recheck).** `hailDigitsAllowed` returns false when `ctx.flags.paused` is truthy (`overlay-policy.js` 175–177). Digit listener bails before `resolveIntent` (`hail.js` 433–443). Boot pin `digitSkipUnderPause` pokes `flags.paused = true`, sends Digit1, and asserts calm did not write and `hailOpen` stayed true (`scripts/boot-test.mjs` 23803–23809).
- **Pause is a read, not a write.** Helper header forbids pause writes (`overlay-policy.js` 4). No `flags.paused =` in helper, hail, or chart (`boot-test.mjs` 23753–23755). Berth overlay slice also has no pause assign (23756–23760). Hail never lists KeyP (`hail.js` has no KeyP listener). `closeCard` is resolve / `hailClosed` / despawn only (134–142, 472, 500). KeyP only toggles `flags.paused` and the banner (`main.js` 165–176).
- **Exclusive play card.** `canOpenPlayCard` refuses a second hail / chart / berth (`overlay-policy.js` 118–128). Chart `setOpen(true)` and berth `setBerthOpen(true)` return before they write flags (`galaxychart.js` 421–425; `save.js` 1385–1389). KeyM / KeyL while hail is open leave `chartOpen` / `berthOpen` false.
- **Incoming hail defers, does not yank.** `canShowHail` returns `'defer'` when chart or berth is open (`overlay-policy.js` 108–116). Listener skips `openCard` only (`hail.js` 466–468). Flush on close: `takeDeferredHail` after `!open` (`hail.js` 512–516). Chart `showApLive` / engage-stay path is untouched (`galaxychart.js` 633–641, 719–728).
- **Hidden Digit under berth is closed.** Mutex stops hail + berth paint. `hailDigitsAllowed` also returns false when chart or berth flags are open (`overlay-policy.js` 180). Digit listener bails before `resolveIntent` (`hail.js` 433–443).
- **Settings / title / models cover hail Digits.** `titleOwnsScreen` (`#rw-title` body child, `overlay-policy.js` 35–46). `settingsOwnsScreen` finds the open z-80 panel via `aria-label='Settings'` (`overlay-policy.js` 49–69). Models use `ctx.models.isOpen` via `playSurfaceBlocked` (82–91). Boot pin `digitSkipUnderSettings`.
- **Chart / berth close blurs leftover focus (prior 🟡 closed).** After `setOpen(false)` / `setBerthOpen(false)`, if `document.activeElement` is inside the root, `blur()` runs (`galaxychart.js` 432–439; `save.js` 1398–1404). No close tween. `showApLive` still in `galaxychart.js`.
- **Named close stays.** Chart: `M or Escape closes.` plus `aria-label` `Close galaxy chart` (`galaxychart.js` 156–173). Berth hint: `L or ESC to close — records hold while you fly` (`save.js` 1376–1377). Hail close stays numbered intents. Contract forbids Escape-dismiss-hail as required PR1.
- **Hail verbs stay `[n]` + text.** `btn.textContent = \`[${idx + 1}] ${intentLabel(...)}\`` (`hail.js` 412). Salvage `letGo` label is `Leave the hulk` (323). Color is not the only cue.
- **Calm is visible in outcome, not a new widget.** Salvage `letGo` writes `ai.calmUntil = world.time + 30` (`hail.js` 199–211). `openCard` / KeyH read `hailCalmOk` (345–346, 487–488). No new persist key (`ctx.js` 208–210 session flags).
- **Sim stays live on play cards.** Helper and hail header forbid `flags.paused` writes (`overlay-policy.js` 4; `hail.js` 19). Chart `aria-modal='false'` (114). Berth copy still says records hold while you fly.
- **Honor neighbors.** Digit 0 still shipyard (WAVE118 pin). No hub child. No toast on defer. Copy via `textContent` / `createElement` (`hail.js` 364, 369–375, 412). `reducedMotion`: no new overlay tween. No `innerHTML` in helper / hail path.

### Findings

#### 🟠 Major: Hail Digit 1–9 still resolve under the pause banner

**Location:** `src/systems/overlay-policy.js` 175–177 (`hailDigitsAllowed`); `src/systems/hail.js` 433–443; pause overlay `src/main.js` 159–176 (`z-index:50`).

**Issue (was):** Pause is a full-screen banner at z 50. Hail is z 40. `system.update` stops; `window` keydown does not. Digit 1 could run `resolveIntent` while the player sees `PAUSED — P to resume`.

**Fix landed:** `hailDigitsAllowed` returns false when `ctx.flags.paused` is truthy. Digit listener skips `resolveIntent`. Hail stays open (`digitSkipUnderPause` asserts `hailOpen === true`). No pause write from hail / chart / berth. KeyP does not call `closeCard`. No toast.

**Status:** **closed.** Do not re-open unless a later edit drops the `flags.paused` read or writes pause from a play card.

#### 🟡 Minor: Deferred hail still has no waiting cue

**Location:** `overlay-policy.js` 130–146, 157–173; `hail.js` 466–468; contract §0.1 / §0.10.

**Issue:** Chart or berth stays. Incoming hail waits with no banner. Combat continues (`aria-modal=false`). Song may still hear `hailOpened`. Merge law forbids a new toast.

**Fix:** Do not add copy this wave. Optional later stills (PR2). Keep skip-`openCard`-only.

**Status:** accepted residual (contract). Same as prior designer pass.

#### 🟡 Minor: Hail buttons have hover paint and no `:focus-visible`

**Location:** `hail.js` 406–421 (inline `mouseenter` / `mouseleave` background only). Compare `.screen-btn:focus-visible` in `src/ui/screens.css` 89–100 and chart `.rw-galaxy-*:focus-visible` in `hud.css` 2003–2007.

**Issue:** Mutex makes hail the only play card. Digit labels remain the named path. A keyboard user who Tabs onto a hail button gets no matching focus ring. Hover is mouse-only. Pre-existing chrome; PR1 did not add a ring.

**Fix:** Not required for Digit-first hail. Optional later: outline on `:focus-visible` using the existing accent, no new animation.

**Status:** open — nice to have. Do not block PR1.

#### 🟡 Minor: Hail click path does not re-read `hailDigitsAllowed`

**Location:** `hail.js` 419 (`click` → `resolveIntent`); `overlay-policy.js` 175–184.

**Issue:** Digit keys skip under pause / settings / title / models. Native button click does not. Pause banner z 50 and settings z 80 sit over hail z 40, so mouse hits the cover. A focused hail button could still fire on Enter/Space while the pause banner is up. Not the Digit class the prior Major named. Covering surfaces already eat mouse.

**Fix:** Not required for this Digit pin. Optional later: gate `resolveIntent` the same as digits, or blur hail buttons when `flags.paused` is true. Do not close hail on KeyP. Do not add a toast.

**Status:** open — residual, not a Blocker/Major. Do not block PR1.

#### 💡 Suggestion: Berth close hint contrast is weak (pre-existing)

**Location:** `save.js` 1376–1378 `#5f7185` on `#0a101b` (~3.8:1 at 11px). Settings hint uses the same pair (`settings.js` 116–118).

**Issue:** Named close `L or ESC` sits in that line. High-contrast body class does not restyle this inline color. PR1 did not introduce it.

**Fix:** Later, reuse a HUD token that already passes on `body.rw-contrast`. Do not restack z-index.

**Status:** pre-existing. Call out. Not a PR1 mutex defect.

#### 💡 Suggestion: Do not raise play-card z-index now that mutex holds

**Location:** hail 40 / chart 30 / berth 60 / pause 50 / settings 80 / `#fatal` 99. Contract §0.1 z-index prefer none.

**Issue:** Raising hail over pause would still leave Digit policy as the real fix (now landed). Raising play cards over settings breaks Wave 40 KeyO.

**Status:** frozen. Prefer no `hud.css` edit.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.17. Hail / chart / berth open via `display` / `is-hidden` only.

**Status:** no new overlay animation.

### Keyboard / covering-surface / hierarchy checklist

| Check | Freeze | Live now |
|---|---|---|
| Hail + chart + berth | At most one | Mutex + flags `hailOpen` / `chartOpen` / `berthOpen` |
| Incoming hail vs chart/berth | Defer `openCard` | `canShowHail` → `'defer'` |
| KeyM / KeyL while hail | Refuse open | `setOpen` / `setBerthOpen` gate |
| KeyH while chart/berth | Refuse | `canOpenPlayCard('hail')` |
| Digit under berth | Skip | `hailDigitsAllowed` + mutex |
| Digit under settings / title / models | Skip | `hailDigitsAllowed` |
| Digit under pause | Skip | **Closed** — `hailDigitsAllowed` reads `flags.paused`; hail stays open |
| KeyP vs hail | Do not close hail; do not write pause from hail | KeyP toggles banner only (`main.js` 175–176) |
| Named close | M/L/Escape; hail `[n]`+verb | Unchanged |
| Pause sim | Forbidden on play cards | No `flags.paused` write |
| Chart on AP engage | Stay open | `galaxychart.js` 633–641 no `setOpen(false)` |
| Chart/berth close focus | Blur if inside root | `galaxychart.js` 432–439; `save.js` 1398–1404 |
| Digit 0 | Shipyard | Hail is Digit 1–9 only |
| Empty hub | No overlay pip | No `hud.js` / reticle child |
| `innerHTML` | Forbidden | None in helper / hail path |
| Calm salvage letGo | +30 s session | `hail.js` 210 |

### Verdict

**Player outcome for hail / chart / berth mutex is met.** Stacking of those three is gone. Hidden Digit under berth is gone. Settings / title / models skip hail Digits. **Hail Digits skip under pause. Hail stays open on KeyP. Play cards do not write `flags.paused`.** Named close and `[n]`+verb stay. Sim stays live. Chart stays open on AP engage. **No Blocker. No remaining Major.** Prior chart/berth `aria-hidden` focus leftover is closed by `blur()`. Residual: deferred-hail cue (contract), hail `:focus-visible`, hail click/Enter under a covering banner. `[NO BROWSER COVERAGE]`.
