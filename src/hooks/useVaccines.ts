import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Vaccine } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function useVaccines() {
  return useQuery({
    queryKey: ['vaccines'],
    staleTime: ONE_DAY,
    queryFn: async (): Promise<Vaccine[]> => {
      const { data, error } = await supabase
        .from('vaccines')
        .select('slug, name, diseases, core, booster_interval_months, first_dose_min_weeks, availability, source')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Vaccine[];
    },
  });
}
