import type { ParseKeys } from 'i18next';

import type { SizeBand } from '../types/models';

type Key = ParseKeys;

export const SIZE_BANDS: SizeBand[] = [
  'toy',
  'small',
  'mediumsmall',
  'mediumlarge',
  'large',
  'giant',
  'giantplus',
];

const SIZE_BAND_LABEL_KEYS = {
  toy: 'breedPicker.sizeBands.toy.label',
  small: 'breedPicker.sizeBands.small.label',
  mediumsmall: 'breedPicker.sizeBands.mediumsmall.label',
  mediumlarge: 'breedPicker.sizeBands.mediumlarge.label',
  large: 'breedPicker.sizeBands.large.label',
  giant: 'breedPicker.sizeBands.giant.label',
  giantplus: 'breedPicker.sizeBands.giantplus.label',
} as const satisfies Record<SizeBand, Key>;

const SIZE_BAND_RANGE_KEYS = {
  toy: 'breedPicker.sizeBands.toy.range',
  small: 'breedPicker.sizeBands.small.range',
  mediumsmall: 'breedPicker.sizeBands.mediumsmall.range',
  mediumlarge: 'breedPicker.sizeBands.mediumlarge.range',
  large: 'breedPicker.sizeBands.large.range',
  giant: 'breedPicker.sizeBands.giant.range',
  giantplus: 'breedPicker.sizeBands.giantplus.range',
} as const satisfies Record<SizeBand, Key>;

export function sizeBandLabelKey(band: SizeBand): Key {
  return SIZE_BAND_LABEL_KEYS[band];
}

export function sizeBandRangeKey(band: SizeBand): Key {
  return SIZE_BAND_RANGE_KEYS[band];
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
