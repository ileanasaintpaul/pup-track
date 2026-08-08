import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useDogs } from '../hooks/useDogs';
import { useCreateInvite, useHousehold, useMembers } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';
import { formatAge, isInSocializationWindow } from '../lib/age';
import type { Dog } from '../types/models';

export function Home() {
  const { session, signOut } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: members } = useMembers(household?.id);
  const { data: dogs, isPending: dogsPending } = useDogs(household?.id);
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

      {dogsPending ? (
        <section className="card">
          <p className="muted">Chargement…</p>
        </section>
      ) : dogs?.length ? (
        dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)
      ) : (
        <section className="card">
          <h2>Le chien</h2>
          <p className="muted">Crée sa fiche pour commencer le suivi.</p>
          <Link to="/dog/new" className="button">
            Ajouter le chien
          </Link>
        </section>
      )}

      <section className="card">
        <h2>{household?.name}</h2>
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

        {code ? (
          <>
            <p className="code">{code}</p>
            <p className="muted">Valable 7 jours, utilisable une fois.</p>
            <button type="button" className="ghost" onClick={() => void copy()}>
              {copied ? 'Copié' : 'Copier le code'}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            disabled={!household || createInvite.isPending}
            onClick={async () => setCode(await createInvite.mutateAsync(household!.id))}
          >
            {createInvite.isPending ? 'Génération…' : "Inviter l'autre maître"}
          </button>
        )}
        {createInvite.error ? (
          <p className="error">{(createInvite.error as Error).message}</p>
        ) : null}
      </section>
    </div>
  );
}

function DogCard({ dog }: { dog: Dog }) {
  const age = formatAge(dog.birth_date);

  return (
    <section className="card">
      <div className="card-head">
        <h1>{dog.name}</h1>
        <Link to={`/dog/${dog.id}`} className="link">
          Modifier
        </Link>
      </div>

      <ul className="list">
        <li>
          <span className="muted">Race</span>
          <span>{dog.breed || '—'}</span>
        </li>
        <li>
          <span className="muted">Âge</span>
          <span>{age ?? '—'}</span>
        </li>
        <li>
          <span className="muted">Sexe</span>
          <span>{dog.sex === 'female' ? 'Femelle' : dog.sex === 'male' ? 'Mâle' : '—'}</span>
        </li>
      </ul>

      {isInSocializationWindow(dog.birth_date) ? (
        <p className="highlight">
          Période critique de socialisation : chaque nouvelle expérience compte jusqu'à 16 semaines.
        </p>
      ) : null}
    </section>
  );
}
