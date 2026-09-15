/** #177 disposable Chromium verification of the rendered consignment split.
 * Real browser, real station DOM, real trusted clicks on the native market
 * controls. Explicit berth/price fixtures; no natural flight.
 * node scripts/issue-177-consignment-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE177_OUT || resolve('out/issue-177-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('consignment', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Explicit safe-berth placement and a fixed provisions price; the market pane, the Sell All preset and the row sell buttons are read and clicked in the live DOM.';

  const placeAtBerth = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;x.world.credits=20000;x.world.prices.provisions=100;return true;})()`);
  // One real trusted click at the control's own centre.
  const click = async (selector) => {
    const box = await c.eval(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,disabled:n.disabled===true};})()`);
    assert.ok(box, 'control is rendered: ' + selector);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await c.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
    }
    await sleep(120);
    return box;
  };
  // The rendered market row for one commodity, plus its live button states.
  const marketRow = name => c.eval(`(()=>{const cells=Array.from(document.querySelectorAll('.market-table > *'));const i=cells.findIndex(n=>n.textContent===${JSON.stringify(name)});if(i<0)return null;const actions=cells[i+5];return {name:cells[i].textContent,hold:cells[i+4].textContent,buttons:Array.from(actions.querySelectorAll('button'),b=>({label:b.textContent,disabled:b.disabled===true}))};})()`);
  const panelText = () => c.eval(`document.querySelector('.station-panel')?.innerText || ''`);
  const bulk = () => c.eval(`(()=>{const q=document.getElementById('market-bulk-quantity'),s=document.getElementById('market-bulk-sell');return {quantity:q?.value??null,sellDisabled:s?.disabled===true,preview:document.getElementById('market-bulk-preview')?.innerText||''};})()`);
  const sellBtn = label => c.eval(`(()=>{const b=Array.from(document.querySelectorAll('.market-actions button')).filter(n=>n.textContent===${JSON.stringify(label)});return b.map(n=>n.disabled===true);})()`);

  await placeAtBerth();
  await sleep(250);
  await act('dock');
  await wait(s => s.flags.docked, 15, 'dock');

  // --- the fronted consignment plus three bought units --------------------
  await act('openService', { id: 'jobs' });
  const accepted = await act('acceptJob', { id: 'ferry-consignment' });
  assert.equal(accepted.ok, true, 'ferry consignment accepted');
  await act('openService', { id: 'market' });
  assert.equal((await act('trade', { commodity: 'provisions', qty: 3, side: 'buy' })).ok, true);
  const mixed = await checkpoint('mixed-hold');
  result.mixedCargo = mixed.world.cargo;
  assert.deepEqual(
    mixed.world.cargo.find(r => r.commodity === 'provisions'),
    { commodity: 'provisions', units: 7, owned: 3, consigned: 4 },
    'observe() carries the split',
  );

  const row = await marketRow('Provisions');
  result.marketRowMixed = row;
  assert.equal(row.hold, '7 (3 yours · 4 consigned)', 'rendered HOLD cell shows the split');
  assert.deepEqual(row.buttons, [
    { label: '+1', disabled: false },
    { label: '+5', disabled: false },
    { label: '−1', disabled: false },
    { label: '−5', disabled: true },
  ], 'only the sell the player can cover stays live');
  const hold = await panelText();
  result.holdLineMixed = hold.split('\n').find(l => l.includes('· HOLD ')) || hold.slice(0, 240);
  assert.match(result.holdLineMixed, /HOLD 7\/20 · 4 consigned/, 'rendered hold total names the consignment');

  // --- Sell All offers the owned units only -------------------------------
  await c.eval(`(()=>{const s=document.getElementById('market-bulk-commodity');if(!s)return false;s.value='provisions';s.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
  await click('#market-bulk-sell-all');
  const preset = await bulk();
  result.sellAllMixed = preset;
  assert.equal(preset.quantity, '3', 'Sell All offers the three owned units');
  assert.match(preset.preview, /Held 7 \(3 yours · 4 consigned\)/, 'bulk preview shows the split');
  await click('#market-bulk-sell');
  const sold = await observe();
  result.afterSellAll = sold.world.cargo;
  assert.deepEqual(
    sold.world.cargo.find(r => r.commodity === 'provisions'),
    { commodity: 'provisions', units: 4, owned: 0, consigned: 4 },
    'Sell All sold the owned units and kept the consignment',
  );

  // --- a consigned-only hold offers nothing -------------------------------
  const consignedOnly = await checkpoint('consigned-only');
  result.marketRowConsigned = await marketRow('Provisions');
  assert.deepEqual(result.marketRowConsigned.buttons.map(b => b.disabled), [false, false, true, true],
    'neither row sell button is live with nothing owned');
  // Every row: a sell the hold cannot cover is disabled, consignment or not.
  result.sellOneDisabled = await sellBtn('−1');
  assert.ok(result.sellOneDisabled.every(Boolean), 'no −1 control is live with nothing owned');
  const credits = consignedOnly.world.credits;
  await click('.market-actions button:nth-of-type(3)'); // the −1 control
  const afterDeadClick = await observe();
  assert.equal(afterDeadClick.world.credits, credits, 'a click on the disabled control pays nothing');
  assert.equal(afterDeadClick.world.cargo.find(r => r.commodity === 'provisions').units, 4, 'the consignment is whole');

  await click('#market-bulk-sell-all');
  const emptyPreset = await bulk();
  result.sellAllConsigned = emptyPreset;
  assert.equal(emptyPreset.quantity, '0', 'Sell All offers nothing');
  assert.equal(emptyPreset.sellDisabled, true, 'the bulk Sell control is refused');

  const refused = await act('trade', { commodity: 'provisions', qty: 1, side: 'sell' }, false);
  result.publicSellRefusal = refused;
  assert.equal(refused.ok, false, 'the public sell path refuses the fronted units');
  assert.match(refused.error || '', /consigned to the factor/);
  const held = await observe();
  assert.equal(held.world.cargo.find(r => r.commodity === 'provisions').units, 4, 'nothing moved on refusal');
  assert.equal(held.world.credits, credits, 'no UU paid on refusal');
  await save();
});
