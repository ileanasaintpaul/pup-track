import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { authErrorMessage } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPassword() {
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
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading || (!session && !graceElapsed)) return <p className="centered muted">Chargement…</p>;

  if (!session) {
    return (
      <main className="shell centered">
        <div className="card">
          <h1>Lien expiré</h1>
          <p className="muted">
            Ce lien de récupération n'est plus valable. Demande-en un nouveau depuis l'écran de
            connexion.
          </p>
          <button type="button" onClick={() => navigate('/login')}>
            Retour à la connexion
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell centered">
      <div className="card">
        <p className="logo">🔑</p>
        <h1>Nouveau mot de passe</h1>

        <form onSubmit={onSubmit}>
          <label htmlFor="new-password">Mot de passe</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="muted small-text">
            Au moins {MIN_PASSWORD_LENGTH} caractères, avec des lettres et des chiffres.
          </p>

          <label htmlFor="confirm-password">Confirmation</label>
          <input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          {mismatch ? <p className="error">Les deux mots de passe diffèrent.</p> : null}

          <button type="submit" disabled={busy || tooShort || mismatch || !confirmation}>
            {busy ? 'Enregistrement…' : 'Changer mon mot de passe'}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
