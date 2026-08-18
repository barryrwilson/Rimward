---
title: "RIMWARD HUD utility change proposal"
status: IMPLEMENTED
date: 2026-08-17
related:
  - docs/space-sim-hud-styles-research-2026-08-17.md
  - docs/PLAYER-EXPERIENCE-WISHLIST.md
  - src/systems/hud.js
  - src/ui/hud.css
  - src/systems/ship.js
  - src/systems/hail.js
  - src/systems/onboarding.js
  - src/systems/combat.js
  - src/systems/controls.js
  - src/game/state.js
  - out/hud-research/live-combat.png
  - out/hud-research/fs1-asteroids.jpg
  - out/hud-research/fs1-energy.jpg
  - out/hud-research/fs1-shields.png
  - out/hud-research/fs1-training-reticle.jpg
---

# HUD utility change proposal

**Status:** IMPLEMENTED (waves A–F landed 2026-08-17). HUD-02 skins remain later. The body below is the frozen design of record; A–F are now in the working tree.  
**Date:** 2026-08-17  
**Owner question this answers:** how does RIMWARD combat get FreeSpace-level *utility* (glance path, thin instruments, facing, range, 360° awareness, threat) without copying the 1998 FreeSpace HUD?

This is an implementation-ready design. It does not invent systems the game does not have. It does not replace HUD-01 glance placement. It does not change game source; later waves implement the write-sets below.

**Decisions locked in this revision (not open questions):**

- Wave F default is a **thin bottom bearing arc** in the slot Wave B frees. The middle stays empty. A reticle-centered ring is not the default.
- TGT-01: the **core ship** gets honest lead + range + MATCH. Scanner buys awareness only. This **replaces** the wishlist clause that gates the pip behind an upgrade.
- Wave C facing uses the frozen table in §5.7. No lock: both self ends dim.
- Match-speed never writes `ctx.input.throttle` from `ship.js`. See §5.6.
- **Three cameras, one HUD.** `C` cycles **chase → third → first → chase**. Chase is the current on-axis follow (`_camOffset (0, 4, 12)`). **Third** is above and behind at a **steeper angle** than the first 29° follow (height 18, back 10). The hull sits **centered in the bottom 25%** and is **scaled to 0.55** (visual only). Not a straight-down view. First-person stays cockpitless. The overlay does not swap when `C` changes the camera.

**Stills addendum (2026-08-17):** `out/hud-research/fs1-energy.jpg`, `out/hud-research/fs1-shields.png`, and `out/hud-research/fs1-training-reticle.jpg` are evidence. They fold into Waves A / C and the out-of-scope table. They do **not** add a Wave G. They do **not** reopen the locked decisions above.

## Related docs

| Document | Role |
|---|---|
| [docs/space-sim-hud-styles-research-2026-08-17.md](space-sim-hud-styles-research-2026-08-17.md) | FreeSpace rules vs chrome; live 1600×900 comparison; 2026-08-17 stills addendum; recommended pass 1–7 (all still open; 1–3 strengthened) |
| [docs/PLAYER-EXPERIENCE-WISHLIST.md](PLAYER-EXPERIENCE-WISHLIST.md) | HUD-01 / HUD-02 / HUD-03; TGT-01 / TGT-02 / TGT-03; first-wave sequence |
| `src/systems/hud.js`, `src/ui/hud.css` | Current HUD-01 rails, reticle, lead, bracket, fade rules |
| `out/hud-research/live-combat.png` | 2026-08-17 live combat frame (lock on Vesper-9). **Chase composition.** It cannot judge first-person empty glass. |
| `out/hud-research/fs1-asteroids.jpg` | FreeSpace asteroid still used as the *layout* reference, not the art target |
| `out/hud-research/fs1-energy.jpg` | Training still of G/S/E vertical energy bars. **Evidence, not a sim.** Plant / Flight / Heat stay `.rw-aux`. Do not invent a GSE triplet. |
| `out/hud-research/fs1-shields.png` | Training still of four-quadrant shield transfer (F5–F8). **Take the facing glance.** Do not add four faces. See §5.7. |
| `out/hud-research/fs1-training-reticle.jpg` | Training still of a large empty hub, aspect-lock ring, and off-glass weapons list. **Take hub + off-glass list.** Do not add aspect-lock or a missile timer. |

---

## 1. Problem

HUD-01 already has the correct *glance path*. Player vitals sit in `.rw-combat-self` and target vitals sit in `.rw-combat-target`, both at `top: 57%`, offset 78 px from center (`src/ui/hud.css`). That is the FreeSpace idea: eyes stay near the reticle.

The live duel still fails because **placement is not the same as utility**.

| What HUD-01 got right | Why a duel still fails |
|---|---|
| Overlay HUD, no cockpit cage | Rails are **opaque navy cards** (`background: rgba(2, 6, 13, 0.55)`). They cover the ecliptic and the shot path. |
| Screen / Shell / hull / SPD / WPN / DIST on the rails | Those values sit in boxed career furniture, not thin instruments. The eye leaves the ship to parse a card. |
| Reticle + lead mechanism + edge arrow | Reticle is a **46 px organic iris**. Lead is **hidden when `targetVel.length() <= 6`** (world speed, not relative) and always uses `WEAPONS.cannon.speed` (900). Combat fire uses the selected weapon (`combat.js` `GROUP_WEAPON[ctx.input.weaponGroup]`). Disruptor shots (700) and mining beams (range from `miningLaserFor`) do not match the pip. |
| Career fade on `.rw-fade` / `.rw-aux` | Controls stay a **14-line list** (measured **~280×260** in the 1600×900 capture) at 0.14 opacity. Toasts sit **top-center** on the aim column. `.rw-banner` also sits on the aim column (`top: 13%` / `left: 50%`). **Bio and POS do not fade** — they are not `.rw-aux` / `.rw-fade`. |
| Bracket, resolve bands, Q-ship pierce, ore NEEDS | No facing. No Fore / Aft. `playerHit { fromAft }` is unused by the HUD. Screen/Shell bars do not say *which way the ship is pointed*. |
| Overlay, not a cage | First-person camera sits **inside the hull volume**. `ship.js` `_noseOffset (0, 0.35, -1.7)` is inside the living hull (hull Z radius ~2.1; eyes at `z = -1.45`). `flesh.visible = false` is not enough. The 2026-08-17 `live-combat.png` still is **chase** (`_camOffset (0, 4, 12)`, `LOOK_AHEAD = 25`) and **cannot judge empty first-person glass**. Wave E still stands from the `ship.js` offsets. |
| — | **No 360° awareness instrument.** Hail (`hail.js` card `bottom: 4%`) and onboarding (`onboarding.js` line `bottom: 6%`) occupy the radar / contacts slot. They are **not** under `#hud`. |

