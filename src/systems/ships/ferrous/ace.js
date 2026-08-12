/**
 * Ace — Ferrous Hegemony honor interceptor. A sharpened, immaculate development of the
 * picket with a longer prow, larger paired drives, a single crimson centerline band,
 * and formal recognition plates.
 *
 * Body plan: SPLIT-STERN DART. A long slim prow with a flat strike face growing to a
 * distinct SHOULDER about a third back (the deepest and widest point of the hull),
 * then tapering aft where the hull FORKS into two structural arms in a visible Y —
 * each arm a tapering loft that carries its drive nacelle, so the drives look grown
 * from the hull rather than clamped to a tube. Plan view: narrow forebody opening into
 * a wide two-arm stern. Side view: a dart — knife prow, pronounced shoulder, tapering
 * Y-forked tail. "Immaculate" means tighter panel fit: fewer, larger plates with a
 * pale step in the tone cycle.
 *
 * Charter: target span 7.2 (largest on Z), hull 4,000-15,000 verts,
 * lights >= 260 and <= 25% of hull, singleMass cell 0.6, glowZ 3.6.
 *
 * Z layout (Z0 = 0.00 — ship centered at world origin):
 *   wedgeProw push at Z = -2.40, len=1.20
 *   cutwater rib tip (min Z): -2.40 - 1.20 * 0.70 - 1.20 * 0.30 = approx -3.60
 *   fork base at Z = 1.90, arm tip at Z = 3.55, battery push at Z = 3.60
 *   centre ≈ (−3.60 + 3.60) / 2 = 0.00
 *
 * Extents budget (target span):
 *   Z: ~-3.60 to ~+3.60 (span ~7.20, band 5.94-7.59)
 *   X: -(1.20+0.46) to +(1.20+0.46) (span ~3.32, band 1.18-6.43, at nacelle arms)
 *   Y: -(0.76+belt) to +(0.80+belt) (span ~1.72, band <=4.44, flattest in fleet)
 *   Bounding-box centre within 0.08 of Z=0 on every axis.
 */

