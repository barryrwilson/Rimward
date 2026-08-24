import * as THREE from 'three';
import { SYSTEMS, JUMP, FACTIONS } from '../game/state.js';
import { styleFor } from '../game/faction-style.js'; // wave 37: faction gate tinting
import {
  RING_RADIUS,
  RING_TUBE,
  TUNNEL_COUNT,
  TUNNEL_DEPTH,
  TUNNEL_SIZE,
  SPIN_SPEED,
  HEX_SPIN_SPEED,
  LAMP_BASE_SCALE,
  LAMP_SELECTED_SCALE,
  LAMP_BASE_OPACITY,
  LAMP_SELECTED_OPACITY,
} from '../game/gate-scale.js';
import { attachHubLantern, fillTunnelArrays, hubLanternShared, seedFromParts } from './gate-detail.js';
import { GATE_BUILDERS } from './gates/index.js';
import { mountGateSculpt } from './gates/mount.js';
import {
  ORGANIC,
  isBeautiful,
  makeOrganicGlowTexture,
} from './organic.js';

/**
 * Jump gates — one live assembly per system gate plus one hub junction
 * (if any). Faction bodies come from `src/systems/gates/` via mountGateSculpt.
 * Shared work here is charge VFX, zone, jump HUD fade, hub lantern, and
 * Unknowables FX (lenses + plasma). Beautiful mint buds still attach here.
 *
 * Live gates sit at gate positions from the system def, look at origin, and
 * animate per-frame (shutter spin, beacon pulse, glow breath, tunnel swirl).
 * Jump charge (`ctx.gate.progress`) intensifies the departing gate's glow and
 * triggers the particle tunnel; zone checks enable dock input (KeyG) to pick a
 * destination. The hub assembly carries the route list; KeyG cycles selection.
 * rebuild() runs on `systemLoaded`, tearing down every assembly and rebuilding
 * from the new system def.
 *
 * Models Browser uses buildGateModel(faction, opts) to generate a standalone
 * gate model at the origin with visual update only — no gameplay. The model
 * shares the same sculpt + VFX path as live gates.
 */

// Size / spin / tunnel / lantern numbers live in gate-scale.js (G0).
const AMBER_HOT = 0xffd890;


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

// =============================================================================
// MODULE-SCOPE SHARED RESOURCES (lazy, reused across all gate assemblies)
// =============================================================================

let _gateShared = null;
function gateShared() {
  if (_gateShared) return _gateShared;

  const glowMap = makeGlowTexture('rgba(255,220,150,0.9)', 'rgba(255,170,70,0.35)');
  glowMap.userData.shared = true;
  const beaconMap = makeGlowTexture('rgba(255,240,200,1)', 'rgba(255,190,90,0.5)');
  beaconMap.userData.shared = true;
  const glowBaseScale = RING_RADIUS * 3.2;
  const beaconBaseScale = 10;

  // Junction silhouette shared geometry — kit extra (G0 / R6).
  const { hexBarGeo, armGeo } = hubLanternShared();

  // Faction glow / beacon / tunnel tint cache (shared, never disposed).
  const factionTintCache = {};

  // Beautiful mint-bud texture (shared, never disposed).
  let beautifulGlowMap = null;

  // Unknowables FX geos (shared, never disposed).
  let ovShared = null;

  // Helper: hex color to rgba string.
  function _hexRgba(hex, a) {
    return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
  }

  // Helper: faction-specific tint resources (lazy-cached).
  function tintFor(faction) {
    let t = factionTintCache[faction];
    if (!t) {
      const st = styleFor(faction);
      const factionGlowMap = makeGlowTexture(_hexRgba(st.beacon, 0.9), _hexRgba(st.glow, 0.35));
      factionGlowMap.userData.shared = true;
      const factionBeaconMap = makeGlowTexture(_hexRgba(st.beacon, 1), _hexRgba(st.glow, 0.5));
      factionBeaconMap.userData.shared = true;
      t = {
        glowMap: factionGlowMap,
        beaconMap: factionBeaconMap,
        tunnelColor: st.glow,
      };
      factionTintCache[faction] = t;
    }
    return t;
  }

  function ensureBeautifulGlow() {
    if (beautifulGlowMap) return;
    beautifulGlowMap = makeOrganicGlowTexture('rgba(184,255,216,1)', 'rgba(127,224,168,0)');
    beautifulGlowMap.userData.shared = true;
  }

  // Unknowables lenses + plasma cells only.
  function ensureOverlayShared() {
    if (ovShared) return;
    const sphere = new THREE.SphereGeometry(1, 8, 6);
    const arcRing = new THREE.TorusGeometry(1, 0.02, 6, 48, Math.PI * 0.55);
    sphere.userData.shared = true;
    arcRing.userData.shared = true;
    ovShared = { sphere, arcRing };
  }

  _gateShared = {
    glowMap, beaconMap,
    glowBaseScale, beaconBaseScale, hexBarGeo, armGeo,
    tintFor, ensureBeautifulGlow, ensureOverlayShared,
    get beautifulGlowMap() { return beautifulGlowMap; },
    get ovShared() { return ovShared; },
  };
  return _gateShared;
}

