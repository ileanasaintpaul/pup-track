import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDog } from '../hooks/useDogs';
import { parentPath } from '../lib/navigation';
import { TabBar } from './TabBar';

export function DogLayout() {
  const { dogId } = useParams();
  const { data: dog, isPending } = useDog(dogId);
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (!dogId) return <Navigate to="/" replace />;

  const parent = parentPath(pathname, dogId);

  return (
    <div className="shell shell-tabs">
      <header className="dogbar">
        {parent ? (
          <Link to={parent} className="dogbar-back" aria-label={t('common.back')}>
            ←
          </Link>
        ) : null}
        <Link to={`/dog/${dogId}/profile`} className="dogbar-identity">
          <span className="dogbar-avatar" aria-hidden="true">
            🐶
          </span>
          <span className="dogbar-name">{isPending ? t('common.loading') : (dog?.name ?? '')}</span>
        </Link>
      </header>

      <main className="shell-body">
        <Outlet />
      </main>

      <TabBar dogId={dogId} />
    </div>
  );
}
