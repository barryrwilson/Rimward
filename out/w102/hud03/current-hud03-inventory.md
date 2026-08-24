# Wave 102 HUD-03 remaining optional audio-alerts inventory

**Wave:** 102. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over wishlist HUD-03 “optional audio alerts” as if scale/contrast/color-blind/reduced-motion were missing, and over Wave 61 “no new HUD-03 keys”. Cites are live file:line as of this inventory.  
**Scope:** prove HUD-03 **visual** a11y already ships on KeyO / `body.rw-*` / `--rw-text-scale`; prove **mute + masterVolume** already silence **all** song output; prove Wave 65 **family ticks** already exist as `CUES` + `FAMILY_CUES`; prove **no** `hudAlerts` (or other HUD-03 audio) settings bool; prove Incoming fire./Incoming dart. toasts are frozen copy with **existing** `npcFire` / `npcFireMissile` tones; prove no SKU/Digit/persist-world key is required.  
**Not inventory of:** TGT-03 rail CLOS (sibling Wave 102; do not edit `hud.js` / Tgt03 docs), BIO-02 career (do not edit `shipyard-desk.js`), Digit 0 shipyard rewrite, Digit 8/9 papers rewrite, HUD-01 empty hub, HUD-02 skins, WAVE98 toast strings, `state.js` weapons.

---

## 0. One-line result

**Scale, contrast, color-blind, and reduced-motion already ship.** Optional **HUD audio alerts as a KeyO toggle do not.** `settings.js` already persists `muted` + `masterVolume` on `rimward-settings-v1`. `song.js` already zeros master when muted. Wave 65 family ticks (`hudMechRange` / `hudMechMatch` / `hudMechContact` / `hostileEnter` / `hullBand`) and `reticleLock` already have `CUES` rows. Those ticks play whenever unmuted (family ticks also need `#hud[data-family]`). There is **no** `hudAlerts` field. Incoming fire./Incoming dart. are toast copy in `npc-fire-toast.js`; `npcFire` / `npcFireMissile` already cue those events. A second toast string would be a **lie**. A new SKU / Digit / `WORLD_FIELDS` key / hub gauge / extra `localStorage` key would be a **lie**. Do **not** mint UU. Fail-closed: later impl does **not** play HUD-alert ticks when muted.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/settings.js` | KeyO panel, `FIELDS`, `CHECKBOXES`, persist `rimward-settings-v1`, `body.rw-*` |
| `src/systems/song.js` | `CUES`, `FAMILY_CUES`, mute/volume, family dataset gate |
| `src/core/ctx.js` | `settings` defaults; frozen emit comment list |
| `src/systems/hud.js` | Family emit sites, Incoming toasts, empty hub, `hullKind` read, `innerHTML` |
| `src/game/npc-fire-toast.js` | WAVE98 `Incoming fire.` / `Incoming dart.` |
| `src/systems/controls.js` | KeyT/KeyV/KeyK/KeyX; `reticleLock` emit; `TRACKED` (no KeyO) |
| `src/systems/title.js` | KeyO pass-through on title |
| `src/ui/hud.css` | 80 px hub; `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion` |
| `src/game/save.js` | `WORLD_FIELDS`; no alerts key |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 launch/epics + papers |
| `src/game/state.js` | READ-ONLY this pack (not opened for write) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | HUD-03 leftover (read only) |

Grep `innerHTML` in `src/systems/settings.js`, `src/systems/song.js`, `src/systems/hud.js`: **0 hits**.  
Grep `hudAlerts` / `audioAlert` / `optional audio` in `src/**/*.js`: **0 hits**.  
Grep wishlist leftover: `docs/PLAYER-EXPERIENCE-WISHLIST.md` 352–364.

---

## 2. Wishlist leftover vs live split

Wishlist HUD-03 (`PLAYER-EXPERIENCE-WISHLIST.md` 352–364) still lists five bullets. Status (354–356) already records scale, contrast, color-blind, reduced motion in `settings.js` / `body.rw-*`. It records that Waves A–F did **not** add optional audio alerts. HUD initiative status (299–301) records family audio DONE (Wave 65 PR4) and “HUD-03 existing settings remain; no new wave.”

| Aid | Live? | Surface |
|---|---|---|
| Scalable HUD | **YES** | `textScale` → `#hud --rw-text-scale` (`settings.js` 24–25, 34, 70, 139–175; `ctx.js` 218) |
| High contrast | **YES** | `highContrast` → `body.rw-contrast` (`settings.js` 30, 40, 68; `hud.css` 1149–1177) |
| Color-blind-safe cues | **YES** | `colorblind` → `body.rw-colorblind` (`settings.js` 29, 39, 67; `hud.css` 1141–1147) |
| Reduced motion | **YES** | `reducedMotion` → `body.rw-reduced-motion` (`settings.js` 31, 41, 69; `hud.css` 1179–1185). Family ticks also skip emit (`hud.js` 1073–1076, 1508) |
| Mute all audio | **YES** (not the leftover) | `muted` checkbox “Mute all audio” (`settings.js` 32, 42; `song.js` 451–453) |
| Master volume | **YES** (not the leftover) | `masterVolume` 0..1 (`settings.js` 35, 177–207; `ctx.js` 219; `song.js` 451–453) |
| Optional HUD audio alerts toggle | **NO** | No `FIELDS` key. Family ticks play whenever unmuted |
| Incoming fire./dart. **toast** | **YES** WAVE98 | `npc-fire-toast.js` 8–9, 47–64; `hud.js` 571–576 |
| Incoming fire./dart. **dedicated HUD CUES key** | **NO** | Reuse `CUES.npcFire` / `CUES.npcFireMissile` (`song.js` 68–69, 423) |

