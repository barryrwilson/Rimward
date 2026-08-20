# Shipped HUD evidence inventory (waves A–F / HUD-01 / TGT-01–03)

**Purpose:** Cite instruments that exist in the working tree so HUD-02 can restyle them. Do not invent systems. Do not propose a skin.

**Status of record:** `docs/HudUtilityChangeProposal.md` front matter: `status: IMPLEMENTED`. Body: “IMPLEMENTED (waves A–F landed 2026-08-17). HUD-02 skins remain later.”

**Sources read:** `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/ship.js` (camera + MATCH only), `src/systems/settings.js`, `src/core/ctx.js`, `docs/HudUtilityChangeProposal.md`. Hail / onboarding parking cited from `src/systems/hail.js` and `src/systems/onboarding.js` because Wave B moved those overlays off `#hud`.

---

## 1. Locked non-goals (proposal; do not reopen in HUD-02)

Quoted from `docs/HudUtilityChangeProposal.md`. HUD-02 must keep these as non-goals.

**Empty aim glass / no contacts ring around the reticle**

- Locked decision: “Wave F default is a **thin bottom bearing arc** … The middle stays empty. A reticle-centered ring is not the default.” (proposal, Decisions locked)
- Utility rule 2: “The aim glass stays empty. … No reticle-centered contacts ring as the default.” (§2)
- Wave F acceptance: “The **middle / aim glass stays empty.** The instrument is not a 22–28% reticle ring.”
- Explicit out of scope (§8): “A default reticle-centered contacts ring at 22–28% of the short side”

**MATCH never writes throttle**

- Locked decision: “Match-speed never writes `ctx.input.throttle` from `ship.js`. See §5.6.”
- Contract §5.6 / Wave D: “`ship.js` does not write `ctx.input.throttle`.”
- `src/core/ctx.js` header: “ship.js must not write ctx.input.throttle.”
- `src/systems/ship.js` header: “It never writes ship.velocity, input.throttle, or flags.matchSpeed.” (recoil comment; MATCH toggle *does* write `flags.matchSpeed`, not `input.throttle`)
- Flight step: `fwdSpeed` from lock speed when `ctx.flags.matchSpeed && liveLock` (`ship.js` ~552–557). No `input.throttle =` assignment in that path.

**Scanner buys awareness only**

- Locked: “TGT-01: the **core ship** gets honest lead + range + MATCH. Scanner buys awareness only.”
- Wave F tier 0: “HUD-01 rails, DIST, edge arrow, bracket, **honest Wave D lead + range pop + MATCH**. **No contacts arc.** … Scanner buys **awareness only**.”
- Code: `showArc = scanner >= 1 && !ctx.flags.docked && !!shipObj` (`hud.js` 932–933). Lead / RANGE / MATCH / edge arrow do not test `scanner`.

**No GSE triad**

- §3 / §5.14 / §8: Plant / Flight / Heat stay `.rw-aux`. Do not invent guns / shields / engines power pools.
- Code: `.rw-defense.rw-aux` (Plant), `.rw-flight.rw-aux` (Flight), `.rw-weapon.rw-aux` (Heat) (`hud.js` 556–582).

**No four-face shields**

- §3 / §5.7 / §8: two layers Screen then Shell; facet `'fore' | 'aft'` only. Facing glance, not F5–F8 transfer.
- Code: `makeBar(..., 'SCREEN', 'rw-screen')` + `makeBar(..., 'SHELL', 'rw-shell')` on each rail; `makeFacing` FORE/AFT only.

**No missiles**

- §3 / §8: no heat-seek / aspect-lock / lock-box / missile-warning / countermeasures.
- Shipped weapon groups: `WEAPON_KEYS = ['cannon', 'disruptor', 'mining']` (`hud.js` 85). No missile instrument.

**No tendrils across the aim glass**

- §6: “Organic skin must not grow tendrils across the aim glass. These waves do not add tendrils…”
- Later HUD-02: “Do **not** invent tendrils across the glass in Wave F. Design HUD-02 in its own later wave.”
- Wishlist (`docs/PLAYER-EXPERIENCE-WISHLIST.md` HUD-02): “HUD utility waves A–F did not add skins, tendrils, or HUD-family audio.”

