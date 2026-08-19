import type {
  CheckIn,
  DailyFocus,
  Observation,
  PlayerGoal,
  PlayerProfile,
  Reflection,
  Session,
  SkillState,
  WeeklyReview
} from '../domain';
import type {
  SyncEntityType,
  SyncOperation
} from '../persistence/local';

export interface RemoteUserData {
  checkIns: CheckIn[];
  dailyFocuses: DailyFocus[];
  observations: Observation[];
  playerGoals: PlayerGoal[];
  profiles: PlayerProfile[];
  reflections: Reflection[];
  sessions: Session[];
  skillStates: SkillState[];
  weeklyReviews: WeeklyReview[];
}

export type RemoteSyncEntity =
  | CheckIn
  | DailyFocus
  | Observation
  | PlayerGoal
  | PlayerProfile
  | Reflection
  | Session
  | SkillState
  | WeeklyReview;

export interface RemoteDeleteInput {
  entityId: string;
  entityType: SyncEntityType;
  payload?: unknown;
  userId: string;
}

export interface RemoteSyncAdapter {
  delete(input: RemoteDeleteInput): Promise<void>;
  listUserData(userId: string): Promise<RemoteUserData>;
  upsert(entityType: SyncEntityType, entity: RemoteSyncEntity): Promise<void>;
}

export interface SyncProcessResult {
  failedOperation: SyncOperation | null;
  nextRetryAt: string | null;
  pendingOperationCount: number;
  processedCount: number;
}

export type SyncIndicatorStatus = 'synced' | 'syncing' | 'offline' | 'needs_attention';

export type InitialSyncBootstrapStatus =
  | 'complete'
  | 'idle'
  | 'needs_attention'
  | 'offline'
  | 'syncing';
