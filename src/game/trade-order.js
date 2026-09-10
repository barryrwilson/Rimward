/** Shared individual-order ceiling; bulk player intents submit legal chunks. */
export function tradeOrderLimit(ctx) {
  const cap = typeof ctx?.cargoCapacity === 'number' && Number.isFinite(ctx.cargoCapacity)
    ? Math.floor(ctx.cargoCapacity) : 99;
  return Math.min(99, cap > 0 ? cap : 99);
}

export function tradeQty(ctx, qty) {
  return Number.isSafeInteger(qty) && qty >= 1 && qty <= tradeOrderLimit(ctx) ? qty : null;
}
