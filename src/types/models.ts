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
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};

export type DogInput = {
  name: string;
  breed: string | null;
  sex: DogSex | null;
  birth_date: string | null;
  adoption_date: string | null;
};