Code wins: “add scalable HUD / high contrast / color-blind / reduced motion” would **double-paint** live settings. The remaining brief is an **optional HUD-alert checkbox** on the existing KeyO panel, plus fail-closed mute, plus **reuse** of live `CUES` rows. It is not a missing hub disc.

---

## 3. Settings record (KeyO) — HUD-03 visual already live

`settings.js` is the **only** writer of `ctx.settings` (`settings.js` 4–5; `ctx.js` 211). Persist is **client** localStorage `rimward-settings-v1` (`settings.js` 23), **not** `WORLD_FIELDS`.

Known keys (`settings.js` 28–36):

| Key | Validator | Default (`ctx.js` 214–221) | Panel copy (`settings.js` 38–44, 139–198) |
|---|---|---|---|
| `colorblind` | boolean | `false` | `Colorblind-safe palette` |
| `highContrast` | boolean | `false` | `High contrast HUD` |
| `reducedMotion` | boolean | `false` | `Reduced motion` |
| `muted` | boolean | `false` | `Mute all audio` |
| `hints` | boolean | `true` | `Onboarding hints` |
| `textScale` | `0.85\|1\|1.2\|1.5` | `1` | `TEXT SIZE` S/M/L/XL |
| `masterVolume` | number 0..1 | `1` | `MASTER VOLUME` |

Load (`settings.js` 50–62): `JSON.parse`; then `Object.keys(FIELDS)` only; invalid/corrupt/absent → keep `ctx.js` defaults.  
Persist (`settings.js` 73–78): `JSON.stringify(s)` of the **live settings object**. Unknown blob keys never enter `s` because load walks `FIELDS`, not `for-in` on the blob.  
Apply (`settings.js` 66–71): `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion`; `--rw-text-scale` on `#hud`. **No** body class for mute. Mute is song-only.

Panel DOM: `createElement` + `createTextNode` / `textContent` (`settings.js` 87–207). `role="dialog"` `aria-label="Settings"` (`settings.js` 99–100). Volume `aria-label="Master volume"` (`settings.js` 193). z-index 80 (`settings.js` 90). Closed `display:none` (`settings.js` 89, 215). Hint: `O or ESC to close — changes apply immediately` (`settings.js` 114).

KeyO toggle (`settings.js` 225–231). Title screen lets KeyO/Escape through (`title.js` 7, 204–205) and can dispatch synthetic KeyO (`title.js` 122–125). **KeyO is not in `TRACKED`** (`controls.js` 41–48). Do **not** steal KeyO. Do **not** add a Digit for settings.

**No `hudAlerts` (or alias) in `FIELDS` or `ctx.settings`.**

---

## 4. Mute / volume (fail-closed already)

`song.js` 451–453, every unlocked frame:

```
vol = MASTER_GAIN * (ctx.settings?.muted ? 0 : (ctx.settings?.masterVolume ?? 1))
master.gain.setTargetAtTime(vol, t, VOL_TC)
```

`MASTER_GAIN = 0.15` (`song.js` 23). `VOL_TC = 0.05` (`song.js` 140).  
Muted → **all** tones, pad, combat bed, docked hum, whalesong, family ticks, `npcFire` go silent.  
`masterVolume === 0` is the same silence without the mute checkbox.  
AudioContext unlocks on first keydown/pointerdown (`song.js` 259–260). Fail-closed if AudioContext missing (`song.js` 167–170, 254–256).

HUD-03 remaining alerts **must AND this gate**. A toggle that plays while muted would **lie**.

---

## 5. Live song cues (reuse; do not mint if a row exists)

`CUES` table (`song.js` 45–121). Combat/world rows (always considered unless muted) include `playerHit`, `shieldDown`, `npcFire`, `npcFireMissile`, `engineOut`, `playerFire`, `bodyHit`, and many UI/world stings.

