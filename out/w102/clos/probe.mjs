/** WAVE102 CLOS helper probe (no jsdom). */
import { losCloseRate } from '../../../src/game/los-close.js';

const from = { x: 0, y: 0, z: 0 };
const tgt = { x: 0, y: 0, z: 100 };
const approach = losCloseRate(from, tgt, { x: 0, y: 0, z: -12 });
const recede = losCloseRate(from, tgt, { x: 0, y: 0, z: 9 });
const perp = losCloseRate(from, tgt, { x: 5, y: 0, z: 0 });
const eps = losCloseRate(from, { x: 0, y: 0, z: 0.01 }, { x: 0, y: 0, z: 40 });
const fail = losCloseRate(null, tgt, { x: 0, y: 0, z: -4 }) === 0
  && losCloseRate(from, from, { x: 0, y: 0, z: -40 }) === 0;
const pins = {
  helperSign: approach < 0 && recede > 0 && Math.round(approach) === -12 && Math.round(recede) === 9,
  helperEps: perp === 0 && eps === 0,
  helperFailClosed: fail,
};
console.log('wave102 probe:', JSON.stringify({ approach, recede, perp, eps, pins }));
if (!Object.values(pins).every(Boolean)) process.exit(1);
