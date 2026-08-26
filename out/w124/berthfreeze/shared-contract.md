# CTL-03 remaining Berth Records sim freeze shared contract

**Wave:** 124. Design only. No berth hold ships in this wave.  
**Status:** MERGE LAW for `docs/Ctl03BerthFreezeDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (berth-open hold + explicit resume).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Ctl02OverlayDesign.md`, `docs/Nav*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave124.md`. Do not steal sibling Wave 124 packs (starter grace, menu input). Do not steal P1 hail-demand lifecycle, HUD deconfliction, chart zoom, onboarding lesson, Settings rebind, Agent API. Do not steal `out/w124/` siblings (read ok).  
**Locked sources:** wishlist INBOX (P0, RECORDS/OVERLAYS) berth-behind-modal (**cite, do not edit**); live inventory `out/w124/berthfreeze/current-ctl03-berth-freeze-inventory.md` (code wins); Wave 118 CTL-02 mutex + **never write `flags.paused`** from hail/chart/berth; Wave 28 LOAD pause-gate; NAV-05 `gate.js` sole `jumpRequested`; NAV-03 restore AP false.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale berth hint “records hold while you fly”.

**This leftover is a session berth-open hold plus an explicit resume when a gate charge, jump, or flying Autopilot leg was interrupted.** It is **not** KeyP pause. It is **not** hail pause. It is **not** chart pause. It is **not** a second jump path. It is **not** persist-resume Autopilot. It is **not** CTL-04 `controls.js`. It is **not** AI-05 pirate retune.

**Live hole:** Berth z 60, `flags.berthOpen`, sim still `update`s. AP still steers. `gate.js` still emits. `jump.js` still charges. Sun/combat still hit the player. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. No berth pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.**
3. KeyL stays berth. KeyM stays chart. KeyH stays hail. KeyJ stays dock/jump. KeyP stays pause. **Do not remap those keys.**
4. `innerHTML` forbidden later. Berth hint / resume / meta use `textContent` / `createTextNode` / `h()` / `el()` only. Live berth already uses `textContent` (`save.js` **1370**, **1377**, **1493–1497**). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Hold is **session**. Overlay flags stay session (`berthOpen` live; `berthHold` later). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. **Do not** set `ctx.flags.paused` for this hold. KeyP pause and berth hold are different. Hail/chart/berth **never** write `flags.paused` (CTL-02 Wave 118 — **cite this collision; do not reopen hail defer/calm; do not pause hail or chart**).
8. Wave 28 LOAD: `loadFromSlot` refuses when `flags.paused` because `systemLoaded` while the loop is frozen is a desync hazard (`save.js` **1416–1420**; `main.js` **149–155**). **LOAD from berth must stay possible** while the player is **not** KeyP-paused. Mapping berth hold onto `flags.paused` is **forbidden**.
9. **Do not skip the full `systems` loop for berth hold.** `main.js` must **not** treat `berthHold` as `flags.paused`. Event rotate stays. `save.js` / `jump.js` / station rebuild must still see `lastEvents` after LOAD. Player-facing freeze is **reader early-return**, not a second pause.
10. NAV-05: `gate.js` remains the **sole** `src/` writer of `jumpRequested`. Do **not** invent a second jump path. Do **not** teleport. Do **not** claim `showApLive`.
11. NAV-03: restore / `sanitizeNav` / `writeNav` still force `autopilot: false` (`nav.js` **48–55**). **Never** resume flying Autopilot from LOAD. Resume-after-berth is only for a **session-interrupted** flying leg, not a restored snapshot.
12. Charge lives in **`jump.js`** (`timer += dt`, midpoint swap `jump.js` **200–227**). `gate.js` **emits**. Later readers: `gate.js` refuse **emit** while hold; `jump.js` refuse **consume** of a new `jumpRequested` and **do not advance** an in-flight timer while hold. Do **not** cancel `ctx.gate.jumping` into a teleport. Do **not** claim `jump.js` exclusive vs NAV.
13. Later write-set **this pack owns**:
    - **Writers:** `src/game/save.js` (berth open/close/hint/resume + hold snapshot); optional tiny helper on `src/systems/overlay-policy.js` (`berthHold` session flag writer). Prefer one session flag `ctx.flags.berthHold` written **only** from save.js / overlay-policy.
    - **Readers (not exclusive owners):** `src/systems/ship.js` skip player flight integrate; `src/systems/combat.js` skip sun heat/kill and combat damage **against the player**; `src/systems/gate.js` refuse emit; `src/game/jump.js` freeze charge timer; `src/game/autopilot.js` **one** early-return on hold (mirror paused/docked `flyTick` **388–390** — do **not** claim the NAV-05 handoff file as exclusive). `src/main.js` must **not** map hold → pause; comment-only or a named helper read is ok.
    - **Do not claim** `src/systems/controls.js` (CTL-04 later). **Do not claim** npc interest/spawn (AI-05 later). **Do not** retune pirates.
