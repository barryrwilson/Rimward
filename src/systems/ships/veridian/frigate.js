/**
 * FRIGATE — survey command frigate: A long, restrained command vessel with a
 * central registry/data citadel, distributed instrument fins, two small launch
 * bays, and armor concentrated around the archive and the bridge.
 *
 * Charter: size band 26.40-36.30 (target 32.0, largest span Z), hull 16,000-60,000
 * verts, lights >= 1,100 and <= 25% of hull, singleMass cell 1.8, glowZ ~13.0.
 *
 * Body plan: TWIN INSTRUMENT KEELS UNDER A CENTRAL CITADEL. This catamaran
 * carries the archive high and protected between two low outboard instrument
 * keels, with a tunnel between them. The front view is a bracket (П) — the tunnel
 * under the citadel is why this is a command vessel, not a gunship. Two launch
 * bays open into the tunnel; distributed instrument fins cover the keels'
 * outboard flanks; a slim sensor prow bridges the keels forward.
 *
 * Tunnel geometry (world units): keels at y -2.20 (tops at -0.85), citadel at
 * y +2.60 (underside at +0.60). Vertical tunnel clearance = 1.45 units.
 * Horizontal gap inboard of each keel ≈ 0.50 units. Transverse pylons (two per
 * bridge station, computed from sectionAt) overlap both bodies by 0.25 units.
 */

