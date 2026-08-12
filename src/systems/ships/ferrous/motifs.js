/**
 * Ferrous Hegemony — the detail motif library.
 *
 * Brief: docs/FactionShipDesignBible.md §4.2. Charter: src/game/ship-scale.js.
 *
 * These are the faction's SURFACE and EQUIPMENT language: citadel armour,
 * wedge prows, paired weapon blocks, recognition bands, service honours,
 * rescue locks, point-defence tubs, command steps, container blocks, and the
 * drive battery. They decorate a body; they do NOT make one. Body plans come
 * from ./body.js.
 *
 * Every motif places geometry in the CURRENT builder frame, so a caller wraps
 * it in `b.push(x, y, z, ry, rx, rz)` / `b.pop()` to position it. No motif
 * leaves a frame open. Motifs are mirror-safe and designed for symmetric pairs
 * (for (const sx of [1, -1])).
 */

import {
  rng, weather, box, cyl, torus, ribBands, windowRow, panelSkin,
  pipeRun, railing, radiatorPanel, lampString, crate,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';
import { loftHull, loftPlating, loftRib } from '../loft.js';
import { armourBlock } from './body.js';

// Lights channel near-whites. The additive material's colour is the faction's
// iron gray and multiplies these, so they stay near-neutral.
export const LAMP = 0xffffff;  // running / work lamp
export const GLASS = 0xfff2d8; // warm cabin glass
export const OPTIC = 0xe8f0ff; // cool instrument optic
export const DIM = 0xe8dcc8;   // dimmed interior

/**
 * Citadel armour plating — the Ferrous surface language. Layered COURSES of
 * plates that stand proud of one another, so the hull reads as bolted-on
 * protection rather than as a painted skin. Each course carries `rows x cols`
 * plates; plate COUNT is the hull vertex lever, not plate size.
 *
 * The Ferrous brief asks for "layered citadel armour" as the faction's surface
 * read. Plates cycle through `[st.hull, weather(st.hull, 1), weather(st.hull, 2),
 * st.hullDark]` to give the hull tonal variation without extra geometry.
 *
 * CALLER CONTRACT. `w`/`h` are the face's half-extents; the motif plates a flat
 * face and stands the plates proud by `t`. `ry` orients the armour on the face.
 * A caller placing this on a flat hull face uses the face's own dimensions so
 * the courses exactly cover the surface. Twelve large boxes moved a Veridian
 * frigate's count by 432 verts — plate COUNT is the lever, not plate SIZE.
 */
export function citadelArmour(b, st, {
  w, h, d = 0.5, rows = 3, cols = 2, courses = 3, t = 0.08,
  inset = 0.18, ry = 0, seed = 1,
}) {
  const plates = [st.hull, weather(st.hull, 1), weather(st.hull, 2), st.hullDark];
  const rnd = rng(seed);
  const courseH = d / courses;
  
  for (let c = 0; c < courses; c++) {
    const z = -d / 2 + c * courseH + courseH / 2;
    const tone = plates[c % plates.length];
    
    // Base plate for this course.
    box(b, 'hull', tone, w * 2.02, h * 2.02, courseH * 0.96, { z });
    
    // Individual plates in a grid.
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const ux = (r + inset * 0.5) / rows;
        const ux1 = (r + 1 - inset * 0.5) / rows;
        const uy = (col + inset * 0.5) / cols;
        const uy1 = (col + 1 - inset * 0.5) / cols;
        
        const px0 = -w + (ux + ux1) * w;
        const py0 = -h + (uy + uy1) * h;
        const pw = (ux1 - ux) * w * 2;
        const ph = (uy1 - uy) * h * 2;
        const pt = courseH * (0.9 + (rnd() - 0.5) * 0.2);
        
        box(b, 'hull', plates[Math.floor(rnd() * plates.length)],
          pw * 0.96, ph * 0.96, pt, {
          x: px0, y: py0, z: z + (rnd() - 0.5) * courseH * 0.1,
        });
      }
    }
    
    // Step at course edge — a proud rim so the layer reads as stacked.
    if (c < courses - 1) {
      box(b, 'hull', weather(st.trim, 1),
        w * 2.1, h * 2.1, courseH * 0.08, { z: z + courseH / 2 });
    }
  }
}

