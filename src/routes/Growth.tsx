import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HeightPanel } from '../components/HeightPanel';
import { WeightPanel } from '../components/WeightPanel';

type Measure = 'weight' | 'height';

const STORAGE_KEY = 'puptrack.growth-measure';

function readStoredMeasure(): Measure {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'weight' || stored === 'height' ? stored : 'weight';
  } catch {
    return 'weight';
  }
}

function writeStoredMeasure(measure: Measure) {
  try {
    localStorage.setItem(STORAGE_KEY, measure);
  } catch {
    return;
  }
}

export function Growth() {
  const { t } = useTranslation();
  const [measure, setMeasure] = useState<Measure>(readStoredMeasure);

  function select(next: Measure) {
    setMeasure(next);
    writeStoredMeasure(next);
  }

  return (
    <>
      <h1>{t('growth.title')}</h1>
      <div className="chips">
        <button
          type="button"
          className={measure === 'weight' ? 'chip chip-active' : 'chip'}
          onClick={() => select('weight')}
        >
          {t('growth.toggle.weight')}
        </button>
        <button
          type="button"
          className={measure === 'height' ? 'chip chip-active' : 'chip'}
          onClick={() => select('height')}
        >
          {t('growth.toggle.height')}
        </button>
      </div>

      {measure === 'weight' ? <WeightPanel /> : <HeightPanel />}
    </>
  );
}
