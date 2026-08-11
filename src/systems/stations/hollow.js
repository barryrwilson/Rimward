/**
 * The Hollow — "the Vigil", a deep-rim watch post.
 *
 * No reference art exists for this faction (faction-style.js says so), so the
 * design comes from the lore: three live systems, all quiet, all far out —
 * hollowreach (Hollow Anchorage), hush (Threshold), verge (The Vigil). Their
 * arrival lines are the game's designed silence: "…no traffic on scope", "no
 * echo of a hail. Out here even the quiet has stopped listening." The station is
 * a listening post kept alive by a skeleton crew, older than whoever is aboard
 * now: most of it is shuttered, the lanterns do the talking, and the ears face
 * outward.
 *
 * WHY IT LOOKS LIKE THIS (wave 46, third rewrite — the first three passes
 * failed and the failures are the design notes):
 *   VALUE, NOT DETAIL. hollow's `hull` 0x4a4054 and `hullDark` 0x2c2634 are both
 *   very dark, and hollow systems sit in bands 2-4 where the sun is dim. A sculpt
 *   that plates itself in the dark pair has no value contrast against space and
 *   reads as a lump however much greeble it carries. So `trim` (0x8a7c96) and its
 *   weathered shades are the DOMINANT plate colour here, and the dark pair falls
 *   back to recesses, seams, shutters and mullions — the roles they play in every
 *   other sculpt. Measured trim share of hull vertices: ~60%.
 *   OUTLINE, NOT SURFACE. Legibility at 90u comes from EDGES on the silhouette:
 *   every drum in the stack ends in its own collar step and catwalk ring, and the
 *   mast and dish array stand clear of the mass so their outlines break the
 *   skyline. The station reaches y = 24 so it meets its own beacon at y = 31
 *   instead of floating far below it.
 *   DIM IS NOT DARK. The glow floor is 32,000 vertices, which the concept meets
 *   with MANY SMALL lights rather than bright walls: porthole bands, lantern runs
 *   on every catwalk and berth, hatch and mast status lamps, a memorial plaque
 *   wall. Most wear the dimmest allowed tint (0xe8dcc8); only the two occupied
 *   drums get white windows.
 *
 * TIERS (y ranges step deliberately — that is the silhouette):
 *   root drum      -15.0 … -9.0   broad, plated, berth deck and mooring spurs
 *   mooring spurs  -18.5 … -15.0  hung on plated stems off the root, never loose
 *   stack drum 1    -8.5 … -3.5   r 6.6
 *   stack drum 2    -4.0 …  0.5    r 5.4
 *   stack drum 3     0.0 …  4.5    r 4.4
 *   stack drum 4     4.0 …  8.0    r 3.4
 *   ears             8.0 … 18.0    three dish masts on plated mounts
 *   mast             8.0 … 24.5    spine, platform, beacon lamps
 * RING (`ringY` -19.5, authored in LOCAL space around y = 0): the shrouded ring,
 * an old habitat hoop long since sealed — dark segments, shuttered ports, a few
 * surviving lanterns, plated hub, truss spokes. It interpenetrates the root
 * drum's stems so it reads as structure, not a hoop around a void.
 *
 * SEED: station.js hands `seedForSystem(systemId)`. It varies which two of the
 * four stack drums are occupied, dish aim, lantern and plaque counts, accretion
 * scatter and which mooring spurs exist — dressing only, never the tiers or any
 * pinned number. The three systems read as three different posts.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone,
  ribBands, windowGrid, portholeRing, panelSkin, truss, railing, bridge,
  airlock, pipeRun, antenna, ladder, lampString,
} from '../station-detail.js';

export const hollowStation = {
  ringY: -19.5,
  build(b, ringB, st, seed) {
    const rand = rng((seed ^ 0x4610) >>> 0);
    const W = weather;

    // Palette roles. PALE leads: it is the only value that reads against space
    // out here. DARK is for recesses, seams, shutters and mullions.
    const PALE = st.trim;        // 0x8a7c96 pale mauve-gray — dominant plating
    const MAUVE = st.hull;       // 0x4a4054 dusk mauve — structure in shadow
    const DEEP = st.hullDark;    // 0x2c2634 recesses, shutters, seams
    const ACCENT = st.accent;    // 0x7a6a8a old paint, collars, plaque frames
    const P_PALE = [PALE, PALE, W(PALE, 1), W(PALE, 1), W(ACCENT, 1)];
    const P_WORN = [W(PALE, 1), W(PALE, 2), W(ACCENT, 1), W(MAUVE, 1)];
    const P_DECK = [W(PALE, 1), W(ACCENT, 1), W(PALE, 2), W(MAUVE, 2)];

    // Near-neutral glow tints — update() multiplies these by the faction's cold
    // mauve pulse, so a saturated tint here would square the hue.
    const LIT = 0xffffff;        // the two occupied drums
    const LAMP = 0xfff2e2;       // berth and catwalk lanterns
    const DIM = 0xe8dcc8;        // everything else: portholes, plaques, hatches
    const GLASS = 0x4a4258;      // dulled mauve observation glass, behind mullions

    // Flat fields on a faceted drum must be SUNK so their edges touch the hull:
    // a `seg`-sided cylinder's flats sit at r * cos(PI / seg).
    const flat = (r, seg) => r * Math.cos(Math.PI / seg);
    const sink = (r, seg, halfExtent) => Math.sqrt(Math.max(0.01, flat(r, seg) ** 2 - halfExtent ** 2));

    // ------------------------------------------------------------ tier 0: root
    const ROOT_R = 8.5;
    const ROOT_Y = -12;
    cyl(b, 'hull', PALE, ROOT_R, ROOT_R * 1.02, 6, 24, { y: ROOT_Y });
    panelSkin(b, 'hull', P_PALE, { r: ROOT_R, from: ROOT_Y - 2.6, to: ROOT_Y + 2.6, rows: 4, cols: 26, seed: seed + 1, t: 0.22, axis: 'y' });
    ribBands(b, 'hull', DEEP, { r: ROOT_R + 0.16, tube: 0.22, from: ROOT_Y - 2.2, to: ROOT_Y + 2.2, count: 4, axis: 'y', tseg: 24 });
    hemi(b, 'hull', W(PALE, 1), ROOT_R * 0.94, 24, 10, { y: ROOT_Y - 3, rx: Math.PI });
    // Accretion: decades of dust and ice, plates standing a little off the skin.
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2;
      const y = ROOT_Y - 2.4 + rand() * 4.8;
      const r = ROOT_R + 0.28;
      box(b, 'hull', [W(PALE, 2), W(MAUVE, 1), W(PALE, 3)][i % 3],
        1.4 + rand() * 1.6, 0.9 + rand() * 1.2, 0.22,
        { x: Math.cos(a) * r, y, z: Math.sin(a) * r, ry: -a });
    }
    // Berth deck: the one place the crew still works, so the one place lit.
    const DECK_Y = ROOT_Y + 3.4;
    cyl(b, 'hull', W(PALE, 1), ROOT_R + 2.4, ROOT_R + 2.4, 0.5, 24, { y: DECK_Y });
    panelSkin(b, 'hull', P_DECK, { r: ROOT_R + 2.4, from: DECK_Y - 0.24, to: DECK_Y + 0.24, rows: 1, cols: 22, seed: seed + 2, t: 0.14, axis: 'y' });
    torus(b, 'hull', DEEP, ROOT_R + 2.5, 0.18, 6, 28, undefined, { y: DECK_Y + 0.3, rx: Math.PI / 2 });
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2;
      const a1 = ((i + 1) / 8) * Math.PI * 2;
      const r = ROOT_R + 2.2;
      railing(b, 'hull', DEEP, {
        ax: Math.cos(a0) * r, ay: DECK_Y + 0.3, az: Math.sin(a0) * r,
        bx: Math.cos(a1) * r, by: DECK_Y + 0.3, bz: Math.sin(a1) * r,
        height: 0.75, posts: 4, rail: 0.07,
      });
      lampString(b, 'glow', LAMP, {
        ax: Math.cos(a0) * r, ay: DECK_Y + 1.0, az: Math.sin(a0) * r,
        bx: Math.cos(a1) * r, by: DECK_Y + 1.0, bz: Math.sin(a1) * r,
        count: 6, size: 0.26,
      });
    }
    portholeRing(b, 'glow', DIM, { r: ROOT_R + 0.12, count: 26, size: 0.34, y: ROOT_Y + 1.2 });
    portholeRing(b, 'glow', DIM, { r: ROOT_R + 0.12, count: 26, size: 0.3, y: ROOT_Y - 1.4 });
    // Chapel window: the station's one piece of glass worth the name.
    for (let i = 0; i < 5; i++) {
      const a = -0.34 + i * 0.17;
      const r = ROOT_R + 0.1;
      box(b, 'hull', DEEP, 0.22, 3.0, 0.3, { x: Math.cos(a) * r, y: ROOT_Y + 0.6, z: Math.sin(a) * r, ry: -a });
      box(b, 'glaze', GLASS, 0.66, 2.6, 0.14, { x: Math.cos(a + 0.085) * r, y: ROOT_Y + 0.6, z: Math.sin(a + 0.085) * r, ry: -a });
    }

    // ------------------------------------------------- tier 0b: mooring spurs
    // Hung on plated stems off the root drum. The wave-46 bring-up left these
    // floating as a 12-cell island; the stems ARE the fix, so they stay.
    const SPURS = [0, 1, 2, 3].filter((i) => i < 2 || rand() > 0.35);
    for (const i of SPURS) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      const tipY = -17.4;
      // Stem: root belly down to the spur, with a real load path.
      cyl(b, 'hull', W(PALE, 1), 0.85, 0.85, 5.6, 12, { x: cx * (ROOT_R - 1.2), y: ROOT_Y - 4.2, z: cz * (ROOT_R - 1.2) });
      truss(b, 'hull', W(PALE, 2), {
        ax: cx * (ROOT_R - 2.6), ay: ROOT_Y - 2.6, az: cz * (ROOT_R - 2.6),
        bx: cx * (ROOT_R + 1.4), by: tipY + 0.6, bz: cz * (ROOT_R + 1.4),
        thickness: 0.2, bays: 4, spread: 0.7,
      });
      airlock(b, 'hull', W(PALE, 1), DEEP, {
        ax: cx * (ROOT_R - 1.2), ay: ROOT_Y - 2.2, az: cz * (ROOT_R - 1.2),
        bx: cx * (ROOT_R - 1.2), by: tipY + 1.4, bz: cz * (ROOT_R - 1.2), r: 1.05, seg: 12, rings: 2,
      });
      // The spur head: a mooring cradle with its lantern.
      b.push(cx * (ROOT_R + 0.6), tipY, cz * (ROOT_R + 0.6), -a, 0, 0);
      box(b, 'hull', W(PALE, 1), 3.6, 1.1, 2.4);
      panelSkin(b, 'hull', P_WORN, { r: 1.6, from: -1.6, to: 1.6, rows: 2, cols: 8, seed: seed + 20 + i, t: 0.14, axis: 'x' });
      for (const jaw of [-1, 1]) {
        box(b, 'hull', DEEP, 0.5, 2.0, 0.6, { x: 1.2, y: 1.2, z: jaw * 0.9 });
        box(b, 'glow', DIM, 0.22, 0.22, 0.22, { x: 1.2, y: 2.1, z: jaw * 0.9 });
      }
      box(b, 'hull', DEEP, 0.6, 0.6, 0.6, { y: 1.0, z: 0 });
      box(b, 'glow', LAMP, 0.42, 0.42, 0.42, { y: 1.5 });
      lampString(b, 'glow', DIM, { ax: -1.5, ay: 0.7, az: 0, bx: 1.5, by: 0.7, bz: 0, count: 4, size: 0.2 });
      b.pop();
      pipeRun(b, 'hull', W(PALE, 2), {
        ax: cx * (ROOT_R - 2.0), ay: ROOT_Y - 1.6, az: cz * (ROOT_R - 2.0),
        bx: cx * (ROOT_R + 0.4), by: tipY + 0.8, bz: cz * (ROOT_R + 0.4), r: 0.16, seg: 8, collars: 3,
      });
    }

    // ------------------------------------------------------- tier 1: the stack
    // Four drums of decreasing radius, INTERPENETRATING (each starts below the
    // previous one's crown), every junction wearing a collar step and a catwalk
    // ring so the silhouette steps instead of merging.
    const DRUMS = [
      { r: 6.6, y: -6.0, h: 5.0, seg: 22 },
      { r: 5.4, y: -1.8, h: 4.6, seg: 20 },
      { r: 4.4, y: 2.2, h: 4.4, seg: 18 },
      { r: 3.4, y: 6.0, h: 4.0, seg: 16 },
    ];
    // Which two drums are occupied. Everything else is shuttered.
    const litA = Math.floor(rand() * 4);
    let litB = Math.floor(rand() * 4);
    if (litB === litA) litB = (litA + 1 + Math.floor(rand() * 3)) % 4;
    DRUMS.forEach((d, i) => {
      const lit = i === litA || i === litB;
      cyl(b, 'hull', lit ? PALE : W(PALE, 1), d.r, d.r * 1.03, d.h, d.seg, { y: d.y });
      panelSkin(b, 'hull', lit ? P_PALE : P_WORN, {
        r: d.r, from: d.y - d.h / 2 + 0.5, to: d.y + d.h / 2 - 0.5,
        rows: 4, cols: 18, seed: seed + 40 + i, t: 0.2, axis: 'y',
      });
      ribBands(b, 'hull', DEEP, { r: d.r + 0.14, tube: 0.18, from: d.y - d.h / 2 + 0.8, to: d.y + d.h / 2 - 0.8, count: 3, axis: 'y', tseg: d.seg });
      // Crown: a collar step plus a catwalk ring. This is the silhouette edge.
      const crownY = d.y + d.h / 2;
      cyl(b, 'hull', W(PALE, 1), d.r + 0.45, d.r + 0.3, 0.7, d.seg, { y: crownY });
      panelSkin(b, 'hull', P_DECK, { r: d.r + 0.45, from: crownY - 0.3, to: crownY + 0.3, rows: 1, cols: 14, seed: seed + 60 + i, t: 0.12, axis: 'y' });
      torus(b, 'hull', DEEP, d.r + 0.9, 0.16, 6, d.seg + 4, undefined, { y: crownY + 0.5, rx: Math.PI / 2 });
      for (let k = 0; k < 6; k++) {
        const a0 = (k / 6) * Math.PI * 2;
        const a1 = ((k + 1) / 6) * Math.PI * 2;
        railing(b, 'hull', DEEP, {
          ax: Math.cos(a0) * (d.r + 0.9), ay: crownY + 0.5, az: Math.sin(a0) * (d.r + 0.9),
          bx: Math.cos(a1) * (d.r + 0.9), by: crownY + 0.5, bz: Math.sin(a1) * (d.r + 0.9),
          height: 0.6, posts: 3, rail: 0.06,
        });
      }
      lampString(b, 'glow', LAMP, {
        ax: -(d.r + 0.9), ay: crownY + 0.9, az: 0, bx: d.r + 0.9, by: crownY + 0.9, bz: 0, count: 7, size: 0.22,
      });
      lampString(b, 'glow', LAMP, {
        ax: 0, ay: crownY + 0.9, az: -(d.r + 0.9), bx: 0, by: crownY + 0.9, bz: d.r + 0.9, count: 7, size: 0.22,
      });
      // Windows: sparse and small on the two occupied drums, shutters elsewhere.
      // Four faces, each a 2-row field SUNK so its edges meet the hull.
      const halfH = 0.55;
      const zSink = sink(d.r, d.seg, 1.6);
      for (let f = 0; f < 4; f++) {
        const yaw = (f / 4) * Math.PI * 2;
        b.push(0, d.y, 0, yaw, 0, 0);
        if (lit) {
          windowGrid(b, 'glow', f % 2 === 0 ? LIT : DIM, {
            rows: 2, cols: 8, rowGap: 1.0, colGap: 0.42, w: 0.3, h: halfH, d: 0.2,
            x: 0, y: 0.2, z: zSink, axis: 'x',
          });
          box(b, 'hull', DEEP, 4.0, 0.16, 0.24, { y: 0.9, z: zSink });
          box(b, 'hull', DEEP, 4.0, 0.16, 0.24, { y: -0.5, z: zSink });
          box(b, 'hull', DEEP, 0.9, 1.5, 0.28, { x: 0, y: 1.9, z: zSink });
          box(b, 'glaze', GLASS, 0.7, 1.2, 0.14, { x: 0, y: 1.9, z: zSink + 0.08 });
        } else {
          // Shuttered: the window bays are there, closed over in dark plate.
          for (let s = 0; s < 5; s++) {
            box(b, 'hull', DEEP, 0.52, 0.8, 0.2, { x: -1.4 + s * 0.7, y: 0.2, z: zSink });
          }
          box(b, 'hull', W(MAUVE, 1), 4.0, 0.2, 0.22, { y: 0.9, z: zSink });
        }
        b.pop();
      }
      portholeRing(b, 'glow', DIM, { r: d.r + 0.1, count: 16, size: 0.26, y: d.y - d.h / 2 + 1.0 });
      // Ladders and an airlock throat down to the drum below.
      ladder(b, 'hull', DEEP, { x: d.r * 0.72, y: d.y - d.h / 2, z: d.r * 0.72, h: d.h, w: 0.5, rungs: 5, ry: Math.PI / 4 });
      const below = i === 0 ? ROOT_Y + 3 : DRUMS[i - 1].y + DRUMS[i - 1].h / 2;
      airlock(b, 'hull', W(PALE, 1), DEEP, {
        ax: d.r * 0.5, ay: d.y - d.h / 2 + 0.3, az: 0,
        bx: d.r * 0.5, by: below - 0.4, bz: 0, r: 0.9, seg: 10, rings: 2,
      });
    });

    // ---------------------------------------------------------- tier 2: ears
    // Three big dishes on plated mounts, standing clear of the stack so their
    // outline breaks the skyline. They aim OUTWARD — that is what this is for.
    const EAR_Y = 8.2;
    const dishAim = 0.3 + rand() * 0.5;
    for (let d = 0; d < 3; d++) {
      const a = (d / 3) * Math.PI * 2 + dishAim;
      const mx = Math.cos(a) * 5.6;
      const mz = Math.sin(a) * 5.6;
      // Mount: a plated drum on a braced arm off the stack.
      cyl(b, 'hull', PALE, 1.5, 1.7, 3.2, 12, { x: mx, y: EAR_Y, z: mz });
      panelSkin(b, 'hull', P_PALE, { r: 1.5, from: EAR_Y - 1.4, to: EAR_Y + 1.4, rows: 3, cols: 10, seed: seed + 80 + d, t: 0.14, axis: 'y' });
      truss(b, 'hull', W(PALE, 2), {
        ax: Math.cos(a) * 2.6, ay: EAR_Y - 1.6, az: Math.sin(a) * 2.6,
        bx: mx, by: EAR_Y - 0.6, bz: mz, thickness: 0.16, bays: 3, spread: 0.5,
      });
      pipeRun(b, 'hull', W(PALE, 1), {
        ax: Math.cos(a) * 3.0, ay: EAR_Y - 2.2, az: Math.sin(a) * 3.0,
        bx: mx, by: EAR_Y - 1.2, bz: mz, r: 0.14, seg: 8, collars: 2,
      });
      // The dish itself, canted outward on a yoke.
      const dishY = EAR_Y + 3.6;
      cyl(b, 'hull', DEEP, 0.28, 0.28, 2.6, 8, { x: mx, y: dishY, z: mz });
      b.push(mx, dishY + 1.9, mz, -a, 0, 0);
      torus(b, 'hull', W(PALE, 1), 2.3, 0.2, 6, 20, undefined, { rz: Math.PI / 2 });
      for (let k = 0; k < 3; k++) {
        const ka = (k / 3) * Math.PI * 2;
        box(b, 'hull', W(PALE, 2), 0.16, 2.2, 0.16, { y: Math.cos(ka) * 1.1, z: Math.sin(ka) * 1.1, rx: 0.5 });
      }
      hemi(b, 'hull', W(PALE, 1), 2.2, 18, 8, { rx: -Math.PI / 2 + 0.35 });
      hemi(b, 'hull', DEEP, 2.0, 18, 8, { rx: -Math.PI / 2 + 0.35, y: 0.18 });
      cone(b, 'hull', DEEP, 0.24, 1.6, 6, { rx: -Math.PI / 2 + 0.35, y: 0.9 });
      box(b, 'glow', DIM, 0.24, 0.24, 0.24, { y: 1.5 });
      b.pop();
      portholeRing(b, 'glow', DIM, { r: 1.62, count: 8, size: 0.2, y: EAR_Y + 0.6 });
      box(b, 'hull', DEEP, 0.34, 0.34, 0.34, { x: mx, y: EAR_Y + 1.8, z: mz });
      box(b, 'glow', LAMP, 0.24, 0.24, 0.24, { x: mx, y: EAR_Y + 2.1, z: mz });
      // Sensor bank bedded against the mount.
      cyl(b, 'hull', W(PALE, 1), 1.0, 1.0, 1.8, 10, { x: mx * 0.7, y: EAR_Y - 0.4, z: mz * 0.7 });
      portholeRing(b, 'glow', DIM, { r: 1.06, count: 8, size: 0.18, y: EAR_Y - 0.4 });
    }

    // ---------------------------------------------------------- tier 3: mast
    // The spine to the beacon. A 16-unit cylinder centred at 16 spans 8 to 24,
    // so the mass meets the stationRecord beacon at y = 31 instead of sitting
    // ten units under it (the wave-46 round-2 regression).
    cyl(b, 'hull', PALE, 0.6, 0.9, 16, 12, { y: 16 });
    panelSkin(b, 'hull', P_PALE, { r: 0.8, from: 9, to: 23, rows: 8, cols: 8, seed: seed + 100, t: 0.12, axis: 'y' });
    ribBands(b, 'hull', DEEP, { r: 0.95, tube: 0.12, from: 9.5, to: 22.5, count: 7, axis: 'y', tseg: 12 });
    lampString(b, 'glow', DIM, { ax: 1.0, ay: 9.5, az: 0, bx: 1.0, by: 22.5, bz: 0, count: 9, size: 0.22 });
    lampString(b, 'glow', DIM, { ax: -1.0, ay: 9.5, az: 0, bx: -1.0, by: 22.5, bz: 0, count: 9, size: 0.22 });
    // Platform partway up, and the beacon crown.
    cyl(b, 'hull', W(PALE, 1), 2.6, 2.8, 0.4, 16, { y: 15.5 });
    torus(b, 'hull', DEEP, 2.7, 0.14, 6, 18, undefined, { y: 15.8, rx: Math.PI / 2 });
    portholeRing(b, 'glow', LAMP, { r: 2.75, count: 12, size: 0.22, y: 15.5 });
    cyl(b, 'hull', W(PALE, 1), 1.5, 1.7, 1.6, 14, { y: 22.6 });
    panelSkin(b, 'hull', P_DECK, { r: 1.5, from: 22.0, to: 23.2, rows: 1, cols: 10, seed: seed + 101, t: 0.1, axis: 'y' });
    portholeRing(b, 'glow', LAMP, { r: 1.6, count: 10, size: 0.24, y: 22.6 });
    hemi(b, 'hull', W(PALE, 2), 1.4, 14, 8, { y: 23.4 });
    for (let t = 0; t < 4; t++) {
      const ta = (t / 4) * Math.PI * 2;
      antenna(b, 'hull', DEEP, W(PALE, 1), { x: Math.cos(ta) * 1.0, y: 23.4, z: Math.sin(ta) * 1.0, h: 1.4, r: 0.09, tip: 0.22 });
      box(b, 'glow', LAMP, 0.22, 0.22, 0.22, { x: Math.cos(ta) * 1.0, y: 24.3, z: Math.sin(ta) * 1.0 });
    }

    // ------------------------------------------------------- tier 3: lanterns
    // The memorial wall by the main airlock: one plaque per name, each with its
    // own small light. This is the station's voice.
    const plaques = 30 + Math.floor(rand() * 8);
    b.push(ROOT_R + 0.4, ROOT_Y + 2.2, 0, Math.PI / 2, 0, 0);
    box(b, 'hull', W(PALE, 1), 6.0, 3.2, 0.4);
    panelSkin(b, 'hull', P_WORN, { r: 0.4, from: -2.8, to: 2.8, rows: 2, cols: 8, seed: seed + 110, t: 0.1, axis: 'x' });
    torus(b, 'hull', ACCENT, 3.1, 0.12, 6, 16, undefined, { rz: Math.PI / 2, ry: Math.PI / 2 });
    for (let p = 0; p < plaques; p++) {
      const col = p % 6;
      const row = Math.floor(p / 6);
      box(b, 'hull', DEEP, 0.6, 0.36, 0.22, { x: -2.4 + col * 0.96, y: 1.2 - row * 0.5, z: 0.3 });
      box(b, 'glow', DIM, 0.2, 0.14, 0.1, { x: -2.4 + col * 0.96, y: 1.0 - row * 0.5, z: 0.42 });
    }
    b.pop();
    // Hatches and their lamps, scattered over the whole mass.
    for (let i = 0; i < 34; i++) {
      const a = rand() * Math.PI * 2;
      const y = -14 + rand() * 20;
      const r = y < -8.6 ? ROOT_R + 0.3 : y < -3.4 ? 6.9 : y < 0.6 ? 5.7 : y < 4.6 ? 4.7 : 3.7;
      const hx = Math.cos(a) * r;
      const hz = Math.sin(a) * r;
      box(b, 'hull', [W(PALE, 2), W(MAUVE, 1), W(PALE, 1)][i % 3], 0.8, 0.8, 0.34, { x: hx, y, z: hz, ry: -a });
      box(b, 'glow', DIM, 0.22, 0.22, 0.16, { x: hx * 1.03, y: y + 0.6, z: hz * 1.03 });
    }
    // Catwalk lamp rings around the root drum, marking the walkable belt.
    for (let ring = 0; ring < 3; ring++) {
      const y = ROOT_Y - 1.6 + ring * 1.8;
      portholeRing(b, 'glow', DIM, { r: ROOT_R + 0.5, count: 22, size: 0.22, y });
    }
    // A bridge from the berth deck up to the first stack drum's catwalk.
    bridge(b, 'hull', W(PALE, 1), DEEP, {
      ax: ROOT_R + 1.2, ay: DECK_Y + 0.4, az: 0,
      bx: 6.6, by: -3.2, bz: 0, w: 1.6, railH: 0.7, posts: 5,
    });
    bridge(b, 'hull', W(PALE, 1), DEEP, {
      ax: -(ROOT_R + 1.2), ay: DECK_Y + 0.4, az: 0,
      bx: -6.6, by: -3.2, bz: 0, w: 1.6, railH: 0.7, posts: 5,
    });

    // ------------------------------------------------------- ring: the shroud
    // An old habitat hoop, long since sealed. Authored in LOCAL space around
    // y = 0 — station.js offsets the whole group to ringY. Getting this wrong
    // is what put the first build's ring at world y -30.
    const RING_R = 11;
    torus(ringB, 'ringHull', W(PALE, 1), RING_R, 1.15, 10, 34, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DEEP, RING_R, 0.3, 6, 34, undefined, { y: 0.95, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DEEP, RING_R, 0.3, 6, 34, undefined, { y: -0.95, rx: Math.PI / 2 });
    // Plated hub and spokes — the ring hangs on structure, not on nothing.
    cyl(ringB, 'ringHull', PALE, 2.6, 3.0, 2.6, 16);
    panelSkin(ringB, 'ringHull', P_PALE, { r: 3.0, from: -1.1, to: 1.1, rows: 2, cols: 12, seed: seed + 120, t: 0.14, axis: 'y' });
    ribBands(ringB, 'ringHull', DEEP, { r: 3.1, tube: 0.16, from: -0.9, to: 0.9, count: 2, axis: 'y', tseg: 16 });
    portholeRing(ringB, 'ringGlow', DIM, { r: 3.12, count: 10, size: 0.24 });
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      truss(ringB, 'ringHull', W(PALE, 2), {
        ax: Math.cos(a) * 2.8, ay: 0, az: Math.sin(a) * 2.8,
        bx: Math.cos(a) * (RING_R - 0.8), by: 0, bz: Math.sin(a) * (RING_R - 0.8),
        thickness: 0.2, bays: 4, spread: 0.55,
      });
    }
    // Sealed segments: shuttered ports, a handful of surviving lanterns.
    const alive = 4 + Math.floor(rand() * 4);
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      ringB.push(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R, -a, 0, 0);
      box(ringB, 'ringHull', s % 3 === 0 ? W(PALE, 1) : W(MAUVE, 1), 2.0, 2.2, 4.2);
      panelSkin(ringB, 'ringHull', P_WORN, { r: 1.1, from: -1.9, to: 1.9, rows: 2, cols: 6, seed: seed + 130 + s, t: 0.12, axis: 'z' });
      // Shutters where the ports were.
      for (let k = 0; k < 3; k++) {
        box(ringB, 'ringHull', DEEP, 0.24, 0.7, 0.9, { x: 1.05, y: 0.2, z: -1.2 + k * 1.2 });
      }
      if (s < alive) {
        box(ringB, 'ringHull', DEEP, 0.4, 0.4, 0.4, { x: 1.15, y: 0.9, z: 0 });
        box(ringB, 'ringGlow', LAMP, 0.3, 0.3, 0.3, { x: 1.3, y: 0.9, z: 0 });
        box(ringB, 'ringGlaze', GLASS, 0.14, 0.6, 0.8, { x: 1.12, y: -0.3, z: 0 });
      }
      ringB.pop();
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.PI / 24;
      box(ringB, 'ringGlow', DIM, 0.26, 0.26, 0.22, { x: Math.cos(a) * (RING_R + 1.3), z: Math.sin(a) * (RING_R + 1.3), ry: -a });
    }
    // Stems reaching up toward the root drum's belly, so the ring reads as held.
    for (let s = 0; s < 3; s++) {
      const a = (s / 3) * Math.PI * 2 + 0.6;
      pipeRun(ringB, 'ringHull', W(PALE, 2), {
        ax: Math.cos(a) * 2.4, ay: 1.0, az: Math.sin(a) * 2.4,
        bx: Math.cos(a) * 5.4, by: 3.0, bz: Math.sin(a) * 5.4, r: 0.2, seg: 8, collars: 3,
      });
    }
  },
};