14. Hail/chart stay CTL-02: they do **not** pause the sim. This leftover is **berth only**.
15. Fail closed:
    - Never throw. Never freeze the sim from a missing helper. If overlay-policy is missing, skip mutex (live) and **do not** fall back to `flags.paused`.
    - Unknown overlay → do not invent persist flags. Session booleans only.
    - Title / models / typing → live KeyL already blocked via `playSurfaceBlocked`. Keep.
    - Mid-jump SAVE/LOAD stay refused (live `save.js` **1421–1424**, **1534–1537**).
    - LOAD always **clears** `berthHold` and the interrupt snapshot in the **same click** as `restore` / `setBerthOpen(false)`, so the next frame can consume `systemLoaded`.
16. `reducedMotion`: do **not** invent hold animation. Resume is text.
17. Accessibility: resume **must be named in text**. Color is not the only cue. **No new Digit.** Do not steal Enter (death recover `save.js` **1341**; title CONTINUE). Do not steal KeyP. Interrupt remainder keeps named SAVE/LOAD buttons. Do not hide the desk.
18. CPU: **no** per-frame DOM alloc for hold. Berth already rebuilds rows on open / after save. Resume button is create-once.
19. Prototype-safe: authored flag names only (`berthHold`). Never `for-in` a save blob into flags. Never persist hold.
20. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake).
21. Do not steal sibling Wave 124 packs. Do not steal P1 hail-demand lifecycle, HUD deconfliction, chart zoom, onboarding lesson, Settings rebind, Agent API.
22. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not write `docs/OwnerDecisionsWave124.md`. Deputize defaults live in **this** contract.

---

## 0.1 Wave 124 deputize (owner may override after playtest)

Pick a playable **berth-open hold**. Inventory proves **hold + resume are not live**. Do not park. Do not invent UU / SKU / Digit / persist key. Do not invent HTML from save blobs.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Berth z / sim | 60; sim **live** | `save.js` **1353**, **38–50** |
| Hint | “records hold while you fly” | `save.js` **1377** |
| `flags.berthOpen` | session; `setBerthOpen` only | `ctx.js` **210**; `save.js` **1393** |
| `flags.berthHold` | **absent** | — |
| `flags.paused` | KeyP; skips **all** `system.update` | `main.js` **149–176** |
| LOAD vs pause | refuse | `save.js` **1420** |
| Overlay paused write | **never** (hail/chart/berth) | `overlay-policy.js` **4** |
| Hail vs berth | defer card | `overlay-policy.js` **111** |
| `jumpRequested` | `gate.js` only in `src/` | **678** |
| Jump charge | `jump.js` timer | **221–227** |
| AP under pause | `zeroCmd`; return; stay engaged | `autopilot.js` **388–390** |
| Restore AP | always `false` | `nav.js` **54** |

Do **not** “fix” the hole by setting `flags.paused` from berth. That breaks LOAD and fights CTL-02.

### Playable policy (smallest additive)

**Name:** session `berthHold` while Berth Records is the open play card. Explicit **RESUME** text if a gate charge, jump, or flying Autopilot was interrupted. Else close returns to live flight.

