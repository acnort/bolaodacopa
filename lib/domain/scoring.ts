import {
  type AppSnapshot,
  type LeaderboardEntry,
  type Match,
  type MatchPrediction,
  type OfficialResult,
  type PlacementPrediction,
  type PlacementResult,
  type PredictionRule,
  type Profile,
  type ScoreEntry,
} from "@/lib/domain/types";

const LIVE_MATCH_STALE_WINDOW_MS = 3 * 60 * 60 * 1000;
const MATCH_PREDICTION_CLOSE_BEFORE_MS = 60 * 60 * 1000;

function getOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

export function isRuleOpen(rule: PredictionRule, now = new Date()) {
  const opensAt = new Date(rule.opensAt);
  const closesAt = new Date(rule.closesAt);
  return opensAt <= now && now <= closesAt && rule.status === "active";
}

export function isPerMatchPredictionPhase(phaseId: string) {
  return phaseId !== "phase-groups" && phaseId !== "phase-podium";
}

export function getMatchPredictionClosesAt(match: Pick<Match, "kickoffAt">) {
  return new Date(
    new Date(match.kickoffAt).getTime() - MATCH_PREDICTION_CLOSE_BEFORE_MS,
  );
}

export function getNextMatchPredictionClosesAt(
  matches: Array<Pick<Match, "kickoffAt"> & Partial<Pick<Match, "status">>>,
  now = new Date(),
) {
  const nowTimestamp = now.getTime();

  return matches
    .filter((match) => match.status !== "completed")
    .map(getMatchPredictionClosesAt)
    .filter((closesAt) => closesAt.getTime() >= nowTimestamp)
    .sort((left, right) => left.getTime() - right.getTime())[0];
}

export function isMatchPredictionOpen(
  rule: PredictionRule | undefined,
  match: Pick<Match, "phaseId" | "kickoffAt"> | undefined,
  now = new Date(),
) {
  if (!rule || !match || !rule.enableMatchPredictions) return false;
  if (rule.status !== "active") return false;

  const opensAt = new Date(rule.opensAt);
  if (opensAt > now) return false;

  const closesAt = isPerMatchPredictionPhase(match.phaseId)
    ? getMatchPredictionClosesAt(match)
    : new Date(rule.closesAt);

  return now <= closesAt;
}

export function isPhasePredictionVisible(
  rule: Pick<PredictionRule, "closesAt"> | undefined,
  now = new Date(),
) {
  if (!rule) return false;

  const closesAt = new Date(rule.closesAt).getTime();
  return Number.isFinite(closesAt) && closesAt < now.getTime();
}

function isPastDate(value: string | undefined, now: Date) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function isMatchResultPublic(
  match: Pick<Match, "kickoffAt"> | undefined,
  result: Pick<OfficialResult, "publishedAt"> | undefined,
  now = new Date(),
) {
  return (
    Boolean(match) &&
    Boolean(result) &&
    isPastDate(match?.kickoffAt, now) &&
    isPastDate(result?.publishedAt, now)
  );
}

function isPlacementResultPublic(result: PlacementResult, now: Date) {
  return isPastDate(result.publishedAt, now);
}

export function scoreMatchPrediction(
  prediction: MatchPrediction,
  result: OfficialResult,
  rule: PredictionRule,
): ScoreEntry {
  const exactHit =
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore;

  const correctOutcome =
    getOutcome(prediction.homeScore, prediction.awayScore) ===
    getOutcome(result.homeScore, result.awayScore);
  const outcomeHit = !exactHit && correctOutcome;

  const points = exactHit
    ? rule.scoring.exactScore
    : outcomeHit
      ? rule.scoring.correctOutcome
      : 0;

  return {
    id: `score-match-${prediction.id}`,
    userId: prediction.userId,
    phaseId: rule.phaseId,
    sourceType: "match",
    sourceId: prediction.matchId,
    points,
    exactHit,
    outcomeHit,
    description: exactHit
      ? "Placar exato"
      : outcomeHit
        ? "Acertou vencedor / empate"
        : "Sem pontos",
  };
}

export function scorePlacementPrediction(
  prediction: PlacementPrediction,
  result: PlacementResult,
  rule: PredictionRule,
): ScoreEntry {
  const championHit =
    Boolean(result.championTeamId) &&
    prediction.championTeamId === result.championTeamId;
  const runnerUpHit =
    Boolean(result.runnerUpTeamId) &&
    prediction.runnerUpTeamId === result.runnerUpTeamId;
  const thirdPlaceHit =
    Boolean(result.thirdPlaceTeamId) &&
    prediction.thirdPlaceTeamId === result.thirdPlaceTeamId;

  const points =
    (championHit ? rule.scoring.champion : 0) +
    (runnerUpHit ? rule.scoring.runnerUp : 0) +
    (thirdPlaceHit ? rule.scoring.thirdPlace : 0);

  return {
    id: `score-placement-${prediction.id}`,
    userId: prediction.userId,
    phaseId: rule.phaseId,
    sourceType: "placement",
    sourceId: prediction.id,
    points,
    exactHit: championHit && runnerUpHit && thirdPlaceHit,
    outcomeHit: championHit || runnerUpHit || thirdPlaceHit,
    description: "Pódio Final",
  };
}