Research pass 1–7 is still open. The owner is unhappy with the new HUD because it is a **boxed career HUD with a combat insert**, not a **thin instrument set around empty aim glass**.

**Keep, do not replace:** overlay HUD; mirrored HUD-01 glance; Screen / Shell / hull petals + LOW/CRIT; SPD; WPN; DIST; band-shaped brackets; edge arrow; lead *mechanism*; career fade contract; color+shape pairing; 5 Hz write-on-change; Q-ship pierce; ore NEEDS; collapsible controls *toggle*; toast combat events.

---

## 2. Utility rules we keep from FreeSpace

Take the *rules*, not the 1998 art. These are the same rules already named in the research executive conclusion and in HUD-01 / TGT.

1. **The eye stays on the target.** Player state is a short glance left of the reticle. Target state is a short glance right. Range, weapon, and speed live in that same cluster.
2. **The aim glass stays empty.** Thin lines. No card fill over the ship, lead pip, or projectile path. No reticle-centered contacts ring as the default (see §5.9).
3. **Shape carries meaning.** Shield layers, hull, facing, range-in/out, and threat must read without color alone (already a RIMWARD rule: `hud.js` header, §18.4).
4. **One HUD color family.** Beacon cyan (`--rw-accent`) plus warn / danger / good. Not a rainbow. Not CRT green as a required look.
5. **Career yields in a duel.** Manifest, Controls, Bio, POS, chart marks, and tutorial copy fade, collapse, or leave the fight volume.
6. **360° awareness.** The player can see a threat behind the ship without a look-behind camera. RIMWARD will do this with a *contacts instrument*, not a cloned FreeSpace radar disc.
7. **Facing is a glance, not a number.** The player can tell Fore from Aft on self and lock without reading a table.
8. **The player can remove unused chrome.** Experts keep a clean screen. Controls auto-collapse in combat. HUD-03 scale / contrast / color-blind / reduced-motion already exist (`settings.js`, `body.rw-*`) and stay.
9. **One HUD on three cameras.** Chase, **third** (above and behind, steeper than chase), and first-person share the same instruments in the same places. A multi-ship duel needs the player hull and weapon hit paths on screen. **Third** is the view that shows those. First-person must not get a different combat HUD. Wave E must not hide the hull in chase or third.

---

## 3. What we will not copy

| FreeSpace chrome | Why it stays out |
|---|---|
| CRT green overlay / 1998 gauge dump | RIMWARD already has a palette (void, beacon cyan, wake blue, threat amber, vein green). One family is enough. |
| Four-quadrant shield transfer as a required skill | `out/hud-research/fs1-shields.png` shows F5–F8 dump / equalize. The sim is **two layers**, Screen then Shell (`DEFENSE` in `state.js`). Hits already use facet `'fore' \| 'aft'` only (`applyHit`, `aftEngineMult: 2`). **Take the facing glance.** Do not add four faces or energy transfer. |
| G / S / E power triad | `out/hud-research/fs1-energy.jpg` shows three dedicated vertical pools. No guns / shields / engines power split exists. Heat is **Strain**. Burn is discrete **READY / BURNING / COOLDOWN**, not a tank. Plant / Flight / Heat stay `.rw-aux`. Do not invent a third energy currency. |
| Heat-seek / aspect-lock missiles, lock box, missile-warning gauge | `out/hud-research/fs1-training-reticle.jpg` shows hold-target-in-the-ring plus a 13 s Interceptorz timer. No missiles. SHP-03 may add them later. Out of this HUD. **Take** the large thin hub and the off-glass weapons list only. |
| Comm video in a duel | Hail is already a **still** 72 px faction portrait plus text (`hail.js`). Do not add a talking-head video on the aim glass. |
| Wingmen clock, escort list, directives stack, kills gauge, lag gauge | No wingmen. No mission-clock HUD. Do not invent them. |
| Bottom-center **green circle radar** with friend/foe blips in a 2D disc | That is the 1998 instrument. Wave F proposes a RIMWARD **thin bottom bearing arc** with the same *utility*. No fill. No CRT grid. |
| Cockpit cage, cinematic VDU pair, Elite-style hologram dash | Wrong family for a 6DOF browser duel. Career panels already cover sandbox work. |

---

## 4. Current vs target zone map

Coordinates below are from the 2026-08-17 1600×900 capture and current CSS. Target is utility, not pixel-perfect FreeSpace.

| Zone | Current (live + CSS) | Target |
|---|---|---|
| Center | 46 px organic iris (`.rw-reticle`); lead hidden if target world speed ≤ 6 u/s; always cannon TOF | Larger thin hub (see Wave A). Living iris remains a **small** accent. Lead from **selected** weapon, **relative** motion (Wave D). Range pop on the hub. **No contacts ring around the reticle.** |
| Left of reticle | Opaque `.rw-combat-self` card: Screen, Shell, petals, SPD, WPN | Same data, **stroke rail**. Optional Fore/Aft self silhouette above the bars (Wave C). Match-speed lamp on SPD (Wave D). |
| Right of reticle | Opaque `.rw-combat-target` card: name, Screen, Shell, petals, SPD, DIST | Same data, **stroke rail**. Optional lock silhouette + Fore/Aft (Wave C). DIST stays standard (HUD-01). |
| Beside / on reticle | No range-in cue; lead uses cannon | Range pop + lead pip as the aiming pair (Wave D). Contacts stay off this zone. |
| Bottom center | Hail card `bottom: 4%` (not under `#hud`); onboarding `bottom: 6%` (not under `#hud`); `#hud` prompt at `bottom: 17%` | Wave B empties the slot. Wave F places a **thin bottom bearing arc** here. The middle / aim glass stays empty. Context prompt (Dock / Jump / Hail / Target) stays **above** the arc. |
| Lower left | Plant / Flight / Heat `.rw-aux` at 0.38 in combat | Stay as career/flight aux; remain dim. Hail card parks here when open (Wave B), **above** `.rw-bottom`, so Plant / Flight / Heat stay readable. |
| Lower right | **Bio + POS at full opacity** | Same panels, **`.rw-fade` at 0.14** in combat (Wave A). Do not use `.rw-aux`. |
| Top left | Full Controls, **14-line** list, measured **~280×260** in the 1600×900 capture, opacity 0.14 | Auto-collapsed glyph on **rising edge** of combat; expand on click (Wave A). Do not force-open on combat exit. |
| Top right | Manifest `.rw-fade` (UU / FEAR / CARGO) | Keep. Already correct fade. |
| Top center | Toasts at `top: 7%`, centered on the aim column; `.rw-banner` at `top: 13%` / `left: 50%` | Short toasts **and** `.rw-banner` **off the aim column** (Wave A). |
| Edges | Off-screen lock arrow (`.rw-edge-arrow`) | Keep on the **core** ship. Wave F may add hostile-intent ticks on the contacts **arc**, not a second arrow language. |
| First-person glass | Camera inside hull volume (`ship.js` `_noseOffset`) | Empty glass (Wave E). The 2026-08-17 still is chase and cannot judge this zone. |
| Chase | On-axis follow (`_camOffset (0, 4, 12)`). Same boxed HUD. | Same HUD overlay. Hull stays visible. |
| Third | First follow was too shallow and too far aft. | **Above and behind**, ~61° elevation, look-ahead 16. Ship **centered in the bottom 25%**. Hull visual scale **0.55**. Same HUD. |

