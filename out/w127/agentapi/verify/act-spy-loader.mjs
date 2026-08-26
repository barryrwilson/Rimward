export async function resolve(specifier, context, nextResolve) {
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!url.includes('src/systems/agent-api.js')) return result;
  let source = result.source;
  if (source && typeof source !== 'string') source = source.toString();
  if (typeof source !== 'string') return result;
  if (!source.includes('function act(command)')) return result;
  source = source.replace(
    'const agent = ensureAgent(ctx);\n  if (agent && queryOptIn()) agent.optIn = true;',
    `const agent = ensureAgent(ctx);
  try {
    ctx.__agentApiClosed = true;
    if (agent) {
      agent.__stamp = 'init';
      let _opt = agent.optIn;
      Object.defineProperty(agent, 'optIn', {
        get() { return _opt; },
        set(v) {
          try {
            if (v === true || _opt !== v) {
              console.log('SPY SET OPTIN', JSON.stringify(v), 'time', ctx.world && ctx.world.time);
            }
          } catch { /* ignore */ }
          _opt = v;
        },
        enumerable: true,
        configurable: true,
      });
    }
  } catch (e) { console.log('SPY INIT ERR', String(e)); }
  if (agent && queryOptIn()) agent.optIn = true;`,
  );
  source = source.replace(
    'if (ctx.agent.optIn !== true) ctx.agent.optIn = false;',
    `if (ctx.agent.optIn !== true) {
      try {
        if (ctx.world && ctx.world.time > 1700) {
          console.log('SPY ENSURE RESET', JSON.stringify(ctx.agent.optIn), typeof ctx.agent.optIn);
        }
      } catch { /* ignore */ }
      ctx.agent.optIn = false;
    }`,
  );
  const needle = 'function act(command) {\n    try {\n      return dispatchAct(ctx, command);';
  const insert = `function act(command) {
    try {
      try { console.log('SPY BEFORE', JSON.stringify({ name: command && command.name, optIn: ctx.agent && ctx.agent.optIn, type: ctx.agent && typeof ctx.agent.optIn })); } catch { /* ignore */ }
      const __out = dispatchAct(ctx, command);
      try {
        const n = command && command.name;
        if (n === 'ping' || n === 'plotRoute' || n === 'teleport') {
          const a = ctx.agent;
          const desc = a ? Object.getOwnPropertyDescriptor(a, 'optIn') : null;
          console.log('SPY ACT', JSON.stringify({
            name: n,
            result: __out,
            optIn: a && a.optIn,
            stamp: a && a.__stamp,
            closed: ctx.__agentApiClosed === true,
            sameAgent: a === agent,
            desc,
            frozenAgent: a ? Object.isFrozen(a) : null,
            paused: ctx.flags && ctx.flags.paused,
            held: ctx.flags && ctx.flags.berthHold,
          }));
        }
      } catch (e) { console.log('SPY ACT ERR', String(e)); }
      return __out;`;
  if (!source.includes(needle)) {
    console.log('SPY LOADER: needle not found');
    return result;
  }
  return { ...result, source: source.replace(needle, insert), format: result.format || 'module', shortCircuit: true };
}
