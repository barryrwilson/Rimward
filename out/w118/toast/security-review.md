# Security Review: HUD-04 leftover toast-flood (Wave 118)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze an 8 s identical-toast window, a **five-row key linger ring** (not chip-tied), expire `aria-hidden`, and distinct autosave vs berth `saveBlocked` copy. No new persist key, no Digit, no `innerHTML`, no pause-the-sim, no toast z raise. Later PR1 must keep `textContent`, authored `source` tokens, and bounded linger so a hostile save cannot mute warns forever. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: HUD-04 toast-flood leftover (Wave 118)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is authored event copy (`e.text`, `e.reason`, `e.source`) painted with `textContent` onto five existing nodes. Hostile saves cannot persist a forever-mute toast (no WORLD_FIELDS). Freeze-the-sim is explicitly forbidden. XSS and overlay click-through are the load-bearing later skips.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: `innerHTML` of `commLine` / `saveBlocked.reason` would XSS

- **Severity**: medium (prevented by deputize)
- **Category**: Injection / XSS
- **Location:** live `pushToast` `hud.js` 1169 `textContent`; `el()` 285 `textContent`; contract §0.4.
- **Description:** `commLine.text` and `saveBlocked.reason` are game strings (often authored, sometimes ship names). A later PR that did `slot.el.innerHTML = text` would execute markup from a hostile name or a crafted reason.
- **Impact:** Overlay script in `#hud` (z 10). Session cookie-less game, still a stored-DOM hit if a save blob ever reached copy.
- **Reproduction:** Hypothetical `innerHTML = e.reason` with `reason` containing `<img onerror=…>`.
- **Remediation:** Frozen: `textContent` only. Authored autosave copy. Unknown source never HTML.
- **Status:** mitigated in contract; not live. Must land **with** the window.

#### 🟡 MEDIUM: Persisting toast linger could mute warns across loads

- **Severity**: medium (prevented by deputize)
- **Category**: Persistence / denial of service
- **Location:** `save.js` WORLD_FIELDS 77–102; contract §0.6.
- **Description:** A later “save last toast keys” plus a tampered infinite window would suppress `saveBlocked` / Incoming / hull lines after load.
- **Impact:** Player misses combat and save-failure feedback.
- **Reproduction:** Invent `WORLD_FIELDS` toastMem; hex-edit save JSON.
- **Remediation:** Frozen **no new persist key**. Linger stays a session five-row `{ key, lastShown }` ring in hud.js. Dies on reload.
- **Status:** mitigated in contract.

#### 🟡 MEDIUM: Raising `.rw-toasts` z over hail/berth steals overlay input context

- **Severity**: medium (prevented by deputize)
- **Category**: Overlay click-through / privileged Digit
- **Location:** `#hud` z 10 `style.css` 24–29; hail 40; berth 60; contract §0.8.
- **Description:** Inbox flood is **slots**, not z. Raising toasts over the hail card could cover Digit labels or steal the glance path. Overlay sibling owns mutex; toast PR1 must not “fix” covered chips by z-fight.
- **Impact:** Hidden hail verbs; mis-clicks.
- **Reproduction:** Hypothetical `.rw-toasts { z-index: 70 }`.
- **Remediation:** Frozen: **no** toast z change. Play cards stay above `#hud`.
- **Status:** mitigated in contract.

#### 🟢 LOW: Unbounded key Map on unique `commLine` spam

- **Severity**: low
- **Category**: Resource exhaustion
- **Location:** contract §0.7 linger = five **key** rows, not a Map.
- **Description:** A Map keyed by every unique line for 8 s could grow if emitters spam unique strings (credits, names).
- **Impact:** Memory only; client game.
- **Remediation:** Frozen: five linger rows. Overwrite oldest. Never unbounded Map. Never persist.
- **Status:** mitigated in contract.

#### 🟢 LOW: Privileged snapshot / storage-key copy in a toast

- **Severity**: low
- **Category**: Data exposure
- **Location:** `save.js` KEY `'rimward-save-v1'` 67; snapshot 974.
- **Description:** A later “debug toast the save key / JSON error” would leak storage identity. Live storage fail is **silent** (1045–1046, 1525–1526) — keep silent.
- **Remediation:** Frozen authored copy only. Do not toast KEY, blob, or stack traces.
- **Status:** mitigated.

#### 🟢 LOW: `source` token from untrusted emit

- **Severity**: low
- **Category**: Logic / copy injection
- **Location:** later `e.source`; contract §0.7.
- **Description:** Only `autosave` selects AUTOSAVE HELD. Any other value uses SAVE BLOCKED + `textContent(reason)`. Do not interpolate `source` into HTML or class names beyond existing cls tokens.
- **Remediation:** Authored tokens; `cls` stays `warn` for both.
- **Status:** frozen in formulas.

#### 🟢 LOW: Pause-the-sim to quiet toasts

- **Severity**: low (prevented)
- **Category**: Freeze-the-sim / event loss
- **Location:** `main.js` pause skips `system.update` and flushes events (Wave 117 overlay inventory).
- **Description:** Pausing to “stop flood” drops `hailOpened` and can stick.
- **Remediation:** Frozen: toasts never write `flags.paused`.
- **Status:** mitigated in contract §0.7.

### Passed Checks

- [x] No secrets in this pack
- [x] No new `localStorage` / WORLD_FIELDS key
- [x] No `innerHTML` deputized
- [x] Title capture not inverted
- [x] Freeze-the-sim forbidden
- [x] Proto-safe source tokens
- [x] No Digit 0/8/9 steal
- [x] No KeyJ steal
- [x] Toast mem not persist (cannot forever-mute from save JSON)
- [x] No toast z raise (overlay Digit/click stay)

### Recommendations

1. Impl wave: `textContent` only; never rewrite identical text on refresh.
2. Impl wave: `source` allowlist `autosave` | `berth`.
3. Impl wave: five-row **key** linger ring (not chip-tied); no Map.
5. Impl wave: expire `aria-hidden="true"`; real show unhide then `textContent`. Do not clear text on expire.
4. Keep storage-fail silent.
