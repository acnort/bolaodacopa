import "server-only";

import { randomUUID } from "crypto";

import { sampleSnapshot } from "@/lib/data/sample-data";
import type {
  AccessSetupInput,
  AccessSetupResult,
  ActionResult,
  AppSnapshot,
  MatchPredictionInput,
  OfficialResultInput,
  Phase,
  PhaseBatchPredictionInput,
  PhaseRuleInput,
  PlacementPredictionInput,
  PlacementResultInput,
  ProfileUpdateInput,
  PredictionRule,
  SignupRequestInput,
  SignupRequestReviewInput,
  SyncedMatchInput,
  Team,
  UserRole,
} from "@/lib/domain/types";
import { getDatabasePool } from "@/lib/services/database/pool";
import { hashPassword } from "@/lib/services/passwords";

function shouldSeedDemoData() {
  return process.env.ENABLE_DEMO_SEED === "true";
}

function nextId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function requiredPool() {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("DATABASE_URL não configurada.");
  }

  return pool;
}

async function ensureDatabaseSeeded() {
  const pool = requiredPool();
  const existing = await pool.query<{ id: string }>(
    "select id from competitions where id = $1 limit 1",
    [sampleSnapshot.competition.id],
  );

  if (existing.rowCount) {
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    const groupCodes = [
      ...new Set(
        sampleSnapshot.teams.map((team) => team.group).filter(Boolean),
      ),
    ];
    const orderedGroupCodes = groupCodes.sort((a, b) => a!.localeCompare(b!));
    const groupIdByCode = new Map<string, string>();

    await client.query(
      `
        insert into competitions (id, name, edition, host, created_at)
        values ($1, $2, $3, $4, timezone('utc', now()))
      `,
      [
        sampleSnapshot.competition.id,
        sampleSnapshot.competition.name,
        sampleSnapshot.competition.edition,
        sampleSnapshot.competition.host,
      ],
    );

    for (const [index, groupCode] of orderedGroupCodes.entries()) {
      if (!groupCode) continue;

      const groupId = `${sampleSnapshot.competition.id}-group-${groupCode.toLowerCase()}`;
      groupIdByCode.set(groupCode, groupId);

      await client.query(
        `
          insert into competition_groups (id, competition_id, code, name, group_order)
          values ($1, $2, $3, $4, $5)
        `,
        [
          groupId,
          sampleSnapshot.competition.id,
          groupCode,
          `Grupo ${groupCode}`,
          index + 1,
        ],
      );
    }

    for (const team of sampleSnapshot.teams) {
      await client.query(
        `
          insert into teams (id, competition_id, group_id, name, short_name, code)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [
          team.id,
          sampleSnapshot.competition.id,
          team.group ? (groupIdByCode.get(team.group) ?? null) : null,
          team.name,
          team.shortName,
          team.code,
        ],
      );
    }

    for (const phase of sampleSnapshot.phases) {
      await client.query(
        `
          insert into phases (id, competition_id, slug, name, phase_order, starts_at, ends_at)
          values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          phase.id,
          phase.competitionId,
          phase.slug,
          phase.name,
          phase.order,
          phase.startsAt,
          phase.endsAt,
        ],
      );
    }

    for (const rule of sampleSnapshot.rules) {
      await client.query(
        `
          insert into prediction_rules (
            id,
            phase_id,
            enable_match_predictions,
            enable_placement_predictions,
            opens_at,
            closes_at,
            exact_score_points,
            correct_outcome_points,
            champion_points,
            runner_up_points,
            third_place_points,
            status
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          rule.id,
          rule.phaseId,
          rule.enableMatchPredictions,
          rule.enablePlacementPredictions,
          rule.opensAt,
          rule.closesAt,
          rule.scoring.exactScore,
          rule.scoring.correctOutcome,
          rule.scoring.champion,
          rule.scoring.runnerUp,
          rule.scoring.thirdPlace,
          rule.status,
        ],
      );
    }

    for (const match of sampleSnapshot.matches) {
      await client.query(
        `
          insert into matches (
            id,
            external_match_id,
            phase_id,
            round_label,
            stage_group,
            kickoff_at,
            venue,
            home_team_id,
            away_team_id,
            home_placeholder,
            away_placeholder,
            status
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          match.id,
          match.externalMatchId ?? null,
          match.phaseId,
          match.roundLabel,
          match.stageGroup ?? null,
          match.kickoffAt,
          match.venue,
          match.homeTeamId ?? null,
          match.awayTeamId ?? null,
          match.homePlaceholder ?? null,
          match.awayPlaceholder ?? null,
          match.status,
        ],
      );
    }

    const seedDemoData = shouldSeedDemoData();

    if (seedDemoData) {
      for (const profile of sampleSnapshot.profiles) {
        await client.query(
          `
            insert into users (id, email, created_at)
            values ($1, $2, $3)
          `,
          [profile.id, profile.email, profile.createdAt],
        );

        await client.query(
          `
            insert into profiles (id, user_id, full_name, role, created_at)
            values ($1, $2, $3, $4, $5)
          `,
          [
            profile.id,
            profile.id,
            profile.fullName,
            profile.role,
            profile.createdAt,
          ],
        );
      }

      for (const membership of sampleSnapshot.memberships) {
        await client.query(
          `
            insert into memberships (id, user_id, competition_id, role, joined_at)
            values ($1, $2, $3, $4, $5)
          `,
          [
            membership.id,
            membership.userId,
            membership.competitionId,
            membership.role,
            membership.joinedAt,
          ],
        );
      }

      for (const request of sampleSnapshot.signupRequests) {
        await client.query(
          `
            insert into signup_requests (
              id,
              full_name,
              email,
              token,
              role,
              status,
              requested_at,
              reviewed_at,
              reviewed_by,
              approved_user_id
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            request.id,
            request.fullName,
            request.email,
            request.token,
            request.role,
            request.status,
            request.requestedAt,
            request.reviewedAt ?? null,
            request.reviewedBy ?? null,
            request.approvedUserId ?? null,
          ],
        );
      }

      for (const result of sampleSnapshot.results) {
        await client.query(
          `
            insert into official_results (match_id, home_score, away_score, published_at)
            values ($1, $2, $3, $4)
          `,
          [
            result.matchId,
            result.homeScore,
            result.awayScore,
            result.publishedAt,
          ],
        );
      }

      await client.query(
        `
          insert into placement_results (
            competition_id,
            champion_team_id,
            runner_up_team_id,
            third_place_team_id,
            published_at
          )
          values ($1, $2, $3, $4, $5)
        `,
        [
          sampleSnapshot.placementResult.competitionId,
          sampleSnapshot.placementResult.championTeamId ?? null,
          sampleSnapshot.placementResult.runnerUpTeamId ?? null,
          sampleSnapshot.placementResult.thirdPlaceTeamId ?? null,
          sampleSnapshot.placementResult.publishedAt ?? null,
        ],
      );

      for (const prediction of sampleSnapshot.matchPredictions) {
        await client.query(
          `
            insert into match_predictions (
              id,
              user_id,
              match_id,
              home_score,
              away_score,
              created_at,
              updated_at
            )
            values ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            prediction.id,
            prediction.userId,
            prediction.matchId,
            prediction.homeScore,
            prediction.awayScore,
            prediction.createdAt,
            prediction.updatedAt,
          ],
        );
      }

      for (const prediction of sampleSnapshot.placementPredictions) {
        await client.query(
          `
            insert into placement_predictions (
              id,
              user_id,
              competition_id,
              champion_team_id,
              runner_up_team_id,
              third_place_team_id,
              updated_at
            )
            values ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            prediction.id,
            prediction.userId,
            prediction.competitionId,
            prediction.championTeamId ?? null,
            prediction.runnerUpTeamId ?? null,
            prediction.thirdPlaceTeamId ?? null,
            prediction.updatedAt,
          ],
        );
      }
    }

    const bootstrapAdminEmail =
      process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const bootstrapAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
    const bootstrapAdminName =
      process.env.BOOTSTRAP_ADMIN_NAME?.trim() ?? "Admin";

    if (bootstrapAdminEmail && bootstrapAdminPassword) {
      const userId = nextId("user");
      const createdAt = nowIso();
      await client.query(
        `
          insert into users (id, email, password_hash, created_at)
          values ($1, $2, $3, $4)
          on conflict (email) do nothing
        `,
        [
          userId,
          bootstrapAdminEmail,
          await hashPassword(bootstrapAdminPassword),
          createdAt,
        ],
      );

      await client.query(
        `
          insert into profiles (id, user_id, full_name, role, created_at)
          select $1, $1, $2, 'admin', $3
          where exists (select 1 from users where id = $1)
          on conflict (id) do nothing
        `,
        [userId, bootstrapAdminName, createdAt],
      );

      await client.query(
        `
          insert into memberships (id, user_id, competition_id, role, joined_at)
          select $1, $2, $3, 'admin', $4
          where exists (select 1 from profiles where id = $2)
          on conflict (user_id, competition_id) do nothing
        `,
        [
          nextId("membership"),
          userId,
          sampleSnapshot.competition.id,
          createdAt,
        ],
      );
    }

    const initialInviteToken = process.env.INITIAL_ACCESS_TOKEN?.trim();
    const inviteTokens = [
      ...(seedDemoData
        ? sampleSnapshot.accessInvites.map((invite) => invite.token)
        : []),
      ...(initialInviteToken ? [initialInviteToken] : []),
    ];

    for (const token of inviteTokens) {
      await client.query(
        `
          insert into access_invites (id, token, created_at)
          values ($1, $2, $3)
          on conflict (token) do nothing
        `,
        [nextId("access-invite"), token, nowIso()],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPostgresCurrentUser() {
  await ensureDatabaseSeeded();

  const pool = requiredPool();
  const explicitId = process.env.APP_CURRENT_USER_ID?.trim();

  if (explicitId) {
    const result = await pool.query<{ id: string }>(
      "select id from profiles where id = $1 limit 1",
      [explicitId],
    );

    if (result.rowCount) {
      return explicitId;
    }
  }

  const explicitEmail = process.env.APP_CURRENT_USER_EMAIL?.trim();

  if (explicitEmail) {
    const result = await pool.query<{ id: string }>(
      `
        select p.id
        from profiles p
        inner join users u on u.id = p.user_id
        where lower(u.email) = lower($1)
        limit 1
      `,
      [explicitEmail],
    );

    if (result.rowCount) {
      return result.rows[0]!.id;
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Usuário atual não informado.");
  }

  const fallback = await pool.query<{ id: string }>(
    `
      select id
      from profiles
      order by case when role = 'admin' then 0 else 1 end, created_at asc
      limit 1
    `,
  );

  return fallback.rows[0]?.id ?? sampleSnapshot.profiles[0]!.id;
}

function mapRule(row: {
  id: string;
  phase_id: string;
  enable_match_predictions: boolean;
  enable_placement_predictions: boolean;
  opens_at: string;
  closes_at: string;
  exact_score_points: number;
  correct_outcome_points: number;
  champion_points: number;
  runner_up_points: number;
  third_place_points: number;
  status: PredictionRule["status"];
}): PredictionRule {
  return {
    id: row.id,
    phaseId: row.phase_id,
    enableMatchPredictions: row.enable_match_predictions,
    enablePlacementPredictions: row.enable_placement_predictions,
    opensAt: new Date(row.opens_at).toISOString(),
    closesAt: new Date(row.closes_at).toISOString(),
    scoring: {
      exactScore: row.exact_score_points,
      correctOutcome: row.correct_outcome_points,
      champion: row.champion_points,
      runnerUp: row.runner_up_points,
      thirdPlace: row.third_place_points,
    },
    status: row.status,
  };
}

function mapPhase(row: {
  id: string;
  competition_id: string;
  slug: string;
  name: string;
  phase_order: number;
  starts_at: string;
  ends_at: string;
}): Phase {
  return {
    id: row.id,
    competitionId: row.competition_id,
    slug: row.slug,
    name: row.name,
    order: row.phase_order,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
  };
}

function mapTeam(row: {
  id: string;
  name: string;
  short_name: string;
  code: string;
  group_code: string | null;
}): Team {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    code: row.code,
    group: row.group_code ?? undefined,
  };
}

export async function getPostgresSnapshot(): Promise<AppSnapshot> {
  await ensureDatabaseSeeded();

  const pool = requiredPool();
  const competitionId = sampleSnapshot.competition.id;

  const [
    competitionResult,
    teamsResult,
    phasesResult,
    rulesResult,
    matchesResult,
    resultsResult,
    placementResult,
    profilesResult,
    signupRequestsResult,
    accessInvitesResult,
    membershipsResult,
    matchPredictionsResult,
    placementPredictionsResult,
  ] = await Promise.all([
    pool.query<{
      id: string;
      name: string;
      edition: string;
      host: string;
    }>(
      "select id, name, edition, host from competitions where id = $1 limit 1",
      [competitionId],
    ),
    pool.query<{
      id: string;
      name: string;
      short_name: string;
      code: string;
      group_code: string | null;
    }>(
      `
        select t.id, t.name, t.short_name, t.code, cg.code as group_code
        from teams t
        left join competition_groups cg on cg.id = t.group_id
        where t.competition_id = $1
        order by cg.group_order asc nulls last, t.name asc
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      competition_id: string;
      slug: string;
      name: string;
      phase_order: number;
      starts_at: string;
      ends_at: string;
    }>(
      `
        select id, competition_id, slug, name, phase_order, starts_at, ends_at
        from phases
        where competition_id = $1
        order by phase_order asc
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      phase_id: string;
      enable_match_predictions: boolean;
      enable_placement_predictions: boolean;
      opens_at: string;
      closes_at: string;
      exact_score_points: number;
      correct_outcome_points: number;
      champion_points: number;
      runner_up_points: number;
      third_place_points: number;
      status: PredictionRule["status"];
    }>(
      `
        select
          id,
          phase_id,
          enable_match_predictions,
          enable_placement_predictions,
          opens_at,
          closes_at,
          exact_score_points,
          correct_outcome_points,
          champion_points,
          runner_up_points,
          third_place_points,
          status
        from prediction_rules
        where phase_id in (
          select id from phases where competition_id = $1
        )
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      external_match_id: string | null;
      phase_id: string;
      round_label: string;
      stage_group: string | null;
      kickoff_at: string;
      venue: string;
      home_team_id: string | null;
      away_team_id: string | null;
      home_placeholder: string | null;
      away_placeholder: string | null;
      status: "scheduled" | "in_progress" | "completed";
    }>(
      `
        select
          id,
          external_match_id,
          phase_id,
          round_label,
          stage_group,
          kickoff_at,
          venue,
          home_team_id,
          away_team_id,
          home_placeholder,
          away_placeholder,
          status
        from matches
        where phase_id in (
          select id from phases where competition_id = $1
        )
        order by kickoff_at asc, id asc
      `,
      [competitionId],
    ),
    pool.query<{
      match_id: string;
      home_score: number;
      away_score: number;
      published_at: string;
    }>(
      `
        select r.match_id, r.home_score, r.away_score, r.published_at
        from official_results r
        inner join matches m on m.id = r.match_id
        where m.phase_id in (
          select id from phases where competition_id = $1
        )
      `,
      [competitionId],
    ),
    pool.query<{
      competition_id: string;
      champion_team_id: string | null;
      runner_up_team_id: string | null;
      third_place_team_id: string | null;
      published_at: string | null;
    }>(
      `
        select competition_id, champion_team_id, runner_up_team_id, third_place_team_id, published_at
        from placement_results
        where competition_id = $1
        limit 1
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      full_name: string;
      email: string;
      role: UserRole;
      avatar_url: string | null;
      created_at: string;
    }>(
      `
        select p.id, p.full_name, u.email, p.role, p.avatar_url, p.created_at
        from profiles p
        inner join users u on u.id = p.user_id
        order by p.created_at asc
      `,
    ),
    pool.query<{
      id: string;
      full_name: string;
      email: string;
      token: string;
      role: UserRole;
      status: "pending" | "approved" | "rejected";
      requested_at: string;
      reviewed_at: string | null;
      reviewed_by: string | null;
      approved_user_id: string | null;
    }>(
      `
        select
          id,
          full_name,
          email,
          token,
          role,
          status,
          requested_at,
          reviewed_at,
          reviewed_by,
          approved_user_id
        from signup_requests
        order by requested_at desc, id desc
      `,
    ),
    pool.query<{
      id: string;
      token: string;
      created_at: string;
      created_by: string | null;
      revoked_at: string | null;
    }>(
      `
        select id, token, created_at, created_by, revoked_at
        from access_invites
        order by created_at desc, id desc
      `,
    ),
    pool.query<{
      id: string;
      user_id: string;
      competition_id: string;
      role: UserRole;
      joined_at: string;
    }>(
      `
        select id, user_id, competition_id, role, joined_at
        from memberships
        where competition_id = $1
        order by joined_at asc
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      user_id: string;
      match_id: string;
      home_score: number;
      away_score: number;
      created_at: string;
      updated_at: string;
    }>(
      `
        select mp.id, mp.user_id, mp.match_id, mp.home_score, mp.away_score, mp.created_at, mp.updated_at
        from match_predictions mp
        inner join matches m on m.id = mp.match_id
        where m.phase_id in (
          select id from phases where competition_id = $1
        )
      `,
      [competitionId],
    ),
    pool.query<{
      id: string;
      user_id: string;
      competition_id: string;
      champion_team_id: string | null;
      runner_up_team_id: string | null;
      third_place_team_id: string | null;
      updated_at: string;
    }>(
      `
        select id, user_id, competition_id, champion_team_id, runner_up_team_id, third_place_team_id, updated_at
        from placement_predictions
        where competition_id = $1
      `,
      [competitionId],
    ),
  ]);

  const competition = competitionResult.rows[0];

  if (!competition) {
    throw new Error("Competição principal não encontrada no banco.");
  }

  return {
    competition,
    teams: teamsResult.rows.map(mapTeam),
    phases: phasesResult.rows.map(mapPhase),
    rules: rulesResult.rows.map(mapRule),
    matches: matchesResult.rows.map((row) => ({
      id: row.id,
      externalMatchId: row.external_match_id ?? undefined,
      phaseId: row.phase_id,
      roundLabel: row.round_label,
      stageGroup: row.stage_group ?? undefined,
      kickoffAt: new Date(row.kickoff_at).toISOString(),
      venue: row.venue,
      homeTeamId: row.home_team_id ?? undefined,
      awayTeamId: row.away_team_id ?? undefined,
      homePlaceholder: row.home_placeholder ?? undefined,
      awayPlaceholder: row.away_placeholder ?? undefined,
      status: row.status,
    })),
    results: resultsResult.rows.map((row) => ({
      matchId: row.match_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      publishedAt: new Date(row.published_at).toISOString(),
    })),
    placementResult: placementResult.rows[0]
      ? {
          competitionId: placementResult.rows[0].competition_id,
          championTeamId: placementResult.rows[0].champion_team_id ?? undefined,
          runnerUpTeamId:
            placementResult.rows[0].runner_up_team_id ?? undefined,
          thirdPlaceTeamId:
            placementResult.rows[0].third_place_team_id ?? undefined,
          publishedAt: placementResult.rows[0].published_at
            ? new Date(placementResult.rows[0].published_at).toISOString()
            : undefined,
        }
      : {
          competitionId,
        },
    profiles: profilesResult.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      avatarUrl: row.avatar_url ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    })),
    accessInvites: accessInvitesResult.rows.map((row) => ({
      id: row.id,
      token: row.token,
      createdAt: new Date(row.created_at).toISOString(),
      createdBy: row.created_by ?? undefined,
      revokedAt: row.revoked_at
        ? new Date(row.revoked_at).toISOString()
        : undefined,
    })),
    signupRequests: signupRequestsResult.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      token: row.token,
      role: row.role,
      status: row.status,
      requestedAt: new Date(row.requested_at).toISOString(),
      reviewedAt: row.reviewed_at
        ? new Date(row.reviewed_at).toISOString()
        : undefined,
      reviewedBy: row.reviewed_by ?? undefined,
      approvedUserId: row.approved_user_id ?? undefined,
    })),
    memberships: membershipsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      competitionId: row.competition_id,
      role: row.role,
      joinedAt: new Date(row.joined_at).toISOString(),
    })),
    matchPredictions: matchPredictionsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      matchId: row.match_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
    placementPredictions: placementPredictionsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      competitionId: row.competition_id,
      championTeamId: row.champion_team_id ?? undefined,
      runnerUpTeamId: row.runner_up_team_id ?? undefined,
      thirdPlaceTeamId: row.third_place_team_id ?? undefined,
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
  };
}

