"use client";

import { Eye } from "lucide-react";

import { TeamFlag } from "@/components/team-flag";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatchPredictionView {
  matchId: string;
  phaseId: string;
  phaseName: string;
  phaseOrder: number;
  groupName?: string;
  kickoffAt: string;
  homeTeam: string;
  homeTeamCode?: string;
  awayTeam: string;
  awayTeamCode?: string;
  predictedScore: string;
  officialScore: string;
}

interface PlacementPredictionView {
  champion?: TeamPredictionView;
  runnerUp?: TeamPredictionView;
  thirdPlace?: TeamPredictionView;
  officialChampion?: TeamPredictionView;
  officialRunnerUp?: TeamPredictionView;
  officialThirdPlace?: TeamPredictionView;
}

interface TeamPredictionView {
  name: string;
  code?: string;
}

interface PhasePredictionGroup {
  phaseId: string;
  phaseName: string;
  phaseOrder: number;
  predictions: MatchPredictionView[];
}

interface PredictionTab {
  id: string;
  label: string;
  count: number;
  type: "placement" | "matches";
  predictions?: MatchPredictionView[];
}

function sortByKickoff(left: MatchPredictionView, right: MatchPredictionView) {
  const leftTime = new Date(left.kickoffAt).getTime();
  const rightTime = new Date(right.kickoffAt).getTime();

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return left.matchId.localeCompare(right.matchId);
}

function groupPredictionsByPhase(predictions: MatchPredictionView[]) {
  const sortedPredictions = [...predictions].sort((left, right) => {
    if (left.phaseOrder !== right.phaseOrder) {
      return left.phaseOrder - right.phaseOrder;
    }

    return sortByKickoff(left, right);
  });
  const groups = new Map<string, MatchPredictionView[]>();

  for (const prediction of sortedPredictions) {
    const key = prediction.phaseId || prediction.phaseName;
    groups.set(key, [...(groups.get(key) ?? []), prediction]);
  }

  return [...groups.values()].map((items) => ({
    phaseId: items[0]?.phaseId ?? "",
    phaseName: items[0]?.phaseName ?? "Sem fase",
    phaseOrder: items[0]?.phaseOrder ?? Number.MAX_SAFE_INTEGER,
    predictions: items,
  }));
}

function getPredictionTabs({
  groupedPredictions,
  placementPrediction,
}: {
  groupedPredictions: PhasePredictionGroup[];
  placementPrediction?: PlacementPredictionView;
}) {
  const tabs: PredictionTab[] = [];

  if (placementPrediction) {
    tabs.push({
      id: "phase-podium",
      label: "Pódio final",
      count: 3,
      type: "placement",
    });
  }

  for (const group of groupedPredictions) {
    tabs.push({
      id: group.phaseId || group.phaseName,
      label: group.phaseName,
      count: group.predictions.length,
      type: "matches",
      predictions: group.predictions,
    });
  }

  return tabs;
}

function getDefaultTabId(tabs: PredictionTab[], currentPhaseId?: string) {
  if (currentPhaseId && tabs.some((tab) => tab.id === currentPhaseId)) {
    return currentPhaseId;
  }

  return tabs[tabs.length - 1]?.id ?? "";
}

function groupPredictionsBySection(
  phaseId: string,
  predictions: MatchPredictionView[],
) {
  if (phaseId !== "phase-groups") {
    return [
      {
        id: "matches",
        label: "",
        predictions,
      },
    ];
  }

  const groups = new Map<string, MatchPredictionView[]>();

  for (const prediction of predictions) {
    const key = prediction.groupName ?? "Grupo";
    groups.set(key, [...(groups.get(key) ?? []), prediction]);
  }

  return [...groups.entries()].map(([label, items]) => ({
    id: label,
    label,
    predictions: items,
  }));
}

