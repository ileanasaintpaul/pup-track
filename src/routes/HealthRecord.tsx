import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { BackLink } from '../components/BackLink';
import { ProductPickerDialog } from '../components/ProductPickerDialog';
import {
  useDeleteHealthEvent,
  useHealthEvents,
  useSaveHealthEvents,
} from '../hooks/useHealthEvents';
import { useHealthProducts } from '../hooks/useHealthProducts';
import { formatLongDate, toISODate } from '../lib/format';
import {
  HEALTH_TYPE_ICONS,
  HEALTH_TYPE_KEYS,
  addMonths,
  daysUntil,
  dueStatus,
  pendingReminders,
} from '../lib/health';
import type { HealthEvent, HealthProduct } from '../types/models';

export function HealthRecord() {
  const { t } = useTranslation();
  const { dogId } = useParams();
  const { data: events, isPending } = useHealthEvents(dogId);
  const { data: products } = useHealthProducts();
  const saveEvents = useSaveHealthEvents(dogId!);
  const deleteEvent = useDeleteHealthEvent(dogId!);

  const today = toISODate();
  const [occurredOn, setOccurredOn] = useState(today);
  const [notes, setNotes] = useState('');
  const [picked, setPicked] = useState<HealthProduct[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reminders = pendingReminders(events);
  const selectedSlugs = new Set(picked.map((product) => product.slug));

  function toggle(product: HealthProduct) {
    setPicked((current) =>
      current.some((item) => item.slug === product.slug)
        ? current.filter((item) => item.slug !== product.slug)
        : [...current, product],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!picked.length) {
      setError(t('health.record.form.pickRequired'));
      return;
    }

    try {
      await saveEvents.mutateAsync(
        picked.map((product) => ({
          type: product.type,
          label: product.name,
          product_slug: product.slug,
          occurred_on: occurredOn,
          next_due_on: product.booster_interval_months
            ? addMonths(occurredOn, product.booster_interval_months)
            : null,
          notes: notes.trim() || null,
        })),
      );
      setPicked([]);
      setNotes('');
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
          <label htmlFor="event-date">{t('health.record.form.doneOn')}</label>
          <input
            id="event-date"
            type="date"
            max={today}
            required
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
          />

          <span className="field-label">{t('health.record.form.products')}</span>
          <button type="button" className="picker-trigger" onClick={() => setPickerOpen(true)}>
            <span className={picked.length ? 'picker-value' : 'muted'}>
              {picked.length
                ? picked.map((product) => product.name).join(', ')
                : t('health.record.form.productsEmpty')}
            </span>
            <span aria-hidden="true">›</span>
          </button>

          {picked.length ? (
            <ul className="list">
              {picked.map((product) => (
                <li key={product.slug}>
                  <span>
                    <span aria-hidden="true">{HEALTH_TYPE_ICONS[product.type]} </span>
                    {product.name}
                  </span>
                  <span className="muted small-text">
                    {product.booster_interval_months
                      ? t('health.record.form.dueOn', {
                          date: formatLongDate(
                            addMonths(occurredOn, product.booster_interval_months),
                          ),
                        })
                      : t('health.record.form.noDue')}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <label htmlFor="event-notes">{t('health.record.form.notes')}</label>
          <input
            id="event-notes"
            type="text"
            placeholder={t('health.record.form.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" disabled={saveEvents.isPending || !picked.length}>
            {saveEvents.isPending
              ? t('common.saving')
              : t('health.record.form.submit', { count: picked.length })}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        <p className="muted small-text">{t('health.record.form.sourceHint')}</p>
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

      <ProductPickerDialog
        open={pickerOpen}
        products={products}
        selected={selectedSlugs}
        onToggle={toggle}
        onClose={() => setPickerOpen(false)}
      />
    </>
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
