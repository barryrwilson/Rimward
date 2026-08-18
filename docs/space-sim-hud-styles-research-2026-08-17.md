---
title: "Space Sim HUD Styles — FreeSpace reference and live comparison"
research_date: 2026-08-17
status: final
revision: "2026-08-17 stills addendum"
scope: "Space-combat HUD families, FreeSpace as the owner's preferred style, and a live RIMWARD combat frame compared to that layout"
source_mode: "Web primary sources plus local HUD code, wishlist, a live 1600×900 combat capture, and FreeSpace training stills"
related:
  - docs/PLAYER-EXPERIENCE-WISHLIST.md
  - src/systems/hud.js
  - src/ui/hud.css
  - out/hud-research/live-combat.png
  - out/hud-research/fs1-asteroids.jpg
  - out/hud-research/fs1-energy.jpg
  - out/hud-research/fs1-shields.png
  - out/hud-research/fs1-training-reticle.jpg
---

# Space Sim HUD Styles

## Executive conclusion

FreeSpace uses a thin overlay HUD. Combat data sits next to the reticle, not in the screen corners. That placement is why many players still prefer it, and it is already the primary reference for HUD-01 in `docs/PLAYER-EXPERIENCE-WISHLIST.md`.

RIMWARD already follows the **FreeSpace idea**: player vitals left of center, target vitals right of center, both just below the midline. The live style is still a **boxed career HUD** with a combat insert. FreeSpace is a **thin instrument set** around an empty aim glass.

Take the FreeSpace **rules**, not the 1998 green chrome.

- Keep player status left of the reticle and target status right of the reticle.
- Use graphical shield and hull, not a number-first readout.
- Keep the reticle, lead pip, and shot path clear.
- Put range, weapon, and speed in that same center cluster.
- Use one HUD color family. Pair color with shape and text.
- Fade or hide career panels in combat.
- Let the player scale the HUD, raise contrast, and cut motion.

Do not copy a fixed CRT green, four-quadrant shield transfer as a required skill, the full 1998 gauge set, or comm video during a duel unless those extras are wanted later.

## Evidence versus inference

**Evidence**

- Wikipedia describes the *Descent: FreeSpace* HUD as a first-person overlay that can change color, with player shields, weapon and afterburner energy, target data in the lower left, incoming-missile warning, and a 360° radar (green friend, red foe, blue entering or leaving).
- Wikipedia describes *FreeSpace 2* as a first-person in-cockpit view with a fully customizable fixed HUD for ship status, weapons, objectives, targets, and missile-lock direction.
- The FreeSpace Wiki lists the engine gauge names used by the HUD config screen.
- The official Wikimedia *FreeSpace* asteroid combat still shows thin green overlay instruments and an empty upper fight volume.
- A live RIMWARD capture on 2026-08-17 (`out/hud-research/live-combat.png`) measured HUD element boxes at 1600×900 with a lock on **Vesper-9**.
- Local code in `src/systems/hud.js` and `src/ui/hud.css` implements HUD-01 as `.rw-combat-self` / `.rw-combat-target` rails at `top: 57%`, offset 78px from center.
- Training still `out/hud-research/fs1-energy.jpg` shows three labeled vertical columns **G / S / E** (guns / shields / engines) as thin tick stacks, with a prompt to hold **Insert** until every bar fills.
- Training still `out/hud-research/fs1-shields.png` shows four-quadrant shield transfer: **F5–F8** dump energy to one face, **Shift+F5–F8** equalize that face, **F9** equalizes all, plus a four-face ship silhouette.
- Training still `out/hud-research/fs1-training-reticle.jpg` shows a large thin circular hub with an empty middle, an aspect-lock “keep the target in the reticle” prompt, and a lower-right **WEAPONS** list (lasers plus Interceptorz with a 13 s timer) parked off the aim glass.

**Inference**

- Players praise FreeSpace HUD “clarity” because of placement and restraint, not because of 1998 art.
- Thin glyphs will read better in RIMWARD combat than the current opaque cards.
- A 360° radar in the current hail / tutorial slot would restore the FreeSpace bottom-center awareness role.
- The living-ship first-person camera leaving hull in the aim path is a camera/rig issue as much as a HUD issue.
- The three training stills are **evidence of FreeSpace utility**, not a required RIMWARD sim. Take/reject for each is in the stills addendum below.

## Owner preference

The owner prefers the original *FreeSpace* HUD style.

