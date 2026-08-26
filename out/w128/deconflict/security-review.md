# Security Review: HUD-07 deconfliction (Wave 128 markdown)

### Risk Level: Low (design); no live `src/` change this wave

### Summary

Markdown-only leftover pack. Census proves central-sight yield is not live. The dangerous later mistakes are `innerHTML` of lock/station/landmark names, a third `aria-live` that fights HUD-04, a persist layout key, and projecting hidden AI as a new pip. Contract forbids those. Live `hud.js` has **zero** `innerHTML`. Rail name write currently skips `stripHudText` (`2349`); PR1 must not copy that skip.

Review mode: **Deep Audit** on HUD string sinks + live regions + session flags (trust boundary = authored names, `ctx.targets` lock records, landmark names). Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`.

---

## Security Audit: yield copy / live regions / persist

### Summary

Overall risk if PR1 follows the contract: **low**. Overall risk if PR1 uses `innerHTML`, adds a live region, or persists layout: **high**. Those paths are **forbidden** in merge law (fixed before DONE).

### Finding 1: XSS via lock / station / landmark names

- **Severity**: high (later impl; **resolved** in contract)
- **Category**: Injection (DOM XSS)
- **Location**: `hud.js` **288–293** `el()` `textContent`; **426–435** `stripHudText`; bracket **2265–2271** / **2322**; rail **2345–2349** (skip); later yield paths
- **Description**: Bracket names strip C0. Rail `.rw-combat-name` writes `railName` **without** `stripHudText`. Chartmark labels write `lm.name`. A later `innerHTML` of those strings is XSS. Yield must not introduce `innerHTML` and must strip if it rewrites names.
- **Impact**: Script in `#hud`.
- **Reproduction**: Only if PR1 sets `innerHTML` or copies the rail skip onto new nodes.
- **Remediation**: `textContent` / `el()` only. Always `stripHudText` on names. Contract §0.3.
- **Status**: **resolved** (lock).

### Finding 2: Third live region vs HUD-04

- **Severity**: high (design; **resolved** in contract)
- **Category**: Accessibility / channel steal
- **Location**: toasts `role=status` `aria-live=polite` (`hud.js` **933–934**); banner `aria-live=polite` (**947**); linger 8 s (**70**)
- **Description**: A “yield announced” live region would compete with HUD-04 polite toasts and the arrival banner. HUD-05 already froze no extra flood channel.
- **Impact**: Screen-reader flood; toast steal.
- **Remediation**: No new `aria-live`. Yield is visual hide of duplicate words. Contract §0.9.
- **Status**: **resolved**.

### Finding 3: Persist spoof of HUD layout

- **Severity**: high (design; **resolved** in contract)
- **Location**: `state.js` READ-ONLY; `WORLD_FIELDS` not this pack
- **Description**: A layout persist key would let a crafted save mute HOME / GATE / J or force hub occupancy.
- **Impact**: Hostile save hides nav or occupies HUD-01 glass.
- **Remediation**: No new persist key. Session class toggles only. Contract §0.4.
- **Status**: **resolved**.

### Finding 4: Hidden AI / POI projector

- **Severity**: medium (design; **resolved** in contract)
- **Location**: contacts use live `ctx.ships`; HUD-06 omitted selected POI
- **Description**: “Bright suns / stations / gates” must not become a generic projector over banks. Suns stay 3D + existing toasts. Stations/gates stay HOME / NAV-02 / TGT lock.
- **Impact**: HUD pip of unspawned coords.
- **Remediation**: No new projector. No POI picker. Contract §0.17–0.18.
- **Status**: **resolved**.

### Finding 5: Prototype pollution into yield classes

- **Severity**: low
- **Location**: later class names
- **Description**: `for-in` merge from a blob into class tokens could set `__proto__`.
- **Impact**: Shared-object pollution.
- **Remediation**: Authored classes only (`rw-yield` or reuse `rw-hair-off`). Contract §0.11.
- **Status**: **resolved** (lock).

### Finding 6: Throw from HUD update

- **Severity**: medium (design; **resolved** in contract)
- **Location**: later collision math on NaN project / missing lock
- **Description**: Uncaught throw stops the whole HUD (toasts, rails, prompt).
- **Impact**: Blank instruments mid-flight.
- **Remediation**: Fail-closed skip. Never throw. Contract §0.11.
- **Status**: **resolved**.

### Passed Checks

- [x] No secrets / API keys in this pack or live `hud.js` yield path
- [x] No new localStorage key
- [x] No `innerHTML` in live `hud.js`
- [x] No Agent API observe dump
- [x] Fail-closed hide, never throw (locked)
- [x] No graph / CRM mutate
- [x] Color not only cue (locked)
- [x] No second toast allocator

### Recommendations

1. PR1 must `stripHudText` if it writes `.rw-combat-name` or any yielded label.
2. PR1 must not add `aria-live`.
3. Keep hide-not-delete so pooled nodes cannot be GC-churned into use-after-free of HUD refs.
