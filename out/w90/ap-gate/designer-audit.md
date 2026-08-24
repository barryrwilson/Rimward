## UI Audit: NAV-02 live jump-zone origin (cyan ring + HUD GATE + AP aim)

**Auditor:** `[designer]` (independent of `out/w90/ap-gate/ui-audit.md`)
**Scope:** Live-only `resolveNavGatePos`; hide cyan in-world ring, GATE distance, and off-screen cue when live pos is null; rebuild live assemblies if `currentSystem` drifted (title pause can drop `systemLoaded`). Files: `src/systems/nav-guidance.js`, `src/systems/gate.js`, consume sites in `src/systems/hud.js` and `src/game/autopilot.js`. CSS / HUD-01 layout not in this delta.
**Method:** Static checklist (`orchestrator/references/ui-audit.md`). Worker self-audit was read, not copied. No `src/` or `src/ui/` edits. No Vite. No Chrome.
**Status of this pass:** review only. HUD-01 is closed — no new chrome demanded.

### Summary

Ring, GATE figure, off-screen cue, and autopilot aim now share one live assembly origin. When that origin is missing, the find-aids hide together instead of painting a ghost at authored hub coords. Identities stay split: cyan torus + two-tick cue vs amber lock triangle vs bottom scanner arc. Hub hops aim the live Lamplighter junction mesh. Verdict **CLEAN**.

### What's done well

- **No ghost in empty sky.** `readNavGuidance` stores `pos: resolveNavGatePos(ctx, nextId)` (`src/systems/nav-guidance.js:139–147`). `resolveNavGatePos` is live-only (`nav-guidance.js:88–97`); comment at `nav-guidance.js:8–11` drops the authored fallback. Marker `update` returns and sets `group.visible = false` when `!showMark || !info || !info.pos` (`nav-guidance.js:184–188`). HUD `navMark` requires plotted + pos (`hud.js:1569–1577`). GATE row uses `distOn = plotted && navHavePos` and toggles `is-hidden` (`hud.js:1848–1861`). Cue hide is the first branch when `!navMark` (`hud.js:1579–1583`). Player cannot get GATE `618u` at an authored hub with no mesh.
- **Same-frame rebuild before HUD.** `initGate` sits above `initHud` (`src/main.js:111`, `135`). `gate.update` rebuilds when `ctx.world.currentSystem !== _builtSystem`, even if `systemLoaded` was dropped (`gate.js:582–595`, `491–552`). Lookup then matches `_builtSystem` (`gate.js:454–457`). Title pause freezes the loop (`main.js:149–151`); the first unpaused frame rebuilds, then HUD reads the new origin. Fail-closed: unknown `currentSystem` leaves `_liveReady` false (`gate.js:519–527`), so lookup returns null and chrome stays hidden.
- **Physical gate vs hub hop.** One walk: physical `a.to === to` wins; else hub origin if `hubListsHop` (`gate.js:454–471`). Hub assembly is named `lamplighter-junction` and gets lantern extras (`gate.js:538–548`, `224–227`; `src/systems/gate-detail.js:192–238` — hex frame, brass/amber lamps). Cyan ring sits on that group origin (`nav-guidance.js:190–199`; `gate.js:434–442`), so AP and the player fly to the live junction, not empty space. HUD still says GATE (HUD-01 closed). World mesh carries hub identity.
- **Three identities stay distinct.** Nav world mark: additive cyan torus `0x6ff2e0`, names `nav-gate-marker` / `nav-gate-ring`, empty raycast (`nav-guidance.js:154–176`). Off-screen nav cue: `.rw-nav-gate-cue`, two ticks + notch, `var(--rw-accent)`, `aria-hidden="true"`, `pointer-events: none` (`hud.js:727–731`; `src/ui/hud.css:999–1035`). Combat lock off-screen: amber CSS triangle `.rw-edge-arrow` (`hud.css:573–592`). Scanner: bottom bearing arc `.rw-contacts`, not a reticle ring (`hud.js:1355–1362`; `hud.css:784–807`). Lead is a cyan circle `.rw-lead-ring` (`hud.css:518–536`). Chart marks are diamonds. Shape + slot, not color alone.
- **Copy stays `textContent`.** Nav NEXT/DEST/JUMPS/status/GATE (`hud.js:1884–1889`). Jump HUD label (`hud.js:1162`). Jump overlay label (`gate.js:676–679`). Toasts (`hud.js:1095`). No `innerHTML` in `nav-guidance.js`, `gate.js`, `hud.js`, or `autopilot.js`. Names go through `navSystemName` / `stripNavText` (`nav-guidance.js:33–47`). Live-region contract unchanged: outer `aria-live="off"`; polite status on `.rw-nav-readout-live` only; GATE is a sibling (`hud.js:907–925`). Cue stays `aria-hidden`.
- **Empty / missing hop is spoken, not invented.** AP refuse/cancel lines: `Autopilot refused — next gate is missing.` / `Autopilot cancelled — next gate is missing.` (`src/game/autopilot.js:27–30`, `177`, `230–231`). Engage refuses when `resolveNavGatePos` is null. No new occupancy.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: (none new)