export function buildLeaderboardEntries(
  profiles: Profile[],
  entries: ScoreEntry[],
): LeaderboardEntry[] {
  const byUser = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        userId: profile.id,
        displayName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        isFake: profile.isFake,
        totalPoints: 0,
        exactHits: 0,
        outcomeHits: 0,
        createdAt: profile.createdAt,
      },
    ]),
  );

  for (const entry of entries) {
    const current = byUser.get(entry.userId);
    if (!current) continue;
    current.totalPoints += entry.points;
    current.exactHits += entry.exactHit ? 1 : 0;
    current.outcomeHits += entry.outcomeHit ? 1 : 0;
  }

  const sortedEntries = [...byUser.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    if (b.outcomeHits !== a.outcomeHits) {
      return b.outcomeHits - a.outcomeHits;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let currentPosition = 0;

  return sortedEntries.map((entry, index) => {
    const previous = sortedEntries[index - 1];
    const isTiedWithPrevious =
      previous &&
      previous.totalPoints === entry.totalPoints &&
      previous.exactHits === entry.exactHits &&
      previous.outcomeHits === entry.outcomeHits;

    if (!isTiedWithPrevious) {
      currentPosition = index + 1;
    }

    return {
      userId: entry.userId,
      displayName: entry.displayName,
      avatarUrl: entry.avatarUrl,
      isFake: entry.isFake,
      totalPoints: entry.totalPoints,
      exactHits: entry.exactHits,
      outcomeHits: entry.outcomeHits,
      position: currentPosition,
    };
  });
}

export function buildScoreEntries(snapshot: AppSnapshot, now = new Date()) {
  const resultsByMatch = new Map(
    snapshot.results.map((result) => [result.matchId, result]),
  );
  const matchesById = new Map(
    snapshot.matches.map((match) => [match.id, match]),
  );
  const rulesByPhase = new Map(
    snapshot.rules.map((rule) => [rule.phaseId, rule]),
  );
  const entries: ScoreEntry[] = [];

  for (const prediction of snapshot.matchPredictions) {
    const result = resultsByMatch.get(prediction.matchId);
    const match = matchesById.get(prediction.matchId);
    if (!match || !result || !isMatchResultPublic(match, result, now)) continue;
    const rule = rulesByPhase.get(match.phaseId);
    if (!rule) continue;
    entries.push(scoreMatchPrediction(prediction, result, rule));
  }

  const placementRule =
    snapshot.rules.find((rule) => rule.enablePlacementPredictions) ??
    snapshot.rules[snapshot.rules.length - 1];

  if (placementRule && isPlacementResultPublic(snapshot.placementResult, now)) {
    for (const prediction of snapshot.placementPredictions) {
      entries.push(
        scorePlacementPrediction(
          prediction,
          snapshot.placementResult,
          placementRule,
        ),
      );
    }
  }

  return entries;
}

export function buildLeaderboard(snapshot: AppSnapshot, now = new Date()) {
  const approvedUserIds = new Set(
    snapshot.memberships.map((membership) => membership.userId),
  );
  const approvedProfiles = snapshot.profiles.filter((profile) =>
    approvedUserIds.has(profile.id),
  );

  return buildLeaderboardEntries(
    approvedProfiles,
    buildScoreEntries(snapshot, now),
  );
}

export interface LiveLeaderboardMovement {
  userId: string;
  currentPosition: number;
  previousPosition: number;
  positionDelta: number;
}

function isLiveResultForLeaderboard(
  match: Pick<Match, "kickoffAt" | "status"> | undefined,
  now: Date,
) {
  if (!match) return false;
  if (match.status === "in_progress") return true;
  if (match.status === "completed") return false;

  const kickoffTime = new Date(match.kickoffAt).getTime();
  const elapsedMs = now.getTime() - kickoffTime;

  return (
    Number.isFinite(elapsedMs) &&
    elapsedMs >= 0 &&
    elapsedMs <= LIVE_MATCH_STALE_WINDOW_MS
  );
}

export function buildLiveLeaderboardMovements(
  snapshot: AppSnapshot,
  now = new Date(),
) {
  const matchesById = new Map(
    snapshot.matches.map((match) => [match.id, match]),
  );
  const liveResultMatchIds = new Set(
    snapshot.results
      .filter((result) =>
        isLiveResultForLeaderboard(matchesById.get(result.matchId), now),
      )
      .map((result) => result.matchId),
  );

  if (liveResultMatchIds.size === 0) {
    return new Map<string, LiveLeaderboardMovement>();
  }

  const baseSnapshot = {
    ...snapshot,
    results: snapshot.results.filter(
      (result) => !liveResultMatchIds.has(result.matchId),
    ),
  };
  const previousPositions = new Map(
    buildLeaderboard(baseSnapshot, now).map((entry) => [
      entry.userId,
      entry.position,
    ]),
  );
  const movements = new Map<string, LiveLeaderboardMovement>();

  for (const entry of buildLeaderboard(snapshot, now)) {
    const previousPosition = previousPositions.get(entry.userId);
    if (!previousPosition) continue;

    const positionDelta = previousPosition - entry.position;
    if (positionDelta === 0) continue;

    movements.set(entry.userId, {
      userId: entry.userId,
      currentPosition: entry.position,
      previousPosition,
      positionDelta,
    });
  }

  return movements;
}

export function getPhaseRuleForMatch(match: Match, rules: PredictionRule[]) {
  return rules.find((rule) => rule.phaseId === match.phaseId);
}

export function findProfileDisplayName(
  profiles: Profile[],
  userId: string,
  fallback = "Participante",
) {
  return (
    profiles.find((profile) => profile.id === userId)?.fullName ?? fallback
  );
}
