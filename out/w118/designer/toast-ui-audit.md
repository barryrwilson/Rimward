# UI Audit: HUD-04 leftover toast-flood (Wave 118 designer recheck)

**Scope:** Recheck later player-facing freeze for P1 toast-flood after the worker froze two designer Majors. Markdown leftover only. No `src/` in this wave.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `docs/Hud04ToastFloodDesign.md`; merge law `out/w118/toast/shared-contract.md`; `out/w118/toast/current-toast-inventory.md`; `out/w118/toast/notes.md`. Worker `out/w118/toast/ui-audit.md` is **not** a substitute. Prior parent gate: this file before overwrite.  
**Recheck target:** (1) five-row key linger independent of chip reuse; (2) expire `aria-hidden` on slots.  
**Player outcome freeze:** 8 s identical-key window on five slots; AUTOSAVE HELD vs SAVE BLOCKED copy; `save.js` source tag later; do not add slots; do not persist; do not pause; do not raise toast z; do not add hail toasts; polite live region stays; color is not the only cue.  
**Live re-census (code wins):** `src/systems/hud.js`, `src/ui/hud.css`, `src/style.css`, `src/game/save.js`. Inventory line numbers still match live `src/` at this recheck. Live still has **no** linger ring and **no** expire `aria-hidden`. That is leftover, not a freeze miss.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`. No process to stop.  
**Graph:** `graph_resolve` (`codex/agent-codex`) returned `blocked_ambiguous` on Word/Docs vs Slides vs catalog-maintenance (coverage 0.07). This pack is local markdown under `out/w118/designer/toast-ui-audit.md`. No Drive share. No graph write.

### Summary

The freeze now matches the named pirate-bubble picture. Linger is last **five keys**, not chip index. Expire must set **`aria-hidden="true"`**. Both prior 🟠 Majors are **closed in freeze**. No 🔴 Blocker. **No remaining open 🟠 Major in the freeze itself.** Live `src/` still blinks and still leaves faded chips in the polite region until **PR1 toast-flood**. Leftover stays **REAL**, not CONSUME.

### What's done well

- **Prior Major 1 is named and forbidden to regress.** Contract linger is a session five-row ring `{ key, lastShown }` independent of which chip paints (`shared-contract.md` §0.1 linger row; formulas ~112–134; fail-closed “Chip reused… linger row stays”; explicit non-pick “Tie linger to chip index / clear linger on chip reuse”). Design player outcome restates the same scene (`docs/Hud04ToastFloodDesign.md` 200–202). A Map is still forbidden (§0.7).
- **Prior Major 2 is named and forbidden to regress.** Expire sets `aria-hidden="true"` and keeps `textContent` (§0.19; expire formula; fail-closed; non-pick “Leave expired chip in polite region without aria-hidden”). Real show unhides then writes. Boot empty chips start hidden. Optional CSS `visibility: hidden` on `:not(.show)` is a hide, not a z raise. Region stays `role=status` `aria-live=polite`. Not assertive. No second live region.
- **Inbox hierarchy is still correct.** Flood is identical **repeat** plus mix copy, not a taller stack and not overlay z. Live stack is five chips, top-right off the aim column (`hud.css` 635–646), `#hud` z 10 (`style.css` 24–29). Hail 40 / chart 30 / berth 60 stay above. Freeze still forbids extra slots, toast z raise, and hail toasts. `.rw-toasts` stays `pointer-events: none`.
- **Copy split is words, not color.** Live `saveBlocked` is still one string `'▲ SAVE BLOCKED — ' + reason` (`hud.js` 568–569) with hostile reason **berth record refused** (`save.js` 1028). Freeze deputizes `'▲ AUTOSAVE HELD — hostiles near'` vs `'▲ SAVE BLOCKED — ' + reason` plus authored `source` tokens. Both keep `▲` and class `warn` (`hud.css` 736). Glyph + words already pair color for toast kinds.
- **Identical visible refresh already avoids a polite re-announce.** `pushToast` extends `until` and does **not** rewrite `textContent` (`hud.js` 1155–1157, 1169). Freeze keeps that. `textContent` only. Partial merge “window without source tag” stays forbidden so a KeyL SAVE cannot collapse into an autosave retry (`shared-contract.md` §2).
- **No new chrome, hub, or motion.** Empty 80 px hub stays. `TOAST_LIFETIME` 4 s for **new** lines stays (`hud.js` 64). `reducedMotion` already kills HUD transitions (`hud.css` 1183–1188). High-contrast already restyles `.rw-toast` (`hud.css` 1167–1175). `--rw-text-scale` already scales type (`hud.css` 717).

