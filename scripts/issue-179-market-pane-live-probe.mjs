/** #179 isolated Chromium: the real Jobs and Market panes — haul buy-in, finite
 * stock rows, a bulk refusal that must not outlive its cause, and the transient
 * event label. Trusted mouse and keyboard input; disclosed cash/event fixtures. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE179_OUT || resolve('out/issue-179-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('market-pane', async ({ c, result, act, wait, observe, checkpoint, shot }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium; explicit berth placement, credit fixture and a module-level event-pressure fixture. Actual Jobs and Market UI with trusted mouse and keyboard input; no natural flight or natural world-event claim.';
  const place = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);
  const panelText = () => c.eval("document.querySelector('.station-panel')?.innerText ?? ''");
  const boxOf = async expression => {
    const box = await c.eval(`(()=>{const n=${expression};if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    return box;
  };
  const clickBox = async box => {
    assert.ok(box, 'click target exists');
    for (const type of ['mousePressed', 'mouseReleased']) {
      await c.send('Input.dispatchMouseEvent', { type, ...box, button: 'left', clickCount: 1 });
    }
    await sleep(150);
  };
  const click = async selector => clickBox(await boxOf(`document.querySelector(${JSON.stringify(selector)})`));
  const clickByText = async text => clickBox(await boxOf(`[...document.querySelectorAll('.market-actions button')].find(n=>n.textContent===${JSON.stringify(text)}&&!n.disabled)`));
  const typeQuantity = async value => {
    await c.eval("(()=>{const n=document.getElementById('market-bulk-quantity');n.focus();n.setSelectionRange(0,n.value.length);return true;})()");
    await c.send('Input.insertText', { text: value });
    await sleep(200);
    assert.equal(await c.eval("document.getElementById('market-bulk-quantity').value"), value);
  };
  const previewText = () => c.eval("document.getElementById('market-bulk-preview').innerText");

  await wait(s => s.t > 0.2, 15, 'first simulation frame');
  await place();
  await sleep(250);
  await act('dock');
  await wait(s => s.flags.docked, 15, 'first dock');

  // ---- 1. the haul posting states its buy-in before acceptance --------------
  await c.eval('window.__ctx.world.credits=350');
  await act('openService', { id: 'jobs' });
  const shortText = await panelText();
  const shortLine = shortText.split('\n').find(l => l.startsWith('Buy-in'));
  assert.ok(shortLine, 'the offered haul states a buy-in before acceptance');
  assert.match(shortLine, /^Buy-in here: 5 Provisions at \d+ UU = \d+ UU\. You hold 350 UU — \d+ UU short\.$/);
  result.haulBuyInShort = shortLine;
  await shot('jobs-haul-buy-in-short');

  await c.eval('window.__ctx.world.credits=20000');
  await act('openService', { id: 'jobs' });
  const coveredLine = (await panelText()).split('\n').find(l => l.startsWith('Buy-in'));
  assert.match(coveredLine, /^Buy-in here: 5 Provisions at \d+ UU = \d+ UU\. You hold 20000 UU — covered\.$/);
  result.haulBuyInCovered = coveredLine;
  await checkpoint('jobs-haul-buy-in-covered');

  // ---- 2. every finite market row states its capacity ----------------------
  await act('openService', { id: 'market' });
  const stock = await c.eval("[...document.querySelectorAll('.market-stock')].map(n=>n.textContent)");
  assert.ok(stock.length >= 12, 'every commodity row carries a stock cell');
  for (const cell of stock) assert.match(cell, /^\d+\/(20|160)$/, cell);
  assert.ok(stock.some(cell => cell.endsWith('/20')), 'the 20-capacity rows show their cap');
  assert.ok(stock.some(cell => cell.endsWith('/160')), 'the 160-capacity rows show their cap');
  const marketText = await panelText();
  assert.match(marketText, /Stock replenishes in simulation time; empty to full in 20 minutes\./);
  result.stockCells = stock;
  await checkpoint('market-finite-stock');

  // ---- 3. a bulk refusal does not outlive its cause ------------------------
  const capacity = await c.eval('window.__ctx.cargoCapacity');
  result.cargoCapacity = capacity;
  await typeQuantity(String(capacity));
  await click('#market-bulk-buy');
  const filled = await observe();
  assert.equal(filled.ship.cargoUsed ?? await c.eval('window.__ctx.cargo.reduce((n,c)=>n+c.units,0)'), capacity, 'the hold is full');
  await typeQuantity('5');
  const refused = await previewText();
  assert.match(refused, /Only 0 hold units free\./);
  assert.equal(await c.eval("document.getElementById('market-bulk-buy').disabled"), true);
  result.bulkRefusal = refused.split('\n').find(l => l.startsWith('Buy:'));
  await shot('market-bulk-hold-refusal');

  // Empty the hold through the market ROWS, which never rebuild the bulk intent.
  for (let i = 0; i < 40; i++) {
    const held = await c.eval("window.__ctx.cargo.reduce((n,c)=>n+c.units,0)");
    if (!held) break;
    const target = await boxOf("[...document.querySelectorAll('.market-actions button')].find(n=>(n.textContent==='\\u22125'||n.textContent==='\\u22121')&&!n.disabled)");
    if (!target) break;
    await clickBox(target);
  }
  assert.equal(await c.eval("window.__ctx.cargo.reduce((n,c)=>n+c.units,0)"), 0, 'the hold is empty again');
  const cleared = await previewText();
  assert.doesNotMatch(cleared, /hold units free/, 'the answered refusal is gone from the pane');
  assert.match(cleared, /open again at \d+ UU — re-enter the quantity to confirm\./);
  assert.match(await c.eval("document.getElementById('market-bulk-buy').innerText"), /re-enter quantity/);
  result.bulkCleared = cleared.split('\n').find(l => l.startsWith('Buy:'));
  await shot('market-bulk-refusal-cleared');

  await typeQuantity('5');
  assert.equal(await c.eval("document.getElementById('market-bulk-buy').disabled"), false, 'a re-entered quantity confirms again');

  // ---- 4. an event-driven quote is labelled transient ----------------------
  // Fixture: drive the live pressure the world event would write, through the
  // very module the running pane reads. No new production hook.
  const applied = await c.eval("import('/src/game/market.js').then(m=>{m.applyEventPressure(window.__ctx,'pirateBlockade');return m.marketEventAt(window.__ctx.world.currentSystem);})");
  assert.equal(applied.label, 'blockade');
  await act('openService', { id: 'market' });
  const labels = await c.eval("[...document.querySelectorAll('.market-event')].map(n=>n.textContent)");
  assert.ok(labels.length >= 1, 'a pushed row is labelled');
  for (const label of labels) assert.equal(label, 'blockade up — temporary');
  assert.match(await panelText(), /A blockade is moving the marked rows\. That price is temporary/);
  result.eventLabels = labels;
  await checkpoint('market-transient-event-label');

  await c.eval("import('/src/game/market.js').then(m=>m.applyEventPressure(window.__ctx,'clear',window.__ctx.world.currentSystem))");
  await act('openService', { id: 'market' });
  assert.equal(await c.eval("document.querySelectorAll('.market-event').length"), 0, 'the label ends with the event');
  assert.doesNotMatch(await panelText(), /is moving the marked rows/);
  await shot('market-event-label-cleared');

  result.checks = [
    'haul buy-in shortfall before acceptance',
    'haul buy-in covered before acceptance',
    'finite stock cell on every commodity row, both capacities',
    'refill sentence on the market pane',
    'hold-full bulk refusal on a full hold',
    'refusal clears once the hold empties, frozen token still gates',
    're-entered quantity confirms again',
    'transient event label on every pushed row plus the pane note',
    'label and note end with the event',
  ];
});