**Other §8 items still locked (cite, do not add):** subsystem targeting; wingmen clock / escort / directives; comm video in a duel; auto-aim; deleting HUD-01 glance; first-person-only combat HUD; FreeSpace green circle radar; rewriting Burn as a continuous tank; TGT-04 turrets; new HUD-03 settings; HUD-03 audio alerts.

---

## 2. Tokens, selectors, functions (canonical)

### 2.1 `#hud` tokens — `src/ui/hud.css` 8–26

| Token | Shipped value / role |
|---|---|
| `--rw-accent` | `#6ff2e0` beacon cyan |
| `--rw-warn` | `#ffb454` threat amber |
| `--rw-bad` | `#ff5252` danger red |
| `--rw-good` | `#7dd87d` salvage green |
| `--cyan` | `var(--rw-accent)` |
| `--amber` | `var(--rw-warn)` |
| `--red` | `var(--rw-bad)` |
| `--green` | `var(--rw-good)` |
| `--vein` | `#5fe08a` bio vein green |
| `--ember` | `#ff7a3c` feral ember |
| `--rw-text-scale` | set inline on `#hud` by `settings.js` (0.85 \| 1 \| 1.2 \| 1.5) |

### 2.2 Build helpers — `src/systems/hud.js`

| Function | Role |
|---|---|
| `el(tag, className, parent, text)` | `createElement` + `textContent` (not `innerHTML`) |
| `makeBar` | `.rw-meter` + `.rw-label` + `.rw-bar` / `.rw-bar-fill` |
| `makeHull` | 10 `.rw-petal` + `.rw-hull-flag` LOW/CRIT |
| `makeSpeed` | SPD + optional `.rw-match-lamp` |
| `makeFacing` | silhouette + FORE/AFT |
| `contactKind(hostile, isLock)` | `'lock' \| 'hostile' \| 'civ'` |
| `contactYawToU` / `contactArcPoint` / `contactsArcPath` | Wave F arc geometry |
| `toastForEvent` | event → `{ text, cls }` or `null` |
| `pushToast` | 5 slots, 4 s, `textContent` |
| `initHud(ctx)` | one-time DOM; returns `{ update(dt) }` |

Constants: `TEXT_UPDATE_INTERVAL = 0.2`, `TOAST_LIFETIME = 4`, `TOAST_SLOTS = 5`, `HULL_PETALS = 10`, `EDGE_MARGIN = 84`, `LEAD_MIN_SPEED = 6`, `CONTACT_SLOTS = 24`, `CONTACT_MK1_CAP = 16`, `CONTACT_CANDIDATES = 48`, `CONTACT_PULSE = 0.45`, `CONTACT_CLOSE_FLOOR = 4`, `CONTACT_ARC = { cx: 200, cy: -42, r: 102, half: 1.08, elev: 7 }`.

### 2.3 `ctx` flags / fields the HUD **reads**

From `src/core/ctx.js` + `hud.js` `update()`:

| Field | Writer (ctx.js) | HUD use |
|---|---|---|
| `ctx.flags.combat` | npc.js | `#hud.in-combat`; collapse Controls on rising edge; far-civilian fade on contacts |
| `ctx.flags.firstPerson` | controls.js (`camera === 'first'`) | `#hud.first-person`; reticle pinned to center |
| `ctx.flags.docked` | station.js | hide contacts arc; hide chart marks |
| `ctx.flags.matchSpeed` | ship.js | MATCH lamp on self SPD |
| `ctx.flags.camera` | controls.js | **not read by hud.js** — same overlay; ship.js places the camera |
| `ctx.world.scanner` | station.js / save sanitize (`??= 0` in `station.js`; **not** created in `createCtx`) | arc gate + Mk II closure + Q-ship pierce + numeric resolve |
| `ctx.player` | ship.js create; combat mutates | self Screen/Shell/hull/strain/engine |
| `ctx.ship.object` / `.speed` / `.velocity` | ship.js | lead relative vel, facing, contacts origin, POS, SPD |
| `ctx.targets.current` / `.reticleScreen` | controls.js | lock, bracket, lead, rails, RANGE |
| `ctx.input.weaponGroup` / `.throttle` | controls.js | WPN, lead TOF, Heat aux |
| `ctx.ships[]` | traffic / npc | contacts + Target prompt scan |
| `ctx.bio.*` | bio.js | Bio panel |
| `ctx.events` / `ctx.lastEvents` | any / main.js rotate | toasts, `playerHit` flash, `systemLoaded` banner |
| `ctx.settings.*` | settings.js | **HUD CSS does not read settings object**; it reacts to `body.rw-*` and `--rw-text-scale` |

