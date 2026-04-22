import Link from "next/link";
import { ArrowRight, LayoutDashboard, MailPlus, ShieldCheck, Smartphone, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Smartphone,
    title: "Responsivo de verdade",
    description: "Interface pensada para celular e desktop sem sacrificar leitura ou velocidade.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso por convite",
    description: "Entrada privada com magic link no primeiro acesso e senha opcional depois.",
  },
  {
    icon: Trophy,
    title: "Pontuação por fase",
    description: "Regras configuráveis para jogos, campeão, vice e terceiro lugar.",
  },
  {
    icon: MailPlus,
    title: "Admin centralizado",
    description: "Convites, fases, resultados oficiais e apuração controlados num só painel.",
  },
];

export default function Home() {
  return (
    <main className="surface-grid relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-6 xl:px-8">
        <header className="flex items-center justify-between rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/90 px-5 py-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
              Bolão da Copa
            </p>
            <p className="text-sm font-semibold">World Cup Pool, sem bagunça</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app">Abrir dashboard</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="space-y-8">
            <Badge variant="accent">privado, responsivo e configurável</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl leading-none font-semibold tracking-tight text-[color:var(--text-strong)] sm:text-6xl">
                O bolão da Copa que funciona para grupo pequeno sem virar planilha.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-muted)]">
                Convites controlados, palpites por fase, ranking automático e um admin simples
                para publicar resultados oficiais mesmo se a API externa falhar.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/app">
                  Ver versão inicial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/convite/convite-pedro-2026">Testar fluxo de convite</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden bg-[linear-gradient(140deg,#0f766e,#134e4a)] text-white">
            <CardContent className="space-y-8 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Painel</p>
                  <h2 className="mt-2 text-3xl font-semibold">Pronto para a rodada</h2>
                </div>
                <div className="rounded-full bg-white/10 p-3">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/8 p-4">
                  <p className="text-sm text-white/70">Próximo fechamento</p>
                  <p className="mt-2 text-2xl font-semibold">18:30</p>
                  <p className="mt-1 text-sm text-white/70">Espanha x Portugal</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/8 p-4">
                  <p className="text-sm text-white/70">Sua posição</p>
                  <p className="mt-2 text-2xl font-semibold">#1</p>
                  <p className="mt-1 text-sm text-white/70">12 pontos totais</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/8 p-4 sm:col-span-2">
                  <p className="text-sm text-white/70">Modo de operação</p>
                  <p className="mt-2 text-base font-semibold">
                    Resultado manual no admin + adapter preparado para API futura.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[color:var(--surface-muted)]">
                  <Icon className="h-5 w-5 text-[color:var(--accent-strong)]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-7 text-[color:var(--text-muted)]">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
