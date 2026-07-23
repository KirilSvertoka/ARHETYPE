/** Shared SEO / brand URL helpers (keep in sync with server slugify). */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya', і: 'i', ў: 'u',
};

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function brandPath(brand: string): string {
  return `/brand/${slugify(brand)}`;
}

export const SITE_ORIGIN = 'https://archetype.by';

export function resolveBrandFromSlug(slug: string, brands: string[]): string | null {
  if (!slug) return null;
  const found = brands.find((b) => slugify(b) === slug);
  return found || null;
}
