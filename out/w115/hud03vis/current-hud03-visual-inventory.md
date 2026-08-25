# Wave 115 HUD-03 remaining visual accessibility — live inventory

**Wave:** 115. Markdown only. Code wins over wishlist HUD initiative “HUD-03 visual settings remain,” over HUD-03 bullets as if scale / contrast / color-blind / reduced-motion were missing, and over Wave 61 “no new HUD-03 keys.”  
**Census date:** 2026-08-24.  
**Scope:** leftover **visual** HUD-03 after live KeyO `textScale` / `highContrast` / `colorblind` / `reducedMotion` on `body.rw-*` and `--rw-text-scale`, for **both** HUD families (`#hud[data-family='mech'|'bio']`).  
**Cite, do not rewrite:** [`docs/Hud03AlertsDesign.md`](../../docs/Hud03AlertsDesign.md) (Wave 103 optional **audio** alerts). HUD-02 class tokens are **sibling** (`out/w115/hud02tgt/**`; Wave 113/114 live).  
**Not this leftover:** HUD-03 `hudAlerts` (Wave 103 CONSUME). Mute / master volume (Wave 65 / KeyO). Free HUD skin override (owner closed). HUD-01 empty hub. Digit 0/8/9. HUD-02 `data-class-key` chrome. Wave 112 IMPACT knobs.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| Scalable HUD on both families? | **Yes.** `textScale` 0.85\|1\|1.2\|1.5 → `#hud --rw-text-scale`; `#hud` and readouts multiply | **LIVE** |
| High contrast on both families? | **Yes.** `highContrast` → `body.rw-contrast`; `#hud` token override is **not** family-gated | **LIVE** |
| Color-blind-safe cues on both families? | **Yes.** `colorblind` → `body.rw-colorblind`; Okabe-Ito `--rw-*` on `#hud`; bio `--vein` remaps to `--rw-good` | **LIVE** |
| Reduced motion on both families? | **Yes.** `reducedMotion` → `body.rw-reduced-motion`; `#hud *` kills animation/transition; family extras freeze; `emitFamilyTick` skips | **LIVE** |
| Optional audio alerts? | **Yes.** `hudAlerts` KeyO + `song.js` `HUD_ALERT_TYPES` | **Wave 103 CONSUME** (cite `docs/Hud03AlertsDesign.md`; **not** this leftover) |
| New visual KeyO row still missing? | **No.** Visual cluster already has four checkboxes + TEXT SIZE | **Not honest leftover** |
| HUD-02 class tokens a HUD-03 hole? | **No.** `data-class-key` is sibling HUD-02 | **Do not steal** |

Name: **no remaining HUD-03 visual leftover.** Freeze **CONSUME**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/settings.js` | `FIELDS`, `CHECKBOXES`, persist `rimward-settings-v1`, `body.rw-*`, `--rw-text-scale` |
| `src/core/ctx.js` | `settings` defaults including visual + `hudAlerts` |
| `src/ui/hud.css` | `#hud` scale; `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion`; family extras |
| `src/ui/screens.css` | overlay Okabe-Ito + contrast (not HUD family chrome) |
| `src/ui/models.css` | models contrast (not HUD family chrome) |
| `src/systems/hud.js` | `hudFamily`; `dataset.family`; `emitFamilyTick` reducedMotion skip; class-key sibling |
| `src/systems/song.js` | `hudAlerts` gate (cite only; audio leftover closed) |
| `src/systems/controls.js` | `TRACKED` (no KeyO) |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 |
| `src/game/save.js` | `WORLD_FIELDS`; no visual a11y key |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | HUD-03 list (read only; **do not edit**) |
| `docs/Hud03AlertsDesign.md` | audio leftover (cite only; **do not rewrite**) |

Grep `innerHTML` in `src/systems/settings.js` and `src/systems/hud.js`: **0 hits**.

---

## 2. Wishlist leftover vs live split

Wishlist HUD initiative (`PLAYER-EXPERIENCE-WISHLIST.md` 422–425) still says “HUD-03 visual settings remain” while also recording Wave 103 audio DONE. HUD-03 subsection (488–502) already says existing settings remain (scale, contrast, color-blind, reduced motion in `settings.js` / `body.rw-*`) and lists five bullets.

| Aid | Wishlist | Live? | Surface |
|---|---|---|---|
| Scalable HUD elements | HUD-03 bullet | **YES** | `textScale` → `--rw-text-scale` on `#hud` (`settings.js` 25–26, 36, 73, 142–177; `ctx.js` 218; `hud.css` 29–31) |
| High-contrast presentation | HUD-03 bullet | **YES** | `highContrast` → `body.rw-contrast` (`settings.js` 31, 42, 71; `hud.css` 1153–1181) |
| Color-blind-safe state cues | HUD-03 bullet | **YES** | `colorblind` → `body.rw-colorblind` (`settings.js` 30, 41, 70; `hud.css` 1145–1151, 1736–1738) |
| Reduced motion | HUD-03 bullet | **YES** | `reducedMotion` → `body.rw-reduced-motion` (`settings.js` 32, 43, 72; `hud.css` 1183–1189, 1535–1541); `emitFamilyTick` skip (`hud.js` 1105–1109) |
| Optional audio alerts | HUD-03 bullet | **YES** | `hudAlerts` (`settings.js` 34, 44; `ctx.js` 221; `song.js` 132–140, 437) — **Wave 103**. Cite `docs/Hud03AlertsDesign.md` |

