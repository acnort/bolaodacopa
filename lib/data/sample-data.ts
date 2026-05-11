import type { AppSnapshot } from "@/lib/domain/types";
import { worldCup2026Teams } from "@/lib/data/world-cup-2026";

export const demoCurrentUserId = "user-ana";

const groupOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

const groupStageVenues = [
  "Cidade do México",
  "Toronto",
  "Nova York",
  "Dallas",
  "Los Angeles",
  "Seattle",
  "Houston",
  "Atlanta",
  "Miami",
  "Chicago",
  "Boston",
  "Vancouver",
];

function buildGroupStageMatches() {
  const teamsByGroup = new Map<string, typeof worldCup2026Teams>();

  for (const group of groupOrder) {
    teamsByGroup.set(
      group,
      worldCup2026Teams.filter((team) => team.group === group),
    );
  }

  const kickoffBase = new Date("2026-06-11T19:00:00.000Z");

  return groupOrder.flatMap((group, groupIndex) => {
    const teams = teamsByGroup.get(group) ?? [];
    const [team1, team2, team3, team4] = teams;

    if (!team1 || !team2 || !team3 || !team4) {
      return [];
    }

    const fixtures = [
      {
        suffix: "r1-1",
        roundLabel: "Rodada 1",
        homeTeamId: team1.id,
        awayTeamId: team2.id,
        dayOffset: groupIndex,
        hourOffset: 0,
      },
      {
        suffix: "r1-2",
        roundLabel: "Rodada 1",
        homeTeamId: team3.id,
        awayTeamId: team4.id,
        dayOffset: groupIndex,
        hourOffset: 3,
      },
      {
        suffix: "r2-1",
        roundLabel: "Rodada 2",
        homeTeamId: team1.id,
        awayTeamId: team3.id,
        dayOffset: groupIndex + 8,
        hourOffset: 0,
      },
      {
        suffix: "r2-2",
        roundLabel: "Rodada 2",
        homeTeamId: team2.id,
        awayTeamId: team4.id,
        dayOffset: groupIndex + 8,
        hourOffset: 3,
      },
      {
        suffix: "r3-1",
        roundLabel: "Rodada 3",
        homeTeamId: team4.id,
        awayTeamId: team1.id,
        dayOffset: groupIndex + 16,
        hourOffset: 0,
      },
      {
        suffix: "r3-2",
        roundLabel: "Rodada 3",
        homeTeamId: team2.id,
        awayTeamId: team3.id,
        dayOffset: groupIndex + 16,
        hourOffset: 0,
      },
    ];

    return fixtures.map((fixture, fixtureIndex) => {
      const kickoffAt = new Date(
        kickoffBase.getTime() +
          (fixture.dayOffset * 24 + fixture.hourOffset) * 60 * 60 * 1000,
      );

      return {
        id: `group-${group.toLowerCase()}-${fixture.suffix}`,
        phaseId: "phase-groups" as const,
        roundLabel: fixture.roundLabel,
        stageGroup: `Grupo ${group}`,
        kickoffAt: kickoffAt.toISOString(),
        venue: groupStageVenues[(groupIndex + fixtureIndex) % groupStageVenues.length],
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        status:
          group === "A" && fixture.suffix === "r1-1"
            ? ("completed" as const)
            : group === "B" && fixture.suffix === "r1-1"
              ? ("completed" as const)
              : group === "C" && fixture.suffix === "r2-1"
                ? ("completed" as const)
                : ("scheduled" as const),
      };
    });
  });
}

const groupStageMatches = buildGroupStageMatches();

