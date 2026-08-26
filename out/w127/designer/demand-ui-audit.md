## UI Audit: Hail01 PR1 pirate demand card + demand toasts

**Persona:** designer (parent pass). Review only. Did not edit `src/`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`.
**Merge law:** `out/w126/demand/shared-contract.md` wins over `docs/Hail01DemandLifecycleDesign.md`.
**Scope:** `src/systems/hail.js` (card copy, timer text, buttons); `src/systems/hud.js` `toastForEvent` demand branch only. HUD-06 home marker is cite-only: confirm Hail01 did not restyle hub / home nodes.
**Worker self-audit:** `out/w127/demand/ui-audit.md` — checked, not rubber-stamped. Worker copy verdict is still right. Worker uppercase note is accepted. Worker “announce is a 4 s snapshot” note is accepted.

### Summary

PR1 names the pirate, the finite UU, the whole seconds, and the three Wave 30 verbs on the live hail card. Announce and outcome toasts match the freeze table. Color is not the only cue. Overlay never pauses. HUD-01 hub stays empty of a demand pip. HUD-06 home mark is not restyled. No new Digit. No `innerHTML`. No invented demand animation. No Blocker. No Major.

### What's done well

- Card line freeze is exact: `{name} heaves to — {n} UU or hull. {t}s.` (`hail.js` **119–120**, **527–529**, **666–669**).
- Header stays `HAIL — {speaker}`. Subline stays faction · hull (`hail.js` **521–524**). Speaker is `record.pilot ?? state.name` (`hail.js` **501**).
- Buttons keep live verbs: `Pay tribute — {n} UU` / `Show teeth — reveal the hidden mounts` / `Refuse — and fight` (`hail.js` **476–481**). Digit labels stay `[1]…[n]` (`hail.js` **567**).
- Timer is `textContent` on the existing `lineEl`. `hail.js` does not invent a demand `@keyframes` and does not read `reducedMotion` for the clock (`hail.js` **666–669**).
- Announce freeze is exact: `{name} — heave to. Pay {n} UU or fight. {t}s.` (`hud.js` **707**).
- Outcome literals match the contract table. `paid` / `bluffed` use `cls: 'good'`. The rest use `warn` (`hud.js` **717–724**).
- HUD only toasts demand `hailOpened` (`demandHail` / `payTribute` / finite `demand`). Bargain and salvage stay silent (`hud.js` **682–686**).
- Same-frame `hailClosed` with `demandOutcome` suppresses the announce (`hud.js` **687–694**). Fail-closed void does not dual-stack open + close.
- Stable keys: announce `warn|demand|{name}`; close `warn|demand|{name}|{outcome}` (`hud.js` **710**, **728**). `pushToast` honors `t.key` (`hud.js` **1328**, **1279–1282**). Linger cannot hide a different outcome behind the announce key.
- Card and toast writes are `textContent` / `createElement` / `el()` only. `hail.js` has no `innerHTML` / `insertAdjacentHTML`. Toast write is `slot.el.textContent` (`hud.js` **1303**).
- Hail digits stay `Digit([1-9])` gated by `hailDigitsAllowed` (`hail.js` **586–602**). Digit 0 does not match. Digit 8/9 never bind on a 2–3 verb demand card. Station digits stay outside this pack.
- Overlay never writes `ctx.flags.paused`. Close only clears `flags.hailOpen` (`hail.js` **18–19**, **198–205**). Demand close is not Pause.
- HUD-01 80 px hub clamp is unchanged (`hud.js` **1386**). Hail card stays lower-left (`hail.js` **185–186**). Bottom-center stays empty (`hail.js` **20–21**). No demand pip on the aim glass.
- HUD-06 still owns `.rw-home-mark` pip + chevron (`hud.js` **889–893**), `HOME_EDGE_INSET = 108` (`hud.js` **75**, **1935–1936**), POS `HOME` (`hud.js` **1105–1107**). Demand pack is `toastForEvent` + `pushToast` key only. Open hail still hides the home glass via existing `flags.hailOpen` (`hud.js` **1880**), same as any hail card.
- Illyx is not given a tribute card in hail/HUD copy. `hail.js` has no `Illyx` string. Ace bargain intents stay ransom / respect / letGo / keepFiring (`npc.js` **1500–1508**, cite only). Pirate demand intents stay `payTribute` / optional `showTeeth` / `refuseFight` (`npc.js` **1516–1520**, cite only).
- Toasts keep `role=status` `aria-live=polite`; chips expire `aria-hidden` (`hud.js` **917–925**, **1302**, **1336**).
- Portrait `alt` names the speaker (`hail.js` **540**). Fallback speaker token is `'Pirate'` (`hail.js` **65**; `hud.js` **745**).
- Slot count stays 5 (`hud.js` **69**, **923**). Linger stays 8 s (`hud.js` **70**). Lifetime stays 4 s (`hud.js` **68**).

### Must-check (contract)

| Check | Result | Cite |
|---|---|---|
| Named source, UU, seconds in **text** (color not only cue) | Pass | Card `hail.js` **119–120**, **521**; toasts `hud.js` **707**, **717–724** (`good`/`warn` is extra) |
| Card `{name} heaves to — {n} UU or hull. {t}s.` | Pass | `hail.js` **119–120** |
| Buttons Pay tribute / Show teeth / Refuse | Pass | `hail.js` **476–481** |
| No new Digit; 1..n stay hail resolve on open card | Pass | `hail.js` **567**, **586–602** |
| Digit 0/8/9 stay station | Pass | hail regex is `Digit([1-9])` only |
| `textContent` / `el()` only; no `innerHTML` | Pass | grep `hail.js` 0; toast `hud.js` **1303** |
| HUD-01 80 px hub empty of demand pip; no aim-glass gauges | Pass | `hud.js` **1386**; hail card not on glass |
| HUD-04: no extra toast slots; stable key; 8 s linger not a new channel | Pass | `hud.js` **68–70**, **710**, **728**, **1279–1328** |
| Overlay never presented as Pause; demand close is not pause | Pass | `hail.js` **18–19**, **198–205**; no `flags.paused` write |
| Illyx not given a tribute card in copy | Pass | no Illyx string in `hail.js` / demand toast branch |
| HUD-06 `.rw-home-mark` / POS HOME / inset 108 still present, not restyled | Pass | `hud.js` **75**, **889–893**, **1106**, **1935–1936** |
| `reducedMotion`: no invented demand animation | Pass | timer is text `hail.js` **666–669**; no demand `@keyframes` |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Announce toast seconds are a snapshot

**Location:** `src/systems/hud.js:700–710` (`hailOpened` demand)
**Issue:** The 4 s chip freezes emit-time `{t}s`. The card counts down on `lineEl` (`hail.js` **666–669**). A ticking toast would fight HUD-04 identical-key linger (`warn|demand|{name}` ignores `{t}`).
**Fix:** Leave it. Card is the live clock. Toast is the one-shot announce.
**Status:** accepted (same as worker)

#### 🟡 Minor: Card uses existing uppercase style

**Location:** `src/systems/hail.js:188` (`text-transform:uppercase` on `.rw-hail-card`)
**Issue:** The demand line renders in uppercase on the card. Toast copy stays mixed case. Live hail already uppercases all hail copy.
**Fix:** Do not restyle the card in this PR.
**Status:** accepted (same as worker)

#### 🟡 Minor: Pay / bluff / fail still dual-stack flavour + named outcome

**Location:** `src/systems/hail.js:408`, **424**, **437** `commLine`; `hud.js:565–573` `commLine`; `hud.js:712–728` `hailClosed`
**Issue:** Same frame can show nameless flavour (`Smart. Run along.` — HUD `commLine` drops `from`) and the named freeze toast. Sentences are not identical, so HUD-04 does not collapse them. Two of five slots. Refuse has no flavour line (good). Named outcome still carries speaker + verb.
**Fix:** Optional later: skip demand `commLine` when `hailClosed` already carries `demandOutcome`. Freeze allows flavour to stay. Not required for PR1.

#### 🟡 Minor: Card speaker path skips the `'Pirate'` fallback

**Location:** `src/systems/hail.js:501` vs `hail.js:62–68`
**Issue:** `openCard` sets `speaker = live.record?.pilot ?? st.name`. Timer and header use that string. `demandSpeaker` / HUD `demandToastName` fall back to `'Pirate'`. A hull with no pilot and no `state.name` would paint `HAIL — undefined` and `undefined heaves to — …` while the toast still says `Pirate`. Live pirates carry names, so this is fail-closed hygiene, not a playable hole.
**Fix:** Use `demandSpeaker(live)` (or `ev.speaker`) in `openCard`. Do not invent copy.

#### 💡 Suggestion: Demand line drops quotation marks

**Location:** `src/systems/hail.js:527–529`
**Issue:** Bargain/salvage lines stay quoted. Demand copy is the authored sentence with name, UU, and seconds.
**Fix:** Keep authored demand copy. Demand is the offer, not a spoken clip.

#### 💡 Suggestion: Timer writes `textContent` every hail update

**Location:** `src/systems/hail.js:666–669`
**Issue:** `lineEl.textContent` is assigned each hail `update` while a demand card is open, even when `{t}` did not change. Contract allows refresh on the existing node. No extra DOM alloc.
**Fix:** Optional: write only when `t` changes. Not a visual defect.

#### 💡 Suggestion: Worker self-audit is copy-correct

**Location:** `out/w127/demand/ui-audit.md`
**Issue:** Worker findings (uppercase card, static announce seconds) match live code. Parent confirms those are accepted, not product bugs.
**Fix:** None in product. This designer file is the parent UI record.

### A11y

- Named source in header, demand line, and toast. Color (`#6ff2e0` / `warn` / `good`) is redundant, not the only cue.
- Deadline in the card line as `{t}s`. Announce toast also names seconds at emit.
- Compliance verbs named on buttons with Digit 1..n. No new Digit.
- Buttons are real `<button>` nodes with visible `[n] verb` labels (`hail.js` **562–567**). Hover exists (`hail.js` **568–573**). Focus ring is the pre-existing hail treatment; this PR did not strip it.
- Portrait `alt` names speaker + faction (`hail.js` **540**).
- Toasts are `aria-live=polite` and do not steal focus (`hud.js` **917–920**).

### HUD-06 / hub / pause (cite only)

- `.rw-home-mark` still on pip + chevron (`hud.js` **889–893**).
- POS HOME: `el('div', 'rw-label', homeRow, 'HOME')` (`hud.js` **1106**).
- `HOME_EDGE_INSET = 108` (`hud.js` **75**, **1935–1936**).
- This pack did not edit `hud.css` or home-mark layout.
- Reticle hub clamp is still `cx - 44` / `cy - 44` (80 px) (`hud.js` **1386**).
- Hail never writes `ctx.flags.paused`. Overlay policy still says never write pause (`overlay-policy.js` **4**, cite only).

### Verdict

**Pass.** Demand lifecycle is readable without color-only cues. Compliance path is the Wave 30 card with named verbs and Digit 1..n. Named announce and named close sit on the existing HUD-04 toast channel. HUD-01 hub and HUD-06 home mark are intact. No Blocker. No Major.
