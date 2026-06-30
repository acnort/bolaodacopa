import { describe, expect, it } from "vitest";

import {
  getOfficialScoreDetailLabel,
  getOfficialScoreLabel,
} from "@/lib/formatters";

describe("score formatters", () => {
  it("formats regular time with extra-time total in parentheses and penalties below", () => {
    const result = {
      matchId: "match-penalties",
      homeScore: 1,
      awayScore: 1,
      extraTimeHomeScore: 2,
      extraTimeAwayScore: 2,
      penaltyHomeScore: 4,
      penaltyAwayScore: 3,
      publishedAt: "",
    };

    expect(getOfficialScoreLabel(result)).toBe("(2) 1 x 1 (2)");
    expect(getOfficialScoreDetailLabel(result)).toBe("Pên. 4 x 3");
  });

  it("does not duplicate the extra-time score as a total detail", () => {
    const result = {
      matchId: "match-extra-time",
      homeScore: 1,
      awayScore: 1,
      totalHomeScore: 2,
      totalAwayScore: 1,
      extraTimeHomeScore: 2,
      extraTimeAwayScore: 1,
      publishedAt: "",
    };

    expect(getOfficialScoreLabel(result)).toBe("(2) 1 x 1 (1)");
    expect(getOfficialScoreDetailLabel(result)).toBeUndefined();
  });
});
