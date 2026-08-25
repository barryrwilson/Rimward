# Remaining NAV leftover after NAV-07 shared contract

**Wave:** 122. Design only. No NAV feature ships in this wave.  
**Status:** MERGE LAW for `docs/Nav08RemainingNavDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining NAV leftover.** Live NAV-01 plot persist + chart click, NAV-02 readout/cue/ring, NAV-03 Autopilot (MATCH refuse, cancel keeps dest, restore never resumes), NAV-04 hover, NAV-05 handoff (split `AP_LINES`, ring vs hub, `gate.js` sole emit, `#rw-galaxy-ap-live` on fly cancel), NAV-06 Autopilot **button** success `setOpen(false)`, NAV-07 labels + dest `<select>` + KeyM typing skip already meet the owner census. Do **not** invent a later serial that adds teleport, persist-resume flying AP, a hub PPI, a new Digit, a new persist key, dest-select hover inspect, or a WAVE96/WAVE121 boot-log leftover.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01RouteDesign.md`–`docs/Nav07ChartLabelDesign.md`, `docs/Ctl01*`, `docs/Ctl02*`, `docs/Hud*`, `docs/Tgt*`, `docs/Rep*`, `docs/OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave122.md`. Do not steal sibling Wave 122 paths `out/w122/tgtrest/**`, `out/w122/represt/**`. Do not steal `out/w121/**`, `out/w120/**`, `out/w117/**`, `out/w116/**`, `out/w96/**`, `out/w85/**` (read ok).  
**Locked sources:** live inventory `out/w122/navrest/current-nav-remaining-inventory.md` (code wins); wishlist Initiative NAV / Idea inbox (read only); Nav01–07 briefs (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist NAV-03 “Remaining zone handoff leftover … impl later.”

**This leftover is remaining NAV after NAV-07.** It is **not** overlay mutex. It is **not** hail. It is **not** toast. It is **not** KeyJ. It is **not** a second Autopilot. It is **not** a hub PPI. It is **not** teleport.

**Census:** leftover is **CONSUME**. Plot LIVE. Guidance LIVE. Autopilot LIVE. Hover LIVE. Handoff LIVE. Chart-close-on-button LIVE. Chart-label LIVE. If a later census finds NAV-01..07 **gone**, re-open this leftover as **REAL** and name **PR1** only after that census. Do **not** ship a second path while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-NAV work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6035–6036**, **6172**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. KeyM stays. KeyJ dock/jump — cite, do not remap. **No new Digit.** First remaining serial (if owner re-opens after a true missing-NAV census) **must not steal** Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` only. Live `innerHTML` in `galaxychart.js` / `autopilot.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** invented UU. **No** SKU. **No** kit mutate.
6. Persist: **no** new `WORLD_FIELDS` key. `nav` already exists (`save.js` **100–101**). Restore still heals `autopilot: false` via `sanitizeNav`. Do **not** persist-resume flying AP. `flags.chartOpen` stays session (`ctx.js` **208**).
7. Prototype-safe later helpers: `sanitizeSystemId` + reserved ids (`nav.js` **8–36**). Dest `<select>` already uses `Object.keys` + `Object.hasOwn` + `sanitizeSystemId`. No `for-in` merge of a raw nav blob. Do **not** persist `ctx.autopilot`.
8. `gate.js` stays the only `jumpRequested` writer. Autopilot never emits jump. No teleport. No skip zone. No skip charge.
9. Overlay mutex / hail / `showApLive` / Autopilot button close: **cite, do not steal**. Do not rewrite overlay-policy. Do not raise chart z. Do not invert NAV-06 button close. Do not invert NAV-05 ring-vs-hub.
10. PHY-04 80 u sample stay skippable. Power ledger out. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake; WAVE26 is closed Wave 119).
11. Wishlist NAV-03 handoff sentence is **stale**. Wave 117 landed. Do **not** treat “impl later” as REAL leftover.
12. NAV-04 dest-select not painting hover is **not** a leftover hole. Hover is pointer inspect. Dest is plot. Do not freeze keyboard-hover PR1.
13. Missing named `WAVE96` / `WAVE120` / `WAVE121` `console.log` in `boot-test.mjs` is **not** a player-facing NAV hole. Do not edit `scripts/` from this pack.
14. Do not invent teleport, persist-resume flying AP, a hub PPI, a new Digit, a new persist key, UU, SKU, kit mutate, or aim-glass gauges.
15. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave122.md`.
16. Fail-closed later (if owner re-opens after a **true** missing-NAV census): refuse MATCH / no dest / docked; no emit without zone+`near.to === nextHop`; reserved ids drop; **never freeze the sim**.
17. Bindings do not change here.

---

## 0.1 Wave 122 deputize (owner may override after playtest)

Pick playable NAV defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent teleport / persist-resume AP / hub PPI / Digit.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| Persist | `WORLD_FIELDS` `nav` one record | `save.js` **100–101** |
| Restore AP | always `false` | `nav.js` **48–55**, **191–192** |
| Next hop | `path[1]` | `autopilot.js` **111–116** |
| MATCH | refuse consume | **184** |
| Jump emit | `gate.js` `{ to: near.to }` | `gate.js` **672–678** |
| Ring vs hub | physical ring does not hub-cancel | `autopilot.js` **335–337** |
| Button close | Autopilot success `setOpen(false)` | `galaxychart.js` **704–706** |
| Direct engage | `tryEngage` does not close | `autopilot.js` **209–223** |
| Labels | `activateSystem` shared | `galaxychart.js` **726–751** |
| Dest list | `#rw-galaxy-dest` | **202** |
| KeyM typing | `isTypingFocus` skip | **764–779** |
| HIT discs | 24 CSS px | **48** |
| Hub | 80 px empty | `hud.css` **184–193** |
| Digit 0 | shipyard | `station.js` **188** |