HUD-02 family ticks (`song.js` 114–120, comment “HUD-02 family ticks. New keys only. Gain ≤ 0.08, duration ≤ 0.35 s.”):

| Cue key | Spec (type, f0, f1, dur, gain, lpf, delay) | Family gate `FAMILY_CUES` (`song.js` 124–130) |
|---|---|---|
| `hudMechRange` | square 1600→1600, 0.04 s, 0.05 | `'mech'` |
| `hudMechMatch` | square 980→1240, 0.07 s, 0.055 | `'mech'` |
| `hudMechContact` | triangle 740→420, 0.1 s, 0.06 | `'mech'` |
| `hostileEnter` | sine 330→262, 0.2 s, 0.045 | `'bio'` |
| `hullBand` | sine 185→130, 0.3 s, 0.055 | `'bio'` |
| `reticleLock` | square 1480→1480, 0.06 s, 0.05 | **none** (both families) |

Playback (`song.js` 417–442): `ctx.lastEvents`; `npcFire` + `weapon === 'missile'` → `CUES.npcFireMissile` else `CUES[typ]`; `FAMILY_CUES` needs `#hud.dataset.family` (`song.js` 425–427). Volley cap on `npcFire`/`npcHit` (`song.js` 132–134, 429–438).

**Incoming vs player already has a tone:** `npcFire` (cannon/turret) and `npcFireMissile` (dart) (`song.js` 68–69, 423). There is **no** `incomingFire` / `incomingDart` key. Minting a second HUD tone on the same `npcFire` event would **double-bark**.

---

## 6. HUD emit sites (sibling-owned this wave — read only)

Do **not** edit `hud.js` in Wave 102 HUD-03 (TGT-03 CLOS sibling). Inventory only.

| Tick | Emit | Extra live gate |
|---|---|---|
| `hudMechRange` | `emitFamilyTick('mech', 'hudMechRange', {})` (`hud.js` 1359) | rising `.in-range` (`hud.js` 1355–1358) |
| `hudMechMatch` | `emitFamilyTick('mech', 'hudMechMatch', {})` (`hud.js` 1788) | MATCH lamp on (`hud.js` 1784–1788) |
| `hudMechContact` | `ctx.emit('hudMechContact', { id })` (`hud.js` 1510) | first hostile on arc; `scanner >= 1`; not `reducedMotion`; family mech (`hud.js` 1508–1510) |
| `hostileEnter` | `ctx.emit('hostileEnter', { id })` (`hud.js` 1513) | bio; ≤1 / 0.5 s (`hud.js` 1511–1513) |
| `hullBand` | `emitFamilyTick('bio', 'hullBand', { band })` (`hud.js` 1762) | warn/crit; ≤1 / 2 s (`hud.js` 1757–1762) |
| `reticleLock` | `controls.js` 198, 217 `{ hit: boolean }` only | not a family tick |

`emitFamilyTick` (`hud.js` 1073–1076): skip if `reducedMotion`; skip if `hudFamily(ctx) !== family`.  
`hudFamily` (`hud.js` 80–88): **reads** `player.hullKind`; never writes. `built` → mech; `living` / default → bio.

Incoming toasts (`hud.js` 571–576): `npcFireToast` then **exact** `INCOMING_DART_TOAST` / `INCOMING_FIRE_TOAST`. Do **not** rewrite those strings (`npc-fire-toast.js` 8–9). `pushToast` uses `textContent` (`hud.js` 1116).

---

## 7. Empty hub / keys / digits / SKU / persist world

| Surface | Today | Cite |
|---|---|---|
| Hub | 80×80 px `.rw-reticle` | `hud.css` 184–191; clamp `hud.js` 1198 |
| RANGE | child of reticle; TGT-01 | `hud.js` 703 |
| HUD family | reads `hullKind` | `hud.js` 80–87, 1694 |
| `innerHTML` settings/song/hud | **0** | grep |
| `el()` | `createElement` + `textContent` | `hud.js` 243–248 |
| KeyT / KeyV / KeyX / KeyK | cycle / lock / MATCH / engine | `controls.js` 44, 268–289 |
| KeyO | settings | `settings.js` 227; **not** `TRACKED` |
| Digit 0 dock | last `DOCK_KEY_SERVICES` = `shipyard` | `station.js` 185, 6023–6025, 6068–6070 |
| Digit 8 dock | `launch` (index 7) | `station.js` 185, 6027–6028 |
| Digit 9 dock | `epics` (index 8) | `station.js` 185, 6027–6028 |
| Digit 8/9 outfit | launcher / turret papers | `station.js` 6100–6102 |
| Comment “Digit 9 is Standing” | **STALE** | `station.js` 1621 |
| `WORLD_FIELDS` | no alerts / hudAlerts | `save.js` 76–101 |
| Autosave key | `rimward-save-v1` (untouched) | `save.js` |
| Settings key | `rimward-settings-v1` | `settings.js` 23 |
| `ctx.world.contacts` | station NPCs | `ctx.js` 163 |
| `state.js` | READ-ONLY | owner freeze |

