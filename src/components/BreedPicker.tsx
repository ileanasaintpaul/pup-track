import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBreeds } from '../hooks/useBreeds';
import { SIZE_BANDS, normalize, sizeBandLabelKey, sizeBandRangeKey } from '../lib/breeds';
import type { Breed, SizeBand } from '../types/models';

export function BreedPicker({
  selected,
  onSelect,
}: {
  selected: Breed | null;
  onSelect: (breed: Breed | null) => void;
}) {
  const { t } = useTranslation();
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
              {t('breedPicker.adultRange', { min: selected.adult_min_kg, max: selected.adult_max_kg })}
            </span>
          </span>
        ) : (
          <span className="muted">{isPending ? t('common.loading') : t('breedPicker.choose')}</span>
        )}
        <span aria-hidden="true">›</span>
      </button>

      {selected ? (
        <button type="button" className="linkish" onClick={() => choose(null)}>
          {t('breedPicker.remove')}
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        className="modal"
        aria-label={t('breedPicker.title')}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="modal-head">
          <h2>{t('breedPicker.title')}</h2>
          <button type="button" className="linkish" onClick={() => setOpen(false)}>
            {t('breedPicker.close')}
          </button>
        </div>

        <div className="chips" role="group" aria-label={t('breedPicker.filterLabel')}>
          <button
            type="button"
            className={band === null ? 'chip chip-active' : 'chip'}
            aria-pressed={band === null}
            onClick={() => setBand(null)}
          >
            {t('breedPicker.allSizes')}
          </button>
          {SIZE_BANDS.map((option) => (
            <button
              key={option}
              type="button"
              className={band === option ? 'chip chip-active' : 'chip'}
              aria-pressed={band === option}
              onClick={() => setBand(band === option ? null : option)}
            >
              {t(sizeBandLabelKey(option))}
              <span className="chip-range">{t(sizeBandRangeKey(option))}</span>
            </button>
          ))}
        </div>

        <label htmlFor="breed-search">{t('breedPicker.searchLabel')}</label>
        <input
          id="breed-search"
          ref={searchRef}
          type="search"
          autoComplete="off"
          placeholder={t('breedPicker.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <p className="muted small-text">
          {t('breedPicker.results', { count: results.length })}
          {band && search.trim() ? t('breedPicker.withinBand', { count: counts.get(band) ?? 0 }) : ''}
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
                  {t('breedPicker.weightRange', { min: breed.adult_min_kg, max: breed.adult_max_kg })}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li>
              <p className="muted">{t('breedPicker.noResults')}</p>
            </li>
          ) : null}
        </ul>
      </dialog>
    </>
  );
}
