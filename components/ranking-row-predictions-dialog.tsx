"use client";

import { Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CompletedPredictionView {
  matchId: string;
  phaseId: string;
  phaseName: string;
  homeTeam: string;
  awayTeam: string;
  predictedScore: string;
  officialScore: string;
}

function groupPredictionsByPhase(predictions: CompletedPredictionView[]) {
  const groups = new Map<string, CompletedPredictionView[]>();

  for (const prediction of predictions) {
    const key = prediction.phaseId || prediction.phaseName;
    groups.set(key, [...(groups.get(key) ?? []), prediction]);
  }

  return [...groups.values()].map((items) => ({
    phaseId: items[0]?.phaseId ?? "",
    phaseName: items[0]?.phaseName ?? "Sem fase",
    predictions: items,
  }));
}

export function RankingRowPredictionsDialog({
  displayName,
  predictions,
}: {
  displayName: string;
  predictions: CompletedPredictionView[];
}) {
  const groupedPredictions = groupPredictionsByPhase(predictions);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ver palpites de ${displayName}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver palpites de {displayName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-[min(94vw,56rem)] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>Somente partidas já encerradas.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
          {predictions.length === 0 ? (
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Nenhum palpite encerrado.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedPredictions.map((group) => (
                <section key={group.phaseId || group.phaseName} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                      {group.phaseName}
                    </h3>
                    <Badge variant="neutral" size="small">
                      {group.predictions.length}
                    </Badge>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)]">
                    <Table>
                      <TableHeader className="bg-[color:var(--surface-muted)]">
                        <TableRow>
                          <TableHead className="py-2">Jogo</TableHead>
                          <TableHead className="w-[110px] py-2 text-center">
                            Palpite
                          </TableHead>
                          <TableHead className="w-[110px] py-2 text-center">
                            Oficial
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.predictions.map((prediction) => (
                          <TableRow key={prediction.matchId}>
                            <TableCell className="py-2">
                              <span className="font-medium">
                                {prediction.homeTeam}
                              </span>{" "}
                              <span className="text-[color:var(--text-muted)]">x</span>{" "}
                              <span className="font-medium">
                                {prediction.awayTeam}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-center font-semibold">
                              {prediction.predictedScore}
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge variant="neutral" size="small">
                                {prediction.officialScore}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
