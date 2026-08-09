import type { HealthEvent, HealthEventType } from '../types/models';

export const HEALTH_EVENT_TYPES = [
  'vaccine',
  'deworming',
  'flea_tick',
  'vet_visit',
  'other',
] as const satisfies readonly HealthEventType[];

export const HEALTH_TYPE_KEYS = {
  vaccine: 'health.record.types.vaccine',
  deworming: 'health.record.types.deworming',
  flea_tick: 'health.record.types.fleaTick',
  vet_visit: 'health.record.types.vetVisit',
  other: 'health.record.types.other',
} as const satisfies Record<HealthEventType, string>;

export const HEALTH_TYPE_ICONS = {
  vaccine: '💉',
  deworming: '🪱',
  flea_tick: '🕷️',
  vet_visit: '🚑',
  other: '📋',
} as const satisfies Record<HealthEventType, string>;

export const SOON_DAYS = 30;

export type DueStatus = 'overdue' | 'soon' | 'later';

export function daysUntil(date: string, today = new Date()): number {
  const target = new Date(`${date}T00:00:00`).getTime();
  const start = new Date(today.toISOString().slice(0, 10) + 'T00:00:00').getTime();
  return Math.round((target - start) / (1000 * 60 * 60 * 24));
}

export function dueStatus(date: string, today = new Date()): DueStatus {
  const days = daysUntil(date, today);
  if (days < 0) return 'overdue';
  if (days <= SOON_DAYS) return 'soon';
  return 'later';
}

export function pendingReminders(events: HealthEvent[] | undefined, today = new Date()): HealthEvent[] {
  if (!events) return [];

  const latestByType = new Map<string, HealthEvent>();
  for (const event of events) {
    if (!event.next_due_on) continue;
    const key = `${event.type}|${event.label.trim().toLowerCase()}`;
    const known = latestByType.get(key);
    if (!known || event.occurred_on > known.occurred_on) latestByType.set(key, event);
  }

  return [...latestByType.values()]
    .filter((event) => dueStatus(event.next_due_on!, today) !== 'later')
    .sort((a, b) => a.next_due_on!.localeCompare(b.next_due_on!));
}
