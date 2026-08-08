import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { WeightEntry } from '../types/models';

const WEIGHT_COLUMNS = 'id, dog_id, measured_on, weight_kg, note';

export function useWeights(dogId: string | undefined) {
  return useQuery({
    queryKey: ['weights', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<WeightEntry[]> => {
      const { data, error } = await supabase
        .from('weight_entries')
        .select(WEIGHT_COLUMNS)
        .eq('dog_id', dogId!)
        .order('measured_on', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({ ...row, weight_kg: Number(row.weight_kg) })) as WeightEntry[];
    },
  });
}

export function useSaveWeight(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { measured_on: string; weight_kg: number; note: string | null }) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('weight_entries')
        .upsert(
          { ...entry, dog_id: dogId, recorded_by: user.user?.id ?? null },
          { onConflict: 'dog_id,measured_on' },
        )
        .select(WEIGHT_COLUMNS)
        .single();

      if (error) throw error;
      return data as WeightEntry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weights', dogId] }),
  });
}

export function useDeleteWeight(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('weight_entries').delete().eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weights', dogId] }),
  });
}

export function latestWeight(entries: WeightEntry[] | undefined): WeightEntry | null {
  if (!entries?.length) return null;
  return entries[entries.length - 1];
}

export function weightChange(entries: WeightEntry[] | undefined): number | null {
  if (!entries || entries.length < 2) return null;
  return entries[entries.length - 1].weight_kg - entries[entries.length - 2].weight_kg;
}
