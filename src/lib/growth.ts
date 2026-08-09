import { ageInWeeks } from './age';
import type { GrowthPoint, WeightEntry } from '../types/models';

export type ExpectedRange = { low: number; median: number; high: number };

export const LOW_CENTILE = 0.09;
export const MEDIAN_CENTILE = 0.5;
export const HIGH_CENTILE = 0.91;

export type CentileSeries = Map<number, { age_weeks: number; weight_kg: number }[]>;

export function groupByCentile(points: GrowthPoint[]): CentileSeries {
  const series: CentileSeries = new Map();

  for (const point of points) {
    const list = series.get(point.centile) ?? [];
    list.push({ age_weeks: point.age_weeks, weight_kg: point.weight_kg });
    series.set(point.centile, list);
  }

  for (const list of series.values()) {
    list.sort((a, b) => a.age_weeks - b.age_weeks);
  }

  return series;
}

function weightAt(series: CentileSeries, centile: number, weeks: number): number | null {
  const list = series.get(centile);
  if (!list?.length) return null;
  if (weeks < list[0].age_weeks) return null;
  if (weeks >= list[list.length - 1].age_weeks) return list[list.length - 1].weight_kg;

  for (let index = 1; index < list.length; index += 1) {
    const before = list[index - 1];
    const after = list[index];
    if (weeks <= after.age_weeks) {
      const ratio = (weeks - before.age_weeks) / (after.age_weeks - before.age_weeks);
      return before.weight_kg + (after.weight_kg - before.weight_kg) * ratio;
    }
  }

  return null;
}

export function expectedAt(series: CentileSeries, weeks: number): ExpectedRange | null {
  const low = weightAt(series, LOW_CENTILE, weeks);
  const median = weightAt(series, MEDIAN_CENTILE, weeks);
  const high = weightAt(series, HIGH_CENTILE, weeks);

  if (low === null || median === null || high === null) return null;
  return { low, median, high };
}

export function expectedForEntries(
  entries: WeightEntry[],
  series: CentileSeries | undefined,
  birthDate: string | null,
): (ExpectedRange | null)[] | null {
  if (!series?.size || !birthDate) return null;

  const ranges = entries.map((entry) => {
    const weeks = ageInWeeks(birthDate, new Date(`${entry.measured_on}T00:00:00`));
    return weeks === null ? null : expectedAt(series, weeks);
  });

  return ranges.some(Boolean) ? ranges : null;
}

export function centileOf(series: CentileSeries, weeks: number, weight: number): number | null {
  const centiles = [...series.keys()].sort((a, b) => a - b);
  const curve = centiles
    .map((centile) => ({ centile, weight: weightAt(series, centile, weeks) }))
    .filter((point): point is { centile: number; weight: number } => point.weight !== null);

  if (curve.length < 2) return null;
  if (weight <= curve[0].weight) return curve[0].centile;
  if (weight >= curve[curve.length - 1].weight) return curve[curve.length - 1].centile;

  for (let index = 1; index < curve.length; index += 1) {
    const before = curve[index - 1];
    const after = curve[index];
    if (weight <= after.weight) {
      const ratio = (weight - before.weight) / (after.weight - before.weight);
      return before.centile + (after.centile - before.centile) * ratio;
    }
  }

  return null;
}

export function rangePosition(weight: number, range: ExpectedRange): 'below' | 'inside' | 'above' {
  if (weight < range.low) return 'below';
  if (weight > range.high) return 'above';
  return 'inside';
}

export function formatCentile(centile: number): string {
  const value = centile * 100;
  const rounded = value < 1 || value > 99 ? value.toFixed(1) : Math.round(value).toString();
  return `${rounded.replace('.', ',')}ᵉ centile`;
}