---

## 3. Combat glance instruments (every named item)

Each row is a shipped instrument. Presentation cites the live selector. If a proposal still disagrees with code, the **code** is the inventory.

### 3.1 Self rail (HUD-01)

- **Nodes:** `section.rw-combat-rail.rw-combat-self` (`hud.js` 530–538).
- **Children:** `makeFacing`, SCREEN `.rw-screen`, SHELL `.rw-shell`, HULL petals, SPD (`makeSpeed`), WPN `.rw-combat-wpn`.
- **Layout:** `top: 57%`; `transform: translate(calc(-100% - 78px), 0)` (`hud.css` 769–784).
- **Skin today:** stroke rail — `background: transparent; border: none` (`hud.css` 769–779). Not a navy card.
- **Data:** `ctx.player.screen/shell/hull`; `ctx.ship.speed`; `WEAPON_KEYS[weaponGroup-1]`; mining name from `miningLaserFor(ctx.world.miningLaser)`.
- **MATCH lamp:** `span.rw-match-lamp` sibling of SPD value; text `'MATCH'`; hidden with `.is-hidden` unless `ctx.flags.matchSpeed && shipTgt` (`makeSpeed` 150–174, write at 1174). **No separate filled-tick node exists.** CSS is letter-spacing + cyan text only (`hud.css` 219–226).
- **Always on while HUD runs.** Not scanner-gated.

### 3.2 Target rail (HUD-01)

- **Nodes:** `section.rw-combat-rail.rw-combat-target` starts `.is-hidden` (`hud.js` 540–549).
- **Children:** `.rw-combat-name`, facing, SCREEN, SHELL, HULL, SPD, DIST `.rw-combat-dist`.
- **Dormant MATCH node:** `makeSpeed(tgtRail)` still builds a `.rw-match-lamp` (same helper as self). `tgtSpeed.set(targetSpeedNow)` passes no second arg, so the lamp stays `.is-hidden` (`hud.js` 546, 1352). HUD-02 must not treat that node as a second MATCH instrument.
- **Layout:** `transform: translate(78px, 0)` (`hud.css` 786–788). Meters `flex-direction: row-reverse`.
- **Show rule:** live ship lock only — `target.state && !destroyed && targetPos` (`hud.js` 796–801). Asteroids keep the **bracket**, never this rail.
- **Q-ship:** `rec.coverName` until `scanner >= 2` (`hud.js` 1333–1342).
- **DIST:** `Math.round(targetDistNow) + ' u'` — core, not scanner-gated.

### 3.3 Reticle hub

- **Nodes:** `.rw-reticle` with `.rw-reticle-pupil`, three `.rw-reticle-cilia`, `.rw-reticle-range` (`hud.js` 418–421). Separate `.rw-crosshair` + `.rw-crosshair-dot` (`422–423`).
- **Size:** `80px` hub, `margin: -40px` (`hud.css` 181–189). Clamp comment: “keep the 80 px hub on glass” (`hud.js` 775).
- **Hub stroke (mechanical):** `::before` dashed 1px circle; `.in-range::before` 2px solid (`hud.css` 192–202).
- **RANGE word:** `.rw-reticle-range` `display:none`; `.rw-reticle.in-range .rw-reticle-range { display: block }` (`204–217`). Text node is `'RANGE'`.
- **Living accent:** see §4. Crosshair is 1 px + 2 px dot (`359–387`).
- **First-person:** `#hud.first-person` from `ctx.flags.firstPerson` (`hud.js` 771–785). Reticle `rx/ry = 0`. Crosshair opacity 0.2 (`hud.css` 389).
- **Same overlay** chase / third / first (`hud.js` header 14–15). HUD does not swap instruments on `flags.camera`.

