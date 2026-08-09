import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { niceScale } from '../lib/chartScale';
import { formatCm, formatShortDate } from '../lib/format';
import type { HeightEntry } from '../types/models';

const HEIGHT = 170;
const PADDING = { top: 14, right: 18, bottom: 26, left: 42 };

export function HeightChart({ entries }: { entries: HeightEntry[] }) {
  const { t } = useTranslation();
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
  const values = entries.map((entry) => entry.withers_cm);

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const { low, high, ticks } = niceScale(Math.min(...values), Math.max(...values));

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (time: number) =>
    maxTime === minTime
      ? PADDING.left + plotWidth / 2
      : PADDING.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;

  const y = (value: number) =>
    PADDING.top + plotHeight - ((value - low) / (high - low)) * plotHeight;

  const points = entries.map((entry, index) => ({
    entry,
    cx: x(times[index]),
    cy: y(entry.withers_cm),
  }));

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.cx} ${point.cy}`).join(' ');
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

  return (
    <div className="chart" ref={wrapperRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={t('charts.height.summary', {
          min: formatCm(Math.min(...values)),
          max: formatCm(Math.max(...values)),
          count: entries.length,
        })}
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
            <text
              className="chart-tick"
              x={PADDING.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatCm(tick)}
            </text>
          </g>
        ))}

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
          <line
            className="chart-crosshair"
            x1={active.cx}
            x2={active.cx}
            y1={PADDING.top}
            y2={PADDING.top + plotHeight}
          />
        ) : null}

        <circle className="chart-dot" cx={last.cx} cy={last.cy} r={4} />
        {active ? <circle className="chart-dot" cx={active.cx} cy={active.cy} r={4} /> : null}

        {!active && entries.length > 1 ? (
          <text className="chart-value" x={last.cx} y={last.cy - 12} textAnchor="end">
            {formatCm(last.entry.withers_cm)} {t('growth.height.cmUnit')}
          </text>
        ) : null}
      </svg>

      {active ? (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(active.cx, 62), width - 62),
            top: active.cy < 60 ? active.cy + 16 : active.cy - 62,
          }}
        >
          <strong>
            {formatCm(active.entry.withers_cm)} {t('growth.height.cmUnit')}
          </strong>
          <span className="muted">{formatShortDate(active.entry.measured_on)}</span>
        </div>
      ) : null}
    </div>
  );
}
