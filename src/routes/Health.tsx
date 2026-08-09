import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BackLink } from '../components/BackLink';
import { HubCard } from '../components/HubCard';
import { useHealthEvents } from '../hooks/useHealthEvents';
import { latestHeight, useHeights } from '../hooks/useHeights';
import { latestWeight, useWeights } from '../hooks/useWeights';
import { formatCm, formatKg } from '../lib/format';
import { pendingReminders } from '../lib/health';

export function Health() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { data: weights } = useWeights(dogId);
  const { data: heights } = useHeights(dogId);
  const { data: healthEvents } = useHealthEvents(dogId);

  const weight = latestWeight(weights);
  const height = latestHeight(heights);
  const growthValue = [
    weight ? `${formatKg(weight.weight_kg)} kg` : null,
    height ? `${formatCm(height.withers_cm)} cm` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const nextReminder = pendingReminders(healthEvents)[0];
  const recordValue = nextReminder
    ? t('health.cards.recordValue.next', { label: nextReminder.label })
    : t('health.cards.recordValue.none');

  return (
    <>
      <div className="page-title">
        <BackLink />
        <h1>{t('health.title')}</h1>
      </div>

      <div className="hub-grid">
        <HubCard
          icon="📈"
          title={t('health.cards.growth')}
          value={growthValue || null}
          to={`/dog/${dogId}/health/growth`}
        />
        <HubCard
          icon="💉"
          title={t('health.cards.record')}
          value={recordValue}
          to={`/dog/${dogId}/health/record`}
        />
        <HubCard icon="🍽️" title={t('health.cards.feeding')} />
        <HubCard icon="🛁" title={t('health.cards.hygiene')} />
        <HubCard icon="🚑" title={t('health.cards.vet')} />
        <HubCard icon="🦷" title={t('health.cards.teething')} />
      </div>
    </>
  );
}