### 3.4 Lead

- **Nodes:** `.rw-lead.is-hidden` → `.rw-lead-ring` + `.rw-lead-label` `'LEAD'` (`hud.js` 436–438).
- **Skin:** 28×28 transparent box; 2px cyan **circle** + crossbars; label under (`hud.css` 475–527). **Not** an 8 px diamond (that was the proposal’s “keep” line in §5.4; the shipped mark is this ring).
- **Math (shipped):** selected `WEAPON_KEYS` speed; mining `speed` treated as 0 → hide; `relVel = targetVel − ctx.ship.velocity`; `tof = dist / wSpeed`; if `|relVel| > LEAD_MIN_SPEED` then `lead = targetPos + relVel * tof`, else mark stays on hull (`hud.js` 849–874). Comment: “Low relative speed still draws the mark on the hull.”
- **Show:** live ship lock, on-glass, projectile weapon. Core ship (no scanner test).
- **Not auto-aim.**

### 3.5 RANGE (hub pop, TGT-01)

- **Toggle:** `reticle.classList.toggle('in-range', inRange)` (`hud.js` 894–904).
- **Envelope:** cannon/disruptor `WEAPONS[wKey].range`; mining `miningLaserFor(ctx.world.miningLaser).range`.
- **Condition:** `shipTgt && range > 0 && targetDistNow <= range`.
- **Shape + text:** dashed hub vs solid hub + word `RANGE`. Color is redundant to the word.

### 3.6 MATCH (TGT-02)

- **Input:** `ctx.input.matchSpeedPressed` (controls.js, KeyX documented in `ctx.js` 83).
- **Flag:** `ctx.flags.matchSpeed` — ship.js toggles (`ship.js` 443–471, 633). Cancel: dock, jump, lost lock, `input.throttleHeld` (R/F).
- **Flight:** compute `fwdSpeed` from estimated lock world speed; creep floor → `0` without writing `input.fullStop`; cruise clamp `shipCfg.maxSpeed`; **no afterburner multiply** on this branch (`ship.js` 552–557).
- **HUD:** `selfSpeed.set(ctx.ship.speed, !!(ctx.flags.matchSpeed && shipTgt))` (`hud.js` 1174).
- **Camera:** MATCH does not change heading or camera mode.

### 3.7 FORE / AFT (Wave C)

- **Nodes:** `.rw-facing` > `.rw-facing-sil` (`.rw-facing-nose` + `.rw-facing-body`) + `.rw-facing-ends` (`.rw-facing-end.rw-facing-fore` / `.rw-facing-aft`) (`hud.js` 177–204).
- **Modes:** `'fore' | 'aft' | 'dim' | 'flash-fore' | 'flash-aft'`. Classes `.is-lit` / `.is-dim` / `.is-flash`.
- **Self steady:** `playerFwd · (lockPos − playerPos) >= 0` → FORE else AFT. **No lock: both dim** (flash may still run) (`hud.js` 907–927).
- **Lock steady:** lock forward `−Z` · (playerPos − lockPos) — same hemisphere test as combat facet (`919–922`).
- **Hit flash:** `playerHit` sets `selfHitFlashUntil = elapsed + 0.4`, `selfHitFlashAft = !!ev.fromAft` (`713–716`).
- **Skin:** nose is a CSS triangle; body is a hollow 1px box; lit end fill vs hollow + the word (`hud.css` 228–315). Color-blind: inset white ring on `.is-lit`.

### 3.8 Contacts arc (Wave F / TGT-03)

- **Nodes:** `.rw-contacts.is-hidden` > SVG `.rw-contacts-svg` viewBox `0 0 400 72` path `.rw-contacts-stroke` + 24 `.rw-contact-pip` (`.rw-contact-mark` + `.rw-contact-close`) (`hud.js` 489–519).
- **Layout:** `left: 50%; bottom: 5.5%; width: min(400px, 46vw); height: 72px` (`hud.css` 671–680). Thin stroke, `fill: none`. Comment: “Empty middle. No fill, no CRT grid.”
- **Gate:** `scanner >= 1`, not docked, ship object present. Tier 0: no arc.
- **Range / cap:** Mk I `U.ENCOUNTER_BUBBLE`, cap 16. Mk II `2 ×` bubble, cap 24 (`hud.js` 950–951).
- **Shapes (friend/foe is shape):**
  - civilian `.is-civ`: 2×8 tick (`hud.css` 710–715)
  - hostile `.is-hostile`: amber chevron (`717–725`)
  - lock `.is-lock`: 8px hollow diamond (`727–734`)