function buildRound32Matches() {
  const pairings = [
    ["1º líder", "8º melhor 3º"],
    ["2º líder", "7º melhor 3º"],
    ["3º líder", "6º melhor 3º"],
    ["4º líder", "5º melhor 3º"],
    ["5º líder", "4º melhor 3º"],
    ["6º líder", "3º melhor 3º"],
    ["7º líder", "2º melhor 3º"],
    ["8º líder", "1º melhor 3º"],
    ["9º líder", "12º segundo"],
    ["10º líder", "11º segundo"],
    ["11º líder", "10º segundo"],
    ["12º líder", "9º segundo"],
    ["1º segundo", "8º segundo"],
    ["2º segundo", "7º segundo"],
    ["3º segundo", "6º segundo"],
    ["4º segundo", "5º segundo"],
  ] as const;

  const baseDate = new Date("2026-07-01T17:00:00.000Z");
  const venues = [
    "Los Angeles",
    "Seattle",
    "Houston",
    "Atlanta",
    "Miami",
    "Philadelphia",
    "Kansas City",
    "Monterrey",
  ];

  return pairings.map(([homePlaceholder, awayPlaceholder], index) => {
    const kickoffAt = new Date(baseDate.getTime() + index * 6 * 60 * 60 * 1000);

    return {
      id: `round32-${index + 1}`,
      phaseId: "phase-round-32" as const,
      roundLabel: "16-avos",
      kickoffAt: kickoffAt.toISOString(),
      venue: venues[index % venues.length]!,
      homePlaceholder,
      awayPlaceholder,
      status: "scheduled" as const,
    };
  });
}

function buildRound16Matches() {
  const baseDate = new Date("2026-07-05T17:00:00.000Z");
  const venues = [
    "Dallas",
    "Boston",
    "Guadalajara",
    "Vancouver",
    "San Francisco",
    "Toronto",
    "Miami",
    "Houston",
  ];

  return Array.from({ length: 8 }, (_, index) => {
    const kickoffAt = new Date(baseDate.getTime() + index * 9 * 60 * 60 * 1000);

    return {
      id: `round16-${index + 1}`,
      phaseId: "phase-round-16" as const,
      roundLabel: "Oitavas",
      kickoffAt: kickoffAt.toISOString(),
      venue: venues[index]!,
      homePlaceholder: `Ganhador 16-avos ${index * 2 + 1}`,
      awayPlaceholder: `Ganhador 16-avos ${index * 2 + 2}`,
      status: "scheduled" as const,
    };
  });
}

function buildQuarterfinalMatches() {
  const baseDate = new Date("2026-07-09T20:00:00.000Z");
  const venues = ["Chicago", "Boston", "Dallas", "Atlanta"];

  return Array.from({ length: 4 }, (_, index) => {
    const kickoffAt = new Date(baseDate.getTime() + index * 18 * 60 * 60 * 1000);

    return {
      id: `quarterfinal-${index + 1}`,
      phaseId: "phase-quarterfinals" as const,
      roundLabel: "Quartas",
      kickoffAt: kickoffAt.toISOString(),
      venue: venues[index]!,
      homePlaceholder: `Ganhador Oitavas ${index * 2 + 1}`,
      awayPlaceholder: `Ganhador Oitavas ${index * 2 + 2}`,
      status: "scheduled" as const,
    };
  });
}

function buildSemifinalMatches() {
  return [
    {
      id: "semifinal-1",
      phaseId: "phase-semifinals" as const,
      roundLabel: "Semifinal",
      kickoffAt: "2026-07-14T21:00:00.000Z",
      venue: "San Francisco",
      homePlaceholder: "Ganhador Quartas 1",
      awayPlaceholder: "Ganhador Quartas 2",
      status: "scheduled" as const,
    },
    {
      id: "semifinal-2",
      phaseId: "phase-semifinals" as const,
      roundLabel: "Semifinal",
      kickoffAt: "2026-07-15T21:00:00.000Z",
      venue: "Dallas",
      homePlaceholder: "Ganhador Quartas 3",
      awayPlaceholder: "Ganhador Quartas 4",
      status: "scheduled" as const,
    },
  ];
}

