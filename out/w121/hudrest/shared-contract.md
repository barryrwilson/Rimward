# HUD remaining player-facing feedback shared contract

**Wave:** 121. Design only. No HUD feedback feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud05RemainingFeedbackDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Named serial: **none.** Name: **no remaining HUD feedback leftover.** Wave 120 PR1 already landed HUD-04 toast-flood (`docs/Hud04ToastFloodDesign.md` — **cite, do not rewrite, do not retune linger 8 s or AUTOSAVE HELD copy**). Live banner is one arrival card. Live `commLine` uses the **same** toast channel. Live onboarding is one teaching line with persist `seen`. **No** second unnamed toast channel. Do **not** invent a later serial that adds a sixth toast slot, a second live region, a hub child, a Digit, a new persist key, or assertive `aria-live`.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud04ToastFloodDesign.md`, `docs/Hud03RemainingVisualDesign.md`, `docs/Hud03AlertsDesign.md`, `docs/Hud02*`, `docs/Nav07ChartLabelDesign.md`, `docs/Nav*`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave121.md`. Do not steal `out/w121/chartlabel/**`, `out/w121/expdock/**`, `out/w120/toast/**` (read ok), `out/w118/toast/**` (read ok).  
**Locked sources:** live inventory `out/w121/hudrest/current-hud-feedback-inventory.md` (code wins); HUD-04 toast leftover (`docs/Hud04ToastFloodDesign.md` + `out/w118/toast/shared-contract.md` — **cite, do not reopen**); HUD-03 visual CONSUME; HUD-01 empty 80 px hub; Digit 0/8/9; KeyO settings; CTL-02 overlay mutex (**cite, do not steal**; **do not raise toast z**); NAV-07 chart-label (**cite, do not steal**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 118 toast line numbers and over any brief that names a HUD-05 PR1.

**This leftover is remaining HUD player-facing feedback after HUD-04.** It is **not** HUD-04 toast-flood (landed). It is **not** NAV-07 chart-label. It is **not** CTL-02 overlay mutex. It is **not** HUD-02 class tokens. It is **not** HUD-03 visual KeyO. It is **not** HUD-03 `hudAlerts`. It is **not** HUD-01 hub gauges. It is **not** a new Digit.

**Census:** leftover is **CONSUME**. If a later census finds `TOAST_DEDUP_WINDOW` gone, linger ring gone, `saveBlocked` mix copy returned, **or** a second unnamed `.rw-toast` allocator, re-open **HUD-04**, not a new HUD-05 serial, unless the hole is a **new** flood channel outside toast/banner/hint. Do **not** ship a sixth slot while five linger chips exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land HUD-05 feedback work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. No feedback pip, toast count, or banner glyph on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard (`station.js` 188, 6035–6036). Digit 8 dock root stays launch. Digit 9 dock root stays epics. KeyO stays settings.
3. HUD-04 toast PR1 is **cite-only**. **Do not** retune `TOAST_LIFETIME` 4, `TOAST_SLOTS` 5, `TOAST_DEDUP_WINDOW` 8. **Do not** retune `'▲ AUTOSAVE HELD — hostiles near'`. **Do not** clear linger on chip reuse. **Do not** drop expire `aria-hidden`. **Do not** merge autosave copy back into SAVE BLOCKED.
4. `innerHTML` forbidden later. Toast / banner / hint / prompt copy uses `textContent` only. Live `el()` already `textContent` (`hud.js` 283–288). **No** `insertAdjacentHTML` / `document.write`. Live `innerHTML` in `hud.js` / `onboarding.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Kit mutate omit. Aim-glass gauges stay off.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Toast linger is **session**. Onboarding `seen` already rides `WORLD_FIELDS` (`save.js` 83–84). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Fail closed:
    - Never freeze the sim. Feedback **must not** set `ctx.flags.paused`.
    - Never throw. Missing host / unknown event → skip. Keep flying.
    - If toast / banner / hint miss, the rest of HUD update still runs. **Never stop** the loop.
    - Unknown `saveBlocked.source` → **manual** copy path (already live). Authored tokens only (`autosave` / `berth`).
    - Linger stays a **five-row** ring. Never grow an unbounded Map.
8. Overlay sibling (CTL-02 landed): later write-set **must not** claim `hail.js`, `galaxychart.js`, overlay-policy, or berth **panel**. **Must not** raise `.rw-toasts` or `#hud` z-index. **Must not** add a hail toast.
9. NAV-07 chart-label: **must not** claim `galaxychart.js` labels, dest `<select>`, or hover live region. **Must not** claim NAV-05 `showApLive` / `#rw-galaxy-ap-live`.
10. Later write-set **must not** claim HUD-02 combat rails / `data-class-key`. **Must not** claim HUD-03 KeyO visual fields or `hudAlerts`.
11. Accessibility: `.rw-toasts` stays `role="status"` `aria-live="polite"`. **Do not** switch to `assertive`. **Do not** add a second live region as leftover work. Banner already has `aria-live=polite` (`hud.js` 860) — do **not** treat that as a hole to “fix” with a third region. Onboarding has **no** live region — do **not** add one as HUD-05 leftover. Color is not the only cue: keep glyph prefixes. Expire toast chips keep `aria-hidden="true"`.
12. Do **not** add toast slots. `TOAST_SLOTS` stays **5**. Do **not** persist toast state. Do **not** pause. Do **not** innerHTML.
13. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Hud04ToastFloodDesign.md`, `docs/Hud03*`, `docs/Hud02*`, `docs/Ctl02*`, `docs/Nav07ChartLabelDesign.md`. Do not write `docs/OwnerDecisionsWave121.md`. Deputize defaults live in **this** contract.
14. Do not steal `out/w121/chartlabel/**`, `out/w121/expdock/**`, `out/w120/toast/**`, `out/w118/toast/**`.
15. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
16. `reducedMotion`: do **not** invent toast or banner animation. Live fades stay.
17. Prototype-safe later helpers: authored toast classes (`comm` / `sting` / `warn` / `danger` / `good`) and authored `saveBlocked.source` tokens only. Never `for-in` a save blob into copy.
18. CPU: **no** per-frame DOM alloc for toasts or hints. Five toast nodes and one hint node already exist.
19. Bindings do not change here.

---

## 0.1 Wave 121 deputize (owner may override after playtest)

Pick a playable **remaining HUD feedback** default **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent UU / SKU / Digit / sixth slot / second live region.

### Live knobs (copy; do not retune as leftover)

| Knob | Live | Cite |
|---|---|---|
| `TOAST_LIFETIME` | 4 s | `hud.js` 64 |
| `TOAST_SLOTS` | 5 | `hud.js` 65 |
| `TOAST_DEDUP_WINDOW` | 8 s | `hud.js` 66 |
| Linger | 5-row key ring | `hud.js` 530–555 |
| Autosave copy | `▲ AUTOSAVE HELD — hostiles near` | `hud.js` 597–598 |
| Berth copy | `▲ SAVE BLOCKED — ` + reason | `hud.js` 600 |
| Toast live region | `role=status` `aria-live=polite` | `hud.js` 846–847 |
| Expire a11y | `aria-hidden=true` | `hud.js` 1243 |
| Banner | one node, 4 s, `aria-live=polite` | `hud.js` 858–863, 1247–1265 |
| Hints | one line, 8 s, persist `seen` | `onboarding.js` 29, 36–68, 137–139 |
| Hint toggle | KeyO `hints` | `settings.js` 46 |

Do **not** “fix” remaining feedback by adding slots, raising z-index, pausing, adding a hail toast, or adding a live region on the hint.

### Playable policy (smallest additive)

**Name:** none. Remaining HUD feedback already punches via live HUD-04 toast channel + one arrival banner + one onboarding hint.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining HUD feedback leftover |
| Fail-closed | unknown event skip; never pause; never throw |
| Additive PR1 | **None.** Do not add a sixth chip. Do not add hint `aria-live`. Do not add banner `aria-hidden` as a named serial. |
| Not a leftover PR | HUD-04 retune; NAV-07 labels; overlay mutex; HUD-02 tokens; HUD-03 visual/audio; hub child; Digit; persist; `state.js` write |
| Persist | none new |
| Live region | keep toast polite + existing banner polite. **No** assertive. **No** new region |

Owner freeze (do not invert):

- Do **not** invent remaining HUD feedback work while linger + AUTOSAVE HELD + one banner + one hint exist and `pushToast` is the only toast allocator.
- First remaining serial (if owner re-opens after a **true** flood census) must **not** steal Digit 0/8/9 and must **not** write `state.js`. Prefer re-open **HUD-04** if the toast window regressed.
- Do **not** pause the sim to fake a quiet HUD.
- Do **not** persist toast clocks.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

```
// CONSUME — keep live HUD-04 toast math. Do not retune.
TOAST_LIFETIME = 4
TOAST_SLOTS = 5
TOAST_DEDUP_WINDOW = 8
// linger: last five KEYS — NOT chip-tied
// autosave: ▲ AUTOSAVE HELD — hostiles near
// berth:    ▲ SAVE BLOCKED — + reason
// Additive HUD-05: none
```

---

## 0.2 Empty hub / Digit / KeyO

Later serial (none expected): **must not** put remaining-feedback chrome inside `.rw-reticle`. RANGE stays TGT-01. Digit 0/8/9 stay. KeyO stays settings. KeyP stays pause. KeyH/M/L stay hail/chart/berth.

## 0.5 `state.js` READ-ONLY later

No HUD feedback fields on `state.js`.

## 0.6 Persist

No new key. Linger dies with the session.

## 0.9 Siblings — do not steal

| Sibling | Path | This leftover |
|---|---|---|
| HUD-04 toast | `docs/Hud04ToastFloodDesign.md`, `out/w120/toast/**` | cite only |
| HUD-03 visual | `docs/Hud03RemainingVisualDesign.md` | cite only |
| HUD-03 audio | `docs/Hud03AlertsDesign.md` | cite only |
| HUD-02 tokens | `docs/Hud02*` | cite only |
| NAV-07 | `docs/Nav07ChartLabelDesign.md`, `out/w121/chartlabel/**` | do not steal |
| CTL-02 | overlay mutex | cite only |
| Wave 118 toast freeze | `out/w118/toast/**` | read ok; line numbers historical |

## 0.10 Do not invent chrome

No sixth toast. No second unnamed stack. No hub pip. No free skin. No UU. No SKU. No Digit.

---

## 1. Inventory binding

Source of truth: [`out/w121/hudrest/current-hud-feedback-inventory.md`](./current-hud-feedback-inventory.md). Code wins.

## 2. CONSUME reasons (do not invert)

1. Toast identical-key window, linger ring, expire `aria-hidden`, AUTOSAVE HELD vs SAVE BLOCKED are **LIVE** (`hud.js` 66, 530–555, 596–600, 1186–1213, 1238–1244; `save.js` 1040, 1422, 1428, 1535, 1540).
2. `commLine` is **not** a second channel (`hud.js` 560–568, 1234–1235).
3. Banner is **one** 4 s arrival card (`hud.js` 858–863, 1247–1265).
4. Onboarding is **one** persist-once hint (`onboarding.js` 36–68, 137–139).
5. Grep: only `hud.js` `pushToast` writes `.rw-toast`. **No** second unnamed toast channel.
6. Wishlist FEEDBACK inbox item is **DONE** (cite only). Remaining inbox is NAV-07 (sibling).

## 3. Serial PR plan

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining HUD feedback** | **Does not exist.** Leftover CONSUME | sixth slot; second live region; banner fold-in; hint `aria-live`; linger retune; overlay; chart labels; hub; Digit; persist; `innerHTML`; `aria-live` assertive |
| **PR-census (optional skip)** | Re-grep `TOAST_DEDUP_WINDOW`, linger, `source: 'autosave'`, `pushToast` unique, banner one node, hint one node | New world field; hub pip |

First remaining HUD feedback serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.

## 4. Neighbours

| Module | Remaining feedback does | Remaining feedback does not |
|---|---|---|
| `hud.js` toast | **none** (CONSUME) | retune linger; sixth slot |
| `hud.js` banner | **none** | fold into toast; extra live region |
| `onboarding.js` | **none** | add `aria-live`; second hint stack |
| `save.js` emit | **none** | WORLD_FIELDS; berth panel |
| `galaxychart.js` | **none** | NAV-07 labels; `showApLive` |
| `hail.js` / overlay | **none** | mutex; hail toasts; z raise |
| `state.js` | **none** | write |
| Title / origins / settings | honor ladder | steal Enter; steal KeyO |

## 5. If owner re-opens after a true missing-channel census

Fail closed to today’s toast + banner + hint. Never freeze the sim. Prefer HUD-04 reopen for toast regression. Do not invent HUD-05 chrome while those surfaces exist.
