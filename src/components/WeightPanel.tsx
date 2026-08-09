import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import { WeightChart } from './WeightChart';
import { useBreed } from '../hooks/useBreeds';
import { useDog } from '../hooks/useDogs';
import { useGrowthCurves } from '../hooks/useGrowthCurves';
import { useDeleteWeight, useSaveWeight, useWeights, weightChange } from '../hooks/useWeights';
import { ageInWeeks } from '../lib/age';
import { formatKg, formatLongDate, formatSignedKg } from '../lib/format';
import { centileOf, expectedAt, expectedForEntries, formatCentile, rangePosition } from '../lib/growth';

export function WeightPanel() {
  const { t } = useTranslation();
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: entries, isPending } = useWeights(dogId);
  const { data: breed } = useBreed(dog?.breed_slug);
  const { data: curves } = useGrowthCurves(breed?.size_band, dog?.sex);
  const saveWeight = useSaveWeight(dogId!);
  const deleteWeight = useDeleteWeight(dogId!);

  const today = new Date().toISOString().slice(0, 10);
  const [measuredOn, setMeasuredOn] = useState(today);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = weightChange(entries);
  const history = entries ? [...entries].reverse() : [];

  const expected = entries ? expectedForEntries(entries, curves, dog?.birth_date ?? null) : null;
  const weeks = ageInWeeks(dog?.birth_date ?? null);
  const todayRange = curves && weeks !== null ? expectedAt(curves, weeks) : null;
  const lastWeight = entries?.length ? entries[entries.length - 1].weight_kg : null;
  const position = todayRange && lastWeight !== null ? rangePosition(lastWeight, todayRange) : null;
  const centile =
    curves && weeks !== null && lastWeight !== null ? centileOf(curves, weeks, lastWeight) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = Number(weight.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('growth.weight.invalid'));
      return;
    }

    try {
      await saveWeight.mutateAsync({
        measured_on: measuredOn,
        weight_kg: value,
        note: note.trim() || null,
      });
      setWeight('');
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <>
      <section className="card">
        <h2>{t('growth.weight.title')}</h2>

        {isPending ? (
          <p className="muted">{t('common.loading')}</p>
        ) : entries?.length ? (
          <>
            <p className="hero">
              {formatKg(entries[entries.length - 1].weight_kg)}{' '}
              <span className="hero-unit">{t('growth.weight.unit')}</span>
            </p>
            {change !== null ? (
              <p className="muted">{t('growth.weight.change', { value: formatSignedKg(change) })}</p>
            ) : (
              <p className="muted">{t('growth.weight.first')}</p>
            )}

            <WeightChart entries={entries} expected={expected} />

            {todayRange ? (
              <>
                <p>
                  <Trans
                    i18nKey="growth.weight.range"
                    values={{
                      weeks,
                      low: formatKg(todayRange.low),
                      high: formatKg(todayRange.high),
                    }}
                    components={{ 1: <strong /> }}
                  />{' '}
                  — {position ? t(`growth.weight.position.${position}`) : null}
                  {centile !== null
                    ? t('growth.weight.centile', { centile: formatCentile(centile) })
                    : null}
                  .
                </p>
                <p className="muted small-text">
                  {t('growth.weight.source', {
                    min: breed?.adult_min_kg,
                    max: breed?.adult_max_kg,
                    sex: t(dog?.sex === 'female' ? 'dogSex.female' : 'dogSex.male'),
                  })}
                </p>
              </>
            ) : (
              <MissingReference dog={dog} breed={breed} weeks={weeks} />
            )}
          </>
        ) : (
          <p className="muted">{t('growth.weight.empty')}</p>
        )}
      </section>

      <section className="card">
        <h2>{t('growth.weight.addTitle')}</h2>
        <form onSubmit={submit}>
          <label htmlFor="weight-date">{t('growth.weight.dateLabel')}</label>
          <input
            id="weight-date"
            type="date"
            max={today}
            required
            value={measuredOn}
            onChange={(e) => setMeasuredOn(e.target.value)}
          />

          <label htmlFor="weight-value">{t('growth.weight.valueLabel')}</label>
          <input
            id="weight-value"
            type="text"
            inputMode="decimal"
            required
            placeholder={t('growth.weight.valuePlaceholder')}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <label htmlFor="weight-note">{t('growth.weight.noteLabel')}</label>
          <input
            id="weight-note"
            type="text"
            placeholder={t('growth.weight.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="submit" disabled={saveWeight.isPending || !weight.trim()}>
            {saveWeight.isPending ? t('common.saving') : t('common.save')}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {history.length ? (
        <section className="card">
          <h2>{t('growth.weight.historyTitle')}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>{t('growth.weight.historyDate')}</th>
                <th>{t('growth.weight.historyValue')}</th>
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
                    {formatKg(entry.weight_kg)} {t('growth.weight.unit')}
                  </td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteWeight.isPending}
                      onClick={() => deleteWeight.mutate(entry.id)}
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

function MissingReference({
  dog,
  breed,
  weeks,
}: {
  dog: { id: string; sex: string | null; birth_date: string | null } | null | undefined;
  breed: { name: string } | null | undefined;
  weeks: number | null;
}) {
  const { t } = useTranslation();

  if (!dog) return null;

  const missing: string[] = [];
  if (!breed) missing.push(t('growth.weight.missingBreed'));
  if (!dog.sex) missing.push(t('growth.weight.missingSex'));
  if (!dog.birth_date) missing.push(t('growth.weight.missingBirthDate'));

  if (missing.length) {
    return (
      <p className="muted">
        {t('growth.weight.missing', { fields: missing.join(', ') })}{' '}
        <Link to={`/dog/${dog.id}/edit`} className="link">
          {t('growth.weight.missingLink')}
        </Link>
      </p>
    );
  }

  if (weeks !== null && weeks < 12) {
    return <p className="muted">{t('growth.weight.tooYoung', { count: 12 - weeks })}</p>;
  }

  return null;
}
