import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

import { syncResultsProviderAction } from "@/lib/services/app-service";
import { getResultsProviderName } from "@/lib/services/results-provider-factory";

export const dynamic = "force-dynamic";

function secretsMatch(left: string | undefined, right: string) {
  if (!left) return false;

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function GET(request: NextRequest) {
  const providerName = getResultsProviderName();
  if (providerName === "mock" || providerName === "unconfigured") {
    return NextResponse.json(
      { ok: false, message: "API de resultados não configurada." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const expected = process.env.INTERNAL_CRON_SECRET?.trim();

  if (!expected && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Cron secret não configurado." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (expected) {
    const bearer = authHeader?.replace(/^Bearer\s+/i, "").trim();
    const isAuthorized =
      secretsMatch(bearer, expected) ||
      secretsMatch(cronSecret ?? undefined, expected);

    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, message: "Cron secret inválido." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const modeParam = request.nextUrl.searchParams.get("mode");
  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  const force = request.nextUrl.searchParams.get("force") === "true";
  const mode =
    modeParam === "adaptive"
      ? "adaptive"
      : modeParam === "live-window"
        ? "live-window"
        : "daily";

  try {
    const result = await syncResultsProviderAction({ mode, date, force });
    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Provider sync failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Falha no sync do provider.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
