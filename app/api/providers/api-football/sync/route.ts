import { NextRequest, NextResponse } from "next/server";

import { getApiFootballConfig } from "@/lib/services/api-football-config";
import { getResultsProvider } from "@/lib/services/results-provider-factory";

export async function GET(request: NextRequest) {
  const config = getApiFootballConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, message: "API-Football não configurada." },
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
  const mode = modeParam === "live-window" ? "live-window" : "daily";
  const provider = getResultsProvider();

  try {
    const summary = await provider.syncCompetitionData({ mode, date });
    return NextResponse.json({ ok: true, summary });
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