Do **not** steal Digit 0/8/9. Do **not** add an alerts Digit. Do **not** add `WORLD_FIELDS`. A bool **does** fit the live settings record (`FIELDS` + `CHECKBOXES` + `ctx.settings` default).

---

## 8. DOM / a11y / XSS posture (settings + HUD alerts)

| Rule | Live | Cite |
|---|---|---|
| Settings create | `createElement` + text nodes | `settings.js` 87–207 |
| Settings `innerHTML` | **0** | grep |
| Load whitelist | `Object.keys(FIELDS)` | `settings.js` 55–56 |
| Corrupt JSON | catch → defaults | `settings.js` 60–61 |
| Persist deny | catch → session-only | `settings.js` 76–78 |
| HUD toasts | `textContent` | `hud.js` 1116 |
| HUD names | `stripHudText` then `textContent` | (inventory of CLOS sibling; do not reopen) |
| Color never only signal | HUD comment | `hud.js` 43–44 |
| Family CSS | `#hud[data-family]` | `hud.js` 1069, 1704; `song.js` 426 |

A later HUD-alert **label** is authored English on the KeyO panel. Do not interpolate `record.name` into the checkbox. Cue keys stay authored `CUES` identifiers, not blob strings.

---

## 9. What “optional audio alerts” is **not** (live already)

| Naive later PR | Why it is a lie |
|---|---|
| “Add mute” | `muted` already (`settings.js` 42) |
| “Add master volume” | slider already (`settings.js` 177–207) |
| “Add reduced motion” | checkbox + `body.rw-reduced-motion` |
| “Add color-blind / contrast / scale” | already |
| “Add family tick synths” | Wave 65 `CUES` rows exist |
| “Add Incoming fire. toast audio as new copy” | toast frozen; `npcFire` already plays |
| “HUD alert gauge on 80 px hub” | HUD-01 empty hub |
| “Digit for alerts” | Digit 0/8/9 taken |
| “SKU / UU for a klaxon” | client setting, not a buy |
| “WORLD_FIELDS lastAlert” | live events; settings blob is enough |
| “New localStorage key” | `rimward-settings-v1` already |
| “Play ticks while muted” | `song.js` 452 zeros master |
| “`innerHTML` of ship name in a beep label” | XSS |
| “Steal KeyT/KeyV/KeyK/KeyX” | cycle / lock / engine / MATCH |
| “Write `hullKind` so bio ticks play on a built hull” | HUD-02 freeze |

---

## 10. Deputize numbers copied from live code (not minted)

| Number / string | Live source | This serial uses it as |
|---|---|---|
| Storage key `rimward-settings-v1` | `settings.js` 23 | Keep; add bool to same blob |
| `muted` default `false` | `ctx.js` 220 | Fail-closed AND; do not invert mute |
| `masterVolume` default `1` | `ctx.js` 219 | Untouched |
| Family tick gain cap 0.08 / dur 0.35 s | `song.js` 114 | Do not mint louder HUD klaxons |
| `FAMILY_CUES` map | `song.js` 124–130 | HUD-alert **subset** |
| `reticleLock` cue | `song.js` 120 | HUD-alert subset (no family gate) |
| `npcFire` / `npcFireMissile` | `song.js` 68–69 | Incoming **reuse**; not a second CUES row |
| Toast `Incoming fire.` / `Incoming dart.` | `npc-fire-toast.js` 8–9 | **Do not rewrite** |
| Dart/fire toast gap 2.5 s | `npc-fire-toast.js` 10–11 | Untouched |
| Hub 80 px | `hud.css` 184–191 | Untouched |
| Digit 0 shipyard | `station.js` 185, 6023–6025 | Untouched |
| KeyO | `settings.js` 227 | Panel owner; do not steal |
| `CHECKBOXES` row pattern | `settings.js` 38–44, 120–137 | Add one authored label |
| Load whitelist | `settings.js` 55–56 | New bool **must** join `FIELDS` or it will not restore |

**Default of the new bool:** deputize **`false`** (optional). Live Wave 65 ticks currently play when unmuted. Default-off **opts those ticks in**. Owner may override after playtest to `true` to copy live family-audio-on. Copy live **mute** as the **silence** gate, not as the default of the new checkbox (`muted` is already `false`).
