import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BreedPicker } from '../components/BreedPicker';
import { useBreeds } from '../hooks/useBreeds';
import { useCreateDog, useDog, useUpdateDog } from '../hooks/useDogs';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { Breed, Dog, DogInput, DogSex } from '../types/models';
import { toISODate } from '../lib/format';

export function NewDog() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const createDog = useCreateDog(household?.id);

  return (
    <DogFields
      title={t('dogForm.newTitle')}
      pending={createDog.isPending}
      onSubmit={(input) => createDog.mutateAsync(input)}
    />
  );
}

export function EditDog() {
  const { t } = useTranslation();
  const { dogId } = useParams();
  const { data: dog, isPending } = useDog(dogId);
  const updateDog = useUpdateDog(dogId!);

  if (isPending) return <p className="centered muted">{t('common.loading')}</p>;
  if (!dog) return <p className="centered muted">{t('dogForm.notFound')}</p>;

  return (
    <DogFields
      title={t('dogForm.editTitle', { name: dog.name })}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: breeds } = useBreeds();

  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState<Breed | null>(null);
  const [breedTouched, setBreedTouched] = useState(false);
  const [sex, setSex] = useState<DogSex | ''>(dog?.sex ?? '');
  const [birthDate, setBirthDate] = useState(dog?.birth_date ?? '');
  const [adoptionDate, setAdoptionDate] = useState(dog?.adoption_date ?? '');
  const [error, setError] = useState<string | null>(null);

  const today = toISODate();
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
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="link">
          {t('common.back')}
        </Link>
      </header>

      <section className="card">
        <h1>{title}</h1>
        <form onSubmit={submit}>
          <label htmlFor="dog-name">{t('dogForm.nameLabel')}</label>
          <input
            id="dog-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <span className="field-label">{t('dog.breed')}</span>
          <BreedPicker
            selected={selected}
            onSelect={(next) => {
              setBreedTouched(true);
              setBreed(next);
            }}
          />

          <label htmlFor="dog-sex">{t('dog.sex')}</label>
          <select id="dog-sex" value={sex} onChange={(e) => setSex(e.target.value as DogSex | '')}>
            <option value="">{t('dogForm.sex.unspecified')}</option>
            <option value="female">{t('dogForm.sex.female')}</option>
            <option value="male">{t('dogForm.sex.male')}</option>
          </select>

          <label htmlFor="dog-birth">{t('dogForm.birthDateLabel')}</label>
          <input
            id="dog-birth"
            type="date"
            max={today}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <label htmlFor="dog-adoption">{t('dogForm.adoptionDateLabel')}</label>
          <input
            id="dog-adoption"
            type="date"
            max={today}
            value={adoptionDate}
            onChange={(e) => setAdoptionDate(e.target.value)}
          />

          <button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('common.saving') : t('common.save')}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
