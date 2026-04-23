import { InviteForm } from "@/components/forms/invite-form";
import { OfficialResultForm } from "@/components/forms/official-result-form";
import { PhaseRuleForm } from "@/components/forms/phase-rule-form";
import { PlacementResultForm } from "@/components/forms/placement-result-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTeamName } from "@/lib/domain/selectors";
import { formatDate, formatDateTime, formatPhaseWindow } from "@/lib/formatters";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminPage() {
  const snapshot = await getAppSnapshot();
  const currentUser = await getCurrentUser(snapshot);

  if (currentUser.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <CardTitle>Convidar</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Convites</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-semibold">{invite.email}</TableCell>
                    <TableCell>{invite.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invite.status === "accepted"
                            ? "success"
                            : invite.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {invite.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invite.expiresAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        {snapshot.phases.map((phase) => {
          const rule = snapshot.rules.find((item) => item.phaseId === phase.id);
          if (!rule) return null;

          return (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle>{phase.name}</CardTitle>
                <div className="text-sm text-[color:var(--text-muted)]">
                  {formatPhaseWindow(phase.startsAt, phase.endsAt)}
                </div>
              </CardHeader>
              <CardContent>
                <PhaseRuleForm rule={rule} podium={phase.id === 'phase-podium'} />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.matches.map((match) => {
              const result = snapshot.results.find((item) => item.matchId === match.id);
              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-[color:var(--border-subtle)] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {getTeamName(snapshot.teams, match.homeTeamId)} x{" "}
                        {getTeamName(snapshot.teams, match.awayTeamId)}
                      </p>
                      <p className="text-sm text-[color:var(--text-muted)]">
                        {match.roundLabel} · {match.venue} · {formatDateTime(match.kickoffAt)}
                      </p>
                    </div>
                    <Badge variant={result ? "success" : "neutral"}>
                      {result ? "publicado" : "pendente"}
                    </Badge>
                  </div>
                  <OfficialResultForm
                    matchId={match.id}
                    defaults={{
                      homeScore: result?.homeScore,
                      awayScore: result?.awayScore,
                      status: match.status,
                    }}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pódio</CardTitle>
            </CardHeader>
            <CardContent>
              <PlacementResultForm
                competitionId={snapshot.competition.id}
                teams={snapshot.teams}
                defaults={snapshot.placementResult}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[color:var(--text-muted)]">
              {snapshot.placementResult.publishedAt
                ? formatDateTime(snapshot.placementResult.publishedAt)
                : "não publicado"}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
