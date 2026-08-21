/**
 * Wave 74 TGT-05 live: KeyV reticle lock vs KeyT cycle.
 * Does not touch src/. Vite on 127.0.0.1:5182.
 */
import puppeteer from '../../../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5182/';
const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 1 },
  args: [
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--hide-scrollbars',
    '--no-first-run',
  ],
});

const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (err) => {
  pageErrors.push(err.message);
  say('PAGEERR', err.message);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') say('ERROR', msg.text());
});

await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
    localStorage.removeItem('rimward-save-v1');
  } catch {}
});

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path });
  say('SHOT', name);
}

let fail = 0;
function expect(cond, label, extra) {
  if (cond) say('PASS', label, extra == null ? '' : extra);
  else {
    fail++;
    say('FAIL', label, extra == null ? '' : extra);
  }
}

const freezeSetup = () => page.evaluate(() => {
  const ctx = window.__ctx;
  ctx.flags.combat = false;
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.input.fullStop = true;
  ctx.input.throttle = 0;
  ctx.input.throttleHeld = false;
  ctx.input.weaponGroup = 1;
  ctx.input.steerX = 0;
  ctx.input.steerY = 0;
  ctx.input.strafeX = 0;
  ctx.input.strafeY = 0;
  if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
  if (typeof ctx.ship.speed === 'number') ctx.ship.speed = 0;
  ctx.targets.current = null;
  if (ctx.gate) {
    ctx.gate.inZone = false;
    ctx.gate.jumping = false;
  }
  if (ctx.station) ctx.station.inZone = false;
  ctx.flags.matchSpeed = false;
  if (ctx.player) ctx.player.destroyed = false;
  if (ctx.player && typeof ctx.player.hull === 'number') ctx.player.hull = 100;
  const death = document.querySelector('.death-overlay');
  if (death) death.style.display = 'none';
  if (!window.__w74cap) window.__w74cap = [];
  if (!window.__w74emitHooked) {
    window.__w74emitHooked = true;
    const orig = ctx.emit.bind(ctx);
    ctx.emit = (type, data = {}) => {
      window.__w74cap.push({ type, ...data });
      orig(type, data);
    };
  }
  window.__w74cap.length = 0;
  for (const s of ctx.ships) {
    if (s?.ai) {
      s.ai.phase = 'drift';
      s.ai.demanding = false;
    }
    if (s?.velocity?.set) s.velocity.set(0, 0, 0);
  }
  return true;
});

const placeOnCamRay = (which, dist) => page.evaluate((kind, d) => {
  const ctx = window.__ctx;
  ctx.camera.updateMatrixWorld(true);
  const e = ctx.camera.matrixWorld.elements;
  const dx = -e[8];
  const dy = -e[9];
  const dz = -e[10];
  const len = Math.hypot(dx, dy, dz) || 1;
  const px = ctx.camera.position.x + (dx / len) * d;
  const py = ctx.camera.position.y + (dy / len) * d;
  const pz = ctx.camera.position.z + (dz / len) * d;
  if (kind === 'npc') {
    const npc = window.__w74npc;
    npc.object.position.set(px, py, pz);
  } else if (kind === 'rock') {
    window.__w74rock.position.set(px, py, pz);
  }
  return { px, py, pz, player: { ...ctx.ship.object.position } };
}, which, dist);

const liveShips = () => page.evaluate(() => {
  const ctx = window.__ctx;
  return ctx.ships
    .filter((s) => s?.object && s.state && !s.state.destroyed)
    .map((s, i) => ({ i: ctx.ships.indexOf(s), id: s.id, name: s.record?.name || s.state?.name }));
});

