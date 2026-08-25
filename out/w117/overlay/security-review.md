# Security Review: CTL-02 remaining overlay-priority (Wave 117)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze mutexes hail / chart / berth, defers incoming hail, and gates reopen on session `ai.calmUntil`. No new persist key, no Digit, no `innerHTML`, no pause-the-sim. Title capture stays `systems[0]`. Later PR1 must skip hail Digit resolve while title/settings/models own the screen so a covered card cannot spend credits or jettison cargo. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: CTL-02 overlay-priority leftover (Wave 117)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is authored overlay ids plus existing session `ai.calmUntil`. Hostile saves cannot persist a forever-mute hail (no WORLD_FIELDS). Freeze-the-sim is explicitly forbidden. Overlay click-through and hidden Digit actions are the load-bearing later skips.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Live hail Digit shortcuts fire while another overlay covers the card

- **Severity**: medium
- **Category**: Unexpected privileged action / overlay click-through
- **Location:** `hail.js` 407–415 (Digit1–9 resolve while `open`); `save.js` 1352 berth z 60 > hail 40; `settings.js` 93 z 80; contract §2 settings row, §0.1 Digit skip.
- **Description:** Berth and settings paint **over** hail but do not clear `open`. Number keys still run `resolveIntent` (tribute, cargo dump, flee). Root hail is `pointer-events:none` except the card (`hail.js` 108–118) so clicks on berth are safe; **keys are not**.
- **Impact:** Player believes they type a berth/settings action or switch weapons; they instead pay UU or let a pirate go.
- **Reproduction:** Open a bargaining hail. Open KeyL berth. Press Digit1.
- **Remediation:** Frozen: mutex (berth cannot open over hail, hail cannot open under berth) **and** Digit resolve only when hail is the exclusive top play card and title/settings/models are not open. Authored checks; never throw.
- **Status:** mitigated in contract; not live. Must land **with** mutex.

#### 🟡 MEDIUM: Persisting calm or overlay flags could freeze hail across loads

- **Severity**: medium (prevented by deputize)
- **Category**: Persistence / denial of service
- **Location:** `save.js` WORLD_FIELDS 76–101; `npc.js` 249 `calmUntil` instance; contract §0.6.
- **Description:** A later “save the calm clock on the record” plus a tampered `calmUntil: Infinity` would mute bargaining forever. Overlay flags on WORLD_FIELDS could restore a stuck berth/chart.
- **Impact:** Hail economy gone; or a load that never shows play cards without a pause escape.
- **Reproduction:** Invent `WORLD_FIELDS` hailCalm; hex-edit save JSON.
- **Remediation:** Frozen **no new persist key**. Calm stays session `ai.calmUntil`. Flags stay session like `chartOpen`.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Pausing the sim under chart/berth would drop `hailOpened` and can stick

- **Severity**: medium (prevented by deputize)
- **Category**: Freeze-the-sim / event loss
- **Location:** `main.js` 149–156 pause skips `system.update` then **clears** `ctx.events`; contract §0.7.
- **Description:** If overlay policy set `flags.paused` while the chart is open, NPC hail emits (if any system still ran) or queued events flush unseen. A helper throw that left `paused === true` freezes the sim until KeyP.
- **Impact:** Lost hail; possible forever pause if KeyP is also skipped.
- **Reproduction:** Hypothetical `setOpen(true) → flags.paused = true`; emit hail; unpause never runs hail.js.
- **Remediation:** Frozen: hail/chart/berth **never** write `paused`. Helper miss → skip mutex, never throw, never pause.
- **Status:** mitigated in contract.

#### 🟢 LOW: Title capture vs play overlays

- **Severity**: low
- **Category**: Overlay / key hijack
- **Location:** `title.js` 190–227; `main.js` 105 `initTitle` first; Wave 40 notes.
- **Description:** Title capture already swallows KeyM/L/H (all but KeyO/Escape). Enter is CONTINUE, not overlay. Later mutex must not register a capture listener that outranks title or settings.
- **Impact:** Title digits / Enter broken if a new capture helper registers first.
- **Reproduction:** Init overlay-policy before `initTitle`; swallow Digit1.
- **Remediation:** Helper is not a capture listener. Title stays `systems[0]`. Hail Digit stays bubble, gated by open-state.
- **Status:** mitigated in contract §0.11.

#### 🟢 LOW: Later impl could `innerHTML` hail / berth strings

- **Severity**: low
- **Category**: Injection / XSS
- **Location:** live `header.textContent` `hail.js` 348; berth `meta.textContent` `save.js` 1476–1480; contract §0.4.
- **Description:** A later PR that did `card.innerHTML = ev.line` would XSS if a comm line or snapshot system name were hostile. Live lines are `textContent`. Portrait `img.src` comes from `portraitFor`, not the save blob.
- **Impact:** Overlay script only if copy becomes untrusted.
- **Remediation:** Frozen: `textContent` / `el()`. Authored overlay ids. No `for-in` save blob into policy.
- **Status:** mitigated in contract.

#### 🟢 LOW: Chart full-screen click-through vs canvas fire

- **Severity**: low
- **Category**: Pointer click-through
- **Location:** `.rw-galaxy-chart` `hud.css` 1899–1912 (no `pointer-events: none`); hail root `pointer-events: none` 108; berth root none 1352; `controls.js` 465 `fireHeld` off while `chartOpen`.
- **Description:** Chart already eats clicks (header comment is stale). Hail/berth roots do not eat clicks outside the card/panel — LMB can still fire if `chartOpen` is false. Mutex does not worsen canvas fire. Do not set hail root to `pointer-events:auto` full-screen (would block HUD).
- **Impact:** Accidental fire around hail card (live, accepted). Accidental fire through berth **scrim** (root is none; only panel auto).
- **Remediation:** Keep hail/berth root `pointer-events: none` except panel. Chart stays a real dialog for clicks. FireHeld already suppressed for chart.
- **Status:** accepted residual; do not invert pointer-events.

#### 🟢 LOW: Demand hail / Callow emit bypass NPC calm

- **Severity**: low
- **Category**: Logic bypass
- **Location:** `npc.js` 1869–1886; `world.js` 1245; `hail.js` 421.
- **Description:** Even if `updateResolve` honors `calmUntil`, `openCard` is the real gate. PR1 puts the gate in `hail.js` so Callow and demand cannot reopen during calm.
- **Remediation:** Fail-closed in `openCard` / KeyH, not only in npc.js.
- **Status:** frozen in contract formulas.

### Passed Checks

- [x] No secrets in this pack
- [x] No new `localStorage` / WORLD_FIELDS key
- [x] No `innerHTML` deputized
- [x] Title capture not inverted
- [x] Freeze-the-sim forbidden
- [x] Proto-safe helper (authored ids)
- [x] No Digit 0/8/9 steal
- [x] No KeyJ steal
- [x] Calm not persist (cannot forever-mute from save JSON)

### Recommendations

1. Impl wave: hail Digit + `openCard` skip while settings/title/models open — land **with** mutex.
2. Impl wave: helper never writes `flags.paused`.
3. Keep salvage + live `letGo` calm as session clocks only.
