/**
 * Red Ledger — surface-and-equipment motif library.
 *
 * Equipment language: captured hardware reorganized into a deliberate
 * predatory machine (bible §4.4).  Long grasping prows, visible clamps,
 * dark iron, tarnished copper trim, dried-red tally divisions, amber work
 * light.  Repairs are scarred but purposeful — NOT a scrap heap.
 *
 * Lights-channel constants are near-white (every sRGB channel ≥ 0.6) so
 * the additive MeshBasicMaterial's amber tint multiplies correctly:
 *   LAMP — pure white; running lights, nozzle throats.
 *   WORK — warm off-white; crew-route work lamps.
 *   SEAL — light warm; secure-zone indicators (lockbox, transfer lock).
 *   DIM  — reduced warm; caged interiors, barred gantry lights.
 *
 * Every motif takes (b, st, opts) where st is the WHOLE FACTION_STYLE
 * record.  Reading st.hull / st.hullDark / st.trim / st.accent /
 * st.patch[] directly prevents the partial-style defect (wave-2 defect 1).
 *
 * Colour selection: index into st.patch[], never reading a hex value to
 * decide a position (wave-3 defect 2: pirate bake desaturates the palette,
 * making colour-driven selection diverge between trader and pirate bakes).
 *
 * Attachment: every motif carries geometry whose back edge reaches behind
 * z = 0 (frame origin = hull surface; −Z into hull, +Z outward).  Without
 * that overlap the motif is tangent and attach-audit reports it floating
 * (wave-1 defect 1).
 */

