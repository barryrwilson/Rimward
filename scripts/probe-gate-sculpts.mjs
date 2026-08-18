import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { SYSTEMS } from '../src/game/state.js';
import { initGate } from '../src/systems/gate.js';

function makeEl() {
  return {
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, contains() { return false; } },
    children: [],
    appendChild() {},
    addEventListener() {},
    setAttribute() {},
    getContext() {
      return { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {}, fill() {} };
    },
  };
}
const body = { appendChild() {}, children: [] };
globalThis.document = {
  createElement: () => makeEl(),
  body,
  documentElement: { style: {} },
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const reps = {
  freehold: 'fh_hearth', veridian: 'vd_survey', ferrous: 'fx_liron', redledger: 'rl_toll',
  gilded: 'gc_gavel', congregation: 'cg_vigil', assembly: 'as_census', lamplighter: 'lastbeacon',
};
const out = {};
for (const [f, sysId] of Object.entries(reps)) {
  const scene = new THREE.Scene();
  const ctx = createCtx({
    scene,
    camera: new THREE.PerspectiveCamera(),
    renderer: { domElement: makeEl(), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} },
  });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = sysId;
  initGate(ctx);
  const gates = [];
  scene.traverse((o) => {
    if (typeof o.name === 'string' && /-(gate)$/.test(o.name)) gates.push(o);
  });
  let verts = 0;
  gates[0]?.traverse((o) => {
    if (o.isMesh) verts += o.geometry?.attributes?.position?.count ?? 0;
  });
  out[f] = {
    expect: SYSTEMS[sysId].gates.length,
    found: gates.length,
    names: gates.map((g) => g.name),
    verts,
    faction: SYSTEMS[sysId].faction,
  };
}
console.log(JSON.stringify(out, null, 2));
