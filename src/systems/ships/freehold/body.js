/**
 * Freehold Compact — the BODY PLAN core.
 *
 * Brief: docs/FactionShipDesignBible.md §4.3. Charter: src/game/ship-scale.js.
 *
 * WHY THIS FILE EXISTS.
 *
 * A Freehold body is DONATED HISTORY on a sound frame, not uniform factory
 * production. The Compact builds from hull sections with different yards of
 * origin — panels that belonged to three other ships, now stitched together with
 * visible seam straps — and wraps them in greenhouses, water tanks and external
 * tool racks that say "people live here." Asymmetry is history, not damage.
 *
 * This layer comes first. Motifs in ./motifs.js decorate the body; they cannot
 * make one. A class writes a station list, reads its extents, and only then
 * places equipment. Silhouette before greeble. Switching any of the plating or
 * strap constructs off to meet a vertex budget is prohibited — the faction's
 * surface language IS the patchwork.
 *
 * CONSTRUCTION LANGUAGE.
 * - Spliced hull: two to four donated sections per hull, each a different donor
 *   tone, separated by raised seam straps. The straps are visible welds, not
 *   decoration; they also guarantee the attach audit sees a connected part chain
 *   across what would otherwise be separately-emitted shell segments.
 * - Patch course: plating that cycles through donor tones with a seeded fraction
 *   of "clearly replaced panels" standing extra proud. This is the primary
 *   surface-history cue of the faction.
 * - Donated block: a rounded (generous chamfer) pressure-vessel unit volume with
 *   cream strap bands. Salvaged pressure sections are rounded, not blunt.
 * - Sound frame: the welded box girder that donated sections bolt to. Visible on
 *   the frigate's keel and the freighter's spine.
 * - Glass house: the greenhouse volume — a crew-visible sign of settled life,
 *   with a base flange that sinks into the hull to prove it is built-in.
 * - Tank volume: water and fuel tanks with visible hoops, saddle mounts and a
 *   valve cluster. The saddles are the attachment; the cylinder alone floats.
 *
 * GEOMETRY CONTRACT. Everything emitted through ../loft.js or the station-detail
 * toolkit. Two channels: hull (opaque) and lights (additive near-white). Hull
 * colours from the palette only; no float passed as a weather index. Geometry
 * never reads a colour to decide a position.
 */

import {
  rng, box, cyl, torus, pipeRun, weather,
} from '../../station-detail.js';

import { HUMAN } from '../../../game/ship-scale.js';

import {
  sectionAt, loftExtents, loftHull, loftPlating, loftRib,
} from '../loft.js';

// Re-export the faction-agnostic sweep core so class files have ONE import
// source and need not reach into ../loft.js directly. Same convention as
// ferrous/body.js — one barrel per faction, not one per concern.
export {
  tri,
  quad,
  emitMesh,
  sectionOutline,
  sectionAt,
  loftExtents,
  loftHull,
  loftPlating,
  loftRib,
} from '../loft.js';

// Warm cabin glass — declared locally so glassHouse does not import from
// ./motifs.js. That import would be a cycle because motifs.js imports
// donatedBlock from this file. The value must match GLASS in motifs.js.
const GLASS_HEX = 0xfff2d8;

// ---------------------------------------------------------------------------
// splicedHull
// ---------------------------------------------------------------------------

/**
 * Donated hull sections on a sound frame: the loft is swept in SPLICED sections,
 * each section (the run of bands between two consecutive `seams` z values, or
 * the whole hull when `seams` is empty) assigned one donor tone from `hexes` by
 * index. A raised seam strap stands `strap` proud at every seam z.
 *
 * WHY NOT A SINGLE loftHull CALL. A single call with a cycling palette assigns
 * one colour per station band. On a typical six-station hull that is five bands,
 * and the tonal variation reads as noise, not history. Section-level assignment
 * (whole run of bands sharing one tone) is what makes the hull read as "three
 * yards contributed to this ship." The seam straps are what make the splice read
 * as a physical weld rather than a colour boundary — and they guarantee the
 * attach audit sees a connected chain of overlapping parts, because the strap's
 * two-station loft stands proud of BOTH adjacent sections.
 *
 * Seams outside the station z range are silently ignored; they would produce
 * degenerate one-station sub-lists and emit nothing.
 *
 * The strap colour is `strapHex` when given, otherwise the LAST entry of
 * `hexes`. Class authors put the cream trim (st.trim) last so the strap reads
 * as a structural weld without needing `st` in the body-plan signature.
 */
