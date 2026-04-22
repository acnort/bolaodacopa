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

interface CompletedPredictionView {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictedScore: string;
  officialScore: string;
}

export function RankingRowPredictionsDialog({
  displayName,
  predictions,
}: {
  displayName: string;
  predictions: CompletedPredictionView[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ver palpites de ${displayName}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver palpites de {displayName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,40rem)]">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>Somente partidas já encerradas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {predictions.length === 0 ? (
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Nenhum palpite encerrado.
            </div>
          ) : (
            predictions.map((prediction) => (
              <div
                key={prediction.matchId}
                className="rounded-lg border border-[color:var(--border-subtle)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-[color:var(--text-strong)]">
                      {prediction.homeTeam} x {prediction.awayTeam}
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--text-muted)]">
                      Palpite: {prediction.predictedScore}
                    </div>
                  </div>
                  <Badge variant="neutral" size="medium">
                    {prediction.officialScore}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