/**
 * Wedge prow — the Ferrous blunt reinforced bow. A deep forward wedge whose
 * leading edge is a FLAT vertical strike face (never a needle), built from
 * stacked chamfered slabs that step back and outward. The centreline carries
 * a heavy trim-coloured cutwater rib, and the flanks show armour laminations.
 *
 * THE PROW REACHES BACK. It occupies z from `-len` to `len * 0.6`, so a caller
 * mounting it on a bow section gets real overlap, not a tangent touch. The
 * forward face sits at z = -len, and the rear extends past the frame origin.
 *
 * CALLER CONTRACT. `w` is the prow's half-width at its widest, `h` its half-
 * height, `len` its forward reach. `ry` orients the prow for asymmetric mounts,
 * though the Ferrous brief calls for symmetric prows.
 */
export function wedgeProw(b, st, { w, h, len, ry = 0, seed = 1 }) {
  const rnd = rng(seed);
  b.push(0, 0, 0, ry, 0, 0);
    // Forward strike face — a flat chamfered plate, never a needle.
    armourBlock(b, 'hull', [st.hull, weather(st.trim, 1)], {
      w: w * 0.7, h: h * 0.9, d: len * 0.5, c: 0.14, taper: 0.5, y: h * 0.1,
    });
    
    // Stepped slabs stepping back and outward from the strike face.
    const steps = [
      { z: -len * 0.5, w: w * 0.75, h: h * 0.95, y: h * 0.08 },
      { z: -len * 0.3, w: w * 0.88, h: h * 0.98, y: h * 0.04 },
      { z: -len * 0.1, w: w, h: h, y: 0 },
      { z: len * 0.2, w: w * 0.95, h: h * 0.96, y: -h * 0.05 },
      { z: len * 0.5, w: w * 0.85, h: h * 0.9, y: -h * 0.1 },
    ];
    
    const tones = [st.hull, weather(st.hull, 1), weather(st.hull, 2)];
    for (let i = 0; i < steps.length - 1; i++) {
      const a = steps[i];
      const bb = steps[i + 1];
      loftHull(b, 'hull', tones[i % tones.length], {
        stations: [
          { z: a.z, w: a.w, h: a.h, y: a.y, c: 0.2 },
          { z: bb.z, w: bb.w, h: bb.h, y: bb.y, c: 0.2 },
        ],
      });
      
      // Plating on each slab.
      loftPlating(b, 'hull', tones, {
        stations: [
          { z: a.z, w: a.w, h: a.h, y: a.y, c: 0.2 },
          { z: bb.z, w: bb.w, h: bb.h, y: bb.y, c: 0.2 },
        ],
        rows: 2, cols: 1, t: Math.max(0.04, len * 0.015), inset: 0.2,
        seed: seed + i * 10,
      });
    }
    
    // Cutwater rib down centreline — heavy trim-coloured.
    box(b, 'hull', st.trim, w * 0.06, h * 0.85, len * 1.4, {
      x: 0, y: h * 0.05, z: -len * 0.3,
    });
    box(b, 'hull', weather(st.trim, 1), w * 0.04, h * 0.82, len * 1.35, {
      x: 0, y: h * 0.06, z: -len * 0.28,
    });
    
    // Armour laminations on flanks.
    for (const sx of [1, -1]) {
      for (let i = 0; i < 3; i++) {
        box(b, 'hull', weather(st.hull, i + 1),
          w * 0.18, h * (0.35 - i * 0.08), len * (0.6 + i * 0.15), {
          x: sx * w * (0.55 + i * 0.1), y: -h * 0.05, z: -len * 0.2 + i * 0.1,
        });
      }
    }
  b.pop();
}

/**
 * Weapon block — a formally aligned paired weapon housing. An armoured box
 * barbette with a recessed mount, one or two barrels (short, thick, stepped,
 * trim-coloured muzzle collar), a blast shield, and a small OPTIC telltale in
 * the mount recess. Barrels point −Z by default; `yaw` rotates them.
 *
 * Ferrous doctrine: "Deliberate and few, never a chaotic cluster." This is the
 * standard turret housing across the fleet — clean, repeatable, and always
 * formal.
 *
 * CALLER CONTRACT. `w`/`h`/`d` are the barbette's half-extents. `barrels`
 * chooses one or two. `yaw` rotates the barrels (0 = straight back, ± = angled).
 */