---

## 5. Proposed instruments

Each instrument names purpose, data source, presentation, and combat vs career behavior. Rails data (Screen, Shell, hull, speed, weapon, DIST) stays.

### 5.1 Self rail (HUD-01, keep)

- **Purpose:** Player Screen, Shell, hull, speed, and current weapon without leaving the reticle.
- **Data:** `ctx.player` (`screen` / `screenMax`, `shell` / `shellMax`, `hull` / `hullMax`); `ctx.ship` speed (existing `makeSpeed`); `ctx.input.weaponGroup` → `WEAPON_KEYS` / `miningLaserFor(ctx.world.miningLaser)` (already on the rail).
- **Presentation:** Same labels (SCREEN, SHELL, HULL petals + LOW/CRIT, SPD, WPN). Drop the card fill and hard panel edge. Thin tracks, no `backdrop-filter` on the rail. Screen stays the thin track; Shell stays the thick track.
- **Combat vs career:** Always on while flying. Not gated by scanner. Career does not add extra rows here.

### 5.2 Target rail (HUD-01, keep)

- **Purpose:** Lock identity, Screen, Shell, hull, speed, DIST.
- **Data:** `ctx.targets.current` ship state + `targetDistNow` / `targetSpeedNow` already computed in `hud.js`. Q-ship cover name until `ctx.world.scanner >= 2` (keep). Hide for no lock, destroyed, or asteroid (keep).
- **Presentation:** Stroke rail, mirrored. Name stays one line. DIST stays `N u`.
- **Combat vs career:** Visible only with a live ship lock. Asteroids keep the bracket ore readout, never this rail.

### 5.3 Reticle hub

- **Purpose:** Aim point large enough to be the hub; still open in the middle so the lead pip and target are visible.
- **Data:** Viewport center (existing). First-person class `#hud.first-person` already exists.
- **Presentation:** Enlarge from 46 px to about **72–88 px**. Thin circular or near-circular stroke. Keep the 1 px center crosshair. **Shrink the living iris** to the pupil / three cilia only — an accent, not the whole HUD. Acceptance picture: `out/hud-research/fs1-training-reticle.jpg` — **large thin hub, empty middle**, chrome parked off the glass. Do **not** copy that still’s aspect-lock diamond or missile timer. Range-in (Wave D) changes the hub from dashed/open to a short solid tick plus the word `RANGE` (shape + text).
- **Combat vs career:** Always present in flight. Reduced-motion already kills iris spin (`body.rw-reduced-motion`).
- **Not a contacts host:** do not grow the hub into a bearing ring. Rails sit 78 px off center (`top: 57%`). A 22–28% short-side ring would cross those rails.

### 5.4 Lead pip (TGT-01, fix)

- **Purpose:** Show where to aim so the *selected* weapon arrives on the moving lock.
- **Decision (replaces TGT-01 “upgrade gates the pip”):** the **core ship** gets honest lead + range pop + MATCH. Scanner buys awareness only (Wave F contacts). Off-screen arrows stay on the core ship. Do not gate the pip or MATCH on `scanner >= 1`.
- **Data today (wrong):** `tof = dist / WEAPONS.cannon.speed` (`hud.js` ~line 700). Hidden when `targetVel.length() <= LEAD_MIN_SPEED` (6) — **world** target speed, and no player velocity in the lead point.
- **Data target:** Same `WEAPON_KEYS` / `weaponGroup` the rail and `combat.js` already use.
  - Energy cannon: `speed` 900, `range` 500.
  - Disruptor: `speed` 700, `range` 350.
  - Mining: `speed` 0 (beam). **Hide the pip.** Range pop uses `miningLaserFor(ctx.world.miningLaser).range`.
- **Lead formula (first-order relative; do not invent a new family):**
  - `relVel = targetVel − playerVel`
  - Hide the pip when `|relVel| <` floor (keep `LEAD_MIN_SPEED` ~6 u/s unless playtest says otherwise).
  - `tof = dist /` selected weapon `speed`.
  - `lead = targetPos + relVel * tof`.
  - **No intercept iteration** unless playtest fails this first-order relative formula.
- **Why relative:** after MATCH, a tail chase has large world speed and small relative speed. A world-`targetVel` hide keeps the pip on; a world-`targetVel` lead walks ahead of where the shot will meet.
- **Presentation:** Keep the 8 px cyan diamond (`.rw-lead`). Do not grow it. Do not auto-aim.
- **Combat vs career:** Show when a lock is on-glass, the selected weapon has a projectile speed, and `|relVel|` is above the floor. Mining always hides the pip.

### 5.5 Range pop (TGT-01)

