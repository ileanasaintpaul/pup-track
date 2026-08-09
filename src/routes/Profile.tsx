import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../hooks/useAuth';
import { useDog, useDogs } from '../hooks/useDogs';
import { useCreateInvite, useHousehold, useMembers } from '../hooks/useHousehold';

export function Profile() {
  const { dogId } = useParams();
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: members } = useMembers(household?.id);
  const { data: dog } = useDog(dogId);
  const { data: dogs } = useDogs(household?.id);
  const createInvite = useCreateInvite();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h1>{dog?.name ?? ''}</h1>
          <Link to={`/dog/${dogId}/edit`} className="link">
            {t('common.edit')}
          </Link>
        </div>
        <ul className="list">
          <li>
            <span className="muted">{t('dog.breed')}</span>
            <span>{dog?.breed || t('common.empty')}</span>
          </li>
          <li>
            <span className="muted">{t('dog.sex')}</span>
            <span>
              {dog?.sex === 'female'
                ? t('dogSex.female')
                : dog?.sex === 'male'
                  ? t('dogSex.male')
                  : t('common.empty')}
            </span>
          </li>
        </ul>
      </section>

      {dogs && dogs.length > 1 ? (
        <section className="card">
          <h2>{t('profile.otherDogs')}</h2>
          <ul className="list">
            {dogs
              .filter((item) => item.id !== dogId)
              .map((item) => (
                <li key={item.id}>
                  <Link to={`/dog/${item.id}`} className="link">
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>{household?.name}</h2>
        <ul className="list">
          {members?.map((member) => (
            <li key={member.user_id}>
              <span>
                {member.display_name ||
                  (member.user_id === session?.user.id ? t('profile.you') : t('profile.member'))}
              </span>
              <span className="muted">
                {member.role === 'owner' ? t('profile.owner') : t('profile.member')}
              </span>
            </li>
          ))}
        </ul>

        {code ? (
          <>
            <p className="code">{code}</p>
            <p className="muted">{t('profile.codeHint')}</p>
            <button type="button" className="ghost" onClick={() => void copy()}>
              {copied ? t('profile.copied') : t('profile.copy')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            disabled={!household || createInvite.isPending}
            onClick={async () => setCode(await createInvite.mutateAsync(household!.id))}
          >
            {createInvite.isPending ? t('profile.generating') : t('profile.invite')}
          </button>
        )}
        {createInvite.error ? (
          <p className="error">{(createInvite.error as Error).message}</p>
        ) : null}
      </section>

      <section className="card">
        <button type="button" className="ghost" onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </section>
    </>
  );
}