- **Mk II closure:** `.rw-contact-close` `«` / `»` when lock relative closing speed exceeds `CONTACT_CLOSE_FLOOR` (`1026–1041`).
- **Enter pulse:** first seen hostile → `.is-enter` for 0.45 s (`1047–1056`, `hud.css` 748–759).
- **Combat:** far non-hostile non-lock pips `.is-far` (`1009`).
- **Not** a reticle ring. Pips positioned in the contacts box via `contactArcPoint` (aft-centered yaw; forward at arc ends — `hud.js` 63–66).

### 3.9 Edge arrow

- **Node:** `.rw-edge-arrow` (`hud.js` 439). CSS triangle `::before` (`hud.css` 529–548).
- **When:** lock exists and is off-glass / behind camera (`hud.js` 875–890). `EDGE_MARGIN = 84`.
- **Core ship.** Not scanner-gated. Not restyled as a missile wedge.

### 3.10 Toasts and banner

- **Toasts:** `.rw-toasts` role=status aria-live=polite; 5 × `.rw-toast` (`hud.js` 461–468).
- **Parked off aim column:** `top: 14px; right: 168px; left: auto` (`hud.css` 588–594). Classes: `.comm .sting .warn .danger .good`.
- **Life:** 4 s; write `slot.el.textContent = text` (`677–696`).
- **Banner:** `.rw-banner` / `.rw-banner-name` / `.rw-banner-sub` (`hud.js` 472–476). Position injected in `ensureW2Styles`: `top: 96px; right: 14px; left: auto` (`334–339`). Fired from `lastEvents` `systemLoaded`.
- **Not combat-critical.** Stay off the vertical aim strip.

### 3.11 Hail / onboarding parking (Wave B; not `#hud` instruments)

- **Hail:** `document.body`, z-index 40, card `.rw-hail-card` `left:14px; bottom:22%; width:360px; max-width:min(360px,calc(100vw - 28px)); pointer-events:auto` (`hail.js` 104–113). Still 72 px portrait when `portraitFor` returns. Numbered intent buttons. **Not parented under `#hud`.**
- **Onboarding:** `document.body`, `.rw-onboard-hint`, `left:14px; top:48px; z-index:35; pointer-events:none` (`onboarding.js` 81–87). Gated by `ctx.settings.hints`. **Not under `#hud`.**
- These **free** the bottom-center slot that `.rw-contacts` now occupies.

### 3.12 Career fade

| Surface | Class | Combat opacity |
|---|---|---|
| Manifest `.rw-resources` | `.rw-fade` | `#hud.in-combat .rw-fade { opacity: 0.14 }` (`hud.css` 88) |
| Controls `.rw-controls` | `.rw-fade` | same + rising-edge collapse to `CONTROLS ▸` (`hud.js` 1127–1134) |
| Bio `.rw-bio` | `.rw-fade` (not `.rw-aux`) | 0.14 |
| POS `.rw-pos` | `.rw-fade` (not `.rw-aux`) | 0.14 |
| Chart marks `.rw-chartmark` | own rule | `#hud.in-combat .rw-chartmark { opacity: 0.14 }` (`586`) |
| Plant / Flight / Heat | `.rw-aux` | `#hud.in-combat .rw-aux { opacity: 0.38 }` (`815`) |

Controls click still toggles during combat (`pointer-events: auto` on `.rw-controls-toggle` only — `hud.css` 889–890). Combat **exit does not force-open**.

---

## 4. Already living

Quote the code. Do not grow this set in HUD-02 without an explicit skin pass.