- **Purpose:** The reticle / lead state *pops* when the lock is inside the selected weapon’s effective range.
- **Data:** `targetDistNow` vs `WEAPONS[wKey].range` or installed mining head range. Already known; not shown as a hub state today.
- **Presentation:** Hub tick + `RANGE` label. Out of range: open / dashed hub, no word. Color is redundant to the word. DIST on the rail stays the numeric truth.
- **Combat vs career:** Flight only, lock only. On the **core** ship (same TGT-01 decision as §5.4).

### 5.6 Match-speed lamp + control (TGT-02)

- **Purpose:** Hold the lock’s speed so the lead pip stops walking and guns stay in envelope.
- **No match-speed exists today** — this is a new control, not a restyle.
- **`ctx` ownership (required):** `ctx.input` is written **only** by `controls.js`. `ship.js` **must not** write `ctx.input.throttle`. Speed is not a hold on the input object.

**Contract**

1. `controls.js` writes a **one-frame** `input.matchSpeedPressed` edge (KeyX if the owner accepts Q1).
2. `flags.matchSpeed` lives on `ctx` (document it in `ctx.js`). **Writer:** `ship.js` (toggle). `npc.js` does **not** own this flag. `controls.js` may write the flag **only** if the design is later changed to “toggle only in controls” — default writer is `ship.js`.
3. In `ship.js`, when the flag is set and a **live ship lock** exists, compute `fwdSpeed` from lock speed **inside** the flight step. Do not write `ctx.input.throttle`.
4. Clear `fullStop` while matching a lock at or above creep. Do not auto-fire afterburner. Do not change heading. Cancel on lost / destroyed lock, dock, jump, or the same key (rising `matchSpeedPressed` while already on).
5. If the player holds **R** or **F**, cancel MATCH (player throttle wins).
6. If lock speed **&lt; creep** (creep is 30): use **`fullStop`** as the documented floor. MATCH stays lit. If lock speed **&gt; cruise** (cruise is 120): clamp `fwdSpeed` to cruise, keep MATCH lit, do not burn.

- **Presentation:** Lamp on the self-rail SPD row: `MATCH` when active (text + filled tick). Inactive: no extra chrome.
- **Combat vs career:** Useful in a duel and in formation-ish traffic. Lamp only when a lock exists and the flag is on. On the **core** ship (same TGT-01 decision as §5.4).

### 5.7 Facing / silhouette (HUD-only Fore / Aft)

- **Purpose:** Glance whether self and lock present Fore or Aft. Aft hits already double engine damage (`DEFENSE.aftEngineMult`).
- **Do not add:** four shield faces, transfer keys, per-quadrant pools. Do not rotate a 3D mesh to “show heading.” `out/hud-research/fs1-shields.png` is the four-quadrant training still. **Take** the facing glance. **Reject** F5–F8 transfer and four faces. The frozen table below already matches Screen + Shell + `fromAft`.
- **Decision:** the table below is frozen. “Heading vs world” is **not** an implementer choice. **No lock:** both self ends dim.

| Glyph | Test | Same as |
|---|---|---|
| Self FORE/AFT (steady) | Lock in player forward vs rear hemisphere | Player forward · (lockPos − playerPos) |
| Lock FORE/AFT (steady) | Player in lock forward vs rear hemisphere | `combat.js` facet on the lock |
| Hit flash | `playerHit.fromAft` | Existing emit |

- **Data (exists, unused by HUD):**
  - Combat already classifies facet `'fore' | 'aft'` in `combat.js` (`_targetFwd` local `-Z` vs shooter).
  - `playerHit` payload `{ damage, family, fromAft, shielded }` — HUD does not listen.
  - Player / lock forward: `object.quaternion` applied to `(0, 0, -1)`.
- **Presentation:** Small ship outline above each rail (or a chevron pair). One axis only: **FORE** lit toward the nose, **AFT** lit toward the tail. On `playerHit`, flash the struck end for ~0.4 s (shape + the word FORE/AFT). Screen/Shell **bars stay**, secondary to the silhouette.
- **Combat vs career:** Silhouettes on whenever the matching rail is on. Hit flash only in combat / on hit. No lock: self FORE/AFT both dim; lock silhouette hidden with the target rail.

### 5.8 Edge arrow (keep)

- **Purpose:** Point at the lock when it leaves the glass.
- **Data:** Existing NDC / behind-camera flip in `hud.js`.
- **Presentation:** Keep `.rw-edge-arrow`. Do not restyle into a missile wedge.
- **Combat vs career:** Lock only. Stays on the **core** ship (same override as the pip).

### 5.9 Contacts instrument (Wave F — not a FreeSpace radar)

- **Purpose:** Same utility as FreeSpace’s 360° radar: know what is around the ship, especially behind, without looking away from the aim glass.
- **Data:** `ctx.ships[]` (`object.position`, `state`, `ai.intent`, `record` / faction). Player position / quaternion from `ctx.ship.object`. Lock is `ctx.targets.current`. Combat already means `ai.intent && distance < U.ENCOUNTER_BUBBLE` (800) in `npc.js`.
- **Layout decision (locked):** default Wave F to a **thin bottom bearing arc** in the slot Wave B frees (research pass 4). **Keep the middle empty.** Do **not** ship a 22–28% short-side reticle ring as the default. At 1600×900 that ring is ~198–252 px radius; rails sit at `top: 57%` (63 px below center) and the 3 o’clock / 9 o’clock arc lands on the rails, lock, lead, and shot path. That breaks utility rule 2 and HUD-01 empty glass.
- **If the owner later wants a reticle ring:** it must stay inside the **78 px rail gap** (hub-sized, not 22–28% of the short side), and pips must stay **off the rails**. That option is later, not Wave F default.
- **Presentation (RIMWARD, not a green disc):**
  - Thin **bottom** bearing arc. Empty above it. No filled circle. No CRT grid.
  - Each nearby ship is a **pip on the arc** at relative yaw. Elevation is a short inward/outward notch, not a second map.
  - Shape language: civilian = small tick; `ai.intent` hostile = chevron; current lock = hollow diamond (same family as the lead pip). Rear-hemisphere hostiles sit on the lower/center of the arc and may pulse **once** when they first enter the bubble.
  - Range is **not** a second radar radius for every blip. DIST on the lock rail remains the number. Optional Mk II: a one-glyph closure arrow on the lock pip only.
  - Friend / foe color is redundant to shape. Use existing warn / dim / cyan. No green-friend / red-foe / blue-transit triad copied from Wikipedia’s FreeSpace radar.