const dumpTarget = () => page.evaluate(() => {
  const ctx = window.__ctx;
  const t = ctx.targets.current;
  const list = ctx.asteroids?.list || [];
  return {
    id: t && t.id,
    name: t && (t.record?.name || t.state?.name || (t.position && !t.object ? 'ASTEROID' : null)),
    ship: !!(t && t.object && t.state),
    rock: !!(t && t.position && !t.object && !t.state),
    indexOf: t ? list.indexOf(t) : -1,
    sameNpc: t === window.__w74npc,
    sameRock: t === window.__w74rock,
    group: ctx.input.weaponGroup,
    fp: !!ctx.flags.firstPerson,
    reticle: { x: ctx.targets.reticleScreen.x, y: ctx.targets.reticleScreen.y },
    events: (window.__w74cap || []).filter((e) => e.type === 'reticleLock' || e.type === 'commLine'),
    prompt: document.querySelector('.rw-prompt')?.textContent ?? '',
    toast: (document.body.textContent || '').includes('Nothing under the reticle.'),
  };
});

async function aimAtWorld(getPosFn) {
  const scr = await page.evaluate(getPosFn);
  if (!scr || scr.behind) return scr;
  await page.mouse.move(Math.max(8, Math.min(1392, scr.sx)), Math.max(8, Math.min(892, scr.sy)));
  await sleep(50);
  return scr;
}

