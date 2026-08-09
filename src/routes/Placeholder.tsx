import { useTranslation } from 'react-i18next';

export function Placeholder({ titleKey }: { titleKey: 'nav.map' | 'nav.coach' }) {
  const { t } = useTranslation();

  return (
    <section className="card">
      <h1>{t(titleKey)}</h1>
      <p className="muted">{t('placeholder.body')}</p>
    </section>
  );
}