export function splicedHull(b, ch, hexes, {
  stations,
  seams = [],
  strap = 0.07,
  strapHex = null,
  seg = 0,
  capFore = true,
  capAft = true,
  seed = 1,
}) {
  void seed; // signature parity; hull assignment is by index, not random
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const ext  = loftExtents(stations);

  // Filter seams to the valid interior range and sort ascending.
  const validSeams = [...seams]
    .filter(z => z > ext.z0 && z < ext.z1)
    .sort((a, b) => a - b);

  const strapColor = strapHex !== null ? strapHex : list[list.length - 1];

  // Section boundaries: bow … seam_0 … seam_1 … stern.
  const bounds = [ext.z0, ...validSeams, ext.z1];

  for (let si = 0; si < bounds.length - 1; si++) {
    const zStart = bounds[si];
    const zEnd   = bounds[si + 1];
    const color  = list[si % list.length];

    // Sub-station list: interpolated endpoints plus interior stations.
    // Strict > / < avoids duplicating a station that coincides with a seam;
    // sectionAt already captures it exactly as the endpoint.
    const sub = [sectionAt(stations, zStart)];
    for (const s of stations) {
      if (s.z > zStart && s.z < zEnd) sub.push(s);
    }
    sub.push(sectionAt(stations, zEnd));

    if (sub.length < 2) continue;

    // Only the outermost sections carry the fore/aft caps. Interior section
    // ends are sealed by the seam strap, so caps there would add a buried face.
    loftHull(b, ch, color, {
      stations: sub,
      seg,
      capFore: si === 0 ? capFore : false,
      capAft:  si === bounds.length - 2 ? capAft : false,
    });
  }

  // Seam strap at each valid seam: a short loftRib collar standing `strap`
  // proud, with thickness strap * 0.6 so it reads as a weld bead, not a ring
  // frame. Because loftRib follows the station outline exactly, the strap
  // hugs both adjacent section ends and the bounding boxes overlap both.
  const strapThick = strap * 0.6;
  for (const z of validSeams) {
    loftRib(b, ch, strapColor, { stations, z, seg, out: strap, thick: strapThick });
  }
}
/**
 * Group hexes into hue families for section-coherent color assignment.
 * Each section picks ONE family and uses every member of that family as its
 * local palette. This ensures every emitted hex is verbatim from the caller's
 * list, so it is inside allowedHull by construction and can never stray.
 */
function groupIntoFamilies(hexList) {
  // Index-based grouping: partition the list into consecutive runs.
  // This ensures the pirate bake selects the same indices as the trader bake,
  // so pirate colors are dulled counterparts of the same trader colors.
  const len = hexList.length;
  if (len === 0) return [[]];
  if (len === 1) return [[hexList[0]]];
  
  // Determine family count: roughly 1 family per 2-3 colors, but at least 2
  // This matches the typical clustering produced by the RGB-based version.
  const familyCount = Math.max(2, Math.min(len, Math.ceil(len / 2)));
  
  const families = [];
  const baseFamilySize = len / familyCount;
  
  for (let i = 0; i < familyCount; i++) {
    const start = Math.floor(i * baseFamilySize);
    const end = (i === familyCount - 1) ? len : Math.floor((i + 1) * baseFamilySize);
    families.push(hexList.slice(start, end));
  }
  
  return families;
}
/**
 * A loftPlating course restricted to a Z RANGE of a station list.
 *
 * Plate tones are assigned at SECTION scale, not plate scale. Each longitudinal
 * section gets ONE dominant donor tone from `hexes`, with local variation staying
 * within that tone family using `weather()`. This makes the hull read as donated
 * hull sections spliced onto a sound frame, not as a per-plate rainbow.
 *
 * When `seams` is provided, sections are defined by those boundaries. Otherwise,
 * the course is divided into 2-4 deterministic sections based on the seed and
 * course length. Section lengths vary (not uniform) to read as real bays and
 * structural runs.
 *
 * A seeded `replaced` fraction of station-band segments are emitted a SECOND TIME
 * standing an extra `proud` off the skin in a contrasting tone — the "clearly
 * replaced panel" read. These are kept COUNTABLE: a small number of deliberate
 * inserts against a coherent donor field.
 *
 * BOTH ENDS ARE ALWAYS INTERPOLATED unconditionally with `sectionAt`. The
 * wave-2 armourCourse shipped with an epsilon offset (1e-4) on the interior
 * station collection, so a course whose `from`/`to` landed exactly on a station
 * silently lost the band at that end — full-hull courses emitted nothing on a
 * short two-station body. Removing the epsilon fixes the defect: `sectionAt`
 * returns the station itself when z coincides with one, so the endpoint lands in
 * `sub` once (from the unconditional call) and is excluded from the interior
 * loop (strict > / <), giving no duplicates and no dropped bands.
 */
