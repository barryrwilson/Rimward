# Designer audit: Wave 99 NPC turret first impl (HUD freeze)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | `src/game/npc-fire-toast.js`; `src/systems/hud.js` toast bind / empty hub / WPN / FORE/AFT; `docs/NpcTurretsDesign.md`; `out/w98/turrets/shared-contract.md` HUD freeze; worker `out/w99/turrets/ui-audit.md` |
| **Not in scope** | Product `src/` edits, Vite, Digit paper copy rewrites, sibling TGT-03 / radar trees, wishlist, `PROGRESS.md` |
| **Wave** | 99 — first NPC turret emit. Closed glass. Toast reuse only. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Wave 99 user law (this pass): no incoming turret gauge, lock box, hub pip, new `#hud` child, or sixth WPN Digit. Empty 80 px hub stays empty. No turret-specific toast string. Turret vsPlayer **may** reuse `Incoming fire.` on the same clock as cannon. Do not steal `Incoming dart.` Digit 0/8/9 player papers stay.

Wave 98 merge law still wins on glass freeze (`out/w98/turrets/shared-contract.md`). §13 already said TGT-03 `Incoming fire.` applies automatically if a later turret emit is vsPlayer cannon-family energy. Wave 99 reuse is that rule, not a new glance.

---

## UI Audit: NPC turret toast reuse (closed glass)

### Summary

Wave 99 does not grow the HUD tree. Turret vsPlayer reuses authored `Incoming fire.` through the live toast channel (`npcFireToast` → `toastForEvent` → `pushToast` `textContent`). The 80 px hub stays empty. WPN stays groups 1–5. FORE/AFT stays `playerHit` only. `Incoming dart.` stays missile-only.

### Law checklist

| Check | Result | Evidence |
|---|---|---|
| No incoming turret gauge / lock box / aim-glass pip | **Pass** | No new glance node in `initHud`. Reticle is still 80×80 `hud.css:184–190`. No turret class on `.rw-reticle`. Grep `Incoming turret` / `rw-turret` / `6 ·` in `*.js`/`*.css`/`*.html`: 0. |
| Empty 80 px hub stays empty | **Pass** | Clamp comment + math `hud.js:1196–1197`. Size `hud.css:184–190`. Contacts stay bottom arc, not hub. |
| No new `#hud` child | **Pass** | Toast slots still 5, created once `hud.js:61–63`, `764–772`. Import is helper only `hud.js:14`. No sixth WPN Digit node. |
| WPN row groups 1–5 only; no sixth Digit | **Pass** | `WEAPON_KEYS` groups 1–3; 4 launcher; 5 psionic `hud.js:199–211`, `214–232`. Write is `weaponName.textContent` `hud.js:842–844`, `1824–1825`. |
| FORE/AFT hit-only | **Pass** | `makeFacing` words + lit/dim/flash `hud.js:326–353`. Flash set only on `playerHit` `hud.js:1133–1136`, applied `hud.js:1359–1378`. `npcFire` does not set facing. |
| No turret-specific toast string | **Pass** | Helper returns only `Incoming dart.` or `Incoming fire.` `npc-fire-toast.js:8–9`, `47–51`, `56–64`. HUD whitelist drops anything else `hud.js:570–575`. |
| Turret vsPlayer may reuse `Incoming fire.` (same clock as cannon) | **Pass** | Turret requires `target === 'player'` then shares `lastIncomingFireAt` / `FIRE_TOAST_GAP` 2.5 s `npc-fire-toast.js:10–11`, `54–64`. Probe pin `toast.sharedFireClock` in `out/w99/turrets/probe.mjs`. |
| Do not steal `Incoming dart.` | **Pass** | Missile branch exclusive `npc-fire-toast.js:47–51`. HUD dart literal still `'Incoming dart.'` `hud.js:64`. Unknown/`turret` never writes dart. |
| Digit 0 / 8 / 9 player papers stay | **Pass** | Digit 0 shipyard list `station.js:186`. Digit 8/9 outfitting papers `station.js:1622–1623`, `1683–1689`, `1699–1706`, `5424–5448`. NPC emit does not write hangar `npc.js:1131`. |
| `textContent` / `el()`; no `innerHTML` | **Pass** | `pushToast` `slot.el.textContent` `hud.js:1114`. `el()` uses `textContent` `hud.js:242–246`. `innerHTML` in `hud.js`: 0. Helper is DOM-free `npc-fire-toast.js:1–2`. |
| Color is never the only cue | **Pass** | FORE/AFT: FORE/AFT words + fill vs hollow + flash `hud.js:326–353`. Toast: authored sentence + `warn` class `hud.js:574`; default toast color `var(--white)` plus amber edge `hud.css:717–736`. |