// =============================================================================
// BUILDER FUNCTIONS (module-scope, used by both live gates and buildGateModel)
// =============================================================================

// Per-assembly visual animation (pure visual work, no gameplay).
// `charging` is the departing gate's own flag (jumping AND this assembly is
// the destination lane). It is NOT derivable from jumpProgress: a transit
// opens at progress 0, and the plasma cells, the tunnel swirl and the bore
// bloom all key off the flag, not the ramp (wave 42 D3).
function animateAssembly(a, elapsed, dt, reducedMotion, charging = false, jumpProgress = 0) {
  // Slow shutter spin around the bore axis.
  if (!reducedMotion && a.chevrons) {
    a.chevrons.rotation.z -= SPIN_SPEED * 0.6 * dt;
  }

  // Beacon pulse (~1.2 s period).
  const pulse = reducedMotion ? 1.0 : 0.7 + 0.3 * Math.sin(elapsed * 5.2);
  a.beacon.scale.setScalar(gateShared().beaconBaseScale * pulse);

  // Glow: gentle breathing at rest, intensifies with jump progress.
  const charge = charging ? 1 + jumpProgress * 1.6 : 1;
  a.glow.scale.setScalar(
    gateShared().glowBaseScale * (reducedMotion ? 1.0 : 0.95 + 0.05 * Math.sin(elapsed * 2.1)) * charge
  );
  if (a.hullMat) a.hullMat.emissiveIntensity = charging ? 0.12 + jumpProgress * 1.0 : 0.12;

  // Unknowables FX: lens / plasma spin (frozen under reducedMotion).
  if (a.overlayAnims) {
    for (let k = 0; k < a.overlayAnims.length; k++) {
      const an = a.overlayAnims[k];
      if (an.obj) {
        if (!reducedMotion) an.obj.rotation.z += an.spin * dt;
      } else {
        an.mat.opacity = reducedMotion
          ? an.base
          : an.base + an.amp * Math.sin(elapsed * an.spd + an.phase);
      }
    }
  }

  // Unknowables plasma cells (wave 42 D3): visible only while charging.
  if (a.unknowablesPlasma) a.unknowablesPlasma.visible = charging;

  // Junction silhouette (wave-22): hex frame counter-rotates the ring spin.
  if (a.isHub) {
    if (!reducedMotion) a.hexFrame.rotation.z += HEX_SPIN_SPEED * dt;

    // Lamp selection lerp (smooth transition to selected route).
    const lerp = Math.min(1, dt * 8);
    for (let k = 0; k < a.lamps.length; k++) {
      const target = k === a.routeIndex ? 1 : 0;
      const blend = a.lampBlend[k] + (target - a.lampBlend[k]) * lerp;
      a.lampBlend[k] = blend;
      a.lamps[k].scale.setScalar(LAMP_BASE_SCALE + (LAMP_SELECTED_SCALE - LAMP_BASE_SCALE) * blend);
      a.lampMats[k].opacity = LAMP_BASE_OPACITY + (LAMP_SELECTED_OPACITY - LAMP_BASE_OPACITY) * blend;
    }
  }

  // Charge tunnel (wave-6): swirl the particle ring while charging.
  const swirling = charging && !reducedMotion;
  a.swirl.visible = swirling;
  if (swirling) {
    const prog = jumpProgress;
    a.swirlPhase += dt * (1.5 + prog * 4);
    const zDrift = (elapsed * (20 + prog * 40)) % TUNNEL_DEPTH;
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

// Build junction extras (wave-22 / G0 R6): Guild-neutral lantern from the kit.
function buildJunctionExtras(a, routes) {
  attachHubLantern(a, routes, gateShared());
}

function gpKey(gateDef) {
  const p = gateDef.position || [0, 0, 0];
  return `${p[0]},${p[1]},${p[2]}`;
}

function attachBeautifulHooks(group, sh) {
  const wrap = new THREE.Group();
  wrap.name = 'beautiful-overgrowth';
  group.add(wrap);
  const buds = [];
  const budMats = [];
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const mat = new THREE.SpriteMaterial({
      map: sh.beautifulGlowMap ?? sh.glowMap,
      color: ORGANIC.mint,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    s.name = 'beautiful-bud';
    s.scale.setScalar(4);
    s.position.set(Math.cos(ang) * (RING_RADIUS + 6), Math.sin(ang) * (RING_RADIUS * 0.4), 2);
    wrap.add(s);
    buds.push(s);
    budMats.push(mat);
  }
  return { budMats };
}

function attachUnknowablesFx(a, st, sh) {
  sh.ensureOverlayShared();
  const G = sh.ovShared;
  const mats = [];
  const anims = [];
  const lensMat = (color) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    mats.push(m);
    return m;
  };
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const lens = new THREE.Mesh(G.arcRing, lensMat(i % 2 === 0 ? st.patch[0] : st.accent));
    lens.name = 'unknowables-lens';
    lens.scale.setScalar(RING_RADIUS + 4 + (i % 2) * 5);
    lens.rotation.x = i % 2 === 0 ? 0.32 : -0.22;
    lens.rotation.z = ang;
    a.group.add(lens);
    anims.push({ obj: lens, spin: i % 2 === 0 ? 0.12 : -0.08 });
  }
  const plasmaGroup = new THREE.Group();
  plasmaGroup.name = 'unknowables-plasma';
  plasmaGroup.visible = false;
  const plasmaMat = (color) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    mats.push(m);
    return m;
  };
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const cell = new THREE.Mesh(G.sphere, plasmaMat(i % 3 === 0 ? st.beacon : st.accent));
    cell.name = 'unknowables-plasma-cell';
    cell.scale.setScalar(1.8);
    cell.position.set(
      Math.cos(ang) * RING_RADIUS * 0.5,
      Math.sin(ang) * RING_RADIUS * 0.5,
      (i % 2 === 0 ? 2 : -2) + (i % 3) * 1.5,
    );
    plasmaGroup.add(cell);
    anims.push({ obj: cell, spin: i % 2 === 0 ? 0.08 : -0.08 });
  }
  a.group.add(plasmaGroup);
  a.unknowablesPlasma = plasmaGroup;
  a.overlayAnims = anims;
  a.overlayMats = mats;
}

