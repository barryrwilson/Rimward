# CTL-01 remaining dock/jump bind shared contract

**Wave:** 116. Design only. No bind remap ships in this wave.  
**Status:** MERGE LAW for `docs/Ctl01DockBindDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav*.md` (NAV-05 sibling owns AP handoff copy), `docs/Hud02RemainingTargetSilhouettesDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Bio*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Phy*.md`, `docs/Fx01*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave116.md`. Do not write sibling Wave 116 paths (`out/w116/hud02tgt/**`, `out/w116/nav05/**`).  
**Locked sources:** wishlist IDEA (P0, CONTROLS) dual-bind D (**cite, do not edit**); live inventory `out/w116/ctl01/current-ctl01-dock-bind-inventory.md` (code wins); Wave 40 title = `systems[0]` capture; NAV-03/NAV-05 `wantJump` (**cite, do not steal**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale copy.

**This leftover is a dedicated non-movement interaction bind for dock and gate jump.** It is **not** a new `input` event name. It is **not** autopilot emit. It is **not** HUD-02 combat rails. It is **not** P1 overlay-priority.

**Live dual-bind:** `KeyD` sets `pendingDock` **and** held `strafeX`. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No dock pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** KeyT / KeyV / KeyK / KeyX stay (`controls.js` 44, 268, 280–290).
3. Movement keys **must not** emit dock/jump. WASD, Q/E roll, R/F throttle, Space afterburner, Shift drift, LMB fire stay movement/combat. After PR1, **KeyD must not** set `pendingDock`.
4. `innerHTML` forbidden later. Help strings / prompts update with `textContent` / `h()` / `el()` / `createTextNode` only. **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. **No** bind-remap settings schema this serial. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Keep `ctx.input.dockPressed` as the **edge** the world already reads. Prefer remap the **key that sets `pendingDock`**, not a new event name, so `gate.js` / `station.js` stay readers. Do **not** add `jumpPressed` unless a later census proves a split is load-bearing (Wave 116 census: **not** load-bearing).
8. Dock **and** gate jump stay the **same** dedicated key (same prompt family). Split only if a later census proves they must.
9. Autopilot `wantJump` stays independent (`gate.js` 643–650 ORs it). Do **not** require the new key for AP jumps. Do **not** make AP write `dockPressed`. Later write-set **must not** claim `src/game/autopilot.js` (NAV-05).
10. Later write-set **must not** claim HUD-02 combat rails in `src/systems/hud.js` (`tgtFacing`, class tokens, hub, RANGE). Prompt **copy** (pKey/pVerb dock/jump family) and CONTROLS lines (filled from `config.controls`) may change.
11. WAVE21 / WAVE6 boot pins that dispatch **KeyD** for jump or grep `'D — dock'` **must be updated on purpose** in the impl wave. Direct `ctx.input.dockPressed = true` dock helpers may stay. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).
12. Fail closed:
    - Title overlay attached (`#rw-title` with parent / `isConnected`), models browser open, or typing in INPUT/TEXTAREA/SELECT/contentEditable → **do not** pulse `pendingDock`. A create-on-miss `getElementById` stub is not title open. Never throw. Never freeze the sim.
    - Missing ship / not in zone → `dockPressed` is a no-op (live). Keep that.
    - AP without KeyJ still jumps via `wantJump` when `inZone` and hop matches.
