import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Dog, DogInput } from '../types/models';

const DOG_COLUMNS = 'id, household_id, name, breed, breed_slug, sex, birth_date, adoption_date';

export function useDogs(householdId: string | undefined) {
  return useQuery({
    queryKey: ['dogs', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Dog[]> => {
      const { data, error } = await supabase
        .from('dogs')
        .select(DOG_COLUMNS)
        .eq('household_id', householdId!)
        .is('archived_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Dog[];
    },
  });
}

export function useDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['dog', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<Dog | null> => {
      const { data, error } = await supabase
        .from('dogs')
        .select(DOG_COLUMNS)
        .eq('id', dogId!)
        .maybeSingle();

      if (error) throw error;
      return (data as Dog | null) ?? null;
    },
  });
}

export function useCreateDog(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dog: DogInput): Promise<Dog> => {
      if (!householdId) throw new Error('foyer inconnu');

      const { data, error } = await supabase
        .from('dogs')
        .insert({ ...dog, household_id: householdId })
        .select(DOG_COLUMNS)
        .single();

      if (error) throw error;
      return data as Dog;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dogs', householdId] }),
  });
}

export function useUpdateDog(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dog: DogInput): Promise<Dog> => {
      const { data, error } = await supabase
        .from('dogs')
        .update(dog)
        .eq('id', dogId)
        .select(DOG_COLUMNS)
        .single();

      if (error) throw error;
      return data as Dog;
    },
    onSuccess: (dog) => {
      queryClient.invalidateQueries({ queryKey: ['dogs', dog.household_id] });
      queryClient.invalidateQueries({ queryKey: ['dog', dogId] });
    },
  });
}