The experience wishlist already names that game as the strongest combat-HUD reference, with *Galaxy on Fire*, *Elite / Frontier*, and *Star Commander* as secondary feel references. HUD-01, HUD-02 (conventional vs living skins), and HUD-03 (scale, contrast, color-blind, reduced motion) are the planned follow-on.

## FreeSpace HUD — what it is

The HUD is a first-person overlay. The game does not use a thick cockpit cage. The player can hide or recolor each gauge.

Combat layout is a mirror around the aim point:

| Zone | What the player sees |
|---|---|
| Center | Thin circular reticle. Lead pip. Aspect-lock diamond. |
| Left of center | Player shield silhouette. Hull. Speed / throttle. |
| Right of center | Target shield silhouette. Hull. Speed. Range. |
| Beside the reticle | Weapon energy. Afterburner energy. |
| Bottom center | Full 360° radar. |
| Lower left | Target monitor: name, class, subsystems, damage. |
| Lower right | Weapons list and lock / reload timers. |
| Upper left | Directives and escort list. |
| Upper right | Wingman status and mission time. |
| Edges | Off-screen target arrow. Incoming-missile warning. |

The official asteroid combat still shows this clearly. Bright green lines sit on black space. Ships and asteroids stay visible. The HUD does not cover the fight.

*FreeSpace 2* keeps the same family. It adds comm video, more custom colors, and a HUD config screen.

### Engine gauge names (FreeSpace Wiki)

`lead indicator`, `target orientation`, `closest attacking hostile`, `current target direction`, `mission time`, `reticle`, `throttle`, `radar`, `target monitor`, `center of reticle`, `extra target info`, `target shield`, `player shield`, `power management`, `auto-target icon`, `auto-speed-match icon`, `weapons display`, `monitoring view`, `directives view`, `threat gauge`, `afterburner energy`, `weapons energy`, `weapon linking`, `target hull/shield icon`, `offscreen indicator`, `comm video`, `damage display`, `message output`, `locked missile direction`, `countermeasures`, `objective notify`, `wingmen status`, `offscreen range`, `kills gauge`, `attacking target count`, `warning flash`, `comm menu`, `support gauge`, `lag gauge`.

### Combat systems the HUD must support

- Four shield quadrants. The player can equalize them or move energy to one face.
- Power split among guns, shields, and engines.
- Heat-seek vs aspect-lock missiles. Lock needs a steady box inside the reticle.
- Auto-target and speed-match as optional aids.

### Why this style works

1. The eye stays on the target. Player state and target state sit a short glance from the lead pip.
2. Shape carries meaning. Shield wedges and ship silhouettes read faster than a number in a corner.
3. The lines stay thin. Space, ships, and shots stay in view.
4. One color family. Green (or a player-chosen color) plus friend / foe / warning. The HUD does not use a rainbow.
5. The player can remove unused gauges. Experts can keep a clean screen.
6. The radar is 360°. The player can see a threat behind the ship without a look-behind camera.

## Other space-sim HUD families

**Cockpit cage** — *X-Wing*, *TIE Fighter*, *Star Wars: Squadrons*.  
Gauges live on a physical dash. The frame gives presence. It also cuts the view. A TIE canopy is a small circle. Strong for immersion. Weaker for a fast 6DOF duel in a browser.

**Cinematic VDU** — *Wing Commander*.  
Left and right video screens, comm portraits, and more chrome. The story feels close. The aim point gets less of the screen.

**Career hologram** — *Elite Dangerous*.  
Orange holographic cockpit. Combat mode vs analysis mode. A 3-pip power distributor. A contact hologram with facing and shield rings. Side panels for nav, comms, and role work. Excellent for a sandbox career. Heavier than FreeSpace for a dogfight.

**Diegetic glass** — *Star Citizen* and many modern titles.  
Screens sit in the cockpit. The look is rich. Clutter and scale problems grow fast.

**Arcade mobile** — *Galaxy on Fire*.  
Large marks, simple lock, high contrast. Fast to read. Less subsystem depth.

**Custom overlay** — *Oolite* and *FreeSpace 2 Open*.  
The HUD is a table the player can edit. Color, size, and position are player tools.

RIMWARD's split is already the right one if it is finished: FreeSpace for the fight, Elite-style panels for the career. Those panels must yield during combat.

## Live combat comparison

