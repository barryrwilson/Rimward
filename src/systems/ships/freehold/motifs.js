/**
 * Freehold Compact — surface-and-equipment motif library.
 *
 * Barn red, weathered cream, faded blue, bare metal. Warm amber windows.
 * External tools, visible rescue gear, donated sections repaired by neighbours.
 * Useful before beautiful — every motif reads as HISTORY, not neglect.
 *
 * The faction's visual language:
 *   - warmWindowRow is the PRIMARY scale cue; use it everywhere crew lives.
 *   - Donated panels cycle st.patch by INDEX, never by colour inspection.
 *   - Every mounted motif has geometry reaching BACK past its own frame origin
 *     so the attach audit sees a real overlap, not a tangent touch.
 *   - Two channels only: 'hull' (opaque) and 'lights' (additive, near-white).
 *
 * Wave-49.4 defects this file DELIBERATELY avoids (§9):
 *   - box() channel SECOND, colour THIRD — never swap them.
 *   - No bare Math.random(); rng(seed) only.
 *   - No exact 1×1×1 part; every box/cyl has explicit non-unit dimensions.
 *   - Geometry reaching back past frame origin on every mounted motif.
 *   - windowRow called with an OPTIONS OBJECT — count positional → silent zero.
 *   - Lamp counts derived from HUMAN.lampGap, never lampSize.
 *   - Hull colours only from st.hull/st.hullDark/st.trim/st.accent/st.patch[],
 *     or weather() with an INTEGER index 0..3. Never a float index.
 *   - Never pass a partial style object to a motif; take the whole st.
 */

