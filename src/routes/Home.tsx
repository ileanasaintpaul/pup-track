import { useState } from 'react';

import { useCreateInvite, useHousehold, useMembers } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';

export function Home() {
  const { session, signOut } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: members } = useMembers(household?.id);
  const createInvite = useCreateInvite();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">🐾 PupTrack</span>
        <button type="button" className="ghost" onClick={() => void signOut()}>
          Se déconnecter
        </button>
      </header>

      <section className="card">
        <h1>{household?.name}</h1>
        <ul className="list">
          {members?.map((member) => (
            <li key={member.user_id}>
              <span>
                {member.display_name || (member.user_id === session?.user.id ? 'Toi' : 'Membre')}
              </span>
              <span className="muted">{member.role === 'owner' ? 'propriétaire' : 'membre'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Inviter l'autre maître</h2>
        {code ? (
          <>
            <p className="code">{code}</p>
            <p className="muted">Valable 7 jours, utilisable une fois.</p>
            <button type="button" className="ghost" onClick={() => void copy()}>
              {copied ? 'Copié' : 'Copier le code'}
            </button>
          </>
        ) : (
          <>
            <p className="muted">
              Génère un code, transmets-le, et vous suivrez le chien sur les mêmes données.
            </p>
            <button
              type="button"
              disabled={!household || createInvite.isPending}
              onClick={async () => setCode(await createInvite.mutateAsync(household!.id))}
            >
              {createInvite.isPending ? 'Génération…' : 'Générer un code'}
            </button>
          </>
        )}
        {createInvite.error ? (
          <p className="error">{(createInvite.error as Error).message}</p>
        ) : null}
      </section>

      <section className="card">
        <h2>Le chien</h2>
        <p className="muted">Prochaine étape : la fiche du chien et sa courbe de croissance.</p>
      </section>
    </div>
  );
}