export function patchCourse(b, ch, hexes, {
  stations,
  from,
  to,
  rows     = 2,
  cols     = 1,
  t        = 0.06,
  inset    = 0.15,
  seed     = 1,
  faces    = null,
  seams    = [],           // Optional: explicit section boundaries
  replaced = 0.18,
  proud    = 0.035,
}) {
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const ext   = loftExtents(stations);
  const startZ = Math.max(ext.z0, from);
  const endZ   = Math.min(ext.z1, to);
  if (startZ >= endZ) return;

  // Interpolate BOTH ends unconditionally. Interior stations use strict > / <
  // with NO epsilon — an epsilon that exceeds the station spacing drops the
  // band adjacent to the clipped end, which is the defect this function corrects.
  const sub = [sectionAt(stations, startZ)];
  for (const s of stations) {
    if (s.z > startZ && s.z < endZ) sub.push(s);
  }
  sub.push(sectionAt(stations, endZ));
  if (sub.length < 2) return;

  const courseLength = endZ - startZ;
  const sectionRnd = rng(seed);

  // Determine section boundaries: either explicit seams or auto-generated.
  // Auto-generated sections are non-uniform lengths to read as real bays.
  let bounds;
  if (seams.length > 0) {
    // Use provided seams, filtered to the course range.
    const validSeams = [...seams]
      .filter(z => z > startZ && z < endZ)
      .sort((a, b) => a - b);
    bounds = validSeams.length > 0 ? [startZ, ...validSeams, endZ] : [startZ, endZ];
  } else {
    // Auto-generate sections with non-uniform lengths.
    // Section count scales with course length, but cap it to avoid over-fragmenting
    // very long courses (which drives vertex count up on large ships like frigate).
    // Scale section count with course length so long hulls get proportional patchwork.
    // A 78-unit freighter needs 6-8 donated sections, not 3. Sections remain
    // substantial (minimum ~3 units for a short course, ~6 units for a long one).
    const minSections = 2;
    const maxSections = Math.min(8, minSections + Math.floor(courseLength / 12));
    const sectionCount = minSections + Math.floor(sectionRnd() * (maxSections - minSections + 1));
    
    bounds = [startZ];
    let accumulated = 0;
    
    for (let i = 0; i < sectionCount - 1; i++) {
      // Vary section length: 0.2 to 0.5 of remaining length, ensuring each section is substantial.
      const remaining = courseLength - accumulated;
      const minSectionLen = courseLength * 0.15;
      const maxSectionLen = remaining * 0.6;
      const sectionLen = minSectionLen + sectionRnd() * (maxSectionLen - minSectionLen);
      
      accumulated += sectionLen;
      bounds.push(startZ + accumulated);
    }
    bounds.push(endZ);
  }

  // Group hexes into hue families for section-coherent assignment.
  // Each section picks ONE family and uses every member of that family as its
  // local palette. This ensures every emitted hex is verbatim from the caller's
  // list, so it is inside allowedHull by construction and can never stray.
  const families = groupIntoFamilies(list);
  
  // Emit each section with its own hue family.
  let previousFamilyIndex = -1;
  for (let si = 0; si < bounds.length - 1; si++) {
    const zStart = bounds[si];
    const zEnd   = bounds[si + 1];

    // Build the station list for this section.
    const sectionStations = [sectionAt(stations, zStart)];
    for (const s of stations) {
      if (s.z > zStart && s.z < zEnd) sectionStations.push(s);
    }
    sectionStations.push(sectionAt(stations, zEnd));

    if (sectionStations.length < 2) continue;

    // Choose ONE hue family for this entire section.
    // Deterministic from seed and section index: same ship, same skin.
    // A seam must always be visible, so a section cannot draw the same family
    // as the section immediately before it.
    let familyIndex = Math.floor(sectionRnd() * families.length);
    if (si > 0 && familyIndex === previousFamilyIndex && families.length > 1) {
      // Force a different family so the seam reads as a tone change.
      familyIndex = (familyIndex + 1 + Math.floor(sectionRnd() * (families.length - 1))) % families.length;
    }
    previousFamilyIndex = familyIndex;
    const familyPalette = families[familyIndex];
    loftPlating(b, ch, familyPalette, {
      stations: sectionStations,
      rows, cols, t, inset,
      seed: (seed * 13 + si * 7) >>> 0, // different seed per section
      faces,
    });
  }
  // Replaced panels: keep COUNTABLE, not random noise.
  // A positive draw emits the same band a second time at t + proud in a
  // CONTRASTING tone (next palette entry), producing a visibly proud replacement
  // plate on the hull. The second emission stands FURTHER out than the first
  // (t + proud > t), so its bounding box fully encloses the first — the attach
  // audit sees an overlap. No second channel is opened; replaced panels are hull
  if (replaced > 0) {
    const rnd = rng((seed * 131 + 0xb731) >>> 0);
    const replacedCount = Math.max(1, Math.floor((sub.length - 1) * replaced * 0.3)); // Cap at ~30% of original
  let emitted = 0;

  for (let i = 0; i < sub.length - 1 && emitted < replacedCount; i++) {
    if (rnd() < replaced) {
      const band      = [sub[i], sub[i + 1]];
      // Use a CONTRASTING tone from the full palette, not just the local family.
      const contrastIndex = (Math.floor(rnd() * (list.length - 1)) + 1) % list.length;
      const contrastTone  = list[contrastIndex];
      loftPlating(b, ch, contrastTone, {
        stations: band,
        rows, cols,
        t:     t + proud,
        inset,
        seed:  (seed * 7 + i * 1337) >>> 0,
        faces,
      });
      emitted++;
    }
  }
}
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

/**
 * The Compact's unit salvage volume — a donated pressure vessel or equipment
 * module strapped to the hull.
 * A two-station loft with a GENEROUS chamfer (default 0.2 vs the Ferrous 0.14):
 * pressure sections accumulate rounding over patch cycles and never look
 * machine-blunt. `straps` cream bands wrapped around the body (loftRib collars
 * standing ~0.04 proud) make it read as cargo strapped in place rather than a
 * structural fitting.
 * WHY loftRib FOR THE STRAPS. Free-standing boxes at the strap positions float
 * when the block is tapered — the box stays axis-aligned while the hull surface
 * angles under it. loftRib follows the exact outline at each z and always hugs
 * the surface, so the strap-to-block overlap is guaranteed regardless of how
 * `taper` is set.
 *
 * trim (st.trim) last to get cream straps without needing `st` in the signature.
 */
export function donatedBlock(b, ch, hexes, {
  w,
  h,
  d,
  c      = 0.2,
  taper  = 1,
  y      = 0,
  straps = 1,
  seed   = 1,
}) {
  void seed;
  const list     = Array.isArray(hexes) ? hexes : [hexes];
  const stations = [
    { z: -d / 2, w: w * taper, h: h * taper, y, c },
    { z:  d / 2, w,            h,             y, c },
  ];
  loftHull(b, ch, list, { stations });

  if (straps > 0) {
    const strapColor = list[list.length - 1];
    // Distribute strap positions evenly in the INTERIOR (never at the caps
    // where they would add a redundant ring at the block ends).
    for (let si = 0; si < straps; si++) {
      const frac = (si + 1) / (straps + 1);
      const z    = -d / 2 + d * frac;
      loftRib(b, ch, strapColor, { stations, z, out: 0.042, thick: 0.058 });
    }
  }
}
// ---------------------------------------------------------------------------

/**
 * The sound structural frame under the Compact's mismatched skins.
 *
 * An open welded box girder running from z = `from` to z = `to`: four
 * longitudinal CHORDS of `chord` square section at the corners (±w, y±h);
 * RING FRAMES every `bay` units with four members each; one DIAGONAL BRACE per
 * bay per face (criss-crossing, alternating direction each bay); and an optional
 * horizontal deck PLATE on the top chords.
 *
 * WHY THE RING MEMBERS SPAN PAST THE CHORD CENTRES. Sizing the horizontal ring
 * members to the clear inner span (chord-to-chord) leaves the brace touching the
 * chord at a tangent corner — the attach audit counts that as floating. Spanning
 * to 2*w + chord means each ring member and its adjacent chords share a face
 * region, not just an edge point, and every brace endpoint falls inside both the
 * ring member and the chord simultaneously.
 *
 * WHY FOUR DIAGONALS PER BAY (not two). The open girder has four faces. Two
 * diagonals (one pair of sides) leaves the top and bottom faces unbraced; the
 * attach audit would see braces touching frame corners at those faces with no
 * overlapping volume. Four diagonals — one per face, criss-crossing — ensures
 * every brace overlaps at least two ring members.
 */
export function soundFrame(b, ch, hex, {
  from,
  to,
  w,
  h,
  y      = 0,
  bay    = 2.2,
  chord  = 0.16,
  brace  = 0.12,
  plate  = 0,
}) {
  const len   = to - from;
  const bays  = Math.max(1, Math.round(len / bay));
  const step  = len / bays;
  const midZ  = (from + to) / 2;

  // Four longitudinal chords — the spine of the girder.
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      box(b, ch, hex, chord, chord, len, { x: sx * w, y: y + sy * h, z: midZ });
    }
  }

  // Ring frames at every bay boundary (bays + 1 rings, inclusive). Each ring
  // has four members sized to overlap the chord cross-sections at the corners.
  // `ringThick` is slightly smaller than chord so the members read as distinct
  // pieces rather than one solid block at the corner.
  const ringThick = chord * 0.84;
  for (let i = 0; i <= bays; i++) {
    const z = from + i * step;
    // Horizontal top and bottom members: 2w + chord wide to reach the outer
    // edge of both corner chords.
    box(b, ch, hex, w * 2 + chord, ringThick, ringThick, { x: 0, y: y + h, z });
    box(b, ch, hex, w * 2 + chord, ringThick, ringThick, { x: 0, y: y - h, z });
    // Vertical port and starboard members: 2h + chord tall.
    for (const sx of [1, -1]) {
      box(b, ch, hex, ringThick, h * 2 + chord, ringThick, { x: sx * w, y, z });
    }
  }

  // Diagonal braces: one per bay per face, alternating direction each bay so
  // adjacent bays read as criss-cross rather than parallel slopes.
  //
  // Side-face diagonals lie in the YZ plane at x = ±w. `rx = atan2(2h, step)
  // * flip` aligns the box's local Z axis with the diagonal that runs from
  // (sx*w, y±h, z0) to (sx*w, y∓h, z1).
  //
  // Top/bottom-face diagonals lie in the XZ plane at y = y±h. `ry = atan2(2w,
  // step) * flip` aligns the local Z axis with the diagonal across the bay.
  for (let i = 0; i < bays; i++) {
    const z0   = from + i * step;
    const zc   = z0 + step / 2;
    const flip = i % 2 === 0 ? 1 : -1;

    const diagYZ = Math.hypot(step, h * 2);
    const angYZ  = Math.atan2(h * 2, step) * flip;
    for (const sx of [1, -1]) {
      box(b, ch, hex, brace, brace, diagYZ, { x: sx * w, y, z: zc, rx: angYZ });
    }

    const diagXZ = Math.hypot(step, w * 2);
    const angXZ  = Math.atan2(w * 2, step) * flip;
    for (const sy of [1, -1]) {
      box(b, ch, hex, brace, brace, diagXZ, { x: 0, y: y + sy * h, z: zc, ry: angXZ });
    }
  }

  // Deck plate on the top chords. Wider than chord-to-chord so its edges
  // overlap the chord tops; slightly longer than `len` so its ends overlap the
  // outermost ring frames. Both overlaps satisfy the attach audit.
  if (plate > 0) {
    box(b, ch, hex, w * 2 + chord * 1.4, plate, len + chord * 1.2,
      { x: 0, y: y + h + plate / 2, z: midZ });
  }
}

