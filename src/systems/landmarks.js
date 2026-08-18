import * as THREE from 'three';
import { CONVERGENCE, DEEPENING } from '../game/state.js';
import { isBeautiful } from './organic.js';
import {
  EMPTY, createSession, helpersFor, disposeSession, applyDim, tickSession,
} from './landmarks/kit.js';
import { buildKind, glazeKind } from './landmarks/kinds.js';
import { AUTHORED } from './landmarks/authored.js';

/**
 * Authored landmarks + clue motes — per-system points of interest from
 * SYSTEMS[id].landmarks / SYSTEMS[id].clues (§15.3 system identity, §25
 * mystery). Wrecks, beacons, monuments, and anomalies give each system a
 * silhouette worth travelling toward; clue motes are small dim shards
 * found by proximity, not by UI.
 *
 * Wave 5: per-system rebuild, mirroring solarsystem.js. On ctx.lastEvents
 * 'systemLoaded' { to } the previous group is removed, its per-build
 * materials disposed, and a new group is constructed from SYSTEMS[to].
 *
 * Wave 27: beautiful-faction systems glaze the four kinds. Mystery sites
 * stay unglazed.
 *
 * Landmark redesign: kind kit, glaze lifts, and unique authored heroes live
 * in landmarks/kinds.js and landmarks/authored.js. This module owns scene
 * lifecycle, discovery dimming, and the public browser builder.
 */

function dispatchLandmark(def, h, { faction, beautiful, forceKind } = {}) {
  const kind = forceKind || def.kind;
  const fac = faction ?? def.faction ?? 'independent';
  if (AUTHORED[def.id]) return AUTHORED[def.id](def, h);
  if (beautiful && kind !== 'clue') {
    const glazed = glazeKind(kind, def, h);
    if (glazed) return glazed;
  }
  return buildKind(kind, def, h, fac);
}

export function initLandmarks(ctx) {
  let group = null;
  let session = null;
  let lastFound = -1;
  let lastVisited = -1;
  let lastMystery = null;
  let lastHinted = false;
  let lastConverged = false;
  let lastDeepHinted = false;
  let lastDeepened = false;

  function build(systemId) {
    const def = ctx.systems?.[systemId];
    group = new THREE.Group();
    group.name = 'landmarks';
    ctx.scene.add(group);
    session = createSession();
    const h = helpersFor(session);

    const mystery = ctx.world.mystery ?? null;
    const found = mystery?.found ?? EMPTY;
    const visited = mystery?.visited ?? EMPTY;
    lastFound = found.length;
    lastVisited = visited.length;
    lastMystery = mystery;
    lastHinted = !!mystery?.convergeHinted;
    lastConverged = !!mystery?.converged;
    lastDeepHinted = !!mystery?.deepHinted;
    lastDeepened = !!mystery?.deepened;
    if (!def) return;

    const landmarks = def.landmarks ?? EMPTY;
    const beautiful = isBeautiful(def.faction);
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const obj = dispatchLandmark(lm, h, { faction: def.faction, beautiful });
      if (!obj) continue;
      obj.position.fromArray(lm.position);
      group.add(obj);
      applyDim(session.dimmables[session.dimmables.length - 1], visited.includes(lm.id));
    }

    const clues = def.clues ?? EMPTY;
    for (let i = 0; i < clues.length; i++) {
      const cl = clues[i];
      const mote = dispatchLandmark({ ...cl, kind: 'clue' }, h, { faction: def.faction, beautiful: false });
      mote.position.fromArray(cl.position);
      group.add(mote);
      applyDim(session.dimmables[session.dimmables.length - 1], found.includes(cl.id));
    }

    if (systemId === CONVERGENCE.site.system && lastHinted) {
      const site = dispatchLandmark(CONVERGENCE.site, h, { faction: def.faction, beautiful: false });
      site.position.fromArray(CONVERGENCE.site.position);
      group.add(site);
      const d = session.dimmables[session.dimmables.length - 1];
      d.list = 'converged';
      applyDim(d, lastConverged);
    }

    if (systemId === DEEPENING.site.system && lastDeepHinted) {
      const site = dispatchLandmark(DEEPENING.site, h, { faction: def.faction, beautiful: false });
      site.position.fromArray(DEEPENING.site.position);
      group.add(site);
      const d = session.dimmables[session.dimmables.length - 1];
      d.list = 'deepened';
      applyDim(d, lastDeepened);
    }
  }

  function dispose() {
    if (!group) return;
    ctx.scene.remove(group);
    disposeSession(session);
    session = null;
    group = null;
  }

  function rebuild(to) {
    dispose();
    build(to);
  }

  function update(_dt) {
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      const ev = ctx.lastEvents[i];
      if (ev.type === 'systemLoaded') {
        rebuild(ev.to);
        break;
      }
    }

    const mystery = ctx.world.mystery ?? null;
    if (mystery && session) {
      const found = mystery.found ?? EMPTY;
      const visited = mystery.visited ?? EMPTY;
      const hinted = !!mystery.convergeHinted;
      const converged = !!mystery.converged;
      const deepHinted = !!mystery.deepHinted;
      const deepened = !!mystery.deepened;
      if (hinted !== lastHinted || deepHinted !== lastDeepHinted) {
        rebuild(ctx.world.currentSystem);
      } else if (mystery !== lastMystery || found.length !== lastFound
        || visited.length !== lastVisited || converged !== lastConverged
        || deepened !== lastDeepened) {
        lastMystery = mystery;
        lastFound = found.length;
        lastVisited = visited.length;
        lastConverged = converged;
        lastDeepened = deepened;
        for (let i = 0; i < session.dimmables.length; i++) {
          const d = session.dimmables[i];
          if (d.list === 'converged') { applyDim(d, converged); continue; }
          if (d.list === 'deepened') { applyDim(d, deepened); continue; }
          const list = d.list === 'found' ? found : visited;
          applyDim(d, list.includes(d.id));
        }
      }
    }

    if (session) {
      tickSession(session, ctx.elapsed, ctx.settings.reducedMotion);
    }
  }

  build(ctx.world.currentSystem);

  return { update };
}

/**
 * Standalone landmark model builder for the models browser.
 *
 * @param {string} kind
 * @param {string} [faction]
 * @param {string} [authoredId]
 */
export function buildLandmarkModel(kind, faction = 'independent', authoredId = null) {
  const id = authoredId || `model-${kind}-${faction}`;
  const def = { id, position: [0, 0, 0], faction, kind };
  const beautiful = isBeautiful(faction) && !authoredId;
  const session = createSession();
  const h = helpersFor(session);
  const object = dispatchLandmark(def, h, { faction, beautiful, forceKind: kind });
  object.position.set(0, 0, 0);

  const labels = {
    wreck: 'Wreck', beacon: 'Beacon', monument: 'Monument',
    anomaly: 'Anomaly', clue: 'Clue mote',
  };

  function update(elapsed, reducedMotion) {
    tickSession(session, elapsed, reducedMotion);
  }

  return { object, update, label: labels[kind] || 'Landmark' };
}
