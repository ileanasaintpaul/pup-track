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
  size_category: SizeCategory | null;
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};

export type SizeCategory = 'toy' | 'small' | 'medium' | 'large' | 'giant';

export type GrowthStandard = {
  age_weeks: number;
  weight_min_kg: number;
  weight_max_kg: number;
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
  size_category: SizeCategory | null;
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};
