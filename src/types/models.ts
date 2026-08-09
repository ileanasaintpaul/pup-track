export type HouseholdRole = 'owner' | 'member';

export type Profile = {
  id: string;
  display_name: string;
};

export type Household = {
  id: string;
  name: string;
  created_by: string;
};

export type Member = {
  user_id: string;
  role: HouseholdRole;
  joined_at: string;
  display_name: string;
};

export type DogSex = 'male' | 'female';

export type Dog = {
  id: string;
  household_id: string;
  name: string;
  breed: string | null;
  breed_slug: string | null;
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};

export type SizeBand =
  | 'toy'
  | 'small'
  | 'mediumsmall'
  | 'mediumlarge'
  | 'large'
  | 'giant'
  | 'giantplus';

export type Breed = {
  slug: string;
  name: string;
  size_band: SizeBand;
  adult_min_kg: number;
  adult_max_kg: number;
};

export type GrowthPoint = {
  age_weeks: number;
  centile: number;
  weight_kg: number;
};

export type WeightEntry = {
  id: string;
  dog_id: string;
  measured_on: string;
  weight_kg: number;
  note: string | null;
};

export type DogInput = {
  name: string;
  breed: string | null;
  breed_slug: string | null;
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};
