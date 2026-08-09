import type { SkillLevel } from '../types/models';

export const SKILL_LEVELS: { level: SkillLevel; label: string; hint: string }[] = [
  { level: 0, label: 'Pas commencé', hint: "Le travail n'a pas encore démarré." },
  { level: 1, label: 'Découverte', hint: 'Le geste apparaît, guidé et récompensé.' },
  { level: 2, label: 'Compris au calme', hint: 'Répond à la maison, sans distraction.' },
  { level: 3, label: 'Avec distractions', hint: 'Tient malgré le bruit, les gens, les odeurs.' },
  { level: 4, label: 'Fiable dehors', hint: 'Répond en extérieur, même en situation nouvelle.' },
];

export const ENVIRONMENTS = ['Maison', 'Jardin', 'Rue calme', 'Rue passante', 'Parc', 'Autre'];

export const SKILL_CATEGORIES: Record<string, string> = {
  base: 'Fondations',
  quotidien: 'Quotidien',
  obeissance: 'Obéissance',
  exterieur: 'Extérieur',
  securite: 'Sécurité',
  novice: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  performer: 'Expert',
};

export const FOUNDATION_CATEGORIES = ['base', 'quotidien', 'obeissance', 'exterieur', 'securite'];

export function levelLabel(level: SkillLevel): string {
  return SKILL_LEVELS[level].label;
}

export function categoryLabel(category: string): string {
  return SKILL_CATEGORIES[category] ?? category;
}
