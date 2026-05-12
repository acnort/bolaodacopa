"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FlaskConical,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { SandboxToggle } from "@/components/sandbox-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppSnapshot, Match, OfficialResult } from "@/lib/domain/types";
import {
  notifySandboxChanged,
  SANDBOX_SNAPSHOT_KEY,
  setSandboxEnabled,
  useSandboxEnabled,
} from "@/lib/sandbox-storage";

function readSandboxSnapshot() {
  if (typeof window === "undefined") return undefined;

  const raw = window.localStorage.getItem(SANDBOX_SNAPSHOT_KEY);
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as AppSnapshot;
  } catch {
    return undefined;
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomRealisticScore(match: Match) {
  const baseScores = [
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 0],
    [0, 0],
    [3, 1],
    [0, 1],
    [1, 2],
  ];
  const [home = 0, away = 0] =
    baseScores[randomInt(0, baseScores.length - 1)] ?? [1, 0];

  if (match.phaseId !== "phase-groups" && home === away) {
    return Math.random() > 0.5
      ? { homeScore: home + 1, awayScore: away }
      : { homeScore: home, awayScore: away + 1 };
  }

  return { homeScore: home, awayScore: away };
}

function getNoisyPrediction(result?: OfficialResult) {
  if (!result || Math.random() > 0.55) {
    return {
      homeScore: randomInt(0, 3),
      awayScore: randomInt(0, 3),
    };
  }

  return {
    homeScore: Math.max(0, result.homeScore + randomInt(-1, 1)),
    awayScore: Math.max(0, result.awayScore + randomInt(-1, 1)),
  };
}

function simulateResults(snapshot: AppSnapshot): AppSnapshot {
  const publishedAt = new Date().toISOString();
  const results = snapshot.matches.map((match) => ({
    matchId: match.id,
    ...getRandomRealisticScore(match),
    publishedAt,
  }));

  return {
    ...snapshot,
    matches: snapshot.matches.map((match) => ({
      ...match,
      status: "completed" as const,
    })),
    results,
  };
}

function simulatePredictions(snapshot: AppSnapshot): AppSnapshot {
  const now = new Date().toISOString();
  const resultByMatchId = new Map(
    snapshot.results.map((result) => [result.matchId, result]),
  );
  const matchPredictions = snapshot.profiles.flatMap((profile) =>
    snapshot.matches.map((match) => {
      const prediction = getNoisyPrediction(resultByMatchId.get(match.id));

      return {
        id: `sandbox-prediction-${profile.id}-${match.id}`,
        userId: profile.id,
        matchId: match.id,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        createdAt: now,
        updatedAt: now,
      };
    }),
  );
  const teamIds = snapshot.teams.map((team) => team.id);
  const placementPredictions = snapshot.profiles.flatMap((profile) => {
    if (teamIds.length < 3) return [];

    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

    return [
      {
        id: `sandbox-placement-${profile.id}`,
        userId: profile.id,
        competitionId: snapshot.competition.id,
        championTeamId: shuffled[0],
        runnerUpTeamId: shuffled[1],
        thirdPlaceTeamId: shuffled[2],
        updatedAt: now,
      },
    ];
  });

  return {
    ...snapshot,
    matchPredictions,
    placementPredictions,
  };
}

function buildQuickSimulation(snapshot: AppSnapshot) {
  return simulatePredictions(simulateResults(snapshot));
}

export function AdminSandboxPanel({ snapshot }: { snapshot: AppSnapshot }) {
  const sandboxEnabled = useSandboxEnabled();
  const [sandboxSnapshot, setSandboxSnapshot] = useState<AppSnapshot | undefined>(() =>
    readSandboxSnapshot(),
  );
  const summary = useMemo(() => {
    const data = sandboxSnapshot ?? snapshot;

    return {
      users: data.profiles.length,
      matches: data.matches.length,
      results: data.results.length,
      matchPredictions: data.matchPredictions.length,
      placementPredictions: data.placementPredictions.length,
    };
  }, [sandboxSnapshot, snapshot]);

  function persistSandbox(nextSnapshot: AppSnapshot) {
    window.localStorage.setItem(SANDBOX_SNAPSHOT_KEY, JSON.stringify(nextSnapshot));
    setSandboxSnapshot(nextSnapshot);
    setSandboxEnabled(true);
    notifySandboxChanged();
  }

  function createQuickSimulation() {
    persistSandbox(buildQuickSimulation(snapshot));
    toast.success("Sandbox criada com resultados e palpites simulados.");
  }

  function resetSandbox() {
    persistSandbox(snapshot);
    toast.success("Sandbox resetada.");
  }

  function regenerateResults() {
    const baseSnapshot = sandboxSnapshot ?? snapshot;
    persistSandbox(simulateResults(baseSnapshot));
    toast.success("Resultados simulados regenerados.");
  }

  function regeneratePredictions() {
    const baseSnapshot = sandboxSnapshot ?? snapshot;
    persistSandbox(simulatePredictions(baseSnapshot));
    toast.success("Palpites simulados regenerados.");
  }

  function clearSandbox() {
    window.localStorage.removeItem(SANDBOX_SNAPSHOT_KEY);
    setSandboxSnapshot(undefined);
    notifySandboxChanged();
    toast.success("Dados locais da sandbox removidos.");
  }

  function exportSandbox() {
    const data = sandboxSnapshot ?? snapshot;
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bolao-sandbox.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="border-[color:var(--accent-soft)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Sandbox local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">
            A sandbox usa os usuários reais cadastrados, mas mantém resultados e
            palpites simulados apenas neste navegador. Nada aqui altera o banco.
          </p>

          <div className="max-w-xs">
            <SandboxToggle />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button type="button" onClick={createQuickSimulation}>
              <Sparkles className="h-4 w-4" />
              Criar e simular tudo
            </Button>
            <Button type="button" variant="secondary" onClick={resetSandbox}>
              <RotateCcw className="h-4 w-4" />
              Resetar base
            </Button>
            <Button type="button" variant="secondary" onClick={regenerateResults}>
              <RefreshCcw className="h-4 w-4" />
              Gerar resultados
            </Button>
            <Button type="button" variant="secondary" onClick={regeneratePredictions}>
              <RefreshCcw className="h-4 w-4" />
              Gerar palpites
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button type="button" variant="outline" onClick={exportSandbox}>
              <Download className="h-4 w-4" />
              Exportar JSON
            </Button>
            <Button type="button" variant="danger" onClick={clearSandbox}>
              <Trash2 className="h-4 w-4" />
              Limpar sandbox
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-4">
            <div className="text-[color:var(--text-muted)]">Modo</div>
            <div className="mt-1 font-semibold">
              {sandboxEnabled ? "Ativo" : "Inativo"}
            </div>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-4">
            <div className="text-[color:var(--text-muted)]">Usuários</div>
            <div className="mt-1 font-semibold">{summary.users}</div>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-4">
            <div className="text-[color:var(--text-muted)]">Jogos</div>
            <div className="mt-1 font-semibold">{summary.matches}</div>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-4">
            <div className="text-[color:var(--text-muted)]">Resultados</div>
            <div className="mt-1 font-semibold">{summary.results}</div>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-4">
            <div className="text-[color:var(--text-muted)]">Palpites</div>
            <div className="mt-1 font-semibold">
              {summary.matchPredictions + summary.placementPredictions}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
