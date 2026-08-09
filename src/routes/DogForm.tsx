import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { BreedPicker } from '../components/BreedPicker';
import { useBreeds } from '../hooks/useBreeds';
import { useCreateDog, useDog, useUpdateDog } from '../hooks/useDogs';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { Breed, Dog, DogInput, DogSex } from '../types/models';

export function NewDog() {
  const { session } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const createDog = useCreateDog(household?.id);

  return (
    <DogFields
      title="La fiche du chien"
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
      dog={dog}
      pending={updateDog.isPending}
      onSubmit={(input) => updateDog.mutateAsync(input)}
    />
  );
}

function DogFields({
  title,
  dog,
  pending,
  onSubmit,
}: {
  title: string;
  dog?: Dog;
  pending: boolean;
  onSubmit: (input: DogInput) => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const { data: breeds } = useBreeds();

  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState<Breed | null>(null);
  const [breedTouched, setBreedTouched] = useState(false);
  const [sex, setSex] = useState<DogSex | ''>(dog?.sex ?? '');
  const [birthDate, setBirthDate] = useState(dog?.birth_date ?? '');
  const [adoptionDate, setAdoptionDate] = useState(dog?.adoption_date ?? '');
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const stored = breeds?.find((item) => item.slug === dog?.breed_slug) ?? null;
  const selected = breedTouched ? breed : stored;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        breed: selected?.name ?? null,
        breed_slug: selected?.slug ?? null,
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

          <span className="field-label">Race</span>
          <BreedPicker
            selected={selected}
            onSelect={(next) => {
              setBreedTouched(true);
              setBreed(next);
            }}
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
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
