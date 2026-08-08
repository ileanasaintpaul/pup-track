import { useState, type FormEvent } from 'react';

import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell centered">
      <div className="card">
        <p className="logo">🐾</p>
        <h1>PupTrack</h1>

        {sent ? (
          <p className="muted">
            Lien de connexion envoyé à <strong>{email}</strong>. Ouvre-le depuis ce navigateur.
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="muted">Connecte-toi par e-mail, sans mot de passe.</p>
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
            <button type="submit" disabled={busy || !email}>
              {busy ? 'Envoi…' : 'Recevoir le lien'}
            </button>
          </form>
        )}

        {error ? <p className="error">{error}</p> : null}
      </div>
    </main>
  );
}
