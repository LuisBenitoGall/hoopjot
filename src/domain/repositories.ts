import type { DailyFocus } from './focus';
import type { PlayerGoal } from './goals';
import type { OnboardingDraft } from './onboarding';
import type { Observation, SkillState } from './observations';
import type { PlayerProfile } from './player';
import type { Reflection } from './reflections';
import type { CheckIn, Session } from './sessions';
import type { Guideline, Skill } from './skills';
import type { WeeklyReview } from './weeklyReview';

export interface PlayerProfileRepository {
  deleteByUserId(userId: string): Promise<void>;
  getByUserId(userId: string): Promise<PlayerProfile | null>;
  save(profile: PlayerProfile): Promise<void>;
}

export interface PlayerGoalRepository {
  delete(id: string): Promise<void>;
  listByUserId(userId: string): Promise<PlayerGoal[]>;
  save(goal: PlayerGoal): Promise<void>;
}

export interface OnboardingDraftRepository {
  deleteByUserId(userId: string): Promise<void>;
  getByUserId(userId: string): Promise<OnboardingDraft | null>;
  save(draft: OnboardingDraft): Promise<void>;
}

export interface BasketballContentRepository {
  getGuidelineById(id: string): Promise<Guideline | null>;
  getSkillById(id: string): Promise<Skill | null>;
  listGuidelines(): Promise<Guideline[]>;
  listSkills(): Promise<Skill[]>;
}

export interface SessionRepository {
  delete(id: string, deletedAt: string): Promise<void>;
  getById(id: string): Promise<Session | null>;
  listByUserId(userId: string): Promise<Session[]>;
  save(session: Session): Promise<void>;
}

export interface CheckInRepository {
  delete(id: string): Promise<void>;
  getBySessionId(sessionId: string): Promise<CheckIn | null>;
  save(checkIn: CheckIn): Promise<void>;
}

export interface ReflectionRepository {
  delete(id: string): Promise<void>;
  getBySessionId(sessionId: string): Promise<Reflection | null>;
  save(reflection: Reflection): Promise<void>;
}

export interface ObservationRepository {
  delete(id: string): Promise<void>;
  listByUserId(userId: string): Promise<Observation[]>;
  save(observation: Observation): Promise<void>;
}

export interface SkillStateRepository {
  delete(userId: string, skillId: string): Promise<void>;
  getBySkillId(userId: string, skillId: string): Promise<SkillState | null>;
  listByUserId(userId: string): Promise<SkillState[]>;
  save(skillState: SkillState): Promise<void>;
}

export interface DailyFocusRepository {
  delete(id: string): Promise<void>;
  getById(id: string): Promise<DailyFocus | null>;
  getByLocalDate(userId: string, localDate: string): Promise<DailyFocus | null>;
  listByUserId(userId: string): Promise<DailyFocus[]>;
  save(dailyFocus: DailyFocus): Promise<void>;
}

export interface WeeklyReviewRepository {
  delete(id: string): Promise<void>;
  getByWeekStart(userId: string, weekStart: string): Promise<WeeklyReview | null>;
  save(weeklyReview: WeeklyReview): Promise<void>;
}
