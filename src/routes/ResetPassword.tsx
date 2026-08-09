import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';

import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { authErrorKey } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPassword() {
  const { t } = useTranslation();
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGraceElapsed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== password;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      navigate('/');
    } catch (e) {
      setError(t(authErrorKey(e) as ParseKeys));
    } finally {
      setBusy(false);
    }
  }

  if (loading || (!session && !graceElapsed)) return <p className="centered muted">{t('common.loading')}</p>;

  if (!session) {
    return (
      <main className="shell centered">
        <div className="card">
          <h1>{t('auth.expiredTitle')}</h1>
          <p className="muted">{t('auth.expiredBody')}</p>
          <button type="button" onClick={() => navigate('/login')}>
            {t('auth.returnToLogin')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell centered">
      <div className="card">
        <p className="logo">🔑</p>
        <h1>{t('auth.resetTitle')}</h1>

        <form onSubmit={onSubmit}>
          <label htmlFor="new-password">{t('auth.passwordLabel')}</label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <p className="muted small-text">
            {t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
          </p>

          <label htmlFor="confirm-password">{t('auth.confirmLabel')}</label>
          <PasswordInput
            id="confirm-password"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />
          {mismatch ? <p className="error">{t('auth.mismatch')}</p> : null}

          <button type="submit" disabled={busy || tooShort || mismatch || !confirmation}>
            {busy ? t('common.saving') : t('auth.resetSubmit')}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