13. `reducedMotion` **n/a**. Do not invent a new settings checkbox. Do not add prompt animation.
14. Accessibility: the prompt **must name the new key** in text (`pKey` and/or verb). Color on `.rw-prompt-key` is **not** the only cue.
15. CPU freeze: **no** per-frame DOM alloc for this leftover. Help list stays init-time. Prompt already write-on-change.
16. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`. Do not write `docs/OwnerDecisionsWave116.md`. Deputize defaults live in **this** contract.
17. Do not steal `out/w116/hud02tgt/**` or `out/w116/nav05/**`.
18. Collision with later CTL overlay-priority (P1 inbox hail/chart/berth stack) is **out of scope**. Call it out. Do not solve stacking here.
19. Prototype-safe later helpers: authored `e.code` literals only. Never `for-in` a save blob into bindings.
20. `controls.js` remains the **only** writer of `ctx.input` (live law `ctx.js` 15). Station/gate **read** `dockPressed`. Station may clear `dockPressed` after consume (live 6259) — keep that pattern; do not let AP set it.

---

## 0.1 Wave 116 deputize (owner may override after playtest)

Pick a playable **non-movement** dock/jump default. Inventory proves **KeyD dual-bind is LIVE**. Do not park. Do not invent UU / SKU / Digit. Do not invent HTML from key names.

### Unused-key census (code wins)

Forbidden for this leftover (owner list + live uses):

| Code | Why forbidden |
|---|---|
| Digit0–9 | Station services / weapons / title / origins / death Digit1 |
| KeyW/A/S/D | Movement. After PR1 KeyD **stays** strafe |
| KeyQ/E | Roll |
| KeyR/F | Throttle |
| Space | Afterburner; death recover |
| ShiftLeft/Right | Drift |
| LMB | Fire |
| KeyT/V/K/X | Target / reticle lock / engine-part / MATCH |
| KeyM/L/H/P/C/N | Chart / berth / hail / pause / camera / automine |
| KeyO | Settings |
| KeyG | Hub route cycle (`gate.js` 577–585) |
| KeyB | Docked undock (`station.js` 6095, 6127) |
| KeyY | Docked shipyard (`station.js` 6097) |
| Enter | Title first entry (`title.js` 217–222); death recover (`save.js` 1341) |
| KeyZ | WAVE6 harness unbound dismiss (`boot-test.mjs` 1723) — not a game bind, **do not steal** |
| Escape | Overlay close |

Letters with **no** `src/` gameplay listener at census: **KeyI, KeyJ, KeyU** (and KeyZ harness-only).

**Deputize: KeyJ** (jump/dock mnemonic; unused in `src/`; not Enter; not KeyZ). Owner may override after playtest to KeyI or KeyU. Do not park. Do not pick Enter without a new capture-phase census.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Dual-bind | KeyD → `pendingDock` + `strafeX` | `controls.js` 274–276, 440 |
| Edge | `input.dockPressed = pendingDock` | 370–377 |
| Help | A/D strafe; D dock | 343, 353 |
| TRACKED | KeyD in; KeyJ **out** | 41–48 |
| Human jump | `dockPressed \|\| apJump` | `gate.js` 648 |
| AP jump | `wantJump` | `gate.js` 643–647; `autopilot.js` 317 |
| Station | `dockPressed` + range | `station.js` 6250–6259 |
| Prompt | D dock / D jump / G+D hub | `hud.js` 2127–2138 |
| Title | capture; Enter first | `title.js` 190–227 |
| AP/AM helm | `strafeX` | `autopilot.js` 153; `automine.js` 177 |

Do **not** “fix” CTL-01 by moving strafe off D onto I/J/U. Inbox is **interaction vs movement**, not a new WASD.

### Smallest additive remap

**Name:** `pendingDock` from **KeyJ**. KeyD strafe only. Keep `ctx.input.dockPressed`.

| Piece | Freeze |
|---|---|
| Fail-closed | Title / models open / typing → skip `pendingDock`. Unknown overlay: do not invent flags. Never throw. |
| Additive PR1 | 1) `TRACKED` add `KeyJ`. 2) `case 'KeyJ': pendingDock = true`. 3) Remove `pendingDock` from `case 'KeyD'`. 4) `strafeX` still KeyD/KeyA. 5) Help + onboarding + prompt copy name **J**. 6) Boot jump `dispatchKey('KeyJ')`. 7) Skip dock pulse on title/models/typing (mirror `main.js` 170–174). |
| Not PR1 | `state.js`; Digit; persist; AP file; HUD-02 rails; overlay policy; `innerHTML`; Enter; bind settings UI |
| Home | `controls.js` first. Copy in onboarding + hud prompt strings + boot pins. |
| Persist | **none**. |
| Helm | Do **not** add KeyJ / `dockPressed` to AP or automine `inputBreak`. Holding D still cancels AP via `strafeX` (intended). Tapping J in empty space is a no-op, not helm. |

Owner freeze (do not invert):

- Movement must not emit dock/jump.
- Same key for dock and gate jump.
- `dockPressed` stays the world edge.
- `wantJump` stays AP-only.
- Census leftover is **real**. Not CONSUME. Serial is **not** none.
- If allowlist/overlay skip fires, live strafe and AP still work. **Never stop.**

### Formulas (later impl)

```
// LIVE — keep strafe; STOP using D for pendingDock
input.strafeX = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0)

// NEW — KeyJ tap only (keydown non-repeat, already the pending* pattern)
// skip if title overlay attached / models.isOpen / typing focus
case 'KeyJ': pendingDock = true

input.dockPressed = pendingDock   // unchanged publish

// LIVE gate — do not rewrite
if (inZone && !docked && !jumping && (ctx.input.dockPressed || apJump)) {
  ctx.emit('jumpRequested', { to: near.to })
}
// apJump stays wantJump && nav.autopilot && near.to === nextHop
```

Do **not** persist the bind. Do **not** write `wantJump` from KeyJ. Do **not** write `dockPressed` from AP.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — KeyD dual-bind live |
| New `jumpPressed` event | **Forbidden** unless later census proves split |
| AP writes `dockPressed` | **Forbidden** §0.9 |
| Require KeyJ for AP jump | **Forbidden** §0.9 |
| Split dock vs jump keys | **Forbidden** PR1 §0.8 |
| Move strafe off D | **Forbidden** — not the inbox |
| Enter / KeyZ / KeyO / KeyG / Digit | **Forbidden** §0.1 census |
| Digit 0/8/9 / KeyT/V/K/X | **Forbidden** §0.2 |
| `innerHTML` | **Forbidden** §0.4 |
| `state.js` / new persist / bind UI | **Forbidden** §0.5–0.6 |
| HUD-02 combat rails | **Forbidden** §0.10 |
| `src/game/autopilot.js` | **Forbidden** §0.9 |
| Overlay stacking policy | **Forbidden** this leftover §0.18 |
| Add KeyJ to `inputBreak` helm | **Forbidden** — would cancel AP/AM on dock tap |
| Steal `out/w116/hud02tgt/**` / `nav05/**` | **Forbidden** §0.17 |
| Aim-glass gauges / hub pip | **Forbidden** §0.2 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `pendingDock` / `input.dockPressed` | PR1 `controls.js` KeyJ | `gate.js`, `station.js`, `ship.js` 906 |
| `input.strafeX` | **none new** — KeyA/KeyD | ship / AP / AM helm |
| `autopilot.wantJump` | **none** (live AP / NAV-05) | `gate.js` |
| Help strings | PR1 `config.controls` | `hud.js` init list |
| Prompt dock/jump copy | PR1 `hud.js` pKey/pVerb **only** | `.rw-prompt` |
| Onboarding texts | PR1 `onboarding.js` | hint `textContent` |
| Boot KeyD jump pins | PR1 `boot-test.mjs` | harness |
| `state.js` | **none** | — |
| Digit / station | **none** | — |
| KeyT / KeyV / KeyK / KeyX | **none** | consume |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `#rw-title` overlay attached | no `pendingDock` from KeyJ (title already capture-swallows; PR1 still skip). Detached / create-on-miss stub is not open |
| `ctx.models.isOpen()` | no `pendingDock` |
| Focused INPUT / TEXTAREA / SELECT / contentEditable | no `pendingDock` |
| Not in dock/gate zone | `dockPressed` no-op (live) |
| Docked | station overlay owns keys; space dock pulse unused |
| AP engaged, in routed zone | jump via `wantJump` **without** KeyJ |
| AP engaged, player taps J in zone | live OR already allows human `dockPressed`; keep; do **not** treat as helm cancel |
| Player holds D in zone after PR1 | strafe only; **never** jump |
| Overlay hail/chart/berth open | **out of scope** P1; residual: KeyJ may still pulse (same as live D) unless a live flag is obvious |
| `reducedMotion` | n/a |
| Partial merge (bind without copy) | bind still works; prompt may still say D until copy lands — PR1 must land copy **with** bind |
| Missing `controls.js` TRACKED add | KeyJ ignored (live TRACKED gate). Do not throw |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 dedicated dock/jump bind** | KeyJ `pendingDock`; KeyD strafe only; help / onboarding / prompt copy; typing/title/models skip; boot KeyD **jump** pins + `'D — dock'` string; `ctx.js` comments | `state.js`; Digit; persist; AP file; HUD-02 rails; overlay policy; `innerHTML`; Enter |
| **PR2 prompt chrome (optional)** | Prompt stills after playtest | Required if PR1 copy is enough; overlay policy; known FAIL fixes |
| **PR3 census (optional skip)** | Re-grep KeyD ↛ `pendingDock`; KeyJ → `pendingDock`; prompt names J | New world field |

First remaining serial is **PR1 dedicated dock/jump bind**. It must not steal Digit 0/8/9. It must not write `state.js`. **Named only. Do not implement in Wave 116.**

Serial is **not** none.

---

## 4. Persist / proto

No bind in save. No settings schema. Authored `e.code === 'KeyJ'` only. No `for-in` on records. No `WORLD_FIELDS` growth. No `settings.js` write.
