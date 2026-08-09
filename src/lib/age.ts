const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

export function ageInWeeks(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const weeks = Math.floor((now.getTime() - birth.getTime()) / MS_PER_WEEK);
  return weeks < 0 ? null : weeks;
}

export type AgeParts = { weeks: number; months: number | null };

export function ageParts(birthDate: string | null, now = new Date()): AgeParts | null {
  const weeks = ageInWeeks(birthDate, now);
  if (weeks === null) return null;
  return { weeks, months: weeks < 9 ? null : Math.floor(weeks / 4.345) };
}

export function isInSocializationWindow(birthDate: string | null, now = new Date()): boolean {
  const weeks = ageInWeeks(birthDate, now);
  return weeks !== null && weeks <= 16;
}
