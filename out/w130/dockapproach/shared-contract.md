# NAV-10 docking approach assistance shared contract

**Wave:** 130. Design only. No dock-approach ships in this wave.  
**Status:** MERGE LAW for `docs/Nav10DockApproachDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (named HUD approach-speed cue).  
**Name:** docking approach assistance — speed cue so a cruise approach does not surprise-bounce the pad.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01*`–`docs/Nav09*`, `docs/Hail02MissFeedbackDesign.md`, `docs/Hud06HomeMarkerDesign.md`, `docs/Hud07DeconflictionDesign.md`, `docs/Ctl*.md`, `docs/Phy*.md`, `docs/AgentApiDesign.md`, `docs/Tgt*.md`, `docs/Msn*.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 130 packs (`out/w130/tgtcycle/**`, `out/w130/jobdedup/**`). Do not steal Agent API PR2, Hail01/Hail02/HUD-06/HUD-07/NAV-09/CTL-03/AI-05/CTL-04 optional PR2s. Do not write `out/w130/dockapproach/verify/**`.

**Locked sources:** wishlist INBOX (P2, NAV/DOCKING) lines **175–179** (cite, do not edit); live inventory `out/w130/dockapproach/current-nav10-dock-approach-inventory.md` (code wins); CTL-01 KeyJ dock/jump **live**; Hail02 KeyJ miss **live**; HUD-06 HOME **live**; NAV-03 AP **live** (gates only); PHY-01 bounce **live**.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code.

**This leftover is approach-speed assistance on the pad approach.** It is **not** NAV-03 Autopilot. It is **not** PHY-01 collision rewrite. It is **not** HUD-06 HOME. It is **not** Hail02 miss. It is **not** CTL-03 berthHold. It is **not** Agent cheat dock.

**Live hole:** `J — Dock` shows in `U.DOCK_RANGE` 45 (`hud.js` **2535–2536**) with **no** speed text. Dock has **no** speed governor (`station.js` **6321–6330**). Cruise into the D5 cylinder still **bounces** (`ship.js` **907–939**). **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** SLOW pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.**
3. KeyH stays hail. KeyJ stays dock/jump (**tap / one-frame edge**). KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. **Do not remap those keys.** Do **not** change KeyJ from edge to hold in PR1.
4. `innerHTML` forbidden later. Prompt / lamp / toast use `textContent` / `createTextNode` / `el()` only. **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY. Persist: **none**. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist a SLOW-mute / bounce-off / god-mode hush. Do **not** retune `SHIP_CLASSES.creep` (live light creep **30**).
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Approach cue is **not** pause. CTL-03 `berthHold` is **not** this pack.
7. HUD-04: 8 s identical-key linger **stays**. Do **not** reopen toast flood as the SLOW channel. Do **not** invent a second toast stack. Do **not** reuse Hail02 `warn|hailmiss|*` keys for speed.
8. PHY-01 bounce/slide **stays** the collision law. Do **not** claim `collision.js` / `physics.js` / `resolveMover`. Do **not** skip player station bounce except the live `dockPressed` / docked / jumping skips.
9. NAV-03 Autopilot stays gate-to-gate. Do **not** fly the pad. Do **not** steal `autopilot.js` / `wantJump`. NAV-05/06/07/09 cite only.
10. HUD-06 HOME pip + POS + chevron inset **108** stays. Cite; do not retune; do not steal.
11. Hail02 miss stays out-of-range / jump-zone copy. Do **not** claim `hail.js`.
12. Agent API must **not** become a cheat dock. Do **not** claim `agent-api.js`. Do **not** add `act({ name: 'dock' })` that bypasses `U.DOCK_RANGE` / 2× snap. Do **not** teleport beyond the existing 2× snap.
13. Do **not** invent a third helm (no approach-mode stick, no pad AP, no hover rewrite). NAV-04 hover cite only.
14. Fail closed:
    - Never throw from cue update.
    - Never `innerHTML` a station name.
    - Non-finite speed / dist → omit SLOW clause; still show live `J — Dock` when inZone.
    - Unknown overlay / missing station pose → hide extra SLOW; do not pause.
    - Title / typing / models / settings → do not fight the owner surface (live skip already on KeyJ pulse).
    - Docked / jumping / `berthHeld` → no SLOW cue.
    - Gate jump prompt (`gate.inZone` and **not** `station.inZone`) → do **not** replace Jump copy with SLOW. Hide the **self** SLOW lamp. Do **not** write Jump copy.
    - Successful dock this frame → hide SLOW.
    - MATCH lamp on → still hide/show SLOW by the approach rule. Never toggle `.rw-match-lamp` for SLOW.
    - Target SPD (`tgtSpeed`) → never a SLOW node; `set(targetSpeedNow)` stays speed-only.
15. `reducedMotion`: **no** new animation / pulse. Color is not the only cue (authored **text** names SLOW and 20 u/s).
16. Accessibility: SLOW **named in text**. Threshold **named in text**. KeyJ still **named in text** when inZone. **No new Digit.**
17. CPU: **no** per-frame DOM alloc for the cue. Write-on-change like live prompt / SPD.
18. Prototype-safe: authored literals only. Never `for-in` a cue payload into `ai` or `world`.
19. Do not “fix” known REDMARCH `castMatches` flake.
20. Do not steal sibling Wave 130 packs (TGT-07, MSN-04).
21. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.
22. Do **not** pause. Do **not** teleport past 2× snap. Do **not** remap keys.
23. MATCH lamp stays Wave D match-speed. Live `makeSpeed()` (**hud.js** **378–401**) is a **shared** factory: `selfSpeed` (**1089**, **2243–2244**) and `tgtSpeed` (**1101**, **2524**) both call it. One node is `.rw-match-lamp` with `textContent` **`MATCH`** (`hud.css` **222–229**). PR1 must **not** reuse that node, must **not** change MATCH copy, must **not** pass SLOW into `tgtSpeed.set`, and must **not** grow the 80 px hub. SLOW is a **second** node on **self** SPD only. Hide SLOW with its own `is-hidden` (independent of MATCH).

---

## 0.1 Wave 130 deputize (owner may override after playtest)

Pick the **smaller** of: HUD cue vs J-held speed governor. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key / third helm.

**Freeze: HUD cue.** Not J-held governor in PR1.

Why not J-held: KeyJ is a **one-frame edge** (`ctx.js` **90**; `controls.js` **426**). Hold-to-approach would remap helm and fight CTL-01. In-zone tap already docks at any speed. The playtest bounce is cruise **without** a timely tap, then PHY-01. A hold governor does not close that loop without becoming a third helm.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Dock range | 45 u | `state.js` **30** |
| Snap band | 2 × `DOCK_RANGE` (90 u); zeros vel | `station.js` **6323–6328** |
| J prompt | inZone only; `'Dock'` | `hud.js` **2535–2536** |
| Light cruise | 120 u/s | `state.js` **38** |
| Light creep | 30 u/s | `state.js` **38** |
| Cue threshold (inbox) | **20** u/s | wishlist **175–179**; **not** a `state.js` write |
| Hull contact | 34.4 u | `PHY.STATION_CYL_RADIUS` 32 + `PLAYER_RADIUS` 2.4 |
| Overlay pause | **never** | `overlay-policy.js` **4** |
| Agent `dock` act | **not live** | `agent-api.js` **150** |
| SPD factory | shared `makeSpeed()`; MATCH node only | `hud.js` **378–401** |
| Self SPD | `selfSpeed = makeSpeed(selfRail)` | `hud.js` **1089**, **2243–2244** |
| Target SPD | `tgtSpeed = makeSpeed(tgtRail)`; `set(speed)` only | `hud.js` **1101**, **2524** |
| MATCH CSS | `.rw-match-lamp` | `hud.css` **222–229** |
| HUD-01 hub | 80×80 `.rw-reticle` | `hud.css` **184–193** |

Do **not** “fix” the hole by rewriting bounce, by pad Autopilot, by Agent dock, or by pausing.

### Playable policy (smallest additive)

**Name:** HUD approach-speed **text** when closing on the current-system pad too fast.

| Piece | Freeze |
|---|---|
| **Who** | Player hull vs current-system `ctx.station`. Not NPC. Not Agent. |
| **PR1 channel** | existing context prompt **copy** + a **new** self-SPD text lamp. Not toast. Not hub pip. Not Hail02. Not MATCH reuse. Not target SPD. |
| **In-zone prompt** | Keep `J` + `Dock`. If `ship.speed > 20` and finite, set verb to authored `Dock · SLOW — approach under 20 u/s`. |
| **Approach lamp** | Distinct span `.rw-slow-lamp` (or equal) on **self** SPD only (`.rw-combat-self .rw-speed`). `textContent` **`SLOW`**. Never rewrite `.rw-match-lamp` (stays `MATCH`). Do **not** add SLOW inside shared `makeSpeed()` unless the extra node is **opt-in and used only by self**. Do **not** pass SLOW into `tgtSpeed.set`. Show when: not docked; not jumping; not `berthHeld`; finite dist; `dist <= 3 × U.DOCK_RANGE` (135 u, **local** multiple; no `state.js`); `ship.speed > 20`. Hide if jump prompt owns the verb (`gate.inZone && !station.inZone`). Hide with **own** `is-hidden`; MATCH hide stays independent. Do **not** grow the 80 px hub. Rail overflow: tighten lamp letter-spacing, not the reticle. |
| **Why 3×** | In-zone-only cue lasts ~0.088 s at cruise (inventory §10). 3× gives brake time without a new WORLD field. |
| **20 vs creep 30** | Cue **warns**. Player uses double-tap F (`fullStop`) to go under 20. Do **not** retune creep. Copy may stay inbox `20`. |
| **Jump** | Do not steal Jump / hub G copy. |
| **HOME** | Do not move HUD-06. |
| **Snap / dock math** | Unchanged in PR1. |
| **Governor** | **Not PR1.** Optional PR2 after playtest: on **existing** KeyJ **tap**, if inZone and speed > 20, clamp speed then dock (still one tap; still no hold; still no teleport past 2×). Must **not** rewrite PHY-01. Owner may skip. |
| **Persist** | **none** new. |
| **Fail-closed** | never throw; never pause; never innerHTML; never unseen pad. |

### Later copy (authored `textContent` literals)

| Surface | Literal |
|---|---|
| In-zone, speed ≤ 20 or non-finite speed | `Dock` (live) |
| In-zone, speed > 20 | `Dock · SLOW — approach under 20 u/s` |
| Self SPD SLOW lamp | `SLOW` (hide when rule false; own node) |
| MATCH lamp | `MATCH` (unchanged; Wave D) |
| Target SPD | speed number only; **no** SLOW |
| Key | still `J` when inZone |

Em dash ` — ` as inbox. Do **not** interpolate station ids into HTML. `textContent` only. Do **not** say the player is invincible. Do **not** say Pause.

Do **not** dual-stack a Hail02 miss toast as the SLOW cue.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/hud.js` — context prompt verb when `station.inZone`; **self** SPD `.rw-slow-lamp` write-on-change. Do **not** steal MATCH `set(spd, matching)`. Do **not** change `tgtSpeed.set(targetSpeedNow)`.
- `src/ui/hud.css` — `.rw-slow-lamp` (or equal) visibility; **not** color-only; **not** hub; **not** a rewrite of `.rw-match-lamp`.

**Do not claim:**

- `src/systems/controls.js` (CTL-01 remap / KeyJ hold)
- `src/systems/station.js` snap / `dock()` (PR1). Optional PR2 governor may **read** speed and clamp **after** existing snap, still in `station.js` or `ship.js` — **only if** owner keeps PR2.
- `src/game/collision.js` / `src/game/physics.js` / `src/systems/ship.js` bounce block
- `src/systems/hail.js` (Hail02)
- `src/systems/agent-api.js`
- `src/systems/overlay-policy.js`
- `src/game/autopilot.js` / `src/systems/gate.js` / `src/systems/galaxychart.js`
- `src/game/state.js`
- HUD-06 pip / POS HOME / chevron inset
- HUD-07 layout (prompt **copy** only)
- TGT-07 / MSN-04

---

## 2. Partial merge forbidden

PR1 must land **together**: in-zone SLOW verb **and** approach-band **self** SPD `.rw-slow-lamp` **and** `textContent` **and** fail-closed hides. Shipping only the in-zone verb leaves the 0.088 s hole. Shipping only a color class without text fails a11y. Shipping SLOW by swapping MATCH text, or by stuffing SLOW into shared `makeSpeed()` / `tgtSpeed`, **fails** this pack.

Optional PR2 governor must **not** ship without PR1 text (color/force without naming SLOW).

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** approach cue | in-zone prompt addendum; **self-only** `.rw-slow-lamp` at 3× `DOCK_RANGE`; MATCH copy unchanged; no `tgtSpeed` SLOW; `textContent`; write-on-change; fail-closed | KeyJ hold; PHY rewrite; pad AP; Agent dock; Hail02 keys; HUD-06; MATCH reuse; hub grow; persist; Digit; `innerHTML`; `state.js`; teleport past 2× |
| **PR2 stills (optional)** | playtest stills of cruise approach + SLOW text + hub empty | required with PR1 |
| **PR2 governor (optional, skippable)** | KeyJ **tap** in-zone speed clamp then dock | hold-to-approach; bounce off; snap > 2× |
| **PR3 census (optional skip)** | re-grep `SLOW — approach under 20` live | new world field |

First remaining serial is **PR1**.
