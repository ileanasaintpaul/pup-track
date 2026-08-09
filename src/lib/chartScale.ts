const STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50];

export type Scale = { low: number; high: number; ticks: number[] };

export function niceScale(min: number, max: number, maxTicks = 5): Scale {
  const span = max - min || Math.max(max * 0.2, 1);
  const paddedMin = Math.max(0, min - span * 0.15);
  const paddedMax = max + span * 0.15;

  for (const step of STEPS) {
    const low = Math.floor(paddedMin / step) * step;
    const high = Math.ceil(paddedMax / step) * step;
    const count = Math.round((high - low) / step) + 1;
    if (count <= maxTicks) return { low, high, ticks: buildTicks(low, step, count) };
  }

  const step = STEPS[STEPS.length - 1];
  const low = Math.floor(paddedMin / step) * step;
  return { low, high: low + step * 2, ticks: buildTicks(low, step, 3) };
}

function buildTicks(low: number, step: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => Number((low + step * index).toFixed(2)));
}