// ---------------------------------------------------------------------------
// glassHouse
// ---------------------------------------------------------------------------

/**
 * A greenhouse volume — the Compact's signature of settled life.
 *
 * Emits BOTH channels: a cream (st.trim) frame of corner posts, longitudinal
 * ridge and sill beams, and transverse cross-ribs at each bay boundary; glazed
 * panels (GLASS_HEX, lights channel) filling the wall openings between ribs;
 * a dark soil/planter box (st.hullDark) at the base; and a wide BASE FLANGE
 * that sinks `flangeH` below the caller's y=0 to guarantee the house is
 * geometrically embedded in the hull rather than resting on its surface.
 *
 * WHY THE FLANGE. A greenhouse placed exactly on the hull dorsal touches it at a
 * single tangent face. The attach audit counts tangent contacts as floating
 * parts — there is no overlapping volume to follow. The flange converts the
 * contact to a genuine overlap by sinking into the hull's upper volume, and also
 * gives the structure the visual weight of something built in, not dropped on.
 *
 * The glazed panels are sized so their bounding boxes slightly overlap the sill
 * and ridge beams (panel height = h − planterH + postW × 0.8), ensuring lights-
 * channel parts connect to the hull-channel frame in the attach graph.
 *
 * GLASS_HEX (0xfff2d8) is declared as a local constant here. Importing it from
 * ./motifs.js would create a module cycle because motifs.js imports donatedBlock
 * from this file.
 *
 * `ry` yaws the entire volume so the greenhouse can follow a hull face that is
 * not axis-aligned.
 */
