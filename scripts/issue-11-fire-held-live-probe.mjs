// Real Chromium input/animation-loop regression; reuses the disposable loopback runner.
process.env.ISSUE74_OUT = process.env.ISSUE11_OUT || 'out/issue-11-live';
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');
const baseline = process.env.ISSUE11_BASELINE === '1';
await runLive(baseline ? 'baseline-fire-held' : 'fire-held', async h => {
  const { c, result, act, wait, checkpoint } = h;
  result.checks = [];
  const check = (name, pass, detail) => {
    result.checks.push({ name, pass: !!pass, detail });
    console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? ''));
    if (!pass && !baseline) throw Error(name);
  };
  const key = async (code, type = 'keyDown', repeat = false) => {
    await c.send('Input.dispatchKeyEvent', { type, code, key: code.startsWith('Key') ? code.slice(3).toLowerCase() : code, autoRepeat: repeat });
  };
  const tap = async code => { await key(code); await key(code, 'keyUp'); await sleep(150); };
  const mouse = async (type, x = 720, y = 450) => {
    await c.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
    await sleep(120);
  };
  const fire = () => c.eval('window.__ctx.input.fireHeld');
  const click = async selector => {
    const p = await c.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing button');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y);
  };
  await mouse('mousePressed'); check('normal physical hold', await fire());
  await tap('KeyO'); check('settings open', await c.eval('window.__ctx.settingsApi.isOpen()'));
  check('settings takes active fire', !(await fire()));
  await tap('Escape'); check('settings close cannot rearm held mouse', !(await fire()));
  await mouse('mouseReleased');
  await tap('KeyP');
  await mouse('mousePressed', 100, 100);
  await tap('KeyP'); check('pause click cannot queue fire after resume', !(await fire()));
  await mouse('mouseReleased');
  await checkpoint('01-settings-pause');
  if (baseline) {
    result.reproducedDefects = result.checks.filter(x => !x.pass).map(x => x.name);
    if (!result.reproducedDefects.length) throw Error('Baseline defect not reproduced');
    return;
  }
  for (const [name, code, flag] of [['chart', 'KeyM', 'chartOpen'], ['berth', 'KeyL', 'berthOpen']]) {
    await mouse('mousePressed'); check(`${name}: fresh hold`, await fire());
    await tap(code); check(`${name}: open`, await c.eval(`window.__ctx.flags.${flag}`));
    check(`${name}: active fire cleared`, !(await fire()));
    await tap('Escape'); check(`${name}: closed`, !(await c.eval(`window.__ctx.flags.${flag}`)));
    check(`${name}: no stale fire on close`, !(await fire())); await mouse('mouseReleased');
    await tap(code); await mouse('mousePressed', 100, 100); await mouse('mouseReleased', 100, 100);
    await tap('Escape'); check(`${name}: overlay click/release does not fire`, !(await fire()));
  }
  await checkpoint('02-chart-berth');

  await mouse('mousePressed'); await tap('KeyP');
  check('pause clears existing hold while loop frozen', !(await fire()));
  await tap('KeyP'); check('pause resume cannot revive existing hold', !(await fire()));
  await mouse('mouseReleased');
  await mouse('mousePressed'); await tap('KeyP');
  await click('[data-pause-action="title"]');
  check('title owns screen', await c.eval('!!document.getElementById("rw-title")'));
  check('title keeps fire clear', !(await fire()));
  await click('#rw-title-models');
  check('models owns screen', await c.eval('window.__ctx.models.isOpen()'));
  await mouse('mousePressed', 100, 100); await tap('Escape');
  check('models closes to title without fire', !(await fire()));
  await mouse('mouseReleased'); await click('#rw-title-continue');
  check('title continues flight without fire', !(await fire()) && !(await c.eval('window.__ctx.flags.paused')));
  await checkpoint('03-pause-title-models');

  await mouse('mousePressed'); check('pre-blur fresh hold', await fire());
  // Headless Chrome reports both activated targets focused. Dispatch the
  // native-named event to the live listener; do not claim OS-focus coverage.
  result.blurMethod = 'Live window blur/focus event dispatch; headless Target.activateTarget does not change document.hasFocus().';
  await c.eval(`window.dispatchEvent(new Event('blur'));true`);
  check('live blur listener clears fire', !(await fire()));
  await c.eval(`window.dispatchEvent(new Event('focus'));true`); await sleep(250);
  check('focus return does not rearm', !(await fire()));
  await mouse('mouseReleased');

  // Existing binding support is a fixture, not a binding feature change.
  result.bindingFixture = 'Temporarily set the existing fire binding to KeyZ through its normal rebuild helper.';
  await c.eval(`(async()=>{const c=window.__ctx;c.settings.bindings.fire='KeyZ';(await import('/src/systems/controls.js')).rebuildTrackedFromBindings(c);return true;})()`);
  await key('KeyZ'); await sleep(150); check('keyboard fire holds normally', await fire());
  await tap('KeyO'); check('settings clears keyboard hold', !(await fire()));
  await key('KeyZ', 'keyUp'); await tap('Escape'); check('keyup during Settings survives capture ownership', !(await fire()));
  await key('KeyZ'); await sleep(150); check('fresh keyboard press rearms', await fire());
  await tap('KeyP'); await tap('KeyP'); await key('KeyZ', 'keyDown', true); await sleep(150);
  check('key repeat after pause cannot rearm', !(await fire())); await key('KeyZ', 'keyUp');
  await c.eval(`(async()=>{const c=window.__ctx;delete c.settings.bindings.fire;(await import('/src/systems/controls.js')).rebuildTrackedFromBindings(c);return true;})()`);
  await checkpoint('04-blur-keyboard');

  // Use the real approach/berth lifecycle, with no position or dock-flag fixture.
  await act('approachDock'); await wait(s => s.flags.docked, 180, 'real approach and dock');
  await mouse('mousePressed', 100, 100); check('station press cannot arm fire', !(await fire()));
  await checkpoint('05-real-docked');
  await tap('KeyB'); await wait(s => !s.flags.docked, 15, 'keyboard launch');
  check('held station click cannot leak through launch', !(await fire()));
  await mouse('mouseReleased'); await mouse('mousePressed'); check('normal hold after launch', await fire());
  await mouse('mouseReleased'); check('normal release after launch', !(await fire()));
  await checkpoint('06-real-launched');

  // Controlled incoming-card fixture exercises real hail DOM propagation.
  // No ship position, combat hit or natural hail arrival is claimed here.
  result.hailFixture = 'Close any natural card, then emit hailOpened for a live NPC with keepFiring; actual DOM click closes it.';
  await c.eval(`window.__ctx.emit('hailClosed', {});true`); await sleep(200);
  await mouse('mousePressed'); check('pre-hail flight hold', await fire());
  await c.eval(`(()=>{const c=window.__ctx,s=c.ships.find(s=>s.state&&!s.state.destroyed&&(!s.ai?.calmUntil||s.ai.calmUntil<=c.world.time));if(!s)throw Error('No live hail fixture');c.emit('hailOpened',{ship:s,intents:['keepFiring'],line:'Input ownership verification'});return true;})()`);
  await sleep(300); check('incoming fixture hail opens', await c.eval('window.__ctx.flags.hailOpen'));
  check('incoming hail clears prior hold', !(await fire()));
  await mouse('mouseReleased'); await mouse('mousePressed');
  check('fresh flight press remains available during hail', await fire());
  await mouse('mouseReleased'); await click('.rw-hail-card button');
  check('hail response click closes card without firing', !(await fire()) && !(await c.eval('window.__ctx.flags.hailOpen')));
  await checkpoint('07-hail-flight-and-card');
});
