import type { SupabaseClient } from '@supabase/supabase-js';

import {
  parseCheckIn,
  parseDailyFocus,
  parseObservation,
  parsePlayerGoal,
  parsePlayerProfile,
  parseReflection,
  parseSession,
  parseSkillState,
  parseWeeklyReview,
  type CheckIn,
  type DailyFocus,
  type Observation,
  type PlayerGoal,
  type PlayerProfile,
  type Reflection,
  type Session,
  type SkillState,
  type WeeklyReview
} from '../domain';
import type { SyncEntityType } from '../persistence/local';
import type {
  RemoteDeleteInput,
  RemoteSyncAdapter,
  RemoteSyncEntity,
  RemoteUserData
} from './types';

type RemoteRow = Record<string, unknown>;
type RemoteTableName = SyncEntityType;

export class SupabaseRemoteSyncAdapter implements RemoteSyncAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async listUserData(userId: string): Promise<RemoteUserData> {
    const [
      profiles,
      playerGoals,
      sessions,
      dailyFocuses,
      checkIns,
      reflections,
      observations,
      skillStates,
      weeklyReviews
    ] = await Promise.all([
      this.selectUserRows('profiles', userId, toPlayerProfile),
      this.selectUserRows('player_goals', userId, toPlayerGoal),
      this.selectUserRows('sessions', userId, toSession),
      this.selectUserRows('daily_focus', userId, toDailyFocus),
      this.selectUserRows('check_ins', userId, toCheckIn),
      this.selectUserRows('reflections', userId, toReflection),
      this.selectUserRows('observations', userId, toObservation),
      this.selectUserRows('skill_state', userId, toSkillState),
      this.selectUserRows('weekly_reviews', userId, toWeeklyReview)
    ]);

