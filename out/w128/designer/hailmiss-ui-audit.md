## UI Audit: Hail02 miss-feedback later UI freeze

**Persona:** designer (parent pass). Review only. Did not edit `src/`. Did not edit `docs/Hail02MissFeedbackDesign.md`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + designer persona. Merge law: `out/w128/hailmiss/shared-contract.md` wins over the design doc. Worker self-audit: `out/w128/hailmiss/ui-audit.md` — checked, not rubber-stamped.
**Scope:** later PR1 named miss toast (subject / verb / reason / range). Live hail/HUD is **cite only**. Wave 128 is markdown freeze; no product UI ships this wave.

### Summary

The later freeze names a HUD-04 miss toast, not a card, pip, or second stack. Copy tables name subject, verb, reason, and finite range in **text**. `textContent` is mandatory. Color (`cls: 'warn'`) is extra. Overlay refuse is a named sentence. A11y rides the existing `rw-toasts` `role=status` `aria-live=polite` region. No new live region is required if PR1 stays on `toastForEvent` / `pushToast`. No Blocker. No Major remain open in this freeze.

### What's done well

- Inbox shape is frozen: `{name} — hail out of range ({n} u)` with em dash (`shared-contract.md` **109–120**, **120**).
- Deputize splits **verb** (`hail` / `salvage` / `dock` / `jump`) from **reason** tokens (`none` / `range` / `overlay-chart` / `overlay-berth` / `calm` / `no-hail` / `dock-range` / `jump-zone`) (`shared-contract.md` **83–85**, **109–118**).
- Range copy includes integer `u` only when distance is finite; non-finite omits `(n u)` and still names subject + reason (`shared-contract.md` **38**, **91**).
- Distance is **out** of the linger key so meter change cannot flood HUD-04 (`shared-contract.md` **27**, **122–123**; live `hud.js` **70**, **1293–1304**).
- Channel is existing `pushToast` / `toastForEvent` only. Slot count stays 5. Linger stays 8 s. Lifetime stays 4 s (`shared-contract.md` **27**; `hud.js` **68–70**, **1293–1317**).
- Fake hail card is forbidden. Pause is forbidden. Fear is not the miss channel (`shared-contract.md` **92–93**, **100**).
- Overlay copy names **chart** / **berth** in the sentence: `{name} — hail blocked (chart)` / `(berth)` (`shared-contract.md` **113–114**). Overlay stays open. `flags.paused` stays false.
- Skip lists keep miss copy off title / typing / models / settings / open card / successful dock or jump / standing `'No passage.'` (`shared-contract.md` **86**, **40–43**).
- XSS path is closed for UI: primitives only, no `ship` on the event, `innerHTML` / `insertAdjacentHTML` / `document.write` forbidden, toast write stays `textContent` (`shared-contract.md` **34**, **36**; live `hud.js` **1317**; `hail.js` has no `innerHTML`).
- `reducedMotion`: no new animation (`shared-contract.md` **45**). Existing toast fade is HUD-04; this pack does not add `@keyframes`.
- HUD-01 empty 80 px hub: no miss pip on the aim glass (`shared-contract.md` **22**).
- Unseen / unselected contact cannot be the subject (`shared-contract.md` **83**, **100**). `No lock — hail` is the empty-lock line.
- Themed class is `cls: 'warn'`. Live `.rw-toast.warn` tints the left border with `var(--amber)` and keeps `color: var(--white)` (`hud.css` **773–793**). Text carries the miss; color is redundant.
- Existing announcer: `.rw-toasts` is `role=status` `aria-live=polite`; chips start `aria-hidden=true` and flip on show/expire (`hud.js` **931–941**, **1316–1317**, **1347–1350**). `pointer-events: none` — miss toast does not steal focus or click.

### Must-check (later freeze vs live HUD)