const round32Matches = buildRound32Matches();
const round16Matches = buildRound16Matches();
const quarterfinalMatches = buildQuarterfinalMatches();
const semifinalMatches = buildSemifinalMatches();

export const sampleSnapshot: AppSnapshot = {
  competition: {
    id: "world-cup-2026",
    name: "Bolão da Copa",
    edition: "FIFA World Cup 2026",
    host: "Canadá, Estados Unidos e México",
  },
  teams: worldCup2026Teams,
  phases: [
    {
      id: "phase-groups",
      competitionId: "world-cup-2026",
      slug: "fase-de-grupos",
      name: "Fase de grupos",
      order: 1,
      startsAt: "2026-06-11T12:00:00.000Z",
      endsAt: "2026-06-30T23:59:59.000Z",
    },
    {
      id: "phase-round-32",
      competitionId: "world-cup-2026",
      slug: "16-avos",
      name: "16-avos",
      order: 2,
      startsAt: "2026-07-01T12:00:00.000Z",
      endsAt: "2026-07-04T23:59:59.000Z",
    },
    {
      id: "phase-round-16",
      competitionId: "world-cup-2026",
      slug: "oitavas",
      name: "Oitavas",
      order: 3,
      startsAt: "2026-07-05T12:00:00.000Z",
      endsAt: "2026-07-08T23:59:59.000Z",
    },
    {
      id: "phase-quarterfinals",
      competitionId: "world-cup-2026",
      slug: "quartas",
      name: "Quartas",
      order: 4,
      startsAt: "2026-07-09T12:00:00.000Z",
      endsAt: "2026-07-11T23:59:59.000Z",
    },
    {
      id: "phase-semifinals",
      competitionId: "world-cup-2026",
      slug: "semis",
      name: "Semis",
      order: 5,
      startsAt: "2026-07-12T12:00:00.000Z",
      endsAt: "2026-07-16T23:59:59.000Z",
    },
    {
      id: "phase-final",
      competitionId: "world-cup-2026",
      slug: "grande-final",
      name: "Grande final",
      order: 6,
      startsAt: "2026-07-17T12:00:00.000Z",
      endsAt: "2026-07-19T23:59:59.000Z",
    },
    {
      id: "phase-podium",
      competitionId: "world-cup-2026",
      slug: "podio-final",
      name: "Pódio final",
      order: 7,
      startsAt: "2026-06-11T12:00:00.000Z",
      endsAt: "2026-07-16T23:59:59.000Z",
    },
  ],
  rules: [
    {
      id: "rule-groups",
      phaseId: "phase-groups",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-06-30T23:59:59.000Z",
      scoring: {
        exactScore: 5,
        correctOutcome: 2,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-round-32",
      phaseId: "phase-round-32",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-04T23:59:59.000Z",
      scoring: {
        exactScore: 7,
        correctOutcome: 3,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-round-16",
      phaseId: "phase-round-16",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-08T23:59:59.000Z",
      scoring: {
        exactScore: 7,
        correctOutcome: 3,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-quarterfinals",
      phaseId: "phase-quarterfinals",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-11T23:59:59.000Z",
      scoring: {
        exactScore: 8,
        correctOutcome: 4,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-semifinals",
      phaseId: "phase-semifinals",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-16T23:59:59.000Z",
      scoring: {
        exactScore: 8,
        correctOutcome: 4,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-final",
      phaseId: "phase-final",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-19T23:59:59.000Z",
      scoring: {
        exactScore: 10,
        correctOutcome: 5,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
      status: "active",
    },
    {
      id: "rule-podium",
      phaseId: "phase-podium",
      enableMatchPredictions: false,
      enablePlacementPredictions: true,
      opensAt: "2026-04-01T12:00:00.000Z",
      closesAt: "2026-07-16T23:59:59.000Z",
      scoring: {
        exactScore: 0,
        correctOutcome: 0,
        champion: 10,
        runnerUp: 6,
        thirdPlace: 4,
      },
      status: "active",
    },
  ],
  matches: [
    ...groupStageMatches,
    ...round32Matches,
    ...round16Matches,
    ...quarterfinalMatches,
    ...semifinalMatches,
    {
      id: "final-1",
      phaseId: "phase-final",
      roundLabel: "Final",
      kickoffAt: "2026-07-19T22:00:00.000Z",
      venue: "Nova York",
      homePlaceholder: "Ganhador Semifinal 1",
      awayPlaceholder: "Ganhador Semifinal 2",
      status: "scheduled",
    },
  ],
  results: [
    {
      matchId: "group-a-r1-1",
      homeScore: 2,
      awayScore: 1,
      publishedAt: "2026-06-11T22:00:00.000Z",
    },
    {
      matchId: "group-b-r1-1",
      homeScore: 1,
      awayScore: 1,
      publishedAt: "2026-06-12T23:30:00.000Z",
    },
    {
      matchId: "group-c-r2-1",
      homeScore: 0,
      awayScore: 2,
      publishedAt: "2026-06-15T23:00:00.000Z",
    },
  ],
  placementResult: {
    competitionId: "world-cup-2026",
    championTeamId: "bra",
    runnerUpTeamId: "arg",
    thirdPlaceTeamId: "esp",
    publishedAt: "2026-07-20T20:00:00.000Z",
  },
  profiles: [
    {
      id: "user-ana",
      fullName: "André Tronca",
      email: "andre@bolao.dev",
      role: "admin",
      createdAt: "2026-05-01T10:00:00.000Z",
    },
    {
      id: "user-joao",
      fullName: "João Martins",
      email: "joao@bolao.dev",
      role: "member",
      createdAt: "2026-05-01T10:10:00.000Z",
    },
    {
      id: "user-maria",
      fullName: "Maria Costa",
      email: "maria@bolao.dev",
      role: "member",
      createdAt: "2026-05-01T10:20:00.000Z",
    },
    {
      id: "user-sofia",
      fullName: "Sofia Almeida",
      email: "sofia@bolao.dev",
      role: "member",
      createdAt: "2026-05-04T16:00:00.000Z",
    },
  ],
  accessInvites: [
    {
      id: "access-invite-1",
      token: "convite-bolao-2026",
      createdAt: "2026-05-01T10:00:00.000Z",
      createdBy: "user-ana",
    },
  ],
  signupRequests: [
    {
      id: "signup-request-1",
      fullName: "Pedro Lima",
      email: "pedro@bolao.dev",
      token: "cadastro-pedro-2026",
      role: "member",
      status: "pending",
      requestedAt: "2026-05-03T14:00:00.000Z",
    },
    {
      id: "signup-request-2",
      fullName: "Sofia Almeida",
      email: "sofia@bolao.dev",
      token: "cadastro-sofia-2026",
      role: "member",
      status: "approved",
      requestedAt: "2026-05-02T09:00:00.000Z",
      reviewedAt: "2026-05-04T16:00:00.000Z",
      reviewedBy: "user-ana",
      approvedUserId: "user-sofia",
    },
    {
      id: "signup-request-3",
      fullName: "Caio Nunes",
      email: "caio@bolao.dev",
      token: "cadastro-caio-2026",
      role: "member",
      status: "rejected",
      requestedAt: "2026-05-02T15:00:00.000Z",
      reviewedAt: "2026-05-02T18:00:00.000Z",
      reviewedBy: "user-ana",
    },
  ],
  memberships: [
    {
      id: "membership-1",
      userId: "user-ana",
      competitionId: "world-cup-2026",
      role: "admin",
      joinedAt: "2026-05-01T10:00:00.000Z",
    },
    {
      id: "membership-2",
      userId: "user-joao",
      competitionId: "world-cup-2026",
      role: "member",
      joinedAt: "2026-05-01T10:10:00.000Z",
    },
    {
      id: "membership-3",
      userId: "user-maria",
      competitionId: "world-cup-2026",
      role: "member",
      joinedAt: "2026-05-01T10:20:00.000Z",
    },
    {
      id: "membership-4",
      userId: "user-sofia",
      competitionId: "world-cup-2026",
      role: "member",
      joinedAt: "2026-05-04T16:00:00.000Z",
    },
  ],
  matchPredictions: [
    {
      id: "pred-1",
      userId: "user-ana",
      matchId: "group-a-r1-1",
      homeScore: 2,
      awayScore: 1,
      createdAt: "2026-06-10T10:00:00.000Z",
      updatedAt: "2026-06-10T10:00:00.000Z",
    },
    {
      id: "pred-2",
      userId: "user-ana",
      matchId: "group-b-r1-1",
      homeScore: 1,
      awayScore: 0,
      createdAt: "2026-06-10T10:05:00.000Z",
      updatedAt: "2026-06-10T10:05:00.000Z",
    },
    {
      id: "pred-3",
      userId: "user-ana",
      matchId: "group-c-r2-1",
      homeScore: 0,
      awayScore: 2,
      createdAt: "2026-06-10T10:10:00.000Z",
      updatedAt: "2026-06-10T10:10:00.000Z",
    },
    {
      id: "pred-4",
      userId: "user-joao",
      matchId: "group-a-r1-1",
      homeScore: 1,
      awayScore: 1,
      createdAt: "2026-06-10T10:00:00.000Z",
      updatedAt: "2026-06-10T10:00:00.000Z",
    },
    {
      id: "pred-5",
      userId: "user-joao",
      matchId: "group-b-r1-1",
      homeScore: 1,
      awayScore: 1,
      createdAt: "2026-06-10T10:05:00.000Z",
      updatedAt: "2026-06-10T10:05:00.000Z",
    },
    {
      id: "pred-6",
      userId: "user-joao",
      matchId: "group-c-r2-1",
      homeScore: 1,
      awayScore: 2,
      createdAt: "2026-06-10T10:10:00.000Z",
      updatedAt: "2026-06-10T10:10:00.000Z",
    },
    {
      id: "pred-7",
      userId: "user-maria",
      matchId: "group-a-r1-1",
      homeScore: 3,
      awayScore: 1,
      createdAt: "2026-06-10T10:00:00.000Z",
      updatedAt: "2026-06-10T10:00:00.000Z",
    },
    {
      id: "pred-8",
      userId: "user-maria",
      matchId: "group-b-r1-1",
      homeScore: 0,
      awayScore: 1,
      createdAt: "2026-06-10T10:05:00.000Z",
      updatedAt: "2026-06-10T10:05:00.000Z",
    },
    {
      id: "pred-9",
      userId: "user-maria",
      matchId: "group-c-r2-1",
      homeScore: 0,
      awayScore: 1,
      createdAt: "2026-06-10T10:10:00.000Z",
      updatedAt: "2026-06-10T10:10:00.000Z",
    },
  ],
  placementPredictions: [
    {
      id: "placement-1",
      userId: "user-ana",
      competitionId: "world-cup-2026",
      championTeamId: "bra",
      runnerUpTeamId: "arg",
      thirdPlaceTeamId: "fra",
      updatedAt: "2026-06-11T13:00:00.000Z",
    },
    {
      id: "placement-2",
      userId: "user-joao",
      competitionId: "world-cup-2026",
      championTeamId: "fra",
      runnerUpTeamId: "bra",
      thirdPlaceTeamId: "eng",
      updatedAt: "2026-06-11T13:10:00.000Z",
    },
    {
      id: "placement-3",
      userId: "user-maria",
      competitionId: "world-cup-2026",
      championTeamId: "bra",
      runnerUpTeamId: "arg",
      thirdPlaceTeamId: "esp",
      updatedAt: "2026-06-11T13:20:00.000Z",
    },
  ],
};
