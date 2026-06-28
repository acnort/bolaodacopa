import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RankingRowPredictionsDialog } from "@/components/ranking-row-predictions-dialog";

const basePrediction = {
  matchId: "match-1",
  phaseId: "phase-groups",
  phaseName: "Fase de grupos",
  phaseOrder: 1,
  kickoffAt: "2026-06-11T19:00:00.000Z",
  homeTeam: "Brasil",
  awayTeam: "Alemanha",
  predictedScore: "2 x 1",
  officialScore: "1 x 0",
};

describe("RankingRowPredictionsDialog", () => {
  it("opens the current phase tab when it is available", async () => {
    const user = userEvent.setup();

    render(
      <RankingRowPredictionsDialog
        displayName="Ana"
        currentPhaseId="phase-round-32"
        matchPredictions={[
          basePrediction,
          {
            ...basePrediction,
            matchId: "match-2",
            phaseId: "phase-round-32",
            phaseName: "16-avos",
            phaseOrder: 2,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ver palpites/i }));

    expect(screen.getByRole("tab", { name: /16-avos/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("falls back to the latest released phase when current is unavailable", async () => {
    const user = userEvent.setup();

    render(
      <RankingRowPredictionsDialog
        displayName="Ana"
        currentPhaseId="phase-round-16"
        matchPredictions={[
          basePrediction,
          {
            ...basePrediction,
            matchId: "match-2",
            phaseId: "phase-round-32",
            phaseName: "16-avos",
            phaseOrder: 2,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ver palpites/i }));

    expect(screen.getByRole("tab", { name: /16-avos/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