// Build a single gate assembly from the faction sculpt plus charge VFX.
function buildAssembly(gateDef, faction, beautiful) {
  const sh = gateShared();
  const group = new THREE.Group();
  const st = styleFor(faction);
  const spec = Object.hasOwn(GATE_BUILDERS, faction) ? GATE_BUILDERS[faction] : GATE_BUILDERS.independent;

  if (beautiful) sh.ensureBeautifulGlow();
  const tint = sh.tintFor(faction);
  const gMap = beautiful ? sh.beautifulGlowMap : (tint?.glowMap ?? sh.glowMap);
  const bMap = beautiful ? sh.beautifulGlowMap : (tint?.beaconMap ?? sh.beaconMap);

  const mounted = mountGateSculpt(
    group,
    spec,
    st,
    seedFromParts(faction, gpKey(gateDef), String(gateDef.to)),
  );
  const ring = mounted.hull;
  const chevrons = mounted.shutter;

  // Additive amber glow filling the bore.
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: gMap,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(sh.glowBaseScale);
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
  beacon.scale.setScalar(sh.beaconBaseScale);
  group.add(beacon);

  // Charge tunnel particles (preallocated but invisible).
  const swirlGeo = new THREE.BufferGeometry();
  const swirlArr = new Float32Array(TUNNEL_COUNT * 3);
  swirlGeo.setAttribute('position', new THREE.BufferAttribute(swirlArr, 3));
  const swirlBase = new Float32Array(TUNNEL_COUNT * 2);
  const swirlZ = new Float32Array(TUNNEL_COUNT);
  fillTunnelArrays(
    swirlBase,
    swirlZ,
    seedFromParts('tunnel', faction, gpKey(gateDef), String(gateDef.to)),
  );
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
  swirl.frustumCulled = false;
  group.add(swirl);

  // Position and orient the assembly.
  const gp = gateDef.position;
  group.position.set(gp[0], gp[1], gp[2]);
  group.lookAt(0, 0, 0);

  const a = {
    group, ring, chevrons, glow, beacon, swirl, swirlArr, swirlBase, swirlZ, swirlPhase: 0,
    to: gateDef.to, x: gp[0], y: gp[1], z: gp[2],
    overlayAnims: null, budMats: null, overlayMats: null,
    hexFrame: null, hexMat: null, arms: null, lamps: null, lampMats: null, lampBlend: null,
    isHub: false, routeIndex: 0, unknowablesPlasma: null,
    hullMat: mounted.hullMat, lightMat: mounted.lightMat,
    disposeMats: mounted.disposeMats, disposeGeos: mounted.disposeGeos,
  };

  if (beautiful) {
    const hooks = attachBeautifulHooks(group, sh);
    a.budMats = hooks.budMats;
    a.disposeMats.push(...hooks.budMats);
  }
  if (faction === 'unknowables') attachUnknowablesFx(a, st, sh);

  return a;
}

