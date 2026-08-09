import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDog } from '../hooks/useDogs';
import { latestHeight, useHeights } from '../hooks/useHeights';
import { latestWeight, useWeights, weightChange } from '../hooks/useWeights';
import { ageParts, isInSocializationWindow } from '../lib/age';
import { formatCm, formatKg, formatSignedKg } from '../lib/format';

export function Home() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { data: dog } = useDog(dogId);
  const { data: weights } = useWeights(dogId);
  const { data: heights } = useHeights(dogId);

  const weight = latestWeight(weights);
  const height = latestHeight(heights);
  const change = weightChange(weights);

  const parts = ageParts(dog?.birth_date ?? null);
  const weeksLabel = parts ? t('dog.age.weeks', { count: parts.weeks }) : null;
  const age =
    parts && parts.months !== null
      ? t('dog.age.withMonths', { weeks: weeksLabel, months: parts.months })
      : weeksLabel;

  return (
    <>
      <div className="tiles">
        <div className="tile">
          <span className="tile-label">{t('home.tiles.weight')}</span>
          <span className="tile-value">
            {weight ? `${formatKg(weight.weight_kg)} kg` : t('common.empty')}
          </span>
          {change !== null ? <span className="tile-hint">{formatSignedKg(change)} kg</span> : null}
        </div>
        <div className="tile">
          <span className="tile-label">{t('home.tiles.height')}</span>
          <span className="tile-value">
            {height ? `${formatCm(height.withers_cm)} cm` : t('common.empty')}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label">{t('home.tiles.age')}</span>
          <span className="tile-value">{age ?? t('common.empty')}</span>
        </div>
      </div>

      {isInSocializationWindow(dog?.birth_date ?? null) ? (
        <p className="highlight">{t('home.socialization')}</p>
      ) : null}

      <section className="card card-disabled">
        <h2>{t('home.quickJournal.title')}</h2>
        <p className="muted">{t('home.quickJournal.body')}</p>
      </section>

      <section className="card card-disabled">
        <h2>{t('home.dailyJournal.title')}</h2>
        <p className="muted">{t('home.dailyJournal.body')}</p>
      </section>

      <section className="card card-disabled">
        <h2>{t('home.reminders.title')}</h2>
        <p className="muted">{t('home.reminders.body')}</p>
      </section>
    </>
  );
}
