# RIMWARD HUD-04 leftover toast-flood

| Field | Value |
|---|---|
| **Title** | RIMWARD HUD-04 leftover toast-flood |
| **Author** | Wave 118 toast leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | Wave 120 PR1 toast-flood **landed**. |
| **Wave** | 120 — serial **PR1 toast-flood**. Wave 118 was markdown freeze + merge law. |
| **Owner request** | Census live toast stack. If flood / identical-repeat / autosave-vs-manual mix is still live, leftover is **REAL**. Freeze later serial **PR1 toast-flood** (named only). If already gone, freeze **CONSUME** and serial **none**. |
| **Merge law** | [`out/w118/toast/shared-contract.md`](../out/w118/toast/shared-contract.md). If this document and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. Digit 0 shipyard. Digit 8/9 stay. Overlay PR1 is a **sibling** (hail/chart/berth mutex) — do not steal overlay, do not edit hail.js / galaxychart.js / save.js berth **panel**, do not raise play-card or toast z. NAV-05 `showApLive` — do not steal. CTL-01 KeyJ — do not remap. P2 chart-label a11y and P2 close-chart-on-AP — call out, do not solve. `state.js` READ-ONLY later. No new persist key. No UU. No SKU. No new Digit. `innerHTML` forbidden later. Kit mutate omit. Aim-glass gauges stay off. Do **not** edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Nav*`, `docs/Ctl01*`, `docs/Hud02*`, `docs/Hud03*`, or `docs/OwnerDecisions*`. Do **not** write `docs/OwnerDecisionsWave118.md`. Do **not** steal `out/w118/overlay/**`, `out/w118/chartclose/**`, `out/w117/**`, `out/w116/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 118 census — do not retcon as this wave) | [`out/w118/toast/current-toast-inventory.md`](../out/w118/toast/current-toast-inventory.md) |
| Merge law (still wins on conflict) | [`out/w118/toast/shared-contract.md`](../out/w118/toast/shared-contract.md) |
| Wave 118 security review | [`out/w118/toast/security-review.md`](../out/w118/toast/security-review.md) |
| Wave 118 design-doc review | [`out/w118/toast/code-review.md`](../out/w118/toast/code-review.md) |
| Wave 118 UI audit | [`out/w118/toast/ui-audit.md`](../out/w118/toast/ui-audit.md) |
| Wave 118 notes | [`out/w118/toast/notes.md`](../out/w118/toast/notes.md) |
| Wave 120 PR1 notes | [`out/w120/toast/notes.md`](../out/w120/toast/notes.md) |
| Wave 120 PR1 security review | [`out/w120/toast/security-review.md`](../out/w120/toast/security-review.md) |
| Wave 120 PR1 code review | [`out/w120/toast/code-review.md`](../out/w120/toast/code-review.md) |
| Wave 120 PR1 UI audit | [`out/w120/toast/ui-audit.md`](../out/w120/toast/ui-audit.md) |
| Wave 120 PR1 probe | [`out/w120/toast/probe.mjs`](../out/w120/toast/probe.mjs) |

Siblings HUD-02 / HUD-03 / NAV-05 / CTL-01 / CTL-02 overlay, wishlist, `PROGRESS.md`, `docs/Nav*.md`, `docs/Hud02*`, `docs/Hud03*`, `docs/Ctl01DockBindDesign.md`, `docs/Ctl02OverlayDesign.md`, and `docs/OwnerDecisions*.md` are **other workers**. **Do not edit** those paths. Wave 118 did **not** write `src/`. Wave 120 PR1 writes the toast channel only. **Do not** steal sibling Wave 118 paths (`out/w118/overlay/**`, `out/w118/chartclose/**`). **Do not** steal `out/w117/**`.

**This is not CTL-01 KeyJ.** **This is not NAV-05 `showApLive`.** **This is not HUD-02 combat rails.** **This is not CTL-02 overlay-priority.** **This is not P2 chart-label a11y.** **This is not P2 close-chart-on-AP.** Wishlist toast flood is **INBOX**. Census still finds **identical-repeat + autosave/berth mix live**.

---

## Overview

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — **cite, do not edit**):

> Repeated autosave refusals and encounter lines can flood the notification stack and obscure new information; deduplicate or update identical messages within a short window and distinguish manual-save failures from background autosave retries.

Wave 118 this leftover froze markdown only. Wave 120 PR1 lands the named serial in `src/` per the merge law. Bindings now include the 8 s identical-key window, the five-row key linger ring, expire `aria-hidden`, and autosave vs berth copy.

Wave 118 census (frozen; code wins at that wave): five toast slots, 4 s lifetime, `pushToast` refreshes **only while visible**. Same-frame `mem.frameLines` is **not** a time window. `saveBlocked` copy is always `'▲ SAVE BLOCKED — ' + reason` with **no** autosave vs berth tag. Autosave idle retry is 5 s (`BLOCK_RETRY`) so the toast dies at 4 s and returns at 5 s. Hostile reason text says **berth record refused** even on background autosave. Leftover is **real**. Do not treat those Wave 118 line numbers as Wave 120.

This leftover is **one session time-window on identical toast text** and **distinct autosave vs manual/berth refusal copy**. It is not a new Digit. It is not overlay mutex. It is not hail.

This document is the integrator for a **later** implementation wave.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. Do not invent UU. Do not steal Digit 0/8/9. Do not remap KeyJ. Do not raise toast z-index. Do not add hail toasts.

Wave 118 deputize (recorded here and in the contract; owner may override after playtest): **8 s** identical-key window; **five-row linger ring independent of chips** (do not clear linger on chip reuse); **in-place refresh** while visible; **suppress** after expire inside the window; expire **`aria-hidden="true"`** (keep `textContent`); real show unhide then `textContent`; autosave copy **`▲ AUTOSAVE HELD — hostiles near`**; berth/manual copy keeps **`▲ SAVE BLOCKED — ` + reason**; `save.js` emit **`source` tag only**; **never pause**; **no** `innerHTML`; **no** extra slots.

If census had proved flood and mix were gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w118/toast/current-toast-inventory.md`](../out/w118/toast/current-toast-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Lifetime / slots | 4 s / 5 | `hud.js` 64–65 |
| Stack a11y | `role=status` `aria-live=polite` | `hud.js` 813–816 |
| Place | top-right, off aim column | `hud.css` 635–646 |
| `#hud` z | 10 | `style.css` 24–29 |
| Visible same-key | extend `until` only | `hud.js` 1155–1157 |
| Expire | clears `key`; removes `show`; **no** `aria-hidden` | `hud.js` 1197–1201 |
| `frameLines` | same frame | `hud.js` 532–539, 1183 |
| `saveBlocked` HUD | `'▲ SAVE BLOCKED — ' + reason` | `hud.js` 568–569 |
| Hostile reason | berth wording for **both** paths | `save.js` 1028 |
| Autosave emit | `{ reason }` no source | `save.js` 1039–1041 |
| Idle retry | 5 s | `save.js` 70, 1588–1590 |
| Jump-pending retry | 0.5 s | `save.js` 1570–1583 |
| Berth emit | `{ reason }` no source | `save.js` 1414, 1420, 1527, 1532 |
| npcFire / sunHeat | 2.5 s already | keep |
| Overlay helper | sibling | do not claim |
| Toast persist | **none** | keep none |

The player in a long fight sees AUTOSAVE/SAVE BLOCKED blink every 5 s and cannot tell a KeyL SAVE failure from a background retry. Identical comm lines after 4 s take another slot and can push a new sting off the stack.

### Pain points

- Five slots + overwrite-soonest: repeats **obscure new information** (inbox).
- Visible refresh is not a **time window** after expire (`BLOCK_RETRY` 5 > lifetime 4).
- A linger tied to **chip index** dies when four other lines reuse the chips — the named pirate-bubble retry then restacks. Linger must track **keys**, not chips.
- Expired chips drop `show` but keep text inside `aria-live=polite` with no `aria-hidden` — AT can still read stale lines.
- Autosave hostile copy lies: it says **berth record refused**.
- Berth and autosave share one HUD string — inbox asked to **distinguish**.
- A naive later PR that **raises toast z** fights overlay mutex (hail 40 / berth 60).
- A naive later PR that **adds a hail toast** on defer fights overlay contract and this leftover.
- A naive later PR that **adds slots** or **pauses** the sim is not smallest additive.
- A naive later PR that persists toast mem into `WORLD_FIELDS` lies after load.
- Putting a new Digit or hub pip impersonates the owner.
- `innerHTML` of `e.text` / `e.reason` is XSS.

### Why now (design) / why not now (code)

The owner asked for the toast leftover integrator so later serials can quiet identical refusals **before** the first `pushToast` edit. Inventory shows a 5 s retry vs 4 s lifetime and a shared SAVE BLOCKED string. Merge law can exist without touching `src/`. Implementation waits so overlay z-theft, hail toasts, persist, pause, and Digit theft are frozen before the first window constant. Wave 118 this worker does not ship `src/`.

If census had proved flood and mix were gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Goals & Non-Goals

### Goals

1. Document live toast slots, lifetime, `pushToast`, `frameLines`, and `saveBlocked` emits from **live code**.
2. Freeze leftover = **time-window identical-text dedupe + autosave vs berth copy**. Not a new key. Not overlay mutex.
3. Freeze deputize **8 s** window, **5** chips, **5-row key linger** (not chip-tied), expire **`aria-hidden`**, **distinct copy**, emit **`source` tag**. Owner may override after playtest. Do not park.
4. Freeze persist: **none** new. `state.js` READ-ONLY. No UU. No SKU. No new Digit.
5. Freeze HUD-01 empty hub. Digit 0/8/9 stay. KeyJ stays CTL-01. Overlay z stays.
6. Freeze later copy via `textContent`. `innerHTML` forbidden.
7. Freeze accessibility: `role=status` `aria-live=polite` stays (not assertive; no second region). Color is not the only cue. Glyph prefixes stay. Identical refresh does not rewrite `textContent`. Expire sets `aria-hidden`. Real show unhides then writes text.
8. Freeze a serial PR plan. This wave writes the document. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No extra toast slots. No pause-the-sim. No toast persist.
- No NAV-05 `showApLive` rewrite. No close-chart-on-AP.
- No CTL-01 KeyJ remap. No `controls.js` TRACKED change.
- No HUD-02 combat rails. No HUD-01 hub child. No new Digit.
- No `state.js` write. No WORLD_FIELDS. No settings toast UI.
- No overlay mutex. No hail.js. No galaxychart.js. No overlay-policy. No berth panel.
- No toast z-index raise. No hail toasts.
- No P2 chart-label a11y.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav*`, `docs/Hud02*`, `docs/Hud03*`, Bio*, Msn*, Rep*, Tgt*, OwnerDecisions*.
- Do not write `docs/OwnerDecisionsWave118.md`.
- Do not fix known boot FAILs.
- Do not steal `out/w118/overlay/**`, `out/w118/chartclose/**`, `out/w117/**`, `out/w116/**`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **Yes** — flood + mix live | Inventory §7 |
| CONSUME? | **No**. Serial is **not** none | Census |
| New persist key? | **No** | Contract §0.6 |
| `state.js` write? | **No** | Contract §0.5 |
| Extra slots? | **No** (stay 5) | Inbox asked dedupe, not a taller stack |
| Pause? | **No** | Freeze-the-sim |
| Window | 8 s `ctx.elapsed` identical `cls\|text` | Covers 5 s retry after 4 s lifetime |
| Visible match | extend `until` (live) | Do not rewrite text |
| Post-expire match in window | **suppress** via linger ring | Do not blink; chips free for **new** copy |
| Linger | last **five keys**, not chip index | Pirate-bubble retry still suppresses after four other lines |
| Expire a11y | `aria-hidden="true"`; keep text | Stale line leaves the polite region |
| Autosave copy | `▲ AUTOSAVE HELD — hostiles near` | Distinguish retries |
| Berth/manual copy | `▲ SAVE BLOCKED — ` + reason | Player-initiated |
| Overlay / hail toast / toast z | Call out only | Sibling |
| Named PR1? | **PR1 toast-flood** | REAL leftover |

### 2. Current toast motion (do not break Wave 6 / WAVE98)

`frameLines` still skips same-frame clue/`commLine` pairs. Incoming `Incoming fire.` / `Incoming dart.` stay 2.5 s in `npc-fire-toast.js`. Sun heat stays 2.5 s. Toast nodes stay five, `textContent`, polite live region. Place stays top-right. Overlay cards still paint above `#hud`.

### 3. Smallest additive punch (later)

See contract §0.1. Window on `pushToast` + **key linger ring** + expire `aria-hidden` + `saveBlocked` copy + emit `source`. No new key bind. No pause. CSS optional only for `.rw-toast:not(.show) { visibility: hidden }`.

### 4. Neighbours

| Module | This leftover does | This leftover does not |
|---|---|---|
| `hud.js` | later PR1: `pushToast` window; 5-row key linger; expire `aria-hidden`; `toastForEvent` saveBlocked copy | combat rails; hub; Digit; overlay |
| `save.js` emit | later PR1: `source` on existing `saveBlocked` emits | WORLD_FIELDS; death; retry cadence; berth panel / KeyL |
| `save.js` berth panel | none | overlay sibling |
| `hail.js` | none | mutex; hail toasts |
| `galaxychart.js` | none | `showApLive`; open gate |
| `overlay-policy.js` | none | sibling |
| `hud.css` | optional `:not(.show) { visibility: hidden }` | toast z; hub; geometry |
| `autopilot.js` | none | NAV-05 |
| `controls.js` | none | KeyJ |
| `state.js` | none | write |
| Title / origins / settings | honor ladder | steal Enter; steal KeyO |

### 5. Serial PR plan

Matches contract §3. **Named only. Do not implement in Wave 118.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 toast-flood** | 8 s window; linger ring independent of chips; expire `aria-hidden`; autosave vs berth copy; emit `source` | persist; pause; extra slots; overlay mutex; hail toast; toast z; KeyJ; `showApLive`; close-chart-on-AP; Digit steal; `innerHTML`; `aria-live` assertive |
| **PR2 stills (optional)** | Playtest one AUTOSAVE HELD vs distinct berth SAVE BLOCKED | Required with PR1; overlay; known FAILs |
| **PR3 census (optional skip)** | Re-grep window + key linger + `aria-hidden` + `source: 'autosave'` | New world field |

First remaining serial is **PR1 toast-flood**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim overlay helper, `hail.js`, `galaxychart.js`, `controls.js`, or `autopilot.js`.

### 6. Picture

Reuse live `.rw-toasts` five chips. No new chrome. Player in a fight sees **one** `▲ AUTOSAVE HELD — hostiles near` while retries continue in the background. A KeyL SAVE in the same fight shows a **different** `▲ SAVE BLOCKED — …` line. Identical comm copy does not eat a second slot inside 8 s. New distinct lines still take free slots. Hail/chart/berth stacking is **overlay PR1**, not this picture.

No hub pip. Digit 0 stays shipyard. KeyJ stays CTL-01. Toast z stays with `#hud`.

---

## Player outcome (later serial; freeze here)

Fly into a pirate bubble. Background autosave refuses. One warn line: **AUTOSAVE HELD — hostiles near**. Four other distinct comms may reuse chips. For the next 8 s of world time, autosave retries still **do not** blink a second AUTOSAVE HELD chip and **do not** push a milestone off the stack. Linger tracks the **key**, not the chip.

Open Berth Records (L) and press SAVE. A **different** line: **SAVE BLOCKED** plus the berth reason. That is a player action, not a retry.

Hear the same encounter comm twice inside 8 s. The chip **updates in place** while visible; after it fades, a repeat inside the window stays quiet. A **new** sentence still appears.

Hail, Galaxy Chart, and Berth stacking is **not** this work. Toasts stay under those cards. Do not raise toast z. Do not toast a deferred hail.

Pause is still P. Settings is still O. Autopilot from the chart still does **not** close the chart.

`reducedMotion` is unchanged (existing 0.35 s fade only).

**NAV-05 AP handoff** is **not** this work. **CTL-01 KeyJ** is **not** this work. **HUD-02 target silhouettes** are **not** this work. **CTL-02 overlay-priority** is **not** this work. **P2 chart-label a11y** is **not** this work. **P2 close-chart-on-AP** is **not** this work.

---

## Security

See [`out/w118/toast/security-review.md`](../out/w118/toast/security-review.md).

- XSS: no `innerHTML` for toast text / `e.reason` / `e.text`. `textContent` only.
- Proto: authored `source` tokens (`autosave` / `berth`). Never `for-in` a save blob into copy.
- Persist: no new key. Linger clocks die with the session so a hostile save cannot freeze a forever toast.
- Privileged copy: do not toast storage keys, snapshot JSON, or credit ledgers.
- Fail-closed never freeze the sim.
- Overlay: do not raise toast z (would steal clicks / Digit context from play cards).

---

## Acceptance direction (implementation wave)

1. Identical `cls|text` inside 8 s elapsed: at most **one** visible chip; linger ring still suppresses after chips were reused. No post-expire blink inside the window.
1b. Expire: slot `aria-hidden="true"`; `textContent` stays; polite region does not keep a live stale chip. Real show: unhide **then** write text.
2. Autosave `saveBlocked` copy is **AUTOSAVE HELD**, not SAVE BLOCKED / not berth wording.
3. Berth/manual `saveBlocked` copy stays **SAVE BLOCKED** + reason (mid-jump string stays).
4. `TOAST_SLOTS` remains 5. No new persist. No pause. No `innerHTML`.
5. `.rw-toasts` z-index unchanged. No hail toast added.
6. `frameLines` same-frame skip still works.
7. KeyJ untouched. Digit 0/8/9 untouched. `showApLive` untouched.
8. Known boot FAILs untouched.

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Freeze CONSUME / serial none | Census: 5 s retry blink + mix copy still live |
| Add slots (6–10) | Inbox asked dedupe so **new** info can show, not a taller stack |
| Raise toast z over hail/berth | Steals overlay sibling; covered toasts are not this leftover |
| Hail toast on overlay defer | Overlay contract forbids; would flood this channel |
| Pause sim while stacked | Drops events; freeze-the-sim |
| Lifetime 5 s = `BLOCK_RETRY` only | Fixes idle blink, **not** identical comms, **not** mix copy |
| Persist last toast keys | Hostile save could mute warns forever |
| `innerHTML` rich toasts | XSS |
| Unbounded Map of keys | Memory grow on unique comm spam |
| Slot-tied linger (clear on chip reuse) | Pirate-bubble retry restacks after four other lines |
| Leave expired text in polite region | AT re-reads stale chips |
| Retune npcFire 2.5 s | Already shipped; not the autosave hole |
| Digit / hub pip | HUD-01 / station |

---

## Regression risks

| Risk | Mitigation |
|---|---|
| Window swallows a **new** sentence that happens to match | Key is full `cls\|text`; distinct copy still shows |
| Autosave and berth look the same after HUD-only merge | PR1 lands **source tag + copy** together |
| Overlay PR1 strips `source` while editing `save.js` | Disjoint symbols: overlay = KeyL / `setBerthOpen`; toast = emit payload |
| Toast z raised “so players see SAVE BLOCKED under berth” | **Forbidden.** Berth is a play card; toasts stay under `#hud` |
| `textContent` rewrite re-announces polite | Visible refresh **must not** rewrite identical text |
| Slot-tied linger loses AUTOSAVE HELD | Linger ring of last five **keys**; chip reuse does not clear |
| Expired chip stays in live region | `aria-hidden` on expire; optional `visibility:hidden` on `:not(.show)` |
| Unbounded dedupe Map | Five linger rows only |
| NAV-05 / KeyJ / Digit steal | Write-set forbids those files/symbols |
| Pause under toast flood | **Forbidden** |
| Title capture broken | No new capture listener |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `pushToast` / linger ring / `aria-hidden` / `toastForEvent` saveBlocked | later PR1 `hud.js` toast only | player |
| `saveBlocked.source` | later PR1 `save.js` emit only | HUD |
| Berth panel / KeyL | **none** (overlay) | — |
| Hail / chart / helper | **none** (overlay) | — |
| `showApLive` | **none** (NAV-05) | chart |
| `pendingDock` / KeyJ | **none** (CTL-01) | — |
| `state.js` | **none** | — |
| Digit / station | **none** | — |

---

## Open owner questions

**Deputized this wave** (contract §0.1). Owner may override after playtest. Do not park.

1. Smallest additive = 8 s identical-key window + 5-row **key** linger + autosave vs berth copy. Do not pause. Do not add slots.
2. Visible match extends lifetime; linger match **suppresses** even after the chip was reused. Expire uses `aria-hidden`.
3. Autosave authored line is **AUTOSAVE HELD — hostiles near**. Berth keeps SAVE BLOCKED + reason.
4. No new persist key.
5. Home: `hud.js` toast channel + `save.js` emit tag. Not `state.js`. Not overlay helper. Not `hail.js`. Not `galaxychart.js`. Not KeyJ.
6. Optional PR2 stills are skippable after playtest.
