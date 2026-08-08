import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCreateDog, useDog, useUpdateDog } from '../hooks/useDogs';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { Dog, DogInput, DogSex } from '../types/models';

export function NewDog() {
  const { session } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const createDog = useCreateDog(household?.id);

  return (
    <DogFields
      title="La fiche du chien"
      submitLabel="Enregistrer"
      pending={createDog.isPending}
      onSubmit={(input) => createDog.mutateAsync(input)}
    />
  );
}

export function EditDog() {
  const { dogId } = useParams();
  const { data: dog, isPending } = useDog(dogId);
  const updateDog = useUpdateDog(dogId!);

  if (isPending) return <p className="centered muted">Chargement…</p>;
  if (!dog) return <p className="centered muted">Fiche introuvable.</p>;

  return (
    <DogFields
      title={`Modifier ${dog.name}`}
      submitLabel="Enregistrer"
      dog={dog}
      pending={updateDog.isPending}
      onSubmit={(input) => updateDog.mutateAsync(input)}
    />
  );
}

function DogFields({
  title,
  submitLabel,
  dog,
  pending,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  dog?: Dog;
  pending: boolean;
  onSubmit: (input: DogInput) => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState(dog?.breed ?? '');
  const [sex, setSex] = useState<DogSex | ''>(dog?.sex ?? '');
  const [birthDate, setBirthDate] = useState(dog?.birth_date ?? '');
  const [adoptionDate, setAdoptionDate] = useState(dog?.adoption_date ?? '');
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        breed: breed.trim() || null,
        sex: sex || null,
        birth_date: birthDate || null,
        adoption_date: adoptionDate || null,
      });
      navigate('/');
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
        <h1>{title}</h1>
        <form onSubmit={submit}>
          <label htmlFor="dog-name">Nom</label>
          <input
            id="dog-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="dog-breed">Race</label>
          <input
            id="dog-breed"
            type="text"
            placeholder="Welsh Corgi Pembroke"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />

          <label htmlFor="dog-sex">Sexe</label>
          <select id="dog-sex" value={sex} onChange={(e) => setSex(e.target.value as DogSex | '')}>
            <option value="">Non renseigné</option>
            <option value="female">Femelle</option>
            <option value="male">Mâle</option>
          </select>

          <label htmlFor="dog-birth">Date de naissance</label>
          <input
            id="dog-birth"
            type="date"
            max={today}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <label htmlFor="dog-adoption">Date d'adoption</label>
          <input
            id="dog-adoption"
            type="date"
            max={today}
            value={adoptionDate}
            onChange={(e) => setAdoptionDate(e.target.value)}
          />

          <button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Enregistrement…' : submitLabel}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