| Piece | Freeze |
|---|---|
| Hold flag | `ctx.flags.berthHold` session boolean. Writer: `save.js` and/or overlay-policy helper. **Not** `WORLD_FIELDS`. |
| When set | `setBerthOpen(true)` sets hold. |
| When clear (no interrupt) | `setBerthOpen(false)` clears hold. Player returns to live flight. |
| When keep (interrupt) | **Panel stays.** Do **not** shrink to a resume-only remainder. Do **not** replace the desk with a resume-only card. Title + SAVE/LOAD rows stay **visible and clickable**. Reason line + `RESUME` sit **below** the slots (more prominent than slot SAVE; still `textContent`). `berthOpen` stays **true** so CTL-02 mutex still defers hail and refuses chart. L / Escape **keep the desk** — they do **not** dump to live charge or Autopilot. Named **RESUME** (or LOAD) leaves the hold. |
| What hold stops | Player flight integration; Autopilot **steering** (`zeroCmd` + return, do **not** disengage as helm); gate **emit**; jump **charge/activation** (timer freeze; no midpoint swap); sun heat/kill vs player; combat damage **against the player** (ignore `npcFire` target player / player `applyHit` from NPC/sun/impact). |
| What hold does **not** stop | KeyP pause machinery; berth SAVE/LOAD clicks; overlay mutex; distant NPC traffic (cheaper default). Idle autosave may run. `world.time` **may** advance so calm clocks do not lie — player-facing DPS must still skip. |
| Pirate demand | Hail **card** already defers (`canShowHail` `'defer'`). Hold must also stop the **attack**. Do not retune spawn/interest (AI-05). Do not add a demand toast (other P1). |
| AP early-return | Mirror `flyTick` paused: `zeroCmd`; return; **keep** `nav.autopilot` so RESUME can continue the **same** leg. Do not `disengage('input')`. Do not treat hold as helm. |
| Gate | No new `jumpRequested` while hold. `apJump` must not emit. Human `dockPressed` must not emit. |
| Jump in flight | If `ctx.gate.jumping` already true when hold starts: **freeze timer**. Do not swap. Do not clear `jumping`. RESUME lets `jump.js` continue the **same** charge. |
| Resume required when | Hold start or close-attempt saw any of: `ctx.gate.jumping`, `ctx.gate.progress > 0`, flying Autopilot (`world.nav.autopilot === true`). |
| Resume **not** required when | None of those. Close → live flight. |
| LOAD | Same-click: restore, `setBerthOpen(false)`, **clear hold**, **clear interrupt snapshot**. `sanitizeNav` leaves AP false. **No** RESUME for a restored route. Mid-jump LOAD still refused (live). |
| SAVE | Still writes while hold (not paused). Mid-jump SAVE still refused (live). Hostile bubble still `saveBlocked`. |
| Hint copy | **Must change.** Must not say records hold while you fly. Named distinction: this is **not** Pause (P). Two authored `textContent` literals. **Open, no interrupt:** `L or ESC to close — your ship holds. This is not Pause (P).` **Interrupt remainder (desk still full):** `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).` Remainder hint must **not** say “L or ESC to close” as if that dumps to live flight. L / Escape keys still exist; they keep the desk. |
| Resume copy | Text button `RESUME` via `textContent`, **below** SAVE/LOAD slots, more prominent than slot SAVE. Extra line names **why** (gate charge vs Autopilot). No Digit. No Enter bind. Authored literals only (do not interpolate system ids into HTML): AP `Autopilot is waiting. RESUME continues that leg.`; gate `Gate charge is waiting. RESUME continues that jump.`; both `Autopilot and gate charge are waiting. RESUME continues.` |
| Fail-closed | Helper throw → catch, skip hold write, **do not** pause. Never freeze the sim forever. |
| Home | `save.js` first. Optional overlay-policy `setBerthHold` / `berthHeld(ctx)` boolean. |
| Persist | **none**. |

Owner freeze (do not invert):

- Leftover is **real**. Not CONSUME. Serial is **PR1**, not none.
- Do **not** use `flags.paused` for berth.
- Do **not** skip the full `system.update` loop for hold.
- Do **not** pause hail or chart.
- Do **not** emit a second `jumpRequested`.
- Do **not** persist-resume Autopilot.
- Do **not** shrink the interrupt panel to a resume-only remainder. SAVE/LOAD stay on the desk.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// SESSION — not WORLD_FIELDS, not flags.paused
ctx.flags.berthHold = true   // writer: save.js setBerthOpen(true) / overlay-policy helper

// AP — one early-return; do not disengage
if (ctx.flags.berthHold) { zeroCmd(ap); return }

// GATE — sole jumpRequested writer; refuse while hold
if (ctx.flags.berthHold) { /* do not emit */ }
else if (inZone && !docked && !jumping && (dockPressed || apJump)) {
  ctx.emit('jumpRequested', { to: near.to })
}

// JUMP — freeze charge; do not consume a new request under hold
if (ctx.flags.berthHold) {
  // do not beginJump from events; do not timer += dt
  return
}