Prior occupancy nits (cue vs lock sharing a corner; side-col height at `textScale` 1.5) are unchanged by this origin share. Do not treat them as this pass. HUD-01 stays closed.

#### 💡 Suggestion: GATE field hidden while NEXT still named

**Severity:** Suggestion
**Location:** `src/systems/hud.js:1559–1570`, `1846–1861`, `1884–1889`
**Issue:** A plotted bag with no live assembly still shows NEXT / DEST / JUMPS. GATE row, cyan ring, and chevron hide. The readout is not a lie (no fake distance), but it does not name the missing hardware. AP already speaks `Autopilot refused — next gate is missing.` (`autopilot.js:27`, `177`).
**Fix:** Leave it. A MISSING status would reopen HUD-01 occupancy. After drift rebuild, live pos returns on the same unpaused frame.
**Status:** accepted — out of scope

#### 💡 Suggestion: World ring still ignores colorblind tokens

**Severity:** Suggestion
**Location:** `src/systems/nav-guidance.js:154–165`; remap at `src/ui/hud.css` colorblind `--rw-accent`
**Issue:** Cue and readout use `var(--rw-accent)` and remap under `body.rw-colorblind`. The torus stays `0x6ff2e0`. Shape still names the routed gate. Color is not the only signal.
**Fix:** Optional tint of the shared material when colorblind is on. Not required for this pass.
**Status:** open (pre-existing; not a Blocker/Major)

### Occupancy (this delta)

| Surface | Touched? |
|---|---|
| New HUD nodes / CSS | No |
| Aim glass | Cue still off-screen only; hidden when no live pos (`hud.js:1579–1594`) |
| Lock chrome | Distinct class; unchanged |
| Scanner arc | Unchanged; still bottom slot |
| Jump overlay / banner / toasts | Overlay still `textContent` (`gate.js:676–679`) |
| Autopilot chip | Unchanged pin; aim uses live origin |

Hide docked / jumping: yes (`hud.js:1553–1569`).
`reducedMotion` static ring: yes (`nav-guidance.js:193–198`).
GATE outside live child: yes (`hud.js:907–925`).
HUD-01: closed. Do not add HUB vs GATE wording.

### Focus checklist

| Question | Result |
|---|---|
| Empty live pos: GATE / readout / cue honest, no ghost ring? | Yes. Ring, GATE, cue hide; NEXT names the hop only. |
| Nav cyan vs combat lock vs scanner arc distinct? | Yes. Torus + two-tick cue vs amber triangle vs bottom arc. |
| Hub hop vs physical gate: flying to Lamplighter junction? | Yes. Live hub origin + lantern extras; physical `to` wins when present. |
| Off-screen cue hidden when no live pos? | Yes (`hud.js:1579–1583`). |
| Remaining HUD copy `textContent`, not `innerHTML`? | Yes. |
| New chrome demanded? | No. |

### Verdict

**CLEAN.** 0 🔴 Blocker. 0 🟠 Major. Live-only origin removes the Auction → Cradle empty-sky ghost. Drift rebuild plus hide-on-null keeps GATE, cue, and ring honest. HUD-01 chrome is untouched.

Static audit only. Browser overlap pins stay with the verifier.