- **Combat vs career:** Dim or hide while docked. In career flight, show nearby traffic as ticks (sandbox awareness). In combat, hostiles stay bright; far friendlies fade.
- **Tiers:** see Wave F / TGT-03. Core ships still get DIST + edge arrow + HUD-01 + Wave D lead / range / MATCH. The **arc** is a sensor upgrade, not a free HUD-01 readout.

### 5.10 Threat / hit cue

- **Purpose:** Know you were struck, and from which end.
- **Data:** `playerHit.fromAft` (unused today). Existing toasts already cover `shieldDown` / `engineOut` for the player.
- **Presentation:** Silhouette flash (5.7). Optional 1-frame edge wash already reserved in the `combat.js` comment (“HUD owns all pixels”). Pair with existing danger toasts. Do not add a missile-warning gauge.
- **Combat vs career:** Hits only.

### 5.11 Controls, toasts, Bio, POS, Manifest

- **Controls:** `ctx.config.controls` (**14 lines** from `controls.js`; measured **~280×260** in the 1600×900 capture — live box, not a CSS height; CSS is `max-width: 280px` only). Today: `.rw-fade` at 0.14, list still open. Target: collapse on the **rising edge** of `ctx.flags.combat` to header glyph `CONTROLS ▸` only. **Do not force-open on combat exit.** Click still toggles during the fight (`pointer-events: auto` on the toggle — keep).
- **Toasts:** `.rw-toasts` at `top: 7%` / `left: 50%`. Target: park under Manifest (top-right) or as a short stack just left of Manifest. Off the vertical aim column. Keep 4 s life, 5 slots, event copy in `toastForEvent`.
- **Banner:** `.rw-banner` is `top: 13%` / `left: 50%` (system arrival). Park **with the toasts**, off-center, in Wave A. Do not leave it on the aim column.
- **Bio / POS:** `.rw-bio` and `.rw-pos` sit in `.rw-side-col` with **no** `.rw-fade` / `.rw-aux`. Target: add **`.rw-fade`** so they fade to **0.14**. Do **not** use `.rw-aux` (0.38). Do not delete. Hunger / wounds / mood still matter after the fight.
- **Manifest:** already `.rw-fade`. Keep.

### 5.12 Hail and onboarding (not HUD instruments, but they steal the slot)

- **Hail today:** `hail.js` builds a 560 px card at `bottom: 4%` on `document.body`, `z-index: 40`. Live world, numbered intents, optional 72 px still portrait. **Not under `#hud`.**
- **Onboarding today:** `onboarding.js` builds a one-line hint at `bottom: 6%` on `document.body`, `z-index: 35`. Gated by `ctx.settings.hints`.
- **Hail target (locked):** lower-left card, **`max-width: 360px`**, bottom **above** `.rw-bottom`. Use **`bottom: 22%`** or **`left: 14px; bottom: calc(12px + aux-stack)`**. Plant / Flight / Heat stay readable. `pointer-events` only on the card. Keep the still portrait on the card. Do not promote it into FreeSpace comm video.
- **Onboarding target:** a **top-left** line under the Controls header, or a toast-family line off-center.
- Wave B is this move. Contacts do not ship until the slot is empty.

### 5.13 Context prompt (keep, nudge)

- **Purpose:** One verb (Dock / Jump / Hail / Target) from existing priority in `hud.js`.
- **Presentation:** Keep `.rw-prompt`. Raise it **above** Wave F’s bottom bearing arc. Never share pixels with Hail.

### 5.14 Flight aux (keep)

- Plant (STRAIN, ENGINE), Flight (THR, BURN READY/BURNING/COOLDOWN, DRIFT), Heat (STRAIN %). Already `.rw-aux`. Do not promote them to the glance rails. Do not redraw Burn as a FreeSpace afterburner energy tank. `out/hud-research/fs1-energy.jpg` is a G/S/E triplet. **Reject** that sim. Plant / Flight / Heat stay `.rw-aux` and do **not** move to a GSE triplet. Wave B hail must sit **above** this stack.

---

## 6. Visual language

**Thin strokes, not cards.** Rails lose fill, blur, and box-shadow. Tracks are 1 px edges. Petals can stay (they are already a shape language) but should sit on glass, not in a navy plate.

**One color family.** Keep the existing `#hud` tokens (`--rw-accent` cyan, `--rw-warn`, `--rw-bad`, `--rw-good`, `--vein` only on Bio). Do not introduce FreeSpace green as a combat default. HUD-03 palettes (`body.rw-colorblind`, `body.rw-contrast`) continue to override the same tokens.

**Shape + text, never color alone.** Already law in `hud.js`. New states follow it:

| State | Shape | Text |
|---|---|---|
| Hull low / crit | Hollow petals | LOW / CRIT |
| Range in | Solid hub ticks | RANGE |
| Match-speed | Filled SPD tick | MATCH |
| Facing | Nose / tail chevron | FORE / AFT |
| Hostile contact | Chevron pip | (lock name stays on the rail) |
| Civilian contact | Tick | — |
| Resolve band | Bracket corner style (keep) | DEFIANT / SHAKEN / BARGAINING / CAPITULATE |

**RIMWARD identity.** The living iris is a **small accent** on the hub (pupil + three cilia). It is not the rail, not the contacts **arc**, not the toast, not the Hail card.

**HUD-02** is **later**, not Wave F. Same instruments, two skins (mechanical vs organic), when that wave is designed. Organic skin must not grow tendrils across the aim glass. These waves do not add tendrils, organic audio, or HUD-03 audio alerts.

**Motion.** Breathe / iris-spin already yield to `body.rw-reduced-motion`. New flashes (hit, range pop, hostile-enter) are one-shot, not loops.

**Density.** If an instrument is not in the glance table in §4, it does not sit near the reticle.

---

## 7. Wave plan and acceptance tests

Waves are serial **A → B → C → D → E → F**. They match the wishlist sequence (HUD foundation → aiming foundation → equipment / presentation). Each wave is useful alone.

**Additive rule:** later waves only **add** nodes and classes. They must **not** restyle rails back into cards or reset the hub. Parallel waves are **not** safe (`hud.js`, `hud.css`, and `ship.js` are shared). Wave D and Wave E both edit `ship.js` but different regions (`fwdSpeed` / MATCH vs `_noseOffset`); do not rewrite `_noseOffset` in D.

### Wave A — HUD foundation

