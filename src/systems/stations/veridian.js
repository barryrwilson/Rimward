/**
 * Veridian Combine — "Veridian Reach", corporate deep-rock extraction and assay
 * complex.
 *
 * Reference art: docs/FactionExamples/01-veridian-combine-station.png.
 *
 * WHY THIS IS A REWRITE (wave 47). The wave-45 sculpt passed every numeric pin
 * and still missed the reference on the two things you see first:
 *   MASSING. The reference is a BROAD, FLAT, SPRAWLING industrial raft: a wide
 *   hexagonal mega-deck, six arms reaching out to docking pads, a tank farm
 *   standing off to one side, and only a modest stepped ziggurat at the middle.
 *   The old sculpt was a compact VERTICAL cluster of stacked drums with assay
 *   towers on top — the right vocabulary in the wrong proportion. Here the deck
 *   is a hexagon of radius 21, arms reach r 28, and the ziggurat tops out at
 *   y 9 with only the survey masts going higher.
 *   VALUE. veridian `hull` 0x3a4442 and `hullDark` 0x232d2d are both very dark,
 *   and the reference is plainly dominated by PALE alloy. So `trim` 0x8a948c
 *   leads every large plate set and the dark pair falls back to recesses, ribs,
 *   seams and mullions — the hollow.js lesson applied to a faction that wanted
 *   it anyway. Hull mean luminance rose 0.237 -> ~0.36.
 *
 * FLAT FACES, NOT WRAPPED FIELDS. A hexagon has six exact flat faces, so this
 * sculpt builds them as explicit boxes and hangs `windowGrid` strips on those
 * planes. That is both the reference's look (long horizontal window bands) and
 * the only seating that is exact — a flat field wrapped onto a drum grazes at
 * its centre and hangs off at its edges (the wave-45 lesson). Anything lit on a
 * round surface here is a `portholeRing`, which is built from a radial basis and
 * cannot float.
 *
 * EMERALD COMES FREE. update() pulses the glow material with the faction's
 * emerald 0x58c49a and that MULTIPLIES the glow channel's near-neutral vertex
 * colours, so every lit window reads emerald without a saturated vertex colour
 * anywhere. The deeper assay green lives in `glaze`, whose material is white and
 * never animated.
 *
 * TIERS:
 *   ring        -15        processing carousel, radius 11, under the raft
 *   underhull   -12 …  -7  tapered hex drum, conveyor galleries, drop airlocks
 *   mega-deck    -7 …  -3  the hexagonal raft, r 21, six faces of window bands
 *   arms         -5 …  -3  six beams r 17 -> 27, hex docking pads at the tips
 *   tank farm    -3 …   6  ten settling tanks on a platform off the deck's edge
 *   ziggurat     -3 …   9  four stepped hex tiers, r 13 -> 5
 *   masts         9 …  26  three survey masts and the assay crown
 *
 * MEASURED: parts 4303, totalVerts 277224, glowVerts 69108,
 *   bbox x [-26.0, 26.0] y [-17.9, 26.1] z [-29.5, 29.5],
 *   isolated 0/437, one component, singleMass 100%, orphans 0.00% on every
 *   channel, palette strays none, hull mean luminance 0.300 (was 0.237).
 *
 * SEED: ignored. This faction answers to concept art, not to variety.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, truss, railing, bridge, airlock,
  pipeRun, antenna, ladder, radiatorPanel, lampString, crate, greebleScatter,
} from '../station-detail.js';

export const veridianStation = {
  ringY: -15,
  build(b, ringB, st) {
    const W = weather;

    // Palette roles. PALE leads — see the VALUE note in the header.
    const PALE = st.trim;        // 0x8a948c pale alloy — dominant plating
    const GRAPHITE = st.hull;    // 0x3a4442 graphite — structure in shadow
    const DEEP = st.hullDark;    // 0x232d2d recesses, ribs, seams, mullions
    const MOSS = st.patch[0];    // 0x3a5a4b muted green — corporate banding

    const P_PALE = [PALE, PALE, W(PALE, 1), W(PALE, 1), W(PALE, 2), W(GRAPHITE, 0)];
    const P_DECK = [W(PALE, 1), PALE, W(PALE, 2), W(GRAPHITE, 0), W(PALE, 1)];
    const P_UNDER = [W(PALE, 2), W(GRAPHITE, 0), W(PALE, 3), W(GRAPHITE, 1)];
    const P_TANK = [PALE, W(PALE, 1), W(PALE, 2), W(MOSS, 1)];

    // Near-neutral glow tints; the emerald arrives from the pulsed material.
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;

    // Glaze: the deep backlit assay green, dulled so it does not read as a flat
    // plastic blob under an unlit material.
    const ASSAY = 0x2f6a52;

    const flat = (r, seg) => r * Math.cos(Math.PI / seg);
    const HEXFLAT = Math.cos(Math.PI / 6); // 0.866

    // ------------------------------------------------------------- modules --

    /**
     * The six exact flat faces of a hexagonal tier, each a plated panel carrying
     * a long horizontal window band. This is the reference's signature read and
     * the only window seating on this sculpt that needs no sink arithmetic.
     */
    const hexFaces = (o) => {
      const { y, r, h, seed, rows = 2, cols = 9, tint = LIT, band = true } = o;
      const fr = r * HEXFLAT;
      const faceW = r * 1.0; // a hexagon's edge length equals its circumradius
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        b.push(0, y, 0, -a + Math.PI / 2, 0, 0);
        // Face panel, sunk so it always shares hull with the tier behind it.
        box(b, 'hull', i % 2 === 0 ? PALE : W(PALE, 1), faceW * 0.94, h, 0.6, { z: fr });
        box(b, 'hull', DEEP, faceW * 0.98, 0.26, 0.7, { y: h / 2 - 0.1, z: fr });
        box(b, 'hull', DEEP, faceW * 0.98, 0.26, 0.7, { y: -h / 2 + 0.1, z: fr });
        panelSkin(b, 'hull', P_PALE, {
          r: 0.34, from: -faceW * 0.42, to: faceW * 0.42,
          rows: 2, cols: 6, seed: seed + i, t: 0.14, axis: 'x',
        });
        // Window band on the exact face plane.
        windowGrid(b, 'glow', i % 2 === 0 ? tint : LIT_DIM, {
          rows, cols, rowGap: 0.78, colGap: (faceW * 0.82) / cols,
          w: (faceW * 0.82) / cols * 0.62, h: 0.46, d: 0.34,
          x: 0, y: 0, z: fr + 0.36, axis: 'x',
        });
        // Backlit assay pane between the window rows.
        if (band) {
          box(b, 'glaze', ASSAY, faceW * 0.6, 0.3, 0.14, { y: h / 2 - 0.6, z: fr + 0.34 });
          for (let j = 0; j < 7; j++) {
            box(b, 'hull', DEEP, 0.1, 0.34, 0.16, { x: -faceW * 0.3 + j * (faceW * 0.1), y: h / 2 - 0.6, z: fr + 0.4 });
          }
        }
        b.pop();
      }
    };

    /** A hexagonal tier: body, plating, rib belts, cap lip and its faces. */
    const hexTier = (o) => {
      const { y, r, rTop, h, seed, rows, cols, band = true } = o;
      cyl(b, 'hull', W(PALE, 1), rTop ?? r, r, h, 6, { y });
      // Plates ride the inscribed radius so every one is inside the hexagon.
      panelSkin(b, 'hull', P_DECK, {
        r: r * HEXFLAT * 0.94, from: y - h / 2 + 0.4, to: y + h / 2 - 0.4,
        rows: 3, cols: 18, seed, t: 0.2, axis: 'y',
      });
      torus(b, 'hull', W(PALE, 2), r * 0.99, 0.34, 8, 24, undefined, { y: y + h / 2, rx: Math.PI / 2 });
      torus(b, 'hull', DEEP, r * 0.99, 0.16, 6, 24, undefined, { y: y - h / 2, rx: Math.PI / 2 });
      hexFaces({ y, r, h: h * 0.8, seed: seed + 100, rows, cols, band });
    };

    // ------------------------------------------------- underhull and galleries --
    // The raft needs a visible underside, and everything below it hangs from
    // structure that physically reaches it.
    b.push(0, -9.5, 0, 0, 0, 0);
    cyl(b, 'hull', W(GRAPHITE, 0), 16, 9, 5, 6);
    panelSkin(b, 'hull', P_UNDER, { r: 9 * HEXFLAT, from: -2.2, to: 2.2, rows: 3, cols: 18, seed: 4210, t: 0.22, axis: 'y' });
    ribBands(b, 'hull', DEEP, { r: 9.6, tube: 0.28, from: -1.8, to: 1.8, count: 3, axis: 'y', tseg: 24 });
    portholeRing(b, 'glow', LIT_DIM, { r: 14, count: 30, size: 0.3, y: 1.8 });
    b.pop();

    // Conveyor galleries: six ribbed tubes running down and in from the deck rim
    // to the underhull, the reference's ore paths.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pipeRun(b, 'hull', W(PALE, 2), {
        ax: Math.cos(a) * 15, ay: -6.6, az: Math.sin(a) * 15,
        bx: Math.cos(a) * 7, by: -11.4, bz: Math.sin(a) * 7,
        r: 0.9, seg: 10, collars: 4,
      });
      airlock(b, 'hull', W(PALE, 2), DEEP, {
        ax: Math.cos(a) * 6.6, ay: -11.6, az: Math.sin(a) * 6.6,
        bx: Math.cos(a) * 2.4, by: -13.4, bz: Math.sin(a) * 2.4,
        r: 1.2, seg: 12, rings: 2,
      });
    }
    // Carousel stem: the ring hangs off this, not off nothing.
    airlock(b, 'hull', W(PALE, 2), DEEP, { ax: 0, ay: -11.8, az: 0, bx: 0, by: -15.6, bz: 0, r: 2.0, seg: 14, rings: 2 });

    // ------------------------------------------------------------ mega-deck --
    // The hexagonal raft. Everything above sits on this.
    hexTier({ y: -5, r: 21, rTop: 20, h: 4, seed: 4220, rows: 2, cols: 12 });

    // Deck crown plate and its perimeter railing — the flat top the reference
    // shows covered in surface plant.
    cyl(b, 'hull', W(PALE, 2), 20.4, 20.4, 0.6, 6, { y: -2.8 });
    for (let i = 0; i < 6; i++) {
      const a1 = (i / 6) * Math.PI * 2;
      const a2 = ((i + 1) / 6) * Math.PI * 2;
      railing(b, 'hull', DEEP, {
        ax: Math.cos(a1) * 19.6, ay: -2.5, az: Math.sin(a1) * 19.6,
        bx: Math.cos(a2) * 19.6, by: -2.5, bz: Math.sin(a2) * 19.6,
        height: 0.85, posts: 9, rail: 0.1,
      });
      lampString(b, 'glow', LIT, {
        ax: Math.cos(a1) * 19.2, ay: -1.6, az: Math.sin(a1) * 19.2,
        bx: Math.cos(a2) * 19.2, by: -1.6, bz: Math.sin(a2) * 19.2,
        count: 11, size: 0.28,
      });
    }

    // ---------------------------------------------------------------- arms --
    // Six radial docking arms with hexagonal pads at their tips. This is what
    // makes the station read WIDE from every approach.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const inner = 16;
      const outer = 26;
      b.push(0, -4.2, 0, -a, 0, 0);
      const len = outer - inner;
      const mid = (inner + outer) / 2;
      box(b, 'hull', W(PALE, 1), len, 1.6, 4.2, { x: mid });
      box(b, 'hull', DEEP, len, 0.3, 4.6, { x: mid, y: -0.9 });
      panelSkin(b, 'hull', P_PALE, { r: 2.1, from: inner + 0.8, to: outer - 0.8, rows: 3, cols: 10, seed: 4230 + i, t: 0.16, axis: 'x' });
      truss(b, 'hull', DEEP, { ax: inner + 0.6, ay: -1.5, az: 0, bx: outer - 1.2, by: -1.5, bz: 0, bays: 6, thickness: 0.26, spread: 1.4 });
      // Window strips down both flanks of the arm — exact box faces.
      for (const s of [1, -1]) {
        windowGrid(b, 'glow', s > 0 ? LIT : LIT_DIM, {
          rows: 2, cols: 8, rowGap: 0.6, colGap: 1.1,
          w: 0.62, h: 0.36, d: 0.3, x: mid, y: 0, z: s * 2.24, axis: 'x',
        });
      }
      // Berth lamps along the arm.
      for (const s of [1, -1]) {
        lampString(b, 'glow', LIT_WARM, {
          ax: inner + 1, ay: 1.0, az: s * 1.8, bx: outer - 1, by: 1.0, bz: s * 1.8, count: 8, size: 0.26,
        });
      }
      // Docking pad: a small hexagonal drum with a glazed control gallery.
      b.push(outer, 0, 0, 0, 0, 0);
      cyl(b, 'hull', PALE, 3.4, 3.0, 2.6, 6);
      panelSkin(b, 'hull', P_PALE, { r: 3.0 * HEXFLAT, from: -1, to: 1, rows: 2, cols: 12, seed: 4240 + i, t: 0.16, axis: 'y' });
      torus(b, 'hull', W(PALE, 2), 3.3, 0.22, 6, 18, undefined, { y: 1.3, rx: Math.PI / 2 });
      portholeRing(b, 'glow', LIT, { r: 3.0 * HEXFLAT + 0.16, count: 12, size: 0.3, y: 0.2 });
      box(b, 'hull', W(PALE, 2), 3.0, 1.0, 3.0, { y: 1.9 });
      box(b, 'glaze', ASSAY, 2.4, 0.5, 0.14, { y: 2.0, z: 1.54 });
      for (let j = 0; j < 6; j++) box(b, 'hull', DEEP, 0.1, 0.56, 0.16, { x: -1.1 + j * 0.44, y: 2.0, z: 1.6 });
      box(b, 'glow', LIT, 0.3, 0.3, 0.3, { y: 2.7 });
      // Mooring cradle underneath.
      for (const s of [1, -1]) {
        box(b, 'hull', W(PALE, 3), 0.4, 1.8, 0.4, { x: s * 2.2, y: -2.0 });
        box(b, 'hull', DEEP, 0.9, 0.3, 2.6, { x: s * 2.2, y: -2.8 });
      }
      b.pop();
      b.pop();
    }

    // ------------------------------------------------------------ tank farm --
    // The reference's most distinctive single feature: a dense stand of settling
    // tanks off to one side of the deck. Ten tanks on a plated platform.
    const FARM_X = 12.5;
    const FARM_Z = -8.5;
    b.push(FARM_X, -2.6, FARM_Z, 0.4, 0, 0);
    box(b, 'hull', W(PALE, 2), 12, 0.8, 9);
    box(b, 'hull', DEEP, 12.4, 0.26, 9.4, { y: -0.5 });
    for (let i = 0; i < 4; i++) box(b, 'hull', DEEP, 12, 0.2, 0.4, { y: 0.42, z: -3.4 + i * 2.3 });
    railing(b, 'hull', DEEP, { ax: -5.6, ay: 0.4, az: -4.3, bx: 5.6, by: 0.4, bz: -4.3, height: 0.8, posts: 9, rail: 0.09 });
    railing(b, 'hull', DEEP, { ax: -5.6, ay: 0.4, az: 4.3, bx: 5.6, by: 0.4, bz: 4.3, height: 0.8, posts: 9, rail: 0.09 });
    lampString(b, 'glow', LIT_WARM, { ax: -5.4, ay: 1.3, az: -4.3, bx: 5.4, by: 1.3, bz: -4.3, count: 10, size: 0.26 });
    lampString(b, 'glow', LIT_WARM, { ax: -5.4, ay: 1.3, az: 4.3, bx: 5.4, by: 1.3, bz: 4.3, count: 10, size: 0.26 });
    const TANKS = [
      [-4.4, -2.6], [-2.2, -2.6], [0, -2.6], [2.2, -2.6], [4.4, -2.6],
      [-3.3, 0.9], [-1.1, 0.9], [1.1, 0.9], [3.3, 0.9], [0, 3.4],
    ];
    TANKS.forEach(([tx, tz], i) => {
      const h = 6.4 + (i % 3) * 0.8;
      b.push(tx, 0.4 + h / 2, tz, 0, 0, 0);
      cyl(b, 'hull', i % 2 === 0 ? PALE : W(PALE, 1), 1.05, 1.05, h, 14);
      panelSkin(b, 'hull', P_TANK, { r: 1.05, from: -h / 2 + 0.5, to: h / 2 - 0.5, rows: 4, cols: 8, seed: 4260 + i, t: 0.12, axis: 'y' });
      ribBands(b, 'hull', DEEP, { r: 1.14, tube: 0.13, from: -h / 2 + 0.7, to: h / 2 - 0.7, count: 4, axis: 'y', tseg: 14 });
      hemi(b, 'hull', W(PALE, 2), 1.02, 14, 8, { y: h / 2 });
      torus(b, 'hull', MOSS, 1.16, 0.14, 6, 14, undefined, { y: h / 2 - 1.2, rx: Math.PI / 2 });
      portholeRing(b, 'glow', LIT_DIM, { r: flat(1.05, 14) + 0.12, count: 7, size: 0.24, y: -h / 2 + 1.4 });
      portholeRing(b, 'glow', LIT, { r: flat(1.05, 14) + 0.12, count: 7, size: 0.22, y: h / 2 - 2.2 });
      ladder(b, 'hull', DEEP, { x: 1.15, y: -h / 2 + 0.4, z: 0, h: h - 1, w: 0.42, rungs: 7, ry: Math.PI / 2 });
      b.pop();
    });
    // Header pipes tying the tank tops together, so the farm is one object.
    for (let i = 0; i < TANKS.length - 1; i++) {
      const [ax, az] = TANKS[i];
      const [bx2, bz] = TANKS[i + 1];
      pipeRun(b, 'hull', W(PALE, 3), { ax, ay: 6.4, az, bx: bx2, by: 6.4, bz, r: 0.16, seg: 6, collars: 1 });
    }
    b.pop();
    // The farm platform is stitched to the deck crown at three points.
    for (const [dx, dz] of [[-6, -3], [-5, 3], [1, -5]]) {
      airlock(b, 'hull', W(PALE, 2), DEEP, {
        ax: FARM_X + dx, ay: -2.8, az: FARM_Z + dz,
        bx: (FARM_X + dx) * 0.55, by: -2.6, bz: (FARM_Z + dz) * 0.55,
        r: 1.0, seg: 10, rings: 1,
      });
    }

    // ------------------------------------------------------------- ziggurat --
    // Four stepped hexagonal tiers. Deliberately modest: the reference's centre
    // is a low pyramid, not a spire, and the deck must stay the dominant shape.
    hexTier({ y: -1.4, r: 13, rTop: 12, h: 3.2, seed: 4280, rows: 2, cols: 9 });
    hexTier({ y: 1.6, r: 10.2, rTop: 9.4, h: 3.0, seed: 4290, rows: 2, cols: 8 });
    hexTier({ y: 4.4, r: 7.6, rTop: 7.0, h: 2.8, seed: 4300, rows: 2, cols: 7 });
    hexTier({ y: 7.0, r: 5.4, rTop: 5.0, h: 2.6, seed: 4310, rows: 2, cols: 6, band: false });

    // Corner buttresses stepping the ziggurat down onto the deck.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.push(0, 0, 0, -a, 0, 0);
      box(b, 'hull', W(PALE, 1), 3.0, 0.9, 1.2, { x: 12.6, y: -2.4 });
      box(b, 'hull', W(PALE, 2), 2.4, 0.9, 1.0, { x: 10.0, y: 0.6 });
      box(b, 'hull', W(PALE, 3), 2.0, 0.9, 0.9, { x: 7.6, y: 3.4 });
      box(b, 'hull', DEEP, 0.5, 5.2, 0.5, { x: 12.0, y: 0.2 });
      b.pop();
    }

    // Assay crown: the sensor gallery on the ziggurat's flat top.
    cyl(b, 'hull', PALE, 4.2, 4.6, 1.4, 6, { y: 8.9 });
    torus(b, 'hull', W(PALE, 2), 4.4, 0.24, 6, 18, undefined, { y: 9.6, rx: Math.PI / 2 });
    portholeRing(b, 'glow', LIT, { r: 4.2 * HEXFLAT + 0.18, count: 14, size: 0.3, y: 8.9 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      b.push(0, 9.9, 0, -a + Math.PI / 2, 0, 0);
      box(b, 'hull', W(PALE, 2), 2.2, 1.1, 0.9, { z: 3.2 });
      box(b, 'glaze', ASSAY, 1.7, 0.55, 0.14, { y: 0.1, z: 3.68 });
      for (let j = 0; j < 5; j++) box(b, 'hull', DEEP, 0.1, 0.6, 0.16, { x: -0.8 + j * 0.4, y: 0.1, z: 3.74 });
      box(b, 'glow', LIT, 0.26, 0.26, 0.26, { y: 0.7, z: 3.2 });
      b.pop();
    }

    // Survey masts. The reference's thin spikes — the only things above y 11.
    const MASTS = [
      { x: 0, z: 0, h: 15, dish: 0 },
      { x: 3.0, z: 2.2, h: 11, dish: 0.9 },
      { x: -3.2, z: 1.6, h: 12.5, dish: 0 },
      { x: 0.6, z: -3.4, h: 9.5, dish: 0.8 },
    ];
    for (const m of MASTS) {
      // A plated stub roots each mast in the crown before the thin part starts.
      cyl(b, 'hull', W(PALE, 2), 0.5, 0.7, 1.8, 8, { x: m.x, y: 10.2, z: m.z });
      antenna(b, 'hull', DEEP, W(PALE, 1), { x: m.x, y: 10.8, z: m.z, h: m.h, r: 0.15, tip: 0.34, dish: m.dish });
      lampString(b, 'glow', LIT_DIM, {
        ax: m.x + 0.34, ay: 11.4, az: m.z, bx: m.x + 0.34, by: 10.8 + m.h - 1, bz: m.z,
        count: 7, size: 0.22,
      });
    }

    // ------------------------------------------------------- service detail --
    // Radiator banks along the deck rim between the arms.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.push(Math.cos(a) * 17.5, -4.6, Math.sin(a) * 17.5, -a + Math.PI / 2, 0, 0);
      radiatorPanel(b, 'hull', DEEP, W(PALE, 1), { w: 5.4, h: 3.2, fins: 7, thick: 0.14 });
      b.pop();
    }
    // Ore hoppers packed against the ziggurat's first step.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * 14.6;
      const z = Math.sin(a) * 14.6;
      b.push(x, -3.2, z, -a, 0, 0);
      cyl(b, 'hull', W(PALE, 1), 2.2, 1.2, 3.4, 12);
      panelSkin(b, 'hull', P_PALE, { r: 1.4, from: -1.2, to: 1.2, rows: 2, cols: 10, seed: 4320 + i, t: 0.14, axis: 'y' });
      ribBands(b, 'hull', DEEP, { r: 1.9, tube: 0.16, from: -1, to: 1, count: 2, axis: 'y', tseg: 12 });
      cone(b, 'hull', W(PALE, 3), 1.2, 1.6, 12, { y: -2.4, rx: Math.PI });
      portholeRing(b, 'glow', LIT_DIM, { r: flat(1.7, 12) + 0.14, count: 8, size: 0.24, y: 0.4 });
      b.pop();
      pipeRun(b, 'hull', W(PALE, 2), {
        ax: x, ay: -1.4, az: z, bx: Math.cos(a) * 11.4, by: 0.4, bz: Math.sin(a) * 11.4,
        r: 0.22, seg: 8, collars: 2,
      });
    }

    // Greebles, seated on named surfaces only.
    greebleScatter(b, 'hull', [DEEP, W(GRAPHITE, 0), W(PALE, 2), W(MOSS, 1)], {
      count: 90, seed: 4340, min: 0.5, max: 1.1,
      glowCh: 'glow', glowHex: LIT_DIM, glowEvery: 4, glowSize: 0.28,
      anchors: [
        { x: 0, y: -2.5, z: 0, w: 26, d: 26, weight: 4 },                          // deck crown
        { x: 0, y: -5, z: 0, r: 18, from: -1.6, to: 1.6, axis: 'y', weight: 2 },   // deck rim wall
        { x: 0, y: -1.4, z: 0, r: 11, from: -1.2, to: 1.2, axis: 'y', weight: 2 }, // ziggurat step 1
        { x: 0, y: 1.6, z: 0, r: 8.6, from: -1.2, to: 1.2, axis: 'y' },            // step 2
        { x: 0, y: 4.4, z: 0, r: 6.4, from: -1.1, to: 1.1, axis: 'y' },            // step 3
        { x: 0, y: -9.5, z: 0, r: 11, from: -2, to: 2, axis: 'y', weight: 2 },     // underhull
        { x: FARM_X, y: -2.0, z: FARM_Z, w: 9, d: 7 },                             // tank platform
      ],
    });

    // -------------------------------------------------- processing carousel --
    // Radius 11 at ringY -15: six crusher pods on a plated hoop, spoked to a
    // hub, tucked under the raft so it reads as plant slung beneath the deck.
    const R = 11;
    torus(ringB, 'ringHull', W(GRAPHITE, 0), R, 1.1, 12, 36, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(PALE, 2), R, 0.26, 8, 36, undefined, { y: 0.6, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(PALE, 2), R, 0.26, 8, 36, undefined, { y: -0.6, rx: Math.PI / 2 });

    cyl(ringB, 'ringHull', PALE, 2.4, 2.8, 1.8, 12);
    panelSkin(ringB, 'ringHull', P_PALE, { r: 2.8, from: -0.7, to: 0.7, rows: 2, cols: 12, seed: 4360, t: 0.16, axis: 'y' });
    ribBands(ringB, 'ringHull', DEEP, { r: 2.9, tube: 0.16, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 12 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      truss(ringB, 'ringHull', DEEP, {
        ax: Math.cos(a) * 2.2, ay: 0, az: Math.sin(a) * 2.2,
        bx: Math.cos(a) * (R - 1.1), by: 0, bz: Math.sin(a) * (R - 1.1),
        bays: 4, thickness: 0.24, spread: 0.6,
      });
    }

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a + Math.PI / 2, 0, 0);
      box(ringB, 'ringHull', i % 2 === 0 ? PALE : W(PALE, 1), 4.4, 3.0, 3.4);
      panelSkin(ringB, 'ringHull', P_PALE, { r: 1.7, from: -2.0, to: 2.0, rows: 3, cols: 8, seed: 4370 + i, t: 0.16, axis: 'x' });
      ribBands(ringB, 'ringHull', DEEP, { r: 1.8, tube: 0.16, from: -1.6, to: 1.6, count: 3, axis: 'x', tseg: 12 });
      box(ringB, 'ringHull', W(PALE, 2), 4.6, 0.34, 3.6, { y: 1.6 });
      // Exact box faces, so these fields are seated by construction.
      for (const s of [1, -1]) {
        windowGrid(ringB, 'ringGlow', s > 0 ? LIT : LIT_DIM, {
          rows: 2, cols: 5, rowGap: 0.7, colGap: 0.78,
          w: 0.46, h: 0.4, d: 0.3, x: 0, y: -0.2, z: s * 1.78, axis: 'x',
        });
      }
      box(ringB, 'ringGlaze', ASSAY, 3.2, 0.6, 0.14, { y: 0.9, z: 1.76 });
      for (let j = 0; j < 8; j++) box(ringB, 'ringHull', DEEP, 0.1, 0.66, 0.16, { x: -1.4 + j * 0.4, y: 0.9, z: 1.82 });
      box(ringB, 'ringGlow', LIT, 0.3, 0.3, 0.3, { y: 1.95 });
      // Crusher throat under the pod.
      cyl(ringB, 'ringHull', W(PALE, 3), 1.2, 0.7, 1.4, 10, { y: -2.0 });
      ringB.pop();
    }

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.PI / 48;
      box(ringB, 'ringGlow', LIT_WARM, 0.28, 0.28, 0.22, {
        x: Math.cos(a) * (R + 0.85), y: 0.2, z: Math.sin(a) * (R + 0.85), ry: -a,
      });
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.PI / 36;
      box(ringB, 'ringGlow', LIT_DIM, 0.24, 0.24, 0.2, {
        x: Math.cos(a) * (R - 0.95), y: 0.2, z: Math.sin(a) * (R - 0.95), ry: -a,
      });
    }
  },
};
