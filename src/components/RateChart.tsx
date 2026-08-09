import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatShortDate } from '../lib/format';

const HEIGHT = 150;
const PADDING = { top: 14, right: 16, bottom: 24, left: 36 };
const TICKS = [0, 25, 50, 75, 100];

export type RatePoint = { date: string; rate: number; environment: string | null };

export function RateChart({ points }: { points: RatePoint[] }) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(220, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const times = points.map((point) => new Date(`${point.date}T00:00:00`).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (time: number) =>
    maxTime === minTime
      ? PADDING.left + plotWidth / 2
      : PADDING.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;

  const y = (rate: number) => PADDING.top + plotHeight - (rate / 100) * plotHeight;

  const placed = points.map((point, index) => ({
    point,
    cx: x(times[index]),
    cy: y(point.rate),
  }));

  const path = placed.map((item, index) => `${index === 0 ? 'M' : 'L'}${item.cx} ${item.cy}`).join(' ');
  const active = hovered === null ? null : placed[hovered];
  const last = placed[placed.length - 1];

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;

    let nearest = 0;
    for (let index = 1; index < placed.length; index += 1) {
      if (Math.abs(placed[index].cx - pointerX) < Math.abs(placed[nearest].cx - pointerX)) {
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
        aria-label={t('charts.rate.summary', {
          count: points.length,
          from: points[0].rate,
          to: last.point.rate,
        })}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        {TICKS.map((tick) => (
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
              x={PADDING.left - 6}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {tick}
            </text>
          </g>
        ))}

        <text className="chart-tick" x={PADDING.left} y={HEIGHT - 6}>
          {formatShortDate(points[0].date)}
        </text>
        {points.length > 1 ? (
          <text className="chart-tick" x={width - PADDING.right} y={HEIGHT - 6} textAnchor="end">
            {formatShortDate(points[points.length - 1].date)}
          </text>
        ) : null}

        {points.length > 1 ? <path className="chart-line" d={path} /> : null}

        {placed.map((item) => (
          <circle key={item.point.date} className="chart-dot" cx={item.cx} cy={item.cy} r={3.5} />
        ))}

        {active ? (
          <line
            className="chart-crosshair"
            x1={active.cx}
            x2={active.cx}
            y1={PADDING.top}
            y2={PADDING.top + plotHeight}
          />
        ) : null}
      </svg>

      {active ? (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(active.cx, 70), width - 70),
            top: active.cy < 60 ? active.cy + 14 : active.cy - 58,
          }}
        >
          <strong>{active.point.rate} %</strong>
          <span className="muted">
            {formatShortDate(active.point.date)}
            {active.point.environment ? ` · ${active.point.environment}` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