import {
  rng, weather, box, cyl, torus,
  windowRow, railing, pipeRun, lampString, radiatorPanel,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

// ---------------------------------------------------------------------------
// Lights-channel near-whites (all sRGB channels >= 0.6).
// The additive material supplies amber; these stay near-white.
// ---------------------------------------------------------------------------

/** Running / nozzle lamp — pure neutral white. */
export const LAMP = 0xffffff;
/** Crew-route work lamp — warm off-white. */
export const WORK = 0xfff0dc;
/** Secure-zone indicator — for lockboxes and transfer locks. */
export const SEAL = 0xffe4c4;
/** Caged / dimmed interior light. */
export const DIM  = 0xe8dcc8;

// ---------------------------------------------------------------------------
// tallyGrooves
// ---------------------------------------------------------------------------

/**
 * The faction's signature mark: `count` groove cuts in a backing plate.
 * Plate overlaps the hull; dark hullDark recess boxes pitched at `pitch`
 * each filled with a dried-red accent strip.  Groove depth and tonal
 * contrast are what make this read at thumbnail size, not count.
 *
 * ATTACHMENT: backing plate centred at z=0 — back edge at −plateT*0.50.
 */
export function tallyGrooves(b, st, {
  count  = 6,
  len    = 0.5,
  pitch  = 0.16,
  ry     = 0,
  seed   = 1,
}) {
  const totW   = count * pitch;
  const plateT = 0.10;
  const grW    = pitch * 0.32;
  const grH    = len * 0.86;
  const grT    = 0.054;

  b.push(0, 0, 0, ry, 0, 0);

    // Backing plate — centre at z=0, back edge at −plateT*0.50 (behind origin).
    box(b, 'hull', st.hull, totW + pitch * 0.55, len * 1.10, plateT, { z: 0 });

    for (let k = 0; k < count; k++) {
      const gx = (k - (count - 1) * 0.5) * pitch;

      // Dark groove recess — proud of plate face, narrow = reads as a clean cut.
      // Overlaps backing plate at z > plateT * 0.25.
      box(b, 'hull', st.hullDark, grW, grH, grT, {
        x: gx, z: plateT * 0.26,
      });

      // Dried-red accent strip inside the groove — maximises contrast.
      box(b, 'hull', st.accent, grW * 0.50, grH * 0.94, grT * 0.36, {
        x: gx, z: plateT * 0.32,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// weaponShutter
// ---------------------------------------------------------------------------

/**
 * Hidden gun port: hullDark recessed well, two hull-tone shutter plates that
 * meet at centre.  When open > 0 they slide apart by open*w*0.50 to reveal a
 * copper muzzle cylinder and a WORK lamp on a pad inside the well.
 *
 * ATTACHMENT: side frames reach behind z=0.  LAMP seated on pad inside well —
 * always present, hidden behind shutters at open = 0.
 */
export function weaponShutter(b, st, {
  w    = 0.7,
  h    = 0.4,
  open = 0,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);
  const wd  = w * 0.55;   // well depth into hull
  const lp  = HUMAN.lampSize;

  b.push(0, 0, 0, ry, 0, 0);

    // Side frames — reach BEHIND z=0 (attachment) and bracket the well mouth.
    for (const sx of [-1, 1]) {
      box(b, 'hull', weather(st.hull, 1),
        0.08, h * 1.18, wd * 1.10, {
        x: sx * (w * 0.54),
        z: -wd * 0.05,    // back edge at −wd*0.60, well behind z=0
      });
    }
    box(b, 'hull', weather(st.hull, 1),  // bottom frame bar
      w * 1.16, 0.07, wd * 1.10, {
      y: -(h * 0.55), z: -wd * 0.05,
    });

    // Recessed dark well.
    box(b, 'hull', st.hullDark, w * 0.96, h * 1.02, wd, { z: -wd * 0.50 });

    // Two shutter plates — slide apart by open * w * 0.50 each.
    const shutW  = w * 0.47;
    const shutDx = w * 0.245 + open * w * 0.50;
    for (const sx of [-1, 1]) {
      box(b, 'hull', weather(st.hull, 0), shutW, h * 0.94, 0.058, {
        x: sx * shutDx, z: -0.010,
      });
    }

    // Copper muzzle — always inside the well; revealed when open > 0.
    cyl(b, 'hull', st.trim, w * 0.16, w * 0.12, wd * 0.46, 8, {
      rx: Math.PI / 2, z: -wd * 0.50,
    });

    // WORK lamp pad at well back — lamp seated ON the pad, not floating.
    box(b, 'hull', weather(st.hullDark, 1), lp * 1.6, lp * 1.6, lp * 0.70, {
      z: -wd * 0.88,
    });
    box(b, 'lights', WORK, lp, lp, lp * 0.55, {
      z: -wd * 0.88 + lp * 0.125,    // overlaps pad top face
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// commsReceiver
// ---------------------------------------------------------------------------

/**
 * Oversized collector: frustum dish of radius r and depth `depth`, copper
 * rim ring, feed mast on axis, cable run from dish side to yoke, yoke/base
 * that overlaps the hull mount.  `tilt` cants the dish (rx rotation).
 *
 * ATTACHMENT: yoke/base spans z = −0.24 to +0.04 (behind origin).
 */
export function commsReceiver(b, st, {
  r     = 0.9,
  depth = 0.4,
  tilt  = 0,
  ry    = 0,
  seed  = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Yoke / base — reaches BEHIND z=0 (attachment), back edge at −0.24.
    box(b, 'hull', weather(st.hull, 1), r * 1.85, r * 1.35, 0.28, { z: -0.10 });

    // Swivel post — overlaps yoke and bridges to dish sub-frame.
    cyl(b, 'hull', st.trim, r * 0.22, r * 0.18, r * 0.40, 8, {
      rx: Math.PI / 2, z: r * 0.22,
    });

    // Dish sub-frame with tilt.
    b.push(0, 0, 0, 0, tilt, 0);

      // Dish bowl — frustum, wide at opening (+Z), narrow at back.
      // cyl with rx=PI/2: rTop is at +Z (r = wide), rBot at −Z (narrow).
      cyl(b, 'hull', weather(st.hullDark, 1), r, r * 0.04, depth, 12, {
        rx: Math.PI / 2, z: depth * 0.50,
      });

      // Copper rim ring at dish opening — torus in XY plane (rx=PI/2), bore axis Z.
      torus(b, 'hull', st.trim, r * 0.96, r * 0.065, 10, 14, undefined, {
        rx: Math.PI / 2, z: depth,
      });

      // Feed mast along axis — back edge at z≈depth*0.50, overlaps dish.
      cyl(b, 'hull', weather(st.trim, 1), r * 0.060, r * 0.040, depth * 1.35, 6, {
        rx: Math.PI / 2, z: depth * 1.175,
      });

      // Receiver head at mast tip.
      box(b, 'hull', st.trim, r * 0.24, r * 0.24, r * 0.22, { z: depth * 1.92 });

    b.pop();

    // Cable run — dish side to yoke (outer-frame local coords, tilt=0 position).
    pipeRun(b, 'hull', weather(st.hull, 2), {
      ax: r * 0.68, ay: 0, az: depth * 0.55,
      bx: r * 0.68, by: 0, bz: -0.06,
      r: Math.max(0.04, r * 0.042), seg: 5, collars: 1,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// lockBox
// ---------------------------------------------------------------------------

/**
 * External contract lockbox: a mounting bracket behind z=0, box body with
 * copper strap bands, hasp boss, and a SEAL lamp seated on a pad on the door
 * face.
 *
 * ATTACHMENT: back bracket plate spans z = −0.22 to +0.04 (behind origin).
 */
export function lockBox(b, st, {
  w    = 0.55,
  h    = 0.45,
  d    = 0.70,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);
  const lp  = HUMAN.lampSize;

  b.push(0, 0, 0, ry, 0, 0);

    // Back bracket plate — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), w * 1.25, h * 1.20, 0.26, { z: -0.09 });

    // Lower shelf bracket (gives the L-shape, adds depth to attachment).
    box(b, 'hull', weather(st.hull, 1), w * 1.25, 0.10, d * 0.45, {
      y: -(h * 0.62), z: d * 0.225 - 0.14,
    });

    // Main box body — overlaps bracket back face at z = −0.09+0.13 = +0.04.
    box(b, 'hull', st.hull, w, h, d * 0.84, { z: d * 0.08 });

    // Copper strap bands — two circumferential rings.
    for (const bz of [-d * 0.16, d * 0.22]) {
      box(b, 'hull', st.trim, w * 1.04, h * 0.10, d * 0.86, { z: bz + d * 0.08 });
      box(b, 'hull', st.trim, w * 0.10, h * 1.04, d * 0.86, { z: bz + d * 0.08 });
    }

    // Hasp boss — small copper block on the door face.
    box(b, 'hull', st.trim, w * 0.28, h * 0.20, 0.08, { z: d * 0.50 });

    // SEAL lamp pad on door face — lamp seated ON the pad.
    box(b, 'hull', weather(st.trim, 1),
      lp * 1.5, lp * 1.5, lp * 0.65, {
      y: h * 0.32, z: d * 0.50,
    });
    box(b, 'lights', SEAL, lp, lp, lp * 0.55, {
      y: h * 0.32, z: d * 0.50 + lp * 0.10,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// clampJaw
// ---------------------------------------------------------------------------

/**
 * A grapple claw head: hub cylinder with shank behind z=0, `jaws` curved
 * fingers splayed by `open` (pipeRun from hub edge forward+outward), copper
 * pivot bosses at jaw roots, and hydraulic rams from hub to jaw mid-point.
 *
 * ATTACHMENT: hub shank spans z = −r*1.05 to +r*0.35 (behind origin).
 */
export function clampJaw(b, st, {
  r    = 0.5,
  jaws = 3,
  open = 0.4,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd     = rng(seed);
  const jawLen  = r * 2.4;
  const splay   = open * r * 0.80;  // how far each jaw tip spreads radially

  b.push(0, 0, 0, ry, 0, 0);

    // Hub cylinder — shank reaches BEHIND z=0 (attachment).
    cyl(b, 'hull', st.hull, r * 0.78, r * 0.78, r * 1.40, 10, {
      rx: Math.PI / 2, z: -r * 0.35,
    });

    // Hub forward cap — overlaps hub, bridges to jaw roots.
    cyl(b, 'hull', weather(st.hull, 1), r * 0.68, r * 0.60, r * 0.26, 10, {
      rx: Math.PI / 2, z: r * 0.38,
    });

    for (let k = 0; k < jaws; k++) {
      const a  = (k / jaws) * Math.PI * 2;
      const rx0 = Math.cos(a) * r * 0.72;
      const ry0 = Math.sin(a) * r * 0.72;
      const rx1 = Math.cos(a) * (r * 0.72 + splay);
      const ry1 = Math.sin(a) * (r * 0.72 + splay);

      // Jaw finger — from hub edge, spreading forward+outward.
      pipeRun(b, 'hull', weather(st.hull, 2), {
        ax: rx0, ay: ry0, az: r * 0.35,
        bx: rx1, by: ry1, bz: r * 0.35 + jawLen,
        r: r * 0.18, seg: 6, collars: 1,
      });

      // Copper pivot boss at jaw root — overlaps jaw start.
      box(b, 'hull', st.trim, r * 0.28, r * 0.28, r * 0.22, {
        x: rx0, y: ry0, z: r * 0.50,
      });

      // Hydraulic ram — from hub inner edge to jaw midpoint.
      pipeRun(b, 'hull', weather(st.trim, 1), {
        ax: rx0 * 0.60, ay: ry0 * 0.60, az: r * 0.42,
        bx: (rx0 + rx1) * 0.50, by: (ry0 + ry1) * 0.50,
        bz: r * 0.35 + jawLen * 0.48,
        r: r * 0.10, seg: 5, collars: 0,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// magClamp
// ---------------------------------------------------------------------------

/**
 * A flat magnetic pad clamp: disc pad, stand-off boss, copper coil ring,
 * and WORK lamp pucks around the rim seated ON the pad — never floating.
 *
 * ATTACHMENT: base shank behind z=0, back edge at −r*0.50.
 */
export function magClamp(b, st, {
  r    = 0.45,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);
  const lp  = HUMAN.lampSize;

  b.push(0, 0, 0, ry, 0, 0);

    // Mounting shank — reaches BEHIND z=0 (attachment).
    cyl(b, 'hull', weather(st.hull, 1), r * 0.52, r * 0.52, r * 1.05, 8, {
      rx: Math.PI / 2, z: -r * 0.175,    // back edge −r*0.70, overlaps mount
    });

    // Disc pad — the clamping face.
    cyl(b, 'hull', st.hull, r, r, r * 0.32, 12, {
      rx: Math.PI / 2, z: r * 0.32,
    });

    // Copper coil ring — proud of pad face.
    torus(b, 'hull', st.trim, r * 0.76, r * 0.09, 10, 12, undefined, {
      rx: Math.PI / 2, z: r * 0.50,
    });

    // WORK lamp pucks evenly around the rim, seated ON the pad face.
    const nLamps = Math.max(4, Math.round((2 * Math.PI * r * 0.88) / HUMAN.lampGap));
    for (let k = 0; k < nLamps; k++) {
      const a = (k / nLamps) * Math.PI * 2;
      // Lamp pad (hull channel) — seated ON the disc pad.
      box(b, 'hull', weather(st.trim, 1),
        lp * 1.4, lp * 1.4, lp * 0.60, {
        x: Math.cos(a) * r * 0.86,
        y: Math.sin(a) * r * 0.86,
        z: r * 0.50,
      });
      // WORK lamp seated on the pad — overlaps pad top.
      box(b, 'lights', WORK, lp, lp, lp * 0.50, {
        x: Math.cos(a) * r * 0.86,
        y: Math.sin(a) * r * 0.86,
        z: r * 0.50 + lp * 0.10,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// winchDrum
// ---------------------------------------------------------------------------

/**
 * Cable drum with wound cable ribs, gearbox block that reaches behind z=0,
 * a fairlead with copper rollers, and a base plate overlapping the mount.
 *
 * ATTACHMENT: gearbox extends to z = −r*1.15 (behind origin).
 */
export function winchDrum(b, st, {
  r    = 0.4,
  len  = 0.7,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Base plate — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), r * 2.60, r * 1.40, r * 0.54, {
      z: -r * 0.27,
    });

    // Gearbox block — additional attachment depth behind z=0.
    box(b, 'hull', weather(st.hull, 2), r * 1.60, r * 1.60, r * 0.90, {
      x: r * 0.70, z: -r * 0.70,
    });
    // Gearbox lid, slight darker tone.
    box(b, 'hull', weather(st.hullDark, 1), r * 1.52, r * 0.22, r * 0.88, {
      x: r * 0.70, y: r * 0.80, z: -r * 0.70,
    });

    // Main drum (axis along X via rx=PI/2).
    cyl(b, 'hull', weather(st.hull, 1), r, r, len, 10, {
      rx: Math.PI / 2, z: r * 0.80,
    });
    // Cable bight band — fatter ring showing loaded cable.
    cyl(b, 'hull', st.hullDark, r * 1.08, r * 1.08, len * 0.48, 10, {
      rx: Math.PI / 2, z: r * 0.80,
    });
    // Drum flanges at each end — copper.
    for (const sx of [-1, 1]) {
      cyl(b, 'hull', st.trim, r * 1.22, r * 1.22, len * 0.07, 10, {
        rx: Math.PI / 2, z: r * 0.80 + sx * len * 0.46,
      });
    }

    // Fairlead arch forward of drum — copper rollers.
    box(b, 'hull', st.trim, r * 2.10, r * 0.20, r * 0.28, {
      y: r * 1.10, z: r * 1.55,
    });
    for (const sx of [-1, 1]) {
      box(b, 'hull', st.trim, r * 0.20, r * 0.88, r * 0.28, {
        x: sx * r * 0.95, y: r * 0.60, z: r * 1.55,
      });
      // Copper roller puck in the fairlead.
      cyl(b, 'hull', st.trim, r * 0.22, r * 0.22, r * 0.18, 6, {
        rx: Math.PI / 2, x: sx * r * 0.64, y: r * 1.05, z: r * 1.55,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// transferLock
// ---------------------------------------------------------------------------

/**
 * Prisoner/cargo transfer lock: a collar of bore r and length `len` with
 * HUMAN-scale grab rails, a hatch face, and when `caged` a barred gantry
 * cage extending forward of the collar with a DIM lamp inside.
 * Bars built from individual thin boxes — not a solid block.
 *
 * ATTACHMENT: shank behind z=0, back edge at −len*0.50.
 */
export function transferLock(b, st, {
  r     = HUMAN.collarR,
  len   = 0.5,
  caged = true,
  ry    = 0,
  seed  = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd     = rng(seed);
  const cageLen = len * 1.60;
  const lp      = HUMAN.lampSize;

  b.push(0, 0, 0, ry, 0, 0);

    // Mounting shank — reaches BEHIND z=0 (attachment), back edge −len*0.50.
    cyl(b, 'hull', st.hull, r * 1.22, r * 1.22, len * 1.40, 10, {
      rx: Math.PI / 2, z: -len * 0.075,
    });

    // Collar ring — copper, wider than shank.
    cyl(b, 'hull', st.trim, r * 1.55, r * 1.55, len * 0.22, 10, {
      rx: Math.PI / 2, z: len * 0.40,
    });

    // Bore — dark interior visible from outside.
    cyl(b, 'hull', st.hullDark, r * 0.98, r * 0.98, len * 0.55, 10, {
      rx: Math.PI / 2, z: len * 0.18,
    });

    // Hatch face — flat box at forward end of collar.
    box(b, 'hull', weather(st.hull, 1), r * 1.90, r * 1.90, len * 0.10, {
      z: len * 0.54,
    });

    // HUMAN grab rails — on brackets beside the collar.
    for (const sx of [-1, 1]) {
      // Rail bracket.
      box(b, 'hull', weather(st.trim, 1),
        r * 0.70, 0.10, 0.07, {
        x: sx * r * 1.50, y: 0.06, z: 0,
      });
      railing(b, 'hull', st.trim, {
        ax: sx * r * 1.80, ay: -r * 0.46, az: 0,
        bx: sx * r * 1.80, by:  r * 0.46, bz: 0,
        height: HUMAN.railH * 0.70, posts: 2, rail: HUMAN.railPost,
      });
    }

    // Barred gantry cage extending forward of collar.
    if (caged) {
      const bars = 8;
      const cageR = r * 1.18;

      // Cage forward ring.
      torus(b, 'hull', weather(st.hull, 1), cageR, 0.055, 10, 12, undefined, {
        rx: Math.PI / 2, z: len * 0.54 + cageLen,
      });
      // Cage aft ring — overlaps the collar shank.
      torus(b, 'hull', weather(st.hull, 1), cageR, 0.055, 10, 12, undefined, {
        rx: Math.PI / 2, z: len * 0.54,
      });

      // Individual bars — thin boxes from aft to forward ring.
      for (let k = 0; k < bars; k++) {
        const a = (k / bars) * Math.PI * 2;
        pipeRun(b, 'hull', weather(st.hullDark, 1), {
          ax: Math.cos(a) * cageR, ay: Math.sin(a) * cageR, az: len * 0.54,
          bx: Math.cos(a) * cageR, by: Math.sin(a) * cageR,
          bz: len * 0.54 + cageLen,
          r: 0.04, seg: 4, collars: 0,
        });
      }

      // DIM lamp inside cage — seated on a small pad on the cage forward ring.
      box(b, 'hull', weather(st.hullDark, 1),
        lp * 1.4, lp * 1.4, lp * 0.65, {
        z: len * 0.54 + cageLen + lp * 0.35,
      });
      box(b, 'lights', DIM, lp, lp, lp * 0.50, {
        z: len * 0.54 + cageLen + lp * 0.45,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// countingHouse
// ---------------------------------------------------------------------------

/**
 * Mobile counting-house: boxy pressurised module w×h×d, copper cornice,
 * `rows` bands of HUMAN windows (well + WORK pane in the well — not inset
 * into interior, wave-3 defect 3), a HUMAN door, and roof aerials.
 *
 * ATTACHMENT: base bracket behind z=0, back edge at −d*0.26.
 */
export function countingHouse(b, st, {
  w,
  h,
  d,
  rows = 2,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Base bracket — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), w * 1.20, h * 0.14, d * 0.52, {
      y: -(h * 0.54), z: d * 0.26 - 0.26,
    });

    // Main hull box.
    box(b, 'hull', st.hull, w, h, d, { z: 0 });

    // Copper cornice along top edge.
    box(b, 'hull', st.trim, w * 1.04, h * 0.08, d * 1.04, {
      y: h * 0.54, z: 0,
    });
    // Base band.
    box(b, 'hull', weather(st.trim, 1), w * 1.04, h * 0.07, d * 1.04, {
      y: -(h * 0.51), z: 0,
    });

    // Window rows — a hullDark well proud of the hull face, WORK pane inside
    // the well.  The pane is NOT inset into the interior (wave-3 defect 3).
    const winCols    = Math.max(2, Math.floor(w / HUMAN.windowGap));
    const wellD      = HUMAN.windowD * 2.20;
    const rowSpacing = h * 0.34;
    const rowBase    = (rows === 1) ? 0 : -rowSpacing * (rows - 1) * 0.5;
    for (let ri = 0; ri < rows; ri++) {
      const wy = rowBase + ri * rowSpacing;
      // Well plate — stands on the hull outer face, does NOT go into interior.
      box(b, 'hull', st.hullDark,
        winCols * HUMAN.windowGap + HUMAN.windowGap * 0.5,
        HUMAN.windowH * 1.60, wellD, {
        y: wy, z: d * 0.51,
      });
      // WORK panes — inside the well, not inset into the hull.
      windowRow(b, 'lights', WORK, {
        count:   winCols,
        spacing: HUMAN.windowGap,
        w:       HUMAN.windowW,
        h:       HUMAN.windowH,
        d:       HUMAN.windowD,
        axis:    'x',
        y:       wy,
        z:       d * 0.51 + wellD * 0.42,
      });
    }

    // HUMAN door on forward face.
    box(b, 'hull', weather(st.hullDark, 1),
      HUMAN.doorW * 1.20, HUMAN.doorH, HUMAN.windowD * 2.20, {
      y: -(h * 0.50 - HUMAN.doorH * 0.50),
      z: d * 0.51,
    });

    // Roof aerials — thin cyl posts with a box tip each.
    for (let k = 0; k < 2; k++) {
      const ax = (k === 0) ? -w * 0.28 : w * 0.22;
      const mH  = h * 0.38;
      cyl(b, 'hull', st.trim, 0.04, 0.02, mH, 5, {
        y: h * 0.50 + mH * 0.50, x: ax, z: -d * 0.12,
      });
      box(b, 'hull', st.trim, 0.12, 0.08, 0.08, {
        y: h * 0.50 + mH + 0.04, x: ax, z: -d * 0.12,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// capturedDrive
// ---------------------------------------------------------------------------

/**
 * A drive that visibly does not match the hull: housing tone from
 * st.patch[i % st.patch.length] chosen BY INDEX (never by reading RGB).
 * A mismatched copper cradle mount with a weld collar, radiator fins, and
 * `throats` recessed nozzles with LAMP lit discs seated at the throat mouth.
 *
 * ATTACHMENT: cradle reaches behind z=0, back edge at −len*0.28.
 */
export function capturedDrive(b, st, {
  w,
  h,
  len,
  throats = 2,
  i       = 0,
  ry      = 0,
  seed    = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd     = rng(seed);
  // Captured drive tone — index only, never reads colour value.
  const capTone = st.patch[i % st.patch.length];

  b.push(0, 0, 0, ry, 0, 0);

    // Cradle mount — reaches BEHIND z=0 (attachment), back edge −len*0.28.
    box(b, 'hull', st.trim, w * 1.55, h * 1.55, len * 0.56, {
      z: -len * 0.28,
    });

    // Weld collar joining cradle to housing — straddles z=0.
    box(b, 'hull', weather(st.hullDark, 1), w * 1.26, h * 1.26, len * 0.14, {
      z: 0,
    });

    // Captured drive housing — mismatched capTone.
    box(b, 'hull', capTone, w * 2, h * 2, len, { z: -len * 0.50 });

    // Radiator fins — top and bottom, copper.
    for (const sy of [1, -1]) {
      radiatorPanel(b, 'hull', weather(st.trim, 1), weather(st.hullDark, 1), {
        x: 0, y: sy * (h + len * 0.06), z: -len * 0.50,
        w: w * 1.50, h: len * 0.40, fins: 4, ry: 0,
        thick: Math.max(0.06, w * 0.04),
      });
    }

    // Recessed nozzle throats with LAMP lit discs.
    const tr = Math.min(w, h) * (throats > 2 ? 0.28 : 0.38);
    for (let t = 0; t < throats; t++) {
      const a  = (t / throats) * Math.PI * 2 + Math.PI / throats;
      const tx = Math.cos(a) * w * 0.52;
      const ty = Math.sin(a) * h * 0.52;

      // Outer nozzle ring.
      cyl(b, 'hull', weather(st.hull, 0), tr * 1.35, tr * 1.20, len * 0.22, 8, {
        rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.12,
      });
      // Inner nozzle step — darker.
      cyl(b, 'hull', weather(st.hullDark, 2), tr, tr * 0.82, len * 0.16, 8, {
        rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.06,
      });
      // Copper trim ring on nozzle lip.
      torus(b, 'hull', st.trim, tr * 1.25, Math.max(0.025, w * 0.03), 6, 10, undefined, {
        x: tx, y: ty, z: -len * 0.04,
      });
      // LAMP throat disc — seated AT the nozzle mouth, not a painted face.
      cyl(b, 'lights', LAMP, tr * 0.52, tr * 0.52, len * 0.04, 8, {
        rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.22,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// reverseThruster
// ---------------------------------------------------------------------------

/**
 * Forward-facing braking block: squat housing, `count` forward-pointing
 * throats with WORK lit discs, copper heat straps, and a base overlapping
 * the mount.  Strong reverse thrust is a Ledger silhouette feature — the
 * throats point toward −Z (nose direction) and read from the side.
 *
 * ATTACHMENT: base extends behind z=0, back edge at −r*1.10.
 */
export function reverseThruster(b, st, {
  r     = 0.3,
  count = 2,
  ry    = 0,
  seed  = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd     = rng(seed);
  const housingW = r * (count + 0.9) * 1.10;
  const housingH = r * 2.10;
  const housingD = r * 2.80;

  b.push(0, 0, 0, ry, 0, 0);

    // Base plate — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), housingW * 1.25, housingH * 0.55, r * 0.70, {
      y: -(housingH * 0.30), z: -r * 0.75,
    });

    // Squat housing block.
    box(b, 'hull', weather(st.hull, 2), housingW, housingH, housingD, {
      z: housingD * 0.50 - r * 1.10,
    });

    // Copper heat straps — two bands.
    for (const bz of [0.20, 0.60]) {
      box(b, 'hull', st.trim, housingW * 1.04, housingH * 0.10, housingD * 1.04, {
        z: housingD * bz - r * 1.10,
      });
    }

    // Forward-pointing throats — aimed toward −Z (braking, nose direction).
    for (let k = 0; k < count; k++) {
      const nx = (k - (count - 1) * 0.5) * r * 1.00;

      // Outer collar.
      cyl(b, 'hull', weather(st.hull, 0), r * 0.88, r * 0.78, r * 1.60, 8, {
        rx: Math.PI / 2,
        x:  nx,
        z:  -(r * 1.10 - r * 0.84),  // throat mouth at z = −r*1.10 + r*1.64
      });
      // Inner throat step.
      cyl(b, 'hull', st.hullDark, r * 0.55, r * 0.45, r * 1.10, 8, {
        rx: Math.PI / 2, x: nx,
        z:  -(r * 1.10 - r * 0.59),
      });
      // WORK disc deep inside the throat — near the forward (−Z) mouth,
      // visible from the side when the thruster reads as a silhouette feature.
      cyl(b, 'lights', WORK, r * 0.32, r * 0.32, r * 0.10, 8, {
        rx: Math.PI / 2, x: nx,
        z:  -r * 0.96,   // near the forward (nose-facing) throat mouth
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// boardingSpike
// ---------------------------------------------------------------------------

/**
 * A precise boarding spike: tapered shaft of radius r running forward to
 * −len along the mount axis, four guide rails along the shaft, a copper tip
 * cone, and a base collar that overlaps the mount.
 *
 * ATTACHMENT: base collar spans z = −r*1.30 to +r*0.30 (behind origin).
 * Nose is −Z so the spike points forward (−Z direction).
 */
export function boardingSpike(b, st, {
  len  = 2.0,
  r    = 0.22,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd = rng(seed);

  b.push(0, 0, 0, ry, 0, 0);

    // Base collar — reaches BEHIND z=0 (attachment).
    cyl(b, 'hull', weather(st.hull, 1), r * 1.60, r * 1.60, r * 1.60, 10, {
      rx: Math.PI / 2, z: -r * 0.50,    // spans −r*1.30 to +r*0.30
    });

    // Main tapered shaft — points forward (−Z is nose direction).
    // rTop at +Z end (stern side, near base) = r; rBot at −Z (tip) = r*0.18.
    cyl(b, 'hull', st.hull, r, r * 0.18, len, 8, {
      rx: Math.PI / 2, z: -r * 0.30 - len * 0.50,
    });

    // Four guide rails on the REAR of the shaft, where the shaft is fat.
    // They used to run len*0.90 at radius r*1.08: the shaft tapers to r*0.18,
    // so the forward two thirds of each rail hung in open space and the spike
    // rendered as four whiskers instead of one machined instrument.
    const railLen = len * 0.40;
    for (let k = 0; k < 4; k++) {
      const a  = k * Math.PI * 0.50;
      const rx0 = Math.cos(a) * r * 0.72;
      const ry0 = Math.sin(a) * r * 0.72;
      box(b, 'hull', weather(st.hullDark, 1),
        r * 0.18, r * 0.18, railLen, {
        x: rx0, y: ry0, z: -r * 0.30 - railLen * 0.50,
      });
    }

    // Copper tip cone — at the forward (−Z) end of the shaft.
    cyl(b, 'hull', st.trim, r * 0.20, 0, r * 0.70, 8, {
      rx: Math.PI / 2, z: -r * 0.30 - len - r * 0.35,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// prizeCradle
// ---------------------------------------------------------------------------

/**
 * Cradle for a seized craft: two curved cradle arms on a base raft,
 * magnetic pads on the arm inner faces, approach WORK lamps seated on the
 * raft, and when `craft` a small captured hull (simple box in a st.patch tone
 * by index) sitting IN the cradle touching both arms.
 *
 * ATTACHMENT: base raft spans z = −d*0.55 to +d*0.75 (behind origin).
 */
export function prizeCradle(b, st, {
  w     = 1.4,
  d     = 2.2,
  craft = true,
  ry    = 0,
  seed  = 1,
}) {
  const rnd    = rng(seed);
  const armH   = w * 0.38;
  const raftW  = w * 1.20;
  const raftD  = d * 1.30;
  // Captured craft tone — index only.
  const toneIdx = Math.floor(rnd() * st.patch.length);
  const cTone   = st.patch[toneIdx];

  b.push(0, 0, 0, ry, 0, 0);

    // Base raft — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), raftW, armH * 0.40, raftD, {
      y: -(armH * 0.80), z: d * 0.10,   // back edge −d*0.55
    });

    // Two curved cradle arms (port and starboard).
    for (const sx of [-1, 1]) {
      box(b, 'hull', st.trim, w * 0.15, armH, d * 1.20, {
        x: sx * w * 0.50, z: d * 0.10,
      });
      // Magnetic pads on inner face — flat pucks every d*0.35.
      for (let k = 0; k < 3; k++) {
        box(b, 'hull', st.trim,
          0.10, armH * 0.45, 0.10, {
          x: sx * (w * 0.50 - 0.08),
          z: d * 0.10 - d * 0.40 + k * d * 0.40,
        });
      }
    }

    // Forward crossbar — connects the two arms at their forward edge (z = d*0.70).
    // This is the structure the approach lamps seat on (no crossbar = floating lamps).
    box(b, 'hull', st.trim, w * 1.06, armH * 0.32, armH * 0.28, {
      z: d * 0.70,
    });

    // Approach WORK lamps — seated ON the crossbar face, count from HUMAN.lampGap.
    {
      const nLamps = Math.max(2, Math.round(w / HUMAN.lampGap));
      lampString(b, 'lights', WORK, {
        ax: -w * 0.40, ay: armH * 0.16, az: d * 0.70,
        bx:  w * 0.40, by: armH * 0.16, bz: d * 0.70,
        count: nLamps, size: HUMAN.lampSize,
      });
    }

    // Captured craft — simple faceted body in patch tone, sitting in cradle.
    if (craft) {
      box(b, 'hull', cTone, w * 0.78, armH * 0.72, d * 0.90, {
        z: d * 0.10,
      });
      // Small drive nub at craft stern (+Z).
      box(b, 'hull', weather(cTone, 1), w * 0.42, armH * 0.42, d * 0.20, {
        z: d * 0.55,
      });
    }

  b.pop();
}

// ---------------------------------------------------------------------------
// seizedContainer
// ---------------------------------------------------------------------------

/**
 * A captured cargo container: box w×h×d in st.patch[i % len] by index,
 * corner castings, one panel visibly cut open and re-welded (a proud plate
 * with weld bead strips), and a copper tag plate.  No readable text.
 *
 * ATTACHMENT: rear mounting cleat spans z = −d*0.30 to +0.01 (behind origin).
 */
export function seizedContainer(b, st, {
  w,
  h,
  d,
  i    = 0,
  ry   = 0,
  seed = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd  = rng(seed);
  const tone = st.patch[i % st.patch.length];   // index only, never reads hex

  b.push(0, 0, 0, ry, 0, 0);

    // Rear mounting cleat — reaches BEHIND z=0 (attachment).
    box(b, 'hull', weather(st.hull, 1), w * 0.70, h * 0.20, d * 0.30, {
      y: -(h * 0.44), z: -d * 0.145,
    });

    // Main container body in captured tone.
    box(b, 'hull', tone, w, h, d, { z: 0 });

    // Corner castings — eight corners.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          box(b, 'hull', weather(st.hull, 1),
            w * 0.14, h * 0.14, d * 0.12, {
            x: sx * w * 0.46,
            y: sy * h * 0.46,
            z: sz * d * 0.47,
          });
        }
      }
    }

    // Re-welded panel — proud plate on one face (+X), reads as cut-open and
    // re-secured.  Proud = 0.038 so it reads as a separate plate.
    box(b, 'hull', weather(tone, 1), w * 0.55, h * 0.58, 0.038, {
      x: w * 0.22, z: d * 0.502,   // on +Z face (forward), proud of container
    });
    // Weld bead strips along re-welded panel edges.
    for (const sy of [-1, 1]) {
      box(b, 'hull', weather(st.hullDark, 1),
        w * 0.58, 0.04, 0.028, {
        x: w * 0.22, y: sy * h * 0.30, z: d * 0.505,
      });
    }

    // Copper tag plate — small, near top-right forward corner.
    box(b, 'hull', st.trim,
      w * 0.18, h * 0.12, 0.02, {
      x:  w * 0.36, y: h * 0.42, z: d * 0.505,
    });

  b.pop();
}

// ---------------------------------------------------------------------------
// workLampRun
// ---------------------------------------------------------------------------

/**
 * A run of amber work lamps from A to B.  First emits a narrow STRIP PLATE
 * spanning A→B in hull tone so the lamps are seated on structure and never
 * strung across a gap (attach-audit defect 2).  Then places WORK lamps on it
 * pitched at HUMAN.lampGap.  Count = max(2, round(length / HUMAN.lampGap)).
 *
 * ATTACHMENT: strip plate physically spans A to B; caller must ensure A or B
 * overlaps a hull surface.
 */
export function workLampRun(b, st, {
  ax,
  ay,
  az,
  bx,
  by,
  bz,
  seed = 1,
}) {
  const len    = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2 + (bz - az) ** 2);
  const nLamps = Math.max(2, Math.round(len / HUMAN.lampGap));

  // Strip plate — hull-tone, spans A→B, ensures lamps are on structure.
  pipeRun(b, 'hull', weather(st.hull, 1), {
    ax, ay, az, bx, by, bz,
    r: HUMAN.lampSize * 0.80, seg: 4, collars: 0,
  });

  // WORK lamps at HUMAN.lampGap pitch — count from gap, not lampSize.
  lampString(b, 'lights', WORK, {
    ax, ay, az, bx, by, bz,
    count: nLamps, size: HUMAN.lampSize,
  });
}

// ---------------------------------------------------------------------------
// crewWalk
// ---------------------------------------------------------------------------

/**
 * A working deck: a deck plate w×d that overlaps its mount (back edge at
 * −d*0.40), HUMAN.railH railing on the deck when `rail`, and `lamps` WORK
 * lamps seated on the deck.  A rail without a deck plate floats — this
 * motif prevents that defect (wave-1 defect 5).
 *
 * Lamp count is clamped to round(w / HUMAN.lampGap) — never lampSize.
 *
 * ATTACHMENT: deck plate back edge at −d*0.40 (behind origin).
 */
export function crewWalk(b, st, {
  w,
  d,
  rail  = true,
  lamps = 0,
  ry    = 0,
  seed  = 1,
}) {
  /* eslint-disable-next-line no-unused-vars */
  const rnd   = rng(seed);
  const deckT = 0.09;   // deck plate thickness — always explicit

  b.push(0, 0, 0, ry, 0, 0);

    // Deck plate — back edge at z = −d*0.40 (behind origin = overlaps mount).
    box(b, 'hull', weather(st.hull, 1), w, deckT, d, { z: d * 0.10 });

    // Aft coaming — also overlaps mount, reads as a separate fitted strip.
    box(b, 'hull', st.trim, w * 1.04, deckT * 1.80, d * 0.12, {
      y: deckT * 0.40, z: -d * 0.38,
    });

    if (rail) {
      // Forward rail.
      railing(b, 'hull', st.trim, {
        ax: -w * 0.46, ay: deckT * 0.50, az:  d * 0.58,
        bx:  w * 0.46, by: deckT * 0.50, bz:  d * 0.58,
        height: HUMAN.railH,
        posts:  Math.max(2, Math.round(w / HUMAN.lampGap) + 1),
        rail:   HUMAN.railPost,
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

    // WORK lamps — count from HUMAN.lampGap, seated ON deck surface.
    if (lamps > 0) {
      const nLamps = Math.min(lamps, Math.max(1, Math.round(w / HUMAN.lampGap)));
      lampString(b, 'lights', WORK, {
        ax: -w * 0.35, ay: deckT * 0.55, az: d * 0.30,
        bx:  w * 0.35, by: deckT * 0.55, bz: d * 0.30,
        count: nLamps, size: HUMAN.lampSize,
      });
    }

  b.pop();
}
