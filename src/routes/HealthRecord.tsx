import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { BackLink } from '../components/BackLink';
import { useVaccines } from '../hooks/useVaccines';
import {
  useDeleteHealthEvent,
  useHealthEvents,
  useSaveHealthEvent,
} from '../hooks/useHealthEvents';
import { formatLongDate, toISODate } from '../lib/format';
import {
  HEALTH_EVENT_TYPES,
  HEALTH_TYPE_ICONS,
  HEALTH_TYPE_KEYS,
  addMonths,
  daysUntil,
  dueStatus,
  pendingReminders,
} from '../lib/health';
import type { HealthEvent, HealthEventType, Vaccine } from '../types/models';

export function HealthRecord() {
  const { t } = useTranslation();
  const { dogId } = useParams();
  const { data: events, isPending } = useHealthEvents(dogId);
  const { data: vaccines } = useVaccines();
  const saveEvent = useSaveHealthEvent(dogId!);
  const deleteEvent = useDeleteHealthEvent(dogId!);

  const today = toISODate();
  const [type, setType] = useState<HealthEventType>('vaccine');
  const [label, setLabel] = useState('');
  const [occurredOn, setOccurredOn] = useState(today);
  const [nextDueOn, setNextDueOn] = useState('');
  const [notes, setNotes] = useState('');
  const [vaccineSlug, setVaccineSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reminders = pendingReminders(events);
  const vaccine = vaccines?.find((item) => item.slug === vaccineSlug) ?? null;
  const isVaccine = type === 'vaccine';

  function pickVaccine(slug: string) {
    setVaccineSlug(slug);
    const picked = vaccines?.find((item) => item.slug === slug);
    if (!picked) return;
    setLabel(picked.name);
    setNextDueOn(
      picked.booster_interval_months ? addMonths(occurredOn, picked.booster_interval_months) : '',
    );
  }

  function pickDate(next: string) {
    setOccurredOn(next);
    if (vaccine?.booster_interval_months) {
      setNextDueOn(addMonths(next, vaccine.booster_interval_months));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError(t('health.record.form.labelRequired'));
      return;
    }
    if (nextDueOn && nextDueOn < occurredOn) {
      setError(t('health.record.form.dueBeforeDone'));
      return;
    }

    try {
      await saveEvent.mutateAsync({
        type,
        label: label.trim(),
        vaccine_slug: isVaccine ? vaccineSlug || null : null,
        occurred_on: occurredOn,
        next_due_on: nextDueOn || null,
        notes: notes.trim() || null,
      });
      setLabel('');
      setNextDueOn('');
      setNotes('');
      setVaccineSlug('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <>
      <div className="page-title">
        <BackLink />
        <h1>{t('health.record.title')}</h1>
      </div>

      <section className="card">
        <h2>{t('health.record.reminders.title')}</h2>
        {isPending ? (
          <p className="muted">{t('common.loading')}</p>
        ) : reminders.length ? (
          <ul className="list">
            {reminders.map((event) => (
              <Reminder key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <p className="muted">{t('health.record.reminders.empty')}</p>
        )}
        <p className="muted small-text">{t('health.record.reminders.noPush')}</p>
      </section>

      <section className="card">
        <h2>{t('health.record.form.title')}</h2>
        <form onSubmit={submit}>
          <label htmlFor="event-type">{t('health.record.form.type')}</label>
          <select
            id="event-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as HealthEventType);
              setVaccineSlug('');
            }}
          >
            {HEALTH_EVENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {t(HEALTH_TYPE_KEYS[item])}
              </option>
            ))}
          </select>

          {isVaccine ? (
            <>
              <label htmlFor="event-vaccine">{t('health.record.form.vaccine')}</label>
              <select
                id="event-vaccine"
                value={vaccineSlug}
                onChange={(e) => pickVaccine(e.target.value)}
              >
                <option value="">{t('health.record.form.vaccineFree')}</option>
                <optgroup label={t('health.record.form.vaccineCore')}>
                  {vaccines
                    ?.filter((item) => item.core)
                    .map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={t('health.record.form.vaccineNonCore')}>
                  {vaccines
                    ?.filter((item) => !item.core)
                    .map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              {vaccine ? <VaccineHint vaccine={vaccine} /> : null}
            </>
          ) : null}

          <label htmlFor="event-label">{t('health.record.form.label')}</label>
          <input
            id="event-label"
            type="text"
            required
            placeholder={t('health.record.form.labelPlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <label htmlFor="event-date">{t('health.record.form.doneOn')}</label>
          <input
            id="event-date"
            type="date"
            max={today}
            required
            value={occurredOn}
            onChange={(e) => pickDate(e.target.value)}
          />

          <label htmlFor="event-due">{t('health.record.form.nextDue')}</label>
          <input
            id="event-due"
            type="date"
            min={occurredOn}
            value={nextDueOn}
            onChange={(e) => setNextDueOn(e.target.value)}
          />
          <p className="muted small-text">{t('health.record.form.nextDueHint')}</p>

          <label htmlFor="event-notes">{t('health.record.form.notes')}</label>
          <input
            id="event-notes"
            type="text"
            placeholder={t('health.record.form.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" disabled={saveEvent.isPending}>
            {saveEvent.isPending ? t('common.saving') : t('common.save')}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {events?.length ? (
        <section className="card">
          <h2>{t('health.record.history.title')}</h2>
          <ul className="list">
            {events.map((event) => (
              <li key={event.id}>
                <span>
                  <span aria-hidden="true">{HEALTH_TYPE_ICONS[event.type]} </span>
                  {event.label}
                  <span className="muted small-text">
                    {' '}
                    · {t(HEALTH_TYPE_KEYS[event.type])} · {formatLongDate(event.occurred_on)}
                  </span>
                  {event.notes ? <span className="muted small-text"> · {event.notes}</span> : null}
                </span>
                <button
                  type="button"
                  className="ghost small"
                  disabled={deleteEvent.isPending}
                  onClick={() => deleteEvent.mutate(event.id)}
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function VaccineHint({ vaccine }: { vaccine: Vaccine }) {
  const { t } = useTranslation();

  return (
    <p className="muted small-text">
      {vaccine.diseases ? `${vaccine.diseases}. ` : ''}
      {vaccine.booster_interval_months
        ? t('health.record.form.vaccineInterval', { count: vaccine.booster_interval_months })
        : t('health.record.form.vaccineNoInterval')}
      {vaccine.availability ? ` ${vaccine.availability}` : ''}{' '}
      {t('health.record.form.vaccineSource', { source: vaccine.source })}
    </p>
  );
}

function Reminder({ event }: { event: HealthEvent }) {
  const { t } = useTranslation();
  const due = event.next_due_on!;
  const status = dueStatus(due);
  const days = daysUntil(due);

  return (
    <li>
      <span>
        <span aria-hidden="true">{HEALTH_TYPE_ICONS[event.type]} </span>
        {event.label}
        <span className="muted small-text"> · {formatLongDate(due)}</span>
      </span>
      <span className={status === 'overdue' ? 'error small-text' : 'highlight small-text'}>
        {status === 'overdue'
          ? t('health.record.reminders.overdue', { count: Math.abs(days) })
          : days === 0
            ? t('health.record.reminders.today')
            : t('health.record.reminders.inDays', { count: days })}
      </span>
    </li>
  );
}
