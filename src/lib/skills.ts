import type { ParseKeys } from 'i18next';

import type { SkillLevel } from '../types/models';

export type Key = ParseKeys;

export const SKILL_LEVELS = [
  { level: 0, labelKey: 'training.levels.notStarted.label', hintKey: 'training.levels.notStarted.hint' },
  { level: 1, labelKey: 'training.levels.discovery.label', hintKey: 'training.levels.discovery.hint' },
  { level: 2, labelKey: 'training.levels.calm.label', hintKey: 'training.levels.calm.hint' },
  { level: 3, labelKey: 'training.levels.distractions.label', hintKey: 'training.levels.distractions.hint' },
  { level: 4, labelKey: 'training.levels.reliable.label', hintKey: 'training.levels.reliable.hint' },
] as const satisfies { level: SkillLevel; labelKey: string; hintKey: string }[];

export const ENVIRONMENTS = ['Maison', 'Jardin', 'Rue calme', 'Rue passante', 'Parc', 'Autre'];

const ENVIRONMENT_KEYS = {
  Maison: 'training.environments.home',
  Jardin: 'training.environments.garden',
  'Rue calme': 'training.environments.quietStreet',
  'Rue passante': 'training.environments.busyStreet',
  Parc: 'training.environments.park',
  Autre: 'training.environments.other',
} as const satisfies Record<string, Key>;

export const SKILL_CATEGORIES = {
  base: 'training.categories.base',
  quotidien: 'training.categories.quotidien',
  obeissance: 'training.categories.obeissance',
  exterieur: 'training.categories.exterieur',
  securite: 'training.categories.securite',
  novice: 'training.categories.novice',
  intermediate: 'training.categories.intermediate',
  advanced: 'training.categories.advanced',
  performer: 'training.categories.performer',
} as const satisfies Record<string, Key>;

export const FOUNDATION_CATEGORIES = ['base', 'quotidien', 'obeissance', 'exterieur', 'securite'];

export function categoryLabelKey(category: string): Key | string {
  return (SKILL_CATEGORIES as Record<string, Key>)[category] ?? category;
}

export function environmentLabelKey(environment: string): Key | string {
  return (ENVIRONMENT_KEYS as Record<string, Key>)[environment] ?? environment;
}
