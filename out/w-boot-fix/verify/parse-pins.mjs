import { readFileSync } from 'fs';
const t = readFileSync(new URL('./boot.txt', import.meta.url), 'utf8');
const keys = [
  'wave4 fence favor',
  'wave26 ferry quote',
  'wave26 haul quote',
  'wave26 lane delivery',
  'wave35a delivery',
  'wave80 rep04',
  'wave92 bio01',
  'wave92 bio02',
  'wave85 nav guidance',
];
for (const k of keys) {
  const re = new RegExp('^' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': (\\{.*\\})', 'm');
  const m = t.match(re);
  if (!m) {
    console.log('MISSING ' + k);
    continue;
  }
  const o = JSON.parse(m[1]);
  const bad = Object.entries(o).filter(([, v]) => v !== true);
  console.log(
    (bad.length ? 'NOT ALL TRUE' : 'ALL TRUE') +
      ' ' +
      k +
      ' n=' +
      Object.keys(o).length +
      (bad.length ? ' falses=' + JSON.stringify(Object.fromEntries(bad)) : '')
  );
}
const fails = t.split(/\r?\n/).filter((l) => l.includes('FAIL'));
console.log('FAIL_COUNT_LINES=' + fails.length);
for (const l of fails) console.log(l);
