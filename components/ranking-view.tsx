import { RankingRowPredictionsDialog } from "@/components/ranking-row-predictions-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTeamName } from "@/lib/domain/selectors";
import { buildLeaderboard, buildScoreEntries } from "@/lib/domain/scoring";
import { getAppSnapshot } from "@/lib/services/app-service";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getPositionClasses(position: number) {
  if (position === 1) {
    return "bg-[#f5d36b] text-[#5b4300]";
  }
  if (position === 2) {
    return "bg-[#d7dbe2] text-[#434a54]";
  }
  if (position === 3) {
    return "bg-[#d9ad7c] text-[#5a3412]";
  }
  return "bg-[color:var(--surface-muted)] text-[color:var(--text-strong)]";
}

export async function RankingView() {
  const snapshot = await getAppSnapshot();
  const leaderboard = buildLeaderboard(snapshot);
  const latestScores = buildScoreEntries(snapshot).slice(-8).reverse();
  const completedMatchIds = new Set(snapshot.results.map((result) => result.matchId));
console.log(latestScores)
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <div className="text-lg font-bold">Ranking</div>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[color:var(--surface-muted)]">
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-center">Exatos</TableHead>
                    <TableHead className="text-center">Resultados</TableHead>
                    <TableHead className="text-center font-bold">Pontos</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => {
                    const completedPredictions = snapshot.matchPredictions
                      .filter(
                        (prediction) =>
                          prediction.userId === entry.userId &&
                          completedMatchIds.has(prediction.matchId),
                      )
                      .map((prediction) => {
                        const match = snapshot.matches.find(
                          (item) => item.id === prediction.matchId,
                        );
                        const result = snapshot.results.find(
                          (item) => item.matchId === prediction.matchId,
                        );

                        return {
                          matchId: prediction.matchId,
                          homeTeam: getTeamName(snapshot.teams, match?.homeTeamId),
                          awayTeam: getTeamName(snapshot.teams, match?.awayTeamId),
                          predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
                          officialScore: result
                            ? `${result.homeScore} x ${result.awayScore}`
                            : "-",
                        };
                      });

                    return (
                    <TableRow key={entry.userId}>
                      <TableCell>
                        <span
                          className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-semibold ${getPositionClasses(entry.position)}`}
                        >
                          {entry.position}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--surface-subtle)] text-xs font-bold tracking-[0.14em] text-[color:var(--text-strong)]">
                            {getInitials(entry.displayName)}
                          </div>
                          <span>{entry.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{entry.exactHits}</TableCell>
                      <TableCell className="text-center">{entry.outcomeHits}</TableCell>
                      <TableCell className="text-center text-md font-bold">{entry.totalPoints}</TableCell>
                      <TableCell className="text-right">
                        <RankingRowPredictionsDialog
                          displayName={entry.displayName}
                          predictions={completedPredictions}
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-lg font-bold">Últimas pontuações</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestScores.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg bg-[color:var(--surface-muted)] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm text-[color:var(--text-strong)]">
                    {entry.description}
                  </p>
                  <Badge variant={entry.points > 0 ? "success" : "danger"} size="small" className="font-bold">
                    {entry.points} pts
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                  {entry.sourceType === "match" ? "Partida" : "Palpite final"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
