import { RateChart } from './RateChart';
import type { SkillProgressEntry } from '../lib/progress';
import { SKILL_LEVELS } from '../lib/skills';

export function SkillProgress({ entry }: { entry: SkillProgressEntry }) {
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
        <span className="muted small-text">{SKILL_LEVELS[level].label}</span>
      </div>

      {points.length ? (
        <>
          <p className="hero">
            {last.rate} <span className="hero-unit">%</span>
          </p>
          <p className="muted">
            {sessions} séance{sessions > 1 ? 's' : ''}
            {average !== null ? `, ${average} % en moyenne` : ''}
            {change !== null
              ? change > 0
                ? `, ${change} points gagnés depuis la première`
                : change < 0
                  ? `, ${Math.abs(change)} points perdus depuis la première`
                  : ', stable depuis la première'
              : ''}
            .
          </p>
          {points.length > 1 ? (
            <RateChart points={points} />
          ) : (
            <p className="muted small-text">
              Une seule séance chiffrée. La courbe apparaît à partir de deux.
            </p>
          )}
        </>
      ) : (
        <p className="muted">
          {sessions} séance{sessions > 1 ? 's' : ''} sans taux de réussite. Renseigne-le pour suivre
          la progression.
        </p>
      )}
    </section>
  );
}
