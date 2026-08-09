import { Link, Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDog } from '../hooks/useDogs';
import { TabBar } from './TabBar';

export function DogLayout() {
  const { dogId } = useParams();
  const { data: dog, isPending } = useDog(dogId);
  const { t } = useTranslation();

  if (!dogId) return <Navigate to="/" replace />;

  return (
    <div className="shell shell-tabs">
      <header className="dogbar">
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