| Check | Result | Cite |
|---|---|---|
| Copy names **subject**, **verb**, **reason**, **range** in text | Pass | `shared-contract.md` **16**, **78**, **109–118**; design **198**, **240–248** |
| `textContent` only; no `innerHTML` of ship names | Pass | `shared-contract.md` **34**, **36**; live `hud.js` **1317** |
| HUD-04 linger reuse; no second toast stack; no extra slots | Pass | `shared-contract.md` **27**; `hud.js` **69–70**, **936–942**, **1293–1317** |
| Color is not the only cue | Pass | `shared-contract.md` **45**, **106**; `hud.css` **793** (`warn` border only) |
| No fake hail card | Pass | `shared-contract.md` **92**, **100**; design **200**, **277** |
| Overlay-blocked copy names chart/berth; does not pause | Pass | `shared-contract.md` **88**, **113–114**; `overlay-policy.js` **4**, **118–127** |
| A11y: existing toast live region; no new `aria-live` | Pass (implicit) | live `hud.js` **931–934**; freeze forbids a second stack (`shared-contract.md` **27**) |
| No new Digit; KeyH/J/L/M/P stay | Pass | `shared-contract.md` **22–23** |
| HUD layout / prompt block not claimed | Pass | `shared-contract.md` **12**, **97**; `hud.js` **2394–2396** cite only |
| `reducedMotion`: no invented miss animation | Pass | `shared-contract.md` **45** |

Worker `out/w128/hailmiss/ui-audit.md` is copy-correct on silent-miss leftover, color-only forbid, second-stack forbid, and fake-card forbid. This pass adds the live-region cite the worker file omitted.

### Findings

No 🔴 Blocker or 🟠 Major remain open in the integrator freeze. Live silent KeyH / KeyJ and the lying bargain prompt are leftover **REAL** and are the PR1 toast job, not CONSUME.

#### 🟠 Major (accepted, not stolen): Bargain prompt `H — Hail` still lies until HUD-07

**Location:** live `src/systems/hud.js:2394–2396`; freeze `shared-contract.md:97`
**Issue:** Context prompt still teaches a player combat hail that KeyH cannot open. After PR1 the toast will say `{name} — no hail` while the prompt still says `H — Hail`.
**Fix:** Do not rewrite the prompt block in Hail02 PR1 (layout steal). Toast is the additive truth line. Owner may align later.
**Status:** accepted (same as worker)

#### 🟡 Minor: Overlay miss uses verb `hail` even on a hulk

**Location:** `out/w128/hailmiss/shared-contract.md:113–114` (`overlay-chart` / `overlay-berth`)
**Issue:** A disabled lock with the chart open reads `hail blocked (chart)`, not `salvage blocked (chart)`.
**Fix:** Leave the one overlay sentence. Owner may split salvage vs hail overlay copy after playtest.
**Status:** accepted (same as worker)

#### 🟡 Minor: Jump miss has no distance clause

**Location:** `out/w128/hailmiss/shared-contract.md:118`; live `src/systems/gate.js:651–666`
**Issue:** Inbox range example includes `(732 u)`. Jump zone is a gate bubble. When not in zone, `ctx.gate.nearTo` is **null**, so subject falls back to `'Gate'`.
**Fix:** Keep `{name} — jump not in zone`. Do not invent a second range number.
**Status:** accepted (same as worker)

#### 🟡 Minor: `No lock — hail` does not name a ship

**Location:** `out/w128/hailmiss/shared-contract.md:110` token `none`
**Issue:** Inbox wants a named subject. There is no selected contact.
**Fix:** Keep `'No lock'`. Naming an unseen hull would violate the unseen-contact rule.
**Status:** accepted (same as worker)

#### 🟡 Minor: KeyJ dual-miss precedence is one toast, not two sentences

**Location:** `docs/Hail02MissFeedbackDesign.md:175–180`; `shared-contract.md:84–85`, **159**; live `station.js:6321–6330`, `gate.js:678–679`
**Issue:** KeyJ is dock **or** jump. When pad and gate both fail, the freeze says one emit, then `dock-range` **or** `jump-zone`. It does not pick which subject wins. Two toasts would spend two of five HUD-04 slots.
**Fix:** PR1 should emit **one** line. Prefer dock-range when a live station mesh exists; else jump-zone with `'Gate'` (nearTo is null out of zone). Do not dual-stack.
**Status:** open for PR1 (not a freeze Blocker)

#### 🟡 Minor: HUD-04 linger can show a stale `{n} u`

**Location:** live `src/systems/hud.js:1293–1304`, **536–545**; freeze `shared-contract.md:122–123`
**Issue:** Identical-key linger extends or hides without rewriting `textContent`. Closing from 732 u to 650 u within 8 s still shows `(732 u)` until linger ends. In-range salvage opens a card and skips miss, so the harmful case is already gated.
**Fix:** Leave HUD-04. Putting `{n}` in the key would flood. Do not retune slot/linger.
**Status:** accepted (HUD-04 honor)