### What's done well

- Helper stays pure. HUD still owns DOM (`npc-fire-toast.js:1–6`; bind `hud.js:570–575`).
- HUD fail-closes unknown helper copy. Only the two authored literals reach `pushToast` (`hud.js:573–575`).
- Shared fire clock is honest energy-family warning. Same-frame cannon then turret yields one line, not a second string.
- Dock / jump park suppress fire toast for turret the same as cannon (`npc-fire-toast.js:26–31`, `61`).
- Missing turret `target` does not toast (`npc-fire-toast.js:56–57`). Ace cannon omit is not copied.
- Existing toast region stays `role="status"` `aria-live="polite"` (`hud.js:765–768`). No focus steal. Pointer-inert (`hud.css:635–646`).
- Song still uses cannon bark unless `weapon === 'missile'` (`song.js:423`). Turret does not steal the dart sting.
- Worker self-audit (`out/w99/turrets/ui-audit.md`) matches live occupancy. This pass agrees: no Blocker / Major.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🔴 Blocker: None

#### 🟠 Major: None

#### 🟡 Minor: Brief mermaid still says “no Incoming turret toast” as if zero fire toast

**Severity:** Minor  
**Location:** `docs/NpcTurretsDesign.md:147`, `118`; live `src/game/npc-fire-toast.js:54–64`  
**Issue:** The integrator brief still draws `NoToast["no Incoming turret toast"]` and freezes “No turret toast”. Live Wave 99 reuses TGT-03 `Incoming fire.` for turret vsPlayer. That is not a new string, and Wave 98 §13 already pointed at TGT-03. A later reader can treat the mermaid as a HUD defect.  
**Suggestion:** Later docs pass only: name reuse of `Incoming fire.` (shared clock). Do not add HUD chrome.  
**Status:** accepted — product HUD is correct; do not change `src/` this pass

#### 💡 Suggestion: cannon and turret share one fire toast slot

**Severity:** Suggestion  
**Location:** `src/game/npc-fire-toast.js:10–11`, `61–64` (`lastIncomingFireAt`)  
**Issue:** Same-frame cannon then turret yields one `Incoming fire.` toast. That is the shared clock, not a missed warning.  
**Suggestion:** None. Contract forbids a turret-specific string.  
**Status:** accepted (same as worker `out/w99/turrets/ui-audit.md`)

#### 💡 Suggestion: HUD keeps a local dart literal beside the helper export

**Severity:** Suggestion  
**Location:** `src/systems/hud.js:64` vs `src/game/npc-fire-toast.js:8`; whitelist `hud.js:573`  
**Issue:** Dart copy is duplicated. Fire copy is imported. A later edit of one dart string would drop dart toasts (whitelist fail-closed).  
**Suggestion:** Later hygiene: import `INCOMING_DART_TOAST` from the helper. Do not add a third string.  
**Status:** accepted — live strings match; not a glass freeze break

---

### Occupancy (unchanged)

| Surface | Job | Turret wave |
|---|---|---|
| 80 px `.rw-reticle` hub | Aim glass | Empty. No pip. |
| `.rw-toasts` | Off-column lines | Reuse `Incoming fire.` / `Incoming dart.` |
| Self WPN | Groups 1–5 `textContent` | No Digit 6 |
| FORE/AFT | Aspect + hit flash | Hit-only (`playerHit`) |
| `.rw-edge-arrow` | Current lock off-glass | Untouched |
| `.rw-contacts` | Scanner bearing arc | Sibling. Not a turret gauge |
| Digit 0 / 8 / 9 | Shipyard / player dart / player `auto` | Untouched |

---

### Closed from Wave 98 designer freeze

| Prior freeze | Status now |
|---|---|
| No incoming turret gauge / hub lamp | **Held** |
| No lock box / aspect ring / turret lead pip | **Held** |
| No new `#hud` child / sixth WPN Digit | **Held** |
| FORE/AFT not dual-use as inbound | **Held** |
| Do not steal `Incoming dart.` | **Held** |
| Do not author a turret-specific toast | **Held** — reuse TGT-03 `Incoming fire.` only |
| Digit 0/8/9 player papers | **Held** |
