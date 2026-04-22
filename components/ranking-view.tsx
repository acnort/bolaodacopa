import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildLeaderboard, buildScoreEntries } from "@/lib/domain/scoring";
import { getAppSnapshot } from "@/lib/services/app-service";

export async function RankingView() {
  const snapshot = await getAppSnapshot();
  const leaderboard = buildLeaderboard(snapshot);
  const latestScores = buildScoreEntries(snapshot).slice(-8).reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[color:var(--surface-muted)]">
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Exatos</TableHead>
                    <TableHead>Resultados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow key={entry.userId}>
                      <TableCell>#{entry.position}</TableCell>
                      <TableCell className="font-semibold">{entry.displayName}</TableCell>
                      <TableCell>{entry.totalPoints}</TableCell>
                      <TableCell>{entry.exactHits}</TableCell>
                      <TableCell>{entry.outcomeHits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
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
                  {entry.sourceType === "match" ? "Partida" : "Pódio final"} · fase {entry.phaseId}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
