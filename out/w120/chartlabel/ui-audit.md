# UI Audit: NAV-07 leftover chart-label a11y (Wave 120)

### Summary

No product chrome ships this wave. Spec picture is: open Galaxy Chart, **click a system name** to plot, **tab to Destination** (under the desc) and pick any charted system without a mouse on an invisible disc; typeahead **M** does **not** close the map (`isTypingFocus` skip on the **existing** KeyM handler); Autopilot / Close stay in the top row; hover still inspects; chart does **not** close on plot (sibling AP-close owns engage success). Keys stay M / Escape. Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. Leftover stays **REAL**. `reducedMotion`: no new dest/label animation.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit of later player outcome (label hit + dest list). Did **not** start Vite or Chrome. `[NO BROWSER COVERAGE]`. This leftover **is** UI policy — audit not skipped. Reduced coverage: live click not run.

### What's done well

- Reuses live `.rw-galaxy-chart` dialog (`galaxychart.js` **110–117**; `hud.css` **1899–1916**) and live NAV-01 `plotRoute` / `clearRoute`. Dest `<select id="rw-galaxy-dest">` sits **under the desc**, not a second overlay.
- Live close already named: M, Escape, `aria-label` Close galaxy chart (**156–160**, **698–713**). Dest typeahead uses the **existing** KeyM handler skip (`isTypingFocus`). Escape still closes.
- Accessible names live on HTML options (`textContent`), not on SVG `role=img` children (**195–201**). That split matches how AT treats the map as one image.
- Tab order freeze: Clear → Autopilot → Close (top actions), then Destination under desc. **No** 100-disc tab trap. **No** autofocus on open (sibling AP-close blur still works).
- `:focus-visible` must match live chart buttons (`hud.css` **2002–2012**). `min-height` 24 matches live Clear/AP/Close (**1973–1987**) and WCAG 2.5.8.
- Label enlarge uses the **visible name box** instead of growing invisible discs over Autopilot / Close.
- Hover stays inspect (`role=status` **314–318**). Plot stays a click/change. Color is not the only plot cue: dest square + plot stroke + status text already exist (**507–548**).
- Empty hub freeze: no dest pip on `.rw-reticle`.
- `aria-modal=false` (**114**) stays honest: dest pick does not pause the sim.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Labels are paint-only; plot is an invisible mouse disc

**Location:** `hud.css` **2126–2132** `pointer-events: none`; `galaxychart.js` **283–291**, **659–661**.

**Issue:** Inbox P2. Player clicks the name. Nothing plots unless the pointer also hits a transparent 24 CSS px circle on the node (offset below the glyph at `y + HUB_RING_R + 16`). Keyboard users never reach generated dests.

**Fix landed (markdown):** PR1 label `data-system-id` + `pointer-events: all` + shared `activateSystem`; dest `<select>` for all charted systems.

**Status:** closed in contract §0.1. Do not reopen as CONSUME because discs are already 24 CSS px.

#### 🟠 Major (closed in freeze): No accessible name / keyboard dest

**Location:** SVG `role=img` **195–201**; no `tabindex` on hits/labels; keydown KeyM/Escape only **698–713**.

**Issue:** Screen readers get one map image. Tab order skips systems. Hover readout is pointer-only.

**Fix landed (markdown):** labeled HTML `<select>` outside the SVG; options `textContent` = `destLabel`; native keyboard typeahead; sync `select.value` from `nav.dest`.

**Status:** closed in contract §0.1 / §0.19.

#### 🟠 Major (closed in freeze): Dest typeahead KeyM would close the chart

**Location:** live `galaxychart.js` **700–704** always `setOpen(false)` when open; `overlay-policy.js` `isTypingFocus` **72–80** includes SELECT; designer audit.

**Issue:** Native dest `<select>` typeahead uses letter keys. **M** is also the chart toggle. Without a skip, keyboard dest search closes the map.

**Fix landed (markdown):** Existing KeyM handler: if `open` and `isTypingFocus()`, do **not** `setOpen(false)`. Call live helper. Not a remap. Not a new listener. Escape still closes. Overlay-policy body unchanged. Partial merge without this skip is **forbidden**.

**Status:** closed in contract §0.1 / §0.3 / §0.7 / §4.

#### 🟡 Minor (closed in freeze): Dest layout home

**Location:** contract §0.1 Dest layout; live header **123–168**.

**Issue:** Dest on the title/actions row can shrink Autopilot / Close.

**Fix landed (markdown):** Dest label+select **under the desc**. Top actions keep Clear / Autopilot / Close at 24 px. Do not cover SVG. Do not raise z.

**Status:** closed in contract §0.1.

#### 🟡 Minor: Label/disc overlap after labels gain pointer-events

**Location:** layer order **293–295** labels above hits; label at `y + 31` chart units.

**Issue:** Click on the glyph plots via label. Click on the node still hits the disc. Two targets, one `activateSystem` — OK. Overlapping **neighbor** labels on dense generated clusters are rare because generated nodes have **no** labels.

**Status:** accepted. Topmost label wins. Same as overlapping discs today.

#### 🟡 Minor: Desc copy still says “Click a system”

**Location:** desc **173**.

**Issue:** After PR1, players also use Destination and labels. Optional later `textContent` tweak (not `innerHTML`). Not required if the dest `<label>` is visible.

**Status:** optional; do not block PR1.

#### 💡 Suggestion: Do not invent a custom combobox as required PR1

**Location:** contract search-input non-pick.

**Issue:** Native `<select>` typeahead is smaller and has a platform a11y tree. A custom listbox risks `innerHTML` and extra live regions.

**Status:** frozen. Owner may override after playtest.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.18; `hud.css` **2265–2268** already zeros chart motion.

**Status:** no dest open animation; do not add a tween.

#### 💡 Suggestion: Do not steal sibling AP-close focus

**Location:** sibling `setOpen` blur **432–439**; contract §0.11 / §0.19.

**Issue:** Autofocus dest on chart open would fight close-blur and steal first tab from Close for mouse users who only needed to plot with a click.

**Status:** frozen **no autofocus**.

### Theming / states

- Dest `<select>` must use chart tokens (`--white`, `--panel-edge`, `--rw-accent` on focus). Do not invent a second palette.
- Disabled: not required. Empty first option is the idle state.
- Contrast: labels already restyle under `body.rw-contrast` (**2252–2254**). Dest control must remain readable in that class.
- Colorblind: plot already uses stroke pattern (`hud.css` **2041–2068**). Dest pick does not rely on node fill.
