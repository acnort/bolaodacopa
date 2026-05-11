import { NextRequest, NextResponse } from "next/server";

import { getFootballDataConfig } from "@/lib/services/football-data-config";
import { syncResultsProviderAction } from "@/lib/services/app-service";

export async function GET(request: NextRequest) {
  const config = getFootballDataConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, message: "football-data.org não configurada." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const expected = config.cronSecret;

  if (expected) {
    const bearer = authHeader?.replace(/^Bearer\s+/i, "");
    if (bearer !== expected && cronSecret !== expected) {
      return NextResponse.json(
        { ok: false, message: "Cron secret inválido." },
        { status: 401 },
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
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha no sync do provider.",
      },
      { status: 500 },
    );
  }
}
