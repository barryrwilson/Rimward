## UI Audit: later BIO-01 Sworn gift (People) + pirate seed (toast)

### Summary

The later UI freeze is implementable on live dock chrome. Gift is a Beautiful **People** two-step confirm (yard papers pattern). Pirate is `commLine` toast only. Digit 0 stays shipyard. Copy is static `textContent`. Price is 0 with no fake UU. Hangar-full uses the live buy string. No remount-on-grant. Reduced-motion keeps the same words.

**Verdict: CLEAN**

Wave 86 ships no chrome. Later PR2/PR3 must copy the live widgets cited below. Do not invent a panel, Digit, or HUD family.

### What's done well

- Gift home is `renderPeople` (`station.js` 5338–5345), not a new `DOCK_KEY_SERVICES` key (`station.js` 174). Dock Digit 0 stays last-service shipyard (`station.js` 5710–5715).
- Two-step matches live yard papers: arm → **Confirm papers** → grant; Esc cancel (`shipyard-desk.js` 121–133, 196–211). People already has the same shape on traffic/launder (`station.js` 1842–1864, 1504–1525) and restitution (`station.js` 5497–5505).
- Confirm controls are real `<button type="button">` via `btn()` (`station.js` 4237–4241). Focus ring is visible (`screens.css` 88–99). Warm primary vs Esc cancel is already the yard/graft hierarchy (`shipyard-desk.js` 203–210).
- Price **0** freeze forbids a shop meta line. Arm copy is words only (`The berth answers. Confirm the sworn gift.`), not `0 UU`.
- Full hangar copy is the live buy line `'The hangar is full.'` (`shipyard-desk.js` 30). Gift/pirate reuse that string so the cap-8 lesson transfers.
- Labels go through `h()` `textContent` (`station.js` 4230–4233). Overlay wipe is `overlay.textContent = ''` (`station.js` 5598). `station.js` has no `innerHTML`.
- Pirate adds **no** desk. HUD toasts already `role="status"` + `aria-live="polite"` (`hud.js` 735–736). `commLine` is an existing toast class (`hud.js` 472–480). Reduced-motion already kills toast transitions (`hud.css` 1106–1112).
- Gift does not auto-mount. HUD family still reads mounted `hullKind` only (`hud.js` 72–80). Unmounted seed stays off the glance rails.
- Rank is already numeric text on the dock (`station.js` 5619–5623; `RANK_LADDER` Sworn min 50 at `state.js` 672–673). Gate copy `No gift.` is words, not a color pip.
- Helper re-check is frozen (UI hide is not a gate). That matches live yard confirm, which re-reads stock/credits on confirm.

### Frozen later chrome (do not reopen)

| Surface | Freeze | Live cite |
|---|---|---|
| Gift desk | Beautiful People, desk-level confirm row | `station.js` 5338; traffic desk 1836–1864 |
| Gift verb | Two-step **Confirm papers**. Not one-click | `shipyard-desk.js` 196–211, 304 |
| Gift price chrome | None. No UU. Arm line only | contract §2.2 |
| Gift digits | Dock level-1 Digit **0 = shipyard**. Optional People level-2 Digit **1** only while the gift row is visible | `station.js` 174, 5710–5715 |
| Hangar after grant | Existing shipyard Hangar pane (Digit 1 **inside shipyard**, hull Digit 3+/0). No `switchTo` | `shipyard-desk.js` 14–16, 285–298 |
| Pirate | Toast only. Silent miss | `hud.js` 732–736; contract §3.3 |
| Full | `The hangar is full.` | `shipyard-desk.js` 30 |
| XSS | `textContent` / `h()` / `el()` | `station.js` 4230–4233 |

### Findings

No 🔴 Blocker. No 🟠 Major. The freeze matches live People/yard/toast patterns. Later impl must not reopen the items below as new chrome.

#### 🟡 Minor: Gift is desk chrome, not a people-card click

**Location:** `station.js` 5338–5345 (empty roster `return`); 5356–5394 (`people-card` / `people-actions`)

**Issue:** `renderPeople` returns after rescue + traffic if `contactsForSystem` is empty. A gift button only on a contact card would vanish on an empty roster, or turn the whole card into a grant hit target (already forbidden in `out/w86/bio01/ui-audit.md`).

**Fix:** Later PR2: render the gift block at desk level, **before** the empty return, same as `renderTrafficDesk` (`station.js` 5340–5341). Real `btn()` only. Do not bind grant to the card.

#### 🟡 Minor: Gift pending must join live cancel / leave lists

**Location:** `station.js` 4207–4227 (ui bag); 5628–5636 (Back); 5646–5656 (`selectService`); 5682–5698 (`undock`); 5722–5724 (Esc on People)

**Issue:** Live two-step flags (`trafficPending`, `launderPending`, `yardPending`, `graftPending`, `restitutionPending`) clear on Esc (stay on desk), Back, service change, and undock. KeyB at level-2 undocks (`station.js` 5736) and does not grant. A gift pending left on `ui` would re-show Confirm papers on the next Beautiful People visit.

**Fix:** Session `giftPending` (name as later impl prefers) on the same clear paths. Esc cancels pending and **stays on People** (mirror 5724). Helper still re-checks dock/banner/rank/once/cap so a stale pending cannot write in space.

#### 🟡 Minor: Optional Digit 1 arms only — it must not grant

**Location:** contract §2.2 “arm/confirm”; live `handleShipyardDigit` `shipyard-desk.js` 317–322 (`if (ui.yardPending) return true`)

**Issue:** People level-2 currently has **no** Digit handler (`station.js` 5747–5775: jobs/bar/feed/repair/outfitting/launch/shipyard only). Default is button-first (brief open Q3). If later Digit 1 both arms **and** grants in one press, that is the one-click class already closed.

