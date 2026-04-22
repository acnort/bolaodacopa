# Bolão da Copa

Aplicação `Next.js` para um bolão privado da Copa do Mundo entre amigos, com:

- site responsivo para desktop e mobile
- auth por convite com primeiro acesso via magic link
- palpites de jogos e pódio final
- ranking geral com desempate por acerto exato e depois resultado correto
- painel admin para convites, regras por fase e resultados oficiais
- fonte manual de resultados no v1, com `ResultsProvider` preparado para `API-Football`

## Stack

- `Next.js 16` + `App Router`
- `TypeScript`
- `Tailwind CSS 4`
- componentes inspirados em `shadcn/ui` com `Radix UI`
- `Supabase` preparado para `Auth` e `Postgres`
- `Vitest` + Testing Library

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Modo demo

Sem variáveis do Supabase configuradas, a aplicação roda em modo demonstrativo com:

- snapshot inicial em memória
- server actions reais
- persistência temporária durante a sessão do servidor
- fluxo de convite e admin já navegável para validar UX e regras

## Rotas principais

- `/` landing pública
- `/entrar` login por magic link ou senha
- `/convite/[token]` aceite de convite
- `/app` dashboard privado
- `/app/palpites` palpites por partida
- `/app/podio` campeão, vice e terceiro
- `/app/ranking` leaderboard geral
- `/app/admin` painel administrativo

## Supabase

O schema inicial está em:

- [supabase/migrations/202604210001_initial.sql](/c:/Documentos/projects/bolaov2/supabase/migrations/202604210001_initial.sql)

Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## API-Football

Validei na documentação oficial em 21 de abril de 2026 que o plano grátis continua com:

- `100 requests/day`
- `10 requests/minute`
- endpoint de `fixtures` para data/league/season
- endpoint de `fixtures?live=LEAGUE_ID` para janela de jogos ao vivo

Fontes:

- https://www.api-football.com/pricing
- https://www.api-football.com/news/post/how-ratelimit-works
- https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide

Variáveis adicionais:

- `API_FOOTBALL_KEY`
- `API_FOOTBALL_BASE_URL`
- `API_FOOTBALL_LEAGUE_ID`
- `API_FOOTBALL_SEASON`
- `API_FOOTBALL_TIMEZONE`
- `INTERNAL_CRON_SECRET`

Endpoint interno de sync:

- `GET /api/providers/api-football/sync?mode=daily&date=YYYY-MM-DD`
- `GET /api/providers/api-football/sync?mode=live-window`

Envie `Authorization: Bearer $INTERNAL_CRON_SECRET` ou `x-cron-secret`.

Agenda recomendada para caber no free tier da Copa:

- `00:05` todos os dias: `mode=daily`
- `30 min` antes do primeiro jogo do dia: `mode=daily`
- durante janela ativa de jogos: `mode=live-window` a cada `10 minutos`

Essa estratégia é suficiente para uma competição única como a Copa e preserva margem dentro do limite diário. A documentação oficial também indica que fixtures futuros podem ser consultados uma vez por dia, enquanto partidas ao vivo exigem polling mais frequente.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Observações

- O contrato `ResultsProvider` suporta provider mock e `API-Football`.
- O fluxo real de `Supabase Auth` está preparado por cliente browser/server, mas o repositório persistente ainda usa store demo neste bootstrap inicial.
- Não há qualquer fluxo financeiro no app.