import {
  rng, weather, box, cyl, torus,
  windowRow, railing, pipeRun, radiatorPanel, lampString,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

// ---------------------------------------------------------------------------
// Lights-channel near-whites. The additive material's amber multiplies these.
// ---------------------------------------------------------------------------

/** Running / work lamp — neutral white. */
export const LAMP  = 0xffffff;

/** Warm cabin glass — the faction's signature window colour. */
export const GLASS = 0xfff2d8;

/** Dimmed interior / porch light. */
export const DIM   = 0xe8dcc8;

/** Work floodlight — slightly warmer than LAMP. */
export const FLOOD = 0xfff6e2;

// ---------------------------------------------------------------------------
// warmWindowRow
// ---------------------------------------------------------------------------

/**
 * A row of warm cabin windows: a dark recessed well (hullDark), HUMAN windows
 * in GLASS inside it, and a painted cream sill/awning above. THE primary scale
 * cue of the faction — use it everywhere a person would live.
 *
 * THE WELL REACHES BACK. The recessed well box is centred behind z=0, so the
 * motif sits INTO the hull face. Without this the well would be tangent and fail
 * the attach audit.
 *
 * WINDOWS ARE AN OPTIONS OBJECT. windowRow from station-detail.js silently emits
 * nothing when count is passed positionally. It must go inside the options literal
 * as { count, spacing: HUMAN.windowGap, ... }. This is the defect from wave-2.
 *
 * dim: true swaps GLASS for DIM for unlit or interior readings.
 */
export function warmWindowRow(b, st, { count = 3, ry = 0, sill = true, dim = false }) {
  const glass  = dim ? DIM : GLASS;
  const rowW   = count * HUMAN.windowGap;
  // Well is deeper than the window so the window recesses inside it.
  const wellH  = HUMAN.windowH * 1.6;
  const wellD  = HUMAN.windowD * 2.2;

  b.push(0, 0, 0, ry, 0, 0);

    // Dark recessed well — centred at z = -wellD*0.45 so most of it reaches
    // BEHIND the frame origin and overlaps the hull face it is mounted to.
    box(b, 'hull', st.hullDark,
      rowW + HUMAN.windowGap * 0.5, wellH, wellD, {
      z: -wellD * 0.45,
    });

    // Cream sill / awning directly above the well.  Its lower half overlaps the
    // well's top edge (giving connected geometry), and its upper half protrudes
    // as an awning that shades the windows and reads as a hand-fitted addition.
    if (sill) {
      box(b, 'hull', st.trim,
        rowW + HUMAN.windowGap * 0.6, HUMAN.windowH * 0.38, wellD * 0.3, {
        y: wellH * 0.6,
        z: -wellD * 0.1,
      });
    }

    // HUMAN windows in GLASS (or DIM), inset 0.05 behind the well face.
    // windowRow MUST receive an OPTIONS OBJECT — passing count positionally
    // silently emits nothing (station-detail.js destructures named fields only).
    windowRow(b, 'lights', glass, {
      count,
      spacing: HUMAN.windowGap,
      w:       HUMAN.windowW,
      h:       HUMAN.windowH,
      d:       HUMAN.windowD,
      axis:    'x',
      y:       0,
      z:       -wellD * 0.55,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// toolLocker
// ---------------------------------------------------------------------------

/**
 * A clamp-on external tool locker: donated-tone box, cream latch band, a
 * handle, and clamp PADS that reach back past the frame origin onto the hull.
 *
 * CLAMP PADS ARE THE ATTACHMENT. The locker slab alone is an island floating
 * in front of the hull face. The two pads extend behind z=0 by d*0.35, which
 * is where the hull surface sits and where the attach audit sees the overlap.
 *
 * Donor tone is chosen by a seeded integer index into st.patch — geometry never
 * inspects a colour value to decide a position (pirate-bake contract §2).
 */
export function toolLocker(b, st, { w = 0.5, h = 0.42, d = 0.72, ry = 0, seed = 1 }) {
  const rnd      = rng(seed);
  // Integer index only — never read the hex value.
  const toneIdx  = Math.floor(rnd() * st.patch.length);
  const tone     = st.patch[toneIdx];

  b.push(0, 0, 0, ry, 0, 0);

    // Two clamp pads reaching BEHIND the frame origin.  These are the geometry
    // that seats the locker INTO the hull; without them the box floats.
    for (const sy of [0.28, -0.28]) {
      box(b, 'hull', weather(st.hull, 1), w * 0.32, h * 0.22, d * 0.55, {
        y: h * sy,
        z: -d * 0.18,  // centre at -0.18d, back edge reaches to -0.455d
      });
    }

    // Main locker body in donated tone.
    box(b, 'hull', tone, w, h, d * 0.82, {
      z: d * 0.09,   // back edge at -0.32d — inside pad range, so connected
    });

    // Cream latch / hinge band running across the door face.
    box(b, 'hull', st.trim, w * 1.04, h * 0.10, d * 0.84, {
      z: d * 0.09,
    });

    // Handle proud of the forward face.
    box(b, 'hull', st.trim, w * 0.28, h * 0.07, HUMAN.windowD * 0.9, {
      y: 0,
      z: d * 0.52,
    });

    // Hasp bar across the top — locks the read as a secure box.
    box(b, 'hull', weather(st.hullDark, 1), w * 0.96, h * 0.08, d * 0.80, {
      y: h * 0.42,
      z: d * 0.09,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// rescueWinch
// ---------------------------------------------------------------------------

/**
 * Visible rescue gear: a cable drum in a cream cradle with a hook block
 * SEATED ON the drum (never hanging in space).
 *
 * THE CRADLE REACHES BACK. The mounting saddle box extends behind z=0 by
 * r*0.75, creating the bounding-box overlap that seats the winch INTO the
 * hull or foredeck. A winch whose parts all sit forward of z=0 floats.
 *
 * hook: false omits the hook block for a bare drum installation.
 */
export function rescueWinch(b, st, { r = 0.22, len = 0.34, ry = 0, hook = true, seed = 1 }) {
  const rnd = rng(seed);  // reserved for future tone variation

  b.push(0, 0, 0, ry, 0, 0);

    // Mounting saddle — the actual attachment; back edge at z = -r*1.05.
    box(b, 'hull', st.trim, r * 2.2, r * 1.1, r * 1.5, {
      z: -r * 0.30,
    });

    // Drum body — cylinder with axis along X (rx: PI/2 rotates Y-axis to X).
    cyl(b, 'hull', weather(st.hull, 1), r, r, len, 10, {
      rx: Math.PI / 2,
      z:  r * 0.55,
    });

    // Cable bight — slightly fatter ring around drum centre shows loaded cable.
    cyl(b, 'hull', weather(st.hullDark, 1), r * 1.08, r * 1.08, len * 0.55, 10, {
      rx: Math.PI / 2,
      z:  r * 0.55,
    });

    // Drum flanges at each end — cream, wider than the drum.
    for (const sx of [-1, 1]) {
      cyl(b, 'hull', weather(st.trim, 1), r * 1.22, r * 1.22, len * 0.08, 10, {
        rx: Math.PI / 2,
        z:  r * 0.55 + sx * len * 0.46,
      });
    }

    // Hook block SEATED ON the drum top — its base rests on the drum so the
    // attach audit sees it connected, not hanging.
    if (hook) {
      box(b, 'hull', weather(st.trim, 2), r * 0.48, r * 0.44, r * 0.38, {
        y: r * 1.18,
        z: r * 0.52,
      });
      // Hook shank.
      cyl(b, 'hull', weather(st.hull, 2), r * 0.08, r * 0.08, r * 0.38, 6, {
        y: r * 1.46,
        z: r * 0.52,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// towWinch
// ---------------------------------------------------------------------------

/**
 * The bigger deck tow winch: drum, gearbox, fairlead, two bollards.
 *
 * THE GEARBOX REACHES BACK. The gearbox block extends behind z=0 by r*0.85
 * so the winch assembly overlaps the deck or hull face it is bolted to.
 * The fairlead and bollards are forward; the gearbox is the anchor.
 */
export function towWinch(b, st, { r = 0.34, len = 0.6, ry = 0, seed = 1 }) {
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Gearbox block — extends BEHIND frame origin, overlaps the deck.
    box(b, 'hull', weather(st.hull, 1), r * 1.80, r * 1.50, r * 1.60, {
      z: -r * 0.55,
    });
    // Gearbox lid — slightly different tone for a bolted-plate read.
    box(b, 'hull', weather(st.hullDark, 1), r * 1.70, r * 0.22, r * 1.50, {
      y:  r * 0.76,
      z: -r * 0.55,
    });

    // Main drum (axis along X).
    cyl(b, 'hull', weather(st.hull, 2), r, r, len, 10, {
      rx: Math.PI / 2,
      z:  r * 0.75,
    });
    // Cable bight on drum.
    cyl(b, 'hull', st.hullDark, r * 1.10, r * 1.10, len * 0.45, 10, {
      rx: Math.PI / 2,
      z:  r * 0.75,
    });
    // Drum flanges.
    for (const sx of [-1, 1]) {
      cyl(b, 'hull', st.trim, r * 1.28, r * 1.28, len * 0.07, 10, {
        rx: Math.PI / 2,
        z:  r * 0.75 + sx * len * 0.46,
      });
    }

    // Fairlead — cream arch forward of the drum.
    box(b, 'hull', st.trim, r * 2.10, r * 0.20, r * 0.30, {
      y:  r * 1.10,
      z:  r * 1.55,
    });
    // Fairlead cheeks.
    for (const sx of [-1, 1]) {
      box(b, 'hull', st.trim, r * 0.20, r * 0.90, r * 0.30, {
        x: sx * r * 0.95,
        y: r * 0.60,
        z: r * 1.55,
      });
    }

    // Two bollards flanking the fairlead.
    for (const sx of [-1, 1]) {
      cyl(b, 'hull', weather(st.trim, 1), r * 0.26, r * 0.26, r * 0.90, 6, {
        x: sx * r * 1.30,
        y: r * 0.45,
        z: r * 1.40,
      });
      // Bollard cap — slightly wider.
      cyl(b, 'hull', st.trim, r * 0.35, r * 0.35, r * 0.12, 6, {
        x: sx * r * 1.30,
        y: r * 0.90,
        z: r * 1.40,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// floodLamp
// ---------------------------------------------------------------------------

/**
 * A shrouded work floodlight on a bracket. FLOOD lens; the bracket reaches
 * back past z=0 so it mounts INTO a hull or mast face.
 *
 * THE BRACKET REACHES BACK. The mounting plate extends to z = -arm, giving
 * the attach audit a real overlap. A shroud that begins at z=0 is tangent.
 *
 * tilt: positive tilts the flood downward (positive rx) for deck illumination.
 */
export function floodLamp(b, st, { r = 0.14, arm = 0.26, ry = 0, tilt = 0 }) {
  b.push(0, 0, 0, ry, 0, 0);

    // Mounting plate — broader than the arm, back edge at z = -arm*0.95.
    box(b, 'hull', weather(st.hull, 1), r * 1.40, r * 1.10, arm * 0.40, {
      z: -arm * 0.75,
    });

    // Arm from plate to shroud.
    box(b, 'hull', st.trim, r * 0.55, r * 0.45, arm * 1.50, {
      z: -arm * 0.25,  // back edge at −arm*1.0, front at +arm*0.5
    });

    // Shroud housing.
    cyl(b, 'hull', weather(st.hull, 2), r * 1.20, r * 1.00, r * 1.40, 8, {
      rx: Math.PI / 2 + tilt,
      z:  arm * 0.55,
    });

    // Cream lip at the shroud opening — reads as a separate machined ring.
    torus(b, 'hull', st.trim, r * 1.10, r * 0.10, 6, 10, undefined, {
      rx: Math.PI / 2 + tilt,
      z:  arm * 0.55 + r * 0.72,
    });

    // FLOOD lens inset ~0.06 inside the shroud mouth (not a painted face).
    cyl(b, 'lights', FLOOD, r * 0.78, r * 0.78, r * 0.12, 8, {
      rx: Math.PI / 2 + tilt,
      z:  arm * 0.55 + r * 0.60,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// deckPlate
// ---------------------------------------------------------------------------

/**
 * A working deck: a deck PLATE that overlaps its mount, plus HUMAN railing on
 * the deck and optional lamp posts. A rail without a deck plate floats — this
 * motif exists to prevent that defect (§9 item 7).
 *
 * PLATE OVERLAPS ITS MOUNT. The deck slab is centred at z=d*0.1 so its back
 * edge reaches to z = -d*0.4, behind the frame origin, overlapping whatever
 * surface the caller set the frame against. The rail sits on the plate surface,
 * not beside it.
 *
 * Lamp count is clamped to round(w / HUMAN.lampGap) — never lampSize.
 */
export function deckPlate(b, st, { w, d, ry = 0, rail = true, lamps = 0, seed = 1 }) {
  const rnd   = rng(seed);
  const deckT = 0.09;  // deck plate thickness — explicit, never default

  b.push(0, 0, 0, ry, 0, 0);

    // Deck plate — back edge at z = -d*0.4 (behind origin = overlaps mount).
    box(b, 'hull', weather(st.hull, 1), w, deckT, d, {
      z: d * 0.10,
    });

    // Cream coaming along the aft edge — also reaches slightly behind origin.
    box(b, 'hull', st.trim, w * 1.04, deckT * 1.80, d * 0.12, {
      y:  deckT * 0.40,
      z: -d * 0.38,
    });

    if (rail) {
      // Forward rail.
      railing(b, 'hull', st.trim, {
        ax: -w * 0.46, ay: deckT * 0.50, az:  d * 0.58,
        bx:  w * 0.46, by: deckT * 0.50, bz:  d * 0.58,
        height: HUMAN.railH,
        posts: Math.max(2, Math.round(w / HUMAN.lampGap) + 1),
        rail: HUMAN.railPost,
      });
      // Port and starboard side rails.
      for (const sx of [-1, 1]) {
        railing(b, 'hull', st.trim, {
          ax: sx * w * 0.46, ay: deckT * 0.50, az: -d * 0.25,
          bx: sx * w * 0.46, by: deckT * 0.50, bz:  d * 0.58,
          height: HUMAN.railH, posts: 2, rail: HUMAN.railPost,
        });
      }
    }

    // Optional lamp posts at the rail top — count from HUMAN.lampGap.
    if (lamps > 0) {
      const nLamps = Math.min(lamps, Math.max(1, Math.round(w / HUMAN.lampGap)));
      lampString(b, 'lights', LAMP, {
        ax: -w * 0.35, ay: deckT * 0.50 + HUMAN.railH, az: d * 0.40,
        bx:  w * 0.35, by: deckT * 0.50 + HUMAN.railH, bz: d * 0.40,
        count: nLamps,
        size:  HUMAN.lampSize,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// patchPanel
// ---------------------------------------------------------------------------

/**
 * One clearly REPLACED hull panel — a differently toned plate standing `proud`
 * of the skin with visible bolt heads and a weld strap. The read: someone came
 * alongside, pulled a damaged section, welded in what they had.
 *
 * INDEX NOT COLOUR. `i` selects a donor tone by `i % st.patch.length`. Geometry
 * never inspects a hex value to make a layout decision (pirate-bake contract §2).
 *
 * THE STRAP REACHES BACK. The weld-strap border extends behind z=0 by
 * proud*0.75, so the attach audit sees the panel overlapping the hull beneath
 * it, not floating in front.
 */
export function patchPanel(b, st, { w, h, i = 0, ry = 0, proud = 0.05, seed = 1 }) {
  const rnd  = rng(seed);
  // Index only — never read the hex value.
  const tone = st.patch[i % st.patch.length];

  b.push(0, 0, 0, ry, 0, 0);

    // Weld-strap border — wider than the plate, reaches BEHIND origin.
    box(b, 'hull', weather(st.hull, 1), w * 1.12, h * 1.12, proud * 1.50, {
      z: -proud * 0.50,  // spans −proud*1.25 to +proud*0.25
    });

    // Replacement plate.
    box(b, 'hull', tone, w, h, proud, {
      z: proud * 0.50,   // spans 0 to +proud
    });

    // Corner bolt bosses (4) — short stubby cylinders, each a distinct part.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        cyl(b, 'hull', weather(st.trim, 1), proud * 0.55, proud * 0.55, proud * 0.90, 6, {
          rx: Math.PI / 2,
          x:  sx * w * 0.42,
          y:  sy * h * 0.42,
          z:  proud * 0.95,
        });
      }
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// boltOnArmour
// ---------------------------------------------------------------------------

/**
 * Bolt-on armour: a slab standing off the hull on stand-off PADS (`stand`),
 * with corner bolts. The pads are what connect it — the slab alone is an island
 * (§9 item 4 and the companion to that defect in body.js §9 item 5).
 *
 * STAND-OFF PADS ARE THE ATTACHMENT. Four corner pads extend behind z=0 by
 * stand*0.9, creating bounding-box overlap with the hull face. The slab sits
 * forward of the pads, connected to them by their z overlap at +stand*0.5.
 *
 * Slab tone comes from a seeded index — geometry never reads a colour.
 */
export function boltOnArmour(b, st, { w, h, d = 0.16, ry = 0, stand = 0.1, seed = 1 }) {
  const rnd      = rng(seed);
  const toneIdx  = Math.floor(rnd() * (st.patch.length + 1));
  const slabTone = toneIdx < st.patch.length ? st.patch[toneIdx] : st.hull;

  b.push(0, 0, 0, ry, 0, 0);

    // Four stand-off pads — corner blocks, back edge at z = -stand*1.3.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        box(b, 'hull', weather(st.hull, 1), w * 0.20, h * 0.18, stand * 1.80, {
          x:  sx * w * 0.38,
          y:  sy * h * 0.38,
          z: -stand * 0.40,   // back edge −stand*1.3, front edge +stand*0.5
        });
      }
    }

    // Armour slab atop the pads — connected because it overlaps at z = +stand.
    box(b, 'hull', slabTone, w, h, d, {
      z: stand,
    });

    // Weld-strap frame along top and bottom edges of the slab.
    box(b, 'hull', weather(st.trim, 2), w * 1.06, h * 0.08, d * 1.05, {
      y:  h * 0.54,
      z:  stand,
    });
    box(b, 'hull', weather(st.trim, 2), w * 1.06, h * 0.08, d * 1.05, {
      y: -h * 0.54,
      z:  stand,
    });

    // Corner bolt heads — squat cylinders, one per corner.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        cyl(b, 'hull', st.trim, d * 0.42, d * 0.42, d * 0.70, 6, {
          rx: Math.PI / 2,
          x:  sx * w * 0.42,
          y:  sy * h * 0.42,
          z:  stand + d * 0.85,
        });
      }
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// militiaTurret
// ---------------------------------------------------------------------------

/**
 * A militia defensive turret: a low ring tub, a compact pivot and short paired
 * barrels. Civilian gear pressed into service, not a warship battery.
 *
 * CIVILIAN RESTRAINT. The ring is wider than it is tall; the barrels are barely
 * longer than the ring. This is not a warship weapon — it is a repurposed
 * agricultural platform with paired hunting barrels welded on.
 *
 * THE FLANGE REACHES BACK. The mounting flange extends to z = -h*0.49, so the
 * turret seats INTO the deck or hull rather than resting on its surface.
 */
export function militiaTurret(b, st, { r = 0.3, h = 0.28, barrels = 2, ry = 0, seed = 1 }) {
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Mounting flange — reaches BEHIND frame origin.
    cyl(b, 'hull', weather(st.hull, 1), r * 1.55, r * 1.55, h * 0.55, 8, {
      rx: Math.PI / 2,
      z: -h * 0.22,   // centre −0.22h, back edge −0.495h
    });

    // Low ring tub — the main body.
    cyl(b, 'hull', weather(st.hull, 2), r * 1.40, r * 1.30, h * 0.85, 8, {
      rx: Math.PI / 2,
      z:  h * 0.20,
    });

    // Cream trim band around tub top — reads as a separate welded collar.
    torus(b, 'hull', st.trim, r * 1.38, h * 0.07, 8, 10, undefined, {
      rx: Math.PI / 2,
      z:  h * 0.62,
    });

    // Compact pivot inside the tub.
    cyl(b, 'hull', st.trim, r * 0.62, r * 0.55, h * 0.65, 8, {
      rx: Math.PI / 2,
      z:  h * 0.30,
    });

    // Short paired barrels — each a stepped cylinder with a muzzle cap.
    const barrelR   = r * 0.18;
    const barrelLen = h * 1.05;
    for (let i = 0; i < barrels; i++) {
      const bx = barrels > 1 ? (i - (barrels - 1) / 2) * r * 0.42 : 0;

      cyl(b, 'hull', weather(st.hullDark, 1), barrelR, barrelR * 0.90, barrelLen, 6, {
        rx: Math.PI / 2,
        x:  bx,
        z: -h * 0.22 - barrelLen * 0.50,
      });
      // Muzzle cap — squat, slightly wider.
      cyl(b, 'hull', st.trim, barrelR * 1.22, barrelR * 1.22, barrelLen * 0.10, 6, {
        rx: Math.PI / 2,
        x:  bx,
        z: -h * 0.22 - barrelLen,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// airlockCollar
// ---------------------------------------------------------------------------

/**
 * A wide airlock / dock collar: HUMAN.collarR bore, cream ring, grab rails,
 * approach lamps SEATED ON the ring face, and a shank behind the ring that
 * reaches into the hull it is set into.
 *
 * THE SHANK REACHES BACK. The cylindrical shank extends behind z=0 by
 * len*0.45, so the collar sits INTO the hull rather than resting against it.
 * Without a shank the collar is a tangent touch and fails the attach audit.
 *
 * LAMPS SEATED ON THE RING. Approach lamps sit on small bosses mounted to the
 * forward face of the collar ring, not floating beside it (§9 item 5).
 */
export function airlockCollar(b, st, { r = HUMAN.collarR, len = 0.4, ry = 0, seed = 1 }) {
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Shank cylinder — reaches BEHIND frame origin.
    cyl(b, 'hull', st.hull, r * 1.22, r * 1.22, len * 1.45, 10, {
      rx: Math.PI / 2,
      z: -len * 0.225,   // back edge −len*0.95, front edge +len*0.50
    });

    // Collar ring — cream, wider than the shank.
    cyl(b, 'hull', st.trim, r * 1.55, r * 1.55, len * 0.22, 10, {
      rx: Math.PI / 2,
      z:  len * 0.40,
    });

    // Recessed bore face visible from outside.
    cyl(b, 'hull', st.hullDark, r, r, len * 0.55, 10, {
      rx: Math.PI / 2,
      z:  len * 0.18,
    });

    // Grab rails port and starboard, each on a BRACKET that reaches from the
    // shank out under the rail. The rails alone stood 0.15 clear of the collar
    // ring and the smoke probe read six floating members: a rail is a run on a
    // mount, never a run in space (§9 item 7).
    for (const sx of [-1, 1]) {
      box(b, 'hull', weather(st.trim, 1), r * 0.75, 0.10, 0.07, {
        x: sx * r * 1.475,
        y: 0.06,
        z: 0,
      });
      railing(b, 'hull', st.trim, {
        ax: sx * r * 1.80, ay: -r * 0.50, az: 0,
        bx: sx * r * 1.80, by:  r * 0.50, bz: 0,
        height: HUMAN.railH * 0.70, posts: 2, rail: HUMAN.railPost,
      });
    }

    // Approach lamp bosses and lamps SEATED ON the collar ring face.
    for (const sx of [-1, 1]) {
      box(b, 'hull', weather(st.trim, 1),
        HUMAN.lampSize * 1.20, HUMAN.lampSize * 1.20, HUMAN.lampSize * 0.60, {
        x: sx * r * 1.35,
        y: r * 0.60,
        z: len * 0.52,
      });
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.50, {
        x: sx * r * 1.35,
        y: r * 0.60,
        z: len * 0.54,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// habDrum
// ---------------------------------------------------------------------------

/**
 * A habitation drum: hooped cylinder, warm window bands around it (HUMAN
 * windows, count from circumference / HUMAN.windowGap), an external ladder
 * and a porch light. The freighter's neighbourhood.
 *
 * WINDOWS FROM CIRCUMFERENCE. count = floor(2π·r / HUMAN.windowGap) so the
 * windows tile the drum without packing edge to edge. A fixed count would
 * break scale across classes.
 *
 * HOOPS ARE THE FACTION SIGNAL. The Compact's habitation drums read like
 * grain silos: structural hoops over a pale body, warm windows in a band,
 * a ladder on one side, a porch lamp by the hatch. A tank has none of that.
 *
 * THE DRUM REACHES BACK. The drum cylinder extends to z = -len*0.50, behind
 * the frame origin, so the motif overlaps the hull or structural volume it is
 * mounted against.
 */
export function habDrum(b, st, { r, len, ry = 0, rings = 3, windows = true, seed = 1 }) {
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Main drum body — cream/trim, the inhabited read.
    // Centre at z = len*0.05: spans −len*0.50 to +len*0.60 (overlaps mount).
    cyl(b, 'hull', st.trim, r, r, len * 1.10, 14, {
      rx: Math.PI / 2,
      z:  len * 0.05,
    });

    // End caps — slightly wider ring.
    for (const sz of [-1, 1]) {
      cyl(b, 'hull', weather(st.trim, 1), r * 1.05, r * 1.05, len * 0.08, 14, {
        rx: Math.PI / 2,
        z:  sz * len * 0.59,
      });
    }

    // Structural hoops — the grain-silo / Compact DNA.
    for (let i = 0; i < rings; i++) {
      const hz = -len * 0.40 + (i / Math.max(1, rings - 1)) * len * 0.80;
      torus(b, 'hull', weather(st.hull, 1), r * 1.04, r * 0.055, 12, 10, undefined, {
        rx: Math.PI / 2,
        z:  hz,
      });
    }

    // Warm window band around the drum circumference.
    // CORRECTIVE PASS: Each window is a hull well at the drum surface radius r,
    // plus a lit pane inset inside the well. This guarantees the flood fill sees
    // hull cells (well + drum shell) adjacent to every lit cell.
    // Individual boxes with rx=PI/2, rz=a orient the window so:
    //   box W (= windowD) runs radially outward
    //   box H (= windowH) runs along the drum Z axis
    //   box D (= windowW) runs tangentially (visible width from outside)
    if (windows) {
      const winCount = Math.max(2, Math.floor((2 * Math.PI * r) / HUMAN.windowGap));
      const wellD = HUMAN.windowD * 2.2; // Same as warmWindowRow
      for (let i = 0; i < winCount; i++) {
        const a = (i / winCount) * Math.PI * 2;
        // Hull well at the drum surface radius r — overlaps the drum shell.
        box(b, 'hull', weather(st.trim, 1), HUMAN.windowD * 1.2, HUMAN.windowH * 1.4, wellD, {
          rx: Math.PI / 2,
          rz: a,
          x: r * Math.cos(a),
          y: r * Math.sin(a),
          z: 0,
        });
        // Lit pane inset inside the well — overlaps the well.
        box(b, 'lights', GLASS, HUMAN.windowD, HUMAN.windowH, HUMAN.windowW, {
          rx: Math.PI / 2,
          rz: a,
          x: (r - wellD * 0.5) * Math.cos(a),
          y: (r - wellD * 0.5) * Math.sin(a),
          z: 0,
        });
      }
    }

    // External ladder running along the drum Z axis on the +X side.
    // Implemented with individual boxes because station-detail's ladder()
    // runs along Y and would need a frame reorientation that obscures intent.
    {
      const lLen   = len * 0.70;
      const stileD = 0.04;
      // Two stiles running along Z.
      for (const ly of [-HUMAN.ladderW * 0.45, HUMAN.ladderW * 0.45]) {
        box(b, 'hull', st.trim, stileD, stileD, lLen, {
          x: r * 1.04 + stileD * 0.50,
          y: ly,
          z: 0,
        });
      }
      // Cross rungs running along Y between the stiles.
      const nRungs = Math.max(3, Math.round(lLen / 0.28));
      for (let ri = 0; ri < nRungs; ri++) {
        const rz = -lLen * 0.50 + (ri / Math.max(1, nRungs - 1)) * lLen;
        box(b, 'hull', st.trim, stileD, HUMAN.ladderW, stileD, {
          x: r * 1.04 + stileD * 0.50,
          y: 0,
          z: rz,
        });
      }
    }

    // Porch lamp boss near the forward hatch.
    box(b, 'hull', weather(st.trim, 1),
      HUMAN.lampSize * 1.30, HUMAN.lampSize * 1.30, HUMAN.lampSize * 0.70, {
      x: r * 0.50,
      y: r * 0.85,
      z: len * 0.55,
    });
    // Porch light DIM — seated on the boss, inset ~0.03.
    box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.50, {
      x: r * 0.50,
      y: r * 0.85,
      z: len * 0.57,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// cargoPod
// ---------------------------------------------------------------------------

/**
 * A donated cargo pod: box in donor tone `i`, cream strapping, corner
 * fittings, one lit telltale. `i` is an index into st.patch — geometry never
 * inspects a hex value to derive it (pirate-bake contract §2).
 *
 * STRAPPING IS HISTORY. The cream bands read as the pod having been secured
 * by a different yard. The corner fittings are the mounting points. The rear
 * cleat extends behind z=0 so the pod overlaps its carrier.
 */
export function cargoPod(b, st, { w, h, d, i = 0, ry = 0, seed = 1 }) {
  const rnd  = rng(seed);
  const tone = st.patch[i % st.patch.length];   // index only

  b.push(0, 0, 0, ry, 0, 0);

    // Rear cleat — extends BEHIND frame origin, the attachment geometry.
    box(b, 'hull', weather(st.hull, 1), w * 0.65, h * 0.20, d * 0.35, {
      y: -h * 0.44,
      z: -d * 0.12,   // back edge at −d*0.295
    });

    // Main pod body in donor tone.
    box(b, 'hull', tone, w, h, d * 0.95, {
      z: d * 0.025,   // back edge at −d*0.45 — overlaps cleat range
    });

    // Two circumferential cream strapping bands.
    for (let k = 0; k < 2; k++) {
      const bz = -d * 0.20 + k * d * 0.55;
      // Horizontal strap.
      box(b, 'hull', st.trim, w * 1.04, h * 0.11, d * 0.10, { z: bz });
      // Vertical strap.
      box(b, 'hull', st.trim, w * 0.11, h * 1.04, d * 0.10, { z: bz });
    }

    // Corner fittings on the forward face.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        box(b, 'hull', weather(st.trim, 1), w * 0.15, h * 0.15, d * 0.13, {
          x: sx * w * 0.44,
          y: sy * h * 0.44,
          z: d * 0.48,
        });
      }
    }

    // Lit telltale on the forward face — seated on the pod body.
    box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize * 0.70, HUMAN.lampSize * 0.50, {
      y: h * 0.35,
      z: d * 0.50,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// craftDock
// ---------------------------------------------------------------------------

/**
 * A family-craft dock: an open cradle with clamps and approach lamps seated on
 * the cradle arms. Where the kids' runabout lives.
 *
 * CRADLE ARMS REACH BACK. The base spar extends behind z=0 by d*0.5, so the
 * dock overlaps the hull flank or sponson it is welded to. The lamps sit on
 * the forward crossbar face — not floating beside it.
 *
 * Open cradle means the craft is visible from the side, not enclosed in a bay.
 */
export function craftDock(b, st, { w = 1.2, d = 1.8, ry = 0, seed = 1 }) {
  const rnd  = rng(seed);
  const armH = w * 0.35;
  const armD = d * 1.25;

  b.push(0, 0, 0, ry, 0, 0);

    // Base spar — structural spine, reaches BEHIND frame origin.
    box(b, 'hull', weather(st.hull, 1), w * 1.10, armH * 0.40, armD, {
      y: -armH * 0.80,
      z:  d * 0.125,    // centre d*0.125, depth armD=d*1.25 → back edge −d*0.50
    });

    // Side cradle arms (port and starboard).
    for (const sx of [-1, 1]) {
      box(b, 'hull', st.trim, w * 0.16, armH, armD, {
        x:  sx * w * 0.48,
        z:  d * 0.125,
      });
      // Clamp block on arm.
      box(b, 'hull', weather(st.hull, 2), w * 0.28, armH * 0.65, d * 0.20, {
        x: sx * w * 0.48,
        y: armH * 0.30,
        z: d * 0.45,
      });
    }

    // Forward crossbar.
    box(b, 'hull', st.trim, w * 1.04, armH * 0.30, armH * 0.30, {
      z: d * 0.72,
    });

    // Approach lamps SEATED ON the crossbar face — count from HUMAN.lampGap.
    const nLamps = Math.max(1, Math.round(w / HUMAN.lampGap));
    lampString(b, 'lights', LAMP, {
      ax: -w * 0.40, ay: armH * 0.30, az: d * 0.75,
      bx:  w * 0.40, by: armH * 0.30, bz: d * 0.75,
      count: nLamps,
      size:  HUMAN.lampSize,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// driveCluster
// ---------------------------------------------------------------------------

/**
 * An old but well-maintained main drive: housing, radiator fins, recessed
 * thrust throats (lights), and exposed service piping. Closes a stern.
 *
 * OLD BUT MAINTAINED. The housing shows weathered tone variants; the radiator
 * fins are cream trim (kept clean); the service piping is exposed but not
 * corroded. This drive has been rebuilt twice but never replaced.
 *
 * THE HOUSING CLOSES THE STERN. It occupies z from -len to 0, filling whatever
 * stern void the class body leaves. The fore face (z=0) overlaps the hull via
 * a face plate that reaches slightly into the hull's aft section.
 *
 * EMISSIVE THROATS ARE DEEP INSIDE. The lights-channel cylinders sit inside
 * the modelled nozzle rings — never a painted face on the aft plate.
 */
export function driveCluster(b, st, { w, h, len, throats = 2, ry = 0, seed = 1 }) {
  const rnd = rng(seed);
  const hw  = w * 1.08;
  const hh  = h * 1.08;

  b.push(0, 0, 0, ry, 0, 0);

    // Drive housing — spans z from -len to 0.
    box(b, 'hull', weather(st.hull, 1), hw * 2, hh * 2, len, {
      z: -len * 0.50,
    });

    // Face plate at the fore end — overlaps the hull's aft section by len*0.03.
    box(b, 'hull', weather(st.hullDark, 1), hw * 2.06, hh * 2.06, len * 0.14, {
      z: len * 0.04,   // spans −len*0.03 to +len*0.11
    });

    // Mid-section structural rib — stands proud of the housing.
    box(b, 'hull', st.trim, hw * 2.12, hh * 2.12, len * 0.06, {
      z: -len * 0.50,
    });

    // Radiator fins on top and bottom — each overlaps the housing sides.
    for (const sy of [1, -1]) {
      radiatorPanel(b, 'hull', weather(st.trim, 1), weather(st.hullDark, 1), {
        x: 0, y: sy * (hh + len * 0.06), z: -len * 0.50,
        w: w * 1.60, h: len * 0.42, fins: 5, ry: 0,
        thick: Math.max(0.06, w * 0.04),
      });
    }

    // Exposed service piping along the flanks.
    for (const sx of [-1, 1]) {
      pipeRun(b, 'hull', weather(st.trim, 2), {
        ax: sx * (hw + 0.06), ay: hh * 0.50, az:  len * 0.08,
        bx: sx * (hw + 0.06), by: hh * 0.50, bz: -len * 0.88,
        r: Math.max(0.04, w * 0.038), seg: 6, collars: 2,
      });
    }

    // Recessed thrust throats — nozzle rings with emissive cores INSIDE.
    const tr = Math.min(hw, hh) * (throats > 2 ? 0.28 : 0.38);
    for (let i = 0; i < throats; i++) {
      const a  = (i / throats) * Math.PI * 2 + Math.PI / throats;
      const tx = Math.cos(a) * hw * 0.52;
      const ty = Math.sin(a) * hh * 0.52;

      // Outer nozzle ring.
      cyl(b, 'hull', weather(st.hull, 0), tr * 1.35, tr * 1.20, len * 0.22, 8, {
        rx: Math.PI / 2,
        x: tx, y: ty, z: -len * 0.12,
      });
      // Inner nozzle step.
      cyl(b, 'hull', weather(st.hullDark, 2), tr, tr * 0.82, len * 0.16, 8, {
        rx: Math.PI / 2,
        x: tx, y: ty, z: -len * 0.06,
      });
      // Trim ring on the nozzle lip.
      torus(b, 'hull', st.trim, tr * 1.25, Math.max(0.025, w * 0.03), 6, 10, undefined, {
        x: tx, y: ty, z: -len * 0.04,
      });
      // Emissive throat deep inside — never a painted aft plate.
      cyl(b, 'lights', FLOOD, tr * 0.52, tr * 0.52, len * 0.04, 8, {
        rx: Math.PI / 2,
        x: tx, y: ty, z: -len * 0.22,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// thrusterCluster
// ---------------------------------------------------------------------------

/**
 * An exposed tuned manoeuvring cluster: `count` small nozzles on a common
 * cream mount with visible plumbing. The ace's signature.
 *
 * TUNED, NOT CRUDE. Each nozzle is a stepped cylinder — a wider outer collar
 * and a narrower inner throat — showing that someone has spent time here. The
 * mount is cream (regularly maintained), the nozzles bare metal (heat-darkened),
 * the plumbing runs exposed and functional.
 *
 * MOUNT REACHES BACK. The common mount block extends behind z=0 by mountD*0.55
 * so the cluster overlaps the hull stub or outrigger it is bolted to.
 */
export function thrusterCluster(b, st, { r = 0.18, count = 3, ry = 0, seed = 1 }) {
  const rnd    = rng(seed);
  const mountD = r * 3.20;

  b.push(0, 0, 0, ry, 0, 0);

    // Common cream mount — reaches BEHIND frame origin.
    box(b, 'hull', st.trim, r * (count + 0.8) * 0.95, r * 2.20, mountD, {
      z: -mountD * 0.30,   // back edge −mountD*0.80, front edge +mountD*0.20
    });

    // Bracket foot — broader, increases the overlap with the hull stub.
    box(b, 'hull', weather(st.hull, 1), r * (count + 1.2), r * 1.10, mountD * 0.38, {
      y: -r * 1.20,
      z: -mountD * 0.55,
    });

    // Nozzles — stepped for a tuned, hand-fitted read.
    for (let i = 0; i < count; i++) {
      const nx = (i - (count - 1) / 2) * r * 0.95;

      // Outer collar.
      cyl(b, 'hull', weather(st.hull, 2), r * 0.88, r * 0.78, r * 1.80, 8, {
        rx: Math.PI / 2,
        x:  nx,
        z:  r * 0.80,
      });
      // Inner throat.
      cyl(b, 'hull', weather(st.hullDark, 1), r * 0.55, r * 0.45, r * 1.20, 8, {
        rx: Math.PI / 2,
        x:  nx,
        z:  r * 0.90,
      });
      // Emissive core inside throat — seated deep, not on the aft face.
      cyl(b, 'lights', FLOOD, r * 0.32, r * 0.32, r * 0.12, 8, {
        rx: Math.PI / 2,
        x:  nx,
        z:  r * 1.38,
      });
    }

    // Visible plumbing — short vertical pipe from mount body to each nozzle.
    for (let i = 0; i < count; i++) {
      const nx = (i - (count - 1) / 2) * r * 0.95;
      pipeRun(b, 'hull', weather(st.trim, 2), {
        ax: nx, ay: 0,         az: -mountD * 0.10,
        bx: nx, by: -r * 0.80, bz: -mountD * 0.10,
        r: Math.max(0.03, r * 0.18), seg: 5, collars: 1,
      });
    }

  b.pop();
}
