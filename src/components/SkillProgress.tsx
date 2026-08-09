import { useTranslation } from 'react-i18next';

import { RateChart } from './RateChart';
import type { SkillProgressEntry } from '../lib/progress';
import { SKILL_LEVELS } from '../lib/skills';

export function SkillProgress({ entry }: { entry: SkillProgressEntry }) {
  const { t } = useTranslation();
  const { skill, points, sessions, level } = entry;
  const first = points[0];
  const last = points[points.length - 1];
  const change = points.length > 1 ? last.rate - first.rate : null;
  const average = points.length
    ? Math.round(points.reduce((total, point) => total + point.rate, 0) / points.length)
    : null;

  return (
    <section className="card">
      <div className="card-head">
        <h2>{skill.name}</h2>
        <span className="muted small-text">{t(SKILL_LEVELS[level].labelKey)}</span>
      </div>

      {points.length ? (
        <>
          <p className="hero">
            {last.rate} <span className="hero-unit">%</span>
          </p>
          <p className="muted">
            {t('training.progress.sessions', { count: sessions })}
            {average !== null ? t('training.progress.average', { value: average }) : ''}
            {change !== null
              ? change > 0
                ? t('training.progress.gained', { value: change })
                : change < 0
                  ? t('training.progress.lost', { value: Math.abs(change) })
                  : t('training.progress.stable')
              : ''}
            .
          </p>
          {points.length > 1 ? (
            <RateChart points={points} />
          ) : (
            <p className="muted small-text">{t('training.progress.singleSession')}</p>
          )}
        </>
      ) : (
        <p className="muted">
          {t('training.progress.sessions', { count: sessions })}
          {t('training.progress.noRateSuffix')}
        </p>
      )}
    </section>
  );
}