// Live transit coords for NAV-02 / autopilot. Physical rings win over hub
// routes. Primitives only — never return a mesh. Walk the live assemblies so
// a dropped systemLoaded cannot serve authored ghosts.
const RESERVED_NAV_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

let _liveAssemblies = null;
let _liveReady = false;
let _builtSystem = '';

function reservedNavId(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED_NAV_IDS.has(value) || RESERVED_NAV_IDS.has(value.toLowerCase());
}

function liveAssemblyOrigin(a) {
  if (!a) return null;
  // Zone checks read a.x; lookup must match that origin.
  if (Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z)) {
    return { x: a.x, y: a.y, z: a.z };
  }
  const g = a.group;
  if (!g) return null;
  const x = g.position.x;
  const y = g.position.y;
  const z = g.position.z;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  return { x, y, z };
}

function hubListsHop(a, to) {
  const routes = a && a.routes;
  if (!Array.isArray(routes)) return false;
  for (let i = 0; i < routes.length; i++) {
    if (routes[i] === to) return true;
  }
  return false;
}

/** Zone origin for the live assembly that transits `to`, or null. */
export function lookupLiveNavGate(to, expectSystem) {
  if (reservedNavId(to) || !_liveReady || !_liveAssemblies) return null;
  if (expectSystem !== undefined && expectSystem !== _builtSystem) return null;
  let hubPos = null;
  for (let i = 0; i < _liveAssemblies.length; i++) {
    const a = _liveAssemblies[i];
    if (!a) continue;
    if (a.isHub) {
      if (!hubPos && hubListsHop(a, to)) hubPos = liveAssemblyOrigin(a);
      continue;
    }
    if (a.to === to) {
      const pos = liveAssemblyOrigin(a);
      if (pos) return pos;
    }
  }
  return hubPos;
}

// =============================================================================
// LIVE GATE SYSTEM (initGate)
// =============================================================================

