function normalizeDiscountPercent(value) {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? '0'), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, Math.max(0, Math.round(n)));
}

function parseMoney(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function applyDiscount(price, discountPercent) {
  const pct = normalizeDiscountPercent(discountPercent);
  if (pct <= 0) return price ?? '';
  const amount = parseMoney(price);
  if (amount === null) return price ?? '';
  return (amount * (1 - pct / 100)).toFixed(2);
}

function assertEq(a, b) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

assertEq(normalizeDiscountPercent(25), 25);
assertEq(normalizeDiscountPercent(150), 90);
assertEq(normalizeDiscountPercent(-5), 0);
assertEq(applyDiscount(100, 20), '80.00');
assertEq(applyDiscount('320.00', 10), '288.00');
assertEq(applyDiscount('Уточняйте', 15), 'Уточняйте');
console.log('pricing tests passed');