export function glassHouse(b, st, { w, h, d, y = 0, bays = 3, ry = 0, seed = 1 }) {
  void seed;
  const postW   = 0.07;         // post and beam square cross-section
  const flangeH = 0.14;         // depth the base flange sinks into the hull
  const planterH = h * 0.30;   // height of soil/planter zone inside
  const bayStep  = d / bays;

  // Push a frame: y-offset positions the greenhouse base at the hull surface;
  // ry yaws the whole volume. All LOCAL coordinates below have y=0 at the base.
  b.push(0, y, 0, ry);

  // ── BASE FLANGE ──────────────────────────────────────────────────────────
  // Wider and longer than the frame so the corner posts land fully on it.
  // Sinks flangeH into the hull (local y = −flangeH to 0) for the required
  // back-reach past the frame origin.
  box(b, 'hull', st.trim,
    w * 2 + postW * 2, flangeH, d + postW * 2,
    { y: -flangeH / 2 });

  // ── CORNER POSTS ─────────────────────────────────────────────────────────
  // Span from the flange bottom (local y = −flangeH) to the ridge (y = h),
  // so they overlap both the flange and every cross-rib along their length.
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      box(b, 'hull', st.trim,
        postW, h + flangeH, postW,
        { x: sx * w, y: (h - flangeH) / 2, z: sz * d / 2 });
    }
  }

  // ── LONGITUDINAL BEAMS ───────────────────────────────────────────────────
  // Ridge beams at y = h (roof line) and sill beams at y = planterH (glazing
  // floor), one pair per side. Length = d + postW × 2 so they overlap the
  // corner posts at both ends.
  for (const sx of [1, -1]) {
    box(b, 'hull', st.trim, postW, postW, d + postW * 2, { x: sx * w, y: h });
    box(b, 'hull', st.trim, postW, postW, d + postW * 2, { x: sx * w, y: planterH });
  }

  // ── CROSS RIBS ───────────────────────────────────────────────────────────
  // At every bay boundary (bays + 1 positions, inclusive of end walls): a top
  // horizontal beam, a sill horizontal beam, and side verticals bridging the
  // two. All overlap the longitudinal beams at their intersections.
  for (let i = 0; i <= bays; i++) {
    const z = -d / 2 + i * bayStep;
    box(b, 'hull', st.trim, w * 2 + postW, postW, postW, { y: h,       z });
    box(b, 'hull', st.trim, w * 2 + postW, postW, postW, { y: planterH, z });
    for (const sx of [1, -1]) {
      // Side verticals from sill to ridge, inclusive (length = h − planterH + postW
      // overlaps both the sill and ridge beams by postW / 2 each).
      box(b, 'hull', st.trim,
        postW, h - planterH + postW, postW,
        { x: sx * w, y: planterH + (h - planterH) / 2, z });
    }
  }

  // ── GLAZED PANELS (lights channel) ───────────────────────────────────────
  // Panel height = h − planterH + postW × 0.8. This puts the panel bottom
  // at planterH − postW × 0.4 and the top at h + postW × 0.4, overlapping
  // the sill beam and the ridge beam by ~postW × 0.4 each — enough for the
  // attach graph to connect lights-channel parts to the hull frame.
  const glassH  = h - planterH + postW * 0.8;
  const glassYC = (planterH + h) / 2;           // centre of the glazing zone
  const bayD    = bayStep - postW;               // panel depth (leaves rib width)
  const glassT  = 0.024;                         // panel thickness

  for (let i = 0; i < bays; i++) {
    const bz = -d / 2 + (i + 0.5) * bayStep;
    // Side wall panels at x = ±w; centred on the glazing zone in Y.
    for (const sx of [1, -1]) {
      box(b, 'lights', GLASS_HEX, glassT, glassH, bayD, { x: sx * w, y: glassYC, z: bz });
    }
    // Roof panel at y = h, overlapping the ridge beam (centred at y = h, beam
    // half-thickness = postW / 2 > glassT / 2, so they overlap in Y).
    box(b, 'lights', GLASS_HEX, w * 2, glassT, bayD, { y: h, z: bz });
  }

  // ── PLANTER / SOIL BOX ───────────────────────────────────────────────────
  // Dark fill for the soil zone, from y = 0 to planterH. Narrower than the
  // frame (w × 2 − postW, d − postW) so it is clearly INSIDE the structure.
  // It overlaps the corner posts in X, providing a direct connectivity path
  // from this part to the rest of the frame and on to the hull.
  box(b, 'hull', st.hullDark,
    w * 2 - postW, planterH, d - postW,
    { y: planterH / 2 });

  b.pop();
}

