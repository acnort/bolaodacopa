import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/services/session-token";

describe("session token", () => {
  it("verifies a signed token before expiration", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const { token } = createSessionToken("user-ana", "secret", now);

    expect(verifySessionToken(token, "secret", now)?.userId).toBe("user-ana");
  });

  it("rejects tampered tokens", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const { token } = createSessionToken("user-ana", "secret", now);
    const [payload, signature = ""] = token.split(".");
    const tampered = `${payload}.${signature?.replace(/.$/, "x")}`;

    expect(verifySessionToken(tampered, "secret", now)).toBeUndefined();
  });

  it("rejects expired tokens", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const { token } = createSessionToken("user-ana", "secret", now);
    const afterTtl = new Date("2026-06-08T12:00:00.000Z");

    expect(verifySessionToken(token, "secret", afterTtl)).toBeUndefined();
  });
});
