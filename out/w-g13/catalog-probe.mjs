// Isolated G13 catalog pin (verifier). Does not change project source.
import * as THREE from 'three';

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
globalThis.document = {
  createElement: () => makeEl(),
  body: { appendChild() {}, children: [] },
  documentElement: { style: {} },
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const { GATE_REBUILD_ORDER } = await import('../../src/game/gate-scale.js');
const { buildGateModel } = await import('../../src/systems/gate.js');

const report = {
  factionCount: GATE_REBUILD_ORDER.length,
  allNamed: true,
  hasHullMesh: true,
  noOverlayChild: true,
  factions: {},
};

for (const f of GATE_REBUILD_ORDER) {
  const { object } = buildGateModel(f);
  const named = object.name === `${f}-gate`;
  const overlayKids = object.children.filter((c) => c.name?.endsWith('-overlay')).map((c) => c.name);
  let verts = 0;
  let meshCount = 0;
  object.traverse((o) => {
    if (o.isMesh) {
      meshCount++;
      verts += o.geometry?.attributes?.position?.count ?? 0;
    }
  });
  const hullOk = meshCount >= 1 && verts > 500;
  if (!named) report.allNamed = false;
  if (overlayKids.length) report.noOverlayChild = false;
  if (!hullOk) report.hasHullMesh = false;
  report.factions[f] = { name: object.name, named, meshCount, verts, hullOk, overlayKids };
}

const pass = report.allNamed && report.hasHullMesh && report.noOverlayChild
  && report.factionCount === 12;
console.log(JSON.stringify({ pass, ...report }, null, 2));
process.exit(pass ? 0 : 1);