Captured 2026-08-17 from the running Vite app at `http://localhost:5173/` with Chrome (headless, 1600×900). Title skip via `sessionStorage`. Origin pick via Digit1. First-person flag on. Lock forced onto a live traffic ship with hostile intent so `#hud.in-combat` is true.

- Still: `out/hud-research/live-combat.png`
- FreeSpace still used for side-by-side: `out/hud-research/fs1-asteroids.jpg` (Wikimedia *FS_Asteroids_Combat.jpg*)
- Capture helper: `out/hud-research/capture-combat.mjs`

Lock on this frame: **Vesper-9**, Veridian Combine freighter, resolve band SHAKEN, about 74 u.

### Measured layout (1600×900, center 800, 450)

| Element | Shown | Box | Notes |
|---|---|---|---|
| Self rail `.rw-combat-self` | yes | 512, 513, 210×100 | Screen, Shell, hull petals, 25 u/s, WPN Energy cannon |
| Target rail `.rw-combat-target` | yes | 878, 513, 185×113 | Name, Screen, Shell, hull, speed, DIST |
| Reticle `.rw-reticle` | yes | 777, 427, 46×46 | Centered iris; visual center 800, 450 |
| Target bracket | yes | ~800, 410 | Name card under the hull: faction · range · band |
| Lead pip | no | — | Target not moving enough on this frame |
| Edge arrow | no | — | Target on glass |
| Controls help | yes | 14, 14, 280×260 | Top-left quarter still occupied |
| Manifest | yes | 1454, 14, 132×90 | Credits, fear, cargo |
| Bottom strip | yes | 14, 725, 1572×163 | Plant, Flight, Heat, Bio, POS |
| Toasts | yes | 606, 63, 387×85 | Origin line in the top-center |
| Hail / tutorial | yes | lower center | Occupies the FreeSpace radar slot |

CSS confirms the rails: `top: 57%`, self `translate(calc(-100% - 78px))`, target `translate(78px)`. Aux panels use `opacity: 0.38` under `#hud.in-combat`.

### What matches FreeSpace

- No cockpit cage. The HUD is an overlay.
- Player vitals left of center. Target vitals right of center. Both just below the midline.
- The pair reports shield layers, hull, and speed.
- The target rail adds name and range.
- A bracket and a name card sit on the locked ship.
- An off-screen arrow exists when the lock leaves the glass.
- Career panels dim in combat.

### What does not match

| Zone | FreeSpace | Live RIMWARD frame |
|---|---|---|
| Center | Large thin arc reticle. Lead pip. Aspect lock. | Small organic iris (46 px). No lead pip on this lock. |
| Left of reticle | Thin throttle / speed ticks. | Dark card: Screen, Shell, hull petals, speed, weapon. |
| Right of reticle | Thin weapon-energy bars. | Dark card: name, Screen, Shell, hull, speed, range. |
| Shield read | Ship silhouette with four shield faces. | Horizontal bars plus hull petals. No facing. |
| Bottom center | 360° radar. | Hail prompt and an onboarding line. No radar. |
| Lower left | Small target monitor and ship icon. | Plant / Flight / Heat aux cards. |
| Lower right | Weapons list and lock timers. | Bio and position cards. |
| Top left | Short directive list. | Full Controls help, 280×260 px. |
| Top right | Wingman pips and clock. | Manifest (credits, fear, cargo). |
| Top center | Empty. | Origin toast. |
| Line weight | Thin green strokes on space. | Opaque navy cards with fills. |

### Eye path

In FreeSpace the eye stays on the ship. The reticle is large and thin. Shield glyphs and radar sit at the bottom edge. They do not cover the fight.

In the live frame the eye must leave the ship. The lock name sits under the hull. The two vital cards sit lower and cover the ecliptic line. The Controls list still owns the top-left quarter. The toast owns the top-center. Hail and the tutorial line own the FreeSpace radar slot.

The first-person camera also leaves the living-ship body in the aim path. FreeSpace keeps that glass empty.

## Fit with the current HUD plan

HUD-01 already has the correct glance: mirrored rails near the reticle. Corner panels still hold career data and fade in combat. That is the correct split.

HUD-02 can keep the same places and data with two skins: conventional mechanical, and living organic. Neither skin should lose readability.

HUD-03 (scale, contrast, color-blind, reduced motion) is already partly present in `hud.css` via `body.rw-colorblind`, `body.rw-contrast`, and `body.rw-reduced-motion`.

## Training stills addendum (2026-08-17)

