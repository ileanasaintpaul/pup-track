import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { HeightChart } from './HeightChart';
import { useBreed } from '../hooks/useBreeds';
import { useDog } from '../hooks/useDogs';
import { useDeleteHeight, useHeights, useSaveHeight, heightChange } from '../hooks/useHeights';
import { ageInWeeks } from '../lib/age';
import { formatCm, formatLongDate, formatSignedCm, toISODate } from '../lib/format';

export function HeightPanel() {
  const { t } = useTranslation();
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: breed } = useBreed(dog?.breed_slug);
  const { data: entries, isPending } = useHeights(dogId);
  const saveHeight = useSaveHeight(dogId!);
  const deleteHeight = useDeleteHeight(dogId!);

  const today = toISODate();
  const [measuredOn, setMeasuredOn] = useState(today);
  const [height, setHeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = heightChange(entries);
  const history = entries ? [...entries].reverse() : [];
  const weeks = ageInWeeks(dog?.birth_date ?? null);
  const last = entries?.length ? entries[entries.length - 1] : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = Number(height.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('growth.height.invalid'));
      return;
    }

    try {
      await saveHeight.mutateAsync({
        measured_on: measuredOn,
        withers_cm: value,
        note: note.trim() || null,
      });
      setHeight('');
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <>
      <section className="card">
        <h2>{t('growth.height.title')}</h2>

        {isPending ? (
          <p className="muted">{t('common.loading')}</p>
        ) : entries?.length ? (
          <>
            <p className="hero">
              {formatCm(last!.withers_cm)} <span className="hero-unit">{t('growth.height.unit')}</span>
            </p>
            {change !== null ? (
              <p className="muted">{t('growth.height.change', { value: formatSignedCm(change) })}</p>
            ) : (
              <p className="muted">{t('growth.height.first')}</p>
            )}

            {entries.length > 1 ? <HeightChart entries={entries} /> : null}

            <p className="muted small-text">
              {weeks !== null ? t('growth.height.measuredAt', { weeks }) : ''}
              {t('growth.height.method')}
            </p>
          </>
        ) : (
          <p className="muted">{t('growth.height.empty')}</p>
        )}
      </section>

      <section className="card">
        <h2>{t('growth.height.addTitle')}</h2>
        <form onSubmit={submit}>
          <label htmlFor="height-date">{t('growth.height.dateLabel')}</label>
          <input
            id="height-date"
            type="date"
            max={today}
            required
            value={measuredOn}
            onChange={(e) => setMeasuredOn(e.target.value)}
          />

          <label htmlFor="height-value">{t('growth.height.valueLabel')}</label>
          <input
            id="height-value"
            type="text"
            inputMode="decimal"
            required
            placeholder={t('growth.height.valuePlaceholder')}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          <label htmlFor="height-note">{t('growth.height.noteLabel')}</label>
          <input
            id="height-note"
            type="text"
            placeholder={t('growth.height.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="submit" disabled={saveHeight.isPending || !height.trim()}>
            {saveHeight.isPending ? t('common.saving') : t('common.save')}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {breed ? (
          <p className="muted small-text">{t('growth.height.standard', { breed: breed.name })}</p>
        ) : null}
      </section>

      {history.length ? (
        <section className="card">
          <h2>{t('growth.height.historyTitle')}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>{t('growth.height.historyDate')}</th>
                <th>{t('growth.height.historyValue')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {formatLongDate(entry.measured_on)}
                    {entry.note ? <span className="muted"> · {entry.note}</span> : null}
                  </td>
                  <td className="numeric">
                    {formatCm(entry.withers_cm)} {t('growth.height.cmUnit')}
                  </td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteHeight.isPending}
                      onClick={() => deleteHeight.mutate(entry.id)}
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
    </>
  );
}