export function initGate(ctx) {
  const root = new THREE.Group();
  ctx.scene.add(root);

  // Per-system-faction state (set per rebuild).
  let currentFaction = 'independent';
  let currentBeautiful = false;

  // One preallocated assembly per gate.
  const assemblies = [];
  _liveAssemblies = assemblies;
  _liveReady = false;

  // Rebuild every assembly for the current system (on 'systemLoaded'
  // or when currentSystem drifted while paused — title drops events).
  function rebuild() {
    _liveReady = false;
    _liveAssemblies = assemblies; // this instance owns lookup after rebuild
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      root.remove(a.group);
      if (a.disposeMats) {
        for (let k = 0; k < a.disposeMats.length; k++) a.disposeMats[k].dispose();
      } else if (a.ring?.material) {
        a.ring.material.dispose();
      }
      if (a.disposeGeos) {
        for (let k = 0; k < a.disposeGeos.length; k++) a.disposeGeos[k].dispose();
      }
      a.glow.material.dispose();
      a.beacon.material.dispose();
      a.swirl.geometry.dispose();
      a.swirl.material.dispose();
      if (a.isHub) {
        a.hexMat.dispose();
        for (let k = 0; k < a.lampMats.length; k++) a.lampMats[k].dispose();
      }
      if (a.overlayMats) {
        for (let k = 0; k < a.overlayMats.length; k++) a.overlayMats[k].dispose();
      }
    }
    assemblies.length = 0;
    const sys = ctx.world.currentSystem;
    if (reservedNavId(sys) || !Object.hasOwn(SYSTEMS, sys)) {
      _builtSystem = typeof sys === 'string' ? sys : '';
      return;
    }
    const def = SYSTEMS[sys];
    if (!def || typeof def !== 'object') {
      _builtSystem = sys;
      return;
    }
    currentBeautiful = isBeautiful(def.faction);
    currentFaction = def.faction ?? 'independent';
    const gates = Array.isArray(def.gates) ? def.gates : [];
    for (let i = 0; i < gates.length; i++) {
      const a = buildAssembly(gates[i], currentFaction, currentBeautiful);
      a.group.name = `${currentFaction}-gate`;
      root.add(a.group);
      assemblies.push(a);
    }
    // Lamplighter junction.
    const hub = def.hub;
    if (hub && hub.routes && hub.routes.length) {
      const a = buildAssembly({ position: hub.position, to: hub.routes[0] }, currentFaction, currentBeautiful);
      a.isHub = true;
      a.routes = hub.routes;
      a.routeIndex = 0;
      buildJunctionExtras(a, hub.routes);
      a.group.name = 'lamplighter-junction';
      root.add(a.group);
      assemblies.push(a);
    }
    _builtSystem = sys;
    _liveReady = true;
  }
  rebuild();

  // Jump overlay: full-screen fade + centered label.
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
  let labelFor = null;
  let wasJumping = false;
  let lastFadeStep = -1;

  // Junction route cycling.
  let zoneHub = null;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyG' || e.repeat) return;
    if (!zoneHub || ctx.flags.docked || ctx.flags.paused || ctx.gate.jumping) return;
    const routes = zoneHub.routes;
    zoneHub.routeIndex = (zoneHub.routeIndex + 1) % routes.length;
    zoneHub.to = routes[zoneHub.routeIndex];
  });

  function update(dt) {
    // Rebuild for a system swap. lastEvents can drop while paused (title),
    // so also rebuild when currentSystem drifted away from the live set.
    let needRebuild = ctx.world.currentSystem !== _builtSystem;
    if (!needRebuild) {
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        const e = ctx.lastEvents[i];
        if (e.type === 'systemLoaded') {
          needRebuild = true;
          break;
        }
      }
    }
    if (needRebuild) rebuild();

    const jumping = ctx.gate.jumping;
    const reducedMotion = ctx.settings?.reducedMotion === true;

    // Per-assembly visual animation.
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      const charging = jumping && a.to === ctx.gate.destination;
      const jumpProgress = charging ? ctx.gate.progress : 0;
      animateAssembly(a, ctx.elapsed, dt, reducedMotion, charging, jumpProgress);

      // Update junction userData for gameplay reads.
      if (a.isHub) {
        a.group.userData.routeIndex = a.routeIndex;
      }
    }

    // Zone check per gate.
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

    const nav = ctx.world && ctx.world.nav;
    const nextHop = nav && Array.isArray(nav.path) && nav.path.length >= 2 ? nav.path[1] : null;
    const apJump = !!(
      nav && ctx.world.nav.autopilot === true
      && ctx.autopilot && ctx.autopilot.wantJump === true
      && near && near.to === nextHop
    );
    if (inZone && !ctx.flags.docked && !jumping && (ctx.input.dockPressed || apJump)) {
      ctx.emit('jumpRequested', { to: near.to });
    }

    if (
      nav && nav.autopilot === true
      && ctx.autopilot && ctx.autopilot.cycleHub === true
      && zoneHub
      && nextHop
      && zoneHub.to !== nextHop
      && !ctx.flags.docked
      && !ctx.flags.paused
      && !jumping
    ) {
      const routes = zoneHub.routes;
      zoneHub.routeIndex = (zoneHub.routeIndex + 1) % routes.length;
      zoneHub.to = routes[zoneHub.routeIndex];
      ctx.gate.nearTo = zoneHub.to;
    }

    // Jump overlay: fade in/out.
    if (jumping) {
      const p = ctx.gate.progress;
      const opacity = p < 0.4 ? p / 0.4 : p > 0.6 ? (1 - p) / 0.4 : 1;
      if (!overlayShown) {
        overlay.style.display = 'flex';
        overlayShown = true;
      }
      const fadeStep = Math.round(opacity * 32);
      if (fadeStep !== lastFadeStep) {
        lastFadeStep = fadeStep;
        overlay.style.opacity = (fadeStep / 32).toFixed(3);
      }
      if (ctx.gate.destination !== labelFor) {
        labelFor = ctx.gate.destination;
        const dest = SYSTEMS[labelFor];
        label.textContent = 'JUMP — ' + (dest ? dest.name : labelFor);
      }
    } else if (overlayShown || wasJumping) {
      overlay.style.display = 'none';
      overlay.style.opacity = (0).toFixed(3);
      overlayShown = false;
      lastFadeStep = -1;
      labelFor = null;
    }
    wasJumping = jumping;
  }

  return { update };
}

