import type { SizeBand } from '../types/models';

export const SIZE_BANDS: { band: SizeBand; label: string; range: string }[] = [
  { band: 'toy', label: 'Très petit', range: 'jusqu’à 6,5 kg' },
  { band: 'small', label: 'Petit', range: '6,5 à 9 kg' },
  { band: 'mediumsmall', label: 'Moyen-petit', range: '9 à 15 kg' },
  { band: 'mediumlarge', label: 'Moyen-grand', range: '15 à 30 kg' },
  { band: 'large', label: 'Grand', range: '30 à 40 kg' },
  { band: 'giant', label: 'Très grand', range: '40 à 47,5 kg' },
  { band: 'giantplus', label: 'Géant', range: 'plus de 47,5 kg' },
];

export function bandLabel(band: SizeBand): string {
  return SIZE_BANDS.find((item) => item.band === band)?.label ?? band;
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
