# Designer audit: Wave 97 TGT-03 remaining awareness (freeze)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Scope** | `docs/Tgt03AwarenessDesign.md`, `out/w97/tgt03/shared-contract.md`, `out/w97/tgt03/current-tgt03-inventory.md`, prior `out/w97/tgt03/ui-audit.md`, live occupancy in `src/systems/hud.js` and `src/ui/hud.css` |
| **Not in scope** | Product `src/` edits, wishlist, sibling turret / BIO-05 / NAV / TGT-05 trees |
| **Wave** | Markdown-only. No live chrome ships. Findings are freeze vs live occupancy. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Merge law: if the brief and the contract disagree, the contract wins (`shared-contract.md` header).

---

## UI Audit: lock edge cue + attacker toast (frozen HUD)

### Summary

The freeze reuses the live amber lock triangle and the live off-column toast stack. It does not put a gauge, lock box, or firing pip on the 80 px hub. It does not steal `.rw-nav-gate-cue`. FORE/AFT stays a hit glance. Copy is two short static `warn` lines. Reduced-motion adds no lock `@keyframes`. Digit 0/8/9 stay as they are.

### Freeze checklist

| Check | Result | Evidence |
|---|---|---|
| Empty 80 px hub stays empty | **Pass** | Hub clamp `hud.js:1184–1186`. Contract §6; brief goals 5 / closed HUD. No lock box, incoming gauge, or hub pip. |
| Lock off-screen reuses `.rw-edge-arrow` | **Pass** | Live node `hud.js:732`; CSS triangle `hud.css:575–594`. Contract §1.1: do not invent a third lock class. |
| Do not reuse `.rw-nav-gate-cue` for lock | **Pass** | Gate cue `hud.js:733–737`; CSS ticks+notch `hud.css:1001–1037`. Contract §1.1 / §1.4. |
| Both cues may show | **Pass** | Contract §1.4; inventory §4. Distinct glyphs (amber triangle vs cyan ticks+notch). Same `EDGE_MARGIN` 84 allowed. |
| FORE/AFT hit-only | **Pass** | Flash on `playerHit` only `hud.js:1122–1124`, `1343–1362`. Words FORE/AFT `hud.js:323–350`. Contract §3.1 / §3.6: toast must not set `selfHitFlashUntil`. |
| Toast `Incoming fire.` vs `Incoming dart.` | **Pass** | Dart literal live `hud.js:61–62, 567–571`. New line contract §3.3. Same `warn` class. Static `textContent`. |
| Reduced-motion: no new lock `@keyframes` | **Pass** | Live lock CSS is transform only (`hud.css:575–594`). No keyframes on `.rw-edge-arrow`. Global kill `hud.css:1171–1177`. Contract §1.5; PR4 pin. |
| Contrast / colorblind via vars | **Pass** | Triangle fill `var(--amber)` → `--rw-warn` (`hud.css:23, 592`). Colorblind remap `hud.css:1134–1138`. Contrast toast panels `hud.css:1155–1164`. Contract §1.5. |
| Digit 0 / 8 / 9 untouched | **Pass** | Digit 0 shipyard `station.js:186`. Digit 8/9 Launch/Standing + outfit papers `station.js:1622–1623, 1699–1702`. Contract §0.5 / §6. |
| No LOCK word on the triangle | **Pass** | Contract §1.5 / §9 default **No**. Shape + rotation is the non-color cue (`hud.css:4, 585–594`). Name stays on bracket/rail. |

### What's done well

