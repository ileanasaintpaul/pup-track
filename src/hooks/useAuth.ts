import { useContext } from 'react';

import i18n from '../lib/i18n';
import { AuthContext } from '../providers/authContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error(i18n.t('common.errors.useAuthOutsideProvider'));
  return ctx;
}