    return {
      checkIns,
      dailyFocuses,
      observations,
      playerGoals,
      profiles,
      reflections,
      sessions,
      skillStates,
      weeklyReviews
    };
  }

  async upsert(entityType: SyncEntityType, entity: RemoteSyncEntity): Promise<void> {
    const { error } = await this.client
      .from(getTableName(entityType))
      .upsert(toRemoteRow(entityType, entity), {
        onConflict: getUpsertConflictTarget(entityType)
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  async delete(input: RemoteDeleteInput): Promise<void> {
    const table = this.client.from(getTableName(input.entityType)).delete();
    const query =
      input.entityType === 'skill_state'
        ? table.eq('user_id', input.userId).eq('skill_id', getSkillIdFromEntityId(input.entityId))
        : table.eq('user_id', input.userId).eq('id', input.entityId);
    const { error } = await query;

    if (error) {
      throw new Error(error.message);
    }
  }

  private async selectUserRows<T>(
    tableName: RemoteTableName,
    userId: string,
    mapper: (row: RemoteRow) => T,
  ): Promise<T[]> {
    const { data, error } = await this.client
      .from(tableName)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapper(toRecord(row)));
  }
}

function getTableName(entityType: SyncEntityType): RemoteTableName {
  return entityType;
}

function getUpsertConflictTarget(entityType: SyncEntityType): string {
  switch (entityType) {
    case 'profiles':
      return 'user_id';
    case 'check_ins':
    case 'reflections':
      return 'session_id';
    case 'skill_state':
      return 'user_id,skill_id';
    case 'daily_focus':
      return 'user_id,local_date';
    case 'weekly_reviews':
      return 'user_id,week_start';
    default:
      return 'id';
  }
}

function toRemoteRow(entityType: SyncEntityType, entity: RemoteSyncEntity): RemoteRow {
  switch (entityType) {
    case 'profiles':
      return profileToRemoteRow(parsePlayerProfile(entity));
    case 'player_goals':
      return playerGoalToRemoteRow(parsePlayerGoal(entity));
    case 'sessions':
      return sessionToRemoteRow(parseSession(entity));
    case 'check_ins':
      return checkInToRemoteRow(parseCheckIn(entity));
    case 'reflections':
      return reflectionToRemoteRow(parseReflection(entity));
    case 'observations':
      return observationToRemoteRow(parseObservation(entity));
    case 'skill_state':
      return skillStateToRemoteRow(parseSkillState(entity));
    case 'daily_focus':
      return dailyFocusToRemoteRow(parseDailyFocus(entity));
    case 'weekly_reviews':
      return weeklyReviewToRemoteRow(parseWeeklyReview(entity));
  }
}

function profileToRemoteRow(profile: PlayerProfile): RemoteRow {
  return {
    id: profile.id,
    user_id: profile.userId,
    alias: profile.alias ?? null,
    birth_year: profile.birthYear,
    height_cm: profile.heightCm ?? null,
    dominant_hand: profile.dominantHand ?? null,
    primary_position: profile.primaryPosition,
    secondary_position: profile.secondaryPosition ?? null,
    experience_years: profile.experienceYears ?? null,
    competitive_level: profile.competitiveLevel,
    weekly_practices: profile.weeklyPractices ?? null,
    weekly_games: profile.weeklyGames ?? null,
    locale: profile.locale,
    physical_context: profile.physicalContext ?? null,
    onboarding_completed_at: profile.onboardingCompletedAt ?? null,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt
  };
}

function playerGoalToRemoteRow(goal: PlayerGoal): RemoteRow {
  return {
    id: goal.id,
    user_id: goal.userId,
    goal_type: goal.goalType,
    custom_label: goal.customLabel ?? null,
    priority: goal.priority,
    active: goal.active,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt
  };
}

function sessionToRemoteRow(session: Session): RemoteRow {
  return {
    id: session.id,
    user_id: session.userId,
    type: session.type,
    scheduled_at: session.scheduledAt ?? null,
    started_at: session.startedAt ?? null,
    completed_at: session.completedAt ?? null,
    duration_minutes: session.durationMinutes ?? null,
    perceived_load: session.perceivedLoad ?? null,
    notes: session.notes ?? null,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    deleted_at: session.deletedAt ?? null
  };
}

function dailyFocusToRemoteRow(dailyFocus: DailyFocus): RemoteRow {
  return {
    id: dailyFocus.id,
    user_id: dailyFocus.userId,
    local_date: dailyFocus.localDate,
    guideline_id: dailyFocus.guidelineId,
    reason_code: dailyFocus.reasonCode,
    status: dailyFocus.status,
    created_at: dailyFocus.createdAt,
    updated_at: dailyFocus.updatedAt
  };
}

function checkInToRemoteRow(checkIn: CheckIn): RemoteRow {
  return {
    id: checkIn.id,
    user_id: checkIn.userId,
    session_id: checkIn.sessionId,
    energy: checkIn.energy ?? null,
    confidence: checkIn.confidence ?? null,
    physical_feeling: checkIn.physicalFeeling ?? null,
    note: checkIn.note ?? null,
    created_at: checkIn.createdAt,
    updated_at: checkIn.updatedAt
  };
}

function reflectionToRemoteRow(reflection: Reflection): RemoteRow {
  return {
    id: reflection.id,
    user_id: reflection.userId,
    session_id: reflection.sessionId,
    daily_focus_id: reflection.dailyFocusId ?? null,
    focus_rating: reflection.focusRating,
    note: reflection.note ?? null,
    coach_feedback: reflection.coachFeedback ?? null,
    remember_next_time: reflection.rememberNextTime ?? null,
    created_at: reflection.createdAt,
    updated_at: reflection.updatedAt
  };
}

function observationToRemoteRow(observation: Observation): RemoteRow {
  return {
    id: observation.id,
    user_id: observation.userId,
    session_id: observation.sessionId ?? null,
    reflection_id: observation.reflectionId ?? null,
    skill_id: observation.skillId,
    pattern: observation.pattern ?? null,
    polarity: observation.polarity,
    weight: observation.weight,
    source: observation.source,
    confidence: observation.confidence,
    observed_at: observation.observedAt
  };
}

function skillStateToRemoteRow(skillState: SkillState): RemoteRow {
  return {
    user_id: skillState.userId,
    skill_id: skillState.skillId,
    score: skillState.score,
    confidence: skillState.confidence,
    sample_count: skillState.sampleCount,
    trend: skillState.trend,
    last_observed_at: skillState.lastObservedAt ?? null,
    updated_at: skillState.updatedAt
  };
}

function weeklyReviewToRemoteRow(weeklyReview: WeeklyReview): RemoteRow {
  return {
    id: weeklyReview.id,
    user_id: weeklyReview.userId,
    week_start: weeklyReview.weekStart,
    highlighted_skill_ids: weeklyReview.highlightedSkillIds,
    improving_skill_ids: weeklyReview.improvingSkillIds,
    recurring_skill_ids: weeklyReview.recurringSkillIds,
    next_priority_skill_ids: weeklyReview.nextPrioritySkillIds,
    user_improvement_note: weeklyReview.userImprovementNote ?? null,
    user_next_week_note: weeklyReview.userNextWeekNote ?? null,
    created_at: weeklyReview.createdAt,
    updated_at: weeklyReview.updatedAt
  };
}

function toPlayerProfile(row: RemoteRow): PlayerProfile {
  return parsePlayerProfile({
    id: row.id,
    userId: row.user_id,
    alias: nullableToUndefined(row.alias),
    birthYear: row.birth_year,
    heightCm: nullableToUndefined(row.height_cm),
    dominantHand: nullableToUndefined(row.dominant_hand),
    primaryPosition: row.primary_position,
    secondaryPosition: nullableToUndefined(row.secondary_position),
    experienceYears: nullableToUndefined(row.experience_years),
    competitiveLevel: row.competitive_level,
    weeklyPractices: nullableToUndefined(row.weekly_practices),
    weeklyGames: nullableToUndefined(row.weekly_games),
    locale: row.locale,
    physicalContext: nullableToUndefined(row.physical_context),
    onboardingCompletedAt: nullableToUndefined(row.onboarding_completed_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function toPlayerGoal(row: RemoteRow): PlayerGoal {
  return parsePlayerGoal({
    id: row.id,
    userId: row.user_id,
    goalType: row.goal_type,
    customLabel: nullableToUndefined(row.custom_label),
    priority: row.priority,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function toSession(row: RemoteRow): Session {
  return parseSession({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    scheduledAt: nullableToUndefined(row.scheduled_at),
    startedAt: nullableToUndefined(row.started_at),
    completedAt: nullableToUndefined(row.completed_at),
    durationMinutes: nullableToUndefined(row.duration_minutes),
    perceivedLoad: nullableToUndefined(row.perceived_load),
    notes: nullableToUndefined(row.notes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: nullableToUndefined(row.deleted_at)
  });
}

function toDailyFocus(row: RemoteRow): DailyFocus {
  return parseDailyFocus({
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    guidelineId: row.guideline_id,
    reasonCode: row.reason_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function toCheckIn(row: RemoteRow): CheckIn {
  return parseCheckIn({
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    energy: nullableToUndefined(row.energy),
    confidence: nullableToUndefined(row.confidence),
    physicalFeeling: nullableToUndefined(row.physical_feeling),
    note: nullableToUndefined(row.note),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function toReflection(row: RemoteRow): Reflection {
  return parseReflection({
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    dailyFocusId: nullableToUndefined(row.daily_focus_id),
    focusRating: row.focus_rating,
    note: nullableToUndefined(row.note),
    coachFeedback: nullableToUndefined(row.coach_feedback),
    rememberNextTime: nullableToUndefined(row.remember_next_time),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function toObservation(row: RemoteRow): Observation {
  return parseObservation({
    id: row.id,
    userId: row.user_id,
    sessionId: nullableToUndefined(row.session_id),
    reflectionId: nullableToUndefined(row.reflection_id),
    skillId: row.skill_id,
    pattern: nullableToUndefined(row.pattern),
    polarity: row.polarity,
    weight: row.weight,
    source: row.source,
    confidence: row.confidence,
    observedAt: row.observed_at
  });
}

function toSkillState(row: RemoteRow): SkillState {
  return parseSkillState({
    userId: row.user_id,
    skillId: row.skill_id,
    score: row.score,
    confidence: row.confidence,
    sampleCount: row.sample_count,
    trend: row.trend,
    lastObservedAt: nullableToUndefined(row.last_observed_at),
    updatedAt: row.updated_at
  });
}

function toWeeklyReview(row: RemoteRow): WeeklyReview {
  return parseWeeklyReview({
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    highlightedSkillIds: row.highlighted_skill_ids,
    improvingSkillIds: row.improving_skill_ids,
    recurringSkillIds: row.recurring_skill_ids,
    nextPrioritySkillIds: row.next_priority_skill_ids,
    userImprovementNote: nullableToUndefined(row.user_improvement_note),
    userNextWeekNote: nullableToUndefined(row.user_next_week_note),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function getSkillIdFromEntityId(entityId: string): string {
  return entityId.split(':').slice(1).join(':');
}

function toRecord(value: unknown): RemoteRow {
  return value && typeof value === 'object' ? (value as RemoteRow) : {};
}

function nullableToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}