Code wins: “add scale / contrast / color-blind / reduced motion” would **double-paint** live KeyO. “Add HUD audio alerts” would **double-paint** Wave 103. There is **no** remaining visual HUD-03 serial.

---

## 3. Settings record (KeyO) — visual already live

`settings.js` is the **only** writer of `ctx.settings` (`settings.js` 4–5; `ctx.js` 211). Persist is **client** localStorage `rimward-settings-v1` (`settings.js` 24), **not** `WORLD_FIELDS`.

Known keys (`settings.js` 29–38):

| Key | Validator | Default (`ctx.js` 215–222) | Panel copy (`settings.js` 40–46, 142–210) | Visual leftover? |
|---|---|---|---|---|
| `colorblind` | boolean | `false` | `Colorblind-safe palette` | **No — LIVE** |
| `highContrast` | boolean | `false` | `High contrast HUD` | **No — LIVE** |
| `reducedMotion` | boolean | `false` | `Reduced motion` | **No — LIVE** |
| `hudAlerts` | boolean | `false` | `HUD audio alerts` | **No — audio Wave 103** |
| `muted` | boolean | `false` | `Mute all audio` | **No — mute, not visual** |
| `hints` | boolean | `true` | `Onboarding hints` | **No — onboarding** |
| `textScale` | `0.85\|1\|1.2\|1.5` | `1` | `TEXT SIZE` S/M/L/XL | **No — LIVE** |
| `masterVolume` | number 0..1 | `1` | `MASTER VOLUME` | **No — audio** |

Load (`settings.js` 53–65): `JSON.parse`; then `Object.keys(FIELDS)` only; `Object.prototype.hasOwnProperty.call`; invalid/corrupt/absent → keep `ctx.js` defaults.  
Persist (`settings.js` 76–81): `JSON.stringify(s)` of the live settings object. Unknown blob keys never enter `s`.  
Apply (`settings.js` 69–73): `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion`; `--rw-text-scale` on `#hud`. **No** extra visual body class exists to invent. `hudAlerts` has **no** body class (`settings.js` 20–21).

Panel DOM: `createElement` + `createTextNode` / `textContent` (`settings.js` 89–210). `role="dialog"` `aria-label="Settings"` (`settings.js` 102–103). Volume `aria-label="Master volume"` (`settings.js` 196). z-index 80 (`settings.js` 93). Closed `display:none` (`settings.js` 92, 218). Hint: `O or ESC to close — changes apply immediately` (`settings.js` 117). `innerHTML`: **0**.

KeyO toggle (`settings.js` 228–234). **KeyO is not in `TRACKED`** (`controls.js` 41–48). Do **not** steal KeyO. Do **not** add a Digit for settings.

---

## 4. Both HUD families (not a third family)

`hudFamily` (`hud.js` 80–89): **reads** `player.hullKind`; never writes. `built` → mech; `living` / Beautiful / default → bio. Debug `sessionStorage` key `rw-hud-family` is **not** a KeyO free-skin picker. HUD-03 free skin override stays **closed**.

Root apply (`hud.js` 1099–1101): `root.dataset.family = last.family`; then sibling `applyClassKeyAttr` for HUD-02 tokens. **Do not steal** `data-class-key` as HUD-03.

Body classes sit on `document.body`. CSS selectors `body.rw-* #hud` apply to **both** families. Family skins (`#hud[data-family="mech"]` / `'bio'`) restyle chrome; they **inherit** the same `--rw-accent` / `--rw-warn` / `--rw-bad` / `--rw-good` / `--white` / `--panel` tokens.

| Family extra (consume, not leftover) | Cite |
|---|---|
| Color-blind facing lamps (both families) | `hud.css` 310–317 |
| Bio `--vein` → `--rw-good` under color-blind | `hud.css` 1736–1738 |
| Bio contrast hair lines | `hud.css` 1740–1747 |
| Contrast contacts stroke | `hud.css` 876–878 |
| Reduced-motion `#hud *` animation/transition none | `hud.css` 1185–1189 |
| Reduced-motion facing flash → outline | `hud.css` 305–307 |
| Reduced-motion contact enter | `hud.css` 872–874 |
| Reduced-motion mech RANGE pop | `hud.css` 1241–1243 |
| Reduced-motion bio pupil / iris | `hud.css` 1749–1755 |
| Reduced-motion hide combat-rail hair (both) | `hud.css` 1535–1541 |
| `emitFamilyTick` skip when reducedMotion | `hud.js` 1105–1107 |
| Bio period 0 when reduced | `hud.js` 124–125, 1896–1897 |

