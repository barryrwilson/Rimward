import { readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';

const materialsRoot = fileURLToPath(new URL('../../../public/assets/ships/materials/beautiful/', import.meta.url));
const textureNames = ['basecolor', 'normal', 'orm', 'emissive'];

async function decoder(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

async function encode(path, name) {
  const source = join(path, `${name}.png`);
  const target = join(path, `${name}.ktx2`);
  const encoded = await encodeToKTX2(new Uint8Array(await readFile(source)), {
    imageDecoder: decoder,
    isKTX2File: true,
    isUASTC: true,
    needSupercompression: true,
    uastcLDRQualityLevel: 2,
    generateMipmap: true,
    isNormalMap: name === 'normal',
    isPerceptual: name === 'basecolor' || name === 'emissive',
    isSetKTX2SRGBTransferFunc: name === 'basecolor' || name === 'emissive',
  });
  const temporary = `${target}.tmp`;
  await writeFile(temporary, encoded);
  await rename(temporary, target);
}

let count = 0;
for (const role of ['trader', 'pirate']) {
  const path = join(materialsRoot, role);
  for (const name of textureNames) {
    await encode(path, name);
    count += 1;
  }
}
console.log(`Encoded ${count} KTX2 beautiful atlas maps.`);