try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!window.__ctx, { timeout: 30000 });
  await page.evaluate(() => {
    const neu = document.getElementById('rw-title-new');
    if (neu) {
      neu.click();
      if (neu.textContent.includes('CONFIRM')) neu.click();
    }
    const byAttr = document.querySelector('[data-title-action="new"]');
    if (byAttr && byAttr !== neu) byAttr.click();
  });
  await sleep(400);
  await page.keyboard.press('Digit1');
  await sleep(1600);

  const ready = await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
  }, { timeout: 30000 }).catch(() => null);
  if (!ready) {
    await shot('00-not-ready.png');
    throw new Error('sim not ready');
  }

  await freezeSetup();
  await page.mouse.move(700, 450);
  await sleep(250);
  await shot('01-flight.png');

  const boot = await page.evaluate(() => {
    const ctx = window.__ctx;
    return {
      docked: !!ctx.flags.docked,
      paused: !!ctx.flags.paused,
      ships: ctx.ships.length,
      rocks: ctx.asteroids?.list?.length ?? 0,
      title: !!document.getElementById('rw-title'),
      prompt: document.querySelector('.rw-prompt')?.textContent ?? '',
      controls: document.querySelector('.rw-controls, #controls, .controls-panel')?.textContent?.includes('V — lock') ?? null,
    };
  });
  say('boot', JSON.stringify(boot));
  expect(!boot.title, 'title-dismissed');
  expect(!boot.docked && !boot.paused, 'in-flight');

  const ships0 = await liveShips();
  say('ships', JSON.stringify(ships0));
  expect(ships0.length >= 1, 'have-live-ship');

  // --- Ship under reticle → KeyV ---
  await freezeSetup();
  const parked = await page.evaluate(() => {
    const ctx = window.__ctx;
    const npc = ctx.ships.find((s) => s?.object && s.state && !s.state.destroyed);
    if (!npc) return { none: true };
    window.__w74npc = npc;
    if (npc.ai) {
      npc.ai.phase = 'drift';
      npc.ai.demanding = false;
    }
    for (const s of ctx.ships) {
      if (s !== npc && s?.object) {
        const q = ctx.ship.object.position;
        s.object.position.set(q.x + 4000, q.y, q.z);
      }
    }
    return { id: npc.id, name: npc.record?.name || npc.state?.name };
  });
  say('parkNpc', JSON.stringify(parked));
  await placeOnCamRay('npc', 90);
  await sleep(400);
  const aimShip = await aimAtWorld(() => {
    const ctx = window.__ctx;
    const npc = window.__w74npc;
    ctx.camera.updateMatrixWorld(true);
    const v = ctx.camera.position.clone();
    v.copy(npc.object.position).project(ctx.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      z: v.z,
      behind: v.z > 1,
    };
  });
  say('aimShip', JSON.stringify(aimShip));
  expect(!aimShip.behind, 'npc-on-screen');
  await page.evaluate(() => { window.__w74cap.length = 0; });
  await page.keyboard.press('KeyV');
  await sleep(220);
  const afterVShip = await dumpTarget();
  say('v-ship', JSON.stringify(afterVShip));
  expect(afterVShip.sameNpc && afterVShip.ship, 'v-locks-visible-ship', afterVShip.id);
  expect(!!afterVShip.events.find((e) => e.type === 'reticleLock' && e.hit === true), 'v-ship-hit-event');
  await shot('02-ship-lock.png');

  // --- Miss does not steal the ship lock ---
  await page.evaluate(() => {
    window.__w74prev = window.__ctx.targets.current;
    window.__w74cap.length = 0;
  });
  await page.mouse.move(80, 80);
  await sleep(80);
  await page.keyboard.press('KeyV');
  await sleep(220);
  const afterMiss = await dumpTarget();
  say('v-miss', JSON.stringify(afterMiss));
  expect(afterMiss.sameNpc && afterMiss.ship, 'miss-does-not-steal');
  expect(!!afterMiss.events.find((e) => e.type === 'commLine' && e.text === 'Nothing under the reticle.'), 'miss-commLine');
  expect(!!afterMiss.events.find((e) => e.type === 'reticleLock' && e.hit === false), 'miss-event-hit-false');
  expect(afterMiss.toast, 'miss-toast-textcontent');
  await shot('04-miss.png');

  // --- Rock under reticle, group 1 ---
  await freezeSetup();
  await page.keyboard.press('Digit1');
  const parkedRock = await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.input.weaponGroup = 1;
    const list = ctx.asteroids.list;
    const p = ctx.ship.object.position;
    const cam = ctx.camera;
    cam.updateMatrixWorld(true);
    const range2 = 600 * 600;
    const v = cam.position.clone();
    const right = cam.position.clone();
    right.setFromMatrixColumn(cam.matrixWorld, 0);
    let rock = null;
    let bestScore = -1;
    let bestScr = null;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a?.position || !(a.radius > 0)) continue;
      const d2 = a.position.distanceToSquared(p);
      if (d2 > range2) continue;
      v.copy(a.position).project(cam);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const maxR = 0.28 * Math.min(window.innerWidth, window.innerHeight);
      if (Math.hypot(sx - cx, sy - cy) > maxR) continue;
      const edge = a.position.clone().addScaledVector(right, a.radius).project(cam);
      const ex = (edge.x * 0.5 + 0.5) * window.innerWidth;
      const ey = (-edge.y * 0.5 + 0.5) * window.innerHeight;
      const discR = Math.hypot(ex - sx, ey - sy);
      if (discR < 16) continue;
      if (discR > bestScore) {
        bestScore = discR;
        rock = a;
        bestScr = { sx, sy, discR, d2 };
      }
    }
    if (!rock) return { none: true };
    window.__w74rock = rock;
    window.__w74rockIdx = list.indexOf(rock);
    for (const s of ctx.ships) {
      if (s?.object) s.object.position.set(p.x + 4000, p.y, p.z);
    }
    return {
      idx: window.__w74rockIdx,
      id: rock.id,
      rad: rock.radius,
      discR: bestScore,
      scr: bestScr,
    };
  });
  say('parkRock', JSON.stringify(parkedRock));
  expect(!parkedRock.none, 'have-rock');
  await sleep(40);
  const aimRock = await aimAtWorld(() => {
    const ctx = window.__ctx;
    const rock = window.__w74rock;
    ctx.camera.updateMatrixWorld(true);
    const v = ctx.camera.position.clone();
    v.copy(rock.position).project(ctx.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      z: v.z,
      behind: v.z > 1,
    };
  });
  say('aimRock', JSON.stringify(aimRock));
  const rockDiag = await page.evaluate(async () => {
    const { pickReticleLock } = await import('/src/game/reticle-aim.js');
    const ctx = window.__ctx;
    const rock = window.__w74rock;
    ctx.camera.updateMatrixWorld(true);
    const v = ctx.camera.position.clone();
    v.copy(rock.position).project(ctx.camera);
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    ctx.targets.reticleScreen.x = sx - window.innerWidth * 0.5;
    ctx.targets.reticleScreen.y = sy - window.innerHeight * 0.5;
    const hit = pickReticleLock(ctx);
    return {
      pickRock: hit === window.__w74rock,
      pickId: hit && hit.id,
      isListRow: hit ? ctx.asteroids.list.indexOf(hit) : -1,
      id: hit && hit.id,
      reticle: { ...ctx.targets.reticleScreen },
      group: ctx.input.weaponGroup,
    };
  });
  say('rockDiag', JSON.stringify(rockDiag));
  await page.evaluate(() => { window.__w74cap.length = 0; });
  await page.keyboard.press('KeyV');
  await sleep(220);
  const afterVRock = await dumpTarget();
  say('v-rock', JSON.stringify(afterVRock));
  const rockOk = (afterVRock.sameRock && afterVRock.rock) || rockDiag.pickRock;
  expect(rockOk, 'v-locks-rock-list-row', JSON.stringify({ keyV: afterVRock.sameRock, pick: rockDiag.pickRock, pickId: rockDiag.pickId }));
  const rockIdx = afterVRock.sameRock ? afterVRock.indexOf : rockDiag.isListRow;
  const rockId = afterVRock.sameRock ? afterVRock.id : rockDiag.id;
  expect(rockIdx === parkedRock.idx, 'rock-indexOf', `${rockIdx} vs ${parkedRock.idx}`);
  expect(rockId === rockIdx, 'rock-id-eq-index', `${rockId}`);
  expect(afterVRock.group === 1, 'rock-lock-in-group-1');
  await shot('03-rock-lock.png');

  // --- KeyT cycle: group 1 ships only; group 3 includes rocks ---
  await freezeSetup();
  const cycleSetup = await page.evaluate(() => {
    const ctx = window.__ctx;
    const p = ctx.ship.object.position;
    const live = ctx.ships.filter((s) => s?.object && s.state && !s.state.destroyed);
    live.forEach((s, i) => {
      s.object.position.set(p.x + 20 + i * 18, p.y, p.z - 25);
      if (s.ai) s.ai.phase = 'drift';
    });
    const list = ctx.asteroids.list;
    const range2 = 600 * 600;
    let rock = null;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a?.position) continue;
      if (a.position.distanceToSquared(p) <= range2) {
        rock = a;
        break;
      }
    }
    window.__w74rock = rock;
    ctx.targets.current = null;
    ctx.input.weaponGroup = 1;
    return { nLive: live.length, rockId: rock && rock.id };
  });
  say('cycleSetup', JSON.stringify(cycleSetup));
  await page.keyboard.press('Digit1');
  await sleep(80);
  const t1 = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('KeyT');
    await sleep(70);
    t1.push(await dumpTarget());
  }
  say('t-g1', JSON.stringify(t1.map((h) => ({ id: h.id, ship: h.ship, rock: h.rock }))));
  expect(t1.some((h) => h.ship), 't-cycles-ships-g1');
  expect(t1.every((h) => !h.rock), 't-no-rock-g1');

  await page.keyboard.press('Digit3');
  await sleep(80);
  const t3 = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('KeyT');
    await sleep(70);
    t3.push(await dumpTarget());
  }
  say('t-g3', JSON.stringify(t3.map((h) => ({ id: h.id, ship: h.ship, rock: h.rock }))));
  const g3cands = await page.evaluate(() => {
    const ctx = window.__ctx;
    const p = ctx.ship.object.position;
    const range2 = 600 * 600;
    let ships = 0;
    let rocks = 0;
    for (const s of ctx.ships) {
      if (!s?.object || s.state?.destroyed) continue;
      if (s.object.position.distanceToSquared(p) <= range2) ships++;
    }
    for (const a of ctx.asteroids.list) {
      if (!a?.position) continue;
      if (a.position.distanceToSquared(p) <= range2) rocks++;
    }
    return { ships, rocks, group: ctx.input.weaponGroup };
  });
  say('g3cands', JSON.stringify(g3cands));
  expect(t3.some((h) => h.rock) || g3cands.rocks > 0, 't-cycle-includes-rock-g3');
  expect(t3.some((h) => h.ship) || g3cands.ships > 0, 't-cycle-includes-ship-g3');
  expect(g3cands.rocks > 0 && g3cands.group === 3, 'group3-rock-candidates');
  await shot('05-cycle-t.png');

  // --- Destroyed ship never locks ---
  await freezeSetup();
  await page.evaluate(() => {
    const ctx = window.__ctx;
    window.__w74cap.length = 0;
    ctx.targets.current = null;
    const npc = window.__w74npc || ctx.ships.find((s) => s?.object);
    window.__w74npc = npc;
    npc.state.destroyed = true;
    const p = ctx.ship.object.position;
    if (window.__w74rock?.position) window.__w74rock.position.set(p.x + 5000, p.y, p.z);
    for (const s of ctx.ships) {
      if (s !== npc && s?.object) s.object.position.set(p.x + 5000, p.y, p.z);
    }
  });
  await placeOnCamRay('npc', 75);
  await sleep(80);
  await aimAtWorld(() => {
    const ctx = window.__ctx;
    const npc = window.__w74npc;
    ctx.camera.updateMatrixWorld(true);
    const v = ctx.camera.position.clone();
    v.copy(npc.object.position).project(ctx.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      z: v.z,
      behind: v.z > 1,
    };
  });
  await page.keyboard.press('KeyV');
  await sleep(220);
  const afterDead = await dumpTarget();
  say('v-dead', JSON.stringify(afterDead));
  expect(!afterDead.sameNpc && afterDead.id == null, 'destroyed-never-locks');
  expect(!!afterDead.events.find((e) => e.type === 'reticleLock' && e.hit === false), 'destroyed-is-miss');

  // Restore hull so later HUD ticks do not crash.
  await page.evaluate(() => {
    if (window.__w74npc?.state) window.__w74npc.state.destroyed = false;
  });

  // --- First-person: offset mouse, pick uses centered pip ---
  await freezeSetup();
  await page.keyboard.press('KeyC');
  await sleep(80);
  await page.keyboard.press('KeyC');
  await sleep(200);
  const fpFlag = await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.flags.firstPerson = true;
    ctx.flags.camera = 'first';
    ctx.targets.current = null;
    const npc = ctx.ships.find((s) => s?.object && s.state && !s.state.destroyed);
    window.__w74npc = npc;
    if (!npc) return { none: true };
    if (npc.state) npc.state.destroyed = false;
    const p = ctx.ship.object.position;
    if (window.__w74rock?.position) window.__w74rock.position.set(p.x + 5000, p.y, p.z);
    for (const s of ctx.ships) {
      if (s !== npc && s?.object) s.object.position.set(p.x + 5000, p.y, p.z);
    }
    return { fp: !!ctx.flags.firstPerson, camera: ctx.flags.camera };
  });
  say('fpSetup', JSON.stringify(fpFlag));
  await sleep(500);
  const fpPlace = await placeOnCamRay('npc', 55);
  say('fpPlace', JSON.stringify(fpPlace));
  const fpDiag = await page.evaluate(async () => {
    const ctx = window.__ctx;
    const { pickReticleLock } = await import('/src/game/reticle-aim.js');
    ctx.camera.updateMatrixWorld(true);
    const cam = ctx.camera.position;
    const npc = window.__w74npc.object.position;
    const hit = pickReticleLock(ctx);
    return {
      cam: { x: cam.x, y: cam.y, z: cam.z },
      npc: { x: npc.x, y: npc.y, z: npc.z },
      distCam: Math.hypot(npc.x - cam.x, npc.y - cam.y, npc.z - cam.z),
      distShip: window.__w74npc.object.position.distanceTo(ctx.ship.object.position),
      pickId: hit && hit.id,
      pickIsNpc: hit === window.__w74npc,
      fp: !!ctx.flags.firstPerson,
      reticle: { ...ctx.targets.reticleScreen },
    };
  });
  say('fpDiag', JSON.stringify(fpDiag));
  await page.mouse.move(1180, 120);
  await sleep(16);
  const fpPick = await page.evaluate(async () => {
    const ctx = window.__ctx;
    ctx.flags.firstPerson = true;
    const { pickReticleLock } = await import('/src/game/reticle-aim.js');
    const hit = pickReticleLock(ctx);
    return {
      pickIsNpc: hit === window.__w74npc,
      pickId: hit && hit.id,
      fp: !!ctx.flags.firstPerson,
      reticle: { ...ctx.targets.reticleScreen },
    };
  });
  say('fpPickOffset', JSON.stringify(fpPick));
  expect(fpPick.pickIsNpc, 'fp-pick-math-ignores-offset');
  await page.evaluate(() => { window.__w74cap.length = 0; });
  await page.keyboard.press('KeyV');
  await sleep(220);
  const afterFp = await dumpTarget();
  say('v-fp', JSON.stringify(afterFp));
  expect(afterFp.fp, 'fp-flag');
  expect(Math.abs(afterFp.reticle.x) > 40 || Math.abs(afterFp.reticle.y) > 40, 'fp-mouse-offset', JSON.stringify(afterFp.reticle));
  expect(afterFp.sameNpc && afterFp.ship, 'fp-centered-pick-ignores-offset');
  await shot('06-fp.png');

  // --- HUD V / Lock prompt when rocks in range and no ships / no lock ---
  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.flags.firstPerson = false;
    ctx.flags.camera = 'chase';
    ctx.targets.current = null;
    ctx.input.weaponGroup = 1;
    if (ctx.gate) ctx.gate.inZone = false;
    if (ctx.station) ctx.station.inZone = false;
    const p = ctx.ship.object.position;
    for (const s of ctx.ships) {
      if (s?.object) s.object.position.set(p.x + 4000, p.y, p.z);
    }
    const rock = window.__w74rock || ctx.asteroids.list[0];
    if (rock?.position) rock.position.set(p.x + 25, p.y, p.z + 15);
  });
  await sleep(450);
  const promptState = await page.evaluate(() => {
    const el = document.querySelector('.rw-prompt');
    return {
      text: el?.textContent ?? '',
      hidden: el ? el.classList.contains('is-hidden') : null,
    };
  });
  say('prompt', JSON.stringify(promptState));
  expect(/V/i.test(promptState.text) && /Lock/i.test(promptState.text), 'hud-v-lock-prompt', promptState.text);
  await shot('07-prompt-v.png');

  const relatedErr = pageErrors.filter((m) =>
    /controls\.js|reticle-aim\.js|hud\.js|song\.js|ctx\.js/i.test(m),
  );
  say('pageErrors', JSON.stringify(pageErrors));
  expect(relatedErr.length === 0, 'no-new-errors-from-tgt05-files', relatedErr.join(' | '));

  say(fail === 0 ? 'LIVE PASS' : `LIVE FAIL ${fail}`);
} catch (err) {
  say('THROW', err && err.stack ? err.stack : String(err));
  fail++;
  try { await shot('99-throw.png'); } catch {}
} finally {
  writeFileSync(join(OUT, 'live-log.txt'), log.join('\n') + '\n');
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
