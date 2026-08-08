import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { GrowthStandard, SizeCategory } from '../types/models';

export function useGrowthStandard(breed: string | null, sizeCategory: SizeCategory | null) {
  return useQuery({
    queryKey: ['growth-standard', breed?.toLowerCase() ?? null, sizeCategory],
    enabled: Boolean(breed || sizeCategory),
    queryFn: async (): Promise<{ source: 'breed' | 'size'; points: GrowthStandard[] } | null> => {
      if (breed) {
        const { data, error } = await supabase
          .from('growth_standards')
          .select('age_weeks, weight_min_kg, weight_max_kg')
          .ilike('breed', breed.trim())
          .order('age_weeks', { ascending: true });

        if (error) throw error;
        if (data?.length) return { source: 'breed', points: toPoints(data) };
      }

      if (sizeCategory) {
        const { data, error } = await supabase
          .from('growth_standards')
          .select('age_weeks, weight_min_kg, weight_max_kg')
          .is('breed', null)
          .eq('size_category', sizeCategory)
          .order('age_weeks', { ascending: true });

        if (error) throw error;
        if (data?.length) return { source: 'size', points: toPoints(data) };
      }

      return null;
    },
  });
}

function toPoints(rows: Record<string, unknown>[]): GrowthStandard[] {
  return rows.map((row) => ({
    age_weeks: Number(row.age_weeks),
    weight_min_kg: Number(row.weight_min_kg),
    weight_max_kg: Number(row.weight_max_kg),
  }));
}
