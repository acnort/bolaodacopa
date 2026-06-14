import type { AppSnapshot, Match } from "@/lib/domain/types";

export interface ParsedFakePrediction {
  lineNumber: number;
  homeName: string;
  homeScore: number;
  awayScore: number;
  awayName: string;
}

export interface ResolvedFakePrediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  reversed: boolean;
}

export interface FakePredictionParseResult {
  predictions: ParsedFakePrediction[];
  ignoredClassifications: string[];
}

const teamAliases = new Map([
  ["holanda", "paises baixos"],
  ["paises baixos", "paises baixos"],
  ["tchequia", "republica tcheca"],
  ["republica tcheca", "republica tcheca"],
  ["rd congo", "republica democratica do congo"],
  ["republica democratica do congo", "republica democratica do congo"],
]);

export function normalizeFakePredictionTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalTeamKey(value: string) {
  const normalized = normalizeFakePredictionTeamName(value);
  return teamAliases.get(normalized) ?? normalized;
}

export function parseFakePredictionsInput(
  rawInput: string,
): FakePredictionParseResult {
  const predictions: ParsedFakePrediction[] = [];
  const ignoredClassifications: string[] = [];

  for (const [index, rawLine] of rawInput.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^grupo\s+[a-l]$/i.test(line)) continue;

    if (normalizeFakePredictionTeamName(line).startsWith("classificacao ")) {
      ignoredClassifications.push(line);
      continue;
    }

    const match = line.match(/^(.+?)\s+(\d+)\s+x\s+(\d+)\s+(.+)$/i);
    if (!match) {
      throw new Error(`Linha ${index + 1} não reconhecida: ${line}`);
    }

    predictions.push({
      lineNumber: index + 1,
      homeName: match[1]!.trim(),
      homeScore: Number(match[2]),
      awayScore: Number(match[3]),
      awayName: match[4]!.trim(),
    });
  }

  return { predictions, ignoredClassifications };
}

function buildTeamResolver(snapshot: AppSnapshot) {
  const teamsByName = new Map(
    snapshot.teams.map((team) => [canonicalTeamKey(team.name), team]),
  );

  return (name: string) => {
    const team = teamsByName.get(canonicalTeamKey(name));
    if (!team) {
      throw new Error(`Time não encontrado: ${name}`);
    }
    return team;
  };
}

export function resolveFakePredictionsForPhase({
  snapshot,
  phaseId,
  predictions,
}: {
  snapshot: AppSnapshot;
  phaseId: string;
  predictions: ParsedFakePrediction[];
}): ResolvedFakePrediction[] {
  const resolveTeam = buildTeamResolver(snapshot);
  const phaseMatches = snapshot.matches.filter(
    (match) => match.phaseId === phaseId,
  );
  const matchesByPair = new Map<string, Match>(
    phaseMatches
      .filter((match) => match.homeTeamId && match.awayTeamId)
      .map((match) => [`${match.homeTeamId}:${match.awayTeamId}`, match]),
  );

  return predictions.map((prediction) => {
    const homeTeam = resolveTeam(prediction.homeName);
    const awayTeam = resolveTeam(prediction.awayName);
    const key = `${homeTeam.id}:${awayTeam.id}`;
    const reverseKey = `${awayTeam.id}:${homeTeam.id}`;
    const match = matchesByPair.get(key);
    const reversedMatch = matchesByPair.get(reverseKey);

    if (match) {
      return {
        matchId: match.id,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        reversed: false,
      };
    }

    if (reversedMatch) {
      return {
        matchId: reversedMatch.id,
        homeScore: prediction.awayScore,
        awayScore: prediction.homeScore,
        reversed: true,
      };
    }

    throw new Error(
      `Linha ${prediction.lineNumber}: partida não encontrada na fase selecionada: ${prediction.homeName} x ${prediction.awayName}.`,
    );
  });
}
