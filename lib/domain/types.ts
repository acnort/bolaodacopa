export type UserRole = "owner" | "admin" | "member";
export type SignupRequestStatus = "pending" | "approved" | "rejected";
export type MatchStatus = "scheduled" | "in_progress" | "completed";
export type ScoreSourceType = "match" | "placement";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface SignupRequest {
  id: string;
  fullName: string;
  email: string;
  token: string;
  role: UserRole;
  status: SignupRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedUserId?: string;
}

export interface AccessInvite {
  id: string;
  token: string;
  createdAt: string;
  createdBy?: string;
  revokedAt?: string;
}

export interface Membership {
  id: string;
  userId: string;
  competitionId: string;
  role: UserRole;
  joinedAt: string;
}

export interface Competition {
  id: string;
  name: string;
  edition: string;
  host: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string;
  group?: string;
}

export interface Phase {
  id: string;
  competitionId: string;
  slug: string;
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
}

export interface PhaseScoring {
  exactScore: number;
  correctOutcome: number;
  champion: number;
  runnerUp: number;
  thirdPlace: number;
}

export interface PredictionRule {
  id: string;
  phaseId: string;
  enableMatchPredictions: boolean;
  enablePlacementPredictions: boolean;
  opensAt: string;
  closesAt: string;
  scoring: PhaseScoring;
  status: "draft" | "active" | "locked";
}

export interface Match {
  id: string;
  externalMatchId?: string;
  phaseId: string;
  roundLabel: string;
  stageGroup?: string;
  kickoffAt: string;
  venue: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  status: MatchStatus;
}

export interface PhaseBatchPredictionInput {
  userId: string;
  phaseId: string;
  predictions: Array<{
    matchId: string;
    homeScore: number;
    awayScore: number;
  }>;
  placementPrediction?: {
    competitionId: string;
    championTeamId: string;
    runnerUpTeamId: string;
    thirdPlaceTeamId: string;
  };
}

export interface OfficialResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  publishedAt: string;
}

export interface PlacementResult {
  competitionId: string;
  championTeamId?: string;
  runnerUpTeamId?: string;
  thirdPlaceTeamId?: string;
  publishedAt?: string;
}

export interface MatchPrediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementPrediction {
  id: string;
  userId: string;
  competitionId: string;
  championTeamId?: string;
  runnerUpTeamId?: string;
  thirdPlaceTeamId?: string;
  updatedAt: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  phaseId: string;
  sourceType: ScoreSourceType;
  sourceId: string;
  points: number;
  exactHit: boolean;
  outcomeHit: boolean;
  description: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalPoints: number;
  exactHits: number;
  outcomeHits: number;
  position: number;
}

export interface AppSnapshot {
  competition: Competition;
  teams: Team[];
  phases: Phase[];
  rules: PredictionRule[];
  matches: Match[];
  results: OfficialResult[];
  placementResult: PlacementResult;
  profiles: Profile[];
  accessInvites: AccessInvite[];
  signupRequests: SignupRequest[];
  memberships: Membership[];
  matchPredictions: MatchPrediction[];
  placementPredictions: PlacementPrediction[];
}

export interface MatchPredictionInput {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface PlacementPredictionInput {
  userId: string;
  competitionId: string;
  championTeamId: string;
  runnerUpTeamId: string;
  thirdPlaceTeamId: string;
}

export interface OfficialResultInput {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
}

export interface SyncedMatchInput {
  matchId: string;
  externalMatchId: string;
  kickoffAt: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

export interface PlacementResultInput {
  competitionId: string;
  championTeamId: string;
  runnerUpTeamId: string;
  thirdPlaceTeamId: string;
}

export interface PhaseRuleInput {
  phaseId: string;
  enableMatchPredictions: boolean;
  enablePlacementPredictions: boolean;
  opensAt: string;
  closesAt: string;
  exactScore: number;
  correctOutcome: number;
  champion: number;
  runnerUp: number;
  thirdPlace: number;
  status: "draft" | "active" | "locked";
}

export interface SignupRequestInput {
  fullName: string;
  email: string;
}

export interface AccessSetupInput {
  token: string;
  fullName: string;
  email: string;
  passwordHash: string;
}

export interface SignupRequestReviewInput {
  requestId: string;
  action: "approve" | "reject";
  reviewedByUserId?: string;
}

export interface AuthInput {
  email: string;
}

export interface ActionResult<T = unknown> {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}
