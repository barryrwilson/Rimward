## UI Audit: Hail02 PR1 named miss toasts

**Persona:** designer (parent pass). Review only. Did not edit product source. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `references\ui-audit.md`. Merge law: `out/w128/hailmiss/shared-contract.md` wins over `docs/Hail02MissFeedbackDesign.md`. Worker self-audit `out/w129/hailmiss/ui-audit.md` checked, not rubber-stamped. No stills under `out/w129/hailmiss/`.
**Scope:** `src/systems/hud.js` `hailMissToast` / `toastForEvent` `'hailMiss'` branch; `src/systems/hail.js` emit copy/reason tokens (player-facing strings); existing toast CSS consumption only. Do not demand a restyle of `.rw-toast`.

### Summary

PR1 lands named KeyH/KeyJ miss copy on the live HUD-04 toast stack. Subject, verb, and reason live in `textContent`. Color (`cls: 'warn'`) is extra. No new Digit, hub pip, hail card, toast slot, linger window, or animation. No Blocker. No Major.

### What's done well

- Authored lines match the freeze table: em dash ` — `, `cls: 'warn'`, overlay sentences name chart/berth (`hud.js` **776–784**; `hail.js` **176–185**, **887–890**; contract **109–118**).
- Range copy names integer `u` only when `dist` is finite; emit drops non-finite dist (`hud.js` **773–778**, **783**; `hail.js` **203–204**; contract **38**).
- Stable key `warn|hailmiss|{verb}|{reason}|{keyName}` omits distance; `{keyName}` strips `|` and C0, cap 48 (`hud.js` **746–755**, **790–791**; contract **122–123**). HUD-04 linger stays 8 s (`hud.js` **70**, **536–546**, **1349–1357**).
- Same-frame skip if `hailOpened` / `docked` / `jumpRequested` / `'No passage.'` (`hud.js` **761–768**; `hail.js` **312–316**, **880**). Success is the card or dock/jump, not a fake parley.
- Overlay miss names the lock and does not close chart/berth. Pause is not the miss channel (`hail.js` **863–890**).
- Subject is current lock, station name, or nearest gate dest — never an unseen hull (`hail.js` **211–231**, **349–369**). Empty lock is `No lock — hail` (`hud.js` **776**; `hail.js` **197**, **252**).
- Disabled hulk out of range uses verb `salvage`; live / rock / station lock uses `no-hail` rather than a fake hail-range (`hail.js` **254–265**; `hud.js` **777–782**). Inbox salvage line is the range shape.
- Toast write is `textContent` only (`hud.js` **1370**). `hail.js` has no `innerHTML`. Event payload is primitives; no `ship` (`hail.js` **202–205**; `ctx.js` **243**).
- Existing announcer: `.rw-toasts` is `role="status"` `aria-live="polite"`; chips start `aria-hidden="true"` and flip on show/expire (`hud.js` **984–993**, **1369**, **1403**). `pointer-events: none` (`hud.css` **701**).
- Themed class is `.rw-toast.warn`: amber left border, `color: var(--white)` (`hud.css` **773–793**). Text carries the miss.
- `reducedMotion` already kills HUD transitions (`hud.css` **1252–1258**). This pack adds no `@keyframes` and no new toast motion.
- HUD-01: no miss pip on `.rw-reticle`. Toast path does not touch hub, rails, Digit 0/8/9, or hail digits 1..n.

### Honor (PR1)

| Check | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px hub | Pass | `hud.js` **739–795** listeners only; reticle **911–914**, **1453** untouched |
| No new Digit | Pass | Range is toast text `{n} u`, not a Digit |
| No fake hail card | Pass | `emitHailMiss` emits only (`hail.js` **188–205**); salvage still `openCard` on success **881–883** |
| Toasts stay `textContent` | Pass | `hud.js` **1370**; `hailMissToast` returns `{ text }` **791** |
| HUD-04 8 s linger; no extra slots | Pass | `hud.js` **68–70**, **990–995**; key **791** |
| Color is not the only cue | Pass | Name + verb/reason in text **776–784**; `warn` border only `hud.css` **793** |
| `reducedMotion`: no new animation | Pass | No new transition; existing fade already gated `hud.css` **1254–1257** |

### Copy map (player-facing)

| Token | HUD literal | Emit |
|---|---|---|
| `none` | `No lock — hail` | `hail.js` **197**, **252** |
| `range` + salvage | `{name} — salvage out of range ({n} u)` | classify disabled **264** |
| `range` + hail | `{name} — hail out of range ({n} u)` | HUD fallback **778**; classify does not emit hail+range |
| `overlay-chart` | `{name} — hail blocked (chart)` | KeyH mutex **866–888** |
| `overlay-berth` | `{name} — hail blocked (berth)` | KeyH mutex **867–888** |
| `calm` | `{name} — hail calm` | KeyH **890** |
| `no-hail` | `{name} — no hail` | classify **262**, **265** |
| `dock-range` | `{name} — dock out of range ({n} u)` | KeyJ **369** |
| `jump-zone` | `{name} — jump not in zone` | KeyJ **359** (no dist) |