| Piece | Evidence |
|---|---|
| Iris pupil | `.rw-reticle-pupil` 5×5 `background: var(--vein)` (`hud.css` 333–343); built in `hud.js` 419 |
| Three cilia | three `span.rw-reticle-cilia` (`hud.js` 420); rotations 30° / 150° / 270°, `translateY(-40px)` (`hud.css` 345–357); `rgba(95, 224, 138, 0.7)` |
| Iris accent spin | `.rw-reticle::after` dashed vein-tinted organic ellipse, `animation: rw-iris-spin 14s linear infinite` (`317–324`, `331`) |
| Vein color on Bio | `--vein: #5fe08a`; `.rw-bio` / `.rw-bio-title` / `.rw-hunger .rw-bar-fill` / `.rw-bio-icon` / `.rw-mood .rw-value` (`hud.css` 25, 849–872) |
| Reduced-motion yields | `body.rw-reduced-motion #hud, body.rw-reduced-motion #hud * { animation: none !important; transition: none !important; }` (`972–978`). Extra explicit kills: facing flash (`302–305`), contact enter (`757–759`) |

**`@keyframes rw-breathe` exists (`hud.css` 326–329) but no selector assigns `animation: rw-breathe`.** The reduced-motion comment names “iris breathe/spin”; **only spin is attached.** HUD-02 must not treat breathe as a shipped instrument unless it binds this unused keyframe.

Living **ship** breath (flesh scale / veins) lives in `ship.js`, not in the HUD overlay. Do not cite it as a HUD instrument.

---

## 5. Already mechanical

| Piece | Evidence |
|---|---|
| Stroke rails | `.rw-combat-rail` transparent, no border, no blur (`hud.css` 769–779). Contrast override keeps them transparent (`967–970`) |
| Dashed hub | `.rw-reticle::before` dashed; `.in-range` solid (`192–202`) |
| Facing chevrons | `.rw-facing-nose` triangle + hollow `.rw-facing-body`; FORE/AFT fill vs hollow (`236–287`) |
| Contact tick / chevron / diamond | `.is-civ` tick, `.is-hostile` chevron, `.is-lock` rotated hollow square (`710–734`) |
| Also mechanical (supporting) | `.rw-lead-ring` circle+cross; `.rw-edge-arrow` triangle; `.rw-corner` bracket; hull `.rw-petal` blocks; Screen thin track vs Shell thick track (`.rw-screen` height 3px / `.rw-shell` height 9px, `hud.css` 111–116) |

---

## 6. HUD-03 settings that already exist (`body.rw-*`)

`src/systems/settings.js` is the only writer of `ctx.settings`. `apply()` (`66–70`):

```
document.body.classList.toggle('rw-colorblind', s.colorblind);
document.body.classList.toggle('rw-contrast', s.highContrast);
document.body.classList.toggle('rw-reduced-motion', s.reducedMotion);
if (hudEl) hudEl.style.setProperty('--rw-text-scale', String(s.textScale));
```

| Body / CSS hook | Setting key | What it does |
|---|---|---|
| `body.rw-colorblind` | `colorblind` | Okabe-Ito remap of `--rw-accent/warn/bad/good` on `#hud` (`hud.css` 937–942); facing lit/dim extra (`307–315`) |
| `body.rw-contrast` | `highContrast` | brighter `--white` / `--dim`, stronger panels (`946–970`); contacts stroke (`761–763`) |
| `body.rw-reduced-motion` | `reducedMotion` | kill HUD animations/transitions (`972–978`) |
| `#hud { --rw-text-scale }` | `textScale` ∈ {0.85, 1, 1.2, 1.5} | every `calc(Npx * var(--rw-text-scale, 1))` |

Also stored (not `body.rw-*`): `muted`, `masterVolume` (song.js), `hints` (onboarding.js). Proposal §8: do not add new HUD-03 settings or HUD-03 audio alerts.

---

## 7. Camera / MATCH (ship.js only — HUD overlay does not swap)

From `src/systems/ship.js`:

| Mode | Constants | Behavior |
|---|---|---|
| Chase | `_camOffset (0, 4, 12)`, `LOOK_AHEAD = 25` | on-axis follow; flesh **visible** |
| Third | `THIRD_HEIGHT = 18`, `THIRD_BACK = 10`, `THIRD_LOOK_AHEAD = 16`, `THIRD_SHIP_SCALE = 0.55` | above and behind; visual scale only |
| First | `FIRST_PERSON_NOSE = (0, 0.45, -2.8)` exported | flesh/hull/scars/`underLight` **hidden**; camera at nose |

