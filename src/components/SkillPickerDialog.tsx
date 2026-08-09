import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalize } from '../lib/breeds';
import { categoryLabelKey, type Key } from '../lib/skills';
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
  const { t } = useTranslation();
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
          {t('training.picker.close')}
        </button>
      </div>

      <div className="chips" role="group" aria-label={t('training.picker.categoryFilterLabel')}>
        <button
          type="button"
          className={category === null ? 'chip chip-active' : 'chip'}
          aria-pressed={category === null}
          onClick={() => setCategory(null)}
        >
          {t('training.picker.allCategories')}
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'chip chip-active' : 'chip'}
            aria-pressed={category === item}
            onClick={() => setCategory(category === item ? null : item)}
          >
            {t(categoryLabelKey(item) as Key)}
          </button>
        ))}
      </div>

      <label htmlFor="skill-search">{t('training.picker.searchLabel')}</label>
      <input
        id="skill-search"
        ref={searchRef}
        type="search"
        autoComplete="off"
        placeholder={t('training.picker.searchPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <p className="muted small-text">{t('training.picker.results', { count: results.length })}</p>

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
                  {inList
                    ? t('training.picker.alreadyInList')
                    : t(categoryLabelKey(skill.category) as Key)}
                </span>
              </button>
            </li>
          );
        })}
        {results.length === 0 ? (
          <li>
            <p className="muted">{t('training.picker.noResults')}</p>
          </li>
        ) : null}
      </ul>
    </dialog>
  );
}
