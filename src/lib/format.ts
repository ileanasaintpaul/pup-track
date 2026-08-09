import i18next from './i18n';

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

i18next.on('languageChanged', () => cache.clear());

type Kind = 'kg' | 'cm' | 'shortDate' | 'longDate';

function get<T extends Intl.NumberFormat | Intl.DateTimeFormat>(kind: Kind, build: (locale: string) => T): T {
  const locale = i18next.language || 'fr';
  const key = `${kind}:${locale}`;
  const hit = cache.get(key);
  if (hit) return hit as T;
  const made = build(locale);
  cache.set(key, made);
  return made;
}

const kg = () =>
  get('kg', (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }));
const cm = () =>
  get('cm', (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 }));
const shortDate = () =>
  get('shortDate', (locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }));
const longDate = () =>
  get(
    'longDate',
    (locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
  );

export function formatKg(value: number): string {
  return kg().format(value);
}

export function formatCm(value: number): string {
  return cm().format(value);
}

export function formatSignedCm(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${cm().format(Math.abs(value))}`;
}

export function formatSignedKg(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${kg().format(Math.abs(value))}`;
}

export function formatShortDate(isoDate: string): string {
  return shortDate().format(new Date(`${isoDate}T00:00:00`));
}

export function formatLongDate(isoDate: string): string {
  return longDate().format(new Date(`${isoDate}T00:00:00`));
}

export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
