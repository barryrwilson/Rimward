# UI Audit: Wave 82 TGT-05 remaining lock categories (station / gate / pod / landmark)

**Auditor:** `[designer]` (independent of `out/w82/tgt05/ui-audit.md`)
**Scope:** HUD lock card / existing target bracket, miss feedback, KeyV vs KeyT, no new glance node, no lock box, authored names, no clue-text leak. Cone cap `LOCK_CONE_PX = 12`. Not MATCH/combat implementation review except as it shows on glass.
**Review file:** `out/w82/tgt05/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Source + `src/ui/hud.css`. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits)

Owner freeze: `docs/OwnerDecisionsWave82.md` TGT-05 cone (`LOCK_CONE_PX = 12`, screen-space, disc-first). Brief: `docs/Tgt05LockCatsDesign.md`. Merge law: `out/w81/tgt05/shared-contract.md` (contract wins). HUD-01 / HUD-02 stay closed. Do not reopen KeyV vs KeyT.

## UI Audit: HUD lock card, miss line, KeyV / KeyT

### Summary
Wave 82 reuses the existing target bracket for station / gate / pod / landmark hits. Miss still uses the authored comm line and the frozen `reticleLock { hit }` cue. KeyT still cycles ships (rocks in group 3). KeyV still picks under the visible pip. No new glance instrument. No new lock box. Bracket copy is authored name + distance via `textContent`. Clue id/text never paint. No Blocker. No Major.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 1 minor, 3 suggestions.

### What's done well
- Hit reuses the Wave-74 lock card: `rw-target` + `rw-target-box` corners + `rw-target-info` (`hud.js:682-691`, `hud.css:392-461`). No extra overlay, no second card, no hull-fitted box.
- Kind locks share the ship/rock text slots (`tName` / `tMeta` / `tResolve`). Station / gate / pod / landmark write authored (or static) name + `dist + 'u'` only (`hud.js:1662-1673`). Contract §6.1.
- Combat rail, lead pip, RANGE pop, FORE/AFT target glance, MATCH lamp, and contacts lock pip stay ship-gated (`hud.js:1093-1105, 1155, 1217-1244, 1271-1286, 1537-1538`). Kinds do not grow a new glance node.
- Unknown / untagged `{position}` hides the bracket (`lockOk` needs ship, list-member rock, or allowlisted `lockKind`; `hud.js:347-351, 1083-1108`). It does not paint `ASTEROID`.
- Switching off a ship or a blocked rock clears resolve text, sets `data-band` to `neutral`, and drops `.ore-blocked` (`hud.js:1634-1716`). Color is not the only remaining cue; the name line and hidden vitals carry the kind.
- Landmark names come from authored `landmarks[i].name` for the lock `id` (`hud.js:398-409`). Clue arrays, `mystery.found`, and `line` strings are not read. Chart marks stay a separate HUD pool (`hud.js:697-714, 1402-1442`) with `pointer-events` none (`hud.css:560`).
- Gate copy uses allowlisted `SYSTEMS[to].name` plus a static ` HUB` suffix. Empty display name returns `''` rather than the raw `to` token (`hud.js:412-417`).
- Pod name line is `CARGO` / ore `COMMODITIES[key].name` / `SURVIVOR` (`hud.js:383-395`). Stuffed survivor names never reach the name line.
- Station name is live `ctx.station.name` with control-char strip (`hud.js:354-362, 1662-1664`). Wrappers are not stamped onto `ctx.station`.
- All HUD writes on this path use `textContent` (`el()` at `hud.js:224-228`; toast `hud.js:990`; bracket `hud.js:1702-1710`). No `innerHTML` in `hud.js`.
- Miss copy is the authored constant `'Nothing under the reticle.'` (`controls.js:180-195`). It is not built from `record.name`, cover names, landmark ids, or clue lines. Miss does not steal `targets.current` (`controls.js:197`).
- Toasts sit in a polite live region (`hud.js:717-720`). Miss is visible and announced without moving focus.
- KeyV remains `reticleLockPressed` (`controls.js:25-26, 40, 277-278, 356, 403`). KeyT remains `cycleTarget` with ships plus group-3 rocks only (`controls.js:24-25, 53-82, 262-263, 382`). Help lines still split the two verbs (`controls.js:335-336`). Digit 0 is untouched.
- Pick uses the HUD pip ray (`fillCamRay` + edge 44; first-person zeros mouse offset; `reticle-aim.js:12-15, 37-62, 107-110`). Disc-contains wins; `LOCK_CONE_PX = 12` runs only when no body disc contains the pip (`reticle-aim.js:103-146, 314-337`). Owner number, not degrees, not `CONVERGE_DOT`.
- Body spheres are envelope 32 / bore 30 / pod 0.9 / landmark mesh bound (`reticle-aim.js:17-20, 135-232`). Dock 45, jump 60, glow 96, scoop 30, and discovery 100 are not pick discs.
- Dock / Jump prompts still win over Hail / T / Mine / V (`hud.js:1743-1797`). A station or gate lock does not hide `D` while `inZone`.
- `reticleLock` payload stays `{ hit: true|false }` literals (`controls.js:192-213`). Audio reuses `CUES.reticleLock` (`song.js:119`). No new frozen event. No HUD-03 checkbox.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Chart mark and lock card can double-label the same landmark
**Location:** `src/systems/hud.js:1402-1442, 1662-1673`; `src/ui/hud.css:392-447, 553-583`
**Severity:** minor
**Status:** open (contract forbids using chart marks as a lock source; both instruments are required)
**Issue:** A charted, unvisited landmark already paints a diamond plus `name · dist` (`hud.js:1491-1503`). KeyV then adds the 60 px corner box and a second name + dist card on the same projection. The two scrims sit at the same point (chart label to the right of the diamond; lock info 36 px below the box). The player can read the same authored name twice.
**Fix:** Optional later: dim or hide the chart-mark label while `allowedLockKind(current) === 'landmark'` and ids match. Do not delete chart marks. Do not make the diamond a pick target. Do not add a third label.

#### 💡 Suggestion: empty authored name leaves a dist-only card
**Location:** `src/systems/hud.js:1662-1673, 398-417`
**Severity:** suggestion
**Status:** optional (fail-closed empty string is safer than a guessed label)
**Issue:** If `ctx.station.name`, `SYSTEMS[to].name`, or `landmarks[i].name` is missing after `stripHudText`, the bracket still shows with a blank name line and `Nu` meta. Live authored rows carry names (`authored-systems.js` station / landmark tables).
**Fix:** None required this wave. Do not invent `STATION` / `GATE` / `LANDMARK` filler words against contract §6.1.

#### 💡 Suggestion: context prompt never teaches V for the four new kinds
**Location:** `src/systems/hud.js:1767-1797`
**Severity:** suggestion
**Status:** optional (prompt order is frozen; controls list already names V)
**Issue:** `T — Target` appears when a ship is in bubble and nothing else wins. `V — Lock` appears only when there is no current lock and a rock sits in `U.TARGET_RANGE`. Pointing at a station, gate, pod, or landmark outside dock/jump zones yields no focused verb. Discoverability relies on the controls panel (`controls.js:336`) and on the player already pointing (TGT-05 intent).
**Fix:** Do not add a new key. If a later HUD prompt pass teaches the slice, show `V — Lock` when no higher verb is live and a kind body is under the pip. Dock `D` / jump `D` must still win in zone.

#### 💡 Suggestion: hit and miss share one lock beep
**Location:** `src/systems/song.js:119, 416-438`; `src/systems/controls.js:192-213`
**Severity:** suggestion
**Status:** optional (Wave 74 live cue; contract §6.3 reuses it)
**Issue:** `CUES.reticleLock` plays on event type, not on `hit`. A miss toast plus the same 1480 Hz square can feel like a successful lock if the previous card is still up (miss does not steal).
**Fix:** None required. A later audio pass may branch gain/pitch on `hit` without a new event name. Do not add a HUD-03 checkbox.

### Required checks

| Check | Result |
| --- | --- |
| Existing lock card, no new card | **Pass.** Same `rw-target` tree (`hud.js:682-691`). Kind branches only fill `tName` / `tMeta` (`hud.js:1662-1673`). |
| No new lock box | **Pass.** `rw-target-box` stays 60×60 px corners (`hud.css:401-407`). No hull-fitted rect. No second box class. |
| No new glance node | **Pass.** No extra DOM under `initHud` for kinds. Facing glance dims without `shipTgt` (`hud.js:1226-1245`). Contacts `isLock` is ship-object only (`hud.js:1271-1286`). |
| Authored names | **Pass.** Station `ctx.station.name`; gate `SYSTEMS[to].name` (+ static `HUB`); landmark `landmarks[i].name`; pod static/commodity word. Control chars stripped. |
| No clue text leak | **Pass.** `landmarkLockName` reads `name` for authored `id` only (`hud.js:398-409`). Clue `id` / `line` / `mystery.found` are not on the card. Pick does not walk clue motes (`reticle-aim.js:216-232`). Chart marks are HUD-only and still use landmark `name`, not clue lines (`hud.js:1418-1419`). |
| Miss is obvious | **Pass.** Authored `Nothing under the reticle.` via `commLine` (`controls.js:180-195`). Toast `role="status"` (`hud.js:717-720`). Does not steal current lock. |
| KeyV vs KeyT not reopened | **Pass.** V = reticle pick (`tryReticleLock`). T = `cycleTarget` ships + group-3 rocks. No LMB overload. No new letter. Help text still splits the verbs (`controls.js:335-336`). |
| KeyT does not cycle kinds | **Pass.** `cands` never push station / gate / pod / landmark (`controls.js:63-74`). A kind lock is not in the wrap list; T replaces it with the nearest ship. |
| Cone 12 px, not degrees | **Pass.** `LOCK_CONE_PX = 12` (`reticle-aim.js:14-15`). Comment: screen-space around the visible pip. Used only after disc miss (`reticle-aim.js:103-105, 158-161, 314-321`). Owner `docs/OwnerDecisionsWave82.md:19-25`. |
| First-person pip | **Pass.** HUD and pick both zero reticle offset in FP (`hud.js:1066-1069`; `reticle-aim.js:44-46`). |
| Dock / jump stay zone verbs | **Pass.** Prompt still `D` / `G` from `inZone` (`hud.js:1746-1756`). Lock does not teleport dock or jump. |
| Combat / MATCH glass fail-closed | **Pass.** Rail hidden, lead hidden, RANGE off, MATCH lamp off for kinds (`hud.js:1093-1105, 1155, 1217-1221, 1537`). Hail prompt requires `!kind` (`hud.js:1758`). |
| `textContent` / no `innerHTML` | **Pass.** HUD `el()` and bracket/toast writes. Miss is a string constant. |
| `reticleLock { hit }` only | **Pass.** Literals `{ hit: false }` / `{ hit: true }` (`controls.js:193-213`). Wrappers are not spread into `emit`. |
| Digit 0 / HUD-01 / HUD-02 | **Pass.** Untouched. No layout move. No family checkbox. |
| Chart marks not a lock source | **Pass.** `pickReticleLock` walks authored landmark meshes (`reticle-aim.js:216-232`). Chart pool is display-only. |

### Accessibility
- Miss toast uses the existing polite live region. Hit does not move focus (same as ship/rock lock).
- Bracket and chart marks are not buttons. Chart marks are `aria-hidden` and pointer-inert (`hud.js:710`; `hud.css:560`). Locking does not create a tab stop.
- Kind cards use the same type scale as ships (`hud.css:449-461`, `--rw-text-scale`). Contrast theme still restyles `.rw-target-info` (`hud.css:959`).
- Color is never the only kind cue: name line + hidden combat rail vs ship vitals. Neutral cyan corners match non-hostile contacts, not a new threat band.
- Keyboard: V lock, T cycle, D dock/jump, X MATCH (refuses kinds in `ship.js`). No new binding to learn beyond the controls list.

### Theming
- Corners, meta, and chart glyphs use `var(--cyan)` / `var(--white)` / `var(--dim)` / `var(--amber)` (`hud.css:409-434, 565-578`). No new hardcoded lock-kind palette.
- Info scrim matches the chart-mark label scrim. No data tint. No combat-band color on kinds beyond reset-to-`neutral`.

### States
- **Hit:** existing bracket, immediate, name + dist.
- **Miss:** comm line + `reticleLock { hit: false }`; current lock stays.
- **Blocked V** (docked / jumping / paused / models / title): same miss copy (`controls.js:182-201`). Not a new state.
- **Stale kind:** drop on `systemLoaded`, missing station, scooped pod, missing gate `to`, missing landmark id (`controls.js:118-177, 369-380`). Bracket hides when `lockOk` fails.
- **MATCH / hail / seeker / mining pull:** refuse on the four kinds. Lamp off. Prompt does not offer Hail.
- **Empty name:** blank name line + dist (suggestion above).
- **Hover / focus:** not applicable (no new control).

### Visual hierarchy
- Primary hit feedback remains the corner box on the projected body plus the name card under it. Dist is secondary meta, matching rocks/ships.
- Miss is a top-right comm toast, off the aim column (`hud.css:588-590`). It does not cover the reticle.
- Dock/Jump remain the in-zone verb. Lock is identity, not a teleport.
- 12 px cone is smaller than the 60 px lock box. The box is on the target, not a pick affordance. Forgiveness is pip-relative, as frozen.

### KeyV vs KeyT (closed)
Do not reopen. Live mapping:

| Key | Edge | Role after Wave 82 |
| --- | --- | --- |
| **V** | `reticleLockPressed` | Lock the unobscured body under the visible pip: ships, rocks (any group), station, gate, pod, landmark. Miss does not steal. |
| **T** | `targetPressed` | Cycle in-range ships; add rocks only in weapon group 3. Never adds the four kinds. |

LMB still fires. Digit 0 still shipyard.

### Cone 12 px (owner, not a finding)
`LOCK_CONE_PX = 12` is the Wave 82 owner number (`docs/OwnerDecisionsWave82.md:19-25`; `reticle-aim.js:14-15`). Direct-hit body disc still wins. The cone only claims the nearest unobscured projected center inside 12 CSS pixels. Pods (radius 0.9) will often need that cone at range; stations and gates will usually hit on disc. This is intended tightness against a 44° gun cone. Do not invent degrees.

### Out of scope (not filed)
- MATCH / mining / hail / seeker code paths except as they hide or refuse on glass.
- NPC missiles (not in Wave 82 `src/`).
- HUD-01 layout, HUD-02 skin, HUD-03 audio checkbox.
- Clue motes as a future lock kind (forbidden).
- Aftermath wreck / salvage-as-kind (forbidden).
