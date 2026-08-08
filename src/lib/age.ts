const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

/** Âge en semaines — l'unité qui compte pendant les premiers mois. */
export function ageInWeeks(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const weeks = Math.floor((now.getTime() - birth.getTime()) / MS_PER_WEEK);
  return weeks < 0 ? null : weeks;
}

/** « 12 semaines · 2 mois et demi », ou juste les semaines avant 2 mois. */
export function formatAge(birthDate: string | null, now = new Date()): string | null {
  const weeks = ageInWeeks(birthDate, now);
  if (weeks === null) return null;

  const label = weeks <= 1 ? `${weeks} semaine` : `${weeks} semaines`;
  if (weeks < 9) return label;

  const months = Math.floor(weeks / 4.345);
  return `${label} · ${months} mois`;
}

/** Période critique de socialisation : 3 à 16 semaines. */
export function isInSocializationWindow(birthDate: string | null, now = new Date()): boolean {
  const weeks = ageInWeeks(birthDate, now);
  return weeks !== null && weeks <= 16;
}
