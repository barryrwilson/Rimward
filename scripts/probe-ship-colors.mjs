/**
 * Report COLOR_0 usage per material slot in a delivered ship GLB.
 *
 * Usage: node scripts/probe-ship-colors.mjs <faction> <class> [lod]
 * Prints each mesh primitive, its material, vertex count, bounding size, and
 * the dominant vertex colours as sRGB hex with share percentages. Use it to
 * check that authored palette roles survived export, and that emissive parts
 * are small relative to the hull.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const [faction = 'ferrous', classKey = 'light', lod = 'lod0'] = process.argv.slice(2);
const path = `public/assets/ships/${faction}/${classKey}/${lod}.glb`;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

const document = await io.read(path);
const linearToSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const hex = (r, g, b) => '#' + [r, g, b]
  .map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('');

console.log(`== ${path}`);
for (const mesh of document.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const color = primitive.getAttribute('COLOR_0');
    const material = primitive.getMaterial()?.getName() ?? '(none)';
    const min = position.getMin([]);
    const max = position.getMax([]);
    const size = max.map((v, i) => (v - min[i]).toFixed(2)).join(' x ');
    const tally = new Map();
    if (color) {
      const value = [];
      for (let i = 0; i < color.getCount(); i++) {
        color.getElement(i, value);
        const key = hex(linearToSrgb(value[0]), linearToSrgb(value[1]), linearToSrgb(value[2]));
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, n]) => `${k} ${(100 * n / color.getCount()).toFixed(0)}%`).join('  ');
    console.log(`${mesh.getName() || '(mesh)'} [${material}] verts=${position.getCount()} size=${size}`);
    console.log(`   ${color ? top : 'NO COLOR_0'}`);
  }
}