- HUD-01 occupancy stays closed. Attacker warning uses existing `.rw-toasts` (`hud.js:758–765`; `hud.css:634–646`), top-right, off the aim column (`right: 168px`).
- Lock vs route stay two instruments: `.rw-edge-arrow` vs `.rw-nav-gate-cue`. Color is not the only cue (triangle + rotation vs ticks+notch + cyan `--rw-accent`).
- Fail-closed empty states are named: no lock → hide arrow (`hud.js:1222–1226`); docked/jumping → park arrow (later PR3, match NAV-02 `navPark` `hud.js:1563`); docked/jumping → no fire toast (contract §3.4).
- Copy is short, static, and already uppercase in CSS (`hud.css:717–720`). `Incoming fire.` and `Incoming dart.` share a prefix but differ on the weapon word. No ship names on the node (XSS / flood).
- Separate 2.5 s fire memo from the dart clock so both lines can show (`shared-contract.md` §3.4). Dedupe key is already `cls|text` (`hud.js:1088–1090`).
- Ace omit-target still toasts; hunt-cannon at a live ship does not. Unknown `weapon` does not toast. Matches combat `vsPlayer` without copying `spawnNpcShot`’s unknown→cannon default.
- FORE/AFT already pairs words + fill vs hollow (`hud.js:323`). Reduced-motion already swaps the hit flash to an outline (`hud.css:305–307`). Freeze does not retune that glance into a muzzle lamp.
- Toast region already has `role="status"` and `aria-live="polite"` (`hud.js:760–762`). Screen readers keep the dart channel. No new focusable control. Overlay stays `pointer-events: none` except existing HUD buttons (`hud.css:5–6`).
- Serial plan keeps chrome out of Wave 97. PR3 is aria + park only, not a restyle into NAV-02 ticks. PR4 is boot / motion / contrast pins, not the first time motion law exists (already §1.5).
- Digit 0/8/9, KeyT/KeyV, cone 12 px, and `state.js` stay out of the later serial.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

Class steal and aim-glass gauge stay **closed** in the freeze (same as `out/w97/tgt03/ui-audit.md` pass 2). Do not reopen them as open defects.

#### 🟡 Minor: Dual edge glyphs share `EDGE_MARGIN` 84

**Severity:** Minor  
**Location:** `src/systems/hud.js:64, 1295–1305, 1610–1622`; `src/ui/hud.css:575–594, 1003–1037`; `out/w97/tgt03/shared-contract.md:60–62`  
**Description:** Lock triangle and gate chevron both clamp with the same behind-camera flip and inset 84. When a lock and a plotted gate sit in one quadrant (or both behind), two glyphs can stack on one rim point. Chart marks also edge-clamp to 84 (`hud.js:1544–1546`). Shape contrast is required and already frozen (solid amber triangle vs cyan ticks+notch). This is occupancy, not a class-steal bug.  
**Suggestion:** Keep both classes. Do not merge glyphs. Later impl may inset the lock triangle ~12 px inside the gate cue if a pin shows pixel overlap. Do not add a LOCK caption to buy separation.  
**Status:** accepted — freeze allows same margin; impl pin only if screenshots show collision.

#### 🟡 Minor: Lock triangle is color + shape, no LOCK word

**Severity:** Minor  
**Location:** `src/ui/hud.css:585–594`; `out/w97/tgt03/shared-contract.md:64–67`; `docs/Tgt03AwarenessDesign.md:128–129, 219–222`  
**Description:** HUD law wants color never the only cue (`hud.css:4`). The freeze default is no LOCK word on the glyph. Triangle + rotation is the shape cue. Lock name already lives on the bracket/rail when on-glass. Adding LOCK would fight `EDGE_MARGIN` overlap with the gate chevron.  
**Suggestion:** Keep the default. Do not print LOCK.  
**Status:** accepted

#### 🟡 Minor: `aria-live="polite"` for incoming fire

**Severity:** Minor  
**Location:** `src/systems/hud.js:760–762`; `out/w97/tgt03/shared-contract.md:91–93`  
**Description:** Incoming fire is combat. Assertive might interrupt more. The dart line already uses this polite live region. Changing the region would re-announce comm, sting, and warn toasts on the same 5-slot stack.  
**Suggestion:** Reuse polite. Do not retune the live region this serial.  
**Status:** accepted

#### 🟡 Minor: Live lock arrow has no `aria-hidden` and does not park docked/jump

