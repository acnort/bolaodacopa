"use client";

import { useActionState, useEffect } from "react";
import { Bot, Save } from "lucide-react";
import { toast } from "sonner";

import { saveFakeMemberPredictions } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import type { ActionResult, Phase, Team } from "@/lib/domain/types";

interface FakeMemberPredictionResult {
  userId: string;
  updatedCount: number;
  placementSaved: boolean;
  reversedCount: number;
  ignoredClassifications: number;
}

const initialState: ActionResult<FakeMemberPredictionResult> = {
  ok: false,
  message: "",
};

const DEFAULT_CODEX_GROUP_STAGE = `Grupo A

México 2 x 0 África do Sul
Coreia do Sul 1 x 1 Tchéquia
Tchéquia 2 x 1 África do Sul
México 1 x 1 Coreia do Sul
África do Sul 0 x 2 Coreia do Sul
Tchéquia 0 x 1 México
Classificação: México, Coreia do Sul, Tchéquia, África do Sul

Grupo B

Canadá 1 x 1 Bósnia e Herzegovina
Suíça 2 x 0 Catar
Suíça 1 x 0 Bósnia e Herzegovina
Canadá 2 x 1 Catar
Suíça 1 x 1 Canadá
Bósnia e Herzegovina 2 x 0 Catar
Classificação: Suíça, Canadá, Bósnia e Herzegovina, Catar

Grupo C

Brasil 2 x 1 Marrocos
Haiti 0 x 2 Escócia
Escócia 1 x 1 Marrocos
Brasil 4 x 0 Haiti
Marrocos 2 x 0 Haiti
Escócia 0 x 2 Brasil
Classificação: Brasil, Marrocos, Escócia, Haiti

Grupo D

Estados Unidos 2 x 1 Paraguai
Austrália 1 x 2 Turquia
Estados Unidos 2 x 0 Austrália
Turquia 1 x 1 Paraguai
Turquia 1 x 1 Estados Unidos
Paraguai 1 x 1 Austrália
Classificação: Estados Unidos, Turquia, Paraguai, Austrália

Grupo E

Alemanha 4 x 0 Curaçao
Costa do Marfim 1 x 1 Equador
Alemanha 2 x 1 Costa do Marfim
Equador 3 x 0 Curaçao
Curaçao 0 x 2 Costa do Marfim
Equador 1 x 2 Alemanha
Classificação: Alemanha, Equador, Costa do Marfim, Curaçao

Grupo F

Holanda 2 x 1 Japão
Suécia 1 x 0 Tunísia
Holanda 1 x 1 Suécia
Tunísia 1 x 1 Japão
Tunísia 0 x 2 Holanda
Japão 1 x 1 Suécia
Classificação: Holanda, Suécia, Japão, Tunísia

Grupo G

Bélgica 2 x 1 Egito
Irã 1 x 0 Nova Zelândia
Bélgica 1 x 0 Irã
Nova Zelândia 0 x 2 Egito
Nova Zelândia 0 x 3 Bélgica
Egito 1 x 1 Irã
Classificação: Bélgica, Egito, Irã, Nova Zelândia

Grupo H

Espanha 3 x 0 Cabo Verde
Arábia Saudita 0 x 2 Uruguai
Espanha 2 x 0 Arábia Saudita
Uruguai 2 x 0 Cabo Verde
Cabo Verde 1 x 1 Arábia Saudita
Uruguai 1 x 1 Espanha
Classificação: Espanha, Uruguai, Cabo Verde, Arábia Saudita

Grupo I

França 2 x 1 Senegal
Iraque 0 x 2 Noruega
França 3 x 0 Iraque
Noruega 1 x 2 Senegal
Noruega 1 x 2 França
Senegal 2 x 0 Iraque
Classificação: França, Senegal, Noruega, Iraque

Grupo J

Argentina 2 x 0 Argélia
Áustria 2 x 0 Jordânia
Argentina 2 x 1 Áustria
Jordânia 0 x 1 Argélia
Argélia 1 x 1 Áustria
Jordânia 0 x 3 Argentina
Classificação: Argentina, Áustria, Argélia, Jordânia

Grupo K

Portugal 3 x 0 RD Congo
Uzbequistão 1 x 2 Colômbia
Portugal 2 x 0 Uzbequistão
Colômbia 2 x 1 RD Congo
Colômbia 1 x 1 Portugal
RD Congo 1 x 1 Uzbequistão
Classificação: Portugal, Colômbia, Uzbequistão, RD Congo

Grupo L

Inglaterra 1 x 1 Croácia
Gana 2 x 1 Panamá
Inglaterra 2 x 0 Gana
Panamá 0 x 2 Croácia
Panamá 0 x 3 Inglaterra
Croácia 1 x 1 Gana
Classificação: Inglaterra, Croácia, Gana, Panamá`;

