export function Setup() {
  return (
    <main className="shell centered">
      <div className="card">
        <h1>Configuration requise</h1>
        <p className="muted">
          Copie <code>.env.example</code> vers <code>.env</code>, renseigne l'URL et la clé anon de
          ton projet Supabase, puis relance <code>npm run dev</code>.
        </p>
      </div>
    </main>
  );
}