#### 🟡 Minor: Contract does not name the existing live region in words

**Location:** `out/w128/hailmiss/shared-contract.md:27`, **16**; live `src/systems/hud.js:931–934`
**Issue:** A11y freeze names subject/verb/reason/range in text. It does not say `role=status` / `aria-live=polite` on `.rw-toasts`. A later writer could add a nested live region on the chip or a miss overlay.
**Fix:** PR1 must only write the existing `toastForEvent` → `pushToast` path. Do **not** add `aria-live` on a new node. Do **not** switch the stack to `assertive` (that would retune every HUD toast).
**Status:** implicit pass if PR1 stays on HUD-04; name it in the PR checklist

#### 💡 Suggestion: Do not restyle uppercase / nowrap toasts

**Location:** live `src/ui/hud.css:773–786` (`text-transform: uppercase`, `white-space: nowrap`); toasts at **691–701** (`right: 168px`)
**Issue:** Authored mixed-case copy will paint uppercase. Long `{name} — salvage out of range ({n} u)` can clip on a narrow view. Demand toasts already live with the same chip.
**Fix:** Do not claim `hud.css` in Hail02. Overflow wrap is HUD-07 / HUD-04, not this leftover.

#### 💡 Suggestion: Do not change toast `aria-live` to `assertive` for miss

**Location:** live `src/systems/hud.js:933–934`
**Issue:** A KeyH miss is a direct reply to a press. `assertive` would interrupt other HUD toasts and is a channel rewrite.
**Fix:** Keep `polite` on the existing region. Text + linger already limit SR flood.

#### 💡 Suggestion: Align HUD prompt after playtest

**Location:** live `src/systems/hud.js:2394–2396`
**Issue:** If PR1 toast is enough, leave `H — Hail` on bargain locks. If playtest still taps H expecting a card, a later HUD-07 slice can hide that prompt.
**Fix:** Not Hail02 PR1 layout.

### A11y

- Subject, verb, reason, and (when range + finite) distance are **named in text**. `cls: 'warn'` is not the only cue.
- Announcer is the existing toast live region (`role=status`, `aria-live=polite`). Chips use `textContent`. Expire sets `aria-hidden=true`.
- No new Digit. No new focus target. Miss toast is `pointer-events: none` and does not move focus.
- Overlay refuse is a readable sentence (`blocked (chart)` / `(berth)`), not a color pip.
- Contrast: `.rw-toast.warn` keeps `var(--white)` on `rgba(2, 6, 13, 0.78)`; amber is the border only. High-contrast mode already darkens toast chrome (`hud.css` **1236–1245**). Do not hardcode a miss color.
- `reducedMotion`: no new miss animation. Do not add a hailMiss transition.

### HUD-04 / overlay / fake card (cite only)

- `TOAST_SLOTS = 5`, `TOAST_LIFETIME = 4`, `TOAST_DEDUP_WINDOW = 8` (`hud.js` **68–70**).
- Linger key freeze: `warn|hailmiss|{verb}|{reason}|{keyName}` — must not reuse `warn|demand|*` (`shared-contract.md` **122**; live demand keys `hud.js` **719**, **737**).
- `pushToast` must receive `t.key`. Default `cls + '|' + text` would put distance in the key and flood (`hud.js` **1296**).
- Overlay mutex: hail / chart / berth exclusive; never writes `flags.paused` (`overlay-policy.js` **4**, **7**, **118–127**).
- Player KeyH with chart/berth open **refuses** (does not defer). PR1 **names** that refuse. Incoming Hail01 still defers (`overlay-policy.js` **107–115** vs `hail.js` **657–659**).
- Salvage success still opens the live card (`hail.js` **159–169**, **664–666**). That card **is** the outcome; skip miss that frame.

### Verdict

**Pass (freeze).** Later miss feedback is a named HUD-04 toast: subject, verb, reason, range in `textContent`. Color is extra. Overlay block is copy, not pause. No fake card. No second stack. A11y uses the live toast region, not a new one. No `innerHTML` of ship names.

Live silent KeyH (`hail.js` **652–667**) and silent KeyJ (`station.js` **6321–6330**, `gate.js` **678–679**) stay the PR1 hole. They are leftover **REAL**, not a remaining freeze Blocker.

No 🔴 Blocker. No open 🟠 Major.