export function weaponBlock(b, st, { w, h, d, barrels = 2, yaw = 0, seed = 1 }) {
  const rnd = rng(seed);
  b.push(0, 0, 0, yaw, 0, 0);
    // Armoured barbette box.
    armourBlock(b, 'hull', [st.hull, weather(st.hull, 1)], {
      w, h, d: d * 0.8, c: 0.14, y: 0,
    });
    
    // Recessed mount.
    box(b, 'hull', weather(st.hullDark, 1),
      w * 0.7, h * 0.6, d * 0.4, { z: -d * 0.25 });
    
    // Blast shield above the mount.
    box(b, 'hull', st.trim, w * 0.9, h * 0.35, d * 0.15, {
      y: h * 0.5, z: -d * 0.2,
    });
    
    // Barrels — short, thick, stepped.
    const barrelW = barrels === 2 ? w * 0.22 : w * 0.35;
    for (let i = 0; i < barrels; i++) {
      const bx = barrels === 2 ? (i - 0.5) * w * 0.35 : 0;
      
      // Barrel body.
      cyl(b, 'hull', weather(st.trim, 1), barrelW * 0.5, barrelW * 0.55, d * 0.5, 8, {
        rx: Math.PI / 2, x: bx, y: -h * 0.05, z: -d * 0.45,
      });
      
      // Stepped muzzle collar.
      cyl(b, 'hull', st.trim, barrelW * 0.65, barrelW * 0.6, d * 0.08, 8, {
        rx: Math.PI / 2, x: bx, y: -h * 0.05, z: -d * 0.68,
      });
      
      // Muzzle opening.
      cyl(b, 'hull', weather(st.hullDark, 2), barrelW * 0.35, barrelW * 0.35, d * 0.04, 8, {
        rx: Math.PI / 2, x: bx, y: -h * 0.05, z: -d * 0.71,
      });
    }
    
    // OPTIC telltale in mount recess.
    box(b, 'lights', OPTIC, HUMAN.lampSize * 1.5, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
      y: h * 0.15, z: -d * 0.28,
    });
  b.pop();
}

/**
 * Recognition band — the Ferrous restrained crimson identity. A narrow raised
 * strip in st.accent that follows a surface, with thin st.trim edge fillets so
 * it reads as an applied plate, not a decal.
 *
 * CRIMSON IS RESTRAINT. The Ferrous brief forbids a red warship; the crimson
 * recognition band is NARROW, formal, and centreline or symmetric pairs only.
 *
 * CALLER CONTRACT. `len` is the band's length, `w` its width. The band follows
 * the current frame's +X axis from `-len/2` to `len/2`. `ry` orients the band
 * on the surface; callers mount it inside a pushed frame on a hull face.
 * The band stands proud by `p` and overlaps its mount.
 */
export function recognitionBand(b, st, { len, w = 0.18, p = 0.04, ry = 0 }) {
  b.push(0, 0, 0, ry, 0, 0);
    // Main crimson band.
    box(b, 'hull', st.accent, len + p * 2, w, p * 2, { z: p });
    
    // Trim edge fillets — applied plate look.
    box(b, 'hull', st.trim, len + p * 2.5, w * 0.25, p * 2.5, {
      y: w * 0.55, z: p * 0.9,
    });
    box(b, 'hull', st.trim, len + p * 2.5, w * 0.25, p * 2.5, {
      y: -w * 0.55, z: p * 0.9,
    });
  b.pop();
}

/**
 * Service honour — a SMALL brass (st.patch[1]) service honour plaque. Machined
 * plaque with raised bezel and two fixing bosses, optionally with one DIM telltale.
 * Sized around HUMAN.doorW so it always reads as hand-sized.
 *
 * THE BRASS HONOUR. Ferrous doctrine reserves brass for SMALL service honours
 * near hatches and rescue gear. This is that plaque.
 *
 * CALLER CONTRACT. The plaque is HUMAN-scaled and mounts on a flat surface. `lit`
 * adds a dim telltale. `ry` orients the plaque.
 */
