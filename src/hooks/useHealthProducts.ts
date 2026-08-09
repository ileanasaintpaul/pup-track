import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { HealthProduct } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function useHealthProducts() {
  return useQuery({
    queryKey: ['health-products'],
    staleTime: ONE_DAY,
    queryFn: async (): Promise<HealthProduct[]> => {
      const { data, error } = await supabase
        .from('health_products')
        .select('slug, type, name, diseases, core, booster_interval_months, availability, source')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as HealthProduct[];
    },
  });
}
