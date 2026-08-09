import { useState, type FormEvent } from 'react';

import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { authErrorMessage } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

type Mode = 'signin' | 'signup' | 'forgot';

export function Login() {
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
      setError(authErrorMessage(e));
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
          <p className="muted">
            On t'envoie un lien pour choisir un nouveau mot de passe.
          </p>
        ) : (
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!creating}
              className={creating ? 'tab' : 'tab tab-active'}
              onClick={() => switchMode('signin')}
            >
              Se connecter
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={creating}
              className={creating ? 'tab tab-active' : 'tab'}
              onClick={() => switchMode('signup')}
            >
              Créer un compte
            </button>
          </div>
        )}

        {sent ? (
          <p className="muted">
            Si un compte existe pour <strong>{email}</strong>, le lien vient de partir. Ouvre-le
            depuis ce navigateur.
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {forgot ? null : (
              <>
                <label htmlFor="password">Mot de passe</label>
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
                    Au moins {MIN_PASSWORD_LENGTH} caractères, avec des lettres et des chiffres.
                  </p>
                ) : null}
              </>
            )}

            <button type="submit" disabled={busy || !email || (!forgot && !password) || tooShort}>
              {busy
                ? 'Un instant…'
                : forgot
                  ? 'Envoyer le lien'
                  : creating
                    ? 'Créer mon compte'
                    : 'Se connecter'}
            </button>
          </form>
        )}

        {error ? <p className="error">{error}</p> : null}

        {creating ? null : (
          <button type="button" className="linkish" onClick={() => switchMode(forgot ? 'signin' : 'forgot')}>
            {forgot ? 'Revenir à la connexion' : 'Mot de passe oublié ?'}
          </button>
        )}
      </div>
    </main>
  );
}