export function serviceHonour(b, st, { lit = true, ry = 0 }) {
  b.push(0, 0, 0, ry, 0, 0);
    // Plaque body — brass.
    box(b, 'hull', st.patch[1], HUMAN.doorW * 0.7, HUMAN.doorH * 0.35, 0.05);
    
    // Raised bezel.
    box(b, 'hull', weather(st.patch[1], 1), HUMAN.doorW * 0.78, HUMAN.doorH * 0.42, 0.08, {
      z: 0.02,
    });
    
    // Fixing bosses.
    for (const sx of [1, -1]) {
      cyl(b, 'hull', weather(st.trim, 1), 0.04, 0.04, 0.12, 6, {
        rx: Math.PI / 2, x: sx * HUMAN.doorW * 0.3, z: 0.08,
      });
    }
    
    // Optional DIM telltale.
    if (lit) {
      box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize * 0.6, HUMAN.lampSize * 0.5, {
        y: HUMAN.doorH * 0.08, z: 0.06,
      });
    }
  b.pop();
}

/**
 * Rescue lock — the Ferrous external airlock/rescue hatch. Present on every
 * class because "this state believes it is humanity's shield." A HUMAN.collarR
 * collar ring with a SHANK reaching back, a recessed door, grab rails, two
 * approach lamps, and a brass service honour.
 *
 * THE SHANK REACHES BACK. The collar has a shank of `len * 0.4` extending behind
 * the frame origin, so mounting it on a hull seats the collar INTO the surface
 * instead of resting against it.
 *
 * CALLER CONTRACT. `len` is the collar's depth. `ry` orients the hatch. The
 * hatch uses HUMAN.doorW/H for the door opening.
 */
export function rescueLock(b, st, { len = 0.5, ry = 0 }) {
  const shank = len * 0.4;
  b.push(0, 0, 0, ry, 0, 0);
    // Collar ring with shank.
    cyl(b, 'hull', st.trim, HUMAN.collarR, HUMAN.collarR, len + shank, 8, {
      rx: Math.PI / 2, z: -shank / 2,
    });
    
    // Collar trim ring.
    torus(b, 'hull', weather(st.trim, 1), HUMAN.collarR + 0.04, 0.06, 8, 12, undefined, {
      rx: Math.PI / 2, z: len * 0.3,
    });
    
    // Recessed door.
    box(b, 'hull', weather(st.hullDark, 1), HUMAN.doorW, HUMAN.doorH, len * 0.7, {
      z: len * 0.15,
    });
    box(b, 'hull', weather(st.hull, 2), HUMAN.doorW * 0.9, HUMAN.doorH * 0.9, len * 0.65, {
      z: len * 0.18,
    });
    
    // Grab rails.
    for (const sx of [1, -1]) {
      railing(b, 'hull', st.trim, {
        ax: sx * HUMAN.collarR * 1.4, ay: 0, az: -len * 0.2,
        bx: sx * HUMAN.collarR * 1.4, by: 0, bz: len * 0.5,
        height: HUMAN.railH, posts: 2, rail: HUMAN.railPost,
      });
    }
    
    // Approach lamp mounts and lamps.
    for (const sx of [1, -1]) {
      // Small mounting boss on collar.
      box(b, 'hull', weather(st.trim, 1), HUMAN.lampSize * 0.8, HUMAN.lampSize * 0.8, HUMAN.lampSize * 0.6, {
        x: sx * HUMAN.collarR * 1.6, y: HUMAN.collarR * 0.25, z: len * 0.45,
      });
      // Lamp on the boss.
      box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
        x: sx * HUMAN.collarR * 1.6, y: HUMAN.collarR * 0.5, z: len * 0.45,
      });
    }
    
    // Service honour plaque.
    b.push(HUMAN.collarR * 0, HUMAN.doorH * 0.9, len * 0.2, 0, 0, 0);
      serviceHonour(b, st, { lit: true, ry: 0 });
    b.pop();
  b.pop();
}