Name fallbacks: `No lock` / `Station` / `Gate` / `Rock` (`hail.js` **196–200**, **214–227**). Display uses the primitive; linger key uses `hailMissKeyName` (`hud.js` **746–755**, **772**).

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Existing toast `text-transform: uppercase`

**Location:** `src/ui/hud.css:773–776` `.rw-toast`
**Issue:** Miss copy paints uppercase like every other toast. Mixed-case pilot names become all-caps.
**Fix:** Do not restyle Hail02. Text still names ship + reason.
**Status:** accepted (HUD-04 honor)

#### 🟡 Minor: `white-space: nowrap` clips long names

**Location:** `src/ui/hud.css:786`; stack `hud.css:691–701` (`right: 168px`)
**Issue:** A long `{name} — salvage out of range ({n} u)` can overflow the toast row on a narrow view.
**Fix:** Same clip as Hail01 demand announce. Do not add a second stack or wrap layout (HUD-07 steal).
**Status:** accepted

#### 🟡 Minor: Overlay miss uses verb `hail` on a hulk

**Location:** `src/systems/hail.js:887–888`; `src/systems/hud.js:779–780`
**Issue:** A disabled lock with the chart open reads `{name} — hail blocked (chart)`, not salvage blocked.
**Fix:** Leave the one overlay sentence. Owner may split after playtest.
**Status:** accepted (freeze)

#### 🟡 Minor: Jump miss has no distance clause

**Location:** `src/systems/hail.js:359`; `src/systems/hud.js:784`
**Issue:** Inbox range example includes `(732 u)`. Jump copy is `{name} — jump not in zone`. Dest may be a system name, not the word Gate.
**Fix:** Keep zone copy. Do not invent a second range number or a second toast.
**Status:** accepted

#### 🟡 Minor: HUD-04 linger can show a stale `{n} u`

**Location:** `src/systems/hud.js:70`, **536–546**, **1349–1354**, **791**
**Issue:** Identical-key linger extends or hides without rewriting `textContent`. Closing from 732 u to 650 u within 8 s still shows `(732 u)` until linger ends. In-range salvage opens a card and skips miss.
**Fix:** Leave HUD-04. Putting `{n}` in the key would flood.
**Status:** accepted (HUD-04 honor)

#### 🟡 Minor: KeyJ is one toast (nearer pad vs gate)

**Location:** `src/systems/hail.js:349–369`
**Issue:** Dual miss is one line. Nearest finite gate vs station distance picks jump-zone vs dock-range. Two sentences would spend two of five slots.
**Fix:** Keep one emit. Do not dual-stack.
**Status:** implemented as freeze asked

#### 🟡 Minor: Same-frame `hailOpened` skips overlay refuse

**Location:** `src/systems/hail.js:880`; `src/systems/hud.js:766`
**Issue:** Any `hailOpened` this frame (including a deferred Hail01 demand) suppresses miss. Chart-open KeyH then has no overlay toast that frame.
**Fix:** Leave Hail01 skip. Collision is rare. Do not toast miss on an open or opening demand card.
**Status:** accepted (card-is-outcome)

#### 💡 Suggestion: Align bargain prompt later

**Location:** `src/systems/hud.js:2447–2449`
**Issue:** Context prompt still shows `H — Hail` on bargaining / capitulate locks. Toast says `{name} — no hail`.
**Fix:** HUD-07 / owner. PR1 toast is the additive truth line. Do not rewrite the prompt block here.

#### 💡 Suggestion: Do not restyle `.rw-toast` or switch `aria-live` to `assertive`

**Location:** `src/ui/hud.css:773–795`; `src/systems/hud.js:986–987`
**Issue:** Uppercase, nowrap, polite live region, and warn border are the HUD-04 channel. Assertive would interrupt every HUD toast.
**Fix:** Consume as-is.

### Accessibility

- [x] Subject named in text
- [x] Verb named in text
- [x] Reason named in text
- [x] Distance named when range is the reason and dist is finite
- [x] Color is not the only cue
- [x] Existing `role="status"` `aria-live="polite"` region; no new live region
- [x] `textContent` only; expire `aria-hidden="true"`
- [x] No new Digit
- [x] No new focus target; `pointer-events: none`
- [x] No new animation (`reducedMotion` unchanged)
- [x] High-contrast already darkens toast chrome (`hud.css` **1236–1245**)

### Verdict

**CLEAN.** Named miss feedback is a HUD-04 `warn` toast: subject, verb, reason, and finite range in `textContent`. Color is extra. Overlay block is copy, not pause. No fake card. No hub pip. No second stack. No Blocker. No Major.
