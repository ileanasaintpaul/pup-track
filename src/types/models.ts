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
