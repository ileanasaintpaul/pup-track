import { useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';

import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { authErrorKey } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

type Mode = 'signin' | 'signup' | 'forgot';

export function Login() {
  const { t } = useTranslation();
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const creating = mode === 'signup';
  const forgot = mode === 'forgot';
  const tooShort = creating && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(false);
    setPassword('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (forgot) {
        await requestPasswordReset(email);
        setSent(true);
      } else if (creating) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      setError(t(authErrorKey(e) as ParseKeys));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell centered">
      <div className="card">
        <p className="logo">🐾</p>
        <h1>PupTrack</h1>

        {forgot ? (
          <p className="muted">{t('auth.forgotIntro')}</p>
        ) : (
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!creating}
              className={creating ? 'tab' : 'tab tab-active'}
              onClick={() => switchMode('signin')}
            >
              {t('auth.tabs.signIn')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={creating}
              className={creating ? 'tab tab-active' : 'tab'}
              onClick={() => switchMode('signup')}
            >
              {t('auth.tabs.signUp')}
            </button>
          </div>
        )}

        {sent ? (
          <p className="muted">
            <Trans i18nKey="auth.sent" values={{ email }} components={{ 1: <strong /> }} />
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email">{t('auth.emailLabel')}</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {forgot ? null : (
              <>
                <label htmlFor="password">{t('auth.passwordLabel')}</label>
                <PasswordInput
                  key={mode}
                  id="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={creating ? 'new-password' : 'current-password'}
                  minLength={creating ? MIN_PASSWORD_LENGTH : undefined}
                />
                {creating ? (
                  <p className="muted small-text">
                    {t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
                  </p>
                ) : null}
              </>
            )}

            <button type="submit" disabled={busy || !email || (!forgot && !password) || tooShort}>
              {busy
                ? t('auth.submit.busy')
                : forgot
                  ? t('auth.submit.forgot')
                  : creating
                    ? t('auth.submit.create')
                    : t('auth.submit.signIn')}
            </button>
          </form>
        )}

        {error ? <p className="error">{error}</p> : null}

        {creating ? null : (
          <button type="button" className="linkish" onClick={() => switchMode(forgot ? 'signin' : 'forgot')}>
            {forgot ? t('auth.backToSignIn') : t('auth.forgotLink')}
          </button>
        )}
      </div>
    </main>
  );
}
