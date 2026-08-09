import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { HeightEntry } from '../types/models';

const HEIGHT_COLUMNS = 'id, dog_id, measured_on, withers_cm, note';

export function useHeights(dogId: string | undefined) {
  return useQuery({
    queryKey: ['heights', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<HeightEntry[]> => {
      const { data, error } = await supabase
        .from('height_entries')
        .select(HEIGHT_COLUMNS)
        .eq('dog_id', dogId!)
        .order('measured_on', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        withers_cm: Number(row.withers_cm),
      })) as HeightEntry[];
    },
  });
}

export function useSaveHeight(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { measured_on: string; withers_cm: number; note: string | null }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase.from('height_entries').upsert(
        { ...entry, dog_id: dogId, recorded_by: user.user?.id ?? null },
        { onConflict: 'dog_id,measured_on' },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heights', dogId] }),
  });
}

export function useDeleteHeight(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('height_entries').delete().eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heights', dogId] }),
  });
}

export function latestHeight(entries: HeightEntry[] | undefined): HeightEntry | null {
  if (!entries?.length) return null;
  return entries[entries.length - 1];
}

export function heightChange(entries: HeightEntry[] | undefined): number | null {
  if (!entries || entries.length < 2) return null;
  return entries[entries.length - 1].withers_cm - entries[entries.length - 2].withers_cm;
}
