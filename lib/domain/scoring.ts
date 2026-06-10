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

function getOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

export function isRuleOpen(rule: PredictionRule, now = new Date()) {
  const opensAt = new Date(rule.opensAt);
  const closesAt = new Date(rule.closesAt);
  return opensAt <= now && now <= closesAt && rule.status === "active";
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

  const outcomeHit =
    getOutcome(prediction.homeScore, prediction.awayScore) ===
    getOutcome(result.homeScore, result.awayScore);

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
        ? "Acertou vencedor"
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

  return [...byUser.values()]
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      if (b.outcomeHits !== a.outcomeHits) {
        return b.outcomeHits - a.outcomeHits;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .map((entry, index) => ({
      userId: entry.userId,
      displayName: entry.displayName,
      avatarUrl: entry.avatarUrl,
      totalPoints: entry.totalPoints,
      exactHits: entry.exactHits,
      outcomeHits: entry.outcomeHits,
      position: index + 1,
    }));
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
