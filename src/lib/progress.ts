import type { RatePoint } from '../components/RateChart';
import type { Skill, SkillLevel, TrainingSession } from '../types/models';

export type SkillProgressEntry = {
  skill: Skill;
  level: SkillLevel;
  points: RatePoint[];
  sessions: number;
};

export function buildProgress(
  skills: Skill[] | undefined,
  sessions: TrainingSession[] | undefined,
  levels: Map<string, { level: SkillLevel }> | undefined,
): SkillProgressEntry[] {
  if (!skills || !sessions) return [];

  const bySkill = new Map<string, TrainingSession[]>();
  for (const session of sessions) {
    if (!session.skill_slug) continue;
    bySkill.set(session.skill_slug, [...(bySkill.get(session.skill_slug) ?? []), session]);
  }

  const entries: SkillProgressEntry[] = [];
  for (const [slug, list] of bySkill) {
    const skill = skills.find((item) => item.slug === slug);
    if (!skill) continue;

    const points = list
      .filter((session) => session.success_rate !== null)
      .map((session) => ({
        date: session.occurred_on,
        rate: session.success_rate as number,
        environment: session.environment,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    entries.push({
      skill,
      level: (levels?.get(slug)?.level ?? 0) as SkillLevel,
      points,
      sessions: list.length,
    });
  }

  return entries.sort((a, b) => b.sessions - a.sessions);
}