function TeamName({ team }: { team?: TeamPredictionView }) {
  if (!team) {
    return (
      <span className="text-[color:var(--text-muted)]">Não informado</span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2 font-medium">
      <TeamFlag code={team.code} className="h-4 w-4 shrink-0 rounded-full" />
      <span className="truncate">{team.name}</span>
    </span>
  );
}

function OfficialTeamName({ team }: { team?: TeamPredictionView }) {
  if (!team) {
    return (
      <span className="text-xs text-[color:var(--text-muted)]">Pendente</span>
    );
  }

  return <TeamName team={team} />;
}

function MatchPredictionTable({
  predictions,
}: {
  predictions: MatchPredictionView[];
}) {
  return (
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
          {predictions.map((prediction) => (
            <TableRow key={prediction.matchId}>
              <TableCell className="py-2">
                <div className="grid min-w-0 gap-1 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-2">
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium">
                    <TeamFlag
                      code={prediction.homeTeamCode}
                      className="h-4 w-4 shrink-0 rounded-full"
                    />
                    <span className="truncate">{prediction.homeTeam}</span>
                  </span>
                  <span className="hidden text-[color:var(--text-muted)] sm:inline">
                    x
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium sm:justify-end">
                    <span className="truncate sm:text-right">
                      {prediction.awayTeam}
                    </span>
                    <TeamFlag
                      code={prediction.awayTeamCode}
                      className="h-4 w-4 shrink-0 rounded-full"
                    />
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-center font-semibold">
                {prediction.predictedScore}
              </TableCell>
              <TableCell className="py-2 text-center">
                {prediction.officialScore === "-" ? (
                  <span className="text-xs text-[color:var(--text-muted)]">
                    Pendente
                  </span>
                ) : (
                  <Badge variant="neutral" size="small">
                    {prediction.officialScore}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PlacementPredictionBlock({
  placementPrediction,
}: {
  placementPrediction: PlacementPredictionView;
}) {
  const rows = [
    {
      label: "Campeão",
      predicted: placementPrediction.champion,
      official: placementPrediction.officialChampion,
    },
    {
      label: "Vice",
      predicted: placementPrediction.runnerUp,
      official: placementPrediction.officialRunnerUp,
    },
    {
      label: "Terceiro",
      predicted: placementPrediction.thirdPlace,
      official: placementPrediction.officialThirdPlace,
    },
  ];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold tracking-[0.16em] text-[color:var(--text-muted)] uppercase">
          Pódio final
        </h3>
        <Badge variant="neutral" size="small">
          3
        </Badge>
      </div>
      <div className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)]">
        <Table>
          <TableHeader className="bg-[color:var(--surface-muted)]">
            <TableRow>
              <TableHead className="w-[120px] py-2">Posição</TableHead>
              <TableHead className="py-2">Palpite</TableHead>
              <TableHead className="py-2">Oficial</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="py-2 font-semibold">
                  {row.label}
                </TableCell>
                <TableCell className="py-2">
                  <TeamName team={row.predicted} />
                </TableCell>
                <TableCell className="py-2">
                  <OfficialTeamName team={row.official} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function RankingRowPredictionsDialog({
  displayName,
  matchPredictions,
  placementPrediction,
  currentPhaseId,
}: {
  displayName: string;
  matchPredictions: MatchPredictionView[];
  placementPrediction?: PlacementPredictionView;
  currentPhaseId?: string;
}) {
  const groupedPredictions = groupPredictionsByPhase(matchPredictions);
  const predictionTabs = getPredictionTabs({
    groupedPredictions,
    placementPrediction,
  });
  const defaultTabId = getDefaultTabId(predictionTabs, currentPhaseId);
  const hasReleasedContent =
    Boolean(placementPrediction) || matchPredictions.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver palpites de ${displayName}`}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver palpites de {displayName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-[min(94vw,56rem)] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>
            Palpites liberados após o fechamento da janela da fase.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
          {!hasReleasedContent ? (
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Nenhum palpite liberado.
            </div>
          ) : (
            <Tabs defaultValue={defaultTabId}>
              <div className="overflow-x-auto pb-1">
                <TabsList className="h-auto min-w-max">
                  {predictionTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="h-9 gap-2 px-3 text-xs"
                    >
                      {tab.label}
                      <Badge variant="neutral" size="small">
                        {tab.count}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {predictionTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.type === "placement" && placementPrediction ? (
                    <PlacementPredictionBlock
                      placementPrediction={placementPrediction}
                    />
                  ) : null}

                  {tab.type === "matches" && tab.predictions ? (
                    <section className="space-y-4">
                      {groupPredictionsBySection(
                        tab.id,
                        tab.predictions,
                      ).map((section) => (
                        <div key={section.id} className="space-y-2">
                          {section.label ? (
                            <div className="text-xs font-bold tracking-[0.16em] text-[color:var(--text-muted)] uppercase">
                              {section.label}
                            </div>
                          ) : null}
                          <MatchPredictionTable
                            predictions={section.predictions}
                          />
                        </div>
                      ))}
                    </section>
                  ) : null}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
