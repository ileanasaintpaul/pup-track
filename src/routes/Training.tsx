import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useDog } from '../hooks/useDogs';
import {
  useAddSession,
  useDeleteSession,
  useDogSkills,
  useSetSkillLevel,
  useSkills,
  useTrainingSessions,
} from '../hooks/useTraining';
import { ageInWeeks } from '../lib/age';
import { formatLongDate } from '../lib/format';
import { ENVIRONMENTS, SKILL_LEVELS, categoryLabel } from '../lib/skills';
import type { Skill, SkillLevel } from '../types/models';

export function Training() {
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: skills } = useSkills();
  const { data: levels } = useDogSkills(dogId);
  const { data: sessions } = useTrainingSessions(dogId);
  const setLevel = useSetSkillLevel(dogId!);
  const addSession = useAddSession(dogId!);
  const deleteSession = useDeleteSession(dogId!);

  const today = new Date().toISOString().slice(0, 10);
  const [skillSlug, setSkillSlug] = useState('');
  const [occurredOn, setOccurredOn] = useState(today);
  const [duration, setDuration] = useState('5');
  const [successRate, setSuccessRate] = useState('');
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);

  const weeks = ageInWeeks(dog?.birth_date ?? null);
  const ready = skills?.filter((skill) => weeks === null || skill.min_age_weeks <= weeks) ?? [];
  const later = skills?.filter((skill) => weeks !== null && skill.min_age_weeks > weeks) ?? [];

  const started = [...(levels?.values() ?? [])].filter((entry) => entry.level > 0).length;
  const reliable = [...(levels?.values() ?? [])].filter((entry) => entry.level === 4).length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const durationValue = duration.trim() === '' ? null : Number(duration);
    const rateValue = successRate.trim() === '' ? null : Number(successRate);

    if (durationValue !== null && (!Number.isFinite(durationValue) || durationValue <= 0)) {
      setError('La durée doit être un nombre de minutes.');
      return;
    }
    if (rateValue !== null && (!Number.isFinite(rateValue) || rateValue < 0 || rateValue > 100)) {
      setError('Le taux de réussite va de 0 à 100.');
      return;
    }

    try {
      await addSession.mutateAsync({
        skill_slug: skillSlug || null,
        occurred_on: occurredOn,
        duration_min: durationValue,
        success_rate: rateValue,
        environment,
        notes: notes.trim() || null,
      });
      setSuccessRate('');
      setNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    }
  }

  const skillName = (slug: string | null) =>
    skills?.find((skill) => skill.slug === slug)?.name ?? 'Séance libre';

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="link">
          ← Retour
        </Link>
      </header>

      <section className="card">
        <h1>Éducation de {dog?.name ?? 'ton chien'}</h1>
        <p className="muted">
          {started} compétence{started > 1 ? 's' : ''} en cours, {reliable} fiable
          {reliable > 1 ? 's' : ''} dehors, {sessions?.length ?? 0} séance
          {(sessions?.length ?? 0) > 1 ? 's' : ''} enregistrée
          {(sessions?.length ?? 0) > 1 ? 's' : ''}.
        </p>
      </section>

      <section className="card">
        <h2>{weeks === null ? 'Compétences' : `À travailler à ${weeks} semaines`}</h2>
        {ready.map((skill) => (
          <SkillRow
            key={skill.slug}
            skill={skill}
            level={(levels?.get(skill.slug)?.level ?? 0) as SkillLevel}
            pending={setLevel.isPending}
            onChange={(level) => setLevel.mutate({ skillSlug: skill.slug, level })}
          />
        ))}
        {setLevel.error ? <p className="error">{(setLevel.error as Error).message}</p> : null}
      </section>

      {later.length ? (
        <section className="card">
          <div className="card-head">
            <h2>Plus tard</h2>
            <button type="button" className="linkish" onClick={() => setShowLater((v) => !v)}>
              {showLater ? 'Masquer' : `Voir les ${later.length}`}
            </button>
          </div>
          {showLater
            ? later.map((skill) => (
                <SkillRow
                  key={skill.slug}
                  skill={skill}
                  level={(levels?.get(skill.slug)?.level ?? 0) as SkillLevel}
                  pending={setLevel.isPending}
                  onChange={(level) => setLevel.mutate({ skillSlug: skill.slug, level })}
                />
              ))
            : (
                <p className="muted">
                  Recommandé à partir de {Math.min(...later.map((skill) => skill.min_age_weeks))}{' '}
                  semaines.
                </p>
              )}
        </section>
      ) : null}

      <section className="card">
        <h2>Enregistrer une séance</h2>
        <form onSubmit={submit}>
          <label htmlFor="session-skill">Compétence</label>
          <select id="session-skill" value={skillSlug} onChange={(e) => setSkillSlug(e.target.value)}>
            <option value="">Séance libre</option>
            {skills?.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </select>

          <label htmlFor="session-date">Date</label>
          <input
            id="session-date"
            type="date"
            max={today}
            required
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
          />

          <label htmlFor="session-duration">Durée en minutes</label>
          <input
            id="session-duration"
            type="number"
            min={1}
            max={240}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <label htmlFor="session-rate">Taux de réussite en pourcentage</label>
          <input
            id="session-rate"
            type="number"
            min={0}
            max={100}
            placeholder="8 réussites sur 10 → 80"
            value={successRate}
            onChange={(e) => setSuccessRate(e.target.value)}
          />

          <label htmlFor="session-environment">Environnement</label>
          <select
            id="session-environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            {ENVIRONMENTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="session-notes">Note</label>
          <input
            id="session-notes"
            type="text"
            placeholder="Fatiguée après 3 minutes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" disabled={addSession.isPending}>
            {addSession.isPending ? 'Enregistrement…' : 'Enregistrer la séance'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {sessions?.length ? (
        <section className="card">
          <h2>Séances</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Compétence</th>
                <th className="numeric">Réussite</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    {formatLongDate(session.occurred_on)}
                    {session.duration_min ? (
                      <span className="muted"> · {session.duration_min} min</span>
                    ) : null}
                    {session.environment ? (
                      <span className="muted"> · {session.environment}</span>
                    ) : null}
                    {session.notes ? <span className="muted"> · {session.notes}</span> : null}
                  </td>
                  <td>{skillName(session.skill_slug)}</td>
                  <td className="numeric">
                    {session.success_rate === null ? '—' : `${session.success_rate} %`}
                  </td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteSession.isPending}
                      onClick={() => deleteSession.mutate(session.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

function SkillRow({
  skill,
  level,
  pending,
  onChange,
}: {
  skill: Skill;
  level: SkillLevel;
  pending: boolean;
  onChange: (level: SkillLevel) => void;
}) {
  return (
    <div className="skill">
      <div className="skill-head">
        <span className="skill-name">{skill.name}</span>
        <span className="muted small-text">{categoryLabel(skill.category)}</span>
      </div>
      {skill.description ? <p className="muted small-text">{skill.description}</p> : null}
      <div className="steps" role="group" aria-label={`Palier pour ${skill.name}`}>
        {SKILL_LEVELS.map((step) => (
          <button
            key={step.level}
            type="button"
            className={step.level > 0 && step.level <= level ? 'step step-reached' : 'step'}
            aria-pressed={step.level === level}
            title={step.hint}
            disabled={pending}
            onClick={() => onChange(step.level === level ? 0 : step.level)}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
