const list = await fetch('http://127.0.0.1:9486/json/list').then((r) => r.json());
const page = list.find((t) => t.type === 'page' && String(t.url).includes('5186'));
console.log('page', page && page.id, page && page.title);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', () => reject(new Error('ws')), { once: true });
});
console.log('ws open');
let n = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method) console.log('event', msg.method);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
function send(method, params = {}) {
  const id = ++n;
  console.log('send', method);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 10000);
    pending.set(id, (msg) => { clearTimeout(t); resolve(msg); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
console.log(JSON.stringify(await send('Runtime.enable')));
console.log(JSON.stringify(await send('Runtime.evaluate', { expression: '1+1', returnByValue: true })));
ws.close();
