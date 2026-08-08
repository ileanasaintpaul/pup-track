import { ageInWeeks } from './age';
import type { GrowthStandard, SizeCategory, WeightEntry } from '../types/models';

export type ExpectedRange = { min: number; max: number };

export const SIZE_LABELS: Record<SizeCategory, string> = {
  toy: 'Très petit (2–4 kg adulte)',
  small: 'Petit (5–10 kg adulte)',
  medium: 'Moyen (10–25 kg adulte)',
  large: 'Grand (25–40 kg adulte)',
  giant: 'Très grand (40 kg et plus)',
};

export function expectedAt(points: GrowthStandard[], weeks: number): ExpectedRange | null {
  if (!points.length) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (weeks < first.age_weeks) return null;
  if (weeks >= last.age_weeks) return { min: last.weight_min_kg, max: last.weight_max_kg };

  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1];
    const after = points[index];
    if (weeks <= after.age_weeks) {
      const ratio = (weeks - before.age_weeks) / (after.age_weeks - before.age_weeks);
      return {
        min: before.weight_min_kg + (after.weight_min_kg - before.weight_min_kg) * ratio,
        max: before.weight_max_kg + (after.weight_max_kg - before.weight_max_kg) * ratio,
      };
    }
  }

  return null;
}

export function expectedForEntries(
  entries: WeightEntry[],
  points: GrowthStandard[] | undefined,
  birthDate: string | null,
): (ExpectedRange | null)[] | null {
  if (!points?.length || !birthDate) return null;

  const ranges = entries.map((entry) => {
    const weeks = ageInWeeks(birthDate, new Date(`${entry.measured_on}T00:00:00`));
    return weeks === null ? null : expectedAt(points, weeks);
  });

  return ranges.some(Boolean) ? ranges : null;
}

export function rangePosition(weight: number, range: ExpectedRange): 'below' | 'inside' | 'above' {
  if (weight < range.min) return 'below';
  if (weight > range.max) return 'above';
  return 'inside';
}
