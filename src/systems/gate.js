import * as THREE from 'three';
import { SYSTEMS, JUMP } from '../game/state.js';
import { styleFor } from '../game/faction-style.js'; // wave 37: faction gate tinting
import {
  ORGANIC,
  isBeautiful,
  makePetalGeometry,
  makeTendrilGeometry,
  makeOrganicGlowTexture,
  organicMaterials,
  tagSway,
  tagPulse,
  collectOrganic,
  animateOrganic,
} from './organic.js';

/**
 * Jump gates — the Lamplighter Guild transit rings of the current system's
 * gate NETWORK. One ring assembly per entry in SYSTEMS[system].gates.
 *
 * Visual: each gate is a ~30u-radius rotating torus ring with inner chevron
 * markers, an additive amber/brass glow (Lamplighter palette: worn brass,
 * lamplight amber), and a pulsing beacon. Oriented so the ring faces the
 * system center. Distinct silhouette from 500+u. Hub junctions add the
 * "Lamplighter lantern" silhouette on top of the same ring: a slowly
 * counter-rotating hexagonal brass outer frame (~1.35× ring radius, faint
 * amber emissive; frozen under reducedMotion) and one slender brass arm
 * per hub route, evenly spaced in the ring plane, each tipped with an
 * amber lamp sprite — the selected route's lamp burns visibly brighter
 * and larger, tracking the live routeIndex (KeyG cycling) each frame.
 * Junction groups are named 'lamplighter-junction' (standard gates
 * 'lamplighter-gate') and mirror the selection onto
 * group.userData.routeIndex (userData.routeCount set at build).
 *
 * Beautiful Ones overgrowth (wave-27): the Beautiful don't build gates,
 * they cultivate them. In systems whose faction is 'beautiful'
 * (isBeautiful), every ring assembly — gates and junction alike — keeps
 * its Lamplighter brass but is GROWN OVER: a 'beautiful-overgrowth'
 * subgroup adds living tendrils hugging the torus tube, membrane petals
 * cocooning alternate chevrons, four pulsing mint bud-lantern sprites
 * ('beautiful-bud'), and gilt vine rings circling the main ring; the
 * glow/beacon sprites and the charge tunnel shift from amber to mint
 * (0x7fe0a8). Overgrowth geometries and the mint glow texture are
 * lazy-cached shared resources (the ringGeo pattern — never disposed);
 * only the per-assembly bud SpriteMaterials join the rebuild() disposal
 * path. Parts sway/pulse via collectOrganic/animateOrganic each frame
 * (zero-alloc, complete no-op under reducedMotion — stashed bases stay,
 * everything freezes). Non-beautiful systems are byte-identical.
 *
 * Faction overlays (wave 38): systems flying a sculpted faction add a
 * '<faction>-overlay' subgroup over the brass base (shared unit-primitive
 * geometries, per-assembly materials, in-place blink/spin animations).
 *
 * Ownership: writes ctx.gate.inZone, nearTo, nearHub, nearRouteIndex and
 * nearRouteCount only (jumping/progress/destination are jump.js's). The
 * zone check runs per gate — nearest in-range gate wins: inZone = true and
 * nearTo = that gate's destination id; out of all zones, inZone = false,
 * nearTo = null, nearHub = false, nearRouteIndex = -1, nearRouteCount = 0.
 * When SYSTEMS[system].hub exists, one extra junction assembly is built at
 * hub.position carrying hub.routes; while it is the nearest zone (nearHub
 * = true) KeyG cycles the selected route (wrapping, authored order) and
 * `to`/nearTo track the selection. Emits 'jumpRequested' { to } with the
 * near gate's destination when
 * the player presses dock (D) inside JUMP.zone while undocked and not
 * already jumping. Reads ctx.input.dockPressed, ctx.flags.docked,
 * ctx.ship.object — never writes them. On 'systemLoaded' (seen via
 * ctx.lastEvents) all gate assemblies rebuild for the new current system.
 *
 * Jump visual (driven by jump.js's ctx.gate fields): a full-screen black
 * fade — in over the first 40% of progress, out over the last 40% — plus a
 * centered 'JUMP' label naming the destination. The overlay div is created
 * once at init and hidden otherwise. Only the departing gate (the one whose
 * `to` matches ctx.gate.destination) intensifies its glow during charge.
 * Wave-6 polish: the departing gate also swirls a preallocated particle
 * ring (~200 THREE.Points, per-assembly buffers rebuilt with the assembly)
 * around the bore, radius/opacity scaling with ctx.gate.progress — the
 * charge tunnel. Suppressed entirely under ctx.settings.reducedMotion (the
 * fade/label overlay remains, unchanged).
 *
 * update() performs zero allocations: gate assemblies are preallocated on
 * rebuild and iterated by index; overlay style/text are only touched on
 * state changes; the swirl mutates its position buffer in place; junction
 * hex frame/arms/lamps are preallocated with the assembly and update()
 * only mutates frame rotation, lamp scale/opacity, and userData scalars.
 */

// Lamplighter palette (§16): worn brass structure, lamplight amber glow.
const BRASS = 0x8a6a34;
const BRASS_DARK = 0x5a4422;
const AMBER = 0xffb84d;
const AMBER_HOT = 0xffd890;

const RING_RADIUS = 30;
const RING_TUBE = 2.2;
const CHEVRON_COUNT = 8;
const SPIN_SPEED = 0.25; // rad/s, slow

// Charge tunnel (wave-6): preallocated particle ring swirling in the bore
// plane of the departing gate while ctx.gate.jumping.
const TUNNEL_COUNT = 200;
const TUNNEL_DEPTH = 24; // tunnel length along the bore axis (local Z)
const TUNNEL_SIZE = 1.7; // point size

