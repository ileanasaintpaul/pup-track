import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useListActions } from '../hooks/useTrainingLists';
import type { DogList, Skill } from '../types/models';

export function DogLists({
  dogId,
  lists,
  skills,
  onOpenPicker,
}: {
  dogId: string;
  lists: DogList[] | undefined;
  skills: Skill[] | undefined;
  onOpenPicker: (listId: string) => void;
}) {
  const { t } = useTranslation();
  const { createList, renameList, deleteList, removeFromList, reorderList } = useListActions(dogId);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const skillName = (slug: string) => skills?.find((item) => item.slug === slug)?.name ?? slug;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createList.mutateAsync({ name });
    setNewName('');
  }

  function move(list: DogList, index: number, direction: -1 | 1) {
    const slugs = list.items.map((item) => item.skill_slug);
    const target = index + direction;
    if (target < 0 || target >= slugs.length) return;
    [slugs[index], slugs[target]] = [slugs[target], slugs[index]];
    reorderList.mutate({ listId: list.id, orderedSlugs: slugs });
  }

  return (
    <>
      <section className="card">
        <h2>{t('training.lists.newTitle')}</h2>
        <form onSubmit={submit}>
          <label htmlFor="list-name">{t('training.lists.nameLabel')}</label>
          <input
            id="list-name"
            type="text"
            placeholder={t('training.lists.namePlaceholder')}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <button type="submit" disabled={createList.isPending || !newName.trim()}>
            {createList.isPending ? t('training.lists.creating') : t('training.lists.create')}
          </button>
        </form>
      </section>

      {lists?.length ? (
        lists.map((list) => (
          <section className="card" key={list.id}>
            <div className="card-head">
              {renaming === list.id ? (
                <input
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) {
                      renameList.mutate({ listId: list.id, name: renameValue.trim() });
                    }
                    setRenaming(null);
                  }}
                />
              ) : (
                <h2>{list.name}</h2>
              )}
              <span className="skill-tools">
                <button
                  type="button"
                  className="linkish"
                  onClick={() => {
                    setRenaming(list.id);
                    setRenameValue(list.name);
                  }}
                >
                  {t('training.lists.rename')}
                </button>
                <button type="button" className="linkish" onClick={() => onOpenPicker(list.id)}>
                  {t('training.lists.add')}
                </button>
                <button
                  type="button"
                  className="linkish danger-link"
                  onClick={() => deleteList.mutate(list.id)}
                >
                  {t('common.delete')}
                </button>
              </span>
            </div>

            {list.items.length ? (
              <ol className="ordered">
                {list.items.map((item, index) => (
                  <li key={item.skill_slug}>
                    <span className="ordered-rank">{index + 1}</span>
                    <span className="ordered-name">{skillName(item.skill_slug)}</span>
                    <span className="skill-tools">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={t('training.lists.moveUp')}
                        disabled={index === 0 || reorderList.isPending}
                        onClick={() => move(list, index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={t('training.lists.moveDown')}
                        disabled={index === list.items.length - 1 || reorderList.isPending}
                        onClick={() => move(list, index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={t('training.lists.remove')}
                        onClick={() =>
                          removeFromList.mutate({ listId: list.id, skillSlug: item.skill_slug })
                        }
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                {t('training.lists.emptyList', { add: t('training.lists.add') })}
              </p>
            )}
          </section>
        ))
      ) : (
        <section className="card">
          <p className="muted">{t('training.lists.emptyAll')}</p>
        </section>
      )}
    </>
  );
}