Thin rails, larger reticle hub, auto-collapse Controls, toasts **and** `.rw-banner` off the aim column, fade Bio / POS with `.rw-fade`.

**Acceptance**

- During a duel the player can read Screen, Shell, hull, SPD, WPN, and DIST without looking into a corner.
- Rails do not obscure the lock, lead point, projectile path, **or the player hull in chase** at 1600×900 (repeat the research capture in chase).
- Reticle hub is large enough to be the visual center and still open in the middle. Match the **large thin hub / empty middle** in `out/hud-research/fs1-training-reticle.jpg`. Living iris stays a **small accent** (pupil + three cilia). Do not add that still’s aspect-lock diamond or lower-right missile timer.
- **Rising edge** of `ctx.flags.combat` (`#hud.in-combat`) collapses Controls to a single glyph without a click. Combat exit does **not** force-open the list. Click still toggles during the fight.
- Toasts **and** `.rw-banner` never sit on the vertical center strip.
- Bio and POS use **`.rw-fade`** and drop to **0.14** in combat the way Manifest already does. They do not use `.rw-aux`.
- HUD-01 data set is unchanged. Color is still paired with shape or text.
- Reduced-motion / color-blind / contrast / `--rw-text-scale` still apply.
- Toggle `C` (chase → third → first → chase) does **not** add, remove, or relocate combat instruments. Chase and third still show the player hull.

### Wave B — Clear bottom-center

Move Hail and onboarding out of the radar / contacts slot.

**Acceptance**

- With a Hail card open, the bottom-center band (lowest ~10% of the viewport, horizontally centered ±20%) is empty except the existing `.rw-prompt` if raised.
- Hail box: **lower-left**, **`max-width: 360px`**, bottom **above** `.rw-bottom` (`bottom: 22%` or `left: 14px; bottom: calc(12px + aux-stack)`). **Plant / Flight / Heat stay readable.**
- Onboarding hints never occupy that band.
- Hail still works: numbered intents, tribute, live world, `hailOpened` / `hailClosed`.
- Hints still fire once, still honor `ctx.settings.hints`, still dismiss on key.
- Neither overlay is parented in a way that blocks `#hud` click-through except the Hail card’s own buttons.

### Wave C — Facing / silhouette

HUD-only Fore / Aft. Screen / Shell bars stay secondary. Use the **frozen** table in §5.7.

**Acceptance**

- Self FORE/AFT (steady): lock in player forward vs rear hemisphere. Test: player forward · (lockPos − playerPos). **No lock: both self ends dim.** Do not show heading vs world.
- Lock FORE/AFT (steady): player in lock forward vs rear hemisphere. Same test as `combat.js` facet on the lock.
- A `playerHit` with `fromAft: true` flashes AFT, not FORE. Bars still show Screen / Shell amounts.
- No new sim: still two shield layers, still `fore` / `aft` only. Do not rotate a 3D mesh to show heading.
- Silhouettes remain readable in color-blind mode (outline fill vs hollow, plus the word).

### Wave D — Aiming

Lead from the selected weapon, **relative** first-order. Range pop. Match-speed lamp + control. **Core ship** gets all three (TGT-01 decision in §5.4).

**Acceptance**

- Switching 1 → 2 moves the pip to disruptor TOF (`dist / 700`), not cannon (`dist / 900`).
- Weapon group 3 (mining) hides the pip and pops RANGE using the **installed** head’s range.
- Hide the pip when `|(targetVel − playerVel)|` is below the floor (~6). `lead = targetPos + (targetVel − playerVel) * tof`. No intercept iteration unless playtest fails.
- When `targetDistNow` crosses the selected weapon range, the hub pops (shape + `RANGE`).
- Lead is not a snap-to-pip fire assist.
- **Match-speed contract (must all pass):**
  1. `controls.js` writes one-frame `input.matchSpeedPressed` (KeyX if owner accepts).
  2. `flags.matchSpeed` lives on `ctx`; `ship.js` toggles it. `npc.js` does not write it.
  3. When the flag is set and a live ship lock exists, `ship.js` computes `fwdSpeed` from lock speed **inside** the flight step. **`ship.js` does not write `ctx.input.throttle`.**
  4. Clear `fullStop` while matching at or above creep. Do not auto-fire afterburner. Do not change heading. Cancel on lost / destroyed lock, dock, jump, or the same key.
  5. Hold R or F: cancel MATCH (player throttle wins).
  6. Lock speed &lt; creep: use `fullStop`; MATCH stays lit. Lock speed &gt; cruise: clamp to cruise; MATCH stays lit; do not burn.
  7. SPD shows `MATCH` while the flag is on and a lock exists.

### Wave E — First-person empty glass

`ship.js` camera. Not a HUD skin.

**Acceptance**

- Evidence for this wave is the **`ship.js` offsets**, not `live-combat.png`. `_noseOffset (0, 0.35, -1.7)` sits inside hull Z radius ~2.1; eyes at `z = -1.45`. The 2026-08-17 `out/hud-research/live-combat.png` still is **chase** (`_camOffset (0, 4, 12)`, look-ahead 25) and **cannot judge empty glass**.
- In first-person (`C` toggle, `ctx.flags.firstPerson`), the living hull, eyes, scars, and under-light do not occupy the aim glass.
- Moving `_noseOffset` **past the hull tip** (hull Z radius ~2.1; current `z = -1.7` is inside) is required. Hiding `flesh` alone is not the fix.
- Chase camera (`_camOffset (0, 4, 12)`, look-ahead 25) is unchanged. The player hull **stays visible** in chase and in **third**. Wave E must not hide chase or third flesh.
- **Third** camera sits above and behind at a steeper angle (`THIRD_HEIGHT` 18, `THIRD_BACK` 10, look-ahead 16). The hull sits in the bottom 25% and uses visual scale 0.55. Not straight down.
- Afterburner FOV kick still works.
- A **new** 1600×900 first-person lock screenshot (not the 2026-08-17 chase still) shows space and the target, not violet flesh.
- A 1600×900 **third** lock screenshot shows the player hull off-center, bolts, hit sparks, and the same HUD as chase and first-person.

### Wave F — later: contacts + TGT-03 tiers

Not a cloned FreeSpace radar. **HUD-02 skins are not this wave** (see Later — HUD-02).

