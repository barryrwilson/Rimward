/**
 * Ferrous Hegemony — "Iron Bastion", the fortress-bastion station.
 *
 * Reference art: docs/FactionExamples/02-ferrous-hegemony-station.png
 *
 * Tier 0 — OCTAGONAL SKIRT: a wide 8-sided armoured hull ring (SKIRT_R=18)
 *   with eight gun turret batteries at each octant, each carrying twin
 *   barrels, crimson recognition bands, and near-white sighting lamps.
 *   Radial airlocks stitch each battery to the skirt face. Dense barrack
 *   window strips and interior window fields fill each face.
 *
 * Tier 1 — BASTION RING: eight stepped bastion drums (r=5.5) bedded into
 *   the skirt crown (BASTION_R=14), plated with P_STEEL, connected by
 *   bridges and airlocks. Secondary command spires at the four diagonal
 *   bastions carry crimson cap plates and dense window fields.
 *
 * Tier 2 — COMMAND TOWER: central tapered cylinder (baseR=7, h=14) rising
 *   four stepped tiers from y=4 to y=18, brass rank bands at every tier
 *   transition, alternating crimson banner panels, and a top antenna mast.
 *
 * Tier 3 — BELLY MAGAZINE: longitudinal truss keel at y=-18 with cross
 *   members, an armoured magazine drum at y=-23 (r=6) with portholes,
 *   and vertical airlocks dropping from the skirt underside.
 *
 * Ring (radius 14, ringY=-16): ROTATING BATTERY RING — eight plated
 *   turret houses on a heavy armoured hoop, spoked to a plated hub, with
 *   fire-control optic glaze panes and rim sighting lamps.
 *
 * Palette roles: IRON=hull, DARK=ribs/seams/truss, STEEL=structure,
 *   CRIMSON=recognition bands/banners (hull), BRASS=rank caps (hull).
 *   OPTIC=fire-control glaze (cold steel-blue, dulled). Glow channels
 *   use near-neutral tints so the amber pulse keeps its hue.
 *
 * Measured: parts 3753, totalVerts 387672, glowVerts 32880,
 *   bbox x [-22.7, 22.7] y [-25.5, 28.3] z [-22.6, 22.6],
 *   isolated 0/662 0.00%, strays [], orphanGlow 0.00%, orphanGlaze 0.00%.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, truss, railing, bridge, airlock,
  pipeRun, antenna, ladder, radiatorPanel, lampString, crate,
} from '../station-detail.js';

export const ferrousStation = {
  ringY: -16,
  build(b, ringB, st) {
    const rand = rng(4502);

    // Base palette (FACTION_STYLE only) and its weathered shades.
    const IRON = st.hull;          // 0x42454b iron grey — dominant
    const DARK = st.hullDark;      // 0x252d35 dark iron — ribs, seams, truss
    const STEEL = st.trim;         // 0x6b7c8c steel — structural
    const CRIMSON = st.accent;     // 0x8a3a34 restrained crimson — banners, chevrons
    const BRASS = st.patch[1];     // 0xb08a4a brass — rank bands, cap plates
    const W = weather;

    // Plate sets: mottled skins, every entry derived from a BASE colour.
    const P_IRON = [IRON, IRON, W(IRON, 1), W(IRON, 1), W(IRON, 2), W(STEEL, 1)];
    const P_STEEL = [STEEL, STEEL, W(STEEL, 1), W(STEEL, 2), W(IRON, 2), W(DARK, 1)];
    const P_CRIMSON = [CRIMSON, W(CRIMSON, 1), W(CRIMSON, 2), W(IRON, 3)];
    const P_BRASS = [BRASS, W(BRASS, 1), W(BRASS, 2), W(STEEL, 1)];
    const P_MIX = [IRON, W(STEEL, 1), W(CRIMSON, 1), W(BRASS, 1), W(IRON, 2)];

    // Window tints — near-neutral so the warm pulse keeps its hue.
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;

    // Glaze optics — cold steel-blue, dulled for fire-control and armoured glass.
    const OPTIC = 0x4a6a7c;

    // ---------------------------------------------------------------- modules --
    // Gun turret: twin barrels on an armoured drum with sighting lamps.
    const gunTurret = (o) => {
      const { x, y, z, ry, seed } = o;
      b.push(x, y, z, 0, ry, 0);
      const r = 4.2;
      // Armoured drum
      cyl(b, 'hull', IRON, r, r, 2.8, 16);
      panelSkin(b, 'hull', P_IRON, { r, from: -1.2, to: 1.2, rows: 3, cols: 12, seed, t: 0.2, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.16, tube: 0.2, from: -0.8, to: 0.8, count: 2, axis: 'y', tseg: 16 });
      // Twin barrels
      for (const bx of [-1.8, 1.8]) {
        b.push(bx, 2.8, 0, 0, 0, 0);
        cyl(b, 'hull', W(STEEL, 1), 0.5, 0.5, 7.2, 8, { rx: Math.PI / 2 });
        ribBands(b, 'hull', DARK, { r: 0.56, tube: 0.08, from: -2.8, to: 2.8, count: 4, axis: 'x', tseg: 8 });
        // Barrel housing ring
        torus(b, 'hull', W(CRIMSON, 1), 0.9, 0.14, 6, 10, Math.PI, { y: 0.2, ry: Math.PI / 2 });
        b.pop();
      }
      // Sighting lamps
      lampString(b, 'glow', LIT, { ax: -2.4, ay: 1.2, az: r - 0.4, bx: 2.4, by: 1.2, bz: r - 0.4, count: 4, size: 0.32 });
      lampString(b, 'glow', LIT, { ax: -2.4, ay: 1.2, az: -r + 0.4, bx: 2.4, by: 1.2, bz: -r + 0.4, count: 4, size: 0.32 });
      // Crimson recognition bands
      torus(b, 'hull', CRIMSON, r + 0.2, 0.18, 6, 16, undefined, { y: 0.8, rx: Math.PI / 2 });
      torus(b, 'hull', W(CRIMSON, 1), r + 0.2, 0.18, 6, 16, undefined, { y: -0.8, rx: Math.PI / 2 });
      // Bridge to adjacent structure
      b.pop();
    };

    // Octagonal bastion module: 8-sided plated drum with crenellations.
    const bastionModule = (o) => {
      const { x, y, z, r, h, skin, cap, plates, seed, crenellations = 8 } = o;
      b.push(x, y, z, 0, 0, 0);
      // Core drum
      cyl(b, 'hull', skin, r, r, h, 24);
      panelSkin(b, 'hull', plates, { r, from: -h / 2 + 0.8, to: h / 2 - 0.8, rows: 4, cols: 16, seed, t: 0.18, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.12, tube: 0.2, from: -h / 2 + 1.2, to: h / 2 - 1.2, count: 3, axis: 'y', tseg: 24 });
      // Cap rings
      for (const sy of [-1, 1]) {
        const yPos = sy * (h / 2 + 0.4);
        torus(b, 'hull', cap, r * 0.96, 0.16, 8, 24, undefined, { y: yPos, rx: Math.PI / 2 });
        torus(b, 'hull', DARK, r * 0.72, 0.12, 6, 20, undefined, { y: yPos, rx: Math.PI / 2 });
      }
      // Window grids — rotation-only push from bastion centre; zSink seats the panel flush with the 24-seg cylinder face.
      const rFlat = r * Math.cos(Math.PI / 24);
      const halfH = (3 - 1) * 1.1 / 2 + 0.5 / 2; // = 1.35
      const zSink = Math.sqrt(Math.max(0, rFlat * rFlat - halfH * halfH));
      for (let i = 0; i < crenellations; i++) {
        const ang = (i / crenellations) * Math.PI * 2;
        b.push(0, 0, 0, 0, -ang + Math.PI / 2, 0);
        windowGrid(b, 'glow', LIT_WARM, { rows: 3, cols: 2, rowGap: 1.1, colGap: 0.9, w: 0.7, h: 0.5, d: 0.5, x: 0, y: 0, z: zSink, axis: 'x' });
        b.pop();
      }
      b.pop();
    };

    // Command tower: tapered, stepped, with brass rank bands and crimson banners.
    const commandTower = (o) => {
      const { x, y, z, baseR, h, skin, seed } = o;
      b.push(x, y, z, 0, 0, 0);
      const tiers = 4;
      const tierH = h / tiers;
      for (let i = 0; i < tiers; i++) {
        const r = baseR * (1 - i * 0.18);
        const yPos = y + i * tierH;
        b.push(0, yPos, 0, 0, 0, 0);
        cyl(b, 'hull', Array.isArray(skin) ? skin[i % skin.length] : skin, r, r * 0.85, tierH, 20);
        panelSkin(b, 'hull', P_IRON, { r: r * 0.92, from: -tierH / 2 + 0.6, to: tierH / 2 - 0.6, rows: 3, cols: 12, seed: seed + i * 10, t: 0.16, axis: 'y' });
        ribBands(b, 'hull', DARK, { r: r + 0.1, tube: 0.16, from: -tierH / 2 + 0.8, to: tierH / 2 - 0.8, count: 2, axis: 'y', tseg: 20 });
        // Crimson banners on alternating tiers
        if (i % 2 === 0) {
          for (let j = 0; j < 4; j++) {
            const ang = (j / 4) * Math.PI * 2 + Math.PI / 4;
            const bx = Math.cos(ang) * (r + 0.4);
            const bz = Math.sin(ang) * (r + 0.4);
            box(b, 'hull', CRIMSON, 0.5, tierH * 0.7, 0.12, { x: bx, y: 0, z: bz, ry: -ang + Math.PI / 2 });
          }
        }
        // Brass rank bands
        if (i > 0) {
          torus(b, 'hull', BRASS, r * 0.88, 0.14, 8, 20, undefined, { y: -tierH / 2 - 0.2, rx: Math.PI / 2 });
        }
        // Window — rotation-only push; z stays inside the tapered tier's narrowest face radius.
        const winAng = (i * Math.PI) / 4;
        b.push(0, 0, 0, 0, -winAng + Math.PI / 2, 0);
        windowGrid(b, 'glow', LIT, { rows: 2, cols: 2, rowGap: 0.9, colGap: 0.8, w: 0.6, h: 0.45, d: 0.45, x: 0, y: 0, z: r * 0.82, axis: 'x' });
        b.pop();
        b.pop();
      }
      // Antenna array at top
      b.push(0, y + h, 0, 0, 0, 0);
      antenna(b, 'hull', DARK, STEEL, { h: 6, r: 0.12, tip: 0.3, dish: 0 });
      b.pop();
      b.pop();
    };

    // ------------------------------------------------------- tier 0: octagonal skirt
    // Eight-sided armoured skirt with gun batteries around the rim.
    const SKIRT_R = 18;
    const OCTANT_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

    // Core octagonal drum
    b.push(0, -8, 0, 0, 0, 0);
    // Create octagonal shape via overlapping boxes
    for (const ang of OCTANT_ANGLES) {
      const ox = Math.cos(ang) * (SKIRT_R - 4);
      const oz = Math.sin(ang) * (SKIRT_R - 4);
      b.push(ox, 0, oz, 0, ang + Math.PI / 2, 0);
      box(b, 'hull', IRON, 10, 8, 4.2);
      panelSkin(b, 'hull', P_IRON, { r: 2.1, from: -3.8, to: 3.8, rows: 4, cols: 8, seed: 4510 + Math.floor(ang * 100), t: 0.18, axis: 'y' });
      // Barrack windows on each skirt face
      windowGrid(b, 'glow', LIT_WARM, { rows: 4, cols: 7, rowGap: 1.5, colGap: 1.2, w: 0.7, h: 0.55, d: 0.3, x: 0, y: 0, z: 1.9, axis: 'x' });
      b.pop();
    }
    // Central hub
    cyl(b, 'hull', W(STEEL, 1), 12, 12, 8, 24);
    panelSkin(b, 'hull', P_STEEL, { r: 12, from: -3.8, to: 3.8, rows: 4, cols: 16, seed: 4520, t: 0.2, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 12.2, tube: 0.22, from: -3.2, to: 3.2, count: 3, axis: 'y', tseg: 24 });
    b.pop();

    // Gun batteries around the rim
    for (let i = 0; i < 8; i++) {
      const ang = OCTANT_ANGLES[i];
      const gx = Math.cos(ang) * SKIRT_R;
      const gz = Math.sin(ang) * SKIRT_R;
      gunTurret({ x: gx, y: -8, z: gz, ry: -ang + Math.PI / 2, seed: 4530 + i });
      // Connect gun battery to skirt
      airlock(b, 'hull', W(IRON, 1), DARK, {
        ax: Math.cos(ang) * (SKIRT_R - 6), ay: -8, az: Math.sin(ang) * (SKIRT_R - 6),
        bx: gx, by: -8, bz: gz, r: 1.4, seg: 12, rings: 2,
      });
    }

    // Barrack windows on the central hub surface (r=12, 24-seg flat face ≈ 11.93).
    // Grids are pushed from hub centre so z targets the cylinder face, not 12.5 beyond radius 11.
    const hubFlat = 12 * Math.cos(Math.PI / 24);
    for (let i = 0; i < 8; i++) {
      const ang = OCTANT_ANGLES[i] + Math.PI / 8;
      b.push(0, -8, 0, 0, -ang + Math.PI / 2, 0);
      windowGrid(b, 'glow', LIT_WARM, { rows: 2, cols: 5, rowGap: 0.95, colGap: 0.9, w: 0.65, h: 0.48, d: 0.4, x: 0, y: 1.5, z: hubFlat, axis: 'x' });
      windowGrid(b, 'glow', LIT, { rows: 2, cols: 5, rowGap: 0.95, colGap: 0.9, w: 0.58, h: 0.42, d: 0.4, x: 0, y: -1.5, z: hubFlat, axis: 'x' });
      b.pop();
    }

    // ---------------------------------------------------- tier 1: bastion ring
    // Stepped bastion tier bedded into the skirt
    const BASTION_R = 14;
    const BASTION_Y = -3;

    for (let i = 0; i < 8; i++) {
      const ang = OCTANT_ANGLES[i];
      const bx = Math.cos(ang) * BASTION_R;
      const bz = Math.sin(ang) * BASTION_R;
      bastionModule({
        x: bx, y: BASTION_Y, z: bz, r: 5.5, h: 5,
        skin: W(IRON, 1), cap: STEEL, plates: P_STEEL, seed: 4540 + i, crenellations: 6,
      });
      // Connect bastion to skirt
      airlock(b, 'hull', W(STEEL, 1), DARK, {
        ax: Math.cos(ang) * (SKIRT_R - 7), ay: -6, az: Math.sin(ang) * (SKIRT_R - 7),
        bx: bx, by: BASTION_Y - 1.5, bz: bz, r: 1.3, seg: 12, rings: 2,
      });
    }

    // Bridges between adjacent bastions
    for (let i = 0; i < 8; i++) {
      const ang1 = OCTANT_ANGLES[i];
      const ang2 = OCTANT_ANGLES[(i + 1) % 8];
      const x1 = Math.cos(ang1) * BASTION_R;
      const z1 = Math.sin(ang1) * BASTION_R;
      const x2 = Math.cos(ang2) * BASTION_R;
      const z2 = Math.sin(ang2) * BASTION_R;
      bridge(b, 'hull', W(IRON, 1), DARK, {
        ax: x1, ay: BASTION_Y, az: z1,
        bx: x2, by: BASTION_Y, bz: z2,
        w: 2.2, railH: 0.9, posts: 5,
      });
    }

    // -------------------------------------------------------- tier 2: command tier
    // Central command tower
    commandTower({ x: 0, y: 4, z: 0, baseR: 7, h: 14, skin: [IRON, W(STEEL, 1), IRON, W(STEEL, 2)], seed: 4560 });

    // Secondary towers around the crown
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const tx = Math.cos(ang) * 9;
      const tz = Math.sin(ang) * 9;
      bastionModule({
        x: tx, y: 8, z: tz, r: 3.8, h: 7,
        skin: W(STEEL, 1), cap: W(CRIMSON, 1), plates: P_CRIMSON, seed: 4570 + i, crenellations: 5,
      });
      // Connect to bastion ring
      airlock(b, 'hull', W(IRON, 2), DARK, {
        ax: Math.cos(ang) * BASTION_R, ay: BASTION_Y + 1, az: Math.sin(ang) * BASTION_R,
        bx: tx, by: 6, bz: tz, r: 1.2, seg: 10, rings: 2,
      });
    }

    // -------------------------------------------------------- tier 3: upper structures
    // Fire-control optics and armoured viewports in glaze
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const ox = Math.cos(ang) * 5;
      const oz = Math.sin(ang) * 5;
      b.push(ox, 14, oz, 0, -ang + Math.PI / 2, 0);
      // Armoured viewport frame
      box(b, 'hull', DARK, 2.2, 1.2, 0.5, { y: 0.5 });
      // Glazed optic panes behind dark mullions
      for (let j = 0; j < 3; j++) {
        cyl(b, 'glaze', OPTIC, 0.55, 0.55, 0.35, 8, { x: -0.6 + j * 0.6, y: 0.5, z: 0.3, rz: Math.PI / 2 });
      }
      // Mullions
      for (let j = 0; j <= 3; j++) {
        box(b, 'hull', DARK, 0.08, 1.0, 0.12, { x: -0.9 + j * 0.6, y: 0.5, z: 0.15 });
      }
      b.pop();
    }

    // Antenna arrays
    const ANTENNA_POS = [
      [-12, 11, -6, 10], [11, 10, 8, 8], [-8, 12, 10, 11],
      [14, 9, -4, 9], [-14, 10, 4, 10], [7, 11, -12, 12],
    ];
    for (const [ax, ay, az, ah] of ANTENNA_POS) {
      antenna(b, 'hull', DARK, STEEL, { x: ax, y: ay, z: az, h: ah, r: 0.11, tip: 0.28, dish: 0 });
    }

    // --------------------------------------------------------------- belly
    // Truss keel under the skirt
    truss(b, 'hull', DARK, { ax: -20, ay: -18, az: 0, bx: 20, by: -18, bz: 0, bays: 10, thickness: 0.4, spread: 1.6 });

    // Cross trusses
    for (const tx of [-10, 0, 10]) {
      truss(b, 'hull', DARK, { ax: tx, ay: -18, az: -16, bx: tx, by: -18, bz: 16, bays: 8, thickness: 0.3, spread: 1.2 });
    }

    // Belly magazine (armoured drum below the keel)
    b.push(0, -23, 0, 0, 0, 0);
    cyl(b, 'hull', W(IRON, 2), 6, 6, 5, 16);
    panelSkin(b, 'hull', P_IRON, { r: 6, from: -2.2, to: 2.2, rows: 3, cols: 12, seed: 4580, t: 0.2, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 6.2, tube: 0.2, from: -1.8, to: 1.8, count: 2, axis: 'y', tseg: 16 });
    // Portholes on magazine
    portholeRing(b, 'glow', LIT_DIM, { r: 6.2, count: 8, size: 0.28, y: 0 });
    b.pop();

    // Vertical airlocks from skirt to keel
    for (const kx of [-12, -4, 4, 12]) {
      airlock(b, 'hull', W(STEEL, 2), DARK, { ax: kx, ay: -12, az: 0, bx: kx, by: -18, bz: 0, r: 1.2, seg: 12, rings: 2 });
    }

    // ------------------------------------------------------------- pipe runs
    const PIPES = [
      [0, -3, 0, 0, 2, 0], [-9, -3, -9, -9, 6, -9], [9, -3, 9, 9, 6, 9],
      [-12, -5, 5, -12, 8, 5], [12, -5, -5, 12, 8, -5],
      [-6, 2, 12, -6, 8, 12], [6, 2, -12, 6, 8, -12],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of PIPES) {
      pipeRun(b, 'hull', W(STEEL, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.18, seg: 8, collars: 3 });
    }

    // -------------------------------------------------------- surface greebles
    // Hatches, junction boxes, vents and inspection ports
    for (let i = 0; i < 80; i++) {
      const gx = -18 + rand() * 36;
      const gz = -18 + rand() * 36;
      const gy = -10 + rand() * 22;
      const col = [DARK, W(IRON, 2), W(STEEL, 1), W(CRIMSON, 2)][i % 4];
      box(b, 'hull', col, 0.5 + rand() * 0.7, 0.4 + rand() * 0.4, 0.4 + rand() * 0.5, { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (i % 4 === 0) {
        box(b, 'glow', LIT_DIM, 0.32, 0.24, 0.24, { x: gx + 0.4, y: gy + 0.3, z: gz });
      }
    }

    // Radiator panels
    const RAD_POS = [
      [-14, 0, -12, 1.2], [14, 0, 12, -0.8], [-15, 0, 10, 0.4],
      [16, 0, -10, -1.5], [-8, 0, -15, 0.9], [8, 0, 15, -0.3],
    ];
    for (const [rx, ry, rz, rry] of RAD_POS) {
      b.push(rx, ry, rz, 0, rry, 0);
      radiatorPanel(b, 'hull', DARK, STEEL, { w: 5, h: 3, fins: 6, ry: 0, thick: 0.12 });
      b.pop();
    }

    // --------------------------------------------------------- rotating battery ring
    // Radius 14 hoop with eight plated turret houses
    const RING_R = 14;
    // Heavy armoured hoop
    torus(ringB, 'ringHull', IRON, RING_R, 1.4, 12, 40, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(IRON, 1), RING_R, 0.3, 8, 40, undefined, { y: 0.7, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(IRON, 1), RING_R, 0.3, 8, 40, undefined, { y: -0.7, rx: Math.PI / 2 });

    // Eight turret houses on the ring
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const tx = Math.cos(ang) * RING_R;
      const tz = Math.sin(ang) * RING_R;
      ringB.push(tx, 0, tz, 0, -ang + Math.PI / 2, 0);
      // Turret house drum
      cyl(ringB, 'ringHull', W(STEEL, 1), 2.4, 2.4, 2.0, 14);
      panelSkin(ringB, 'ringHull', P_STEEL, { r: 2.4, from: -0.8, to: 0.8, rows: 2, cols: 10, seed: 4590 + i, t: 0.16, axis: 'y' });
      ribBands(ringB, 'ringHull', DARK, { r: 2.5, tube: 0.16, from: -0.6, to: 0.6, count: 2, axis: 'y', tseg: 14 });
      // Crimson band
      torus(ringB, 'ringHull', CRIMSON, 2.6, 0.14, 6, 14, undefined, { y: 0.8, rx: Math.PI / 2 });
      // Sighting lamps
      lampString(ringB, 'ringGlow', LIT, { ax: -1.2, ay: 0.5, az: 2.8, bx: 1.2, by: 0.5, bz: 2.8, count: 3, size: 0.28 });
      lampString(ringB, 'ringGlow', LIT, { ax: -1.2, ay: 0.5, az: -2.8, bx: 1.2, by: 0.5, bz: -2.8, count: 3, size: 0.28 });
      // Twin gun barrels
      for (const gx of [-0.9, 0.9]) {
        ringB.push(gx, 1.8, 0, 0, 0, 0);
        cyl(ringB, 'ringHull', W(STEEL, 2), 0.35, 0.35, 4.8, 8, { rx: Math.PI / 2 });
        ribBands(ringB, 'ringHull', DARK, { r: 0.4, tube: 0.06, from: -1.8, to: 1.8, count: 3, axis: 'x', tseg: 8 });
        ringB.pop();
      }
      // Fire-control optics on turret houses
      box(ringB, 'ringGlaze', OPTIC, 1.2, 0.7, 0.3, { y: 0.6, z: 2.5 });
      box(ringB, 'ringGlaze', OPTIC, 1.2, 0.7, 0.3, { y: 0.6, z: -2.5 });
      ringB.pop();
    }

    // Spoked hub
    cyl(ringB, 'ringHull', STEEL, 3, 3, 1.6, 16);
    panelSkin(ringB, 'ringHull', P_STEEL, { r: 3, from: -0.6, to: 0.6, rows: 2, cols: 10, seed: 4600, t: 0.14, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 3.1, tube: 0.14, from: -0.4, to: 0.4, count: 2, axis: 'y', tseg: 16 });

    // Spokes from hub to rim
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      truss(ringB, 'ringHull', DARK, { ax: 0, ay: 0, az: 0, bx: Math.cos(ang) * (RING_R - 3), by: 0, bz: Math.sin(ang) * (RING_R - 3), bays: 4, thickness: 0.24, spread: 0.6 });
    }

    // Lamp lining on outer rim
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const lx = Math.cos(ang) * (RING_R + 0.8);
      const lz = Math.sin(ang) * (RING_R + 0.8);
      box(ringB, 'ringGlow', LIT_WARM, 0.28, 0.28, 0.24, { x: lx, y: 0.3, z: lz, ry: -ang + Math.PI / 2 });
    }

    // Support stem from main station
    airlock(b, 'hull', W(IRON, 2), DARK, { ax: 0, ay: -16, az: 0, bx: 0, by: -18, bz: 0, r: 1.8, seg: 14, rings: 2 });
  },
};