// Junction lantern silhouette (wave-22): a hexagonal brass outer frame
// counter-rotating against the ring, plus one slender brass arm per hub
// route tipped with an amber lamp. All preallocated at build time.
const HEX_RADIUS = RING_RADIUS * 1.35;
const HEX_BAR_THICK = 1.4;
const HEX_SPIN_SPEED = -SPIN_SPEED * 0.4; // counter-rotates the ring spin
const ARM_THICK = 0.7;
const LAMP_BASE_SCALE = 6;
const LAMP_SELECTED_SCALE = 9.5;
const LAMP_BASE_OPACITY = 0.45;
const LAMP_SELECTED_OPACITY = 1;

// Faction gate overlays (wave 38): systems flying these factions dress the
// Lamplighter brass ring with a '<faction>-overlay' subgroup (plan Phase 4).
// Beautiful keeps its wave-27 overgrowth; independent/hollow/unknown stay
// plain brass (byte-identical).
const OVERLAY_FACTIONS = new Set(['veridian', 'ferrous', 'freehold', 'redledger', 'gilded', 'congregation', 'assembly', 'lamplighter']);

/** Additive radial-gradient sprite texture for the gate glow/beacon. */
function makeGlowTexture(inner, outer) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(255,150,50,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function initGate(ctx) {
  const root = new THREE.Group();
  ctx.scene.add(root);

  // --- Shared resources across every gate assembly in a system ---
  const ringGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48);
  const chevronGeo = new THREE.ConeGeometry(1.6, 5, 4);
  const chevronMat = new THREE.MeshStandardMaterial({
    color: BRASS_DARK,
    emissive: AMBER_HOT,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.6,
  });
  const glowMap = makeGlowTexture('rgba(255,220,150,0.9)', 'rgba(255,170,70,0.35)');
  const beaconMap = makeGlowTexture('rgba(255,240,200,1)', 'rgba(255,190,90,0.5)');
  const chevronRadius = RING_RADIUS - RING_TUBE - 3;
  const glowBaseScale = RING_RADIUS * 3.2;
  const beaconBaseScale = 10;

  // Wave 37: faction gate tinting. The ring structure stays Lamplighter
  // brass everywhere (Guild infrastructure, per lore), but in a faction's
  // home systems the chevron emissives, bore glow, beacon, and charge
  // tunnel shift to the faction's FACTION_STYLE glow/beacon colors — the
  // "faction-contextualized gate" look of the reference art. Textures and
  // chevron materials are lazy-cached per faction and shared across
  // assemblies/rebuilds — NEVER disposed (the ringGeo/glowMap pattern).
  // Beautiful keeps its wave-27 mint overgrowth path, unchanged.
  let currentFaction = 'independent'; // set per rebuild() from the system def
  const factionTintCache = {}; // faction → { glowMap, beaconMap, chevronMat }
  function _hexRgba(hex, a) {
    return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
  }
  function tintFor(faction) {
    let t = factionTintCache[faction];
    if (!t) {
      const st = styleFor(faction);
      t = {
        glowMap: makeGlowTexture(_hexRgba(st.beacon, 0.9), _hexRgba(st.glow, 0.35)),
        beaconMap: makeGlowTexture(_hexRgba(st.beacon, 1), _hexRgba(st.glow, 0.5)),
        chevronMat: new THREE.MeshStandardMaterial({
          color: BRASS_DARK,
          emissive: st.glow,
          emissiveIntensity: 0.9,
          roughness: 0.4,
          metalness: 0.6,
        }),
        tunnelColor: st.glow,
      };
      factionTintCache[faction] = t;
    }
    return t;
  }

  // Junction silhouette shared geometry (like ringGeo/chevronGeo: shared
  // across assemblies, never disposed per rebuild). Hex bars span a full
  // hex edge (edge length == circumradius for a regular hexagon).
  const hexBarGeo = new THREE.BoxGeometry(HEX_RADIUS, HEX_BAR_THICK, HEX_BAR_THICK);
  const armGeo = new THREE.BoxGeometry(HEX_RADIUS - RING_RADIUS, ARM_THICK, ARM_THICK);

  // --- Beautiful Ones overgrowth (wave-27) shared resources ---
  // The Beautiful don't build gates; they cultivate them. In beautiful
  // systems the brass ring is GROWN OVER: living tendrils, membrane
  // petals, mint bud-lanterns, gilt vines. All geometries and the mint
  // glow texture are lazy-cached here and shared across assemblies and
  // rebuilds — NEVER disposed (the ringGeo pattern). The shared
  // organicMaterials() set is used directly: never cloned, never
  // disposed, never tagPulse'd. Only the per-assembly bud SpriteMaterials
  // (tagPulse'd) enter the rebuild() disposal path.
  let currentBeautiful = false; // set per rebuild() from the system faction
  let ogTendrilGeoA = null;
  let ogTendrilGeoB = null;
  let ogPetalGeo = null;
  let ogVineGeoA = null;
  let ogVineGeoB = null;
  let beautifulGlowMap = null;

  // Bend a +Z-growing tendril geometry into a planar arc of radius rb
  // (curving toward local -X) so it hugs the gate ring circle.
  function bendTendrilToArc(geo, rb) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const th = z / rb;
      const c = Math.cos(th);
      const s = Math.sin(th);
      pos.setXYZ(i, -rb * (1 - c) - x * c, y, rb * s - x * s);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  function ensureOrganicShared() {
    if (ogTendrilGeoA) return;
    // Tendrils spanning ~a quarter-ring arc (2π·30/4 ≈ 47u), bent to hug
    // the ring circle; two sway variants for variety.
    ogTendrilGeoA = bendTendrilToArc(
      makeTendrilGeometry({ length: 47, radius: 0.9, sway: 1.4, taper: 0.35, radialSegs: 6, tubularSegs: 36 }),
      RING_RADIUS,
    );
    ogTendrilGeoB = bendTendrilToArc(
      makeTendrilGeometry({ length: 47, radius: 0.8, sway: -1.1, taper: 0.3, radialSegs: 6, tubularSegs: 36 }),
      RING_RADIUS,
    );
    ogPetalGeo = makePetalGeometry({ length: 8, width: 4.5, curl: 1.7, cup: 1.3, segs: 10 });
    ogVineGeoA = new THREE.TorusGeometry(RING_RADIUS + 3, 0.3, 6, 72);
    ogVineGeoB = new THREE.TorusGeometry(RING_RADIUS - 3, 0.3, 6, 72);
    beautifulGlowMap = makeOrganicGlowTexture('rgba(184,255,216,1)', 'rgba(127,224,168,0)');
  }

  // --- Faction gate overlays (wave 38) shared resources ---
  // Unit primitives scaled per part — lazy-cached, marked userData.shared,
  // NEVER disposed (the ringGeo/glowMap pattern). Overlay sprite lamps
  // reuse the wave-37 tintFor per-faction textures (also shared). Only
  // per-assembly overlay materials/sprite materials enter the rebuild()
  // disposal path (the wave-27 bud-material precedent).
  let ovShared = null;
  function ensureOverlayShared() {
    if (ovShared) return;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 6);
    const cone = new THREE.ConeGeometry(1, 1, 6);
    const sphere = new THREE.SphereGeometry(1, 8, 6);
    const ring = new THREE.TorusGeometry(1, 0.1, 6, 40);
    box.userData.shared = true;
    cyl.userData.shared = true;
    cone.userData.shared = true;
    sphere.userData.shared = true;
    ring.userData.shared = true;
    ovShared = { box, cyl, cone, sphere, ring };
  }

  // Per-system-faction dress over the Lamplighter brass base, built
  // alongside the ring at assembly build time (junction assemblies get it
  // too — the faction-neutral lantern coexists). Overlay animation is
  // preallocated entries in a.overlayAnims: update() mutates opacity /
  // rotation in place and freezes them at base under reducedMotion.
  function buildOverlay(a, faction, tint) {
    ensureOverlayShared();
    const st = styleFor(faction);
    const G = ovShared;
    const ov = new THREE.Group();
    ov.name = faction + '-overlay';
    const mats = [];
    const anims = [];
    const T = RING_RADIUS + RING_TUBE; // outer tube surface radius
    const IN = RING_RADIUS - RING_TUBE; // inner tube surface radius

    // Per-assembly structural material (faction PBR response); disposed in rebuild().
    const struct = (color, emissive, ei) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        emissive: emissive ?? 0x000000,
        emissiveIntensity: ei ?? 0,
        metalness: st.metalness,
        roughness: st.roughness,
      });
      mats.push(m);
      return m;
    };
    // Box/sphere/ring part: scaled, placed on the ring circle at angle ang,
    // radius r, bore offset z; rotation.z = ang + rot (rot π/2 = tangential,
    // -π/2 = local +Y radial).
    const part = (geo, mat, sx, sy, sz, ang, r, z = 0, rot = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
      m.rotation.z = ang + rot;
      ov.add(m);
      return m;
    };
    // Cylinder/cone mast: +Y axis pointed radially outward.
    const axial = (geo, mat, thick, len, ang, r, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(thick, len, thick);
      m.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
      m.rotation.z = ang - Math.PI / 2;
      ov.add(m);
      return m;
    };
    // Additive lamp sprite; amp > 0 registers an in-place pulse entry.
    const lamp = (map, color, scale, ang, r, z, base, amp, spd, phase = 0) => {
      const m = new THREE.SpriteMaterial({
        map, color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: base,
        depthWrite: false,
      });
      mats.push(m);
      const s = new THREE.Sprite(m);
      s.scale.setScalar(scale);
      s.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
      ov.add(s);
      if (amp > 0) anims.push({ mat: m, base, amp, spd, phase });
      return s;
    };

    switch (faction) {
      case 'veridian': {
        // Segmented hexagonal ring cladding, claim beacons, emerald aperture.
        const clad = struct(st.hull);
        const alloy = struct(st.trim);
        const aperture = struct(st.hullDark, st.glow, 1.2);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
          part(G.box, clad, 11, 3.4, 4.6, ang, T + 1.4, 0, Math.PI / 2);
          part(G.box, aperture, 4.2, 0.9, 1.4, ang, IN - 1.2, 0, Math.PI / 2);
        }
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2;
          axial(G.cyl, alloy, 0.6, 7, ang, T + 3.5);
          lamp(tint.beaconMap, st.glow, 4.5, ang, T + 7.5, 0, 0.5, 0.35, 2.2, i * 2.1);
        }
        break;
      }
      case 'ferrous': {
        // Four cardinal bastions, blast shutters, crimson marker lights.
        const iron = struct(st.hull);
        const dark = struct(st.hullDark);
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2;
          part(G.box, iron, 6, 9, 6.5, ang, T + 3.5, 0, -Math.PI / 2);
          part(G.box, dark, 3.6, 3, 4.2, ang, T + 9.5, 0, -Math.PI / 2);
          // Strict alternating blink (paired phases).
          lamp(tint.beaconMap, st.accent, 4, ang, T + 11.5, 0, 0.6, 0.4, 3.2, (i % 2) * Math.PI);
        }
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          part(G.box, dark, 12, 5.5, 0.9, ang, IN - 2.2, 2.4, Math.PI / 2);
          part(G.box, dark, 12, 5.5, 0.9, ang, IN - 2.2, -2.4, Math.PI / 2);
        }
        break;
      }
      case 'freehold': {
        // Replaced ring segments (mismatched patch panels), repair
        // scaffolds, warm window pods.
        const patchMats = st.patch.map((c) => struct(c));
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 + 0.45;
          part(G.box, patchMats[i % 3], 8 + (i % 3) * 2.5, 2.6 + (i % 2), 4.8,
            ang, T + 0.9, i % 2 ? 0.8 : -0.8, Math.PI / 2);
        }
        const frame = struct(st.trim);
        for (let i = 0; i < 2; i++) {
          const ang = i * Math.PI + Math.PI / 2.5;
          for (let k = -1; k <= 1; k++) axial(G.cyl, frame, 0.28, 9, ang + k * 0.075, T + 4.5);
          part(G.box, frame, 5.5, 0.5, 3, ang, T + 9, 0, Math.PI / 2);
        }
        const pod = struct(st.hullDark, st.glow, 0.9);
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2 + 1.1;
          part(G.box, pod, 3.2, 2.4, 3, ang, T + 2.6, 1.2, Math.PI / 2);
          lamp(tint.beaconMap, st.glow, 2.6, ang, T + 4.4, 1.2, 0.45, 0.2, 1.4, i * 1.3);
        }
        break;
      }
      case 'redledger': {
        // Armored toll platforms, boarding dock, strict beacon lanes.
        const iron = struct(st.hull);
        const copper = struct(st.trim);
        for (const s of [-1, 1]) {
          const ang = s * Math.PI / 3;
          part(G.box, iron, 11, 2.6, 7.5, ang, T + 1.6, 0, Math.PI / 2);
          part(G.box, copper, 11.6, 0.7, 8.1, ang, T + 3.2, 0, Math.PI / 2);
        }
        const dAng = -Math.PI / 2;
        part(G.box, iron, 3, 15, 3.4, dAng, T + 7.5, 0, -Math.PI / 2);
        part(G.box, copper, 5.5, 1.2, 5.5, dAng, T + 15.5, 0, -Math.PI / 2);
        lamp(tint.beaconMap, st.glow, 3.6, dAng, T + 16.8, 0, 0.6, 0.35, 2.6);
        // Beacon lanes through the bore — strict unison blink.
        for (const s of [-1, 1]) {
          for (let k = -1; k <= 1; k++) {
            lamp(tint.beaconMap, st.beacon, 2.8, s > 0 ? 0 : Math.PI, 16, k * 13, 0.5, 0.45, 3.4);
          }
        }
        break;
      }
      case 'gilded': {
        // Oval scale-segment cladding, turquoise aperture.
        const ceramic = struct(st.hull);
        const gold = struct(st.accent);
        const aperture = struct(st.hullDark, st.glow, 1.5);
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          part(G.sphere, i % 4 === 3 ? gold : ceramic, 5.4, 3.1, 1.7,
            ang, T + 0.7, i % 2 ? 1 : -1, Math.PI / 2);
        }
        part(G.ring, aperture, IN - 1.4, IN - 1.4, (IN - 1.4) * 0.22, 0, 0);
        for (let i = 0; i < 4; i++) {
          lamp(tint.beaconMap, st.glow, 3.4, (i / 4) * Math.PI * 2 + Math.PI / 4, IN - 1.4, 0, 0.5, 0.3, 1.8, i * 1.6);
        }
        break;
      }
      case 'congregation': {
        // Shrine pods, amber guidance lights, violet Wakeglass accents.
        const hullM = struct(st.hull);
        const silver = struct(st.trim);
        const wake = struct(st.hullDark, st.patch[0], 1.4);
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          part(G.box, hullM, 4.4, 2.6, 4.4, ang, T + 1.4, 0, Math.PI / 2);
          axial(G.cone, silver, 1.7, 6.5, ang, T + 5.6);
          part(G.box, wake, 1.2, 1.2, 1.2, ang + 0.16, T + 1.8, 1.4);
        }
        for (let i = 0; i < 6; i++) {
          lamp(tint.beaconMap, st.glow, 3, (i / 6) * Math.PI * 2, T + 0.6, i % 2 ? 2.4 : -2.4, 0.5, 0.25, 1.2, i * 1.05);
        }
        for (let i = 0; i < 2; i++) {
          lamp(tint.beaconMap, st.patch[0], 3.6, (i / 2) * Math.PI * 2 + Math.PI / 4, T + 8.6, 0, 0.45, 0.25, 1.6, i * Math.PI);
        }
        break;
      }
      case 'assembly': {
        // Recursive scaffolds, duplicated sub-rings, teal optics.
        const off = struct(st.hull);
        const char = struct(st.hullDark);
        const orange = struct(st.accent);
        for (let i = 0; i < 2; i++) {
          const ang = (i / 2) * Math.PI * 2 + Math.PI / 3;
          // Daughter-ring copy riding the hull: torus + nubs so the slow
          // counter-rotation reads (a bare torus spins invisibly).
          const mount = new THREE.Group();
          mount.position.set(Math.cos(ang) * (T + 6), Math.sin(ang) * (T + 6), i ? -4 : 4);
          const sub = new THREE.Mesh(G.ring, off);
          sub.scale.setScalar(9);
          mount.add(sub);
          for (let k = 0; k < 3; k++) {
            const na = (k / 3) * Math.PI * 2;
            const nub = new THREE.Mesh(G.box, k === 1 ? orange : char);
            nub.scale.set(2, 2, 2);
            nub.position.set(Math.cos(na) * 9, Math.sin(na) * 9, 0);
            mount.add(nub);
          }
          ov.add(mount);
          anims.push({ obj: mount, spin: i ? 0.3 : -0.3 });
        }
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2;
          part(G.box, char, 5, 5, 5, ang, T + 2.5);
          part(G.box, off, 2.6, 2.6, 2.6, ang, T + 6.3);
          part(G.box, orange, 1.3, 1.3, 1.3, ang, T + 8.2);
        }
        for (let i = 0; i < 4; i++) {
          lamp(tint.beaconMap, st.glow, 3.2, (i / 4) * Math.PI * 2 + Math.PI / 4, T + 3.4, i % 2 ? 2 : -2, 0.5, 0.35, 2.0, i * 1.9);
        }
        break;
      }
      case 'lamplighter': {
        // Full service dress — gantries, relay crown, maintenance rail,
        // many small amber lamps (the gate's home look).
        const soot = struct(st.hull);
        const yellow = struct(st.trim);
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2 + Math.PI / 6;
          part(G.box, soot, 1.4, 13, 1.4, ang, T + 6.5, 0, -Math.PI / 2);
          part(G.box, yellow, 2.2, 2.2, 2.2, ang, T + 13.5, 0, -Math.PI / 2);
        }
        // Relay crown riding the ring flank at 330° — clear of the pulsing
        // gate beacon at 90° and the three gantries (30°/150°/270°).
        const cAng = (11 / 6) * Math.PI;
        axial(G.cyl, soot, 2.6, 6, cAng, T + 3);
        axial(G.cyl, yellow, 1.4, 3.4, cAng, T + 7.4);
        axial(G.cone, soot, 0.8, 3.4, cAng, T + 10.6);
        lamp(tint.beaconMap, st.patch[1], 3.8, cAng, T + 12.8, 0, 0.5, 0.3, 2.8); // cobalt diagnostic
        const rail = part(G.ring, yellow, T + 3.4, T + 3.4, (T + 3.4) * 0.12, 0, 0);
        rail.rotation.x = 0.05;
        for (let i = 0; i < 12; i++) {
          lamp(tint.beaconMap, st.glow, 2.2, (i / 12) * Math.PI * 2, T + 0.9, i % 2 ? 1.6 : -1.6, 0.5, 0.25, 1.7, i * 0.7);
        }
        lamp(tint.beaconMap, st.patch[1], 3, Math.PI / 6 + (Math.PI * 2) / 3, T + 15.9, 0, 0.45, 0.25, 2.2, 1.1);
        break;
      }
    }

    a.group.add(ov);
    a.overlayMats = mats;
    a.overlayAnims = anims;
  }

  // One preallocated assembly per gate: { group, ring, chevrons, glow,
  // beacon, to, x, y, z }. Rebuilt only on 'systemLoaded'.
  const assemblies = [];

  function buildAssembly(gateDef) {
    const group = new THREE.Group();
    const beautiful = currentBeautiful;
    if (beautiful) ensureOrganicShared();
    // Beautiful systems swap the amber glow texture for the mint organic
    // one (glow/beacon sprites and the charge tunnel). Other factions tint
    // glow/beacon/chevrons/tunnel from their FACTION_STYLE (wave 37);
    // independent/hollow get the classic amber (tintFor falls back).
    const tint = beautiful ? null : tintFor(currentFaction);
    const gMap = beautiful ? beautifulGlowMap : (tint?.glowMap ?? glowMap);
    const bMap = beautiful ? beautifulGlowMap : (tint?.beaconMap ?? beaconMap);
    const chvMat = beautiful ? chevronMat : (tint?.chevronMat ?? chevronMat);

    // Ring (brass, slightly emissive so it reads against deep space). The
    // material is per-gate: charge glow raises one ring's emissive only.
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({
        color: BRASS,
        emissive: AMBER,
        emissiveIntensity: 0.25,
        roughness: 0.55,
        metalness: 0.8,
      }),
    );
    group.add(ring);

    // Inner chevron markers: radial inward-pointing cones around the bore.
    const chevrons = new THREE.Group();
    for (let i = 0; i < CHEVRON_COUNT; i++) {
      const a = (i / CHEVRON_COUNT) * Math.PI * 2;
      const c = new THREE.Mesh(chevronGeo, chvMat);
      c.position.set(Math.cos(a) * chevronRadius, Math.sin(a) * chevronRadius, 0);
      // Cone +Y is the tip; rotate so the tip points at the ring center.
      c.rotation.z = a + Math.PI / 2;
      chevrons.add(c);
    }
    group.add(chevrons);

    // Additive amber glow filling the bore (the "lamplight").
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: gMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(glowBaseScale);
    group.add(glow);

    // Pulsing beacon riding the ring.
    const beacon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: bMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    beacon.position.set(0, RING_RADIUS + RING_TUBE + 2, 0);
    beacon.scale.setScalar(beaconBaseScale);
    group.add(beacon);

    // Charge tunnel (wave-6): preallocated particle ring in the bore plane.
    // swirlBase holds per-point { angle, radius fraction }; swirlZ holds the
    // depth offset streamed along the bore. All buffers preallocated here —
    // update() writes positions in place only while the gate is charging.
    const swirlGeo = new THREE.BufferGeometry();
    const swirlArr = new Float32Array(TUNNEL_COUNT * 3);
    swirlGeo.setAttribute('position', new THREE.BufferAttribute(swirlArr, 3));
    const swirlBase = new Float32Array(TUNNEL_COUNT * 2);
    const swirlZ = new Float32Array(TUNNEL_COUNT);
    for (let i = 0; i < TUNNEL_COUNT; i++) {
      swirlBase[i * 2] = Math.random() * Math.PI * 2;
      swirlBase[i * 2 + 1] = 0.55 + Math.random() * 0.5;
      swirlZ[i] = Math.random() * TUNNEL_DEPTH;
    }
    const swirl = new THREE.Points(
      swirlGeo,
      new THREE.PointsMaterial({
        map: gMap,
        color: beautiful ? ORGANIC.mint : (tint?.tunnelColor ?? AMBER_HOT),
        size: TUNNEL_SIZE,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    swirl.visible = false;
    swirl.frustumCulled = false; // buffer rewritten in place; skip stale culling
    group.add(swirl);

    const gp = gateDef.position;
    group.position.set(gp[0], gp[1], gp[2]);
    // Ring bore faces the system center (origin) — the arrival/departure lane.
    group.lookAt(0, 0, 0);
    root.add(group);

    const a = { group, ring, chevrons, glow, beacon, swirl, swirlArr, swirlBase, swirlZ, swirlPhase: 0, to: gateDef.to, x: gp[0], y: gp[1], z: gp[2] };
    // Beautiful Ones overgrowth (wave-27): grown tendrils/petals/buds over
    // the brass ring. collectOrganic walks the finished assembly ONCE;
    // update() drives a.organicParts with animateOrganic.
    if (beautiful) {
      buildOvergrowth(a);
      a.organicParts = collectOrganic(group);
    }
    // Faction overlay (wave 38): sculpted-faction dress over the brass base
    // (junction assemblies get it too — the lantern coexists). Beautiful
    // keeps overgrowth; independent/hollow/unknown stay plain brass.
    if (!beautiful && OVERLAY_FACTIONS.has(currentFaction)) {
      buildOverlay(a, currentFaction, tint);
    }
    return a;
  }

  // Beautiful Ones overgrowth (wave-27): the ring stays Lamplighter brass
  // (Guild infrastructure) but is GROWN OVER — living tendrils wrap the
  // torus tube, membrane petals cocoon alternating chevrons, mint
  // bud-lanterns ride the ring, gilt vines circle it. Shared geometries /
  // materials are used directly; only the bud SpriteMaterials are
  // per-assembly (tagPulse'd) and disposed in rebuild().
  function buildOvergrowth(a) {
    const mats = organicMaterials(); // cached shared set — used directly
    const group = new THREE.Group();
    group.name = 'beautiful-overgrowth';

    // Living tendrils wrapped around the torus tube at spaced angles,
    // conforming to the ring circle (arc-bent geometry at build time).
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + 0.35;
      const mount = new THREE.Group();
      mount.position.set(Math.cos(ang) * RING_RADIUS, Math.sin(ang) * RING_RADIUS, 0);
      mount.rotation.z = ang; // local +X radially outward
      const tendril = new THREE.Mesh(i % 2 ? ogTendrilGeoB : ogTendrilGeoA, mats.flesh);
      // Arc plane into the ring plane: local +Z (root tangent) → mount -Y
      // (ring tangent), local -X (arc-center side) → mount -X (inward).
      tendril.rotation.x = Math.PI / 2;
      // Alternate riding the outer/inner tube surface with a plane wobble.
      tendril.position.set(i % 2 ? RING_TUBE * 0.75 : -RING_TUBE * 0.75, 0, i % 2 ? -1.1 : 1.1);
      mount.add(tendril);
      tagSway(mount, { axis: 'z', amp: 0.015, hz: 0.15, phase: i * 1.9 });
      group.add(mount);
    }

    // Membrane petals cocooning alternating chevrons (0, 2, 4, 6). Mounted
    // INTO a.chevrons so they keep their seats as the chevron ring
    // counter-rotates each frame (collectOrganic walks the whole assembly,
    // so sway collection is unaffected).
    for (let k = 0; k < 4; k++) {
      const ang = ((k * 2) / CHEVRON_COUNT) * Math.PI * 2;
      const mount = new THREE.Group();
      mount.position.set(Math.cos(ang) * chevronRadius, Math.sin(ang) * chevronRadius, 0);
      mount.rotation.z = ang + Math.PI / 2; // local +Y points at the ring center (chevron-tip direction)
      const petal = new THREE.Mesh(ogPetalGeo, mats.membrane);
      petal.rotation.x = -Math.PI / 2; // petal length +Z → mount +Y (over the chevron)
      petal.rotation.z = 0.15; // organic asymmetry
      petal.position.y = -3; // root behind the chevron base, curling over it
      mount.add(petal);
      tagSway(mount, { axis: 'z', amp: 0.04, hz: 0.25, phase: k * 1.7 });
      a.chevrons.add(mount);
    }

    // Mint bud-lanterns riding the ring at 45° offsets from the chevrons.
    // Per-assembly SpriteMaterials (tagPulse'd) — disposed in rebuild().
    const budMats = [];
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const mat = new THREE.SpriteMaterial({
        map: beautifulGlowMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      tagPulse(mat, { base: 0.55, amp: 0.25, hz: 0.4, phase: i * 1.6 });
      const bud = new THREE.Sprite(mat);
      bud.name = 'beautiful-bud';
      bud.position.set(Math.cos(ang) * RING_RADIUS, Math.sin(ang) * RING_RADIUS, 0);
      bud.scale.setScalar(7);
      group.add(bud);
      budMats.push(mat);
    }

    // Gilt vine rings circling the main ring — the 'gilded growth'.
    const vineA = new THREE.Mesh(ogVineGeoA, mats.gilt);
    const vineB = new THREE.Mesh(ogVineGeoB, mats.gilt);
    vineB.rotation.x = 0.06;
    group.add(vineA);
    group.add(vineB);

    a.group.add(group);
    a.budMats = budMats;
  }

  // Junction lantern silhouette (wave-22): augment a hub assembly with the
  // hexagonal outer frame + one brass arm per route tipped with an amber
  // lamp sprite. Everything is preallocated here — update() only mutates
  // frame rotation, lamp scale/opacity, and userData scalars.
  function buildJunctionExtras(a, routes) {
    const group = a.group;
    // Per-assembly frame/arm material (disposed with the assembly).
    const hexMat = new THREE.MeshStandardMaterial({
      color: BRASS_DARK,
      emissive: AMBER,
      emissiveIntensity: 0.35,
      roughness: 0.5,
      metalness: 0.7,
    });
    const hexFrame = new THREE.Group();
    const edgeMidR = HEX_RADIUS * Math.cos(Math.PI / 6);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const bar = new THREE.Mesh(hexBarGeo, hexMat);
      bar.position.set(Math.cos(ang) * edgeMidR, Math.sin(ang) * edgeMidR, 0);
      bar.rotation.z = ang + Math.PI / 2;
      hexFrame.add(bar);
    }
    group.add(hexFrame);

    const arms = new THREE.Group();
    const lamps = [];
    const lampMats = [];
    const armR = (RING_RADIUS + HEX_RADIUS) / 2;
    const lampR = HEX_RADIUS - 1;
    for (let k = 0; k < routes.length; k++) {
      const phi = (k / routes.length) * Math.PI * 2;
      const arm = new THREE.Mesh(armGeo, hexMat);
      arm.position.set(Math.cos(phi) * armR, Math.sin(phi) * armR, 0);
      arm.rotation.z = phi;
      arms.add(arm);
      const lampMat = new THREE.SpriteMaterial({
        map: beaconMap,
        color: AMBER,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: LAMP_BASE_OPACITY,
        depthWrite: false,
      });
      const lamp = new THREE.Sprite(lampMat);
      lamp.name = 'junction-arm-lamp';
      lamp.position.set(Math.cos(phi) * lampR, Math.sin(phi) * lampR, 0);
      lamp.scale.setScalar(LAMP_BASE_SCALE);
      arms.add(lamp);
      lamps.push(lamp);
      lampMats.push(lampMat);
    }
    group.add(arms);

    a.hexFrame = hexFrame;
    a.hexMat = hexMat;
    a.arms = arms;
    a.lamps = lamps;
    a.lampMats = lampMats;
    a.lampBlend = new Float32Array(routes.length); // per-lamp selection lerp state
    group.userData.routeCount = routes.length;
    group.userData.routeIndex = 0;
  }

  // --- Rebuild every assembly for the current system (on 'systemLoaded') ---
  function rebuild() {
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      root.remove(a.group);
      a.ring.material.dispose();
      a.glow.material.dispose();
      a.beacon.material.dispose();
      a.swirl.geometry.dispose();
      a.swirl.material.dispose();
      if (a.isHub) {
        // Junction silhouette: shared hexBarGeo/armGeo survive (like
        // ringGeo); dispose only the per-assembly material and lamp mats.
        a.hexMat.dispose();
        for (let k = 0; k < a.lampMats.length; k++) a.lampMats[k].dispose();
      }
      // Beautiful overgrowth: shared geometries/materials/texture survive
      // (ringGeo pattern); dispose only the per-assembly bud SpriteMaterials.
      if (a.budMats) {
        for (let k = 0; k < a.budMats.length; k++) a.budMats[k].dispose();
      }
      // Faction overlay (wave 38): shared geometries/tint textures survive
      // (ringGeo pattern); dispose only the per-assembly overlay materials.
      if (a.overlayMats) {
        for (let k = 0; k < a.overlayMats.length; k++) a.overlayMats[k].dispose();
      }
    }
    assemblies.length = 0;
    const def = SYSTEMS[ctx.world.currentSystem];
    // Beautiful Ones overgrowth (wave-27): gate/junction rings in beautiful
    // systems are grown over — buildAssembly reads this flag.
    currentBeautiful = isBeautiful(def.faction);
    currentFaction = def.faction ?? 'independent'; // wave 37: gate tinting
    const gates = def.gates;
    for (let i = 0; i < gates.length; i++) {
      const a = buildAssembly(gates[i]);
      a.group.name = 'lamplighter-gate';
      assemblies.push(a);
    }
    // Lamplighter junction: one assembly at hub.position carrying the hub's
    // route list. `to` always tracks the selected route (reset to 0 here);
    // KeyG advances routeIndex while this is the nearest zone.
    const hub = def.hub;
    if (hub && hub.routes && hub.routes.length) {
      const a = buildAssembly({ position: hub.position, to: hub.routes[0] });
      a.isHub = true;
      a.routes = hub.routes;
      a.routeIndex = 0;
      buildJunctionExtras(a, hub.routes);
      a.group.name = 'lamplighter-junction';
      assemblies.push(a);
    }
  }
  rebuild();

  // --- Jump overlay: full-screen fade + centered label, created once ---
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
    'background:#000;opacity:0;z-index:40;pointer-events:none;';
  const label = document.createElement('div');
  label.style.cssText =
    'color:#ffb84d;font:28px monospace;letter-spacing:.4em;text-align:center;' +
    'text-shadow:0 0 18px rgba(255,184,77,.8);';
  overlay.appendChild(label);
  document.body.appendChild(overlay);

  let overlayShown = false;
  let labelFor = null; // destination id currently named in the label
  let wasJumping = false;

  // Junction route cycling: set each frame by the zone check; the KeyG
  // listener acts on the hub assembly currently nearest in range.
  let zoneHub = null;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyG' || e.repeat) return;
    if (!zoneHub || ctx.flags.docked || ctx.flags.paused || ctx.gate.jumping) return;
    const routes = zoneHub.routes;
    zoneHub.routeIndex = (zoneHub.routeIndex + 1) % routes.length;
    zoneHub.to = routes[zoneHub.routeIndex];
  });

  function update(dt) {
    // Rebuild for a system swap announced last frame.
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      const e = ctx.lastEvents[i];
      if (e.type === 'systemLoaded') {
        rebuild();
        break;
      }
    }

    const jumping = ctx.gate.jumping;
    const reducedMotion = ctx.settings?.reducedMotion === true;

    // Per-gate idle motion + glow; only the departing gate (the one whose
    // `to` matches ctx.gate.destination) intensifies during charge.
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      // Slow spin of ring + chevrons around the bore axis.
      a.ring.rotation.z += SPIN_SPEED * dt;
      a.chevrons.rotation.z -= SPIN_SPEED * 0.6 * dt;
      // Beacon pulse (~1.2 s period).
      const pulse = 0.7 + 0.3 * Math.sin(ctx.elapsed * 5.2);
      a.beacon.scale.setScalar(beaconBaseScale * pulse);
      // Glow: gentle breathing at rest, intensifies on the departing gate.
      const charging = jumping && a.to === ctx.gate.destination;
      const charge = charging ? 1 + ctx.gate.progress * 1.6 : 1;
      a.glow.scale.setScalar(glowBaseScale * (0.95 + 0.05 * Math.sin(ctx.elapsed * 2.1)) * charge);
      a.ring.material.emissiveIntensity = charging ? 0.25 + ctx.gate.progress * 1.2 : 0.25;

      // Beautiful overgrowth (wave-27): part-level tendril/petal sway and
      // bud pulse, zero-alloc; animateOrganic is a complete no-op under
      // reducedMotion (stashed bases stay — the overgrowth freezes).
      if (a.organicParts) animateOrganic(a.organicParts, ctx.elapsed, reducedMotion);

      // Faction overlay (wave 38): lamp blink/pulse + slow sub-ring spins,
      // preallocated entries mutated in place (zero-alloc); frozen at base
      // values under reducedMotion.
      if (a.overlayAnims) {
        for (let k = 0; k < a.overlayAnims.length; k++) {
          const an = a.overlayAnims[k];
          if (an.obj) {
            if (!reducedMotion) an.obj.rotation.z += an.spin * dt;
          } else {
            an.mat.opacity = reducedMotion
              ? an.base
              : an.base + an.amp * Math.sin(ctx.elapsed * an.spd + an.phase);
          }
        }
      }

      // Junction silhouette (wave-22): hex frame counter-rotates the ring
      // spin (frozen under reducedMotion); the selected route's lamp lerps
      // brighter/larger — scale/opacity mutated in place, no allocation.
      if (a.isHub) {
        if (!reducedMotion) a.hexFrame.rotation.z += HEX_SPIN_SPEED * dt;
        const lerp = Math.min(1, dt * 8);
        for (let k = 0; k < a.lamps.length; k++) {
          const target = k === a.routeIndex ? 1 : 0;
          const blend = a.lampBlend[k] + (target - a.lampBlend[k]) * lerp;
          a.lampBlend[k] = blend;
          a.lamps[k].scale.setScalar(LAMP_BASE_SCALE + (LAMP_SELECTED_SCALE - LAMP_BASE_SCALE) * blend);
          a.lampMats[k].opacity = LAMP_BASE_OPACITY + (LAMP_SELECTED_OPACITY - LAMP_BASE_OPACITY) * blend;
        }
        a.group.userData.routeIndex = a.routeIndex;
      }

      // Charge tunnel (wave-6): swirl the particle ring while this gate
      // charges — radius contracts and opacity rises with jump progress.
      // reducedMotion → no swirl at all (fade/label overlay still runs).
      const swirling = charging && !reducedMotion;
      a.swirl.visible = swirling;
      if (swirling) {
        const prog = ctx.gate.progress;
        a.swirlPhase += dt * (1.5 + prog * 4);
        const zDrift = (ctx.elapsed * (20 + prog * 40)) % TUNNEL_DEPTH;
        const radScale = RING_RADIUS * (1.15 - 0.55 * prog);
        for (let j = 0; j < TUNNEL_COUNT; j++) {
          const ang = a.swirlBase[j * 2] + a.swirlPhase;
          const r = a.swirlBase[j * 2 + 1] * radScale;
          let z = a.swirlZ[j] + zDrift;
          if (z >= TUNNEL_DEPTH) z -= TUNNEL_DEPTH;
          const j3 = j * 3;
          a.swirlArr[j3] = Math.cos(ang) * r;
          a.swirlArr[j3 + 1] = Math.sin(ang) * r;
          a.swirlArr[j3 + 2] = z - TUNNEL_DEPTH * 0.5;
        }
        a.swirl.geometry.attributes.position.needsUpdate = true;
        a.swirl.material.opacity = 0.25 + prog * 0.75;
      }
    }

    // Zone check per gate (ignored while docked or mid-jump); the nearest
    // in-range gate wins.
    const shipObj = ctx.ship.object;
    let nearIdx = -1;
    let nearD2 = JUMP.zone * JUMP.zone;
    if (!jumping && !ctx.flags.docked && shipObj) {
      const p = shipObj.position;
      for (let i = 0; i < assemblies.length; i++) {
        const a = assemblies[i];
        const dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 <= nearD2) { nearD2 = d2; nearIdx = i; }
      }
    }
    const inZone = nearIdx >= 0;
    const near = inZone ? assemblies[nearIdx] : null;
    const nearIsHub = !!(near && near.isHub);
    zoneHub = nearIsHub ? near : null;
    ctx.gate.inZone = inZone;
    ctx.gate.nearTo = near ? near.to : null;
    ctx.gate.nearHub = nearIsHub;
    ctx.gate.nearRouteIndex = nearIsHub ? near.routeIndex : -1;
    ctx.gate.nearRouteCount = nearIsHub ? near.routes.length : 0;

    if (inZone && ctx.input.dockPressed) {
      ctx.emit('jumpRequested', { to: near.to });
    }

    // Jump overlay: fade in over first 40% of progress, out over last 40%.
    if (jumping) {
      const p = ctx.gate.progress;
      const opacity = p < 0.4 ? p / 0.4 : p > 0.6 ? (1 - p) / 0.4 : 1;
      if (!overlayShown) {
        overlay.style.display = 'flex';
        overlayShown = true;
      }
      overlay.style.opacity = opacity.toFixed(3);
      if (ctx.gate.destination !== labelFor) {
        labelFor = ctx.gate.destination;
        const dest = SYSTEMS[labelFor];
        label.textContent = 'JUMP — ' + (dest ? dest.name : labelFor);
      }
    } else if (overlayShown || wasJumping) {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      overlayShown = false;
      labelFor = null;
    }
    wasJumping = jumping;
  }

  return { update };
}
