import { useEffect, useMemo, useRef, useState } from 'react';

import { useBreeds } from '../hooks/useBreeds';
import { SIZE_BANDS, normalize } from '../lib/breeds';
import type { Breed, SizeBand } from '../types/models';

export function BreedPicker({
  selected,
  onSelect,
}: {
  selected: Breed | null;
  onSelect: (breed: Breed | null) => void;
}) {
  const { data: breeds, isPending } = useBreeds();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [band, setBand] = useState<SizeBand | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      searchRef.current?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const results = useMemo(() => {
    const query = normalize(search);
    return (breeds ?? []).filter((breed) => {
      if (band && breed.size_band !== band) return false;
      return query === '' || normalize(breed.name).includes(query);
    });
  }, [breeds, band, search]);

  const counts = useMemo(() => {
    const map = new Map<SizeBand, number>();
    for (const breed of breeds ?? []) {
      map.set(breed.size_band, (map.get(breed.size_band) ?? 0) + 1);
    }
    return map;
  }, [breeds]);

  function choose(breed: Breed | null) {
    onSelect(breed);
    setOpen(false);
    setSearch('');
  }

  return (
    <>
      <button
        type="button"
        className="picker-trigger"
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <span className="picker-value">
            {selected.name}
            <span className="muted small-text">
              {' '}
              · {selected.adult_min_kg}–{selected.adult_max_kg} kg adulte
            </span>
          </span>
        ) : (
          <span className="muted">{isPending ? 'Chargement…' : 'Choisir une race'}</span>
        )}
        <span aria-hidden="true">›</span>
      </button>

      {selected ? (
        <button type="button" className="linkish" onClick={() => choose(null)}>
          Retirer la race
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        className="modal"
        aria-label="Choisir la race"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="modal-head">
          <h2>Choisir la race</h2>
          <button type="button" className="linkish" onClick={() => setOpen(false)}>
            Fermer
          </button>
        </div>

        <div className="chips" role="group" aria-label="Filtrer par gabarit adulte">
          <button
            type="button"
            className={band === null ? 'chip chip-active' : 'chip'}
            aria-pressed={band === null}
            onClick={() => setBand(null)}
          >
            Tous les gabarits
          </button>
          {SIZE_BANDS.map((item) => (
            <button
              key={item.band}
              type="button"
              className={band === item.band ? 'chip chip-active' : 'chip'}
              aria-pressed={band === item.band}
              onClick={() => setBand(band === item.band ? null : item.band)}
            >
              {item.label}
              <span className="chip-range">{item.range}</span>
            </button>
          ))}
        </div>

        <label htmlFor="breed-search">Rechercher</label>
        <input
          id="breed-search"
          ref={searchRef}
          type="search"
          autoComplete="off"
          placeholder="corgi, berger, retriever…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <p className="muted small-text">
          {results.length} race{results.length > 1 ? 's' : ''}
          {band && search.trim() ? ` sur ${counts.get(band) ?? 0} dans ce gabarit` : ''}
        </p>

        <ul className="picker-list">
          {results.map((breed) => (
            <li key={breed.slug}>
              <button
                type="button"
                className={breed.slug === selected?.slug ? 'picker-item picker-chosen' : 'picker-item'}
                onClick={() => choose(breed)}
              >
                <span>{breed.name}</span>
                <span className="muted small-text">
                  {breed.adult_min_kg}–{breed.adult_max_kg} kg
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li>
              <p className="muted">Aucune race ne correspond. Essaie un autre mot ou un autre gabarit.</p>
            </li>
          ) : null}
        </ul>
      </dialog>
    </>
  );
}