`C` cycle is controls.js → `flags.camera` `'chase' \| 'third' \| 'first'` and `flags.firstPerson` (`ctx.js` 169–170). HUD only recenters the reticle when first-person.

FOV kick on afterburner still runs (`ship.js` 779–784) independently of HUD skin.

---

## 8. Supporting HUD furniture (exists; not the glance set)

Do not promote these to HUD-02 combat chrome.

- **Target bracket** `.rw-target` + four `.rw-corner` + name/meta/resolve. Bands `defiant|shaken|bargaining|capitulate|neutral` change corner style (`hud.css` 423–427). Asteroid ore + `.ore-blocked`.
- **Context prompt** `.rw-prompt` `bottom: 20%` (above the arc). Verbs: Dock / Jump / Hail / Target (`hud.js` 1355–1404).
- **Jump charge** `.rw-jump` (injected W2 styles) — center bar while `ctx.gate.jumping`. Not a combat instrument.
- **Chart marks** `.rw-chartmark` — career POI; dim in combat.
- **Plant / Flight / Heat** `.rw-aux` — STRAIN/ENGINE, THR/BURN/DRIFT, Heat STRAIN %. Burn stays READY/BURNING/COOLDOWN discrete states.

---

## 9. HUD sinks HUD-02 must not worsen

Shipped HUD writes **`textContent` / `classList` / `dataset` only**. There is **no `innerHTML` in `hud.js`**.

Untrusted-or-world strings that already land in DOM (keep as text, never HTML):

| Sink | File:line | Source |
|---|---|---|
| Toast body | `hud.js` 695, `toastForEvent` 216–224 | `e.text` / `e.line` (`commLine`, clues, hail-adjacent lines) |
| Banner name/sub | `hud.js` 738–739 | `SYSTEMS[e.to].name`, `FACTIONS[def.faction].name` |
| Jump label | `hud.js` 760 | `SYSTEMS[destId].name` |
| Bracket / rail names | `hud.js` 1277, 1315, 1338–1342 | `rec.name`, `rec.coverName`, `st.name` |
| Chart labels | `hud.js` 1146–1148 | authored `lm.name` |
| Prompt dest | `hud.js` 1362–1368 | `SYSTEMS[nearTo].name` |
| Bio mood class | `hud.js` 1239 | `'rw-bio-icon m-' + mood` |
| Contact class | `hud.js` 1014 | `'rw-contact-pip is-' + kind` (`kind` is enum only) |
| Hail header / line / img.alt | `hail.js` 342–362 | `record.pilot`, `st.name`, `ev.line` (not `#hud`, same player-visible channel) |

Prototype-key lookups (plain objects, not `Object.create(null)`): `SYSTEMS[e.to]`, `SYSTEMS[ctx.world.currentSystem]`, `SYSTEMS[ctx.gate.nearTo]`, `FACTIONS[key]`, `COMMODITIES[target.commodity]`, `BAND_LABEL[band]`, `known[e.kind]` in `worldEvent`. HUD-02 must not turn these keys into `innerHTML` or unsanitized `className` from raw records.

---

## 10. What HUD-02 may cite vs must not invent

**Cite (real):** self rail, target rail, 80 px dashed/solid hub, pupil + three cilia + spinning `::after`, RANGE word, MATCH text lamp, FORE/AFT silhouette, lead ring+LEAD, edge arrow, bottom contacts arc + tick/chevron/diamond, toasts/banner off-column, Hail lower-left, onboarding top-left, career `.rw-fade` / `.rw-aux`, `body.rw-*`.

**Do not invent:** GSE triad, four-face shields, missiles / aspect lock, contacts ring around the reticle, tendrils across the aim glass, MATCH writing throttle, scanner-gated lead, a second HUD per camera, unused `rw-breathe` as if it already runs, a filled MATCH tick node that is not in the DOM.

**If unsure later:** quote `hud.js` / `hud.css`. Do not restore Appendix B’s pre-wave lead bug (`WEAPONS.cannon.speed` / world-speed hide) — that description is historical. Shipped lead is relative + selected weapon (`hud.js` 849–863).
