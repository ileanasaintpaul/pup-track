import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import { groupByCentile, type CentileSeries } from '../lib/growth';
import type { DogSex, SizeBand } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function useGrowthCurves(band: SizeBand | undefined, sex: DogSex | null | undefined) {
  return useQuery({
    queryKey: ['growth-curves', band, sex],
    enabled: !!band && !!sex,
    staleTime: ONE_DAY,
    queryFn: async (): Promise<CentileSeries> => {
      const { data, error } = await supabase
        .from('growth_curves')
        .select('age_weeks, centile, weight_kg')
        .eq('size_band', band!)
        .eq('sex', sex!)
        .order('age_weeks', { ascending: true });

      if (error) throw error;
      return groupByCentile(
        (data ?? []).map((row) => ({
          age_weeks: Number(row.age_weeks),
          centile: Number(row.centile),
          weight_kg: Number(row.weight_kg),
        })),
      );
    },
  });
}
