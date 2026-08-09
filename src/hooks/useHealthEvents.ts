import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { HealthEvent, HealthEventInput } from '../types/models';

const EVENT_COLUMNS = 'id, dog_id, type, label, product_slug, occurred_on, next_due_on, notes';

export function useHealthEvents(dogId: string | undefined) {
  return useQuery({
    queryKey: ['health-events', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<HealthEvent[]> => {
      const { data, error } = await supabase
        .from('health_events')
        .select(EVENT_COLUMNS)
        .eq('dog_id', dogId!)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as HealthEvent[];
    },
  });
}

export function useSaveHealthEvents(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (events: HealthEventInput[]) => {
      if (!events.length) return;
      const { data: user } = await supabase.auth.getUser();
      const rows = events.map((event) => ({
        ...event,
        dog_id: dogId,
        recorded_by: user.user?.id ?? null,
      }));

      const { error } = await supabase.from('health_events').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-events', dogId] }),
  });
}

export function useDeleteHealthEvent(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('health_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-events', dogId] }),
  });
}
