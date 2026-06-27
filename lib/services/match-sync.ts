import type {
  AppSnapshot,
  Match,
  OfficialResult,
  SyncedMatchInput,
} from "@/lib/domain/types";

function normalizeRoundLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function getMatchTime(match: Match) {
  return new Date(match.kickoffAt).getTime();
}

function getResultMatchIds(results: OfficialResult[]) {
  return new Set(results.map((result) => result.matchId));
}

function isPhaseComplete(snapshot: AppSnapshot, phaseId: string) {
  const phaseMatches = snapshot.matches.filter(
    (match) => match.phaseId === phaseId,
  );
  if (phaseMatches.length === 0) return false;

  const resultMatchIds = getResultMatchIds(snapshot.results);
  return phaseMatches.every(
    (match) => match.status === "completed" && resultMatchIds.has(match.id),
  );
}

function getPreviousMatchPhaseId(snapshot: AppSnapshot, phaseId: string) {
  const matchPhaseIds = new Set(snapshot.matches.map((match) => match.phaseId));
  const phases = [...snapshot.phases]
    .filter((phase) => matchPhaseIds.has(phase.id))
    .sort((left, right) => left.order - right.order);
  const phaseIndex = phases.findIndex((phase) => phase.id === phaseId);

  return phaseIndex > 0 ? phases[phaseIndex - 1]?.id : undefined;
}

function findAvailableSlotMatch(
  externalMatch: Match,
  snapshot: AppSnapshot,
  usedMatchIds: Set<string>,
  referenceOpenPhaseSlots: boolean,
) {
  const previousPhaseId = getPreviousMatchPhaseId(
    snapshot,
    externalMatch.phaseId,
  );
  const previousPhaseComplete = previousPhaseId
    ? isPhaseComplete(snapshot, previousPhaseId)
    : false;

  if (
    !previousPhaseId ||
    (!previousPhaseComplete && !referenceOpenPhaseSlots)
  ) {
    return undefined;
  }

  const externalRoundLabel = normalizeRoundLabel(externalMatch.roundLabel);
  const candidates = snapshot.matches.filter(
    (match) =>
      !usedMatchIds.has(match.id) &&
      match.phaseId === externalMatch.phaseId &&
      !match.externalMatchId &&
      !match.homeTeamId &&
      !match.awayTeamId &&
      normalizeRoundLabel(match.roundLabel) === externalRoundLabel,
  );

  return candidates.sort(
    (left, right) =>
      Math.abs(getMatchTime(left) - getMatchTime(externalMatch)) -
      Math.abs(getMatchTime(right) - getMatchTime(externalMatch)),
  )[0];
}

function findMatchingInternalMatch(
  externalMatch: Match,
  snapshot: AppSnapshot,
  usedMatchIds: Set<string>,
  validTeamIds: Set<string>,
  referenceOpenPhaseSlots: boolean,
) {
  const externalMatchId = externalMatch.externalMatchId ?? externalMatch.id;
  const byExternalId = snapshot.matches.find(
    (match) =>
      !usedMatchIds.has(match.id) &&
      (match.externalMatchId === externalMatchId ||
        match.id === externalMatchId),
  );

  if (byExternalId) return byExternalId;

  if (externalMatch.homeTeamId && externalMatch.awayTeamId) {
    const byTeams = snapshot.matches.find(
      (match) =>
        !usedMatchIds.has(match.id) &&
        match.phaseId === externalMatch.phaseId &&
        ((match.homeTeamId === externalMatch.homeTeamId &&
          match.awayTeamId === externalMatch.awayTeamId) ||
          (match.homeTeamId === externalMatch.awayTeamId &&
            match.awayTeamId === externalMatch.homeTeamId)),
    );

    if (byTeams) return byTeams;
  }

  return findAvailableSlotMatch(
    externalMatch,
    snapshot,
    usedMatchIds,
    referenceOpenPhaseSlots,
  );
}

function canSyncTeamsToMatch(
  internalMatch: Match,
  externalMatch: Match,
  snapshot: AppSnapshot,
) {
  const previousPhaseId = getPreviousMatchPhaseId(
    snapshot,
    externalMatch.phaseId,
  );
  if (!previousPhaseId) return true;
  if (isPhaseComplete(snapshot, previousPhaseId)) return true;

  return Boolean(internalMatch.homeTeamId && internalMatch.awayTeamId);
}

export function buildSyncedMatchInputs({
  snapshot,
  providerMatches,
  providerResults,
  referenceOpenPhaseSlots = false,
}: {
  snapshot: AppSnapshot;
  providerMatches: Match[];
  providerResults: OfficialResult[];
  referenceOpenPhaseSlots?: boolean;
}) {
  const validTeamIds = new Set(snapshot.teams.map((team) => team.id));
  const resultsByExternalId = new Map(
    providerResults.map((result) => [result.matchId, result]),
  );
  const usedMatchIds = new Set<string>();
  const syncedInputs: SyncedMatchInput[] = [];
  let unmatchedMatches = 0;

  for (const externalMatch of providerMatches) {
    const internalMatch = findMatchingInternalMatch(
      externalMatch,
      snapshot,
      usedMatchIds,
      validTeamIds,
      referenceOpenPhaseSlots,
    );
    const externalMatchId = externalMatch.externalMatchId ?? externalMatch.id;

    if (!internalMatch) {
      unmatchedMatches += 1;
      continue;
    }

    usedMatchIds.add(internalMatch.id);
    const result = resultsByExternalId.get(externalMatchId);
    const syncTeams = canSyncTeamsToMatch(
      internalMatch,
      externalMatch,
      snapshot,
    );

    syncedInputs.push({
      matchId: internalMatch.id,
      externalMatchId,
      kickoffAt: externalMatch.kickoffAt,
      homeTeamId:
        syncTeams &&
        externalMatch.homeTeamId &&
        validTeamIds.has(externalMatch.homeTeamId)
          ? externalMatch.homeTeamId
          : undefined,
      awayTeamId:
        syncTeams &&
        externalMatch.awayTeamId &&
        validTeamIds.has(externalMatch.awayTeamId)
          ? externalMatch.awayTeamId
          : undefined,
      status: externalMatch.status,
      homeScore: result?.homeScore,
      awayScore: result?.awayScore,
    });
  }

  return { syncedInputs, unmatchedMatches };
}
