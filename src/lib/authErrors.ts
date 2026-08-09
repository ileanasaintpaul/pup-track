import { AuthError } from '@supabase/supabase-js';
import type { ParseKeys } from 'i18next';

type Key = ParseKeys;

const MESSAGES: Record<string, Key> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  user_already_exists: 'auth.errors.accountExists',
  email_exists: 'auth.errors.accountExists',
  weak_password: 'auth.errors.weakPassword',
  over_request_rate_limit: 'auth.errors.rateLimited',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  signup_disabled: 'auth.errors.signupDisabled',
};

export function authErrorKey(error: unknown): Key | string {
  if (error instanceof AuthError && error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error instanceof Error) return error.message;
  return 'common.error';
}