### Recheck: prior Majors

#### 🟠 Major (closed in freeze): Slot-tied linger loses the 8 s window in the named pirate-bubble scene

**Location:** freeze `out/w118/toast/shared-contract.md` §0.1 linger + formulas + §2 partial-merge row “linger stored on chip key only”; player outcome `docs/Hud04ToastFloodDesign.md` 200–202; live overwrite-soonest `hud.js` 1163–1166; expire still clears chip `key` `hud.js` 1197–1201; idle retry `save.js` 1588–1590.

**Issue (was):** AUTOSAVE HELD, then four other distinct lines, reuse all five chips. A linger stored on the chip dies. The 5 s autosave retry restacks.

**Fix landed (markdown):** five-row linger ring of **keys**. Record on real show and visible refresh. Overwrite oldest linger row on a sixth distinct key. Clear a linger row **only** when `now > lastShown + WINDOW`. **Do not** clear linger because a different line reused the chip. Still five visual chips. No Map. No persist.

**Status:** **closed in freeze.** Live `src/` still has no ring (PR1). Do not reopen the leftover as CONSUME. Do not reopen this Major against the freeze.

#### 🟠 Major (closed in freeze): Expired chips stay in the polite live region

**Location:** live `hud.js` 813–819, expire 1197–1201 (`until = 0`, `key = ''`, `classList.remove('show')` only); paint `hud.css` 727–733 (opacity / transform only); freeze `shared-contract.md` §0.19 / expire formula / §2.

**Issue (was):** Fade is visual only. Opacity 0 does **not** remove nodes from the accessibility tree. After the first show, each slot keeps `textContent` forever.

**Fix landed (markdown):** expire `aria-hidden="true"`; keep `textContent`. Real show: `aria-hidden="false"` then `textContent`. Boot empty chips start `aria-hidden="true"`. Optional `:not(.show) { visibility: hidden }`. Do not use `assertive`. Do not add a second live region.

**Status:** **closed in freeze.** Live expire still omits `aria-hidden` (PR1). Do not reopen this Major against the freeze.

### Findings

No 🔴 Blocker.  
No open 🟠 Major **in the freeze**.

#### 🟡 Minor: Real-show order unhides stale `textContent` before rewrite

**Location:** freeze `shared-contract.md` §0.19 and formulas “real show: aria-hidden='false' THEN textContent”; expire keeps stale text; live reuse `hud.js` 1163–1170.

**Issue:** Expire keeps the last line on the node. A later **different** allocation unhides that node first, then writes the new line. Assistive tech can speak the faded line, then the new line. Boot-empty chips do not have this race.

**Fix:** PR1: while the slot is still `aria-hidden`, write `textContent` (and live `className` / `.show`), then set `aria-hidden="false"`. Keep expire-keep-text so a hide does not announce empty. Do not clear text on expire. Do not switch the region to `assertive`.

**Status:** accepted cheap fold for freeze. Call out in PR1. Not a reason to reopen leftover.

#### 🟡 Minor: Long SAVE BLOCKED reason is `nowrap` and can cover the aim column

**Location:** `hud.css` 717–731 (`white-space: nowrap`; `right: 168px`; `align-items: flex-end`); live reason `save.js` 1028; freeze berth copy `shared-contract.md` §0.1.

**Issue:** AUTOSAVE HELD is short. Berth line is `▲ SAVE BLOCKED — Hostiles within the encounter bubble — berth record refused.` Uppercase + `letter-spacing: 0.16em` at 11 px makes a wide chip that grows left toward the reticle / AP chip stack (`hud.css` 648–658). Freeze prefers **no** `hud.css` except optional hide.

**Fix:** Prefer keep CSS. If playtest clips, shorten the **berth** authored reason in `save.js`, not wrap into the aim column, not add slots.

