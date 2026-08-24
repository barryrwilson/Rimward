# Designer audit: Wave 94 PWR bar

| Field | Value |
|---|---|
| **Scope** | HUD PWR instrument (`src/systems/hud.js`, `src/ui/hud.css`) vs `docs/OwnerDecisionsWave94.md` §4 |
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Verdict** | **clean** — no Blocker, no Major |

Owner law (§4): one power pool, same shape as heat, **not** on the aim glass. HUD is a **PWR** bar in `.rw-side-col` next to strain/heat. No pip, ring, or gauge on the aim glass. Reduced-motion: bar still reads, no extra pulse.

---

## UI Audit: PWR bar (`.rw-power-panel`)

### Summary
PWR is a side-column meter with label `PWR`. It is not on the reticle, lead, or combat rails. Fill uses HUD tokens. Reduced-motion keeps the width write and adds no pulse.

### Spec checklist

| Check | Result | Evidence |
|---|---|---|
| Side-column instrument, not aim glass | **Pass** | `hud.js:901–903` mounts the panel in `.rw-side-col`. Reticle / lead / rails do not get a power node. |
| Contrast | **Pass** | Fill `#6ff2e0` (`--cyan` / `--rw-accent`) on void track. High-contrast darkens `.rw-bar`. Colorblind remaps `--rw-accent`. |
| Label | **Pass** | `makeBar(..., 'PWR', 'rw-power')` — uppercase label beside the track. Color is not the only cue. |
| Reduced-motion: bar still reads, no extra pulse | **Pass** | Global `animation/transition: none` on `#hud *` (`hud.css:1173–1177`). No `@keyframes` or pulse class on `.rw-power`. Width still written in JS. |
| Hierarchy vs strain / heat | **Pass** | PWR is `rw-aux` like Plant STRAIN and Heat (combat opacity 0.38, not `rw-fade` 0.14). Cyan fill vs STRAIN amber. |
| No new HUD tree | **Pass** | Same `#hud`. One extra `section` in the existing side column. Nodes created once in `initHud`. |
| No lock box | **Pass** | Target bracket markup is unchanged for this instrument. No aspect ring / lock-box node. |
| No incoming gauge | **Pass** | Incoming warning stays the dart toast (`INCOMING_DART_TOAST`). No new glance gauge. |

### What's done well
- Reuses `makeBar` (label + track + fill, write-on-change width). Same pattern as Plant STRAIN and Bio HUNGER.
- Fill is a token (`var(--cyan)`), not a one-off hex on `.rw-power`.
- Label `PWR` matches owner copy. Width of the fill is the quantity cue.
- `.rw-aux` keeps the bar readable in combat (dim, not hide). Bio / POS still fade harder (`.rw-fade`).
- Combat rails, reticle, lead, and jump box do not grow a power pip or ring.
- Reduced-motion already kills bar tweens. This slice does not add a pulse.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Untitled panel in the side column
**Severity:** Minor  
**Location:** `src/systems/hud.js:902–903`  
**Description:** Plant, Flight, and Heat use `.rw-panel-title`. PWR is a lone meter in `.rw-power-panel` stacked above Bio. The bar still reads because the meter label is `PWR`. Owner asked for that label, not a second title.  
**Suggestion:** Keep as specified. A later HUD pass may group PWR with Plant if the stack feels orphaned. Do not add a title that repeats `PWR`.  
**Status:** open (no fix required this wave)

#### 💡 Suggestion: No LOW / empty word beside the bar
**Severity:** Suggestion  
**Location:** `src/systems/hud.js:1746–1748`  
**Description:** Afterburner cannot start below `POWER.afterburnerMin` (15). Psionic cannot fire below 10. The bar shows empty/low width only. Strain gets an `OVERHEAT` flag at the can't-fire end of its pool. BURN still shows `READY` when the burn does not start.  
**Suggestion:** Optional `LOW` text if a later wave needs a word cue. Spec did not ask for extra copy or pulse. Do not add a pulse.  
**Status:** deferred (spec-compliant)

#### 💡 Suggestion: PWR sits at the top of `.rw-side-col`, not beside Heat
**Severity:** Suggestion  
**Location:** `src/systems/hud.js:901–903`; `src/ui/hud.css:945–951`  
**Description:** `.rw-bottom` aligns children to the bottom. Side-column order is PWR → Bio → NAV → POS. Heat sits on the left of that row, next to POS, not next to PWR. Owner still required the bar **in** `.rw-side-col`. That placement holds.  
**Suggestion:** If glance pairing with strain/heat matters later, move the panel to the last child of `.rw-side-col` so it sits on the Heat baseline. Do not put it on the rails.  
**Status:** deferred (placement matches `.rw-side-col`)

---

### Contrast / motion / theming

| Topic | Notes | Status |
|---|---|---|
| Fill vs track | Beacon cyan on near-black bar track. Border `rgba(96, 150, 196, 0.22)`. Fill is not color-only: label `PWR` + width. | pass |
| Label `--dim` `#7d93ab` | Same 9px uppercase label as other meters. Pre-existing HUD type, not a PWR regression. | pass (inherited) |
| High contrast | `body.rw-contrast #hud .rw-bar` darkens the track and strengthens the border (`hud.css:1150–1153`). Fill still uses `--cyan`. | pass |
| Colorblind | `body.rw-colorblind` remaps `--rw-accent`; `--cyan` follows. STRAIN stays `--rw-warn` amber. | pass |
| Reduced-motion | `body.rw-reduced-motion #hud *` sets `animation: none` and `transition: none`. `.rw-bar-fill` width tween (`hud.css:105–106`) stops. JS still sets `fill.style.width`. No extra pulse on `.rw-power`. | pass |
| Tokens | `.rw-power .rw-bar-fill { background: var(--cyan); }` (`hud.css:123`). No hardcoded fill on this class. | pass |

### Hierarchy vs strain / heat

| Instrument | Place | Combat | Signal |
|---|---|---|---|
| STRAIN (Plant) | Bottom-left aux | `rw-aux` 0.38 | Amber (red + `OVERHEAT` word when hot) |
| STRAIN (Heat) | Bottom aux | `rw-aux` 0.38 | Numeric `%` |
| **PWR** | `.rw-side-col` aux | `rw-aux` 0.38 | Cyan fill + `PWR` label |
| Bio / POS | Same column | `rw-fade` 0.14 | Non-critical |

PWR is secondary to Screen/Shell/hull on the rails. It matches heat/strain as off-glass aux. It stays above Bio in combat. Cyan is the info/beacon role, not threat amber. That split is correct: empty power is a pool, not an alarm.

### Non-goals (must stay off)

| Forbidden | Observed |
|---|---|
| Pip / ring / gauge on the aim glass | Not present on `.rw-reticle`, `.rw-lead`, or combat rails |
| New HUD tree | One `section.rw-power-panel` under existing `#hud` / `.rw-side-col` |
| Lock box | Not added |
| Incoming gauge | Not added; dart warning remains a toast |

---

## Verdict

**clean.** HUD meets Wave 94 §4: PWR in the side column, nothing new on the aim glass, bar still reads under reduced-motion, no extra pulse.