**Severity:** Minor  
**Location:** `src/systems/hud.js:732` vs `733–734, 1563`; inventory §3 / §9.2–9.3; contract §1.5 / §8 PR3  
**Description:** Gate cue is `aria-hidden` and parks on `navPark`. The lock triangle does not. Station overlay usually covers docked HUD, but the node can still transform. The glyph is decorative; lock identity stays on rails/bracket.  
**Suggestion:** PR3 only: `aria-hidden="true"` and park while `ctx.flags.docked` or `ctx.gate.jumping`. Do not clear `targets.current`. Wave 97 does not ship this.  
**Status:** addressed in freeze (later PR3)

#### 💡 Suggestion: Do not restyle the triangle glow onto a hardcoded amber

**Severity:** Suggestion  
**Location:** `src/ui/hud.css:592–593` (`border-bottom: 14px solid var(--amber)` plus `filter: drop-shadow(0 0 4px rgba(255, 180, 84, 0.6))`)  
**Description:** Fill already uses `--amber` and remaps under `body.rw-colorblind`. The live drop-shadow is a fixed rgba that does not follow `--rw-warn`. High-contrast does not list `.rw-edge-arrow` because it is not a panel (`hud.css:1155–1164`).  
**Suggestion:** Later PR3/PR4: keep `var(--amber)` / `--rw-warn`. Do not add a new hex or a pulse. Optional: drop-shadow via `color-mix` on `var(--amber)` if a contrast pin looks off. Do not add the triangle to the contrast panel list unless impl adds a scrim.  
**Status:** deferred — live CSS; freeze must not add new hardcoded color

#### 💡 Suggestion: Keep dart copy and dart dock/jump path unchanged

**Severity:** Suggestion  
**Location:** `out/w97/tgt03/shared-contract.md:126–127` vs `188–189`; `src/systems/hud.js:567–571`  
**Description:** §3.4 parks “attacker fire” while docked/jumping. PR2 applies that suppress to the new cannon line and leaves the dart path unchanged. That is the right split for this serial. NPCs should not fire at a docked player; jump is brief.  
**Suggestion:** Do not rewrite `Incoming dart.` or `DART_TOAST_GAP`. Do not add `Incoming psionic.`  
**Status:** accepted

---

### Frozen copy (do not paraphrase later)

| Moment | Literal | Surface |
|---|---|---|
| Cannon vs player (explicit or ace omit) | `Incoming fire.` | toast `warn` |
| Dart vs player | `Incoming dart.` | toast `warn` (shipped) |
| Reticle miss | `Nothing under the reticle.` | commLine (TGT-05; do not change) |

Do not add `Incoming psionic.` Do not add a LOCK caption on the triangle. Do not interpolate ship or faction names.

### Contrast / motion / layout (freeze law)

- `body.rw-colorblind` remaps `--rw-warn` (Okabe-Ito `#E69F00`). Triangle stays a triangle (`hud.css:1134–1138, 585–594`).
- `body.rw-contrast` darkens toast panels (`hud.css:1155–1164`). Lock glyph still uses `--amber`.
- `body.rw-reduced-motion`: no new sweep/pulse on `.rw-edge-arrow`; global `animation/transition: none` (`hud.css:1171–1177`). FORE/AFT already outline-only (`hud.css:305–307`).
- Toast stack stays top-right off the aim column (`hud.css:634–641`). Five slots, `textContent` (`hud.js:60, 1103`).
- Digit 0/8/9 chrome untouched.

### Agreement with prior `ui-audit.md`

Pass 2 closed class-steal and glass-gauge Majors in the freeze. Copy table is unchanged. This designer pass agrees. Dual-margin overlap and LOCK-word absence stay accepted, not reopeners.

### Pass verdict

Wave 97 markdown freeze is **CLEAN** for UI/UX. Later impl must reuse `.rw-edge-arrow`, keep `.rw-nav-gate-cue` for the gate, allow both, keep the 80 px hub empty, flash FORE/AFT only on `playerHit`, toast `Incoming fire.` beside shipped `Incoming dart.`, add no lock `@keyframes`, color via contrast/colorblind vars, leave Digit 0/8/9, and print no LOCK word on the triangle.
