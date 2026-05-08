import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  version: 1;
  userId: string;
  expiresAt: string;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createSessionToken(
  userId: string,
  secret: string,
  now = new Date(),
) {
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const payload: SessionPayload = {
    version: 1,
    userId,
    expiresAt: expiresAt.toISOString(),
  };
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): SessionPayload | undefined {
  if (!token) return undefined;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return undefined;

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) return undefined;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as Partial<SessionPayload>;
    if (payload.version !== 1 || !payload.userId || !payload.expiresAt) {
      return undefined;
    }

    if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
      return undefined;
    }

    return {
      version: 1,
      userId: payload.userId,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return undefined;
  }
}
