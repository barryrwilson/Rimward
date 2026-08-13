import { access, readdir, readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import {
  KHR_DF_TRANSFER_LINEAR, KHR_DF_TRANSFER_SRGB, KHR_SUPERCOMPRESSION_NONE, read as readKtx,
} from 'ktx-parse';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const shipRoot = join(root, 'public', 'assets', 'ships');
const sourceRoot = join(root, 'assets-source', 'ships');
const materialRoot = join(shipRoot, 'materials');
const factions = ['veridian', 'ferrous', 'freehold', 'redledger', 'gilded', 'beautiful', 'unknowables', 'assembly', 'congregation', 'lamplighter', 'independent', 'hollow'];
const classes = ['light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter'];
const roles = ['trader', 'pirate'];
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const failures = [];
let pngContentChecked = 0;
let glbContentChecked = 0;
const MAX_MATERIAL_SLOTS = 3;
const MAX_DRAW_CALLS = 3;
const MAX_TRIANGLES = { lod0: 60000, lod1: 24000, lod2: 8000, lod3: 4000 };

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function exists(path) {
  try {
    await access(path, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function validateTexture(faction, role, name) {
  const path = join(materialRoot, faction, role, `${name}.ktx2`);
  expect(await exists(path), `Missing texture ${relative(root, path)}`);
  if (!(await exists(path))) return;
  const texture = readKtx(new Uint8Array(await readFile(path)));
  expect(texture.levelCount > 0, `Texture has no mips ${relative(root, path)}`);
  expect(texture.pixelWidth > 0 && texture.pixelHeight > 0, `Texture has invalid dimensions ${relative(root, path)}`);
  const transfer = texture.dataFormatDescriptor[0]?.transferFunction;
  const expectedTransfer = name === 'basecolor' || name === 'emissive' ? KHR_DF_TRANSFER_SRGB : KHR_DF_TRANSFER_LINEAR;
  expect(transfer === expectedTransfer, `Texture transfer mismatch ${relative(root, path)}`);
  expect(texture.supercompressionScheme !== KHR_SUPERCOMPRESSION_NONE, `Texture has no supercompression ${relative(root, path)}`);
}

// Contract ranges for source PNG channel statistics (channels[0]=R,[1]=G,[2]=B).
// Emissive is allowed to be fully black (all emission may live in geometry), so no
// range assertions are made for it and the constant-image gate is skipped.
async function validateSourcePng(faction, role, name) {
  const pngPath = join(materialRoot, faction, role, `${name}.png`);
  if (!(await exists(pngPath))) return; // PNG is a build-time intermediate; absence is non-fatal
  const tag = `${relative(root, pngPath)}`;
  const image = sharp(pngPath);
  const { depth } = await image.metadata();
  // Blender writes float-buffer images as 16-bit PNG. Normalise every statistic to
  // the 0-255 scale the contract ranges are written in.
  const scale = depth === 'ushort' ? 257 : 1;
  const raw = (await image.stats()).channels;
  const channels = raw.map((ch) => ({ min: ch.min / scale, max: ch.max / scale, mean: ch.mean / scale }));
  // channels may include alpha; we only care about RGB (indices 0–2).
  const [r, g, b] = channels;
  if (name !== 'emissive') {
    // Constant-image gate: any channel with max === min means the whole image is flat.
    for (let i = 0; i < 3; i++) {
      const ch = channels[i];
      expect(ch.max > ch.min, `Constant channel ${i} (min=max=${ch.min}) in ${tag}`);
    }
  }
  if (name === 'basecolor') {
    for (let i = 0; i < 3; i++) {
      const ch = channels[i];
      expect(ch.mean >= 120 && ch.mean <= 245,
        `basecolor channel ${i} mean out of range (${ch.mean.toFixed(1)}) ${tag}`);
      expect(ch.max - ch.min >= 20,
        `basecolor channel ${i} lacks visible pattern (range ${ch.max - ch.min}) ${tag}`);
    }
  } else if (name === 'normal') {
    expect(b.mean > 200,
      `normal blue mean too low (${b.mean.toFixed(1)}) — map may be blank ${tag}`);
    expect(r.max > r.min, `normal R channel is constant in ${tag}`);
    expect(g.max > g.min, `normal G channel is constant in ${tag}`);
  } else if (name === 'orm') {
    expect(r.mean > 180,
      `orm R (occlusion) mean too low (${r.mean.toFixed(1)}) ${tag}`);
    expect(g.mean >= 120 && g.mean <= 200,
      `orm G (roughness) mean out of range (${g.mean.toFixed(1)}) ${tag}`);
    expect(b.mean < 70,
      `orm B (metalness) mean too high (${b.mean.toFixed(1)}) ${tag}`);
  }
  pngContentChecked++;
}

// Returns true when every vertex in the primitive shares the same COLOR_0 value for
// every colour component (R, G, B), indicating the attribute carries no information.
function isColorUniform(primitive) {
  const attr = primitive.getAttribute('COLOR_0');
  if (!attr) return false;
  const array = attr.getArray();
  if (!array || array.length === 0) return false;
  const stride = attr.getElementSize(); // 3 (RGB) or 4 (RGBA)
  const components = Math.min(stride, 3); // only RGB
  for (let c = 0; c < components; c++) {
    const first = array[c];
    for (let v = 1; v * stride + c < array.length; v++) {
      if (array[v * stride + c] !== first) return false;
    }
  }
  return true; // all vertices identical in every colour channel
}

// Returns the first out-of-range UV value found, or null if all are within [−tol, 1+tol].
// Quantised accessors store normalised integers, so read through getElement, which
// denormalises; reading the raw array would report 0..65535 for a valid 0..1 range.
function firstBadUv(primitive, tol = 0.01) {
  const attr = primitive.getAttribute('TEXCOORD_0');
  if (!attr) return null;
  const value = [];
  for (let i = 0; i < attr.getCount(); i++) {
    attr.getElement(i, value);
    if (value[0] < -tol || value[0] > 1 + tol || value[1] < -tol || value[1] > 1 + tol) {
      return `${value[0].toFixed(2)}, ${value[1].toFixed(2)}`;
    }
  }
  return null;
}

function primitiveTriangles(primitive) {
  if (primitive.getMode() !== 4) return 0;
  const indices = primitive.getIndices();
  return (indices ? indices.getCount() : primitive.getAttribute('POSITION')?.getCount() ?? 0) / 3;
}

async function validateModel(faction, classKey, lod) {
  const path = join(shipRoot, faction, classKey, `${lod}.glb`);
  expect(await exists(path), `Missing LOD ${relative(root, path)}`);
  if (!(await exists(path))) return;
  const document = await io.read(path);
  const documentRoot = document.getRoot();
  const nodes = documentRoot.listNodes();
  const materials = documentRoot.listMaterials();
  const materialNames = new Set(materials.map((material) => material.getName()));
  const rootNode = nodes.find((node) => node.getName() === 'RIMWARD_SHIP_ROOT');
  expect(Boolean(rootNode), `Missing ship root ${relative(root, path)}`);
  if (rootNode) expect(rootNode.getScale().every((value) => value === 1), `Non-unit root scale ${relative(root, path)}`);
  const engine = nodes.find((node) => node.getName() === 'RIMWARD_ENGINE_GLOW');
  expect(Boolean(engine), `Missing engine glow ${relative(root, path)}`);
  if (engine) expect(engine.getTranslation()[2] > 0, `Engine glow is not at stern ${relative(root, path)}`);
  expect(materialNames.has('RIMWARD_HULL'), `Missing hull slot ${relative(root, path)}`);
  expect(materialNames.has('RIMWARD_EMISSIVE'), `Missing emissive slot ${relative(root, path)}`);
  if (faction === 'unknowables') expect(materialNames.has('RIMWARD_FIELD'), `Missing Unknowables field slot ${relative(root, path)}`);
  const primitives = documentRoot.listMeshes().flatMap((mesh) => mesh.listPrimitives());
  expect(primitives.every((primitive) => primitive.getAttribute('COLOR_0')), `Missing vertex colors ${relative(root, path)}`);
  const triangleCount = primitives.reduce((total, primitive) => total + primitiveTriangles(primitive), 0);
  expect(primitives.length <= MAX_DRAW_CALLS, `Draw-call cap exceeded (${primitives.length}/${MAX_DRAW_CALLS}) ${relative(root, path)}`);
  expect(triangleCount <= MAX_TRIANGLES[lod], `Triangle cap exceeded (${triangleCount}/${MAX_TRIANGLES[lod]}) ${relative(root, path)}`);
  expect(materials.length <= MAX_MATERIAL_SLOTS, `Material-slot cap exceeded (${materials.length}/${MAX_MATERIAL_SLOTS}) ${relative(root, path)}`);
  // Content checks: hull COLOR_0 must not be uniform; all TEXCOORD_0 must be in [0,1].
  // unknowables/light is exempt: its hull geometry is anchor-only (a single semantic mass),
  // so a uniform panel colour is intentional. Print a visible note instead of failing.
  const hullPrimitives = primitives.filter((p) => p.getMaterial()?.getName() === 'RIMWARD_HULL');
  for (const prim of hullPrimitives) {
    if (faction === 'unknowables' && classKey === 'light') {
      if (isColorUniform(prim)) {
        console.log(`NOTE: Hull COLOR_0 is uniform (anchor-only hull, exempt) ${relative(root, path)}`);
      }
    } else {
      expect(!isColorUniform(prim), `Hull mesh COLOR_0 is uniform across all vertices ${relative(root, path)}`);
    }
  }
  for (const prim of primitives) {
    const bad = firstBadUv(prim);
    if (bad !== null) {
      expect(false, `TEXCOORD_0 out of range (${bad.toFixed(3)}) ${relative(root, path)}`);
    }
  }
  glbContentChecked++;
  const sourceMeshCount = documentRoot.listMeshes().length;
  expect(sourceMeshCount >= 2, `Missing hull or glow mesh ${relative(root, path)}`);
  const source = await readFile(path);
  expect(source.includes(Buffer.from('EXT_meshopt_compression')), `Missing Meshopt compression ${relative(root, path)}`);
  if ((faction === 'beautiful' || faction === 'unknowables') && lod === 'lod0') {
    expect(documentRoot.listAnimations().some((animation) => animation.getName() === 'idle'), `Missing idle clip ${relative(root, path)}`);
  }
}

for (const faction of factions) {
  for (const classKey of classes) {
    expect(await exists(join(sourceRoot, faction, `${classKey}.blend`)), `Missing source ${faction}/${classKey}.blend`);
    for (const lod of classKey === 'freighter' ? ['lod0', 'lod1', 'lod2', 'lod3'] : ['lod0', 'lod1', 'lod2']) {
      await validateModel(faction, classKey, lod);
    }
  }
    for (const role of roles) {
      for (const name of ['basecolor', 'normal', 'orm', 'emissive']) {
        await validateTexture(faction, role, name);
        await validateSourcePng(faction, role, name);
      }
    }
}

if (failures.length) {
  console.error(`Ship asset validation failed with ${failures.length} error(s).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: 72 source assets, 228 Meshopt LOD GLBs, 24 KTX2 PBR atlas sets, ${pngContentChecked} PNG content checks, and ${glbContentChecked} GLB content checks.`);
}
