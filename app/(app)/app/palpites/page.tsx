import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchPredictionForm } from "@/components/forms/match-prediction-form";
import { PlacementPredictionForm } from "@/components/forms/placement-prediction-form";
import { getMatchPrediction, getTeamName } from "@/lib/domain/selectors";
import { getPhaseRuleForMatch, isRuleOpen } from "@/lib/domain/scoring";
import { formatDateTime } from "@/lib/formatters";
import { getAppSnapshot, getCurrentUserId } from "@/lib/services/app-service";

export default async function PredictionsPage() {
  const snapshot = await getAppSnapshot();
  const currentUserId = await getCurrentUserId();
  const podiumRule = snapshot.rules.find((item) => item.enablePlacementPredictions);
  const podiumPrediction = snapshot.placementPredictions.find(
    (item) =>
      item.userId === currentUserId &&
      item.competitionId === snapshot.competition.id,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {podiumRule ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pódio</CardTitle>
          </CardHeader>
          <CardContent>
            <PlacementPredictionForm
              userId={currentUserId}
              competitionId={snapshot.competition.id}
              teams={snapshot.teams}
              defaults={podiumPrediction}
              disabled={!isRuleOpen(podiumRule)}
            />
          </CardContent>
        </Card>
      ) : null}

      {snapshot.matches.map((match) => {
        const rule = getPhaseRuleForMatch(match, snapshot.rules);
        const result = snapshot.results.find((item) => item.matchId === match.id);
        const prediction = getMatchPrediction(
          snapshot.matchPredictions,
          currentUserId,
          match.id,
        );
        const locked = !rule?.enableMatchPredictions || !rule || !isRuleOpen(rule);

        return (
          <Card key={match.id}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  {getTeamName(snapshot.teams, match.homeTeamId)} x{" "}
                  {getTeamName(snapshot.teams, match.awayTeamId)}
                </CardTitle>
                {result ? (
                  <div className="rounded-md bg-[color:var(--surface-muted)] px-3 py-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    {result.homeScore} x {result.awayScore}
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-[color:var(--text-muted)]">
                {match.roundLabel} · {formatDateTime(match.kickoffAt)}
              </div>
            </CardHeader>
            <CardContent>
              <MatchPredictionForm
                userId={currentUserId}
                matchId={match.id}
                defaultHomeScore={prediction?.homeScore}
                defaultAwayScore={prediction?.awayScore}
                disabled={locked || match.status === "completed"}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