import {
  loftHull, loftPlating, loftRib, chamferBlock,
  sectionAt,
} from './body.js';
import {
  LAMP, GLASS, DIM,
  hexModule, surveyAperture,
  driveSection, instrumentFin,
} from './motifs.js';
import {
  box, windowGrid, railing, lampString, weather,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianFrigate = {
  glowZ: 13.0,

  build(b, st) {
    const { hull: h, hullDark: hd, trim: t, accent: a, patch: p } = st;

    // CITADEL stations — central archive, high and protected
    // From z -9.0 to +10.5, w ~2.0, h ~2.0, y +2.60 (high)
    // Tunnel: underside at y +0.60, keel tops at y -0.85 → 1.45 gap
    // Half-width ~1.65, keels at x +/-3.30 with inboard faces at x +/-2.15 → gap
    const citadelStations = [
      { z: -9.0,  w: 0.80, h: 0.96, y: 2.60, c: 0.3 },
      { z: -7.0,  w: 1.20, h: 1.39, y: 2.60, c: 0.3 },
      { z: -5.0,  w: 1.50, h: 1.74, y: 2.60, c: 0.3 },
      { z: -2.0,  w: 1.60, h: 1.91, y: 2.60, c: 0.3 },
      { z: 0.0,   w: 1.65, h: 2.00, y: 2.60, c: 0.3 },
      { z: 2.0,   w: 1.60, h: 1.91, y: 2.60, c: 0.3 },
      { z: 5.0,   w: 1.50, h: 1.74, y: 2.60, c: 0.3 },
      { z: 7.5,   w: 1.25, h: 1.44, y: 2.60, c: 0.3 },
      { z: 10.5,  w: 0.65, h: 0.78, y: 2.60, c: 0.3 },
    ];
    // KEEL stations (two, one per side) — low instrument hulls
    // From z -11.5 to +12.5, w ~1.15, h ~1.35, y -2.20 (low)
    const keelStations = [
      { z: -11.5, w: 0.25, h: 0.30, y: -2.20, c: 0.3 },
      { z: -10.0, w: 0.70, h: 0.85, y: -2.20, c: 0.3 },
      { z: -8.0,  w: 1.00, h: 1.15, y: -2.20, c: 0.3 },
      { z: -5.0,  w: 1.12, h: 1.30, y: -2.20, c: 0.3 },
      { z: 0.0,   w: 1.15, h: 1.35, y: -2.20, c: 0.3 },
      { z: 5.0,   w: 1.12, h: 1.30, y: -2.20, c: 0.3 },
      { z: 8.0,   w: 1.00, h: 1.15, y: -2.20, c: 0.3 },
      { z: 10.0,  w: 0.70, h: 0.85, y: -2.20, c: 0.3 },
      { z: 12.5,  w: 0.25, h: 0.30, y: -2.20, c: 0.3 },
    ];


    // FORWARD PROW stations — slim sensor prow bridging the keels
    // From z -16.0 to -8.5
    const prowStations = [
      { z: -16.0, w: 0.55, h: 0.55, y: 0.20, c: 0.3 },
      { z: -14.5, w: 0.70, h: 0.70, y: 0.20, c: 0.3 },
      { z: -12.5, w: 0.95, h: 0.90, y: 0.20, c: 0.3 },
      { z: -10.5, w: 1.25, h: 1.15, y: 0.20, c: 0.3 },
      { z: -8.5,  w: 1.60, h: 1.40, y: 0.20, c: 0.3 },
    ];

    // ==== BUILD KEELS (two) ====
    for (const sx of [1, -1]) {
      b.push(sx * 3.30, 0, 0, 0, 0, 0);

      // Keel hull and plating with weathered bands
      const keelHexes = [h, weather(h, 1), hd, p[0]];
      loftHull(b, 'hull', keelHexes, { stations: keelStations, capFore: true, capAft: true });
      loftPlating(b, 'hull', [weather(h, 1), weather(hd, 1), p[1], h], {
        stations: keelStations,
        rows: 1,
        cols: 1,
        t: 0.06,
        inset: 0.16,
        seed: sx,
      });

      // Keel structural ribs
      const ribZs = [-8.0, -4.0, 0.0, 4.0, 8.0];
      for (const ribZ of ribZs) {
        loftRib(b, 'hull', t, { stations: keelStations, z: ribZ, out: 0.08, thick: 0.14 });
      }

      // Keel drive section (stern)
      const keelStern = sectionAt(keelStations, 12.5);
      b.push(0, keelStern.y, 12.5, 0, 0, 0);
      driveSection(b, st, { r: keelStern.w, len: 3.4, throats: 3, seed: sx, w: keelStern.w, h: keelStern.h, c: 0.3 });
      b.pop();

      // Distributed instrument fins on outboard flank
      const finPositions = [
        { z: -9.0, len: 1.8, depth: 0.8 },
        { z: -5.0, len: 1.4, depth: 0.65 },
        { z: -1.0, len: 1.0, depth: 0.5 },
      ];

      for (const fin of finPositions) {
        const s = sectionAt(keelStations, fin.z);
        // Seat the fin root into the keel plating (overlap the flank)
        b.push(sx * s.w * 0.6, s.y, fin.z, 0, 0, 0);
        instrumentFin(b, st, { len: fin.len, depth: fin.depth, ry: sx > 0 ? 0 : Math.PI });
        b.pop();
      }

      b.pop();
    }

    // ==== BUILD CITADEL ====

    // Citadel hull and plating with weathered bands
    const citadelHexes = [h, weather(h, 1), weather(hd, 1), p[0]];
    loftHull(b, 'hull', citadelHexes, { stations: citadelStations, capFore: true, capAft: true });
    loftPlating(b, 'hull', [weather(h, 2), weather(hd, 2), p[1], h], {
      stations: citadelStations,
      rows: 1,
      cols: 1,
      t: 0.06,
      inset: 0.16,
      seed: 2,
    });

    // Citadel armour courses (three stepping ribs)
    const armourZs = [-6.5, -2.0, 3.0];
    for (const z of armourZs) {
      loftRib(b, 'hull', t, { stations: citadelStations, z, out: 0.12, thick: 0.18 });
    }

    // Dense window grid on both flanks (HUMAN sizes only, in lights channel)
    const windowZs = [-5.0, -2.0, 1.0, 4.0];
    for (const wz of windowZs) {
      const s = sectionAt(citadelStations, wz);
      // Port flank
      b.push(-s.w + HUMAN.windowD, s.y, wz, Math.PI / 2, 0, 0);
      windowGrid(b, 'lights', GLASS, {
        rows: 4, cols: 3,
        rowGap: HUMAN.windowGap,
        colGap: HUMAN.windowGap,
        w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
        axis: 'x', ry: 0,
      });
      b.pop();
      // Starboard flank
      b.push(s.w - HUMAN.windowD, s.y, wz, -Math.PI / 2, 0, 0);
      windowGrid(b, 'lights', GLASS, {
        rows: 4, cols: 3,
        rowGap: HUMAN.windowGap,
        colGap: HUMAN.windowGap,
        w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
        axis: 'x', ry: 0,
      });
      b.pop();
    }

    // Citadel drive section (aft)
    b.push(0, 0, 10.5, 0, 0, 0);
    const citadelStern = sectionAt(citadelStations, 10.5);
    driveSection(b, st, { r: citadelStern.w, len: 4.0, throats: 4, seed: 3, w: citadelStern.w, h: citadelStern.h, c: 0.3 });
    b.pop();

    // ==== BRIDGING STRUCTURE ====
    // Transverse pylons spanning from keel tops to citadel underside.
    // Two narrower pylons per bridge station read as structural brackets (П).
    // Y center and half-height computed from actual section geometry so every
    // pylon overlaps both the keel top and the citadel underside.
    const bridgeZs = [-7.0, -4.0, 0.0, 4.0, 7.0];
    const pylonOverlap = 0.25; // into each body

    for (const bz of bridgeZs) {
      const ks = sectionAt(keelStations, bz);
      const cs = sectionAt(citadelStations, bz);
      const keelTop  = ks.y + ks.h;
      const citBot   = cs.y - cs.h;
      const centerY  = (keelTop + citBot) / 2;
      const halfH    = (citBot - keelTop) / 2 + pylonOverlap;

      for (const sx of [1, -1]) {
        for (const dz of [-0.38, 0.38]) {
          b.push(sx * 2.85, centerY, bz + dz, 0, 0, 0);
          chamferBlock(b, 'hull', [h, hd], {
            w: 1.2,
            h: halfH,
            d: 0.46,
            c: 0.28,
            taper: 0.88,
            y: 0,
          });
          b.pop();
        }
      }
    }

    // ==== FORWARD PROW ====
    // Prow hull and plating with weathered bands
    const prowHexes = [h, weather(h, 1), hd, p[0]];
    loftHull(b, 'hull', prowHexes, { stations: prowStations, capFore: true, capAft: false });
    loftPlating(b, 'hull', [weather(h, 1), weather(hd, 1), p[1], h], {
      stations: prowStations,
      rows: 1,
      cols: 1,
      t: 0.05,
      inset: 0.14,
      seed: 4,
    });

    // Main survey aperture at prow tip
    b.push(0, 0, -16.0, 0, 0, 0);
    surveyAperture(b, st, { r: 1.5, depth: 2.2, dir: -1, face: true });
    b.pop();

    // Bridge hex module on prow
    b.push(0, 0.15, -12.5, 0, 0, 0);
    hexModule(b, st, { r: 0.65, len: 1.8, seed: 5, shade: 0, windows: 1, serial: true });
    b.pop();

    // Bridge stepped armour belt
    b.push(0, 0.55, -12.5, 0, 0, 0);
    chamferBlock(b, 'hull', [h, hd], {
      w: 1.0,
      h: 0.5,
      d: 2.0,
      c: 0.3,
      taper: 0.85,
      y: 0,
    });
    b.pop();

    // ==== TWO LAUNCH BAYS ====
    // Recessed openings in citadel ventral face, facing into the tunnel
    const bayZs = [-3.0, 2.0];
    for (const bayZ of bayZs) {
      const s = sectionAt(citadelStations, bayZ);

      // Bay housing - hull-dark chamferBlock set into citadel ventral face
      b.push(0, s.y - s.h + 0.30, bayZ, 0, 0, 0);
      chamferBlock(b, 'hull', hd, {
        w: 2.0,
        h: 1.2,
        d: 1.5,
        c: 0.3,
        taper: 1,
        y: -0.6,
      });
      b.pop();

      // Lit interior inside the housing
      b.push(0, s.y - s.h + 0.10, bayZ, 0, 0, 0);
      box(b, 'lights', DIM, 1.6, 0.8, 1.2, { y: 0 });
      b.pop();

      // Bay lip on the housing
      b.push(0, s.y - s.h + 0.55, bayZ, 0, 0, 0);
      box(b, 'hull', t, 2.2, 0.15, 1.7, { y: 0 });
      b.pop();

      // HUMAN hatches on both sides of the housing
      b.push(1.3, s.y - s.h + 0.40, bayZ, 0, 0, 0);
      box(b, 'hull', hd, HUMAN.doorW, HUMAN.doorH, 0.08, { y: 0 });
      b.pop();
      b.push(-1.3, s.y - s.h + 0.40, bayZ, 0, 0, 0);
      box(b, 'hull', hd, HUMAN.doorW, HUMAN.doorH, 0.08, { y: 0 });
      b.pop();
    }

    // ==== CATWALKS ON CITADEL DORSAL ====
    const catwalkZs = [-6.0, -2.0, 2.0, 6.0];
    for (const cz of catwalkZs) {
      const s = sectionAt(citadelStations, cz);

      // Deck plate overlapping the citadel dorsal
      b.push(0, s.y + s.h - 0.12, cz, 0, 0, 0);
      box(b, 'hull', hd, 2.8, 0.24, 0.8, { y: 0 });
      b.pop();

      // Railings at HUMAN.railH (using correct function signature)
      const railY = s.y + s.h + HUMAN.railH - HUMAN.railPost;
      const railAx = -1.4, railBx = 1.4;
      railing(b, 'hull', t, {
        ax: railAx, ay: railY, az: cz,
        bx: railBx, by: railY, bz: cz,
        height: HUMAN.railH,
        posts: 4,
        rail: HUMAN.railPost,
      });

      // Lamp runs at HUMAN.lampGap pitch (using correct function signature)
      const lampCount = Math.floor(2.8 / HUMAN.lampGap);
      for (let i = 0; i < lampCount; i++) {
        const lx = -1.4 + (i * HUMAN.lampGap);
        const nextLx = Math.min(lx + HUMAN.lampGap, 1.4);
        const lampY = s.y + s.h + 0.35;
        lampString(b, 'lights', LAMP, {
          ax: lx, ay: lampY, az: cz,
          bx: nextLx, by: lampY, bz: cz,
          count: 1,
          size: HUMAN.lampSize,
        });
      }
    }
  },
};
