import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { WeightChart } from '../components/WeightChart';
import { useDog } from '../hooks/useDogs';
import { useDeleteWeight, useSaveWeight, useWeights, weightChange } from '../hooks/useWeights';
import { formatKg, formatLongDate, formatSignedKg } from '../lib/format';

export function WeightLog() {
  const { dogId } = useParams();
  const { data: dog } = useDog(dogId);
  const { data: entries, isPending } = useWeights(dogId);
  const saveWeight = useSaveWeight(dogId!);
  const deleteWeight = useDeleteWeight(dogId!);

  const today = new Date().toISOString().slice(0, 10);
  const [measuredOn, setMeasuredOn] = useState(today);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = weightChange(entries);
  const history = entries ? [...entries].reverse() : [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const value = Number(weight.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError('Entre un poids en kilos, par exemple 5,4');
      return;
    }

    try {
      await saveWeight.mutateAsync({
        measured_on: measuredOn,
        weight_kg: value,
        note: note.trim() || null,
      });
      setWeight('');
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
        <h1>Poids de {dog?.name ?? 'ton chien'}</h1>

        {isPending ? (
          <p className="muted">Chargement…</p>
        ) : entries?.length ? (
          <>
            <p className="hero">
              {formatKg(entries[entries.length - 1].weight_kg)} <span className="hero-unit">kg</span>
            </p>
            {change !== null ? (
              <p className="muted">{formatSignedKg(change)} kg depuis la pesée précédente</p>
            ) : (
              <p className="muted">Première pesée enregistrée.</p>
            )}
            <WeightChart entries={entries} />
          </>
        ) : (
          <p className="muted">Aucune pesée pour l'instant. Ajoute la première ci-dessous.</p>
        )}
      </section>

      <section className="card">
        <h2>Ajouter une pesée</h2>
        <form onSubmit={submit}>
          <label htmlFor="weight-date">Date</label>
          <input
            id="weight-date"
            type="date"
            max={today}
            required
            value={measuredOn}
            onChange={(e) => setMeasuredOn(e.target.value)}
          />

          <label htmlFor="weight-value">Poids en kilos</label>
          <input
            id="weight-value"
            type="text"
            inputMode="decimal"
            required
            placeholder="5,4"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <label htmlFor="weight-note">Note</label>
          <input
            id="weight-note"
            type="text"
            placeholder="Après la visite chez le véto"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="submit" disabled={saveWeight.isPending || !weight.trim()}>
            {saveWeight.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {history.length ? (
        <section className="card">
          <h2>Historique</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Poids</th>
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
                  <td className="numeric">{formatKg(entry.weight_kg)} kg</td>
                  <td className="numeric">
                    <button
                      type="button"
                      className="ghost small"
                      disabled={deleteWeight.isPending}
                      onClick={() => deleteWeight.mutate(entry.id)}
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
