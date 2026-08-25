# Security Review: CTL-01 remaining dock/jump bind (Wave 116)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze remaps `pendingDock` from `KeyD` to **KeyJ**, keeps `ctx.input.dockPressed`, and leaves AP `wantJump` independent. No new persist key, no Digit, no `innerHTML`, no bind-settings store. Title capture already swallows KeyJ. Enter is explicitly not deputized (title CONTINUE / death recover). Later PR1 must skip dock pulse while typing or while title/models are open so a focused overlay cannot jump the ship. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: CTL-01 dock/jump leftover (Wave 116)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is an authored `e.code === 'KeyJ'` literal onto an existing one-frame boolean. Hostile saves cannot remap keys (no persist schema). Overlay typing is the load-bearing later skip.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could pulse `pendingDock` while a text field is focused

- **Severity**: medium
- **Category**: Input validation / unexpected privileged action
- **Location:** `modelsbrowser.js` 705–719 (filter INPUT: letters return **without** `stopImmediatePropagation`); `controls.js` 259–276 (no typing guard); `main.js` 170–174 (pause **does** skip typing); contract `out/w116/ctl01/shared-contract.md` §0.12, §0.1 skip.
- **Description:** Live KeyD already sets `pendingDock` if the models filter is focused. KeyJ would do the same unless PR1 copies the pause typing guard. A player typing “jump” could dock/jump if a zone is behind the overlay.
- **Impact:** Unintended dock or `jumpRequested` while the player believes they are filtering a list.
- **Reproduction:** Open models (from title MODELS). Focus filter. Park the sim in a gate zone (title pauses, but if models is opened from a future unpaused path, or if bubble fires after close). Type J.
- **Remediation:** Frozen: skip `pendingDock` when INPUT/TEXTAREA/SELECT/contentEditable is focused, when `#rw-title` exists, or when `ctx.models.isOpen()`. Authored code check; never throw.
- **Status:** mitigated in contract; not live. Must land **with** the remap.

#### 🟡 MEDIUM: Deputizing Enter would hijack title CONTINUE and death recover

- **Severity**: medium (prevented by deputize)
- **Category**: Key hijack / overlay
- **Location:** `title.js` 217–222 Enter = first visible entry; `save.js` 1341 Enter/Space/Digit1 recover; contract §0.1.
- **Description:** Capture-phase title uses Enter to activate CONTINUE (or NEW GAME if no save). Death overlay also binds Enter.
- **Impact:** Title dismiss / world reload / death recover instead of (or in addition to) dock.
- **Reproduction:** Deputize Enter; press Enter on title.
- **Remediation:** Frozen **KeyJ**. Enter is a non-pick.
- **Status:** mitigated in contract.

#### 🟢 LOW: Settings / chart / berth / hail do not swallow KeyJ

- **Severity**: low
- **Category**: Overlay policy collision
- **Location:** `settings.js` 228–234 KeyO/Escape only; `galaxychart.js` 667–677 KeyM/Escape; `save.js` 1486–1495 KeyL/Escape; `hail.js` 407–415 Digit only; P1 inbox overlay stacking; contract §0.18.
- **Description:** Live D already docks if a zone is valid behind an open settings/chart/berth/hail overlay (except title capture). KeyJ inherits that residual. Solving stacking is a **different** inbox item.
- **Impact:** Unexpected jump while settings is open, if the ship is in a gate zone (sim may still be running; settings does not always pause).
- **Reproduction:** Open KeyO in a gate zone; press D today.
- **Remediation:** Call out only. Do not invent a persist overlay flag this leftover. PR1 may skip if a **live** open flag is obvious; must not block this leftover on P1 policy.
- **Status:** accepted residual; documented.

#### 🟢 LOW: Later impl could `innerHTML` help/prompt from a key name

- **Severity**: low
- **Category**: Injection / XSS
- **Location:** live `el()` `textContent` (`hud.js` 261–266 census-era helper; prompt 2184–2185); contract §0.4.
- **Description:** A later PR that did `controlsList.innerHTML = '<li>' + line` would be XSS if lines ever became save-driven. Live lines are authored literals.
- **Impact:** Overlay script only if copy becomes untrusted.
- **Remediation:** Frozen: `textContent` / `el()`. Authored strings.
- **Status:** mitigated in contract.

#### 🟢 LOW: Persist bind-remap schema

- **Severity**: low
- **Category**: Persistence / unexpected control surface
- **Location:** contract §0.6; `settings.js` `rimward-settings-v1`.
- **Description:** A later “rebind dock in settings” would add a storage key and let a tampered JSON steal Digit/T/V.
- **Remediation:** No settings schema this serial. Authored `KeyJ` only.
- **Status:** mitigated in contract.

#### 🟢 LOW: AP writing `dockPressed` would forge a human edge

- **Severity**: low
- **Category**: Control-plane mix
- **Location:** `ctx.js` 15 input writer = controls only; `gate.js` 643–650; contract §0.9, §0.20.
- **Description:** If AP set `dockPressed`, station could dock on an AP hop, and collision skip (`ship.js` 906) would fire without a human tap.
- **Remediation:** Frozen: AP uses `wantJump` only. CTL-01 serial must not edit `autopilot.js`.
- **Status:** mitigated in contract.

### Positive Observations

- Title capture swallows KeyJ already (`title.js` 225–227).
- Origins ignore non-Digit (`origins.js` 143–145).
- `dockPressed` is a one-frame pulse; `e.repeat` ignored (`controls.js` 260).
- No secrets, no network, no new `WORLD_FIELDS`.
- Human vs AP jump already split in `gate.js`.
- Deputize avoids Enter, Digit, KeyZ, KeyO, KeyG.

### Passed Checks

- [x] No secrets in this write-set
- [x] No new persist key
- [x] No `innerHTML` freeze
- [x] No Digit theft
- [x] Enter not deputized
- [x] AP cannot write `input` under live law
- [x] Fail-closed skip for title / models / typing named in contract
- [x] Markdown-only this wave

### Recommendations

1. Impl wave: land typing/title/models skip **in the same PR** as KeyJ.
2. Impl wave: update WAVE21 `dispatchKey('KeyD')` and WAVE6 `'D — dock'` **on purpose**.
3. Leave hail/chart/berth stacking to P1 overlay policy.
