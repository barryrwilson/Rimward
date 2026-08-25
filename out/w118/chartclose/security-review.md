# Security Review: NAV-06 remaining close-chart-on-AP (Wave 118)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze closes the Galaxy Chart on **successful** Autopilot engage via existing `setOpen(false)`, then blurs chart focus (prefer visible `#hud .rw-autopilot-cancel`). No new persist key, no Digit, no `innerHTML`, no pause-the-sim, no jump emit from the chart. Title capture stays `systems[0]`. Later PR1 must not add a capture or KeyM listener, must not freeze `flags.paused`, and must keep `showApLive` on `textContent`. Authored HUD selector only. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: NAV-06 close-chart-on-AP leftover (Wave 118)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is the existing session `flags.chartOpen` plus overlay flush-on-real-close. Hostile saves cannot persist a stuck chart (no WORLD_FIELDS). Freeze-the-sim is explicitly forbidden. Jump remains `gate.js` only.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Pausing the sim to “close” the map would drop events and can stick

- **Severity**: medium (prevented by deputize)
- **Category**: Freeze-the-sim / event loss
- **Location:** `main.js` 149–176 pause skips `system.update` then toggles `flags.paused`; contract §0.7; `galaxychart.js` 24–27 already does not pause.
- **Description:** A later “pause while AP flies the route” would freeze combat, drop `hailOpened`, and could leave `paused === true` if a helper throws.
- **Impact:** Lost hail; possible forever pause.
- **Reproduction:** Hypothetical `tryEngage` success → `flags.paused = true`; NPC hail emit flushed unseen.
- **Remediation:** Frozen: chart close **never** writes `paused`. Helper miss → still `setOpen(false)`, never throw, never pause.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Persisting `chartOpen` could restore a stuck full-screen map

- **Severity**: medium (prevented by deputize)
- **Category**: Persistence / denial of service
- **Location:** `save.js` WORLD_FIELDS 76–101; `ctx.js` 208 session `chartOpen`; contract §0.6.
- **Description:** A later “save the chart flag” plus a tampered `chartOpen: true` would load into a covering map with AP steer frozen.
- **Impact:** Player cannot see space until they find KeyM; fireHeld stays off (`controls.js` 476).
- **Reproduction:** Invent WORLD_FIELDS chartOpen; hex-edit save JSON.
- **Remediation:** Frozen **no new persist key**. `chartOpen` stays session.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Jump emit from chart/AP leftover could skip zone/charge

- **Severity**: medium (prevented by deputize)
- **Category**: Simulation integrity / teleport
- **Location:** `gate.js` 678 sole `jumpRequested`; `autopilot.js` 1–3; contract §0.8.
- **Description:** A later “close chart and jump now” that emits `jumpRequested` from `galaxychart.js` bypasses zone and charge.
- **Impact:** Instant hop; WAVE117 `zoneUnchanged` / `jumpOnlyGate` invert.
- **Reproduction:** Hypothetical `setOpen(false); ctx.emit('jumpRequested', { to: dest })` on Autopilot click.
- **Remediation:** Frozen: `gate.js` only. Do not teleport. Do not skip zone/charge. Do not edit `autopilot.js`.
- **Status:** mitigated in contract.

#### 🟢 LOW: Title capture vs new KeyM listener

- **Severity**: low
- **Category**: Overlay / key hijack
- **Location:** `galaxychart.js` 668–678 existing KeyM/Escape; `main.js` `initTitle` first; contract §0.11.
- **Description:** Title capture already swallows most keys. A second capture listener for “must close chart before flight” (explicit-lock alternative) could outrank title or settings.
- **Impact:** Title Enter / Digit broken.
- **Reproduction:** Register a capturing KeyM/Escape on window before title.
- **Remediation:** Frozen: no new listener. Deputize auto-close on the **button** click. Title stays `systems[0]`.
- **Status:** mitigated in contract §0.1 / §0.11.

