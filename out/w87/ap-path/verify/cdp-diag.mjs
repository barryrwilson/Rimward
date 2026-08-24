import http from 'node:http';

const port = 9338;

function jsonGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 3000 }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const list = await jsonGet('/json/list');
const page = list.find((t) => t.type === 'page' && String(t.url).includes('localhost:5173'));
console.log('page', page && { id: page.id, title: page.title, url: page.url });
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});
let id = 1;
const pending = new Map();
const contexts = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.method === 'Runtime.executionContextCreated') contexts.push(msg.params.context);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
function send(method, params) {
  const i = id++;
  const p = new Promise((resolve, reject) => pending.set(i, { resolve, reject }));
  ws.send(JSON.stringify({ id: i, method, params }));
  return p;
}
await send('Runtime.enable');
await send('Page.enable');
await new Promise((r) => setTimeout(r, 400));
console.log('contexts', contexts.map((c) => ({ id: c.id, origin: c.origin, name: c.name, aux: c.auxData })));

async function ev(expression, contextId) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, contextId,
  });
  return r;
}

for (const c of contexts) {
  try {
    const r = await ev(`({
      href: location.href,
      keys: Object.keys(window).filter(k => k.includes('ctx') || k.includes('web') || k.includes('THREE')),
      canvas: document.querySelectorAll('canvas').length,
      titleEl: !!document.getElementById('rw-title'),
      bodyLen: (document.body && document.body.innerText || '').slice(0, 180),
      app: !!(document.getElementById('app') && document.getElementById('app').children.length),
    })`, c.id);
    console.log('ctx', c.id, JSON.stringify(r.result && r.result.value || r));
  } catch (e) {
    console.log('ctx fail', c.id, e.message);
  }
}
ws.close();