These three stills are **evidence**, not a required RIMWARD sim. They sit with `out/hud-research/fs1-asteroids.jpg` and `out/hud-research/live-combat.png`. They do not add an eighth design pass.

### Energy — `out/hud-research/fs1-energy.jpg`

**Evidence.** Three dedicated power pools as thin vertical ticks labeled **G / S / E**. The training prompt is “hold Insert until every bar is full.” The rest of the glass stays empty.

**Take.** Power reads as thin ticks, not boxed cards.

**Reject.** RIMWARD does not have G/S/E. Existing Plant / Flight / Heat and afterburner cooldown are the career/flight analog. Do not invent a third energy currency. Do not rewrite Burn as a FreeSpace afterburner tank.

### Shields — `out/hud-research/fs1-shields.png`

**Evidence.** Four-quadrant shield transfer is a FreeSpace combat skill. F5–F8 dump to one face; Shift+F5–F8 and F9 equalize. The HUD shows a four-face silhouette.

**Take.** The *facing glance*: the player sees which end is hot.

**Reject.** RIMWARD has Screen + Shell and `fromAft` only. Do not add four faces or transfer keys.

### Training reticle — `out/hud-research/fs1-training-reticle.jpg`

**Evidence.** Large empty hub. Aspect lock is a *hold the target in the ring* skill. Lower-right weapons list (including a missile timer) sits off the aim glass.

**Take.** The large thin hub and the off-glass weapons list.

**Reject.** RIMWARD has no missiles yet. Do not add aspect-lock or a missile timer.

## Recommended next design pass

These are recommendations, not an implementation plan. The 2026-08-17 training stills **strengthen** items 1–3. They do not add an eighth pass.

1. Thin the rails. Replace opaque cards with stroke glyphs so the ship and shot path stay visible. **Strengthened** by `out/hud-research/fs1-energy.jpg` (thin vertical ticks, not cards) and `out/hud-research/fs1-training-reticle.jpg` (weapons list parked off the glass).
2. Enlarge the combat reticle enough to act as the hub, without covering the lead pip. **Strengthened** by `out/hud-research/fs1-training-reticle.jpg` (large thin hub, empty middle).
3. Add a shield/hull silhouette or facing read. Bars can stay as a secondary cue. **Strengthened** by `out/hud-research/fs1-shields.png` (facing glance). Do not take four-quadrant transfer.
4. Move hail and tutorial lines out of bottom-center. Leave that slot for radar or keep it empty.
5. Collapse Controls to a single glyph in combat. Do not keep a 15-line list on glass.
6. Keep toasts short and off the aim column.
7. Treat living-ship first-person as a camera problem: the aim glass must not be a hull close-up.

## Sources

- [Descent: FreeSpace – The Great War (Wikipedia)](https://en.wikipedia.org/wiki/Descent:_FreeSpace_%E2%80%93_The_Great_War) — HUD contents, radar colors, targeting, wingman and escort reads.
- [FreeSpace 2 (Wikipedia)](https://en.wikipedia.org/wiki/FreeSpace_2) — customizable first-person HUD, missile-lock warning, shield/hull combat.
- [Hud Gauge Names (FreeSpace Wiki)](https://wiki.hard-light.net/index.php/Hud_Gauge_Names) — config-screen gauge list from `hudconfig.cpp`.
- [Descent: Freespace training LP, Advanced Training #2](https://lparchive.org/Descent-Freespace/Update%2012/) — aspect lock, weapons gauge timers, shield quadrants, G/S/E power bars.
- [HUD/Center (Elite Dangerous Wiki)](https://elite-dangerous.fandom.com/wiki/HUD/Center) — combat vs analysis mode, contact hologram, shield rings.
- Wikimedia still: `File:FS_Asteroids_Combat.jpg`, saved locally as `out/hud-research/fs1-asteroids.jpg`.
- Training stills (2026-08-17 addendum; evidence, not a required sim): `out/hud-research/fs1-energy.jpg` (G/S/E bars), `out/hud-research/fs1-shields.png` (F5–F8 four-quadrant transfer), `out/hud-research/fs1-training-reticle.jpg` (aspect-lock hub + off-glass weapons list).
- Local: `docs/PLAYER-EXPERIENCE-WISHLIST.md` (Initiative HUD), `src/systems/hud.js`, `src/ui/hud.css`.
- Live capture log: HUD box geometry printed by `out/hud-research/capture-combat.mjs` on 2026-08-17.
