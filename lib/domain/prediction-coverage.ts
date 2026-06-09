import {
  getPhaseMatches,
  getSortedPhases,
  getTeamOrPlaceholder,
} from "@/lib/domain/selectors";
import type { AppSnapshot } from "@/lib/domain/types";

export type AdminPredictionCoverageMatch = {
  id: string;
  label: string;
  roundLabel: string;
  kickoffAt?: string;
  venue?: string;
};

type CoverageCountLabel = "jogo" | "posição";

export type AdminPredictionCoveragePhase = {
  id: string;
  name: string;
  totalMatches: number;
  countLabel: CoverageCountLabel;
};

export type AdminPredictionCoverageCell = {
  phaseId: string;
  phaseName: string;
  savedCount: number;
  totalCount: number;
  countLabel: CoverageCountLabel;
  missingMatches: AdminPredictionCoverageMatch[];
};

export type AdminPredictionCoverageMember = {
  userId: string;
  fullName: string;
  email: string;
  phases: AdminPredictionCoverageCell[];
};

export type AdminPredictionCoverageData = {
  phases: AdminPredictionCoveragePhase[];
  members: AdminPredictionCoverageMember[];
  summary: {
    memberCount: number;
    phaseCount: number;
    totalMissingPredictions: number;
  };
};

const placementSlots = [
  { id: "championTeamId", label: "Campeão" },
  { id: "runnerUpTeamId", label: "Vice-campeão" },
  { id: "thirdPlaceTeamId", label: "Terceiro lugar" },
] as const;

export function buildAdminPredictionCoverage(
  snapshot: AppSnapshot,
): AdminPredictionCoverageData {
  const phaseGroups = getSortedPhases(snapshot.phases)
    .map((phase) => ({
      phase,
      matches: getPhaseMatches(snapshot.matches, phase.id),
    }))
    .filter(({ phase, matches }) => phase.id === "phase-podium" || matches.length > 0);
  const approvedUserIds = new Set(
    snapshot.memberships
      .filter(
        (membership) =>
          membership.competitionId === snapshot.competition.id,
      )
      .map((membership) => membership.userId),
  );
  const members = snapshot.profiles
    .filter((profile) => approvedUserIds.has(profile.id))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));
  const predictionsByUser = new Map<string, Set<string>>();

  for (const prediction of snapshot.matchPredictions) {
    const userPredictions =
      predictionsByUser.get(prediction.userId) ?? new Set<string>();

    userPredictions.add(prediction.matchId);
    predictionsByUser.set(prediction.userId, userPredictions);
  }
  const placementPredictionsByUser = new Map(
    snapshot.placementPredictions
      .filter(
        (prediction) =>
          prediction.competitionId === snapshot.competition.id,
      )
      .map((prediction) => [prediction.userId, prediction]),
  );

  const coverageMembers = members.map((member) => {
    const userPredictions = predictionsByUser.get(member.id) ?? new Set<string>();
    const phases = phaseGroups.map(({ phase, matches }) => {
      if (phase.id === "phase-podium") {
        const placementPrediction = placementPredictionsByUser.get(member.id);
        const missingMatches = placementSlots
          .filter((slot) => !placementPrediction?.[slot.id])
          .map((slot) => ({
            id: slot.id,
            label: slot.label,
            roundLabel: "Pódio final",
          }));

        return {
          phaseId: phase.id,
          phaseName: phase.name,
          savedCount: placementSlots.length - missingMatches.length,
          totalCount: placementSlots.length,
          countLabel: "posição" as const,
          missingMatches,
        };
      }

      const missingMatches = matches
        .filter((match) => !userPredictions.has(match.id))
        .map((match) => {
          const home = getTeamOrPlaceholder(
            snapshot.teams,
            match.homeTeamId,
            match.homePlaceholder,
          );
          const away = getTeamOrPlaceholder(
            snapshot.teams,
            match.awayTeamId,
            match.awayPlaceholder,
          );

          return {
            id: match.id,
            label: `${home} x ${away}`,
            roundLabel: match.roundLabel,
            kickoffAt: match.kickoffAt,
            venue: match.venue,
          };
        });

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        savedCount: matches.length - missingMatches.length,
        totalCount: matches.length,
        countLabel: "jogo" as const,
        missingMatches,
      };
    });

    return {
      userId: member.id,
      fullName: member.fullName,
      email: member.email,
      phases,
    };
  });

  return {
    phases: phaseGroups.map(({ phase, matches }) => ({
      id: phase.id,
      name: phase.name,
      totalMatches: phase.id === "phase-podium" ? placementSlots.length : matches.length,
      countLabel: phase.id === "phase-podium" ? "posição" : "jogo",
    })),
    members: coverageMembers,
    summary: {
      memberCount: coverageMembers.length,
      phaseCount: phaseGroups.length,
      totalMissingPredictions: coverageMembers.reduce(
        (total, member) =>
          total +
          member.phases.reduce(
            (phaseTotal, phase) => phaseTotal + phase.missingMatches.length,
            0,
          ),
        0,
      ),
    },
  };
}