/**
 * Point-defence tub — a small clean-arc point-defence tub. Low armoured ring
 * or hexagonal tub let into the hull, compact multi-barrel cluster on a short
 * pedestal, one OPTIC tracker. Small enough to repeat without becoming greeble
 * noise; sits proud only a little.
 *
 * CLEAN ARCS. The Ferrous brief asks for clean arcs, not clustered noise. This
 * is the faction's point-defence language — compact, formal, and repeatable.
 *
 * CALLER CONTRACT. `r` is the tub's radius, `h` its height. The tub sits in the
 * current frame and extends from z = `-h` to `0`. `ry` orients the barrel cluster.
 */
export function pointDefence(b, st, { r = 0.3, h = 0.3, ry = 0, seed = 1 }) {
  const rnd = rng(seed);
  b.push(0, 0, 0, ry, 0, 0);
    // Low armoured ring — hexagonal for Ferrous flavour.
    const ringR = r * 1.2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * ringR;
      const py = Math.sin(a) * ringR;
      box(b, 'hull', weather(st.hull, rnd() * 2),
        r * 0.4, r * 0.4, h * 0.7, { x: px, y: py, z: -h * 0.35, rz: a });
    }
    
    // Recessed well.
    cyl(b, 'hull', weather(st.hullDark, 1), r * 0.7, r * 0.7, h * 0.4, 6, {
      rx: Math.PI / 2, z: -h * 0.3,
    });
    
    // Short pedestal.
    cyl(b, 'hull', st.trim, r * 0.4, r * 0.45, h * 0.25, 6, {
      rx: Math.PI / 2, z: -h * 0.45,
    });
    
    // Multi-barrel cluster (4 barrels).
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bx = Math.cos(a) * r * 0.18;
      const by = Math.sin(a) * r * 0.18;
      cyl(b, 'hull', weather(st.trim, 1), 0.05, 0.06, h * 0.35, 6, {
        rx: Math.PI / 2, x: bx, y: by, z: -h * 0.65,
      });
    }
    
    // OPTIC tracker.
    box(b, 'lights', OPTIC, HUMAN.lampSize, HUMAN.lampSize * 0.6, HUMAN.lampSize * 0.5, {
      z: -h * 0.7,
    });
  b.pop();
}

/**
 * Command step — one step of the Ferrous stepped command tower. A chamfered
 * armour block, narrower and shorter than the one below it, with a forward bridge
 * window row, an armoured brow, and side blisters. Callers stack 2-4 of these.
 *
 * OVERLAP THE STEP BELOW. Each step must overlap the one below it, so the
 * tower reads as built up rather than as floating plates. The step extends
 * from `z = -len` to `len * 0.4`, so a caller stacking them gets real overlap.
 *
 * CALLER CONTRACT. `w`/`h`/`len` are the step's half-extents. The step is
 * narrower (`w * 0.85`) than the one below. Windows use HUMAN.windowW/H/D.
 */
export function commandStep(b, st, { w, h, len, ry = 0, seed = 1 }) {
  const rnd = rng(seed);
  b.push(0, 0, 0, ry, 0, 0);
    // Chamfered armour block.
    armourBlock(b, 'hull', [st.hull, weather(st.hull, 1)], {
      w: w * 0.85, h: h * 0.9, d: len * 1.4, c: 0.14, y: h * 0.05,
    });
    
    // Forward bridge window row.
    windowRow(b, 'lights', GLASS, {
      count: Math.max(2, Math.round(w / 0.5)), spacing: HUMAN.windowGap,
      w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
      axis: 'x', y: h * 0.35, z: -len * 0.6,
    });
    
    // Armoured brow over windows — overlaps the forward face.
    box(b, 'hull', st.trim, w * 1.8, h * 0.2, len * 0.2, {
      y: h * 0.55, z: -len * 0.5,
    });
    
    
    // Side blisters.
    for (const sx of [1, -1]) {
      box(b, 'hull', weather(st.hull, 1), w * 0.25, h * 0.4, len * 0.5, {
        x: sx * w * 0.95, y: h * 0.1, z: -len * 0.2,
      });
      
      // Blister window.
      box(b, 'lights', GLASS, HUMAN.windowW, HUMAN.windowH * 0.8, HUMAN.windowD * 0.8, {
        x: sx * w * 0.95, y: h * 0.2, z: -len * 0.25,
      });
    }
    
    // Step overlap geometry — overlaps the forward face.
    box(b, 'hull', weather(st.trim, 1), w * 0.9, h * 0.85, len * 0.3, {
      z: -len * 0.8,
    });
  b.pop();
}

