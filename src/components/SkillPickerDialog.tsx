import { useEffect, useMemo, useRef, useState } from 'react';

import { normalize } from '../lib/breeds';
import { SKILL_CATEGORIES, categoryLabel } from '../lib/skills';
import type { Skill } from '../types/models';

export function SkillPickerDialog({
  open,
  skills,
  alreadyIn,
  title,
  onPick,
  onClose,
}: {
  open: boolean;
  skills: Skill[] | undefined;
  alreadyIn: Set<string>;
  title: string;
  onPick: (skill: Skill) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string | null>(null);
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
    return (skills ?? []).filter((skill) => {
      if (category && skill.category !== category) return false;
      return query === '' || normalize(skill.name).includes(query);
    });
  }, [skills, category, search]);

  const categories = useMemo(
    () => [...new Set((skills ?? []).map((skill) => skill.category))],
    [skills],
  );

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button type="button" className="linkish" onClick={onClose}>
          Fermer
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filtrer par catégorie">
        <button
          type="button"
          className={category === null ? 'chip chip-active' : 'chip'}
          aria-pressed={category === null}
          onClick={() => setCategory(null)}
        >
          Toutes
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'chip chip-active' : 'chip'}
            aria-pressed={category === item}
            onClick={() => setCategory(category === item ? null : item)}
          >
            {SKILL_CATEGORIES[item] ?? item}
          </button>
        ))}
      </div>

      <label htmlFor="skill-search">Rechercher</label>
      <input
        id="skill-search"
        ref={searchRef}
        type="search"
        autoComplete="off"
        placeholder="rappel, panier, laisse…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <p className="muted small-text">
        {results.length} tour{results.length > 1 ? 's' : ''}
      </p>

      <ul className="picker-list">
        {results.map((skill) => {
          const inList = alreadyIn.has(skill.slug);
          return (
            <li key={skill.slug}>
              <button
                type="button"
                className={inList ? 'picker-item picker-chosen' : 'picker-item'}
                disabled={inList}
                onClick={() => onPick(skill)}
              >
                <span>{skill.name}</span>
                <span className="muted small-text">
                  {inList ? 'déjà dans la liste' : categoryLabel(skill.category)}
                </span>
              </button>
            </li>
          );
        })}
        {results.length === 0 ? (
          <li>
            <p className="muted">Aucun tour ne correspond.</p>
          </li>
        ) : null}
      </ul>
    </dialog>
  );
}