**Status:** accepted unless playtest clips. Not a reason to raise z.

#### 🟡 Minor: Player-initiated SAVE BLOCKED shares the polite comm queue

**Location:** `hud.js` 815–816; all `pushToast` paths including `saveBlocked` 568–569.

**Issue:** KeyL SAVE failure is a response to a player verb. It still waits behind polite combat comm. Sighted players still see the chip.

**Fix:** Keep polite. Do not add a second region this leftover. Copy split + linger hide retries so the queue is quieter.

**Status:** accepted residual. Call out for playtest with a screen reader.

#### 🟡 Minor: Toasts sit under hail/berth (z 10 vs 40/60)

**Location:** `style.css` 24–29; hail / berth z; contract §0.8.

**Issue:** While a play card is open, chips are easy to miss. Raising z would fight overlay mutex and Digit glance.

**Fix:** Do **not** raise toast z. Overlay sibling owns stacking. Player closes the card (H intent / M / L) to see HUD chips again.

**Status:** accepted residual. Do not solve overlay here.

#### 🟡 Minor: Suppress-after-fade can feel like a missed second comm

**Location:** contract post-expire suppress inside 8 s; npcFire / sunHeat “window still applies if copy matches”.

**Issue:** A second identical hail line 5 s later stays quiet. Incoming fire can stay one chip for the window. Inbox asked not to obscure **new** information; identical is not new.

**Fix:** Distinct text still shows. Owner may retune 8 s after playtest.

**Status:** accepted; deputized.

#### 💡 Suggestion: Formula comments omit boot `aria-hidden` and live `.show` class

**Location:** `shared-contract.md` formulas `pushToast` / `expire`; live create `hud.js` 818–819; live paint 1170.

**Issue:** §0.19 names boot hidden chips. The formula block does not. Allocate-as-live must still set `className` / `.show` or the chip stays opacity 0.

**Status:** PR1 follows live allocate path plus freeze a11y, not the comment stub as a full function.

#### 💡 Suggestion: Stale “top-center toasts” comment in `hud.js`

**Location:** `hud.js` 812 vs live `hud.css` 635–646.

**Issue:** Comment still says top-center. Place is top-right.

**Status:** later PR1 may fix the comment when touching `pushToast`. Do not move chips back to the aim column.

#### 💡 Suggestion: Land window, linger ring, expire hide, and `source` tag in the same PR1

**Location:** `shared-contract.md` §2 partial merge; §3 PR1 row.

**Issue:** Window-only on today’s shared SAVE BLOCKED string would **suppress** a KeyL failure after an autosave retry. Chip-tied linger would fail the named scene. Expire hide without linger still blinks.

**Status:** frozen. Restate only.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** `shared-contract.md` §0.18; `hud.css` 1183–1188, 729.

**Status:** no new toast animation. Instant show/hide under reduced motion is already the live rule.

### Contrast and states (checklist)

- **Contrast:** Default toast type is `var(--white)` `#dce8f4` on `rgba(2, 6, 13, 0.78)` (`hud.css` 9–19, 722–726). Class `warn` (both save copies) does **not** recolor text — only the left border uses `--amber` (`hud.css` 736). Comm/sting/danger/good recolor text on the same dark chip. High-contrast darkens the chip fill (`hud.css` 1167–1175). Translucent chips over a bright star field are a scene risk, not a freeze miss.
- **States:** Chips are not controls (`pointer-events: none`). No hover/focus/disabled. Empty = unshown slots. Error = SAVE BLOCKED / AUTOSAVE HELD copy. Loading = none. Expire a11y hide is **frozen** for PR1; live still missing.
- **Responsive:** `right: 168px` is a fixed inset. Small viewports plus `nowrap` is the Minor above. Do not add slots to “fix” wrap.

### Verdict

**No 🔴 Blocker. No open 🟠 Major in the freeze.** Prior Major (1) five-row **key** linger independent of chip reuse is **closed in freeze**. Prior Major (2) expire **`aria-hidden`** is **closed in freeze**. Remaining findings are 🟡/💡 only. Live `src/` still lacks both until **PR1 toast-flood**. Do not CONSUME. Still no extra slots, persist, pause, toast z, or hail toasts.