export async function saveMatchPredictionPostgres(
  input: MatchPredictionInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  const pool = requiredPool();
  const existing = await pool.query<{ id: string }>(
    `
      select id
      from match_predictions
      where user_id = $1 and match_id = $2
      limit 1
    `,
    [input.userId, input.matchId],
  );

  const updatedId = existing.rows[0]?.id ?? nextId("pred");

  await pool.query(
    `
      insert into match_predictions (
        id,
        user_id,
        match_id,
        home_score,
        away_score,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (user_id, match_id)
      do update set
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_at = excluded.updated_at
    `,
    [
      updatedId,
      input.userId,
      input.matchId,
      input.homeScore,
      input.awayScore,
      nowIso(),
      nowIso(),
    ],
  );

  return {
    ok: true,
    message: existing.rowCount
      ? "Palpite de jogo atualizado."
      : "Palpite de jogo salvo.",
    data: { updatedId },
  };
}

export async function savePhasePredictionsPostgres(
  input: PhaseBatchPredictionInput,
): Promise<ActionResult<{ updatedCount: number }>> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    let updatedCount = 0;

    for (const prediction of input.predictions) {
      const existing = await client.query<{ id: string }>(
        `
          select id
          from match_predictions
          where user_id = $1 and match_id = $2
          limit 1
        `,
        [input.userId, prediction.matchId],
      );

      const predictionId = existing.rows[0]?.id ?? nextId("pred");
      const timestamp = nowIso();

      await client.query(
        `
          insert into match_predictions (
            id,
            user_id,
            match_id,
            home_score,
            away_score,
            created_at,
            updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          on conflict (user_id, match_id)
          do update set
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            updated_at = excluded.updated_at
        `,
        [
          predictionId,
          input.userId,
          prediction.matchId,
          prediction.homeScore,
          prediction.awayScore,
          timestamp,
          timestamp,
        ],
      );

      updatedCount += 1;
    }

    if (input.placementPrediction) {
      const existing = await client.query<{ id: string }>(
        `
          select id
          from placement_predictions
          where user_id = $1 and competition_id = $2
          limit 1
        `,
        [input.userId, input.placementPrediction.competitionId],
      );

      const predictionId = existing.rows[0]?.id ?? nextId("placement");

      await client.query(
        `
          insert into placement_predictions (
            id,
            user_id,
            competition_id,
            champion_team_id,
            runner_up_team_id,
            third_place_team_id,
            updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          on conflict (user_id, competition_id)
          do update set
            champion_team_id = excluded.champion_team_id,
            runner_up_team_id = excluded.runner_up_team_id,
            third_place_team_id = excluded.third_place_team_id,
            updated_at = excluded.updated_at
        `,
        [
          predictionId,
          input.userId,
          input.placementPrediction.competitionId,
          input.placementPrediction.championTeamId,
          input.placementPrediction.runnerUpTeamId,
          input.placementPrediction.thirdPlaceTeamId,
          nowIso(),
        ],
      );

      updatedCount += 1;
    }

    await client.query("commit");

    return {
      ok: true,
      message:
        updatedCount > 0
          ? "Palpites da fase salvos."
          : "Nenhuma alteração enviada.",
      data: { updatedCount },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function savePlacementPredictionPostgres(
  input: PlacementPredictionInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  const pool = requiredPool();
  const existing = await pool.query<{ id: string }>(
    `
      select id
      from placement_predictions
      where user_id = $1 and competition_id = $2
      limit 1
    `,
    [input.userId, input.competitionId],
  );

  const predictionId = existing.rows[0]?.id ?? nextId("placement");

  await pool.query(
    `
      insert into placement_predictions (
        id,
        user_id,
        competition_id,
        champion_team_id,
        runner_up_team_id,
        third_place_team_id,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (user_id, competition_id)
      do update set
        champion_team_id = excluded.champion_team_id,
        runner_up_team_id = excluded.runner_up_team_id,
        third_place_team_id = excluded.third_place_team_id,
        updated_at = excluded.updated_at
    `,
    [
      predictionId,
      input.userId,
      input.competitionId,
      input.championTeamId,
      input.runnerUpTeamId,
      input.thirdPlaceTeamId,
      nowIso(),
    ],
  );

  return {
    ok: true,
    message: existing.rowCount
      ? "Palpite final atualizado."
      : "Palpite final salvo.",
    data: { updatedId: predictionId },
  };
}

export async function saveOfficialResultPostgres(
  input: OfficialResultInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    await client.query("update matches set status = $2 where id = $1", [
      input.matchId,
      input.status,
    ]);

    await client.query(
      `
        insert into official_results (match_id, home_score, away_score, published_at)
        values ($1, $2, $3, $4)
        on conflict (match_id)
        do update set
          home_score = excluded.home_score,
          away_score = excluded.away_score,
          published_at = excluded.published_at
      `,
      [input.matchId, input.homeScore, input.awayScore, nowIso()],
    );

    await client.query("commit");

    return {
      ok: true,
      message: "Resultado oficial salvo.",
      data: { updatedId: input.matchId },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function clearOfficialResultsPostgres(): Promise<
  ActionResult<{ resetResults: number; resetPlacement: boolean }>
> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    const removed = await client.query(
      `
        delete from official_results
      `,
    );
    const placement = await client.query(
      `
        delete from placement_results
      `,
    );

    await client.query(
      `
        update matches
        set status = 'scheduled'
        where status <> 'scheduled'
      `,
    );

    await client.query("commit");

    return {
      ok: true,
      message: "Resultados resetados.",
      data: {
        resetResults: removed.rowCount ?? 0,
        resetPlacement: Boolean(placement.rowCount),
      },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function syncMatchesPostgres(
  inputs: SyncedMatchInput[],
): Promise<ActionResult<{ updatedMatches: number; updatedResults: number }>> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();
  let updatedMatches = 0;
  let updatedResults = 0;

  try {
    await client.query("begin");

    for (const input of inputs) {
      const matchResult = await client.query(
        `
          update matches
          set
            external_match_id = $2,
            kickoff_at = $3,
            status = $4
          where id = $1
        `,
        [input.matchId, input.externalMatchId, input.kickoffAt, input.status],
      );

      updatedMatches += matchResult.rowCount ?? 0;

      if (input.homeScore !== undefined && input.awayScore !== undefined) {
        await client.query(
          `
            insert into official_results (match_id, home_score, away_score, published_at)
            values ($1, $2, $3, $4)
            on conflict (match_id)
            do update set
              home_score = excluded.home_score,
              away_score = excluded.away_score,
              published_at = excluded.published_at
          `,
          [input.matchId, input.homeScore, input.awayScore, nowIso()],
        );
        updatedResults += 1;
      }
    }

    await client.query("commit");

    return {
      ok: true,
      message: "Resultados sincronizados.",
      data: { updatedMatches, updatedResults },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getProviderSyncStatePostgres(key: string) {
  await ensureDatabaseSeeded();

  const result = await requiredPool().query<{ last_synced_at: string }>(
    "select last_synced_at from provider_sync_state where key = $1 limit 1",
    [key],
  );

  const syncedAt = result.rows[0]?.last_synced_at;
  return syncedAt ? new Date(syncedAt).toISOString() : undefined;
}

export async function saveProviderSyncStatePostgres(
  key: string,
  syncedAt = nowIso(),
) {
  await ensureDatabaseSeeded();

  await requiredPool().query(
    `
      insert into provider_sync_state (key, last_synced_at, updated_at)
      values ($1, $2, $2)
      on conflict (key)
      do update set
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at
    `,
    [key, syncedAt],
  );
}

export async function savePlacementResultPostgres(
  input: PlacementResultInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  await requiredPool().query(
    `
      insert into placement_results (
        competition_id,
        champion_team_id,
        runner_up_team_id,
        third_place_team_id,
        published_at
      )
      values ($1, $2, $3, $4, $5)
      on conflict (competition_id)
      do update set
        champion_team_id = excluded.champion_team_id,
        runner_up_team_id = excluded.runner_up_team_id,
        third_place_team_id = excluded.third_place_team_id,
        published_at = excluded.published_at
    `,
    [
      input.competitionId,
      input.championTeamId,
      input.runnerUpTeamId,
      input.thirdPlaceTeamId,
      nowIso(),
    ],
  );

  return {
    ok: true,
    message: "Resultado do podio atualizado.",
    data: { updatedId: input.competitionId },
  };
}

export async function savePhaseRulePostgres(
  input: PhaseRuleInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  const result = await requiredPool().query<{ id: string }>(
    `
      update prediction_rules
      set
        enable_match_predictions = $2,
        enable_placement_predictions = $3,
        opens_at = $4,
        closes_at = $5,
        exact_score_points = $6,
        correct_outcome_points = $7,
        champion_points = $8,
        runner_up_points = $9,
        third_place_points = $10,
        status = $11
      where phase_id = $1
      returning id
    `,
    [
      input.phaseId,
      input.enableMatchPredictions,
      input.enablePlacementPredictions,
      input.opensAt,
      input.closesAt,
      input.exactScore,
      input.correctOutcome,
      input.champion,
      input.runnerUp,
      input.thirdPlace,
      input.status,
    ],
  );

  if (!result.rowCount) {
    return { ok: false, message: "Regra da fase nao encontrada." };
  }

  return {
    ok: true,
    message: "Regra da fase atualizada.",
    data: { updatedId: result.rows[0]!.id },
  };
}

export async function removeSignupRequestPostgres(
  requestId: string,
): Promise<ActionResult<{ removedId: string }>> {
  await ensureDatabaseSeeded();

  const request = await requiredPool().query<{
    id: string;
    email: string;
    status: "pending" | "approved" | "rejected";
  }>("select id, email, status from signup_requests where id = $1 limit 1", [
    requestId,
  ]);

  if (!request.rowCount) {
    return { ok: false, message: "Solicitação não encontrada." };
  }

  if (request.rows[0]!.status === "approved") {
    return {
      ok: false,
      message: "Cadastros aprovados não podem ser removidos.",
    };
  }

  await requiredPool().query("delete from signup_requests where id = $1", [
    requestId,
  ]);
  await removePendingProfileByEmailPostgres(request.rows[0]!.email);

  return {
    ok: true,
    message: "Solicitação removida.",
    data: { removedId: requestId },
  };
}

async function removePendingProfileByEmailPostgres(email: string) {
  await requiredPool().query(
    `
      delete from users u
      using profiles p
      where p.user_id = u.id
        and lower(u.email) = lower($1)
        and not exists (
          select 1
          from memberships m
          where m.user_id = p.id
        )
    `,
    [email.trim().toLowerCase()],
  );
}

export async function removeMemberPostgres(
  userId: string,
  currentUserId?: string,
): Promise<ActionResult<{ removedId: string }>> {
  await ensureDatabaseSeeded();

  const actorUserId = currentUserId ?? (await getPostgresCurrentUser());

  if (userId === actorUserId) {
    return { ok: false, message: "Voce nao pode remover sua propria conta." };
  }

  const profile = await requiredPool().query<{ user_id: string; role: string }>(
    "select user_id, role from profiles where id = $1 limit 1",
    [userId],
  );

  if (!profile.rowCount) {
    return { ok: false, message: "Membro nao encontrado." };
  }

  if (profile.rows[0]!.role !== "member") {
    return { ok: false, message: "Apenas membros comuns podem ser removidos." };
  }

  await requiredPool().query("delete from users where id = $1", [
    profile.rows[0]!.user_id,
  ]);

  return {
    ok: true,
    message: "Membro removido.",
    data: { removedId: userId },
  };
}

export async function updateMemberRolePostgres(
  userId: string,
  role: UserRole,
): Promise<ActionResult<{ updatedId: string; role: UserRole }>> {
  await ensureDatabaseSeeded();

  if (role !== "admin" && role !== "member") {
    return { ok: false, message: "Perfil inválido." };
  }

  const profile = await requiredPool().query<{ role: UserRole }>(
    "select role from profiles where id = $1 limit 1",
    [userId],
  );

  if (!profile.rowCount) {
    return { ok: false, message: "Membro nao encontrado." };
  }

  if (profile.rows[0]!.role === "owner") {
    return { ok: false, message: "Owners só podem ser alterados por script." };
  }

  await requiredPool().query(
    `
      update profiles
      set role = $2
      where id = $1
    `,
    [userId, role],
  );

  await requiredPool().query(
    `
      update memberships
      set role = $2
      where user_id = $1
    `,
    [userId, role],
  );

  return {
    ok: true,
    message: "Perfil atualizado.",
    data: { updatedId: userId, role },
  };
}

export async function updateProfilePostgres(
  input: ProfileUpdateInput,
): Promise<ActionResult<{ updatedId: string }>> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    const profile = await client.query<{ user_id: string }>(
      "select user_id from profiles where id = $1 limit 1",
      [input.userId],
    );

    if (!profile.rowCount) {
      await client.query("rollback");
      return { ok: false, message: "Perfil nao encontrado." };
    }

    if (input.avatarUrl !== undefined) {
      await client.query(
        `
          update profiles
          set avatar_url = $2
          where id = $1
        `,
        [input.userId, input.avatarUrl],
      );
    }

    if (input.passwordHash) {
      await client.query(
        `
          update users
          set password_hash = $2
          where id = $1
        `,
        [profile.rows[0]!.user_id, input.passwordHash],
      );
    }

    await client.query("commit");

    return {
      ok: true,
      message: "Perfil atualizado.",
      data: { updatedId: input.userId },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createSignupRequestPostgres(
  input: SignupRequestInput,
): Promise<ActionResult<{ token: string }>> {
  await ensureDatabaseSeeded();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await requiredPool().query<{ id: string }>(
    `
      select u.id
      from users u
      where lower(u.email) = lower($1)
      limit 1
    `,
    [normalizedEmail],
  );

  if (existingUser.rowCount) {
    return { ok: false, message: "Este email já foi aprovado no bolão." };
  }

  const existingRequest = await requiredPool().query<{ id: string }>(
    `
      select id
      from signup_requests
      where lower(email) = lower($1)
        and status in ('pending', 'approved')
      limit 1
    `,
    [normalizedEmail],
  );

  if (existingRequest.rowCount) {
    return {
      ok: false,
      message: "Já existe uma solicitação aberta ou aprovada para este email.",
    };
  }

  const token = nextId("signup-token");

  await requiredPool().query(
    `
      insert into signup_requests (
        id,
        full_name,
        email,
        token,
        role,
        status,
        requested_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      nextId("signup-request"),
      input.fullName,
      normalizedEmail,
      token,
      "member",
      "pending",
      nowIso(),
    ],
  );

  return {
    ok: true,
    message: "Cadastro enviado. Agora é só aguardar a aprovação.",
    data: { token },
  };
}

export async function getPasswordHashByEmailPostgres(email: string) {
  await ensureDatabaseSeeded();

  const result = await requiredPool().query<{ password_hash: string | null }>(
    `
      select password_hash
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [email.trim().toLowerCase()],
  );

  return result.rows[0]?.password_hash ?? undefined;
}

export async function activateAccessInvitePostgres(
  input: AccessSetupInput,
): Promise<ActionResult<AccessSetupResult>> {
  await ensureDatabaseSeeded();

  const normalizedEmail = input.email.trim().toLowerCase();
  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    const invite = await client.query<{ id: string }>(
      `
        select id
        from access_invites
        where token = $1 and revoked_at is null
        limit 1
      `,
      [input.token],
    );

    if (!invite.rowCount) {
      await client.query("rollback");
      return { ok: false, message: "Link de acesso inválido." };
    }

    const existingUser = await client.query<{
      id: string;
      password_hash: string | null;
      membership_id: string | null;
    }>(
      `
        select u.id, u.password_hash, m.id as membership_id
        from users u
        left join profiles p on p.user_id = u.id
        left join memberships m on m.user_id = p.id
        where lower(u.email) = lower($1)
        limit 1
      `,
      [normalizedEmail],
    );

    const timestamp = nowIso();
    const existing = existingUser.rows[0];

    if (existing && !existing.membership_id) {
      await client.query("rollback");
      return {
        ok: false,
        message: "Já existe uma solicitação aberta para este email.",
      };
    }

    if (existing?.password_hash) {
      await client.query("rollback");
      return { ok: false, message: "Este email já tem acesso ao bolão." };
    }

    if (existing) {
      await client.query(
        `
          update users
          set password_hash = $2
          where id = $1
        `,
        [existing.id, input.passwordHash],
      );

      await client.query("commit");

      return {
        ok: true,
        message: "Senha definida.",
        data: {
          userId: existing.id,
          email: normalizedEmail,
          requiresApproval: false,
        },
      };
    }

    const existingRequest = await client.query<{ id: string }>(
      `
        select id
        from signup_requests
        where lower(email) = lower($1)
          and status in ('pending', 'approved')
        limit 1
      `,
      [normalizedEmail],
    );

    if (existingRequest.rowCount) {
      await client.query("rollback");
      return {
        ok: false,
        message:
          "Já existe uma solicitação aberta ou aprovada para este email.",
      };
    }

    const userId = nextId("user");
    const requestId = nextId("signup-request");

    await client.query(
      `
        insert into users (id, email, password_hash, created_at)
        values ($1, $2, $3, $4)
      `,
      [userId, normalizedEmail, input.passwordHash, timestamp],
    );

    await client.query(
      `
        insert into profiles (id, user_id, full_name, role, created_at)
        values ($1, $2, $3, $4, $5)
      `,
      [userId, userId, input.fullName, "member", timestamp],
    );

    await client.query(
      `
        insert into signup_requests (
          id,
          full_name,
          email,
          token,
          role,
          status,
          requested_at
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        requestId,
        input.fullName,
        normalizedEmail,
        input.token,
        "member",
        "pending",
        timestamp,
      ],
    );

    await client.query("commit");

    return {
      ok: true,
      message: "Cadastro enviado. Agora é só aguardar a aprovação.",
      data: { userId, email: normalizedEmail, requiresApproval: true },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAccessInvitePostgres(createdBy?: string) {
  await ensureDatabaseSeeded();

  const token = nextId("access");
  await requiredPool().query(
    `
      insert into access_invites (id, token, created_at, created_by)
      values ($1, $2, $3, $4)
    `,
    [nextId("access-invite"), token, nowIso(), createdBy ?? null],
  );

  return {
    ok: true,
    message: "Link de acesso gerado.",
    data: { token },
  };
}

export async function reviewSignupRequestPostgres(
  input: SignupRequestReviewInput,
): Promise<ActionResult<{ userId: string }>> {
  await ensureDatabaseSeeded();

  const client = await requiredPool().connect();

  try {
    await client.query("begin");

    const requestResult = await client.query<{
      id: string;
      full_name: string;
      email: string;
      role: UserRole;
      status: "pending" | "approved" | "rejected";
    }>(
      `
        select id, full_name, email, role, status
        from signup_requests
        where id = $1
        limit 1
      `,
      [input.requestId],
    );

    const request = requestResult.rows[0];

    if (!request) {
      await client.query("rollback");
      return { ok: false, message: "Solicitação não encontrada." };
    }

    if (request.status !== "pending") {
      await client.query("rollback");
      return { ok: false, message: "Esta solicitação já foi analisada." };
    }

    const timestamp = nowIso();
    const currentUserId =
      input.reviewedByUserId ?? (await getPostgresCurrentUser());

    if (input.action === "reject") {
      await client.query(
        `
          update signup_requests
          set
            status = 'rejected',
            reviewed_at = $2,
            reviewed_by = $3
          where id = $1
        `,
        [request.id, timestamp, currentUserId],
      );
      await client.query(
        `
          delete from users u
          using profiles p
          where p.user_id = u.id
            and lower(u.email) = lower($1)
            and not exists (
              select 1
              from memberships m
              where m.user_id = p.id
            )
        `,
        [request.email],
      );

      await client.query("commit");

      return {
        ok: true,
        message: "Cadastro recusado.",
        data: { userId: "" },
      };
    }

    const existingUser = await client.query<{
      id: string;
      membership_id: string | null;
    }>(
      `
        select u.id, m.id as membership_id
        from users u
        left join profiles p on p.user_id = u.id
        left join memberships m on m.user_id = p.id
        where lower(u.email) = lower($1)
        limit 1
      `,
      [request.email],
    );

    const existing = existingUser.rows[0];

    if (existing?.membership_id) {
      await client.query("rollback");
      return { ok: false, message: "Este email já foi aprovado no bolão." };
    }

    const userId = existing?.id ?? nextId("user");

    if (!existing) {
      await client.query(
        `
          insert into users (id, email, password_hash, created_at)
          values ($1, $2, $3, $4)
        `,
        [userId, request.email, null, timestamp],
      );

      await client.query(
        `
          insert into profiles (id, user_id, full_name, role, created_at)
          values ($1, $2, $3, $4, $5)
        `,
        [userId, userId, request.full_name, "member", timestamp],
      );
    }

    await client.query(
      `
        insert into memberships (id, user_id, competition_id, role, joined_at)
        values ($1, $2, $3, $4, $5)
      `,
      [
        nextId("membership"),
        userId,
        sampleSnapshot.competition.id,
        "member",
        timestamp,
      ],
    );

    await client.query(
      `
        update signup_requests
        set
          status = 'approved',
          reviewed_at = $2,
          reviewed_by = $3,
          approved_user_id = $4
        where id = $1
      `,
      [request.id, timestamp, currentUserId, userId],
    );

    await client.query("commit");

    return {
      ok: true,
      message: "Cadastro aprovado.",
      data: { userId },
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