**Fix:** Digit 1 may arm **only while the gift row is visible**. While pending, Digit 1 is a no-op (yard pattern). Grant stays on the named **Confirm papers** button (click or keyboard activation of that button). Never steal dock Digit 0–9. Never treat “Hangar Digit 1 pane” as dock Digit 1 (dock Digit 1 is Market).

#### 🟡 Minor: Prefer yard confirm row over compact People padding

**Location:** `screens.css` 376–378 (`.people-actions .screen-btn` padding 4px 10px); 74–77 (`.screen-btn` padding 7px 12px); 88–99 (focus); `shipyard-desk.js` 200–210 (`.shipyard-buy-row.shipyard-confirm`)

**Issue:** Compact People actions can fall under a 24 CSS px hit target. Yard/graft confirm rows use full-width `.screen-btn` plus visible `focus-visible` outline.

**Fix:** Reuse `.shipyard-buy-row.shipyard-confirm` (or equivalent full-width `btn()`). Warm class on Confirm papers. Secondary Esc — Cancel. Do not shrink the gift confirm to `.people-actions` padding.

#### 🟡 Minor: Dock notice is not a live region today

**Location:** `station.js` 5641 (`station-notice`); `screens.css` 170–176; contrast `screens.css` 88–93 / 541

**Issue:** Gift success / full / already / `No gift.` land on `ui.notice` like yard buy. That node has no `aria-live`. Pirate toasts **are** live (`hud.js` 735–736). Screen readers already miss yard “Papers filed…” the same way. 1 s docked `render()` rebuild (`station.js` 5824–5825) also drops focus; that is live dock law, not new gift motion.

**Fix:** Later impl: `aria-live="polite"` on the dock notice (ui-audit checklist). Reuse `.station-notice` (warm token, not a new color). Same words under reduced motion. No extra animation. Do not emit a second HUD toast for docked gift unless product later asks; pirate stays `commLine` only.

#### 💡 Suggestion: Hangar count `n/8` on the gift row

Optional. Helps before confirm into a full bay. Full refuse copy still required. Do not replace the helper cap check.

#### 💡 Suggestion: Name living `light` on the armed row

Arm line stays `The berth answers. Confirm the sworn gift.` Meta may say living light in words (class label pattern at `shipyard-desk.js` 201). Do not show UU. Do not show raw id `hull_seed_gift` as the title.

#### 💡 Suggestion: Pirate toast length vs `.rw-toast` nowrap

**Location:** `hud.css` 653–667 (`white-space: nowrap`); copy `A living seed is yours. It waits in the hangar.`

Existing comm toasts already nowrap. Frozen Echo lines are short enough. Owner may retune wording only (brief open Q5). Do not add a pirate panel to wrap the line.

### Accessibility checklist (later impl)

- [ ] Confirm papers and Esc — Cancel are real named buttons (`btn()`, `type="button"`)
- [ ] Confirm uses `screen-btn-warm`; focus-visible ring stays (`screens.css` 95–99)
- [ ] Esc cancels gift pending on People; Digit 0 at dock level-1 still opens shipyard
- [ ] Keyboard: Tab to confirm; optional Digit 1 arms only; digits never debit/grant
- [ ] Copy is text, not color-only (`No gift.` / full / already / success)
- [ ] Contrast: reuse `.station-notice` / `.screen-btn` / toast tokens; no new gift palette
- [ ] No `innerHTML`; static Echo strings via `textContent`
- [ ] Reduced motion: same gift words; pirate toast uses existing `rw-reduced-motion` kill
- [ ] Pirate: no new panel; `commLine` `{ text, from: 'echo' }` or omit `from`; silent miss
- [ ] No remount: do not call Hangar `switchTo` from gift UI; mounted id unchanged
- [ ] Hit target: full-width confirm, not compact 4px People padding
- [ ] Dock notice polite live region (pirate already live)

### States (later impl)

| State | Gift (People) | Pirate |
|---|---|---|
| Default / empty | Hide or omit row when not Beautiful / not Sworn; helper still fail-closed `No gift.` | No chrome |
| Arm | Confirm papers + Esc — Cancel. Arm copy, no UU | — |
| Loading / busy | Sync grant; optional `giftBusy` like graft (`shipyard-desk.js` 159) | Sync hook |
| Success | `A living seed rests in the hangar.` Notice. Stay on People. Hangar gains row | `commLine` `A living seed is yours. It waits in the hangar.` |
| Full | `The hangar is full.` No eviction. No cargo consolation | Same string, toast |
| Already | `You already carry that gift.` | n/a (repeatable ids until cap) |
| Gated | `No gift.` | Silent |
| Disabled | Do not fake-disable without a name; refuse copy is the state | Silent / full toast |
| Focus / hover | Live `.screen-btn` | Toast is not a control (`pointer-events: none`, `hud.css` 599) |

### No-new-chrome (pirate)

Pirate seed adds **no** panel and **no** Digit. Evidence: contract §3.3; wreck path has no desk; HUD-01 rails stay (`hud.js` 72–80). Gift **does** add People chrome later; that chrome is the yard/People confirm already in tree.

### Method

Read `docs/Bio01ObtainDesign.md`, `out/w86/bio01/shared-contract.md`, `out/w86/bio01/ui-audit.md`, and live `station.js` People / Digit 0, `shipyard-desk.js` confirm, `hud.js` toasts, `screens.css` / `hud.css`. Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Review only. No `src/` edits. No brief edits.

**CLEAN** — freeze is implementable and accessible against live People / Confirm papers / toast patterns. Later worker copies those widgets; does not invent chrome.