**TGT-03 tiers (use the existing `ctx.world.scanner` 0 / 1 / 2 ladder; do not invent a second currency):**

| Tier | What the player already bought | HUD / TGT utility |
|---|---|---|
| 0 Core | Standard ship | HUD-01 rails, DIST, edge arrow, bracket, **honest Wave D lead + range pop + MATCH**. **No contacts arc.** Targeting assistance that *aims* stays on the core ship so a starter duel is possible. This **replaces** the TGT-01 “upgrade gates the pip” clause. Scanner buys **awareness only**. |
| 1 Wolfeye Mk I | Station buy (`station.js`) | Thin **bottom bearing arc**: ships inside a near bubble (recommend `U.ENCOUNTER_BUBBLE`). Numeric resolve (already). Attacker / `ai.intent` chevrons. |
| 2 Wolfeye Mk II | Requires Mk I | Q-ship pierce (already). Longer contact set (recommend 2× bubble or all `ctx.ships` in-system with a cap). Closure glyph on the lock. Optional extra-target info on the lock pip. |

**Acceptance**

- A hostile behind the player is visible on the **bottom arc** without a look-behind camera (Mk I+).
- The **middle / aim glass stays empty.** The instrument is not a 22–28% reticle ring. Pips do not sit on the HUD-01 rails.
- Core ships without a scanner still have DIST, the edge arrow, and Wave D lead / range / MATCH. They do not get a fake radar.
- The instrument is not a filled green circle, has **no CRT grid**, and does not use FreeSpace’s green / red / blue blip triad. Friend / foe is **shape, not color**.
- Scanner gates the **arc** only.

### Later — HUD-02 skins (not Wave F)

Same instruments, two skins (mechanical stroke vs living accent). Same data, same readability. Organic skin may pulse the *accent*, not the whole arc. Do **not** invent tendrils across the glass in Wave F. Design HUD-02 in its own later wave.

---

## 8. Explicit out of scope

Do not add in any wave of this proposal:

- Missiles, aspect lock, lock-box, incoming-missile gauge, countermeasures (`out/hud-research/fs1-training-reticle.jpg` shows them; **reject** except the large thin hub and the off-glass weapons list)
- G / S / E power management or weapon linking (`out/hud-research/fs1-energy.jpg` shows the triplet; **reject**. Plant / Flight / Heat stay `.rw-aux`)
- Four-face shield transfer or per-quadrant shield pools (`out/hud-research/fs1-shields.png` shows F5–F8; **reject**. Facing glance only — §5.7)
- **Subsystem targeting**
- Wingmen clock, escort list, directives stack
- Comm video during a duel (Hail keeps its existing still portrait + text card, off the aim column)
- Auto-aim, heading-hold disguised as match-speed
- Deleting HUD-01 glance or moving Screen / Shell / hull / SPD / WPN / DIST back to corners
- A first-person-only combat HUD, or hiding the player hull in chase
- Cloning the FreeSpace green circle radar
- A default reticle-centered contacts ring at 22–28% of the short side
- Rewriting Burn as a continuous energy tank
- TGT-04 turrets / automated weapons
- HUD-03 new settings beyond what `settings.js` already stores (scale, contrast, color-blind, reduced motion, hints, volume)
- **HUD-03 audio alerts** (not designed; existing volume / settings stay as they are)
- HUD-02 skins, tendrils, or organic audio in Waves A–F

---

## 9. File write-sets per wave

Hints, not a license to wander. Confirm current symbols before editing.

### Wave A

| File | Change |
|---|---|
| `src/ui/hud.css` | Stroke rails (no fill / blur on `.rw-combat-rail`). Larger `.rw-reticle` hub; iris reduced to accent. `.rw-toasts` **and** `.rw-banner` off-center. `#hud.in-combat .rw-controls` collapsed layout. Fade `.rw-bio` / `.rw-pos` via **`.rw-fade` (0.14)**, not `.rw-aux`. |
| `src/systems/hud.js` | On **rising edge** of `ctx.flags.combat`, set `controlsCollapsed = true` (same path as the existing toggle). Do **not** force-open on combat exit. Click still toggles during the fight. Add **`.rw-fade`** to Bio / POS at init. Toast / banner container class if CSS needs a hook. Do not change lead math yet. First-person class stays tied to `camera === 'first'` only. |
| `src/core/ctx.js` | Add `flags.camera`: `'chase' \| 'third' \| 'first'`. Keep `flags.firstPerson` as `camera === 'first'`. |
| `src/systems/controls.js` | `C` cycles chase → third → first → chase. Update the help line. |
| `src/systems/ship.js` | Third camera: above and behind (18 up, 10 back), look-ahead 16, hull visual scale 0.55. Resnap on mode change. Do not hide flesh in chase or third. |

### Wave B

| File | Change |
|---|---|
| `src/systems/hail.js` | Reposition **and** resize: lower-left, **`max-width: 360px`**, bottom above `.rw-bottom` (`bottom: 22%` or `left: 14px; bottom: calc(12px + aux-stack)`). Keep behavior. `pointer-events` only on the card. |
| `src/systems/onboarding.js` | Reposition the hint (`bottom: 6%`) off the bottom-center band. Keep once-ever `seen` and `ctx.settings.hints`. |
| `src/ui/hud.css` | Only if `.rw-prompt` must rise to stay clear of the future contacts **arc**. |

### Wave C

| File | Change |
|---|---|
| `src/systems/hud.js` | Build two small silhouette nodes. Update from the frozen §5.7 table only. Listen for `playerHit` in the existing event loop. No lock → both self ends dim. |
| `src/ui/hud.css` | Stroke silhouette + FORE / AFT labels + hit flash. Color-blind safe. |
| Tests | Prefer a focused hud harness assertion on `fromAft` → AFT flash. Do not run the full suite for this design wave. |

### Wave D

