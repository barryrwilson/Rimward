// Headless BIO-01 gift + pirate helper probe (Wave 92).
import { register } from 'node:module';

register(new URL('./css-register.mjs', import.meta.url));

const { createShipState } = await import('../../../src/game/state.js');
const { grantLivingSeedRow, HANGAR_CAP, sanitizeHangarRecord } = await import('../../../src/game/hangar.js');
const {
  grantSwornGift,
  maybeGrantPirateSeed,
  giftNoticeFor,
  PIRATE_SEED_DROP_RATE,
  GIFT_HULL_ID,
  GIFT_OK_LINE,
  GIFT_FULL_LINE,
  GIFT_ALREADY_LINE,
  GIFT_NO_LINE,
  PIRATE_OK_LINE,
} = await import('../../../src/game/bio-seed.js');

function ctxOf(faction, extra = {}) {
  const player = createShipState('light', { name: 'Probe' });
  player.hullKind = 'living';
  const hulls = extra.hulls ?? [{
    id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: 'independent', name: 'She',
  }];
  const lines = [];
  return {
    flags: { docked: extra.docked !== false },
    world: {
      currentSystem: 'probe',
      credits: 9000,
      reputation: { [faction]: extra.rep ?? 50 },
      hangar: { mountedId: hulls[0].id, hulls },
    },
    systems: { probe: { faction } },
    cargo: [],
    cargoCapacity: 20,
    player,
    ship: { object: { position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] } } },
    emit(type, payload) { if (type === 'commLine') lines.push(payload); },
    lines,
  };
}

function fill(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i === 0 ? 'hull_starter' : `hull_fill_${i}`,
    hullKind: 'living', classKey: 'light', faction: 'independent', name: 'Fill',
  }));
}

const pirateLive = () => ({
  record: { faction: 'beautiful' },
  state: { faction: 'beautiful' },
  ai: { lastAttacker: 'player' },
  role: 'trader',
});

const fails = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'ok' : 'FAIL'} ${name}`);
}

const g = ctxOf('beautiful');
const mounted = g.world.hangar.mountedId;
const kind = g.player.hullKind;
const res = grantSwornGift(g);
const row = g.world.hangar.hulls.find((h) => h.id === GIFT_HULL_ID);
ok('gift.ok', res.ok === true && giftNoticeFor(res) === GIFT_OK_LINE);
ok('gift.row', row?.hullKind === 'living' && row?.classKey === 'light' && row?.faction === 'beautiful');
ok('gift.nograft', row && !Object.prototype.hasOwnProperty.call(row, 'grafted'));
ok('gift.noremount', g.world.hangar.mountedId === mounted && g.player.hullKind === kind);
ok('gift.price0', g.world.credits === 9000);

const already = grantSwornGift(g);
ok('gift.already', already.reason === 'already' && giftNoticeFor(already) === GIFT_ALREADY_LINE
  && g.world.hangar.hulls.filter((h) => h.id === GIFT_HULL_ID).length === 1);

const full = ctxOf('beautiful', { hulls: fill(HANGAR_CAP) });
const ids = full.world.hangar.hulls.map((h) => h.id).join(',');
const fullRes = grantSwornGift(full);
ok('gift.full', fullRes.reason === 'full' && giftNoticeFor(fullRes) === GIFT_FULL_LINE
  && full.world.hangar.hulls.map((h) => h.id).join(',') === ids);

ok('gift.rank', grantSwornGift(ctxOf('beautiful', { rep: 10 })).reason === 'denied'
  && giftNoticeFor(grantSwornGift(ctxOf('beautiful', { rep: 10 }))) === GIFT_NO_LINE);
ok('gift.banner', grantSwornGift(ctxOf('freehold', { rep: 80 })).reason === 'denied');
ok('gift.hostile', grantSwornGift(ctxOf('beautiful', { rep: -5 })).reason === 'denied');

const p = ctxOf('beautiful');
const pRes = maybeGrantPirateSeed(p, pirateLive(), { rng: () => 0 });
const pRow = p.world.hangar.hulls.find((h) => String(h.id).startsWith('hull_seed_pirate_'));
ok('pirate.ok', pRes.ok === true && pRow?.hullKind === 'living' && pRow?.id !== GIFT_HULL_ID);
ok('pirate.line', p.lines.some((l) => l.text === PIRATE_OK_LINE && l.from === 'echo'));
ok('pirate.noremount', p.world.hangar.mountedId === 'hull_starter');

const miss = ctxOf('beautiful');
ok('pirate.miss', maybeGrantPirateSeed(miss, pirateLive(), { rng: () => 1 }).reason === 'silent'
  && miss.world.hangar.hulls.length === 1 && miss.lines.length === 0);

const pf = ctxOf('beautiful', { hulls: fill(HANGAR_CAP) });
const pfIds = pf.world.hangar.hulls.map((h) => h.id).join(',');
const pfRes = maybeGrantPirateSeed(pf, pirateLive(), { rng: () => 0 });
ok('pirate.full', pfRes.reason === 'full' && pf.lines.some((l) => l.text === GIFT_FULL_LINE)
  && pf.world.hangar.hulls.map((h) => h.id).join(',') === pfIds && pf.cargo.length === 0);

ok('rate', PIRATE_SEED_DROP_RATE === 0.05);
ok('proto', grantLivingSeedRow(ctxOf('beautiful'), { id: '__proto__' }).ok === false);
const healed = sanitizeHangarRecord({
  id: GIFT_HULL_ID, hullKind: 'living', grafted: true, classKey: 'light', faction: 'beautiful',
});
ok('graft-drop', healed?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(healed, 'grafted'));

if (fails.length) {
  console.log('PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
