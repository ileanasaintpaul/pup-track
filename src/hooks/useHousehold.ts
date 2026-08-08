import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Household, Member } from '../types/models';

export function useHousehold(userId: string | undefined) {
  return useQuery({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Household | null> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('households(id, name, created_by)')
        .eq('user_id', userId!)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data?.households as Household | null | undefined) ?? null;
    },
  });
}

export function useMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: ['members', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('user_id, role, joined_at, profiles(display_name)')
        .eq('household_id', householdId!)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({
        user_id: row.user_id as string,
        role: row.role as Member['role'],
        joined_at: row.joined_at as string,
        display_name: ((row.profiles as { display_name?: string } | null)?.display_name ?? '').trim(),
      }));
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, displayName }: { name: string; displayName: string }) => {
      const { data, error } = await supabase.rpc('create_household', { household_name: name });
      if (error) throw error;
      await saveDisplayName(displayName);
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, displayName }: { code: string; displayName: string }) => {
      const { data, error } = await supabase.rpc('join_household_with_code', { invite_code: code });
      if (error) throw error;
      await saveDisplayName(displayName);
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: async (householdId: string) => {
      const { data, error } = await supabase.rpc('create_household_invite', {
        target_household: householdId,
      });
      if (error) throw error;
      return data as string;
    },
  });
}

async function saveDisplayName(displayName: string) {
  const name = displayName.trim();
  if (!name) return;

  const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
  if (error) throw error;

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', user.user.id);
  if (profileError) throw profileError;
}
