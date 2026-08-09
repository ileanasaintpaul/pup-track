import { useTranslation } from 'react-i18next';

import { SKILL_LEVELS, categoryLabelKey, type Key } from '../lib/skills';
import type { Skill, SkillLevel } from '../types/models';

export function SkillRow({
  skill,
  level,
  favourite,
  pending,
  note,
  startAgeWeeks,
  onLevelChange,
  onToggleFavourite,
  onAddToList,
}: {
  skill: Skill;
  level: SkillLevel;
  favourite: boolean;
  pending: boolean;
  note?: string | null;
  startAgeWeeks?: number | null;
  onLevelChange: (level: SkillLevel) => void;
  onToggleFavourite: () => void;
  onAddToList?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="skill">
      <div className="skill-head">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-tools">
          <button
            type="button"
            className={favourite ? 'icon-button icon-active' : 'icon-button'}
            aria-pressed={favourite}
            aria-label={
              favourite
                ? t('training.skills.removeFavourite', { name: skill.name })
                : t('training.skills.addFavourite', { name: skill.name })
            }
            onClick={onToggleFavourite}
          >
            {favourite ? '★' : '☆'}
          </button>
          {onAddToList ? (
            <button
              type="button"
              className="icon-button"
              aria-label={t('training.skills.addToList', { name: skill.name })}
              onClick={onAddToList}
            >
              +
            </button>
          ) : null}
        </span>
      </div>

      <p className="muted small-text">
        {t(categoryLabelKey(skill.category) as Key)}
        {startAgeWeeks ? ` · ${t('training.skills.startsAt', { weeks: startAgeWeeks })}` : ''}
      </p>
      {note ? <p className="muted small-text">{note}</p> : null}
      {!note && skill.description ? <p className="muted small-text">{skill.description}</p> : null}

      <div className="steps" role="group" aria-label={t('training.skills.levelGroupLabel', { name: skill.name })}>
        {SKILL_LEVELS.map((step) => (
          <button
            key={step.level}
            type="button"
            className={step.level > 0 && step.level <= level ? 'step step-reached' : 'step'}
            aria-pressed={step.level === level}
            title={t(step.hintKey)}
            disabled={pending}
            onClick={() => onLevelChange(step.level === level ? 0 : step.level)}
          >
            {t(step.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
