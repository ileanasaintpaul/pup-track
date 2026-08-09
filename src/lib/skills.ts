import type { SkillLevel } from '../types/models';

export const SKILL_LEVELS = [
  { level: 0, labelKey: 'training.levels.notStarted.label', hintKey: 'training.levels.notStarted.hint' },
  { level: 1, labelKey: 'training.levels.discovery.label', hintKey: 'training.levels.discovery.hint' },
  { level: 2, labelKey: 'training.levels.calm.label', hintKey: 'training.levels.calm.hint' },
  { level: 3, labelKey: 'training.levels.distractions.label', hintKey: 'training.levels.distractions.hint' },
  { level: 4, labelKey: 'training.levels.reliable.label', hintKey: 'training.levels.reliable.hint' },
] as const satisfies { level: SkillLevel; labelKey: string; hintKey: string }[];

export const ENVIRONMENTS = ['Maison', 'Jardin', 'Rue calme', 'Rue passante', 'Parc', 'Autre'];

const ENVIRONMENT_KEYS: Record<string, string> = {
  Maison: 'training.environments.home',
  Jardin: 'training.environments.garden',
  'Rue calme': 'training.environments.quietStreet',
  'Rue passante': 'training.environments.busyStreet',
  Parc: 'training.environments.park',
  Autre: 'training.environments.other',
};

export const SKILL_CATEGORIES: Record<string, string> = {
  base: 'training.categories.base',
  quotidien: 'training.categories.quotidien',
  obeissance: 'training.categories.obeissance',
  exterieur: 'training.categories.exterieur',
  securite: 'training.categories.securite',
  novice: 'training.categories.novice',
  intermediate: 'training.categories.intermediate',
  advanced: 'training.categories.advanced',
  performer: 'training.categories.performer',
};

export const FOUNDATION_CATEGORIES = ['base', 'quotidien', 'obeissance', 'exterieur', 'securite'];

export function categoryLabelKey(category: string): string {
  return SKILL_CATEGORIES[category] ?? category;
}

export function environmentLabelKey(environment: string): string {
  return ENVIRONMENT_KEYS[environment] ?? environment;
}