// ---------------------------------------------------------------------------
// tankVolume
// ---------------------------------------------------------------------------

/**
 * A water or fuel tank: a hooped cylinder on saddle mounts with a valve cluster
 * and a single near-white telltale lamp.
 *
 * `axis = 'z'` lays the cylinder along the hull; `axis = 'x'` lays it
 * athwartships. The SADDLE MOUNTS reach toward the mounting surface (−Y from the
 * tank centre) and are what make the tank geometrically connected to the hull —
 * the cylinder alone is a floating object. Two saddles at ±30% of the tank
 * length each have a base pad that sinks below local y = 0 (the hull surface in
 * the push frame) and two upright cheeks that overlap both the pad and the
 * cylinder bottom.
 *
 * WHY ONE LAMP ONLY. The additive lamp material carries the faction's amber
 * colour; a lamp on a valve head reads as a pressure indicator, which is the
 * appropriate scale cue. More lamps on a tank read as floodlighting, which is a
 * different motif (floodLamp in motifs.js). One lamp size comes from HUMAN so
 * the lamp scales with the human-module reference, not the tank.
 *
 * `ry` yaws the whole assembly so an athwartship tank can be angled to follow a
 * sloped hull face.
 */
export function tankVolume(b, st, { r, len, y = 0, ry = 0, axis = 'z', hoops = 3, seed = 1 }) {
  void seed;
  const isX = axis === 'x';

  // Push the yaw frame. Local y = 0 is the tank centreline = hull surface in
  // the caller's frame. All child coordinates below are LOCAL to this frame.
  b.push(0, y, 0, ry);

  // ── MAIN CYLINDER ────────────────────────────────────────────────────────
  // CylinderGeometry defaults to Y axis. Rotate rx = π/2 for Z-axis tank,
  // rz = π/2 for X-axis tank.
  const cylRot = isX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 };
  cyl(b, 'hull', st.hull, r, r, len, 14, cylRot);

  // End caps: slightly smaller, shorter cylinders on each end give the
  // pressure-vessel shoulder read. They overlap the main cylinder at their
  // inner face (capLen × 0.35 overlap on each side).
  const capR   = r * 0.90;
  const capLen = r * 0.30;
  const capOlap = capLen * 0.35;
  for (const side of [1, -1]) {
    const capZ = side * (len / 2 + capLen / 2 - capOlap);
    const capOpts = isX ? { ...cylRot, x: capZ } : { ...cylRot, z: capZ };
    cyl(b, 'hull', st.hullDark, capR, capR, capLen, 12, capOpts);
  }

  // ── HOOP STRAPS ──────────────────────────────────────────────────────────
  // Tori distributed in the INTERIOR of the tank (never at the caps). For
  // a Z-axis cylinder the default torus already lies in the XY plane and
  // circles the Z axis. For an X-axis cylinder the torus must be in the YZ
  // plane, achieved by rotating ry = π/2 (maps the default XY ring to YZ).
  const hoopRot   = isX ? { ry: Math.PI / 2 } : {};
  const hoopR     = r + 0.032;
  const hoopTube  = 0.040;
  for (let hi = 0; hi < hoops; hi++) {
    const t    = (hi + 1) / (hoops + 1);
    const hPos = -len / 2 + len * t;
    const hOpt = isX ? { x: hPos } : { z: hPos };
    torus(b, 'hull', st.trim, hoopR, hoopTube, 16, 8, Math.PI * 2,
      { ...hOpt, ...hoopRot });
  }

  // ── SADDLE MOUNTS ────────────────────────────────────────────────────────
  // Two saddles at ±30% of tank length. Each saddle has:
  //   - base pad: wider than the tank (overlap with cylinder bottom) and
  //     extends to local y = padY − padH / 2 (< 0, inside the hull);
  //   - upright cheeks: overlap the pad in Y and the cylinder in X/Z.
  // The saddles are the ONLY back-reach geometry; they must cross local y = 0.
  const padW  = r * 2.6;
  const padH  = 0.20;
  const padD  = 0.24;
  // Centre the pad just below the cylinder bottom so it overlaps the cylinder
  // by 0.05 and extends 0.15 past y = 0 into the hull.
  const padY  = -(r + padH / 2) + 0.05;

  for (const side of [1, -1]) {
    const sPos = side * len * 0.30;
    const sPO  = isX ? { x: sPos } : { z: sPos };

    // Base pad
    box(b, 'hull', st.hull,
      isX ? padD : padW,
      padH,
      isX ? padW : padD,
      { ...sPO, y: padY });

    // Upright cheeks (port and starboard of the saddle)
    const cheekH = (r + padH / 2 - 0.05) * 0.82;
    const cheekY = padY + padH / 2 + cheekH / 2;
    for (const xs of [1, -1]) {
      const ckOff = xs * r * 0.80;
      const ckO   = isX
        ? { x: sPos, z: ckOff, y: cheekY }
        : { z: sPos, x: ckOff, y: cheekY };
      box(b, 'hull', st.hullDark,
        isX ? padD * 0.68 : 0.082,
        cheekH,
        isX ? 0.082 : padD * 0.68,
        ckO);
    }
  }

  // ── VALVE CLUSTER ────────────────────────────────────────────────────────
  // A compact manifold box at the stern end of the tank. Its stern face overlaps
  // the end cap (valveD / 2 > capOlap ensures a margin). A short pipe run
  // branches off it; the telltale lamp sits on the valve head.
  const valveW = r * 0.62;
  const valveH = r * 0.58;
  const valveD = 0.17;
  // Position: slightly overlaps the end cap (capOlap ensures the cap reaches
  // this far along the tank axis).
  const valveZ = len / 2 + valveD / 2 - capOlap + 0.02;
  const valveY = -r * 0.20;

  const vO = isX
    ? { x: valveZ, y: valveY }
    : { z: valveZ, y: valveY };
  box(b, 'hull', st.trim,
    isX ? valveD : valveW,
    valveH,
    isX ? valveW : valveD,
    vO);

  // Short pipe run off the valve side
  const pHalf = valveW / 2;
  const pLen  = r * 0.75;
  const prA   = isX
    ? { ax: valveZ, ay: valveY, az: -pHalf }
    : { ax: -pHalf, ay: valveY, az: valveZ };
  const prB   = isX
    ? { bx: valveZ, by: valveY - pLen * 0.65, bz: -pHalf - pLen * 0.50 }
    : { bx: -pHalf - pLen * 0.50, by: valveY - pLen * 0.65, bz: valveZ };
  pipeRun(b, 'hull', st.hullDark, { ...prA, ...prB, r: 0.030, seg: 5, collars: 1 });

  // ONE near-white telltale lamp on the valve head. Uses HUMAN.lampSize so the
  // indicator scales with the human-module reference, not the tank radius. Every
  // sRGB channel of 0xfffef8 is ≥ 0.6, satisfying the lights-channel rule.
  const ls   = HUMAN.lampSize;
  const lampO = isX
    ? { x: valveZ, y: valveY + valveH / 2 + ls * 0.50, z: 0 }
    : { z: valveZ, y: valveY + valveH / 2 + ls * 0.50, x: 0 };
  box(b, 'lights', 0xfffef8, ls, ls * 0.72, ls, lampO);

  b.pop();
}
