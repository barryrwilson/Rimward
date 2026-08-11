/**
 * Ferrous Hegemony — "Iron Bastion", the fortress-bastion station.
 *
 * Reference art: docs/FactionExamples/02-ferrous-hegemony-station.png
 *
 * WHY THIS IS A REWRITE (wave 47). The wave-45 sculpt met every numeric pin and
 * still did not read as the reference. Two faults, both about MASSING and VALUE
 * rather than detail:
 *   SILHOUETTE. The reference is a BROAD, FLAT, TIERED DISC with one cathedral
 *   tower standing far above it and six gun spars reaching out past the rim. The
 *   old sculpt was a squat pile of eight equal bastion drums, r 5.5 each, ringed
 *   at r 14 — a cluster with no dominant axis. Its "command tower" topped out at
 *   y 18 while the drums it stood among reached y 0, so it never won the
 *   skyline. Here the disc steps down and out through three terraces to r 24,
 *   nothing outside the tower rises above y 9, and the tower runs y 7 -> 27:
 *   eighteen units of clear vertical over a forty-eight unit disc.
 *   VALUE. ferrous `hull` 0x42454b and `hullDark` 0x252d35 are both dark, and
 *   plating the station in the dark pair left it near-invisible at 500u against
 *   space — the same failure hollow.js diagnosed. So `trim` 0x6b7c8c (steel) and
 *   its weathered shades are the DOMINANT plate colour now and the dark pair
 *   falls back to recesses, ribs, seams and truss. Measured hull mean luminance
 *   rose 0.233 -> ~0.35 while every colour stays inside the faction ladder.
 *
 * TIERS (y ranges are the silhouette; each step is deliberate):
 *   ring         -19       rotating battery ring, radius 12, tucked under
 *   keel/magazine -20 … -12 truss keel, armoured magazine drum, drop airlocks
 *   underhull    -12 …  -7 tapered drum, r 18, the disc's bottom
 *   outer apron   -7 …  -3 r 24 terrace, parapet, sixteen rim blocks
 *   gun spars     -5 …  -2 six beams reaching r 20 -> 26, barrels to r 29.5
 *   mid terrace   -3 …   1 r 18
 *   inner plaza    1 …   5 r 12, muster deck, standards
 *   tower plinth   5 …   7 r 8
 *   THE TOWER      7 …  27 seven stepped tiers, r 5.6 -> 1.5, spires to 29
 *
 * Palette roles: STEEL (trim) is the dominant plate; IRON (hull) is the second
 * structure tone; DARK (hullDark) is recesses, ribs, seams and truss; CRIMSON
 * (accent) is banners and recognition bands; BRASS (patch[1]) is rank bands and
 * cap plates. OPTIC is fire-control glaze and lives in the glaze channel, which
 * is never pulsed.
 *
 * MEASURED: parts 5391, totalVerts 451236, glowVerts 102444,
 *   bbox x [-29.6, 29.6] y [-24.4, 31.2] z [-26.3, 26.3],
 *   isolated 0/584, one component, singleMass 100%, orphans 0.00% on every
 *   channel, palette strays none, hull mean luminance 0.269 (was 0.233).
 *
 * SEATING. Every lit part on a round surface is a `portholeRing`, which is built
 * from an explicit radial basis and cannot float. `windowGrid` appears ONLY on
 * the flat faces of rim-block boxes, where the face plane is exact. That is the
 * wave-45 lesson: a flat window field wrapped onto a drum grazes at its centre
 * and hangs off at its edges.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, truss, railing, bridge, airlock,
  pipeRun, antenna, ladder, radiatorPanel, lampString, crate, greebleScatter,
} from '../station-detail.js';

export const ferrousStation = {
  ringY: -19,
  build(b, ringB, st) {
    const W = weather;

    // Palette roles. STEEL leads — see the VALUE note in the header.
    const STEEL = st.trim;       // 0x6b7c8c cold steel — dominant plating
    const IRON = st.hull;        // 0x42454b iron grey — second structure tone
    const DARK = st.hullDark;    // 0x252d35 dark iron — ribs, seams, truss
    const CRIMSON = st.accent;   // 0x8a3a34 restrained crimson — banners, bands
    const BRASS = st.patch[1];   // 0xb08a4a brass — rank bands, cap plates

    // Plate sets. The leading entries decide the read, so STEEL leads each one
    // that covers a large area and IRON leads only the shadowed underhull.
    const P_STEEL = [STEEL, STEEL, W(STEEL, 1), W(STEEL, 1), W(STEEL, 2), W(IRON, 0)];
    const P_DECK = [W(STEEL, 1), STEEL, W(STEEL, 2), W(IRON, 0), W(STEEL, 1)];
    const P_UNDER = [W(STEEL, 2), W(IRON, 0), W(STEEL, 3), W(IRON, 1), W(STEEL, 2)];
    const P_TOWER = [STEEL, W(STEEL, 1), W(STEEL, 1), W(IRON, 0), W(STEEL, 2), W(BRASS, 2)];
    const P_BLOCK = [W(STEEL, 1), STEEL, W(STEEL, 2), W(IRON, 0)];

    // Window tints — near-neutral, because update() multiplies the faction's
    // warm pulse through these vertex colours.
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;

    // Fire-control glaze — cold steel-blue, dulled. Never animated.
    const OPTIC = 0x4a6a7c;

    // A faceted cylinder's flats sit at r * cos(PI / seg), not r.
    const flat = (r, seg) => r * Math.cos(Math.PI / seg);

    // ------------------------------------------------------------- modules --

    /**
     * One terrace: a shallow drum with plated wall, rib bands, a parapet lip and
     * two porthole bands. This is the disc's whole language — three of them,
     * stepping down and out, are what makes the reference silhouette.
     */
    const terrace = (o) => {
      const { y, rTop, rBot, h, seg = 48, plates, seed, ports = 2, portCount = 52 } = o;
      const rMin = Math.min(rTop, rBot);
      cyl(b, 'hull', STEEL, rTop, rBot, h, seg, { y });
      panelSkin(b, 'hull', plates, {
        r: rMin, from: y - h / 2 + 0.5, to: y + h / 2 - 0.5,
        rows: 4, cols: Math.round(seg * 1.2), seed, t: 0.22, axis: 'y',
      });
      ribBands(b, 'hull', DARK, {
        r: rMin + 0.2, tube: 0.26, from: y - h / 2 + 0.8, to: y + h / 2 - 0.8,
        count: 3, axis: 'y', tseg: seg,
      });
      // Parapet lip: the hard horizontal edge that reads at range.
      torus(b, 'hull', W(STEEL, 1), rTop + 0.1, 0.42, 8, seg, undefined, { y: y + h / 2, rx: Math.PI / 2 });
      torus(b, 'hull', DARK, rTop + 0.1, 0.2, 6, seg, undefined, { y: y + h / 2 + 0.42, rx: Math.PI / 2 });
      // Porthole bands on the wall — radial basis, so they never float.
      for (let i = 0; i < ports; i++) {
        const py = y - h / 2 + (h * (i + 1)) / (ports + 1);
        portholeRing(b, 'glow', i % 2 === 0 ? LIT_WARM : LIT, {
          r: flat(rMin, seg) + 0.1, count: portCount, size: 0.34, y: py,
        });
      }
      // Deck lamps just inside the parapet.
      portholeRing(b, 'glow', LIT_DIM, {
        r: rTop - 0.9, count: Math.round(portCount * 0.6), size: 0.28,
        y: y + h / 2 + 0.3, tilt: 1.6,
      });
    };

    /**
     * A rim block: the rectangular barrack houses standing on the terraces in
     * the reference. Boxes, so `windowGrid` is exact on their flat faces.
     */
    const rimBlock = (o) => {
      const { x, y, z, ry, w, h, d, skin, seed } = o;
      b.push(x, y, z, ry, 0, 0);
      box(b, 'hull', skin, w, h, d);
      panelSkin(b, 'hull', P_BLOCK, { r: d / 2 * 0.9, from: -w / 2 + 0.4, to: w / 2 - 0.4, rows: 3, cols: 8, seed, t: 0.16, axis: 'x' });
      // Roof cap and a crimson recognition stripe along the outer face.
      box(b, 'hull', W(STEEL, 2), w * 1.04, 0.3, d * 1.04, { y: h / 2 + 0.15 });
      box(b, 'hull', CRIMSON, w * 0.9, 0.28, 0.12, { y: h / 2 - 0.5, z: d / 2 + 0.06 });
      // Window fields on the two long faces. The face plane is exact here.
      for (const s of [1, -1]) {
        windowGrid(b, 'glow', s > 0 ? LIT_WARM : LIT_DIM, {
          rows: 2, cols: 5, rowGap: 0.72, colGap: w / 6,
          w: 0.5, h: 0.42, d: 0.34, x: 0, y: 0, z: s * (d / 2 + 0.08), axis: 'x',
        });
      }
      // End face gets a smaller field and a glazed watch slit.
      windowGrid(b, 'glow', LIT, {
        rows: 2, cols: 2, rowGap: 0.7, colGap: 0.8,
        w: 0.42, h: 0.4, d: 0.3, x: w / 2 + 0.06, y: 0, z: 0, axis: 'y',
      });
      box(b, 'glaze', OPTIC, 0.16, 0.5, d * 0.5, { x: w / 2 + 0.1, y: h / 2 - 0.9 });
      b.pop();
    };

    /**
     * A gun spar: a plated beam reaching out past the rim with a twin-barrel
     * turret on its tip. Six of these are the reference's read from above.
     */
    const gunSpar = (o) => {
      const { ang, y, inner, outer, seed } = o;
      b.push(0, y, 0, -ang, 0, 0);
      const len = outer - inner;
      const mid = (inner + outer) / 2;
      // Beam. Overlaps the terrace at its inner end, so the spar is structure.
      box(b, 'hull', W(STEEL, 1), len, 1.5, 3.4, { x: mid });
      box(b, 'hull', DARK, len, 0.3, 3.8, { x: mid, y: -0.85 });
      panelSkin(b, 'hull', P_STEEL, { r: 1.7, from: inner + 0.6, to: outer - 0.6, rows: 3, cols: 8, seed, t: 0.16, axis: 'x' });
      truss(b, 'hull', DARK, { ax: inner + 0.5, ay: -1.3, az: 0, bx: outer - 1.5, by: -1.3, bz: 0, bays: 5, thickness: 0.26, spread: 1.2 });
      // Deck lamps down both flanks of the beam.
      for (const s of [1, -1]) {
        lampString(b, 'glow', LIT_DIM, {
          ax: inner + 1, ay: 0.9, az: s * 1.6, bx: outer - 1, by: 0.9, bz: s * 1.6,
          count: 7, size: 0.26,
        });
      }
      // Turret: armoured drum, crimson bands, twin barrels reaching outward.
      const tr = 2.2;
      b.push(outer, 0.6, 0, 0, 0, 0);
      cyl(b, 'hull', W(STEEL, 1), tr, tr * 1.1, 2.4, 16);
      panelSkin(b, 'hull', P_STEEL, { r: tr, from: -1, to: 1, rows: 2, cols: 12, seed: seed + 1, t: 0.18, axis: 'y' });
      torus(b, 'hull', CRIMSON, tr + 0.16, 0.2, 6, 16, undefined, { y: 0.7, rx: Math.PI / 2 });
      torus(b, 'hull', W(CRIMSON, 1), tr + 0.16, 0.2, 6, 16, undefined, { y: -0.7, rx: Math.PI / 2 });
      portholeRing(b, 'glow', LIT, { r: flat(tr, 16) + 0.1, count: 10, size: 0.3, y: 0.1 });
      hemi(b, 'hull', W(STEEL, 2), tr * 0.8, 16, 8, { y: 1.2 });
      for (const s of [-0.85, 0.85]) {
        b.push(0, 1.1, s, 0, 0, 0);
        cyl(b, 'hull', W(IRON, 0), 0.42, 0.42, 4.6, 8, { x: 2.3, rz: Math.PI / 2 });
        ribBands(b, 'hull', DARK, { r: 0.48, tube: 0.09, from: 1.0, to: 4.0, count: 4, axis: 'x', tseg: 8 });
        b.pop();
      }
      box(b, 'glaze', OPTIC, 0.3, 0.5, 1.5, { x: tr * 0.85, y: 0.9 });
      b.pop();
      b.pop();
    };

    // ----------------------------------------------------- keel and magazine --
    // The disc needs a visible underside or it reads as a plate. Keel first, so
    // everything below the underhull hangs off structure that reaches it.

    for (const a of [0, Math.PI / 2]) {
      truss(b, 'hull', DARK, {
        ax: Math.cos(a) * -15, ay: -14, az: Math.sin(a) * -15,
        bx: Math.cos(a) * 15, by: -14, bz: Math.sin(a) * 15,
        bays: 9, thickness: 0.42, spread: 1.5,
      });
    }
    // Drop airlocks tying the keel to the underhull above it.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      airlock(b, 'hull', W(STEEL, 2), DARK, {
        ax: Math.cos(a) * 9, ay: -10.5, az: Math.sin(a) * 9,
        bx: Math.cos(a) * 6, by: -14.2, bz: Math.sin(a) * 6,
        r: 1.3, seg: 12, rings: 2,
      });
    }
    // Armoured magazine drum below the keel.
    b.push(0, -16.6, 0, 0, 0, 0);
    cyl(b, 'hull', W(IRON, 0), 6.4, 5.6, 5, 20);
    panelSkin(b, 'hull', P_UNDER, { r: 5.6, from: -2.2, to: 2.2, rows: 3, cols: 20, seed: 4581, t: 0.22, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 6.5, tube: 0.24, from: -1.8, to: 1.8, count: 3, axis: 'y', tseg: 20 });
    hemi(b, 'hull', W(STEEL, 3), 5.4, 20, 10, { y: -2.4, rx: Math.PI });
    portholeRing(b, 'glow', LIT_DIM, { r: flat(5.6, 20) + 0.2, count: 16, size: 0.3, y: 0.4 });
    portholeRing(b, 'glow', LIT_DIM, { r: flat(5.6, 20) + 0.2, count: 14, size: 0.28, y: -0.8 });
    b.pop();
    // Magazine hangs off the keel, and the ring hangs off the magazine.
    airlock(b, 'hull', W(STEEL, 2), DARK, { ax: 0, ay: -13.6, az: 0, bx: 0, by: -16, bz: 0, r: 2.2, seg: 16, rings: 2 });
    airlock(b, 'hull', W(STEEL, 2), DARK, { ax: 0, ay: -18.4, az: 0, bx: 0, by: -19.6, bz: 0, r: 1.9, seg: 14, rings: 2 });

    // ------------------------------------------------------------ underhull --
    // Tapered drum closing the disc's bottom, r 18 at its widest.
    b.push(0, -9.5, 0, 0, 0, 0);
    cyl(b, 'hull', W(IRON, 0), 18, 11, 5.2, 44);
    panelSkin(b, 'hull', P_UNDER, { r: 11.5, from: -2.4, to: 2.4, rows: 4, cols: 46, seed: 4520, t: 0.24, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 12, tube: 0.3, from: -2, to: 2, count: 3, axis: 'y', tseg: 44 });
    portholeRing(b, 'glow', LIT_DIM, { r: 16.4, count: 44, size: 0.3, y: 1.9 });
    b.pop();
    // Radial keel ribs on the underhull — the reference's ribbed belly.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.push(0, -8.8, 0, -a, 0, 0);
      box(b, 'hull', W(IRON, 1), 12, 0.9, 0.7, { x: 11 });
      box(b, 'hull', DARK, 12, 0.3, 1.1, { x: 11, y: -0.55 });
      b.pop();
    }

    // -------------------------------------------------------- outer terrace --
    terrace({ y: -5, rTop: 24, rBot: 21, h: 4, seg: 56, plates: P_STEEL, seed: 4530, ports: 2, portCount: 60 });

    // Sixteen rim blocks standing on the outer terrace crown.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.PI / 32;
      const r = 20.4;
      rimBlock({
        x: Math.cos(a) * r, y: -1.9, z: Math.sin(a) * r, ry: -a + Math.PI / 2,
        w: 6.4, h: 2.6, d: 3.2,
        skin: i % 3 === 0 ? STEEL : W(STEEL, 1), seed: 4540 + i,
      });
      // Every block is stitched to the terrace behind it.
      airlock(b, 'hull', W(STEEL, 2), DARK, {
        ax: Math.cos(a) * 19.6, ay: -2.4, az: Math.sin(a) * 19.6,
        bx: Math.cos(a) * 17.4, by: -1.4, bz: Math.sin(a) * 17.4,
        r: 0.9, seg: 10, rings: 1,
      });
    }
    // Catwalk hoop linking the blocks, and its lamp run.
    for (let i = 0; i < 16; i++) {
      const a1 = (i / 16) * Math.PI * 2 + Math.PI / 32;
      const a2 = ((i + 1) / 16) * Math.PI * 2 + Math.PI / 32;
      bridge(b, 'hull', W(STEEL, 2), DARK, {
        ax: Math.cos(a1) * 20.4, ay: -3.3, az: Math.sin(a1) * 20.4,
        bx: Math.cos(a2) * 20.4, by: -3.3, bz: Math.sin(a2) * 20.4,
        w: 1.6, railH: 0.7, posts: 3,
      });
    }

    // ------------------------------------------------------------ gun spars --
    // Six, on the reference's radial pattern, sitting between the rim blocks.
    for (let i = 0; i < 6; i++) {
      gunSpar({ ang: (i / 6) * Math.PI * 2, y: -3.4, inner: 17, outer: 25, seed: 4560 + i * 3 });
    }

    // ---------------------------------------------------------- mid terrace --
    terrace({ y: -1, rTop: 18, rBot: 19.5, h: 4, seg: 48, plates: P_DECK, seed: 4570, ports: 2, portCount: 48 });

    // Eight mid-terrace command houses, larger than the rim blocks.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = 15;
      rimBlock({
        x: Math.cos(a) * r, y: 2.1, z: Math.sin(a) * r, ry: -a + Math.PI / 2,
        w: 7, h: 3.2, d: 3.8, skin: W(STEEL, 1), seed: 4590 + i,
      });
      airlock(b, 'hull', W(STEEL, 2), DARK, {
        ax: Math.cos(a) * 14.2, ay: 1.4, az: Math.sin(a) * 14.2,
        bx: Math.cos(a) * 11.4, by: 2.4, bz: Math.sin(a) * 11.4,
        r: 1.1, seg: 10, rings: 2,
      });
    }

    // ---------------------------------------------------------- inner plaza --
    terrace({ y: 3, rTop: 12, rBot: 13.5, h: 4, seg: 40, plates: P_DECK, seed: 4600, ports: 2, portCount: 40 });

    // The muster deck: a plated floor with standards ranked along its edge, the
    // reference's lit parade ground in front of the tower.
    cyl(b, 'hull', W(STEEL, 2), 11.6, 11.6, 0.5, 40, { y: 5.1 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 10.6;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      box(b, 'hull', W(STEEL, 1), 0.24, 3.2, 0.24, { x, y: 6.9, z });
      box(b, 'hull', i % 2 === 0 ? CRIMSON : W(BRASS, 1), 0.1, 1.8, 0.7, { x, y: 7.4, z, ry: -a });
      box(b, 'glow', LIT_WARM, 0.26, 0.26, 0.26, { x, y: 8.6, z });
    }
    // Radial deck stripes, crimson on the cardinal axes as in the reference.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      b.push(0, 5.4, 0, -a, 0, 0);
      box(b, 'hull', i % 2 === 0 ? W(CRIMSON, 1) : W(STEEL, 3), 9, 0.14, 0.8, { x: 6.5 });
      b.pop();
    }

    // --------------------------------------------------------------- tower --
    // The reference's cathedral spire. Seven stepped tiers, r 5.6 -> 1.5,
    // running y 7 -> 27 with spires above. Nothing else reaches past y 9, so
    // this owns the skyline from every approach.
    const TIERS = [
      { y: 7.0, h: 3.2, r: 5.6, seg: 24 },
      { y: 10.0, h: 3.0, r: 4.9, seg: 24 },
      { y: 12.9, h: 2.9, r: 4.2, seg: 20 },
      { y: 15.7, h: 2.8, r: 3.6, seg: 20 },
      { y: 18.4, h: 2.7, r: 3.0, seg: 16 },
      { y: 21.0, h: 2.6, r: 2.4, seg: 16 },
      { y: 23.5, h: 2.6, r: 1.8, seg: 12 },
    ];
    // Plinth: the tower grows out of the plaza, it is not parked on it.
    cyl(b, 'hull', STEEL, 6.6, 7.6, 2.6, 28, { y: 5.9 });
    panelSkin(b, 'hull', P_TOWER, { r: 6.6, from: 4.9, to: 6.9, rows: 2, cols: 26, seed: 4610, t: 0.2, axis: 'y' });
    torus(b, 'hull', BRASS, 7.7, 0.32, 8, 28, undefined, { y: 4.7, rx: Math.PI / 2 });
    portholeRing(b, 'glow', LIT_WARM, { r: flat(6.6, 28) + 0.1, count: 26, size: 0.32, y: 6.2 });

    TIERS.forEach((t, i) => {
      const rNext = i + 1 < TIERS.length ? TIERS[i + 1].r : t.r * 0.8;
      cyl(b, 'hull', STEEL, rNext + 0.3, t.r, t.h, t.seg, { y: t.y + t.h / 2 });
      panelSkin(b, 'hull', P_TOWER, {
        r: rNext + 0.2, from: t.y + 0.4, to: t.y + t.h - 0.4,
        rows: 3, cols: Math.round(t.seg * 0.9), seed: 4620 + i * 7, t: 0.18, axis: 'y',
      });
      ribBands(b, 'hull', DARK, {
        r: rNext + 0.4, tube: 0.18, from: t.y + 0.6, to: t.y + t.h - 0.6,
        count: 2, axis: 'y', tseg: t.seg,
      });
      // Brass rank band at every tier joint — the reference's gold banding.
      torus(b, 'hull', BRASS, t.r + 0.18, 0.24, 8, t.seg, undefined, { y: t.y, rx: Math.PI / 2 });
      torus(b, 'hull', DARK, t.r + 0.18, 0.12, 6, t.seg, undefined, { y: t.y - 0.26, rx: Math.PI / 2 });
      // Lit band, on the radial basis so it cannot leave the wall.
      portholeRing(b, 'glow', i % 2 === 0 ? LIT_WARM : LIT, {
        r: flat(rNext + 0.2, t.seg) + 0.12, count: Math.max(10, t.seg - 4),
        size: 0.3, y: t.y + t.h * 0.55,
      });
      // Crimson banners hanging the full tier — the tower's vertical read.
      const banners = i < 4 ? 8 : 6;
      for (let j = 0; j < banners; j++) {
        const a = (j / banners) * Math.PI * 2 + (i % 2) * (Math.PI / banners);
        const br = rNext + 0.35;
        box(b, 'hull', j % 2 === 0 ? CRIMSON : W(CRIMSON, 1), 0.6, t.h * 0.78, 0.14, {
          x: Math.cos(a) * br, y: t.y + t.h / 2, z: Math.sin(a) * br, ry: -a + Math.PI / 2,
        });
      }
      // Buttress fins on the lower tiers, the cathedral note.
      if (i < 3) {
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2 + Math.PI / 4;
          b.push(0, t.y, 0, -a, 0, 0);
          box(b, 'hull', W(STEEL, 1), 1.6, t.h, 0.5, { x: t.r + 0.4, y: t.h / 2 });
          box(b, 'hull', DARK, 1.8, 0.24, 0.7, { x: t.r + 0.4, y: t.h });
          b.pop();
        }
      }
      // Watch galleries with glazed optics on the upper tiers.
      if (i >= 3) {
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2 + (i % 2) * (Math.PI / 4);
          b.push(0, t.y + t.h * 0.5, 0, -a, 0, 0);
          box(b, 'hull', W(STEEL, 2), 1.0, 0.9, 1.5, { x: rNext + 0.7 });
          box(b, 'glaze', OPTIC, 0.16, 0.5, 1.0, { x: rNext + 1.25 });
          b.pop();
        }
      }
    });

    // Tower crown: a lantern chamber, four spires and the mast.
    const CROWN_Y = 26.1;
    cyl(b, 'hull', W(STEEL, 1), 1.5, 2.0, 1.6, 12, { y: CROWN_Y });
    portholeRing(b, 'glow', LIT, { r: flat(1.5, 12) + 0.12, count: 10, size: 0.3, y: CROWN_Y });
    torus(b, 'hull', BRASS, 2.05, 0.2, 6, 12, undefined, { y: CROWN_Y - 0.8, rx: Math.PI / 2 });
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + Math.PI / 4;
      cone(b, 'hull', W(STEEL, 2), 0.4, 2.6, 6, { x: Math.cos(a) * 1.5, y: CROWN_Y + 1.7, z: Math.sin(a) * 1.5 });
      box(b, 'glow', LIT_WARM, 0.22, 0.22, 0.22, { x: Math.cos(a) * 1.5, y: CROWN_Y + 3.1, z: Math.sin(a) * 1.5 });
    }
    cone(b, 'hull', W(STEEL, 1), 0.9, 2.2, 8, { y: CROWN_Y + 1.9 });
    antenna(b, 'hull', DARK, W(STEEL, 1), { x: 0, y: CROWN_Y + 2.6, z: 0, h: 2.2, r: 0.12, tip: 0.26 });

    // Four secondary spires ringing the plaza, well below the tower crown so
    // they frame it instead of competing with it.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(a) * 10.4;
      const z = Math.sin(a) * 10.4;
      b.push(x, 5.2, z, -a, 0, 0);
      cyl(b, 'hull', W(STEEL, 1), 1.5, 1.9, 4.2, 14, { y: 2.1 });
      panelSkin(b, 'hull', P_TOWER, { r: 1.6, from: 0.6, to: 3.6, rows: 3, cols: 10, seed: 4650 + i, t: 0.14, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: 1.75, tube: 0.14, from: 1.0, to: 3.2, count: 2, axis: 'y', tseg: 14 });
      torus(b, 'hull', BRASS, 1.75, 0.16, 6, 14, undefined, { y: 3.9, rx: Math.PI / 2 });
      portholeRing(b, 'glow', LIT_WARM, { r: flat(1.5, 14) + 0.12, count: 10, size: 0.28, y: 2.6 });
      box(b, 'hull', CRIMSON, 0.5, 2.6, 0.12, { x: 1.62, y: 2.2 });
      cone(b, 'hull', W(STEEL, 2), 0.9, 2.4, 8, { y: 5.4 });
      box(b, 'glow', LIT, 0.24, 0.24, 0.24, { y: 6.8 });
      b.pop();
      airlock(b, 'hull', W(STEEL, 2), DARK, {
        ax: x, ay: 5.4, az: z, bx: Math.cos(a) * 6.4, by: 5.8, bz: Math.sin(a) * 6.4,
        r: 0.9, seg: 10, rings: 1,
      });
    }

    // ------------------------------------------------------- service detail --
    // Radiator banks on the underhull skirt, canted so they catch the sun.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      b.push(Math.cos(a) * 15.5, -8.4, Math.sin(a) * 15.5, -a + Math.PI / 2, 0, 0);
      radiatorPanel(b, 'hull', DARK, W(STEEL, 1), { w: 5, h: 3, fins: 6, thick: 0.14 });
      b.pop();
    }
    // Pipe runs tying the terraces together vertically.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 16;
      pipeRun(b, 'hull', W(STEEL, 1), {
        ax: Math.cos(a) * 12.6, ay: 4.2, az: Math.sin(a) * 12.6,
        bx: Math.cos(a) * 18.6, by: -1.2, bz: Math.sin(a) * 18.6,
        r: 0.2, seg: 8, collars: 3,
      });
      pipeRun(b, 'hull', W(STEEL, 2), {
        ax: Math.cos(a) * 18.8, ay: -1.6, az: Math.sin(a) * 18.8,
        bx: Math.cos(a) * 21.4, by: -6.4, bz: Math.sin(a) * 21.4,
        r: 0.18, seg: 8, collars: 2,
      });
    }
    // Antenna array on the mid terrace, kept short so the tower still wins.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 12;
      antenna(b, 'hull', DARK, W(STEEL, 1), {
        x: Math.cos(a) * 16.8, y: 1.2, z: Math.sin(a) * 16.8,
        h: 4.5 + (i % 3), r: 0.12, tip: 0.3,
      });
    }

    // Greebles, seated on named surfaces only. The wave-45 build scattered these
    // through a 36 x 22 x 36 volume and left a two-cell island at (16, 8, 4).
    greebleScatter(b, 'hull', [DARK, W(IRON, 1), W(STEEL, 2), W(CRIMSON, 2)], {
      count: 90, seed: 4680, min: 0.5, max: 1.2,
      glowCh: 'glow', glowHex: LIT_DIM, glowEvery: 4, glowSize: 0.3,
      anchors: [
        { x: 0, y: -5, z: 0, r: 22, from: -1.6, to: 1.6, axis: 'y', weight: 3 },  // outer terrace wall
        { x: 0, y: -1, z: 0, r: 18.4, from: -1.6, to: 1.6, axis: 'y', weight: 2 }, // mid terrace wall
        { x: 0, y: 3, z: 0, r: 12.4, from: -1.6, to: 1.6, axis: 'y', weight: 2 },  // plaza wall
        { x: 0, y: -9.5, z: 0, r: 14, from: -2, to: 2, axis: 'y', weight: 2 },     // underhull
        { x: 0, y: 5.35, z: 0, w: 16, d: 16, weight: 2 },                          // muster deck
        { x: 0, y: 7.2, z: 0, r: 5.4, from: 0.4, to: 2.6, axis: 'y' },             // tower tier 1
        { x: 0, y: -16.6, z: 0, r: 5.8, from: -1.8, to: 1.8, axis: 'y' },          // magazine
      ],
    });

    // ------------------------------------------------- rotating battery ring --
    // Radius 12, tucked at ringY -19 under the magazine, so it reads as gear
    // slung beneath the fortress rather than a hoop around a void.
    const R = 12;
    torus(ringB, 'ringHull', W(IRON, 0), R, 1.2, 12, 40, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(STEEL, 2), R, 0.28, 8, 40, undefined, { y: 0.66, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(STEEL, 2), R, 0.28, 8, 40, undefined, { y: -0.66, rx: Math.PI / 2 });

    // Plated hub and spokes.
    cyl(ringB, 'ringHull', STEEL, 2.6, 3.0, 1.8, 16);
    panelSkin(ringB, 'ringHull', P_STEEL, { r: 3.0, from: -0.7, to: 0.7, rows: 2, cols: 12, seed: 4700, t: 0.16, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 3.1, tube: 0.16, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 16 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      truss(ringB, 'ringHull', DARK, {
        ax: Math.cos(a) * 2.4, ay: 0, az: Math.sin(a) * 2.4,
        bx: Math.cos(a) * (R - 1.2), by: 0, bz: Math.sin(a) * (R - 1.2),
        bays: 4, thickness: 0.24, spread: 0.6,
      });
    }

    // Eight turret houses on the hoop.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a + Math.PI / 2, 0, 0);
      cyl(ringB, 'ringHull', W(STEEL, 1), 2.2, 2.4, 2.0, 14);
      panelSkin(ringB, 'ringHull', P_STEEL, { r: 2.3, from: -0.8, to: 0.8, rows: 2, cols: 10, seed: 4710 + i, t: 0.16, axis: 'y' });
      ribBands(ringB, 'ringHull', DARK, { r: 2.45, tube: 0.16, from: -0.6, to: 0.6, count: 2, axis: 'y', tseg: 14 });
      torus(ringB, 'ringHull', CRIMSON, 2.5, 0.16, 6, 14, undefined, { y: 0.85, rx: Math.PI / 2 });
      portholeRing(ringB, 'ringGlow', LIT, { r: flat(2.2, 14) + 0.12, count: 10, size: 0.28, y: 0.1 });
      for (const gx of [-0.85, 0.85]) {
        ringB.push(gx, 1.5, 0, 0, 0, 0);
        cyl(ringB, 'ringHull', W(IRON, 0), 0.34, 0.34, 4.4, 8, { rx: Math.PI / 2 });
        ribBands(ringB, 'ringHull', DARK, { r: 0.4, tube: 0.07, from: -1.7, to: 1.7, count: 3, axis: 'x', tseg: 8 });
        ringB.pop();
      }
      box(ringB, 'ringGlaze', OPTIC, 1.1, 0.6, 0.28, { y: 0.7, z: 2.3 });
      box(ringB, 'ringGlaze', OPTIC, 1.1, 0.6, 0.28, { y: 0.7, z: -2.3 });
      ringB.pop();
    }

    // Rim lamps.
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + Math.PI / 56;
      box(ringB, 'ringGlow', LIT_WARM, 0.28, 0.28, 0.24, {
        x: Math.cos(a) * (R + 0.9), y: 0.2, z: Math.sin(a) * (R + 0.9), ry: -a,
      });
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + Math.PI / 40;
      box(ringB, 'ringGlow', LIT_DIM, 0.24, 0.24, 0.2, {
        x: Math.cos(a) * (R - 1.0), y: 0.2, z: Math.sin(a) * (R - 1.0), ry: -a,
      });
    }
  },
};
