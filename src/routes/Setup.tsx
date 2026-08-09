import { Trans, useTranslation } from 'react-i18next';

export function Setup() {
  const { t } = useTranslation();

  return (
    <main className="shell centered">
      <div className="card">
        <h1>{t('setup.title')}</h1>
        <p className="muted">
          <Trans
            i18nKey="setup.body"
            components={{ 1: <code />, 2: <code />, 3: <code /> }}
          />
        </p>
      </div>
    </main>
  );
}
