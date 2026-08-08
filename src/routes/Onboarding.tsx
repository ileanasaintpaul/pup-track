import { useState, type FormEvent } from 'react';

import { useCreateHousehold, useJoinHousehold } from '../hooks/useHousehold';

export function Onboarding() {
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  const [displayName, setDisplayName] = useState('');
  const [householdName, setHouseholdName] = useState('Ma maison');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const busy = createHousehold.isPending || joinHousehold.isPending;

  async function submit(event: FormEvent, action: () => Promise<unknown>) {
    event.preventDefault();
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    }
  }

  return (
    <div className="shell">
      <header className="page-head">
        <p className="logo">🏡</p>
        <h1>Un foyer pour deux</h1>
        <p className="muted">
          Les données du chien appartiennent au foyer. Tout ce que l'un enregistre, l'autre le voit.
        </p>
      </header>

      <section className="card">
        <h2>Ton prénom</h2>
        <p className="muted">Pour que l'autre maître sache qui a enregistré quoi.</p>
        <input
          id="display-name"
          type="text"
          autoComplete="given-name"
          placeholder="Ileana"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </section>

      <section className="card">
        <h2>Créer un foyer</h2>
        <form onSubmit={(e) => submit(e, () => createHousehold.mutateAsync({ name: householdName, displayName }))}>
          <label htmlFor="household-name">Nom du foyer</label>
          <input
            id="household-name"
            type="text"
            required
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
          <button type="submit" disabled={busy || !householdName.trim()}>
            {createHousehold.isPending ? 'Création…' : 'Créer'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Rejoindre un foyer</h2>
        <form onSubmit={(e) => submit(e, () => joinHousehold.mutateAsync({ code, displayName }))}>
          <label htmlFor="invite-code">Code d'invitation</label>
          <input
            id="invite-code"
            type="text"
            required
            className="code-input"
            placeholder="XXXXXXXX"
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="submit" className="ghost" disabled={busy || code.length < 8}>
            {joinHousehold.isPending ? 'Connexion…' : 'Rejoindre'}
          </button>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
