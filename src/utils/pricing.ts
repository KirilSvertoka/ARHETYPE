/** Percent discount helpers shared by storefront and cart. */

export function normalizeDiscountPercent(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? '0'), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, Math.max(0, Math.round(n)));
}

export function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

/** Apply product-level % discount. Non-numeric prices (e.g. "Уточняйте") pass through. */
export function applyDiscount(
  price: string | number | null | undefined,
  discountPercent: unknown,
): string | number {
  const pct = normalizeDiscountPercent(discountPercent);
  if (pct <= 0) return price ?? '';
  const amount = parseMoney(price);
  if (amount === null) return price ?? '';
  return formatMoney(amount * (1 - pct / 100));
}

export function hasActiveDiscount(discountPercent: unknown): boolean {
  return normalizeDiscountPercent(discountPercent) > 0;
}
