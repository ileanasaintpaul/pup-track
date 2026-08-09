import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Breed } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function useBreeds() {
  return useQuery({
    queryKey: ['breeds'],
    staleTime: ONE_DAY,
    queryFn: async (): Promise<Breed[]> => {
      const { data, error } = await supabase
        .from('breeds')
        .select('slug, name, size_band, adult_min_kg, adult_max_kg')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        adult_min_kg: Number(row.adult_min_kg),
        adult_max_kg: Number(row.adult_max_kg),
      })) as Breed[];
    },
  });
}

export function useBreed(slug: string | null | undefined) {
  return useQuery({
    queryKey: ['breed', slug],
    enabled: !!slug,
    staleTime: ONE_DAY,
    queryFn: async (): Promise<Breed | null> => {
      const { data, error } = await supabase
        .from('breeds')
        .select('slug, name, size_band, adult_min_kg, adult_max_kg')
        .eq('slug', slug!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        adult_min_kg: Number(data.adult_min_kg),
        adult_max_kg: Number(data.adult_max_kg),
      } as Breed;
    },
  });
}
