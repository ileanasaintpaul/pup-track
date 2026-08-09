import { SKILL_LEVELS, categoryLabel } from '../lib/skills';
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
  return (
    <div className="skill">
      <div className="skill-head">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-tools">
          <button
            type="button"
            className={favourite ? 'icon-button icon-active' : 'icon-button'}
            aria-pressed={favourite}
            aria-label={favourite ? `Retirer ${skill.name} des favoris` : `Mettre ${skill.name} en favori`}
            onClick={onToggleFavourite}
          >
            {favourite ? '★' : '☆'}
          </button>
          {onAddToList ? (
            <button
              type="button"
              className="icon-button"
              aria-label={`Ajouter ${skill.name} à une liste`}
              onClick={onAddToList}
            >
              +
            </button>
          ) : null}
        </span>
      </div>

      <p className="muted small-text">
        {categoryLabel(skill.category)}
        {startAgeWeeks ? ` · dès ${startAgeWeeks} semaines` : ''}
      </p>
      {note ? <p className="muted small-text">{note}</p> : null}
      {!note && skill.description ? <p className="muted small-text">{skill.description}</p> : null}

      <div className="steps" role="group" aria-label={`Palier pour ${skill.name}`}>
        {SKILL_LEVELS.map((step) => (
          <button
            key={step.level}
            type="button"
            className={step.level > 0 && step.level <= level ? 'step step-reached' : 'step'}
            aria-pressed={step.level === level}
            title={step.hint}
            disabled={pending}
            onClick={() => onLevelChange(step.level === level ? 0 : step.level)}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