### Smallest additive punch

**None.** NAV-01..07 already punch via live plot / guidance / AP / hover / handoff / button close / labels.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining NAV leftover |
| Fail-closed | MATCH refuse; no dest refuse; no zone → no emit; never pause |
| Additive PR1 | **None.** Do not add teleport, hub PPI, dest-hover leftover, persist-resume AP. |
| Not a leftover PR | overlay mutex; hail; toast; KeyJ; TGT radar; REP |
| Persist | existing `world.nav` only; AP flag false on restore |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining NAV work while NAV-01..07 exist.
- First remaining serial (if owner re-opens after a true missing-NAV census) must **not** steal Digit 0/8/9, must **not** write `state.js`, must **not** emit jump outside `gate.js`, must **not** persist-resume flying AP.
- If chart stays open on **direct** `tryEngage`, that is NAV-05/NAV-06 split, not a hole. Button close is the product path.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

No new formula. Copy live:

- `AP_STEER_BREAK = 0.65`
- `HIT_CSS_DIAMETER = 24`
- `JUMP.zone` unchanged (WAVE117 `zoneUnchanged`)
- Next hop = `path[1]`

---

## 1. What CONSUME means

A later worker must **not** treat wishlist “Remaining zone handoff leftover … impl later” as a hole. Code has handoff. Code has plot, guidance, AP, hover, button close, labels. Markdown freeze records that fact.

Optional later census (named only, not PR1): re-grep `activateSystem`, `#rw-galaxy-dest`, `lookupLiveNavHopKind`, `setOpen(false)` on Autopilot button, `sanitizeNav` `autopilot: false`. If still live → keep CONSUME.

---

## 2. Lockstep (do not smash)

`world.nav` stays one record. `ctx.autopilot` stays live-only. `gate.js` stays sole emit. Overlay mutex stays sibling. HUD-01 hub stays empty. Digit 0/8/9 stay.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining NAV** | **Does not exist.** Leftover CONSUME | teleport; persist-resume AP; hub PPI; dest-select hover leftover; new Digit; new persist key; overlay steal; `innerHTML` |
| **PR-census (optional skip)** | Re-grep NAV-01..07 live cites | New world field; boot-test WAVE96/WAVE121 log invention |

First remaining NAV serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.

---

## 4. Wins vs integrator brief

If `docs/Nav08RemainingNavDesign.md` ever says REAL / PR1 while this file says CONSUME / none, **this file wins** until a new census proves a live hole. Inventory file:line beats wishlist prose.
