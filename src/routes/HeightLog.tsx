import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { HeightChart } from '../components/HeightChart';
import { useBreed } from '../hooks/useBreeds';
import { useDog } from '../hooks/useDogs';
import { useDeleteHeight, useHeights, useSaveHeight, heightChange } from '../hooks/useHeights';
import { ageInWeeks } from '../lib/age';
import { formatCm, formatLongDate, formatSignedCm } from '../lib/format';

export function HeightLog() {
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: breed } = useBreed(dog?.breed_slug);
  const { data: entries, isPending } = useHeights(dogId);
  const saveHeight = useSaveHeight(dogId!);
  const deleteHeight = useDeleteHeight(dogId!);

  const today = new Date().toISOString().slice(0, 10);
  const [measuredOn, setMeasuredOn] = useState(today);
  const [height, setHeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = heightChange(entries);
  const history = entries ? [...entries].reverse() : [];
  const weeks = ageInWeeks(dog?.birth_date ?? null);
  const last = entries?.length ? entries[entries.length - 1] : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = Number(height.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError('Entre une taille en centimètres, par exemple 26,5');
      return;
    }

    try {
      await saveHeight.mutateAsync({
        measured_on: measuredOn,
        withers_cm: value,
        note: note.trim() || null,
      });
      setHeight('');
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="link">
          ← Retour
        </Link>
      </header>

      <section className="card">
        <h1>Taille de {dog?.name ?? 'ton chien'}</h1>

        {isPending ? (
          <p className="muted">Chargement…</p>
        ) : entries?.length ? (
          <>
            <p className="hero">
              {formatCm(last!.withers_cm)} <span className="hero-unit">cm au garrot</span>
            </p>
            {change !== null ? (
              <p className="muted">{formatSignedCm(change)} cm depuis la mesure précédente</p>
            ) : (
              <p className="muted">Première mesure enregistrée.</p>
            )}

            {entries.length > 1 ? <HeightChart entries={entries} /> : null}

            <p className="muted small-text">
              {weeks !== null ? `Mesuré à ${weeks} semaines. ` : ''}
              La taille au garrot se prend du sol au sommet des omoplates, chien debout sur un sol
              plat. Aucun barème publié n'existe par race et par âge : la courbe montre sa
              progression à lui, sans comparaison.
            </p>
          </>
        ) : (
          <p className="muted">
            Aucune mesure pour l'instant. La taille au garrot se prend du sol au sommet des
            omoplates, chien debout sur un sol plat.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Ajouter une mesure</h2>
        <form onSubmit={submit}>
          <label htmlFor="height-date">Date</label>
          <input
            id="height-date"
            type="date"
            max={today}
            required
            value={measuredOn}
            onChange={(e) => setMeasuredOn(e.target.value)}
          />

          <label htmlFor="height-value">Taille au garrot en centimètres</label>
          <input
            id="height-value"
            type="text"
            inputMode="decimal"
            required
            placeholder="26,5"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          <label htmlFor="height-note">Note</label>
          <input
            id="height-note"
            type="text"
            placeholder="Mesuré contre le mur"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="submit" disabled={saveHeight.isPending || !height.trim()}>
            {saveHeight.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {breed ? (
          <p className="muted small-text">
            {breed.name} : le standard de race donne une taille adulte, pas une courbe de
            croissance. À confirmer auprès du club de race ou du vétérinaire.
          </p>
        ) : null}
      </section>

      {history.length ? (
        <section className="card">
          <h2>Historique</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Taille</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {formatLongDate(entry.measured_on)}
                    {entry.note ? <span className="muted"> · {entry.note}</span> : null}
                  </td>
                  <td className="numeric">{formatCm(entry.withers_cm)} cm</td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteHeight.isPending}
                      onClick={() => deleteHeight.mutate(entry.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
