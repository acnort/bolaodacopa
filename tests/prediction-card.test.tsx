import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PredictionCard } from "@/components/ui/prediction-card";

describe("PredictionCard", () => {
  it("renders the match and current prediction", () => {
    render(
      <PredictionCard
        homeTeam="Brasil"
        awayTeam="Alemanha"
        venue="Cidade do México"
        kickoffAt="2026-06-11T19:00:00.000Z"
        status="aberto"
        prediction="2 x 1"
      />,
    );

    expect(screen.getByText("Brasil x Alemanha")).toBeInTheDocument();
    expect(screen.getByText("2 x 1")).toBeInTheDocument();
  });
});
