const d = JSON.parse('{"__proto__":{"hudAlerts":true},"constructor":true}');
console.log(JSON.stringify({
  ownHud: Object.prototype.hasOwnProperty.call(d, 'hudAlerts'),
  val: d.hudAlerts,
  names: Object.getOwnPropertyNames(d),
  pollute: Object.prototype.hudAlerts === true,
  inOp: 'hudAlerts' in d,
}, null, 2));
const p = Object.create({ hudAlerts: true });
console.log(JSON.stringify({
  inheritedIn: 'hudAlerts' in p,
  inheritedOwn: Object.prototype.hasOwnProperty.call(p, 'hudAlerts'),
  inheritedVal: p.hudAlerts,
}, null, 2));