import {
  loftHull, loftPlating, loftRib, sectionAt,
  armourBlock, beltedHull, armourCourse,
} from './body.js';
import {
  LAMP, GLASS,
  citadelArmour, wedgeProw, weaponBlock, recognitionBand,
  serviceHonour, rescueLock, driveBattery,
} from './motifs.js';
import { weather, box, lampString } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousAce = {
  glowZ: 3.6,

  build(b, st) {
    const ch = 'hull';
    const hl = 'lights';
    // Z0 = 0.00 — all coordinates are world-space, ship centered at origin.
    // Plate tone list: hull dark base, a weather step, the pale trim steel,
    // another trim step. Roughly 1-in-4 plates reads pale — makes courses visible.
    const plateTones = [st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 2), st.hullDark];

    // ===== CENTRAL BODY STATIONS =====
    // Dart profile: slim prow face → grow to distinct SHOULDER at ~1/3 → taper to fork.
    // Vary both w and h: the flattest ship in the family but not a constant tube.
    // Low chamfer c=0.14 for angular Ferrous profile.
    const bodyStations = [
      { z: -2.40, w: 0.26, h: 0.22, y: -0.10, c: 0.14 },  // prow base — slim strike face
      { z: -1.70, w: 0.36, h: 0.38, y: -0.08, c: 0.14 },  // fore growth
      { z: -0.90, w: 0.54, h: 0.78, y:  0.02, c: 0.14 },  // SHOULDER — deepest and widest
      { z:  0.10, w: 0.48, h: 0.58, y: -0.04, c: 0.14 },  // mid taper
      { z:  1.00, w: 0.40, h: 0.38, y: -0.08, c: 0.14 },  // fork approach
      { z:  1.90, w: 0.32, h: 0.24, y: -0.10, c: 0.14 },  // fork base — hull splits here
    ];

    // ===== MAIN HULL — belted Ferrous shell with tonal range =====
    // Plate tone cycle includes st.trim so roughly 1 in 4 plates reads pale.
    // Fewer, larger plates than the picket (trim=0.25 leaves a wide unbelted span).
    beltedHull(b, ch, plateTones, {
      stations: bodyStations,
      belt: 0.08,
      beltAt: 0.0,
      trim: 0.25,
      seg: 0,
      capFore: true,
      capAft: true,
    });

    // ===== STRUCTURAL RIBS — trim coloured for tonal definition =====
    // Rib at shoulder station — the hull's widest cross-section.
    loftRib(b, ch, st.trim, { stations: bodyStations, z: -0.90, out: 0.08, thick: 0.14 });
    // Rib at mid taper — bridging shoulder to fork.
    loftRib(b, ch, st.trim, { stations: bodyStations, z:  0.10, out: 0.08, thick: 0.14 });

    // ===== LONG WEDGE PROW — "a longer prow" in the brief =====
    // Pushed to prow base station. Cutwater rib extends approx push_Z - len forward.
    b.push(0, 0, -2.40);
    wedgeProw(b, st, {
      w: 0.26,
      h: 0.22,
      len: 1.20,
      seed: 1,
    });
    b.pop();

    // ===== CRIMSON CENTERLINE BAND — class signature =====
    // Exactly one, at the hull's geometric centre.
    recognitionBand(b, st, {
      len: 2.2,
      w: 0.18,
      p: 0.04,
      ry: 0,
    });

    // ===== FORMAL RECOGNITION PLATES — brass service honours =====
    // Symmetric plaques on the forebody upper flanks.
    const plaqueZ = -0.80;
    const plaqueS = sectionAt(bodyStations, plaqueZ);
    const plaqueX = plaqueS.w - 0.12;
    const plaqueY = plaqueS.y + plaqueS.h * 0.6;
    for (const sx of [1, -1]) {
      b.push(sx * plaqueX, plaqueY, plaqueZ);
      serviceHonour(b, st, { lit: true, ry: sx > 0 ? Math.PI / 2 : -Math.PI / 2 });
      b.pop();
    }

    // ===== RESCUE LOCK — doctrine requires it on every class =====
    const lockZ = -1.60;
    const lockS = sectionAt(bodyStations, lockZ);
    const lockY = lockS.y + lockS.h - 0.10;
    b.push(lockS.w - 0.14, lockY, lockZ);
    rescueLock(b, st, { len: 0.5, ry: 0 });
    b.pop();

    // ===== STERN FORK — structural Y: two tapered arms grown from the hull =====
    // Each arm is a real tapering loft that carries its drive nacelle, so the drives
    // look grown from the hull rather than clamped to a tube. The fork gap is wide
    // enough to read in TOP view; arms have sufficient h for SIDE view legibility.
    // Arms are trim-coloured (structural steel) against the dark central hull.
    const armSpacingX = 1.20;  // wide splay — legible fork gap in TOP view

    // Arm stations (local Z within arm push — world Z since push is X-only):
    const armStations = [
      { z: 1.75, w: 0.28, h: 0.18, y: -0.06, c: 0.14 },  // root — overlaps fork base
      { z: 2.50, w: 0.46, h: 0.28, y: -0.10, c: 0.14 },  // nacelle body — widest
      { z: 3.55, w: 0.36, h: 0.22, y: -0.08, c: 0.14 },  // stern tip
    ];

    // FORK BLOCKS — structural bridge from central body to each arm root.
    // The body edge at fork base is X=0.32; arm inner edge is X=0.92.
    // Gap = 0.60 >> TOUCH_EPS=0.08 so a physical bridge is mandatory.
    // Trim colour: these are the structural Y-fork that make the split legible.
    const forkBridgeS = sectionAt(bodyStations, 1.82);
    for (const sx of [1, -1]) {
      // Centre the bridge block between body edge (0.32) and arm inner edge (0.92).
      b.push(sx * 0.62, forkBridgeS.y, 1.82);
      armourBlock(b, ch, [st.hull, weather(st.hull, 1)], {
        w: 0.36,              // half-width: 0.62±0.36 → [0.26, 0.98], spanning both edges
        h: forkBridgeS.h * 0.85,
        d: 0.42,              // half-depth: 1.82±0.21 → [1.61, 2.03], spanning fork+arm root
        c: 0.14,
        taper: 0.65,          // taper narrows toward fore for streamlined fork read
        y: 0,
      });
      b.pop();
    }

    for (const sx of [1, -1]) {
      const armX = sx * armSpacingX;

      // Each arm IS the nacelle: a tapering loft in trim colour (pale structural steel),
      // so it reads as structure grown from the hull fork rather than a box bolted on.
      b.push(armX, 0, 0);

      loftHull(b, ch, [st.hull, weather(st.hull, 1), st.trim, weather(st.hull, 2)], {
        stations: armStations,
        seg: 0,
        capFore: true,
        capAft: true,
      });

      // Rib at nacelle body — accentuates the widest cross-section of the arm.
      loftRib(b, ch, st.trim, { stations: armStations, z: 2.50, out: 0.07, thick: 0.12 });

      // Darker hull overlay on the aft nacelle body for drive-cluster identity.
      loftHull(b, ch, [st.hull, weather(st.hull, 1), st.hullDark], {
        stations: [
          { z: 2.35, w: 0.44, h: 0.26, y: -0.10, c: 0.14 },
          { z: 3.10, w: 0.38, h: 0.22, y: -0.08, c: 0.14 },
        ],
        seg: 0,
        capFore: false,
        capAft: false,
      });

      // Drive battery — closes each nacelle arm; 2 throats per arm.
      // Pushed within arm frame at (0, 0, 3.60): world pos = (armX, 0, 3.60).
      // Battery fore at 3.10, aft cap at 3.60.
      b.push(0, 0, 3.60);
      driveBattery(b, st, {
        w: 0.46,
        h: 0.26,
        len: 0.50,
        throats: 2,
        c: 0.30,
        seed: sx > 0 ? 4 : 5,
      });
      b.pop();

      // Running lamp along arm dorsal spine — HUMAN.lampGap spaced.
      const armLampStart = 1.90;
      const armLampEnd   = 3.40;
      const armLampCount = Math.floor((armLampEnd - armLampStart) / HUMAN.lampGap) + 1;
      const armSectionStart = sectionAt(armStations, armLampStart);
      const armSectionEnd   = sectionAt(armStations, armLampEnd);
      lampString(b, hl, LAMP, {
        ax: 0,
        ay: armSectionStart.y + armSectionStart.h + 0.04,
        az: armLampStart,
        bx: 0,
        by: armSectionEnd.y + armSectionEnd.h + 0.04,
        bz: armLampEnd,
        count: armLampCount,
        size: HUMAN.lampSize,
      });

      b.pop();  // pop arm position
    }

    // ===== DORSAL RUNNING LAMPS — along the central body spine =====
    // HUMAN.lampGap spaced, seated on the hull dorsal surface.
    const spineLampStart = -1.60;
    const spineLampEnd   =  1.70;
    const spineLampCount = Math.floor((spineLampEnd - spineLampStart) / HUMAN.lampGap) + 1;
    const spineS0 = sectionAt(bodyStations, spineLampStart + 0.20);
    const spineS1 = sectionAt(bodyStations, spineLampEnd - 0.20);
    lampString(b, hl, LAMP, {
      ax: 0,
      ay: spineS0.y + spineS0.h + 0.04,
      az: spineLampStart,
      bx: 0,
      by: spineS1.y + spineS1.h + 0.04,
      bz: spineLampEnd,
      count: spineLampCount,
      size: HUMAN.lampSize,
    });
  },
};
