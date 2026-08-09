import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { HubCard } from '../components/HubCard';
import { latestHeight, useHeights } from '../hooks/useHeights';
import { latestWeight, useWeights } from '../hooks/useWeights';
import { formatCm, formatKg } from '../lib/format';

export function Health() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { data: weights } = useWeights(dogId);
  const { data: heights } = useHeights(dogId);

  const weight = latestWeight(weights);
  const height = latestHeight(heights);
  const growthValue = [
    weight ? `${formatKg(weight.weight_kg)} kg` : null,
    height ? `${formatCm(height.withers_cm)} cm` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <h1>{t('health.title')}</h1>

      <div className="hub-grid">
        <HubCard
          icon="📈"
          title={t('health.cards.growth')}
          value={growthValue || null}
          to={`/dog/${dogId}/health/growth`}
        />
        <HubCard icon="💉" title={t('health.cards.record')} />
        <HubCard icon="🍽️" title={t('health.cards.feeding')} />
        <HubCard icon="🛁" title={t('health.cards.hygiene')} />
        <HubCard icon="🚑" title={t('health.cards.vet')} />
        <HubCard icon="🦷" title={t('health.cards.teething')} />
      </div>
    </>
  );
}
