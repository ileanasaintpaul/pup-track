import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Collections } from '../components/Collections';
import { DogLists } from '../components/DogLists';
import { SkillPickerDialog } from '../components/SkillPickerDialog';
import { SkillRow } from '../components/SkillRow';
import { useDog } from '../hooks/useDogs';
import {
  useAddSession,
  useDeleteSession,
  useDogSkills,
  useSetSkillLevel,
  useSkills,
  useTrainingSessions,
} from '../hooks/useTraining';
import { useCollections, useDogLists, useListActions, useToggleFavourite } from '../hooks/useTrainingLists';
import { ageInWeeks } from '../lib/age';
import { formatLongDate } from '../lib/format';
import { ENVIRONMENTS } from '../lib/skills';
import type { Skill, SkillLevel } from '../types/models';

type View = 'age' | 'favourites' | 'lists' | 'collections' | 'all';

const VIEWS: { view: View; label: string }[] = [
  { view: 'age', label: 'Pour son âge' },
  { view: 'favourites', label: 'Favoris' },
  { view: 'lists', label: 'Mes listes' },
  { view: 'collections', label: 'Listes toutes faites' },
  { view: 'all', label: 'Tout le catalogue' },
];

const VIEW_STORAGE_KEY = 'puptrack.training-view';

export function Training() {
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: skills } = useSkills();
  const { data: levels } = useDogSkills(dogId);
  const { data: sessions } = useTrainingSessions(dogId);
  const { data: collections } = useCollections();
  const { data: lists } = useDogLists(dogId);

  const setLevel = useSetSkillLevel(dogId!);
  const toggleFavourite = useToggleFavourite(dogId!);
  const addSession = useAddSession(dogId!);
  const deleteSession = useDeleteSession(dogId!);
  const { addToList } = useListActions(dogId!);

  const [view, setView] = useState<View>('age');
  const [pickerList, setPickerList] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY) as View | null;
    if (stored && VIEWS.some((item) => item.view === stored)) setView(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const today = new Date().toISOString().slice(0, 10);
  const [skillSlug, setSkillSlug] = useState('');
  const [occurredOn, setOccurredOn] = useState(today);
  const [duration, setDuration] = useState('5');
  const [successRate, setSuccessRate] = useState('');
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const weeks = ageInWeeks(dog?.birth_date ?? null);
  const started = [...(levels?.values() ?? [])].filter((entry) => entry.level > 0).length;
  const reliable = [...(levels?.values() ?? [])].filter((entry) => entry.level === 4).length;
  const favourites = [...(levels?.values() ?? [])].filter((entry) => entry.favourite).length;

  const visible = pickVisible(skills, view, weeks, levels);
  const activeList = lists?.find((list) => list.id === pickerList) ?? null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const durationValue = duration.trim() === '' ? null : Number(duration);
    const rateValue = successRate.trim() === '' ? null : Number(successRate);

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
          {started} en cours, {reliable} fiable{reliable > 1 ? 's' : ''} dehors, {favourites} favori
          {favourites > 1 ? 's' : ''}, {sessions?.length ?? 0} séance
          {(sessions?.length ?? 0) > 1 ? 's' : ''}.
        </p>
        <div className="chips" role="group" aria-label="Affichage">
          {VIEWS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={view === item.view ? 'chip chip-active' : 'chip'}
              aria-pressed={view === item.view}
              onClick={() => setView(item.view)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {view === 'lists' ? (
        <DogLists dogId={dogId!} lists={lists} skills={skills} onOpenPicker={setPickerList} />
      ) : view === 'collections' ? (
        <Collections dogId={dogId!} collections={collections} skills={skills} weeks={weeks} />
      ) : (
        <section className="card">
          <h2>{viewTitle(view, weeks)}</h2>
          {visible.length ? (
            visible.map((skill) => (
              <SkillRow
                key={skill.slug}
                skill={skill}
                level={(levels?.get(skill.slug)?.level ?? 0) as SkillLevel}
                favourite={levels?.get(skill.slug)?.favourite ?? false}
                pending={setLevel.isPending}
                onLevelChange={(next) => setLevel.mutate({ skillSlug: skill.slug, level: next })}
                onToggleFavourite={() =>
                  toggleFavourite.mutate({
                    skillSlug: skill.slug,
                    favourite: !(levels?.get(skill.slug)?.favourite ?? false),
                  })
                }
              />
            ))
          ) : (
            <p className="muted">
              {view === 'favourites'
                ? 'Aucun favori. Touche l’étoile sur un tour pour le retrouver ici.'
                : 'Rien à afficher.'}
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2>Enregistrer une séance</h2>
        <form onSubmit={submit}>
          <label htmlFor="session-skill">Tour travaillé</label>
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
                <th>Tour</th>
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

      <SkillPickerDialog
        open={pickerList !== null}
        skills={skills}
        title={activeList ? `Ajouter à « ${activeList.name} »` : 'Ajouter un tour'}
        alreadyIn={new Set(activeList?.items.map((item) => item.skill_slug) ?? [])}
        onClose={() => setPickerList(null)}
        onPick={(skill) => {
          if (!activeList) return;
          addToList.mutate({
            listId: activeList.id,
            skillSlug: skill.slug,
            position: activeList.items.length + 1,
          });
        }}
      />
    </div>
  );
}

function viewTitle(view: View, weeks: number | null): string {
  if (view === 'favourites') return 'Favoris';
  if (view === 'all') return 'Tout le catalogue';
  return weeks === null ? 'Tours' : `Pour ses ${weeks} semaines`;
}

function pickVisible(
  skills: Skill[] | undefined,
  view: View,
  weeks: number | null,
  levels: Map<string, { favourite: boolean }> | undefined,
): Skill[] {
  if (!skills) return [];
  if (view === 'all') return skills;
  if (view === 'favourites') return skills.filter((skill) => levels?.get(skill.slug)?.favourite);
  return skills.filter((skill) => weeks === null || skill.min_age_weeks <= weeks);
}