| File | Change |
|---|---|
| `src/systems/hud.js` | Lead TOF from selected `WEAPONS[wKey].speed`; hide pip for mining; hide when `|(targetVel − playerVel)|` &lt; floor; `lead = targetPos + (targetVel − playerVel) * tof`. Range pop vs selected range. MATCH lamp from `ctx.flags.matchSpeed`. |
| `src/systems/controls.js` | One-frame `input.matchSpeedPressed` edge + one line in `config.controls`. Recommend **X** (unused in the current list). Confirm before shipping. Do **not** write `flags.matchSpeed` here unless the owner later moves the toggle (default writer is `ship.js`). |
| `src/core/ctx.js` | `flags.matchSpeed` (writer: `ship.js`) and `input.matchSpeedPressed` (writer: `controls.js` only). Document both in the header comment. `input` remains controls-only. |
| `src/systems/ship.js` | Consume `input.matchSpeedPressed` to toggle `flags.matchSpeed`. When the flag is set and a live ship lock exists, compute `fwdSpeed` from lock speed **inside** the flight step. **Do not write `ctx.input.throttle`.** Clear `fullStop` while matching at/above creep. Cancel on lost/destroyed lock, dock, jump, same key, or held R/F. Lock &lt; creep → `fullStop`. Lock &gt; cruise → clamp to cruise, no burn. Do not change heading. Do not auto-fire afterburner. |
| `src/ui/hud.css` | RANGE hub state; MATCH lamp. |

### Wave E

| File | Change |
|---|---|
| `src/systems/ship.js` | Move `_noseOffset` past the hull tip (recommend start `(0, 0.45, -2.8)` and playtest). Hide `flesh` **and** guarantee hull / eyes / scars / `underLight` cannot fill the near plane (layers or explicit `visible`). Do not change chase `_camOffset`. Do not use `live-combat.png` as the empty-glass proof. |

### Wave F (later)

| File | Change |
|---|---|
| `src/systems/hud.js` | Thin **bottom bearing arc** from `ctx.ships[]`, gated on `ctx.world.scanner`. No reticle-centered 22–28% ring. |
| `src/ui/hud.css` | Bottom arc + pip shapes. No fill. No CRT grid. No HUD-02 skin hooks in this wave. |
| `src/systems/station.js` | Copy only: Mk I / Mk II blurb may name the new utility. Do not change prices or the 0/1/2 heal. |
| `src/game/save.js` | No new field if we keep `scanner`. |

---

## 10. Open questions for the owner

Short. Each is a decision, not a research task. Struck items are locked in the body.

1. **Match-speed key?** Recommend **X**. Acceptable?
2. **~~Wave D lead on every ship, or gated on Wolfeye?~~ DECIDED.** Core ship gets honest lead + range + MATCH. Scanner buys awareness only. This **replaces** the TGT-01 upgrade-gates-the-pip clause. See §5.4 / Wave D / Wave F tier 0.
3. **~~Facing with no lock?~~ DECIDED.** Both self FORE/AFT dim. See §5.7.
4. **~~Hail parked lower-left or lower-right?~~ DECIDED.** Lower-left, `max-width: 360px`, bottom above `.rw-bottom`. See §5.12 / Wave B.
5. **~~Contacts ring around the reticle, or a thin bottom arc in the freed slot?~~ DECIDED.** Thin **bottom bearing arc** in the Wave B slot. Middle stays empty. A later hub-sized ring, if wanted, must stay inside the 78 px rail gap with pips off the rails. See §5.9 / Wave F.
6. **First-person camera start offset `(0, 0.45, -2.8)`?** Too far forward will see past the “nose”; too close shows flesh. Owner playtest on Wave E is the real acceptance.
7. **~~Same HUD in chase / third-person?~~ DECIDED.** Yes. Owner correction 2026-08-17: **third is not chase.** Chase stays on-axis. Third is a third view: above and behind, not directly behind. Same HUD on chase, third, and first. See §2 rule 9.

---

## Appendix A — What already works (do not regress)

Overlay HUD; mirrored HUD-01 rails; Screen / Shell / hull petals + LOW/CRIT; SPD; WPN; DIST; resolve-band bracket shapes; edge arrow; lead mechanism (fix the *input*, keep the projection); `.rw-fade` / `.rw-aux` contract; color+shape pairing; 5 Hz write-on-change; Q-ship pierce at scanner ≥ 2; ore NEEDS + `.ore-blocked`; Controls collapse *toggle*; toast events (`shieldDown`, `engineOut`, `mineBlocked`, milestones); HUD-03 tokens; chart marks that already dim in combat.

## Appendix B — Evidence anchors

- Rails: `src/ui/hud.css` `.rw-combat-rail` `top: 57%`; `.rw-combat-self` `translate(calc(-100% - 78px))`; `.rw-combat-target` `translate(78px)`.
- Lead bug: `src/systems/hud.js` `const tof = dist / WEAPONS.cannon.speed`; hide uses `targetVel.length()` (world), not relative.
- Fire path: `src/systems/combat.js` `GROUP_WEAPON[ctx.input.weaponGroup]`.
- Weapons: `src/game/state.js` `WEAPONS` (cannon 900/500, disruptor 700/350, mining beam `speed: 0`).
- Combat flag: `src/systems/npc.js` `ai.intent && distance < U.ENCOUNTER_BUBBLE`.
- Hail / onboarding: `hail.js` `bottom:4%`; `onboarding.js` `bottom:6%`; both `document.body`.
- First-person math: `src/systems/ship.js` `_noseOffset = (0, 0.35, -1.7)`; hull comment `radii ~ x 3.0 / y 0.4 / z 2.1`; eyes at `z = -1.45`. Chase: `_camOffset (0, 4, 12)`, `LOOK_AHEAD = 25`.
- `out/hud-research/live-combat.png` (2026-08-17): **chase** composition (player hull in the left mid-field, lock Vesper-9). **Not** first-person proof. Do not cite it for empty glass.
- `out/hud-research/fs1-energy.jpg`: G/S/E thin vertical ticks. Evidence of thin power reads. Not a RIMWARD currency. Plant / Flight / Heat stay `.rw-aux`.
- `out/hud-research/fs1-shields.png`: four-quadrant F5–F8 transfer. Evidence of a facing glance. Frozen §5.7 table stays FORE/AFT + `fromAft` only.
- `out/hud-research/fs1-training-reticle.jpg`: large empty hub + off-glass weapons list + aspect-lock ring. Wave A takes hub + empty middle. No aspect-lock. No missile timer.
- Unused hit: `ctx.emit('playerHit', { damage, family, fromAft, shielded })`.
- Scanner ladder: `ctx.world.scanner` 0/1/2 in `station.js` / `save.js` sanitize.
- Controls help: `controls.js` pushes **14** strings. Measured box ~280×260 at 1600×900.
- `ctx.input` writer: `controls.js` only (`src/core/ctx.js`).
