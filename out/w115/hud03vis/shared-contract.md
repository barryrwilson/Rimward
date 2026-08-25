# HUD-03 remaining visual accessibility shared contract

**Wave:** 115. Design only. No HUD-03 visual feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud03RemainingVisualDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining HUD-03 visual leftover.** Live KeyO `textScale` / `highContrast` / `colorblind` / `reducedMotion` already meet wishlist HUD-03 visual aids on **both** HUD families via `body.rw-*` and `--rw-text-scale`. Do **not** invent a later serial that adds a second scale row, a per-family palette picker, a hub gauge, a Digit, a new persist key, or a free skin override.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud03AlertsDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Hud02RemainingSilhouettesDesign.md`, `docs/Hud02RemainingMechSilhouettesDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Phy*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave115.md`. Do not steal sibling Wave 115 paths `out/w115/hud02tgt/**` or `out/w115/shp/**`.  
**Locked sources:** live inventory `out/w115/hud03vis/current-hud03-visual-inventory.md` (code wins); wishlist HUD-03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 488–502, read only); Wave 103 audio (`docs/Hud03AlertsDesign.md` — **cite, do not rewrite**); `src/systems/settings.js`; `src/core/ctx.js`; `src/ui/hud.css`; `src/systems/hud.js` (read); `src/game/save.js`; `src/systems/station.js`; `src/game/state.js` (READ-ONLY).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “visual settings remain.”

**This leftover is HUD-03 remaining visual accessibility.** It is **not** HUD-03 audio (`hudAlerts`). It is **not** HUD-02 class tokens. It is **not** HUD-01 hub gauges. It is **not** a free HUD skin. It is **not** a new Digit. It is **not** Wave 112 IMPACT knobs.

**Census:** leftover is **CONSUME**. Visual KeyO fields are LIVE. Body classes are LIVE. Family extras inherit LIVE. If a later census finds `textScale` / `highContrast` / `colorblind` / `reducedMotion` **gone** from `FIELDS` or `body.rw-*` unwired for both families, re-open this leftover. Do **not** ship a second visual path while they exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land HUD-03 visual work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. No scale meter, contrast pip, palette disc, or motion glyph on the aim glass. RANGE stays TGT-01. **Do not** put a11y chrome inside `.rw-reticle` (`hud.css` 184–193).
3. Digit 0 stays **shipyard** (`station.js` 188, 6100–6102). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 6177–6179). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Settings stay KeyO.
4. `innerHTML` forbidden later. `textContent` / `createTextNode` / `h()` / `el()` only. Settings panel stays `createElement` (`settings.js` 89–210). Live `innerHTML` in `settings.js` / `hud.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new settings SKU. Do **not** invent UU. Do **not** invent Digit. HUD **never** writes `hullKind`.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay **`rimward-settings-v1`**. Visual bools and `textScale` already join the live settings record. Do **not** add another bool “because leftover.” Prefer existing `rimward-settings-v1` if any later bool (none expected on CONSUME).
7. Prototype-safe persist: settings load walks `Object.keys(FIELDS)` (`settings.js` 58–59). No `for-in` merge of a raw blob. Reserved ids `__proto__`, `constructor`, `prototype` stay invalid as field names.
8. KeyT stays cycle. KeyV stays reticle lock. KeyX stays MATCH. KeyK stays engine-select. KeyO stays **settings**. Do not steal those keys. KeyO is **not** in `TRACKED` (`controls.js` 41–48).
9. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–89). `#hud[data-family]` stays Wave 62 consume. HUD-02 player class tokens (`data-class-key`, `applyClassKeyAttr` `hud.js` 100–115) are **other workers**. Do **not** steal `hud.js` / `hud.css` class tokens as HUD-03. Do not steal `out/w115/hud02tgt/**`.
10. HUD-03 free skin override stays **closed**. Wave 62 family skins consume. Wave 65 audio consume. Wave 103 `hudAlerts` consume. Do **not** add a KeyO “HUD style” picker. Debug `sessionStorage` `rw-hud-family` is **not** product chrome.
11. Wave 103 audio: **cite** `docs/Hud03AlertsDesign.md`. **Do not rewrite.** Do **not** add a second `hudAlerts`. Do **not** treat mute as visual leftover.
12. Wave 112 live knobs consume. Do **not** retune IMPACT / SUN as HUD-03. Do not write `docs/OwnerDecisionsWave115.md`.
13. Kit mutate omit. Aim-glass gauges stay off.
14. Do not edit sibling Bio/Nav/Msn/Rep/Phy/Shp/Tgt/Hud02/Hud03Alerts/Owner docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner.
15. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
16. Fail-closed later (if owner re-opens after a **true** missing-field census): corrupt `rimward-settings-v1` keeps `ctx.js` defaults (`settings.js` 63–65). Storage denied → session-only (`settings.js` 79–81). Invalid `textScale` does not apply (`FIELDS` include-list).
17. Do **not** schedule overlay / galaxy-chart / KeyO-panel font scaling as HUD-03 leftover. Wishlist HUD-03 is **HUD families**. Chart `--rw-text-scale` fallback `1` (`hud.css` 1781) is **not** a named serial.
18. Do **not** invent per-family visual checkboxes. Body classes already apply to both families.
19. Bindings do not change here.

---

## 0.1 Wave 115 deputize (owner may override after playtest)

Pick playable visual defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent UU / SKU / Digit / KeyO row.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| `textScale` | 0.85 \| 1 \| 1.2 \| 1.5; default **1** | `settings.js` 25–26, 36; `ctx.js` 218 |
| `colorblind` | boolean; default **false** | `settings.js` 30, 70; `ctx.js` 215 |
| `highContrast` | boolean; default **false** | `settings.js` 31, 71; `ctx.js` 216 |
| `reducedMotion` | boolean; default **false** | `settings.js` 32, 72; `ctx.js` 217 |
| Body classes | `rw-colorblind` / `rw-contrast` / `rw-reduced-motion` | `settings.js` 70–72 |
| Scale CSS var | `--rw-text-scale` on `#hud` | `settings.js` 73; `hud.css` 29–31 |
| Okabe-Ito | accent `#56B4E9` warn `#E69F00` bad `#D55E00` good `#009E73` | `hud.css` 1146–1151 |
| Persist key | `rimward-settings-v1` | `settings.js` 24 |
| `hudAlerts` | default **false** (audio; consume) | `ctx.js` 221; `settings.js` 34, 44 |

### Smallest additive punch

**None.** Visual HUD-03 already punches via live KeyO + `body.rw-*` + `--rw-text-scale` on both families.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining HUD-03 visual leftover |
| Fail-closed | corrupt JSON → defaults; denied storage → session-only |
| Additive PR1 | **None.** Do not add a fifth visual checkbox. Do not add a second TEXT SIZE. |
| Not a leftover PR | `hudAlerts` rewrite; HUD-02 class tokens; free skin; hub child; Digit; persist; `state.js` write; IMPACT knobs |
| Persist | existing blob only |
| Audio / HUD | consume Wave 103; no new toast; no hub pip |

Owner freeze (do not invert):

- Do **not** invent visual HUD-03 work while the four visual fields + body classes exist on both families.
- First remaining serial (if owner re-opens after a true missing-field census) must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- HUD-03 free skin stays **closed**.
- If settings storage is denied, session defaults still apply. **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

```
// LIVE today — consume. Do not add a second apply path.
document.body.classList.toggle('rw-colorblind', s.colorblind)
document.body.classList.toggle('rw-contrast', s.highContrast)
document.body.classList.toggle('rw-reduced-motion', s.reducedMotion)
hudEl.style.setProperty('--rw-text-scale', String(s.textScale))
```

Do **not** persist visual flags into `WORLD_FIELDS`.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Invent REAL leftover despite LIVE KeyO visual FIELDS | **Forbidden** — CONSUME |
| Second scale / contrast / color-blind / motion control | **Forbidden** |
| Per-family visual checkboxes | **Forbidden** §0.18 |
| Free HUD style picker | **Forbidden** §0.10 |
| Steal HUD-02 `data-class-key` as HUD-03 | **Forbidden** §0.9 |
| Rewrite `docs/Hud03AlertsDesign.md` / second `hudAlerts` | **Forbidden** §0.11 |
| Hub a11y gauge | **Forbidden** §0.2 |
| New Digit / Key steal | **Forbidden** §0.3 / §0.8 |
| New persist key / `WORLD_FIELDS` | **Forbidden** §0.6 |
| `state.js` write | **Forbidden** §0.5 |
| Scale station / KeyO / galaxy as HUD-03 leftover | **Forbidden** §0.17 |
| Wave 112 IMPACT retune | **Forbidden** §0.12 |
| `innerHTML` settings labels | **Forbidden** §0.4 |

---

## 1. DONE — visual HUD-03 (both families) and Wave 103 audio

Inventory §2–§4. Do **not** add a second scale/contrast/color-blind/reduced-motion control. Do **not** add a second mute or `hudAlerts`.

| Control | Live owner |
|---|---|
| Color-blind | `colorblind` → `body.rw-colorblind` (both families) |
| High contrast | `highContrast` → `body.rw-contrast` (both families) |
| Reduced motion | `reducedMotion` → `body.rw-reduced-motion` + family extras + emit skip |
| Text scale | `textScale` → `--rw-text-scale` on `#hud` |
| HUD audio alerts | `hudAlerts` → `song.js` (Wave 103; **not** this leftover) |
| Mute all | `muted` → `song.js` master gain 0 |
| Master volume | `masterVolume` 0..1 |

---

## 2. Remaining — none

**Picture:** reuse live KeyO. No new checkbox. No new TEXT SIZE. No hub child.

Named serial: **none**. Name: **no remaining HUD-03 visual leftover.**

---

## 3. Serial PR plan

**Named only. Do not implement in Wave 115.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 visual HUD-03** | **Does not exist.** Leftover CONSUME | second KeyO row; hub gauge; Digit; persist; free skin; class-token steal; audio rewrite |
| **PR-census (optional skip)** | Re-grep `FIELDS` visual keys vs wishlist HUD-03 bullets | New world field; hub pip; `src/` |

First remaining visual HUD-03 serial is **none**. It must not steal Digit 0/8/9. It must not write `state.js`.
