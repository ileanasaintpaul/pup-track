import { useAuth } from '../providers/AuthProvider';

export function Home() {
  const { session, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">🐾 PupTrack</span>
        <button type="button" className="ghost" onClick={() => void signOut()}>
          Se déconnecter
        </button>
      </header>

      <main className="card">
        <h1>Bienvenue</h1>
        <p className="muted">Connecté en tant que {session?.user.email}.</p>
        <p className="muted">
          Prochaine étape : créer le foyer partagé et la fiche du chien. Les fondations sont en
          place — voir la roadmap du README.
        </p>
      </main>
    </div>
  );
}
