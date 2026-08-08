import { useEffect, useRef, useState } from 'react';

import { formatKg, formatShortDate } from '../lib/format';
import type { ExpectedRange } from '../lib/growth';
import type { WeightEntry } from '../types/models';

const HEIGHT = 190;
const PADDING = { top: 14, right: 18, bottom: 26, left: 40 };
const MAX_TICKS = 5;

function niceScale(min: number, max: number) {
  const span = max - min || Math.max(max * 0.2, 1);
  const paddedMin = Math.max(0, min - span * 0.15);
  const paddedMax = max + span * 0.15;

  const steps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25];

  for (const step of steps) {
    const low = Math.floor(paddedMin / step) * step;
    const high = Math.ceil(paddedMax / step) * step;
    const count = Math.round((high - low) / step) + 1;
    if (count <= MAX_TICKS) return { low, high, ticks: buildTicks(low, step, count) };
  }

  const step = steps[steps.length - 1];
  const low = Math.floor(paddedMin / step) * step;
  return { low, high: low + step * 2, ticks: buildTicks(low, step, 3) };
}

function buildTicks(low: number, step: number, count: number) {
  return Array.from({ length: count }, (_, index) => Number((low + step * index).toFixed(2)));
}

export function WeightChart({
  entries,
  expected,
  expectedLabel,
}: {
  entries: WeightEntry[];
  expected?: (ExpectedRange | null)[] | null;
  expectedLabel?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const times = entries.map((entry) => new Date(`${entry.measured_on}T00:00:00`).getTime());
  const weights = entries.map((entry) => entry.weight_kg);
  const bandValues = (expected ?? []).flatMap((range) => (range ? [range.min, range.max] : []));

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minWeight = Math.min(...weights, ...bandValues);
  const maxWeight = Math.max(...weights, ...bandValues);

  const { low, high, ticks } = niceScale(minWeight, maxWeight);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (time: number) =>
    maxTime === minTime
      ? PADDING.left + plotWidth / 2
      : PADDING.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;

  const y = (weight: number) =>
    PADDING.top + plotHeight - ((weight - low) / (high - low)) * plotHeight;

  const points = entries.map((entry, index) => ({
    entry,
    range: expected?.[index] ?? null,
    cx: x(times[index]),
    cy: y(entry.weight_kg),
  }));

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.cx} ${point.cy}`).join(' ');
  const bandPath = buildBandPath(points, y);

  const last = points[points.length - 1];
  const active = hovered === null ? null : points[hovered];

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;

    let nearest = 0;
    for (let index = 1; index < points.length; index += 1) {
      if (Math.abs(points[index].cx - pointerX) < Math.abs(points[nearest].cx - pointerX)) {
        nearest = index;
      }
    }
    setHovered(nearest);
  }

  const summary = `Courbe de poids, de ${formatKg(minWeight)} à ${formatKg(maxWeight)} kilos sur ${entries.length} pesées.`;

  return (
    <div className="chart" ref={wrapperRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={summary}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid"
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="chart-tick" x={PADDING.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
              {formatKg(tick)}
            </text>
          </g>
        ))}

        {bandPath ? <path className="chart-band" d={bandPath} /> : null}

        <text className="chart-tick" x={PADDING.left} y={HEIGHT - 8}>
          {formatShortDate(entries[0].measured_on)}
        </text>
        {entries.length > 1 ? (
          <text className="chart-tick" x={width - PADDING.right} y={HEIGHT - 8} textAnchor="end">
            {formatShortDate(entries[entries.length - 1].measured_on)}
          </text>
        ) : null}

        {entries.length > 1 ? <path className="chart-line" d={path} /> : null}

        {active ? (
          <line className="chart-crosshair" x1={active.cx} x2={active.cx} y1={PADDING.top} y2={PADDING.top + plotHeight} />
        ) : null}

        <circle className="chart-dot" cx={last.cx} cy={last.cy} r={4} />
        {active ? <circle className="chart-dot" cx={active.cx} cy={active.cy} r={4} /> : null}

        {!active && entries.length > 1 ? (
          <text className="chart-value" x={last.cx} y={last.cy - 12} textAnchor="end">
            {formatKg(last.entry.weight_kg)} kg
          </text>
        ) : null}
      </svg>

      {active ? (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(active.cx, 74), width - 74),
            top: active.cy < 74 ? active.cy + 16 : active.cy - (active.range ? 76 : 62),
          }}
        >
          <strong>{formatKg(active.entry.weight_kg)} kg</strong>
          <span className="muted">{formatShortDate(active.entry.measured_on)}</span>
          {active.range ? (
            <span className="muted">
              attendu {formatKg(active.range.min)}–{formatKg(active.range.max)} kg
            </span>
          ) : null}
        </div>
      ) : null}

      {bandPath ? (
        <ul className="legend">
          <li>
            <span className="legend-line" />
            Poids mesuré
          </li>
          <li>
            <span className="legend-band" />
            {expectedLabel ?? 'Fourchette attendue'}
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function buildBandPath(
  points: { cx: number; range: ExpectedRange | null }[],
  y: (weight: number) => number,
): string | null {
  const covered = points.filter((point) => point.range) as {
    cx: number;
    range: ExpectedRange;
  }[];
  if (covered.length < 2) return null;

  const top = covered.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.cx} ${y(point.range.max)}`);
  const bottom = [...covered]
    .reverse()
    .map((point) => `L${point.cx} ${y(point.range.min)}`);

  return `${top.join(' ')} ${bottom.join(' ')} Z`;
}