/**
 * Container block — one standardised logistics container block for the Ferrous
 * freighter. A rack of HUMAN.crateS modules in a `rows x cols` grid held in an
 * external frame of trim-coloured longerons and end frames, with corner
 * castings, one crimson recognition stripe, and lit LAMP work points.
 *
 * REPETITION AND FORMATION DISCIPLINE CREATES SCALE. The module size NEVER
 * changes between classes — only the count. This is the Ferrous freighter's
 * cargo language.
 *
 * CALLER CONTRACT. `rows`/`cols` set the grid. The block is centred on the
 * current frame. All HUMAN.crateS modules are identical; only the grid grows.
 */
export function containerBlock(b, st, { rows = 3, cols = 2, seed = 1 }) {
  const rnd = rng(seed);
  const moduleS = HUMAN.crateS;
  const gridW = cols * moduleS;
  const gridH = rows * moduleS;
  
  b.push(0, 0, 0, 0, 0, 0);
    // External frame — trim-coloured longerons and end frames.
    const frameW = gridW + moduleS * 0.4;
    const frameH = gridH + moduleS * 0.4;
    const frameD = moduleS * 2.5;
    
    // Longerons (4).
    for (const sy of [1, -1]) {
      box(b, 'hull', st.trim, frameW, moduleS * 0.18, frameD, {
        y: sy * gridH / 2 + sy * moduleS * 0.15,
      });
    }
    for (const sx of [1, -1]) {
      box(b, 'hull', st.trim, moduleS * 0.18, frameH, frameD, {
        x: sx * gridW / 2 + sx * moduleS * 0.15,
      });
    }
    
    // End frames.
    for (const sz of [1, -1]) {
      box(b, 'hull', st.trim, frameW, frameH, moduleS * 0.18, {
        z: sz * frameD / 2 + sz * moduleS * 0.05,
      });
    }
    
    // Corner castings (8).
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        for (const sz of [1, -1]) {
          box(b, 'hull', weather(st.trim, 1), moduleS * 0.22, moduleS * 0.22, moduleS * 0.22, {
            x: sx * gridW / 2, y: sy * gridH / 2, z: sz * frameD / 2,
          });
        }
      }
    }
    
    // Crate modules in grid.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mx = (c - (cols - 1) / 2) * moduleS;
        const my = (r - (rows - 1) / 2) * moduleS;
        
        crate(b, 'hull', weather(st.hull, Math.floor(rnd() * 3)), {
          x: mx, y: my, z: 0, s: moduleS * 0.9, ry: 0,
        });
      }
    }
    
    // Crimson recognition stripe across one end.
    box(b, 'hull', st.accent, frameW * 0.9, moduleS * 0.12, moduleS * 0.08, {
      z: -frameD / 2 + moduleS * 0.2,
    });
    
    // LAMP work points (2 per end).
    for (const sz of [1, -1]) {
      for (const sx of [1, -1]) {
        box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
          x: sx * frameW * 0.35, y: 0, z: sz * frameD / 2 + sz * moduleS * 0.15,
        });
      }
    }
  b.pop();
}

/**
 * Drive battery — the Ferrous closed stern. Every class needs a proper stern,
 * not a rib cage trailing off into nothing. A squared-off armoured drive housing
 * sized from the caller's `w`/`h`, radiator fins, service plumbing, and 2-6
 * RECESSED thrust throats whose emissive lights sit INSIDE modelled nozzle rings.
 *
 * THE STERN MUST CLOSE. A stern that trails off into a rib cage is a defect the
 * Ferrous rebuild fixes. This is the Veridian driveSection adapted to Ferrous
 * doctrine: squared-off, armoured, symmetric, and functional.
 *
 * CALLER CONTRACT. `w`/`h` are the stern's half-extents. `len` is the section's
 * reach (occupies z from `-len` to `0`). `throats` sets the exhaust count (even,
 * 2-6). `c` is the chamfer, matching the hull's.
 */
