import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Collection, CollectionItem, DogList } from '../types/models';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    staleTime: ONE_DAY,
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from('skill_collections')
        .select('slug, name, description, source, sort_order, skill_collection_items(skill_slug, position, start_age_weeks, note)')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({
        slug: row.slug as string,
        name: row.name as string,
        description: row.description as string | null,
        source: row.source as string | null,
        items: ((row.skill_collection_items ?? []) as CollectionItem[])
          .slice()
          .sort((a, b) => a.position - b.position),
      }));
    },
  });
}

export function useDogLists(dogId: string | undefined) {
  return useQuery({
    queryKey: ['dog-lists', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<DogList[]> => {
      const { data, error } = await supabase
        .from('dog_lists')
        .select('id, name, position, dog_list_items(skill_slug, position)')
        .eq('dog_id', dogId!)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        position: row.position as number,
        items: ((row.dog_list_items ?? []) as { skill_slug: string; position: number }[])
          .slice()
          .sort((a, b) => a.position - b.position),
      }));
    },
  });
}

export function useListActions(dogId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dog-lists', dogId] });

  const createList = useMutation({
    mutationFn: async ({ name, skillSlugs }: { name: string; skillSlugs?: string[] }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('dog_lists')
        .insert({ dog_id: dogId, name, created_by: user.user?.id ?? null })
        .select('id')
        .single();
      if (error) throw error;

      if (skillSlugs?.length) {
        const rows = skillSlugs.map((slug, index) => ({
          list_id: data.id,
          skill_slug: slug,
          position: index + 1,
        }));
        const { error: itemsError } = await supabase.from('dog_list_items').insert(rows);
        if (itemsError) throw itemsError;
      }
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  const renameList = useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      const { error } = await supabase.from('dog_lists').update({ name }).eq('id', listId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase.from('dog_lists').delete().eq('id', listId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addToList = useMutation({
    mutationFn: async ({ listId, skillSlug, position }: { listId: string; skillSlug: string; position: number }) => {
      const { error } = await supabase
        .from('dog_list_items')
        .upsert({ list_id: listId, skill_slug: skillSlug, position }, { onConflict: 'list_id,skill_slug' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeFromList = useMutation({
    mutationFn: async ({ listId, skillSlug }: { listId: string; skillSlug: string }) => {
      const { error } = await supabase
        .from('dog_list_items')
        .delete()
        .eq('list_id', listId)
        .eq('skill_slug', skillSlug);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorderList = useMutation({
    mutationFn: async ({ listId, orderedSlugs }: { listId: string; orderedSlugs: string[] }) => {
      const rows = orderedSlugs.map((slug, index) => ({
        list_id: listId,
        skill_slug: slug,
        position: index + 1,
      }));
      const { error } = await supabase
        .from('dog_list_items')
        .upsert(rows, { onConflict: 'list_id,skill_slug' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createList, renameList, deleteList, addToList, removeFromList, reorderList };
}

export function useToggleFavourite(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillSlug, favourite }: { skillSlug: string; favourite: boolean }) => {
      const { error } = await supabase
        .from('dog_skills')
        .upsert({ dog_id: dogId, skill_slug: skillSlug, favourite }, { onConflict: 'dog_id,skill_slug' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dog-skills', dogId] }),
  });
}