// =============================================================================
// MODELS BROWSER ENTRY POINT
// =============================================================================

/**
 * Standalone gate model builder for the Models Browser.
 * Returns an unparented gate assembly at the origin with visual update.
 * This is a thin wrapper that uses the same sculpt code as live gates.
 * @param {string} faction - Faction id (e.g., 'freehold', 'beautiful', 'lamplighter')
 * @param {Object} opts - { hub: boolean, routes: number }
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildGateModel(faction = 'independent', opts = {}) {
  const { hub = false, routes = 0 } = opts;
  const beautiful = isBeautiful(faction);

  // Build a synthetic gate def at the origin.
  const gateDef = { position: [0, 0, 0], to: null };

  // Build the assembly using the same builder as live gates.
  const a = buildAssembly(gateDef, faction, beautiful);
  a.group.name = `${faction}-gate`;

  // Add junction extras if hub option is set.
  if (hub && routes > 0) {
    a.isHub = true;
    a.routeIndex = 0;
    a.routes = Array.from({ length: routes }, (_, i) => `route${i}`);
    buildJunctionExtras(a, a.routes);
  }

  // Ensure the group is at the origin.
  a.group.position.set(0, 0, 0);
  a.group.rotation.set(0, 0, 0);

  // Create the update function (visual only, no gameplay).
  let prevElapsed = 0;
  function update(elapsed, reducedMotion) {
    const dt = prevElapsed === 0 ? 0.016 : Math.max(0, elapsed - prevElapsed);
    prevElapsed = elapsed;
    animateAssembly(a, elapsed, dt, reducedMotion, false, 0); // parked model: never charging
  }

  return {
    object: a.group,
    update,
    label: `${FACTIONS[faction]?.name ?? faction}${hub ? ' hub' : ''} gate`,
  };
}
