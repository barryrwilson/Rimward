// Real headed-Chrome focus transfer supplements the headless ownership probe.
process.env.ISSUE61_OUT = process.env.ISSUE11_OUT || 'out/issue-11-focus';
process.env.ISSUE61_KEEP_OPEN = '0';
const { runLive, sleep } = await import('./issue-61-live-harness.mjs');
await runLive('physical-focus', 'controlled', async ({ c, result, act, wait, checkpoint }) => {
  let s = await c.eval('window.rimward.observe()');
  if (s.session.phase === 'title') await act('startGame');
  s = await c.eval('window.rimward.observe()');
  if (s.session.phase === 'origin') await act('chooseOrigin', { id: 'greenhand' });
  await wait(s => s.session.phase === 'playing', 20, 'playing');
  result.checks = [];
  const check = (name, pass) => { result.checks.push({ name, pass: !!pass }); if (!pass) throw Error(name); };
  await c.send('Page.bringToFront');
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 720, y: 400, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(300);
  check('physical hold active', await c.eval('window.__ctx.input.fireHeld'));
  const original = (await c.send('Target.getTargetInfo')).targetInfo.targetId;
  const other = await c.send('Target.createTarget', { url: 'about:blank' });
  await c.send('Target.activateTarget', { targetId: other.targetId }); await sleep(300);
  check('actual tab transfer removes document focus', !(await c.eval('document.hasFocus()')));
  check('actual blur clears held fire', !(await c.eval('window.__ctx.input.fireHeld')));
  await c.send('Target.activateTarget', { targetId: original }); await sleep(300);
  check('actual focus returns', await c.eval('document.hasFocus()'));
  check('focus return cannot rearm held fire', !(await c.eval('window.__ctx.input.fireHeld')));
  await c.send('Target.closeTarget', { targetId: other.targetId });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 720, y: 400, button: 'left', buttons: 0, clickCount: 1 });
  await checkpoint('real-blur-and-focus');
}, { keepRenderingWhenOccluded: true });
