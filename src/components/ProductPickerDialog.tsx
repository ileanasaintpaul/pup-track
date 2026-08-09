import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalize } from '../lib/breeds';
import { HEALTH_EVENT_TYPES, HEALTH_TYPE_ICONS, HEALTH_TYPE_KEYS } from '../lib/health';
import type { HealthProduct } from '../types/models';

export function ProductPickerDialog({
  open,
  products,
  selected,
  onToggle,
  onClose,
}: {
  open: boolean;
  products: HealthProduct[] | undefined;
  selected: Set<string>;
  onToggle: (product: HealthProduct) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const grouped = useMemo(() => {
    const query = normalize(search);
    const matching = (products ?? []).filter(
      (product) => query === '' || normalize(product.name).includes(query),
    );
    return HEALTH_EVENT_TYPES.map((type) => ({
      type,
      items: matching.filter((product) => product.type === type),
    })).filter((group) => group.items.length);
  }, [products, search]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={t('health.record.picker.title')}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{t('health.record.picker.title')}</h2>
        <button type="button" className="linkish" onClick={onClose}>
          {t('health.record.picker.done', { count: selected.size })}
        </button>
      </div>

      <label htmlFor="product-search">{t('health.record.picker.search')}</label>
      <input
        id="product-search"
        ref={searchRef}
        type="search"
        autoComplete="off"
        placeholder={t('health.record.picker.searchPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="picker-list">
        {grouped.map((group) => (
          <section key={group.type}>
            <h3 className="picker-group">
              <span aria-hidden="true">{HEALTH_TYPE_ICONS[group.type]} </span>
              {t(HEALTH_TYPE_KEYS[group.type])}
            </h3>
            <ul className="checklist">
              {group.items.map((product) => (
                <li key={product.slug}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={selected.has(product.slug)}
                      onChange={() => onToggle(product)}
                    />
                    <span className="check-body">
                      <span className="check-name">
                        {product.name}
                        {product.core ? (
                          <span className="badge">{t('health.record.picker.core')}</span>
                        ) : null}
                      </span>
                      {product.diseases ? (
                        <span className="muted small-text">{product.diseases}</span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {grouped.length === 0 ? <p className="muted">{t('health.record.picker.empty')}</p> : null}
      </div>
    </dialog>
  );
}
