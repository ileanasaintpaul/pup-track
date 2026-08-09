import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDogs } from '../hooks/useDogs';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';

export function HomeRedirect() {
  const { session } = useAuth();
  const { data: household } = useHousehold(session?.user.id);
  const { data: dogs, isPending } = useDogs(household?.id);
  const { t } = useTranslation();

  if (isPending) return <p className="centered muted">{t('common.loading')}</p>;
  if (!dogs?.length) return <Navigate to="/dog/new" replace />;
  return <Navigate to={`/dog/${dogs[0].id}`} replace />;
}
