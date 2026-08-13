import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const assetsRoot = fileURLToPath(new URL('../public/assets/ships/', import.meta.url));
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready;

async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const children = await Promise.all(entries.map((entry) => {
    const target = join(path, entry.name);
    return entry.isDirectory() ? files(target) : Promise.resolve(entry.name.endsWith('.glb') ? [target] : []);
  }));
  return children.flat();
}

// Optional positional arguments narrow the run to path prefixes under
// public/assets/ships ('freehold', 'freehold/cutter'), so a single re-authored
// class can be delivered without rewriting all 228 LOD files.
const wanted = process.argv.slice(2).map((arg) => arg.replaceAll('\\', '/'));
const all = await files(assetsRoot);
const paths = wanted.length === 0
  ? all
  : all.filter((path) => {
    const key = relative(assetsRoot, path).replaceAll('\\', '/');
    return wanted.some((prefix) => key === prefix || key.startsWith(`${prefix}/`));
  });
for (const path of paths) {
  const document = await io.read(path);
  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await io.write(path, document);
}
console.log(`Meshopt-compressed ${paths.length} ship LOD files.`);