export function AdminFakePredictionsManager({
  competitionId,
  phases,
  teams,
}: {
  competitionId: string;
  phases: Pick<Phase, "id" | "name" | "slug" | "order">[];
  teams: Pick<Team, "id" | "name" | "group">[];
}) {
  const [state, formAction] = useActionState(
    saveFakeMemberPredictions,
    initialState,
  );
  const defaultPhase =
    phases.find((phase) => phase.slug === "fase-de-grupos") ?? phases[0];
  const teamOptions = [...teams]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((team) => ({
      value: team.id,
      label: `${team.name}${team.group ? ` · Grupo ${team.group}` : ""}`,
      keywords: [team.name, team.group ?? ""],
    }));

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--accent-muted)] text-[color:var(--accent-strong)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Usuário fake</CardTitle>
              <CardDescription>
                Salve palpites de uma IA ou simulação no ranking, sem tratar
                como participante real.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="competitionId" value={competitionId} />

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_220px]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--text-strong)]">
                  Nome
                </label>
                <Input name="fullName" defaultValue="Codex" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--text-strong)]">
                  Email fake
                </label>
                <Input
                  name="email"
                  type="email"
                  defaultValue="codex@fake.bolao.local"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--text-strong)]">
                  Fase
                </label>
                <select
                  name="phaseId"
                  defaultValue={defaultPhase?.id}
                  className="h-11 w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-3 text-sm text-[color:var(--text-strong)] transition outline-none focus:border-[color:var(--border-strong)]"
                  required
                >
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--text-strong)]">
                Palpites
              </label>
              <textarea
                name="predictions"
                defaultValue={DEFAULT_CODEX_GROUP_STAGE}
                className="min-h-[520px] w-full resize-y rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-3 py-3 font-mono text-sm leading-6 text-[color:var(--text-strong)] transition outline-none focus:border-[color:var(--border-strong)]"
                spellCheck={false}
                required
              />
            </div>

            <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]/50 p-4">
              <div className="mb-4">
                <div className="text-sm font-semibold text-[color:var(--text-strong)]">
                  Pódio final
                </div>
                <p className="text-sm text-[color:var(--text-muted)]">
                  Opcional. Preencha os três campos para salvar o pódio do
                  usuário fake.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["championTeamId", "Campeão"],
                  ["runnerUpTeamId", "Vice"],
                  ["thirdPlaceTeamId", "Terceiro"],
                ].map(([name, label]) => (
                  <div key={name} className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--text-strong)]">
                      {label}
                    </label>
                    <CustomSelect
                      name={name}
                      defaultValue=""
                      options={teamOptions}
                      placeholder="Selecionar"
                      searchPlaceholder="Buscar país"
                      emptyMessage="Nenhum país encontrado."
                      listLabel="Países"
                      align={name === "thirdPlaceTeamId" ? "end" : "start"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <FormFeedback state={state} />

            {state.ok && state.data ? (
              <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
                {state.data.updatedCount} palpites salvos.{" "}
                {state.data.placementSaved ? "Pódio final salvo. " : ""}
                {state.data.reversedCount} confrontos estavam invertidos no
                banco e foram ajustados. {state.data.ignoredClassifications}{" "}
                linhas de classificação foram ignoradas.
              </div>
            ) : null}

            <SubmitButton pendingLabel="Salvando usuário fake...">
              <Save className="h-4 w-4" />
              Salvar usuário fake
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