#### 🟢 LOW: Later impl could `innerHTML` the AP live line

- **Severity**: low
- **Category**: Injection / XSS
- **Location:** live `showApLive` `textContent` `galaxychart.js` 578–582; no `innerHTML` in file; contract §0.4.
- **Description:** A later PR that did `apLive.innerHTML = line` would XSS if a reason string were ever untrusted. Live reasons are frozen `AP_LINES` tokens.
- **Impact:** Overlay script only if copy becomes untrusted.
- **Remediation:** Frozen: do **not** rewrite `showApLive`. `textContent` stays. No `insertAdjacentHTML`.
- **Status:** mitigated in contract.

#### 🟢 LOW: Focus move uses an authored HUD selector only

- **Severity**: low
- **Category**: DOM / unexpected focus steal
- **Location:** contract §0.19; `hud.js` 1037–1041; `galaxychart.js` 421–430 `aria-hidden`.
- **Description:** Later PR1 focuses `#hud .rw-autopilot-cancel` only when the chip is visible. A wild query or focus on hail/settings would steal a play card. Missing `document` must not throw.
- **Impact:** Keyboard user lands on the wrong overlay.
- **Reproduction:** Hypothetical `document.querySelector('button')` after close.
- **Remediation:** Frozen: authored `#hud .rw-autopilot-cancel` only; blur if chip hidden; never throw; do not write `hud.js`.
- **Status:** mitigated in contract §0.19.

#### 🟢 LOW: Overlay hail flush on AP close is a real close, not a privilege skip

- **Severity**: low
- **Category**: Overlay click-through / unexpected card
- **Location:** `takeDeferredHail` `overlay-policy.js` 158; `hail.js` 512–516; contract §0.9; `setOpen` 421–433.
- **Description:** Successful AP close may flush a deferred hail onto flight. That is overlay policy. A fake hide (`display:none` without `chartOpen` false) would leave fireHeld off and steal hail flush.
- **Impact:** Fake hide: guns dead, hail stuck, AP steer frozen.
- **Reproduction:** Hypothetical `root.classList.add('is-hidden')` without `setOpen(false)`.
- **Remediation:** Frozen: **real** `setOpen(false)`. Do not skip flush. Do not write `overlay-policy.js` or `hail.js`.
- **Status:** mitigated in contract.

### Passed Checks

- [x] No secrets in this pack or in cited `galaxychart.js` / `autopilot.js` engage path
- [x] No new persist key / WORLD_FIELDS
- [x] No `innerHTML` in live chart (grep none)
- [x] Title capture not inverted
- [x] Freeze-the-sim forbidden
- [x] `jumpRequested` stays `gate.js`
- [x] No Digit / UU / SKU invent
- [x] `state.js` READ-ONLY later
- [x] Prototype-safe: authored `setOpen` only; no `for-in` save blob

### Recommendations

1. Later PR1: real `setOpen(false)` after empty `tryEngage` token, then blur / prefer visible HUD Cancel. Re-census `galaxychart.js` lines first.
2. Re-grep after merge: no `innerHTML` in `galaxychart.js`; no `jumpRequested` outside `gate.js`; no `flags.paused` write from the chart click.
3. Confirm overlay mutex still **allows close** and still **flushes hail**.

### Persona mapping

No critical/high. Medium items are **prevented by deputize**. Map for implementer: medium → minor (already frozen). Low → nit.

---

## Re-review (Wave 118 re-dispatch)

Re-read live `setOpen(false)` sites (644, 680, 687, 700 — none on engage). Overlay helper **present**. Hail flush is `takeDeferredHail` in `hail.js` update. Designer focus Major frozen in §0.19 (blur / prefer authored HUD Cancel; no throw; no new listener). No new 🔴 CRITICAL or 🟠 HIGH. Did not edit `out/w118/toast/**`, `out/w118/overlay/**`, or `src/`.
