import { AuthError } from '@supabase/supabase-js';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou mot de passe incorrect.',
  user_already_exists: 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
  email_exists: 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
  weak_password: 'Mot de passe trop faible : au moins 8 caractères, avec des lettres et des chiffres.',
  over_request_rate_limit: 'Trop de tentatives. Réessaie dans quelques minutes.',
  email_not_confirmed: "Confirme d'abord ton adresse e-mail.",
  signup_disabled: 'Les inscriptions sont fermées sur ce projet.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError && error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue';
}
