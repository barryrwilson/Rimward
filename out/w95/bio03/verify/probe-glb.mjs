/**
 * BIO-03 verify: GLB URI scan, glow node, wave8-keep hash compare.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const root = fileURLToPath(new URL('../../../..', import.meta.url));
const publicRoot = join(root, 'public', 'assets', 'ships', 'beautiful');
const keepRoot = join(root, 'out', 'w95', 'bio03', 'wave8-keep', 'ships');
const classes = ['light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter'];
const lines = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  lines.push(line);
  console.log(line);
};

function parseGlbJson(buf) {
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

function collectUris(obj, acc = []) {
  if (!obj || typeof obj !== 'object') return acc;
  if (Array.isArray(obj)) {
    for (const item of obj) collectUris(item, acc);
    return acc;
  }
  if (typeof obj.uri === 'string') acc.push(obj.uri);
  for (const v of Object.values(obj)) collectUris(v, acc);
  return acc;
}

async function loadScene(path) {
  const data = await readFile(path);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader.parseAsync(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
  );
}

function sha(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

const remote = [];
const glowRows = [];
const hashRows = [];

for (const ck of classes) {
  const lods = ck === 'freighter' ? ['lod0', 'lod1', 'lod2', 'lod3'] : ['lod0', 'lod1', 'lod2'];
  for (const lod of lods) {
    const path = join(publicRoot, ck, `${lod}.glb`);
    const buf = await readFile(path);
    const json = parseGlbJson(buf);
    const uris = collectUris(json);
    const bad = uris.filter((u) => /^(https?:|file:|\/{2})/i.test(u) || u.includes('://'));
    if (bad.length) remote.push({ ck, lod, bad });
    say(`${ck}/${lod} uris=${uris.length} remote=${bad.length} ${bad.join(',')}`);

    if (lod === 'lod0') {
      const gltf = await loadScene(path);
      let glowNode = null;
      gltf.scene.traverse((n) => {
        if (n.name === 'RIMWARD_ENGINE_GLOW') glowNode = n;
      });
      let meshCount = 0;
      glowNode?.traverse((n) => { if (n.isMesh) meshCount += 1; });
      glowRows.push({
        ck,
        glowName: glowNode?.name || null,
        glowType: glowNode?.type || null,
        isMesh: !!glowNode?.isMesh,
        meshCount,
      });
      say(`glow ${ck} type=${glowNode?.type} isMesh=${!!glowNode?.isMesh} childMeshes=${meshCount}`);
    }

    const keepPath = join(keepRoot, ck, `${lod}.glb`);
    try {
      const keep = await readFile(keepPath);
      const same = sha(buf) === sha(keep);
      hashRows.push({ ck, lod, public: sha(buf), keep: sha(keep), same });
      say(`hash ${ck}/${lod} public=${sha(buf)} keep=${sha(keep)} same=${same}`);
    } catch {
      hashRows.push({ ck, lod, public: sha(buf), keep: null, same: false });
      say(`hash ${ck}/${lod} KEEP MISSING`);
    }
  }
}

say(`REMOTE_COUNT ${remote.length}`);
say(`WAVE8_RESTORED ${hashRows.filter((r) => r.same).length}/${hashRows.length}`);

const out = { remote, glowRows, hashRows };
await writeFile(new URL('./probe-glb.json', import.meta.url), JSON.stringify(out, null, 2));
await writeFile(new URL('./probe-glb.txt', import.meta.url), lines.join('\n') + '\n');
