import { useEffect, useState, type FormEvent } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Collections } from '../components/Collections';
import { DogLists } from '../components/DogLists';
import { SkillPickerDialog } from '../components/SkillPickerDialog';
import { SkillProgress } from '../components/SkillProgress';
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
import { formatLongDate, toISODate } from '../lib/format';
import { buildProgress } from '../lib/progress';
import { ENVIRONMENTS, FOUNDATION_CATEGORIES, environmentLabelKey, type Key } from '../lib/skills';
import type { Skill, SkillLevel } from '../types/models';

type View = 'age' | 'favourites' | 'progress' | 'lists' | 'collections' | 'all';

const VIEWS = [
  { view: 'age', key: 'training.views.age' },
  { view: 'favourites', key: 'training.views.favourites' },
  { view: 'progress', key: 'training.views.progress' },
  { view: 'lists', key: 'training.views.lists' },
  { view: 'collections', key: 'training.views.collections' },
  { view: 'all', key: 'training.views.all' },
] as const satisfies { view: View; key: string }[];

const VIEW_STORAGE_KEY = 'puptrack.training-view';

export function Training() {
  const { t } = useTranslation();
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

  const today = toISODate();
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
  const progress = buildProgress(skills, sessions, levels);
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
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  const skillName = (slug: string | null) =>
    skills?.find((skill) => skill.slug === slug)?.name ?? t('training.sessions.freeSession');

  return (
    <>
      <section className="card">
        <h1>{t('training.summary.title', { name: dog?.name ?? t('training.summary.dogFallback') })}</h1>
        <p className="muted">
          {t('training.summary.started', { count: started })},{' '}
          {t('training.summary.reliable', { count: reliable })},{' '}
          {t('training.summary.favourites', { count: favourites })},{' '}
          {t('training.summary.sessions', { count: sessions?.length ?? 0 })}.
        </p>
        <div className="chips" role="group" aria-label={t('training.views.groupLabel')}>
          {VIEWS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={view === item.view ? 'chip chip-active' : 'chip'}
              aria-pressed={view === item.view}
              onClick={() => setView(item.view)}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      </section>

      {view === 'progress' ? (
        progress.length ? (
          progress.map((entry) => <SkillProgress key={entry.skill.slug} entry={entry} />)
        ) : (
          <section className="card">
            <p className="muted">{t('training.progress.empty')}</p>
          </section>
        )
      ) : view === 'lists' ? (
        <DogLists dogId={dogId!} lists={lists} skills={skills} onOpenPicker={setPickerList} />
      ) : view === 'collections' ? (
        <Collections dogId={dogId!} collections={collections} skills={skills} weeks={weeks} />
      ) : (
        <section className="card">
          <h2>{viewTitle(t, view, weeks)}</h2>
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
              {t(view === 'favourites' ? 'training.catalog.emptyFavourites' : 'training.catalog.emptyGeneric')}
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2>{t('training.sessions.formTitle')}</h2>
        <form onSubmit={submit}>
          <label htmlFor="session-skill">{t('training.sessions.skillLabel')}</label>
          <select id="session-skill" value={skillSlug} onChange={(e) => setSkillSlug(e.target.value)}>
            <option value="">{t('training.sessions.freeSession')}</option>
            {skills?.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </select>

          <label htmlFor="session-date">{t('training.sessions.dateLabel')}</label>
          <input
            id="session-date"
            type="date"
            max={today}
            required
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
          />

          <label htmlFor="session-duration">{t('training.sessions.durationLabel')}</label>
          <input
            id="session-duration"
            type="number"
            min={1}
            max={240}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <label htmlFor="session-rate">{t('training.sessions.rateLabel')}</label>
          <input
            id="session-rate"
            type="number"
            min={0}
            max={100}
            placeholder={t('training.sessions.ratePlaceholder')}
            value={successRate}
            onChange={(e) => setSuccessRate(e.target.value)}
          />

          <label htmlFor="session-environment">{t('training.sessions.environmentLabel')}</label>
          <select
            id="session-environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            {ENVIRONMENTS.map((item) => (
              <option key={item} value={item}>
                {t(environmentLabelKey(item) as Key)}
              </option>
            ))}
          </select>

          <label htmlFor="session-notes">{t('training.sessions.notesLabel')}</label>
          <input
            id="session-notes"
            type="text"
            placeholder={t('training.sessions.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" disabled={addSession.isPending}>
            {addSession.isPending ? t('common.saving') : t('training.sessions.submit')}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {sessions?.length ? (
        <section className="card">
          <h2>{t('training.sessions.listTitle')}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>{t('training.sessions.dateLabel')}</th>
                <th>{t('training.sessions.skillColumn')}</th>
                <th className="numeric">{t('training.sessions.rateColumn')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    {formatLongDate(session.occurred_on)}
                    {session.duration_min ? (
                      <span className="muted">
                        {' '}
                        · {t('training.sessions.durationValue', { value: session.duration_min })}
                      </span>
                    ) : null}
                    {session.environment ? (
                      <span className="muted">
                        {' '}
                        · {t(environmentLabelKey(session.environment) as Key)}
                      </span>
                    ) : null}
                  </td>
                  <td>{skillName(session.skill_slug)}</td>
                  <td className="numeric">
                    {session.success_rate === null
                      ? t('common.empty')
                      : t('training.sessions.rateValue', { value: session.success_rate })}
                  </td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteSession.isPending}
                      onClick={() => deleteSession.mutate(session.id)}
                    >
                      {t('common.delete')}
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
        title={
          activeList
            ? t('training.picker.addToListTitle', { name: activeList.name })
            : t('training.picker.addTitle')
        }
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
    </>
  );
}

function viewTitle(t: TFunction, view: View, weeks: number | null): string {
  if (view === 'favourites') return t('training.views.favourites');
  if (view === 'all') return t('training.views.all');
  return weeks === null ? t('training.catalog.titleDefault') : t('training.catalog.titleForAge', { weeks });
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
  return skills.filter(
    (skill) =>
      FOUNDATION_CATEGORIES.includes(skill.category) &&
      (weeks === null || skill.min_age_weeks <= weeks),
  );
}