export function driveBattery(b, st, { w, h, len, throats = 4, c = 0.3, seed = 1 }) {
  const rnd = rng(seed);
  const hw = w * 1.1;
  const hh = h * 1.1;
  const plates = [weather(st.hull, 1), weather(st.hullDark, 1), weather(st.trim, 1)];
  
  // Stepped armoured housing — squared-off for Ferrous flavour.
  const course = [
    { z: -len, w: w * 1.02, h: h * 1.02, y: 0, c },
    { z: -len * 0.9, w: hw, h: hh, y: 0, c },
    { z: -len * 0.3, w: hw, h: hh, y: 0, c },
    { z: -len * 0.15, w: hw * 0.9, h: hh * 0.9, y: 0, c },
    { z: 0, w: hw * 0.8, h: hh * 0.8, y: 0, c },
  ];
  
  loftHull(b, 'hull', [st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 1)], {
    stations: course, seg: 0, capFore: false, capAft: true,
  });
  
  loftPlating(b, 'hull', plates, {
    stations: course, rows: Math.max(1, Math.round(len / (Math.max(w, h) * 1.8))),
    cols: 1, t: Math.max(0.05, Math.min(w, h) * 0.08), inset: 0.22, seed,
  });
  
  // Structural ribs.
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.8, out: Math.max(0.05, w * 0.06), thick: Math.max(0.1, len * 0.04) });
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.5, out: Math.max(0.05, w * 0.06), thick: Math.max(0.1, len * 0.04) });
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.25, out: Math.max(0.05, w * 0.06), thick: Math.max(0.1, len * 0.04) });
  
  // Radiator fins on top and bottom.
  for (const sy of [1, -1]) {
    radiatorPanel(b, 'hull', weather(st.trim, 1), weather(st.hullDark, 1), {
      x: 0, y: sy * hh * 0.75, z: -len * 0.55,
      w: w * 1.4, h: len * 0.35, fins: 6, ry: 0, thick: Math.max(0.08, w * 0.05),
    });
  }
  
  // Service plumbing.
  for (const sx of [1, -1]) {
    pipeRun(b, 'hull', weather(st.trim, 2), {
      ax: sx * hw * 0.75, ay: 0, az: -len * 0.2,
      bx: sx * w * 0.85, by: 0, bz: -len * 1.05,
      r: Math.max(0.05, w * 0.045), seg: 6, collars: 3,
    });
  }
  
  // RECESSED thrust throats — symmetric, even count, lights INSIDE nozzle rings.
  const tr = Math.min(hw, hh) * (throats > 3 ? 0.28 : 0.35);
  const rx = hw * 0.5;
  const ry = hh * 0.5;
  
  for (let i = 0; i < throats; i++) {
    const a = (i / throats) * Math.PI * 2 + Math.PI / throats;
    const tx = Math.cos(a) * rx;
    const ty = Math.sin(a) * ry;
    
    // Nozzle ring — modelled geometry.
    cyl(b, 'hull', weather(st.hull, 0), tr * 1.3, tr * 1.15, len * 0.25, 8, {
      rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.12,
    });
    
    // Inner nozzle step.
    cyl(b, 'hull', weather(st.hullDark, 2), tr, tr * 0.85, len * 0.18, 8, {
      rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.06,
    });
    
    // Nozzle ring trim.
    torus(b, 'hull', weather(st.trim, 0), tr * 1.22, Math.max(0.03, w * 0.035), 6, 10, undefined, {
      x: tx, y: ty, z: -len * 0.04,
    });
    
    // Emissive core DEEP INSIDE — not a painted plate.
    cyl(b, 'lights', OPTIC, tr * 0.55, tr * 0.55, len * 0.04, 8, {
      rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.18,
    });
  }
  
  // Between-throat structure — frame, not plate.
  for (let i = 0; i < throats; i++) {
    const a = (i / throats) * Math.PI * 2;
    box(b, 'hull', weather(st.trim, 1), Math.min(hw, hh) * 0.2, Math.min(hw, hh) * 0.85, len * 0.15, {
      x: Math.cos(a) * rx * 0.85, y: Math.sin(a) * ry * 0.85, z: -len * 0.1, rz: a,
    });
  }
}
