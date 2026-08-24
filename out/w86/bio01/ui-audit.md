## UI Audit: Wave 86 BIO-01 gift / pirate seed (design freeze)

### Summary

Wave 86 ships no chrome. Later gift needs a Beautiful People confirm-papers flow; pirate needs toast/fail-closed copy only. This audit freezes Digit 0, two-step confirm, hangar-full copy, contrast/hit/reduced-motion, and `textContent`. It does **not** skip the pass.

### What's done well

- Reuses live yard confirm pattern (`shipyard-desk.js` 196–211: arm → Confirm papers → Esc cancel).
- Buy already has `'The hangar is full.'` (`shipyard-desk.js` 30) — gift/pirate reuse the same words.
- Dock `h()` already assigns `textContent` (`station.js` 4230–4233).
- Pirate has **no new glance HUD** (toast only), so HUD-01 rails stay.

### Frozen chrome (later impl)

| Surface | Freeze |
|---|---|
| Gift home | People desk at Beautiful docks (`station.js` `renderPeople`) |
| Gift verb | Two-step **Confirm papers**. Not one-click grant |
| Gift digits | Dock level-1 Digit **0 = shipyard**. Optional People level-2 Digit **1** only while gift row visible |
| Pirate chrome | **None.** `commLine` success / full. Silent miss |
| Hangar mount | Existing Hangar pane Digit 3+/0. Gift does not auto-mount |
| Copy | Contract §2.2 / §3.3 static Echo lines |

### Findings

#### 🔴 Blocker: Digit 0 must stay shipyard

**Location:** `station.js` 174, 5710–5715; contract §0.11

**Issue:** A new dock service or mid-list insert moves Digit 0. Players already learn KeyY / Digit 0 = shipyard.

**Fix applied:** No new `DOCK_KEY_SERVICES` key. Gift is a People confirm row. Yard Digit 0 remains hangar **row 8** inside shipyard level-2.

#### 🟠 Major: Confirm papers, not one-click

**Location:** live yard `setYardPending` / Confirm papers

**Issue:** A single People click that writes a hull matches the graft bug class (no warning / no Esc). Gift is free but still once-and-cap-gated.

**Fix applied:** Arm pending → Confirm papers → grant. Esc / KeyB cancel clears pending. Copy: `The berth answers. Confirm the sworn gift.`

#### 🟠 Major: Fail-closed copy must not lie

**Location:** contract §2.2, §3.3

**Issue:** Generic `No sale.` on a gift (price 0) reads as a shop. `Papers filed` on a pirate wreck reads as a yard. Full hangar must not say the seed is in cargo.

**Fix applied:**

| Reason | Copy |
|---|---|
| Gift success | `A living seed rests in the hangar.` |
| Gift full / pirate full | `The hangar is full.` |
| Gift already | `You already carry that gift.` |
| Gift gated | `No gift.` |
| Pirate success | `A living seed is yours. It waits in the hangar.` |
| Pirate miss | silent |

Same full string as buy (`shipyard-desk.js` 30) so the hangar-cap lesson transfers.

#### 🟠 Major: Pirate is toast-only (no new HUD family)

**Location:** `hud.js` 72–80

**Issue:** A BIO-01 glance chip would move HUD-01 rails and might write `hullKind`.

**Fix applied:** `commLine` only. HUD family still derives from **mounted** `hullKind`. Unmounted gift stays invisible to HUD until Hangar mount.

#### 🟡 Minor: Hit target / focus

**Location:** later People buttons

**Issue:** Dock buttons already exist; gift confirm must stay a real `<button>` with visible focus (live `.screen-btn`). Hit ≥ 24 CSS px.

**Fix:** Reuse `btn()` helper. Do not make the whole people-card a click grant.

#### 🟡 Minor: Reduced motion / colorblind

**Location:** graft already has `GRAFT_WARN_REDUCED`

**Issue:** Gift copy is status, not a color-only rank pip. Do not gate Sworn on a green badge without text.

**Fix:** Rank gate is numeric `rep >= 50` in the helper. Visible line uses words (`No gift.` / confirm). Reduced motion: same words, no extra animation.

#### 🟡 Minor: `aria-live`

**Location:** `ui.notice` on dock overlay

**Issue:** Confirm result may miss a screen reader if notice is not live.

**Fix:** Later impl: polite live region on the dock notice (toasts already live for `commLine`). Not a Wave 86 chrome ship.

#### 💡 Suggestion: Show hangar count `n/8` on the gift row

Helps the player before they confirm into a full bay. Optional. Full refuse still required.

### Accessibility checklist (later impl)

- [ ] Confirm and Cancel are real buttons with names
- [ ] Focus ring visible on the warm confirm
- [ ] Esc cancels pending (matches yard/graft)
- [ ] Copy is text, not color-only
- [ ] Contrast on notice vs dock panel (reuse live dock CSS)
- [ ] No `innerHTML`
- [ ] No keyboard steal of WASD / Digit 0 at dock level-1

### No-new-chrome (pirate only)

Pirate seed adds **no** panel. Evidence: contract §3.3; live wreck path already has no desk (`npc.js` 2146–2177). Gift **does** add People chrome later; that is why this audit is not skipped.

### Method

Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Blocker/Major resolved in contract/brief before DONE.
