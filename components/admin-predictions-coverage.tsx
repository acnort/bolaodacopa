"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminPredictionCoverageCell,
  AdminPredictionCoverageData,
} from "@/lib/domain/prediction-coverage";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SelectedCell = AdminPredictionCoverageCell & {
  memberName: string;
};

function formatMatchCount(count: number) {
  return `${count} jogo${count === 1 ? "" : "s"}`;
}

function getCellStatus(cell: AdminPredictionCoverageCell) {
  if (cell.savedCount === cell.totalCount) {
    return {
      label: "Completo",
      variant: "success" as const,
      className:
        "border-[color:var(--success-soft)] bg-[color:var(--success-soft)]/20",
    };
  }

  if (cell.savedCount > 0) {
    return {
      label: "Parcial",
      variant: "warning" as const,
      className:
        "border-[color:var(--border-strong)] bg-[color:var(--surface-muted)]",
    };
  }

  return {
    label: "Vazio",
    variant: "neutral" as const,
    className:
      "border-[color:var(--border-subtle)] bg-transparent hover:bg-[color:var(--surface-muted)]",
  };
}

export function AdminPredictionsCoverage({
  data,
}: {
  data: AdminPredictionCoverageData;
}) {
  const [query, setQuery] = useState("");
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return data.members;

    return data.members.filter((member) =>
      `${member.fullName} ${member.email}`.toLowerCase().includes(normalizedQuery),
    );
  }, [data.members, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-4">
          <div className="text-2xl font-semibold text-[color:var(--text-strong)]">
            {data.summary.memberCount}
          </div>
          <div className="text-sm text-[color:var(--text-muted)]">
            membros aprovados
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-4">
          <div className="text-2xl font-semibold text-[color:var(--text-strong)]">
            {data.summary.phaseCount}
          </div>
          <div className="text-sm text-[color:var(--text-muted)]">
            fases com jogos
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-4">
          <div className="text-2xl font-semibold text-[color:var(--text-strong)]">
            {data.summary.totalMissingPredictions}
          </div>
          <div className="text-sm text-[color:var(--text-muted)]">
            palpites pendentes
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Palpites por membro e fase</CardTitle>
            <CardDescription>
              Acompanhe somente a cobertura dos palpites, sem mostrar placares.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar membro"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 min-w-[240px] bg-[color:var(--surface-base)]">
                  Membro
                </TableHead>
                {data.phases.map((phase) => (
                  <TableHead key={phase.id} className="min-w-[132px]">
                    <div>{phase.name}</div>
                    <div className="mt-1 text-[10px] normal-case tracking-normal">
                      {formatMatchCount(phase.totalMatches)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="sticky left-0 z-10 bg-[color:var(--surface-base)]">
                    <div className="font-semibold">{member.fullName}</div>
                    <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                      {member.email}
                    </div>
                  </TableCell>
                  {member.phases.map((phase) => {
                    const status = getCellStatus(phase);

                    return (
                      <TableCell key={phase.phaseId}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCell({
                              ...phase,
                              memberName: member.fullName,
                            })
                          }
                          className={cn(
                            "w-full rounded-lg border px-3 py-2 text-left transition",
                            status.className,
                          )}
                          aria-label={`Ver pendências de ${member.fullName} em ${phase.phaseName}`}
                        >
                          <div className="font-semibold">
                            {phase.savedCount}/{phase.totalCount}
                          </div>
                          <div className="mt-1">
                            <Badge variant={status.variant} size="small">
                              {status.label}
                            </Badge>
                          </div>
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={data.phases.length + 1}
                    className="py-8 text-center text-sm text-[color:var(--text-muted)]"
                  >
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedCell)}
        onOpenChange={(open) => {
          if (!open) setSelectedCell(null);
        }}
      >
        <DialogContent className="max-h-[82vh] w-[min(92vw,46rem)] overflow-hidden">
          {selectedCell ? (
            <div className="flex max-h-[calc(82vh-3rem)] flex-col gap-5">
              <DialogHeader>
                <DialogTitle>Jogos faltantes</DialogTitle>
                <DialogDescription>
                  {selectedCell.memberName} em {selectedCell.phaseName}:{" "}
                  {selectedCell.savedCount}/{selectedCell.totalCount} palpites.
                </DialogDescription>
              </DialogHeader>

              {selectedCell.missingMatches.length > 0 ? (
                <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                  {selectedCell.missingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg border border-[color:var(--border-subtle)] p-4"
                    >
                      <div className="font-semibold text-[color:var(--text-strong)]">
                        {match.label}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                        {match.roundLabel} · {match.venue}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                        {formatDateTime(match.kickoffAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--text-muted)]">
                  Nenhum jogo pendente nessa fase.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