// LOAD — never paused-gated by hold; clear hold same click
if (ctx.flags.paused) return          // Wave 28 KEEP
if (ctx.flags.berthHold) { /* LOAD still allowed */ }
restore(ctx, snap)
clearBerthHoldAndSnapshot()
setBerthOpen(false)
```

Do **not** persist `berthHold`. Do **not** write `wantJump` from save.js. Do **not** write `dockPressed` from AP.

### NPC traffic pick (inventory; freeze)

Default: **freeze player-facing hazards and gate; keep distant traffic.** Cheaper than freezing every NPC. A pirate demand toast/card must not become a **new attack** behind the modal. Combat reader skips player damage. Do **not** retune `npc.js` interest/spawn (AI-05).

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — hold + resume not live |
| `flags.paused` from berth | **Forbidden** §0.7–0.8 (LOAD + CTL-02) |
| Skip full `systems` loop | **Forbidden** §0.9 |
| Pause hail or chart | **Forbidden** §0.14 |
| Second `jumpRequested` writer | **Forbidden** §0.10 |
| Teleport / cancel jump to idle pose | **Forbidden** — freeze charge, then RESUME |
| Persist `berthHold` / overlay flags | **Forbidden** §0.6 |
| Resume AP after LOAD | **Forbidden** §0.11 |
| New Digit / Enter / KeyP resume | **Forbidden** §0.17 |
| Claim `controls.js` | **Forbidden** §0.13 (CTL-04) |
| Retune pirates / npc spawn | **Forbidden** §0.13 (AI-05) |
| `innerHTML` hint/resume | **Forbidden** §0.4 |
| `state.js` write | **Forbidden** §0.5 |
| Hail defer rewrite | **Forbidden** — cite CTL-02 only |
| Aim-glass gauges / hub pip | **Forbidden** §0.2 |
| Resume-only remainder / hide SAVE/LOAD | **Forbidden** §0.1 — panel stays; desk stays |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `flags.berthOpen` | PR1 `save.js` `setBerthOpen` | overlay-policy mutex; hail defer |
| `flags.berthHold` | PR1 `save.js` / overlay-policy helper | ship, combat, gate, jump, AP |
| Interrupt snapshot | PR1 `save.js` module local (session) | resume copy |
| Berth hint / RESUME | PR1 `save.js` `textContent` | player |
| `flags.paused` | **none** (KeyP `main.js`) | LOAD gate; AP; hail digits |
| `jumpRequested` | **none new** — live `gate.js` | `jump.js` |
| `nav.autopilot` | AP file **one early-return only**; LOAD still `sanitizeNav` false | gate `apJump` |
| `controls.js` | **none** (CTL-04) | — |
| npc interest/spawn | **none** (AI-05) | — |
| `state.js` | **none** | — |
| Digit / station | **none** | — |
| `showApLive` | **none** (NAV-05) | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `#rw-title` / models / typing | KeyL already skip open (live). Keep |
| Hail open | mutex refuses berth (live). Keep |
| Chart open | mutex refuses berth (live). Keep |
| KeyP paused + berth | LOAD still refuses (Wave 28). Hold must not **add** that refuse when unpaused |
| LOAD while hold, not paused | restore + clear hold + close + next frame consumes `systemLoaded` |
| Mid-jump SAVE/LOAD | live refuse + toast. Keep |
| Hold + flying AP | zeroCmd; do not disengage; desk stays; RESUME continues |
| Hold + `gate.jumping` | freeze timer; no swap; desk stays; RESUME continues same dest |
| Hold + interrupt + L/ESC | keep desk; do **not** dump to live charge |
| Hold + neither | L/ESC close clears hold; live flight |
| Helper throw | catch; do not pause; never throw out |
| Missing `berthHold` flag (old ctx) | treat as false; live under berth (today). Do not throw |
| Hostile save `nav.autopilot: true` | `sanitizeNav` still false |
| `reducedMotion` | n/a extra motion |
| Partial merge (hold without hint rewrite) | **Forbidden** — PR1 lands copy **with** hold |
| Pirate `hailOpened` while berth | card defers (live); player damage skipped (new) |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** berth-open hold + resume | `berthHold` session; save.js open/close/hint/resume; overlay-policy helper optional; readers ship/combat/gate/jump/AP early-return; LOAD clears hold same click; hint English change; **interrupt panel keeps SAVE/LOAD**; RESUME below slots | `flags.paused` write; full-loop skip; resume-only remainder; `controls.js`; npc spawn retune; `showApLive`; hail defer rewrite; persist; Digit; `innerHTML`; Enter; known FAIL fixes |
| **PR2 stills (optional)** | Playtest: berth during AP-to-gate does not swap system; LOAD still works; hail/chart still live-sim | Required if PR1 copy is enough; toast-flood; pirate AI |
| **PR3 census (optional skip)** | Re-grep: no berth→`paused`; `berthHold` session; hint not “while you fly”; `jumpRequested` still only `gate.js` | New world field |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim `controls.js`. **Named only. Do not implement in Wave 124.**

Serial is **not** none.

---

## 4. Persist / proto

No hold in save. No settings schema. Authored `berthHold` only. No `for-in` on records into flags. No `WORLD_FIELDS` growth. Snapshot `nav.autopilot` still rewritten false on restore. Autosave key unchanged.
