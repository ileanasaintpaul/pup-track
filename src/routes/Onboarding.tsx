import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateHousehold, useJoinHousehold } from '../hooks/useHousehold';

export function Onboarding() {
  const { t } = useTranslation();
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  const [displayName, setDisplayName] = useState('');
  const [householdName, setHouseholdName] = useState(t('auth.onboarding.householdNameDefault'));
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const busy = createHousehold.isPending || joinHousehold.isPending;

  async function submit(event: FormEvent, action: () => Promise<unknown>) {
    event.preventDefault();
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <div className="shell">
      <header className="page-head">
        <p className="logo">🏡</p>
        <h1>{t('auth.onboarding.title')}</h1>
        <p className="muted">{t('auth.onboarding.intro')}</p>
      </header>

      <section className="card">
        <h2>{t('auth.onboarding.nameTitle')}</h2>
        <p className="muted">{t('auth.onboarding.nameHint')}</p>
        <input
          id="display-name"
          type="text"
          autoComplete="given-name"
          placeholder={t('auth.onboarding.namePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </section>

      <section className="card">
        <h2>{t('auth.onboarding.createTitle')}</h2>
        <form onSubmit={(e) => submit(e, () => createHousehold.mutateAsync({ name: householdName, displayName }))}>
          <label htmlFor="household-name">{t('auth.onboarding.householdNameLabel')}</label>
          <input
            id="household-name"
            type="text"
            required
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
          <button type="submit" disabled={busy || !householdName.trim()}>
            {createHousehold.isPending
              ? t('auth.onboarding.createButton.pending')
              : t('auth.onboarding.createButton.idle')}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{t('auth.onboarding.joinTitle')}</h2>
        <form onSubmit={(e) => submit(e, () => joinHousehold.mutateAsync({ code, displayName }))}>
          <label htmlFor="invite-code">{t('auth.onboarding.codeLabel')}</label>
          <input
            id="invite-code"
            type="text"
            required
            className="code-input"
            placeholder={t('auth.onboarding.codePlaceholder')}
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="submit" className="ghost" disabled={busy || code.length < 8}>
            {joinHousehold.isPending
              ? t('auth.onboarding.joinButton.pending')
              : t('auth.onboarding.joinButton.idle')}
          </button>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
