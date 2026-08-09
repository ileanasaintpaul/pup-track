import { useTranslation } from 'react-i18next';

import { BackLink } from '../components/BackLink';

export function Placeholder({ titleKey }: { titleKey: 'nav.map' | 'nav.coach' }) {
  const { t } = useTranslation();

  return (
    <section className="card">
      <div className="page-title">
        <BackLink />
        <h1>{t(titleKey)}</h1>
      </div>
      <p className="muted">{t('placeholder.body')}</p>
    </section>
  );
}