Neither family is missing a visual HUD-03 control. Adding a second scale/contrast/color-blind/motion row **per family** would invent a third HUD family or a free skin override.

---

## 5. What is **not** a remaining visual leftover

| Naive later PR | Why it is a lie |
|---|---|
| “Add TEXT SIZE” | Segmented S/M/L/XL already (`settings.js` 142–177) |
| “Add high contrast” | Checkbox already |
| “Add color-blind palette” | Checkbox + Okabe-Ito already |
| “Add reduced motion” | Checkbox + CSS + emit skip already |
| “Add HUD audio alerts” | Wave 103 `hudAlerts` already; cite `docs/Hud03AlertsDesign.md` |
| “Scale the KeyO panel / station overlays as HUD-03” | Wishlist is **HUD families**, not overlay chrome |
| “Scale the galaxy chart as HUD-03 leftover” | Chart is KeyM, not `#hud` family; var fallback `1` (`hud.css` 1781) is **not** a HUD-03 hole |
| “HUD-02 `data-class-key` as HUD-03” | Sibling Wave 113/114 / `out/w115/hud02tgt/**` |
| “Free HUD style picker on KeyO” | Owner closed 2026-08-18 |
| “Alert / scale gauge on 80 px hub” | HUD-01 empty hub (`hud.css` 184–193) |
| “Digit for a11y” | Digit 0/8/9 taken (`station.js` 188, 6098–6106, 6177–6179) |
| “New `localStorage` key” | `rimward-settings-v1` already |
| “`WORLD_FIELDS` textScale” | Client settings, not world (`save.js` 76–101) |
| “Write `hullKind` so bio tokens play on built” | HUD-02 freeze |
| “New persist bool for visual” | Four visual bools + scale already persist |
| “Invent work because wishlist still lists the bullets” | Code wins; bullets are **LIVE** |

NAV-02 already caps aux width so `textScale` 1.5 cannot grow into the target rail (`hud.css` 969–970). That is **consume**, not a hole.

---

## 6. Empty hub / keys / digits / persist

| Surface | Today | Cite |
|---|---|---|
| Hub | 80×80 px `.rw-reticle` | `hud.css` 184–193 |
| HUD family | reads `hullKind` | `hud.js` 80–89, 1100 |
| Class tokens | sibling HUD-02 | `hud.js` 100–115, 1101 |
| `innerHTML` settings/hud | **0** | grep |
| KeyT / KeyV / KeyX / KeyK | cycle / lock / MATCH / engine | `controls.js` 44 |
| KeyO | settings | `settings.js` 230; **not** `TRACKED` |
| Digit 0 dock | last `DOCK_KEY_SERVICES` = `shipyard` | `station.js` 188, 6100–6102 |
| Digit 8 dock | `launch` (index 7) | `station.js` 188, 6098–6106 |
| Digit 9 dock | `epics` (index 8) | `station.js` 188 |
| Digit 8/9 outfit | launcher / turret papers | `station.js` 6177–6179 |
| `WORLD_FIELDS` visual key | **none** | `save.js` 76–101 |
| Settings key | `rimward-settings-v1` | `settings.js` 24 |
| `state.js` | READ-ONLY later | owner freeze |

---

## 7. Audio (cite only; not this leftover)

Wave 102/103 closed optional HUD audio alerts. Live:

- `hudAlerts` in `FIELDS` + `CHECKBOXES` (`settings.js` 34, 44)
- default `false` (`ctx.js` 221)
- `HUD_ALERT_TYPES` + `alertOk` (`song.js` 132–140, 437)
- mute still zeros master (`song.js` 463)

Do **not** rewrite `docs/Hud03AlertsDesign.md`. Do **not** add a second audio checkbox as “visual leftover.”

---

## 8. Deputize numbers copied from live code (not minted)

| Number / string | Live source | This leftover uses it as |
|---|---|---|
| Storage key `rimward-settings-v1` | `settings.js` 24 | Keep; **no** new key |
| `TEXT_SCALES` | `[0.85, 1, 1.2, 1.5]` | Keep |
| Okabe-Ito accent / warn / bad / good | `#56B4E9` / `#E69F00` / `#D55E00` / `#009E73` | Keep (`hud.css` 1146–1151) |
| Hub 80 px | `hud.css` 184–193 | Untouched |
| Digit 0 shipyard | `station.js` 188, 6100–6102 | Untouched |
| KeyO | `settings.js` 230 | Panel owner |
| Load whitelist | `settings.js` 58–59 | Do not `for-in` merge |

**Additive:** **none.** CONSUME.
