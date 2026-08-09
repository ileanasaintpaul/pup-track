import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { parentPath } from '../lib/navigation';

export function BackLink() {
  const { dogId } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  if (!dogId) return null;

  const parent = parentPath(pathname, dogId);
  if (!parent) return null;

  return (
    <Link to={parent} className="page-back" aria-label={t('common.back')}>
      ←
    </Link>
  );
}
