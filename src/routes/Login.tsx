import { useState, type FormEvent } from 'react';

import { useAuth } from '../hooks/useAuth';
import { authErrorMessage } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creating = mode === 'signup';
  const tooShort = creating && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  function switchMode(next: 'signin' | 'signup') {
    setMode(next);
    setError(null);
    setPassword('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (creating) {
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

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={creating ? MIN_PASSWORD_LENGTH : undefined}
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {creating ? (
            <p className="muted small-text">
              Au moins {MIN_PASSWORD_LENGTH} caractères, avec des lettres et des chiffres.
            </p>
          ) : null}

          <button type="submit" disabled={busy || !email || !password || tooShort}>
            {busy ? 'Un instant…' : creating ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
