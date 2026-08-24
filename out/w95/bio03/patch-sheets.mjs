import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync(new URL('./stills/', import.meta.url), { recursive: true });

function patch(src, dest) {
  let s = readFileSync(src, 'utf8');
  s = s.replaceAll("from '../src/", "from '../../../src/");
  s = s.replaceAll("from './raster.mjs'", "from '../../../scripts/raster.mjs'");
  s = s.replaceAll('out/silhouettes', 'out/w95/bio03/stills');
  s = s.replaceAll("new URL('../public/assets/ships/'", "new URL('../../../public/assets/ships/'");
  writeFileSync(dest, s);
}

patch('scripts/ship-render.mjs', 'out/w95/bio03/_ship-render.mjs');
patch('scripts/silhouette-sheet.mjs', 'out/w95/bio03/_silhouette-sheet.mjs');
console.log('patched');
