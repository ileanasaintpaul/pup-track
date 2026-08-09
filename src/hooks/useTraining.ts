import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { DogSkill, Skill, SkillLevel, TrainingSession, TrainingSessionInput } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;
const SESSION_COLUMNS = 'id, dog_id, skill_slug, occurred_on, duration_min, success_rate, environment, notes';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    staleTime: ONE_DAY,
    queryFn: async (): Promise<Skill[]> => {
      const { data, error } = await supabase
        .from('skills')
        .select('slug, name, category, description, min_age_weeks, sort_order')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Skill[];
    },
  });
}

export function useDogSkills(dogId: string | undefined) {
  return useQuery({
    queryKey: ['dog-skills', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<Map<string, DogSkill>> => {
      const { data, error } = await supabase
        .from('dog_skills')
        .select('skill_slug, level, favourite, started_on, updated_at')
        .eq('dog_id', dogId!);

      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.skill_slug as string, row as DogSkill]));
    },
  });
}

export function useSetSkillLevel(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillSlug, level }: { skillSlug: string; level: SkillLevel }) => {
      const { error } = await supabase.from('dog_skills').upsert(
        {
          dog_id: dogId,
          skill_slug: skillSlug,
          level,
          started_on: level > 0 ? new Date().toISOString().slice(0, 10) : null,
        },
        { onConflict: 'dog_id,skill_slug' },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dog-skills', dogId] }),
  });
}

export function useTrainingSessions(dogId: string | undefined) {
  return useQuery({
    queryKey: ['training-sessions', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<TrainingSession[]> => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(SESSION_COLUMNS)
        .eq('dog_id', dogId!)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as TrainingSession[];
    },
  });
}

export function useAddSession(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: TrainingSessionInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('training_sessions')
        .insert({ ...session, dog_id: dogId, recorded_by: user.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-sessions', dogId] }),
  });
}

export function useDeleteSession(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-sessions', dogId] }),
  });
}
