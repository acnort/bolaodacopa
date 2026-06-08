import { describe, expect, it } from "vitest";

import { normalizeAppDateTimeToIso } from "@/lib/app-time";

describe("app time", () => {
  it("normalizes Brazilian local datetime inputs to UTC instants", () => {
    expect(normalizeAppDateTimeToIso("11/06/2026 11:59")).toBe(
      "2026-06-11T14:59:00.000Z",
    );
    expect(normalizeAppDateTimeToIso("2026-06-11T11:59")).toBe(
      "2026-06-11T14:59:00.000Z",
    );
  });

  it("keeps explicit UTC instants unchanged", () => {
    expect(normalizeAppDateTimeToIso("2026-06-11T14:59:00.000Z")).toBe(
      "2026-06-11T14:59:00.000Z",
    );
  });
});
