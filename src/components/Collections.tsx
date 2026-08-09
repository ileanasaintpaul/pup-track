import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useListActions } from '../hooks/useTrainingLists';
import type { Collection, Skill } from '../types/models';

export function Collections({
  dogId,
  collections,
  skills,
  weeks,
}: {
  dogId: string;
  collections: Collection[] | undefined;
  skills: Skill[] | undefined;
  weeks: number | null;
}) {
  const { t } = useTranslation();
  const { createList } = useListActions(dogId);
  const [copied, setCopied] = useState<string | null>(null);

  const skillName = (slug: string) => skills?.find((item) => item.slug === slug)?.name ?? slug;

  async function copy(collection: Collection) {
    await createList.mutateAsync({
      name: collection.name,
      skillSlugs: collection.items.map((item) => item.skill_slug),
    });
    setCopied(collection.slug);
  }

  if (!collections?.length) {
    return (
      <section className="card">
        <p className="muted">{t('training.collections.empty')}</p>
      </section>
    );
  }

  return (
    <>
      {collections.map((collection) => (
        <section className="card" key={collection.slug}>
          <div className="card-head">
            <h2>{collection.name}</h2>
            <button
              type="button"
              className="linkish"
              disabled={createList.isPending}
              onClick={() => copy(collection)}
            >
              {copied === collection.slug
                ? t('training.collections.copied')
                : t('training.collections.copyAction')}
            </button>
          </div>
          {collection.description ? <p className="muted">{collection.description}</p> : null}

          <ol className="ordered">
            {collection.items.map((item, index) => {
              const tooEarly = weeks !== null && item.start_age_weeks !== null && item.start_age_weeks > weeks;
              return (
                <li key={item.skill_slug}>
                  <span className="ordered-rank">{index + 1}</span>
                  <span className="ordered-name">
                    {skillName(item.skill_slug)}
                    {item.note ? <span className="muted small-text"> — {item.note}</span> : null}
                  </span>
                  <span className={tooEarly ? 'muted small-text' : 'small-text highlight'}>
                    {item.start_age_weeks
                      ? t('training.collections.startsAt', { weeks: item.start_age_weeks })
                      : ''}
                  </span>
                </li>
              );
            })}
          </ol>

          {collection.source ? (
            <p className="muted small-text">
              {t('training.collections.source', { source: collection.source })}
            </p>
          ) : null}
        </section>
      ))}
    </>
  );
}
